# `proto` spec vs `comtrya` implementation — gap analysis

This maps the `proto` umbrella architecture spec ("A Git-Native, Single-Binary
Forge") onto the current `comtrya` codebase. Status legend: ✅ aligned ·
🟡 partial / different shape · ❌ divergent or missing.

> **Naming:** the spec calls the product `proto`; this repo is `comtrya`.
> (Spec open decision #1 — keep `proto` or rename — is unresolved.)

## Defining principles (the spec's headline claims)

| Principle | Reality in `comtrya` | Status |
|---|---|---|
| Single binary | `comtrya-server` binary | ✅ |
| **No central database** | central `comtrya.db` SQLite (`crates/server/src/persistence.rs`) **plus** a per-extension `documents.jsonl` document store | ❌ **violated** |
| Everything configured through git | GitOps config repo synced + reconciled (`config_sync`, `reconcile`), but config is **CUE** (`cuengine 0.40`, `comtrya.cue`), not TOML | 🟡 |
| Pure-Rust git transport, no `git` binary | smart-HTTPS on gix (`crates/git-http`); the env-gated subprocess backend was removed; push (receive-pack) now implemented | ✅ (HTTPS only) |

## Part A — architecture spec

### A2 On-disk layout
Spec wants `admin/`, `repos/<name>.git/`, `extensions/blobs|manifests`, `state/<ext>/<repo>.db`, `config-snapshot.json`.
`comtrya` uses a config repo + bare repos + `extensions/storage/{documents,events}.jsonl` + a single `comtrya.db`. **🟡 different layout; no per-ext×repo `.db` files.**

### A3 Component map
- Core + reconcile — `crates/core`, `crates/server` (config_sync/reconcile). 🟡 present, CUE-shaped.
- Git hosting — `crates/git-http` (HTTPS). **No SSH (russh).** 🟡
- Web UI (browse) — Vue/Vite SPA (`frontend/`), not server-rendered `maud`/`askama`. 🟡 richer/different.
- WASM host — `crates/server/src/wasm_host.rs` (`wasmtime 43`, component-model). ✅
- Extension dispatch — generated dispatch + `/api/ops` (`wasm_invokers`, `wasm_registry`). ✅
- GraphQL gateway — **kernel-owned GraphQL only**, no federation. ❌ (see A7)
- First-party extensions — `ext_issues/epics/pull_requests/checks/docs/workspace_home`. ✅ **ahead** of the spec's Issues→PRs→Epics.

### A4 Configuration model
Spec: TOML **admin repo** (identities, teams, repo catalog, permission grants, argon2id PAT hashes, extension registry) + per-repo `.forge/config.toml`.
`comtrya`: CUE instance config evaluated by `cuengine`; a config git repo synced via `config_sync`; reconcile applies it. **🟡 same GitOps intent, different format and a different desired-state shape.** No `.forge/config.toml` per-repo concept.

### A5 Auth & secrets
- SSH pubkeys in git → ❌ no SSH transport / key auth.
- argon2id PATs in git → ❌ no `argon2` dep, no PAT minting.
- OIDC web login → ✅ `crates/server/src/oidc.rs` (+ `email_verified` hardening this session).
- Forge-local secrets (session key, OIDC client secret) → 🟡 partially (OIDC config in CUE; secret handling exists).

### A6 WASM extension contract (WIT world)
Spec sketch (db/git-read/http-types/registration + init/handle-route/handle-hook/run-job/render-slot/graphql-resolve).
`comtrya` WIT (`extensions/wit/comtrya/platform/*.wit`): `storage`, `events`, `reactor`, `ops`, `relations`, `comments`, `ids`, `identity`, `time`, `log`. **🟡 conceptually aligned but a different surface** — storage is the kernel JSONL store (not raw libSQL `db` resources), reactions are the `reactor`/`on-event` model (not `handle-hook`), and there is **no `graphql-resolve` export** (consistent with kernel-only GraphQL). No `register-route`/`render-slot`/`run-job` host imports.

### A7 GraphQL federation — **direct conflict**
Spec: every extension emits Fed-v2 subgraph SDL; host composes (`graphql-composition`) and plans (Hive Router) a supergraph; custom WASM executor runs the plan into `graphql-resolve`.
`comtrya`: `GOAL.md`/`SPEC.md` state **"GraphQL is reserved for kernel-owned fields"**; extensions are reached via WIT ops at `/api/ops`. The `ExtensionHost` + `GraphqlComposer` SDL-composition path was **deleted** in the quality sweep (recoverable from git history on `chore/thermo-nuclear-quality-review`).
**❌ The spec and the current code are opposite.**
**Decision taken: rebuild federation per the spec.** Consequences:
- `GOAL.md`/`SPEC.md` must be rewritten (kernel-only-GraphQL is no longer the north star).
- The deleted composition scaffolding should be restored/rebuilt, plus `graphql-composition` (Grafbase) + Hive Router query-planner adopted, plus a `graphql-resolve` WIT export added and a custom plan executor written. This is the SP6 build (largest single piece) and warrants its own spec→plan→build cycle and a build-time spike (planner-as-crate, plan-IR-drives-executor, join-spec dialect compatibility).
- No `apollo-federation`/`harmonizer` at runtime (per spec).

### A8 WASM runtime policy
Spec: per-request instantiation + pooling allocator, **epoch interruption**, `ResourceLimiter`, async host fns.
`comtrya`: `wasmtime 43`, **fuel-based** per-invocation CPU budget (`WASM_PER_INVOCATION_FUEL`, `consume_fuel`), sandboxed engine, async host calls. **🟡 valid alternative; the specific knobs differ** (fuel vs epoch; no explicit pooling allocator / `ResourceLimiter` observed). Decide whether to standardize on the spec's epoch+pooling or keep fuel.

### A9 Git serving — pure Rust
- Reads (browse/diff/refs) — ✅ via gix in `git-http`/server.
- `upload-pack` (fetch/clone) — ✅ implemented (`pack.rs` plan + stream; annotated-tag fix this session).
- `receive-pack` (push) — ✅ **implemented this session** (PR #124): pack ingest (`gix::odb::pack::Bundle`), connectivity, atomic `gix::refs` transaction with CAS + fast-forward, report-status. Server gate via `git:write`.
- SSH transport (russh) — ❌ missing; spec wants the same responder core driven by SSH + HTTPS.
- In-process hooks — 🟡 reactor exists; receive-pack pre/post hooks + ref-update events tracked in #125.
- No `git` binary — ✅ (subprocess backend removed).

### A10 Decomposition / build order
1 core+reconcile 🟡 · 2 git hosting 🟡 (HTTPS done incl. push; SSH missing) · 3 web UI 🟡 (SPA) · 4 WASM host ✅ · 5 dispatch ✅ · 6 federation ❌ (to build) · 7 first-party ✅ (ahead).

## Part B — sub-project 1 (core + reconcile)
The spec's SP1 (TOML admin repo, `DesiredState`, identities/teams/grants, tombstone deletion, `ArcSwap` snapshot, argon2 PATs, `forge admin init`/`reconcile` CLI) is **🟡 partially present in a different form**: `comtrya` reconciles a CUE config repo and has a reconcile/diff/apply path, but the identity/team/grant/permission-resolution model, tombstone deletion, and argon2 PATs are **not** built as specified. The CLI is `comtrya` (CUE generate/validate), not `forge admin init|reconcile|hook`.

## Biggest decisions / forks
1. **GraphQL: federation (DECIDED — rebuild)** → rewrite GOAL.md, SP6 build + spike.
2. **No-central-DB + per-extension libSQL** vs current `comtrya.db` + JSONL — unresolved (gap report only; no migration started).
3. **Config: TOML admin-repo model** vs current CUE — unresolved fork.
4. **SSH transport** — not started.
5. **Auth model** (SSH-key + argon2 PAT + admin-repo identities) — not started; OIDC done.
6. **Runtime policy** (epoch+pooling vs fuel) — minor; decide for consistency.

## Where this session's work lands on the spec
- ✅ Advanced: git push (A9/SP2), OCI hardening + keep (A3), subprocess removal (A9), the whole quality baseline (clippy `-D warnings --all-targets`, tests green).
- ⚠️ Against the new north star: deleting the extension GraphQL SDL composition (aligned with old GOAL.md, opposite of spec A7) — to be rebuilt.
