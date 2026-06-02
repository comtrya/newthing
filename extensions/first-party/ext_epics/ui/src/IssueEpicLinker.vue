<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  createRelation,
  deleteRelation,
  listEpics,
  outgoingRelations,
} from "./api";
import {
  defaultWorkspaceId,
  epicHref,
  epicRef,
  stateTone,
  type ComtryaGraphQLClient,
  type Epic,
  type LoadState,
  type Relation,
} from "./types";

const PART_OF_RELATION = "comtrya://rel/part-of";

interface IssueLike {
  id: string;
  workspaceId?: string | null;
  number?: number | null;
  title?: string | null;
  projectName?: string | null;
  repositoryId?: string | null;
}

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  issue?: IssueLike | null;
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
  refreshKey?: number;
  relationshipRefreshKey?: number;
}>();

const emit = defineEmits<{
  "comtrya-relationship-changed": [detail: RelationshipChangedDetail];
}>();

interface RelationshipChangedDetail {
  source: "issue-epic-linker";
  action: "created" | "deleted";
  relation?: Relation;
}

const graphClient = computed(() => props.client ?? props.comtryaClient);
const workspaceId = computed(() => props.workspaceId
  ?? props.issue?.workspaceId
  ?? defaultWorkspaceId());
const issueResourceRef = computed(() => (
  props.issue?.id ? `comtrya://issue/${props.issue.id}` : ""
));
const linkedEpics = computed(() => {
  const refs = linkedEpicRefs.value;
  return epics.value.filter((epic) => refs.has(epicRef(epic)));
});
const unresolvedLinkedRefs = computed(() => {
  const known = new Set(epics.value.map((epic) => epicRef(epic)));
  return [...linkedEpicRefs.value].filter((ref) => !known.has(ref));
});
const candidateEpics = computed(() => {
  const refs = linkedEpicRefs.value;
  const issueProject = props.issue?.projectName ?? null;
  return epics.value
    .filter((epic) => !refs.has(epicRef(epic)))
    .sort((left, right) => {
      const leftProjectMatch = issueProject && left.projectName === issueProject ? 0 : 1;
      const rightProjectMatch = issueProject && right.projectName === issueProject ? 0 : 1;
      return leftProjectMatch - rightProjectMatch
        || (left.projectName ?? "").localeCompare(right.projectName ?? "")
        || left.title.localeCompare(right.title);
    });
});
const linkedEpicRefs = computed(() => new Set(
  relations.value
    .filter((relation) => relation.kind === PART_OF_RELATION)
    .map((relation) => relationTo(relation))
    .filter((ref) => ref.startsWith("comtrya://epic/")),
));

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const actionState = ref<"idle" | "submitting">("idle");
const actionError = ref<string | null>(null);
const epics = ref<Epic[]>([]);
const relations = ref<Relation[]>([]);
const selectedEpicRef = ref("");

watch(
  () => [
    graphClient.value,
    workspaceId.value,
    issueResourceRef.value,
    props.refreshKey,
    props.relationshipRefreshKey,
  ],
  () => void load(),
  { immediate: true },
);

watch(
  candidateEpics,
  (next) => {
    if (!next.some((epic) => epicRef(epic) === selectedEpicRef.value)) {
      selectedEpicRef.value = next[0] ? epicRef(next[0]) : "";
    }
  },
  { immediate: true },
);

async function load(): Promise<void> {
  const client = graphClient.value;
  if (!client || !issueResourceRef.value) {
    epics.value = [];
    relations.value = [];
    loadState.value = "error";
    error.value = client ? "issue-epic-linker: missing issue" : "issue-epic-linker: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    const [nextEpics, nextRelations] = await Promise.all([
      listEpics(client, { workspaceId: workspaceId.value }),
      outgoingRelations(client, issueResourceRef.value, PART_OF_RELATION),
    ]);
    epics.value = nextEpics;
    relations.value = nextRelations;
    loadState.value = "ready";
  } catch (caught) {
    epics.value = [];
    relations.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function linkSelectedEpic(): Promise<void> {
  const client = graphClient.value;
  if (!client || !issueResourceRef.value || !selectedEpicRef.value) return;
  actionState.value = "submitting";
  actionError.value = null;
  try {
    const relation = await createRelation(client, {
      from: issueResourceRef.value,
      to: selectedEpicRef.value,
      kind: PART_OF_RELATION,
    });
    await load();
    notifyRelationshipChanged("created", relation);
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

async function unlinkRelation(relation: Relation): Promise<void> {
  const client = graphClient.value;
  if (!client) return;
  actionState.value = "submitting";
  actionError.value = null;
  try {
    await deleteRelation(client, relation.id);
    await load();
    notifyRelationshipChanged("deleted", relation);
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

async function unlinkEpic(ref: string): Promise<void> {
  const relation = relationForEpic(ref);
  if (relation) await unlinkRelation(relation);
}

function relationForEpic(ref: string): Relation | undefined {
  return relations.value.find((relation) => relationTo(relation) === ref);
}

function relationTo(relation: Relation): string {
  return relation.to ?? relation.target ?? "";
}

function notifyRelationshipChanged(
  action: RelationshipChangedDetail["action"],
  relation: Relation,
): void {
  emit("comtrya-relationship-changed", {
    source: "issue-epic-linker",
    action,
    relation,
  });
}
</script>

<template>
  <section class="issue-epic-linker" data-smoke="issue-epic-linker">
    <header class="issue-epic-linker-header">
      <div>
        <h2>Epic</h2>
        <p>{{ linkedEpics.length + unresolvedLinkedRefs.length }} linked</p>
      </div>
    </header>

    <p v-if="loadState === 'loading'" class="epic-linker-line muted">Loading epics</p>
    <p v-else-if="loadState === 'error'" class="epic-linker-line warn">{{ error }}</p>

    <div
      v-if="loadState === 'ready' && linkedEpics.length > 0"
      class="linked-epics"
    >
      <article
        v-for="epic in linkedEpics"
        :key="epic.id"
        class="linked-epic"
      >
        <div>
          <span class="epic-state" :class="stateTone(epic.state).className">
            {{ stateTone(epic.state).label }}
          </span>
          <a :href="epicHref(epic)">{{ epic.title }}</a>
          <p v-if="epic.projectName" class="epic-linker-line muted">
            {{ epic.projectName }}
          </p>
        </div>
        <button
          type="button"
          :disabled="actionState === 'submitting'"
          @click="unlinkEpic(epicRef(epic))"
        >
          Remove
        </button>
      </article>
    </div>

    <div
      v-if="loadState === 'ready' && unresolvedLinkedRefs.length > 0"
      class="linked-epics"
    >
      <article
        v-for="ref in unresolvedLinkedRefs"
        :key="ref"
        class="linked-epic"
      >
        <p class="epic-linker-line muted">{{ ref }}</p>
        <button
          v-if="relationForEpic(ref)"
          type="button"
          :disabled="actionState === 'submitting'"
          @click="unlinkEpic(ref)"
        >
          Remove
        </button>
      </article>
    </div>

    <p
      v-if="loadState === 'ready' && linkedEpics.length === 0 && unresolvedLinkedRefs.length === 0"
      class="epic-linker-line muted"
    >
      Not linked to an epic.
    </p>

    <form
      v-if="loadState === 'ready' && candidateEpics.length > 0"
      class="epic-linker-form"
      @submit.prevent="linkSelectedEpic"
    >
      <label>
        <span>Link epic</span>
        <select v-model="selectedEpicRef" aria-label="Epic">
          <option
            v-for="epic in candidateEpics"
            :key="epic.id"
            :value="epicRef(epic)"
          >
            {{ epic.title }}{{ epic.projectName ? ` - ${epic.projectName}` : "" }}
          </option>
        </select>
      </label>
      <button
        type="submit"
        :disabled="actionState === 'submitting' || !selectedEpicRef"
      >
        Link
      </button>
    </form>

    <p
      v-else-if="loadState === 'ready' && candidateEpics.length === 0"
      class="epic-linker-line muted"
    >
      No eligible epics.
    </p>
    <p v-if="actionError" class="epic-linker-line warn" role="alert">
      {{ actionError }}
    </p>
  </section>
</template>

<style scoped>
.issue-epic-linker {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--surface);
  color: var(--fg, rgba(255,255,255,0.94));
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.issue-epic-linker-header {
  min-height: 36px;
  display: flex;
  align-items: center;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.issue-epic-linker-header h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 18px;
  line-height: 1;
}

.issue-epic-linker-header p,
.epic-linker-line {
  margin: 4px 0 0;
  font-size: 11px;
}

.linked-epics,
.epic-linker-form {
  display: grid;
  gap: 8px;
}

.linked-epic {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
}

.linked-epic a {
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.linked-epic a:hover {
  text-decoration: underline;
}

.epic-state {
  display: inline-flex;
  margin-right: 6px;
  padding: 1px 6px;
  border: 0.5px solid currentColor;
  font-size: 10px;
}

.epic-linker-form {
  padding-top: 12px;
  border-top: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.epic-linker-form label {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.epic-linker-form label > span {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.epic-linker-form select,
.epic-linker-form button,
.linked-epic button {
  min-height: 32px;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  background: transparent;
  color: inherit;
  font: inherit;
}

.epic-linker-form select {
  width: 100%;
  max-width: 100%;
  padding: 5px 8px;
}

.epic-linker-form button,
.linked-epic button {
  padding: 5px 10px;
  cursor: pointer;
}

.epic-linker-form button:disabled,
.linked-epic button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.muted {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.warn {
  color: var(--err, oklch(70% 0.19 25));
}
</style>
