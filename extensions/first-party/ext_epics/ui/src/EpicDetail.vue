<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  changeEpicState,
  epicByRef,
  epicProgress,
  issuesInEpic,
} from "./api";
import CustomElementHost from "./CustomElementHost.vue";
import {
  DEFAULT_WORKSPACE_ID,
  epicRef,
  stateTone,
  type ComtryaGraphQLClient,
  type Epic,
  type EpicProgress,
  type EpicState,
  type ExtensionRouteParams,
  type LoadState,
} from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  epic?: Epic | null;
  workspaceId?: string;
  id?: string;
  routeParams?: ExtensionRouteParams;
}>();

const targetStates: EpicState[] = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"];
const loadState = ref<LoadState>("idle");
const actionState = ref<"idle" | "submitting">("idle");
const error = ref<string | null>(null);
const actionError = ref<string | null>(null);
const loadedEpic = ref<Epic | null>(props.epic ?? null);
const progress = ref<EpicProgress | null>(null);
const issueRefs = ref<string[]>([]);
const graphClient = computed(() => props.client ?? props.comtryaClient);
const workspaceId = computed(
  () => props.workspaceId
    ?? props.routeParams?.params?.workspaceId
    ?? DEFAULT_WORKSPACE_ID,
);
const epicId = computed(() => props.id ?? props.routeParams?.params?.id ?? "");
const currentRef = computed(() => props.epic ? epicRef(props.epic) : `comtrya://epic/${epicId.value}`);
const epic = computed(() => loadedEpic.value ?? props.epic ?? null);
const tone = computed(() => stateTone(epic.value?.state));
const availableStates = computed(
  () => targetStates.filter((target) => target !== epic.value?.state),
);
const totalIssues = computed(
  () => (progress.value?.issuesOpen ?? 0) + (progress.value?.issuesClosed ?? 0),
);
const canLoad = computed(() => graphClient.value && Boolean(epicId.value));

onMounted(loadEpic);
watch(
  () => [graphClient.value, props.epic, workspaceId.value, epicId.value],
  () => void loadEpic(),
);

async function loadEpic(): Promise<void> {
  if (props.epic) {
    loadedEpic.value = props.epic;
    loadState.value = "ready";
    error.value = null;
    await loadRelated();
    return;
  }
  if (!canLoad.value || !graphClient.value) {
    loadedEpic.value = null;
    progress.value = null;
    issueRefs.value = [];
    loadState.value = "error";
    error.value = "epic-detail: missing params";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    loadedEpic.value = await epicByRef(graphClient.value, currentRef.value);
    loadState.value = loadedEpic.value ? "ready" : "empty";
    await loadRelated();
  } catch (caught) {
    loadedEpic.value = null;
    progress.value = null;
    issueRefs.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function loadRelated(): Promise<void> {
  if (!graphClient.value || !epic.value) {
    progress.value = null;
    issueRefs.value = [];
    return;
  }
  const ref = epicRef(epic.value);
  const [progressResult, issuesResult] = await Promise.allSettled([
    epicProgress(graphClient.value, ref),
    issuesInEpic(graphClient.value, ref),
  ]);
  progress.value = progressResult.status === "fulfilled" ? progressResult.value : null;
  issueRefs.value = issuesResult.status === "fulfilled" ? issuesResult.value : [];
}

async function markState(state: EpicState): Promise<void> {
  if (!graphClient.value || !epic.value) return;
  actionState.value = "submitting";
  actionError.value = null;
  try {
    loadedEpic.value = await changeEpicState(graphClient.value, epic.value.id, state);
    await loadRelated();
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

function labelForState(state: EpicState): string {
  return state.toLowerCase().replace("_", " ");
}
</script>

<template>
  <main
    class="epic-detail"
    :data-state="loadState"
    :data-epic-id="epic?.id"
    data-smoke="epic-detail"
  >
    <p v-if="loadState === 'loading'" class="epic-line muted">Loading epic</p>
    <p v-else-if="loadState === 'error'" class="epic-line warn">{{ error }}</p>
    <p v-else-if="!epic" class="epic-line warn">
      No epic {{ epicId || "?" }} in {{ workspaceId }}
    </p>

    <template v-else>
      <header>
        <h1>{{ epic.title }}</h1>
        <div class="epic-detail-meta">
          <span class="epic-pill" :class="tone.className">{{ tone.label }}</span>
          <span>created {{ epic.createdAt ?? "unknown" }}</span>
          <span v-if="epic.targetDate">target {{ epic.targetDate }}</span>
        </div>
      </header>

      <article
        class="epic-body"
        :data-epic-id="epic.id"
        data-smoke="epic-detail-main"
      >
        {{ epic.bodyMarkdown || "(no description)" }}
      </article>

      <section class="epic-section" data-smoke="epic-progress">
        <h3>Progress</h3>
        <p v-if="progress" class="epic-line">
          {{ progress.issuesClosed ?? 0 }}/{{ totalIssues }} issues closed ·
          {{ progress.percentComplete ?? 0 }}%
        </p>
        <p v-else class="epic-line muted">progress unavailable</p>
      </section>

      <section class="epic-section" data-smoke="epic-issues">
        <h3>Issues in this epic</h3>
        <div v-if="issueRefs.length === 0" class="epic-line muted">
          no issues linked yet
        </div>
        <ul v-else>
          <li v-for="issueRefValue in issueRefs" :key="issueRefValue">
            <CustomElementHost
              tag="comtrya-resource-card"
              :attributes="{ ref: issueRefValue }"
              :properties="{ ref: issueRefValue, comtryaClient: graphClient }"
            />
          </li>
        </ul>
      </section>

      <div class="epic-actions">
        <button
          v-for="state in availableStates"
          :key="state"
          type="button"
          :disabled="actionState === 'submitting'"
          @click="markState(state)"
        >
          mark {{ labelForState(state) }}
        </button>
      </div>
      <p v-if="actionError" class="epic-line warn" role="alert">{{ actionError }}</p>

      <CustomElementHost
        tag="comtrya-comment-thread"
        :attributes="{ target: epicRef(epic) }"
        :properties="{ target: epicRef(epic), comtryaClient: graphClient }"
      />
    </template>
  </main>
</template>

<style scoped>
.epic-detail {
  max-width: 720px;
  display: grid;
  gap: 16px;
  padding: 24px 0;
}

.epic-detail h1 {
  margin: 0;
  font-family: var(--display, system-ui);
}

.epic-detail-meta,
.epic-line,
.epic-actions button,
.epic-section {
  font-family: var(--mono, monospace);
}

.epic-detail-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--ink-faint, #888);
  font-size: 12px;
}

.epic-pill {
  padding: 1px 8px;
  border: 1px solid currentColor;
}

.epic-state-good {
  color: var(--ink-go, #008873);
}

.epic-state-warn {
  color: var(--ink-warn, #c2410c);
}

.epic-state-muted,
.muted {
  color: var(--ink-faint, #888);
}

.epic-body {
  min-height: 96px;
  padding: 12px;
  border: 1px solid var(--ink-rule, #d0cfc8);
  white-space: pre-wrap;
}

.epic-section {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

.epic-section h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 13px;
}

.epic-section ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.epic-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.epic-actions button {
  padding: 4px 12px;
  cursor: pointer;
}

.epic-line {
  margin: 4px 0;
  font-size: 12px;
}

.warn {
  color: var(--ink-warn, #c2410c);
}
</style>
