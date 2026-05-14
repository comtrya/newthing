<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { listPulls } from "./api";
import {
  authorLabel,
  pullHref,
  pullsIndexHref,
  relativeTime,
  stateTone,
  type LoadState,
  type PullRequest,
} from "./types";

interface HostContext {
  workspaceId?: string;
  viewerRef?: string | null;
}

const props = defineProps<{
  host?: HostContext;
  workspaceId?: string;
  viewerRef?: string | null;
}>();

const DEFAULT_WORKSPACE_ID = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";

const pulls = ref<PullRequest[]>([]);
const loadState = ref<LoadState>("idle");

const workspaceId = computed(
  () => props.workspaceId ?? props.host?.workspaceId ?? DEFAULT_WORKSPACE_ID,
);
const viewerRef = computed(() => props.viewerRef ?? props.host?.viewerRef ?? null);

const authoredByViewer = computed(() => {
  if (!viewerRef.value) return pulls.value.filter((p) => p.state === "READY" || p.state === "DRAFT").slice(0, 5);
  return pulls.value
    .filter((p) => p.authorRef === viewerRef.value)
    .filter((p) => p.state === "READY" || p.state === "DRAFT")
    .slice(0, 5);
});

onMounted(() => void load());
watch(() => [workspaceId.value], () => void load());

async function load(): Promise<void> {
  loadState.value = "loading";
  try {
    pulls.value = await listPulls({
      workspaceId: workspaceId.value,
      limit: 64,
    });
    loadState.value = pulls.value.length > 0 ? "ready" : "empty";
  } catch {
    loadState.value = "error";
    pulls.value = [];
  }
}
</script>

<template>
  <section class="pulls-your-work" data-smoke="pulls-your-work">
    <header>
      <h3>Your pull requests</h3>
      <a :href="pullsIndexHref()">queue</a>
    </header>

    <p v-if="loadState === 'loading'" class="muted">Loading…</p>
    <p v-else-if="loadState === 'error'" class="muted">Could not load pulls.</p>
    <p v-else-if="authoredByViewer.length === 0" class="muted">
      Nothing here yet. Open a pull request to see it in this rail.
    </p>

    <ul v-else>
      <li v-for="pull in authoredByViewer" :key="pull.id">
        <a :href="pullHref(pull)">
          <span class="num">#{{ pull.number }}</span>
          <span class="title">{{ pull.title }}</span>
          <span :class="['state', stateTone(pull.state).className]">
            {{ stateTone(pull.state).label }}
          </span>
          <span class="meta">{{ authorLabel(pull.authorRef) }} · {{ relativeTime(pull.updatedAt ?? pull.createdAt) }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pulls-your-work {
  display: grid;
  gap: 8px;
}

.pulls-your-work header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.pulls-your-work h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.pulls-your-work header a,
.muted {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
  text-decoration: none;
}

.pulls-your-work ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
}

.pulls-your-work li a {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: baseline;
  padding: 8px 0;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.pulls-your-work li:last-child a {
  border-bottom: 0;
}

.num {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  grid-row: 1;
}

.state {
  font-family: var(--mono, monospace);
  font-size: 10px;
  border: 1px solid currentColor;
  padding: 0 4px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.state.pr-state-ready {
  color: var(--accent-teal, #087f6f);
}

.state.pr-state-draft {
  color: var(--ink-faint, #68645c);
}

.state.pr-state-merged {
  color: var(--accent-blue, #1d55a6);
}

.state.pr-state-closed {
  color: var(--accent-err, #c9341c);
}

.meta {
  grid-column: 1 / -1;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}
</style>
