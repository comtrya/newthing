# v3 schema-first overhaul

This branch is the v3 cutover, not a scaffold. The production-testbed runtime
now boots a Rust kernel, a Vite/Vue shell, and first-party Component Model
extensions built from cargo-component crates.

## Current architecture

- **Platform WIT:** `extensions/wit/comtrya/platform/` declares
  `comtrya:platform@0.1.0`. First-party extensions each ship their own WIT
  package under `extensions/first-party/<id>/wit/`.
- **Typed server dispatch:** `crates/server/build.rs` runs
  `crates/wit-codegen` at build time. Generated dispatch maps canonical WIT
  operation routes to typed WASM invokers; `matches_op` and the substring
  dispatcher are gone.
- **Real WASM components:** every first-party extension has
  `component/Cargo.toml` and `dist/<id>.wasm`. No `component.wat` stubs remain.
- **Host imports:** `crates/server/src/wasm_host.rs` implements storage,
  relations, comments, events, identity, time, ids, ops, and log imports.
- **Cross-extension calls and reactors:** `ext_pull_requests` reacts to merged
  pull-request events and calls `ext_issues/issues.close-issue` through
  `ops.invoke`.
- **Manifest-driven storage:** core storage declarations live in typed Rust
  declarations; extension-owned collections live in `manifest.json`
  `contributes.collections`.
- **Vite/Vue frontend:** `frontend/` is a Vite Vue app. The old frontend stack
  has been deleted.
  UI extension packages build browser assets consumed by the shell and SDK.

## Milestone status

| Milestone | Status | Result |
| --- | --- | --- |
| M1-M3 WIT, host imports, codegen | Done | Platform WIT, host imports, generated GraphQL/WIT dispatch. |
| M4 issues | Done | `ext_issues` owns issue create/list/close/reopen/query logic in WASM. |
| M5 epics, pulls, checks | Done | First-party product operations route through generated WASM dispatch. |
| M6 reactors | Done | Merge events close linked issues through cross-extension WASM. |
| M7-M9 Vue shell | Done | Workspace, repository, extension, SDK, and browser smoke surfaces moved to Vue. |
| M10 old frontend deletion | Done | Old frontend config, routes, dependencies, and shell sources removed. |
| M11 WAT/resolver deletion | Done | `.wat` stubs and the old `Linker::<()>` resolver path removed. |
| M12 storage/dead-code cleanup | Done | Storage schema comes from core + manifests; clippy and udeps are clean. |
| M13 final verification/docs | Done | `start.sh` owns the final structural and end-to-end smoke checks; the old Git shell fallback is gone. |

## Verification

The final smoke path is:

```sh
./start.sh --reset --oneshot
```

That path builds the server and Vue shell, checks no `.wat` stubs or
`matches_op` routes remain, verifies every first-party manifest declares
`platformWitVersion: "0.1.0"` and a real `dist/<id>.wasm`, then exercises
auth, GraphQL, extension assets, browser-mounted UI, Git clone/fetch,
issue close via WASM, and the PR-merge reactor.

Focused local checks used during M12:

```sh
cargo clippy --workspace -- -D warnings
cargo test -p comtrya-server --no-run
cargo +nightly udeps
rg '#\[allow\(dead_code\)\]' crates extensions
```

## Still intentionally unsupported

- Git receive-pack/push remains disabled and returns the registered
  `UNSUPPORTED` surface.
- Full OIDC browser callback validation is not implemented in the testbed.
- Comtrya v1 HTTP APIs are gone.
- The GraphQL root exposes kernel-owned fields only; extensions are called
  through canonical WIT operation routes.
