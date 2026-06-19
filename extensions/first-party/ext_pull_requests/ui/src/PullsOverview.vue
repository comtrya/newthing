<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { listPulls } from "./api";
import {
  defaultWorkspaceId,
  pullHref,
  pullsIndexHref,
  relativeTime,
  stateTone,
  type LoadState,
  type PullRequest,
} from "./types";

interface HostContext {
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}

const props = defineProps<{
  host?: HostContext;
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}>();


const pulls = ref<PullRequest[]>([]);
const loadState = ref<LoadState>("idle");

const workspaceId = computed(
  () => props.workspaceId ?? props.host?.workspaceId ?? defaultWorkspaceId(),
);
const repositoryId = computed(() => props.repositoryId ?? props.host?.repositoryId ?? null);
const repositoryPath = computed(() => props.repositoryPath ?? props.host?.repositoryPath ?? null);

const top = computed(() => {
  return pulls.value
    .filter((p) => p.state === "READY" || p.state === "DRAFT")
    .sort((a, b) => {
      const ad = Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0;
      const bd = Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0;
      return bd - ad;
    })
    .slice(0, 5);
});

const openCount = computed(
  () => pulls.value.filter((p) => p.state === "READY").length,
);

onMounted(() => void load());
watch(() => [workspaceId.value, repositoryId.value], () => void load());

function pullsListHref(): string {
  return pullsIndexHref(repositoryPath.value);
}

function pullDetailHref(pull: Pick<PullRequest, "id">): string {
  return pullHref(pull, repositoryPath.value);
}

async function load(): Promise<void> {
  loadState.value = "loading";
  try {
    pulls.value = await listPulls({
      workspaceId: workspaceId.value,
      repositoryId: repositoryId.value,
      limit: 32,
    });
    loadState.value = pulls.value.length > 0 ? "ready" : "empty";
  } catch {
    loadState.value = "error";
    pulls.value = [];
  }
}
</script>

<template>
  <section class="pulls-overview" data-smoke="pulls-overview">
    <header>
      <h3>Pull requests</h3>
      <a :href="pullsListHref()">{{ openCount }} open</a>
    </header>

    <p v-if="loadState === 'loading'" class="muted">Loading…</p>
    <p v-else-if="loadState === 'error'" class="muted">Could not load pulls.</p>
    <p v-else-if="top.length === 0" class="muted">No open pull requests.</p>

    <ul v-else>
      <li v-for="pull in top" :key="pull.id">
        <a :href="pullDetailHref(pull)">
          <span class="num">#{{ pull.number }}</span>
          <span class="title">{{ pull.title }}</span>
          <span :class="['state', stateTone(pull.state).className]">
            {{ stateTone(pull.state).label }}
          </span>
          <span class="age">{{ relativeTime(pull.updatedAt ?? pull.createdAt) }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pulls-overview {
  display: grid;
  gap: 8px;
}

.pulls-overview header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.pulls-overview h3 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 14px;
}

.pulls-overview header a,
.muted {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  text-decoration: none;
}

.pulls-overview ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;
}

.pulls-overview li a {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: baseline;
  padding: 6px 0;
  color: inherit;
  text-decoration: none;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.pulls-overview li:last-child a {
  border-bottom: 0;
}

.num {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.state {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  border: 0.5px solid currentColor;
  padding: 0 4px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.state.pr-state-ready {
  color: var(--accent-teal, #087f6f);
}

.state.pr-state-draft {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.state.pr-state-merged {
  color: var(--accent-blue, #1d55a6);
}

.state.pr-state-closed {
  color: var(--accent-err, #c9341c);
}

.age {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}
</style>
