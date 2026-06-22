<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  bodyExcerpt,
  classifyPrincipal as principalLabel,
  extensionHref,
  LabelPill,
  parseQueryFilters,
  useShortcuts,
  type LabelCatalog,
} from "@comtrya/sdk-vue";
import {
  loadIssueBoard,
  type IssueBoard,
  type IssueBoardCard,
  type IssueBoardId,
} from "./api";
import {
  filterIssueBoard,
  hasIssueBoardFilterQuery,
} from "./issue-board-filter";
import { issueRouteContext } from "./route-context";
import {
  defaultWorkspaceId,
  EXT_ISSUES_ROUTE_PREFIX,
  stateTone,
  type ExtensionRouteParams,
} from "./types";

const props = withDefaults(defineProps<{
  workspaceId?: string;
  repositoryId?: string | null;
  repositorySegments?: string[];
  routeParams?: ExtensionRouteParams;
  labelCatalog?: LabelCatalog | null;
}>(), {
  workspaceId: defaultWorkspaceId(),
  repositoryId: null,
  labelCatalog: null,
});

const boardTabs: Array<{ id: IssueBoardId; label: string; hint: string }> = [
  { id: "workflow", label: "Workflow", hint: "status labels" },
  { id: "priority", label: "Priority", hint: "p0-p3 labels" },
  { id: "project", label: "Projects", hint: "CUE project" },
  { id: "assignee", label: "Assignees", hint: "current owners" },
  { id: "label", label: "Labels", hint: "label catalog" },
  { id: "milestone", label: "Milestones", hint: "release labels" },
  { id: "author", label: "Authors", hint: "opened by" },
  { id: "triage", label: "Triage", hint: "state queue" },
];

const ISSUE_BOARD_FILTER_KEYS = [
  "assignee",
  "author",
  "is",
  "issue",
  "label",
  "milestone",
  "priority",
  "project",
  "state",
  "status",
  "workflow",
] as const;

const loadState = ref<"idle" | "loading" | "ready" | "error">("idle");
const error = ref<string | null>(null);
const activeBoardId = ref<IssueBoardId>("workflow");
const boards = ref<Record<IssueBoardId, IssueBoard | null>>(emptyBoards());
const boardSearch = ref("");
const focusedIssueId = ref<string | null>(null);
const locationSearch = ref(typeof window === "undefined" ? "" : window.location.search);

const routeContext = computed(() =>
  issueRouteContext(
    {
      workspaceId: props.workspaceId,
      repositoryId: props.repositoryId,
      repositorySegments: props.repositorySegments,
      routeParams: props.routeParams,
    },
    locationSearch.value,
  ),
);
const activeBoard = computed(() => boards.value[activeBoardId.value]);
const boardQuery = computed(() => parseQueryFilters(boardSearch.value, ISSUE_BOARD_FILTER_KEYS));
const hasBoardFilter = computed(() => hasIssueBoardFilterQuery(boardQuery.value));
const visibleBoard = computed<IssueBoard | null>(() => {
  const board = activeBoard.value;
  if (!board) return null;
  return hasBoardFilter.value ? filterIssueBoard(board, boardQuery.value) : board;
});
const totalIssues = computed(() => activeBoard.value?.total ?? 0);
const visibleIssues = computed(() => visibleBoard.value?.total ?? 0);
const issueCountLabel = computed(() =>
  hasBoardFilter.value
    ? `${visibleIssues.value} of ${totalIssues.value}`
    : String(totalIssues.value),
);
const issueCountIsPlural = computed(() =>
  (hasBoardFilter.value ? totalIssues.value : visibleIssues.value) !== 1,
);
const boardFilterSummary = computed(() =>
  hasBoardFilter.value ? `${visibleIssues.value}/${totalIssues.value} issues` : "",
);
const newIssueHref = computed(() => {
  const base = extensionHref(EXT_ISSUES_ROUTE_PREFIX, "/new", {
    repositorySegments: routeContext.value.repositorySegments,
  });
  const params = new URLSearchParams({ workspaceId: routeContext.value.workspaceId });
  if (routeContext.value.repositoryId) {
    params.set("repositoryId", routeContext.value.repositoryId);
  }
  return `${base}?${params.toString()}`;
});
const issueCardHref = (issue: IssueBoardCard["issue"]): string =>
  extensionHref(EXT_ISSUES_ROUTE_PREFIX, `/${issue.workspaceId}/${issue.number}`, {
    repositorySegments: routeContext.value.repositorySegments,
  });
const orderedIssueIds = computed(() => {
  const ids: string[] = [];
  for (const column of visibleBoard.value?.columns ?? []) {
    for (const card of column.cards) {
      if (!ids.includes(card.issue.id)) ids.push(card.issue.id);
    }
  }
  return ids;
});

onMounted(() => {
  syncRouteStateFromLocation();
  window.addEventListener("popstate", syncRouteStateFromLocation);
  void loadBoards();
});

onUnmounted(() => {
  window.removeEventListener("popstate", syncRouteStateFromLocation);
});

watch(
  () => [
    props.workspaceId,
    props.repositoryId,
    props.routeParams?.params?.workspaceId,
    props.routeParams?.params?.repositoryId,
    locationSearch.value,
  ],
  () => void loadBoards(),
);

watch(activeBoardId, () => {
  focusedIssueId.value = orderedIssueIds.value[0] ?? null;
});

watch(boardSearch, () => writeUrlSearch());

watch(visibleBoard, () => {
  if (!focusedIssueId.value || !orderedIssueIds.value.includes(focusedIssueId.value)) {
    focusedIssueId.value = orderedIssueIds.value[0] ?? null;
  }
});

useShortcuts({
  h: (event) => {
    event.preventDefault();
    moveBoard(-1);
  },
  ArrowLeft: (event) => {
    event.preventDefault();
    moveBoard(-1);
  },
  l: (event) => {
    event.preventDefault();
    moveBoard(1);
  },
  ArrowRight: (event) => {
    event.preventDefault();
    moveBoard(1);
  },
  j: (event) => {
    event.preventDefault();
    moveFocus(1);
  },
  ArrowDown: (event) => {
    event.preventDefault();
    moveFocus(1);
  },
  k: (event) => {
    event.preventDefault();
    moveFocus(-1);
  },
  ArrowUp: (event) => {
    event.preventDefault();
    moveFocus(-1);
  },
  Enter: (event) => {
    const issue = focusedCard.value?.issue;
    if (!issue) return;
    event.preventDefault();
    window.location.href = issueCardHref(issue);
  },
});

const focusedCard = computed(() => {
  const id = focusedIssueId.value;
  if (!id) return null;
  for (const column of visibleBoard.value?.columns ?? []) {
    const card = column.cards.find((entry) => entry.issue.id === id);
    if (card) return card;
  }
  return null;
});

function emptyBoards(): Record<IssueBoardId, IssueBoard | null> {
  return {
    workflow: null,
    priority: null,
    project: null,
    assignee: null,
    label: null,
    milestone: null,
    author: null,
    triage: null,
  };
}

function syncRouteStateFromLocation(): void {
  locationSearch.value = window.location.search;
  readUrlSearch();
}

async function loadBoards(): Promise<void> {
  loadState.value = "loading";
  error.value = null;
  try {
    const input = {
      workspaceId: routeContext.value.workspaceId,
      repositoryId: routeContext.value.repositoryId,
      limit: 128,
    };
    const [
      workflow,
      priority,
      project,
      assignee,
      label,
      milestone,
      author,
      triage,
    ] = await Promise.all([
      loadIssueBoard("workflow", input),
      loadIssueBoard("priority", input),
      loadIssueBoard("project", input),
      loadIssueBoard("assignee", input),
      loadIssueBoard("label", input),
      loadIssueBoard("milestone", input),
      loadIssueBoard("author", input),
      loadIssueBoard("triage", input),
    ]);
    boards.value = {
      workflow,
      priority,
      project,
      assignee,
      label,
      milestone,
      author,
      triage,
    };
    loadState.value = "ready";
    focusedIssueId.value = orderedIssueIds.value[0] ?? null;
  } catch (caught) {
    boards.value = emptyBoards();
    focusedIssueId.value = null;
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function boardTabTotal(id: IssueBoardId): number {
  return boards.value[id]?.total ?? 0;
}

function setActiveBoard(id: IssueBoardId): void {
  activeBoardId.value = id;
}

function clearBoardSearch(): void {
  boardSearch.value = "";
}

function onBoardSearchEscape(): void {
  if (boardSearch.value) clearBoardSearch();
}

function readUrlSearch(): void {
  if (typeof window === "undefined") return;
  boardSearch.value = new URLSearchParams(window.location.search).get("q") ?? "";
}

function writeUrlSearch(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const trimmed = boardSearch.value.trim();
  if (trimmed) params.set("q", trimmed);
  else params.delete("q");
  const next = params.toString();
  const target = `${window.location.pathname}${next ? `?${next}` : ""}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (target !== current) window.history.replaceState(window.history.state, "", target);
}

function moveBoard(delta: number): void {
  const index = boardTabs.findIndex((tab) => tab.id === activeBoardId.value);
  const next = Math.max(0, Math.min(boardTabs.length - 1, index + delta));
  activeBoardId.value = boardTabs[next]?.id ?? activeBoardId.value;
}

function moveFocus(delta: number): void {
  const ids = orderedIssueIds.value;
  if (ids.length === 0) return;
  const index = focusedIssueId.value ? ids.indexOf(focusedIssueId.value) : -1;
  const next = Math.max(0, Math.min(ids.length - 1, index + delta));
  focusedIssueId.value = ids[next] ?? null;
}

function cardBadges(card: IssueBoardCard): string[] {
  const badges: string[] = [];
  if (card.workflowLabel) badges.push(card.workflowLabel);
  if (card.priorityLabel) badges.push(card.priorityLabel);
  if (card.milestoneLabel) badges.push(card.milestoneLabel);
  if (card.issue.projectName) badges.push(`project:${card.issue.projectName}`);
  return badges;
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
</script>

<template>
  <section class="issue-board" data-smoke="issues-board">
    <header class="issue-board-head">
      <div class="issue-board-title">
        <h2>Issues board</h2>
        <span class="issue-board-subtitle">
          <template v-if="loadState === 'loading'">loading issue board...</template>
          <template v-else-if="loadState === 'error'">board unavailable</template>
          <template v-else>
            {{ issueCountLabel }} issue<template v-if="issueCountIsPlural">s</template>
            on {{ boardTabs.find((tab) => tab.id === activeBoardId)?.label.toLowerCase() }}
          </template>
        </span>
      </div>
      <a :href="newIssueHref" class="issue-board-new">+ new</a>
    </header>

    <nav class="issue-board-tabs" aria-label="Issue board views">
      <button
        v-for="tab in boardTabs"
        :key="tab.id"
        type="button"
        :class="['issue-board-tab', { active: activeBoardId === tab.id }]"
        :aria-pressed="activeBoardId === tab.id"
        :title="tab.hint"
        @click="setActiveBoard(tab.id)"
      >
        <span>{{ tab.label }}</span>
        <strong>{{ boardTabTotal(tab.id) }}</strong>
      </button>
    </nav>

    <div class="issue-board-toolbar">
      <label class="issue-board-search">
        <input
          v-model="boardSearch"
          data-issues-board-search
          type="search"
          placeholder="Filter issues: is:open project:kernel kind::bug"
          autocomplete="off"
          aria-label="Filter issues board"
          @keydown.esc="onBoardSearchEscape"
        />
      </label>
      <button
        v-if="boardSearch"
        type="button"
        class="issue-board-clear"
        aria-label="Clear issues board filter"
        @click="clearBoardSearch"
      >
        Clear
      </button>
      <span
        v-if="hasBoardFilter"
        class="issue-board-filter-summary"
        data-smoke="issues-board-filter-summary"
      >
        {{ boardFilterSummary }}
      </span>
    </div>

    <p v-if="loadState === 'loading'" class="issue-board-status">
      Loading board...
    </p>
    <p v-else-if="loadState === 'error'" class="issue-board-status error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="activeBoard && activeBoard.columns.length === 0" class="issue-board-status">
      No board columns yet.
    </p>
    <p
      v-else-if="hasBoardFilter && visibleBoard && visibleBoard.total === 0"
      class="issue-board-status"
    >
      No issues match the current board filter.
    </p>

    <div
      v-else-if="visibleBoard"
      class="issue-board-columns"
      :data-board="activeBoardId"
    >
      <section
        v-for="column in visibleBoard.columns"
        :key="column.key"
        class="issue-board-column"
      >
        <header class="issue-board-column-head">
          <h3>{{ column.label }}</h3>
          <span>{{ column.count }}</span>
        </header>

        <ol v-if="column.cards.length > 0" class="issue-board-cards">
          <li
            v-for="card in column.cards"
            :key="`${column.key}-${card.issue.id}`"
            :class="['issue-board-card', { focused: focusedIssueId === card.issue.id }]"
            :aria-label="`Issue #${card.issue.number}: ${card.issue.title}`"
            @mouseenter="focusedIssueId = card.issue.id"
          >
            <a class="issue-board-card-link" :href="issueCardHref(card.issue)">
              <header class="issue-board-card-head">
                <span class="issue-number">#{{ card.issue.number }}</span>
                <span :class="['issue-state', stateTone(card.issue.state).className]">
                  {{ stateTone(card.issue.state).label }}
                </span>
              </header>
              <strong class="issue-board-card-title">{{ card.issue.title }}</strong>
              <p v-if="card.issue.bodyMarkdown" class="issue-board-card-copy">
                {{ bodyExcerpt(card.issue.bodyMarkdown) }}
              </p>
              <div class="issue-board-card-meta">
                <span
                  v-if="card.issue.authorRef"
                  class="issue-principal"
                  :data-author-kind="principalLabel(card.issue.authorRef).kind"
                  :title="card.issue.authorRef"
                >
                  <span>{{ principalLabel(card.issue.authorRef).glyph }}</span>
                  {{ principalLabel(card.issue.authorRef).label }}
                </span>
                <span
                  v-for="ref in (card.issue.assignees ?? [])"
                  :key="`${card.issue.id}-assignee-${ref}`"
                  class="issue-principal assignee"
                  :data-author-kind="principalLabel(ref).kind"
                  :title="ref"
                >
                  <span>{{ principalLabel(ref).glyph }}</span>
                  {{ principalLabel(ref).label }}
                </span>
                <span v-if="card.issue.updatedAt || card.issue.createdAt" class="issue-age">
                  {{ relativeTime(card.issue.updatedAt ?? card.issue.createdAt) }}
                </span>
              </div>
              <div
                v-if="cardBadges(card).length > 0 || (card.issue.labels ?? []).length > 0"
                class="issue-board-card-tags"
              >
                <span
                  v-for="badge in cardBadges(card)"
                  :key="`${card.issue.id}-${badge}`"
                  class="issue-board-badge"
                >
                  {{ badge }}
                </span>
                <LabelPill
                  v-for="label in (card.issue.labels ?? [])"
                  :key="`${card.issue.id}-${label}`"
                  :name="label"
                  :catalog="labelCatalog"
                />
              </div>
            </a>
          </li>
        </ol>
        <p v-else class="issue-board-empty">No issues</p>
      </section>
    </div>

    <footer class="issue-board-foot">
      <span><kbd>h</kbd>/<kbd>l</kbd> board · <kbd>j</kbd>/<kbd>k</kbd> card · <kbd>enter</kbd> open</span>
    </footer>
  </section>
</template>

<style scoped>
.issue-board {
  min-width: 0;
  display: grid;
  gap: 14px;
  color: var(--fg, rgba(255,255,255,0.94));
  font-family: var(--font-sans, system-ui);
}

.issue-board-head,
.issue-board-column-head,
.issue-board-card-head,
.issue-board-card-meta,
.issue-board-card-tags,
.issue-board-foot {
  min-width: 0;
  display: flex;
  align-items: center;
}

.issue-board-head {
  justify-content: space-between;
  gap: 12px;
}

.issue-board-title {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.issue-board-title h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: 0;
}

.issue-board-subtitle,
.issue-board-status,
.issue-board-empty,
.issue-board-foot {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-size: 12px;
}

.issue-board-new {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  border: 0.5px solid var(--line-2, rgba(255,255,255,0.12));
  border-radius: var(--r-sm, 6px);
  padding: 0 11px;
  color: var(--fg, rgba(255,255,255,0.94));
  background: var(--surface, rgba(255,255,255,0.04));
  font-size: 13px;
  text-decoration: none;
}

.issue-board-tabs {
  min-width: 0;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.issue-board-toolbar {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  padding: 10px;
  background: var(--surface, rgba(255,255,255,0.03));
}

.issue-board-search {
  flex: 1 1 280px;
  min-width: 0;
}

.issue-board-search input {
  width: 100%;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  background: var(--bg, #0a0b0e);
  color: var(--fg, rgba(255,255,255,0.94));
  font: inherit;
  font-size: 13px;
  padding: 8px 10px;
}

.issue-board-search input:focus {
  border-color: var(--accent, #3b82f6);
  outline: 2px solid color-mix(in srgb, var(--accent, #3b82f6) 30%, transparent);
  outline-offset: 1px;
}

.issue-board-clear {
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  background: var(--surface-2, rgba(255,255,255,0.045));
  color: var(--fg, rgba(255,255,255,0.94));
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  padding: 8px 10px;
}

.issue-board-clear:hover {
  border-color: var(--fg-3, rgba(255,255,255,0.52));
}

.issue-board-filter-summary {
  min-width: 0;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.issue-board-tab {
  flex: 0 0 auto;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  padding: 0 10px;
  color: var(--fg-2, rgba(255,255,255,0.76));
  background: var(--surface, rgba(255,255,255,0.03));
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
}

.issue-board-tab.active {
  border-color: var(--accent, #3b82f6);
  color: var(--fg, rgba(255,255,255,0.94));
  background: var(--accent-soft, rgba(59,130,246,0.14));
}

.issue-board-tab strong {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 600;
}

.issue-board-status {
  margin: 0;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  padding: 12px;
  background: var(--surface, rgba(255,255,255,0.03));
}

.issue-board-status.error {
  color: var(--err, #f87171);
  border-color: var(--err-soft, rgba(248,113,113,0.2));
  background: var(--err-soft, rgba(248,113,113,0.12));
}

.issue-board-columns {
  min-width: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(260px, 1fr);
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.issue-board-column {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 8px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  background: var(--surface, rgba(255,255,255,0.025));
}

.issue-board-column-head {
  justify-content: space-between;
  gap: 8px;
  padding: 10px 10px 0;
}

.issue-board-column-head h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-board-column-head span {
  flex: 0 0 auto;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.issue-board-cards {
  min-width: 0;
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0 8px 8px;
  list-style: none;
}

.issue-board-card {
  min-width: 0;
}

.issue-board-card-link {
  min-width: 0;
  display: grid;
  gap: 8px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  padding: 10px;
  color: inherit;
  background: var(--surface-2, rgba(255,255,255,0.045));
  text-decoration: none;
}

.issue-board-card.focused .issue-board-card-link,
.issue-board-card-link:focus-visible {
  outline: 1.5px solid var(--accent, #3b82f6);
  outline-offset: 2px;
}

.issue-board-card-head {
  justify-content: space-between;
  gap: 8px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.issue-number,
.issue-age {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.issue-state {
  flex: 0 0 auto;
  border: 0.5px solid currentColor;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10px;
}

.issue-state-open {
  color: var(--ok, oklch(75% 0.15 150));
}

.issue-state-closed {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.issue-board-card-title {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.35;
}

.issue-board-card-copy {
  margin: 0;
  display: -webkit-box;
  overflow: hidden;
  color: var(--fg-2, rgba(255,255,255,0.76));
  font-size: 12px;
  line-height: 1.4;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.issue-board-card-meta,
.issue-board-card-tags {
  flex-wrap: wrap;
  gap: 6px;
}

.issue-principal,
.issue-board-badge {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: 999px;
  padding: 2px 7px;
  color: var(--fg-2, rgba(255,255,255,0.76));
  background: var(--surface, rgba(255,255,255,0.03));
  font-size: 11px;
  line-height: 1.2;
}

.issue-principal.assignee {
  border-color: var(--accent-soft, rgba(59,130,246,0.18));
  color: var(--accent, #60a5fa);
}

.issue-board-empty {
  margin: 0;
  padding: 0 10px 12px;
}

.issue-board-foot {
  justify-content: flex-end;
  gap: 6px;
}

.issue-board-foot kbd {
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--fg-2, rgba(255,255,255,0.74));
  background: var(--surface, rgba(255,255,255,0.04));
  font-family: var(--font-mono, monospace);
  font-size: 10px;
}

@media (max-width: 720px) {
  .issue-board-head {
    align-items: stretch;
    flex-direction: column;
  }

  .issue-board-new {
    align-self: flex-start;
  }

  .issue-board-columns {
    grid-auto-columns: minmax(240px, 88vw);
  }

  .issue-board-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .issue-board-search,
  .issue-board-clear {
    flex: 0 1 auto;
    width: 100%;
  }
}
</style>
