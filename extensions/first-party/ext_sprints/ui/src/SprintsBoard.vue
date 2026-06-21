<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { planningBoard } from "./api";
import type { LoadState, Sprint, SprintPlanningBoard } from "./types";

const props = withDefaults(defineProps<{
  workspace?: string;
  workspaceId?: string;
}>(), {
  workspace: "",
  workspaceId: "",
});

const loadState = ref<LoadState>("idle");
const board = ref<SprintPlanningBoard | null>(null);
const error = ref<string | null>(null);
const effectiveWorkspace = computed(() => props.workspaceId || props.workspace);
const total = computed(() => board.value?.total ?? 0);

onMounted(() => {
  void load();
});

watch(effectiveWorkspace, () => void load());

async function load(): Promise<void> {
  if (!effectiveWorkspace.value) {
    board.value = null;
    loadState.value = "empty";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    const result = await planningBoard(effectiveWorkspace.value);
    board.value = result;
    loadState.value = result.total === 0 ? "empty" : "ready";
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    loadState.value = "error";
  }
}

function formatDate(value?: string | null): string {
  return value ? value.slice(0, 10) : "unscheduled";
}

function stateClass(sprint: Sprint): string {
  return `state-${sprint.state}`;
}
</script>

<template>
  <section class="sprints-board extension-payload" data-smoke="sprints-board">
    <header class="sprints-board-head">
      <div>
        <p class="sprints-kicker">planning</p>
        <h3>Sprints</h3>
      </div>
      <span class="sprints-total">{{ total }} total</span>
    </header>

    <p v-if="loadState === 'loading'" class="sprints-status">Loading…</p>
    <p v-else-if="loadState === 'error'" class="sprints-status sprints-error" role="alert">{{ error }}</p>
    <p v-else-if="loadState === 'empty'" class="sprints-status">No sprints.</p>

    <div v-else-if="board" class="sprints-columns" aria-label="Sprint planning board">
      <section
        v-for="column in board.columns"
        :key="column.key"
        class="sprints-column"
        :data-column="column.key"
      >
        <header class="sprints-column-head">
          <h4>{{ column.label }}</h4>
          <span>{{ column.count }}</span>
        </header>

        <ol v-if="column.cards.length > 0" class="sprints-cards">
          <li
            v-for="card in column.cards"
            :key="card.sprint.id"
            :class="['sprints-card', stateClass(card.sprint)]"
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
</template>

<style scoped>
.extension-payload {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.sprints-board-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  padding-bottom: 10px;
}

.sprints-kicker,
.sprints-total,
.sprints-status,
.sprints-number,
.sprints-card-meta {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}

.sprints-kicker {
  margin: 0 0 4px;
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.72rem;
  text-transform: uppercase;
}

.sprints-board h3,
.sprints-column h4 {
  margin: 0;
}

.sprints-board h3 {
  font-size: 1.05rem;
}

.sprints-total,
.sprints-status {
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.78rem;
}

.sprints-error {
  color: var(--accent-err, #c9341c);
}

.sprints-columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 12px;
  overflow-x: auto;
}

.sprints-column {
  min-width: 180px;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  background: var(--surface, rgba(255, 255, 255, 0.03));
}

.sprints-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
}

.sprints-column-head h4 {
  font-size: 0.86rem;
}

.sprints-column-head span {
  min-width: 1.6rem;
  border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  padding: 1px 6px;
  text-align: center;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.72rem;
}

.sprints-cards {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 10px;
}

.sprints-card {
  display: grid;
  gap: 8px;
  border-left: 3px solid var(--fg-4, rgba(255, 255, 255, 0.32));
  background: var(--bg, #0a0b0e);
  padding: 10px;
}

.sprints-card.state-active {
  border-left-color: var(--accent-blue, #1d55a6);
}

.sprints-card.state-completed {
  border-left-color: var(--accent-good, #2f8f5b);
}

.sprints-card.state-canceled {
  border-left-color: var(--accent-err, #c9341c);
}

.sprints-card-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.sprints-card-head strong {
  font-size: 0.9rem;
}

.sprints-number {
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.72rem;
}

.sprints-goal {
  margin: 0;
  color: var(--fg-2, rgba(255, 255, 255, 0.74));
  font-size: 0.82rem;
  line-height: 1.45;
}

.sprints-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  color: var(--fg-3, rgba(255, 255, 255, 0.54));
  font-size: 0.7rem;
}

.sprints-card-meta div {
  display: inline-flex;
  gap: 4px;
}

.sprints-card-meta dt,
.sprints-card-meta dd {
  margin: 0;
}

.sprints-empty-column {
  margin: 0;
  padding: 10px 12px;
  color: var(--fg-4, rgba(255, 255, 255, 0.34));
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 0.74rem;
}

@media (max-width: 860px) {
  .sprints-columns {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 560px) {
  .sprints-board-head {
    align-items: start;
    flex-direction: column;
  }

  .sprints-columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
