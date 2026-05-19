//! Typed WASM invokers selected by the generated extension-id table.
//!
//! `RegistryDispatcher` owns routing, manifest checks, and registry lookup.
//! This module owns per-extension typed ABI bridges until M5 moves the
//! boilerplate into codegen for every migrated component.
//!
//! Cross-extension JSON ABI used by these bridges:
//!   * records are JSON objects with camelCase field names and required
//!     fields matching WIT required fields;
//!   * variants are lower-kebab/lowercase strings matching WIT variant
//!     case names, not GraphQL enum spellings;
//!   * single scalar parameters are encoded as the scalar JSON value;
//!   * multi-parameter functions are encoded as an object keyed by the
//!     camelCase WIT parameter names.

use std::sync::Arc;

use serde_json::Value;
use wasmtime::Store;

use crate::wasm_host::{HostState, OpsDispatcher, WASM_PER_INVOCATION_FUEL, wit_types};
use crate::wasm_registry::{RegistryDispatcher, WasmReaction, WasmRegistry, build_host_state};

/// Create a fresh wasm `Store` for a single extension invocation with
/// the per-invocation fuel budget pre-loaded. Every production invoker
/// in this file MUST go through this helper — direct `Store::new`
/// calls would drift past the budget enforcement. Test code that needs
/// a `Store` against a specific extension wasm sets fuel inline (see
/// `wasm_host::m1_ext_issues_smoke`) rather than depending on this
/// private helper.
fn new_invocation_store(
    engine: &wasmtime::Engine,
    host_state: HostState,
) -> Result<Store<HostState>, wit_types::Error> {
    let mut store = Store::new(engine, host_state);
    store.set_fuel(WASM_PER_INVOCATION_FUEL).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("set wasm fuel: {e}"),
        )
    })?;
    Ok(store)
}

pub type ExtensionInvokerFn = fn(
    &WasmRegistry,
    Arc<crate::ExtensionRuntimeStore>,
    &str,
    &crate::generated_dispatch::DispatchInfo,
    &[u8],
    u32,
    u32,
) -> Result<Vec<u8>, wit_types::Error>;

mod ext_issues_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_issues/wit",
        world: "ext-issues",
    });
}

use ext_issues_bindings::ExtIssues;
use ext_issues_bindings::exports::comtrya::ext_issues::issues::{
    CloseIssueInput, Issue, IssueState, IssueStateCounts, OpenIssueInput,
};

mod ext_epics_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_epics/wit",
        world: "ext-epics",
    });
}

use ext_epics_bindings::ExtEpics;
use ext_epics_bindings::exports::comtrya::ext_epics::epics::{
    ChangeStateEpicInput, CreateEpicInput, Epic, EpicProgress, EpicState,
};

mod ext_pull_requests_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_pull_requests/wit",
        world: "ext-pull-requests",
    });
}

use ext_pull_requests_bindings::ExtPullRequests;
use ext_pull_requests_bindings::exports::comtrya::ext_pull_requests::pulls::{
    ClosePullInput, CreatePullInput, MergePullInput, PrState, PullRequest,
};

mod ext_checks_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_checks/wit",
        world: "ext-checks",
    });
}

use ext_checks_bindings::ExtChecks;
use ext_checks_bindings::exports::comtrya::ext_checks::checks::{
    CheckRun, CheckState, RecordCheckInput,
};

mod ext_workspace_home_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_workspace_home/wit",
        world: "ext-workspace-home",
    });
}

use ext_workspace_home_bindings::ExtWorkspaceHome;

mod ext_docs_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_docs/wit",
        world: "ext-docs",
    });
}

use ext_docs_bindings::ExtDocs;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenIssueInputJson {
    repository: String,
    title: String,
    body_markdown: String,
    #[serde(default)]
    project_name: Option<String>,
    #[serde(default)]
    labels: Vec<String>,
    #[serde(default)]
    close_on_merge: Option<bool>,
    /// Typed `comtrya://` URN assignees, pre-filled by the UI from
    /// the Project's CUE `owners[]` (iteration 26 typed-ref family).
    #[serde(default)]
    assignees: Vec<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct CloseIssueInputJson {
    id: String,
    reason: Option<String>,
    closed_by_ref: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ByNumberIssueInputJson {
    workspace_id: String,
    number: u64,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateEpicInputJson {
    workspace: String,
    title: String,
    body_markdown: String,
    owner_ref: Option<String>,
    target_date: Option<String>,
    labels: Vec<String>,
    parent_epic_ref: Option<String>,
    #[serde(default)]
    project_name: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChangeStateEpicInputJson {
    id: String,
    state: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreatePullInputJson {
    repository: String,
    title: String,
    body_markdown: String,
    head_ref: String,
    base_ref: String,
    author_ref: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct MergePullInputJson {
    id: String,
    merged_by_ref: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ClosePullInputJson {
    id: String,
    closed_by_ref: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecordCheckInputJson {
    repository: String,
    #[serde(rename = "commitOID", alias = "commitOid")]
    commit_oid: String,
    name: String,
    state: String,
    conclusion: Option<String>,
    required: bool,
}

pub fn reactor_subscriptions_for_extension(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    extension_id: &str,
) -> Result<Vec<String>, wit_types::Error> {
    match extension_id {
        "ext_pull_requests" => reactor_subscriptions_ext_pull_requests(registry, store),
        _ => Ok(Vec::new()),
    }
}

pub fn reactor_on_event_for_extension(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    extension_id: &str,
    event: &wit_types::Event,
    depth: u32,
) -> Result<Vec<WasmReaction>, wit_types::Error> {
    match extension_id {
        "ext_pull_requests" => reactor_on_event_ext_pull_requests(registry, store, event, depth),
        _ => Ok(Vec::new()),
    }
}

fn reactor_subscriptions_ext_pull_requests(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
) -> Result<Vec<String>, wit_types::Error> {
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (host_state, ext) = build_host_state(
        registry,
        "ext_pull_requests",
        "comtrya://extension/ext_pull_requests",
        store,
        dispatcher,
        0,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_pull_requests reactor: {e}"),
            )
        })?;
    let ext_pull_requests = ExtPullRequests::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-pull-requests world: {e}"),
        )
    })?;
    let reactor = ext_pull_requests.comtrya_platform_reactor();
    let subscriptions = reactor
        .call_subscribed_event_types(&mut wasm_store)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("subscribed-event-types call: {e}"),
            )
        })?;
    subscriptions.map_err(pulls_error_to_canonical)
}

fn reactor_on_event_ext_pull_requests(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    event: &wit_types::Event,
    depth: u32,
) -> Result<Vec<WasmReaction>, wit_types::Error> {
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (mut host_state, ext) = build_host_state(
        registry,
        "ext_pull_requests",
        "comtrya://extension/ext_pull_requests",
        store,
        dispatcher,
        0,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    host_state.reactor_depth = depth + 1;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_pull_requests reactor: {e}"),
            )
        })?;
    let ext_pull_requests = ExtPullRequests::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-pull-requests world: {e}"),
        )
    })?;
    let reactor = ext_pull_requests.comtrya_platform_reactor();
    let reactions = reactor
        .call_on_event(&mut wasm_store, &pull_event_to_local(event))
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("on-event call: {e}"),
            )
        })?;
    reactions
        .map_err(pulls_error_to_canonical)
        .map(pull_reactions_to_canonical)
}

pub fn dispatch_ext_issues(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &[u8],
    depth: u32,
    reactor_depth: u32,
) -> Result<Vec<u8>, wit_types::Error> {
    if info.extension_id != "ext_issues" || info.interface_name != "issues" {
        return Err(wit_error(
            wit_types::ErrorCode::Internal,
            format!(
                "ext_issues invoker received wrong route: {}.{}.{}",
                info.extension_id, info.interface_name, info.op_name
            ),
        ));
    }
    let input = parse_payload(payload)?;
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (mut host_state, ext) = build_host_state(
        registry,
        info.extension_id,
        current_principal,
        store,
        dispatcher,
        depth,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    host_state.reactor_depth = reactor_depth;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_issues: {e}"),
            )
        })?;
    let ext_issues = ExtIssues::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-issues world: {e}"),
        )
    })?;
    let issues = ext_issues.comtrya_ext_issues_issues();

    let value = match info.op_name {
        "open-issue" => {
            let parsed: OpenIssueInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse open-issue input: {e}"),
                )
            })?;
            let wit_input = OpenIssueInput {
                repository: parsed.repository,
                title: parsed.title,
                body_markdown: parsed.body_markdown,
                project_name: parsed.project_name,
                labels: parsed.labels,
                close_on_merge: parsed.close_on_merge,
                assignees: parsed.assignees,
            };
            let result = issues
                .call_open_issue(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("open-issue call: {e}"),
                    )
                })?;
            issue_to_json(&result.map_err(local_error_to_canonical)?)
        }
        "close-issue" => {
            let parsed: CloseIssueInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse close-issue input: {e}"),
                )
            })?;
            let wit_input = CloseIssueInput {
                id: parsed.id,
                reason: parsed.reason,
                closed_by_ref: parsed.closed_by_ref,
            };
            let result = issues
                .call_close_issue(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("close-issue call: {e}"),
                    )
                })?;
            issue_to_json(&result.map_err(local_error_to_canonical)?)
        }
        "reopen-issue" => {
            let id = string_payload(&input, "reopen-issue")?;
            let result = issues
                .call_reopen_issue(&mut wasm_store, &id)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("reopen-issue call: {e}"),
                    )
                })?;
            issue_to_json(&result.map_err(local_error_to_canonical)?)
        }
        "get-issue" => {
            let id = string_payload(&input, "get-issue")?;
            let result = issues.call_get_issue(&mut wasm_store, &id).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::Internal,
                    format!("get-issue call: {e}"),
                )
            })?;
            match result.map_err(local_error_to_canonical)? {
                Some(issue) => issue_to_json(&issue),
                None => Value::Null,
            }
        }
        "list-issues" => {
            let repository = input
                .get("repository")
                .and_then(Value::as_str)
                .ok_or_else(|| {
                    wit_error(
                        wit_types::ErrorCode::BadInput,
                        "list-issues requires payload.repository",
                    )
                })?
                .to_string();
            let limit = u32_field(&input, "limit", "list-issues")?;
            let result = issues
                .call_list_issues(&mut wasm_store, &repository, limit)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("list-issues call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(local_error_to_canonical)?
                    .iter()
                    .map(issue_to_json)
                    .collect(),
            )
        }
        "by-ref-issue" => {
            let ref_uri = string_payload(&input, "by-ref-issue")?;
            let result = issues
                .call_by_ref_issue(&mut wasm_store, &ref_uri)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("by-ref-issue call: {e}"),
                    )
                })?;
            match result.map_err(local_error_to_canonical)? {
                Some(issue) => issue_to_json(&issue),
                None => Value::Null,
            }
        }
        "by-refs-issue" => {
            let refs = string_vec_payload(&input, "by-refs-issue")?;
            let result = issues
                .call_by_refs_issue(&mut wasm_store, &refs)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("by-refs-issue call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(local_error_to_canonical)?
                    .iter()
                    .map(|issue| issue.as_ref().map(issue_to_json).unwrap_or(Value::Null))
                    .collect(),
            )
        }
        "by-number-issue" => {
            let parsed: ByNumberIssueInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse by-number-issue input: {e}"),
                )
            })?;
            let result = issues
                .call_by_number_issue(&mut wasm_store, &parsed.workspace_id, parsed.number)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("by-number-issue call: {e}"),
                    )
                })?;
            match result.map_err(local_error_to_canonical)? {
                Some(issue) => issue_to_json(&issue),
                None => Value::Null,
            }
        }
        "state-counts-for-refs-issue" => {
            let refs = string_vec_payload(&input, "state-counts-for-refs-issue")?;
            let result = issues
                .call_state_counts_for_refs_issue(&mut wasm_store, &refs)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("state-counts-for-refs-issue call: {e}"),
                    )
                })?;
            issue_state_counts_to_json(&result.map_err(local_error_to_canonical)?)
        }
        other => {
            return Err(wit_error(
                wit_types::ErrorCode::NotFound,
                format!("ext_issues has no op named '{other}'"),
            ));
        }
    };
    serde_json::to_vec(&value).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("encode result: {e}"),
        )
    })
}

pub fn dispatch_ext_epics(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &[u8],
    depth: u32,
    reactor_depth: u32,
) -> Result<Vec<u8>, wit_types::Error> {
    if info.extension_id != "ext_epics" || info.interface_name != "epics" {
        return Err(wit_error(
            wit_types::ErrorCode::Internal,
            format!(
                "ext_epics invoker received wrong route: {}.{}.{}",
                info.extension_id, info.interface_name, info.op_name
            ),
        ));
    }
    let input = parse_payload(payload)?;
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (mut host_state, ext) = build_host_state(
        registry,
        info.extension_id,
        current_principal,
        store,
        dispatcher,
        depth,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    host_state.reactor_depth = reactor_depth;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_epics: {e}"),
            )
        })?;
    let ext_epics = ExtEpics::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-epics world: {e}"),
        )
    })?;
    let epics = ext_epics.comtrya_ext_epics_epics();

    let value = match info.op_name {
        "create-epic" => {
            let parsed: CreateEpicInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse create-epic input: {e}"),
                )
            })?;
            let wit_input = CreateEpicInput {
                workspace: parsed.workspace,
                title: parsed.title,
                body_markdown: parsed.body_markdown,
                owner_ref: parsed.owner_ref,
                target_date: parsed.target_date,
                labels: parsed.labels,
                parent_epic_ref: parsed.parent_epic_ref,
                project_name: parsed.project_name,
            };
            let result = epics
                .call_create_epic(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("create-epic call: {e}"),
                    )
                })?;
            epic_to_json(&result.map_err(epic_error_to_canonical)?)
        }
        "change-state-epic" => {
            let parsed: ChangeStateEpicInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse change-state-epic input: {e}"),
                )
            })?;
            let state = epic_state_from_json(&parsed.state)?;
            let wit_input = ChangeStateEpicInput {
                id: parsed.id,
                state,
            };
            let result = epics
                .call_change_state_epic(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("change-state-epic call: {e}"),
                    )
                })?;
            epic_to_json(&result.map_err(epic_error_to_canonical)?)
        }
        "get-epic" => {
            let id = string_payload(&input, "get-epic")?;
            let result = epics.call_get_epic(&mut wasm_store, &id).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::Internal,
                    format!("get-epic call: {e}"),
                )
            })?;
            match result.map_err(epic_error_to_canonical)? {
                Some(epic) => epic_to_json(&epic),
                None => Value::Null,
            }
        }
        "list-epics" => {
            let workspace = input
                .get("workspace")
                .and_then(Value::as_str)
                .ok_or_else(|| {
                    wit_error(
                        wit_types::ErrorCode::BadInput,
                        "list-epics requires payload.workspace",
                    )
                })?
                .to_string();
            let limit = u32_field(&input, "limit", "list-epics")?;
            let result = epics
                .call_list_epics(&mut wasm_store, &workspace, limit)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("list-epics call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(epic_error_to_canonical)?
                    .iter()
                    .map(epic_to_json)
                    .collect(),
            )
        }
        "by-ref-epic" => {
            let ref_uri = string_payload(&input, "by-ref-epic")?;
            let result = epics
                .call_by_ref_epic(&mut wasm_store, &ref_uri)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("by-ref-epic call: {e}"),
                    )
                })?;
            match result.map_err(epic_error_to_canonical)? {
                Some(epic) => epic_to_json(&epic),
                None => Value::Null,
            }
        }
        "by-refs-epic" => {
            let refs = string_vec_payload(&input, "by-refs-epic")?;
            let result = epics
                .call_by_refs_epic(&mut wasm_store, &refs)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("by-refs-epic call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(epic_error_to_canonical)?
                    .iter()
                    .map(|epic| epic.as_ref().map(epic_to_json).unwrap_or(Value::Null))
                    .collect(),
            )
        }
        "progress-epic" => {
            let ref_uri = string_payload(&input, "progress-epic")?;
            let result = epics
                .call_progress_epic(&mut wasm_store, &ref_uri)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("progress-epic call: {e}"),
                    )
                })?;
            epic_progress_to_json(&result.map_err(epic_error_to_canonical)?)
        }
        "issues-in-epic" => {
            let ref_uri = string_payload(&input, "issues-in-epic")?;
            let result = epics
                .call_issues_in_epic(&mut wasm_store, &ref_uri)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("issues-in-epic call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(epic_error_to_canonical)?
                    .into_iter()
                    .map(Value::String)
                    .collect(),
            )
        }
        "children-of-epic" => {
            let ref_uri = string_payload(&input, "children-of-epic")?;
            let result = epics
                .call_children_of_epic(&mut wasm_store, &ref_uri)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("children-of-epic call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(epic_error_to_canonical)?
                    .into_iter()
                    .map(Value::String)
                    .collect(),
            )
        }
        other => {
            return Err(wit_error(
                wit_types::ErrorCode::NotFound,
                format!("ext_epics has no op named '{other}'"),
            ));
        }
    };
    serde_json::to_vec(&value).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("encode result: {e}"),
        )
    })
}

pub fn dispatch_ext_pull_requests(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &[u8],
    depth: u32,
    reactor_depth: u32,
) -> Result<Vec<u8>, wit_types::Error> {
    if info.extension_id != "ext_pull_requests" || info.interface_name != "pulls" {
        return Err(wit_error(
            wit_types::ErrorCode::Internal,
            format!(
                "ext_pull_requests invoker received wrong route: {}.{}.{}",
                info.extension_id, info.interface_name, info.op_name
            ),
        ));
    }
    let input = parse_payload(payload)?;
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (mut host_state, ext) = build_host_state(
        registry,
        info.extension_id,
        current_principal,
        store,
        dispatcher,
        depth,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    host_state.reactor_depth = reactor_depth;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_pull_requests: {e}"),
            )
        })?;
    let ext_pull_requests = ExtPullRequests::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-pull-requests world: {e}"),
        )
    })?;
    let pulls = ext_pull_requests.comtrya_ext_pull_requests_pulls();

    let value = match info.op_name {
        "create-pull" => {
            let parsed: CreatePullInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse create-pull input: {e}"),
                )
            })?;
            let wit_input = CreatePullInput {
                repository: parsed.repository,
                title: parsed.title,
                body_markdown: parsed.body_markdown,
                head_ref: parsed.head_ref,
                base_ref: parsed.base_ref,
                author_ref: parsed.author_ref,
            };
            let result = pulls
                .call_create_pull(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("create-pull call: {e}"),
                    )
                })?;
            pull_request_to_json(&result.map_err(pulls_error_to_canonical)?)
        }
        "merge-pull" => {
            let parsed: MergePullInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse merge-pull input: {e}"),
                )
            })?;
            let wit_input = MergePullInput {
                id: parsed.id,
                merged_by_ref: parsed.merged_by_ref,
            };
            let result = pulls
                .call_merge_pull(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("merge-pull call: {e}"),
                    )
                })?;
            pull_request_to_json(&result.map_err(pulls_error_to_canonical)?)
        }
        "close-pull" => {
            let parsed: ClosePullInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse close-pull input: {e}"),
                )
            })?;
            let wit_input = ClosePullInput {
                id: parsed.id,
                closed_by_ref: parsed.closed_by_ref,
            };
            let result = pulls
                .call_close_pull(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("close-pull call: {e}"),
                    )
                })?;
            pull_request_to_json(&result.map_err(pulls_error_to_canonical)?)
        }
        "get-pull" => {
            let id = string_payload(&input, "get-pull")?;
            let result = pulls.call_get_pull(&mut wasm_store, &id).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::Internal,
                    format!("get-pull call: {e}"),
                )
            })?;
            match result.map_err(pulls_error_to_canonical)? {
                Some(pull) => pull_request_to_json(&pull),
                None => Value::Null,
            }
        }
        "list-pulls" => {
            let repository = input
                .get("repository")
                .and_then(Value::as_str)
                .ok_or_else(|| {
                    wit_error(
                        wit_types::ErrorCode::BadInput,
                        "list-pulls requires payload.repository",
                    )
                })?
                .to_string();
            let limit = u32_field(&input, "limit", "list-pulls")?;
            let result = pulls
                .call_list_pulls(&mut wasm_store, &repository, limit)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("list-pulls call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(pulls_error_to_canonical)?
                    .iter()
                    .map(pull_request_to_json)
                    .collect(),
            )
        }
        other => {
            return Err(wit_error(
                wit_types::ErrorCode::NotFound,
                format!("ext_pull_requests has no op named '{other}'"),
            ));
        }
    };
    serde_json::to_vec(&value).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("encode result: {e}"),
        )
    })
}

pub fn dispatch_ext_checks(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &[u8],
    depth: u32,
    reactor_depth: u32,
) -> Result<Vec<u8>, wit_types::Error> {
    if info.extension_id != "ext_checks" || info.interface_name != "checks" {
        return Err(wit_error(
            wit_types::ErrorCode::Internal,
            format!(
                "ext_checks invoker received wrong route: {}.{}.{}",
                info.extension_id, info.interface_name, info.op_name
            ),
        ));
    }
    let input = parse_payload(payload)?;
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (mut host_state, ext) = build_host_state(
        registry,
        info.extension_id,
        current_principal,
        store,
        dispatcher,
        depth,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    host_state.reactor_depth = reactor_depth;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_checks: {e}"),
            )
        })?;
    let ext_checks = ExtChecks::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-checks world: {e}"),
        )
    })?;
    let checks = ext_checks.comtrya_ext_checks_checks();

    let value = match info.op_name {
        "record-check" => {
            let parsed: RecordCheckInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse record-check input: {e}"),
                )
            })?;
            let wit_input = RecordCheckInput {
                repository: parsed.repository,
                commit_oid: parsed.commit_oid,
                name: parsed.name,
                state: check_state_from_json(&parsed.state)?,
                conclusion: parsed.conclusion,
                required: parsed.required,
            };
            let result = checks
                .call_record_check(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("record-check call: {e}"),
                    )
                })?;
            check_run_to_json(&result.map_err(checks_error_to_canonical)?)
        }
        "list-checks" => {
            let repository = input
                .get("repository")
                .and_then(Value::as_str)
                .ok_or_else(|| {
                    wit_error(
                        wit_types::ErrorCode::BadInput,
                        "list-checks requires payload.repository",
                    )
                })?
                .to_string();
            let limit = u32_field(&input, "limit", "list-checks")?;
            let result = checks
                .call_list_checks(&mut wasm_store, &repository, limit)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("list-checks call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(checks_error_to_canonical)?
                    .iter()
                    .map(check_run_to_json)
                    .collect(),
            )
        }
        other => {
            return Err(wit_error(
                wit_types::ErrorCode::NotFound,
                format!("ext_checks has no op named '{other}'"),
            ));
        }
    };
    serde_json::to_vec(&value).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("encode result: {e}"),
        )
    })
}

pub fn dispatch_ext_workspace_home(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    _payload: &[u8],
    depth: u32,
    reactor_depth: u32,
) -> Result<Vec<u8>, wit_types::Error> {
    if info.extension_id != "ext_workspace_home" || info.interface_name != "home" {
        return Err(wit_error(
            wit_types::ErrorCode::Internal,
            format!(
                "ext_workspace_home invoker received wrong route: {}.{}.{}",
                info.extension_id, info.interface_name, info.op_name
            ),
        ));
    }
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (mut host_state, ext) = build_host_state(
        registry,
        info.extension_id,
        current_principal,
        store,
        dispatcher,
        depth,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    host_state.reactor_depth = reactor_depth;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_workspace_home: {e}"),
            )
        })?;
    let ext_workspace_home = ExtWorkspaceHome::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-workspace-home world: {e}"),
        )
    })?;
    let home = ext_workspace_home.comtrya_ext_workspace_home_home();

    let value = match info.op_name {
        "ping" => {
            let result = home.call_ping(&mut wasm_store).map_err(|e| {
                wit_error(wit_types::ErrorCode::Internal, format!("ping call: {e}"))
            })?;
            Value::String(result.map_err(workspace_home_error_to_canonical)?)
        }
        other => {
            return Err(wit_error(
                wit_types::ErrorCode::NotFound,
                format!("ext_workspace_home has no op named '{other}'"),
            ));
        }
    };
    serde_json::to_vec(&value).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("encode result: {e}"),
        )
    })
}

fn parse_payload(payload: &[u8]) -> Result<Value, wit_types::Error> {
    if payload.is_empty() {
        return Ok(Value::Null);
    }
    serde_json::from_slice(payload).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::BadInput,
            format!("payload must be JSON: {e}"),
        )
    })
}

fn string_payload(input: &Value, op: &str) -> Result<String, wit_types::Error> {
    input.as_str().map(str::to_string).ok_or_else(|| {
        wit_error(
            wit_types::ErrorCode::BadInput,
            format!("{op} requires a JSON string payload"),
        )
    })
}

fn string_vec_payload(input: &Value, op: &str) -> Result<Vec<String>, wit_types::Error> {
    input
        .as_array()
        .ok_or_else(|| {
            wit_error(
                wit_types::ErrorCode::BadInput,
                format!("{op} requires a JSON string array payload"),
            )
        })?
        .iter()
        .map(|value| {
            value.as_str().map(str::to_string).ok_or_else(|| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("{op} payload entries must be strings"),
                )
            })
        })
        .collect()
}

fn u32_field(input: &Value, field: &str, op: &str) -> Result<u32, wit_types::Error> {
    let value = input.get(field).ok_or_else(|| {
        wit_error(
            wit_types::ErrorCode::BadInput,
            format!("{op} requires payload.{field}"),
        )
    })?;
    let raw = value.as_u64().ok_or_else(|| {
        wit_error(
            wit_types::ErrorCode::BadInput,
            format!("{op} payload.{field} must be a u32"),
        )
    })?;
    u32::try_from(raw).map_err(|_| {
        wit_error(
            wit_types::ErrorCode::BadInput,
            format!("{op} payload.{field} must be <= {}", u32::MAX),
        )
    })
}

fn issue_state_counts_to_json(counts: &IssueStateCounts) -> Value {
    serde_json::json!({
        "open": counts.open,
        "closed": counts.closed,
    })
}

fn issue_to_json(issue: &Issue) -> Value {
    serde_json::json!({
        "id": issue.id,
        "repository": issue.repository,
        "title": issue.title,
        "bodyMarkdown": issue.body_markdown,
        "state": issue_state_to_str(issue.state),
        "stateReason": issue.state_reason,
        "number": issue.number,
        "authorRef": issue.author_ref,
        "createdAt": issue.created_at,
        "updatedAt": issue.updated_at,
        "closedAt": issue.closed_at,
        "closedByRef": issue.closed_by_ref,
        "projectName": issue.project_name,
        "labels": issue.labels,
        "closeOnMerge": issue.close_on_merge,
        "assignees": issue.assignees,
    })
}

fn issue_state_to_str(state: IssueState) -> &'static str {
    match state {
        IssueState::Open => "open",
        IssueState::Closed => "closed",
        IssueState::Reopened => "reopened",
    }
}

fn epic_to_json(epic: &Epic) -> Value {
    serde_json::json!({
        "id": epic.id,
        "workspace": epic.workspace,
        "workspaceId": workspace_id_from_uri(&epic.workspace),
        "title": epic.title,
        "bodyMarkdown": epic.body_markdown,
        "state": epic_state_to_graphql(epic.state),
        "targetDate": epic.target_date,
        "ownerRef": epic.owner_ref,
        "labels": epic.labels,
        "createdAt": epic.created_at,
        "updatedAt": epic.updated_at,
        "closedAt": epic.closed_at,
        "projectName": epic.project_name,
    })
}

fn epic_progress_to_json(progress: &EpicProgress) -> Value {
    serde_json::json!({
        "issuesOpen": progress.issues_open,
        "issuesClosed": progress.issues_closed,
        "childEpicsOpen": progress.child_epics_open,
        "childEpicsClosed": progress.child_epics_closed,
        "percentComplete": progress.percent_complete,
    })
}

fn epic_state_to_graphql(state: EpicState) -> &'static str {
    match state {
        EpicState::Planned => "PLANNED",
        EpicState::InProgress => "IN_PROGRESS",
        EpicState::AtRisk => "AT_RISK",
        EpicState::Done => "DONE",
        EpicState::Canceled => "CANCELED",
    }
}

fn epic_state_from_json(state: &str) -> Result<EpicState, wit_types::Error> {
    match state {
        "PLANNED" => Ok(EpicState::Planned),
        "IN_PROGRESS" => Ok(EpicState::InProgress),
        "AT_RISK" => Ok(EpicState::AtRisk),
        "DONE" => Ok(EpicState::Done),
        "CANCELED" => Ok(EpicState::Canceled),
        other => Err(wit_error(
            wit_types::ErrorCode::BadInput,
            format!("unknown epic state '{other}'"),
        )),
    }
}

fn workspace_id_from_uri(workspace: &str) -> Option<String> {
    workspace
        .strip_prefix("comtrya://workspace/")
        .map(str::to_string)
        .or_else(|| {
            if workspace.starts_with("ws_") {
                Some(workspace.to_string())
            } else {
                None
            }
        })
}

fn pull_request_to_json(pull: &PullRequest) -> Value {
    let (workspace_id, repository_id) = pull_repository_scope(&pull.repository);
    serde_json::json!({
        "id": pull.id,
        "repository": pull.repository,
        "workspace": pull.workspace,
        "workspaceId": pull.workspace.as_ref().and_then(|w| workspace_id_from_uri(w)).or(workspace_id),
        "repositoryId": repository_id,
        "number": pull.number,
        "title": pull.title,
        "bodyMarkdown": pull.body_markdown,
        "state": pull_state_to_graphql(pull.state),
        "authorRef": pull.author_ref,
        "head": pull.head_ref,
        "headRef": pull.head_ref,
        "base": pull.base_ref,
        "baseRef": pull.base_ref,
        "createdAt": pull.created_at,
        "updatedAt": pull.updated_at,
        "mergedAt": pull.merged_at,
        "mergedByRef": pull.merged_by_ref,
        "closedAt": pull.closed_at,
        "closedByRef": pull.closed_by_ref,
    })
}

fn pull_state_to_graphql(state: PrState) -> &'static str {
    match state {
        PrState::Draft => "DRAFT",
        PrState::Ready => "READY",
        PrState::Merged => "MERGED",
        PrState::Closed => "CLOSED",
    }
}

fn pull_repository_scope(repository: &str) -> (Option<String>, Option<String>) {
    let Some(rest) = repository.strip_prefix("comtrya://") else {
        return (None, None);
    };
    if let Some(rest) = rest.strip_prefix("workspace/") {
        if let Some((workspace, repository)) = rest.split_once("/repository/") {
            return (Some(workspace.to_string()), Some(repository.to_string()));
        }
        return (Some(rest.to_string()), None);
    }
    if let Some(repository) = rest.strip_prefix("repository/") {
        return (None, Some(repository.to_string()));
    }
    (None, None)
}

fn check_run_to_json(check: &CheckRun) -> Value {
    let (workspace_id, repository_id) = pull_repository_scope(&check.repository);
    serde_json::json!({
        "id": check.id,
        "repository": check.repository,
        "workspaceId": workspace_id,
        "repositoryId": repository_id,
        "commitOID": check.commit_oid,
        "commitOid": check.commit_oid,
        "name": check.name,
        "state": check_state_to_graphql(check.state),
        "conclusion": check.conclusion,
        "required": check.required,
        "createdAt": check.created_at,
        "updatedAt": check.updated_at,
    })
}

fn check_state_to_graphql(state: CheckState) -> &'static str {
    match state {
        CheckState::Pending => "PENDING",
        CheckState::Running => "RUNNING",
        CheckState::Succeeded => "SUCCESS",
        CheckState::Failed => "FAILURE",
        CheckState::Skipped => "SKIPPED",
    }
}

fn check_state_from_json(state: &str) -> Result<CheckState, wit_types::Error> {
    match state {
        "PENDING" => Ok(CheckState::Pending),
        "RUNNING" => Ok(CheckState::Running),
        "SUCCESS" => Ok(CheckState::Succeeded),
        "FAILURE" => Ok(CheckState::Failed),
        "ACTION_REQUIRED" => Ok(CheckState::Failed),
        "SKIPPED" => Ok(CheckState::Skipped),
        other => Err(wit_error(
            wit_types::ErrorCode::BadInput,
            format!("unknown check state '{other}'"),
        )),
    }
}

fn pull_event_to_local(
    event: &wit_types::Event,
) -> ext_pull_requests_bindings::comtrya::platform::types::Event {
    ext_pull_requests_bindings::comtrya::platform::types::Event {
        id: event.id.clone(),
        event_type: event.event_type.clone(),
        payload: event.payload.clone(),
        timestamp_ms: event.timestamp_ms,
        source_uri: event.source_uri.clone(),
        emitter_extension: event.emitter_extension.clone(),
    }
}

fn pull_reactions_to_canonical(
    reactions: Vec<ext_pull_requests_bindings::exports::comtrya::platform::reactor::Reaction>,
) -> Vec<WasmReaction> {
    use ext_pull_requests_bindings::exports::comtrya::platform::reactor::Reaction as PullReaction;
    reactions
        .into_iter()
        .map(|reaction| match reaction {
            PullReaction::InvokeMutation(call) => WasmReaction::InvokeMutation {
                name: call.name,
                payload: call.payload,
            },
            PullReaction::EmitEvent(call) => WasmReaction::EmitEvent {
                event_type: call.event_type,
                payload: call.payload,
            },
        })
        .collect()
}

fn local_error_to_canonical(
    e: ext_issues_bindings::comtrya::platform::types::Error,
) -> wit_types::Error {
    use ext_issues_bindings::comtrya::platform::types as local;
    let code = match e.code {
        local::ErrorCode::NotFound => wit_types::ErrorCode::NotFound,
        local::ErrorCode::Conflict => wit_types::ErrorCode::Conflict,
        local::ErrorCode::Forbidden => wit_types::ErrorCode::Forbidden,
        local::ErrorCode::Unauthenticated => wit_types::ErrorCode::Unauthenticated,
        local::ErrorCode::BadInput => wit_types::ErrorCode::BadInput,
        local::ErrorCode::Internal => wit_types::ErrorCode::Internal,
        local::ErrorCode::Unavailable => wit_types::ErrorCode::Unavailable,
    };
    wit_types::Error {
        code,
        message: e.message,
        path: e.path,
    }
}

fn epic_error_to_canonical(
    e: ext_epics_bindings::comtrya::platform::types::Error,
) -> wit_types::Error {
    use ext_epics_bindings::comtrya::platform::types as local;
    let code = match e.code {
        local::ErrorCode::NotFound => wit_types::ErrorCode::NotFound,
        local::ErrorCode::Conflict => wit_types::ErrorCode::Conflict,
        local::ErrorCode::Forbidden => wit_types::ErrorCode::Forbidden,
        local::ErrorCode::Unauthenticated => wit_types::ErrorCode::Unauthenticated,
        local::ErrorCode::BadInput => wit_types::ErrorCode::BadInput,
        local::ErrorCode::Internal => wit_types::ErrorCode::Internal,
        local::ErrorCode::Unavailable => wit_types::ErrorCode::Unavailable,
    };
    wit_types::Error {
        code,
        message: e.message,
        path: e.path,
    }
}

fn pulls_error_to_canonical(
    e: ext_pull_requests_bindings::comtrya::platform::types::Error,
) -> wit_types::Error {
    use ext_pull_requests_bindings::comtrya::platform::types as local;
    let code = match e.code {
        local::ErrorCode::NotFound => wit_types::ErrorCode::NotFound,
        local::ErrorCode::Conflict => wit_types::ErrorCode::Conflict,
        local::ErrorCode::Forbidden => wit_types::ErrorCode::Forbidden,
        local::ErrorCode::Unauthenticated => wit_types::ErrorCode::Unauthenticated,
        local::ErrorCode::BadInput => wit_types::ErrorCode::BadInput,
        local::ErrorCode::Internal => wit_types::ErrorCode::Internal,
        local::ErrorCode::Unavailable => wit_types::ErrorCode::Unavailable,
    };
    wit_types::Error {
        code,
        message: e.message,
        path: e.path,
    }
}

fn checks_error_to_canonical(
    e: ext_checks_bindings::comtrya::platform::types::Error,
) -> wit_types::Error {
    use ext_checks_bindings::comtrya::platform::types as local;
    let code = match e.code {
        local::ErrorCode::NotFound => wit_types::ErrorCode::NotFound,
        local::ErrorCode::Conflict => wit_types::ErrorCode::Conflict,
        local::ErrorCode::Forbidden => wit_types::ErrorCode::Forbidden,
        local::ErrorCode::Unauthenticated => wit_types::ErrorCode::Unauthenticated,
        local::ErrorCode::BadInput => wit_types::ErrorCode::BadInput,
        local::ErrorCode::Internal => wit_types::ErrorCode::Internal,
        local::ErrorCode::Unavailable => wit_types::ErrorCode::Unavailable,
    };
    wit_types::Error {
        code,
        message: e.message,
        path: e.path,
    }
}

fn workspace_home_error_to_canonical(
    e: ext_workspace_home_bindings::comtrya::platform::types::Error,
) -> wit_types::Error {
    use ext_workspace_home_bindings::comtrya::platform::types as local;
    let code = match e.code {
        local::ErrorCode::NotFound => wit_types::ErrorCode::NotFound,
        local::ErrorCode::Conflict => wit_types::ErrorCode::Conflict,
        local::ErrorCode::Forbidden => wit_types::ErrorCode::Forbidden,
        local::ErrorCode::Unauthenticated => wit_types::ErrorCode::Unauthenticated,
        local::ErrorCode::BadInput => wit_types::ErrorCode::BadInput,
        local::ErrorCode::Internal => wit_types::ErrorCode::Internal,
        local::ErrorCode::Unavailable => wit_types::ErrorCode::Unavailable,
    };
    wit_types::Error {
        code,
        message: e.message,
        path: e.path,
    }
}

fn docs_error_to_canonical(
    e: ext_docs_bindings::comtrya::platform::types::Error,
) -> wit_types::Error {
    use ext_docs_bindings::comtrya::platform::types as local;
    let code = match e.code {
        local::ErrorCode::NotFound => wit_types::ErrorCode::NotFound,
        local::ErrorCode::Conflict => wit_types::ErrorCode::Conflict,
        local::ErrorCode::Forbidden => wit_types::ErrorCode::Forbidden,
        local::ErrorCode::Unauthenticated => wit_types::ErrorCode::Unauthenticated,
        local::ErrorCode::BadInput => wit_types::ErrorCode::BadInput,
        local::ErrorCode::Internal => wit_types::ErrorCode::Internal,
        local::ErrorCode::Unavailable => wit_types::ErrorCode::Unavailable,
    };
    wit_types::Error {
        code,
        message: e.message,
        path: e.path,
    }
}

pub fn dispatch_ext_docs(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    _payload: &[u8],
    depth: u32,
    reactor_depth: u32,
) -> Result<Vec<u8>, wit_types::Error> {
    if info.extension_id != "ext_docs" || info.interface_name != "docs" {
        return Err(wit_error(
            wit_types::ErrorCode::Internal,
            format!(
                "ext_docs invoker received wrong route: {}.{}.{}",
                info.extension_id, info.interface_name, info.op_name
            ),
        ));
    }
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: registry.clone(),
        store: store.clone(),
    });
    let (mut host_state, ext) = build_host_state(
        registry,
        info.extension_id,
        current_principal,
        store,
        dispatcher,
        depth,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    host_state.reactor_depth = reactor_depth;
    let mut wasm_store = new_invocation_store(registry.engine.as_ref(), host_state)?;
    let instance = registry
        .linker
        .instantiate(&mut wasm_store, &ext.component)
        .map_err(|e| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("instantiate ext_docs: {e}"),
            )
        })?;
    let ext_docs = ExtDocs::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-docs world: {e}"),
        )
    })?;
    let docs = ext_docs.comtrya_ext_docs_docs();

    let value = match info.op_name {
        "ping" => {
            let result = docs.call_ping(&mut wasm_store).map_err(|e| {
                wit_error(wit_types::ErrorCode::Internal, format!("ping call: {e}"))
            })?;
            Value::String(result.map_err(docs_error_to_canonical)?)
        }
        other => {
            return Err(wit_error(
                wit_types::ErrorCode::NotFound,
                format!("ext_docs has no op named '{other}'"),
            ));
        }
    };
    serde_json::to_vec(&value).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("encode result: {e}"),
        )
    })
}

fn wit_error(code: wit_types::ErrorCode, message: impl Into<String>) -> wit_types::Error {
    wit_types::Error {
        code,
        message: message.into(),
        path: None,
    }
}
