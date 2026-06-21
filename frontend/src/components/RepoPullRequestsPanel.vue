<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { invokeOp, type OpResult } from "@comtrya/sdk-core";

interface WitPullRequest {
  id: string;
  number: number;
  title: string;
  state?: string | { tag?: string } | null;
  headRef: string;
  baseRef: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ReadinessCard {
  pullRequest: WitPullRequest;
}

interface ReadinessColumn {
  key: string;
  label: string;
  count: number;
  cards: ReadinessCard[];
}

interface ReadinessBoard {
  total: number;
  columns: ReadinessColumn[];
}

interface PullPreview {
  card: ReadinessCard;
  laneKey: string;
  laneLabel: string;
}

const props = defineProps<{
  workspaceId: string | null;
  repositoryId: string;
  repositoryPath: string;
}>();

const ACTIVE_LANES = [
  "draft",
  "blocked-review",
  "blocked-checks",
  "needs-review",
  "waiting-checks",
  "ready",
] as const;

const PREVIEW_LANES = [
  "blocked-review",
  "blocked-checks",
  "needs-review",
  "waiting-checks",
  "ready",
  "draft",
] as const;

const board = ref<ReadinessBoard | null>(null);
const loadState = ref<"idle" | "loading" | "ready" | "empty" | "error">("idle");

const repositoryUri = computed(() => {
  if (!props.workspaceId || !props.repositoryId) return "";
  return `comtrya://workspace/${props.workspaceId}/repository/${props.repositoryId}`;
});

const columnsByKey = computed(() => {
  const out = new Map<string, ReadinessColumn>();
  for (const column of board.value?.columns ?? []) out.set(column.key, column);
  return out;
});

const activeCount = computed(() =>
  ACTIVE_LANES.reduce((sum, key) => sum + laneCount(key), 0),
);

const summaryItems = computed(() => [
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
  { label: "ready", value: laneCount("ready"), tone: "ready" },
  { label: "draft", value: laneCount("draft"), tone: "draft" },
]);

const rows = computed<PullPreview[]>(() => {
  const next: PullPreview[] = [];
  for (const key of PREVIEW_LANES) {
    const column = columnsByKey.value.get(key);
    if (!column) continue;
    for (const card of column.cards) {
      next.push({ card, laneKey: key, laneLabel: column.label });
    }
  }
  return next.slice(0, 5);
});

onMounted(() => void load());
watch(repositoryUri, () => void load());

function laneCount(key: string): number {
  return columnsByKey.value.get(key)?.count ?? 0;
}

function pullHref(pull: WitPullRequest): string {
  return `${pullsHref()}/${encodeURIComponent(pull.id)}`;
}

function pullsHref(): string {
  const segments = props.repositoryPath.split("/").filter(Boolean).map(encodeURIComponent);
  return `/r/${segments.join("/")}/pulls`;
}

function relativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return value;
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

function unwrap<T>(result: OpResult<unknown>): T {
  if (result.ok) return result.value as T;
  throw new Error(result.error.message);
}

async function load(): Promise<void> {
  if (!repositoryUri.value) {
    loadState.value = "empty";
    board.value = null;
    return;
  }

  loadState.value = "loading";
  try {
    const result = await invokeOp<ReadinessBoard>(
      "ext_pull_requests",
      "pulls",
      "merge-readiness-board",
      {
        repository: repositoryUri.value,
        checkSummaries: [],
        requiredApprovals: 1,
        limit: 64,
      },
    );
    const next = unwrap<ReadinessBoard>(result);
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
      <a :href="pullsHref()">{{ activeCount }} active</a>
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
    <p v-else-if="rows.length === 0" class="muted">No active pull requests.</p>

    <ul v-else>
      <li v-for="row in rows" :key="row.card.pullRequest.id" data-smoke="pulls-readiness-row">
        <a :href="pullHref(row.card.pullRequest)">
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

.summary-item.tone-blocked .summary-value,
.lane-blocked-checks {
  color: var(--accent-err, #c9341c);
}

.summary-item.tone-review .summary-value,
.lane-needs-review,
.lane-blocked-review {
  color: var(--accent-blue, #1d55a6);
}

.summary-item.tone-checks .summary-value,
.lane-waiting-checks {
  color: var(--accent-warn, #a05f00);
}

.summary-item.tone-ready .summary-value,
.lane-ready {
  color: var(--accent-teal, #087f6f);
}

.summary-item.tone-draft .summary-value,
.lane-draft {
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

.title,
.branch {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
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

.branch,
.age {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.branch {
  min-width: 0;
}

.branch span {
  color: var(--fg-4, rgba(255,255,255,0.34));
  padding: 0 3px;
}

.age {
  flex: 0 0 auto;
}
</style>
