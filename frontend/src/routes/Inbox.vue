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
import { getGraphQLClient, invokeOp } from "@comtrya/sdk-core";
import { LabelPill, type LabelCatalog } from "@comtrya/sdk-vue";

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

const WORKSPACE_URI = "comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
const OPEN_PR_STATES = new Set(["DRAFT", "READY", "REVIEW", "OPEN", "REOPENED"]);

const loadState = ref<"loading" | "ready" | "error">("loading");
const loadError = ref<string | null>(null);

const repositories = ref<RepoLookupRow[]>([]);
const issues = ref<IssueRow[]>([]);
const pulls = ref<PullRow[]>([]);

const openIssues = computed(() =>
  [...issues.value]
    .filter((i) => (i.state ?? "").toLowerCase() !== "closed")
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
);

const openPulls = computed(() =>
  [...pulls.value]
    .filter((p) => OPEN_PR_STATES.has((p.state ?? "").toUpperCase()))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
);

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
              </span>
            </RouterLink>
          </li>
        </ul>
      </article>

      <article class="inbox-panel" data-smoke="inbox-issues">
        <header>
          <h2>Open issues</h2>
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
  border-bottom: 2px solid var(--ink, #111);
  padding-bottom: 18px;
}

.inbox-header .overline {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.inbox-header h1 {
  margin: 0;
  font-family: var(--display);
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.inbox-tagline {
  margin: 4px 0 0;
  color: var(--ink-faint);
  font-size: 13px;
  max-width: 56ch;
}

.inbox-error {
  color: var(--accent-red, #b34040);
  font-size: 13px;
}

.inbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1100px) {
  .inbox-grid {
    grid-template-columns: 1fr;
  }
}

.inbox-panel {
  border: 1px solid var(--ink-rule, #d8d6cf);
  background: var(--paper, #fffdf8);
}

.inbox-panel > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ink-rule, #d8d6cf);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.inbox-panel > header h2 {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: inherit;
  text-transform: inherit;
  color: var(--ink);
}

.inbox-panel > header .count {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink);
  border: 1px solid var(--rule-light);
  padding: 0 6px;
}

.inbox-empty {
  margin: 0;
  padding: 12px 16px;
  color: var(--ink-faint);
  font-style: italic;
  font-size: 13px;
}

.inbox-panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.inbox-panel li {
  border-bottom: 1px solid var(--rule-light);
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
  color: var(--ink);
}

.inbox-row:hover {
  background: var(--paper-tint);
}

.inbox-row .number {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-faint);
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
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-faint);
}

.inbox-row .meta .repo {
  color: var(--ink-soft);
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
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-faint);
}
</style>
