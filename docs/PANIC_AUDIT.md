# Panic audit — `unwrap()` / `expect()` / `panic!()` reachable from HTTP

**Last verified:** 2026-05-19 (PR addressing #14 P3-4).

This document codifies the project's promise that no `unwrap()`,
`expect()`, or `panic!()` call reachable from an HTTP handler with
user-controlled input can panic the server process. The audit is
checked at code-review time; future PRs adding new sites in this
class MUST update the table below.

## Methodology

```
grep -rn '\.unwrap()\|\.expect(\|panic!\|unreachable!\|unimplemented!' crates/server/src/
```

Then filter out:
- everything inside `#[cfg(test)]` blocks (test failure modes are
  loud and expected),
- `Mutex::lock().expect("...lock not poisoned")` patterns (lock
  poisoning means another thread already panicked; a process
  restart is the correct recovery),
- compile-time-constant `HeaderName::from_str` / `HeaderValue::from_static`
  on string literals,
- startup-only paths (`main()`, `Runtime::start`, config parsing —
  panic on bad config at boot is the right call; the server cannot
  serve correctly without it).

The residual is the set this audit classifies.

## Classification (as of v3 + this PR)

### `crates/server/src/main.rs`

Line numbers reflect the state at the time of audit. **Don't trust
them across diffs** — the methodology grep above is the source of
truth.

| Call | Class | Reachable from HTTP request with user input? |
|------|-------|----------------------------------------------|
| `listener.local_addr().expect("listener has local addr")` | Startup | No — before any request |
| `axum::serve(listener, app).await.expect("server failed")` | Startup | No |
| `"127.0.0.1:8080".parse().expect("valid default listen addr")` | Startup | No — static literal |
| `(Some(name), Some(owner)) = (segments.last().cloned(), …) else { return Err(…) }` in `create_repository_document` | **Converted** from `.expect()` → explicit `Err`. Was post-validation invariant. | No — now an explicit error path that surfaces an Internal error if `validate_repo_path` is ever bypassed |
| `HeaderName::from_str(name).expect("static CORS header name")` | Static string | No — `name` is a compile-time literal |
| `HeaderValue::from_str(value).expect("valid CORS header value")` | Pre-filtered request header | No — `value` is the request's `Origin` *after* it passed the allowlist check. The earlier `headers.get("origin").and_then(\|v\| v.to_str().ok())` already rejects bytes outside visible ASCII (incl. `\r`/`\n`), so the value reaching `HeaderValue::from_str` cannot panic in practice. |
| `HeaderValue::from_str(methods).expect("valid methods header")` | Static string | No |
| `self.rate_limits.lock().expect("rate lock not poisoned")` | Idiomatic lock | No |
| `self.credentials.lock().expect("credential lock not poisoned")` ×3 | Idiomatic lock | No |
| `self.sessions.lock().expect("session lock not poisoned")` ×2 | Idiomatic lock | No |
| `if let Ok(value) = HeaderValue::from_str(etag) { … } else { eprintln!(…) }` in `apply_extension_asset_headers` | **Converted** from `.expect()` → graceful fallback. ETag is a cache optimization; serving without it on a malformed value is correct degradation. | No — fallback path active |

### `crates/server/src/wasm_registry.rs`

Only one production-code `expect`: `COMPILED.get().expect("just set")`
(line 483) — `OnceLock` init invariant. The `OnceLock` has just been
populated by the surrounding `get_or_init` semantics; `get()`
returning `None` is unreachable. Not HTTP-reachable.

All other `expect()` calls in this file are inside `#[cfg(test)]`
test bodies.

### `crates/server/src/wasm_host.rs`

Production calls: only `RwLock::read().expect()` /
`Mutex::lock().expect()` for idiomatic lock poisoning. No
HTTP-reachable user-input panic surface.

### `crates/server/src/oidc.rs`

Production calls: only `Mutex::lock().expect()` on
`OidcSessionStore.inner` and `RwLock::read()/write().expect()` on
`OidcDiscoveryCache.inner`. Idiomatic lock poisoning. No
HTTP-reachable user-input panic surface.

### `crates/server/src/cue_config.rs`

Zero `unwrap()`/`expect()` calls in production code.

### `crates/server/src/wasm_invokers.rs`

Zero `unwrap()`/`expect()` calls in production code.

## Conclusion

No production `unwrap()`/`expect()`/`panic!()` in `crates/server/src/`
is reachable from an HTTP request handler with user-controlled input
in a way that can panic the server process. This satisfies #14 P3-4.

## Maintenance rule

Every PR that adds a new `unwrap()` or `expect()` call in production
code under `crates/server/src/` MUST either:

1. Add the new site to the table above with its classification, OR
2. Convert the call to an explicit error path (preferred for any
   call that touches HTTP-arriving data).

Reviewers should fail PRs that introduce a panic on a new
user-input-reachable site without justification.

## Enforcement strategy

This audit IS the enforcement. CLAUDE.md's Clippy Hard Rule prefers
"deleting dead code, wiring unused code into the exercised path, or
narrowing visibility over suppressing warnings." A
`#![deny(clippy::unwrap_used)]` gate paired with site-by-site
`#[allow(...)]` annotations would invert that preference — every
deny exception would be a new suppression. So no lint gate is
proposed.

Instead: future PRs that introduce a new production `unwrap`/`expect`
in `crates/server/src/` MUST either justify it under one of the
classes above (and add it to the table) or convert the call to an
explicit error path. Code review is the enforcement mechanism; the
table is the standing list of acceptable patterns.
