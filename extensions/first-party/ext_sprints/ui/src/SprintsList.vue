<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listSprints } from "./api";
import type { LoadState, Sprint } from "./types";

const props = withDefaults(defineProps<{
  workspace?: string;
}>(), {
  workspace: "",
});

const loadState = ref<LoadState>("idle");
const sprints = ref<Sprint[]>([]);
const error = ref<string | null>(null);

onMounted(async () => {
  if (!props.workspace) {
    loadState.value = "empty";
    return;
  }
  loadState.value = "loading";
  try {
    const result = await listSprints(props.workspace);
    sprints.value = result;
    loadState.value = result.length === 0 ? "empty" : "ready";
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    loadState.value = "error";
  }
});

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function stateLabel(state: string): string {
  // The backend emits upper-case states (PLANNED/ACTIVE/COMPLETED/CANCELED);
  // normalise so the label is correct regardless of casing.
  switch (state.toLowerCase()) {
    case "active": return "Active";
    case "completed": return "Completed";
    case "canceled": return "Canceled";
    default: return "Planned";
  }
}
</script>

<template>
  <div class="extension-payload" data-smoke="sprints-list">
    <h3 class="sprints-heading">Sprints</h3>

    <p v-if="loadState === 'loading'" class="sprints-status">Loading…</p>
    <p v-else-if="loadState === 'error'" class="sprints-status sprints-error">{{ error }}</p>
    <p v-else-if="loadState === 'empty'" class="sprints-status">No sprints.</p>

    <table v-else-if="loadState === 'ready'" class="sprints-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>State</th>
          <th>Start</th>
          <th>End</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sprint in sprints" :key="sprint.id">
          <td class="sprints-number">{{ sprint.number }}</td>
          <td class="sprints-title">{{ sprint.title }}</td>
          <td class="sprints-state">{{ stateLabel(sprint.state) }}</td>
          <td class="sprints-date">{{ formatDate(sprint.startDate) }}</td>
          <td class="sprints-date">{{ formatDate(sprint.endDate) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.extension-payload {
  display: grid;
  gap: 8px;
  padding: 12px;
}

.sprints-heading {
  margin: 0;
  font-size: 1rem;
}

.sprints-status {
  margin: 0;
  opacity: 0.7;
}

.sprints-error {
  color: var(--color-danger, #c0392b);
}

.sprints-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.sprints-table th,
.sprints-table td {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.sprints-table th {
  font-weight: 600;
  opacity: 0.8;
}

.sprints-number {
  width: 2rem;
  font-variant-numeric: tabular-nums;
}

.sprints-date {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
