<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { listIssues } from "./api";
import IssueCard from "./IssueCard.vue";
import {
  DEFAULT_WORKSPACE_ID,
  type ComtryaGraphQLClient,
  type Issue,
  type LoadState,
} from "./types";

const props = withDefaults(defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  issues?: Issue[] | null;
  workspaceId?: string;
  repositoryId?: string | null;
  state?: string | null;
  title?: string;
  showNewLink?: boolean;
}>(), {
  workspaceId: DEFAULT_WORKSPACE_ID,
  repositoryId: null,
  state: null,
  title: "Issues",
  showNewLink: true,
});

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const loadedIssues = ref<Issue[]>(props.issues ?? []);
const issues = computed(() => props.issues ?? loadedIssues.value);
const graphClient = computed(() => props.client ?? props.comtryaClient);
const newIssueHref = computed(() => `/x/issues/new?workspaceId=${props.workspaceId}`);

onMounted(loadIssues);
watch(
  () => [
    graphClient.value,
    props.issues,
    props.workspaceId,
    props.repositoryId,
    props.state,
  ],
  () => void loadIssues(),
);

async function loadIssues(): Promise<void> {
  if (props.issues) {
    loadedIssues.value = props.issues;
    loadState.value = props.issues.length > 0 ? "ready" : "empty";
    error.value = null;
    return;
  }
  if (!graphClient.value) {
    loadedIssues.value = [];
    loadState.value = "error";
    error.value = "issues: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    loadedIssues.value = await listIssues(graphClient.value, {
      workspaceId: props.workspaceId,
      repositoryId: props.repositoryId,
      state: props.state,
    });
    loadState.value = loadedIssues.value.length > 0 ? "ready" : "empty";
  } catch (caught) {
    loadedIssues.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}
</script>

<template>
  <section class="issues-list" :data-state="loadState" data-smoke="issues-list">
    <header class="issues-list-header">
      <h3>{{ title }}</h3>
      <a v-if="showNewLink" :href="newIssueHref">+ new</a>
    </header>

    <p v-if="loadState === 'loading'" class="issue-line muted">Loading issues</p>
    <p v-else-if="loadState === 'error'" class="issue-line warn">{{ error }}</p>
    <p v-else-if="issues.length === 0" class="issue-line muted">No issues yet.</p>
    <ul v-else class="issues-list-items">
      <li v-for="issue in issues" :key="issue.id">
        <IssueCard :issue="issue" :client="graphClient" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.issues-list {
  display: grid;
  gap: 8px;
}

.issues-list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.issues-list-header h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.issues-list-header a,
.issue-line {
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.issues-list-header a {
  color: var(--ink-faint, #888);
  text-decoration: none;
}

.issues-list-items {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.issue-line {
  margin: 4px 0;
}

.muted {
  color: var(--ink-faint, #888);
}

.warn {
  color: var(--ink-warn, #c2410c);
}
</style>
