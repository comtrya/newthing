<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { listEpics } from "./api";
import EpicCard from "./EpicCard.vue";
import {
  DEFAULT_WORKSPACE_ID,
  epicRef,
  newEpicHref as buildNewEpicHref,
  type ComtryaGraphQLClient,
  type Epic,
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

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const loadedEpics = ref<Epic[]>(props.epics ?? []);
const epics = computed(() => {
  const all = props.epics ?? loadedEpics.value;
  if (!props.projectName) return all;
  return all.filter((epic) => epic.projectName === props.projectName);
});
const graphClient = computed(() => props.client ?? props.comtryaClient);
const newEpicHref = computed(() => {
  const base = buildNewEpicHref(props.workspaceId);
  return props.projectName
    ? `${base}&projectName=${encodeURIComponent(props.projectName)}`
    : base;
});

onMounted(loadEpics);
watch(
  () => [graphClient.value, props.epics, props.workspaceId, props.state],
  () => void loadEpics(),
);

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

    <p v-if="loadState === 'loading'" class="epic-line muted">Loading epics</p>
    <p v-else-if="loadState === 'error'" class="epic-line warn">{{ error }}</p>
    <p v-else-if="epics.length === 0" class="epic-line muted">No epics yet.</p>
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
