<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";

interface RepoSummary {
  id: string;
  name: string;
  path: string;
  groups: string[];
  openPullRequests: number | null;
}

const repos = ref<RepoSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query:
          "{ workspace { repositories { id name path groups openPullRequests } } }",
      }),
    });
    const envelope = (await response.json()) as {
      data?: {
        workspace?: {
          repositories?: RepoSummary[];
        };
      };
    };
    repos.value = envelope.data?.workspace?.repositories ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    repos.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const sortedRepos = computed(() =>
  [...repos.value].sort((a, b) => a.path.localeCompare(b.path)),
);
</script>

<template>
  <div class="repos-page">
    <header class="hairline-b repos-head">
      <div class="repos-head-titles">
        <div class="eyebrow">{{ sortedRepos.length }} repositories in this workspace</div>
        <h1 class="repos-title">Repositories</h1>
      </div>
      <div class="repos-head-actions">
        <RouterLink to="/new" class="btn btn-primary">
          <Icon name="plus" /><span>New repository</span>
        </RouterLink>
      </div>
    </header>

    <div class="repos-body no-scrollbar">
      <p v-if="loading" class="repos-state">Loading repositories…</p>
      <p v-else-if="error" class="repos-state repos-state-err" role="alert">{{ error }}</p>
      <p v-else-if="sortedRepos.length === 0" class="repos-state">
        No repositories yet. <RouterLink to="/new" class="repos-state-link">Create one</RouterLink>
        to get started.
      </p>

      <ul v-else class="repo-list">
        <li v-for="repo in sortedRepos" :key="repo.id" class="repo-card glass-thin">
          <RouterLink :to="`/r/${repo.path}`" class="repo-link">
            <div class="repo-row">
              <span class="repo-icon"><Icon name="folder" /></span>
              <span class="repo-path">{{ repo.path }}</span>
              <span class="spacer" />
              <Chip v-if="(repo.openPullRequests ?? 0) > 0" :mono="true" tone="info">
                {{ repo.openPullRequests }} open
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
  gap: 8px;
}

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
.repo-path {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--fg);
  flex-shrink: 0;
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
  .repos-body { padding: 14px; }
  .repo-list { grid-template-columns: 1fr; }
}
</style>
