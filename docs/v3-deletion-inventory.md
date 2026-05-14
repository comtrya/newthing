# v3 deletion inventory

Every artifact slated for removal during the v3 cutover, with the milestone that retires it. Updated as each milestone deletes its rows.

Baseline at audit: `crates/server/src/main.rs` is **8983 lines / 337 functions**. Current after the M12 cleanup: **9811 lines / 333 functions**. M12's cleanup slice reduced `main.rs` from **9883 lines / 341 functions** at `6df5e68` to **9811 lines / 333 functions**; the net increase from M11 is the manifest-driven storage/bootstrap runtime and tests added in the same milestone.

## Dispatch — former `matches_op` arms in `crates/server/src/main.rs`

The audit listed 29 hand-written string-match arms. By M12, `matches_op` itself is deleted and `graphql_post` routes by one parsed root field: generated WASM dispatch first, then the residual kernel-owned fallback roots (`createRepository`, `relations.*`, `comments.*`) via a direct `match` in `main.rs:1472–1519`. The 8 `ext_issues`, 8 `ext_epics`, and 3 `ext_pull_requests` rows are struck through below. `ext_checks` had no residual string-match arms by M5; its GraphQL record/list fields route through generated WASM dispatch.

| Op | Arm line | Handler fn | Handler lines | Owner | Dies in |
|----|---------:|-----------|--------------:|-------|---------|
| `createRepository` | 1488 | `create_repository_mutation` | 1967–2046 | core | retained as kernel-owned fallback after generated dispatch miss |
| `relations.create` | 1489 | `relations_create_mutation` | 1789–1830 | kernel | retained as kernel-owned fallback; WIT host relation imports back extension calls |
| `relations.delete` | 1492 | `relations_delete_mutation` | 1832–1862 | kernel | retained, see above |
| `relations.outgoing` | 1495 | `relations_outgoing_query` | 1864–1895 | kernel | retained, see above |
| `relations.incoming` | 1498 | `relations_incoming_query` | 1897–1928 | kernel | retained, see above |
| `relations.between` | 1501 | `relations_between_query` | 1930–1965 | kernel | retained, see above |
| `comments.thread` | 1504 | `comments_thread_query` | 1623–1653 | kernel | retained as kernel-owned fallback; WIT host comment imports back extension calls |
| `comments.create` | 1507 | `comments_create_mutation` | 1655–1699 | kernel | retained, see above |
| `comments.update` | 1510 | `comments_update_mutation` | 1701–1742 | kernel | retained, see above |
| `comments.delete` | 1513 | `comments_delete_mutation` | 1744–1787 | kernel | retained, see above |
| ~~`issues.create`~~ | ~~2251~~ | ~~`issues_create_mutation`~~ | ~~2680–2735~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.close`~~ | ~~2254~~ | ~~`issues_close_mutation`~~ | ~~2736–2765~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.reopen`~~ | ~~2257~~ | ~~`issues_reopen_mutation`~~ | ~~2766–2791~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.list`~~ | ~~2260~~ | ~~`issues_list_query`~~ | ~~2792–2811~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.byRefs`~~ | ~~2263~~ | ~~`issues_by_refs_query`~~ | ~~2857–2878~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.byRef`~~ | ~~2266~~ | ~~`issues_by_ref_query`~~ | ~~2812–2856~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.byNumber`~~ | ~~2269~~ | ~~`issues_by_number_query`~~ | ~~2879–2908~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.stateCountsForRefs`~~ | ~~2272~~ | ~~`issues_state_counts_query`~~ | ~~2909–2930~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`epics.create`~~ | ~~2160~~ | ~~`epics_create_mutation`~~ | ~~2467–2527~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`epics.changeState`~~ | ~~2163~~ | ~~`epics_change_state_mutation`~~ | ~~2529–2563~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`epics.list`~~ | ~~2166~~ | ~~`epics_list_query`~~ | ~~2565–2596~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`epics.byRefs`~~ | ~~2169~~ | ~~`epics_by_refs_query`~~ | ~~2649–2677~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`epics.byRef`~~ | ~~2172~~ | ~~`epics_by_ref_query`~~ | ~~2598–2647~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`epics.progress`~~ | ~~2175~~ | ~~`epics_progress_query`~~ | ~~2679–2709~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`epics.issuesIn`~~ | ~~2178~~ | ~~`epics_issues_in_query`~~ | ~~2711–2741~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`epics.childrenOf`~~ | ~~2181~~ | ~~`epics_children_of_query`~~ | ~~2743–2773~~ | ext_epics | ~~**M5**~~ deleted in M5 |
| ~~`pulls.create`~~ | ~~2184~~ | ~~`pulls_create_mutation`~~ | ~~2196–2252~~ | ext_pull_requests | ~~**M5**~~ deleted in M5 |
| ~~`pulls.merge`~~ | ~~2187~~ | ~~`pulls_merge_mutation`~~ | ~~2254–2291~~ | ext_pull_requests | ~~**M5**~~ deleted in M5 |
| ~~`pulls.close`~~ | ~~2190~~ | ~~`pulls_close_mutation`~~ | ~~2293–2326~~ | ext_pull_requests | ~~**M5**~~ deleted in M5 |

The dispatch block itself (`graphql_post` body, lines 1472–1521) was rewritten in **M3** to consult the generated dispatch table first, and **M12** deleted the `matches_op` substring helper entirely. `rg 'matches_op\(' crates/server/src/main.rs` returns zero hits.

## Legacy GraphQL snapshot path

These power the Astro frontend's monolithic snapshot rendering. They go away when the Vue shell stops consuming the snapshot.

| Item | Line | Notes | Dies in |
|------|-----:|-------|---------|
| `fn graphql_response` | 2048 | Catch-all that returns the whole-kernel demo snapshot when no op matches. Vue still uses focused fields from this response for retained kernel surfaces. | retained until M13 final docs/smoke cleanup |
| `Runtime::demo_payload` (its caller) | 949 | Builds the monolithic payload from runtime state + seeded extension docs, but now uses `extension_runtime_payload()` instead of resolver branches. | retained until M13 final docs/smoke cleanup |
| ~~`fn extension_resolver_payload`~~ | ~~1074~~ | ~~Legacy resolver dispatch switched on `"ext_pull_requests"`, `"ext_checks"`, `"ext_epics"`, `"ext_issues"`, and `"ext_code_browser"` for Astro's snapshot `extensionResolvers`.~~ | ~~**M11**~~ deleted in M11 |
| `fn graphql_stream` | 2230 | SSE stream still reads the legacy kernel event log via `Runtime::read_events`; WIT storage events are separate until the frontend/event-stream cleanup. | retained for now |

## Resolver helpers tied to deleted handlers

| Item | Line | Used by | Dies in |
|------|-----:|---------|---------|
| ~~`fn code_browser_resolver_output`~~ | ~~3609~~ | ~~`extension_resolver_payload` for `"ext_code_browser"`~~ | ~~**M11**~~ deleted in M11; code browsing now lives in the Vue core widget |
| ~~`fn pull_request_resolver_output`~~ | ~~3630~~ | ~~`extension_resolver_payload` for `"ext_pull_requests"` + the legacy snapshot~~ | ~~**M11**~~ deleted in M11 |
| ~~`fn checks_resolver_output`~~ | ~~3661~~ | ~~`extension_resolver_payload` for `"ext_checks"` + the legacy snapshot~~ | ~~**M11**~~ deleted in M11 |
| ~~`fn epics_resolver_output`~~ | ~~3682~~ | ~~`extension_resolver_payload` for `"ext_epics"` + the legacy snapshot~~ | ~~**M11**~~ deleted in M11 |
| ~~`fn issues_resolver_output`~~ | ~~3714~~ | ~~legacy snapshot~~ | ~~**M11**~~ deleted in M11 |
| ~~`struct CheckSummary`~~ | ~~3747~~ | ~~`checks_resolver_output` + `pull_request_resolver_output`~~ | ~~**M11**~~ deleted in M11 |
| ~~`fn check_summary`~~ | ~~3754~~ | ~~same~~ | ~~**M11**~~ deleted in M11 |

M4 deleted the `issues.*` GraphQL dispatch arms and their handler-only helpers. M5 deleted the `epics.*` and `pulls.*` GraphQL dispatch arms and their handler-only helpers. M11 deleted the residual snapshot resolver helpers after the Vue shell stopped consuming `extensionResolvers`.

## Reactor — hand-rolled in-process dispatch

Everything in this section is replaced by real WASM reactors in **M6**.

| Item | Line | Notes |
|------|-----:|-------|
| ~~`Runtime::dispatch_event_to_reactors`~~ | ~~1358~~ | ~~walks `REACTORS` per event; hand-rolled depth tracking~~ deleted in M6 |
| ~~`pub struct EventEnvelope`~~ | ~~3239~~ | ~~replaced by WIT-generated `types::event`~~ deleted in M6 |
| ~~`pub enum Reaction`~~ | ~~3244~~ | ~~replaced by WIT-generated `reactor::reaction`~~ deleted in M6 |
| ~~`struct Reactor`~~ | ~~3249~~ | ~~replaced by extension manifest `reactor.*` + real WASM `on-event` export~~ deleted in M6 |
| ~~`const REACTORS`~~ | ~~3263~~ | ~~hardcoded `ext_pull_requests` auto-close-on-merge wired in code~~ deleted in M6 |
| ~~`fn pull_requests_on_merge`~~ | ~~3271~~ | ~~reimplemented inside `ext_pull_requests` WASM in M6~~ deleted in M6 |

M6 deleted every row in this section. `rg 'REACTORS|dispatch_event_to_reactors|EventEnvelope|enum Reaction|struct Reactor|pull_requests_on_merge|bridge_legacy_pull' crates/server/src` returns no hits. M5 added a temporary `wasm_dispatch::bridge_legacy_pull_side_effects` compatibility bridge so generated `pulls.merge` kept the old auto-close behaviour while WIT events did not dispatch reactors; M6 removed that bridge once `ext_pull_requests` could return real WASM reactor mutations and the registry could route them through the cross-extension dispatcher.

## Legacy resolver path

| Item | Line | Notes |
|------|-----:|-------|
| ~~`struct WasmtimeResolverRecord`~~ | ~~278~~ | ~~dies in **M11**~~ deleted in M11; replaced by `ExtensionRuntimeRecord` |
| ~~Legacy `Linker::<()>::new` block~~ | ~~4974~~ | ~~dies in **M11**~~ deleted in M11 |
| ~~`_platform_linker_check` placeholder call~~ | ~~6132~~ | deleted before this M4 inventory refresh; platform WIT extensions now register through `wasm_registry` |
| ~~`let func = instance.get_typed_func::<(), (u32,)>(..., resolver)`~~ | ~~4985~~ | ~~dies with the resolver path in **M11**~~ deleted in M11 |
| ~~Health-check field `wasmtimeResolversExecuted`~~ | ~~444~~ | ~~dies in **M13** when the smoke harness asserts the WASM path directly~~ deleted in M11 alongside the resolver counter |

## Component stubs (Component-Model `.wat`)

All five died in **M11** once the manifests pointed at the real `.wasm` artifact produced by the bundler.

- ~~`extensions/first-party/ext_issues/component.wat`~~ deleted in M11
- ~~`extensions/first-party/ext_epics/component.wat`~~ deleted in M11
- ~~`extensions/first-party/ext_pull_requests/component.wat`~~ deleted in M11
- ~~`extensions/first-party/ext_checks/component.wat`~~ deleted in M11
- ~~`extensions/first-party/ext_workspace_home/component.wat`~~ deleted in M11; replaced by a cargo-component crate plus `dist/ext_workspace_home.wasm`

## Astro frontend

All under `frontend/`. Dies in **M10**; the Vue shell built in M7–M9 replaces it.

Source:
- `frontend/astro.config.mjs`
- `frontend/src/shell/` — `chrome.ts`, `dom.ts`, `extension-loader.ts`, `page-ext.ts`, `page-home.ts`, `page-new.ts`, `page-repo.ts`, plus `core-widgets/`
- `frontend/src/extension-host-sdk/` — `card-registry.ts`, `define-extension.ts`, `host-facade.ts`, `index.ts`, `manifest.ts`, `slot-registry.ts`, `types.ts`
- `frontend/src/extension-host.ts`
- `frontend/src/client.ts`
- `frontend/src/contracts.ts`
- `frontend/src/main.ts`
- `frontend/src/env.d.ts` (replaced with a Vite-shaped one)
- `frontend/src/server/` (Astro server entry)
- `frontend/src/pages/` — `[...path].ts` (API proxy with `ALLOWED_PREFIXES`; needs a Vue-side counterpart), `index.astro`, `instance.astro`, `new.astro`, plus `r/`, `x/` route trees
- Every Astro-related dependency in `frontend/package.json` (`astro`, `@astrojs/node`)

Tests (port the surviving semantics to the Vue shell tests before deleting):
- `frontend/src/extension-host-sdk/card-registry.test.ts`
- `frontend/src/extension-host-sdk/define-extension.test.ts`
- `frontend/src/extension-host-sdk/host-facade.test.ts`
- `frontend/src/extension-host-sdk/manifest.test.ts`
- `frontend/src/extension-host-sdk/slot-registry.test.ts`
- `frontend/src/shell/dom.test.ts`

Retained:
- `frontend/packages/sdk-{core,vue,preact}` — moves into the new layout
- `frontend/src/styles.css` — moves into the new layout

## Storage seed coupling

These items in `ExtensionRuntimeStore` hardcoded the old collection shapes. M12 rewrote the schema source of truth to manifest declarations plus typed core declarations, and extension-owned demo records now bootstrap through WASM create operations before the demo metadata is merged back into storage.

| Item | Line | Notes |
|------|-----:|-------|
| ~~`const EXTENSION_STORAGE_MIGRATIONS`~~ | ~~3844~~ | deleted in M12; `migrationsApplied` was removed from `schema.json` |
| `ExtensionRuntimeStore::ensure_schema` | 4032 | retained, but now writes schema from `CORE_STORAGE_COLLECTIONS` plus per-extension `manifest.json` `contributes.collections`; no hardcoded extension collection JSON remains |
| `ExtensionRuntimeStore::seed_from_demo_payload` | 4050 | retained, but now seeds kernel-owned documents directly and routes extension-owned demo records through manifest-declared WASM create ops |
| `fn seed_extension_documents` | 4338 | retained as manifest-driven seed planning; collection source/route metadata comes from `demoSeed`, not switch logic |
| ~~`fn with_repository_id`~~ | ~~4398~~ | deleted in M12; replaced by `with_repository_scope` at line 4643 |

## M12 dead-code audit

- Removed production-only `Runtime::close_issue` / `Runtime::issue_by_id`; tests now use explicit test helpers.
- Removed `ExtensionRuntimeOutput` convenience methods and `Index` impl; call sites use the `records` map directly.
- Removed the generated `all_routes()` table and per-extension generated `ROUTES_*` constants after deleting substring dispatch.
- Removed `HostManifest.permissions`, `MintError::Forbidden`, `UlidMinter.authorized`, `LoadedExtension.root`, the unused WIT `type_owner_name` helper, and obsolete receive-pack/pack helpers from production builds.
- `rg '#\[allow\(dead_code\)\]' crates extensions` returns zero hits.
- `cargo clippy --workspace -- -D warnings` passes.
- `cargo +nightly udeps` passes with `All deps seem to have been used.`

## `ext_code_browser` status

Earlier decision: code browsing is **core**, not an extension. The extension directory under `extensions/first-party/ext_code_browser/` has been deleted (see baseline commit), and M11 removed the leftover resolver snapshot branch.

Retained (kernel-owned):
- Git-backed repository helpers in `crates/server/src/main.rs` (`git_tree`, `repo_git_data`, and friends).
- Vue core registration in `frontend/src/core-widgets/code-browser.ts` as `comtrya-core-code-browser`.

## Other surfaces touched by the cutover (not deletions)

- `crates/server/src/wasm_host.rs` — gains real wiring in M2/M3/M6; no deletions.
- `crates/wit-codegen/` — invoked from `crates/server/build.rs` in M2; no deletions.
- `extensions/bundler/build-extension.sh` — gains a real `cargo component build` path in M1; no deletions.
- `frontend/packages/sdk-*` — retained; move into the new layout in M10.

## Verification at each milestone

Each milestone's commit must update this file:
- **Strike through** rows it deleted (don't remove them — the history is part of the audit).
- **Update line numbers** for rows it didn't delete but that shifted.
- **Re-record** the `main.rs` line count.

End state: every "Dies in" row is struck through. The expected multi-thousand-line `main.rs` shrink did not materialize by M12 because the cutover added the typed WASM runtime, manifest-driven storage bootstrap, and regression tests in the same file; the recorded M12 cleanup delta is still explicit above.
