<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getGraphQLClient } from "@comtrya/sdk-core";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";
import {
  filterRepositories,
  repositoryCountLabel,
  type RepositoryListRow,
} from "./repos-list";

interface RepoSummary extends RepositoryListRow {
  id: string;
  name: string;
  path: string;
  groups: string[];
  openPullRequests: number | null;
}

const repos = ref<RepoSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const filterText = ref("");

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const envelope = await getGraphQLClient().query<{
      workspace?: {
        repositories?: RepoSummary[];
      } | null;
    }>(
      "{ workspace { repositories { id name path groups openPullRequests } } }",
    );
    repos.value = envelope.workspace?.repositories ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    repos.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const visibleRepos = computed(() =>
  filterRepositories(repos.value, filterText.value),
);
const repositoryCount = computed(() =>
  repositoryCountLabel(repos.value.length, visibleRepos.value.length),
);
</script>

<template>
  <div class="repos-page">
    <header class="hairline-b repos-head">
      <div class="repos-head-titles">
        <div class="eyebrow">{{ repositoryCount }}</div>
        <h1 class="repos-title">Repositories</h1>
      </div>
      <div class="repos-head-actions">
        <label class="repo-filter">
          <Icon name="search" aria-hidden="true" />
          <input
            v-model="filterText"
            type="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="Find a repository..."
            aria-label="Find a repository"
          />
        </label>
        <RouterLink to="/new" class="btn btn-primary">
          <Icon name="plus" /><span>New repository</span>
        </RouterLink>
      </div>
    </header>

    <div class="repos-body no-scrollbar">
      <p v-if="loading" class="repos-state">Loading repositories…</p>
      <p v-else-if="error" class="repos-state repos-state-err" role="alert">{{ error }}</p>
      <p v-else-if="repos.length === 0" class="repos-state">
        No repositories yet. <RouterLink to="/new" class="repos-state-link">Create a repository</RouterLink>
        to get started.
      </p>
      <p v-else-if="visibleRepos.length === 0" class="repos-state">
        No repositories match "{{ filterText }}".
        <button type="button" class="repos-state-button" @click="filterText = ''">Clear search</button>
      </p>

      <ul v-else class="repo-list">
        <li v-for="repo in visibleRepos" :key="repo.id" class="repo-card glass-thin">
          <RouterLink
            :to="`/r/${repo.path}`"
            class="repo-link"
            :aria-label="`Open repository ${repo.path}`"
          >
            <div class="repo-row">
              <span class="repo-icon"><Icon name="folder" aria-hidden="true" /></span>
              <span class="repo-path-block">
                <span class="repo-path">{{ repo.path }}</span>
                <span v-if="repo.groups.length > 0" class="repo-groups">{{ repo.groups.join(" / ") }}</span>
              </span>
              <span class="spacer" />
              <Chip v-if="(repo.openPullRequests ?? 0) > 0" :mono="true" tone="info">
                {{ repo.openPullRequests }} open pull {{ repo.openPullRequests === 1 ? "request" : "requests" }}
              </Chip>
            </div>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.repos-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.repos-head {
  padding: 22px 28px;
  display: flex;
  align-items: flex-end;
  gap: 18px;
}
.repos-head-titles { flex: 1; }
.repos-title {
  font-family: var(--font-sans);
  font-size: 28px;
  line-height: 1.05;
  margin: 0;
  font-weight: 600;
  letter-spacing: 0;
}
.repos-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repo-filter {
  width: min(320px, 32vw);
  height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 0.5px solid var(--line);
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--fg-3);
}
.repo-filter:focus-within {
  border-color: var(--accent);
  color: var(--fg-2);
}
.repo-filter input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--fg);
  font: inherit;
  font-size: 13px;
}
.repo-filter input::placeholder { color: var(--fg-3); }

.repos-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 28px;
}

.repos-state {
  font-size: 13px;
  color: var(--fg-2);
}
.repos-state-err { color: var(--err); }
.repos-state-link {
  color: var(--accent);
  text-decoration: none;
}
.repos-state-button {
  border: 0;
  padding: 0;
  color: var(--accent);
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.repo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.repo-card { padding: 0; }
.repo-link {
  display: block;
  padding: 14px 16px;
  color: inherit;
  text-decoration: none;
}
.repo-link:hover { background: var(--surface-2); }

.repo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.repo-icon { color: var(--fg-3); display: inline-flex; }
.repo-path-block {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.repo-path {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--fg);
  overflow-wrap: anywhere;
}
.repo-groups {
  color: var(--fg-3);
  font-size: 11px;
}
.spacer { flex: 1; }
.repo-description {
  font-size: 12px;
  color: var(--fg-3);
  line-height: 1.45;
  margin: 6px 0 0 24px;
}

@media (max-width: 640px) {
  .repos-head { padding: 16px 14px; flex-direction: column; align-items: stretch; gap: 12px; }
  .repos-head-actions { flex-direction: column; align-items: stretch; }
  .repo-filter { width: auto; }
  .repos-body { padding: 14px; }
  .repo-list { grid-template-columns: 1fr; }
}
</style>
