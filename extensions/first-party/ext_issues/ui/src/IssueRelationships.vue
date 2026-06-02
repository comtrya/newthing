<script setup lang="ts">
import {
  relationshipTargetProviderForKind,
  relationshipTypesForSourceKind,
  subscribeRelationshipTypes,
  type RelationshipTarget,
  type RelationshipTargetProvider,
  type RelationshipTypeContribution,
} from "@comtrya/sdk-core";
import { computed, onUnmounted, ref, watch } from "vue";
import {
  createRelation,
  deleteRelation,
  incomingRelations,
  outgoingRelations,
} from "./api";
import CustomElementHost from "./CustomElementHost.vue";
import {
  issueRef,
  type ComtryaGraphQLClient,
  type Issue,
  type LoadState,
  type Relation,
} from "./types";

const CURRENT_KIND = "issue";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  relationshipRegistry?: RelationshipRegistryBridge;
  issue: Issue;
  workspaceId: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
  refreshKey?: number;
}>();

const emit = defineEmits<{
  "comtrya-relationship-changed": [detail: RelationshipChangedDetail];
}>();

interface RelationshipRegistryBridge {
  relationshipTypesForSourceKind(kind: string): RelationshipTypeContribution[];
  relationshipTargetProviderForKind(resourceKind: string): RelationshipTargetProvider | undefined;
  subscribeRelationshipTypes(callback: () => void): () => void;
}

interface RelationshipChangedDetail {
  source: "issue-relationships";
  action: "created" | "deleted";
  relation?: Relation;
}

interface RelationshipAction {
  key: string;
  type: RelationshipTypeContribution;
  direction: "outgoing" | "incoming" | "symmetric";
  label: string;
  targetKinds: string[];
}

interface DisplayRelation {
  relation: Relation;
  targetRef: string;
}

interface RelationshipSection {
  key: string;
  label: string;
  relations: DisplayRelation[];
}

const graphClient = computed(() => props.client ?? props.comtryaClient);
const currentRef = computed(() => issueRef(props.issue));
const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const actionState = ref<"idle" | "loading-targets" | "submitting">("idle");
const actionError = ref<string | null>(null);
const outgoing = ref<Relation[]>([]);
const incoming = ref<Relation[]>([]);
const targetOptions = ref<RelationshipTarget[]>([]);
const selectedActionKey = ref("");
const selectedTargetRef = ref("");
const registryVersion = ref(0);
let unsubscribe: (() => void) | undefined;

const relationshipTypes = computed(() => {
  registryVersion.value;
  return activeRegistry().relationshipTypesForSourceKind(CURRENT_KIND);
});

const relationCount = computed(() => (
  sections.value.reduce((count, section) => count + section.relations.length, 0)
));

const actions = computed<RelationshipAction[]>(() => {
  const out: RelationshipAction[] = [];
  for (const type of relationshipTypes.value) {
    if (type.symmetric) {
      const targetKinds = targetKindsWithProviders(type.sourceKinds.includes(CURRENT_KIND)
        ? type.targetKinds
        : type.sourceKinds);
      if (targetKinds.length > 0) {
        out.push({
          key: `${type.id}:symmetric`,
          type,
          direction: "symmetric",
          label: type.outgoingLabel,
          targetKinds,
        });
      }
      continue;
    }
    if (type.sourceKinds.includes(CURRENT_KIND)) {
      const targetKinds = targetKindsWithProviders(type.targetKinds);
      if (targetKinds.length > 0) {
        out.push({
          key: `${type.id}:outgoing`,
          type,
          direction: "outgoing",
          label: type.outgoingLabel,
          targetKinds,
        });
      }
    }
    if (type.targetKinds.includes(CURRENT_KIND)) {
      const targetKinds = targetKindsWithProviders(type.sourceKinds);
      if (targetKinds.length > 0) {
        out.push({
          key: `${type.id}:incoming`,
          type,
          direction: "incoming",
          label: type.incomingLabel,
          targetKinds,
        });
      }
    }
  }
  return out;
});

const selectedAction = computed(() => (
  actions.value.find((action) => action.key === selectedActionKey.value)
));

const sections = computed<RelationshipSection[]>(() => {
  const out: RelationshipSection[] = [];
  for (const type of relationshipTypes.value) {
    if (type.symmetric) {
      const relations = uniqueRelations([...outgoing.value, ...incoming.value])
        .filter((relation) => relation.kind === type.kind)
        .map((relation) => ({
          relation,
          targetRef: otherEndpoint(relation, currentRef.value),
        }))
        .filter((entry) => (
          type.sourceKinds.includes(resourceKind(entry.targetRef)) ||
          type.targetKinds.includes(resourceKind(entry.targetRef))
        ));
      if (relations.length > 0) {
        out.push({ key: `${type.id}:symmetric`, label: type.outgoingLabel, relations });
      }
      continue;
    }
    if (type.sourceKinds.includes(CURRENT_KIND)) {
      const relations = outgoing.value
        .filter((relation) => relation.kind === type.kind && relationFrom(relation) === currentRef.value)
        .map((relation) => ({ relation, targetRef: relationTo(relation) }))
        .filter((entry) => type.targetKinds.includes(resourceKind(entry.targetRef)));
      if (relations.length > 0) {
        out.push({ key: `${type.id}:outgoing`, label: type.outgoingLabel, relations });
      }
    }
    if (type.targetKinds.includes(CURRENT_KIND)) {
      const relations = incoming.value
        .filter((relation) => relation.kind === type.kind && relationTo(relation) === currentRef.value)
        .map((relation) => ({ relation, targetRef: relationFrom(relation) }))
        .filter((entry) => type.sourceKinds.includes(resourceKind(entry.targetRef)));
      if (relations.length > 0) {
        out.push({ key: `${type.id}:incoming`, label: type.incomingLabel, relations });
      }
    }
  }
  return out;
});

watch(
  () => props.relationshipRegistry,
  () => {
    unsubscribe?.();
    unsubscribe = activeRegistry().subscribeRelationshipTypes(() => {
      registryVersion.value += 1;
    });
    registryVersion.value += 1;
  },
  { immediate: true },
);

onUnmounted(() => unsubscribe?.());

watch(
  () => [graphClient.value, props.issue.id, props.refreshKey],
  () => void loadRelations(),
  { immediate: true },
);

watch(
  actions,
  (next) => {
    if (!next.some((action) => action.key === selectedActionKey.value)) {
      selectedActionKey.value = next[0]?.key ?? "";
    }
  },
  { immediate: true },
);

watch(
  () => [
    selectedActionKey.value,
    props.workspaceId,
    props.repositoryId,
    props.repositoryPath,
    currentRef.value,
    registryVersion.value,
  ],
  () => void loadTargets(),
  { immediate: true },
);

async function loadRelations(): Promise<void> {
  const client = graphClient.value;
  if (!client) {
    outgoing.value = [];
    incoming.value = [];
    loadState.value = "error";
    error.value = "relationships: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    const [nextOutgoing, nextIncoming] = await Promise.all([
      outgoingRelations(client, currentRef.value),
      incomingRelations(client, currentRef.value),
    ]);
    outgoing.value = nextOutgoing;
    incoming.value = nextIncoming;
    loadState.value = "ready";
  } catch (caught) {
    outgoing.value = [];
    incoming.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function loadTargets(): Promise<void> {
  const action = selectedAction.value;
  if (!action) {
    targetOptions.value = [];
    selectedTargetRef.value = "";
    return;
  }
  actionState.value = "loading-targets";
  actionError.value = null;
  try {
    const loaded: RelationshipTarget[] = [];
    for (const targetKind of action.targetKinds) {
      const provider = activeRegistry().relationshipTargetProviderForKind(targetKind);
      if (!provider) continue;
      const targets = await provider.loadTargets({
        workspaceId: props.workspaceId,
        repositoryId: props.repositoryId,
        repositoryPath: props.repositoryPath,
        currentRef: currentRef.value,
        currentKind: CURRENT_KIND,
        relationshipType: action.type,
        direction: action.direction,
        targetKind,
      });
      loaded.push(...targets);
    }
    targetOptions.value = uniqueTargets(loaded)
      .filter((target) => target.ref !== currentRef.value);
    selectedTargetRef.value = targetOptions.value[0]?.ref ?? "";
  } catch (caught) {
    targetOptions.value = [];
    selectedTargetRef.value = "";
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

async function addRelationship(): Promise<void> {
  const client = graphClient.value;
  const action = selectedAction.value;
  if (!client || !action || !selectedTargetRef.value) return;
  const from = action.direction === "incoming" ? selectedTargetRef.value : currentRef.value;
  const to = action.direction === "incoming" ? currentRef.value : selectedTargetRef.value;
  actionState.value = "submitting";
  actionError.value = null;
  try {
    const relation = await createRelation(client, { from, to, kind: action.type.kind });
    await loadRelations();
    notifyRelationshipChanged("created", relation);
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

async function removeRelationship(relation: Relation): Promise<void> {
  const client = graphClient.value;
  if (!client) return;
  actionState.value = "submitting";
  actionError.value = null;
  try {
    await deleteRelation(client, relation.id);
    await loadRelations();
    notifyRelationshipChanged("deleted", relation);
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

function activeRegistry(): RelationshipRegistryBridge {
  return props.relationshipRegistry ?? {
    relationshipTypesForSourceKind,
    relationshipTargetProviderForKind,
    subscribeRelationshipTypes,
  };
}

function relationFrom(relation: Relation): string {
  return relation.from ?? relation.source ?? "";
}

function relationTo(relation: Relation): string {
  return relation.to ?? relation.target ?? "";
}

function otherEndpoint(relation: Relation, ref: string): string {
  const from = relationFrom(relation);
  const to = relationTo(relation);
  return from === ref ? to : from === to ? "" : from;
}

function resourceKind(ref: string): string {
  const match = ref.match(/^comtrya:\/\/([^/]+)\//);
  return match?.[1] ?? "";
}

function targetKindsWithProviders(kinds: string[]): string[] {
  return [...new Set(kinds)]
    .filter((kind) => activeRegistry().relationshipTargetProviderForKind(kind) !== undefined);
}

function uniqueRelations(relations: Relation[]): Relation[] {
  const seen = new Set<string>();
  return relations.filter((relation) => {
    if (seen.has(relation.id)) return false;
    seen.add(relation.id);
    return true;
  });
}

function uniqueTargets(targets: RelationshipTarget[]): RelationshipTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    if (seen.has(target.ref)) return false;
    seen.add(target.ref);
    return true;
  });
}

function notifyRelationshipChanged(action: RelationshipChangedDetail["action"], relation: Relation): void {
  emit("comtrya-relationship-changed", {
    source: "issue-relationships",
    action,
    relation,
  });
}
</script>

<template>
  <section class="issue-relationships" data-smoke="issue-detail-relationships">
    <header class="relationship-header">
      <div>
        <h2>Relationships</h2>
        <p>{{ relationCount }} linked</p>
      </div>
    </header>

    <p v-if="loadState === 'loading'" class="issue-line muted">Loading relationships</p>
    <p v-else-if="loadState === 'error'" class="issue-line warn">{{ error }}</p>
    <p v-else-if="sections.length === 0" class="issue-line muted">
      No relationships yet.
    </p>

    <div v-else class="relationship-groups">
      <section
        v-for="section in sections"
        :key="section.key"
        class="relationship-group"
      >
        <div class="relationship-group-heading">
          <h3>{{ section.label }}</h3>
          <span>{{ section.relations.length }}</span>
        </div>
        <ul>
          <li
            v-for="entry in section.relations"
            :key="entry.relation.id"
          >
            <div class="relationship-card">
              <CustomElementHost
                tag="comtrya-resource-card"
                :attributes="{ ref: entry.targetRef }"
                :properties="{ ref: entry.targetRef, comtryaClient: graphClient }"
              />
            </div>
            <button
              type="button"
              class="relationship-remove"
              :aria-label="`Remove ${section.label} relationship`"
              :disabled="actionState === 'submitting'"
              @click="removeRelationship(entry.relation)"
            >
              Remove
            </button>
          </li>
        </ul>
      </section>
    </div>

    <form
      v-if="actions.length > 0"
      class="relationship-form"
      @submit.prevent="addRelationship"
    >
      <label>
        <span>Type</span>
        <select v-model="selectedActionKey" aria-label="Relationship type">
          <option
            v-for="action in actions"
            :key="action.key"
            :value="action.key"
          >
            {{ action.label }}
          </option>
        </select>
      </label>
      <label>
        <span>Target</span>
        <select v-model="selectedTargetRef" aria-label="Relationship target">
          <option
            v-for="target in targetOptions"
            :key="target.ref"
            :value="target.ref"
          >
            {{ target.title }}{{ target.subtitle ? ` - ${target.subtitle}` : "" }}
          </option>
        </select>
      </label>
      <button
        type="submit"
        :disabled="actionState !== 'idle' || !selectedTargetRef"
      >
        Add
      </button>
    </form>

    <p
      v-if="actions.length > 0 && targetOptions.length === 0 && actionState === 'idle'"
      class="issue-line muted"
    >
      No eligible targets for this relationship.
    </p>
    <p v-if="actionError" class="issue-line warn" role="alert">{{ actionError }}</p>
  </section>
</template>

<style scoped>
.issue-relationships {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--surface);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.relationship-header {
  min-height: 36px;
  display: flex;
  align-items: center;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.relationship-header h2,
.relationship-group h3 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
}

.relationship-header h2 {
  font-size: 18px;
  line-height: 1;
}

.relationship-header p {
  margin: 4px 0 0;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-size: 11px;
}

.relationship-groups,
.relationship-group,
.relationship-group ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.relationship-group {
  padding-top: 4px;
}

.relationship-group-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.relationship-group-heading h3 {
  font-size: 14px;
  line-height: 1;
}

.relationship-group-heading span {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-size: 11px;
}

.relationship-group ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.relationship-group li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 8px;
}

.relationship-card {
  min-width: 0;
}

.relationship-form {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.relationship-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.relationship-form label > span {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.relationship-form select,
.relationship-form button,
.relationship-group button {
  min-height: 32px;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  background: transparent;
  color: inherit;
  font: inherit;
}

.relationship-form select {
  width: 100%;
  max-width: 100%;
  padding: 5px 8px;
}

.relationship-form button,
.relationship-group button {
  padding: 5px 10px;
  cursor: pointer;
}

.relationship-remove {
  align-self: start;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.relationship-form button:disabled,
.relationship-group button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.issue-line {
  margin: 4px 0;
  font-size: 12px;
}

.muted {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.warn {
  color: var(--err, oklch(70% 0.19 25));
}
</style>
