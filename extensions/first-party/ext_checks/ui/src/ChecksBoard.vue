<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { type OpResult } from "@comtrya/sdk-core";
import { extChecksXChecks } from "../../dist/ext_checks.client";

interface HostContext {
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}

interface CheckRun {
  id?: string;
  repository?: string;
  workspaceId?: string | null;
  repositoryId?: string | null;
  commitOID?: string | null;
  name?: string;
  state?: string | null;
  conclusion?: string | null;
  required?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface CheckReadinessCard {
  check: CheckRun;
  blocking?: boolean;
}

interface CheckReadinessColumn {
  key: string;
  label: string;
  count: number;
  cards: CheckReadinessCard[];
}

interface CheckReadinessBoard {
  repository: string;
  commitOID?: string | null;
  total: number;
  columns: CheckReadinessColumn[];
}

type CheckStatus =
  | "blocking"
  | "failed"
  | "running"
  | "queued"
  | "passing"
  | "skipped"
  | "empty";

const props = defineProps<{
  host?: HostContext;
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}>();

const loadState = ref<"idle" | "loading" | "ready" | "empty" | "error">("idle");
const loadError = ref<string | null>(null);
const checks = ref<CheckRun[]>([]);
const board = ref<CheckReadinessBoard | null>(null);

const workspaceId = computed(() => props.workspaceId ?? props.host?.workspaceId ?? "");
const repositoryId = computed(() => props.repositoryId ?? props.host?.repositoryId ?? "");
const repositoryPath = computed(() => props.repositoryPath ?? props.host?.repositoryPath ?? "");
const repositoryUri = computed(() => {
  if (!workspaceId.value || !repositoryId.value) return "";
  return `comtrya://workspace/${workspaceId.value}/repository/${repositoryId.value}`;
});

const sortedChecks = computed(() => sortChecksByUpdated(checks.value));
const recentChecks = computed(() => sortedChecks.value.slice(0, 8));
const columns = computed(() => board.value?.columns ?? []);
const boardChecks = computed(() =>
  columns.value.flatMap((column) => column.cards.map((card) => card.check)),
);
const summaryChecks = computed(() => boardChecks.value);
const totalChecks = computed(() => board.value?.total ?? summaryChecks.value.length);
const requiredFailures = computed(
  () => summaryChecks.value.filter((check) => statusForCheck(check) === "blocking").length,
);
const runningChecks = computed(
  () => summaryChecks.value.filter((check) => statusForCheck(check) === "running").length,
);
const queuedChecks = computed(
  () => summaryChecks.value.filter((check) => statusForCheck(check) === "queued").length,
);
const headlineState = computed(() => {
  if (loadState.value === "loading") return "Loading";
  if (requiredFailures.value > 0) return `${requiredFailures.value} blocking`;
  if (runningChecks.value > 0) return `${runningChecks.value} running`;
  if (queuedChecks.value > 0) return `${queuedChecks.value} queued`;
  if (totalChecks.value > 0) return "Passing";
  return "No runs";
});
const headlineTone = computed<"ok" | "warn" | "err" | "info">(() => {
  if (loadState.value === "loading") return "info";
  if (requiredFailures.value > 0) return "err";
  if (runningChecks.value > 0 || queuedChecks.value > 0) return "warn";
  if (totalChecks.value > 0) return "ok";
  return "info";
});
const activeCommit = computed(() => {
  const explicit = board.value?.commitOID;
  if (explicit) return explicit;
  return sortedChecks.value[0]?.commitOID ?? "";
});

let loadRun = 0;

function unwrapOp<T>(result: OpResult<unknown>, label: string): T {
  if (result.ok) return result.value as T;
  throw new Error(`${label}: ${result.error.message}`);
}

async function loadChecks(): Promise<void> {
  const run = ++loadRun;
  checks.value = [];
  board.value = null;
  loadError.value = null;

  if (!repositoryUri.value) {
    loadState.value = "empty";
    return;
  }

  loadState.value = "loading";
  try {
    const listResult = await extChecksXChecks.listChecks({
      repository: repositoryUri.value,
      limit: 256,
    });
    const nextChecks = unwrapOp<CheckRun[]>(listResult, "list checks");
    const activeCommitOID = activeCommitFor(nextChecks);
    const boardInput =
      activeCommitOID ?
        {
          repository: repositoryUri.value,
          commitOID: activeCommitOID,
          limit: 256,
        }
      : {
          repository: repositoryUri.value,
          limit: 256,
        };
    const boardResult = await extChecksXChecks.readinessBoard(boardInput);
    if (run !== loadRun) return;

    const nextBoard = unwrapOp<CheckReadinessBoard>(boardResult, "readiness board");
    checks.value = Array.isArray(nextChecks) ? nextChecks : [];
    board.value = normalizeBoard(nextBoard);
    loadState.value = checks.value.length > 0 ? "ready" : "empty";
  } catch (caught) {
    if (run !== loadRun) return;
    loadState.value = "error";
    loadError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function normalizeBoard(value: CheckReadinessBoard): CheckReadinessBoard {
  return {
    repository: value?.repository ?? repositoryUri.value,
    commitOID: value?.commitOID ?? null,
    total: Number(value?.total ?? 0),
    columns: Array.isArray(value?.columns)
      ? value.columns.map((column) => ({
          key: column.key,
          label: column.label,
          count: Number(column.count ?? 0),
          cards: Array.isArray(column.cards) ? column.cards : [],
        }))
      : [],
  };
}

function normalizedCheckState(state: string | null | undefined): string {
  return (state ?? "").trim().toUpperCase();
}

function statusForCheck(check: CheckRun): CheckStatus {
  const state = normalizedCheckState(check.state);
  if (check.required === true && (state === "FAILURE" || state === "FAILED")) {
    return "blocking";
  }
  if (state === "FAILURE" || state === "FAILED") return "failed";
  if (state === "RUNNING") return "running";
  if (state === "PENDING") return "queued";
  if (state === "SUCCESS" || state === "SUCCEEDED") return "passing";
  if (state === "SKIPPED") return "skipped";
  return "queued";
}

function checkTimestamp(check: CheckRun): string {
  return check.updatedAt ?? check.createdAt ?? "";
}

function sortChecksByUpdated(items: CheckRun[]): CheckRun[] {
  return [...items].sort((a, b) => checkTimestamp(b).localeCompare(checkTimestamp(a)));
}

function activeCommitFor(items: CheckRun[]): string | undefined {
  const commits = new Map<string, { count: number; latest: string }>();
  for (const check of items) {
    const commitOID = check.commitOID?.trim();
    if (!commitOID) continue;
    const existing = commits.get(commitOID);
    if (!existing) {
      commits.set(commitOID, { count: 1, latest: checkTimestamp(check) });
      continue;
    }
    existing.count += 1;
    if (checkTimestamp(check) > existing.latest) {
      existing.latest = checkTimestamp(check);
    }
  }
  return [...commits.entries()].sort(([, a], [, b]) => {
    const byCount = b.count - a.count;
    if (byCount !== 0) return byCount;
    return b.latest.localeCompare(a.latest);
  })[0]?.[0];
}

function checkStateLabel(check: CheckRun): string {
  const state = normalizedCheckState(check.state);
  if (check.required === true && (state === "FAILURE" || state === "FAILED")) {
    return "Required failure";
  }
  switch (state) {
    case "FAILURE":
    case "FAILED":
      return "Failed";
    case "RUNNING":
      return "Running";
    case "PENDING":
      return "Queued";
    case "SUCCESS":
    case "SUCCEEDED":
      return "Passed";
    case "SKIPPED":
      return "Skipped";
    default:
      return "Queued";
  }
}

function statusTone(status: CheckStatus): "ok" | "warn" | "err" | "info" {
  if (status === "blocking") return "err";
  if (status === "failed" || status === "running" || status === "queued") {
    return "warn";
  }
  if (status === "empty") return "info";
  return "ok";
}

function commitLabel(check: CheckRun): string {
  return (check.commitOID ?? "").slice(0, 7);
}

function relativeTime(value: string | null | undefined, now = Date.now()): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now - then);
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

function checkKey(card: CheckReadinessCard): string {
  const check = card.check;
  return check.id ?? `${check.name ?? "check"}-${check.commitOID ?? "commit"}`;
}

watch(
  () => [workspaceId.value, repositoryId.value] as const,
  () => void loadChecks(),
);

onMounted(() => void loadChecks());
</script>

<template>
  <section class="checks-board extension-payload" data-smoke="checks-board">
    <header class="checks-header">
      <div>
        <p class="eyebrow">{{ repositoryPath || "Repository" }}</p>
        <h2>Checks</h2>
      </div>
      <span :class="['state-pill', `tone-${headlineTone}`]">
        <span />
        {{ headlineState }}
      </span>
    </header>

    <p v-if="loadState === 'error'" class="checks-message tone-err" role="alert">
      {{ loadError }}
    </p>
    <p v-else-if="loadState === 'loading'" class="checks-message">
      Loading workflow runs...
    </p>
    <p v-else-if="!repositoryUri" class="checks-message">
      Repository scope unavailable.
    </p>
    <p v-else-if="loadState === 'empty'" class="checks-message">
      No workflow runs recorded.
    </p>

    <template v-else>
      <section class="summary-grid" aria-label="Check summary" data-smoke="checks-summary">
        <div>
          <span>Required failures</span>
          <strong>{{ requiredFailures }}</strong>
        </div>
        <div>
          <span>Running</span>
          <strong>{{ runningChecks }}</strong>
        </div>
        <div>
          <span>Queued</span>
          <strong>{{ queuedChecks }}</strong>
        </div>
        <div>
          <span>Total runs</span>
          <strong>{{ totalChecks }}</strong>
        </div>
      </section>

      <section class="readiness-board" aria-label="Check readiness lanes">
        <article
          v-for="column in columns"
          :key="column.key"
          class="readiness-column"
          :data-smoke="`checks-column-${column.key}`"
        >
          <header>
            <h3>{{ column.label }}</h3>
            <span>{{ column.count }}</span>
          </header>
          <p v-if="column.cards.length === 0" class="column-empty">No runs</p>
          <ul v-else>
            <li v-for="card in column.cards" :key="checkKey(card)">
              <span :class="['status-light', `tone-${statusForCheck(card.check)}`]" />
              <span class="check-main">
                <strong>{{ card.check.name ?? "check" }}</strong>
                <em>
                  {{ card.check.required ? "required" : "optional" }}
                  <span v-if="commitLabel(card.check)" class="oid">
                    {{ commitLabel(card.check) }}
                  </span>
                </em>
              </span>
              <span :class="['check-state', `tone-${statusTone(statusForCheck(card.check))}`]">
                {{ checkStateLabel(card.check) }}
              </span>
            </li>
          </ul>
        </article>
      </section>

      <section class="recent-runs" data-smoke="checks-recent-runs">
        <header>
          <div>
            <p class="eyebrow">Latest</p>
            <h3>Workflow runs</h3>
          </div>
          <span v-if="activeCommit" class="commit-label">{{ activeCommit.slice(0, 7) }}</span>
        </header>
        <ul>
          <li v-for="check in recentChecks" :key="check.id ?? `${check.name}-${check.commitOID}`">
            <span :class="['status-light', `tone-${statusForCheck(check)}`]" />
            <span class="check-main">
              <strong>{{ check.name ?? "check" }}</strong>
              <em>
                {{ checkStateLabel(check) }}
                <span v-if="relativeTime(checkTimestamp(check))">
                  {{ relativeTime(checkTimestamp(check)) }}
                </span>
              </em>
            </span>
            <span class="check-required">{{ check.required ? "required" : "optional" }}</span>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
.extension-payload {
  display: grid;
  gap: 14px;
}

.checks-board {
  min-width: 0;
  padding: 14px;
  color: var(--fg);
}

.checks-header,
.recent-runs > header {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.checks-header h2,
.recent-runs h3,
.readiness-column h3 {
  margin: 0;
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.2;
}

.recent-runs h3,
.readiness-column h3 {
  font-size: 13px;
}

.eyebrow {
  margin: 0 0 4px;
  overflow: hidden;
  color: var(--fg-3);
  font-size: 12px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-pill,
.check-state,
.check-required,
.commit-label {
  flex: 0 0 auto;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-sm);
  padding: 0 8px;
  color: var(--fg-2);
  background: var(--surface);
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.state-pill > span,
.status-light {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
}

.tone-ok {
  color: var(--ok);
  border-color: var(--ok-soft);
  background: var(--ok-soft);
}

.tone-warn {
  color: var(--warn);
  border-color: var(--warn-soft);
  background: var(--warn-soft);
}

.tone-err {
  color: var(--err);
  border-color: var(--err-soft);
  background: var(--err-soft);
}

.tone-info {
  color: var(--accent);
  border-color: var(--accent-soft);
  background: var(--accent-soft);
}

.checks-message {
  margin: 0;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-sm);
  padding: 10px 12px;
  color: var(--fg-2);
  background: var(--surface);
  font-size: 13px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.summary-grid > div,
.readiness-column,
.recent-runs {
  min-width: 0;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.summary-grid > div {
  padding: 10px;
}

.summary-grid span {
  display: block;
  overflow-wrap: anywhere;
  color: var(--fg-3);
  font-size: 11px;
  line-height: 1.25;
}

.summary-grid strong {
  display: block;
  margin-top: 6px;
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.readiness-board {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  align-items: start;
}

.readiness-column {
  overflow: hidden;
}

.readiness-column > header,
.recent-runs > header {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 0.5px solid var(--line);
  padding: 10px;
}

.readiness-column > header > span {
  display: inline-flex;
  min-width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--fg-2);
  font-family: var(--font-mono);
  font-size: 12px;
}

.readiness-column ul,
.recent-runs ul {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.readiness-column li,
.recent-runs li {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  border-top: 0.5px solid var(--line);
  padding: 10px;
}

.readiness-column li:first-child,
.recent-runs li:first-child {
  border-top: 0;
}

.check-main {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.check-main strong,
.check-main em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-main strong {
  color: var(--fg);
  font-size: 13px;
  font-weight: 600;
}

.check-main em {
  color: var(--fg-3);
  font-size: 12px;
  font-style: normal;
}

.oid,
.commit-label {
  font-family: var(--font-mono);
}

.column-empty {
  margin: 0;
  padding: 10px;
  color: var(--fg-3);
  font-size: 12px;
}

.recent-runs {
  overflow: hidden;
}

.recent-runs > header {
  padding: 10px 12px;
}

.check-required {
  min-height: 22px;
  color: var(--fg-3);
  background: var(--bg);
}

@media (max-width: 720px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .readiness-board {
    grid-template-columns: minmax(0, 1fr);
  }

  .checks-header,
  .recent-runs > header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
