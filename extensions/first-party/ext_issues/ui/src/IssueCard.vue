<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { issueByRef } from "./api";
import {
  issueHref,
  stateTone,
  type ComtryaGraphQLClient,
  type Issue,
  type LoadState,
} from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  issue?: Issue | null;
  ref?: string;
  resourceRef?: string;
}>();

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const loadedIssue = ref<Issue | null>(props.issue ?? null);
const resolvedRef = computed(() => props.resourceRef ?? props.ref ?? "");
const graphClient = computed(() => props.client ?? props.comtryaClient);
const issue = computed(() => props.issue ?? loadedIssue.value);
const tone = computed(() => stateTone(issue.value?.state));
const labelText = computed(() => issue.value?.labels?.join(", ") ?? "");
const targetHref = computed(() =>
  issue.value ? issueHref(issue.value) : "#",
);

onMounted(loadIssue);
watch(
  () => [graphClient.value, props.issue, resolvedRef.value],
  () => void loadIssue(),
);

async function loadIssue(): Promise<void> {
  if (props.issue) {
    loadedIssue.value = props.issue;
    loadState.value = "ready";
    error.value = null;
    return;
  }
  if (!resolvedRef.value) {
    loadedIssue.value = null;
    loadState.value = "error";
    error.value = "issue-card: missing ref";
    return;
  }
  if (!graphClient.value) {
    loadedIssue.value = null;
    loadState.value = "error";
    error.value = "issue-card: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    loadedIssue.value = await issueByRef(graphClient.value, resolvedRef.value);
    loadState.value = loadedIssue.value ? "ready" : "empty";
  } catch (caught) {
    loadedIssue.value = null;
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}
</script>

<template>
  <article
    class="issue-card"
    :data-state="loadState"
    data-smoke="issue-card"
  >
    <template v-if="issue">
      <div
        class="issue-card-body"
        :data-issue-id="issue.id"
        data-smoke="issue-card-body"
      >
        <div class="issue-card-title">
          <span class="issue-pill" :class="tone.className">{{ tone.label }}</span>
          <span class="issue-number">#{{ issue.number }}</span>
          <a class="issue-title-link" :href="targetHref">{{ issue.title }}</a>
        </div>
        <div class="issue-meta">
          <span>by {{ issue.authorRef ?? "unknown" }}</span>
          <span v-if="labelText">{{ labelText }}</span>
        </div>
      </div>
    </template>
    <p v-else-if="loadState === 'loading'" class="issue-line muted">
      Loading {{ resolvedRef }}
    </p>
    <div v-else class="issue-card-fallback">
      <p class="issue-line muted">{{ resolvedRef || "issue" }}</p>
      <p class="issue-line warn">{{ error ?? "issue not found" }}</p>
    </div>
  </article>
</template>

<style scoped>
.issue-card {
  display: block;
}

.issue-card-body {
  padding: 8px 12px;
  border: 1px solid var(--ink-rule, #d0cfc8);
}

.issue-card-title {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

.issue-pill,
.issue-number,
.issue-meta,
.issue-line {
  font-family: var(--mono, monospace);
}

.issue-pill {
  padding: 1px 8px;
  border: 1px solid currentColor;
  font-size: 10px;
}

.issue-state-open {
  color: var(--ink-go, #008873);
}

.issue-state-closed {
  color: var(--ink-faint, #888);
}

.issue-number,
.issue-meta {
  color: var(--ink-faint, #888);
}

.issue-number {
  font-size: 12px;
}

.issue-title-link {
  min-width: 0;
  color: inherit;
  font-family: var(--display, system-ui);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.issue-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
}

.issue-line {
  margin: 4px 0;
  font-size: 12px;
}

.muted {
  color: var(--ink-faint, #888);
}

.warn {
  color: var(--ink-warn, #c2410c);
}
</style>
