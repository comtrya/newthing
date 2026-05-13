//! GraphQL-to-WASM cutover gate.
//!
//! The generated dispatch table is consulted before the legacy GraphQL
//! handlers. Hits are translated into the JSON ABI consumed by the typed
//! WASM invoker, routed through the live registry/linker path, then wrapped
//! back into the existing GraphQL response shape.

use axum::Json;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use serde_json::{Map, Value, json};
use std::sync::Arc;

#[cfg(test)]
use crate::wasm_host::HostState;
use crate::wasm_host::{OpsDispatcher, wit_types};
#[cfg(test)]
use crate::wasm_registry::LoadedExtension;
use crate::wasm_registry::RegistryDispatcher;

struct PreparedCall {
    op_route: String,
    payload: Vec<u8>,
    issue_id: Option<String>,
    workspace_id: Option<String>,
    repository_id: Option<String>,
    state_filter: Option<String>,
    labels: Vec<String>,
    assignee_refs: Vec<String>,
    epic_ref: Option<String>,
    author_ref: Option<String>,
}

enum GraphqlBridgeError {
    BadInput(String),
    Unavailable(String),
}

type BridgeResult<T> = Result<T, GraphqlBridgeError>;

impl GraphqlBridgeError {
    fn unavailable(message: impl Into<String>) -> Self {
        Self::Unavailable(message.into())
    }
}

impl From<String> for GraphqlBridgeError {
    fn from(message: String) -> Self {
        Self::BadInput(message)
    }
}

#[cfg(test)]
pub(crate) fn prepare_live_host_state(
    state: &crate::AppState,
    info: &crate::generated_dispatch::DispatchInfo,
    headers: &HeaderMap,
) -> Result<(HostState, Arc<LoadedExtension>), String> {
    let principal = state.runtime.principal_context_from_headers(headers);
    if principal.status == crate::PrincipalStatus::Invalid {
        return Err("invalid bearer token".to_string());
    }
    let store = Arc::new(state.runtime.extension_storage.clone());
    let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
        registry: state.runtime.wasm_registry.clone(),
        store: store.clone(),
    });
    crate::wasm_registry::build_host_state(
        &state.runtime.wasm_registry,
        info.extension_id,
        &principal.uri,
        store,
        dispatcher,
        0,
    )
}

pub fn dispatch(
    state: &crate::AppState,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: Value,
    headers: HeaderMap,
) -> Option<Response> {
    let cors = match crate::graphql_guard(state, &headers) {
        Ok(cors) => cors,
        Err(response) => return Some(response),
    };
    let principal = state.runtime.principal_context_from_headers(&headers);
    if principal.status == crate::PrincipalStatus::Invalid {
        return Some(crate::graphql_error_response(
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            "WASM_DISPATCH_UNAVAILABLE",
            "invalid bearer token",
            cors,
        ));
    }

    let mut call = match prepare_graphql_call(info, &payload) {
        Ok(call) => call,
        Err(GraphqlBridgeError::BadInput(message)) => {
            return Some(crate::graphql_error_response(
                StatusCode::BAD_REQUEST,
                "BAD_USER_INPUT",
                &message,
                cors,
            ));
        }
        Err(GraphqlBridgeError::Unavailable(message)) => {
            return Some(crate::graphql_error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                "WASM_DISPATCH_UNAVAILABLE",
                &message,
                cors,
            ));
        }
    };
    if let Err(message) = normalize_legacy_issue_for_wasm(state, info, &mut call) {
        return Some(crate::graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ));
    }
    let dispatcher = RegistryDispatcher {
        registry: state.runtime.wasm_registry.clone(),
        store: Arc::new(state.runtime.extension_storage.clone()),
    };
    let result = match OpsDispatcher::dispatch(
        &dispatcher,
        info.extension_id,
        &call.op_route,
        &call.payload,
        &principal.uri,
        0,
    ) {
        Ok(bytes) => bytes,
        Err(error) => return Some(wasm_error_response(error, cors)),
    };
    let value = match serde_json::from_slice::<Value>(&result) {
        Ok(value) => value,
        Err(error) => {
            return Some(crate::graphql_error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                &format!("WASM result was not JSON: {error}"),
                cors,
            ));
        }
    };
    if let Err(message) = bridge_legacy_issue_side_effects(state, info, &value, &call) {
        return Some(crate::graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ));
    }
    match graphql_body_for_result(state, info, value, &call) {
        Ok(body) => Some(json_success_response(body, cors)),
        Err(message) => Some(crate::graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        )),
    }
}

fn prepare_graphql_call(
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &Value,
) -> BridgeResult<PreparedCall> {
    if info.extension_id == "ext_epics" && info.interface_name == "epics" {
        return prepare_epics_graphql_call(info, payload);
    }
    if info.extension_id == "ext_pull_requests" && info.interface_name == "pulls" {
        return prepare_pulls_graphql_call(info, payload);
    }
    if info.extension_id == "ext_checks" && info.interface_name == "checks" {
        return prepare_checks_graphql_call(info, payload);
    }
    if info.extension_id != "ext_issues" || info.interface_name != "issues" {
        return Err(GraphqlBridgeError::unavailable(format!(
            "no GraphQL payload bridge for {}.{}.{}",
            info.extension_id, info.interface_name, info.op_name
        )));
    }
    let op_route = format!("{}.{}", info.interface_name, info.op_name);
    match info.op_name {
        "open-issue" => {
            let input = input_object(payload, "issues.create")?;
            let workspace_id = required_string(input, "workspaceId", "issues.create")?;
            let repository_id = optional_string(input, "repositoryId");
            let title = required_string(input, "title", "issues.create")?;
            let body_markdown = optional_string(input, "bodyMarkdown").unwrap_or_default();
            let labels = optional_string_array(input, "labels");
            let epic_ref = optional_string(input, "epicRef");
            let author_ref = optional_string(input, "authorRef");
            let repository = issue_repository_uri(Some(&workspace_id), repository_id.as_deref())?;
            let payload = json!({
                "repository": repository,
                "title": title,
                "bodyMarkdown": body_markdown,
            });
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(payload)?,
                issue_id: None,
                workspace_id: Some(workspace_id),
                repository_id,
                state_filter: None,
                labels,
                assignee_refs: Vec::new(),
                epic_ref,
                author_ref,
            })
        }
        "close-issue" => {
            let input = input_object(payload, "issues.close")?;
            let id = required_string(input, "id", "issues.close")?;
            let mut data = Map::new();
            data.insert("id".to_string(), Value::String(id.clone()));
            if let Some(reason) = optional_string(input, "reason") {
                data.insert("reason".to_string(), Value::String(reason));
            }
            if let Some(closed_by_ref) = optional_string(input, "closedByRef") {
                data.insert("closedByRef".to_string(), Value::String(closed_by_ref));
            }
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::Object(data))?,
                issue_id: Some(id),
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "reopen-issue" => {
            let input = input_object(payload, "issues.reopen")?;
            let id = required_string(input, "id", "issues.reopen")?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::String(id.clone()))?,
                issue_id: Some(id),
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "get-issue" => {
            let id = payload
                .pointer("/variables/id")
                .and_then(Value::as_str)
                .map(str::to_string)
                .or_else(|| {
                    payload
                        .pointer("/variables/input/id")
                        .and_then(Value::as_str)
                        .map(str::to_string)
                })
                .ok_or_else(|| "issues.get requires variables.id".to_string())?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::String(id.clone()))?,
                issue_id: Some(id),
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "list-issues" => {
            let workspace_id = payload
                .pointer("/variables/workspaceId")
                .and_then(Value::as_str)
                .map(str::to_string);
            let repository_id = payload
                .pointer("/variables/repositoryId")
                .and_then(Value::as_str)
                .map(str::to_string);
            let repository =
                issue_list_repository_uri(workspace_id.as_deref(), repository_id.as_deref());
            let limit = payload
                .pointer("/variables/limit")
                .and_then(Value::as_u64)
                .unwrap_or(1024)
                .min(u32::MAX as u64);
            let state_filter = payload
                .pointer("/variables/state")
                .and_then(Value::as_str)
                .map(str::to_string);
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({
                    "repository": repository,
                    "limit": limit,
                }))?,
                issue_id: None,
                workspace_id,
                repository_id,
                state_filter,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "by-ref-issue" => {
            let ref_uri = required_variable_string(payload, "ref", "issues.byRef")?;
            let issue_id = issue_id_from_ref_uri(&ref_uri)?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::String(ref_uri))?,
                issue_id: Some(issue_id),
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "by-refs-issue" => {
            let refs = optional_variable_string_array(payload, "refs");
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::Array(
                    refs.iter().cloned().map(Value::String).collect(),
                ))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "by-number-issue" => {
            let workspace_id = required_variable_string(payload, "workspaceId", "issues.byNumber")?;
            let number = payload
                .pointer("/variables/number")
                .and_then(Value::as_u64)
                .ok_or_else(|| {
                    "issues.byNumber requires variables.workspaceId and .number".to_string()
                })?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({
                    "workspaceId": workspace_id,
                    "number": number,
                }))?,
                issue_id: None,
                workspace_id: Some(workspace_id),
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "state-counts-for-refs-issue" => {
            let refs = optional_variable_string_array(payload, "refs");
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::Array(
                    refs.iter().cloned().map(Value::String).collect(),
                ))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        other => Err(GraphqlBridgeError::unavailable(format!(
            "no GraphQL payload bridge for ext_issues.issues.{other}"
        ))),
    }
}

fn prepare_pulls_graphql_call(
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &Value,
) -> BridgeResult<PreparedCall> {
    let op_route = format!("{}.{}", info.interface_name, info.op_name);
    match info.op_name {
        "create-pull" => {
            let input = input_object(payload, "pulls.create")?;
            let workspace_id = required_string(input, "workspaceId", "pulls.create")?;
            let repository_id = optional_string(input, "repositoryId");
            let title = required_string(input, "title", "pulls.create")?;
            let body_markdown = optional_string(input, "bodyMarkdown").unwrap_or_default();
            let base_ref = optional_string(input, "base").unwrap_or_else(|| "main".to_string());
            let head_ref = required_string(input, "head", "pulls.create")?;
            let author_ref = optional_string(input, "authorRef")
                .or_else(|| Some("comtrya://user/usr_00000000000000000000000000".to_string()));
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({
                    "repository": pull_repository_uri(Some(&workspace_id), repository_id.as_deref()),
                    "title": title,
                    "bodyMarkdown": body_markdown,
                    "baseRef": base_ref,
                    "headRef": head_ref,
                    "authorRef": author_ref,
                }))?,
                issue_id: None,
                workspace_id: Some(workspace_id),
                repository_id,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "merge-pull" => {
            let input = input_object(payload, "pulls.merge")?;
            let id = required_string(input, "id", "pulls.merge")?;
            let merged_by_ref = optional_string(input, "mergedByRef");
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({ "id": id, "mergedByRef": merged_by_ref }))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "close-pull" => {
            let input = input_object(payload, "pulls.close")?;
            let id = required_string(input, "id", "pulls.close")?;
            let closed_by_ref = optional_string(input, "closedByRef");
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({ "id": id, "closedByRef": closed_by_ref }))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "get-pull" => {
            let id = required_variable_string(payload, "id", "pulls.get")?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::String(id))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "list-pulls" => {
            let repository = payload
                .pointer("/variables/repository")
                .and_then(Value::as_str)
                .map(str::to_string)
                .unwrap_or_else(|| {
                    let workspace_id = payload
                        .pointer("/variables/workspaceId")
                        .and_then(Value::as_str);
                    let repository_id = payload
                        .pointer("/variables/repositoryId")
                        .and_then(Value::as_str);
                    pull_repository_uri(workspace_id, repository_id)
                });
            let limit = payload
                .pointer("/variables/limit")
                .and_then(Value::as_u64)
                .unwrap_or(1024)
                .min(u32::MAX as u64);
            let state_filter = payload
                .pointer("/variables/state")
                .and_then(Value::as_str)
                .map(str::to_string);
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({
                    "repository": repository,
                    "limit": limit,
                }))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        other => Err(GraphqlBridgeError::unavailable(format!(
            "no GraphQL payload bridge for ext_pull_requests.pulls.{other}"
        ))),
    }
}

fn prepare_checks_graphql_call(
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &Value,
) -> BridgeResult<PreparedCall> {
    let op_route = format!("{}.{}", info.interface_name, info.op_name);
    match info.op_name {
        "record-check" => {
            let input = input_object(payload, "checks.record")?;
            let workspace_id = optional_string(input, "workspaceId");
            let repository_id = optional_string(input, "repositoryId");
            let repository = optional_string(input, "repository").unwrap_or_else(|| {
                check_record_repository_uri(workspace_id.as_deref(), repository_id.as_deref())
            });
            let commit_oid = optional_string_any(input, &["commitOID", "commitOid"])
                .ok_or_else(|| "checks.record requires variables.input.commitOID".to_string())?;
            let name = required_string(input, "name", "checks.record")?;
            let conclusion = optional_string(input, "conclusion");
            let state = optional_string(input, "state")
                .or_else(|| conclusion.clone())
                .unwrap_or_else(|| "PENDING".to_string());
            let required = input
                .get("required")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({
                    "repository": repository,
                    "commitOID": commit_oid,
                    "name": name,
                    "state": state,
                    "conclusion": conclusion,
                    "required": required,
                }))?,
                issue_id: None,
                workspace_id,
                repository_id,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "list-checks" => {
            let repository = payload
                .pointer("/variables/repository")
                .and_then(Value::as_str)
                .map(str::to_string)
                .unwrap_or_else(|| {
                    let workspace_id = payload
                        .pointer("/variables/workspaceId")
                        .and_then(Value::as_str);
                    let repository_id = payload
                        .pointer("/variables/repositoryId")
                        .and_then(Value::as_str);
                    check_list_repository_uri(workspace_id, repository_id)
                });
            let limit = payload
                .pointer("/variables/limit")
                .and_then(Value::as_u64)
                .unwrap_or(1024)
                .min(u32::MAX as u64);
            let state_filter = payload
                .pointer("/variables/state")
                .or_else(|| payload.pointer("/variables/conclusion"))
                .and_then(Value::as_str)
                .map(str::to_string);
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({
                    "repository": repository,
                    "limit": limit,
                }))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        other => Err(GraphqlBridgeError::unavailable(format!(
            "no GraphQL payload bridge for ext_checks.checks.{other}"
        ))),
    }
}

fn prepare_epics_graphql_call(
    info: &crate::generated_dispatch::DispatchInfo,
    payload: &Value,
) -> BridgeResult<PreparedCall> {
    let op_route = format!("{}.{}", info.interface_name, info.op_name);
    match info.op_name {
        "create-epic" => {
            let input = input_object(payload, "epics.create")?;
            let workspace_id = required_string(input, "workspaceId", "epics.create")?;
            let title = required_string(input, "title", "epics.create")?;
            let body_markdown = optional_string(input, "bodyMarkdown").unwrap_or_default();
            let owner_ref = optional_string(input, "ownerRef");
            let target_date = optional_string(input, "targetDate");
            let labels = optional_string_array(input, "labels");
            let parent_epic_ref = optional_string(input, "parentEpicRef");
            let payload = json!({
                "workspace": workspace_uri(&workspace_id),
                "title": title,
                "bodyMarkdown": body_markdown,
                "ownerRef": owner_ref,
                "targetDate": target_date,
                "labels": labels,
                "parentEpicRef": parent_epic_ref,
            });
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(payload)?,
                issue_id: None,
                workspace_id: Some(workspace_id),
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "change-state-epic" => {
            let input = input_object(payload, "epics.changeState")?;
            let id = required_string(input, "id", "epics.changeState")?;
            let state = required_string(input, "state", "epics.changeState")?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({ "id": id, "state": state }))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "get-epic" => {
            let id = required_variable_string(payload, "id", "epics.get")?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::String(id))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "list-epics" => {
            let workspace_id = required_variable_string(payload, "workspaceId", "epics.list")?;
            let state_filter = payload
                .pointer("/variables/state")
                .and_then(Value::as_str)
                .map(str::to_string);
            let limit = payload
                .pointer("/variables/limit")
                .and_then(Value::as_u64)
                .unwrap_or(1024)
                .min(u32::MAX as u64);
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(json!({
                    "workspace": workspace_uri(&workspace_id),
                    "limit": limit,
                }))?,
                issue_id: None,
                workspace_id: Some(workspace_id),
                repository_id: None,
                state_filter,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        "by-ref-epic" | "progress-epic" | "issues-in-epic" | "children-of-epic" => {
            let op = match info.op_name {
                "by-ref-epic" => "epics.byRef",
                "progress-epic" => "epics.progress",
                "issues-in-epic" => "epics.issuesIn",
                _ => "epics.childrenOf",
            };
            let ref_uri = required_variable_string(payload, "ref", op)?;
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::String(ref_uri.clone()))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: Some(ref_uri),
                author_ref: None,
            })
        }
        "by-refs-epic" => {
            let refs = optional_variable_string_array(payload, "refs");
            Ok(PreparedCall {
                op_route,
                payload: json_bytes(Value::Array(
                    refs.iter().cloned().map(Value::String).collect(),
                ))?,
                issue_id: None,
                workspace_id: None,
                repository_id: None,
                state_filter: None,
                labels: Vec::new(),
                assignee_refs: Vec::new(),
                epic_ref: None,
                author_ref: None,
            })
        }
        other => Err(GraphqlBridgeError::unavailable(format!(
            "no GraphQL payload bridge for ext_epics.epics.{other}"
        ))),
    }
}

fn normalize_legacy_issue_for_wasm(
    state: &crate::AppState,
    info: &crate::generated_dispatch::DispatchInfo,
    call: &mut PreparedCall,
) -> Result<(), String> {
    if info.op_name == "list-issues" {
        return normalize_legacy_issues_for_list(state, call);
    }
    if !matches!(
        info.op_name,
        "close-issue" | "reopen-issue" | "get-issue" | "by-ref-issue"
    ) {
        return Ok(());
    }
    let Some(id) = call.issue_id.as_deref() else {
        return Ok(());
    };
    let Some(existing) = legacy_issue_by_id(state, id)? else {
        return Ok(());
    };
    if call.labels.is_empty() {
        call.labels = string_array_field(&existing, "labels");
    }
    if call.assignee_refs.is_empty() {
        call.assignee_refs = string_array_field(&existing, "assigneeRefs");
    }
    if call.author_ref.is_none() {
        call.author_ref = existing
            .get("authorRef")
            .and_then(Value::as_str)
            .map(str::to_string);
    }
    if existing.get("repository").and_then(Value::as_str).is_some() {
        return Ok(());
    }
    let workspace_id = existing
        .get("workspaceId")
        .and_then(Value::as_str)
        .map(str::to_string);
    let repository_id = existing
        .get("repositoryId")
        .and_then(Value::as_str)
        .map(str::to_string);
    let repository = issue_repository_uri(workspace_id.as_deref(), repository_id.as_deref())
        .map_err(|error| format!("cannot normalize legacy issue {id}: {error:?}"))?;
    state
        .runtime
        .extension_storage
        .update_document_atomically("issues", id, move |data| {
            if let Some(obj) = data.as_object_mut() {
                obj.insert("repository".to_string(), Value::String(repository));
            }
        })
}

fn bridge_legacy_issue_side_effects(
    state: &crate::AppState,
    info: &crate::generated_dispatch::DispatchInfo,
    value: &Value,
    call: &PreparedCall,
) -> Result<(), String> {
    match info.op_name {
        "open-issue" | "close-issue" | "reopen-issue" => {
            augment_legacy_issue_document(state, value, call)?;
            if info.op_name == "open-issue" {
                link_issue_to_epic_if_requested(state, value, call)?;
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

fn augment_legacy_issue_document(
    state: &crate::AppState,
    issue: &Value,
    call: &PreparedCall,
) -> Result<(), String> {
    let id = issue
        .get("id")
        .and_then(Value::as_str)
        .ok_or_else(|| "WASM issue result missing id".to_string())?
        .to_string();
    let repository = issue
        .get("repository")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let (repo_workspace_id, repo_repository_id) = parse_issue_repository_uri(repository);
    let workspace_id = call.workspace_id.clone().or(repo_workspace_id);
    let repository_id = call.repository_id.clone().or(repo_repository_id);
    let labels = call.labels.clone();
    let assignee_refs = call.assignee_refs.clone();
    let author_ref = call.author_ref.clone();

    state
        .runtime
        .extension_storage
        .update_document_atomically("issues", &id, move |data| {
            if let Some(obj) = data.as_object_mut() {
                if let Some(workspace_id) = workspace_id {
                    obj.insert("workspaceId".to_string(), Value::String(workspace_id));
                }
                obj.insert(
                    "repositoryId".to_string(),
                    repository_id.map(Value::String).unwrap_or(Value::Null),
                );
                obj.entry("assigneeRefs".to_string())
                    .or_insert_with(|| Value::Array(Vec::new()));
                if !labels.is_empty() || !obj.contains_key("labels") {
                    obj.insert(
                        "labels".to_string(),
                        Value::Array(labels.into_iter().map(Value::String).collect()),
                    );
                }
                if !assignee_refs.is_empty() || !obj.contains_key("assigneeRefs") {
                    obj.insert(
                        "assigneeRefs".to_string(),
                        Value::Array(assignee_refs.into_iter().map(Value::String).collect()),
                    );
                }
                if let Some(author_ref) = author_ref {
                    obj.insert("authorRef".to_string(), Value::String(author_ref));
                }
            }
        })
}

fn normalize_legacy_issues_for_list(
    state: &crate::AppState,
    call: &PreparedCall,
) -> Result<(), String> {
    let issues = state.runtime.extension_storage.collection_data("issues")?;
    let Some(items) = issues.as_array() else {
        return Ok(());
    };
    for issue in items {
        if issue.get("repository").and_then(Value::as_str).is_some() {
            continue;
        }
        if let Some(workspace_id) = &call.workspace_id {
            if issue.get("workspaceId").and_then(Value::as_str) != Some(workspace_id.as_str()) {
                continue;
            }
        }
        if let Some(repository_id) = &call.repository_id {
            if issue.get("repositoryId").and_then(Value::as_str) != Some(repository_id.as_str()) {
                continue;
            }
        }
        let Some(id) = issue.get("id").and_then(Value::as_str).map(str::to_string) else {
            continue;
        };
        let workspace_id = issue
            .get("workspaceId")
            .and_then(Value::as_str)
            .map(str::to_string);
        let repository_id = issue
            .get("repositoryId")
            .and_then(Value::as_str)
            .map(str::to_string);
        let repository = issue_repository_uri(workspace_id.as_deref(), repository_id.as_deref())
            .map_err(|error| format!("cannot normalize legacy issue {id}: {error:?}"))?;
        state
            .runtime
            .extension_storage
            .update_document_atomically("issues", &id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("repository".to_string(), Value::String(repository));
                }
            })?;
    }
    Ok(())
}

fn link_issue_to_epic_if_requested(
    state: &crate::AppState,
    issue: &Value,
    call: &PreparedCall,
) -> Result<(), String> {
    let Some(epic_ref) = call.epic_ref.as_deref() else {
        return Ok(());
    };
    let id = issue
        .get("id")
        .and_then(Value::as_str)
        .ok_or_else(|| "WASM issue result missing id".to_string())?;
    let issue_ref = format!("comtrya://issue/{id}");
    state
        .runtime
        .create_relation(&issue_ref, epic_ref, "comtrya://rel/part-of", None)?;
    Ok(())
}

fn graphql_body_for_result(
    state: &crate::AppState,
    info: &crate::generated_dispatch::DispatchInfo,
    value: Value,
    call: &PreparedCall,
) -> Result<Value, String> {
    if info.extension_id == "ext_epics" && info.interface_name == "epics" {
        return graphql_epics_body_for_result(info, value, call);
    }
    if info.extension_id == "ext_pull_requests" && info.interface_name == "pulls" {
        return graphql_pulls_body_for_result(info, value, call);
    }
    if info.extension_id == "ext_checks" && info.interface_name == "checks" {
        return graphql_checks_body_for_result(info, value, call);
    }
    match info.op_name {
        "open-issue" => Ok(json!({
            "data": { "issues": { "create": response_issue_value(state, value, call)? } }
        })),
        "close-issue" => Ok(json!({
            "data": { "issues": { "close": response_issue_value(state, value, call)? } }
        })),
        "reopen-issue" => Ok(json!({
            "data": { "issues": { "reopen": response_issue_value(state, value, call)? } }
        })),
        "get-issue" => {
            let issue = if value.is_null() {
                Value::Null
            } else {
                response_issue_value(state, value, call)?
            };
            Ok(json!({ "data": { "issues": { "get": issue } } }))
        }
        "list-issues" => {
            let mut issues: Vec<Value> = value
                .as_array()
                .ok_or_else(|| "list-issues returned non-array JSON".to_string())?
                .iter()
                .cloned()
                .map(|issue| response_issue_value(state, issue, call))
                .collect::<Result<Vec<_>, _>>()?
                .into_iter()
                .filter(|issue| {
                    let Some(filter) = &call.state_filter else {
                        return true;
                    };
                    issue
                        .get("state")
                        .and_then(Value::as_str)
                        .map(|state| state == filter)
                        .unwrap_or(false)
                })
                .collect();
            issues.sort_by(|a, b| {
                b.get("number")
                    .and_then(Value::as_u64)
                    .unwrap_or(0)
                    .cmp(&a.get("number").and_then(Value::as_u64).unwrap_or(0))
            });
            Ok(json!({ "data": { "issues": { "list": issues } } }))
        }
        "by-ref-issue" => {
            let issue = if value.is_null() {
                Value::Null
            } else {
                response_issue_value(state, value, call)?
            };
            Ok(json!({ "data": { "issues": { "byRef": issue } } }))
        }
        "by-refs-issue" => {
            let issues = value
                .as_array()
                .ok_or_else(|| "by-refs-issue returned non-array JSON".to_string())?
                .iter()
                .cloned()
                .map(|issue| {
                    if issue.is_null() {
                        Ok(Value::Null)
                    } else {
                        response_issue_value(state, issue, call)
                    }
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(json!({ "data": { "issues": { "byRefs": issues } } }))
        }
        "by-number-issue" => {
            let issue = if value.is_null() {
                Value::Null
            } else {
                response_issue_value(state, value, call)?
            };
            Ok(json!({ "data": { "issues": { "byNumber": issue } } }))
        }
        "state-counts-for-refs-issue" => {
            Ok(json!({ "data": { "issues": { "stateCountsForRefs": value } } }))
        }
        other => Err(format!(
            "no GraphQL result bridge for ext_issues.issues.{other}"
        )),
    }
}

fn graphql_checks_body_for_result(
    info: &crate::generated_dispatch::DispatchInfo,
    value: Value,
    call: &PreparedCall,
) -> Result<Value, String> {
    match info.op_name {
        "record-check" => Ok(json!({ "data": { "checks": { "record": value } } })),
        "list-checks" => {
            let filter = call
                .state_filter
                .as_ref()
                .map(|state| state.to_ascii_uppercase());
            let mut checks: Vec<Value> = value
                .as_array()
                .ok_or_else(|| "list-checks returned non-array JSON".to_string())?
                .iter()
                .filter(|check| {
                    let Some(filter) = &filter else {
                        return true;
                    };
                    let state_matches = check
                        .get("state")
                        .and_then(Value::as_str)
                        .map(|state| state.to_ascii_uppercase() == *filter)
                        .unwrap_or(false);
                    let conclusion_matches = check
                        .get("conclusion")
                        .and_then(Value::as_str)
                        .map(|conclusion| conclusion.to_ascii_uppercase() == *filter)
                        .unwrap_or(false);
                    state_matches || conclusion_matches
                })
                .cloned()
                .collect();
            checks.sort_by(|a, b| {
                a.get("name")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .cmp(b.get("name").and_then(Value::as_str).unwrap_or(""))
            });
            Ok(json!({ "data": { "checks": { "list": checks } } }))
        }
        other => Err(format!(
            "no GraphQL result bridge for ext_checks.checks.{other}"
        )),
    }
}

fn graphql_pulls_body_for_result(
    info: &crate::generated_dispatch::DispatchInfo,
    value: Value,
    call: &PreparedCall,
) -> Result<Value, String> {
    match info.op_name {
        "create-pull" => Ok(json!({ "data": { "pulls": { "create": value } } })),
        "merge-pull" => Ok(json!({ "data": { "pulls": { "merge": value } } })),
        "close-pull" => Ok(json!({ "data": { "pulls": { "close": value } } })),
        "get-pull" => Ok(json!({ "data": { "pulls": { "get": value } } })),
        "list-pulls" => {
            let mut pulls: Vec<Value> = value
                .as_array()
                .ok_or_else(|| "list-pulls returned non-array JSON".to_string())?
                .iter()
                .filter(|pull| {
                    let Some(filter) = &call.state_filter else {
                        return true;
                    };
                    pull.get("state")
                        .and_then(Value::as_str)
                        .map(|state| state == filter)
                        .unwrap_or(false)
                })
                .cloned()
                .collect();
            pulls.sort_by(|a, b| {
                b.get("number")
                    .and_then(Value::as_u64)
                    .unwrap_or(0)
                    .cmp(&a.get("number").and_then(Value::as_u64).unwrap_or(0))
            });
            Ok(json!({ "data": { "pulls": { "list": pulls } } }))
        }
        other => Err(format!(
            "no GraphQL result bridge for ext_pull_requests.pulls.{other}"
        )),
    }
}

fn graphql_epics_body_for_result(
    info: &crate::generated_dispatch::DispatchInfo,
    value: Value,
    call: &PreparedCall,
) -> Result<Value, String> {
    match info.op_name {
        "create-epic" => Ok(json!({ "data": { "epics": { "create": value } } })),
        "change-state-epic" => Ok(json!({ "data": { "epics": { "changeState": value } } })),
        "get-epic" => Ok(json!({ "data": { "epics": { "get": value } } })),
        "list-epics" => {
            let mut epics: Vec<Value> = value
                .as_array()
                .ok_or_else(|| "list-epics returned non-array JSON".to_string())?
                .iter()
                .filter(|epic| {
                    let Some(filter) = &call.state_filter else {
                        return true;
                    };
                    epic.get("state")
                        .and_then(Value::as_str)
                        .map(|state| state == filter)
                        .unwrap_or(false)
                })
                .cloned()
                .collect();
            epics.sort_by(|a, b| {
                b.get("updatedAt")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .cmp(a.get("updatedAt").and_then(Value::as_str).unwrap_or(""))
            });
            Ok(json!({ "data": { "epics": { "list": epics } } }))
        }
        "by-ref-epic" => Ok(json!({ "data": { "epics": { "byRef": value } } })),
        "by-refs-epic" => Ok(json!({ "data": { "epics": { "byRefs": value } } })),
        "progress-epic" => Ok(json!({ "data": { "epics": { "progress": value } } })),
        "issues-in-epic" => Ok(json!({ "data": { "epics": { "issuesIn": value } } })),
        "children-of-epic" => Ok(json!({ "data": { "epics": { "childrenOf": value } } })),
        other => Err(format!(
            "no GraphQL result bridge for ext_epics.epics.{other}"
        )),
    }
}

fn response_issue_value(
    state: &crate::AppState,
    issue: Value,
    call: &PreparedCall,
) -> Result<Value, String> {
    let Some(id) = issue.get("id").and_then(Value::as_str) else {
        return Ok(graphql_issue(issue, call));
    };
    if let Some(stored) = legacy_issue_by_id(state, id)? {
        Ok(graphql_issue(stored, call))
    } else {
        Ok(graphql_issue(issue, call))
    }
}

fn legacy_issue_by_id(state: &crate::AppState, id: &str) -> Result<Option<Value>, String> {
    let issues = state.runtime.extension_storage.collection_data("issues")?;
    Ok(issues.as_array().and_then(|items| {
        items
            .iter()
            .find(|issue| issue.get("id").and_then(Value::as_str) == Some(id))
            .cloned()
    }))
}

fn graphql_issue(issue: Value, call: &PreparedCall) -> Value {
    let repository = issue
        .get("repository")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let (repo_workspace_id, repo_repository_id) = parse_issue_repository_uri(repository);
    let workspace_id = issue
        .get("workspaceId")
        .and_then(Value::as_str)
        .map(str::to_string)
        .or_else(|| call.workspace_id.clone())
        .or(repo_workspace_id);
    let repository_id = issue
        .get("repositoryId")
        .and_then(Value::as_str)
        .map(str::to_string)
        .or_else(|| call.repository_id.clone())
        .or(repo_repository_id);
    let labels = if !call.labels.is_empty() {
        Value::Array(call.labels.iter().cloned().map(Value::String).collect())
    } else {
        issue
            .get("labels")
            .cloned()
            .unwrap_or_else(|| Value::Array(Vec::new()))
    };
    let assignee_refs = if !call.assignee_refs.is_empty() {
        Value::Array(
            call.assignee_refs
                .iter()
                .cloned()
                .map(Value::String)
                .collect(),
        )
    } else {
        issue
            .get("assigneeRefs")
            .cloned()
            .unwrap_or_else(|| Value::Array(Vec::new()))
    };
    let author_ref = call
        .author_ref
        .clone()
        .map(Value::String)
        .or_else(|| issue.get("authorRef").cloned())
        .unwrap_or(Value::Null);
    json!({
        "id": issue.get("id").cloned().unwrap_or(Value::Null),
        "workspaceId": optional_json_string(workspace_id),
        "repositoryId": optional_json_string(repository_id),
        "repository": issue.get("repository").cloned().unwrap_or(Value::Null),
        "number": issue.get("number").cloned().unwrap_or(Value::Null),
        "title": issue.get("title").cloned().unwrap_or(Value::Null),
        "bodyMarkdown": issue.get("bodyMarkdown").cloned().unwrap_or(Value::Null),
        "state": issue
            .get("state")
            .and_then(Value::as_str)
            .map(|state| Value::String(state.to_ascii_uppercase()))
            .unwrap_or(Value::Null),
        "stateReason": issue.get("stateReason").cloned().unwrap_or(Value::Null),
        "authorRef": author_ref,
        "assigneeRefs": assignee_refs,
        "labels": labels,
        "createdAt": issue.get("createdAt").cloned().unwrap_or(Value::Null),
        "updatedAt": issue.get("updatedAt").cloned().unwrap_or(Value::Null),
        "closedAt": issue.get("closedAt").cloned().unwrap_or(Value::Null),
        "closedByRef": issue.get("closedByRef").cloned().unwrap_or(Value::Null),
    })
}

fn input_object<'a>(payload: &'a Value, op: &str) -> Result<&'a Map<String, Value>, String> {
    payload
        .pointer("/variables/input")
        .and_then(Value::as_object)
        .ok_or_else(|| format!("{op} requires variables.input"))
}

fn required_string(input: &Map<String, Value>, field: &str, op: &str) -> Result<String, String> {
    optional_string(input, field)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("{op} requires variables.input.{field}"))
}

fn optional_string(input: &Map<String, Value>, field: &str) -> Option<String> {
    input
        .get(field)
        .and_then(Value::as_str)
        .map(str::to_string)
        .filter(|value| !value.is_empty())
}

fn optional_string_any(input: &Map<String, Value>, fields: &[&str]) -> Option<String> {
    fields
        .iter()
        .find_map(|field| optional_string(input, field))
}

fn optional_string_array(input: &Map<String, Value>, field: &str) -> Vec<String> {
    input
        .get(field)
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn required_variable_string(payload: &Value, field: &str, op: &str) -> Result<String, String> {
    payload
        .pointer(&format!("/variables/{field}"))
        .and_then(Value::as_str)
        .map(str::to_string)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("{op} requires variables.{field}"))
}

fn optional_variable_string_array(payload: &Value, field: &str) -> Vec<String> {
    payload
        .pointer(&format!("/variables/{field}"))
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn string_array_field(value: &Value, field: &str) -> Vec<String> {
    value
        .get(field)
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn issue_id_from_ref_uri(ref_uri: &str) -> Result<String, String> {
    let rest = ref_uri
        .trim()
        .strip_prefix("comtrya://")
        .ok_or_else(|| "resource reference must use comtrya://".to_string())?;
    let Some((kind, id)) = rest.split_once('/') else {
        return Err("issues.byRef requires an id in the URI".to_string());
    };
    if !valid_resource_kind(kind) {
        return Err("resource reference has unknown kind".to_string());
    }
    if id.trim().is_empty() {
        return Err("issues.byRef requires an id in the URI".to_string());
    }
    let prefix_len = validate_opaque_id(id)?;
    validate_resource_kind_matches_id(kind, id, prefix_len)?;
    Ok(id.to_string())
}

fn valid_resource_kind(kind: &str) -> bool {
    !kind.is_empty()
        && kind.bytes().all(|byte| {
            byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-' || byte == b'_'
        })
}

fn validate_opaque_id(id: &str) -> Result<usize, String> {
    let prefix_len =
        opaque_id_prefix_len(id).ok_or_else(|| "opaque ID has an unknown prefix".to_string())?;
    let body = &id[prefix_len..];
    if body.len() != 26 {
        return Err("opaque ID body must be 26 Crockford-base32 characters".to_string());
    }
    if !body.bytes().all(is_crockford_base32) {
        return Err("opaque ID body contains non-Crockford-base32 characters".to_string());
    }
    Ok(prefix_len)
}

fn validate_resource_kind_matches_id(
    kind: &str,
    id: &str,
    prefix_len: usize,
) -> Result<(), String> {
    let Some(kind_from_prefix) = core_kind_for_prefix(&id[..prefix_len]) else {
        return Ok(());
    };
    if is_core_kind(kind) && kind != kind_from_prefix {
        return Err(format!(
            "resource kind {kind} does not match ID prefix kind {kind_from_prefix}"
        ));
    }
    Ok(())
}

fn opaque_id_prefix_len(id: &str) -> Option<usize> {
    const CORE_PREFIXES: &[&str] = &[
        "repo_", "ws_", "ext_", "proj_", "rel_", "cmt_", "grp_", "team_", "sec_", "chk_", "evt_",
        "usr_", "job_",
    ];
    if let Some(prefix) = CORE_PREFIXES.iter().find(|prefix| id.starts_with(**prefix)) {
        return Some(prefix.len());
    }
    let underscore = id.find('_')?;
    if !(2..=8).contains(&underscore) {
        return None;
    }
    if !id[..underscore]
        .bytes()
        .all(|byte| byte.is_ascii_lowercase())
    {
        return None;
    }
    Some(underscore + 1)
}

fn is_core_kind(kind: &str) -> bool {
    matches!(
        kind,
        "user"
            | "team"
            | "workspace"
            | "group"
            | "repository"
            | "project"
            | "extension"
            | "check"
            | "job"
            | "event"
            | "secret"
            | "relation"
            | "comment"
    )
}

fn core_kind_for_prefix(prefix: &str) -> Option<&'static str> {
    Some(match prefix {
        "usr_" => "user",
        "team_" => "team",
        "ws_" => "workspace",
        "grp_" => "group",
        "repo_" => "repository",
        "proj_" => "project",
        "ext_" => "extension",
        "chk_" => "check",
        "job_" => "job",
        "evt_" => "event",
        "sec_" => "secret",
        "rel_" => "relation",
        "cmt_" => "comment",
        _ => return None,
    })
}

fn is_crockford_base32(byte: u8) -> bool {
    matches!(
        byte,
        b'0'..=b'9'
            | b'A'
            | b'B'
            | b'C'
            | b'D'
            | b'E'
            | b'F'
            | b'G'
            | b'H'
            | b'J'
            | b'K'
            | b'M'
            | b'N'
            | b'P'
            | b'Q'
            | b'R'
            | b'S'
            | b'T'
            | b'V'
            | b'W'
            | b'X'
            | b'Y'
            | b'Z'
    )
}

fn issue_repository_uri(
    workspace_id: Option<&str>,
    repository_id: Option<&str>,
) -> Result<String, String> {
    match (workspace_id, repository_id) {
        (Some(workspace), Some(repository)) => Ok(format!(
            "comtrya://workspace/{workspace}/repository/{repository}"
        )),
        (Some(workspace), None) => Ok(format!("comtrya://workspace/{workspace}")),
        (None, Some(repository)) => Ok(format!("comtrya://repository/{repository}")),
        (None, None) => {
            Err("issues.list requires variables.workspaceId or variables.repositoryId".to_string())
        }
    }
}

fn issue_list_repository_uri(workspace_id: Option<&str>, repository_id: Option<&str>) -> String {
    issue_repository_uri(workspace_id, repository_id)
        .unwrap_or_else(|_| "comtrya://issues".to_string())
}

fn workspace_uri(workspace_id: &str) -> String {
    if workspace_id.starts_with("comtrya://workspace/") {
        workspace_id.to_string()
    } else {
        format!("comtrya://workspace/{workspace_id}")
    }
}

fn pull_repository_uri(workspace_id: Option<&str>, repository_id: Option<&str>) -> String {
    match (workspace_id, repository_id) {
        (Some(workspace), Some(repository)) => {
            format!("comtrya://workspace/{workspace}/repository/{repository}")
        }
        (Some(workspace), None) => format!("comtrya://workspace/{workspace}"),
        (None, Some(repository)) => format!("comtrya://repository/{repository}"),
        (None, None) => "comtrya://pulls".to_string(),
    }
}

fn check_record_repository_uri(workspace_id: Option<&str>, repository_id: Option<&str>) -> String {
    match (workspace_id, repository_id) {
        (Some(workspace), Some(repository)) => {
            format!("comtrya://workspace/{workspace}/repository/{repository}")
        }
        (None, Some(repository)) => format!("comtrya://repository/{repository}"),
        (Some(workspace), None) => format!("comtrya://workspace/{workspace}"),
        (None, None) => "comtrya://checks".to_string(),
    }
}

fn check_list_repository_uri(workspace_id: Option<&str>, repository_id: Option<&str>) -> String {
    match (workspace_id, repository_id) {
        (Some(workspace), Some(repository)) => {
            format!("comtrya://workspace/{workspace}/repository/{repository}")
        }
        (Some(workspace), None) => format!("comtrya://workspace/{workspace}"),
        (None, Some(repository)) => format!("comtrya://repository/{repository}"),
        (None, None) => "comtrya://checks".to_string(),
    }
}

fn parse_issue_repository_uri(repository: &str) -> (Option<String>, Option<String>) {
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

fn optional_json_string(value: Option<String>) -> Value {
    value.map(Value::String).unwrap_or(Value::Null)
}

fn json_bytes(value: Value) -> Result<Vec<u8>, String> {
    serde_json::to_vec(&value).map_err(|error| format!("encode WASM payload: {error}"))
}

fn json_success_response(body: Value, headers: HeaderMap) -> Response {
    let mut response = Json(body).into_response();
    *response.status_mut() = StatusCode::OK;
    response.headers_mut().extend(headers);
    response
}

fn wasm_error_response(error: wit_types::Error, cors: HeaderMap) -> Response {
    if matches!(error.code, wit_types::ErrorCode::NotFound)
        && error.message.contains("not registered")
    {
        return crate::graphql_error_response(
            StatusCode::SERVICE_UNAVAILABLE,
            "WASM_DISPATCH_UNAVAILABLE",
            &error.message,
            cors,
        );
    }
    let (status, code) = match error.code {
        wit_types::ErrorCode::BadInput => (StatusCode::BAD_REQUEST, "BAD_USER_INPUT"),
        wit_types::ErrorCode::NotFound => (StatusCode::NOT_FOUND, "NOT_FOUND"),
        wit_types::ErrorCode::Conflict => (StatusCode::CONFLICT, "CONFLICT"),
        wit_types::ErrorCode::Forbidden => (StatusCode::FORBIDDEN, "FORBIDDEN"),
        wit_types::ErrorCode::Unauthenticated => (StatusCode::UNAUTHORIZED, "UNAUTHENTICATED"),
        wit_types::ErrorCode::Unavailable => {
            (StatusCode::SERVICE_UNAVAILABLE, "WASM_DISPATCH_UNAVAILABLE")
        }
        wit_types::ErrorCode::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"),
    };
    crate::graphql_error_response(status, code, &error.message, cors)
}
