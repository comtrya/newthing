//! GraphQL-to-WASM cutover gate.
//!
//! The generated dispatch table is already consulted by `graphql_post`.
//! For M2/M3 the live GraphQL request path still falls through to the
//! legacy handlers because the legacy GraphQL data shape and the WIT
//! canary data shape diverge. M4 performs the `ext_issues` cutover by
//! routing hits through the registry dispatcher and deleting the legacy
//! handlers atomically.

use axum::http::HeaderMap;
use axum::response::Response;
use serde_json::Value;
use std::sync::Arc;

use crate::wasm_host::{HostState, OpsDispatcher};
use crate::wasm_registry::{LoadedExtension, RegistryDispatcher};

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
    if let Err(error) = prepare_live_host_state(state, info, &headers) {
        return Some(crate::graphql_error_response(
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            "WASM_DISPATCH_UNAVAILABLE",
            &error,
            cors,
        ));
    }
    crate::legacy_wasm_route_response(state.clone(), info, payload, cors.clone()).or_else(|| {
        Some(crate::graphql_error_response(
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            "WASM_CUTOVER_PENDING",
            &format!(
                "generated route {}.{}.{} prepared live HostState but has no legacy GraphQL response bridge yet",
                info.extension_id, info.interface_name, info.op_name
            ),
            cors,
        ))
    })
}
