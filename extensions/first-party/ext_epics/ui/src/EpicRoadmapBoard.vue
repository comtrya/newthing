<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  bodyExcerpt,
  classifyPrincipal as principalLabel,
  LabelPill,
  useShortcuts,
  type LabelCatalog,
} from "@comtrya/sdk-vue";
import {
  loadEpicBoard,
  type EpicBoard,
  type EpicBoardCard,
  type EpicBoardId,
} from "./api";
import {
  defaultWorkspaceId,
  epicHref,
  newEpicHref as buildNewEpicHref,
  stateTone,
  type ExtensionRouteParams,
} from "./types";

const props = withDefaults(defineProps<{
  workspaceId?: string;
  routeParams?: ExtensionRouteParams;
  labelCatalog?: LabelCatalog | null;
}>(), {
  workspaceId: defaultWorkspaceId(),
  labelCatalog: null,
});

const boardTabs: Array<{ id: EpicBoardId; label: string; hint: string }> = [
  { id: "roadmap", label: "Roadmap", hint: "state lanes" },
  { id: "project", label: "Projects", hint: "CUE project lanes" },
  { id: "owner", label: "Owners", hint: "owner lanes" },
  { id: "priority", label: "Priority", hint: "priority labels" },
  { id: "milestone", label: "Milestones", hint: "release labels" },
  { id: "label", label: "Labels", hint: "label lanes" },
  { id: "target", label: "Targets", hint: "target date health" },
];

const loadState = ref<"idle" | "loading" | "ready" | "error">("idle");
const error = ref<string | null>(null);
const activeBoardId = ref<EpicBoardId>("roadmap");
const boards = ref<Record<EpicBoardId, EpicBoard | null>>(emptyBoards());
const focusedEpicId = ref<string | null>(null);

const workspaceId = computed(() =>
  props.workspaceId ||
  props.routeParams?.params?.workspaceId ||
  defaultWorkspaceId(),
);
const activeBoard = computed(() => boards.value[activeBoardId.value]);
const totalEpics = computed(() => activeBoard.value?.total ?? 0);
const newEpicHref = computed(() => buildNewEpicHref(workspaceId.value));
const orderedEpicIds = computed(() => {
  const ids: string[] = [];
  for (const column of activeBoard.value?.columns ?? []) {
    for (const card of column.cards) {
      if (!ids.includes(card.epic.id)) ids.push(card.epic.id);
    }
  }
  return ids;
});
const focusedCard = computed(() => {
  const id = focusedEpicId.value;
  if (!id) return null;
  for (const column of activeBoard.value?.columns ?? []) {
    const card = column.cards.find((entry) => entry.epic.id === id);
    if (card) return card;
  }
  return null;
});

onMounted(() => {
  void loadBoards();
});

watch(workspaceId, () => void loadBoards());

watch(activeBoardId, () => {
  focusedEpicId.value = orderedEpicIds.value[0] ?? null;
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
    const epic = focusedCard.value?.epic;
    if (!epic) return;
    event.preventDefault();
    window.location.href = epicHref(epic);
  },
});

function emptyBoards(): Record<EpicBoardId, EpicBoard | null> {
  return {
    roadmap: null,
    project: null,
    owner: null,
    priority: null,
    milestone: null,
    label: null,
    target: null,
  };
}

async function loadBoards(): Promise<void> {
  loadState.value = "loading";
  error.value = null;
  try {
    const input = { workspaceId: workspaceId.value, limit: 128 };
    const [
      roadmap,
      project,
      owner,
      priority,
      milestone,
      label,
      target,
    ] = await Promise.all([
      loadEpicBoard("roadmap", input),
      loadEpicBoard("project", input),
      loadEpicBoard("owner", input),
      loadEpicBoard("priority", input),
      loadEpicBoard("milestone", input),
      loadEpicBoard("label", input),
      loadEpicBoard("target", input),
    ]);
    boards.value = { roadmap, project, owner, priority, milestone, label, target };
    loadState.value = "ready";
    focusedEpicId.value = orderedEpicIds.value[0] ?? null;
  } catch (caught) {
    boards.value = emptyBoards();
    focusedEpicId.value = null;
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function boardTabTotal(id: EpicBoardId): number {
  return boards.value[id]?.total ?? 0;
}

function setActiveBoard(id: EpicBoardId): void {
  activeBoardId.value = id;
}

function moveBoard(delta: number): void {
  const index = boardTabs.findIndex((tab) => tab.id === activeBoardId.value);
  const next = Math.max(0, Math.min(boardTabs.length - 1, index + delta));
  activeBoardId.value = boardTabs[next]?.id ?? activeBoardId.value;
}

function moveFocus(delta: number): void {
  const ids = orderedEpicIds.value;
  if (ids.length === 0) return;
  const index = focusedEpicId.value ? ids.indexOf(focusedEpicId.value) : -1;
  const next = Math.max(0, Math.min(ids.length - 1, index + delta));
  focusedEpicId.value = ids[next] ?? null;
}

function cardBadges(card: EpicBoardCard): string[] {
  const badges: string[] = [];
  if (card.epic.projectName) badges.push(`project:${card.epic.projectName}`);
  if (card.ownerRef ?? card.epic.ownerRef) badges.push(shortPrincipal(card.ownerRef ?? card.epic.ownerRef ?? ""));
  if (card.priorityLabel) badges.push(card.priorityLabel);
  if (card.milestoneLabel) badges.push(card.milestoneLabel);
  if (card.epic.targetDate) badges.push(`target:${card.epic.targetDate}`);
  return badges;
}

function shortPrincipal(ref: string): string {
  const label = principalLabel(ref);
  return `${label.glyph} ${label.label}`;
}

function progressPercent(card: EpicBoardCard): number {
  const value = card.progress?.percentComplete ?? 0;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function progressLabel(card: EpicBoardCard): string {
  const progress = card.progress;
  if (!progress) return "0% complete";
  const closed = progress.issuesClosed ?? 0;
  const open = progress.issuesOpen ?? 0;
  const total = closed + open;
  return total > 0
    ? `${closed}/${total} issues · ${progressPercent(card)}%`
    : `${progressPercent(card)}% complete`;
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
  <section class="epics-roadmap" data-smoke="epics-roadmap-board">
    <header class="epics-roadmap-head">
      <div class="epics-roadmap-title">
        <h2>Epics roadmap</h2>
        <span class="epics-roadmap-subtitle">
          <template v-if="loadState === 'loading'">loading roadmap...</template>
          <template v-else-if="loadState === 'error'">roadmap unavailable</template>
          <template v-else>
            {{ totalEpics }} epic<template v-if="totalEpics !== 1">s</template>
            on {{ boardTabs.find((tab) => tab.id === activeBoardId)?.label.toLowerCase() }}
          </template>
        </span>
      </div>
      <a :href="newEpicHref" class="epics-roadmap-new">+ new</a>
    </header>

    <nav class="epics-roadmap-tabs" aria-label="Epic roadmap views">
      <button
        v-for="tab in boardTabs"
        :key="tab.id"
        type="button"
        :class="['epics-roadmap-tab', { active: activeBoardId === tab.id }]"
        :aria-pressed="activeBoardId === tab.id"
        :title="tab.hint"
        @click="setActiveBoard(tab.id)"
      >
        <span>{{ tab.label }}</span>
        <strong>{{ boardTabTotal(tab.id) }}</strong>
      </button>
    </nav>

    <p v-if="loadState === 'loading'" class="epics-roadmap-status">
      Loading roadmap...
    </p>
    <p v-else-if="loadState === 'error'" class="epics-roadmap-status error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="activeBoard && activeBoard.columns.length === 0" class="epics-roadmap-status">
      No roadmap columns yet.
    </p>

    <div
      v-else-if="activeBoard"
      class="epics-roadmap-columns"
      :data-board="activeBoardId"
    >
      <section
        v-for="column in activeBoard.columns"
        :key="column.key"
        class="epics-roadmap-column"
      >
        <header class="epics-roadmap-column-head">
          <h3>{{ column.label }}</h3>
          <span>{{ column.count }}</span>
        </header>

        <ol v-if="column.cards.length > 0" class="epics-roadmap-cards">
          <li
            v-for="card in column.cards"
            :key="`${column.key}-${card.epic.id}`"
            :class="['epics-roadmap-card', { focused: focusedEpicId === card.epic.id }]"
            @mouseenter="focusedEpicId = card.epic.id"
          >
            <a class="epics-roadmap-card-link" :href="epicHref(card.epic)">
              <header class="epics-roadmap-card-head">
                <span class="epic-number">
                  #{{ card.epic.number ?? card.epic.id.slice(-4) }}
                </span>
                <span :class="['epic-state', stateTone(card.epic.state).className]">
                  {{ stateTone(card.epic.state).label }}
                </span>
              </header>
              <strong class="epics-roadmap-card-title">{{ card.epic.title }}</strong>
              <p v-if="card.epic.bodyMarkdown" class="epics-roadmap-card-copy">
                {{ bodyExcerpt(card.epic.bodyMarkdown) }}
              </p>
              <div class="epics-roadmap-progress">
                <div
                  class="epics-roadmap-progress-bar"
                  :aria-valuenow="progressPercent(card)"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span :style="{ width: progressPercent(card) + '%' }" />
                </div>
                <span>{{ progressLabel(card) }}</span>
              </div>
              <div class="epics-roadmap-card-meta">
                <span v-if="card.epic.createdAt" class="epic-age">
                  opened {{ relativeTime(card.epic.createdAt) }}
                </span>
                <span v-if="activeBoard.today && activeBoardId === 'target'" class="epic-age">
                  today {{ activeBoard.today }}
                </span>
              </div>
              <div
                v-if="cardBadges(card).length > 0 || (card.epic.labels ?? []).length > 0"
                class="epics-roadmap-card-tags"
              >
                <span
                  v-for="badge in cardBadges(card)"
                  :key="`${card.epic.id}-${badge}`"
                  class="epics-roadmap-badge"
                >
                  {{ badge }}
                </span>
                <LabelPill
                  v-for="label in (card.epic.labels ?? [])"
                  :key="`${card.epic.id}-${label}`"
                  :name="label"
                  :catalog="labelCatalog"
                />
              </div>
            </a>
          </li>
        </ol>
        <p v-else class="epics-roadmap-empty">No epics</p>
      </section>
    </div>

    <footer class="epics-roadmap-foot">
      <span><kbd>h</kbd>/<kbd>l</kbd> board · <kbd>j</kbd>/<kbd>k</kbd> card · <kbd>enter</kbd> open</span>
    </footer>
  </section>
</template>

<style scoped>
.epics-roadmap {
  min-width: 0;
  display: grid;
  gap: 14px;
  color: var(--fg, rgba(255,255,255,0.94));
  font-family: var(--font-sans, system-ui);
}

.epics-roadmap-head,
.epics-roadmap-column-head,
.epics-roadmap-card-head,
.epics-roadmap-card-meta,
.epics-roadmap-card-tags,
.epics-roadmap-foot {
  min-width: 0;
  display: flex;
  align-items: center;
}

.epics-roadmap-head {
  justify-content: space-between;
  gap: 12px;
}

.epics-roadmap-title {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.epics-roadmap-title h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: 0;
}

.epics-roadmap-subtitle,
.epics-roadmap-status,
.epics-roadmap-empty,
.epics-roadmap-foot {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-size: 12px;
}

.epics-roadmap-new {
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

.epics-roadmap-tabs {
  min-width: 0;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.epics-roadmap-tab {
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

.epics-roadmap-tab.active {
  border-color: var(--accent, #3b82f6);
  color: var(--fg, rgba(255,255,255,0.94));
  background: var(--accent-soft, rgba(59,130,246,0.14));
}

.epics-roadmap-tab strong {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 600;
}

.epics-roadmap-status {
  margin: 0;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  padding: 12px;
  background: var(--surface, rgba(255,255,255,0.03));
}

.epics-roadmap-status.error {
  color: var(--err, #f87171);
  border-color: var(--err-soft, rgba(248,113,113,0.2));
  background: var(--err-soft, rgba(248,113,113,0.12));
}

.epics-roadmap-columns {
  min-width: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(270px, 1fr);
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.epics-roadmap-column {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 8px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  background: var(--surface, rgba(255,255,255,0.025));
}

.epics-roadmap-column-head {
  justify-content: space-between;
  gap: 8px;
  padding: 10px 10px 0;
}

.epics-roadmap-column-head h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.epics-roadmap-column-head span {
  flex: 0 0 auto;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.epics-roadmap-cards {
  min-width: 0;
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0 8px 8px;
  list-style: none;
}

.epics-roadmap-card {
  min-width: 0;
}

.epics-roadmap-card-link {
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

.epics-roadmap-card.focused .epics-roadmap-card-link,
.epics-roadmap-card-link:focus-visible {
  outline: 1.5px solid var(--accent, #3b82f6);
  outline-offset: 2px;
}

.epics-roadmap-card-head {
  justify-content: space-between;
  gap: 8px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.epic-number,
.epic-age {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.epic-state {
  flex: 0 0 auto;
  border: 0.5px solid currentColor;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10px;
}

.epic-state-good {
  color: var(--ok, oklch(75% 0.15 150));
}

.epic-state-warn {
  color: var(--warn, #f59e0b);
}

.epic-state-muted {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.epics-roadmap-card-title {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.35;
}

.epics-roadmap-card-copy {
  margin: 0;
  display: -webkit-box;
  overflow: hidden;
  color: var(--fg-2, rgba(255,255,255,0.76));
  font-size: 12px;
  line-height: 1.4;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.epics-roadmap-progress {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.epics-roadmap-progress-bar {
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface, rgba(255,255,255,0.07));
}

.epics-roadmap-progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent, #3b82f6);
}

.epics-roadmap-progress > span {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.epics-roadmap-card-meta,
.epics-roadmap-card-tags {
  flex-wrap: wrap;
  gap: 6px;
}

.epics-roadmap-badge {
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

.epics-roadmap-empty {
  margin: 0;
  padding: 0 10px 12px;
}

.epics-roadmap-foot {
  justify-content: flex-end;
  gap: 6px;
}

.epics-roadmap-foot kbd {
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--fg-2, rgba(255,255,255,0.74));
  background: var(--surface, rgba(255,255,255,0.04));
  font-family: var(--font-mono, monospace);
  font-size: 10px;
}

@media (max-width: 720px) {
  .epics-roadmap-head {
    align-items: stretch;
    flex-direction: column;
  }

  .epics-roadmap-new {
    align-self: flex-start;
  }

  .epics-roadmap-columns {
    grid-auto-columns: minmax(250px, 88vw);
  }
}
</style>
