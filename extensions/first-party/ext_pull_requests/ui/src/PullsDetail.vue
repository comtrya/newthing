<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getGraphQLClient, subscribeLiveEvents } from "@comtrya/sdk-core";
import { renderMarkdown, useShortcuts } from "@comtrya/sdk-vue";
import {
  closePull,
  getPull,
  listLinkedIssues,
  mergePull,
  type LinkedIssue,
} from "./api";
import DiffView from "./DiffView.vue";
import { parseUnifiedDiff } from "./diff";
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
// j/k focus index within the Closes panel. -1 means "no row focused";
// the first `j` press moves to 0. Reset whenever the linked list
// changes so a freshly-resolved set starts cold.
const focusedLinkedIdx = ref(-1);

/**
 * Projects declared by the repo's `package comtrya` CUE config,
 * loaded alongside the diff. Used to derive `affectedProjects[]`
 * from the diff's changed-file paths via longest-prefix-match
 * on each Project's `root` — the path called out in iter 24's
 * footer ("derive it in the UI from `repository.diff` +
 * `repository.comtryaConfig.projects`").
 */
interface CueProject {
  name?: string;
  root?: string;
  labels?: string[];
}
const projects = ref<CueProject[]>([]);

/**
 * Normalise a Project's CUE `root` field. `"."`, `""`, `"./"`
 * all mean "repo root"; everything else is a path prefix
 * (no trailing slash) we can use for longest-prefix-match.
 */
function normaliseRoot(root: string | undefined): string {
  const cleaned = (root ?? "").replace(/^\.\//, "").replace(/\/+$/g, "");
  return cleaned === "." ? "" : cleaned;
}

/**
 * Longest-prefix-match each changed file path against the
 * declared Project roots. A repo with `kernel = "crates/server"`
 * and `frontend = "frontend"` returns `["kernel", "frontend"]`
 * for a PR that touched files in both directories. Returns at
 * most one Project per changed file (the most-specific match).
 */
const affectedProjects = computed<string[]>(() => {
  if (projects.value.length === 0 || !diffPatch.value) return [];
  const ranked = projects.value
    .map((p) => ({ name: p.name ?? "", root: normaliseRoot(p.root) }))
    .filter((p) => p.name)
    .sort((a, b) => b.root.length - a.root.length); // longest first
  const seen = new Set<string>();
  for (const file of parseUnifiedDiff(diffPatch.value)) {
    const path = file.displayPath.replace(/^\/+/, "");
    for (const proj of ranked) {
      const matches =
        proj.root === ""
          ? true
          : path === proj.root || path.startsWith(`${proj.root}/`);
      if (matches) {
        seen.add(proj.name);
        break;
      }
    }
  }
  return Array.from(seen).sort();
});

const tone = computed(() => stateTone(pull.value?.state));
const canMerge = computed(
  () => pull.value && (pull.value.state === "READY" || pull.value.state === "DRAFT"),
);
const canClose = computed(
  () => pull.value && pull.value.state !== "CLOSED" && pull.value.state !== "MERGED",
);
const renderedBody = computed(() =>
  pull.value?.bodyMarkdown ? renderMarkdown(pull.value.bodyMarkdown) : "",
);

const linkedUnsubscribers: Array<() => void> = [];

onMounted(() => {
  void load();
  void loadDiff();
  void loadLinked();
  // When any issue in the workspace transitions state, a linked
  // target may have just opened/closed/reopened. Cheap response:
  // re-resolve the Closes panel on every issue event. Per-target
  // filtering can ship once the kernel emits a relation-scoped
  // topic.
  for (const type of [
    "dev.comtrya.issues.opened",
    "dev.comtrya.issues.closed",
    "dev.comtrya.issues.reopened",
  ]) {
    linkedUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void loadLinked(),
        onError: () => {},
      }),
    );
  }
});

onUnmounted(() => {
  for (const off of linkedUnsubscribers) off();
  linkedUnsubscribers.length = 0;
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
  // Closes-panel keyboard nav. `j`/`k` walk the linked-issue rows
  // (no-op when the panel is empty so the keys stay reserved for a
  // future diff-row nav); Enter opens the focused row in the
  // issues route. Mirrors the IssuesList row-nav recipe.
  j: (event) => {
    if (linkedIssues.value.length === 0) return;
    event.preventDefault();
    const next = focusedLinkedIdx.value + 1;
    focusedLinkedIdx.value = next >= linkedIssues.value.length ? 0 : next;
  },
  k: (event) => {
    if (linkedIssues.value.length === 0) return;
    event.preventDefault();
    const next = focusedLinkedIdx.value - 1;
    focusedLinkedIdx.value = next < 0 ? linkedIssues.value.length - 1 : next;
  },
  Enter: (event) => {
    if (focusedLinkedIdx.value < 0) return;
    const issue = linkedIssues.value[focusedLinkedIdx.value];
    if (!issue) return;
    event.preventDefault();
    window.location.href = issueHref(issue);
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
  focusedLinkedIdx.value = -1;
}

function issueHref(issue: LinkedIssue): string {
  if (issue.workspaceId && issue.number !== null) {
    return `/x/issues/${issue.workspaceId}/${issue.number}`;
  }
  return "/x/issues/";
}

function projectHref(projectName: string): string {
  return `/x/issues/?project=${encodeURIComponent(projectName)}`;
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
      repository?: {
        diff?: { path?: string; patch?: string } | null;
        comtryaConfig?: { projects?: CueProject[] | null } | null;
      };
    }>(
      `query PullDiff {
        repository {
          diff { path language patch }
          comtryaConfig
        }
      }`,
    );
    const diff = data.repository?.diff;
    diffPatch.value = diff?.patch ?? "";
    diffPath.value = diff?.path ?? "";
    projects.value = data.repository?.comtryaConfig?.projects ?? [];
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
        <div class="pulls-chip-row" aria-label="Pull request metadata">
          <span :class="['pull-chip', 'tone-state', tone.className]">{{ tone.label }}</span>
          <span class="pull-chip tone-branch">
            <code>{{ pull.headRef }}</code>
            <span class="branch-arrow" aria-hidden="true">→</span>
            <code>{{ pull.baseRef }}</code>
          </span>
          <span
            v-for="project in affectedProjects"
            :key="`project-${project}`"
            class="pull-chip tone-project"
            :title="`Touches files inside the ${project} Project's root`"
          >
            <span class="chip-glyph">◇</span>{{ project }}
          </span>
          <span
            class="pull-chip tone-author"
            :data-author-kind="classifyAuthor(pull.authorRef).kind"
            :title="`Opened by ${pull.authorRef}`"
          >
            <span class="chip-glyph">{{ classifyAuthor(pull.authorRef).glyph }}</span>
            by {{ classifyAuthor(pull.authorRef).label }}
          </span>
          <span v-if="pull.mergedAt" class="pull-chip tone-time tone-merged">
            merged {{ relativeTime(pull.mergedAt) }}
          </span>
          <span v-else-if="pull.closedAt" class="pull-chip tone-time tone-closed">
            closed {{ relativeTime(pull.closedAt) }}
          </span>
          <span v-if="pull.createdAt" class="pull-chip tone-time">
            opened {{ relativeTime(pull.createdAt) }}
          </span>
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

      <section v-if="renderedBody" class="pulls-detail-body">
        <h2>Description</h2>
        <div class="pulls-detail-body-prose" v-html="renderedBody" />
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
        <ul v-if="linkedIssues.length > 0" role="listbox" aria-label="Linked issues">
          <li
            v-for="(issue, idx) in linkedIssues"
            :key="issue.uri"
            :class="{ focused: idx === focusedLinkedIdx }"
            :aria-selected="idx === focusedLinkedIdx"
            role="option"
            @mouseenter="focusedLinkedIdx = idx"
          >
            <a :href="issueHref(issue)">
              <span class="issue-num">
                <template v-if="issue.number !== null">#{{ issue.number }}</template>
                <template v-else>issue</template>
              </span>
              <span class="issue-title">{{ issue.title }}</span>
              <a
                v-if="issue.projectName"
                class="issue-project"
                :href="projectHref(issue.projectName)"
                :title="`Filter to project ${issue.projectName}`"
                @click.stop
              >◇ {{ issue.projectName }}</a>
              <span :class="['issue-state', issueStateClass(issue.state)]">
                {{ issue.state.toLowerCase() }}
              </span>
            </a>
          </li>
        </ul>
        <footer v-if="linkedIssues.length > 0" class="pulls-linked-foot">
          <kbd>j</kbd> <kbd>k</kbd> walk · <kbd>↵</kbd> open
        </footer>
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

/**
 * Editorial chip row — same shape as IssueDetail's chip strip
 * (iteration 38), RepoHome (iter 28), ProjectHome (iter 30). Every
 * routing fact about this PR (state, branch arrow, author,
 * timestamps) reads as a chip with consistent borders and tone.
 */
.pulls-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 0;
  align-items: center;
}

.pull-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--rule-light, #d8d1c4);
  font-family: var(--mono, monospace);
  font-size: 11px;
  line-height: 16px;
  color: var(--ink-soft, #2c2b28);
}

.pull-chip .chip-glyph {
  width: 13px;
  height: 13px;
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
}

.pull-chip.tone-state {
  border-color: currentColor;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}

.pull-chip.tone-state.pr-state-ready   { color: var(--accent-teal, #087f6f); }
.pull-chip.tone-state.pr-state-draft   { color: var(--ink-faint, #68645c); }
.pull-chip.tone-state.pr-state-merged  { color: var(--accent-blue, #1d55a6); }
.pull-chip.tone-state.pr-state-closed  { color: var(--accent-err, #c9341c); }

.pull-chip.tone-project {
  color: var(--accent-blue, #1d55a6);
  border-color: currentColor;
  cursor: help;
}

.pull-chip.tone-branch {
  gap: 4px;
}

.pull-chip.tone-branch code {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-soft, #2c2b28);
}

.pull-chip.tone-branch .branch-arrow {
  color: var(--ink-fainter, #918b80);
  padding: 0 2px;
}

.pull-chip.tone-author {
  color: var(--ink-soft, #2c2b28);
}

.pull-chip.tone-author[data-author-kind="agent"]      { color: #6b3fa0; }
.pull-chip.tone-author[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }
.pull-chip.tone-author[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.pull-chip.tone-author[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }

.pull-chip.tone-time {
  color: var(--ink-faint, #68645c);
  border-style: none;
  padding-left: 2px;
}

.pull-chip.tone-time.tone-merged { color: var(--accent-blue, #1d55a6); }
.pull-chip.tone-time.tone-closed { color: var(--accent-err, #c9341c); }

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

.pulls-detail-body-prose {
  color: var(--ink, #1a1916);
  font-size: 14px;
  line-height: 1.6;
}

.pulls-detail-body-prose h1,
.pulls-detail-body-prose h2,
.pulls-detail-body-prose h3,
.pulls-detail-body-prose h4,
.pulls-detail-body-prose h5,
.pulls-detail-body-prose h6 {
  margin: 1.1em 0 0.4em;
  font-family: var(--display, system-ui);
  font-weight: 600;
  line-height: 1.25;
}

.pulls-detail-body-prose h1 {
  font-size: 20px;
}

.pulls-detail-body-prose h2 {
  font-size: 17px;
}

.pulls-detail-body-prose h3,
.pulls-detail-body-prose h4 {
  font-size: 15px;
}

.pulls-detail-body-prose p {
  margin: 0.55em 0;
}

.pulls-detail-body-prose ul,
.pulls-detail-body-prose ol {
  margin: 0.4em 0 0.6em;
  padding-left: 22px;
}

.pulls-detail-body-prose li {
  margin: 0.15em 0;
}

.pulls-detail-body-prose code {
  font-family: var(--mono, monospace);
  font-size: 0.88em;
  padding: 1px 5px;
  background: var(--ink-tint, #f2efe6);
  border-radius: 2px;
}

.pulls-detail-body-prose pre {
  margin: 0.7em 0;
  padding: 12px 14px;
  font-family: var(--mono, monospace);
  font-size: 12.5px;
  line-height: 1.55;
  background: var(--ink-tint, #f2efe6);
  border: 1px solid var(--ink-rule, #d8d6cf);
  overflow-x: auto;
  white-space: pre;
  word-break: normal;
}

.pulls-detail-body-prose pre code {
  padding: 0;
  background: transparent;
  font-size: inherit;
}

.pulls-detail-body-prose a {
  color: var(--accent-teal, #087f6f);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.pulls-detail-body-prose strong {
  font-weight: 600;
}

.pulls-detail-body-prose em {
  font-style: italic;
}

.pulls-detail-body.muted p {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
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

.pulls-linked-issues li {
  position: relative;
}

.pulls-linked-issues li.focused {
  box-shadow: inset 3px 0 0 var(--ink, #111);
}

.pulls-linked-issues li.focused a {
  background: var(--paper-tint, #f2efe7);
}

.pulls-linked-issues li a {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: baseline;
  padding: 8px 10px;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.pulls-linked-issues li:last-child a {
  border-bottom: 0;
}

.pulls-linked-issues .issue-project {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
  text-decoration: none;
  border: 1px solid var(--rule-light, #d8d1c4);
  padding: 1px 7px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.pulls-linked-issues .issue-project:hover {
  color: var(--ink, #111);
  border-color: var(--ink, #111);
}

.pulls-linked-foot {
  margin-top: 6px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
  letter-spacing: 0.04em;
}

.pulls-linked-foot kbd {
  font-family: var(--mono, monospace);
  font-size: 10px;
  border: 1px solid var(--rule-light, #d8d1c4);
  padding: 0 4px;
  margin: 0 1px;
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
