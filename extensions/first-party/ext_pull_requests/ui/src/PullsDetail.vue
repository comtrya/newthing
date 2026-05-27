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
import CustomElementHost from "./CustomElementHost.vue";
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
interface CueOwnerRef {
  kind?: string;
  slug?: string;
  ref?: string;
}
interface CueProject {
  name?: string;
  root?: string;
  labels?: string[];
  /**
   * Project owners declared by the repo's `package comtrya` CUE.
   * The kernel emits these as typed `#Ref` records (`{kind, slug,
   * ref}` since iter 26). Surfaced on the PR detail's "Routed to"
   * panel so a reviewer can see who the PR routes through without
   * leaving the page.
   */
  owners?: CueOwnerRef[];
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

/**
 * Project names derived from the PR's linked issues - each
 * `LinkedIssue.projectName` is one piece of routing evidence. A PR
 * that closes issues in projects `kernel` and `frontend` should
 * surface both, even when its diff doesn't touch those project
 * roots (e.g. a docs-only PR closing a kernel issue).
 */
const projectsFromLinks = computed<string[]>(() => {
  const names = new Set<string>();
  for (const issue of linkedIssues.value) {
    if (issue.projectName) names.add(issue.projectName);
  }
  return Array.from(names).sort();
});

/**
 * Routing fact: every Project this PR touches, derived from
 * either (a) the diff's changed paths (`affectedProjects`,
 * iter 42) or (b) issues this PR closes (`projectsFromLinks`,
 * iter 54 metadata). The union is what shows up in the "Routed
 * to" panel below, with the CUE-declared owners per project so
 * the reviewer sees who is on the hook.
 */
const routedProjectsWithOwners = computed<Array<{
  name: string;
  owners: string[];
}>>(() => {
  const names = new Set<string>([
    ...affectedProjects.value,
    ...projectsFromLinks.value,
  ]);
  const ordered = Array.from(names).sort();
  return ordered.map((name) => {
    const project = projects.value.find((p) => p.name === name);
    const owners = (project?.owners ?? [])
      .map((owner) => owner?.ref)
      .filter((ref): ref is string => typeof ref === "string" && ref.length > 0);
    return { name, owners };
  });
});

// Owner classifier moved to `@comtrya/sdk-vue` (iter 62);
// re-exported through `./types` as `classifyAuthor` and used
// directly here for owner chips on the "Routed to" panel.
const classifyOwner = classifyAuthor;

const tone = computed(() => stateTone(pull.value?.state));
const canMerge = computed(
  () => pull.value && (pull.value.state === "READY" || pull.value.state === "DRAFT"),
);
const canClose = computed(
  () => pull.value && pull.value.state !== "CLOSED" && pull.value.state !== "MERGED",
);
// Hardcoded default workspace matches the rest of ext_pull_requests
// (PullsQueue, PullsOverview, PullsYourWork); swap to a real
// resolver when the multi-workspace surface lands.
const renderedBody = computed(() =>
  pull.value?.bodyMarkdown
    ? renderMarkdown(pull.value.bodyMarkdown, { workspaceId: defaultWorkspaceId() })
    : "",
);

/**
 * URI for the pull's comment thread. Comments are scoped per
 * resource URI (kernel-owned, see comments.wit); pull-requests are
 * addressed as `comtrya://pull_request/<id>` server-side, so the
 * shell-level `comtrya-comment-thread` mount targets that exact
 * shape.
 */
const pullCommentTarget = computed(() =>
  pull.value ? `comtrya://pull_request/${pull.value.id}` : "",
);

/**
 * Comment count fed by the shell-owned `comtrya-comment-thread`
 * element's `comment-thread-update` events (iter 58). Surfaces in
 * the Discussion section header as "Discussion (3)".
 */
const commentCount = ref<number | null>(null);
function onCommentThreadUpdate(event: Event): void {
  const detail = (event as CustomEvent<{ count?: number } | null>).detail;
  if (detail && typeof detail.count === "number") {
    commentCount.value = detail.count;
  }
}

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
    const segments = repositorySegmentsFromLocation();
    if (segments.length === 0) {
      diffPatch.value = "";
      diffPath.value = "";
      projects.value = [];
      diffState.value = "ready";
      return;
    }
    const data = await getGraphQLClient().query<{
      workspace?: {
        repositoryByPath?: {
          comtryaConfig?: { projects?: CueProject[] | null } | null;
        } | null;
      };
    }>(
      `query PullProjects($segments: [String!]!) {
        workspace { repositoryByPath(segments: $segments) { comtryaConfig } }
      }`,
      { segments },
    );
    diffPatch.value = "";
    diffPath.value = "";
    projects.value = data.workspace?.repositoryByPath?.comtryaConfig?.projects ?? [];
    diffState.value = "ready";
  } catch (caught) {
    diffState.value = "error";
    diffError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function repositorySegmentsFromLocation(): string[] {
  if (typeof window === "undefined") return [];
  const path = window.location.pathname;
  if (!path.startsWith("/r/")) return [];
  const rest = path.slice("/r/".length);
  const projectIdx = rest.indexOf("/p/");
  const repoPath = projectIdx >= 0 ? rest.slice(0, projectIdx) : rest;
  return repoPath.split("/").filter(Boolean).map(decodeURIComponent);
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
        v-if="routedProjectsWithOwners.length > 0"
        class="pulls-routed"
        data-smoke="pulls-routed"
        aria-label="CUE project routing"
      >
        <header>
          <h2>Routed to</h2>
          <span class="muted">
            {{ routedProjectsWithOwners.length }} project<template v-if="routedProjectsWithOwners.length !== 1">s</template>
          </span>
        </header>
        <ul class="pulls-routed-list">
          <li
            v-for="entry in routedProjectsWithOwners"
            :key="entry.name"
            class="pulls-routed-project"
          >
            <a
              :href="`/x/issues/?project=${encodeURIComponent(entry.name)}`"
              class="pulls-routed-name"
              :title="`Filter issues to project ${entry.name}`"
            >◇ {{ entry.name }}</a>
            <ul v-if="entry.owners.length > 0" class="pulls-routed-owners">
              <li
                v-for="ref in entry.owners"
                :key="ref"
                class="pulls-routed-owner"
                :data-author-kind="classifyOwner(ref).kind"
                :title="ref"
              >
                <span class="chip-glyph">{{ classifyOwner(ref).glyph }}</span>
                {{ classifyOwner(ref).label }}
              </li>
            </ul>
            <span v-else class="pulls-routed-owners muted">
              no owners declared
            </span>
          </li>
        </ul>
        <p class="pulls-routed-source">
          From paths the diff touched · issues this PR closes ·
          <code>package comtrya</code> owners
        </p>
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
            <a :href="issueHref(issue)" class="issue-link">
              <span class="issue-num">
                <template v-if="issue.number !== null">#{{ issue.number }}</template>
                <template v-else>issue</template>
              </span>
              <span class="issue-title">{{ issue.title }}</span>
            </a>
            <a
              v-if="issue.projectName"
              class="issue-project"
              :href="projectHref(issue.projectName)"
              :title="`Filter to project ${issue.projectName}`"
            >◇ {{ issue.projectName }}</a>
            <span :class="['issue-state', issueStateClass(issue.state)]">
              {{ issue.state.toLowerCase() }}
            </span>
          </li>
        </ul>
        <footer v-if="linkedIssues.length > 0" class="pulls-linked-foot">
          <kbd>j</kbd> <kbd>k</kbd> walk · <kbd>↵</kbd> open
        </footer>
      </section>

      <section
        class="pulls-detail-discussion"
        data-smoke="pulls-detail-discussion"
        @comment-thread-update="onCommentThreadUpdate"
      >
        <header>
          <h2>
            Discussion<span
              v-if="commentCount !== null"
              class="pulls-detail-discussion-count"
            > ({{ commentCount }})</span>
          </h2>
        </header>
        <CustomElementHost
          tag="comtrya-comment-thread"
          :attributes="{ target: pullCommentTarget }"
          :properties="{ target: pullCommentTarget }"
        />
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
  font-family: var(--font-sans, system-ui);
}

.pulls-detail-head {
  display: grid;
  gap: 12px;
  border-bottom: 0.5px solid var(--fg, rgba(255,255,255,0.94));
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
  font-family: var(--font-serif, system-ui);
  font-size: 28px;
  line-height: 1.1;
  flex: 1 1 320px;
}

.back {
  font-family: var(--font-mono, monospace);
  font-size: 16px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  text-decoration: none;
}

.back:hover {
  color: var(--fg, rgba(255,255,255,0.94));
}

.pulls-detail-number {
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  color: var(--fg-3, rgba(255,255,255,0.52));
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
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  line-height: 16px;
  color: var(--fg-2, rgba(255,255,255,0.74));
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
.pull-chip.tone-state.pr-state-draft   { color: var(--fg-3, rgba(255,255,255,0.52)); }
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
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.pull-chip.tone-branch .branch-arrow {
  color: var(--fg-4, rgba(255,255,255,0.34));
  padding: 0 2px;
}

.pull-chip.tone-author {
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.pull-chip.tone-author[data-author-kind="agent"]      { color: #6b3fa0; }
.pull-chip.tone-author[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }
.pull-chip.tone-author[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.pull-chip.tone-author[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }

.pull-chip.tone-time {
  color: var(--fg-3, rgba(255,255,255,0.52));
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
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  background: var(--bg, #0a0b0e);
  color: var(--fg, rgba(255,255,255,0.94));
  padding: 8px 14px;
  font-family: var(--font-serif, system-ui);
  font-weight: 600;
  cursor: pointer;
}

.pulls-action.primary {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
}

.pulls-action[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.pulls-action kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  opacity: 0.6;
}

.pulls-action-message {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-detail-body h2 {
  margin: 0 0 8px;
  font-family: var(--font-serif, system-ui);
  font-size: 16px;
}

.pulls-detail-body-prose {
  color: var(--fg, rgba(255,255,255,0.94));
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
  font-family: var(--font-serif, system-ui);
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
  font-family: var(--font-mono, monospace);
  font-size: 0.88em;
  padding: 1px 5px;
  background: var(--bg-2, #0e1014);
  border-radius: 2px;
}

.pulls-detail-body-prose pre {
  margin: 0.7em 0;
  padding: 12px 14px;
  font-family: var(--font-mono, monospace);
  font-size: 12.5px;
  line-height: 1.55;
  background: var(--bg-2, #0e1014);
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
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
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

/* "Routed to" panel — union of (a) projects whose root the
 * diff touched and (b) projects of the issues this PR closes.
 * For each, surfaces the CUE-declared owners as classifier
 * chips. Mirrors the iter 59 IssueDetail / EpicDetail panel
 * so the routing vocabulary is identical across detail
 * surfaces. */
.pulls-routed {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg-2, #0e1014);
}

.pulls-routed > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
  padding-bottom: 6px;
}

.pulls-routed > header h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 16px;
}

.pulls-routed > header .muted {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-routed-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.pulls-routed-project {
  display: grid;
  gap: 6px;
  padding: 8px 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg, #0a0b0e);
}

.pulls-routed-name {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--accent-blue, #1d55a6);
  text-decoration: none;
  letter-spacing: 0.02em;
}

.pulls-routed-name:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.pulls-routed-owners {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pulls-routed-owners.muted {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-style: italic;
}

.pulls-routed-owner {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 0.5px solid currentColor;
  color: var(--fg, rgba(255,255,255,0.94));
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.pulls-routed-owner .chip-glyph {
  font-family: var(--font-serif, system-ui);
  font-size: 12px;
  line-height: 1;
}

.pulls-routed-owner[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }
.pulls-routed-owner[data-author-kind="human"]      { color: var(--fg, rgba(255,255,255,0.94)); }
.pulls-routed-owner[data-author-kind="agent"]      { color: #6b3fa0; }
.pulls-routed-owner[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.pulls-routed-owner[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }

.pulls-routed-source {
  margin: 0;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-routed-source code {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 0 4px;
  background: var(--bg-2, #0e1014);
  color: var(--fg-2, rgba(255,255,255,0.74));
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
  border-bottom: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding-bottom: 4px;
}

.pulls-linked-issues h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 18px;
}

.pulls-detail-discussion {
  display: grid;
  gap: 8px;
}

.pulls-detail-discussion > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding-bottom: 4px;
}

.pulls-detail-discussion > header h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 18px;
}

.pulls-detail-discussion-count {
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-weight: normal;
}

.pulls-linked-issues .muted {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-linked-issues ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
}

.pulls-linked-issues li {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: baseline;
  padding: 8px 10px;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.pulls-linked-issues li:last-child {
  border-bottom: 0;
}

.pulls-linked-issues li.focused {
  box-shadow: inset 3px 0 0 var(--fg, rgba(255,255,255,0.94));
  background: var(--bg-2, #0e1014);
}

.pulls-linked-issues li .issue-link {
  display: contents;
  color: inherit;
  text-decoration: none;
}

.pulls-linked-issues .issue-project {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  text-decoration: none;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  padding: 1px 7px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.pulls-linked-issues .issue-project:hover {
  color: var(--fg, rgba(255,255,255,0.94));
  border-color: var(--fg, rgba(255,255,255,0.94));
}

.pulls-linked-foot {
  margin-top: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0.04em;
}

.pulls-linked-foot kbd {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  padding: 0 4px;
  margin: 0 1px;
}

.pulls-linked-issues .issue-num {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-variant-numeric: tabular-nums;
}

.pulls-linked-issues .issue-title {
  font-family: var(--font-serif, system-ui);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pulls-linked-issues .issue-state {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  border: 0.5px solid currentColor;
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
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-error {
  color: var(--accent-err, #c9341c);
}
</style>
