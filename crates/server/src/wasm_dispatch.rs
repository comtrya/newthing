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

pub fn dispatch(
    _state: &crate::AppState,
    _info: &crate::generated_dispatch::DispatchInfo,
    _payload: Value,
    _headers: HeaderMap,
) -> Option<Response> {
    None
}
