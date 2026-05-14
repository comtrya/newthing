<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getGraphQLClient } from "@comtrya/sdk-core";
import { useShortcuts } from "@comtrya/sdk-vue";
import {
  closePull,
  getPull,
  listLinkedIssues,
  mergePull,
  type LinkedIssue,
} from "./api";
import DiffView from "./DiffView.vue";
import {
  classifyAuthor,
  pullsIndexHref,
  relativeTime,
  stateTone,
  type ExtensionRouteParams,
  type LoadState,
  type PullRequest,
} from "./types";

const props = defineProps<{
  routeParams?: ExtensionRouteParams;
}>();

const pullId = computed(() => props.routeParams?.params?.pullId ?? "");
const pull = ref<PullRequest | null>(null);
const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const actionState = ref<"idle" | "merging" | "closing">("idle");
const actionMessage = ref<string | null>(null);
const diffPatch = ref<string>("");
const diffPath = ref<string>("");
const diffState = ref<"idle" | "loading" | "ready" | "error">("idle");
const diffError = ref<string | null>(null);
const linkedIssues = ref<LinkedIssue[]>([]);
const linkedState = ref<"idle" | "loading" | "ready" | "error">("idle");

const tone = computed(() => stateTone(pull.value?.state));
const canMerge = computed(
  () => pull.value && (pull.value.state === "READY" || pull.value.state === "DRAFT"),
);
const canClose = computed(
  () => pull.value && pull.value.state !== "CLOSED" && pull.value.state !== "MERGED",
);

onMounted(() => {
  void load();
  void loadDiff();
  void loadLinked();
});

watch(pullId, () => void loadLinked());

useShortcuts({
  m: (event) => {
    if (!canMerge.value) return;
    event.preventDefault();
    void onMerge();
  },
  x: (event) => {
    if (!canClose.value) return;
    event.preventDefault();
    void onClose();
  },
  Escape: (event) => {
    // Defer to overlays (palette / shortcuts overlay) when one is open.
    if (document.querySelector(".shortcuts-backdrop, .palette-backdrop")) return;
    event.preventDefault();
    window.location.href = pullsIndexHref();
  },
});

watch(pullId, () => void load());

async function load(): Promise<void> {
  if (!pullId.value) {
    loadState.value = "error";
    error.value = "Missing pull id";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    pull.value = await getPull(pullId.value);
    loadState.value = pull.value ? "ready" : "empty";
  } catch (caught) {
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

/**
 * Load the diff for this PR. The kernel does not yet expose a per-PR
 * `gitDiff(head, base)` field; until it does, we surface the workspace
 * repository's `diff` (currently `main~1...main` against the seeded
 * repo) so the review UI is real and exercised. Swap the query body
 * once the kernel adds the per-PR field — the component contract is
 * stable.
 */
async function loadLinked(): Promise<void> {
  if (!pullId.value) return;
  linkedState.value = "loading";
  try {
    linkedIssues.value = await listLinkedIssues(pullId.value);
    linkedState.value = "ready";
  } catch {
    linkedIssues.value = [];
    linkedState.value = "error";
  }
}

function issueHref(issue: LinkedIssue): string {
  if (issue.id) return `/x/issues/${issue.id}`;
  return "/x/issues/";
}

function issueStateClass(state: LinkedIssue["state"]): string {
  switch (state) {
    case "CLOSED":
      return "issue-state-closed";
    case "REOPENED":
    case "OPEN":
    default:
      return "issue-state-open";
  }
}

async function loadDiff(): Promise<void> {
  diffState.value = "loading";
  diffError.value = null;
  try {
    const data = await getGraphQLClient().query<{
      repository?: { diff?: { path?: string; patch?: string } | null };
    }>(
      `query PullDiff {
        repository { diff { path language patch } }
      }`,
    );
    const diff = data.repository?.diff;
    diffPatch.value = diff?.patch ?? "";
    diffPath.value = diff?.path ?? "";
    diffState.value = "ready";
  } catch (caught) {
    diffState.value = "error";
    diffError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function onMerge(): Promise<void> {
  if (!pull.value || !canMerge.value) return;
  actionState.value = "merging";
  actionMessage.value = null;
  try {
    pull.value = await mergePull(pull.value.id);
    actionMessage.value = `Merged pull #${pull.value.number}`;
  } catch (caught) {
    actionMessage.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

async function onClose(): Promise<void> {
  if (!pull.value || !canClose.value) return;
  actionState.value = "closing";
  actionMessage.value = null;
  try {
    pull.value = await closePull(pull.value.id);
    actionMessage.value = `Closed pull #${pull.value.number}`;
  } catch (caught) {
    actionMessage.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

</script>

<template>
  <article class="pulls-detail" data-smoke="pulls-detail">
    <p v-if="loadState === 'loading'" class="pulls-empty">Loading pull request…</p>
    <p v-else-if="loadState === 'error'" class="pulls-error" role="alert">{{ error }}</p>
    <p v-else-if="loadState === 'empty' || !pull" class="pulls-empty">
      No pull request found for <code>{{ pullId }}</code>.
      <a :href="pullsIndexHref()">← back to queue</a>
    </p>

    <template v-else>
      <header class="pulls-detail-head">
        <div class="pulls-detail-title">
          <a :href="pullsIndexHref()" class="back" aria-label="Back to pull request queue">←</a>
          <span class="pulls-detail-number">#{{ pull.number }}</span>
          <h1>{{ pull.title }}</h1>
        </div>
        <div class="pulls-detail-meta">
          <span :class="['pulls-state', tone.className]">{{ tone.label }}</span>
          <code class="pulls-branch">
            {{ pull.headRef }} <span>→</span> {{ pull.baseRef }}
          </code>
          <span class="pulls-author" :data-author-kind="classifyAuthor(pull.authorRef).kind">
            <span class="author-glyph">{{ classifyAuthor(pull.authorRef).glyph }}</span>
            by {{ classifyAuthor(pull.authorRef).label }}
            <span
              v-if="classifyAuthor(pull.authorRef).kind === 'agent'"
              class="author-badge"
            >agent</span>
            <span
              v-else-if="classifyAuthor(pull.authorRef).kind === 'credential'"
              class="author-badge"
            >bot</span>
            <span
              v-else-if="classifyAuthor(pull.authorRef).kind === 'bot'"
              class="author-badge"
            >bot</span>
          </span>
          <span v-if="pull.createdAt">opened {{ relativeTime(pull.createdAt) }}</span>
          <span v-if="pull.mergedAt">merged {{ relativeTime(pull.mergedAt) }}</span>
          <span v-else-if="pull.closedAt">closed {{ relativeTime(pull.closedAt) }}</span>
        </div>
      </header>

      <section class="pulls-detail-actions">
        <button
          type="button"
          class="pulls-action primary"
          :disabled="!canMerge || actionState !== 'idle'"
          @click="onMerge"
        >
          {{ actionState === "merging" ? "Merging…" : "Merge" }}
          <kbd>m</kbd>
        </button>
        <button
          type="button"
          class="pulls-action"
          :disabled="!canClose || actionState !== 'idle'"
          @click="onClose"
        >
          {{ actionState === "closing" ? "Closing…" : "Close" }}
          <kbd>x</kbd>
        </button>
        <span v-if="actionMessage" class="pulls-action-message">{{ actionMessage }}</span>
      </section>

      <section v-if="pull.bodyMarkdown" class="pulls-detail-body">
        <h2>Description</h2>
        <pre>{{ pull.bodyMarkdown }}</pre>
      </section>
      <section v-else class="pulls-detail-body muted">
        <h2>Description</h2>
        <p>No description provided.</p>
      </section>

      <section
        v-if="linkedState !== 'idle' || linkedIssues.length > 0"
        class="pulls-linked-issues"
        data-smoke="pulls-linked-issues"
      >
        <header>
          <h2>Closes</h2>
          <span class="muted">
            <template v-if="linkedState === 'loading'">resolving…</template>
            <template v-else-if="linkedIssues.length === 0">
              no linked issues
            </template>
            <template v-else>
              {{ linkedIssues.length }} issue<template v-if="linkedIssues.length !== 1">s</template>
              <template v-if="pull.state === 'MERGED'"> — auto-closed on merge</template>
              <template v-else> — will close on merge</template>
            </template>
          </span>
        </header>
        <ul v-if="linkedIssues.length > 0">
          <li v-for="issue in linkedIssues" :key="issue.uri">
            <a :href="issueHref(issue)">
              <span class="issue-num">
                <template v-if="issue.number !== null">#{{ issue.number }}</template>
                <template v-else>issue</template>
              </span>
              <span class="issue-title">{{ issue.title }}</span>
              <span :class="['issue-state', issueStateClass(issue.state)]">
                {{ issue.state.toLowerCase() }}
              </span>
            </a>
          </li>
        </ul>
      </section>

      <DiffView
        :patch="diffPatch"
        :loading="diffState === 'loading'"
        :error="diffError"
      />
    </template>
  </article>
</template>

<style scoped>
.pulls-detail {
  display: grid;
  gap: 22px;
  font-family: var(--sans, system-ui);
}

.pulls-detail-head {
  display: grid;
  gap: 12px;
  border-bottom: 1.5px solid var(--ink, #111);
  padding-bottom: 16px;
}

.pulls-detail-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.pulls-detail-title h1 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 28px;
  line-height: 1.1;
  flex: 1 1 320px;
}

.back {
  font-family: var(--mono, monospace);
  font-size: 16px;
  color: var(--ink-faint, #68645c);
  text-decoration: none;
}

.back:hover {
  color: var(--ink, #111);
}

.pulls-detail-number {
  font-family: var(--mono, monospace);
  font-size: 14px;
  color: var(--ink-faint, #68645c);
}

.pulls-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: baseline;
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.pulls-state {
  border: 1px solid currentColor;
  padding: 0 6px;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pulls-state.pr-state-ready {
  color: var(--accent-teal, #087f6f);
}

.pulls-state.pr-state-draft {
  color: var(--ink-faint, #68645c);
}

.pulls-state.pr-state-merged {
  color: var(--accent-blue, #1d55a6);
}

.pulls-state.pr-state-closed {
  color: var(--accent-err, #c9341c);
}

.pulls-branch {
  color: var(--ink-soft, #2c2b28);
}

.pulls-branch span {
  color: var(--ink-fainter, #918b80);
  padding: 0 4px;
}

.pulls-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.pulls-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid var(--ink, #111);
  background: var(--paper, #fffdf8);
  color: var(--ink, #111);
  padding: 8px 14px;
  font-family: var(--display, system-ui);
  font-weight: 600;
  cursor: pointer;
}

.pulls-action.primary {
  background: var(--ink, #111);
  color: var(--paper, #fffdf8);
}

.pulls-action[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.pulls-action kbd {
  border: 1px solid currentColor;
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
  opacity: 0.6;
}

.pulls-action-message {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.pulls-detail-body h2 {
  margin: 0 0 8px;
  font-family: var(--display, system-ui);
  font-size: 16px;
}

.pulls-detail-body pre {
  margin: 0;
  font-family: var(--mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--ink-soft, #2c2b28);
}

.pulls-detail-body.muted p {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.pulls-detail-meta .pulls-author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pulls-detail-meta .author-glyph {
  width: 14px;
  height: 14px;
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid currentColor;
  color: var(--ink-faint, #68645c);
}

.pulls-detail-meta .pulls-author[data-author-kind="agent"] .author-glyph,
.pulls-detail-meta .pulls-author[data-author-kind="agent"] .author-badge,
.pulls-detail-meta .pulls-author[data-author-kind="agent"] {
  color: #6b3fa0;
}

.pulls-detail-meta .pulls-author[data-author-kind="credential"] .author-glyph,
.pulls-detail-meta .pulls-author[data-author-kind="credential"] .author-badge,
.pulls-detail-meta .pulls-author[data-author-kind="credential"] {
  color: var(--accent-yellow, #c89300);
}

.pulls-detail-meta .pulls-author[data-author-kind="bot"] .author-glyph,
.pulls-detail-meta .pulls-author[data-author-kind="bot"] .author-badge,
.pulls-detail-meta .pulls-author[data-author-kind="bot"] {
  color: var(--accent-blue, #1d55a6);
}

.pulls-detail-meta .author-badge {
  border: 1px solid currentColor;
  padding: 0 4px;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pulls-linked-issues {
  display: grid;
  gap: 8px;
}

.pulls-linked-issues header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1.5px solid var(--ink, #111);
  padding-bottom: 4px;
}

.pulls-linked-issues h2 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 18px;
}

.pulls-linked-issues .muted {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.pulls-linked-issues ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
}

.pulls-linked-issues li a {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: baseline;
  padding: 8px 0;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.pulls-linked-issues li:last-child a {
  border-bottom: 0;
}

.pulls-linked-issues .issue-num {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
  font-variant-numeric: tabular-nums;
}

.pulls-linked-issues .issue-title {
  font-family: var(--display, system-ui);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pulls-linked-issues .issue-state {
  font-family: var(--mono, monospace);
  font-size: 10px;
  border: 1px solid currentColor;
  padding: 0 5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pulls-linked-issues .issue-state-open {
  color: var(--accent-teal, #087f6f);
}

.pulls-linked-issues .issue-state-closed {
  color: var(--accent-blue, #1d55a6);
}

.pulls-empty,
.pulls-error {
  font-family: var(--mono, monospace);
  font-size: 13px;
  color: var(--ink-faint, #68645c);
}

.pulls-error {
  color: var(--accent-err, #c9341c);
}
</style>
