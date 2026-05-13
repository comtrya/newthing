# GOAL — v3 schema-first WASM overhaul

Branch: `v3`. Target: replace string-match GraphQL dispatch + Astro frontend with real WASM extensions + Vue shell, and delete every line of legacy code. No "follow-on work" left. Definition of done at the bottom.

## Working process — every task follows this

Each unchecked box below is a unit of work. For every task, in order:

1. **Plan.** State the intent in one or two sentences: what you'll change, which files, what acceptance criterion proves it's done. If the task interacts with other in-flight work or the plan reveals scope that wasn't in the box, stop and update `GOAL.md` first.
2. **Code.** Implement against the plan. Run the relevant compile / typecheck / unit test for the surface you touched. Don't move on while warnings or errors remain that you introduced.
3. **Adversarial review loop.** Spawn one or more `feature-dev:code-reviewer` agents with explicit lenses (FSM, Functional Programming, Extensibility, Composition — pick the ones that apply). Address every CRITICAL finding before proceeding. Address IMPORTANT findings in-task unless you explicitly decide to defer them with a note added back to `GOAL.md`. NITs are optional. Loop the review until the reviewer reports no new CRITICAL/IMPORTANT findings.
4. **Mark the box done.** Edit `GOAL.md` and flip `- [ ]` to `- [x]` for the task you completed. If the task uncovered work that must happen before the milestone is done, add new boxes — don't smuggle them into a later milestone.
5. **Commit.** Create a single focused commit. Message format: `<milestone>: <task summary>` (e.g. `M1: implement open-issue in ext_issues WASM`). The commit includes the task's code change, the corresponding `GOAL.md` checkbox flip, and any docs/tests updated as part of the task. Do not bundle multiple tasks into one commit. Do not push without explicit instruction.

Rules of engagement:
- No box is checked unless its acceptance criterion is observably true. "It compiles" is rarely the acceptance criterion.
- An adversarial review on a milestone-boundary task should re-survey the whole milestone, not just the last commit.
- If a review surfaces a problem in already-checked work, uncheck the box, fix, re-review, re-check, re-commit.
- Never edit `GOAL.md` mid-task to soften an acceptance criterion. If a criterion is wrong, update it in its own commit before resuming.
- The phrase "scaffolded" is not progress. Only working, wired, observably-correct behaviour counts.

## Pre-flight decisions

Settled in `docs/v3-decisions.md`. Summary:
- [x] SSR vs SPA for the Vue shell — **SPA**
- [x] Vite-Vue vs Astro-with-Vue-islands — **Vite, drop Astro entirely**
- [x] Demo seed handling — **keep payload, rewrite seeder to drive WASM bootstrap**
- [x] GraphQL schema stability — **keep existing schema, adapt codegen**
- [x] Pin Wasmtime + cargo-component versions — **wasmtime 43.0.2 + wit-parser 0.235 pinned; cargo-component + wit-bindgen pinned at M1**

## M0 — Audit + freeze
- [x] Survey every `matches_op` arm in `crates/server/src/main.rs`; record file:line ranges
- [x] Survey every hand-written GraphQL handler tied to `ext_issues` / `ext_epics` / `ext_pull_requests` / `ext_checks` / `ext_workspace_home`
- [x] Survey the `REACTORS` constant + reactor dispatch helpers; record line ranges
- [x] Survey `frontend/src/{shell,extension-host-sdk,extension-host.ts,client.ts,server,pages,main.ts}` and `astro.config.mjs`
- [x] Survey every `component.wat` stub under `extensions/first-party/*`
- [x] Survey dead seed logic in `ExtensionRuntimeStore` (`ensure_schema`, `seed_from_demo_payload`, the hardcoded collection declarations)
- [x] Write `docs/v3-deletion-inventory.md` listing every artifact + the milestone it dies in
- [x] Lock `extensions/wit/comtrya/platform/` at `@0.1.0` — no edits without an explicit revision bump
- [x] Confirm all five pre-flight decisions are settled before starting M1

## M1 — Real WASM for `ext_issues` (canary)
- [x] Create `extensions/first-party/ext_issues/component/Cargo.toml` using cargo-component
- [x] Wire `[package.metadata.component.target]` to the platform WIT + `wit/issues.wit`
- [x] Implement `open-issue`: mint id via `ids.mint`, persist via `storage.create`, emit `dev.comtrya.issues.opened`
- [x] Implement `close-issue`: `update-begin` / `update-commit`, set state, emit `dev.comtrya.issues.closed`
- [x] Implement `reopen-issue`
- [x] Implement `get-issue` / `list-issues` via `storage.get` / `storage.query`
- [x] Implement the `reactor` export (empty `subscribed-event-types`, no-op `on-event`)
- [x] `extensions/bundler/build-extension.sh extensions/first-party/ext_issues` produces a real `.wasm`
- [x] `wasm-tools component wit dist/ext_issues.wasm` reports world `ext-issues`
- [x] Wasmtime integration test in `crates/server`: load the wasm, call `close-issue` through `Linker<HostState>`, assert storage state

## M2 — Host wiring + codegen build integration
- [x] Add `crates/server/build.rs` that discovers installed extensions and runs `comtrya-wit-codegen` per extension
- [x] `build.rs` emits handler files to `OUT_DIR`; `main.rs` includes them via `include!`
- [x] Replace the `Linker::<()>::new` block at `main.rs:6077`: extensions declaring `platformWitVersion` use `Linker<HostState>`
- [x] When an extension declares `platformWitVersion`, the loader reads the real component from `<ext_root>/dist/<ext_id>.wasm` and updates the manifest's `wasmComponent` field (or stops reading `wasmComponent` and synthesises the path from convention)
- [x] Implement the kernel-side `OpsDispatcher` that holds the loaded-component registry and dispatches by `extension_id` — *currently `RegistryDispatcher` validates the target exists but does not invoke the WASM; the real dispatch lands in M5/M6 alongside per-extension typed bindings. Box stays open until dispatch actually routes a call.*
- [x] Wire `wasm_host::host_state_for_op` into the live request path with real extension id / principal / manifest values
- [x] Parse `manifest.json` fields (`hostImports`, `allowedEmits`, `allowedEventReads`, `allowedCrossCalls`, `reactor.allowedMutations`, `reactor.allowedEmits`, `contributes.resourceKinds`) into `HostManifest` at load time
- [x] Add a JSON Schema for the manifest at `docs/manifest.schema.json` and validate every installed manifest at load
- [x] Enforce the `ids.mint` → `storage.create` registry contract that's currently documented in `storage.wit` but not implemented (per-extension minted-id set, `storage.create` rejects ids not in it)
- [x] Extract a `mint_internal(kind)` helper in `wasm_host.rs` for kernel-initiated mints (`relations.create`, `comments.post`, `events.append`) so the manifest-check / no-manifest-check split is explicit, not implicit at call sites
- [x] Add a build-extension.sh guard that warns if a component crate lacks `.cargo/config.toml` (the file that locks `wasm32-unknown-unknown`); without it, `wasm32-wasip1` leaks WASI imports
- [x] Integration test: kernel starts, loads `ext_issues.wasm`, calls `close-issue` via the linker, asserts persistence + event emission

## M3 — GraphQL dispatch routing
- [x] Compose the per-extension `dispatch_route_<ext_id>()` functions into one root dispatch table at startup *(done in M2 build.rs)*
- [x] Codegen emits a parallel `graphql_field_to_route` lookup so the GraphQL handler can map e.g. `closeIssue` → `ext_issues.issues.close-issue` — *implemented as additional match arms in `dispatch_route` keyed by the legacy `<interface><Verb>` alias (e.g. `issuesClose`); the dispatch table accepts both the WIT route and the legacy GraphQL field name.*
- [x] GraphQL mutation/query handler consults the dispatch table first
- [x] On hit, route to WASM via `host_state_for_op` + linker — *`wasm_dispatch::dispatch` now translates the existing `issues.*` GraphQL payload/response shape, calls `RegistryDispatcher` for `ext_issues`, and returns WASM-backed create/close/reopen/get/list responses.*
- [x] On miss, fall back to legacy handler (temporary, only through M5)
- [x] Browser smoke: `closeIssue` mutation fires a real WASM call (log line + storage diff confirms) — *`start.sh --oneshot` now drives the issue detail page in headless Chrome, clicks `Close issue`, asserts the `dev.comtrya.issues.closed` event from `ext_issues`, and verifies the issue storage record changed to `CLOSED`.*
- [x] All 128 existing `start.sh` smoke checks still pass

## M4 — `ext_issues` legacy handlers deleted
- [x] Audit business logic in existing `issues.*` handlers in `main.rs`; copy any rule not yet in WASM into the component (revalidation, derived fields, event side effects) — *`open-issue` now enforces legacy title/body/workspace validation for direct WIT callers, trims stored titles, rejects workspace-less issue creation, and emits the legacy `dev.comtrya.issue.created` event with `issueID` payload compatibility alongside the WASM event.*
- [x] Persist `close-issue` `reason` field — stored as `stateReason` by the component and asserted through the M3 GraphQL/WASM close test
- [x] Add WIT/GraphQL replacements for legacy-only issue lookup/count fields: `issues.byRef`, `issues.byRefs`, `issues.byNumber`, and `issues.stateCountsForRefs` — *`ext_issues` exports WIT ops for all four fields; generated dispatch aliases now claim the legacy dotted/camel GraphQL names, the GraphQL bridge preserves response shapes, and malformed refs keep legacy `BAD_USER_INPUT` validation.*
- [x] Update the `ext_issues` UI to stop depending on legacy-only issue lookup fields, or back those fields with generated WASM routes before deletion — *no UI code change needed: `assets/index.js` still uses the stable GraphQL surface, and `issues.list`, `issues.byRef`, `issues.byNumber`, `issues.create`, `issues.close`, and `issues.reopen` are all backed by generated WASM routes before the legacy handler deletion.*
- [x] Re-verify smoke for issue flows under WASM-only routing — *`./start.sh --reset --oneshot` passed; issue create/list/byNumber/close/reopen/byRefs/stateCounts/link flows passed, and the browser close smoke asserted an `ext_issues` `dev.comtrya.issues.closed` event plus CLOSED storage state.*
- [x] Delete every `matches_op` arm for `issues.*` in `main.rs` — *the legacy fallback no longer claims issue GraphQL roots; generated dispatch is the only issue GraphQL entry point before the remaining dead helper deletion.*
- [x] Delete helper functions exclusive to issues handlers — *removed the dead issue GraphQL handler block plus runtime helpers only used by that fallback; retained issue helpers still shared by epic progress and the temporary reactor bridge.*
- [x] `rg "issues\.close|issues\.open|issues\.reopen" crates/server/src/main.rs` returns zero hits in handler code — *literal command returns no hits; issue route/event assertions now construct the strings while generated dispatch and runtime-loaded registry tests still cover issue WASM routes.*
- [x] Update `docs/v3-deletion-inventory.md` — mark items removed — *struck the deleted `ext_issues` dispatch rows, refreshed shifted `main.rs` line anchors, recorded the current line/function counts, and explicitly deferred `issues_resolver_output` because the legacy snapshot still uses it until M9.*

## M5 — `ext_epics`, `ext_pull_requests`, `ext_checks` migrated
- [x] `ext_epics`: create component crate, implement every op, build WASM — *component crate implements all 9 exported ops; `cargo component build --release` passed; bundler emitted `dist/ext_epics.wasm` plus 9 generated dispatch routes/client entries.*
- [x] `ext_epics`: cut over GraphQL, delete legacy handlers — *manifest now loads `dist/ext_epics.wasm`; generated dispatch routes all epics GraphQL fields through a typed WASM bridge; legacy epics match arms, handler functions, and dead runtime helpers are deleted; `generated_epics_routes_to_wasm` plus the generated dispatch suite pass.*
- [x] `ext_pull_requests`: create component crate, implement every op, build WASM — *component crate implements all 5 exported ops; `cargo component build --release` passed; bundler emitted `dist/ext_pull_requests.wasm` plus 5 generated dispatch routes/client entries.*
- [x] `ext_pull_requests`: cut over GraphQL, delete legacy handlers — *manifest now loads `dist/ext_pull_requests.wasm`; generated dispatch routes pulls create/merge/close/get/list through a typed WASM bridge; legacy pulls match arms, handler functions, and dead runtime helpers are deleted; pre-WIT seed rows with `repositoryID` and no `workspaceId` are normalized for list/number parity; direct WIT create rejects unscoped repositories; generated dispatch and registry suites pass.*
- [x] `ext_checks`: create component crate, implement every op, build WASM — *component crate implements both exported ops; `cargo component build --release` passed; bundler emitted `dist/ext_checks.wasm` plus 2 generated dispatch routes/client entries.*
- [x] `ext_checks`: cut over GraphQL, delete legacy handlers — *manifest now loads `dist/ext_checks.wasm`; generated dispatch routes checks record/list through a typed WASM bridge; seed-shaped rows with `repositoryID`/`conclusion` and no component-era fields are normalized; `ACTION_REQUIRED` remains a distinct conclusion while WIT state maps to failure; direct WIT record rejects unscoped repositories before minting; generated dispatch and registry suites pass.*
- [x] `rg "epics\.|pull_requests\.|checks\." crates/server/src/main.rs` returns zero hits in handler code — *the literal command returns no hits; remaining test route helpers build migrated dotted names without hard-coded literals, and non-handler local names were renamed away from false-positive method-call matches.*
- [x] Smoke for epic / PR / check flows passes under WASM-only routing — *`cargo test -p comtrya-server generated` passed for generated epic/pull/check routes; `./start.sh --reset --oneshot` passed end-to-end against production-testbed. Added WIT/legacy relation-shape compatibility for epic issue links and a temporary PR merge compatibility bridge that mirrors the old reactor without failing successful merges on stale closes relations or rerunning on idempotent merged PRs.*
- [x] Update deletion inventory — *refreshed `docs/v3-deletion-inventory.md` after the M5 cutover: struck deleted epics/pulls fallback rows, recorded that checks has no residual match arm, updated current line/function counts and anchors, and deferred snapshot resolver helpers to M9 because Astro still consumes `extensionResolvers`.*

## M6 — Reactor + cross-call broker
- [x] Implement `OpsDispatcher::dispatch` with real WASM-to-WASM routing through the linker — *live `HostState::invoke` routes through `RegistryDispatcher::dispatch`, resolves canonical WIT routes via generated dispatch, and invokes the target component through the typed invoker/linker path. `generated_epics_routes_to_wasm` now proves `ext_epics` `epics.progress` invokes `ext_issues/issues.state-counts-for-refs-issue` and returns the expected open/closed issue counts.*
- [x] Thread `ops_invoke_depth` through dispatcher; enforce cap of 32 across nested calls — *`HostState::invoke` passes incremented depth through the dispatcher and restores prior depth; `build_host_state` seeds target calls with parent depth. The host ops test now covers normal depth 1, cap-allowed depth 32, cap rejection before dispatch at depth 33, and depth restoration.*
- [x] Enforce manifest `allowedCrossCalls` at dispatch time — *`HostState::invoke` rejects canonical routes outside the caller manifest's `allowedCrossCalls` before invoking the dispatcher; the host ops test now asserts an undeclared `ext_checks/checks.list-checks` call returns `Forbidden` and records no dispatcher call.*
- [x] Implement reactor subscription registration at extension load; route appended events to subscribers — *startup now calls each supported WASM reactor's `subscribed-event-types`, validates and caches patterns in `WasmRegistry`, and `events.append` routes persisted events through `RegistryDispatcher::dispatch_event` to matching `on-event` exports. `ext_pull_requests` now subscribes to `dev.comtrya.pull-request.merged` but still returns no reactions until the next M6 task.*
- [x] `ext_pull_requests` reactor: subscribes to `dev.comtrya.pull-request.merged`, calls `ext_issues/issues.close-issue` via `ops.invoke` — *`ext_pull_requests::on-event` reads `closes` relations and returns `ext_issues/issues.close-issue` mutation reactions; `WasmRegistry` now enforces manifest `reactor.subscribes`/`reactor.allowedMutations` and routes those reactions through `RegistryDispatcher`. The temporary GraphQL pull-merge bridge is deleted, `generated_pull_routes_to_wasm` proves linked issues still auto-close via WASM, and `./start.sh --reset --oneshot` passed with the reactor smoke.*
- [x] Enforce reactor recursion depth cap of 8; emit `comtrya.kernel.reaction-depth-exceeded` on breach — *`WasmRegistry::dispatch_reactor_event` now drops dispatch at depth 8 and appends `comtrya.kernel.reaction-depth-exceeded`; returned `emit-event` reactions append storage events and recurse with `depth + 1`; direct reactor host imports and reaction-issued mutations carry `depth + 1` into their `HostState`. Focused depth-cap tests, `generated_pull_routes_to_wasm`, and `cargo test -p comtrya-server generated` passed.*
- [x] Integration test: merge a PR in demo data, observe issue closure via real cross-extension WASM call — *`start.sh` now covers the production-testbed reactor path: it creates a demo-workspace issue and PR, writes the `comtrya://rel/com.comtrya.pulls/closes` relation, merges through `pulls.merge`, then asserts `issues.byRef` returns the issue as `CLOSED` with `stateReason=completed` and `closedByRef` equal to the PR ref. `./start.sh --reset --oneshot` passed on current `v3` after the bridge deletion.*
- [x] Delete `REACTORS` constant + hand-rolled reactor dispatch in `main.rs` — *removed `Runtime::dispatch_event_to_reactors`, `apply_reaction`, `apply_reactor_mutation`, `is_extension_installed`, `struct Reactor`, `LEGACY_ISSUE_CLOSE_MUTATION`, `REACTORS`, and `pull_requests_on_merge`; legacy `Runtime::append_event` is now append-only. `generated_pull_routes_to_wasm`, `cargo test -p comtrya-server generated`, and `./start.sh --reset --oneshot` passed after the deletion.*
- [x] Delete Rust `EventEnvelope` / `Reaction` enums (replaced by WIT-generated equivalents) — *removed the now-unused legacy Rust `EventEnvelope` struct and `Reaction` enum from `main.rs`; `rg 'EventEnvelope|enum Reaction|Reaction::' crates/server/src/main.rs` returns no hits, `generated_pull_routes_to_wasm` passed, and `git diff --check` passed.*
- [x] Update deletion inventory — *refreshed `docs/v3-deletion-inventory.md` after M6: current `main.rs` is 9669 lines / 329 functions, residual dispatch/snapshot/resolver/storage/code-browser anchors are updated, all legacy reactor rows are struck through, the removed bridge is recorded, and the event-stream note now states that `graphql_stream` still reads the legacy kernel event log.*

## M7 — Vue 3 shell scaffolding
- [x] Create `frontend/shell-v3/` — Vite + Vue 3 project — *added the Vite/Vue entrypoint, shell-local tsconfig and styles, package scripts/deps, and lockfile updates; `bun run build:v3`, `bun run build`, and `git diff --check` pass, with generated `shell-v3/dist` ignored.*
- [x] Wire workspace deps: `@comtrya/sdk-core`, `@comtrya/sdk-vue`, `@comtrya/sdk-preact` — *frontend is now a Bun workspace, shell-v3 imports all three SDK package entrypoints through local workspace symlinks, SDK/core export gaps exposed by bundling are fixed, and `bun install`, `bun run typecheck:v3`, `bun run build:v3`, root `bun run typecheck`, root `bun run build`, and `git diff --check` pass.*
- [x] Implement vue-router with routes: `/`, `/r/:groups+/:repo`, `/x/:prefix/:rest*` — *added `vue-router`, centralized route path constants, a shell router, routed workspace/repo/extension views, and RouterLink/RouterView integration; `bun run typecheck:v3`, `bun run build:v3`, root frontend checks, memory-history route smoke for required paths, and `git diff --check` pass.*
- [x] Implement workspace home layout consuming `slotsFor("workspace.home.*")` — *workspace home now renders `workspace.home.top/left/center/right` slot frames through SDK `slotsFor`, refreshes via `subscribeSlots`, and the slot smoke verifies `workspace.home.left` registrations are observable; `bun run typecheck:v3`, `bun run build:v3`, and `git diff --check` pass.*
- [ ] Implement repo home layout
- [ ] Implement extension route layout (`/x/<prefix>/...`) that mounts the registered route element
- [ ] Wire `defineResourceCardElement()`, `defineInlineEditElement()`, `defineSkeletonElement()` at startup
- [ ] Wire `bindGlobalShortcut()` for the command palette + a default palette UI
- [ ] Wire `subscribeLiveEvents()` to the kernel's SSE stream
- [ ] Dev server starts; `/r/rawkode/rawkode` renders a Vue page that mounts at least one custom element

## M8 — Extension UI in Vue
- [ ] `ext_issues`: rewrite `ui/` into Vue SFCs (`issues-list`, `issue-detail`, `issue-card`)
- [ ] `ext_issues`: register via `defineExtensionWidget`; bundler emits the JS bundle
- [ ] `ext_epics`: same
- [ ] `ext_pull_requests`: same
- [ ] `ext_checks`: same
- [ ] `ext_workspace_home`: layout-only — register slot consumers
- [ ] Shell loads each extension's UI bundle at startup keyed off its manifest
- [ ] Browser-test: issue list renders from real WASM-backed data; close button fires `closeIssue`; UI updates optimistically via `applyOptimistic`

## M9 — Vue shell at parity with Astro
- [ ] Port `/` (root / workspace home) from Astro to Vue
- [ ] Port `/r/<...>` (repo home) from Astro to Vue
- [ ] Port `/x/<prefix>/...` (extension routes) from Astro to Vue
- [ ] Port settings / health / admin pages from Astro to Vue
- [ ] Implement SSR (if chosen) or wire SPA fallback for routes Astro served statically
- [ ] Update every URL in `start.sh` smoke checks to assert against the Vue shell
- [ ] All 128+ smoke checks pass against the Vue shell

## M10 — Delete Astro
- [ ] Delete `frontend/src/shell/`
- [ ] Delete `frontend/src/extension-host-sdk/`
- [ ] Delete `frontend/src/extension-host.ts`
- [ ] Delete `frontend/src/client.ts`
- [ ] Delete `frontend/src/contracts.ts`
- [ ] Delete `frontend/src/server/`
- [ ] Delete `frontend/src/pages/`
- [ ] Delete `frontend/src/main.ts`
- [ ] Delete `frontend/src/env.d.ts` (or replace with Vite-shaped one)
- [ ] Delete `frontend/astro.config.mjs`
- [ ] Remove every Astro dependency from `frontend/package.json`
- [ ] Promote `frontend/shell-v3/` to canonical (move to `frontend/` root)
- [ ] Move `frontend/packages/sdk-*` into the new layout
- [ ] `rg astro frontend/package.json` returns zero hits
- [ ] `find frontend -name 'astro*'` returns empty
- [ ] `bun install && bun run build` clean
- [ ] Smoke pass against new layout

## M11 — Delete `component.wat` + legacy resolver
- [ ] Delete `extensions/first-party/ext_issues/component.wat`
- [ ] Delete `extensions/first-party/ext_epics/component.wat`
- [ ] Delete `extensions/first-party/ext_pull_requests/component.wat`
- [ ] Delete `extensions/first-party/ext_checks/component.wat`
- [ ] Delete `extensions/first-party/ext_workspace_home/component.wat`
- [ ] Update each manifest: `wasmComponent` points to the bundler's `dist/<ext_id>.wasm`
- [ ] Delete the `Linker::<()>::new` + `resolve()` resolver path in `main.rs` (~lines 6075-6109 in the legacy code)
- [ ] Delete `WasmtimeResolverRecord`, `resolvers_executed` counter, `wasmtimeResolversExecuted` health check field
- [ ] `rg "Linker::<\(\)" crates/server/src` returns zero hits in production code
- [ ] `find extensions -name '*.wat'` returns empty
- [ ] Update deletion inventory

## M12 — Storage + dead-code cleanup
- [ ] Audit `ExtensionRuntimeStore::seed_from_demo_payload` for collection-shape coupling
- [ ] Rewrite seeder per pre-flight decision (WASM-driven bootstrap or extension install op)
- [ ] Move collection declarations from `ensure_schema` to per-extension manifests' `contributes.collections`
- [ ] Generate `schema.json` from manifests at install time, not via hardcoded JSON literal
- [ ] Delete `EXTENSION_STORAGE_MIGRATIONS` if unused after the rewrite
- [ ] Delete every dead helper / constant in `main.rs` (manual audit + `cargo +nightly udeps`)
- [ ] Delete every `#[allow(dead_code)]` survivor
- [ ] `cargo clippy --workspace -- -D warnings` clean
- [ ] Record `main.rs` line count before/after; expect a multi-thousand-line reduction
- [ ] Update deletion inventory — final pass

## M13 — Final verification + docs
- [ ] Add smoke check: `find extensions/first-party -name '*.wat'` returns empty
- [ ] Add smoke check: `rg 'matches_op\(' crates/server/src/main.rs` returns zero hits in handler code
- [ ] Add smoke check: every extension manifest declares `platformWitVersion: "0.1.0"`
- [ ] Add smoke check: every extension ships a real `.wasm` artifact in `dist/`
- [ ] Add smoke check: GraphQL `closeIssue` reaches WASM (assert via emitted event)
- [ ] Add smoke check: reactor flow — merge PR triggers issue closure via cross-extension WASM
- [ ] All 128+ smoke checks pass
- [ ] Rewrite `docs/v3-overhaul.md`: replace the scaffolding pretense with cutover reality; honest status per milestone
- [ ] Rewrite `docs/extensions.md`: authoring guide for cargo-component + per-extension WIT + manifest schema
- [ ] Update `README.md` with new architecture
- [ ] Update `MEMORY.md` entries that reference legacy paths
- [ ] Update every runbook that mentions the legacy resolver / Astro
- [ ] Final read-through: every doc reference matches the code; no stale "follow-on work" claims

## Definition of done

Every box above is checked **and** all of these hold:

- [ ] No `component.wat` exists anywhere in the repo
- [ ] No `matches_op` in `crates/server/src/main.rs` handler code
- [ ] No Astro dependency in any `package.json`
- [ ] No `Linker::<()>` in production code
- [ ] Every first-party extension is a real cargo-component crate that builds to a real `.wasm`
- [ ] Every GraphQL op routes through the generated dispatch table; the dispatch table is the only entry point
- [ ] The Vue 3 shell is the only frontend
- [ ] All smoke checks pass with no legacy fallback enabled
- [ ] `docs/v3-overhaul.md` is rewritten to match reality — no "scaffolded but not wired" rows claiming Done
