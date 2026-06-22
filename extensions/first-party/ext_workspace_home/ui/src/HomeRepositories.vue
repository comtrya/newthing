<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { loadRepositories } from "./api";
import type { ComtryaGraphQLClient, LoadState, RepositoryItem } from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
}>();

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const repositories = ref<RepositoryItem[]>([]);
const graphClient = computed(() => props.client ?? props.comtryaClient);

onMounted(load);
watch(graphClient, () => void load());

async function load(): Promise<void> {
  if (!graphClient.value) {
    loadState.value = "error";
    error.value = "Failed to load repositories: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    repositories.value = await loadRepositories(graphClient.value);
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    error.value = `Failed to load repositories: ${
      caught instanceof Error ? caught.message : String(caught)
    }`;
  }
}

function groupPrefix(repo: RepositoryItem): string {
  const groups = Array.isArray(repo.groups) ? repo.groups : [];
  return groups.length > 0 ? `${groups.join("/")}/` : "";
}

function checkOk(repo: RepositoryItem): boolean {
  return Boolean(repo.checkSummary && repo.checkSummary.passed === repo.checkSummary.total);
}

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function pullRequestText(repo: RepositoryItem): string {
  return countLabel(repo.openPullRequests ?? 0, "pull request");
}

function checkText(repo: RepositoryItem): string {
  if (!repo.checkSummary) return "No checks";
  const passed = repo.checkSummary.passed ?? 0;
  const total = repo.checkSummary.total ?? passed;
  if (total === 0) return "No checks";
  if (checkOk(repo)) return `${countLabel(total, "check")} passing`;
  return `${passed} of ${countLabel(total, "check")} passing`;
}
</script>

<template>
  <article v-if="loadState === 'error'" class="extension-placeholder" data-smoke="home-repositories">
    {{ error }}
  </article>
  <div v-else class="rail-section" data-smoke="home-repositories">
    <div class="rail-strap">
      <span class="id">04</span>
      <h3>Repositories</h3>
      <span class="count">{{ countLabel(repositories.length, "repository", "repositories") }}</span>
    </div>

    <div v-for="repo in repositories" :key="repo.id" class="repo">
      <span class="name">
        <span class="prefix">{{ groupPrefix(repo) }}</span>
        <span class="leaf">{{ repo.name ?? "(unnamed)" }}</span>
      </span>
      <span class="stats">
        <span>{{ pullRequestText(repo) }}</span>
        <span :class="checkOk(repo) ? 'ok' : 'warn'">{{ checkText(repo) }}</span>
        <span>{{ repo.lastCommitAt ?? "" }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.rail-section {
  display: grid;
  gap: 8px;
}

.rail-strap,
.repo {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.rail-strap h3 {
  margin: 0;
  font-family: var(--font-sans, system-ui);
  font-size: 14px;
  font-weight: 600;
}

.id,
.count,
.stats,
.prefix,
.extension-placeholder {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.count,
.stats,
.prefix,
.extension-placeholder {
  font-family: var(--font-sans, system-ui);
}

.id,
.count,
.stats,
.prefix {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.name {
  min-width: 0;
  font-family: var(--font-sans, system-ui);
  font-weight: 600;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ok {
  color: var(--ok, oklch(75% 0.15 150));
}

.warn {
  color: var(--err, oklch(70% 0.19 25));
}
</style>
