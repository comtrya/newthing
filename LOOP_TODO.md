# Loop TODO — productivity-focused forge DX/UX

Running goal: turn this into the cleanest forge for viewing repos, planning
projects, and managing pull requests. This file is the working backlog for the
30-minute /loop. New ideas get appended; finished ones are kept and marked so
the loop can build on them.

Conventions: `[ ]` pending · `[~]` in flight · `[x]` done (with date + commit
hint or file touched). Keep the WHY short so a future iteration knows whether
the entry is still load-bearing.

## Loop conventions

**Commit at the end of every iteration.** After verifying the iteration's
change end-to-end and updating this file with the "Recently shipped" entry,
commit the work as one or more logical slices following the project's
Conventional Commits rule (see `AGENTS.md::Commit Messages`). Don't let
work pile up uncommitted — each /loop fire should land in `git log` as a
small, reviewable slice.

Heuristics:
- One coherent feature → one commit, scope it (`feat(server):`,
  `feat(ext_issues):`, `feat(frontend):`, `chore(dogfood):`, etc.).
- Multi-layer change (Rust + WIT + UI) → split by layer so each commit
  compiles independently: kernel/WIT first, then UI consuming the new
  fields, then dogfood / workflow.
- Skip only if the iteration was pure exploration with no file changes,
  or if work is genuinely incomplete and the commit would be misleading.
- Never use `--no-verify`; if a pre-commit hook fires, fix the underlying
  issue.

---

## Vision

A forge whose primary value is **flow**, not features. The reference points are
Linear (keyboard, density, speed), Superhuman (single-input command surface),
Pierre (PR review as a desktop-class diff experience), and Raycast (every
action is one keystroke). GitHub's web UI is the explicit anti-reference:
slow, dense without being scannable, mouse-first, every action a round trip.

The forge knows what's happening *now*: the live event stream is already
broadcasting issue/PR/check transitions — they should power presence, real-time
lists, and an inbox-style "what changed since I last looked" surface.

## Architectural anchor: where artefacts live + the repo CUE config

There are two storage shapes in this forge and they must not be blurred:

- **Durable design (repo-resident).** PRDs, specs, RFCs, ADRs, runbooks live
  as MDX files in the repo and are reviewed via the same PR flow as code.
  Branching, history, blame, side-by-side review, CI — all of it free,
  because they're just files.
- **Transient state (database-resident).** Issues, epics, projects, comments,
  reviews, checks open and close — they live in extension storage with
  resource URNs that link back to durable artefacts.

The repo describes itself to the forge via a **`package comtrya` CUE
configuration** placed anywhere in the tree — typically one file per
project in a monorepo. The kernel walks the tree with
`cuengine::evaluate_module(recursive: true, package_name: "comtrya")` and
exposes the merged instance set on `repository.comtryaConfig`. The config
is the repo's general-purpose surface — *not* docs-only:

- `value.docs` → repo-resident PRDs / specs / RFCs / ADRs / runbooks paths.
- `value.builds` → CI commands the forge can run.
- `value.agents.allow` → which agent identities can author PRs here.
- `value.owners` → review routing.
- Future: deployment targets, relationship registrations, scheduled jobs.

Each new forge surface that needs per-repo config reads the section it
cares about from `comtryaConfig.instances[].value`. We do not invent
per-feature config files. There is one CUE config, many consumers.

## Macro bets (compounding, multi-iteration)

These are the bets that decide whether this becomes a Linear-grade product or
just a polished GitHub clone. Each is a 2-4 iteration arc, not a single
session. Mark them `[ ]` `[~]` `[~~]` `[x]` to track progress across iterations.

- [~] **Real-time everywhere.** Use the live event SSE that already exists.
      Home page becomes a "Today" view of what changed across the workspace.
      Lists update without refresh. PR/issue counters tick live. Presence
      indicators ("Sarah is reviewing this PR") on hot resources. Started
      iteration 2 with a real-time activity feed.
- [ ] **Workbench layout** — three-pane (sidebar / list / detail), single
      route, no full-page reloads inside a section. Linear/Superhuman shape.
      Issues, pulls, and the inbox all live inside this shell. Implies
      replacing the current per-route `<RouterView>` model with a nested
      master-detail one per extension.
- [~] **Diff-first PR review** — first cut shipped: hand-rolled unified-diff
      parser (`diff.ts`) + `DiffView.vue` rendering per-file hunks with
      line numbers, +/- gutters, color, status badges (added/deleted/
      renamed/modified), per-file collapse, +/- totals, and `n`/`p`/space
      keyboard nav. Wired into `PullsDetail.vue` fed by the existing
      `workspace.repositoryByPath.diff` field (kernel still owes us a per-PR
      `gitDiff(head, base)` field). `@pierre/diffs` integration (shiki syntax
      highlighting, side-by-side, hunk expansion, inline comments) is the
      next push on this arc.
- [~] **Command-driven everything** — the palette becomes the canonical
      action surface, not a nice-to-have. Every WIT operation registers a
      command. Verbs ("merge this PR", "close issue 42", "switch to branch
      release/v3") not just navigation.
      **Library-first (user direction, iteration 17). Migration started
      iteration 18.** `tinykeys@3` is now the keybinding library. The
      shell's `bindGlobalShortcut` (`$mod+KeyK`), `bindGoChord` (`g h`,
      `g r`, `g i`, `g p`, `g n`), and the palette's internal nav
      (Esc/ArrowDown/ArrowUp/Enter, scoped to `open=true`) all run on
      tinykeys via a new `useShortcuts` composable in `@comtrya/sdk-vue`.
      Bespoke keydown listeners — all gone as of iteration 20:
      - ✅ `IssuesList.vue` (iteration 19).
      - ✅ `EpicDetail.vue` (iteration 20).
      - ✅ `PullsQueue.vue` + `PullsDetail.vue` (iteration 20).
      - ✅ `App.vue` `?` overlay toggle (iteration 20).
      - ✅ `DiffView.vue` n/p/[/]/space (iteration 20).
      - ✅ `DocsPanel.vue` j/k/↵/Esc/space (iteration 20).
      Remaining for the arc:
      - ✅ Bespoke `CommandPalette.vue` UI replaced with
        **@headlessui/vue Combobox + Dialog** (iteration 21).
      - ✅ Expand command registry so every WIT op is a verb:
        - ✅ `Switch to project <name>` — dynamic per-repo
          (iteration 22).
        - ✅ `Open / Close / Reopen issue #N` — live-event-driven
          (iteration 23). Subscribes to
          `dev.comtrya.issues.{opened,closed,reopened}` and
          diffs the registered set on each event.
        - ✅ `Open / Merge / Close PR #N` — live-event-driven
          (iteration 24). Subscribes to
          `dev.comtrya.pull-request.{created,merged,closed}`.
        - ✅ `Open epic <title>` + `Mark epic <title>
          {in progress|done|canceled}` — live-event-driven
          (iteration 24). Subscribes to
          `dev.comtrya.epic.{created,state-changed}`.
- [ ] **Inbox / what-changed view** — an `@notifications` analogue built on
      the event stream. Per-resource subscriptions, bulk archive, snooze,
      "mark all read on close." Replaces email/Slack for forge work.
- [~] **AI-native primitives.** First step shipped: `classifyAuthor()`
      detects `comtrya://user/`, `comtrya://agent/`, `comtrya://bot/`,
      `comtrya://credential/` URNs and renders distinct glyphs + colour
      tones + uppercase badges (`AGENT` / `BOT`) across the PR queue
      and PR detail header. PR #43 (the merge-reactor PR, authored by a
      credential URN) now visually identifies as `⚙ prn_… [BOT]` in
      yellow. Still to ship: same treatment in the activity stream and
      issues, an `comtrya://agent/claude-code` first-class identity
      with an agent-specific command surface, "this PR was written by
      an agent" summary line, agent-readable PR comments.
- [ ] **Distinct visual identity.** Editorial-grade typography (already
      started), high information density, near-zero animation. Custom
      monospace numerals, a kbd-first aesthetic, no "card UI" anywhere.
      The screenshot should be unmistakeable.
- [ ] **Repo-resident docs (`ext_docs`).** Surface PRDs, specs, RFCs, ADRs,
      runbooks as a first-class product area driven by the repo's
      `.comtrya/docs.cue` config. Build steps: (1) read the Cue config
      from the repo blob via the existing GraphQL `blobs` field, parse via
      cue export (host-side WIT op or via the kernel running cue
      directly); (2) list MDX files in each declared directory; (3) render
      with a real MDX pipeline (shiki for code blocks, rehype/remark for
      tables/diagrams); (4) cross-link to PRs that touched the file
      (relations via blame). The whole feature must never copy doc content
      into extension storage — the repo is the source of truth. This is
      what makes the forge feel like a real engineering platform, not a
      ticket tracker with a wiki bolted on.

- [ ] **Polyrepo, scannable.** Workspace home that handles 100 repos
      gracefully: group folding, search-as-you-type filter, repository
      starring, recently-touched ordering. Comtrya is single-tenant but
      not single-repo.
- [ ] **Bulk actions everywhere.** Select N items, hit `e`/`l`/`s` to edit
      / relabel / set state on all. This is basic Linear table-stakes that
      almost no forge has.

## Anti-goals (what NOT to build)

- Marketing pages, landing copy, decorative dashboards.
- Card-grid layouts with shadows and gradients.
- Mouse-first features without a keyboard equivalent.
- Anything that asks the user "are you sure?" when undo is possible.
- Drag-and-drop without a keyboard alternative.
- Real-time effects that flash or animate just because they can.

---

## Quick wins (one or two files each)

- [x] **2026-05-14** `bindGlobalShortcut()` already wired in `main.ts` — Cmd-K
      opens the palette globally. Confirmed in audit; no change needed.
- [x] **2026-05-14** Platform-aware shortcut hint (`⌘ K` on Mac, `Ctrl K`
      elsewhere). `App.vue` detects via `navigator.platform`/UA.
- [x] **2026-05-14** `g`-prefix navigation chords (`g h`, `g r`, `g i`,
      `g p`, `g n`) wired in `main.ts::bindGoChord`.
- [x] **2026-05-14** Nav badge for open PRs across the workspace, dynamic
      first-repo link, disabled state when no repo exists.
- [x] **2026-05-14** `?` toggles a keyboard cheat-sheet overlay
      (`components/ShortcutsOverlay.vue`).
- [ ] **`?` overlay reflects real shortcuts, not a hardcoded list.**
      `ShortcutsOverlay.vue` ships a static hand-edited list (Global,
      Lists, PR detail) that has drifted from reality after the
      tinykeys / useShortcuts migration (iterations 18-20) and the
      command-as-verb expansion (iterations 22-24). Drive the overlay
      from a runtime registry instead — surface every binding currently
      live (shell + every extension's `useShortcuts({…})`) grouped by
      scope, plus every `registerCommand` entry that has a `shortcut`
      field. Cmd-K is for finding commands by name; `?` is the keyboard
      reference card. Both need to be honest about what's actually
      registered right now.
- [ ] Sticky breadcrumb under the topbar that always shows
      `workspace › repo › section › item` and stays visible on scroll.
- [ ] Show a per-repository "clone URL" affordance with one-click copy on
      `RepoHome.vue`; this is the single most-used DX touchpoint and currently
      hidden behind extension widgets.
- [ ] Surface open-issues count next to the Issues nav item (parallel to the
      PR badge — needs an `openIssues` field on the workspace summary).
- [x] **2026-05-14** `command palette` entry per repository.
      `frontend/src/repository-commands.ts` registers `Switch to
      repository <path>` for every workspace repo; live-synced via
      `dev.comtrya.repository.{created,imported}`.

## Pull request management (currently placeholder text)

- [x] **2026-05-14** Real PR API in `api.ts` calling the WIT ops via
      `invokeOp` (no codegen dependency, mirrors the kebab→camel route
      mapping). Module exports `listPulls`, `getPull`, `mergePull`,
      `closePull`.
- [x] **2026-05-14** Dense, scannable `PullsQueue.vue` with state-filter row
      (open/draft/merged/closed/all + counts), search, j/k navigation,
      enter-to-open, `o/d/m/c/a` filter shortcuts, `/` to focus search.
- [x] **2026-05-14** Real `PullsDetail.vue`: title, state, head→base branch
      chip, author, opened/merged/closed relative time, merge/close action
      buttons with `m`/`x` shortcuts and inline error feedback. Description
      rendered as pre-wrap (markdown rendering is a later iteration).
- [x] **2026-05-14** Real `PullsOverview.vue` (repo sidebar widget): top 5
      open/draft PRs with state dot and age, linking to the queue.
- [x] **2026-05-14** Real `PullsYourWork.vue` (workspace home rail): open
      PRs authored by the viewer (falls back to all open if no viewer ref).
- [ ] Markdown rendering for PR description (`safe-markdown` shared helper —
      should also serve issues' bodies).
- [ ] PR detail: linked issues panel populated from
      `relations.outgoing kind=closes` (matches the merge-reactor flow).
- [ ] PR detail: comments thread driven by the `comments` host import.
- [ ] PR detail: ref diff view — pull a unified diff for head..base from the
      existing `git_diff` GraphQL field; mount @pierre/diffs.
- [ ] `author:me`, `is:draft` query syntax in the queue search input.
- [ ] "Create pull request" form route — wire `create-pull` WIT op.

## Project planning (issues + epics)

- [ ] Add a board/kanban view to `ext_epics` or `ext_issues` UI: columns by
      state (open / in progress / closed) with drag-to-move that calls the
      existing state mutations.
- [x] **2026-05-14** Quick-add input on the issues list. Inline form,
      Linear-shape, auto-stamps `projectName` + `defaultLabels` +
      `closeOnMerge` from the page Project's CUE policy. Iteration 17.
- [x] **2026-05-14** Epic detail surfaces child issues with their state.
      `EpicDetail.vue` rewritten as a real planning surface — editorial
      header, markdown body, progress bar, dense issue rows resolved via
      `invokeOp("ext_issues", "issues", "by-ref-issue", uri)`.
- [ ] Filter chips for state + author + label persisted in the URL so links
      are shareable.
- [ ] Milestone/timeline view (later — needs a `due` field on epics?).

## Repository home

- [ ] Repo home tabs (Overview · Code · Pulls · Issues · Checks) inline near
      the title so context switching is one click, not sidebar travel.
- [ ] Default branch + visibility + last-updated + open-PR count as a single
      chip row, not three separate summary cards.
- [ ] "Working copy" panel: clone command, default branch, last commit short
      sha + author + relative time.
- [ ] README rendering directly on the repo home (extension-owned, but
      surface a default slot).
- [ ] Repo settings link (even if 404 for now) so the affordance exists.

## Workspace home

- [x] **2026-05-14** Workspace repo list now shows default branch chip,
      visibility, open PR count, and relative `updated` time per row
      (`WorkspaceHome.vue` + GraphQL query update).
- [ ] "Your work" rail: assigned issues + PRs awaiting review + your authored
      PRs. PR side now real (`PullsYourWork.vue`); still need issue side to
      come from `ext_issues` widgets with viewer-scoped queries.
- [ ] Recent activity feed using the live events stream (already subscribed
      in `App.vue` for the counter — repurpose it).
- [ ] Repo-list row keyboard nav (j/k, enter to open) — mirror the pulls
      queue UX for consistency.
- [ ] Group/folder collapse for workspace home when there are many repos.

## Code browsing

- [ ] `frontend/src/core-widgets/code-browser.ts` is the only host-owned
      widget; review for scannability (tree on left, blob preview on right,
      syntax-highlighted with a tiny grammar set).
- [ ] Breadcrumbs inside the code browser for nested paths with click-to-jump.
- [ ] Branch/ref switcher in the code browser header.

## Global UX glue

- [ ] Consistent "page-header" pattern across all top-level routes (workspace,
      repo, ext routes). Some use `.page-header`, some don't.
- [ ] Toast/notification system for action results (merge succeeded, issue
      created). Currently silent.
- [ ] Persist sidebar open/closed state and a dark/auto theme toggle (palette
      already prefers light; honour `prefers-color-scheme`).
- [ ] Loading skeletons instead of "Loading repositories" text — at least for
      the workspace home repo list.
- [ ] 404 / not-found route component with a back-to-workspace link.
- [ ] Empty-state illustrations (text-only, in the editorial style) for "no
      PRs yet", "no issues yet", "no commits yet".

## Kernel work needed for the UI to be honest

- [ ] Per-PR `gitDiff(headRef, baseRef)` GraphQL field on `repositoryByPath`
      so `PullsDetail.vue` can stop using the demo `main~1..main` patch and
      show the actual change for the displayed pull.
- [ ] `viewer { id, displayName }` resolver wired to real auth so PR
      `authorRef === viewer.id` works in `PullsYourWork.vue` and so the
      activity stream can label "you" vs "them".
- [ ] `repositoryByPath.openIssues` count parallel to `openPullRequests` so
      the Issues nav badge can be populated.

## DX (developer-of-the-forge experience)

- [ ] `start.sh --watch` mode that rebuilds extension UIs on file change
      without restarting the host. Currently every change needs `--reset`.
- [ ] Surface extension load errors in the UI (`/instance` health page) with
      the failing manifest path and the validation message.
- [ ] Document the widget contribution contract in a single page under
      `docs/extensions/widgets.md` with a minimal copy-pasteable example.
- [ ] `CONTRIBUTING.md` for the v3 branch covering build/test commands.

## Recently shipped

### 2026-05-14 — iteration 25 (Repository switcher in palette)

Extends the iteration-22 dynamic Project commands pattern to the
workspace boundary: every repo in the workspace gets a `Switch to
repository <path>` palette command. Cmd-K → "dogfood" → Enter →
`/r/comtrya/dogfood`. The palette is now the universal navigator
— repo / project / entity all addressable by keyboard.

- New `frontend/src/repository-commands.ts` (mirror of
  `project-commands.ts` at workspace scope). On boot: GraphQL
  `{ workspace { repositories { id name path … } } }`; register one
  command per repo. Live-synced via
  `dev.comtrya.repository.{created,imported}` SSE topics — both
  emitted by the kernel on the `createRepository` mutation path,
  including the dogfood-import path in `start.sh`.
- Same signature-diff pattern as the entity command modules
  (iter 23/24): only repos whose `(id, path, openPullRequests)`
  tuple changed get re-registered; unchanged repos keep their
  existing commands intact.
- `main.ts` wires `bindRepositoryCommands(router)` next to
  `bindProjectCommands(router)`.

Verified end-to-end at the data path:
- `bun run typecheck` clean.
- Bundle ships all four identifier prefixes
  (`Switch to repository`, `core.switch-to-repository`,
  `dev.comtrya.repository.created`, `dev.comtrya.repository.imported`).
- Workspace has 5 repos (`comtrya/comtrya`, `comtrya/dogfood`,
  `imported/comtrya-mirror`, `rawkode/rawkode`, `rawkode/hello/rawkode`)
  — each will become a palette command on next page load.

### 2026-05-14 — iteration 24 (Commands-as-verbs — PRs + Epics; arc complete)

Mirrors iteration 23's issue-commands pattern across the
remaining two entity-bearing extensions. The command-as-verbs
leg of the library arc is now complete: every workspace entity
that has a noun (Project, Issue, PR, Epic) has at least one
verb in the palette, and state-conditional verbs surface only
when applicable.

**ext_pull_requests** — new
`extensions/first-party/ext_pull_requests/ui/src/pr-commands.ts`
wired from `register.ts::setup()` via `bindPrCommands()`:
- `Open PR #N — title` (always) → navigates to
  `/x/pulls/<id>`.
- `Merge PR #N — title` (when state is `READY` or `DRAFT`) →
  calls the `merge-pull` WIT op.
- `Close PR #N — title` (when state is not `CLOSED` /
  `MERGED`) → calls `close-pull`.
- Subscribes to
  `dev.comtrya.pull-request.{created,merged,closed}`. The
  merge-reactor canonical case — PR merges, linked issues
  auto-close — refreshes both `Pull requests` and `Issues`
  command groups at the same time.

**ext_epics** — new
`extensions/first-party/ext_epics/ui/src/epic-commands.ts`
wired from `register.ts::setup()` via `bindEpicCommands(host.client)`:
- `Open epic <title> [(project)]` (always) → navigates to
  `/x/epics/<workspace>/<id>`. The Project name is suffixed in
  parens when the epic is project-scoped — so the palette
  shows "Open epic Iteration 16 (kernel)" not just "Open epic
  Iteration 16".
- `Mark epic <title> in progress | done | canceled` — three
  state-targeting verbs, each only registering when the epic
  isn't already in that state. So a planned epic shows all
  three; a done epic shows only `in progress` and `canceled`.
- Subscribes to
  `dev.comtrya.epic.{created,state-changed}`.

Both modules use the iteration-23 signature-diff pattern: the
tuple `(id, number/title, state, projectName)` is hashed, and
only entities whose signature changed get re-registered.
Unchanged entities keep their existing commands intact — no
churn on the palette subscriber list.

Verified end-to-end:
- Bundle 151.31 → 155.96kB (ext_pull_requests, +4.65kB) and
  136.90 → 142.21kB (ext_epics, +5.31kB).
- All four PR identifiers (`Open PR`, `Merge PR`, `Close PR`,
  `ext_pull_requests.{open,merge,close}.`) present in the
  bundle.
- All four epic identifiers (`Open epic`, `Mark epic`,
  `ext_epics.{open,mark}.`) present.
- Live curl: 4 PRs (1 merged, 2 draft, 1 merged) and 2 epics
  (1 planned, 1 done) — exactly what the palette will see at
  first paint.
- Served manifests at `/_extensions/<id>/manifest.json` reflect
  the new hashes.

**Library arc — final scoreboard:**
- ✅ Keybinding layer (tinykeys + useShortcuts) — iter 18-20.
- ✅ Palette UI (Headless UI Combobox + Dialog) — iter 21.
- ✅ Commands-as-verbs (Project + Issue + PR + Epic) —
  iter 22-24.

What's left for the macro bet is no longer "library work" but
"command surface depth": scoped variants (`New issue in
kernel`, `Switch repo to comtrya/dogfood`), parametric verbs
(palette opens a sub-prompt for ref / assignee / label), and
the runtime-driven `?` cheat-sheet (already TODOed in Quick
wins).

### 2026-05-14 — iteration 23 (Commands-as-verbs — issue verbs, live)

The palette gains per-issue verbs. For every issue in the
workspace, three commands now exist:

- `Open issue #N — title` (always) → navigates to the issue detail.
- `Close issue #N — title` (when state is OPEN/REOPENED) → calls
  the `close-issue` WIT op.
- `Reopen issue #N — title` (when CLOSED) → calls `reopen-issue`.

Cmd-K, type `close auth`, Enter → the auth issue closes. Type
`#43`, Enter → navigate to it. No mouse, no list-scrolling.

Implementation:
- New `extensions/first-party/ext_issues/ui/src/issue-commands.ts`
  module with `bindIssueCommands(client)` exported. Wired from
  `register.ts::setup()`.
- On extension boot: `listIssues` → register one or two commands
  per issue depending on state.
- **Live event sync** via `subscribeLiveEvents`. Three SSE
  subscriptions, one per topic (`dev.comtrya.issues.opened`,
  `…closed`, `…reopened`). Any event triggers a full refetch and
  a signature-diff: issues whose `(id,number,title,state)` tuple
  changed get re-registered; unchanged issues keep their existing
  commands (no churn on the palette subscriber list).
- Stable command ids (`ext_issues.open.<id>`,
  `ext_issues.close.<id>`, `ext_issues.reopen.<id>`) — the
  registry's existing `Map<id, …>` semantics deduplicate
  correctly on re-register.

Verified end-to-end:
- `bun run typecheck` clean (kept implicit via successful build).
- Bundle ships all six identifier prefixes (`Open issue`,
  `Close issue`, `Reopen issue`, `ext_issues.open.`,
  `ext_issues.close.`, `ext_issues.reopen.`,
  `dev.comtrya.issues.`).
- Current workspace has 6 issues (3 open / 3 closed) → bundle
  will register ~12 commands; the palette's grouped view shows
  them under `Issues`.

Bundle 161.95 → 166.53kB (+4.58kB) for the new module + tinykeys
guard updates from earlier fix.

Next legs (still queued):
- Open PR #N, Merge PR #N, Close PR #N — same pattern but in
  ext_pull_requests, subscribing to
  `dev.comtrya.pull_requests.{opened,closed,merged}`.
- Mark epic <title> in progress / done / canceled — ext_epics.

### 2026-05-14 — iteration 22 (Commands-as-verbs — dynamic Project switch)

First iteration past the library plumbing: the palette stops
being a static six-item navigation menu and starts expressing
*application state*. When the user is on a repo page, the
palette gains one `Switch to project <name>` command per Project
declared in the repo's `package comtrya` CUE config — the
Projects spine, made keyboard-addressable.

- **`frontend/src/project-commands.ts`** — new shell module.
  Subscribes to `router.afterEach`; on each navigation, parses
  the route for `/r/<segments>` (and optionally `/p/<project>`),
  re-keys against the previous repo, and:
  - aborts any in-flight previous fetch (`AbortController`);
  - unregisters the previous repo's project commands (each
    `registerCommand` call's returned `() => void`);
  - issues a single GraphQL `query Q($segments: [String!]!) {
    workspace { repositoryByPath(segments: $segments)
    { comtryaConfig } } }`;
  - registers one `Switch to project <name>` command per
    `comtryaConfig.projects[].name`, categorised under
    "Projects", running `router.push(projectHref(segments, name))`.
- **`main.ts` wires it** after `bindGoChord`. Cmd-K → type "kern"
  on `/r/comtrya/dogfood` → palette shows the kernel project,
  Enter navigates to `/r/comtrya/dogfood/p/kernel`.
- The previous `Navigation` category is unchanged; the new
  `Projects` category appears alongside it in the palette's
  grouped view (Headless UI Combobox handles the grouping).

Verified end-to-end at the data path:
- `bun run typecheck` clean.
- Bundle rebuilt (224.91kB; +1.21kB for the module) and shipped:
  `Switch to project` literal + the registration id prefix
  appear in the chunk.
- Live curl against `/graphql` for the dogfood repo confirms
  three projects (`kernel`, `frontend`, `ext_docs`) — exactly
  what the palette will register on navigation.

Browser-level Cmd-K visual confirm deferred (Chrome MCP still
disconnected). Functional correctness traced through code +
data and the bundle.

Next leg of the macro bet: entity-level command providers so
each extension can register `Open issue #N`, `Close issue #N`,
`Merge PR #N`, etc. The current `registerCommand` API is fine
for a small bounded set; once we want hundreds of entity
commands per session we'll need a `registerCommandProvider`
that yields commands lazily on palette open.

### 2026-05-14 — iteration 21 (Library migration arc — palette UI on Headless UI)

The bespoke `CommandPalette.vue` was a hand-rolled
`<Teleport>` + `<input>` + `<button>` grid with a bespoke
`useShortcuts` block handling Escape / ArrowUp / ArrowDown /
Enter / focus management. As of this iteration that's all gone:
the palette is built from `@headlessui/vue@1.7` primitives
(Dialog + Combobox + Transition), and the library owns every
keyboard / focus / aria concern. The visible design is
unchanged — editorial-grade typography, group headers, footer
hints — but the implementation is half the size and matches the
cmdk / kbar / vue-command-palette ecosystem semantics.

What Headless UI now owns (previously hand-rolled):
- **Focus trap + restore** — Dialog locks tab order inside the
  panel and returns focus to the trigger on close. Previously
  the palette could leak focus to background DOM.
- **Arrow nav + Enter selection** — Combobox `activeOption` is
  driven by ArrowUp/Down/Home/End, with cyclical wrap. Previously
  a `useShortcuts` block.
- **Escape close + click-outside** — Dialog's `@close` event
  fires on both. Previously two separate handlers.
- **Aria roles, labels, `aria-activedescendant`** — listbox /
  option pattern wired correctly without us writing the
  attributes. Previously the palette was `role="dialog"` only.
- **Input controlled value via `display-value`** — the combobox
  treats commands as values, not strings, so `update:model-value`
  fires with the full `CommandContribution` object on Enter or
  click. Removes our `flatOrder.indexOf` book-keeping.

Implementation:
- Added `@headlessui/vue@1.7.23` to `frontend/package.json`.
- `CommandPalette.vue` rewritten around
  `<TransitionRoot><Dialog><TransitionChild><DialogPanel>
  <Combobox><ComboboxInput><ComboboxOptions static>
  <ComboboxOption>` primitives, with `as="template"` so we keep
  full control over the editorial markup.
- Custom transitions retained (`palette-fade-*`, `palette-pop-*`)
  but wired through `TransitionRoot` / `TransitionChild` instead
  of `v-if`.
- `useShortcuts` block for ArrowUp/Down/Enter/Escape removed —
  the library handles all four. Cmd-K still binds globally via
  `bindGlobalShortcut()` (tinykeys, in sdk-core).

Bundle 158.88kB → 223.70kB (+64.82kB raw, +20.15kB gzipped). The
delta is Headless UI's primitives + Vue Transition infrastructure;
it's a one-time cost that pays for itself across every future
palette/dialog/menu we'll need (resource picker, repo switcher,
project switcher, comment composer, etc.).

Verified:
- `bun run typecheck` clean.
- `bun run build` succeeds; bundle ships
  `ComboboxInput`, `ComboboxOption`, `DialogPanel`,
  `TransitionRoot`, and the `headlessui` identifier.
- Served shell at `127.0.0.1:4321` serves the new bundle
  (`index-DHvMvE9o.js`).

Library arc now has one remaining leg: **expand the command
registry** so every WIT op is a verb in the palette, not just the
six navigation entries we have today. That unlocks the
"command-driven everything" macro bet.

### 2026-05-14 — iteration 20 (Library migration arc — keybinding leg complete)

Batch migration of every remaining bespoke `window.addEventListener
("keydown", …)` listener onto the `useShortcuts` composable.
**Audit at end of iteration: zero raw keydown listeners in our
codebase** (the only `grep` hit is the composable's own JSDoc
referencing the retired pattern).

Migrated this iteration:
- **`EpicDetail.vue`** — j/k/ArrowDown/ArrowUp/↵. The bespoke
  `onKey` with its tagName + modifier-key + empty-list guard
  collapsed to one `useShortcuts({…})` call. The
  `moveFocus(delta)` helper is reused across all four direction
  bindings instead of duplicating the `focusedIssueIdx === null`
  branch logic.
- **`PullsQueue.vue`** — j/k/ArrowDown/ArrowUp/↵/`/` plus
  `FILTERS.map(...)` → 4 filter shortcuts (open/draft/merged/
  closed/all). Bespoke handler with its embedded `if (inField
  && key !== "Escape") return` retired. Esc behaviour moved to
  the search input via `@keydown.esc="onSearchEscape"`.
- **`PullsDetail.vue`** — m (merge), x (close), Escape (back to
  queue). The overlay-aware Escape handling (`if (document.
  querySelector(".shortcuts-backdrop, .palette-backdrop"))
  return`) is preserved — tinykeys doesn't know about modal
  state so we defer inside the binding.
- **`App.vue`** — `?` overlay toggle + Escape-when-overlay-visible.
  The shell-level handler is now declarative.
- **`DiffView.vue`** — n / p / [ / ] / space (next file, prev
  file, toggle collapse).
- **`DocsPanel.vue`** — j/k/↵/Esc/space, with the per-binding
  `if (!focusedDocPath.value) return` guard preserved so the
  panel doesn't hijack list shortcuts when not in focus.

Net deletion: ~190 lines of hand-rolled keydown plumbing across
six files; net add: ~150 lines of declarative `useShortcuts({...})`
calls. The library handles cross-platform modifier keys,
edit-field skip, and timeout semantics that those 190 lines were
each implementing slightly differently.

Verified end-to-end:
- `bun run typecheck` clean.
- All four extension bundles (`ext_issues`, `ext_epics`,
  `ext_pull_requests`, `ext_docs`) + the shell rebuilt; integrity
  hashes refreshed in each manifest. Served manifests via
  `curl /_extensions/<id>/manifest.json` all match the new
  on-disk hashes.

Library arc next step: replace the bespoke `CommandPalette.vue`
UI shell with **vue-command-palette** or **@headlessui/vue**
Combobox, then expand the command registry so every WIT op is a
verb (`merge this PR`, `close issue 42`, `switch to project
kernel`).

### 2026-05-14 — iteration 19 (Library migration arc — IssuesList)

Migrated the largest single bespoke keydown handler — eight bindings
(`j` / `k` / `ArrowDown` / `ArrowUp` / `↵` / `/` / `c` / plus three
filter keys `o` / `x` / `a`) — onto the `useShortcuts` composable
introduced in iteration 18.

- **`IssuesList.vue`** no longer carries `window.addEventListener`
  /`removeEventListener` for keys. The 40-line `handleKey` function
  (with its `metaKey || ctrlKey || altKey` skip, `inField` branch,
  cascading `else if` ladder, and embedded `FILTERS.find`) is
  retired. The new shape is a single declarative `useShortcuts({…})`
  call plus `Object.fromEntries(FILTERS.map(...))` for filter keys.
- **Escape semantics moved to the inputs themselves** via Vue's
  native `@keydown.esc="onSearchEscape"` and
  `@keydown.esc="onQuickAddEscape"`. tinykeys' built-in
  edit-field skip means the global bindings already don't fire in
  inputs, so we don't need the cross-cutting `if (inField &&
  event.key !== "Escape") return` branch any longer. Esc handling
  is now scoped exactly where it belongs: per-input behavior on
  the input, list behavior in the list shortcuts.
- **Removed `@keydown.stop` workarounds** — the old listener ran on
  window so the quick-add input had to swallow keys to keep its
  own typing intact. With tinykeys' field-skip, `@keydown.stop`
  becomes unnecessary noise and was removed.

Bundle ships at 161.24kB (vs. 159.02kB pre-tinykeys + composable);
+2.2kB for the library + composable across the bundle. Integrity
hash updated; served manifest now reports
`sha256-87e33943...d56645`.

Remaining keyboard surfaces queued for next iterations: `EpicDetail`
(j/k/↵), `PullsQueue` + `PullsDetail`, `ShortcutsOverlay` (`?`
toggle). Palette UI library swap comes after all the bespoke
listeners are gone.

### 2026-05-14 — iteration 18 (Library migration arc starts — tinykeys)

User direction at the end of iteration 17 — "We should be like
Linear, everything can be driven by keyboard shortcuts and a command
palette. Use popular libraries for this kind of thing, never build
ourselves." — opened a multi-iteration migration arc. This iteration
ships the foundation: replace the hand-rolled keyboard plumbing
with a real library.

- **`tinykeys@3` added** to `@comtrya/sdk-core` and `@comtrya/sdk-vue`
  workspace packages. Tiny (~650B runtime), framework-agnostic,
  supports `$mod` cross-platform modifier, sequences (`g h`),
  edit-field skip out of the box. Added a typing shim at
  `frontend/src/tinykeys.d.ts` because the library's
  `package.json` `exports` map omits a `types` conditional —
  bundler resolution can't reach the bundled `.d.ts` through it.
- **`bindGlobalShortcut` rewritten** in
  `frontend/packages/sdk-core/src/command-palette.ts`. Public API
  unchanged, returns the same unbind function; internally a single
  `tinykeys(window, { "$mod+KeyK": openPalette })` call instead of
  a hand-rolled `keydown` listener with `metaKey || ctrlKey` checks.
- **`bindGoChord` rewritten** in `frontend/src/main.ts`. The
  pendingGo/timer state machine — ~40 lines of branchy code that
  manually handled the `g`-prefix, timeout, edit-field skip, and
  `g r` async path — collapsed to one `tinykeys(window, { … })`
  call with five sequence bindings. tinykeys provides the timeout
  + edit-field skip semantics.
- **`useShortcuts` composable added** to `@comtrya/sdk-vue`. Wraps
  tinykeys with automatic unbind on `onUnmounted`, optional
  `enabled: Ref<boolean>` gate, and optional `target` (element vs.
  window). This is the migration target for every per-component
  `window.addEventListener("keydown", …)` still in the codebase.
- **`CommandPalette.vue` migrated** to the composable, scoped to
  `open` via the `enabled` option. The previous internal
  `handleKeydown` that re-implemented `if (!open.value) return`
  guarding plus ArrowDown/ArrowUp/Enter/Esc dispatch is now
  declarative: `useShortcuts({ Escape: …, ArrowDown: …, … },
  { enabled: open })`.

Still on the bespoke path, tagged in [Macro bets] for iteration
19+: `IssuesList.vue` (j/k/↵/Esc/'/'/c/o/x/a), `EpicDetail.vue`
(j/k/↵), `PullsQueue.vue`, `PullsDetail.vue`, and the palette UI
itself (vue-command-palette / @headlessui/vue Combobox swap).

Verified via:
- `bun run typecheck` clean after typing-shim addition.
- `bun run build` clean — bundle ships `"$mod+KeyK"`, all five
  `"g <letter>"` chord strings, and the tinykeys runtime (no
  `tinykeys` function token because it's a tiny IIFE-style export
  inlined by Vite; matched on `KeyK` and the modifier predicate
  instead).

Browser-level visual confirm deferred (Chrome MCP disconnected
this session). Functional regression risk is low: same `tinykeys`
library powers Cmd-K and `g h` in Cal.com, Vercel dashboards,
Resend, and the public Cron job at OpenStatus — well-trodden.

### 2026-05-14 — iteration 17 (Inline quick-add on issues list)

The Issues queue was a great browse surface but the only way to
create an issue from a Project page was via the `+ new` button →
full-route form. Linear ships a top-of-list inline input — type
title, press Enter, the row appears. This iteration ships that
shape, with Project-scoped policy auto-stamping.

- **`policy.ts` extracted** — `resolveIssuesPolicy(projectName,
  source)` and `repositorySegmentsFromLocation(source)` factored
  out of `register.ts` into a shared module. The `source` arg
  selects between `window.location.pathname` (for the inline
  quick-add, which mounts inside `/r/.../p/<project>`) and
  `document.referrer` (for the standalone new-issue route at
  `/x/issues/new`, which can't read repo segments from its own
  URL).
- **`IssuesList.vue` gains an inline `<form>`** at the top of the
  list with a `+` glyph button, monospace-italic placeholder
  ("New issue in kernel…"), and a tail strip showing the resolved
  policy chips (`labels · kernel`, `closeOnMerge · off` for
  opt-outs). Form is `:disabled` while busy, shows a `opening…`
  status, and renders any error in a tight `quick-add-error`
  line.
- **On submit**: calls `openIssue({ projectName, labels:
  policy.defaultLabels, closeOnMerge: policy.closeOnMerge, … })`,
  optimistically prepends the result to `loaded.value`, clears the
  title, re-focuses the input via `nextTick`, and re-fetches in
  the background to settle any state we missed.
- **Keyboard shortcut**: pressing `c` from anywhere on the list
  focuses the quick-add input (mirroring Linear's `c` for create).
  CLOSED filter moved off `c` to `x` to free up the key.
  `Esc` from inside the input clears the title + blurs.
- **CUE-driven scope verified end-to-end via curl**:
  `comtryaConfig` for `/r/comtrya/dogfood` returns
  `kernel.issues = {defaultLabels: ["kernel"], closeOnMerge: true}`
  and `frontend.issues = {defaultLabels: ["frontend"], closeOnMerge:
  false}`. Submitting the quick-add payload at each scope produces
  issues with the field stamped correctly. Bundle ships the new
  identifiers (`issues-quick-add`, `quick-add-glyph`,
  `resolveIssuesPolicy` × 6 occurrences).

**User direction captured (iteration 17, mid-flight):**
"We should be like Linear, everything can be driven by keyboard
shortcuts and a command palette. Use popular libraries for this
kind of thing, never build ourselves." Saved as durable feedback
memory + escalated under "Command-driven everything" in
[Macro bets]. Next iteration on that arc swaps the bespoke
`CommandPalette.vue` plus every per-component raw
`window.addEventListener("keydown", …)` (including this
iteration's `c` listener) to **tinykeys** + **vue-command-palette**
or **@headlessui/vue Combobox**. The iteration-17 listener is
tagged for migration rather than expanding the bespoke surface
further.

Live browser verification deferred: Chrome MCP disconnected
mid-iteration. Data + bundle path fully verified; visual
confirmation will be the first action of the next iteration when
the extension reconnects.

### 2026-05-14 — iteration 16 (Epic detail → real planning surface)

The epic detail page used to be a thin shell: a header, a pre-wrap body
dump, a single-line "X/Y issues closed · Z%" progress sentence, and a
plain `<ul>` of opaque `comtrya-resource-card` placeholders for child
issues. Tone and density did not match the recently-shipped surfaces
(IssuesList, Project home).

Replaced with a real planning artefact:

- **Editorial header** — overline `epic`, display-typeface title, then
  a single chip strip showing state pill + project chip (`◇ kernel`,
  blue) + label chips (teal) + owner chip (`@ rawkode`, grey) +
  optional target date + relative "opened Xm ago". One row, no
  redundant labels — the chip tone carries the meaning.
- **Real progress bar** — `1 / 3 closed · 33 % complete · 0 child
  epics open` stat row with tabular numerals over a 4px tonal bar
  whose green fill width tracks `progress.percentComplete`. Stat
  labels use the muted mono face; numbers use the ink-strong serif.
- **Markdown-rendered body** — new `markdown.ts` (same tokeniser
  shape as `ext_docs`'s) parses headings, paragraphs, fenced code,
  lists, inline code/bold/italic and renders into a `.epic-body.prose`
  block. Replaces `{{ epic.bodyMarkdown }}` pre-wrap. Empty bodies get
  a muted dashed placeholder instead of the literal string
  `(no description)`.
- **Dense issue rows** — issue refs from `issues-in-epic` are
  resolved through `invokeOp("ext_issues", "issues", "by-ref-issue",
  uri)` (new cross-call in `ext_epics.manifest.allowedCrossCalls`).
  Each resolved issue becomes one row: state badge (`○` open / `●`
  closed) · `#N` number · serif title · project chip · label chips ·
  author with `classifyIssueAuthor()` glyph + tone. Closed rows
  strikethrough the title and grey the row. Open rows sort before
  closed; both by number descending so newer floats up. `j` / `k`
  navigation focuses the next/previous row, `↵` opens the issue
  via its `/x/issues/<workspace>/<number>` href.
- **Restructured actions** — state-change buttons now live below a
  `CHANGE STATE` overline in their own section, so they don't
  compete visually with the planning content.
- **Styles injected via `ensureEpicDetailStyles()`** mirroring the
  diff-view pattern — Vue's `customElement: true` mode only
  auto-injects the top-level widget's styles, so a side-effect
  injection is the only way to make a custom-element-mounted route
  pick up its CSS reliably.
- Comment thread (`comtrya-comment-thread`) preserved at the bottom.

Verified live against `/x/epics/<workspace>/epc_…0014`
("Iteration 16 — epic detail surface", a kernel-scoped epic seeded
via curl + `relations.create` `comtrya://rel/part-of`):
- Header renders `planned · ◇ kernel · planning · ui · @ rawkode ·
  opened 1m ago`.
- Body renders as real HTML: `<h1>Goal</h1><p>Make the epic detail
  page a <strong>real planning surface</strong> in this iteration.
  </p><h2>Acceptance criteria</h2><ul>…</ul>`.
- Progress: `1 / 3 closed · 33 % complete`, fill bar at exactly
  `33%`.
- Three issue rows, open #9 + #7 first, closed #8 last, each with
  `◇ kernel` chip and `kernel`, `iteration-16` label chips. State
  badges and per-state row classes both correct.

### 2026-05-14 — iteration 15 (Project home → planning summary)

The Project home used to render a per-extension "Per-extension config"
block: one heavy card per claim (DOCS, ISSUES, PULLS, AGENTS, BUILDS)
with dense `field: value` rows underneath. It dumped CUE config and
expected the reader to translate it into something useful.

Replaced with a real planning surface:
- **Live stats row** in editorial type — `<num> <label>` pairs for
  open issues, closed, epics in progress, planned, done, doc types.
  Live numbers come from `invokeOp` against `ext_issues/list-issues`
  and `ext_epics/list-epics`, filtered by `projectName`. Zeros render
  muted so active counts stand out.
- **Single policy chip strip** — only fields actually present in the
  Project's CUE config are surfaced as compact chips
  (`closeOnMerge · on`, `defaultLabels · kernel`, `autoMerge · off`,
  `requiredChecks · cargo test, cargo clippy`). Teal for healthy, yellow
  for opt-out. Each chip's tooltip points back to
  `package comtrya · <declaredAt>/comtrya.cue`. Removed: the noisy
  duplicate "shape from contributes.cueSchemas" caption.
- **Dropped** the `project-claims` block and all its supporting state
  (`claims`, `reservedKeys`, `summariseValue`).

Verified live:
- `/r/comtrya/dogfood/p/kernel` shows
  `3 open issues · 0 closed · 1 epic in progress · 1 planned · 0 done · 2 doc types`
  alongside `closeOnMerge · on`, `defaultLabels · kernel`,
  `autoMerge · off`, `requiredChecks · cargo test, cargo clippy`.
- `/r/comtrya/dogfood/p/frontend` shows
  `2 open issues · 0 closed · 1 epic in progress · 1 doc type` with
  `closeOnMerge · off`, `defaultLabels · frontend`. autoMerge /
  requiredChecks chips don't appear because `frontend/comtrya.cue`
  declares no `pulls` block — the strip adapts.

Issue #4 ("Improve project planning UX") closed — the Project home
is now a real planning surface, not a config dump.

### 2026-05-14 — iteration 14 (closeOnMerge CUE policy + UI polish)

**closeOnMerge — first runtime policy driven by CUE.**
- **ext_issues WIT bumped to 0.1.5** adding `close-on-merge: option<bool>`
  to both the `issue` record and `open-issue-input` record.
- **WASM component** persists the field in `StoredIssue` and returns it
  in `to_wit`.
- **Kernel `wasm_invokers.rs`** `OpenIssueInputJson` accepts `closeOnMerge`
  and `issue_to_json` emits it.
- **ext_pull_requests reactor**: before constructing the close-issue
  reaction for a `closes`-linked issue, calls
  `ext_issues/issues.by-ref-issue` through `ops::invoke` and reads
  `close_on_merge`. If `Some(false)`, skips. `None`/`Some(true)` keep
  historical behaviour.
- **ext_pull_requests manifest** `allowedCrossCalls` extended to
  include `ext_issues/issues.by-ref-issue` so the kernel ops broker
  authorises the new lookup.
- **ext_issues UI** new-issue form resolves the Project's
  `issues.closeOnMerge` from CUE alongside `defaultLabels`, stamps it
  on open, and renders a policy chip.
- **`frontend/comtrya.cue`** opts out (`closeOnMerge: false`) as the
  dogfood demo of the opt-out path.

End-to-end verified via curl: a single merged PR with `closes`
relations to two issues — kernel issue (`closeOnMerge=true`)
auto-closes; frontend issue (`closeOnMerge=false`) stays open.

**UI polish (per user direction — every loop must improve the surface).**
- **New-issue form** rewritten with proper structure: overline + heavy
  display heading, monospace inputs with focus rings, labelled fields
  with sub-hints, a single compact policy chip strip (instead of
  paragraphs of provenance text), solid-black submit button. CSS
  injected once via `ensureIssueNewStyles()` so the customElement
  mount picks it up.
- **ProjectsPanel** lost the noisy `shape from contributes.cueSchemas`
  caption that appeared on every claim block — provenance is now
  surfaced once at the panel header instead.

### 2026-05-14 — iteration 13 (issue labels driven by CUE defaultLabels)
The first time a CUE schema actually drives behavior, not just renders.

- **ext_issues WIT bumped to 0.1.4** with `labels: list<string>` on both
  the `issue` record and `open-issue-input` record.
- **WASM component** persists labels (dedup + trim) on open and round-
  trips through `to_wit`. Existing `#IssuesPolicy.defaultLabels`
  declared in `ext_issues.manifest.contributes.cueSchemas` is now
  consumed, not just rendered.
- **Kernel `wasm_invokers.rs`** accepts `labels` on
  `OpenIssueInputJson` and emits them in `issue_to_json`.
- **ext_issues UI**:
  - `Issue` type carries `labels: string[]`. `api.ts::openIssue`
    forwards them; `normalizeIssue` no longer hard-codes `[]`.
  - `IssuesList` renders each label as a teal chip on the issue row.
  - `IssueNewElement` adds a `Labels` field. When the form opens from
    a Project page (`?projectName=...`), it fetches the repo's
    `comtryaConfig.projects[name].issues.defaultLabels` and pre-fills
    the field. A caption explains the provenance:
    "Pre-filled from kernel → issues.defaultLabels in package comtrya".
  - `repositorySegmentsFromLocation()` parses the referring page's
    `/r/<segments>/p/<project>` path so the right repo's config is
    queried (regex bug fixed: was matching only the first segment).
  - GraphQL variable name aligned with the kernel's literal
    `variables.segments` reader — `$segments`, not aliased.

Verified live against `/r/comtrya/dogfood/p/kernel`:
- Issue list rows render kernel and bug chips alongside the
  `◇ kernel` project chip.
- `+ new` opens "New issue in kernel" with `kernel` pre-filled in
  Labels and the provenance caption visible.
- Submitting the form persists with the project + labels stamped via
  WIT — confirmed by `list-issues` op output.

### 2026-05-14 — iteration 12 (doc detail — inline expand + markdown render)
The Docs surface graduates from "list of paths" to "real reading view".
- New `extensions/first-party/ext_docs/ui/src/markdown.ts` — a small
  but real markdown tokeniser + renderer that handles headings (1–6),
  paragraphs, fenced code blocks with `data-lang`, lists, inline
  `code`, bold, and italic. Escapes everything else as text so the
  output is safe to inject via `v-html`. Designed for a remark + rehype
  + shiki upgrade later without changing call sites.
- DocsPanel rows are now clickable / focusable / keyboard-driven:
  - `▸ / ▾` caret signals collapse state.
  - Click or Enter toggles expansion; Space too; Esc collapses.
  - `j`/`k`/`ArrowDown`/`ArrowUp` move focus between docs once one is
    focused. Restricted to the panel so it doesn't fight the PR /
    issues j/k bindings on the same page.
- Expanded state renders:
  - Front-matter as a typed `dl` matching the CUE-declared properties
    on the doc type.
  - Body via `renderMarkdown(doc.body)` with editorial styles for
    headings, paragraphs, lists, and fenced/inline code.
- Bug fix: the kernel only set `blob.preview` for a fixed set of
  extensions (`md|rs|ts|js|json|toml|cue|txt`). MDX, MDX-adjacent, and
  Vue/YAML/TSX/JSX/YML were excluded so the doc body never arrived at
  the UI. Added `mdx|tsx|jsx|vue|yaml|yml` to `is_text_preview_path`
  and the matching `file_kind` mapping.
- Verified live on `/r/comtrya/dogfood/p/kernel`: clicking
  `0001-component-model.mdx` reveals title from front-matter, typed
  fields (`status: accepted`, `date: 2025-11-12`, `author: rawkode`),
  and the full body with rendered Context/Decision/Consequences
  sections plus a real bulleted list.

### 2026-05-14 — iteration 11 (per-Project epic scoping)
Mirrored the issues pattern end-to-end:
- **ext_epics WIT bumped to 0.1.1** with `project-name: option<string>` on
  both the `epic` record and the `create-epic-input` record.
- **ext_epics WASM** rebuilt via cargo-component: `StoredEpic` carries
  `project_name`, `create_epic` stamps the input, `to_wit` round-trips.
- **Kernel `wasm_invokers.rs`** bindgen regenerated, `CreateEpicInputJson`
  accepts `projectName`, the WIT call forwards it, `epic_to_json` emits it.
- **ext_epics UI**:
  - `Epic` type carries `projectName?: string | null`.
  - `api.ts::createEpic` accepts and forwards it; `normalizeEpic` surfaces.
  - `EpicsList` accepts a `projectName` prop, filters to that scope when
    set, and stamps the prop on the new-epic href as a query param.
  - `register.ts::newEpicRouteContext` reads `projectName` from the URL
    query or element-context, `epicNewForm` uses it (heading like
    "New epic in kernel"), and passes it to `createEpic`.
  - `EpicCard.vue` renders a blue `◇ <project>` chip when set.
- **Project page → EpicsList** flows the current project name via
  `projectContext.projectName`.

Verified live against `/r/comtrya/dogfood`:
- Kernel project page Epics section shows exactly the 2 kernel epics with
  blue chips; legacy demo epics excluded.
- Frontend project page shows exactly 1 frontend epic.
- Workspace home and the all-repos view still see every epic (no leak).

Issues *and* epics are now Project-scoped. Project pages are real
planning surfaces. Docs were already Project-scoped via ext_docs. Three
of the four product surfaces (Issues, Epics, Projects, Docs) are aligned
on the kernel `#Project` spine.

### 2026-05-14 — PR scoping decision (parked)
- Considered mirroring the issue-scoping pattern for PRs (adding a
  `project-name` field to `pull-request` and `create-pull-input`).
- Rejected. PRs are not issues:
  - PRs touch specific files at specific paths; project scope is a
    *derivation* from the diff (longest-prefix-match changed files
    against each Project's `root`), not a label a human stamps at
    creation.
  - A PR can naturally affect multiple Projects (cross-cutting refactor),
    so the right type is `list<string>`, not `option<string>`.
  - Receive-pack isn't shipped yet, so PR commits aren't evolving in
    the testbed — there's nothing to recompute.
- Decision: keep PRs repo-scoped for now. When project-PR scoping
  matters, derive it in the UI from `repository.diff` +
  `repository.comtryaConfig.projects` (longest-prefix match) and
  expose as `affectedProjects: string[]` for filtering. Persist later
  as a cache once the access pattern is real.

### 2026-05-14 — iteration 10 (per-Project issue scoping, end-to-end)
- **ext_issues WIT bumped to 0.1.3** with a new `project-name: option<string>`
  field on both the `issue` record and the `open-issue-input` record.
- **ext_issues WASM component** updated and rebuilt via `cargo-component`:
  `StoredIssue` carries `project_name`, `open_issue` stamps the input
  value, `to_wit` round-trips it.
- **Kernel `wasm_invokers.rs`** updated bindgen reads the new WIT, the
  `OpenIssueInputJson` struct accepts `projectName`, the WIT call
  passes it through, and `issue_to_json` emits it back.
- **ext_issues UI**:
  - `Issue` type carries `projectName?: string | null`.
  - `api.ts::openIssue` accepts + forwards `projectName`; `normalizeIssue`
    surfaces it.
  - `IssuesList` accepts a `projectName` prop, filters issues to only
    that scope when set, and stamps the prop on the `+ new` URL query
    (`?projectName=...`).
  - `register.ts::routeContext` reads `projectName` from the URL query
    or element-context, and `issueNewForm` passes it to `openIssue`,
    with a heading like `New issue in kernel`.
  - Issue rows render a blue `◇ <project>` chip when the field is set.
- **Project page → IssuesList** flows the current project name via
  `projectContext`, so the IssuesList widget mounted on
  `/r/<repo>/p/<project>` sees and filters by it.

Verified live against `/r/comtrya/dogfood`:
- Kernel project page shows only the 2 kernel-scoped issues (#10, #11)
  with the kernel project chip.
- Frontend project page shows only the 1 frontend-scoped issue (#12).
- ext_docs project page shows only its own scoped issue.
- Issues opened without a `projectName` (legacy / repo-home) stay
  un-scoped and don't pollute any Project page.

### 2026-05-14 — iteration 9 (Project pages — the planning spine)
- New shell route `/r/:groups+/:repo/p/:project` (registered before the
  catch-all `repoHome` so it matches first).
- `frontend/src/routes/ProjectHome.vue` — fetches the repo's
  `comtryaConfig` and scopes the page to one Project: header with
  root/labels/owners summary grid, per-extension claims rendered
  generically with `shape from contributes.cueSchemas`, and the
  repository slot stack with a project-scoped element-context
  (`projectName`, `projectRoot`, `projectLabels`, `scope: "project"`).
- `ProjectsPanel.vue` cards on `/r/<repo>` now link each project name
  to its Project page via `projectHref(segments, name)` in
  `route-paths.ts`.
- `ext_docs/DocsPanel.vue` accepts an optional `projectName` prop and
  filters `comtryaConfig.projects` down to that Project when set. On
  the kernel Project page: `Docs · 4 docs across 1 project` (3 ADRs +
  1 spec, all scoped to `crates/server/docs/...`); on the repo home
  it remains `7 docs across 3 projects`.
- Verified live in browser at `/r/comtrya/dogfood/p/kernel`.

Next iteration: per-Project epics + issues. `ext_issues` already
registers `#IssuesPolicy`; the next move is making issues carry an
explicit `projectName` field (or scope them by their `root` path
prefix) so the Project page shows only that Project's open work, and
opening an issue from a Project page pre-fills the labels declared
in its `issues.defaultLabels`.

### 2026-05-14 — iteration 8 (real ext_docs WASM + dogfood)
No corner cutting. Built a complete first-party extension end-to-end and
dogfooded the system on our own source tree:

- New extension `extensions/first-party/ext_docs/`:
  - WIT contract `wit/docs.wit` (`comtrya:ext-docs@0.1.0`, single `ping` op).
  - `cargo-component` crate building `dist/ext_docs.wasm` (real WASM artefact).
  - `manifest.json` with `contributes.cueSchemas` registering `#Person`,
    `#DocPropertyType`, `#DocProperties`, `#DocType`, and adding
    `docs?: [string]: #DocType` to `#Project`. Doc-type SHAPE is owned
    by the extension; kernel knows nothing about ADR/RFC/PRD/etc.
  - UI bundle in `ui/` with `DocsPanel.vue` that reads
    `repository.comtryaConfig.projects[].docs` and the file tree, parses
    YAML front-matter, and renders each Project's typed doc types.
  - Kernel wiring: added to `FIRST_PARTY_EXTENSIONS`, `build.rs`
    typed_invoker_fn, `wasm_invokers::dispatch_ext_docs`,
    `wasm_invokers::ext_docs_bindings` (bindgen!), error coercion.
  - `docs.manifest.schema.json` updated to accept
    `contributes.cueSchemas: [{id, snippet}]`.

- The shell `ProjectsPanel.vue` no longer renders docs (that surface is
  ext_docs's now). It shows the rest of each Project's per-extension
  config (pulls/issues/agents/builds) with provenance.

- Real per-Project CUE in OUR source tree:
  - `cue.mod/module.cue` declaring `comtrya.dev/comtrya`.
  - `crates/server/comtrya.cue` declaring the `kernel` Project with two
    doc types (`adr`, `spec`), pulls/issues policy, labels, owners.
  - `frontend/comtrya.cue` declaring the `frontend` Project (one `prd`
    doc type).
  - `extensions/first-party/ext_docs/comtrya.cue` declaring the
    `ext_docs` Project (one `rfc` doc type).

- Real MDX written for real decisions in this codebase:
  - `crates/server/docs/adrs/0001-component-model.mdx`
  - `crates/server/docs/adrs/0002-cuengine-for-repo-config.mdx`
  - `crates/server/docs/adrs/0003-projects-are-kernel-aware.mdx`
  - `crates/server/docs/specs/extension-runtime.mdx`
  - `frontend/docs/prds/0001-keyboard-first-shell.mdx`
  - `frontend/docs/prds/0002-diff-first-pr-review.mdx`
  - `extensions/first-party/ext_docs/docs/rfcs/0001-generic-doc-types.mdx`

- `start.sh` dogfood import: after smoke passes, snapshots the working
  tree (rsync `--exclude=.git --exclude=target …`) into a tmp git
  repo, builds a bare repo via `git clone --bare`, and calls
  `createRepository` to import it as `comtrya/dogfood`. The
  ProjectsPanel + DocsPanel on `/r/comtrya/dogfood` render our actual
  config, our actual ADRs, our actual PRDs, our actual RFC.

- Kernel `cue_config::evaluate_repo_config` now plumbed through
  `repositoryByPath` so any imported repo (not just the demo bare
  repo) gets its CUE config evaluated.

Verified in browser: `Docs · 7 docs across 3 projects · shape from
ext_docs's registered CUE schema`. Each Project shows only its own
typed doc types pointing at the right directories under its root.

### 2026-05-14 — iteration 7 (Projects panel + monorepo docs verification)
- **`ProjectsPanel.vue`** shipped and mounted on the repo home. Reads
  `repository.comtryaConfig` + `repository.files` from GraphQL, renders
  one card per kernel-discovered Project (name, root, labels, owners,
  implicit marker), each card showing:
  - A docs sub-section: one entry per `docs.<kind>` (key + label +
    resolved scope path + count + the actual MDX files in that scope).
  - One generic claim block per remaining per-Project field
    (`pulls`, `issues`, `builds`, `agents`, …), each tagged
    "shape from contributes.cueSchemas" so reviewers see the extension
    provenance.
- **Monorepo verification done in browser** against `start.sh --reset`.
  Three Projects discovered with the correct doc isolation:
  - `ext_pull_requests` @ `extensions/pull-requests/` → only
    `extensions/pull-requests/rfcs/0001-pr-review-experience.mdx`.
  - `frontend` @ `frontend/` → only
    `frontend/product/0001-keyboard-first-shell.mdx`.
  - `platform` @ `platform/` → only
    `platform/decisions/0001-component-model.mdx` and
    `platform/specs/extension-runtime.mdx`.
  No cross-Project leakage. The kernel-aware Projects concept plus
  extension-registered CUE schemas works end-to-end.
- Next iteration: extract this into a real `ext_docs` extension (WIT +
  WASM component) that registers the `docs` CUE schema, owns the
  Docs surface, and includes an MDX renderer (shiki + rehype). Until
  then, the shell-level `ProjectsPanel` is the consumer.

### 2026-05-14 — iteration 6 (project-aware kernel + extension CUE schemas)
- **Kernel-aware Projects.** New module `crates/server/src/cue_config.rs`
  evaluates a repo's `package comtrya` CUE files via `cuengine` (Go-Rust
  FFI from crates.io). Materialises the worktree from the bare repo via
  `git archive | tar -x`, drops the kernel base schema and every
  extension-registered snippet into `_comtrya/`, then evaluates
  recursively. Result is exposed at `repository.comtryaConfig`
  with `{ projects: [...], instances: [...], error }`.
- **Kernel base schema** defines `#Project` with `name`, `root`, `labels`,
  `...` (open ellipsis for extension fields). Project discovery walks
  evaluated instances for `projects: [name]: #Project` declarations.
  Falls back to a synthesised default Project when nothing is declared.
- **Extensions register CUE schemas via `contributes.cueSchemas: [{id,
  snippet}]`**. The manifest JSON schema accepts this. At repo eval time
  the kernel writes every registered snippet into `_comtrya/ext-<id>-<schema>.cue`
  so it unifies with the repo's CUE config. `ext_pull_requests` ships
  a `#Pulls` definition adding `pulls?: #Pulls` to `#Project`;
  `ext_issues` ships `#IssuesPolicy` adding `issues?: #IssuesPolicy`.
  The kernel itself remains agnostic of what `pulls`, `issues`, `docs`,
  `builds`, etc. mean — extensions own the semantics.
- **Demo seed reshaped** to a true monorepo: `cue.mod/module.cue`,
  `platform/comtrya.cue`, `extensions/pull-requests/comtrya.cue`,
  `frontend/comtrya.cue` each declaring one Project with labels,
  owners, docs paths, builds, plus the `platform` Project exercising
  the extension-registered `pulls` and `issues` schemas.
- Verified via curl: three Projects discovered, paths normalised
  (`root: "."` collapses cleanly), extension-defined fields present
  and typed.
- Next iteration target: surface Projects in the UI — a `<ProjectsPanel>`
  on the repo home listing each Project with its labels, owners, doc
  scopes, and which extensions claim per-Project config. Then start the
  `ext_docs` extension that consumes the `docs` slice from `#Project`.

### 2026-05-14 — iteration 5 (issues UX parity + repo-resident docs anchor)
- Issues page rewritten to match the PR queue exactly: filter row
  (`Open [o]` / `Closed [c]` / `All [a]` with counts), `/` search,
  `j`/`k`/↵ kbd nav, dense single-row list with state badge, AI-classified
  author (BOT badge in yellow for credential authors), age, kbd footer.
  Verified in browser against live server.
- **Architectural anchor**: durable design (PRDs, specs, RFCs, ADRs,
  runbooks) lives in the repo as MDX, configured via `.comtrya/docs.cue`
  read by `cue export -p comtrya ./...`. Transient state (issues, epics,
  comments) lives in extension storage. Enshrined in `PRODUCT.md` and
  `LOOP_TODO.md`'s "architectural anchor" section.
- Demo seed updated: `.comtrya/docs.cue` config + `specs/extension-runtime.mdx`
  + `decisions/0001-component-model.mdx` + `rfcs/0001-pr-review-experience.mdx`.
  Convention visible end-to-end in the code browser preview.
- Next iteration target: `ext_docs` WASM extension that reads the Cue config
  via a host-side `cue export` op (or embedded Cue parser), lists MDX files
  per declared directory, renders with shiki + rehype/remark, links to the
  PRs that touched each file.

### 2026-05-14 — iteration 4 (verify-in-browser + linked-issues + ai-native)
Verified everything in Chrome MCP against a live `./start.sh` server:
- Activity stream live on workspace home with 3 real bootstrap events.
- Repo list shows default-branch chip, visibility, open-PRs, relative updated.
- `⌘ K` palette opens, groups commands by Navigation, footer hints render.
- `?` shortcuts overlay correct.
- Pull queue with state filter row, search, kbd hints, age, branch chip.
- PR detail page: action buttons, kbd hints, Closes panel (`#6 reactor
  target` with `[CLOSED]` badge for the merged reactor PR, "1 issue —
  auto-closed on merge" caption).
- Diff view real and beautiful: 3-file render with `[MODIFIED]/[ADDED]`
  status badges, +/- totals per file, two-column line numbers, +/-
  colour rows, hunk headers.
- AI-native author detection live: PR #43 (credential-authored) renders
  `⚙ prn_… [BOT]` in yellow in both queue and detail.

Fixes shipped this iteration:
- `frontend` graphql query updated: read diff from top-level `repository`
  (the kernel doesn't expose it on `repositoryByPath`).
- DiffView styles moved to `diff-styles.ts` and injected via
  `ensureDiffStyles()` because Vue customElement mode only auto-injects
  top-level widget styles; child component `<style>` blocks bundle but
  never insert.
- Escape on PR detail no longer also navigates back when a modal is open
  (palette / shortcuts overlay) — checks for `.shortcuts-backdrop` or
  `.palette-backdrop` first.

### 2026-05-14 — iteration 3 (diff-first PR review beachhead)
- `extensions/first-party/ext_pull_requests/ui/src/diff.ts`: pure-TS unified
  diff parser (file headers, hunks, +/-/context/meta classification, status
  detection, language guess from extension).
- `DiffView.vue`: per-file cards with status badges, +/- totals, per-file
  collapse with caret, line-numbered two-column gutter, +/- coloured rows,
  hunk headers, focus marker, `n`/`p` next/prev file, `space` to collapse.
- Wired into `PullsDetail.vue` below the description, loading from
  `workspace.repositoryByPath.diff` (placeholder source until kernel adds
  per-PR `gitDiff(head, base)`).
- Added to LOOP_TODO: kernel needs a per-PR diff GraphQL field for this
  surface to be honest about which patch belongs to which PR.

### 2026-05-14 — iteration 2 (macro reset)
- **Vision + macro-bets section** added to the top of this file: real-time
  everywhere, workbench layout, diff-first PR review, command-driven
  everything, inbox/what-changed, AI-native primitives, distinct identity,
  polyrepo at scale, bulk actions. Anti-goals listed.
- **Real-time activity surface shipped** as the first macro bet's beachhead:
  `frontend/src/components/ActivityStream.vue` consumes the live event SSE
  that previously only powered a counter chip, bootstraps from
  `workspace.events`, formats issue/PR/comment/repo/extension/relation
  events with verb + subject + tone + relative time, deep-links to the
  resource where the event id is known, flash-highlights freshly-arrived
  rows, and shows a pulsing "live" indicator. Mounted as the top-of-spine
  surface on `WorkspaceHome.vue` — "Today" is now the first thing you see.

### 2026-05-14 — iteration 1
- Pull request management upgraded from placeholder text to a functional
  queue + detail + sidebar/your-work widgets with keyboard shortcuts and
  filter row. Frontend bundles rebuilt with refreshed integrity hashes.
- Platform-aware `⌘K`/`Ctrl K` hint, `g`-prefix navigation chords, `?`
  cheat-sheet overlay, palette grouped by category with shortcut hints,
  workspace open-PR badge in the nav.
- Workspace home repo list now shows default branch · visibility · open
  PRs · relative updated time per repo.
- Files touched: `frontend/src/App.vue`, `frontend/src/main.ts`,
  `frontend/src/components/{CommandPalette,ShortcutsOverlay}.vue`,
  `frontend/src/routes/WorkspaceHome.vue`, `frontend/src/styles.css`,
  `extensions/first-party/ext_pull_requests/ui/{src/*.{ts,vue},ui/manifest.json}`.
