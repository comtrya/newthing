# Forgepoint v3 — Plan

This branch combines what v1 (the original Forgepoint at `forgepoint-dev/forgepoint`) and v2 (the spec-driven rewrite, which this repo is) each got right into a single coherent kernel.

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
7. **Make the Astro frontend a real extension host.** Strip inline product panels. Adopt v1's `@forgepoint/astro-integration-<feature>` pattern.
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
2. New `crates/git-http` ported from v1 (pure-Rust Smart HTTP v2, read path).
3. Wire `crates/git-http` into `crates/server` routes; remove `git http-backend` shell adapter for upload-pack.
4. Define typed WIT resolver ABI in `wit/forgepoint-extension.wit` (kill the numeric-proof shape).
5. Per-extension SQLite host capability (`crates/extension-storage-sqlite`); WIT host functions for documents/KV/queue/events.
6. Federated GraphQL composer + planner: dispatch resolver fields to extension components.
7. OCI extension distribution (`crates/extension-oci`): fetch, verify, cache, install.
8. CUE config schema extended for extension OCI references.
9. Replace fixture-seeded request-path data with extension-owned resolvers.
10. Frontend extension-host refactor — strip product panels from the shell.
11. First-party pull-requests extension end-to-end (schema, persistence, UI, OCI).
12. Receive-pack/push path on top of `crates/git-http`.
13. `SPEC_COVERAGE.md` and `TODO.md` reconciled with v3 reality; `start.sh` smoke assertions updated.

Each increment is a separate commit and push, so the PR shows a real progression. The PR is opened on increment 1 with a clear scope so reviewers can follow along.

## Verification

The architecture is verified when:

- `start.sh --reset && start.sh` runs end-to-end with no fixture-sourced product data on the request path.
- A first-party extension can be uninstalled and its product surface disappears cleanly.
- `git clone` and `git push` both succeed against the pure-Rust Git server.
- An extension OCI artifact can be installed from a registry and become live.
- `SPEC_COVERAGE.md` maps every visible product surface to one of: Git object database, runtime SQLite storage, or a typed WIT resolver — never a JSON fixture.
