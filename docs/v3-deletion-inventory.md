# v3 deletion inventory

Every artifact slated for removal during the v3 cutover, with the milestone that retires it. Updated as each milestone deletes its rows.

Baseline at audit: `crates/server/src/main.rs` is **8983 lines / 337 functions**. Current after the M4 issue-handler deletion: **10112 lines / 353 functions**. Track shrinkage in the M4/M5/M6/M11/M12 cleanup commits.

## Dispatch — `matches_op` arms in `crates/server/src/main.rs`

The audit listed 29 hand-written arms. After M4, 21 residual arms live in the dispatch block at `main.rs:2130–2191`; the 8 `ext_issues` rows are struck through below.

| Op | Arm line | Handler fn | Handler lines | Owner | Dies in |
|----|---------:|-----------|--------------:|-------|---------|
| `createRepository` | 2130 | `create_repository_mutation` | 3122–3183 | core | retained (kernel-owned; routed through dispatch table in M3) |
| `relations.create` | 2133 | `relations_create_mutation` | 2944–2985 | kernel | retained (kernel-owned; routes through `wasm_host::wit_relations` in M6) |
| `relations.delete` | 2136 | `relations_delete_mutation` | 2987–3017 | kernel | retained, see above |
| `relations.outgoing` | 2139 | `relations_outgoing_query` | 3019–3050 | kernel | retained, see above |
| `relations.incoming` | 2142 | `relations_incoming_query` | 3052–3083 | kernel | retained, see above |
| `relations.between` | 2145 | `relations_between_query` | 3085–3120 | kernel | retained, see above |
| `comments.thread` | 2148 | `comments_thread_query` | 2775–2805 | kernel | retained (kernel-owned; routes through `wasm_host::wit_comments` in M6) |
| `comments.create` | 2151 | `comments_create_mutation` | 2807–2851 | kernel | retained, see above |
| `comments.update` | 2154 | `comments_update_mutation` | 2853–2894 | kernel | retained, see above |
| `comments.delete` | 2157 | `comments_delete_mutation` | 2896–2926 | kernel | retained, see above |
| ~~`issues.create`~~ | ~~2251~~ | ~~`issues_create_mutation`~~ | ~~2680–2735~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.close`~~ | ~~2254~~ | ~~`issues_close_mutation`~~ | ~~2736–2765~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.reopen`~~ | ~~2257~~ | ~~`issues_reopen_mutation`~~ | ~~2766–2791~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.list`~~ | ~~2260~~ | ~~`issues_list_query`~~ | ~~2792–2811~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.byRefs`~~ | ~~2263~~ | ~~`issues_by_refs_query`~~ | ~~2857–2878~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.byRef`~~ | ~~2266~~ | ~~`issues_by_ref_query`~~ | ~~2812–2856~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.byNumber`~~ | ~~2269~~ | ~~`issues_by_number_query`~~ | ~~2879–2908~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| ~~`issues.stateCountsForRefs`~~ | ~~2272~~ | ~~`issues_state_counts_query`~~ | ~~2909–2930~~ | ext_issues | ~~**M4**~~ deleted in M4 |
| `epics.create` | 2160 | `epics_create_mutation` | 2467–2527 | ext_epics | **M5** |
| `epics.changeState` | 2163 | `epics_change_state_mutation` | 2529–2563 | ext_epics | **M5** |
| `epics.list` | 2166 | `epics_list_query` | 2565–2596 | ext_epics | **M5** |
| `epics.byRefs` | 2169 | `epics_by_refs_query` | 2649–2677 | ext_epics | **M5** |
| `epics.byRef` | 2172 | `epics_by_ref_query` | 2598–2647 | ext_epics | **M5** |
| `epics.progress` | 2175 | `epics_progress_query` | 2679–2709 | ext_epics | **M5** |
| `epics.issuesIn` | 2178 | `epics_issues_in_query` | 2711–2741 | ext_epics | **M5** |
| `epics.childrenOf` | 2181 | `epics_children_of_query` | 2743–2773 | ext_epics | **M5** |
| `pulls.create` | 2184 | `pulls_create_mutation` | 2196–2252 | ext_pull_requests | **M5** |
| `pulls.merge` | 2187 | `pulls_merge_mutation` | 2254–2291 | ext_pull_requests | **M5** |
| `pulls.close` | 2190 | `pulls_close_mutation` | 2293–2326 | ext_pull_requests | **M5** |

The dispatch block itself (`graphql_post` body, lines 2116–2194) was rewritten in **M3** to consult the generated dispatch table; the residual relations/comments/createRepository arms keep their handlers but route to them via the new table.

`fn matches_op` itself (line 2437) is **deleted in M11** once the generated table is the only dispatcher.

## Legacy GraphQL snapshot path

These power the Astro frontend's monolithic snapshot rendering. They go away when the Vue shell stops consuming the snapshot.

| Item | Line | Notes | Dies in |
|------|-----:|-------|---------|
| `fn graphql_response` | 3203 | Catch-all that returns the whole-kernel demo snapshot when no op matches. Every Astro page consumes this. | **M9** (replaced by per-op GraphQL responses through the dispatch table) |
| `Runtime::demo_payload` (its caller) | 1471 | Builds the monolithic payload from runtime state + seeded extension docs. | **M9** |
| `fn extension_resolver_payload` | 1524 | Legacy resolver dispatch — switches on extension id (`"ext_pull_requests"`, `"ext_checks"`, `"ext_code_browser"`). Replaced by WASM dispatch through `wasm_host`. | partial deletions through **M5** (each extension's branch removed at its migration); fully gone in **M11** |
| `fn graphql_stream` | 3386 | SSE stream — likely retained but rewritten to fan out kernel events via `wasm_host::wit_events`. | retained, rewritten in **M6** |

## Resolver helpers tied to deleted handlers

| Item | Line | Used by | Dies in |
|------|-----:|---------|---------|
| `fn code_browser_resolver_output` | 4704 | `extension_resolver_payload` for `"ext_code_browser"` | **retained** (code browsing is core, not an extension — see "ext_code_browser status" below) |
| `fn pull_request_resolver_output` | 4725 | `extension_resolver_payload` for `"ext_pull_requests"` + the legacy snapshot | **M5** |
| `fn checks_resolver_output` | 4756 | `extension_resolver_payload` for `"ext_checks"` + the legacy snapshot | **M5** |
| `fn epics_resolver_output` | 4777 | legacy snapshot | **M5** |
| `fn issues_resolver_output` | 4809 | legacy snapshot | deferred to **M9** (still used by `extension_resolver_payload`; M4 deleted the GraphQL handler helpers) |
| `struct CheckSummary` | 4842 | `checks_resolver_output` + `pull_request_resolver_output` | **M5** |
| `fn check_summary` | 4849 | same | **M5** |

M4 deleted the `issues.*` GraphQL dispatch arms and their handler-only helpers. It did not delete `issues_resolver_output`, because the legacy Astro snapshot still consumes `extensionResolvers` until M9.

## Reactor — hand-rolled in-process dispatch

Everything in this section is replaced by real WASM reactors in **M6**.

| Item | Line | Notes |
|------|-----:|-------|
| `Runtime::dispatch_event_to_reactors` | 1812 | walks `REACTORS` per event; hand-rolled depth tracking |
| `pub struct EventEnvelope` | 4167 | replaced by WIT-generated `types::event` |
| `pub enum Reaction` | 4172 | replaced by WIT-generated `reactor::reaction` |
| `struct Reactor` | 4177 | replaced by extension manifest `reactor.*` + real WASM `on-event` export |
| `const REACTORS` | 4191 | hardcoded `ext_pull_requests` auto-close-on-merge wired in code |
| `fn pull_requests_on_merge` | 4199 | reimplemented inside `ext_pull_requests` WASM in M6 |

## Legacy resolver path

| Item | Line | Notes |
|------|-----:|-------|
| `struct WasmtimeResolverRecord` | 278 | dies in **M11** |
| Legacy `Linker::<()>::new` block | 6069 | dies in **M11** |
| ~~`_platform_linker_check` placeholder call~~ | ~~6132~~ | deleted before this M4 inventory refresh; platform WIT extensions now register through `wasm_registry` |
| `let func = instance.get_typed_func::<(), (u32,)>(…, resolver)` | 6080 | dies with the resolver path in **M11** |
| Health-check field `wasmtimeResolversExecuted` | 440 | dies in **M13** when the smoke harness asserts the WASM path directly |

## Component stubs (Component-Model `.wat`)

All five die in **M11** once the manifests point at the real `.wasm` artifact produced by the bundler.

- `extensions/first-party/ext_issues/component.wat`
- `extensions/first-party/ext_epics/component.wat`
- `extensions/first-party/ext_pull_requests/component.wat`
- `extensions/first-party/ext_checks/component.wat`
- `extensions/first-party/ext_workspace_home/component.wat`

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

These items in `ExtensionRuntimeStore` hardcode today's collection shapes and are rewritten in **M12**:

| Item | Line | Notes |
|------|-----:|-------|
| `const EXTENSION_STORAGE_MIGRATIONS` | 5149 | retained only if still referenced after rewrite |
| `ExtensionRuntimeStore::ensure_schema` | 5200 | embeds workspaces, repositories, pull_requests, check_runs, extension_installations, activity_events with hardcoded indexes — must move to per-extension `contributes.collections` |
| `ExtensionRuntimeStore::seed_from_demo_payload` | 5265 | tightly coupled to today's collection names |
| `fn seed_extension_documents` | 5482 | same |
| `fn with_repository_id` | 5663 | seed helper; dead-code audit in M12 |

## `ext_code_browser` status

Earlier decision: code browsing is **core**, not an extension. The extension directory under `extensions/first-party/ext_code_browser/` has been deleted (see baseline commit) and the resolver path in `main.rs` is now a kernel concern, not a deletion target.

Retained (kernel-owned):
- `fn code_browser_resolver_output` at `main.rs:4704`
- `"ext_code_browser"` branch in `extension_resolver_payload` at `main.rs:1534`
- Tests under `crates/server/src/main.rs` lines 7305, 8122, 8166, 8202, 8233, 9261, 9391 — verify these still hold after M11; they reference the legacy resolver path so some will move/delete with it.

Open: the `"ext_code_browser"` branch lives inside `extension_resolver_payload`, which itself dies in M11. Either fold the code-browser path into a dedicated GraphQL query (preferred, M5/M11) or keep it in `extension_resolver_payload` and retain that function for code-browser only (uglier). Decide before M11.

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

End state: every "Dies in" row is struck through. The baseline 8983-line `main.rs` should shrink by several thousand lines once M4/M5/M6/M11/M12 are complete.
