<script setup lang="ts">
/**
 * Workspace Inbox — "needs your attention" across all repos.
 *
 * v1: aggregated open work (PRs in non-terminal states, issues
 * not in `closed`) across the workspace, denser than the per-repo
 * workbench but still scannable. Linear's My Issues / GitHub's
 * Notifications are the obvious inspirations; the win we're after
 * is one route that answers "what's live right now?" without
 * forcing the user to walk every repo.
 *
 * Viewer-specific filtering (assignee-of-me, reviewer-of-me) is a
 * future iteration; this slice surfaces the raw open queue so we
 * can iterate on filtering with real data on screen.
 */

import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGraphQLClient, invokeOp } from "@comtrya/sdk-core";
import { LabelPill, type LabelCatalog } from "@comtrya/sdk-vue";

import { isFailedCheckState, isOpenPrState } from "./inbox-filters";

const route = useRoute();
const router = useRouter();

interface RepoLookupRow {
  id: string;
  path: string;
  labelCatalog?: LabelCatalog | null;
}

interface IssueRow {
  id?: string;
  number?: number;
  title?: string;
  state?: string;
  labels?: string[];
  projectName?: string | null;
  updatedAt?: string | null;
}

interface PullRow {
  id?: string;
  number?: number;
  title?: string;
  state?: string;
  repositoryId?: string;
  updatedAt?: string | null;
  authorRef?: string | null;
  head?: string;
  base?: string;
}

interface CheckRow {
  id?: string;
  name?: string;
  state?: string;
  conclusion?: string;
  required?: boolean;
  repositoryId?: string;
  commitOid?: string | null;
  updatedAt?: string | null;
}

const WORKSPACE_ID = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
const WORKSPACE_URI = `comtrya://workspace/${WORKSPACE_ID}`;

const loadState = ref<"loading" | "ready" | "error">("loading");
const loadError = ref<string | null>(null);

const repositories = ref<RepoLookupRow[]>([]);
const issues = ref<IssueRow[]>([]);
const pulls = ref<PullRow[]>([]);
const checks = ref<CheckRow[]>([]);

const openIssues = computed(() =>
  [...issues.value]
    .filter((i) => (i.state ?? "").toLowerCase() !== "closed")
    .filter((i) => {
      const sel = selectedProject.value;
      return !sel || (i.projectName ?? null) === sel;
    })
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
);

/** Repo filter — read from `?repo=<repositoryId>` and apply to
 *  the per-repo panels (pulls, checks). Issues are workspace-scoped
 *  in this codebase so they stay unfiltered; the panel header
 *  notes that scope when a repo is selected. */
const selectedRepoId = computed<string | null>(() => {
  const raw = route.query.repo;
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
});

function setRepoFilter(repoId: string | null): void {
  const next = { ...route.query };
  if (repoId) {
    next.repo = repoId;
  } else {
    delete next.repo;
  }
  void router.push({ path: "/inbox", query: next });
}

/** Project filter — read from `?project=<projectName>`. Applies to
 *  the issues panel (which carries `projectName` per-issue). Pulls
 *  and checks don't yet carry a project field at the inbox-level
 *  projection so they remain unfiltered when only a project is set;
 *  combining with a repo filter narrows both surfaces predictably. */
const selectedProject = computed<string | null>(() => {
  const raw = route.query.project;
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
});

function setProjectFilter(name: string | null): void {
  const next = { ...route.query };
  if (name) {
    next.project = name;
  } else {
    delete next.project;
  }
  void router.push({ path: "/inbox", query: next });
}

const openPulls = computed(() => {
  const sel = selectedRepoId.value;
  return [...pulls.value]
    .filter((p) => isOpenPrState(p.state))
    .filter((p) => !sel || p.repositoryId === sel)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
});

/** Required checks currently in a failed terminal state. Required
 *  is the gating signal — non-required failures aren't actionable
 *  in the same way (they're advisory). The set composes
 *  `repository.labelCatalog` / pulls.requiredChecks intent. */
const failingChecks = computed(() => {
  const sel = selectedRepoId.value;
  return [...checks.value]
    .filter((c) => c.required === true)
    .filter((c) => isFailedCheckState(c.state))
    .filter((c) => !sel || c.repositoryId === sel)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
});

/**
 * Repos that have anything to surface in the inbox right now —
 * any open PR or any failing required check. The "All" chip is
 * always rendered first; then one chip per repo that has at
 * least one of those signals. A clean repo doesn't earn a chip.
 */
const filterRepoOptions = computed<RepoLookupRow[]>(() => {
  const reposWithSignal = new Set<string>();
  for (const p of pulls.value) {
    if (isOpenPrState(p.state) && typeof p.repositoryId === "string") {
      reposWithSignal.add(p.repositoryId);
    }
  }
  for (const c of checks.value) {
    if (
      c.required === true &&
      isFailedCheckState(c.state) &&
      typeof c.repositoryId === "string"
    ) {
      reposWithSignal.add(c.repositoryId);
    }
  }
  return repositories.value.filter((r) => reposWithSignal.has(r.id));
});

/**
 * Projects that have an open issue surfaced by the inbox. Like the
 * repo chip set, only projects with a live signal earn a chip — a
 * project whose issues are all closed doesn't clutter the strip.
 * Sorted alphabetically; the "all" chip is rendered separately.
 */
const filterProjectOptions = computed<string[]>(() => {
  const names = new Set<string>();
  for (const issue of issues.value) {
    if ((issue.state ?? "").toLowerCase() === "closed") continue;
    const name = issue.projectName;
    if (typeof name === "string" && name.length > 0) names.add(name);
  }
  return Array.from(names).sort();
});

/**
 * Compact relative-time formatter. Matches the IssuesList / PullsQueue
 * convention so the same "X ago" string reads the same in every
 * queue surface. Returns empty string for missing / unparseable
 * inputs so the meta row collapses cleanly when an item lacks a
 * timestamp.
 */
function relativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / week)}w ago`;
}

const repoPathById = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {};
  for (const r of repositories.value) out[r.id] = r.path;
  return out;
});

/**
 * Pick a label catalog to render an issue or PR's labels against.
 * Today every repo in the workspace declares its own catalog; the
 * canonical wire form (`type::value`) is shared across catalogs, so
 * looking the wire name up in any catalog that defines it is enough
 * to recover the `kind`. v1 just uses the first repo's catalog;
 * issue-level catalog resolution is a follow-up.
 */
const sharedLabelCatalog = computed<LabelCatalog | null>(() => {
  for (const repo of repositories.value) {
    if (repo.labelCatalog && Object.keys(repo.labelCatalog).length > 0) {
      return repo.labelCatalog;
    }
  }
  return null;
});

onMounted(async () => {
  loadState.value = "loading";
  loadError.value = null;
  try {
    const [workspaceData, issueRes, pullRes] = await Promise.all([
      getGraphQLClient().query<{
        workspace?: {
          repositories?: RepoLookupRow[];
        };
      }>(
        "{ workspace { repositories { id path labelCatalog } } }",
      ),
      invokeOp<IssueRow[]>("ext_issues", "issues", "list-issues", {
        repository: WORKSPACE_URI,
        limit: 1024,
      }),
      invokeOp<PullRow[]>("ext_pull_requests", "pulls", "list-pulls", {
        repository: WORKSPACE_URI,
        limit: 1024,
      }),
    ]);
    repositories.value = workspaceData.workspace?.repositories ?? [];
    issues.value = issueRes.ok ? (issueRes.value as IssueRow[]) : [];
    pulls.value = pullRes.ok ? (pullRes.value as PullRow[]) : [];
    // Checks are repo-scoped — list-checks rejects the workspace
    // URI alone — so fan out per repo and merge.
    const checkResults = await Promise.all(
      repositories.value.map((repo) =>
        invokeOp<CheckRow[]>("ext_checks", "checks", "list-checks", {
          repository: `${WORKSPACE_URI}/repository/${repo.id}`,
          limit: 256,
        }),
      ),
    );
    checks.value = checkResults.flatMap((r) =>
      r.ok ? (r.value as CheckRow[]) : [],
    );
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    loadError.value = caught instanceof Error ? caught.message : String(caught);
  }
});

function issueHref(issue: IssueRow): string {
  return `/x/issues/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3/${issue.number ?? 0}`;
}

function pullHref(pull: PullRow): string {
  const repoPath = pull.repositoryId ? repoPathById.value[pull.repositoryId] : "";
  if (repoPath) return `/r/${repoPath}/pulls/${pull.id ?? ""}`;
  return `/x/pulls/${pull.id ?? ""}`;
}

function pullRepoLabel(pull: PullRow): string {
  return (pull.repositoryId && repoPathById.value[pull.repositoryId]) || "—";
}
</script>

<template>
  <section class="inbox" data-smoke="inbox">
    <header class="inbox-header">
      <p class="overline">Workspace</p>
      <h1>Inbox</h1>
      <p class="inbox-tagline">
        Open work across every repo. The first answer to "what's live?"
        without walking every workbench.
      </p>
    </header>

    <p v-if="loadState === 'error'" class="inbox-error" role="alert">
      {{ loadError }}
    </p>

    <nav
      v-if="loadState === 'ready' && filterRepoOptions.length > 0"
      class="inbox-filter"
      data-smoke="inbox-filter"
      aria-label="Scope inbox by repository"
    >
      <span class="inbox-filter-label">repo ·</span>
      <button
        type="button"
        class="inbox-filter-chip"
        :class="{ active: !selectedRepoId }"
        @click="setRepoFilter(null)"
      >all</button>
      <button
        v-for="repo in filterRepoOptions"
        :key="repo.id"
        type="button"
        class="inbox-filter-chip"
        :class="{ active: selectedRepoId === repo.id }"
        @click="setRepoFilter(repo.id)"
      >{{ repo.path }}</button>
    </nav>

    <nav
      v-if="loadState === 'ready' && filterProjectOptions.length > 0"
      class="inbox-filter"
      data-smoke="inbox-filter-project"
      aria-label="Scope inbox by project"
    >
      <span class="inbox-filter-label">project ·</span>
      <button
        type="button"
        class="inbox-filter-chip"
        :class="{ active: !selectedProject }"
        @click="setProjectFilter(null)"
      >all</button>
      <button
        v-for="name in filterProjectOptions"
        :key="name"
        type="button"
        class="inbox-filter-chip tone-project"
        :class="{ active: selectedProject === name }"
        @click="setProjectFilter(name)"
      ><span class="project-glyph" aria-hidden="true">◇</span>{{ name }}</button>
    </nav>

    <section v-if="loadState !== 'error'" class="inbox-grid">
      <article class="inbox-panel" data-smoke="inbox-pulls">
        <header>
          <h2>Open pull requests</h2>
          <span class="count">{{ openPulls.length }}</span>
        </header>
        <p v-if="loadState === 'loading'" class="inbox-empty">Loading…</p>
        <p v-else-if="openPulls.length === 0" class="inbox-empty">
          No open pull requests right now.
        </p>
        <ul v-else>
          <li v-for="pull in openPulls" :key="pull.id">
            <RouterLink :to="pullHref(pull)" class="inbox-row">
              <span class="number">#{{ pull.number }}</span>
              <span class="title">{{ pull.title || "(untitled)" }}</span>
              <span class="meta">
                <code class="repo">{{ pullRepoLabel(pull) }}</code>
                <span class="state">{{ (pull.state ?? "").toLowerCase() }}</span>
                <span
                  v-if="relativeTime(pull.updatedAt)"
                  class="age"
                  :title="pull.updatedAt ?? ''"
                >{{ relativeTime(pull.updatedAt) }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </article>

      <article class="inbox-panel" data-smoke="inbox-checks">
        <header>
          <h2>Failing required checks</h2>
          <span class="count" :class="{ alarm: failingChecks.length > 0 }">{{ failingChecks.length }}</span>
        </header>
        <p v-if="loadState === 'loading'" class="inbox-empty">Loading…</p>
        <p v-else-if="failingChecks.length === 0" class="inbox-empty">
          All required checks are passing.
        </p>
        <ul v-else>
          <li v-for="check in failingChecks" :key="check.id">
            <div class="inbox-row inbox-row-static">
              <span class="title">{{ check.name || "(unnamed)" }}</span>
              <span class="meta">
                <code class="repo">{{ check.repositoryId ? repoPathById[check.repositoryId] || "—" : "—" }}</code>
                <code v-if="check.commitOid" class="oid">{{ check.commitOid.slice(0, 7) }}</code>
                <span class="state state-bad">{{ (check.state ?? "").toLowerCase() }}</span>
              </span>
            </div>
          </li>
        </ul>
      </article>

      <article class="inbox-panel" data-smoke="inbox-issues">
        <header>
          <h2>
            Open issues
            <span v-if="selectedRepoId" class="scope-note">(workspace-scoped — not narrowed by repo filter)</span>
          </h2>
          <span class="count">{{ openIssues.length }}</span>
        </header>
        <p v-if="loadState === 'loading'" class="inbox-empty">Loading…</p>
        <p v-else-if="openIssues.length === 0" class="inbox-empty">
          No open issues right now.
        </p>
        <ul v-else>
          <li v-for="issue in openIssues" :key="issue.id">
            <RouterLink :to="issueHref(issue)" class="inbox-row">
              <span class="number">#{{ issue.number }}</span>
              <span class="title">{{ issue.title || "(untitled)" }}</span>
              <span v-if="issue.labels && issue.labels.length > 0" class="labels">
                <LabelPill
                  v-for="label in issue.labels"
                  :key="label"
                  :name="label"
                  :catalog="sharedLabelCatalog"
                />
              </span>
              <span v-if="issue.projectName" class="project">◇ {{ issue.projectName }}</span>
              <span
                v-if="relativeTime(issue.updatedAt)"
                class="age"
                :title="issue.updatedAt ?? ''"
              >{{ relativeTime(issue.updatedAt) }}</span>
            </RouterLink>
          </li>
        </ul>
      </article>
    </section>
  </section>
</template>

<style scoped>
.inbox {
  display: grid;
  gap: 24px;
}

.inbox-header {
  display: grid;
  gap: 6px;
  border-bottom: 0.5px solid var(--line);
  padding-bottom: 18px;
}

.inbox-header .overline {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-3);
}

.inbox-header h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 400;
  font-style: italic;
  line-height: 1;
}

.inbox-tagline {
  margin: 4px 0 0;
  color: var(--fg-3);
  font-size: 13px;
  max-width: 56ch;
}

.inbox-error {
  color: var(--err);
  font-size: 13px;
}

.inbox-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.inbox-filter-label {
  color: var(--fg-3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.inbox-filter-chip {
  background: transparent;
  border: 0.5px solid var(--line);
  border-radius: var(--r-xs);
  color: var(--fg-2);
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.inbox-filter-chip.tone-project {
  color: var(--info);
}

.inbox-filter-chip .project-glyph {
  font-size: 10px;
  line-height: 1;
}

.inbox-filter-chip:hover {
  color: var(--fg);
  border-color: var(--fg);
}

.inbox-filter-chip.active {
  background: var(--fg);
  border-color: var(--fg);
  color: var(--bg);
}

.scope-note {
  margin-left: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-3);
  text-transform: none;
  letter-spacing: 0;
}

.inbox-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

@media (max-width: 1400px) {
  .inbox-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .inbox-grid {
    grid-template-columns: 1fr;
  }
}

.inbox-panel {
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-md);
  background: var(--surface);
  overflow: hidden;
}

.inbox-panel > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--fg-3);
}

.inbox-panel > header h2 {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: inherit;
  text-transform: inherit;
  color: var(--fg);
}

.inbox-panel > header .count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg);
  border: 1px solid var(--line);
  padding: 0 6px;
}

.inbox-panel > header .count.alarm {
  color: var(--bg);
  background: var(--err);
  border-color: var(--err);
  border-radius: var(--r-xs);
}

.inbox-row-static {
  cursor: default;
}

.inbox-row .meta .oid {
  color: var(--fg-2);
}

.inbox-row .meta .state-bad {
  color: var(--err);
  font-weight: 600;
}

.inbox-empty {
  margin: 0;
  padding: 12px 16px;
  color: var(--fg-3);
  font-style: italic;
  font-size: 13px;
}

.inbox-panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.inbox-panel li {
  border-bottom: 1px solid var(--line);
}

.inbox-panel li:last-child {
  border-bottom: none;
}

.inbox-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 8px;
  padding: 8px 16px;
  color: var(--fg);
}

.inbox-row:hover {
  background: var(--bg-2);
}

.inbox-row .number {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
}

.inbox-row .title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inbox-row .meta {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
}

.inbox-row .meta .repo {
  color: var(--fg-2);
}

.inbox-row .meta .state {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
}

.inbox-row .labels {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.inbox-row .project {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
}

.inbox-row .age {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--fg-3);
  margin-left: auto;
  white-space: nowrap;
}

.inbox-row .meta .age {
  margin-left: 0;
}
</style>
