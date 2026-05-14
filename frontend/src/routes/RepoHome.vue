<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { getGraphQLClient, invokeOp, subscribeLiveEvents } from "@comtrya/sdk-core";
import ProjectsPanel from "../components/ProjectsPanel.vue";
import SlotMount from "../components/SlotMount.vue";
import { repositoryHomeSlots } from "../repository-slots";
import { applyUserLayoutFor } from "../user-layout";

const props = defineProps<{
  groups: string[];
  repo: string;
}>();

interface RepositoryIdentity {
  id: string;
  name: string;
  path: string;
  groups: string[];
  description?: string | null;
  defaultBranch?: string | null;
  visibility?: string | null;
  updated?: string | null;
  openPullRequests?: number | null;
}

interface RepoHomePayload {
  workspace?: {
    id?: string | null;
    repositoryByPath?: RepositoryIdentity | null;
  };
}

const REPOSITORY_BY_PATH_QUERY = `query ShellRepoHome($segments: [String!]!) {
  workspace {
    id
    repositoryByPath(segments: $segments) {
      id
      name
      path
      groups
      description
      defaultBranch
      visibility
      updated
      openPullRequests
    }
  }
}`;

const repository = ref<RepositoryIdentity | null>(null);
const workspaceId = ref<string | null>(null);
const loadState = ref<"loading" | "ready" | "missing" | "error">("loading");
const loadError = ref<string | null>(null);
const repoPath = computed(() => [...props.groups, props.repo].join("/"));
const repoSegments = computed(() => [...props.groups, props.repo]);
const repositoryId = computed(() => repository.value?.id ?? repoPath.value);
const displayPath = computed(() => repository.value?.path ?? repoPath.value);

/**
 * Per-repo open issue count. Hydrated when the repo identity
 * resolves and kept live via the same SSE topics App.vue listens
 * to for the workspace-wide nav badge. Surfaces in the chip row
 * alongside the existing `openPullRequests` field.
 */
const openIssues = ref(0);
const issueUnsubscribers: Array<() => void> = [];

async function refreshOpenIssues(): Promise<void> {
  const repoId = repository.value?.id;
  const ws = workspaceId.value;
  if (!repoId || !ws) {
    openIssues.value = 0;
    return;
  }
  const result = await invokeOp<Array<{ state?: string }>>(
    "ext_issues",
    "issues",
    "list-issues",
    {
      repository: `comtrya://workspace/${ws}/repository/${repoId}`,
      limit: 1024,
    },
  );
  if (!result.ok || !Array.isArray(result.value)) {
    openIssues.value = 0;
    return;
  }
  openIssues.value = result.value.filter((i) => {
    const s = (i.state ?? "").toUpperCase();
    return s === "OPEN" || s === "REOPENED";
  }).length;
}

function teardownIssueListeners(): void {
  for (const off of issueUnsubscribers) off();
  issueUnsubscribers.length = 0;
}

function setupIssueListeners(): void {
  teardownIssueListeners();
  for (const type of [
    "dev.comtrya.issues.opened",
    "dev.comtrya.issues.closed",
    "dev.comtrya.issues.reopened",
  ]) {
    issueUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void refreshOpenIssues(),
        onError: () => {},
      }),
    );
  }
}

onUnmounted(teardownIssueListeners);

interface Chip {
  label: string;
  value: string;
  tone?: "ink" | "muted" | "warn" | "good";
  title?: string;
}

function relativeUpdated(value: string | null | undefined): string | null {
  if (!value) return null;
  // The kernel returns `updated` in three shapes depending on the
  // repository's source: an ISO-8601 timestamp for imported repos,
  // a human-readable "3 minutes ago" string for some demo repos,
  // and an `@<epoch-seconds>` form for ones with only a unix mtime.
  // Normalise to a relative phrase.
  let epochMs: number | null = null;
  if (/^@\d+$/.test(value)) {
    epochMs = parseInt(value.slice(1), 10) * 1000;
  } else if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) epochMs = parsed;
  }
  if (epochMs === null) return value;
  const diff = Math.max(0, Date.now() - epochMs);
  const min = 60_000, hr = 60 * min, day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  return new Date(epochMs).toISOString().slice(0, 10);
}

const repoChips = computed<Chip[]>(() => {
  const chips: Chip[] = [];
  const branch = repository.value?.defaultBranch ?? "main";
  chips.push({
    label: "branch",
    value: branch,
    tone: "ink",
    title: `default branch · ${branch}`,
  });
  const visibility = (repository.value?.visibility ?? "PRIVATE").toLowerCase();
  chips.push({
    label: "visibility",
    value: visibility,
    tone: visibility === "public" ? "good" : "muted",
  });
  const prs = repository.value?.openPullRequests ?? 0;
  chips.push({
    label: prs === 1 ? "open PR" : "open PRs",
    value: String(prs),
    tone: prs > 0 ? "ink" : "muted",
  });
  const open = openIssues.value;
  chips.push({
    label: open === 1 ? "open issue" : "open issues",
    value: String(open),
    tone: open > 0 ? "ink" : "muted",
  });
  const updated = relativeUpdated(repository.value?.updated ?? null);
  if (updated) {
    chips.push({ label: "updated", value: updated, tone: "muted" });
  }
  return chips;
});

const repoContext = computed<Record<string, unknown>>(() => ({
  workspaceId: workspaceId.value ?? undefined,
  repositoryId: repositoryId.value,
  repositoryGroups: repository.value?.groups ?? props.groups,
  repositoryName: repository.value?.name ?? props.repo,
  repositoryPath: repository.value?.path ?? repoPath.value,
  repositorySegments: repoSegments.value,
}));

watch(
  repoSegments,
  async (segments, _previous, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    loadState.value = "loading";
    loadError.value = null;
    try {
      const identity = await fetchRepositoryIdentity(segments);
      if (controller.signal.aborted) return;
      workspaceId.value = identity.workspaceId;
      repository.value = identity.repository;
      loadState.value = identity.repository ? "ready" : "missing";
      await applyUserLayoutFor(identity.repository?.id ?? null);
      if (identity.repository && identity.workspaceId) {
        void refreshOpenIssues();
        setupIssueListeners();
      } else {
        teardownIssueListeners();
        openIssues.value = 0;
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      workspaceId.value = null;
      repository.value = null;
      loadState.value = "error";
      loadError.value = error instanceof Error ? error.message : String(error);
      await applyUserLayoutFor(null);
    }
  },
  { immediate: true },
);

async function fetchRepositoryIdentity(
  segments: string[],
): Promise<{ workspaceId: string | null; repository: RepositoryIdentity | null }> {
  const payload = await getGraphQLClient().query<RepoHomePayload>(
    REPOSITORY_BY_PATH_QUERY,
    { segments },
  );
  return {
    workspaceId: payload.workspace?.id ?? null,
    repository: payload.workspace?.repositoryByPath ?? null,
  };
}
</script>

<template>
  <header class="repo-header" data-smoke="repo-dashboard">
    <p class="overline">Repository</p>
    <h1>{{ displayPath }}</h1>
    <p v-if="repository?.description" class="repo-description">
      {{ repository.description }}
    </p>
    <div class="repo-chip-row" aria-label="Repository at a glance">
      <span
        v-for="chip in repoChips"
        :key="chip.label"
        :class="['repo-chip', `tone-${chip.tone ?? 'ink'}`]"
        :title="chip.title ?? `${chip.label} · ${chip.value}`"
      >
        <strong>{{ chip.value }}</strong>
        <span>{{ chip.label }}</span>
      </span>
    </div>
  </header>

  <section v-if="loadState !== 'ready'" class="repo-state" :data-state="loadState">
    <span v-if="loadState === 'loading'">Loading repository context</span>
    <span v-else-if="loadState === 'missing'">Repository was not found</span>
    <span v-else>{{ loadError }}</span>
  </section>

  <template v-if="loadState === 'ready'">
    <ProjectsPanel :repository-path="displayPath" :segments="repoSegments" />

    <section class="repo-slot-stack">
      <section
        v-for="slot in repositoryHomeSlots"
        :id="slot.name.split('.')[1] ?? slot.name"
        :key="slot.name"
      >
        <SlotMount
          :name="slot.name"
          :label="slot.label"
          :element-context="repoContext"
          smoke-prefix="repo-slot"
        />
      </section>
    </section>
  </template>
</template>
