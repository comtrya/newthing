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
- [ ] Implement the kernel-side `OpsDispatcher` that holds the loaded-component registry and dispatches by `extension_id` — *currently `RegistryDispatcher` validates the target exists but does not invoke the WASM; the real dispatch lands in M5/M6 alongside per-extension typed bindings. Box stays open until dispatch actually routes a call.*
- [ ] Wire `wasm_host::host_state_for_op` into the live request path with real extension id / principal / manifest values
- [x] Parse `manifest.json` fields (`hostImports`, `allowedEmits`, `allowedEventReads`, `allowedCrossCalls`, `reactor.allowedMutations`, `reactor.allowedEmits`, `contributes.resourceKinds`) into `HostManifest` at load time
- [x] Add a JSON Schema for the manifest at `docs/manifest.schema.json` and validate every installed manifest at load
- [x] Enforce the `ids.mint` → `storage.create` registry contract that's currently documented in `storage.wit` but not implemented (per-extension minted-id set, `storage.create` rejects ids not in it)
- [x] Extract a `mint_internal(kind)` helper in `wasm_host.rs` for kernel-initiated mints (`relations.create`, `comments.post`, `events.append`) so the manifest-check / no-manifest-check split is explicit, not implicit at call sites
- [x] Add a build-extension.sh guard that warns if a component crate lacks `.cargo/config.toml` (the file that locks `wasm32-unknown-unknown`); without it, `wasm32-wasip1` leaks WASI imports
- [ ] Integration test: kernel starts, loads `ext_issues.wasm`, calls `close-issue` via the linker, asserts persistence + event emission

## M3 — GraphQL dispatch routing
- [x] Compose the per-extension `dispatch_route_<ext_id>()` functions into one root dispatch table at startup *(done in M2 build.rs)*
- [ ] Codegen emits a parallel `graphql_field_to_route` lookup so the GraphQL handler can map e.g. `closeIssue` → `ext_issues.issues.close-issue`
- [ ] GraphQL mutation/query handler consults the dispatch table first
- [ ] On hit, route to WASM via `host_state_for_op` + linker
- [ ] On miss, fall back to legacy handler (temporary, only through M5)
- [ ] Browser smoke: `closeIssue` mutation fires a real WASM call (log line + storage diff confirms)
- [ ] All 128 existing `start.sh` smoke checks still pass

## M4 — `ext_issues` legacy handlers deleted
- [ ] Audit business logic in existing `issues.*` handlers in `main.rs`; copy any rule not yet in WASM into the component (revalidation, derived fields, event side effects)
- [ ] Persist `close-issue` `reason` field — today the component discards it with `let _ = input.reason;` because no audit-row schema exists; M4 either stores it on the issue record or writes an audit row referencing it
- [ ] Re-verify smoke for issue flows under WASM-only routing
- [ ] Delete every `matches_op` arm for `issues.*` in `main.rs`
- [ ] Delete helper functions exclusive to issues handlers
- [ ] `rg "issues\.close|issues\.open|issues\.reopen" crates/server/src/main.rs` returns zero hits in handler code
- [ ] Update `docs/v3-deletion-inventory.md` — mark items removed

## M5 — `ext_epics`, `ext_pull_requests`, `ext_checks` migrated
- [ ] `ext_epics`: create component crate, implement every op, build WASM
- [ ] `ext_epics`: cut over GraphQL, delete legacy handlers
- [ ] `ext_pull_requests`: create component crate, implement every op, build WASM
- [ ] `ext_pull_requests`: cut over GraphQL, delete legacy handlers
- [ ] `ext_checks`: create component crate, implement every op, build WASM
- [ ] `ext_checks`: cut over GraphQL, delete legacy handlers
- [ ] `rg "epics\.|pull_requests\.|checks\." crates/server/src/main.rs` returns zero hits in handler code
- [ ] Smoke for epic / PR / check flows passes under WASM-only routing
- [ ] Update deletion inventory

## M6 — Reactor + cross-call broker
- [ ] Implement `OpsDispatcher::dispatch` with real WASM-to-WASM routing through the linker
- [ ] Thread `ops_invoke_depth` through dispatcher; enforce cap of 32 across nested calls
- [ ] Enforce manifest `allowedCrossCalls` at dispatch time
- [ ] Implement reactor subscription registration at extension load; route appended events to subscribers
- [ ] `ext_pull_requests` reactor: subscribes to `dev.comtrya.pull-requests.merged`, calls `ext_issues/issues.close-issue` via `ops.invoke`
- [ ] Enforce reactor recursion depth cap of 8; emit `comtrya.kernel.reaction-depth-exceeded` on breach
- [ ] Integration test: merge a PR in demo data, observe issue closure via real cross-extension WASM call
- [ ] Delete `REACTORS` constant + hand-rolled reactor dispatch in `main.rs`
- [ ] Delete Rust `EventEnvelope` / `Reaction` enums (replaced by WIT-generated equivalents)
- [ ] Update deletion inventory

## M7 — Vue 3 shell scaffolding
- [ ] Create `frontend/shell-v3/` — Vite + Vue 3 project
- [ ] Wire workspace deps: `@comtrya/sdk-core`, `@comtrya/sdk-vue`, `@comtrya/sdk-preact`
- [ ] Implement vue-router with routes: `/`, `/r/:groups+/:repo`, `/x/:prefix/:rest*`
- [ ] Implement workspace home layout consuming `slotsFor("workspace.home.*")`
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
