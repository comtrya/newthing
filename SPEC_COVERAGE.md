# Comtrya spec coverage

This repository implements the Comtrya v2/v3 production-testbed contract as a
buildable Rust kernel, Vite/Vue frontend, first-party Component Model
extensions, fixtures, migrations, and automated acceptance coverage.

## Section commits

- `0b50b9f` core contract foundation: IDs, slugs, resource refs, visibility,
  errors, instance and repository config validation.
- `07831c8` operational persistence contracts: events, SSE cursors, checks,
  jobs, migration gates.
- `b0d190c` authz and Git storage contracts: OIDC/token exchange,
  authorization adapter, Git HTTP/storage semantics, S3 layout.
- `b9ca878` extension host contracts: manifests, grants, lifecycle,
  WIT/runtime behavior, extension storage, secrets, UI assets.
- `452f29d` GraphQL, HTTP, and backup contracts.
- `5a75158` CLI, frontend, fixtures, migrations, WIT, and MVP flow wiring.
- `7ad9ec0` minimal server HTTP contract routes.

## MVP flow evidence

| SPEC.md item | Artifact evidence |
| --- | --- |
| Configure local CUE | `config/config.cue`, `config/production-testbed.cue`, config validation tests |
| Start Rust server | `crates/server/src/main.rs`, `cargo run -p comtrya-server -- --check` |
| Token exchange | `POST /auth/token-exchange`, operator-code smoke, auth route tests |
| Create workspace/group/repository | GraphQL repository mutations and production-testbed smoke |
| Git credential helper flow | scoped token exchange plus Git upload-pack smoke |
| Git fetch contract | `crates/git-http`, `/git/*`, `git ls-remote`, clone, and branch fetch smoke |
| Durable events | runtime JSONL event/audit logs plus extension storage events |
| Stream visible SSE events | `/events/session`, `/events`, `/graphql/stream` smoke |
| Install local extension | `extensions/first-party/*/manifest.json`, runtime manifest validation |
| Activate WASM component contract | extension-local WIT, `cargo-component`, `dist/<id>.wasm`, Wasmtime dispatch |
| Serve ESM UI assets | `/_extensions/<id>/manifest.json`, `/_extensions/<id>/assets/...` |
| Render extension UI | Vue shell extension loader and browser smoke |
| Enforce authorization adapter | auth/scope route tests and smoke |
| Audit sensitive operations | auth, token, event, and storage audit paths |

## Verification commands

```sh
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
cd frontend && ~/.bun/bin/bun run typecheck
cd frontend && ~/.bun/bin/bun run build
cargo run -p comtrya-server -- --check
COMTRYA_CONFIG=config/production-testbed.cue COMTRYA_DATA_DIR=/private/tmp/comtrya-production-testbed COMTRYA_TLS_TERMINATED=true COMTRYA_OPERATOR_CODE="comtrya-local-operator-code" cargo run -p comtrya-server -- --check
./start.sh --reset --oneshot
cargo run -p comtrya-cli -- capabilities
cargo run -p comtrya-cli -- backup
cargo run -p comtrya-cli -- restore
```

## Current expected results

- Rust format, clippy, and tests pass.
- Frontend typecheck and build pass through Bun/Vite.
- Development and production-testbed server checks report ready when configured
  with the required gates.
- `start.sh` seeds demo input, opens and validates local bare Git repositories,
  prints live repository/branch/extension seed evidence from GraphQL, runs the
  Vue frontend in front of the Rust server, and verifies operator-code exchange,
  GraphQL live Git/storage data, single-use and expired event sessions,
  extension manifest/asset sessions, browser-mounted Vue surfaces, Git
  clone/fetch, receive-pack fail-closed behavior, issue close through WASM, and
  pull-request merge reactors through cross-extension WASM.
- `start.sh --reset` and `COMTRYA_RESET_DEMO_DATA=1` reset only guarded
  generated paths below the configured absolute data directory.
- The Vue repository UI renders live Git/storage/extension data from the
  server, and smoke drives the live page in headless Chrome/Chromium.
- The frontend discovers installed extensions from GraphQL, validates their UI
  manifests, imports versioned entry assets, and renders extension slot/route
  contributions.
- CLI commands return capabilities, backup summary, and restore completion
  events.

## v3 cutover evidence

| v3 surface | Artifact evidence |
| --- | --- |
| Platform WIT | `extensions/wit/comtrya/platform/` |
| Generated dispatch | `crates/server/build.rs`, `crates/wit-codegen`, generated handler includes |
| Real extension components | `extensions/first-party/*/component/Cargo.toml`, `extensions/first-party/*/dist/*.wasm` |
| Host imports | `crates/server/src/wasm_host.rs` |
| Manifest validation | `docs/manifest.schema.json`, server manifest validation tests |
| Cross-extension reactor | `ext_pull_requests` merge reactor invoking `ext_issues` |
| Vue shell | `frontend/src`, `frontend/vite.config.ts`, `frontend/package.json` |
| Pure-Rust Git fetch | `crates/git-http`, server `/git/*` dispatch |
| Final smoke posture | `./start.sh --reset --oneshot` |

## Workspace and repository routes

| Surface | Source | Verified by |
| --- | --- | --- |
| `/` workspace homepage | Vue shell + `ext_workspace_home` slots | `start.sh` smoke |
| `/r/<...>/<repo>` dashboard | Vue shell + repository slots | `start.sh` smoke |
| `/x/<prefix>/<...>` extension page | Vue shell + extension SDK route | `start.sh` smoke |
| `/new` repository form | Vue shell + GraphQL mutation | `start.sh` smoke |
| `/instance`, `/settings`, `/health` | Vue shell + readiness/health probes | `start.sh` smoke |
| Manifest schema | server manifest validation | `cargo test -p comtrya-server manifest` |
