//! Typed WASM invokers selected by the generated extension-id table.
//!
//! `RegistryDispatcher` owns routing, manifest checks, and registry lookup.
//! This module owns per-extension typed host→extension bridges until M5
//! moves the boilerplate into codegen for every migrated component.
//!
//! Host↔extension JSON ABI used by these bridges (the `&[u8]` payload and
//! the `Vec<u8>` result on `ExtensionInvokerFn`):
//!   * records are JSON objects with camelCase field names and required
//!     fields matching WIT required fields;
//!   * issue state variants use lowercase WIT case names
//!     (`open`/`closed`/`reopened`); epic, pull-request, and check state
//!     variants use the GraphQL-style `UPPERCASE_SNAKE` spellings the
//!     `*_to_graphql` serializers emit and the frontend consumes (e.g.
//!     `IN_PROGRESS`, `MERGED`, `SUCCESS`). Both the serializers and the
//!     `*_from_json` parsers in this module agree on those spellings;
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
    AssignProjectInput as IssuesAssignProjectInput, CloseIssueInput, Issue, IssueState,
    IssueStateCounts, OpenIssueInput, UpdateIssueInput,
};

mod ext_epics_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_epics/wit",
        world: "ext-epics",
    });
}

use ext_epics_bindings::ExtEpics;
use ext_epics_bindings::exports::comtrya::ext_epics::epics::{
    AssignProjectInput as EpicsAssignProjectInput, ChangeStateEpicInput, CreateEpicInput, Epic,
    EpicProgress, EpicState, UpdateEpicInput,
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
use ext_docs_bindings::exports::comtrya::ext_docs::docs::{
    BddScenario, BddStep, BddSummary, DocCatalog, DocCatalogInput as DocsDocCatalogInput,
    DocChecklistItem, DocChecklistSection, DocChecklistSummary, DocOutlineHeading,
    DocOutlineSummary, DocProperty, DocReadinessBoard, DocReadinessCard, DocReadinessColumn,
    DocReference, DocReferenceSummary, DocStatusBoard, DocStatusCard, DocStatusColumn, DocSummary,
    DocTypeInput as DocsDocTypeInput, DocTypeSummary, SummarizeDocInput as DocsSummarizeDocInput,
};

mod ext_sprints_bindings {
    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_sprints/wit",
        world: "ext-sprints",
    });
}

use ext_sprints_bindings::ExtSprints;
use ext_sprints_bindings::exports::comtrya::ext_sprints::sprints::{
    AssignIssueInput as SprintsAssignIssueInput, ChangeStateInput as SprintsChangeStateInput,
    CreateSprintInput, KanbanBoard, KanbanCard, KanbanCardState, KanbanColumn, KanbanInput,
    ListSprintsInput, MembersInput, Sprint, SprintBoard, SprintBoardColumn, SprintBoardIssue,
    SprintBoardIssueState, SprintState,
};

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
struct AssignProjectInputJson {
    id: String,
    #[serde(default)]
    project_name: Option<String>,
}

/// Input for `update-issue`. All fields except `id` are optional. A missing
/// JSON key and an explicit JSON `null` both deserialise to `None` (serde
/// default behaviour for `Option<T>`). Semantics:
///   - `None` → leave the stored field unchanged
///   - `Some(value)` → overwrite with `value`
///
/// `labels: null` / key absent keeps existing labels; `labels: []` clears them.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateIssueInputJson {
    id: String,
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    body_markdown: Option<String>,
    /// `null` or absent → keep existing labels; `[]` → clear labels.
    #[serde(default)]
    labels: Option<Vec<String>>,
}

/// Input for `update-epic`. Same optional-field semantics as `UpdateIssueInputJson`.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateEpicInputJson {
    id: String,
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    body_markdown: Option<String>,
    #[serde(default)]
    owner_ref: Option<String>,
    #[serde(default)]
    target_date: Option<String>,
    /// `null` or absent → keep existing labels; `[]` → clear labels.
    #[serde(default)]
    labels: Option<Vec<String>>,
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
    #[serde(rename = "commitOID")]
    commit_oid: String,
    name: String,
    state: String,
    conclusion: Option<String>,
    required: bool,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateSprintInputJson {
    workspace: String,
    title: String,
    #[serde(default)]
    goal: Option<String>,
    #[serde(default)]
    start_date: Option<String>,
    #[serde(default)]
    end_date: Option<String>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ListSprintsInputJson {
    workspace: String,
    limit: u32,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChangeStateSprintInputJson {
    id: String,
    state: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct AssignIssueInputJson {
    sprint_ref: String,
    issue_ref: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct MembersInputJson {
    #[serde(rename = "ref")]
    ref_: String,
    limit: u32,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct KanbanInputJson {
    workspace: String,
    #[serde(default)]
    issue_refs: Vec<String>,
    limit: u32,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SummarizeDocInputJson {
    path: String,
    preview: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct DocTypeInputJson {
    project_name: String,
    type_name: String,
    label: String,
    #[serde(default)]
    description: Option<String>,
    slug: String,
    #[serde(default)]
    files: Vec<SummarizeDocInputJson>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct DocCatalogInputJson {
    #[serde(default)]
    types: Vec<DocTypeInputJson>,
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
    // Repository-scoped opt-in gate. Ops that carry the target repo inline
    // (open-issue, list-issues) are gated here from the typed route table,
    // before the resource is touched. Ops keyed by an issue id/number are
    // gated below, once the issue is loaded and its repository is known.
    let gate_store = store.clone();
    gate_route_pre_invoke(
        registry,
        &gate_store,
        registry_route_table(registry, info)?.as_ref(),
        info,
        &input,
    )?;
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
            // Mutation keyed by issue id: load the issue to learn its
            // repository, then gate before mutating.
            let existing = issues
                .call_get_issue(&mut wasm_store, &parsed.id)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("close-issue repo lookup: {e}"),
                    )
                })?
                .map_err(local_error_to_canonical)?;
            if let Some(existing) = existing.as_ref() {
                ensure_repo_enabled(registry, &gate_store, &existing.repository, "ext_issues")?;
            }
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
        "assign-project" => {
            let parsed: AssignProjectInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse assign-project input: {e}"),
                )
            })?;
            // Mutation keyed by issue id: load the issue to learn its
            // repository, then gate before mutating — same shape as
            // close-issue / reopen-issue.
            let existing = issues
                .call_get_issue(&mut wasm_store, &parsed.id)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("assign-project repo lookup: {e}"),
                    )
                })?
                .map_err(local_error_to_canonical)?;
            if let Some(existing) = existing.as_ref() {
                ensure_repo_enabled(registry, &gate_store, &existing.repository, "ext_issues")?;
            }
            let wit_input = IssuesAssignProjectInput {
                id: parsed.id,
                project_name: parsed.project_name,
            };
            let result = issues
                .call_assign_project(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("assign-project call: {e}"),
                    )
                })?;
            issue_to_json(&result.map_err(local_error_to_canonical)?)
        }
        "reopen-issue" => {
            let id = string_payload(&input, "reopen-issue")?;
            // Mutation keyed by issue id: load to learn the repository,
            // then gate before mutating.
            let existing = issues
                .call_get_issue(&mut wasm_store, &id)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("reopen-issue repo lookup: {e}"),
                    )
                })?
                .map_err(local_error_to_canonical)?;
            if let Some(existing) = existing.as_ref() {
                ensure_repo_enabled(registry, &gate_store, &existing.repository, "ext_issues")?;
            }
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
                Some(issue) => {
                    ensure_repo_enabled(registry, &gate_store, &issue.repository, "ext_issues")?;
                    issue_to_json(&issue)
                }
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
                Some(issue) => {
                    ensure_repo_enabled(registry, &gate_store, &issue.repository, "ext_issues")?;
                    issue_to_json(&issue)
                }
                None => Value::Null,
            }
        }
        "by-refs-issue" => {
            // Intentionally NOT per-repo gated. A batch of issue refs can
            // span multiple repositories, so there is no single repo to
            // gate against. Per the Phase-2 opt-in decision, cross-repo
            // batch reads are exempt from the gate; opt-in governs
            // mutations and single-repo reads only.
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
                Some(issue) => {
                    ensure_repo_enabled(registry, &gate_store, &issue.repository, "ext_issues")?;
                    issue_to_json(&issue)
                }
                None => Value::Null,
            }
        }
        "state-counts-for-refs-issue" => {
            // Intentionally NOT per-repo gated: aggregates counts across a
            // batch of refs that can span multiple repositories. See
            // `by-refs-issue` for the Phase-2 opt-in exemption rationale.
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
        "update-issue" => {
            let parsed: UpdateIssueInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse update-issue input: {e}"),
                )
            })?;
            // Mutation keyed by issue id: load the issue to learn its
            // repository, then gate before mutating — same shape as
            // close-issue / reopen-issue / assign-project.
            let existing = issues
                .call_get_issue(&mut wasm_store, &parsed.id)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("update-issue repo lookup: {e}"),
                    )
                })?
                .map_err(local_error_to_canonical)?;
            if let Some(existing) = existing.as_ref() {
                ensure_repo_enabled(registry, &gate_store, &existing.repository, "ext_issues")?;
            }
            let wit_input = UpdateIssueInput {
                id: parsed.id,
                title: parsed.title,
                body_markdown: parsed.body_markdown,
                labels: parsed.labels,
            };
            let result = issues
                .call_update_issue(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("update-issue call: {e}"),
                    )
                })?;
            issue_to_json(&result.map_err(local_error_to_canonical)?)
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
    // NOT per-repo gated: epics are workspace-scoped. An epic resource
    // carries `workspace` but no `repository` (see `epic_to_json`), and
    // create/list ops are keyed by `workspace`. There is no repository to
    // resolve `repository.extensions` against, so the per-repo
    // opt-in gate does not apply to ext_epics ops despite the manifest
    // declaring the `epic` kind repository-scoped. Flagged in the Phase-2
    // report: epics need a workspace-level enablement model, not the
    // per-repo one, to be gated.
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
        "assign-project" => {
            let parsed: AssignProjectInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse assign-project input: {e}"),
                )
            })?;
            let wit_input = EpicsAssignProjectInput {
                id: parsed.id,
                project_name: parsed.project_name,
            };
            // Epics are workspace-scoped, not repository-scoped, so
            // no `ensure_repo_enabled` gate — same shape as
            // change-state-epic above. The `epic` resourceKind has
            // `scope: "instance"`.
            let result = epics
                .call_assign_project(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("assign-project call: {e}"),
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
            // Not per-repo gated: epics are instance-scoped (an epic can
            // span repositories), and this batch read accepts refs across
            // repositories. Opt-in does not apply to instance-scoped
            // extensions.
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
            let ref_uri = string_field(&input, "ref", "issues-in-epic")?;
            let limit = u32_field(&input, "limit", "issues-in-epic")?;
            let result = epics
                .call_issues_in_epic(&mut wasm_store, &ref_uri, limit)
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
            let ref_uri = string_field(&input, "ref", "children-of-epic")?;
            let limit = u32_field(&input, "limit", "children-of-epic")?;
            let result = epics
                .call_children_of_epic(&mut wasm_store, &ref_uri, limit)
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
        "update-epic" => {
            let parsed: UpdateEpicInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse update-epic input: {e}"),
                )
            })?;
            // Epics are workspace-scoped, not repository-scoped, so no
            // `ensure_repo_enabled` gate — same shape as change-state-epic
            // and assign-project above.
            let wit_input = UpdateEpicInput {
                id: parsed.id,
                title: parsed.title,
                body_markdown: parsed.body_markdown,
                owner_ref: parsed.owner_ref,
                target_date: parsed.target_date,
                labels: parsed.labels,
            };
            let result = epics
                .call_update_epic(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("update-epic call: {e}"),
                    )
                })?;
            epic_to_json(&result.map_err(epic_error_to_canonical)?)
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

pub fn dispatch_ext_sprints(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &[u8],
    depth: u32,
    reactor_depth: u32,
) -> Result<Vec<u8>, wit_types::Error> {
    if info.extension_id != "ext_sprints" || info.interface_name != "sprints" {
        return Err(wit_error(
            wit_types::ErrorCode::Internal,
            format!(
                "ext_sprints invoker received wrong route: {}.{}.{}",
                info.extension_id, info.interface_name, info.op_name
            ),
        ));
    }
    let input = parse_payload(payload)?;
    // NOT per-repo gated: sprints are workspace-scoped. No repository to
    // resolve `repository.extensions` against.
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
                format!("instantiate ext_sprints: {e}"),
            )
        })?;
    let ext_sprints = ExtSprints::new(&mut wasm_store, &instance).map_err(|e| {
        wit_error(
            wit_types::ErrorCode::Internal,
            format!("bind ext-sprints world: {e}"),
        )
    })?;
    let sprints = ext_sprints.comtrya_ext_sprints_sprints();

    let value = match info.op_name {
        "create-sprint" => {
            let parsed: CreateSprintInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse create-sprint input: {e}"),
                )
            })?;
            let wit_input = CreateSprintInput {
                workspace: parsed.workspace,
                title: parsed.title,
                goal: parsed.goal,
                start_date: parsed.start_date,
                end_date: parsed.end_date,
            };
            let result = sprints
                .call_create_sprint(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("create-sprint call: {e}"),
                    )
                })?;
            sprint_to_json(&result.map_err(sprints_error_to_canonical)?)
        }
        "get-sprint" => {
            let id = string_payload(&input, "get-sprint")?;
            let result = sprints.call_get_sprint(&mut wasm_store, &id).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::Internal,
                    format!("get-sprint call: {e}"),
                )
            })?;
            match result.map_err(sprints_error_to_canonical)? {
                Some(sprint) => sprint_to_json(&sprint),
                None => Value::Null,
            }
        }
        "list-sprints" => {
            let parsed: ListSprintsInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse list-sprints input: {e}"),
                )
            })?;
            let wit_input = ListSprintsInput {
                workspace: parsed.workspace,
                limit: parsed.limit,
            };
            let result = sprints
                .call_list_sprints(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("list-sprints call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(sprints_error_to_canonical)?
                    .iter()
                    .map(sprint_to_json)
                    .collect(),
            )
        }
        "by-ref-sprint" => {
            let ref_uri = string_payload(&input, "by-ref-sprint")?;
            let result = sprints
                .call_by_ref_sprint(&mut wasm_store, &ref_uri)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("by-ref-sprint call: {e}"),
                    )
                })?;
            match result.map_err(sprints_error_to_canonical)? {
                Some(sprint) => sprint_to_json(&sprint),
                None => Value::Null,
            }
        }
        "change-state-sprint" => {
            let parsed: ChangeStateSprintInputJson =
                serde_json::from_value(input).map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::BadInput,
                        format!("parse change-state-sprint input: {e}"),
                    )
                })?;
            let state = sprint_state_from_json(&parsed.state)?;
            let wit_input = SprintsChangeStateInput {
                id: parsed.id,
                state,
            };
            let result = sprints
                .call_change_state_sprint(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("change-state-sprint call: {e}"),
                    )
                })?;
            sprint_to_json(&result.map_err(sprints_error_to_canonical)?)
        }
        "assign-issue" => {
            let parsed: AssignIssueInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse assign-issue input: {e}"),
                )
            })?;
            let wit_input = SprintsAssignIssueInput {
                sprint_ref: parsed.sprint_ref,
                issue_ref: parsed.issue_ref,
            };
            let result = sprints
                .call_assign_issue(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("assign-issue call: {e}"),
                    )
                })?;
            Value::Bool(result.map_err(sprints_error_to_canonical)?)
        }
        "issues-in-sprint" => {
            let parsed: MembersInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse issues-in-sprint input: {e}"),
                )
            })?;
            let wit_input = MembersInput {
                ref_: parsed.ref_,
                limit: parsed.limit,
            };
            let result = sprints
                .call_issues_in_sprint(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("issues-in-sprint call: {e}"),
                    )
                })?;
            Value::Array(
                result
                    .map_err(sprints_error_to_canonical)?
                    .into_iter()
                    .map(Value::String)
                    .collect(),
            )
        }
        "board-for-sprint" => {
            let parsed: MembersInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse board-for-sprint input: {e}"),
                )
            })?;
            let wit_input = MembersInput {
                ref_: parsed.ref_,
                limit: parsed.limit,
            };
            let result = sprints
                .call_board_for_sprint(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("board-for-sprint call: {e}"),
                    )
                })?;
            sprint_board_to_json(&result.map_err(sprints_error_to_canonical)?)
        }
        "kanban-for-issues" => {
            let parsed: KanbanInputJson = serde_json::from_value(input).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse kanban-for-issues input: {e}"),
                )
            })?;
            let wit_input = KanbanInput {
                workspace: parsed.workspace,
                issue_refs: parsed.issue_refs,
                limit: parsed.limit,
            };
            let result = sprints
                .call_kanban_for_issues(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("kanban-for-issues call: {e}"),
                    )
                })?;
            kanban_board_to_json(&result.map_err(sprints_error_to_canonical)?)
        }
        other => {
            return Err(wit_error(
                wit_types::ErrorCode::NotFound,
                format!("ext_sprints has no op named '{other}'"),
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
    // Repository-scoped opt-in gate. Ops carrying the target repo inline
    // (create-pull, list-pulls) are gated here from the typed route table;
    // ops keyed by a pull id are gated below once the pull is loaded and
    // its repository is known.
    let gate_store = store.clone();
    gate_route_pre_invoke(
        registry,
        &gate_store,
        registry_route_table(registry, info)?.as_ref(),
        info,
        &input,
    )?;
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
            // Mutation keyed by pull id: load to learn the repository,
            // then gate before mutating.
            let existing = pulls
                .call_get_pull(&mut wasm_store, &parsed.id)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("merge-pull repo lookup: {e}"),
                    )
                })?
                .map_err(pulls_error_to_canonical)?;
            if let Some(existing) = existing.as_ref() {
                ensure_repo_enabled(
                    registry,
                    &gate_store,
                    &existing.repository,
                    "ext_pull_requests",
                )?;
            }
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
            // Mutation keyed by pull id: load to learn the repository,
            // then gate before mutating.
            let existing = pulls
                .call_get_pull(&mut wasm_store, &parsed.id)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("close-pull repo lookup: {e}"),
                    )
                })?
                .map_err(pulls_error_to_canonical)?;
            if let Some(existing) = existing.as_ref() {
                ensure_repo_enabled(
                    registry,
                    &gate_store,
                    &existing.repository,
                    "ext_pull_requests",
                )?;
            }
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
                Some(pull) => {
                    ensure_repo_enabled(
                        registry,
                        &gate_store,
                        &pull.repository,
                        "ext_pull_requests",
                    )?;
                    pull_request_to_json(&pull)
                }
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
    // Repository-scoped opt-in gate. Both ext_checks ops carry the target
    // repo inline (record-check, list-checks); the typed route table gates
    // them here before the component runs.
    let gate_store = store.clone();
    gate_route_pre_invoke(
        registry,
        &gate_store,
        registry_route_table(registry, info)?.as_ref(),
        info,
        &input,
    )?;
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

/// Reject the call unless the repository at `repository_ref` has opted
/// into `extension_id` via its `repository.extensions` set.
/// Repository-scoped ops call this before doing any work that depends on
/// the per-repo opt-in. Instance-scoped ops never call it.
///
/// The ref is trimmed before resolution (op inputs may carry surrounding
/// whitespace that the extension trims internally). The gate is **fail
/// closed**: a repository-scoped op that supplies a missing or malformed
/// repository ref is rejected here at the kernel boundary, rather than
/// delegating that to each extension's own input validation.
fn ensure_repo_enabled(
    registry: &WasmRegistry,
    store: &crate::ExtensionRuntimeStore,
    repository_ref: &str,
    extension_id: &str,
) -> Result<(), wit_types::Error> {
    let trimmed = repository_ref.trim();
    if crate::wasm_registry::repository_id_from_ref(trimmed).is_none() {
        return Err(wit_types::Error {
            code: wit_types::ErrorCode::BadInput,
            message: format!(
                "repository-scoped op requires a well-formed repository ref, got {repository_ref:?}"
            ),
            path: Some("repository".to_string()),
        });
    }
    registry.ensure_extension_enabled_for_repo(store, trimmed, extension_id)
}

/// The typed dispatch route table for the extension this op targets.
/// Errors if the extension is not loaded — the same failure the typed
/// invoker would hit instantiating it.
fn registry_route_table(
    registry: &WasmRegistry,
    info: &crate::generated_dispatch::DispatchInfo,
) -> Result<Arc<crate::route_scope::RouteTable>, wit_types::Error> {
    registry
        .get(info.extension_id)
        .map(|ext| ext.route_table.clone())
        .ok_or_else(|| {
            wit_error(
                wit_types::ErrorCode::Internal,
                format!("unknown extension: {}", info.extension_id),
            )
        })
}

/// Generic pre-invoke repository gate, driven by the extension's typed
/// [`RouteTable`] instead of per-`dispatch_ext_*` `if op == "..."` checks
/// with a hardcoded extension id.
///
/// For a route declared `repository`-scoped with a `PayloadField`
/// derivation, this derives the repository from that field on the op
/// payload and applies the per-repo opt-in gate before the component is
/// instantiated. Instance-scoped routes, and ops absent from the table
/// (gated in the post-invoke phase or genuinely ungated), are a no-op.
///
/// The extension id comes from the dispatch route, never a literal — the
/// gate is the same code for every extension.
fn gate_route_pre_invoke(
    registry: &WasmRegistry,
    store: &crate::ExtensionRuntimeStore,
    route_table: &crate::route_scope::RouteTable,
    info: &crate::generated_dispatch::DispatchInfo,
    input: &Value,
) -> Result<(), wit_types::Error> {
    use crate::route_scope::{DispatchScope, RepoDerivation};
    let Some(route) = route_table.get(info.interface_name, info.op_name) else {
        return Ok(());
    };
    match &route.scope {
        DispatchScope::Instance => Ok(()),
        DispatchScope::Repository(RepoDerivation::PayloadField(field)) => {
            let repository = input
                .get(field.as_str())
                .and_then(Value::as_str)
                .ok_or_else(|| {
                    wit_error(
                        wit_types::ErrorCode::BadInput,
                        format!("{} requires payload.{field}", info.op_name),
                    )
                })?;
            ensure_repo_enabled(registry, store, repository, info.extension_id)
        }
    }
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

fn string_field(input: &Value, field: &str, op: &str) -> Result<String, wit_types::Error> {
    input
        .get(field)
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| {
            wit_error(
                wit_types::ErrorCode::BadInput,
                format!("{op} requires payload.{field}"),
            )
        })
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
        "number": epic.number,
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

fn sprint_to_json(sprint: &Sprint) -> Value {
    serde_json::json!({
        "id": sprint.id,
        "workspace": sprint.workspace,
        "workspaceId": workspace_id_from_uri(&sprint.workspace),
        "title": sprint.title,
        "state": sprint_state_to_graphql(sprint.state),
        "number": sprint.number,
        "goal": sprint.goal,
        "startDate": sprint.start_date,
        "endDate": sprint.end_date,
        "createdAt": sprint.created_at,
        "updatedAt": sprint.updated_at,
    })
}

fn sprint_board_to_json(board: &SprintBoard) -> Value {
    serde_json::json!({
        "sprintRef": board.sprint_ref,
        "total": board.total,
        "columns": board
            .columns
            .iter()
            .map(sprint_board_column_to_json)
            .collect::<Vec<_>>(),
    })
}

fn sprint_board_column_to_json(column: &SprintBoardColumn) -> Value {
    serde_json::json!({
        "key": column.key,
        "label": column.label,
        "count": column.count,
        "issues": column
            .issues
            .iter()
            .map(sprint_board_issue_to_json)
            .collect::<Vec<_>>(),
    })
}

fn sprint_board_issue_to_json(issue: &SprintBoardIssue) -> Value {
    serde_json::json!({
        "issueRef": issue.issue_ref,
        "id": issue.id,
        "number": issue.number,
        "title": issue.title,
        "state": sprint_board_issue_state_to_json(issue.state),
    })
}

fn sprint_board_issue_state_to_json(state: SprintBoardIssueState) -> &'static str {
    match state {
        SprintBoardIssueState::Open => "open",
        SprintBoardIssueState::Reopened => "reopened",
        SprintBoardIssueState::Closed => "closed",
        SprintBoardIssueState::Missing => "missing",
    }
}

fn kanban_board_to_json(board: &KanbanBoard) -> Value {
    serde_json::json!({
        "workspace": board.workspace,
        "workspaceId": workspace_id_from_uri(&board.workspace),
        "total": board.total,
        "columns": board
            .columns
            .iter()
            .map(kanban_column_to_json)
            .collect::<Vec<_>>(),
    })
}

fn kanban_column_to_json(column: &KanbanColumn) -> Value {
    serde_json::json!({
        "key": column.key,
        "label": column.label,
        "count": column.count,
        "cards": column
            .cards
            .iter()
            .map(kanban_card_to_json)
            .collect::<Vec<_>>(),
    })
}

fn kanban_card_to_json(card: &KanbanCard) -> Value {
    serde_json::json!({
        "issueRef": card.issue_ref,
        "id": card.id,
        "number": card.number,
        "title": card.title,
        "state": kanban_card_state_to_json(card.state),
    })
}

fn kanban_card_state_to_json(state: KanbanCardState) -> &'static str {
    match state {
        KanbanCardState::Open => "open",
        KanbanCardState::Reopened => "reopened",
        KanbanCardState::Closed => "closed",
        KanbanCardState::Missing => "missing",
    }
}

fn sprint_state_to_graphql(state: SprintState) -> &'static str {
    match state {
        SprintState::Planned => "PLANNED",
        SprintState::Active => "ACTIVE",
        SprintState::Completed => "COMPLETED",
        SprintState::Canceled => "CANCELED",
    }
}

fn sprint_state_from_json(state: &str) -> Result<SprintState, wit_types::Error> {
    match state {
        "PLANNED" => Ok(SprintState::Planned),
        "ACTIVE" => Ok(SprintState::Active),
        "COMPLETED" => Ok(SprintState::Completed),
        "CANCELED" => Ok(SprintState::Canceled),
        other => Err(wit_error(
            wit_types::ErrorCode::BadInput,
            format!("unknown sprint state '{other}'"),
        )),
    }
}

/// Extract the workspace id from a `comtrya://workspace/<id>` URI.
/// Returns `None` for anything that is not a well-formed workspace URI —
/// the previous fallback that guessed an id from a bare `ws_` prefix was
/// a stringly-typed heuristic that accepted malformed input at the parse
/// boundary instead of rejecting it (closes #122 P3 [server/type-boundary]).
fn workspace_id_from_uri(workspace: &str) -> Option<String> {
    workspace
        .strip_prefix("comtrya://workspace/")
        .map(str::to_string)
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
        "headRef": pull.head_ref,
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
        PrState::Review => "REVIEW",
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

fn sprints_error_to_canonical(
    e: ext_sprints_bindings::comtrya::platform::types::Error,
) -> wit_types::Error {
    use ext_sprints_bindings::comtrya::platform::types as local;
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

fn doc_summary_to_json(summary: &DocSummary) -> Value {
    serde_json::json!({
        "path": summary.path,
        "title": summary.title,
        "propertyCount": summary.property_count,
        "properties": summary
            .properties
            .iter()
            .map(doc_property_to_json)
            .collect::<Vec<_>>(),
        "bodyExcerpt": summary.body_excerpt,
        "hasFrontMatter": summary.has_front_matter,
    })
}

fn doc_catalog_input_to_wit(input: DocCatalogInputJson) -> DocsDocCatalogInput {
    DocsDocCatalogInput {
        types: input
            .types
            .into_iter()
            .map(|doc_type| DocsDocTypeInput {
                project_name: doc_type.project_name,
                type_name: doc_type.type_name,
                label: doc_type.label,
                description: doc_type.description,
                slug: doc_type.slug,
                files: doc_type
                    .files
                    .into_iter()
                    .map(|file| DocsSummarizeDocInput {
                        path: file.path,
                        preview: file.preview,
                    })
                    .collect(),
            })
            .collect(),
    }
}

fn doc_catalog_to_json(catalog: &DocCatalog) -> Value {
    serde_json::json!({
        "totalDocs": catalog.total_docs,
        "types": catalog
            .types
            .iter()
            .map(doc_type_summary_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_type_summary_to_json(summary: &DocTypeSummary) -> Value {
    serde_json::json!({
        "projectName": summary.project_name,
        "typeName": summary.type_name,
        "label": summary.label,
        "description": summary.description,
        "slug": summary.slug,
        "docCount": summary.doc_count,
        "docs": summary
            .docs
            .iter()
            .map(doc_summary_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_status_board_to_json(board: &DocStatusBoard) -> Value {
    serde_json::json!({
        "totalDocs": board.total_docs,
        "columns": board
            .columns
            .iter()
            .map(doc_status_column_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_status_column_to_json(column: &DocStatusColumn) -> Value {
    serde_json::json!({
        "key": column.key,
        "label": column.label,
        "count": column.count,
        "docs": column
            .docs
            .iter()
            .map(doc_status_card_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_status_card_to_json(card: &DocStatusCard) -> Value {
    serde_json::json!({
        "projectName": card.project_name,
        "typeName": card.type_name,
        "typeLabel": card.type_label,
        "path": card.path,
        "title": card.title,
        "status": card.status,
        "owner": card.owner,
    })
}

fn bdd_summary_to_json(summary: &BddSummary) -> Value {
    serde_json::json!({
        "path": summary.path,
        "title": summary.title,
        "feature": summary.feature,
        "scenarioCount": summary.scenario_count,
        "stepCount": summary.step_count,
        "scenarios": summary
            .scenarios
            .iter()
            .map(bdd_scenario_to_json)
            .collect::<Vec<_>>(),
    })
}

fn bdd_scenario_to_json(scenario: &BddScenario) -> Value {
    serde_json::json!({
        "kind": scenario.kind,
        "title": scenario.title,
        "stepCount": scenario.step_count,
        "steps": scenario
            .steps
            .iter()
            .map(bdd_step_to_json)
            .collect::<Vec<_>>(),
    })
}

fn bdd_step_to_json(step: &BddStep) -> Value {
    serde_json::json!({
        "keyword": step.keyword,
        "text": step.text,
    })
}

fn doc_checklist_summary_to_json(summary: &DocChecklistSummary) -> Value {
    serde_json::json!({
        "path": summary.path,
        "title": summary.title,
        "totalItems": summary.total_items,
        "checkedItems": summary.checked_items,
        "sections": summary
            .sections
            .iter()
            .map(doc_checklist_section_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_checklist_section_to_json(section: &DocChecklistSection) -> Value {
    serde_json::json!({
        "heading": section.heading,
        "itemCount": section.item_count,
        "checkedCount": section.checked_count,
        "items": section
            .items
            .iter()
            .map(doc_checklist_item_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_checklist_item_to_json(item: &DocChecklistItem) -> Value {
    serde_json::json!({
        "text": item.text,
        "checked": item.checked,
    })
}

fn doc_reference_summary_to_json(summary: &DocReferenceSummary) -> Value {
    serde_json::json!({
        "path": summary.path,
        "title": summary.title,
        "referenceCount": summary.reference_count,
        "references": summary
            .references
            .iter()
            .map(doc_reference_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_reference_to_json(reference: &DocReference) -> Value {
    serde_json::json!({
        "kind": reference.kind,
        "target": reference.target,
        "label": reference.label,
        "line": reference.line,
    })
}

fn doc_outline_summary_to_json(summary: &DocOutlineSummary) -> Value {
    serde_json::json!({
        "path": summary.path,
        "title": summary.title,
        "headingCount": summary.heading_count,
        "headings": summary
            .headings
            .iter()
            .map(doc_outline_heading_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_outline_heading_to_json(heading: &DocOutlineHeading) -> Value {
    serde_json::json!({
        "level": heading.level,
        "title": heading.title,
        "slug": heading.slug,
        "line": heading.line,
    })
}

fn doc_readiness_board_to_json(board: &DocReadinessBoard) -> Value {
    serde_json::json!({
        "totalDocs": board.total_docs,
        "columns": board
            .columns
            .iter()
            .map(doc_readiness_column_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_readiness_column_to_json(column: &DocReadinessColumn) -> Value {
    serde_json::json!({
        "key": column.key,
        "label": column.label,
        "count": column.count,
        "docs": column
            .docs
            .iter()
            .map(doc_readiness_card_to_json)
            .collect::<Vec<_>>(),
    })
}

fn doc_readiness_card_to_json(card: &DocReadinessCard) -> Value {
    serde_json::json!({
        "projectName": card.project_name,
        "typeName": card.type_name,
        "typeLabel": card.type_label,
        "path": card.path,
        "title": card.title,
        "status": card.status,
        "checklistTotal": card.checklist_total,
        "checklistChecked": card.checklist_checked,
        "scenarioCount": card.scenario_count,
        "referenceCount": card.reference_count,
    })
}

fn doc_property_to_json(property: &DocProperty) -> Value {
    serde_json::json!({
        "key": property.key,
        "value": property.value,
    })
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
    payload: &[u8],
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
        "summarize-doc" => {
            let parsed: SummarizeDocInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse summarize-doc input: {e}"),
                )
            })?;
            let wit_input = DocsSummarizeDocInput {
                path: parsed.path,
                preview: parsed.preview,
            };
            let result = docs
                .call_summarize_doc(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("summarize-doc call: {e}"),
                    )
                })?;
            doc_summary_to_json(&result.map_err(docs_error_to_canonical)?)
        }
        "summarize-catalog" => {
            let parsed: DocCatalogInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse summarize-catalog input: {e}"),
                )
            })?;
            let wit_input = doc_catalog_input_to_wit(parsed);
            let result = docs
                .call_summarize_catalog(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("summarize-catalog call: {e}"),
                    )
                })?;
            doc_catalog_to_json(&result.map_err(docs_error_to_canonical)?)
        }
        "status-board" => {
            let parsed: DocCatalogInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse status-board input: {e}"),
                )
            })?;
            let wit_input = doc_catalog_input_to_wit(parsed);
            let result = docs
                .call_status_board(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("status-board call: {e}"),
                    )
                })?;
            doc_status_board_to_json(&result.map_err(docs_error_to_canonical)?)
        }
        "summarize-scenarios" => {
            let parsed: SummarizeDocInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse summarize-scenarios input: {e}"),
                )
            })?;
            let wit_input = DocsSummarizeDocInput {
                path: parsed.path,
                preview: parsed.preview,
            };
            let result = docs
                .call_summarize_scenarios(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("summarize-scenarios call: {e}"),
                    )
                })?;
            bdd_summary_to_json(&result.map_err(docs_error_to_canonical)?)
        }
        "summarize-checklists" => {
            let parsed: SummarizeDocInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse summarize-checklists input: {e}"),
                )
            })?;
            let wit_input = DocsSummarizeDocInput {
                path: parsed.path,
                preview: parsed.preview,
            };
            let result = docs
                .call_summarize_checklists(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("summarize-checklists call: {e}"),
                    )
                })?;
            doc_checklist_summary_to_json(&result.map_err(docs_error_to_canonical)?)
        }
        "summarize-references" => {
            let parsed: SummarizeDocInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse summarize-references input: {e}"),
                )
            })?;
            let wit_input = DocsSummarizeDocInput {
                path: parsed.path,
                preview: parsed.preview,
            };
            let result = docs
                .call_summarize_references(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("summarize-references call: {e}"),
                    )
                })?;
            doc_reference_summary_to_json(&result.map_err(docs_error_to_canonical)?)
        }
        "summarize-outline" => {
            let parsed: SummarizeDocInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse summarize-outline input: {e}"),
                )
            })?;
            let wit_input = DocsSummarizeDocInput {
                path: parsed.path,
                preview: parsed.preview,
            };
            let result = docs
                .call_summarize_outline(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("summarize-outline call: {e}"),
                    )
                })?;
            doc_outline_summary_to_json(&result.map_err(docs_error_to_canonical)?)
        }
        "readiness-board" => {
            let parsed: DocCatalogInputJson = serde_json::from_slice(payload).map_err(|e| {
                wit_error(
                    wit_types::ErrorCode::BadInput,
                    format!("parse readiness-board input: {e}"),
                )
            })?;
            let wit_input = doc_catalog_input_to_wit(parsed);
            let result = docs
                .call_readiness_board(&mut wasm_store, &wit_input)
                .map_err(|e| {
                    wit_error(
                        wit_types::ErrorCode::Internal,
                        format!("readiness-board call: {e}"),
                    )
                })?;
            doc_readiness_board_to_json(&result.map_err(docs_error_to_canonical)?)
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

#[cfg(test)]
mod tests {
    use super::*;

    /// #6 P0-6 regression: REVIEW WIT case maps to "REVIEW" GraphQL
    /// string. Compile-time exhaustive match on PrState catches any
    /// future variant addition that forgets to update the mapping.
    #[test]
    fn pr_state_review_maps_to_uppercase_review() {
        assert_eq!(pull_state_to_graphql(PrState::Review), "REVIEW");
    }

    /// Sanity-check the existing 4 cases still map as before — guards
    /// against a future rename accidentally regressing the wire format.
    #[test]
    fn pr_state_pre_existing_cases_unchanged() {
        assert_eq!(pull_state_to_graphql(PrState::Draft), "DRAFT");
        assert_eq!(pull_state_to_graphql(PrState::Ready), "READY");
        assert_eq!(pull_state_to_graphql(PrState::Merged), "MERGED");
        assert_eq!(pull_state_to_graphql(PrState::Closed), "CLOSED");
    }
}
