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
- [ ] **Workbench layout** — three-pane (sidebar / list / detail),
      single route, no full-page reloads inside a section.
      Linear/Superhuman shape. Issues, pulls, and the inbox all live
      inside this shell. Implies replacing the per-route `<RouterView>`
      with a nested master-detail per extension.
      - **Why:** The single biggest UX gap vs. Linear/Superhuman is
        that today opening an issue/PR is a route swap with a fresh
        load — everything before is gone. A persistent list pane
        plus a detail pane (a la email clients) keeps context,
        eliminates back-button trips, and unlocks `j`/`k` navigation
        across rows *while* a detail is open. Without this, several
        downstream macro bets (inbox, bulk actions, real-time
        everywhere) can't deliver their promised shape.
      - **Arc shape (multi-iteration):**
        1. **Layout primitive** — new `frontend/src/components/
           Workbench.vue` with `<slot name="list"/>` + `<slot
           name="detail"/>`; CSS grid; configurable list-pane
           width with drag-resize persisted in localStorage; full-
           bleed mode (Cmd+\) hides the list.
        2. **Issues migration** — convert
           `extensions/first-party/ext_issues` to a single nested
           route `/x/issues/:id?` mounting `IssuesList` in the
           list slot and `IssueDetail` in the detail slot;
           clicking a row updates the URL without a full nav;
           `j`/`k` continues to work while detail is open.
        3. **Pulls migration** — same shape on
           `ext_pull_requests`.
        4. **Inbox migration** — the inbox macro bet ships into
           this shell from day one.
      - **Files:** `frontend/src/router.ts` (each extension
        registers a *parent* route with optional `:id`),
        `frontend/src/components/Workbench.vue` (new). Each
        extension's `register.ts` updated to provide the slot
        components. The current `IssuesList` / `IssueDetail` /
        `PullsQueue` / `PullsDetail` files mostly survive — they
        just compose differently.
      - **Acceptance:** opening an issue from the list does not
        unmount the list; `Esc` closes the detail (returns focus
        to the row); URL is shareable to the open detail;
        `j`/`k` while a detail is open navigates to the next
        issue *and* updates the detail pane.
      - **Depends on:** nothing kernel-side; significant
        frontend refactor — schedule across 3-4 iterations.
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
- [ ] **Inbox / what-changed view** — an `@notifications` analogue
      built on the live event stream. Per-resource subscriptions,
      bulk archive, snooze, "mark all read on close." Replaces
      email/Slack for forge work.
      - **Why:** The single behaviour that pulls users back to a
        forge daily is "what happened since I last looked". Today
        that means GitHub email or Slack pings — both noisy and
        un-actionable. An inbox built on the live event stream is
        the kill-feature for the Real-time-everywhere macro bet:
        same source data, different surface.
      - **Arc shape:**
        1. **Subscription model** — kernel resource:
           `subscription` with `(viewerUrn, resourceUrn)` rows.
           Auto-subscribe on author / commenter / assignee.
           Manual subscribe via `s` on any detail page.
        2. **Inbox view** — new top-level route `/inbox` rendering
           via the Workbench shell (depends on workbench arc).
           Lists undismissed events scoped to the viewer's
           subscriptions, newest-first.
        3. **Bulk actions** — `e` archive, `u` mark unread, `h`
           snooze (with sub-prompt for "1 hour / tomorrow /
           Monday"); selection via `x` like Gmail.
        4. **"Mark all read on close"** — when leaving a detail
           that has unread inbox entries, mark them dismissed.
      - **Files:** kernel — new `subscriptions` table /
        op-providing extension (probably `ext_inbox` first-party);
        UI — new `extensions/first-party/ext_inbox/` with WIT,
        WASM, UI bundle; new `frontend/src/routes/Inbox.vue`
        slot host (or a registered ext route).
      - **Acceptance:** every event with a `(viewerUrn, urn)`
        subscription match shows in the inbox; archive removes
        the row; snooze hides until the wake time; live events
        stream new rows in without refresh; `0` jumps to inbox
        from anywhere (Linear convention).
      - **Depends on:** Workbench layout arc; viewer URN; activity
        stream cursor field on kernel.
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
- [ ] **Distinct visual identity.** Editorial-grade typography
      (already started), high information density, near-zero
      animation. Custom monospace numerals, a kbd-first aesthetic,
      no "card UI" anywhere. The screenshot should be unmistakeable.
      - **Why:** The UI moat. Linear's identity (greys, mono
        numerals, hairline borders) is half their product story.
        We've started — chip strips, editorial overlines, serif
        display titles, mono numerals on counts — but the system
        isn't centralised. A future iteration could regress.
      - **Arc shape:**
        1. **Type system audit** — write down the actual scale
           (overline / display / body / mono) and codify it in
           CSS variables. Replace ad-hoc `font-size:` declarations
           with the token names. **Files:**
           `frontend/src/styles.css`, all `.vue` `<style>` blocks.
        2. **Colour token cleanup** — the existing CSS variables
           cover most, but per-component bespoke colours leak.
           Audit and reroute to tokens.
        3. **Motion budget** — codify "near-zero animation" as
           a literal rule: only state-change transitions allowed
           (palette open, toast in/out), no decorative motion.
           Strip any decorative `transition:` / `animation:`
           that doesn't communicate state.
        4. **Density bake-off** — measure rows-per-viewport on
           every list, target Linear's density (~28 issue rows
           in a standard viewport). Tighten anything below.
        5. **kbd glyph polish** — every shortcut hint uses a
           `<kbd>` element with consistent styling; uppercase
           letters with platform-aware modifiers (`⌘`/`Ctrl`).
      - **Acceptance:** documented type scale doc (under
        `docs/design/typography.mdx` via `ext_docs`); zero
        ad-hoc font-size declarations in `.vue` files
        (enforced by a grep in CI); no decorative animation
        anywhere; consistent `<kbd>` rendering across all hint
        chips and the cheat-sheet.
      - **Depends on:** nothing.
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
      gracefully: group folding, search-as-you-type filter,
      repository starring, recently-touched ordering. Comtrya is
      single-tenant but not single-repo.
      - **Why:** The product needs to scale to a real org's repo
        count without becoming a wall of text. Today the workspace
        home is a flat list — fine for 5 repos, broken at 50.
      - **Arc shape:**
        1. **Group folding** — already broken out as a separate
           Workspace home item; first leg of this macro bet.
        2. **Search-as-you-type** — `/` focuses a filter input;
           filters by repo name + path; debounced 50ms; results
           ranked by exact-prefix > substring > recently-touched.
        3. **Starring** — `s` on a focused repo row toggles a
           per-viewer star (kernel: `repository.starredAt(viewerUrn)`).
           Starred repos pin to a "Starred" group at top.
        4. **Recently-touched ordering** — within each group,
           default sort is `updated DESC`. Sort toggle (`o n`
           name, `o u` updated, `o s` stars).
      - **Files:** `frontend/src/routes/WorkspaceHome.vue` plus
        kernel `viewer.starredRepositories` resolver and a
        `starRepository(urn)` mutation.
      - **Acceptance:** a workspace with 100 seeded repos renders
        without scroll-jank; `/` finds a repo by 3-char prefix in
        <50ms; star/unstar persists; starred group renders first.
      - **Depends on:** group-folding ships first; viewer URN.

- [ ] **Bulk actions everywhere.** Select N items, hit `e`/`l`/`s`
      to edit / relabel / set state on all. Basic Linear table-
      stakes that almost no forge has.
      - **Why:** Operating at scale (any team grooming 50+ open
        issues weekly) demands bulk ops. Without them, every
        relabel is a click-by-click drudge that pushes users
        back to the CLI.
      - **Arc shape:**
        1. **Selection model** — `x` toggles selection on the
           focused row; `Shift+J/K` extends selection; `*` selects
           all visible; `Esc` clears. Composable in `@comtrya/sdk-
           vue::useSelection`.
        2. **Bulk action bar** — when ≥1 selected, a sticky
           action bar appears at the bottom with the count and
           the available verbs (`e` edit, `l` label, `s` state,
           `Backspace` delete with confirm).
        3. **Per-extension verb registry** — extensions register
           bulk verbs alongside per-row commands (parallel to
           the iter 23-24 `*-commands.ts` modules). E.g.
           `bulkLabelIssues(ids[], labels[])`.
        4. **Server-side batch ops** — every bulk verb maps to a
           single WIT op call taking a list of ids, not N
           individual calls. Reduces round-trips and keeps the
           live event stream coherent.
      - **Files:** `frontend/packages/sdk-vue/src/useSelection.ts`,
        new `frontend/src/components/BulkActionBar.vue`, and per-
        extension batch ops + UI verbs in `ext_issues`,
        `ext_pull_requests`, `ext_epics`.
      - **Acceptance:** select 5 issues with `x`, hit `l`, type
        `bug,kernel`, Enter — all five gain both labels in one
        op call. Activity stream shows the batch as one entry
        with a "5 issues labelled" summary, not five entries.
      - **Depends on:** Workbench layout (selection only really
        works once the list pane persists).

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
- [ ] **Sticky breadcrumb under the topbar.** Always shows
      `workspace › repo › section › item`, stays visible on scroll.
      - **Why:** Once Workbench layout lands, every section is one route
        with a deep stack; users need a constant "where am I" without
        looking at the URL bar. Linear's breadcrumb is the reference.
      - **Files:** new `frontend/src/components/Breadcrumb.vue`; mount in
        `App.vue` between the topbar and `<RouterView>`. Source the trail
        from `router.currentRoute.value.matched` plus per-route `meta.crumb`
        (a function that takes the route and returns `{label, to}`).
      - **Acceptance:** every top-level route declares its crumb via
        `meta.crumb`; the breadcrumb renders for workspace / repo / project /
        ext routes; the last segment is non-link; `position: sticky;
        top: var(--topbar-h)` keeps it pinned. Editorial type, no chevron
        glyph icons — use the literal `›` character.
      - **Depends on:** nothing; can ship before Workbench layout and
        survive the migration since `matched` works for both shapes.

- [ ] **Per-repository clone-URL affordance with one-click copy on
      `RepoHome.vue`.** Currently hidden behind extension widgets.
      - **Why:** "Get me the clone URL" is the single most-used DX touchpoint
        on a repo page; making the user expand a widget to find it is a
        keyboard-hostile detour.
      - **Files:** `frontend/src/routes/RepoHome.vue` header; add a small
        helper in `frontend/src/route-paths.ts` like `cloneUrl(segments)`
        returning `git@<host>:<path>.git` (host comes from a kernel-exposed
        `workspace.gitOrigin` field — see kernel section below) and falling
        back to `http://localhost:<port>/git/<path>.git` in dev.
      - **Acceptance:** a one-line chip strip at the top of `RepoHome.vue`
        showing `git clone <url>`. Click on the chip copies via
        `navigator.clipboard.writeText`; a 1.5s toast (or inline "copied"
        chip swap) confirms. Keyboard: focusable with `tabindex=0`,
        `Enter`/`Space` triggers copy. Don't pop a modal.
      - **Depends on:** `workspace.gitOrigin` resolver on the kernel
        (cheap — read from config). Can ship with `localhost` placeholder
        first and tighten later.

- [ ] **Open-issues count next to the Issues nav item.** Mirrors the PR
      badge that already ships.
      - **Why:** The forge's primary "what changed" surfaces are PR queue
        and Issues queue; both should pulse the same way in the sidebar.
        Asymmetry suggests issues are a second-class citizen.
      - **Files:** `frontend/src/App.vue` (the `g i` nav item), kernel
        resolver `crates/server/src/main.rs::build_repository_summary` to
        add `openIssues` parallel to `openPullRequests`; underlying count
        comes from `ext_issues/issues.list-issues` filtered to OPEN — same
        cross-call pattern the merge-reactor uses.
      - **Acceptance:** `repositoryByPath { openIssues }` resolves; nav
        Issues item shows `Issues 4` (or no chip when zero); the chip
        re-renders without a page refresh when an issue opens/closes
        (subscribe to `dev.comtrya.issues.{opened,closed}` and refetch,
        same shape as the PR badge already does).
      - **Depends on:** kernel work item below ("`openIssues` count
        parallel to `openPullRequests`").
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
- [ ] **Markdown rendering for PR description.** Shared `safe-markdown`
      helper that also serves issue bodies, comment bodies, and epic
      bodies. Today PR descriptions render as `pre-wrap`.
      - **Why:** PR descriptions are written as Markdown by humans and
        agents (especially the merge-reactor PRs); rendering raw text
        loses headings, code blocks, and `closes #N` linkification.
        Three surfaces (PR / issue / epic / comment bodies) currently
        each tokenise differently — `EpicDetail.vue` and `DocsPanel.vue`
        each ship their own `markdown.ts`. Diverging implementations
        will keep diverging.
      - **Files:** new `frontend/packages/sdk-vue/src/markdown.ts`
        (canonical home — both shell-mounted routes and customElement
        extensions can import via the workspace package). Migrate
        `extensions/first-party/ext_docs/ui/src/markdown.ts` and
        `extensions/first-party/ext_epics/ui/src/markdown.ts` to
        re-export from the package, then delete after a green build.
        New consumer: `extensions/first-party/ext_pull_requests/ui/src/
        PullsDetail.vue` (replace the `pre-wrap` block).
      - **Acceptance:** unified renderer parses headings 1–6, paragraphs,
        fenced code with `data-lang`, lists (ordered + unordered, nested
        one level), inline `code`/**bold**/_italic_, and autolinks
        bare URLs and `#N` references (the latter to issue routes).
        XSS-safe by default — escape everything that isn't a recognised
        token. Three surfaces (PR detail, epic detail, doc detail) all
        render the same `## Heading` identically.
      - **Depends on:** nothing; pure refactor.

- [ ] **PR detail: linked issues panel via `relations.outgoing kind=closes`.**
      Today only an inline "1 issue — auto-closed on merge" caption hints
      at it.
      - **Why:** The merge-reactor flow (iter 14) is the canonical PR
        story — close the issues this PR resolves. Surfacing those
        targets explicitly lets reviewers verify intent before merge and
        lets the merged-PR page act as a record of *what* it closed.
        Symmetric with the existing iteration-4 "Closes" panel that
        already renders for the demo PR — generalise it for every PR.
      - **Files:** `extensions/first-party/ext_pull_requests/ui/src/
        PullsDetail.vue`. Consume via the existing `relations` host
        import (see how `ext_pull_requests` already calls it in the
        merge reactor); GraphQL alternative if cleaner: add
        `pullRequest.relations(kind: "closes") { target { … } }` to the
        kernel resolver.
      - **Acceptance:** below the description, a "Closes" section listing
        each linked issue as one row: `state badge · #N · title · project
        chip · closed?`. Empty state renders nothing (no zero-state
        card). Each row is clickable / focusable / `j`-`k` navigable.
        Live-update via `dev.comtrya.relations.{created,deleted}` so
        adding a `closes` relation appears without refresh.
      - **Depends on:** nothing kernel-side (the relation exists);
        live-event leg can ship later.

- [ ] **PR detail: comments thread driven by the `comments` host import.**
      Today `comtrya-comment-thread` mounts on epics but not PRs.
      - **Why:** Code review without inline discussion is just a diff
        viewer. Threaded discussion on the PR (not the diff) is the
        first beachhead; per-line comments come later with `@pierre/diffs`.
      - **Files:** `extensions/first-party/ext_pull_requests/ui/src/
        PullsDetail.vue`. Reuse the same `<comtrya-comment-thread
        :resource="..."/>` element pattern that `EpicDetail.vue` uses,
        scoped to `comtrya://pull-request/<id>`. The composer should
        live below the thread; submit on `Cmd+Enter`.
      - **Acceptance:** loads existing comments newest-last; new comment
        composer with markdown preview toggle (uses the shared
        `safe-markdown` helper above); `c` shortcut focuses composer
        from anywhere on PR detail; live-updates via the comments topic
        on the SSE stream.
      - **Depends on:** shared `safe-markdown` helper for the preview.

- [ ] **PR detail: ref diff view — real per-PR diff from the kernel.**
      Today `DiffView.vue` runs against `repository.diff` which is a
      demo `main~1..main` patch, not the actual head→base of the
      displayed PR.
      - **Why:** The diff-first PR review macro bet (iter 3) shipped the
        renderer but is lying about which patch it shows. Until the
        kernel exposes a per-PR diff, every PR detail page renders the
        same three files. This is the single biggest correctness issue
        in the product right now.
      - **Files:** kernel — `crates/server/src/main.rs` (add
        `pullRequest.diff` resolver, or `repositoryByPath.gitDiff(
        headRef, baseRef)` + UI-side composition of the head/base from
        the PR record). Frontend — `extensions/first-party/
        ext_pull_requests/ui/src/PullsDetail.vue` (swap the GraphQL
        query). Eventually replace the local `diff.ts` parser with
        `@pierre/diffs` for shiki syntax + side-by-side + inline
        comments — but only after the data is correct.
      - **Acceptance:** opening two different PRs renders two different
        patches. The displayed diff matches `git diff <base>..<head>`
        run against the bare repo. File counts and +/- totals match
        `git diff --shortstat`.
      - **Depends on:** kernel `gitDiff` field (also listed below).

- [ ] **Queue search syntax: `author:me`, `is:draft`, `is:open`,
      `repo:<path>`.** The PullsQueue search input currently does
      substring match on title only.
      - **Why:** Linear/GitHub-style filter syntax is muscle memory for
        the target audience. Without it, the queue can't be sliced
        ("PRs I authored", "drafts only") without state-filter chip
        clicks and can't span repos at all.
      - **Files:** `extensions/first-party/ext_pull_requests/ui/src/
        PullsQueue.vue`. Add a tiny `parseQuery(input)` returning
        `{text, filters: {author?, state?, draft?, repo?}}`; pass to
        the existing filtered-list computation. Resolve `author:me` via
        the same `viewer.id` field used by `PullsYourWork.vue` (see
        kernel work below). Highlight matched filter chips in the input
        as pill backgrounds (Linear pattern) so the syntax is
        discoverable without docs.
      - **Acceptance:** typing `author:me is:draft` filters to the
        viewer's drafts; `repo:comtrya/dogfood` scopes; `author:me
        retry` does both an author filter and a substring match.
        Invalid filter keys render a small grey "unknown filter:
        `xyz`" hint without breaking the search.
      - **Depends on:** `viewer.id` resolver (kernel work below) for
        `author:me`. Other filters can ship first.

- [ ] **"Create pull request" form route.** Wires the existing
      `create-pull` WIT op.
      - **Why:** Today PRs only appear via the dogfood seed or external
        flows; the forge can't actually originate a PR from its own UI,
        which makes "command-driven everything" a half-truth.
      - **Files:** new `extensions/first-party/ext_pull_requests/ui/src/
        PullsNew.vue`. Add a route in `register.ts` at `/x/pulls/new`
        (mirror of `IssueNew`). Add a palette command `New pull request
        in <repo>` registered from `pr-commands.ts` for the current repo
        (read from route segments — same pattern as
        `project-commands.ts`).
      - **Acceptance:** form fields: head ref (autocomplete from refs),
        base ref (default branch pre-filled), title, description
        (markdown editor, `Cmd+Enter` to submit). On submit calls
        `create-pull` and routes to the new PR detail. Quick-add
        analogue at the top of `PullsQueue.vue` — Linear-shape inline
        input, mirroring `IssuesList.vue::quick-add` (iter 17).
      - **Depends on:** ref autocomplete needs a kernel `refs(prefix)`
        resolver (cheap — wraps `git for-each-ref`). Can ship plain
        `<input>` first.

## Project planning (issues + epics)

- [ ] **Board/kanban view across `ext_issues` (and optionally `ext_epics`).**
      Columns by state (open / in progress / closed); drag-to-move
      calls the existing `update-issue-state` op.
      - **Why:** A board is the canonical second view of a queue —
        useful for stand-ups, bulk grooming, and seeing WIP in one
        glance. Linear ships both list and board for issues; we'd
        gain parity cheap because the state mutations already exist.
      - **Files:** new `extensions/first-party/ext_issues/ui/src/
        IssuesBoard.vue`. Wire as a route alongside the list
        (`/x/issues/board?projectName=...`). Reuse `IssueCard.vue` as
        the column row. Drag-to-move via the **HTML5 Drag and Drop
        API** wrapped in a tiny composable in `@comtrya/sdk-vue` —
        keep with the library-first direction; if HTML5 DnD proves
        too rough, swap to **`@vueuse/core`'s `useDraggable`** rather
        than rolling pointer events.
      - **Acceptance:** three columns, dense rows (same density as
        `IssuesList.vue`), keyboard nav within and across columns
        (`j`/`k` within, `h`/`l` across), `space` to "pick up" a
        focused row, arrow to target column, `space` again to drop.
        Pointer drag works too. URL persists `?view=board|list` so
        toggling is bookmarkable.
      - **Depends on:** an `inProgress` issue state (today the kernel
        only has OPEN / CLOSED / REOPENED — see how this fits in the
        WIT for `ext_issues` first; might collapse to just two
        columns until states grow).
- [x] **2026-05-14** Quick-add input on the issues list. Inline form,
      Linear-shape, auto-stamps `projectName` + `defaultLabels` +
      `closeOnMerge` from the page Project's CUE policy. Iteration 17.
- [x] **2026-05-14** Epic detail surfaces child issues with their state.
      `EpicDetail.vue` rewritten as a real planning surface — editorial
      header, markdown body, progress bar, dense issue rows resolved via
      `invokeOp("ext_issues", "issues", "by-ref-issue", uri)`.
- [ ] **URL-persisted filter chips for state + author + label.** Today
      the IssuesList state filter is reactive ref-only; sharing a
      filtered link is impossible.
      - **Why:** "Send me your open kernel issues" should be a one-link
        action, not a screenshot. URL is the canonical state surface
        for filtered lists.
      - **Files:** `extensions/first-party/ext_issues/ui/src/
        IssuesList.vue` (and PullsQueue + EpicsList by extension —
        same shape). Read filter state from `route.query` on mount;
        write back via `router.replace({ query: { state, author,
        label } })` on change so back/forward respects history but
        every keystroke doesn't pollute history.
      - **Acceptance:** opening
        `/x/issues?state=open&label=kernel&author=rawkode` lands with
        all three chips active; toggling chips updates the URL
        without reloading; copy-paste the URL on another tab/session
        reproduces the exact view.
      - **Depends on:** nothing. Should ship before board view above
        so `?view=board` joins existing query params cleanly.

- [ ] **Milestone/timeline view.** Later — needs a `due` field on epics
      and possibly a `start` field too.
      - **Why:** Project planning beyond a single iteration needs a
        time axis. Linear's "Cycle" view and Height's roadmap are the
        references. Skipped for now because the data model isn't
        ready; record so a future loop doesn't try to ship the view
        before the schema.
      - **Files:** WIT bump for `ext_epics` adding `start-at`,
        `due-at` (option<datetime>); kernel bindgen regen; UI
        `EpicsTimeline.vue`. Probably want a tiny library — **vis-
        timeline** or **gantt-task-react** equivalents — rather than
        bespoke SVG.
      - **Acceptance:** scoped to a Project page; epics render as bars
        on a horizontal time axis with today-line marker; drag bar
        edges to reschedule (calls the new state mutations); keyboard
        nav between epics with `j`/`k`.
      - **Depends on:** epic schema additions; pick of timeline lib
        (defer until real users complain about the lack of one).

## Repository home

- [ ] **Repo home tabs (Overview · Code · Pulls · Issues · Checks).**
      Inline near the title — context switching is one click, not
      sidebar travel.
      - **Why:** The sidebar lists the *workspace*-level surfaces
        (Home, Repos, Issues, Pulls); inside a repo, the relevant
        surfaces are repo-scoped and the user shouldn't traverse out
        of the repo to switch sub-section. Tabs at the repo header
        match GitHub muscle memory and make `g o`/`g p`/`g i`/`g c`
        chord targets honest at the repo scope.
      - **Files:** `frontend/src/routes/RepoHome.vue` header (add a
        `<RepoTabs>` strip below the title row); new
        `frontend/src/components/RepoTabs.vue` taking the `segments`
        and rendering links to `/r/<segments>`,
        `/r/<segments>/code`, `/r/<segments>/pulls`,
        `/r/<segments>/issues`, `/r/<segments>/checks`. Active tab
        derived from `route.path`. Wire matching repo-scoped chord
        bindings in `main.ts::bindGoChord`.
      - **Acceptance:** tabs render only on `/r/<segments>` and its
        sub-routes (not on workspace home); the active tab has a
        bottom-border underline (no background pill — editorial
        density); `Tab` cycles in source order; chord shortcuts at
        the repo scope land on the right tab.
      - **Depends on:** Workbench layout doesn't need to ship first —
        tabs are the *seed* of that nested layout.

- [ ] **Single-row repo chip strip.** Default branch + visibility +
      last-updated + open-PR count + open-issues count as one chip
      row, not three summary cards.
      - **Why:** Cards waste vertical space and dilute the
        information-density goal. The data is dense and tonal —
        chips are the right shape. Mirrors the editorial chip strip
        already shipped on Project home (iter 15).
      - **Files:** `frontend/src/routes/RepoHome.vue`. Reuse the chip
        component pattern from `ProjectsPanel.vue`. Open counts come
        from `repositoryByPath { openPullRequests, openIssues }`.
      - **Acceptance:** one row, comma-or-bullet separated chips:
        `main · public · updated 4m ago · 3 open PRs · 7 open
        issues`. Counts hide when zero. Chip tone: neutral grey for
        meta, ink-strong serif for numbers.
      - **Depends on:** `openIssues` kernel field.

- [ ] **"Working copy" panel.** Clone command, default branch, last
      commit short sha + author + relative time.
      - **Why:** Half the time someone opens the repo home, the next
        action is "let me clone this and start coding". Making that
        a one-glance / one-copy moment is high-leverage DX. The
        last-commit row also answers "is this repo alive?" without
        a click.
      - **Files:** new `frontend/src/components/WorkingCopyPanel.vue`
        mounted on `RepoHome.vue` below the chip row. Reads
        `repositoryByPath { cloneUrl, defaultBranch, lastCommit { sha,
        author { displayName, urn }, message, committedAt } }`.
        `cloneUrl` overlaps with the Quick-wins clone affordance
        above — share the helper.
      - **Acceptance:** monospace clone command line with copy button;
        below it `${shortSha}  ${author with classifyAuthor() glyph}
        ${relTime}` and the commit subject (truncated). Click on the
        sha copies it; click on the message navigates to the commit
        view (when that route exists — until then `<span>`).
      - **Depends on:** kernel `lastCommit { sha, author, message,
        committedAt }` resolver. Likely a thin wrapper over
        `git log -1`.

- [ ] **README rendering on the repo home.** Extension-owned widget
      mounted into a default repo-home slot.
      - **Why:** Following the architectural anchor: README is repo-
        resident durable content; surface it via `ext_docs` (same
        renderer as ADRs/PRDs/RFCs), don't bake into the kernel.
        Once it renders here, the repo home stops being a sparse
        meta page.
      - **Files:** extend `extensions/first-party/ext_docs/manifest.
        json` to contribute a `repo-home.readme` slot. Reuse the
        existing `markdown.ts` (or by then the shared
        `safe-markdown` from above). README discovered by walking
        the repo root for `README.md`/`README.mdx`/`readme.md`.
      - **Acceptance:** any repo with a top-level README renders it
        full-width below the working-copy panel; collapsible (top
        ~600px shown, "Show more"); links and code blocks render as
        in `ext_docs::DocsPanel`. Repos without a README render the
        slot empty (no zero-state).
      - **Depends on:** shared `safe-markdown` helper.

- [ ] **Repo settings link.** Even if 404 for now — the affordance
      should exist so the navigation shape is honest.
      - **Why:** The absence of a settings affordance is a constant
        visual lie about the product's surface area. Stub the link
        now (gear icon in the repo header), wire to a real route
        later as features arrive (rename, archive, default branch,
        webhooks).
      - **Files:** `frontend/src/routes/RepoHome.vue` header right-
        side. New route `frontend/src/routes/RepoSettings.vue` with
        a placeholder body listing planned sections.
      - **Acceptance:** `,` (comma) shortcut on the repo home opens
        settings (Linear convention); the placeholder page has a
        clear "Settings — coming soon" headline plus the planned
        section list so it doesn't feel broken.
      - **Depends on:** nothing.

## Workspace home

- [x] **2026-05-14** Workspace repo list now shows default branch chip,
      visibility, open PR count, and relative `updated` time per row
      (`WorkspaceHome.vue` + GraphQL query update).
- [ ] **"Your work" rail — issue side.** PR side already real
      (`PullsYourWork.vue`); still need issues from `ext_issues`
      with viewer-scoped queries.
      - **Why:** Workspace home should answer "what should I do
        today" in two glances: PRs awaiting my review or authored by
        me, plus issues assigned to me. Today only the PR half is
        real. Without the issue side, planning surface depth is
        half-baked.
      - **Files:** new `extensions/first-party/ext_issues/ui/src/
        IssuesYourWork.vue` mirroring `PullsYourWork.vue`. Register
        as a workspace-home slot in
        `ext_issues/manifest.json::contributes.slots`. Falls back to
        all open issues when `viewer.id` is null (same pattern as
        the PRs widget).
      - **Acceptance:** rail on `WorkspaceHome.vue` shows top 5
        issues assigned to viewer, with `#N · title · project chip
        · age`. `j`/`k` nav within the rail; Enter opens detail.
        Live-updates via `dev.comtrya.issues.assigned` (new event;
        kernel needs to emit it on assignment changes).
      - **Depends on:** `viewer.id` from kernel; assignment field on
        `Issue` (check the WIT — may already exist as `assignees`).

- [ ] **Recent activity feed via live events.** Already subscribed in
      `App.vue` for the counter; `ActivityStream.vue` already exists
      on workspace home — extend coverage and depth.
      - **Why:** The Real-time-everywhere macro bet's beachhead is
        already shipped (iter 2). Next leg: filter chips on the
        stream so a user can scope to issues / PRs / specific
        projects; "load more" pagination so it isn't just the latest
        N events; per-row "seen" tracking so the user can mark events
        read on close (precursor to the Inbox macro bet).
      - **Files:** `frontend/src/components/ActivityStream.vue`. Add
        a top-of-stream chip filter strip; add a `loadOlder()` action
        bound to `[` and to a button at the bottom; add a per-row
        "seen" state stored in `localStorage` keyed on event id.
      - **Acceptance:** `i`/`p`/`r` filter shortcuts hide non-matching
        rows; `[` loads the previous 50 events from
        `workspace.events(before: <id>, limit: 50)` (kernel needs
        the cursor arg); seen rows render at 60% opacity; `Shift+R`
        marks all visible as read. No flash on freshly-arrived rows
        once `seen` exists — only flash unread ones.
      - **Depends on:** `workspace.events(before, limit)` cursor on
        the kernel. Inbox macro bet builds on this.

- [ ] **Repo-list row keyboard nav (j/k, enter to open).** Mirror the
      pulls queue UX for consistency across every list in the app.
      - **Why:** The product promise is "every list is a Linear-grade
        list". The workspace home repo list is the most-visited list
        in the app and is currently mouse-only. Inconsistency with
        PRs/issues breaks muscle memory.
      - **Files:** `frontend/src/routes/WorkspaceHome.vue`. Use
        `useShortcuts({ j: …, k: …, Enter: … })` from
        `@comtrya/sdk-vue` — same pattern that `IssuesList.vue` and
        `PullsQueue.vue` now use.
      - **Acceptance:** `j`/`k` move focus among repo rows; Enter
        opens `/r/<segments>`; focus ring visible (re-use the
        existing `.row.focused` style from PullsQueue); `g r` from
        elsewhere lands on the repos route with the first repo
        focused.
      - **Depends on:** nothing.

- [ ] **Group/folder collapse on workspace home for many repos.**
      Single-tenant workspaces routinely have 50+ repos.
      - **Why:** Polyrepo-scannable macro bet's first leg. With 50
        repos a flat list scrolls forever; with 100 it's unusable.
        Group folding (already designed as a macro bet) starts here.
      - **Files:** `frontend/src/routes/WorkspaceHome.vue`. Repos
        already carry `groups: [string]` (the `comtrya/dogfood` →
        `["comtrya"]` mapping). Group by first segment; collapse
        state in `localStorage` keyed by group; `space` toggles the
        focused group.
      - **Acceptance:** repos render under group headings (`comtrya
        (3)`, `imported (1)`, `rawkode (2)`); group header focusable
        with `j`/`k`; `space` collapses; `Cmd+]`/`Cmd+[` collapse
        all / expand all; URL persists `?groups=collapsed:comtrya,
        rawkode` so links share state.
      - **Depends on:** none of the macro bet's harder pieces (search,
        starring, recently-touched). Those come later.

## Code browsing

- [ ] **Code-browser scannability pass.** It's the only host-owned
      widget; today it works but isn't editorial.
      - **Why:** Code browsing is the lowest-effort surface — every
        repo opens with it implicitly. If it doesn't feel as dense
        and keyboard-driven as the rest of the product, the entire
        forge feels half-finished. Linear has no equivalent because
        it's not a forge; the reference is **Sourcegraph** (density,
        keyboard) and **GitHub Code Search** (speed of jump).
      - **Files:** `frontend/src/core-widgets/code-browser.ts` (and
        any sibling components/Vue files it imports). Add **shiki**
        for syntax (already on the radar for ext_docs) — the same
        bundle can serve both. Use `useShortcuts` for `j`/`k`/Enter
        within the file tree; `/` to filter the tree; `n`/`p` for
        next/prev sibling; `b` to go back up a directory.
      - **Acceptance:** tree-on-left / preview-on-right layout with a
        sticky breadcrumb at the top of the preview; shiki-rendered
        blob with line numbers and the same editorial palette as
        DiffView; `gg`/`G` jumps to top/bottom; `:N<Enter>` jumps to
        line N (reuse the palette as the ":" target — opens with
        `:` as the seed).
      - **Depends on:** shiki dep; could land alongside the diff
        view's shiki upgrade so the cost amortises.

- [ ] **Breadcrumbs inside the code browser for nested paths.** Click
      any segment to jump up.
      - **Why:** Today the code browser shows the file path as plain
        text; navigating up is a click on the parent folder in the
        tree, which means the eye has to move from the file (right
        pane) back to the tree (left pane). Inline crumbs cut that
        traversal.
      - **Files:** code-browser components above. Crumb component
        can reuse `frontend/src/components/Breadcrumb.vue` from the
        Quick-wins entry — same pattern, scoped.
      - **Acceptance:** above the blob preview, segments render as
        `crates › server › src › main.rs`; each segment except the
        last is a focusable link to the directory listing; `Tab`
        cycles segments.
      - **Depends on:** the Quick-wins sticky breadcrumb component.

- [ ] **Branch/ref switcher in the code browser header.** Defaults to
      the repo's default branch.
      - **Why:** Without a ref switcher, the browser only shows HEAD;
        comparing or inspecting feature branches requires the CLI.
        That's a real gap once the forge is anyone's primary code
        browsing surface.
      - **Files:** code browser header. Reuse the Headless UI
        Combobox shape from `CommandPalette.vue` for the ref picker
        (consistent affordance). Refs come from a kernel `refs`
        resolver — same one the "Create PR" form needs.
      - **Acceptance:** header shows `main ▾`; `r` shortcut focuses
        the picker; type-ahead filters by substring; selection
        re-fetches the file list and the active blob at the new
        ref; URL updates `?ref=feature/xyz` so back/forward respects
        history.
      - **Depends on:** kernel `refs(prefix)` resolver (shared with
        Create-PR form).

## Global UX glue

- [ ] **Consistent page-header pattern.** Today some routes use
      `.page-header`, some don't.
      - **Why:** Visual identity macro bet: an editorial product
        depends on consistent typography rhythm at the top of every
        view. Inconsistency reads as "different teams shipped these"
        rather than "single product".
      - **Files:** new `frontend/src/components/PageHeader.vue`
        taking `overline`, `title`, `chips`, `actions` slots. Migrate
        in order: `WorkspaceHome.vue`, `RepoHome.vue`,
        `ProjectHome.vue`, `IssuesList.vue`, `PullsQueue.vue`,
        `EpicsList.vue`, `DocsPanel.vue`. Existing editorial styles
        from `EpicDetail.vue` and `IssueNew` (iter 14, iter 16) are
        the design reference.
      - **Acceptance:** every top-level route renders the same header
        component; overline is uppercase muted mono; title is heavy
        display serif; chip strip is a single row; actions are
        right-aligned and shortcut-hint annotated. No per-route
        bespoke header markup remains.
      - **Depends on:** nothing.

- [ ] **Toast/notification system for action results.** Today merges
      and creates are silent.
      - **Why:** Optimistic UI without confirmation looks broken;
        `merge` returns and the page just sits there. A discrete
        toast ("PR #43 merged") closes the loop without modal noise.
        Linear-style: bottom-right, auto-dismiss, undo for
        reversible actions.
      - **Files:** new `frontend/src/components/Toaster.vue` mounted
        once in `App.vue`. Imperative API exported from
        `@comtrya/sdk-vue`: `toast.success()`, `toast.error()`,
        `toast.action({ message, undo: () => Promise<void> })`.
        Use **Headless UI's Transition** for enter/exit (the lib is
        already in deps from iter 21).
      - **Acceptance:** every WIT op call site (`mergePull`,
        `closePull`, `openIssue`, `createEpic`, `markEpic*`) calls
        `toast.success` on resolve and `toast.error` on reject;
        toasts auto-dismiss in 4s; `Esc` dismisses focused; `z`
        triggers `undo` on the most recent undoable toast.
      - **Depends on:** nothing.

- [ ] **Persist sidebar open/closed state + dark/auto theme toggle.**
      Palette already prefers light.
      - **Why:** User's last layout choice should survive reload —
        forgetting it every page load is a small but constant
        annoyance. Theme toggle: respect `prefers-color-scheme` by
        default; explicit toggle overrides; persist.
      - **Files:** `frontend/src/App.vue` for sidebar state (read /
        write `localStorage.sidebarCollapsed`). New
        `frontend/src/components/ThemeToggle.vue` wired into the
        topbar; toggles between `light` / `dark` / `auto`. CSS
        variables in `frontend/src/styles.css` already centralise
        colours — add a `[data-theme="dark"]` block.
      - **Acceptance:** sidebar state persists across reloads; theme
        toggle cycles auto → light → dark → auto; auto follows OS
        preference; palette and overlay both respect the dark theme
        without flash on mount.
      - **Depends on:** nothing.

- [ ] **Loading skeletons** instead of "Loading repositories" text.
      - **Why:** Text loading states make slow networks feel slower;
        skeletons preserve perceived layout stability and let the
        eye start parsing structure before the data arrives.
      - **Files:** new `frontend/src/components/Skeleton.vue` (a tiny
        primitive: `<Skeleton width="..." height="..."/>`). Replace
        text loading states in `WorkspaceHome.vue`, `PullsQueue.vue`,
        `IssuesList.vue`, `RepoHome.vue`, `EpicsList.vue`. **No
        shimmer animation** — the editorial-design rule is
        near-zero motion. Plain muted blocks at the right
        dimensions.
      - **Acceptance:** every list-route's first paint shows skeleton
        rows at the right row-height and column-widths; switches to
        real data without layout shift. No "Loading…" strings
        anywhere visible to the user.
      - **Depends on:** nothing.

- [ ] **404 / not-found route component.** Back-to-workspace link.
      - **Why:** The current "not matched" behaviour is undefined
        (probably blank). A real 404 page is a 30-minute polish
        task that immediately raises perceived quality.
      - **Files:** new `frontend/src/routes/NotFound.vue`; register
        as the catch-all in `frontend/src/router.ts` (must be the
        *last* route — current router definition order matters).
      - **Acceptance:** unknown URLs render an editorial "404 ·
        nothing here" page with the attempted path in mono and a
        single primary link back to workspace home; `g h` from this
        page also navigates home.
      - **Depends on:** nothing.

- [ ] **Empty-state copy in editorial style.** "No PRs yet", "no
      issues yet", "no commits yet" — text-only, no illustrations.
      - **Why:** Empty states are the first thing a new user sees;
        they're free brand surface. Most products waste them with
        generic clip-art. The forge's distinct-identity macro bet
        leans on text-only editorial empty states (think New Yorker
        not Notion).
      - **Files:** new `frontend/src/components/EmptyState.vue`
        taking `title`, `body`, `action` slots. Use across
        `PullsQueue.vue` (no PRs), `IssuesList.vue` (no issues),
        `EpicsList.vue` (no epics), `ActivityStream.vue` (no
        events).
      - **Acceptance:** each empty state shows a short editorial
        sentence + one shortcut-hinted action chip ("Press `c` to
        create one"). No grey illustration. No "It's quiet here…"
        pseudo-friendly tone.
      - **Depends on:** nothing.

## Kernel work needed for the UI to be honest

- [ ] **Per-PR `gitDiff(headRef, baseRef)` field on `repositoryByPath`.**
      So `PullsDetail.vue` can stop using the demo patch.
      - **Why:** Without this, the entire diff-first PR review macro
        bet is dishonest — every PR shows the same three files. This
        is the single highest-priority kernel field.
      - **Files:** `crates/server/src/main.rs::repositoryByPath`
        resolver. Implement via `git2`'s `Repository::diff_tree_to_
        tree(base_tree, head_tree, opts)` followed by
        `Diff::print(DiffFormat::Patch, …)` collecting into a string.
        Cache on `(repo_id, head_oid, base_oid)` since refs may
        move but the OIDs are stable; LRU of ~64 entries should
        cover an active session.
      - **Acceptance:** GraphQL `repositoryByPath { gitDiff(headRef:
        "...", baseRef: "...") }` returns unified-diff text;
        identical to `git diff <base>..<head>` run against the bare
        repo; nullable when refs don't resolve; rejects refs that
        aren't in the repo (don't accept arbitrary OIDs from
        clients without a check).
      - **Depends on:** nothing else; unblocks PR detail diff and
        the diff-first macro bet.

- [ ] **`viewer { id, displayName, urn }` resolver wired to real auth.**
      So `authorRef === viewer.id` and "you" labels work.
      - **Why:** Today everything renders as "anonymous" — no way to
        scope queries by viewer, no way to label PRs as "yours" in
        the activity stream, no way to filter the inbox to "for me".
        Per the auth feedback memory's spirit (CUE derives, Rust
        does not), the viewer URN should come from the auth layer
        and propagate via context, not be pattern-matched from
        request headers in business code.
      - **Files:** `crates/server/src/main.rs` viewer resolver. Until
        real auth lands, surface the configured dev identity from
        `comtrya.cue` workspace block (`workspace.devViewer:
        comtrya://user/rawkode`) so dogfood works end-to-end. Then
        gate behind real auth when it arrives.
      - **Acceptance:** GraphQL `{ viewer { id, displayName, urn } }`
        returns the dev identity; `PullsYourWork.vue` filters PRs
        by `authorRef === viewer.urn`; `ActivityStream.vue` renders
        "you opened #43" instead of "rawkode opened #43" for own
        actions.
      - **Depends on:** nothing else; unblocks Your-work rails,
        author:me query syntax, inbox.

- [ ] **`repositoryByPath.openIssues` count parallel to
      `openPullRequests`.** So the Issues nav badge can be
      populated.
      - **Why:** Sidebar PR badge ships, issues badge doesn't —
        asymmetric and confusing.
      - **Files:** `crates/server/src/main.rs::build_repository_
        summary` (the same function that fills `openPullRequests`).
        Source the count via the existing cross-call to
        `ext_issues/issues.list-issues` filtered to OPEN, just like
        `ext_pull_requests` is read for PR counts.
      - **Acceptance:** GraphQL `repositoryByPath { openIssues }` and
        `repositories { openIssues }` both resolve as `u64`;
        sidebar badge populates; numbers match
        `list-issues({state: "OPEN"})` output.
      - **Depends on:** nothing.

- [ ] **`workspace.gitOrigin` resolver.** For the clone-URL
      affordance.
      - **Why:** Hard-coding `git@host:path.git` in the UI bakes
        deployment details into the frontend. The kernel knows the
        host (it's serving the git protocol).
      - **Files:** `crates/server/src/main.rs` workspace resolver;
        read from a kernel `comtrya.cue` workspace-level block
        (`workspace.gitOrigin: "git@forge.example:%s.git"` with
        `%s` for the path). Per "CUE derives, Rust does not" — this
        is config, not derived.
      - **Acceptance:** GraphQL `{ workspace { gitOrigin } }`
        returns the format string; `RepoHome.vue` interpolates the
        path into it for the clone command. Honours absent config
        with `localhost:<port>` fallback for dev.
      - **Depends on:** nothing.

- [ ] **`workspace.events(before, limit)` cursor for the activity
      stream.** Today only the bootstrap `workspace.events` is
      available.
      - **Why:** Without pagination, the activity feed can only
        show the live tail. Inbox / what-changed and "load older"
        both need a cursor.
      - **Files:** `crates/server/src/main.rs` events resolver.
        Backed by event-id ordering already used by SSE.
      - **Acceptance:** `workspace.events(before: "evt_…", limit:
        50)` returns the 50 events older than the cursor; pairs
        with the existing live stream so a UI can hydrate
        history + tail without gaps.
      - **Depends on:** nothing.

- [ ] **`refs(prefix)` resolver on `repositoryByPath`.** Used by
      both Create-PR form and code-browser ref switcher.
      - **Why:** Two surfaces need ref autocomplete; ship once.
      - **Files:** `crates/server/src/main.rs::repositoryByPath`.
        Wraps `git for-each-ref refs/heads/<prefix>*` and
        `refs/tags/<prefix>*`. Limit results to ~50.
      - **Acceptance:** `repositoryByPath { refs(prefix: "feat") }`
        returns matching ref names with `kind: "branch" | "tag"`.
      - **Depends on:** nothing.

- [ ] **`repositoryByPath.lastCommit` resolver.** For the working-
      copy panel.
      - **Why:** Repo home needs `${shortSha} · ${author} · ${age}
        · ${subject}`; today the UI fakes this from arbitrary
        sources.
      - **Files:** `crates/server/src/main.rs::repositoryByPath`.
        `git log -1 default-branch` via `git2`. Author URN
        resolved through the existing `classifyAuthor` URN scheme.
      - **Acceptance:** `repositoryByPath { lastCommit { sha,
        shortSha, author { urn, displayName }, message,
        committedAt } }` resolves; matches CLI `git log -1`.
      - **Depends on:** nothing.

## DX (developer-of-the-forge experience)

- [ ] **`start.sh --watch` mode.** Rebuilds extension UIs on file
      change without restarting the host.
      - **Why:** Today the inner loop is "edit → ./start.sh
        --reset → reload" which takes 10-15 seconds and resets
        seed data. A real watch mode shrinks that to "edit → save
        → reload" and preserves dogfood state. Compounds across
        every other iteration.
      - **Files:** `start.sh`. The kernel already serves rebuilt
        extension bundles from disk; the missing piece is a
        watcher that runs `bun run build` on each extension when
        its sources change. **Use `chokidar-cli` or `bun --watch`**
        — don't roll a watcher. Each extension's manifest must be
        re-read on bundle change so integrity hashes update.
      - **Acceptance:** `./start.sh --watch` starts the host once,
        then on a file save under `extensions/first-party/<ext>/
        ui/src/` rebuilds that one extension in ~1s; reloading
        the browser shows the new bundle without the manifest's
        integrity hash blocking. Seed data preserved (no
        `--reset`).
      - **Depends on:** kernel must tolerate manifest hash
        changes mid-session (probably already does — verify).

- [ ] **Surface extension load errors in the UI.** On `/instance`
      health page with the failing manifest path and validation
      message.
      - **Why:** Today an invalid manifest fails silently in the
        browser console. New extension authors waste hours on
        this. The kernel already has the validation result —
        surface it.
      - **Files:** `frontend/src/routes/InstanceHealth.vue` (the
        page already exists). Kernel resolver
        `instance.extensionLoadResults` returning `{ id, status,
        error?, manifestPath }[]`.
      - **Acceptance:** every loaded extension renders one row
        with green/red status; failed rows show the manifest path
        and the error message; copy button on the error message;
        live-reloads when an extension is rebuilt successfully
        (subscribe to a kernel `dev.comtrya.extension.{loaded,
        failed}` topic).
      - **Depends on:** nothing.

- [ ] **Widget contribution contract docs.** Single page under
      `docs/extensions/widgets.md` with a minimal copy-paste
      example.
      - **Why:** External-extension authoring is the long-term
        story; without docs the contract drifts and only the
        first-party extensions know how to declare slots.
      - **Files:** new `docs/extensions/widgets.md` written as
        an MDX `spec` doc-type so it can also be surfaced via
        `ext_docs` in the dogfood repo. Cover: manifest `slots`
        block, slot context shape (`projectName`, `repoSegments`,
        etc.), customElement vs route mount, allowedCrossCalls,
        cueSchemas. Pull a real example from `ext_issues` or
        `ext_docs`.
      - **Acceptance:** copy-paste from the doc gives a working
        widget that mounts on the workspace home. Linked from
        `README.md` and from the `/instance` page (a "writing an
        extension" hint).
      - **Depends on:** nothing.

- [ ] **`CONTRIBUTING.md` for the v3 branch.** Build/test commands,
      common gotchas, the merge-reactor invariants.
      - **Why:** New contributors (human or agent) re-derive the
        build commands every time. Documenting once costs
        nothing and saves the next ten contributors an hour
        each.
      - **Files:** new `CONTRIBUTING.md` at repo root. Covers:
        prerequisites (Bun, Rust toolchain, cargo-component,
        `cuelang`), `./start.sh --reset`, where the bare repos
        live, where extension bundles end up, conventional
        commits rule (already in `AGENTS.md`), the WIT bump
        ritual.
      - **Acceptance:** `CONTRIBUTING.md` exists; linked from
        `README.md`; running every command in the doc on a fresh
        clone produces a working dogfood.
      - **Depends on:** nothing.

## Recently shipped

### 2026-05-15 — iteration 31 (Sticky breadcrumb)

Long-pending TODO from Quick wins — every route now starts with
a sticky breadcrumb under the topbar.

`components/Breadcrumb.vue` reads `useRoute()` and decomposes
the path into `workspace › repo › project › section › item`
crumbs. Each crumb except the last is a `<RouterLink>`; the
last is bold + unlinked + represents the current location.

Path shapes handled:
- `/` → `Workspace`
- `/r/<groups>/<repo>` → `Workspace › <repo path>` (groups
  rolled into one crumb so deeply nested owners don't blow out
  the strip).
- `/r/<groups>/<repo>/p/<project>` → `Workspace › <repo> ›
  <project>`
- `/x/<prefix>/<rest...>` → `Workspace › <Issues|Pull requests|
  Epics|Docs|Checks|prefix> › <rest segments...>`
- `/new`, `/instance`, `/settings`, `/health` → labelled
  single-segment shell routes.

Styling: monospace, sticky to viewport top so the crumbs stay
in view even when the page scrolls past the topbar (which is
non-sticky). Negative top margin pulls the bar tight under the
topbar's bottom rule. `›` separator in `--ink-fainter`.

Slotted at the top of `<main class="page">` in `App.vue` so
every route picks it up automatically. No per-route wiring.

Net change: 1 new component + 2-line App.vue mount.

### 2026-05-14 — iteration 30 (Project home — switcher + editorial chip row)

Applies the iteration-28 RepoHome cleanup to ProjectHome, plus
adds an inline Project switcher so navigating between sibling
projects in a monorepo is one click instead of a roundtrip
through the repo home's Projects panel.

`ProjectHome.vue` header now renders:
- Overline `<repo path> · project` (the repo link stays clickable).
- Display title at 56px (was 72px; consistent with RepoHome).
- **New: `<nav class="project-switcher" role="tablist">`** — one
  `<RouterLink class="project-tab">` per sibling Project in the
  repo's `comtryaConfig.projects`. Current project tab is
  `.active` (inverted ink/paper). `◇` glyph mirrors the chip
  in the IssuesList / EpicCard project tags. Only renders when
  the repo has more than one declared Project, so single-Project
  repos don't see a stray nav.
- **Editorial chip row** replacing the three `summary-grid` boxes
  (Root, Labels, Owners). Each declared label and each typed
  owner ref renders as its own chip; `tone-owner` chips show the
  owner's `kind` discriminator as the chip's small label
  (`team`, `user`, …) and the full URN as the `title` attribute
  on hover.

Hits the same redundancy mandate as iteration 28 — three labelled
boxes carrying one value each, plus a buried switcher, collapse
to one editorial header strip with the switcher up front.

Net change: -3 summary boxes, +1 inline switcher, +1 chip row.
Bundle ships all five new identifier prefixes (`project-switcher`,
`project-tab`, `project-chip`, `tone-label`, `tone-owner`).

### 2026-05-14 — iteration 29 (Workspace home — repo-list keyboard nav)

WorkspaceHome.vue picks up the same j/k/Enter pattern that
IssuesList and PullsQueue have shipped with since iteration 20.
Press `j` to advance the focused repo, `k` to retreat, `Enter`
to navigate. Focused row gets the `--paper-tint` background lift
(same shape as the issues/PR queues for consistency). A muted
`<kbd>` footer documents the bindings inline.

- `useShortcuts` composable from `@comtrya/sdk-vue` — same
  declarative shape as the rest of the keyboard-driven
  surfaces. The composable's input-skip guard (iteration 20
  fix) means typing in a focus-stealing slot widget won't
  hijack `j`/`k`.
- Enter pushes via `useRouter().push("/r/<path>")` rather than
  setting `location.href` — keeps the SPA navigation snappy.
- `watch(repositories, …)` keeps `focusedRepoIdx` clamped to
  the visible range when the list grows from empty (initial
  load) or shrinks (a repo was deleted).
- Mouse hover sets the focused index so the keyboard cursor
  follows the mouse instead of jumping back.

Net add: ~70 lines of script + template + style. The repo list
now feels like every other list in the shell — flow, no
clicks, no mouse-only paths.

### 2026-05-14 — iteration 28 (Repo home — editorial chip row)

The repo home shed its three labelled summary boxes (`Path`,
`Default branch`, `Repository ID` — the last of which was just
displaying the same data as the URL) and its duplicate intro
line (`visibility · openPRs · updated` repeated as inline text).
Replaced with a single editorial title + one compact chip row.

`RepoHome.vue` now renders:
- Overline `Repository`.
- Display-typeface title at 56px (down from 72px; less shouty).
- Optional repo description in serif body type.
- One horizontal `.repo-chip-row` with five chips:
  - `main · branch` (tone: ink)
  - `private · visibility` (tone: muted, or `tone-good` when public)
  - `<N> · open PRs` (muted when 0)
  - `<N> · open issues` (muted when 0) — new this iteration
  - `3m ago · updated` (muted)

`openIssues` count is wired live via `invokeOp('ext_issues',
'issues', 'list-issues', { repository: <repo-uri>, … })` against
the per-repo URI. Subscribes to
`dev.comtrya.issues.{opened,closed,reopened}` — the count ticks
without a reload, same SSE shape as iteration-27's nav badge but
filtered to this repo.

`relativeUpdated()` handles the three shapes the kernel returns
for `updated`: ISO timestamps, `@<epoch-seconds>` strings, and
already-relative phrases ("3 minutes ago"). Normalises to a
single relative phrase so the chip is consistent across repos.

Net deletion: ~80 lines of CSS (`.summary-grid`, `.repo-intro`
and friends). Net add: ~70 lines of chip styling. The shape is
denser, the data is the same, and the redundancy is gone.

### 2026-05-14 — iteration 27 (Open-issues badge on Issues nav)

Mirrors the existing open-PR badge on the Pull-requests nav item.
`App.vue` queries `ext_issues/list-issues` for the workspace at
boot, counts entries whose state is OPEN or REOPENED, and exposes
`openIssuesTotal` as a ref. The Issues nav item picks it up in
the same `badge?` slot the PR nav uses, and SSE subscriptions to
`dev.comtrya.issues.{opened,closed,reopened}` keep the count
live without a reload.

- Same shape as iteration-25's repo switcher — one fetch at
  boot, signature-free counting (we only need the total), live
  refresh on the three relevant SSE topics.
- Unsubscribers tracked in `issueUnsubscribers` and torn down
  on `onUnmounted` alongside the existing live-event stream.
- Live verified: workspace currently shows 7 open issues, the
  badge will render `7` next to the Issues nav item.

The corresponding TODO in Quick wins ("Surface open-issues count
next to the Issues nav item — needs an `openIssues` field on the
workspace summary") was actually solvable without a kernel
change: the existing `list-issues` op carries enough state for a
client-side count. Kernel-side aggregation can come later if/when
the count needs to be authoritative at scale.

### 2026-05-14 — iteration 26 (Typed `#Ref` family in kernel CUE)

CUE schema gains a typed `#Ref` family. Owners / authors /
assignees write `{kind, slug}` and CUE *derives* the canonical
`comtrya://` URN via `ref: "comtrya://\(kind)/\(slug)"`.

```cue
owners: [
    {kind: "team", slug: "platform-maintainers"},
    {kind: "user", slug: "rawkode"},
]
```

emits:

```json
"owners": [
    { "kind": "team", "slug": "platform-maintainers", "ref": "comtrya://team/platform-maintainers" },
    { "kind": "user", "slug": "rawkode",              "ref": "comtrya://user/rawkode" }
]
```

Kernel does not synthesise the URN in Rust — CUE owns the
derivation. Single closed type rather than a disjunction;
disjunctions over `slug`-only types are non-disjoint and the
URN template doesn't propagate through them.

**Critical injection-location fix.** The kernel previously
wrote the base schema to `<workdir>/_comtrya/00-kernel.cue`.
CUE excludes `_`-prefixed directories from `./...` walks (Go-
module convention), so subdirectory CUE files never saw the
base schema and the URN template never reached them. Base +
extension snippets now land at the workdir root
(`00-comtrya-kernel.cue`, `01-comtrya-ext-<id>-<schema>.cue`)
where cuengine's `./...` walk reaches them.

**ext_docs** drops local `#Person`, uses kernel `#PrincipalRef`.

**Per-Project CUE files** (kernel, frontend, ext_docs) moved
from `owners: ["..."]` (strings) to typed `{kind, slug}`.

**Shell UI** (`ProjectsPanel.vue`, `ProjectHome.vue`) reads
`owners: ComtryaRef[]`. Renders `slug` as label, derives the
author-kind glyph from the URN scheme, hover-reveals full URN.

Verified end-to-end: live curl against
`/r/comtrya/dogfood`-`comtryaConfig` returns three Projects
with typed owner refs all carrying derived URNs.

User feedback captured to durable memory
(`feedback-cue-no-rust-derive`): tools that can do the work do
the work, no Rust shortcuts.

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
