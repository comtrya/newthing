<script setup lang="ts">
import { computed, ref, watch } from "vue";
import SlotMount from "../components/SlotMount.vue";
import { repositoryHomeSlots } from "../repository-slots";

const props = defineProps<{
  groups: string[];
  repo: string;
}>();

interface RepositoryIdentity {
  id: string;
  name: string;
  path: string;
  groups: string[];
}

const REPOSITORY_BY_PATH_QUERY = `query ShellRepoHome($segments: [String!]!) {
  workspace {
    repositoryByPath(segments: $segments) {
      id
      name
      path
      groups
    }
  }
}`;

const repository = ref<RepositoryIdentity | null>(null);
const loadState = ref<"loading" | "ready" | "missing" | "error">("loading");
const loadError = ref<string | null>(null);
const ownerPath = computed(() => props.groups.join("/"));
const repoPath = computed(() => [...props.groups, props.repo].join("/"));
const repoSegments = computed(() => [...props.groups, props.repo]);
const repositoryId = computed(() => repository.value?.id ?? repoPath.value);

const repoRows = computed(() => [
  { label: "Owner path", value: ownerPath.value || "unknown" },
  { label: "Repository", value: props.repo || "unknown" },
  { label: "Repository ID", value: repositoryId.value || "unknown" },
]);

const repoContext = computed<Record<string, unknown>>(() => ({
  repositoryId: repositoryId.value,
  repositoryGroups: repository.value?.groups ?? props.groups,
  repositoryName: repository.value?.name ?? props.repo,
  repositoryPath: repository.value?.path ?? repoPath.value,
}));

watch(
  repoSegments,
  async (segments, _previous, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    loadState.value = "loading";
    loadError.value = null;
    try {
      const identity = await fetchRepositoryIdentity(segments, controller.signal);
      repository.value = identity;
      loadState.value = identity ? "ready" : "missing";
    } catch (error) {
      if (controller.signal.aborted) return;
      repository.value = null;
      loadState.value = "error";
      loadError.value = error instanceof Error ? error.message : String(error);
    }
  },
  { immediate: true },
);

async function fetchRepositoryIdentity(
  segments: string[],
  signal: AbortSignal,
): Promise<RepositoryIdentity | null> {
  const response = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: REPOSITORY_BY_PATH_QUERY,
      variables: { segments },
    }),
    signal,
  });
  const envelope = (await response.json()) as {
    data?: { workspace?: { repositoryByPath?: RepositoryIdentity | null } };
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || envelope.errors?.length) {
    throw new Error(
      envelope.errors?.[0]?.message ?? response.statusText ?? "repository lookup failed",
    );
  }
  return envelope.data?.workspace?.repositoryByPath ?? null;
}
</script>

<template>
  <section class="page-header">
    <div class="title-group">
      <span class="overline">Repository</span>
      <h1>{{ repo }}</h1>
    </div>
    <div class="summary-grid" aria-label="Repository summary">
      <div v-for="row in repoRows" :key="row.label">
        <span>{{ row.label }}</span>
        <strong>{{ row.value }}</strong>
      </div>
    </div>
  </section>

  <section v-if="loadState !== 'ready'" class="repo-state" :data-state="loadState">
    <span v-if="loadState === 'loading'">Loading repository context</span>
    <span v-else-if="loadState === 'missing'">Repository was not found</span>
    <span v-else>{{ loadError }}</span>
  </section>

  <section v-if="loadState === 'ready'" class="work-grid">
    <SlotMount
      v-for="slot in repositoryHomeSlots"
      :key="slot.name"
      :name="slot.name"
      :label="slot.label"
      :element-context="repoContext"
      smoke-prefix="repo-slot"
    />
  </section>
</template>
