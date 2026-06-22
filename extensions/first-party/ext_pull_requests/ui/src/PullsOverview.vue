<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  mergeReadinessBoard,
  type PullMergeReadinessBoard,
  type PullMergeReadinessCard,
  type PullMergeReadinessColumn,
} from "./api";
import {
  defaultWorkspaceId,
  pullHref,
  pullsIndexHref,
  relativeTime,
  type LoadState,
  type PullRequest,
} from "./types";

interface HostContext {
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}

const props = defineProps<{
  host?: HostContext;
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}>();

type SummaryTone = "blocked" | "review" | "checks" | "ready" | "draft";

interface SummaryItem {
  label: string;
  value: number;
  tone: SummaryTone;
}

interface PullPreview {
  card: PullMergeReadinessCard;
  laneKey: string;
  laneLabel: string;
}

const ACTIVE_LANE_KEYS = [
  "draft",
  "blocked-review",
  "blocked-checks",
  "needs-review",
  "waiting-checks",
  "ready",
] as const;

const PREVIEW_LANE_KEYS = [
  "blocked-review",
  "blocked-checks",
  "needs-review",
  "waiting-checks",
  "ready",
  "draft",
] as const;

const board = ref<PullMergeReadinessBoard | null>(null);
const loadState = ref<LoadState>("idle");

const workspaceId = computed(
  () => props.workspaceId ?? props.host?.workspaceId ?? defaultWorkspaceId(),
);
const repositoryId = computed(() => props.repositoryId ?? props.host?.repositoryId ?? null);
const repositoryPath = computed(() => props.repositoryPath ?? props.host?.repositoryPath ?? null);

const columnsByKey = computed(() => {
  const out = new Map<string, PullMergeReadinessColumn>();
  for (const column of board.value?.columns ?? []) out.set(column.key, column);
  return out;
});

const activeCount = computed(() =>
  ACTIVE_LANE_KEYS.reduce((sum, key) => sum + laneCount(key), 0),
);

const summaryItems = computed<SummaryItem[]>(() => [
  {
    label: "blocked",
    value: laneCount("blocked-review") + laneCount("blocked-checks"),
    tone: "blocked",
  },
  {
    label: "review",
    value: laneCount("needs-review") + laneCount("blocked-review"),
    tone: "review",
  },
  {
    label: "checks",
    value: laneCount("waiting-checks") + laneCount("blocked-checks"),
    tone: "checks",
  },
  {
    label: "ready",
    value: laneCount("ready"),
    tone: "ready",
  },
  {
    label: "draft",
    value: laneCount("draft"),
    tone: "draft",
  },
]);

const actionableRows = computed<PullPreview[]>(() => {
  const rows: PullPreview[] = [];
  for (const key of PREVIEW_LANE_KEYS) {
    const column = columnsByKey.value.get(key);
    if (!column) continue;
    for (const card of column.cards) {
      rows.push({
        card,
        laneKey: key,
        laneLabel: column.label,
      });
    }
  }
  return rows.slice(0, 5);
});

onMounted(() => void load());
watch(() => [workspaceId.value, repositoryId.value], () => void load());

function laneCount(key: string): number {
  return columnsByKey.value.get(key)?.count ?? 0;
}

function pullsListHref(): string {
  return pullsIndexHref(repositoryPath.value);
}

function pullDetailHref(pull: Pick<PullRequest, "id">): string {
  return pullHref(pull, repositoryPath.value);
}

async function load(): Promise<void> {
  loadState.value = "loading";
  try {
    const next = await mergeReadinessBoard({
      workspaceId: workspaceId.value,
      repositoryId: repositoryId.value,
      requiredApprovals: 1,
      limit: 64,
    });
    board.value = next;
    loadState.value = next.total > 0 ? "ready" : "empty";
  } catch {
    loadState.value = "error";
    board.value = null;
  }
}
</script>

<template>
  <section class="pulls-overview" data-smoke="pulls-overview">
    <header>
      <div class="heading">
        <h3>Pull requests</h3>
        <span v-if="board" class="total">{{ board.total }} total</span>
      </div>
      <a :href="pullsListHref()">{{ activeCount }} active</a>
    </header>

    <div
      v-if="loadState === 'ready'"
      class="readiness-summary"
      data-smoke="pulls-readiness-summary"
      aria-label="Pull request readiness summary"
    >
      <div
        v-for="item in summaryItems"
        :key="item.label"
        :class="['summary-item', `tone-${item.tone}`]"
      >
        <span class="summary-value">{{ item.value }}</span>
        <span class="summary-label">{{ item.label }}</span>
      </div>
    </div>

    <p v-if="loadState === 'loading'" class="muted">Loading...</p>
    <p v-else-if="loadState === 'error'" class="muted">Could not load pulls.</p>
    <p v-else-if="loadState === 'empty'" class="muted">No pull requests.</p>
    <p v-else-if="actionableRows.length === 0" class="muted">No active pull requests.</p>

    <ul v-else>
      <li
        v-for="row in actionableRows"
        :key="row.card.pullRequest.id"
        data-smoke="pulls-readiness-row"
      >
        <a :href="pullDetailHref(row.card.pullRequest)">
          <span class="row-main">
            <span class="num">#{{ row.card.pullRequest.number }}</span>
            <span class="title">{{ row.card.pullRequest.title }}</span>
            <span :class="['lane', `lane-${row.laneKey}`]">{{ row.laneLabel }}</span>
          </span>
          <span class="row-meta">
            <span
              class="branch"
              :title="`${row.card.pullRequest.headRef} -> ${row.card.pullRequest.baseRef}`"
            >
              {{ row.card.pullRequest.headRef }}
              <span>-&gt;</span>
              {{ row.card.pullRequest.baseRef }}
            </span>
            <span class="age">
              {{ relativeTime(row.card.pullRequest.updatedAt ?? row.card.pullRequest.createdAt) }}
            </span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pulls-overview {
  display: grid;
  gap: 10px;
}

.pulls-overview header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.heading {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.pulls-overview h3 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 14px;
}

.pulls-overview header a,
.total,
.muted {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  text-decoration: none;
}

.pulls-overview header a {
  white-space: nowrap;
}

.readiness-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(52px, 1fr));
  gap: 4px;
}

.summary-item {
  min-width: 0;
  display: grid;
  gap: 2px;
  padding: 6px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  border-radius: 6px;
  background: var(--bg-2, #0e1014);
}

.summary-value {
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  line-height: 1;
  font-weight: 700;
}

.summary-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.summary-item.tone-blocked .summary-value {
  color: var(--accent-err, #c9341c);
}

.summary-item.tone-review .summary-value {
  color: var(--accent-blue, #1d55a6);
}

.summary-item.tone-checks .summary-value {
  color: var(--accent-warn, #a05f00);
}

.summary-item.tone-ready .summary-value {
  color: var(--accent-teal, #087f6f);
}

.summary-item.tone-draft .summary-value {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-overview ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;
}

.pulls-overview li a {
  display: grid;
  gap: 4px;
  padding: 8px 0;
  color: inherit;
  text-decoration: none;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.pulls-overview li:last-child a {
  border-bottom: 0;
}

.row-main {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 7px;
  align-items: center;
}

.row-meta {
  min-width: 0;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.num {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.lane {
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  border: 0.5px solid currentColor;
  padding: 0 4px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.lane-ready {
  color: var(--accent-teal, #087f6f);
}

.lane-draft {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.lane-needs-review,
.lane-blocked-review {
  color: var(--accent-blue, #1d55a6);
}

.lane-waiting-checks {
  color: var(--accent-warn, #a05f00);
}

.lane-blocked-checks {
  color: var(--accent-err, #c9341c);
}

.branch,
.age {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.branch {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.branch span {
  color: var(--fg-4, rgba(255,255,255,0.34));
  padding: 0 3px;
}

.age {
  flex: 0 0 auto;
}
</style>
