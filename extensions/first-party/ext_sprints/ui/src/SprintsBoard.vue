<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { boardForSprint, kanbanProjectBoard, planningBoard } from "./api";
import { filterKanbanSwimlanesByProject } from "./kanban-filter";
import type {
  KanbanCardState,
  LoadState,
  ProjectKanbanBoard,
  Sprint,
  SprintBoard,
  SprintBoardColumn,
  SprintIssueState,
  SprintPlanningBoard,
  SprintState,
} from "./types";

interface HostContext {
  workspace?: string;
  workspaceId?: string;
}

const props = defineProps<{
  host?: HostContext;
  workspace?: string;
  workspaceId?: string;
  projectName?: string;
}>();

const loadState = ref<LoadState>("idle");
const issueLoadState = ref<LoadState>("idle");
const kanbanLoadState = ref<LoadState>("idle");
const board = ref<SprintPlanningBoard | null>(null);
const sprintBoard = ref<SprintBoard | null>(null);
const kanbanBoard = ref<ProjectKanbanBoard | null>(null);
const selectedSprint = ref<Sprint | null>(null);
const error = ref<string | null>(null);
const issueError = ref<string | null>(null);
const kanbanError = ref<string | null>(null);
const effectiveWorkspace = computed(
  () =>
    props.workspaceId ??
    props.host?.workspaceId ??
    props.workspace ??
    props.host?.workspace ??
    "",
);
const effectiveProjectName = computed(() => props.projectName?.trim() ?? "");
const columns = computed(() => board.value?.columns ?? []);
const sprints = computed(() =>
  columns.value.flatMap((column) => column.cards.map((card) => card.sprint)),
);
const total = computed(() => board.value?.total ?? 0);
const activeCount = computed(
  () => sprints.value.filter((sprint) => sprint.state === "active").length,
);
const plannedCount = computed(
  () => sprints.value.filter((sprint) => sprint.state === "planned").length,
);
const completedCount = computed(
  () => sprints.value.filter((sprint) => sprint.state === "completed").length,
);
const issueColumns = computed<SprintBoardColumn[]>(() => sprintBoard.value?.columns ?? []);
const issueTotal = computed(() => sprintBoard.value?.total ?? 0);
const kanbanSwimlanes = computed(() =>
  filterKanbanSwimlanesByProject(
    kanbanBoard.value?.swimlanes ?? [],
    effectiveProjectName.value,
  ),
);
const kanbanTotal = computed(() =>
  kanbanSwimlanes.value.reduce((sum, lane) => sum + lane.total, 0),
);
const openIssueCount = computed(() =>
  issueColumns.value
    .flatMap((column) => column.issues)
    .filter((issue) => issue.state === "open" || issue.state === "reopened").length,
);
const kanbanOpenCount = computed(() =>
  kanbanSwimlanes.value
    .flatMap((lane) => lane.columns)
    .flatMap((column) => column.cards)
    .filter((card) => card.state === "open" || card.state === "reopened").length,
);
const headline = computed(() => {
  if (loadState.value === "loading") return "Loading";
  if (kanbanOpenCount.value > 0) return `${kanbanOpenCount.value} open cards`;
  if (activeCount.value > 0) return `${activeCount.value} active`;
  if (selectedSprint.value) return `Sprint #${selectedSprint.value.number}`;
  return "No sprints";
});
const kanbanTitle = computed(() =>
  effectiveProjectName.value
    ? `${effectiveProjectName.value} swimlane`
    : "Project swimlanes",
);
const kanbanEmptyText = computed(() =>
  effectiveProjectName.value
    ? `No Kanban cards in ${effectiveProjectName.value}.`
    : "No Kanban cards.",
);

let loadRun = 0;

onMounted(() => {
  void load();
});

watch(effectiveWorkspace, () => void load());

async function load(): Promise<void> {
  const run = ++loadRun;
  board.value = null;
  sprintBoard.value = null;
  kanbanBoard.value = null;
  selectedSprint.value = null;
  error.value = null;
  issueError.value = null;
  kanbanError.value = null;

  if (!effectiveWorkspace.value) {
    loadState.value = "empty";
    issueLoadState.value = "empty";
    kanbanLoadState.value = "empty";
    return;
  }

  loadState.value = "loading";
  issueLoadState.value = "idle";
  kanbanLoadState.value = "idle";
  try {
    const result = await planningBoard(effectiveWorkspace.value);
    if (run !== loadRun) return;

    board.value = result;
    selectedSprint.value = selectSprint(result);
    loadState.value = result.total === 0 ? "empty" : "ready";

    if (!selectedSprint.value) {
      issueLoadState.value = "empty";
      kanbanLoadState.value = "empty";
      return;
    }

    issueLoadState.value = "loading";
    kanbanLoadState.value = "idle";
    try {
      const issues = await boardForSprint(selectedSprint.value.id);
      if (run !== loadRun) return;
      sprintBoard.value = issues;
      issueLoadState.value = issues.total === 0 ? "empty" : "ready";

      const issueRefs = Array.from(
        new Set(
          issues.columns
            .flatMap((column) => column.issues.map((issue) => issue.issueRef))
            .filter((ref): ref is string => ref.length > 0),
        ),
      );
      if (issueRefs.length === 0) {
        kanbanLoadState.value = "empty";
        return;
      }

      kanbanLoadState.value = "loading";
      try {
        const nextKanban = await kanbanProjectBoard(effectiveWorkspace.value, issueRefs);
        if (run !== loadRun) return;
        kanbanBoard.value = nextKanban;
        kanbanLoadState.value = nextKanban.total === 0 ? "empty" : "ready";
      } catch (err) {
        if (run !== loadRun) return;
        kanbanError.value = err instanceof Error ? err.message : String(err);
        kanbanLoadState.value = "error";
      }
    } catch (err) {
      if (run !== loadRun) return;
      issueError.value = err instanceof Error ? err.message : String(err);
      issueLoadState.value = "error";
      kanbanLoadState.value = "idle";
    }
  } catch (err) {
    if (run !== loadRun) return;
    error.value = err instanceof Error ? err.message : String(err);
    loadState.value = "error";
    issueLoadState.value = "idle";
    kanbanLoadState.value = "idle";
  }
}

function selectSprint(value: SprintPlanningBoard): Sprint | null {
  const all = value.columns.flatMap((column) =>
    column.cards.map((card) => card.sprint),
  );
  const active = all.find((sprint) => sprint.state === "active");
  if (active) return active;
  const planned = all.find((sprint) => sprint.state === "planned");
  if (planned) return planned;
  return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function formatDate(value?: string | null): string {
  return value ? value.slice(0, 10) : "unscheduled";
}

function stateClass(state: SprintState | SprintIssueState | KanbanCardState): string {
  return `state-${state}`;
}

function labelFor(value: SprintState | SprintIssueState | KanbanCardState): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function issueNumber(issue: { number?: number | null }): string {
  return issue.number == null ? "missing" : `#${issue.number}`;
}
</script>

<template>
  <section class="sprints-board extension-payload" data-smoke="sprints-board">
    <header class="sprints-board-head">
      <div>
        <p class="sprints-kicker">delivery board</p>
        <h3>Kanban</h3>
      </div>
      <span class="sprints-total">{{ headline }}</span>
    </header>

    <p v-if="loadState === 'loading'" class="sprints-status">Loading...</p>
    <p v-else-if="loadState === 'error'" class="sprints-status sprints-error" role="alert">{{ error }}</p>
    <p v-else-if="loadState === 'empty'" class="sprints-status">No sprints.</p>

    <div v-else-if="board" class="sprints-content">
      <dl class="sprints-summary" aria-label="Sprint summary">
        <div>
          <dt>Total</dt>
          <dd>{{ total }}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{{ activeCount }}</dd>
        </div>
        <div>
          <dt>Planned</dt>
          <dd>{{ plannedCount }}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{{ completedCount }}</dd>
        </div>
        <div>
          <dt>Open issues</dt>
          <dd>{{ openIssueCount }}</dd>
        </div>
        <div>
          <dt>Kanban cards</dt>
          <dd>{{ kanbanTotal }}</dd>
        </div>
      </dl>

      <section class="sprints-section">
        <header class="sprints-section-head">
          <div>
            <p class="sprints-kicker">plan</p>
            <h4>Lifecycle board</h4>
          </div>
          <span>{{ total }} total</span>
        </header>

        <div class="sprints-columns" aria-label="Sprint planning board">
          <section
            v-for="column in board.columns"
            :key="column.key"
            class="sprints-column"
            :data-column="column.key"
          >
            <header class="sprints-column-head">
              <h5>{{ column.label }}</h5>
              <span>{{ column.count }}</span>
            </header>

            <ol v-if="column.cards.length > 0" class="sprints-cards">
              <li
                v-for="card in column.cards"
                :key="card.sprint.id"
                :class="['sprints-card', stateClass(card.sprint.state)]"
              >
                <header class="sprints-card-head">
                  <span class="sprints-number">#{{ card.sprint.number }}</span>
                  <strong>{{ card.sprint.title }}</strong>
                </header>
                <p v-if="card.sprint.goal" class="sprints-goal">{{ card.sprint.goal }}</p>
                <dl class="sprints-card-meta">
                  <div>
                    <dt>start</dt>
                    <dd>{{ formatDate(card.sprint.startDate) }}</dd>
                  </div>
                  <div>
                    <dt>end</dt>
                    <dd>{{ formatDate(card.sprint.endDate) }}</dd>
                  </div>
                </dl>
              </li>
            </ol>

            <p v-else class="sprints-empty-column">No {{ column.label.toLowerCase() }} sprints.</p>
          </section>
        </div>
      </section>

      <section v-if="selectedSprint" class="sprints-section" data-smoke="sprints-selected-board">
        <header class="sprints-section-head selected">
          <div>
            <p class="sprints-kicker">selected sprint</p>
            <h4><span>#{{ selectedSprint.number }}</span> {{ selectedSprint.title }}</h4>
          </div>
          <span :class="['sprints-state', stateClass(selectedSprint.state)]">
            {{ labelFor(selectedSprint.state) }}
          </span>
        </header>

        <p v-if="selectedSprint.goal" class="sprints-selected-goal">{{ selectedSprint.goal }}</p>
        <dl class="sprints-selected-meta">
          <div>
            <dt>start</dt>
            <dd>{{ formatDate(selectedSprint.startDate) }}</dd>
          </div>
          <div>
            <dt>end</dt>
            <dd>{{ formatDate(selectedSprint.endDate) }}</dd>
          </div>
          <div>
            <dt>issues</dt>
            <dd>{{ issueTotal }}</dd>
          </div>
        </dl>

        <p v-if="issueLoadState === 'loading'" class="sprints-status">Loading issues...</p>
        <p v-else-if="issueLoadState === 'error'" class="sprints-status sprints-error" role="alert">
          {{ issueError }}
        </p>
        <p v-else-if="issueLoadState === 'empty'" class="sprints-status">No issues assigned.</p>

        <div v-else class="sprints-issue-columns" aria-label="Selected sprint issue board">
          <section
            v-for="column in issueColumns"
            :key="column.key"
            class="sprints-issue-column"
            :data-column="column.key"
            :data-smoke="`sprints-issue-column-${column.key}`"
          >
            <header class="sprints-column-head issue">
              <h5>{{ column.label }}</h5>
              <span>{{ column.count }}</span>
            </header>

            <ol v-if="column.issues.length > 0" class="sprints-issue-cards">
              <li
                v-for="issue in column.issues"
                :key="issue.issueRef"
                :class="['sprints-issue-card', stateClass(issue.state)]"
              >
                <header class="sprints-issue-card-head">
                  <span class="sprints-number">{{ issueNumber(issue) }}</span>
                  <strong>{{ issue.title }}</strong>
                </header>
                <footer class="sprints-issue-meta">
                  <span>{{ labelFor(issue.state) }}</span>
                  <code>{{ issue.issueRef }}</code>
                </footer>
              </li>
            </ol>

            <p v-else class="sprints-empty-column">No {{ column.label.toLowerCase() }} issues.</p>
          </section>
        </div>
      </section>

      <section v-if="selectedSprint" class="sprints-section" data-smoke="sprints-kanban-board">
        <header class="sprints-section-head selected">
          <div>
            <p class="sprints-kicker">kanban</p>
            <h4><span>#{{ selectedSprint.number }}</span> {{ kanbanTitle }}</h4>
          </div>
          <span>{{ kanbanTotal }} cards</span>
        </header>

        <p
          v-if="kanbanLoadState === 'idle' || kanbanLoadState === 'loading'"
          class="sprints-status"
        >
          Loading Kanban...
        </p>
        <p v-else-if="kanbanLoadState === 'error'" class="sprints-status sprints-error" role="alert">
          {{ kanbanError }}
        </p>
        <p v-else-if="kanbanLoadState === 'empty' || kanbanTotal === 0" class="sprints-status">
          {{ kanbanEmptyText }}
        </p>

        <div
          v-else-if="kanbanBoard"
          class="sprints-swimlanes"
          aria-label="Selected sprint Kanban swimlanes"
        >
          <section
            v-for="lane in kanbanSwimlanes"
            :key="lane.key"
            class="sprints-swimlane"
            :data-swimlane="lane.key"
          >
            <header class="sprints-column-head">
              <h5>{{ lane.label }}</h5>
              <span>{{ lane.total }}</span>
            </header>

            <div class="sprints-kanban-columns">
              <section
                v-for="column in lane.columns"
                :key="column.key"
                class="sprints-kanban-column"
                :data-column="column.key"
              >
                <header class="sprints-column-head issue">
                  <h5>{{ column.label }}</h5>
                  <span>{{ column.count }}</span>
                </header>

                <ol v-if="column.cards.length > 0" class="sprints-kanban-cards">
                  <li
                    v-for="card in column.cards"
                    :key="card.issueRef"
                    :class="['sprints-kanban-card', stateClass(card.state)]"
                  >
                    <header class="sprints-kanban-card-head">
                      <span class="sprints-number">{{ issueNumber(card) }}</span>
                      <strong>{{ card.title }}</strong>
                    </header>
                    <footer class="sprints-kanban-card-meta">
                      <span>{{ labelFor(card.state) }}</span>
                      <span v-if="card.projectName" class="sprints-project">{{ card.projectName }}</span>
                      <code>{{ card.issueRef }}</code>
                    </footer>
                  </li>
                </ol>

                <p v-else class="sprints-empty-column">No {{ column.label.toLowerCase() }} cards.</p>
              </section>
            </div>
          </section>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.extension-payload {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.sprints-board-head,
.sprints-section-head,
.sprints-column-head,
.sprints-card-head,
.sprints-issue-card-head,
.sprints-issue-meta,
.sprints-kanban-card-head,
.sprints-kanban-card-meta {
  display: flex;
  gap: 10px;
}

.sprints-board-head,
.sprints-section-head,
.sprints-column-head {
  align-items: center;
  justify-content: space-between;
}

.sprints-board-head {
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  padding-bottom: 10px;
}

.sprints-content,
.sprints-section,
.sprints-column,
.sprints-issue-column,
.sprints-swimlane,
.sprints-kanban-column,
.sprints-card,
.sprints-issue-card,
.sprints-kanban-card {
  display: grid;
}

.sprints-content {
  gap: 14px;
}

.sprints-section {
  gap: 12px;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  background: var(--surface, rgba(255, 255, 255, 0.03));
}

.sprints-section-head {
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  padding: 12px;
}

.sprints-section-head.selected {
  align-items: start;
}

.sprints-kicker,
.sprints-total,
.sprints-status,
.sprints-number,
.sprints-card-meta,
.sprints-selected-meta,
.sprints-summary,
.sprints-issue-meta,
.sprints-state,
.sprints-section-head > span {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}

.sprints-kicker {
  margin: 0 0 4px;
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.72rem;
  text-transform: uppercase;
}

.sprints-board h3,
.sprints-section h4,
.sprints-column h5,
.sprints-issue-column h5,
.sprints-kanban-column h5 {
  margin: 0;
}

.sprints-board h3 {
  font-size: 1.05rem;
}

.sprints-section h4 {
  font-size: 0.95rem;
}

.sprints-section h4 span {
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.82rem;
  font-weight: 500;
}

.sprints-column h5,
.sprints-issue-column h5,
.sprints-kanban-column h5 {
  font-size: 0.84rem;
}

.sprints-total,
.sprints-status,
.sprints-section-head > span {
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.78rem;
}

.sprints-error {
  color: var(--accent-err, #c9341c);
}

.sprints-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(96px, 1fr));
  gap: 8px;
  margin: 0;
}

.sprints-summary div {
  display: grid;
  gap: 4px;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  background: var(--bg, #0a0b0e);
  padding: 10px;
}

.sprints-summary dt,
.sprints-summary dd,
.sprints-selected-meta dt,
.sprints-selected-meta dd,
.sprints-card-meta dt,
.sprints-card-meta dd {
  margin: 0;
}

.sprints-summary dt {
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.68rem;
  text-transform: uppercase;
}

.sprints-summary dd {
  color: var(--fg, #f3f4f6);
  font-size: 1rem;
  font-weight: 700;
}

.sprints-columns,
.sprints-issue-columns,
.sprints-swimlanes {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.sprints-columns {
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  overflow-x: auto;
}

.sprints-issue-columns {
  grid-template-columns: repeat(2, minmax(220px, 1fr));
}

.sprints-column,
.sprints-issue-column,
.sprints-swimlane,
.sprints-kanban-column {
  min-width: 0;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  background: var(--bg, #0a0b0e);
}

.sprints-column {
  min-width: 180px;
}

.sprints-column-head {
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  padding: 10px 12px;
}

.sprints-column-head.issue {
  background: var(--surface-2, rgba(255, 255, 255, 0.04));
}

.sprints-column-head span,
.sprints-state {
  min-width: 1.6rem;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  border-radius: var(--r-sm, 6px);
  padding: 2px 7px;
  text-align: center;
  font-size: 0.72rem;
}

.sprints-kanban-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 10px;
  padding: 10px;
}

.sprints-cards,
.sprints-issue-cards,
.sprints-kanban-cards {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 10px;
}

.sprints-card,
.sprints-issue-card,
.sprints-kanban-card {
  gap: 8px;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  border-left: 3px solid var(--fg-4, rgba(255, 255, 255, 0.32));
  border-radius: var(--r-sm, 6px);
  background: var(--surface, rgba(255, 255, 255, 0.03));
  padding: 10px;
}

.sprints-card.state-active,
.sprints-state.state-active,
.sprints-issue-card.state-open,
.sprints-issue-card.state-reopened,
.sprints-kanban-card.state-open,
.sprints-kanban-card.state-reopened {
  border-left-color: var(--accent-blue, #1d55a6);
}

.sprints-card.state-completed,
.sprints-state.state-completed,
.sprints-issue-card.state-closed,
.sprints-kanban-card.state-closed {
  border-left-color: var(--accent-good, #2f8f5b);
}

.sprints-card.state-canceled,
.sprints-state.state-canceled,
.sprints-issue-card.state-missing,
.sprints-kanban-card.state-missing {
  border-left-color: var(--accent-err, #c9341c);
}

.sprints-card-head,
.sprints-issue-card-head,
.sprints-kanban-card-head {
  align-items: baseline;
}

.sprints-card-head strong,
.sprints-issue-card-head strong,
.sprints-kanban-card-head strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
}

.sprints-number {
  flex: 0 0 auto;
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.72rem;
}

.sprints-goal,
.sprints-selected-goal {
  margin: 0;
  color: var(--fg-2, rgba(255, 255, 255, 0.74));
  font-size: 0.82rem;
  line-height: 1.45;
}

.sprints-selected-goal {
  padding: 0 12px;
}

.sprints-card-meta,
.sprints-selected-meta {
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.7rem;
}

.sprints-card-meta,
.sprints-selected-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
}

.sprints-selected-meta {
  padding: 0 12px 4px;
}

.sprints-card-meta div,
.sprints-selected-meta div {
  display: inline-flex;
  gap: 4px;
}

.sprints-issue-meta,
.sprints-kanban-card-meta {
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.7rem;
}

.sprints-issue-meta code,
.sprints-kanban-card-meta code {
  min-width: 0;
  overflow: hidden;
  color: var(--fg-4, rgba(255, 255, 255, 0.34));
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sprints-project {
  min-width: 0;
  color: var(--accent-blue, #1d55a6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sprints-empty-column {
  margin: 0;
  padding: 10px 12px;
  color: var(--fg-4, rgba(255, 255, 255, 0.34));
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.74rem;
}

@media (max-width: 920px) {
  .sprints-summary {
    grid-template-columns: repeat(3, minmax(96px, 1fr));
  }

  .sprints-columns,
  .sprints-issue-columns,
  .sprints-kanban-columns {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 560px) {
  .sprints-board-head,
  .sprints-section-head {
    align-items: start;
    flex-direction: column;
  }

  .sprints-summary,
  .sprints-columns,
  .sprints-issue-columns,
  .sprints-kanban-columns {
    grid-template-columns: minmax(0, 1fr);
  }

  .sprints-column {
    min-width: 0;
  }
}
</style>
