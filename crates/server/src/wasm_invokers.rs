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

use crate::wasm_host::{OpsDispatcher, wit_types};
use crate::wasm_registry::{RegistryDispatcher, WasmRegistry, build_host_state};

pub type ExtensionInvokerFn = fn(
    &WasmRegistry,
    Arc<crate::ExtensionRuntimeStore>,
    &str,
    &crate::generated_dispatch::DispatchInfo,
    &[u8],
    u32,
) -> Result<Vec<u8>, wit_types::Error>;

#[allow(warnings)]
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

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenIssueInputJson {
    repository: String,
    title: String,
    body_markdown: String,
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

pub fn dispatch_ext_issues(
    registry: &WasmRegistry,
    store: Arc<crate::ExtensionRuntimeStore>,
    current_principal: &str,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &[u8],
    depth: u32,
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
    let (host_state, ext) = build_host_state(
        registry,
        info.extension_id,
        current_principal,
        store,
        dispatcher,
        depth,
    )
    .map_err(|e| wit_error(wit_types::ErrorCode::Internal, e))?;
    let mut wasm_store = Store::new(registry.engine.as_ref(), host_state);
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
        "state": state_to_str(issue.state),
        "stateReason": issue.state_reason,
        "number": issue.number,
        "authorRef": issue.author_ref,
        "createdAt": issue.created_at,
        "updatedAt": issue.updated_at,
        "closedAt": issue.closed_at,
        "closedByRef": issue.closed_by_ref,
    })
}

fn state_to_str(state: IssueState) -> &'static str {
    match state {
        IssueState::Open => "open",
        IssueState::Closed => "closed",
        IssueState::Reopened => "reopened",
    }
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

fn wit_error(code: wit_types::ErrorCode, message: impl Into<String>) -> wit_types::Error {
    wit_types::Error {
        code,
        message: message.into(),
        path: None,
    }
}
