use crate::error::{CoreError, CoreResult};
use std::collections::BTreeMap;

pub const COMTRYA_CLIENT_TYPESCRIPT: &str = r#"
interface ComtryaClient {
  query<TData = unknown, TVars = Record<string, unknown>>(document: string, variables?: TVars, opts?: { signal?: AbortSignal; operationName?: string }): Promise<TData>;
  mutate<TData = unknown, TVars = Record<string, unknown>>(document: string, variables?: TVars, opts?: { signal?: AbortSignal; operationName?: string }): Promise<TData>;
  subscribe<TData = unknown, TVars = Record<string, unknown>>(document: string, variables?: TVars, opts?: { signal?: AbortSignal; operationName?: string }): AsyncIterable<TData>;
  permissions(resourceURN: string): Promise<string[]>;
  events(filter?: EventFilter, opts?: { signal?: AbortSignal }): AsyncIterable<Event>;
  navigate(path: string, opts?: { replace?: boolean }): void;
  toast(level: "info" | "success" | "warn" | "error", message: string): void;
}
"#;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AssetResponse {
    pub status: u16,
    pub headers: BTreeMap<String, String>,
    pub body: Vec<u8>,
}

pub fn extension_asset_response(
    request_origin: &str,
    allowed_origins: &[String],
    path: &str,
    body: &[u8],
    content_type: &str,
    path_has_content_hash: bool,
) -> CoreResult<AssetResponse> {
    if !allowed_origins
        .iter()
        .any(|origin| origin == request_origin)
    {
        return Err(CoreError::forbidden(
            "origin is not allowed for extension asset request",
            path,
            "cors:access",
        ));
    }
    let mut headers = BTreeMap::new();
    headers.insert(
        "Access-Control-Allow-Origin".to_string(),
        request_origin.to_string(),
    );
    headers.insert(
        "Access-Control-Allow-Credentials".to_string(),
        "true".to_string(),
    );
    headers.insert("Content-Type".to_string(), content_type.to_string());
    headers.insert(
        "ETag".to_string(),
        format!("\"{}\"", stable_etag_token(body)),
    );
    headers.insert(
        "Content-Security-Policy".to_string(),
        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'".to_string(),
    );
    if path_has_content_hash {
        headers.insert(
            "Cache-Control".to_string(),
            "max-age=31536000, immutable".to_string(),
        );
    }
    Ok(AssetResponse {
        status: 200,
        headers,
        body: body.to_vec(),
    })
}

/// A 64-bit FNV-1a token used as an opaque cache-busting ETag value.
/// This is NOT a cryptographic digest — it is not collision-resistant
/// and must not be used as a content-integrity check. The prefix is
/// `fnv1a64-` so any consumer that grew dependent on `sha256-` will
/// loudly fail at the boundary instead of trusting weak entropy
/// (issue: stable_integrity mislabelled FNV-1a as `sha256-`).
///
/// Real content integrity (extension UI bundle entry assets, etc.)
/// goes through `crates/server/src/main.rs::asset_integrity`, which
/// computes a real `Sha256::digest`.
pub fn stable_etag_token(body: &[u8]) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in body {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("fnv1a64-{hash:016x}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn asset_response_includes_csp_cache_validator_and_sri_material() {
        let response = extension_asset_response(
            "http://localhost:4321",
            &["http://localhost:4321".to_string()],
            "/_extensions/ext_pull_requests/assets/index.abc123.js",
            b"console.log(1)",
            "text/javascript",
            true,
        )
        .unwrap();

        assert_eq!(response.status, 200);
        assert!(response.headers.contains_key("ETag"));
        assert_eq!(
            response.headers.get("Cache-Control").map(String::as_str),
            Some("max-age=31536000, immutable")
        );
        let csp = response.headers.get("Content-Security-Policy").unwrap();
        assert!(csp.contains("object-src 'none'"));
        assert!(!csp.contains("unsafe-inline"));
        assert_eq!(
            stable_etag_token(&response.body),
            stable_etag_token(b"console.log(1)")
        );
    }

    #[test]
    fn disallowed_origin_is_rejected_at_asset_boundary() {
        assert_eq!(
            extension_asset_response(
                "https://evil.example",
                &["http://localhost:4321".to_string()],
                "/_extensions/ext_pull_requests/assets/index.js",
                b"",
                "text/javascript",
                false,
            )
            .unwrap_err()
            .code,
            crate::ErrorCode::Forbidden
        );
    }

    #[test]
    fn comtrya_client_contract_hides_access_tokens() {
        assert!(COMTRYA_CLIENT_TYPESCRIPT.contains("subscribe"));
        assert!(COMTRYA_CLIENT_TYPESCRIPT.contains("toast"));
        assert!(!COMTRYA_CLIENT_TYPESCRIPT.contains("accessToken"));
    }
}
