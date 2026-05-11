# Comtrya v3 — Status

A running, honest summary of the v3 branch state.

## Done in this branch

1. **Rename Forgepoint → Comtrya** across all source, manifests, env vars, WIT package, and crate names. `cargo check --workspace` passes after rename. (commit: rename)
2. **Pure-Rust Smart HTTP v2 Git server** (`crates/git-http`, 1880 LOC) ported from v1 forgepoint and added to the workspace. pkt-line codec, protocol-v2 negotiation, pack generation, repository provider abstraction. Standalone tests pass. (commit: port git-http crate)
3. **Pure-Rust Git wired into the server.** `git_endpoint` now dispatches into `comtrya_git_http::v2::dispatch` by default. The legacy `git http-backend` shell adapter is still callable behind `COMTRYA_GIT_BACKEND=legacy`. Demo repo init now writes `git-daemon-export-ok` so the new lib treats it as exported. All existing server tests still pass. (commit: wire pure-Rust Git into server)
4. **Typed WIT host interfaces.** `wit/comtrya-extension.wit` now defines `host-log`, `host-events`, `host-storage`, `host-git`, `host-http`, `host-secrets`, `host-jobs` as first-class WIT interfaces — replacing the previous stub-only world declaration. (commit: define typed WIT host interfaces)
5. **OCI extension distribution crate** (`crates/extension-oci`, ~700 LOC) ported from v1. `OciExtensionFetcher` + `ExtensionCache` with retries, exponential backoff, offline-mode fallback, content-addressed cache with checksum verification. 12 ported unit tests pass. (commit: add OCI extension distribution crate)
6. **`ExtensionInstallConfig` in core contract.** `ExtensionSource::{Local, Oci}` with `OciReference::{Tag, Digest}`. `InstanceConfig` carries `Vec<ExtensionInstallConfig>`. Validation rejects empty fields and duplicate ids. `config/config.cue` ships an example block referencing three OCI extensions; the hand-rolled CUE loader treats it as documentation until the parser is upgraded. (commit: ExtensionInstallConfig in core)

`cargo test --workspace` passes: **138 tests** across core (80), git-http (16), extension-oci (12), server (29), MVP integration (1).

## Architectural shape

```
crates/
  core/             # Domain contracts (v2-derived): ids, config, auth/authz,
                    # events, extensions, storage, git_storage, jobs, etc.
                    # NEW: ExtensionInstallConfig + ExtensionSource (Local|Oci)
  server/           # Axum HTTP runtime, GraphQL, Git endpoint dispatch
                    # NEW: PureRustGitState + comtrya-git-http wiring
  cli/              # Operator utilities (token check, backup, restore)
  git-http/         # NEW: pure-Rust Smart HTTP v2 (ports v1 forgepoint)
  extension-oci/    # NEW: OCI fetch + content-addressed cache for extensions

wit/comtrya-extension.wit  # NEW: typed host import surfaces + extension exports

extensions/first-party/    # Three ext_*: still ship minimal proof .wat
config/config.cue          # Adds an `extensions:` example block (OCI-referenced)
frontend/                  # Astro shell (unchanged in v3 so far)
migrations/                # SQLite + Postgres core schema (unchanged in v3 so far)
```

## Deferred to follow-up increments

These were on the v3 plan but are out-of-scope for this initial branch:

1. **Wire the OCI fetcher into the host runtime.** Today the OCI crate exists but `load_extension_runtime` still reads from `extensions/first-party/<id>/` on disk. Next: CUE-driven extension installation that resolves OCI references at boot.
2. **Typed WIT resolver execution.** WIT interfaces are defined; `load_extension_runtime` still calls `() -> u32` numeric proofs. Need: real `init`/`resolve`/`shutdown` calls with JSON I/O, host capability Linker, and one first-party extension that uses them.
3. **Per-extension SQLite via `host-storage`.** WIT interface is defined; host impl + per-installation SQLite database + WIT-bindgen Linker entries are the work.
4. **Federated GraphQL composer.** `GraphqlComposer` today rejects conflicts but does not actually merge SDL fragments into a supergraph or dispatch fields to extensions. v1 has reference code (`crates/server/src/extensions/schema/`) that can be adapted.
5. **Astro shell → real extension host.** Strip product panels; mount everything from runtime UI manifests. v1's `@comtrya/astro-integration-<feature>` pattern is the target.
6. **First-party `ext_pull_requests` end-to-end:** schema (WIT), persistence (host-storage), UI (Astro integration), distributed as OCI artifact, installable on a clean instance. This is the proof.
7. **Receive-pack / push** on top of `crates/git-http`. Today push is fail-closed.
8. **CUE loader upgrade.** Replace the hand-rolled line-by-line parser with a real CUE evaluator (or `cuelang`-backed Rust eval), enabling `config.cue` extensions block to drive behavior.
9. **SPEC_COVERAGE.md and start.sh reconciliation.** Add v3 sections asserting Git via comtrya-git-http (not http-backend), OCI cache fall-through, etc.

## Verification commands

```bash
# Compile workspace
cargo check --workspace

# Run all tests
cargo test --workspace

# Run server in dev (uses pure-Rust Git by default)
./start.sh

# Force legacy git http-backend (regression compare)
COMTRYA_GIT_BACKEND=legacy ./start.sh
```
