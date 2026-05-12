# Workspace homepage — design

- **Date:** 2026-05-12
- **Branch:** `v3`
- **Status:** design approved, awaiting implementation plan
- **Related:** `V3_PLAN.md` item 13 ("Astro shell → real extension host"), `PRODUCT.md`

## Problem

Comtrya has no workspace landing. `frontend/src/pages/index.astro` boots the seeded `comtrya/comtrya` repo dashboard and calls it the homepage. The shell is one Astro document mutating its DOM; there is no router. Extension UI contribution today is anaemic:

- The UI manifest (`comtrya.ui-extension/v1`) declares `slots[]` against three hardcoded names (`repository.code`, `repository.overview`, `repository.checks`). Unknown slot names fall into a generic "extension slot frame" bin.
- The manifest also declares `routes[]` with `requiredPermission`, but the shell never honors them for navigation.
- The workspace nav (`Summary / Code / Pulls / Checks / Extensions / Activity`) is hardcoded HTML at `frontend/src/main.ts:394-401`. Extensions cannot add menu entries.
- Routes today say `"/comtrya/comtrya"` — a fixture-shaped path that lies about the URL scheme Comtrya actually uses (single-tenant, infinitely nested `/r/<...groups>/<repo>`).
- Backend WIT (`wit/comtrya-extension.wit`) describes data only (resolvers + host capabilities). UI contribution is unrelated to WIT.

`V3_PLAN.md` already commits to making the shell a real extension host. This spec covers the workspace homepage that drops out of that commitment, the routing scheme that supports it, and the contribution model the homepage forces us to land.

## Goals

1. `/` is a workspace landing built from extension-contributed surfaces, not a repo dashboard in disguise.
2. URL scheme is honest about single-tenancy and nested groups: `/r/<...groups>/<repo>` for repo dashboards, `/x/<prefix>/<...>` for extension-owned pages.
3. Contribution model splits cleanly: **manifest = identity + capability allowlist; code = runtime contributions through a typed SDK.**
4. Adding a new extension contribution kind (commands, palette items, settings panes) does NOT require bumping the manifest schema — only growing the SDK.
5. Visual direction is operator-grade discipline (Mechanical Specimen aesthetic) with operator-selectable color palette.
6. Every state the host can produce is a rendered surface (loading, integrity failure, shadowed claim, permission missing, empty workspace, disconnected operator, reduced motion).

## Non-goals (deferred to follow-up specs)

- **Per-viewer or per-instance slot-binding configuration** (which extension wins which slot when multiple claim it). v1 ships priority-based resolution; v2 config layer lands later.
- **Federated GraphQL planner.** Homepage widgets read host GraphQL today; the federated planner is V3_PLAN item 9 and lands separately. `home.your-work` ships with host-side aggregation flagged honestly.
- **Receive-pack / push.** Out of scope.
- **OCI extension distribution wired into runtime.** Out of scope (V3_PLAN item 11). Extensions stay filesystem-loaded.
- **CUE loader upgrade.** Out of scope.
- **`/instance` page.** Reserves the URL slot and the `instance.*` slot taxonomy for follow-up; v1 ships a compact `home.instance` widget on the homepage instead.

---

## 1. Information architecture & routing

### URL space

| Path                          | Owner       | Notes                                                                 |
| ----------------------------- | ----------- | --------------------------------------------------------------------- |
| `/`                           | Host shell  | Workspace homepage. Mounts `home.*` slots.                            |
| `/r/<...>/<repo>`             | Host shell  | Repo dashboard. Mounts `repository.*` slots. Tabs scroll-anchored.    |
| `/instance`                   | Host shell  | Reserved. v1 routes to `/#instance` until the full page lands.        |
| `/x/<prefix>/<...>`           | Extension   | Extension-owned pages. Rendered inside host chrome (topbar + sidebar).|
| `/_extensions/...`            | Rust host   | Asset API. Unchanged.                                                 |
| `/api/...`, `/auth/...`, `/git/...`, `/graphql`, `/events`, `/readyz` | Rust host | Unchanged. Reserved, not routable as UI. |

Single-tenancy means no top-level owner namespace. The repo path is one or more group segments followed by a repo name, all under `/r/`.

### Astro pages

- `pages/index.astro` — `/`. Boots the homepage mount flow.
- `pages/r/[...path].astro` — `/r/<...>`. SSR-resolves the path to a `repoId` via host GraphQL (`workspace.repositoryByPath(segments: [String!]!)`), then boots the repo-scoped mount flow with that id.
- `pages/instance.astro` — `/instance`. v1 redirects to `/#instance`.
- `pages/x/[prefix]/[...path].astro` — `/x/<prefix>/<...>`. Looks up the installed extension by `prefix`, validates the sub-path against its registered routes, and renders the route's element inside host chrome. Unknown prefix → 404. Sub-path doesn't match → 404.
- `pages/[...path].ts` — unchanged. API proxy with the existing allowlist. None of `/`, `/r/`, `/x/`, `/instance` collide.

No client-side router. Page-to-page navigation is full-document loads; intra-page section changes (the repo dashboard tabs) are anchor scrolls.

### `routeParams` shape per scope

```ts
type RouteScope =
  | { scope: "workspace" }                                          // /
  | { scope: "repository"; groups: string[]; repo: string; repoId: string }   // /r/<...>
  | { scope: "instance" }                                           // /instance (future)
  | { scope: "extension"; routePrefix: string; subPath: string; params: Record<string, string> };  // /x/<...>
```

`extensionHostContext(installation, slotName)` in `frontend/src/main.ts:882` is updated to produce this shape.

### Reserved route prefixes

The host owns these prefixes; extensions cannot register them: `r`, `x`, `_extensions`, `api`, `auth`, `git`, `graphql`, `events`, `readyz`, `healthz`, `instance`. Validation rejects them at install time.

---

## 2. Contribution model

### Two contribution kinds

| Kind        | Where extension UI lives                            | Who controls layout            |
| ----------- | --------------------------------------------------- | ------------------------------ |
| **Slots**   | Host-declared mount points on host-rendered pages   | Host                           |
| **Routes**  | Pages the extension fully owns, under `/x/<prefix>/`| Extension (within host chrome) |

### Manifest = identity + capability allowlist

The manifest declares **what an extension is and may do**. It does not declare **where** or **what** it actually contributes — that's runtime behavior expressed in code.

**`extensions/<id>/manifest.json` additions (backend manifest, `comtrya.extension/v1`):**

```jsonc
{
  "schemaVersion": "comtrya.extension/v1",
  "id": "ext_workspace_home",
  "name": "workspace-home",
  "displayName": "Workspace Home",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "wasmComponent": "component.wat",
  "witWorld": "comtrya:extension/extension",
  "routePrefix": null,                                /* NEW. nullable. Required iff this extension may register routes. Slug `[a-z][a-z0-9-]*`. Validated unique across installed extensions. */
  "ui": { "manifest": "ui/manifest.json" },
  "runtime": { "resolver": "resolve", "outputType": "comtrya.workspace-home/summary.v1" }
}
```

**`extensions/<id>/ui/manifest.json` v2 (`comtrya.ui-extension/v2`):**

```jsonc
{
  "schemaVersion": "comtrya.ui-extension/v2",
  "id": "ext_workspace_home",
  "extension": "workspace-home",
  "version": "0.1.0",
  "publisher": "comtrya-dev",
  "assets": {
    "entry": "/_extensions/ext_workspace_home/assets/index.js",
    "entryIntegrity": "sha256-...",
    "styles": []
  },
  "permissions": ["workspace.read", "events.read", "instance.admin"],
  "contributes": {
    "slots": ["home.your-work", "home.repositories", "home.activity", "home.instance"],
    "routes": []
  }
}
```

- **No `routes[]` or `slots[]` arrays with element names.** Those are runtime contributions.
- **`contributes.slots: string[]`** is an allowlist of slot names this extension may register. Names outside this list cannot be registered at runtime — host facade rejects them.
- **`contributes.routes`** is `true | false`. If `true`, the backend manifest MUST declare a `routePrefix`. Defaults to `false`.
- **Slot names are validated against a host-controlled enum.** Unknown slot names in `contributes.slots` fail at install time.

### Code = runtime contributions through a typed SDK

A new internal package `@comtrya/extension-host` (TypeScript) ships from the frontend workspace. It exports `defineExtension` and the host facade types. Extension ESM bundles import from it.

**ESM entry pattern:**

```ts
import { defineExtension } from "@comtrya/extension-host";
import "./elements/your-work";
import "./elements/repositories";
import "./elements/activity";
import "./elements/instance";

export default defineExtension({
  id: "ext_workspace_home",
  setup(host) {
    host.registerSlot("home.your-work", {
      element: "comtrya-home-your-work",
      requiredPermission: "workspace.read",
      priority: 1000,
    });
    host.registerSlot("home.repositories", { /* ... */ });
    host.registerSlot("home.activity",     { /* ... */ });
    host.registerSlot("home.instance",     { /* ... */ });
  },
});
```

**Facade contract:**

```ts
interface ExtensionHost {
  readonly client: ComtryaClient;
  readonly viewer: ViewerHandle;
  readonly capabilities: Record<string, boolean>;
  registerSlot(name: SlotName, contribution: SlotContribution): Disposable;
  registerRoute(path: string, contribution: RouteContribution): Disposable;
}

interface SlotContribution {
  element: string;             // custom element name
  requiredPermission: string;  // viewer must hold this OR `instance.admin`
  priority?: number;           // contention resolution; default 1000
}

interface RouteContribution {
  element: string;
  requiredPermission: string;
  // path comes from the registerRoute first arg, interpreted relative to manifest routePrefix
}

interface Disposable { dispose(): void; }
```

### Boot flow

1. Host reads every `ui/manifest.json` at startup. Builds the permitted-contributions registry: `{ extensionId, allowedSlots: Set<string>, allowedRoutes: boolean }`.
2. Host validates `contributes.slots` against its enum of registered slot names (`home.your-work`, `home.repositories`, `home.activity`, `home.instance`, `repository.overview`, `repository.code`, `repository.checks`, plus `instance.*` reserved). Unknown name → load failure surfaced in the Extensions panel.
3. Host pre-renders the page shell with skeleton placeholders for every declared slot. Each placeholder names the loading extension.
4. Host fetches each `assets/entry` ESM with integrity verification, awaits the default export.
5. Host invokes `setup(host)` per extension with a scoped facade. The facade's `registerSlot`/`registerRoute` validate against the manifest allowlist and reject out-of-scope claims loudly.
6. Slot registry resolves contention: lowest `priority` wins; tie broken by install-order. Losers surface in Extensions panel as "claim shadowed by `<winner>`."
7. Permission revocation, extension uninstall, or `Disposable.dispose()` removes the contribution and re-resolves.

### Slot taxonomy (v1)

| Slot                  | Scope        | Context passed | Intent |
| --------------------- | ------------ | -------------- | ------ |
| `home.your-work`      | workspace    | viewer; no repo | Cross-repo personal queue. |
| `home.repositories`   | workspace    | repositories[] with `groups[]` + name + state | Repo directory. |
| `home.activity`       | workspace    | events[] + SSE handle | Workspace event stream. |
| `home.instance`       | workspace, operator | ready, instance, extensionResolvers[] | Instance health summary (gated on `instance.admin`). |
| `repository.overview` | repository   | repo, viewer | Existing. PR / issue summary panel. |
| `repository.code`     | repository   | repo, viewer | Existing. Tree + files. |
| `repository.checks`   | repository   | repo, viewer | Existing. |
| `instance.*`          | instance     | reserved     | Future. v1 does not consume. |

The previous generic "extension slot frame" fallback bin is removed. Slot names not in the enum fail validation at install time.

---

## 3. Visual direction

### Aesthetic: Mechanical Specimen with operator-selectable palette

The host shell renders in the Mechanical Specimen design system: hairline structural rules, oversized section IDs, bordered status chips, datasheet rhythm. **Typography and layout are fixed; the color palette is an operator preference.**

**Typography (all themes):**

- Display: **Bricolage Grotesque** (variable, opsz 12–96, weights 400–800). Section identifiers, page titles, workspace name.
- Body: **IBM Plex Sans** (400/500/600/700). UI labels, row titles, panel headings.
- Data: **JetBrains Mono** (400/500/700). Paths, IDs, oids, counts, timestamps, kbd hints, clone commands.
- All three are Google Fonts; preloaded in the Astro pages.

**Layout structure (all themes):**

- 240px workspace sidebar with `--paper-tint` background.
- Topbar with brand mark, command palette stub (⌘K), state pill, server URL chip. 2px ink border under topbar.
- Main content padded 28–32px. Spine column with `border-right: 1.5px solid var(--ink)`; rail column with `--paper-tint` background.
- Section straps: ID number (28–36px display) + heading (26px display) + meta line (mono, 11px). 1.5px ink rule under each strap.
- Rows: 12px padding, 1px `--rule-light` border between rows.
- Status chips: bordered, never filled; 1.5px border in state-accent color.
- Instance strip at page bottom: inverted (`--instance-bg` / `--instance-fg`) with accent-colored section ID.

**Palette: 6 operator-selectable schemes**

| Theme            | Flavor   | Primary | Notes |
| ---------------- | -------- | ------- | ----- |
| `print`          | light    | `#f04a1e` orange | Default. White paper, ink black. |
| `catppuccin`     | Mocha    | `#cba6f7` mauve  | Pastel-dark. |
| `ayu`            | Mirage   | `#ffcc66` yellow | Warm low-contrast dark. |
| `rose-pine`      | main     | `#ebbcba` rose   | Mauve / pink. |
| `tokyo-night`    | night    | `#7aa2f7` blue   | Saturated cool. |
| `gruvbox`        | dark     | `#fe8019` orange | Retro earth. |

Each theme remaps `--ink`, `--paper`, `--paper-tint`, `--rule`, `--rule-light`, `--ink-soft`, `--ink-faint`, `--ink-fainter`, the four state accents (`--accent-orange/teal/yellow/blue`), error (`--accent-err`), the instance strip (`--instance-bg/fg/fg-soft/rule`), and the instance section accent (`--accent-instance`).

Theme is set on `<html data-theme="...">`, persisted in `localStorage` under key `comtrya.theme`. Operator picks via a small switcher in the workspace sidebar footer (not the floating mockup-only panel). Default: `print`.

`prefers-reduced-motion` strips transitions and replaces tween-based counter updates with snap updates.

### Homepage composition (`/`)

Two-column grid, no hero. Page opens directly into content.

```
┌────────────────────────────────────────────────────────────────┐
│ topbar  (brand · ⌘K · state · url)                              │
├──────────┬────────────────────────────────────┬────────────────┤
│ sidebar  │ SECTION 01  Review queue           │ SECTION 04     │
│          │   row · row · row                  │ Repositories   │
│ Comtrya  │ ───────────────────────────────    │   filter       │
│ Labs     │ SECTION 02  Your pulls             │   row × 8      │
│          │   row · row                        │ ───────────────│
│ Home     │ ───────────────────────────────    │ SECTION 05     │
│ Activity │ SECTION 03  Failing on branches    │ Activity       │
│ Ext      │   row · row                        │   day · evs    │
│ Instance │                                    │   day · evs    │
│          ├────────────────────────────────────┴────────────────┤
│ Pulls    │ SECTION 06  Instance  ● ready · 0 boundaries · …     │
│ Code     │                                                      │
│ Checks   │                                                      │
│          │                                                      │
│ Viewer   │                                                      │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

Bundled first-party extension `ext_workspace_home` fills all four `home.*` slots in v1. Per-concern extensions can override any single slot via priority in v2.

### Empty / error / loading states

Every state below is an explicit rendered surface, not a runtime accident:

| State                                              | Treatment |
| -------------------------------------------------- | --------- |
| Manifest read, ESM not loaded                      | Slot frame shows skeleton rows + "loading `<id>`" caption. |
| ESM failed to load (integrity / parse / network)   | Error card: extension id, kind (load/resolver/permission), link to Extensions panel. Slot does not render. |
| Slot claim shadowed by higher priority             | Winner renders. Loser surfaces in Extensions panel as "claim shadowed by `<winner>` (priority X)". |
| Viewer lacks `requiredPermission`                  | Slot omitted entirely. Grid reflows. No padlock placeholders. |
| Operator disconnected (no bearer token)            | Spine column shows operator-code form. Rail collapses. Instance strip hidden. |
| Workspace has zero repositories                    | `home.repositories` shows: `No repositories yet. git init a bare repo at $COMTRYA_DATA_DIR/repositories/<path>.git to seed one.` |
| No PRs awaiting viewer                             | `home.your-work` sub-section shows: `No reviews waiting.` One line. |
| All-green `/readyz`                                | `home.instance` collapsed strip: `● ready · 0 boundaries · 3/3 extensions executed` + expand. |
| Any non-green `/readyz`                            | `home.instance` auto-expands with first failure surfaced. |
| `prefers-reduced-motion`                           | All transitions stripped. Counter updates snap. |

### Workspace navigation (sidebar)

Generated, not hardcoded. Two sections:

1. **Workspace** (static, host-owned): `Home` `/`, `Activity` `/#activity`, `Extensions` `/#extensions`, `Instance` `/instance` (operator-only).
2. **Extensions** (dynamic): one entry per installed extension that registered a `routePrefix`. Label from manifest `displayName`; target `/x/<prefix>/`. Extensions can suppress their nav entry by calling `host.registerNavEntry(false)` during `setup`, or override label/order via SDK call (v2 — out of scope here, but the SDK reserves the call site).

---

## 4. Implementation plan (file-by-file)

The implementation runs in 7 increments. Each is independently committable and verifiable.

### Increment A — SDK package

New workspace package (still inside `frontend/`, not a separate npm publish for v1):

- `frontend/src/extension-host-sdk/index.ts` — exports `defineExtension`, type interfaces.
- `frontend/src/extension-host-sdk/types.ts` — `ExtensionHost`, `SlotContribution`, `RouteContribution`, `Disposable`, `SlotName` (closed-set type alias).
- `frontend/src/extension-host-sdk/runtime.ts` — internal `createHostFacade(manifestAllowlist)` factory, `SlotRegistry`, contention resolution, disposable tracking.
- Bundler config: Astro already supports TS imports; no extra config needed. Path alias `@comtrya/extension-host` added in `tsconfig.json`.

### Increment B — Manifest schema v2 + validator

- `frontend/src/contracts.ts` — replace v1 schema with v2: `permissions: string[]`, `contributes: { slots: string[], routes: boolean }`. Remove `routes[]` / `slots[]` arrays. Add `validateUiManifest` v2 implementation with closed-set slot validation.
- `crates/core/src/extension.rs` (or wherever `routePrefix` belongs in the contract — verify) — add optional `route_prefix` field with slug validation and reserved-name rejection.
- `crates/server/src/main.rs` — extension load path validates `routePrefix` uniqueness across installed extensions; rejects reserved prefixes; rejects manifests where `contributes.routes` is true but `routePrefix` is null.
- Schema migration: v1 manifests load with a deprecation warning until all three first-party extensions migrate (Increment F). After Increment F, v1 manifests fail to load.

### Increment C — File-based routing & page shells

- `frontend/src/pages/index.astro` — workspace homepage. Skeleton + boot script. Renames out today's repo-dashboard `index.astro` contents.
- `frontend/src/pages/r/[...path].astro` — repo dashboard. SSR-queries `workspace.repositoryByPath(segments)` to resolve `repoId`. 404 on no match. Boots repo-scoped mount flow.
- `frontend/src/pages/x/[prefix]/[...path].astro` — extension page host. Looks up extension by prefix, validates sub-path against its registered routes, mounts the element. 404 on prefix/path miss.
- `frontend/src/pages/instance.astro` — v1 redirects to `/#instance`. Reserved.
- `frontend/src/pages/[...path].ts` — unchanged. Verify allowlist still doesn't collide.
- `crates/server/src/main.rs` — add `workspace.repositoryByPath(segments: [String!]!)` GraphQL field returning `{ id, groups, name } | null`.

### Increment D — Host shell rewrite (Mechanical Specimen + palette switcher)

- `frontend/src/styles.css` — replace today's styles with the Mechanical Specimen system. Define all six theme palettes as `[data-theme="..."]` blocks. Persist theme to `localStorage` under `comtrya.theme`. Source-of-truth derived from `docs/mockups/workspace-homepage/04-mechanical-specimen.html`.
- `frontend/src/main.ts` — split into:
  - `frontend/src/shell/chrome.ts` — renders topbar, sidebar, viewer footer, theme switcher. Same on every page.
  - `frontend/src/shell/page-home.ts` — homepage layout + slot mounts (`home.*`).
  - `frontend/src/shell/page-repo.ts` — repo dashboard layout + slot mounts (`repository.*`).
  - `frontend/src/shell/page-ext.ts` — extension page host (mounts a single route element).
  - `frontend/src/shell/extension-loader.ts` — manifest read, integrity verification, ESM load, `setup(host)` invocation, registry.
  - `frontend/src/shell/slot-registry.ts` — contention resolution, disposable tracking, permission gating.
- Remove inline `slotPlaceholderMarkup`, `extensionSlotMount`, `genericSlotMount`, and the hardcoded workspace nav from today's `main.ts`. Generic-slot-frame fallback is deleted.
- Theme switcher lives in the sidebar footer (compact, six buttons sized to fit) — not the floating mockup-only panel.

### Increment E — Host GraphQL additions

- `crates/server/src/main.rs` — extend the workspace GraphQL root with the fields the homepage needs:
  - `workspace.repositoryByPath(segments: [String!]!) -> Repository | null` (used by repo dashboard SSR).
  - `workspace.repositories(filter: RepositoryFilter) -> [RepositorySummary!]!` with `groups: [String!]!`, `openPullRequests: Int`, `checkSummary: { passed: Int, total: Int }`, `lastCommitAt: DateTime` (used by `home.repositories`).
  - `viewer.reviewQueue(limit: Int) -> [PullRequestSummary!]!` and `viewer.authoredPulls`, `viewer.failingChecks` (used by `home.your-work` — host-side aggregation for v1; flagged `aggregated: true` in the response).
  - `workspace.events(limit: Int) -> [ActivityEvent!]!` already exists; extend with `scope: WORKSPACE | REPOSITORY` and respect viewer-accessible resources.
- The federated planner (V3_PLAN item 9) replaces host aggregation later; the homepage extension reads the same field names but gets federated data once the planner lands.

### Increment F — First-party extensions migrate to v2

For `ext_pull_requests`, `ext_code_browser`, `ext_checks` and the new `ext_workspace_home`:

- Rewrite `ui/manifest.json` from v1 to v2.
- Backend manifest gains `routePrefix` where applicable: `ext_pull_requests` → `pulls`, `ext_code_browser` → `code`, `ext_checks` → `checks`, `ext_workspace_home` → null.
- `assets/index.js` rewrites to `defineExtension({ id, setup(host) { ... } })` calling `host.registerSlot` / `host.registerRoute`.
- `ext_workspace_home` is newly created:
  - `extensions/first-party/ext_workspace_home/manifest.json`
  - `extensions/first-party/ext_workspace_home/component.wat` (minimal proof component like the others)
  - `extensions/first-party/ext_workspace_home/ui/manifest.json` (v2)
  - `extensions/first-party/ext_workspace_home/assets/index.js` — bundle exporting `defineExtension` with four `registerSlot` calls and four custom elements: `comtrya-home-your-work`, `comtrya-home-repositories`, `comtrya-home-activity`, `comtrya-home-instance`.

### Increment G — Update SPEC_COVERAGE, TODO, start.sh assertions

- `SPEC_COVERAGE.md` — add rows asserting every homepage panel resolves from either Git, runtime SQLite, or a typed WIT resolver / extension surface (no fixture data on the request path).
- `TODO.md` — strike completed v3 items; add follow-up items (v2 per-slot config, federated planner, full `/instance` page).
- `start.sh` — add smoke assertions:
  - `GET /` returns the homepage HTML with the four homepage extension slot frames marked `data-smoke="home-slot-<name>"`.
  - `GET /r/comtrya` returns the repo dashboard with `data-smoke="repo-dashboard"`.
  - `GET /x/pulls/` returns the pulls extension page; `GET /x/nonexistent/` returns 404.
  - All four `home.*` slots have a rendered element matching their `requiredPermission` for the demo operator.
  - Theme switch round-trips: setting `data-theme="catppuccin"` then reloading preserves it (via Playwright or curl + localStorage emulation — likely manual for v1 with a documented step).

---

## 5. Verification & migration

### Tests added

- `crates/core` — `ExtensionInstallConfig` route-prefix validation (slug shape, reserved names, uniqueness). Manifest v2 `contributes` shape validation.
- `crates/server` — GraphQL field tests for `workspace.repositoryByPath`, `workspace.repositories`, `viewer.reviewQueue`, `viewer.authoredPulls`, `viewer.failingChecks`.
- `frontend/src/extension-host-sdk` — unit tests for slot registry (priority resolution, dispose, permission gating), facade rejection of out-of-allowlist contributions, manifest v2 validation.
- `frontend/` — smoke tests for the four page types (`pages/index.astro`, `pages/r/[...path].astro`, `pages/x/[prefix]/[...path].astro`, `pages/instance.astro`).

### Manual verification

- `./start.sh --reset && ./start.sh` boots a fresh instance, renders the homepage with all four `home.*` slots rendered by `ext_workspace_home`.
- Disabling `ext_workspace_home` shows all four slots in their "no extension claims this slot" empty state.
- Installing a competing extension at priority 100 shadows the bundled extension's claim; Extensions panel shows the shadowed claim.
- Theme switcher persists across reloads. All six themes preserve hairline structure and oversized section IDs.
- `prefers-reduced-motion` strips all transitions.
- `/r/comtrya` resolves via `workspace.repositoryByPath` and renders the repo dashboard. `/r/public/internal/observability` resolves the nested path. `/r/does-not-exist` returns 404.
- `/x/pulls/` mounts `ext_pull_requests`'s root route element. `/x/pulls/41` mounts the detail element with `params: { pullId: "41" }`. `/x/nonexistent/` returns 404.

### Migration risk

- **v1 manifest deprecation window:** Increment B accepts both v1 and v2 with a deprecation warning. Increment F removes v1 support. This is a single-branch transition; no field deployments outside this repo to coordinate with.
- **`/comtrya/comtrya` ⟶ `/r/comtrya`:** today no production traffic exists. Updating the demo URLs in `DEMO_RUNBOOK.md`, `PRODUCTION_TESTBED.md`, and `start.sh` covers the rewrite.
- **Existing operator code → bearer token flow:** unchanged. The homepage uses the same `/auth/token-exchange` flow.

### Done when

1. `cargo test --workspace` passes.
2. `./start.sh --reset && ./start.sh` boots end-to-end, all smoke assertions pass.
3. The homepage renders four `home.*` slots, each filled by a custom element from `ext_workspace_home`.
4. `/r/<...>/<repo>` resolves to the repo dashboard with extension-mounted tabs.
5. `/x/<prefix>/<...>` routes to extension-owned pages.
6. Theme switcher shows six options, persists choice, applies on next page load.
7. Every state in §3 has a rendered surface that can be screenshot-tested.
8. `SPEC_COVERAGE.md` maps every homepage surface to Git / runtime SQLite / extension contribution (no fixture data on the request path).

---

## Open questions deferred to follow-up specs

1. **Per-viewer slot-binding configuration.** When two extensions claim the same slot, today the operator can't override the priority-based pick. Solve in a follow-up.
2. **Command palette (⌘K) contribution kind.** SDK reserves the call site. Spec it when we know what commands we want.
3. **Settings panes contribution kind.** Same — reserved, deferred.
4. **Federated GraphQL planner.** V3_PLAN item 9; the homepage gets federated data once the planner lands.
5. **Full `/instance` page** with its own slot taxonomy (`instance.*`). Currently `home.instance` is a compact widget; a dedicated page lands in a follow-up.

## Spec self-review

- No "TBD" or "TODO" placeholders.
- Single direction picked for visual (Mechanical Specimen + 6-palette switcher); not left as an open question.
- Manifest schema v2 includes deprecation window so v1 extensions don't break mid-branch.
- Goals 1–6 are each addressable by exactly one increment in §4; non-goals are explicitly listed.
- Reserved route prefixes (`r`, `x`, `_extensions`, `api`, `auth`, `git`, `graphql`, `events`, `readyz`, `healthz`, `instance`) are listed inline.
- Verification commands are concrete (`cargo test --workspace`, `./start.sh --reset && ./start.sh`).
- Spec stays within one implementation plan: 7 sequential increments, each independently committable.
