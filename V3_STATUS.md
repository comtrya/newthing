# Comtrya v3 status

The `v3` branch is the schema-first cutover from host-side product handlers and
the old frontend stack to generated WASM dispatch plus a Vue shell.

## Current state

- Rust host starts the production-testbed runtime, enforces production gates,
  serves GraphQL, Git upload-pack, events, and extension assets.
- `extensions/wit/comtrya/platform/` is locked at
  `comtrya:platform@0.1.0`.
- Every first-party extension has extension-local WIT, a `cargo-component`
  crate, and a real `dist/<id>.wasm` artifact.
- GraphQL product operations route through the generated dispatch table into
  typed Wasmtime invokers.
- `ext_issues`, `ext_epics`, `ext_pull_requests`, and `ext_checks` own their
  product operations in WASM.
- `ext_pull_requests` reacts to merge events and closes linked issues through
  `ops.invoke` into `ext_issues`.
- Extension-owned storage collections come from manifests; core-only
  collections stay in typed Rust declarations.
- The frontend is a Vite Vue SPA in `frontend/`.
- The final smoke path is `./start.sh --reset --oneshot`.

## Milestones

| Milestone | Status |
| --- | --- |
| M0 audit/freeze | Done |
| M1 `ext_issues` canary | Done |
| M2 host wiring/codegen | Done |
| M3 GraphQL dispatch routing | Done |
| M4 issue legacy deletion | Done |
| M5 epics/pulls/checks migration | Done |
| M6 reactor/cross-call broker | Done |
| M7 Vue shell scaffold | Done |
| M8 UI extension ports | Done |
| M9 Vue parity | Done |
| M10 old frontend deletion | Done |
| M11 WAT/resolver deletion | Done |
| M12 storage/dead-code cleanup | Done |
| M13 final verification/docs | In progress |

## Verification commands

```sh
cargo clippy --workspace -- -D warnings
cargo test -p comtrya-server --no-run
cargo +nightly udeps
./start.sh --reset --oneshot
```

## Intentionally unsupported

- Git receive-pack/push.
- Full OIDC browser callback validation in the testbed.
- Legacy Comtrya v1 HTTP APIs.
- Removing the compatibility `demo` GraphQL aggregate. It is still present but
  assembled from real Git, runtime storage, and extension data.
