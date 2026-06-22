<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { getGraphQLClient, invokeOp } from "@comtrya/sdk-core";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";
import {
  checkStateLabel,
  matchesActionFilter,
  relativeTime,
  sortChecksByUpdated,
  statusForCheck,
  statusForChecks,
  statusLabel,
  type ActionCheckStatus,
  type ActionFilter,
} from "./pipeline-summary";

const props = withDefaults(defineProps<{
  groups?: string[];
  repo?: string;
}>(), {
  groups: () => [],
  repo: "",
});

const repoPath = computed(() =>
  [...props.groups, props.repo].filter(Boolean).join("/"),
);
const scope = computed(() => repoPath.value || "Workspace");

interface RepositoryRow {
  id: string;
  name: string;
  path: string;
}

interface CheckRun {
  id?: string;
  repositoryId?: string | null;
  commitOID?: string | null;
  name?: string;
  state?: string | null;
  required?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface WorkspaceActionsPayload {
  workspace?: {
    id?: string | null;
    repositories?: RepositoryRow[];
  } | null;
}

interface RepoActionsPayload {
  workspace?: {
    id?: string | null;
    repositoryByPath?: RepositoryRow | null;
  } | null;
}

interface RepoActionSummary {
  repo: RepositoryRow;
  checks: CheckRun[];
  status: ActionCheckStatus;
  unavailable: boolean;
}

const WORKSPACE_ACTIONS_QUERY = `query ShellActionsWorkspace {
  workspace {
    id
    repositories { id name path }
  }
}`;

const REPO_ACTIONS_QUERY = `query ShellActionsRepository($segments: [String!]!) {
  workspace {
    id
    repositoryByPath(segments: $segments) {
      id
      name
      path
    }
  }
}`;

const loadState = ref<"loading" | "ready" | "missing" | "error">("loading");
const loadError = ref<string | null>(null);
const repositorySummaries = ref<RepoActionSummary[]>([]);
const selectedFilter = ref<ActionFilter>("all");

const filters: Array<{ key: ActionFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "blocking", label: "Blocking" },
  { key: "running", label: "Running" },
  { key: "queued", label: "Queued" },
  { key: "passing", label: "Passing" },
];

const allChecks = computed(() =>
  repositorySummaries.value.flatMap((summary) =>
    summary.checks.map((check) => ({ ...check, repo: summary.repo })),
  ),
);

const filteredSummaries = computed(() =>
  repositorySummaries.value.filter((summary) =>
    matchesActionFilter(summary.status, selectedFilter.value),
  ),
);

const recentChecks = computed(() =>
  sortChecksByUpdated(allChecks.value).slice(0, 12),
);

const totalChecks = computed(() => allChecks.value.length);
const blockingChecks = computed(() =>
  allChecks.value.filter((check) => check.required === true && statusForCheck(check) === "blocking"),
);
const runningChecks = computed(() =>
  allChecks.value.filter((check) => statusForCheck(check) === "running"),
);
const queuedChecks = computed(() =>
  allChecks.value.filter((check) => statusForCheck(check) === "queued"),
);
const blockingRepos = computed(() =>
  repositorySummaries.value.filter((summary) => summary.status === "blocking"),
);
const statusChipTone = computed<"ok" | "warn" | "err" | "info">(() => {
  if (loadState.value === "loading") return "info";
  if (blockingChecks.value.length > 0) return "err";
  if (runningChecks.value.length > 0 || queuedChecks.value.length > 0) return "warn";
  return "ok";
});
const statusChipLabel = computed(() => {
  if (loadState.value === "loading") return "Loading";
  if (blockingChecks.value.length > 0) return `${blockingChecks.value.length} blocking`;
  if (runningChecks.value.length > 0) return `${runningChecks.value.length} running`;
  if (queuedChecks.value.length > 0) return `${queuedChecks.value.length} queued`;
  if (totalChecks.value > 0) return "Passing";
  return "No runs";
});

let loadRun = 0;

function repoUri(workspaceId: string, repositoryId: string): string {
  return `comtrya://workspace/${workspaceId}/repository/${repositoryId}`;
}

function repoChecksHref(repo: RepositoryRow): string {
  return `/r/${repo.path}/checks`;
}

function commitLabel(check: CheckRun): string {
  return (check.commitOID ?? "").slice(0, 7);
}

function statusTone(status: ActionCheckStatus): "ok" | "warn" | "err" | "info" {
  if (status === "blocking") return "err";
  if (status === "failed" || status === "running" || status === "queued") return "warn";
  if (status === "empty") return "info";
  return "ok";
}

function filterCount(filter: ActionFilter): number {
  if (filter === "all") return repositorySummaries.value.length;
  return repositorySummaries.value.filter((summary) =>
    matchesActionFilter(summary.status, filter),
  ).length;
}

function filterIcon(filter: ActionFilter): "bolt" | "check" | "clock" | "play" | "x" {
  if (filter === "blocking") return "x";
  if (filter === "running") return "play";
  if (filter === "queued") return "clock";
  if (filter === "passing") return "check";
  return "bolt";
}

function blockingCheckCount(summary: RepoActionSummary): number {
  return summary.checks.filter(
    (check) => check.required === true && statusForCheck(check) === "blocking",
  ).length;
}

function repoSummaryLine(summary: RepoActionSummary): string {
  if (summary.unavailable) return "checks unavailable";
  if (summary.checks.length === 0) return "no workflow runs";
  const required = summary.checks.filter((check) => check.required === true).length;
  return `${summary.checks.length} runs / ${required} required`;
}

async function loadActions(): Promise<void> {
  const run = ++loadRun;
  loadState.value = "loading";
  loadError.value = null;
  repositorySummaries.value = [];
  try {
    let workspaceId: string | null | undefined;
    let repos: RepositoryRow[] = [];
    if (repoPath.value) {
      const payload = await getGraphQLClient().query<RepoActionsPayload>(
        REPO_ACTIONS_QUERY,
        { segments: [...props.groups, props.repo].filter(Boolean) },
      );
      workspaceId = payload.workspace?.id;
      const repo = payload.workspace?.repositoryByPath;
      if (!repo) {
        if (run === loadRun) loadState.value = "missing";
        return;
      }
      repos = [repo];
    } else {
      const payload = await getGraphQLClient().query<WorkspaceActionsPayload>(
        WORKSPACE_ACTIONS_QUERY,
      );
      workspaceId = payload.workspace?.id;
      repos = payload.workspace?.repositories ?? [];
    }
    if (!workspaceId) throw new Error("workspace id was not returned");
    const summaries = await Promise.all(
      repos.map(async (repo): Promise<RepoActionSummary> => {
        const result = await invokeOp<CheckRun[]>(
          "ext_checks",
          "checks",
          "list-checks",
          {
            repository: repoUri(workspaceId, repo.id),
            limit: 256,
          },
        );
        if (!result.ok || !Array.isArray(result.value)) {
          return { repo, checks: [], status: "empty", unavailable: true };
        }
        const checks = sortChecksByUpdated(result.value);
        return {
          repo,
          checks,
          status: statusForChecks(checks),
          unavailable: false,
        };
      }),
    );
    summaries.sort((a, b) => {
      const priority: Record<ActionCheckStatus, number> = {
        blocking: 0,
        failed: 1,
        running: 2,
        queued: 3,
        passing: 4,
        skipped: 5,
        empty: 6,
      };
      const byStatus = priority[a.status] - priority[b.status];
      if (byStatus !== 0) return byStatus;
      return a.repo.path.localeCompare(b.repo.path);
    });
    if (run !== loadRun) return;
    repositorySummaries.value = summaries;
    loadState.value = "ready";
  } catch (caught) {
    if (run !== loadRun) return;
    loadState.value = "error";
    loadError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

watch(
  () => [props.groups.join("/"), props.repo].join("/"),
  () => void loadActions(),
);

onMounted(() => void loadActions());
</script>

<template>
  <section class="actions-page" data-smoke="pipelines-dashboard">
    <header class="actions-head hairline-b">
      <div>
        <p class="overline">{{ scope }}</p>
        <h1>Actions</h1>
      </div>
      <Chip :tone="statusChipTone" dot>{{ statusChipLabel }}</Chip>
    </header>

    <p v-if="loadState === 'error'" class="actions-error" role="alert">
      {{ loadError }}
    </p>

    <p v-else-if="loadState === 'missing'" class="actions-error" role="alert">
      Repository not found.
    </p>

    <template v-else>
      <section class="actions-summary" data-smoke="actions-summary" aria-label="Actions summary">
        <div>
          <span>Repositories</span>
          <strong>{{ repositorySummaries.length }}</strong>
        </div>
        <div>
          <span>Required failures</span>
          <strong>{{ blockingChecks.length }}</strong>
        </div>
        <div>
          <span>Running</span>
          <strong>{{ runningChecks.length }}</strong>
        </div>
        <div>
          <span>Total runs</span>
          <strong>{{ totalChecks }}</strong>
        </div>
      </section>

      <section class="actions-filters" aria-label="Filter repositories by run status">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          :class="{ active: selectedFilter === filter.key }"
          :data-smoke="`actions-filter-${filter.key}`"
          @click="selectedFilter = filter.key"
        >
          <Icon :name="filterIcon(filter.key)" />
          <span>{{ filter.label }}</span>
          <b>{{ filterCount(filter.key) }}</b>
        </button>
      </section>

      <div class="actions-grid">
        <section class="actions-panel" data-smoke="actions-repositories">
          <header>
            <div>
              <p class="overline">Run status</p>
              <h2>Repositories</h2>
            </div>
            <span>{{ filteredSummaries.length }} shown</span>
          </header>

          <p v-if="loadState === 'loading'" class="actions-empty">Loading workflow runs...</p>
          <p v-else-if="repositorySummaries.length === 0" class="actions-empty">
            No repositories in this workspace.
          </p>
          <p v-else-if="filteredSummaries.length === 0" class="actions-empty">
            No repositories match this filter.
          </p>
          <ul v-else>
            <li
              v-for="summary in filteredSummaries"
              :key="summary.repo.id"
              data-smoke="actions-repository-row"
            >
              <RouterLink :to="repoChecksHref(summary.repo)" class="repo-action-row">
                <span :class="['status-light', `tone-${summary.status}`]" />
                <span class="repo-main">
                  <strong>{{ summary.repo.path }}</strong>
                  <em>{{ repoSummaryLine(summary) }}</em>
                </span>
                <Chip :tone="statusTone(summary.status)" mono>
                  {{ statusLabel(summary.status) }}
                </Chip>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="actions-panel" data-smoke="actions-recent-runs">
          <header>
            <div>
              <p class="overline">Latest</p>
              <h2>Workflow runs</h2>
            </div>
            <span>{{ recentChecks.length }} recent</span>
          </header>

          <p v-if="loadState === 'loading'" class="actions-empty">Loading recent runs...</p>
          <p v-else-if="recentChecks.length === 0" class="actions-empty">
            No workflow runs recorded.
          </p>
          <ul v-else>
            <li v-for="check in recentChecks" :key="check.id ?? `${check.repo.id}-${check.name}-${check.commitOID}`">
              <RouterLink :to="repoChecksHref(check.repo)" class="run-row">
                <span :class="['status-light', `tone-${statusForCheck(check)}`]" />
                <span class="run-main">
                  <strong>{{ check.name ?? 'check' }}</strong>
                  <em>
                    {{ check.repo.path }}
                    <span v-if="commitLabel(check)" class="oid">{{ commitLabel(check) }}</span>
                  </em>
                </span>
                <span class="run-meta">
                  <Chip :tone="statusTone(statusForCheck(check))" mono>
                    {{ checkStateLabel(check.state) }}
                  </Chip>
                  <small>{{ relativeTime(check.updatedAt ?? check.createdAt) }}</small>
                </span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>

      <section
        v-if="blockingRepos.length > 0"
        class="actions-panel actions-blockers"
        data-smoke="actions-blockers"
      >
        <header>
          <div>
            <p class="overline">Attention</p>
            <h2>Required failures</h2>
          </div>
          <span>{{ blockingRepos.length }} repos</span>
        </header>
        <ul>
          <li v-for="summary in blockingRepos" :key="summary.repo.id">
            <RouterLink :to="repoChecksHref(summary.repo)" class="blocker-row">
              <strong>{{ summary.repo.path }}</strong>
              <span>{{ blockingCheckCount(summary) }} failing required checks</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
.actions-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.actions-head {
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.actions-head h1 {
  font-family: var(--font-sans);
  margin: 0;
  font-size: 28px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.1;
}

.actions-head .overline,
.actions-panel .overline {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.actions-error {
  margin: 20px 28px 0;
  border: 0.5px solid var(--err-soft);
  border-radius: var(--r-sm);
  padding: 10px 12px;
  color: var(--err);
  background: var(--err-soft);
}

.actions-summary {
  margin: 22px 28px 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.actions-summary > div {
  min-width: 0;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-sm);
  background: var(--surface);
  padding: 12px 14px;
}

.actions-summary span,
.actions-panel > header > span {
  display: block;
  color: var(--fg-3);
  font-size: 12px;
}

.actions-summary strong {
  display: block;
  margin-top: 6px;
  color: var(--fg);
  font-size: 24px;
  line-height: 1;
}

.actions-filters {
  margin: 16px 28px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.actions-filters button {
  flex: 0 0 auto;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--fg-2);
  padding: 0 10px;
  cursor: pointer;
}

.actions-filters button:hover,
.actions-filters button.active {
  border-color: var(--accent-line);
  background: var(--accent-soft);
  color: var(--fg);
}

.actions-filters b {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
}

.actions-grid {
  margin: 18px 28px 0;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 14px;
  align-items: start;
}

.actions-panel {
  min-width: 0;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-sm);
  background: var(--surface);
  overflow: hidden;
}

.actions-panel > header {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border-bottom: 0.5px solid var(--line);
}

.actions-panel h2 {
  margin-top: 2px;
  font-size: 16px;
  line-height: 1.2;
}

.actions-panel ul {
  display: grid;
}

.actions-panel li + li {
  border-top: 0.5px solid var(--line);
}

.actions-empty {
  padding: 18px 14px;
  color: var(--fg-3);
}

.repo-action-row,
.run-row,
.blocker-row {
  min-width: 0;
  display: grid;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  text-decoration: none;
}

.repo-action-row {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.run-row {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.blocker-row {
  grid-template-columns: minmax(0, 1fr) auto;
}

.repo-action-row:hover,
.run-row:hover,
.blocker-row:hover {
  background: var(--surface-2);
  text-decoration: none;
}

.repo-main,
.run-main,
.run-meta {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.run-meta {
  justify-items: end;
}

.repo-main strong,
.run-main strong,
.blocker-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-main em,
.run-main em,
.run-meta small,
.blocker-row span {
  font-style: normal;
  font-size: 12px;
  color: var(--fg-2);
}

.run-main .oid {
  margin-left: 6px;
  font-family: var(--font-mono);
  color: var(--fg-3);
}

.status-light {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--fg-4);
  box-shadow: 0 0 0 3px var(--surface-2);
}

.status-light.tone-blocking {
  background: var(--err);
}

.status-light.tone-failed,
.status-light.tone-running,
.status-light.tone-queued {
  background: var(--warn);
}

.status-light.tone-passing,
.status-light.tone-skipped {
  background: var(--ok);
}

.actions-blockers {
  margin: 14px 28px 28px;
}

@media (max-width: 980px) {
  .actions-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .actions-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions-summary {
    grid-template-columns: 1fr;
  }

  .run-row,
  .blocker-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .run-meta {
    grid-column: 2;
    justify-items: start;
  }
}
</style>
