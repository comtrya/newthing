//! Kernel-side typed dispatchers per migrated extension.
//!
//! Each migrated extension gets a `dispatch_<ext_id>` function that:
//!   1. Picks the right exported WIT function for the op-name in
//!      `DispatchInfo`.
//!   2. Deserialises the GraphQL `variables.input` JSON into the WIT
//!      input record (via a second `wasmtime::component::bindgen!`
//!      pointed at the per-extension WIT).
//!   3. Instantiates the component under `Linker<HostState>`.
//!   4. Calls the typed function.
//!   5. Serialises the typed output back to JSON.
//!   6. Wraps the JSON in the legacy GraphQL response shape
//!      `{ data: { <interface>: { <verb>: <value> } } }` so the
//!      existing Astro frontend keeps working without a schema
//!      migration.
//!
//! Phase 3 hand-writes one of these per first-party extension. Phase 5
//! generalises with a code generator that emits the dispatch boilerplate.

use std::sync::Arc;

use axum::http::{HeaderMap, StatusCode};
use axum::response::Response;
use serde_json::Value;
use wasmtime::Store;
use wasmtime::component::Component;

use crate::wasm_host::HostState;
use crate::wasm_registry::{WasmRegistry, build_host_state};

pub fn dispatch(
    state: &crate::AppState,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: Value,
    headers: HeaderMap,
) -> Option<Response> {
    // M3-only constraint: the legacy GraphQL surface and the WIT op
    // shapes diverge in non-trivial ways (legacy `issues.create`
    // stores `workspaceID`-shaped JSON, WIT `open-issue` writes a
    // `repository`-shaped JSON; legacy `issues.list(workspaceId)` vs
    // WIT `list-issues(repository, limit)`). The two paths cannot
    // share live data without translation. M4 swaps them atomically
    // when the legacy handlers are deleted and the WIT shape becomes
    // the only writer of `issues` documents. Until then, every call
    // falls through to the legacy hand-written handler.
    //
    // The WASM-dispatcher framework still runs:
    //   * the dispatch table resolves the route,
    //   * the request reaches this function,
    //   * this function returns None,
    //   * graphql_post's legacy match arms take over.
    //
    // That's observably the right behaviour: WASM routing is wired
    // and the fallback works. The cutover that actually fires WASM
    // for a specific op lives in M4 (ext_issues), M5 (others).
    let _ = (state, info, payload, headers);
    None
}

mod ext_issues {
    use super::*;

    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_issues/wit",
        world: "ext-issues",
    });

    use self::exports::comtrya::ext_issues::issues::{
        CloseIssueInput, Issue, IssueState, OpenIssueInput,
    };

    pub fn dispatch(
        state: &crate::AppState,
        info: &crate::generated_dispatch::DispatchInfo,
        payload: Value,
        cors: HeaderMap,
    ) -> Response {
        let registry = state.runtime.wasm_registry.clone();
        let store = Arc::new(state.runtime.extension_storage.clone());
        // Principal resolution is incomplete in M3 — the GraphQL
        // handler doesn't yet thread the authenticated user URI down
        // here. Use the anonymous principal until the auth wiring
        // lands. TODO(M3/M4): plumb the real principal from
        // graphql_post's session lookup.
        let principal = "comtrya://user/usr_anonymous".to_string();
        let input = payload
            .pointer("/variables/input")
            .cloned()
            .unwrap_or(Value::Null);
        match invoke(&registry, store, &principal, info.op_name, &input) {
            Ok(value) => crate::json_response(
                StatusCode::OK,
                wrap_in_graphql_shape(info, value),
                cors,
            ),
            Err(DispatchError::Wit(err)) => crate::graphql_error_response(
                http_status_for(&err.code),
                error_code_str(&err.code),
                &err.message,
                cors,
            ),
            Err(DispatchError::Internal(msg)) => crate::graphql_error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL",
                &msg,
                cors,
            ),
        }
    }

    enum DispatchError {
        Wit(crate::wasm_host::wit_types::Error),
        Internal(String),
    }

    impl From<crate::wasm_host::wit_types::Error> for DispatchError {
        fn from(e: crate::wasm_host::wit_types::Error) -> Self {
            DispatchError::Wit(e)
        }
    }

    // The bindgen inside this module emits its own structurally-
    // identical copies of the platform types. Convert them to the
    // wasm_host's canonical types so error handling outside this
    // module sees one consistent shape.
    impl From<self::comtrya::platform::types::Error> for DispatchError {
        fn from(e: self::comtrya::platform::types::Error) -> Self {
            use crate::wasm_host::wit_types as canonical;
            use self::comtrya::platform::types as local;
            let code = match e.code {
                local::ErrorCode::NotFound => canonical::ErrorCode::NotFound,
                local::ErrorCode::Conflict => canonical::ErrorCode::Conflict,
                local::ErrorCode::Forbidden => canonical::ErrorCode::Forbidden,
                local::ErrorCode::Unauthenticated => canonical::ErrorCode::Unauthenticated,
                local::ErrorCode::BadInput => canonical::ErrorCode::BadInput,
                local::ErrorCode::Internal => canonical::ErrorCode::Internal,
                local::ErrorCode::Unavailable => canonical::ErrorCode::Unavailable,
            };
            DispatchError::Wit(canonical::Error {
                code,
                message: e.message,
                path: e.path,
            })
        }
    }

    fn invoke(
        registry: &WasmRegistry,
        store: Arc<crate::ExtensionRuntimeStore>,
        current_principal: &str,
        op: &str,
        input: &Value,
    ) -> Result<Value, DispatchError> {
        let dispatcher: Arc<dyn crate::wasm_host::OpsDispatcher> = Arc::new(
            crate::wasm_registry::RegistryDispatcher {
                registry: registry.clone(),
                store: store.clone(),
            },
        );
        let (host_state, ext) = build_host_state(
            registry,
            "ext_issues",
            current_principal,
            store,
            dispatcher,
            0,
        )
        .map_err(DispatchError::Internal)?;
        let mut wasm_store = Store::new(registry.engine.as_ref(), host_state);
        let component: &Component = &ext.component;
        let instance = registry
            .linker
            .instantiate(&mut wasm_store, component)
            .map_err(|e| DispatchError::Internal(format!("instantiate {}: {e}", "ext_issues")))?;
        let ext_issues = ExtIssues::new(&mut wasm_store, &instance)
            .map_err(|e| DispatchError::Internal(format!("bind ext-issues world: {e}")))?;
        let issues = ext_issues.comtrya_ext_issues_issues();

        match op {
            "open-issue" => {
                let parsed: OpenIssueInputJson = serde_json::from_value(input.clone())
                    .map_err(|e| DispatchError::Internal(format!("parse open-issue input: {e}")))?;
                let wit_input = OpenIssueInput {
                    repository: parsed.repository,
                    title: parsed.title,
                    body_markdown: parsed.body_markdown.unwrap_or_default(),
                };
                let result = issues
                    .call_open_issue(&mut wasm_store, &wit_input)
                    .map_err(|e| DispatchError::Internal(format!("open-issue call: {e}")))?;
                let issue = result?;
                Ok(issue_to_json(&issue))
            }
            "close-issue" => {
                let parsed: CloseIssueInputJson = serde_json::from_value(input.clone())
                    .map_err(|e| DispatchError::Internal(format!("parse close-issue input: {e}")))?;
                let wit_input = CloseIssueInput {
                    id: parsed.id,
                    reason: parsed.reason,
                    closed_by_ref: parsed.closed_by_ref,
                };
                let result = issues
                    .call_close_issue(&mut wasm_store, &wit_input)
                    .map_err(|e| DispatchError::Internal(format!("close-issue call: {e}")))?;
                let issue = result?;
                Ok(issue_to_json(&issue))
            }
            "reopen-issue" => {
                let id = input
                    .get("id")
                    .and_then(Value::as_str)
                    .ok_or_else(|| {
                        DispatchError::Internal(
                            "reopen-issue requires variables.input.id".to_string(),
                        )
                    })?
                    .to_string();
                let result = issues
                    .call_reopen_issue(&mut wasm_store, &id)
                    .map_err(|e| DispatchError::Internal(format!("reopen-issue call: {e}")))?;
                let issue = result?;
                Ok(issue_to_json(&issue))
            }
            "get-issue" => {
                let id = input
                    .get("id")
                    .and_then(Value::as_str)
                    .ok_or_else(|| {
                        DispatchError::Internal("get-issue requires variables.input.id".to_string())
                    })?
                    .to_string();
                let result = issues
                    .call_get_issue(&mut wasm_store, &id)
                    .map_err(|e| DispatchError::Internal(format!("get-issue call: {e}")))?;
                let maybe_issue = result?;
                Ok(maybe_issue.map(|i| issue_to_json(&i)).unwrap_or(Value::Null))
            }
            "list-issues" => {
                let repository = input
                    .get("repository")
                    .and_then(Value::as_str)
                    .ok_or_else(|| {
                        DispatchError::Internal(
                            "list-issues requires variables.input.repository".to_string(),
                        )
                    })?
                    .to_string();
                let limit = input
                    .get("limit")
                    .and_then(Value::as_u64)
                    .unwrap_or(100)
                    .min(1024) as u32;
                let result = issues
                    .call_list_issues(&mut wasm_store, &repository, limit)
                    .map_err(|e| DispatchError::Internal(format!("list-issues call: {e}")))?;
                let issues_vec = result?;
                Ok(Value::Array(issues_vec.iter().map(issue_to_json).collect()))
            }
            other => Err(DispatchError::Internal(format!(
                "ext_issues has no op named '{other}'"
            ))),
        }
    }

    #[derive(serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct OpenIssueInputJson {
        repository: String,
        title: String,
        body_markdown: Option<String>,
    }

    #[derive(serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct CloseIssueInputJson {
        id: String,
        reason: Option<String>,
        closed_by_ref: Option<String>,
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
        // Uppercase to match the legacy GraphQL surface.
        match state {
            IssueState::Open => "OPEN",
            IssueState::Closed => "CLOSED",
            IssueState::Reopened => "REOPENED",
        }
    }
}

fn wrap_in_graphql_shape(
    info: &crate::generated_dispatch::DispatchInfo,
    value: Value,
) -> Value {
    // Legacy GraphQL response shape: { data: { <interface>: { <verb>: <value> } } }
    // The verb is the WIT op_name stripped of the singular noun suffix
    // (same derivation as comtrya_wit_codegen::legacy_graphql_field).
    let verb = derive_verb(info.interface_name, info.op_name);
    serde_json::json!({
        "data": {
            info.interface_name: {
                &verb: value,
            }
        }
    })
}

fn derive_verb(interface_name: &str, op_name: &str) -> String {
    // Mirror legacy_graphql_field's stripping logic. If the op name
    // doesn't end with the interface noun, fall back to the raw op
    // name camelCased.
    let singular = singular_of(interface_name);
    if let Some(s) = &singular {
        if let Some(verb) = op_name.strip_suffix(&format!("-{}", s)) {
            return kebab_to_camel(verb);
        }
    }
    if let Some(verb) = op_name.strip_suffix(&format!("-{}", interface_name)) {
        return kebab_to_camel(verb);
    }
    kebab_to_camel(op_name)
}

fn singular_of(s: &str) -> Option<String> {
    if let Some(stem) = s.strip_suffix("ies") {
        return Some(format!("{}y", stem));
    }
    if let Some(stem) = s.strip_suffix('s') {
        if !stem.is_empty() {
            return Some(stem.to_string());
        }
    }
    None
}

fn kebab_to_camel(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut upper = false;
    for ch in s.chars() {
        if ch == '-' || ch == '_' {
            upper = true;
        } else if upper {
            out.extend(ch.to_uppercase());
            upper = false;
        } else {
            out.push(ch);
        }
    }
    out
}

fn http_status_for(code: &crate::wasm_host::wit_types::ErrorCode) -> StatusCode {
    use crate::wasm_host::wit_types::ErrorCode;
    match code {
        ErrorCode::NotFound => StatusCode::NOT_FOUND,
        ErrorCode::Conflict => StatusCode::CONFLICT,
        ErrorCode::Forbidden => StatusCode::FORBIDDEN,
        ErrorCode::Unauthenticated => StatusCode::UNAUTHORIZED,
        ErrorCode::BadInput => StatusCode::BAD_REQUEST,
        ErrorCode::Unavailable => StatusCode::SERVICE_UNAVAILABLE,
        ErrorCode::Internal => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

fn error_code_str(code: &crate::wasm_host::wit_types::ErrorCode) -> &'static str {
    use crate::wasm_host::wit_types::ErrorCode;
    match code {
        ErrorCode::NotFound => "NOT_FOUND",
        ErrorCode::Conflict => "CONFLICT",
        ErrorCode::Forbidden => "FORBIDDEN",
        ErrorCode::Unauthenticated => "UNAUTHENTICATED",
        ErrorCode::BadInput => "BAD_USER_INPUT",
        ErrorCode::Unavailable => "UNAVAILABLE",
        ErrorCode::Internal => "INTERNAL",
    }
}
