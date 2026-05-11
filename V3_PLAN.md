# Comtrya v3 — Plan

This branch combines what v1 (the original implementation, on-disk at `forgepoint-dev/forgepoint`, now renamed to Comtrya going forward) and v2 (the spec-driven rewrite that this repo started from) each got right into a single coherent kernel.

## Why v3

v2 has the right shape — a thin kernel with extension-owned features, OIDC, SpiceDB, CUE, CloudEvents, Wasmtime Component Model — but regressed on three load-bearing pieces relative to v1:

1. **Git hosting** is currently a shell adapter around `git http-backend`; push is disabled. v1 has a pure-Rust Smart HTTP v2 implementation with negotiation, shallow, and partial-clone filters.
2. **Extension distribution** has no answer: v2 ships filesystem-only first-party extensions; v1 distributes via OCI with registry auth and an offline cache.
3. **Federated GraphQL** is missing: v2's composer stitches results from JSONL host-side; v1's Hive Router plans queries and dispatches fields to extension resolvers.

v3 brings those three back, on top of v2's kernel/contracts/spec discipline.

## Architecture Targets (in priority order)

1. **Keep v2's kernel/feature split.** `SPEC.md §4` is the contract for core's responsibilities. Features live in extensions.
2. **Keep v2's standards foundation.** OIDC + SpiceDB + CUE + CloudEvents + WIT/Component Model.
3. **Port v1's `crates/git-http` into v3.** Replace the `git http-backend` shell adapter. Finish receive-pack/push.
4. **Adopt v1's OCI extension distribution on top of v2's Component Model.** Extensions are signed OCI artifacts containing a Component Model `.wasm` + manifest; registry auth + offline cache.
5. **Bring back federated GraphQL.** A planner/executor dispatches resolver fields to extension components via typed WIT calls. Host does not stitch JSON.
6. **Replace JSONL extension storage with per-extension SQLite,** exposed to extensions through a typed WIT host capability (document/KV/queue/event API). Versioned migrations per extension.
7. **Make the Astro frontend a real extension host.** Strip inline product panels. Adopt v1's `@comtrya/astro-integration-<feature>` pattern.
8. **Ship one first-party extension end-to-end (pull requests).** Owns schema (WIT), persistence (storage capability), UI (Astro integration), distributed as OCI artifact. This is the proof.
9. **Keep v2's spec/coverage/runbook discipline.** `SPEC.md` → `SPEC_COVERAGE.md` → `TODO.md` → `start.sh` smoke assertions stay authoritative.
10. **Drop unused inheritance.** No ATProto auth, no RON config, no fixture-sourced product data on the request path.

## What's NOT Changing

- `SPEC.md` mission, principles, kernel responsibilities — already correct.
- `crates/core` contracts — extend as needed but the shape is right.
- CUE config approach — keep.
- OIDC + SpiceDB — keep.
- CloudEvents outbox + SSE — keep.
- Single-tenant single-node default — keep (with named seams for future scale-out).

## Increment Plan

This branch is built in short increments, each committed and pushed:

1. ✅ `V3_PLAN.md` and PR opened.
2. ✅ Rename Forgepoint → Comtrya across source, manifests, env vars, WIT, crate names.
3. ✅ `crates/git-http` (~1880 LOC) ported from v1 — pure-Rust Smart HTTP v2.
4. ✅ Wire `crates/git-http` into `crates/server`; pure-Rust upload-pack by default; `git http-backend` shell adapter remains behind `COMTRYA_GIT_BACKEND=legacy`.
5. ✅ Typed WIT host interfaces (`host-log`, `host-events`, `host-storage`, `host-git`, `host-http`, `host-secrets`, `host-jobs`) defined in `wit/comtrya-extension.wit`.
6. ✅ `crates/extension-oci` ported from v1: `OciExtensionFetcher` + content-addressed `ExtensionCache`, retries/backoff/offline-mode, checksum verification.
7. ✅ `ExtensionInstallConfig` + `ExtensionSource::{Local, Oci}` + `OciReference::{Tag, Digest}` added to core; `InstanceConfig.extensions: Vec<…>` with validation; `config/config.cue` example added.

Deferred to follow-up branches (tracked in `V3_STATUS.md`):

8. Per-extension SQLite host capability + WIT Linker wiring.
9. Federated GraphQL SDL composer that dispatches fields to extensions.
10. CUE loader upgrade to parse the `extensions:` block authoritatively.
11. Wire `OciExtensionFetcher` into `load_extension_runtime`.
12. Typed WIT resolver execution — kill the numeric-proof shape end-to-end.
13. Astro shell as real extension host (strip product panels).
14. First-party `ext_pull_requests` end-to-end through the new path.
15. Receive-pack/push on top of `crates/git-http`.
16. `SPEC_COVERAGE.md`, `TODO.md`, `start.sh` reconciliation for v3 surfaces.

Each completed increment is a separate commit on this branch so the PR shows a real progression. See `V3_STATUS.md` for the up-to-date snapshot.

## Verification

The architecture is verified when:

- `start.sh --reset && start.sh` runs end-to-end with no fixture-sourced product data on the request path.
- A first-party extension can be uninstalled and its product surface disappears cleanly.
- `git clone` and `git push` both succeed against the pure-Rust Git server.
- An extension OCI artifact can be installed from a registry and become live.
- `SPEC_COVERAGE.md` maps every visible product surface to one of: Git object database, runtime SQLite storage, or a typed WIT resolver — never a JSON fixture.
