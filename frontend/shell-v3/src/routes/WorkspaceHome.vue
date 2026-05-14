<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import SlotMount from "../components/SlotMount.vue";
import type { WorkspaceHomeSlotName } from "../workspace-home-slots";

interface RepositorySummary {
  id: string;
  name: string;
  path: string;
  groups: string[];
  description: string | null;
  openPullRequests: number | null;
}

interface WorkspaceHomePayload {
  instance?: {
    id: string;
    name: string;
    capabilities?: {
      extensionRuntime?: boolean;
    };
  };
  workspace?: {
    name: string;
    repositories: RepositorySummary[];
  };
  extensionInstallations?: Array<{
    id: string;
    routePrefix: string | null;
  }>;
}

const WORKSPACE_HOME_QUERY = `query ShellWorkspaceHome {
  instance { id name capabilities { extensionRuntime } }
  workspace {
    name
    repositories { id name path groups description openPullRequests }
  }
  extensionInstallations { id routePrefix }
}`;

const loadState = ref<"loading" | "ready" | "error">("loading");
const loadError = ref<string | null>(null);
const payload = ref<WorkspaceHomePayload | null>(null);
const workspace = computed(() => payload.value?.workspace ?? {
  name: "Workspace",
  repositories: [],
});
const repositories = computed(() => workspace.value.repositories);
const extensionCount = computed(() => payload.value?.extensionInstallations?.length ?? 0);
const extensionRuntime = computed(
  () => payload.value?.instance?.capabilities?.extensionRuntime ? "enabled" : "disabled",
);
const repositoryWord = computed(() => repositories.value.length === 1 ? "repository" : "repositories");
interface WorkspaceSlotRow {
  name: WorkspaceHomeSlotName;
  label: string;
}

const topSlot: WorkspaceSlotRow = { name: "workspace.home.top", label: "Focus" };
const leftSlot: WorkspaceSlotRow = { name: "workspace.home.left", label: "Activity" };
const centerSlot: WorkspaceSlotRow = {
  name: "workspace.home.center",
  label: "Extension Repositories",
};
const rightSlot: WorkspaceSlotRow = { name: "workspace.home.right", label: "Instance" };
const workspaceSlotContext = computed<Record<string, unknown>>(() => ({
  workspaceName: workspace.value.name,
  repositoryCount: repositories.value.length,
}));
let loadController: AbortController | undefined;

onMounted(() => void loadWorkspaceHome());
onUnmounted(() => loadController?.abort());

async function loadWorkspaceHome(): Promise<void> {
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  loadState.value = "loading";
  loadError.value = null;
  try {
    payload.value = await fetchWorkspaceHome(controller.signal);
    loadState.value = "ready";
  } catch (error) {
    if (controller.signal.aborted) return;
    payload.value = null;
    loadState.value = "error";
    loadError.value = error instanceof Error ? error.message : String(error);
  }
}

async function fetchWorkspaceHome(signal: AbortSignal): Promise<WorkspaceHomePayload> {
  const response = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: WORKSPACE_HOME_QUERY }),
    signal,
  });
  const envelope = (await response.json()) as {
    data?: WorkspaceHomePayload;
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || envelope.errors?.length) {
    throw new Error(envelope.errors?.[0]?.message ?? response.statusText);
  }
  if (!envelope.data?.workspace) {
    throw new Error("workspace home response did not include workspace data");
  }
  return envelope.data;
}

function openPullRequestText(repo: RepositorySummary): string {
  const count = repo.openPullRequests ?? 0;
  return `${count} open PR${count === 1 ? "" : "s"}`;
}
</script>

<template>
  <div data-smoke="home-shell">
    <section class="page-header">
      <div class="title-group">
        <span class="overline">Workspace</span>
        <h1>{{ workspace.name }}</h1>
      </div>
      <div class="summary-grid" aria-label="Workspace summary">
        <div>
          <span>Repositories</span>
          <strong>{{ repositories.length }}</strong>
        </div>
        <div>
          <span>Extensions</span>
          <strong>{{ extensionCount }}</strong>
        </div>
        <div>
          <span>Runtime</span>
          <strong>{{ extensionRuntime }}</strong>
        </div>
      </div>
    </section>

    <section class="home-actions">
      <div>
        <span class="overline">/ · workspace</span>
        <p>{{ repositories.length }} {{ repositoryWord }} available from the live kernel.</p>
      </div>
      <a href="/new" data-smoke="home-new-repo-cta">+ New repository</a>
    </section>

    <p v-if="loadState === 'error'" class="repo-state" role="alert">{{ loadError }}</p>

    <section class="home-grid">
      <div class="home-spine" data-smoke="home-spine">
        <SlotMount
          :name="topSlot.name"
          :label="topSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />

        <section class="panel home-repositories" data-smoke="home-repositories">
          <header class="panel-heading">
            <h2>Repositories</h2>
            <a href="/new" data-smoke="home-repositories-new">+ New</a>
          </header>

          <p v-if="loadState === 'loading'" class="home-empty">Loading repositories</p>
          <p v-else-if="repositories.length === 0" class="home-empty">
            No repositories yet. <a href="/new">Create one</a> to get started.
          </p>
          <ul v-else class="home-repo-list">
            <li v-for="repo in repositories" :key="repo.id">
              <a :href="`/r/${repo.path}`">{{ repo.path }}</a>
              <p v-if="repo.description">{{ repo.description }}</p>
              <span>{{ openPullRequestText(repo) }}</span>
            </li>
          </ul>
        </section>

        <SlotMount
          :name="leftSlot.name"
          :label="leftSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />
      </div>

      <aside class="home-rail">
        <SlotMount
          :name="centerSlot.name"
          :label="centerSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />
        <SlotMount
          :name="rightSlot.name"
          :label="rightSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />
      </aside>
    </section>
  </div>
</template>
