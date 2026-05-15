<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { listEpics } from "./api";
import EpicCard from "./EpicCard.vue";
import {
  DEFAULT_WORKSPACE_ID,
  epicRef,
  newEpicHref as buildNewEpicHref,
  type ComtryaGraphQLClient,
  type Epic,
  type EpicState,
  type LoadState,
} from "./types";

const props = withDefaults(defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  epics?: Epic[] | null;
  workspaceId?: string;
  state?: string | null;
  title?: string;
  showNewLink?: boolean;
  /** Scope listing to this Project; new-epic link stamps it on create. */
  projectName?: string;
}>(), {
  workspaceId: DEFAULT_WORKSPACE_ID,
  state: null,
  title: "Epics",
  showNewLink: true,
  projectName: undefined,
});

type Filter = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED" | "ALL";

const FILTERS: Array<{ id: Filter; label: string; key: string }> = [
  { id: "IN_PROGRESS", label: "In progress", key: "i" },
  { id: "PLANNED", label: "Planned", key: "p" },
  { id: "DONE", label: "Done", key: "d" },
  { id: "CANCELED", label: "Canceled", key: "x" },
  { id: "ALL", label: "All", key: "a" },
];

const URL_FILTER_VALUES = new Set<Filter>([
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
  "ALL",
]);

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const loadedEpics = ref<Epic[]>(props.epics ?? []);
const filter = ref<Filter>("ALL");

const scopedEpics = computed(() => {
  const all = props.epics ?? loadedEpics.value;
  if (!props.projectName) return all;
  return all.filter((epic) => epic.projectName === props.projectName);
});

const epics = computed(() => {
  if (filter.value === "ALL") return scopedEpics.value;
  return scopedEpics.value.filter((epic) => epic.state === filter.value);
});

const counts = computed(() => {
  const out: Record<Filter, number> = {
    PLANNED: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELED: 0,
    ALL: scopedEpics.value.length,
  };
  for (const epic of scopedEpics.value) {
    if (epic.state === "PLANNED") out.PLANNED += 1;
    else if (epic.state === "IN_PROGRESS") out.IN_PROGRESS += 1;
    else if (epic.state === "DONE") out.DONE += 1;
    else if (epic.state === "CANCELED") out.CANCELED += 1;
  }
  return out;
});

const graphClient = computed(() => props.client ?? props.comtryaClient);
const newEpicHref = computed(() => {
  const base = buildNewEpicHref(props.workspaceId);
  return props.projectName
    ? `${base}&projectName=${encodeURIComponent(props.projectName)}`
    : base;
});

/**
 * URL-persisted filter state. Mirrors IssuesList (iter 32) +
 * PullsQueue (iter 36): readUrlState on mount, replaceState on
 * change, popstate sync. Defaults to `ALL` (epics are fewer than
 * issues/PRs and skewed across states, so showing only one slice
 * by default risks an empty queue on first load).
 */
function readUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const rawState = (params.get("state") ?? "").toUpperCase();
  if (URL_FILTER_VALUES.has(rawState as Filter)) {
    filter.value = rawState as Filter;
  }
}

function writeUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (filter.value === "ALL") params.delete("state");
  else params.set("state", filter.value);
  const next = params.toString();
  const target = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`;
  if (target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", target);
  }
}

let suppressUrlWrite = false;

function onPopState(): void {
  suppressUrlWrite = true;
  readUrlState();
  nextTick(() => {
    suppressUrlWrite = false;
  });
}

onMounted(() => {
  suppressUrlWrite = true;
  readUrlState();
  suppressUrlWrite = false;
  void loadEpics();
  window.addEventListener("popstate", onPopState);
});

onUnmounted(() => {
  window.removeEventListener("popstate", onPopState);
});

watch(
  () => [graphClient.value, props.epics, props.workspaceId, props.state],
  () => void loadEpics(),
);

watch(filter, () => {
  if (suppressUrlWrite) return;
  writeUrlState();
});

async function loadEpics(): Promise<void> {
  if (props.epics) {
    loadedEpics.value = props.epics;
    loadState.value = props.epics.length > 0 ? "ready" : "empty";
    error.value = null;
    return;
  }
  if (!graphClient.value) {
    loadedEpics.value = [];
    loadState.value = "error";
    error.value = "epics: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    loadedEpics.value = await listEpics(graphClient.value, {
      workspaceId: props.workspaceId,
      state: props.state,
    });
    loadState.value = loadedEpics.value.length > 0 ? "ready" : "empty";
  } catch (caught) {
    loadedEpics.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}
</script>

<template>
  <section class="epics-list" :data-state="loadState" data-smoke="epics-list">
    <header class="epics-list-header">
      <h3>{{ title }}</h3>
      <a v-if="showNewLink" :href="newEpicHref">+ new</a>
    </header>

    <div
      v-if="scopedEpics.length > 0"
      class="epics-filter-row"
      role="tablist"
      aria-label="Filter epics by state"
    >
      <button
        v-for="f in FILTERS"
        :key="f.id"
        type="button"
        role="tab"
        :aria-selected="filter === f.id"
        :class="['epics-filter', { active: filter === f.id }]"
        @click="filter = f.id"
      >
        <span>{{ f.label }}</span>
        <span class="count">{{ counts[f.id] }}</span>
      </button>
    </div>

    <p v-if="loadState === 'loading'" class="epic-line muted">Loading epics</p>
    <p v-else-if="loadState === 'error'" class="epic-line warn">{{ error }}</p>
    <p v-else-if="scopedEpics.length === 0" class="epic-line muted">No epics yet.</p>
    <p v-else-if="epics.length === 0" class="epic-line muted">
      No {{ filter.toLowerCase().replace("_", " ") }} epics in scope.
    </p>
    <ul v-else class="epics-list-items">
      <li v-for="epic in epics" :key="epic.id">
        <EpicCard :epic="epic" :resource-ref="epicRef(epic)" :client="graphClient" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.epics-list {
  display: grid;
  gap: 8px;
}

.epics-list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.epics-list-header h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.epics-list-header a,
.epic-line {
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.epics-list-header a {
  color: var(--ink-faint, #888);
  text-decoration: none;
}

.epics-filter-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0;
  border: 1px solid var(--ink, #111);
  align-self: flex-start;
  margin-bottom: 4px;
}

.epics-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-family: var(--mono, monospace);
  font-size: 11px;
}

.epics-filter:not(:last-child) {
  border-right: 1px solid var(--rule-light, #d8d1c4);
}

.epics-filter.active {
  background: var(--ink, #111);
  color: var(--paper, #fffdf8);
}

.epics-filter .count {
  color: var(--ink-faint, #68645c);
  font-variant-numeric: tabular-nums;
}

.epics-filter.active .count {
  color: var(--paper-tint, #f2efe7);
}

.epics-list-items {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.epic-line {
  margin: 4px 0;
}

.muted {
  color: var(--ink-faint, #888);
}

.warn {
  color: var(--ink-warn, #c2410c);
}
</style>
