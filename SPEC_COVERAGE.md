# Forgepoint v2 Spec Coverage

This repository implements the Forgepoint v2 specification as a buildable kernel contract scaffold with runnable Rust binaries, typed core modules, TypeScript frontend contracts, fixtures, migrations, and automated acceptance coverage.

## Section Commits

- `0b50b9f` core contract foundation: IDs, slugs, resource refs, visibility, errors, instance and repository config validation.
- `07831c8` operational persistence contracts: events, SSE cursors, checks, jobs, migration gates.
- `b0d190c` authz and Git storage contracts: OIDC/token exchange, authorization adapter, Git HTTP/storage semantics, S3 layout.
- `b9ca878` extension host contracts: manifests, grants, lifecycle, WIT/runtime behavior, extension storage, secrets, UI assets.
- `452f29d` GraphQL, HTTP, and backup contracts.
- `5a75158` CLI, frontend, fixtures, migrations, WIT, and MVP flow wiring.
- `7ad9ec0` minimal server HTTP contract routes.

## MVP Flow Evidence

| SPEC.md §25 item | Artifact evidence |
| --- | --- |
| Configure local `config.cue` | `config/config.cue`, `InstanceConfig::minimal_dev`, config validation tests |
| Start Rust server against SQLite | `crates/server/src/main.rs`, `MetadataStore::new(MetadataBackend::Sqlite)`, `cargo run -p forgepoint-server -- --check` |
| Log in with OIDC | `AuthService::login`, `allowed_user_first_login_creates_user_and_audit_events` |
| Create workspace/group/repository | `GraphqlGateway::create_repository`, `mvp_flow.rs` |
| Git credential helper flow | `AuthService::exchange_token`, CLI `capabilities`/backup/restore wiring, `mvp_flow.rs` |
| Push standard Git contract | `InMemoryRepoStorage::begin_receive_pack`, `commit_receive_pack`, CAS tests |
| Reject invalid `package forgepoint` CUE | `validate_repository_cue_sources`, `invalid_cue_on_default_ref_rejects_receive_pack` |
| Accept valid CUE snapshots | `ConfigSnapshot`, `valid_nested_repository_cue_produces_effective_snapshots`, `mvp_flow.rs` |
| Durable CloudEvents | `EventEnvelope`, `EventOutbox`, event type tests |
| Stream visible SSE events | `StreamCursor`, `EventOutbox::resume`, server `/events` route tests |
| GraphQL live updates | `CORE_SDL_BASELINE` subscription fields, `InstanceCapabilities::v1` |
| Install local extension | `extensions/examples/pull-requests/manifest.json`, `ExtensionHost::activate` |
| Compose GraphQL schema | `GraphqlComposer`, SDL conflict tests |
| Activate WASM component contract | `ExtensionManifest`, `WIT_SKETCH`, `wit/forgepoint-extension.wit` |
| Serve ESM UI assets | `frontend_contracts::extension_asset_response`, server `/_extensions/...` route, `ext_pull_requests`/`ext_code_browser`/`ext_checks` demo assets |
| Render extension UI in frontend | `frontend/src/extension-host.ts`, example extension assets, Astro repo UI |
| Enforce authorization adapter | `InMemoryAuthorizer`, authz visibility tests |
| Audit sensitive operations | auth login, credential issue, secret access, restore event tests |

## Verification Commands

```sh
cargo fmt --all -- --check
cargo test --workspace
cd frontend && ~/.bun/bin/bun run typecheck
cd frontend && ~/.bun/bin/bun run build
cargo run -p forgepoint-server -- --check
FORGEPOINT_CONFIG=config/production-testbed.cue FORGEPOINT_DATA_DIR=/private/tmp/forgepoint-production-testbed FORGEPOINT_TLS_TERMINATED=true FORGEPOINT_OPERATOR_CODE="forgepoint-local-operator-code" cargo run -p forgepoint-server -- --check
FORGEPOINT_ONESHOT=1 FORGEPOINT_OPERATOR_CODE="forgepoint-local-operator-code" ./start.sh
cargo run -p forgepoint-cli -- capabilities
cargo run -p forgepoint-cli -- backup
cargo run -p forgepoint-cli -- restore
```

Current expected results:

- Rust format check passes.
- Rust workspace tests pass: 77 core unit tests, 1 MVP integration test, and 25 server route/runtime tests.
- Frontend typecheck passes through Bun's TypeScript runtime.
- Astro frontend build passes and emits a server-rendered frontend artifact.
- Development server check returns `forgepoint-server ready=true mode=development ...`.
- Production-testbed server check returns `forgepoint-server ready=true mode=production-testbed ...` when production gates are configured.
- `start.sh` seeds demo input into versioned extension storage document tables, opens and validates a real local bare Git repository, prints live repository/branch/extension seed evidence from GraphQL, runs the Astro frontend in front of the Rust server, and verifies operator-code exchange, GraphQL live Git data, SSR-rendered head OID equality, GraphQL diff equality with cloned Git output, events, extension manifest/asset sessions, typed Wasmtime resolver summaries, Git clone/fetch, and receive-pack fail-closed behavior through that frontend origin.
- `start.sh --reset` and `FORGEPOINT_RESET_DEMO_DATA=1` reset only guarded generated paths below the configured absolute data directory.
- The Astro repository UI renders live refs, branches, commits, tree entries, blobs, file previews, diffs, and Git/storage-derived metric counts from the server; it uses `@pierre/trees` for the file tree and `@pierre/diffs` for the review diff panel.
- The frontend discovers installed extensions from GraphQL, validates their UI manifests, imports their entry assets, and creates extension host elements from manifest slot declarations.
- CLI commands return v1 capabilities, backup summary, and restore completion event.
