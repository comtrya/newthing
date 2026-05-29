<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { getGraphQLClient, invokeOp, subscribeLiveEvents } from "@comtrya/sdk-core";
import ProjectsPanel from "../components/ProjectsPanel.vue";
import RepoTabs from "../components/RepoTabs.vue";
import SlotMount from "../components/SlotMount.vue";
import ActivityStream from "../components/ActivityStream.vue";
import ExtensionRoute from "./ExtensionRoute.vue";
import {
  LabelPill,
  renderMarkdown,
  useDiagrams,
  type LabelCatalogEntry,
} from "@comtrya/sdk-vue";
import { applyUserLayoutFor } from "../user-layout";
import { setActiveLabelCatalog } from "../extension-runtime";

const props = withDefaults(defineProps<{
  groups: string[];
  repo: string;
  /**
   * Which body to render under the persistent repo header / tabs.
   * "overview" (default) is the README-first home; "code" mounts the
   * `repository.main` slot (core's code browser + summary widgets);
   * "config" surfaces the repo's evaluated `comtrya.cue` for read
   * inspection; "pulls" / "issues" / "checks" / "epics" embed the
   * matching first-party extension's root route inside the
   * workbench so the repo header stays put across intra-repo
   * navigation. Each tab in RepoTabs maps to one of these values
   * via a dedicated per-repo route so the URL is the source of
   * truth, not local state.
   */
  view?:
    | "overview"
    | "code"
    | "config"
    | "pulls"
    | "issues"
    | "checks"
    | "epics";
  /**
   * Sub-path captured after `/r/:groups+/:repo/<ext>/` on workbench
   * extension routes. Passed straight through to the embedded
   * `<ExtensionRoute>` so deep links (e.g. an issue detail at
   * `…/issues/<ws>/<num>`) mount the matching extension element
   * inside the workbench instead of escaping back to `/x/<ext>/…`.
   */
  embeddedSubPath?: string[];
}>(), {
  view: "overview",
  embeddedSubPath: () => [],
});

interface RepositoryBlob {
  path: string;
  preview?: string | null;
  size?: number | null;
}

interface RepositoryBookmark {
  name: string;
  label?: string | null;
  description?: string | null;
  resolved?: boolean | null;
  commit?: string | null;
}

interface RepositoryCommit {
  oid: string;
  shortOid: string;
  subject: string;
  author: string;
  /** Git's `--date=relative` string — e.g. "2 hours ago". */
  time: string;
  /**
   * jj's `Change-Id:` trailer (iter 63). Stable across rewrites — a
   * git oid changes when you amend or rebase, the change-id doesn't.
   * `null` for git-only repos where the trailer isn't authored, and
   * for any commit that simply doesn't carry one. The Recent commits
   * panel renders it next to the short oid so reviewers can spot
   * "this is the same change" across history.
   */
  changeId?: string | null;
}

interface RepositoryIdentity {
  id: string;
  name: string;
  path: string;
  groups: string[];
  description?: string | null;
  defaultBranch?: string | null;
  visibility?: string | null;
  vcs?: string | null;
  updated?: string | null;
  openPullRequests?: number | null;
  gitHttpPath?: string | null;
  blobs?: RepositoryBlob[] | null;
  bookmarks?: RepositoryBookmark[] | null;
  commits?: RepositoryCommit[] | null;
  labels?: LabelCatalogEntry[] | null;
  labelCatalog?: Record<string, LabelCatalogEntry> | null;
  comtryaConfig?: ComtryaConfig | null;
}

interface ComtryaConfigProject {
  name?: string;
  root?: string;
  declaredAt?: string;
  implicit?: boolean;
  labels?: string[] | null;
  [key: string]: unknown;
}

interface ComtryaConfig {
  projects?: ComtryaConfigProject[];
  repository?: Record<string, unknown> | null;
  instances?: Array<{ path?: string; value?: unknown }>;
  error?: string | null;
}

interface RepoHomePayload {
  workspace?: {
    id?: string | null;
    repositoryByPath?: RepositoryIdentity | null;
  };
}

const REPOSITORY_BY_PATH_QUERY = `query ShellRepoHome($segments: [String!]!) {
  workspace {
    id
    repositoryByPath(segments: $segments) {
      id
      name
      path
      groups
      description
      defaultBranch
      visibility
      vcs
      updated
      openPullRequests
      gitHttpPath
      blobs {
        path
        preview
        size
      }
      bookmarks {
        name
        label
        description
        resolved
        commit
      }
      commits {
        oid
        shortOid
        subject
        author
        time
        changeId
      }
      labels
      labelCatalog
      comtryaConfig
    }
  }
}`;

const repository = ref<RepositoryIdentity | null>(null);
const workspaceId = ref<string | null>(null);
const loadState = ref<"loading" | "ready" | "missing" | "error">("loading");
const loadError = ref<string | null>(null);
const repoPath = computed(() => [...props.groups, props.repo].join("/"));
const repoSegments = computed(() => [...props.groups, props.repo]);
const repositoryId = computed(() => repository.value?.id ?? repoPath.value);
const displayPath = computed(() => repository.value?.path ?? repoPath.value);

/**
 * Clone command for the repository — absolute URL built from the
 * frontend origin + the kernel's `gitHttpPath` (e.g.
 * `/r/comtrya/dogfood`, the same URL the SPA browses). One of the
 * most-used DX touchpoints
 * in a forge; previously surfaced only inside extension widgets.
 *
 * Click-to-copy uses `navigator.clipboard.writeText()` with a
 * 1.4s "copied" flash so the user gets visual confirmation
 * without needing to lift focus from the header.
 */
const cloneUrl = computed(() => {
  const httpPath = repository.value?.gitHttpPath;
  if (!httpPath) return "";
  if (typeof window === "undefined") return httpPath;
  return `${window.location.origin}${httpPath}`;
});
/**
 * Clone-tool prefix derived from the repo's declared `vcs`. A
 * `vcs: "jj"` repo on Comtrya is still served via git HTTP (the
 * kernel's Smart HTTP path is the wire), but the local tool
 * `jj git clone <url>` initialises a jj-on-git colocated working
 * copy — that's the user-visible payoff of declaring jj in the
 * repo's CUE. Git-declared (or unset) repos fall back to the
 * conventional `git clone`.
 */
const cloneTool = computed(() =>
  repository.value?.vcs === "jj" ? "jj git clone" : "git clone",
);
const cloneCommand = computed(() =>
  cloneUrl.value ? `${cloneTool.value} ${cloneUrl.value}` : "",
);
const cloneCommandTitle = computed(() =>
  repository.value?.vcs === "jj"
    ? "Clones into a jj-on-git colocated repository (vcs declared as jj in this repo's comtrya.cue)."
    : "Clones the repository over git Smart HTTP.",
);
const cloneCopied = ref(false);
let cloneCopyTimer: number | undefined;

async function copyClone(): Promise<void> {
  if (!cloneCommand.value) return;
  try {
    await navigator.clipboard.writeText(cloneCommand.value);
    cloneCopied.value = true;
    if (cloneCopyTimer !== undefined) window.clearTimeout(cloneCopyTimer);
    cloneCopyTimer = window.setTimeout(() => {
      cloneCopied.value = false;
    }, 1400);
  } catch {
    // Clipboard API can fail in non-secure contexts; the chip stays
    // selectable so the user can still copy manually.
  }
}

/**
 * Per-repo open issue count. Hydrated when the repo identity
 * resolves and kept live via the same SSE topics App.vue listens
 * to for the workspace-wide nav badge. Surfaces in the chip row
 * alongside the existing `openPullRequests` field.
 */
const openIssues = ref(0);
const issueUnsubscribers: Array<() => void> = [];

/**
 * Per-repo count of required checks currently failing. Surfaces
 * in the chip row with the alarm tone when > 0 — the chip stays
 * hidden otherwise so a healthy repo doesn't drag the strip
 * around. Symmetric with the failing-checks panel on the Inbox.
 */
const failingChecks = ref(0);

async function refreshFailingChecks(): Promise<void> {
  const repoId = repository.value?.id;
  const ws = workspaceId.value;
  if (!repoId || !ws) {
    failingChecks.value = 0;
    return;
  }
  const result = await invokeOp<
    Array<{ state?: string; required?: boolean }>
  >("ext_checks", "checks", "list-checks", {
    repository: `comtrya://workspace/${ws}/repository/${repoId}`,
    limit: 256,
  });
  if (!result.ok || !Array.isArray(result.value)) {
    failingChecks.value = 0;
    return;
  }
  failingChecks.value = result.value.filter((c) => {
    if (c.required !== true) return false;
    const s = (c.state ?? "").toUpperCase();
    return s === "FAILURE" || s === "FAILED";
  }).length;
}

async function refreshOpenIssues(): Promise<void> {
  const repoId = repository.value?.id;
  const ws = workspaceId.value;
  if (!repoId || !ws) {
    openIssues.value = 0;
    return;
  }
  const result = await invokeOp<Array<{ state?: string }>>(
    "ext_issues",
    "issues",
    "list-issues",
    {
      repository: `comtrya://workspace/${ws}/repository/${repoId}`,
      limit: 1024,
    },
  );
  if (!result.ok || !Array.isArray(result.value)) {
    openIssues.value = 0;
    return;
  }
  openIssues.value = result.value.filter((i) => {
    const s = (i.state ?? "").toUpperCase();
    return s === "OPEN" || s === "REOPENED";
  }).length;
}

function teardownIssueListeners(): void {
  for (const off of issueUnsubscribers) off();
  issueUnsubscribers.length = 0;
}

function setupIssueListeners(): void {
  teardownIssueListeners();
  for (const type of [
    "dev.comtrya.issues.opened",
    "dev.comtrya.issues.closed",
    "dev.comtrya.issues.reopened",
  ]) {
    issueUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void refreshOpenIssues(),
        onError: () => {},
      }),
    );
  }
}

onUnmounted(teardownIssueListeners);

interface Chip {
  label: string;
  value: string;
  tone?: "ink" | "muted" | "warn" | "good" | "alarm";
  title?: string;
  /** Optional workbench destination — when set, the chip renders
   *  as a `<RouterLink>` so the count is also a one-click drill-in. */
  to?: string;
}

function relativeUpdated(value: string | null | undefined): string | null {
  if (!value) return null;
  // The kernel returns `updated` in three shapes depending on the
  // repository's source: an ISO-8601 timestamp for imported repos,
  // a human-readable relative string from older records, and an
  // `@<epoch-seconds>` form for ones with only a unix mtime.
  // Normalise to a relative phrase.
  let epochMs: number | null = null;
  if (/^@\d+$/.test(value)) {
    epochMs = parseInt(value.slice(1), 10) * 1000;
  } else if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) epochMs = parsed;
  }
  if (epochMs === null) return value;
  const diff = Math.max(0, Date.now() - epochMs);
  const min = 60_000, hr = 60 * min, day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  return new Date(epochMs).toISOString().slice(0, 10);
}

const repoChips = computed<Chip[]>(() => {
  const chips: Chip[] = [];
  const branch = repository.value?.defaultBranch ?? "main";
  const vcs = (repository.value?.vcs ?? "git").toLowerCase();
  // In jj the default ref is a "bookmark", not a branch. The chip
  // label flips to match the repo's declared vcs so the
  // terminology stays honest. The wire (`defaultBranch`) keeps
  // its name on the CUE side and on the GraphQL projection;
  // only the user-facing label adapts.
  const refLabel = vcs === "jj" ? "bookmark" : "branch";
  chips.push({
    label: refLabel,
    value: branch,
    tone: "ink",
    title: `default ${refLabel} · ${branch}`,
  });
  const visibility = (repository.value?.visibility ?? "PRIVATE").toLowerCase();
  chips.push({
    label: "visibility",
    value: visibility,
    tone: visibility === "public" ? "good" : "muted",
  });
  chips.push({
    label: "vcs",
    value: vcs,
    tone: vcs === "jj" ? "ink" : "muted",
    title: `version control · ${vcs}`,
  });
  const repoBase = `/r/${repoPath.value}`;
  if (failingChecks.value > 0) {
    chips.push({
      label: failingChecks.value === 1 ? "failing check" : "failing checks",
      value: String(failingChecks.value),
      tone: "alarm",
      to: `${repoBase}/checks`,
      title: "Required checks currently failing on this repo.",
    });
  }
  const prs = repository.value?.openPullRequests ?? 0;
  chips.push({
    label: prs === 1 ? "open PR" : "open PRs",
    value: String(prs),
    tone: prs > 0 ? "ink" : "muted",
    to: `${repoBase}/pulls`,
  });
  const open = openIssues.value;
  chips.push({
    label: open === 1 ? "open issue" : "open issues",
    value: String(open),
    tone: open > 0 ? "ink" : "muted",
    to: `${repoBase}/issues`,
  });
  const updated = relativeUpdated(repository.value?.updated ?? null);
  if (updated) {
    chips.push({ label: "updated", value: updated, tone: "muted" });
  }
  return chips;
});

/**
 * Top-level README on the repo home — the most-requested DX
 * affordance in any forge. The kernel surfaces blob previews on
 * `repository.blobs`; we pick the first top-level
 * `README{,.md,.mdx}` (case-insensitive) and render its preview
 * through the tiny markdown shim. Long-form rendering (shiki +
 * rehype) will replace `renderMarkdown` later without changing
 * the call site.
 */
const README_PATTERN = /^README(\.(md|mdx))?$/i;

const readmeBlob = computed<RepositoryBlob | null>(() => {
  const blobs = repository.value?.blobs;
  if (!blobs || blobs.length === 0) return null;
  let best: RepositoryBlob | null = null;
  for (const blob of blobs) {
    if (!blob?.path) continue;
    if (blob.path.includes("/")) continue;
    if (!README_PATTERN.test(blob.path)) continue;
    if (!best || (blob.path.toLowerCase() === "readme.md" && best.path.toLowerCase() !== "readme.md")) {
      best = blob;
    }
  }
  return best;
});

const bookmarks = computed<RepositoryBookmark[]>(
  () => repository.value?.bookmarks ?? [],
);

/**
 * Recent commits panel (iter 54). The kernel pre-computes `commits`
 * via `git_commits` — up to 8 latest entries on the default branch
 * with `{oid, shortOid, subject, author, time}`. Surfacing them on
 * RepoHome turns the overview into a real "what just happened"
 * surface, the way GitHub's repo-home does. When `vcs: jj` lands
 * change-ids on commits (backlog), this is the panel that renders
 * them next to the short-oid.
 */
const commits = computed<RepositoryCommit[]>(
  () => repository.value?.commits ?? [],
);

/**
 * Vcs-aware copy for the bookmarks panel.
 *
 * In jj, "bookmarks" are first-class — movable refs that travel with
 * the work, not the commits. In git there's no native bookmark
 * concept; what `comtrya.cue` declares as `bookmarks` are pinned refs
 * for the team's eyes (release lines, long-lived branches the
 * reviewer cares about). The repo header surfaces the same word
 * ("bookmark") on a jj repo via the iter 35 default-ref chip, so the
 * panel matches: header reads "Bookmarks" for jj, "Pinned refs" for
 * git, with a short description below that names the source of
 * truth.
 */
const bookmarksLabel = computed(() =>
  (repository.value?.vcs ?? "git").toLowerCase() === "jj"
    ? "Bookmarks"
    : "Pinned refs",
);
const bookmarksHint = computed(() =>
  (repository.value?.vcs ?? "git").toLowerCase() === "jj"
    ? "jj-native; movable tips that travel with the work"
    : "Refs the comtrya.cue config calls out for the team",
);

const labelCatalog = computed<Record<string, LabelCatalogEntry>>(
  () => repository.value?.labelCatalog ?? {},
);

const labelEntries = computed<string[]>(
  () => Object.keys(labelCatalog.value),
);

const comtryaConfig = computed<ComtryaConfig | null>(
  () => repository.value?.comtryaConfig ?? null,
);

const comtryaProjects = computed<ComtryaConfigProject[]>(
  () => comtryaConfig.value?.projects ?? [],
);

const comtryaRepository = computed<Record<string, unknown> | null>(
  () => comtryaConfig.value?.repository ?? null,
);

const comtryaError = computed<string | null>(
  () => comtryaConfig.value?.error ?? null,
);

/** Pretty-print a project's per-extension policy object (e.g.
 *  `issues: { defaultLabels, closeOnMerge }`) into a flat list of
 *  `(key, value)` entries for the config view. Skips internal
 *  fields the CUE engine adds (`name`, `root`, `declaredAt`,
 *  `implicit`) since those render in the project's header row. */
function policyEntries(
  project: ComtryaConfigProject,
): Array<{ slot: string; rows: Array<{ key: string; value: string }> }> {
  const out: Array<{ slot: string; rows: Array<{ key: string; value: string }> }> = [];
  const skip = new Set(["name", "root", "declaredAt", "implicit", "labels", "owners"]);
  for (const [slot, value] of Object.entries(project)) {
    if (skip.has(slot)) continue;
    if (!value || typeof value !== "object") continue;
    const rows: Array<{ key: string; value: string }> = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      rows.push({ key: k, value: formatConfigValue(v) });
    }
    if (rows.length > 0) out.push({ slot, rows });
  }
  return out;
}

function formatConfigValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.map(formatConfigValue).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const readmePreview = computed(() => readmeBlob.value?.preview ?? "");
const renderedReadme = computed(() =>
  readmePreview.value
    ? renderMarkdown(readmePreview.value, { workspaceId: workspaceId.value ?? "" })
    : "",
);

/** Container for the rendered README; the `useDiagrams` hook
 *  walks this subtree for `pre[data-lang="mermaid|d2"]` blocks
 *  and swaps them for inline SVGs. */
const readmeBody = ref<HTMLElement | null>(null);
useDiagrams(readmeBody);
const readmeTruncated = computed(() => {
  const blob = readmeBlob.value;
  if (!blob) return false;
  const preview = blob.preview ?? "";
  const size = typeof blob.size === "number" ? blob.size : preview.length;
  return size > preview.length;
});

const repoContext = computed<Record<string, unknown>>(() => ({
  workspaceId: workspaceId.value ?? undefined,
  repositoryId: repositoryId.value,
  repositoryGroups: repository.value?.groups ?? props.groups,
  repositoryName: repository.value?.name ?? props.repo,
  repositoryPath: repository.value?.path ?? repoPath.value,
  repositorySegments: repoSegments.value,
}));

watch(
  repoSegments,
  async (segments, _previous, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    loadState.value = "loading";
    loadError.value = null;
    try {
      const identity = await fetchRepositoryIdentity(segments);
      if (controller.signal.aborted) return;
      workspaceId.value = identity.workspaceId;
      repository.value = identity.repository;
      loadState.value = identity.repository ? "ready" : "missing";
      setActiveLabelCatalog(
        (identity.repository?.labelCatalog as Record<string, unknown> | null) ?? null,
      );
      await applyUserLayoutFor(identity.repository?.id ?? null);
      if (identity.repository && identity.workspaceId) {
        void refreshOpenIssues();
        void refreshFailingChecks();
        setupIssueListeners();
      } else {
        teardownIssueListeners();
        openIssues.value = 0;
        failingChecks.value = 0;
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      workspaceId.value = null;
      repository.value = null;
      loadState.value = "error";
      loadError.value = error instanceof Error ? error.message : String(error);
      setActiveLabelCatalog(null);
      await applyUserLayoutFor(null);
    }
  },
  { immediate: true },
);

async function fetchRepositoryIdentity(
  segments: string[],
): Promise<{ workspaceId: string | null; repository: RepositoryIdentity | null }> {
  const payload = await getGraphQLClient().query<RepoHomePayload>(
    REPOSITORY_BY_PATH_QUERY,
    { segments },
  );
  return {
    workspaceId: payload.workspace?.id ?? null,
    repository: payload.workspace?.repositoryByPath ?? null,
  };
}
</script>

<template>
  <header class="repo-header" data-smoke="repo-dashboard">
    <p class="overline">Repository</p>
    <h1>{{ displayPath }}</h1>
    <p v-if="repository?.description" class="repo-description">
      {{ repository.description }}
    </p>
    <div class="repo-chip-row" aria-label="Repository at a glance">
      <template v-for="chip in repoChips" :key="chip.label">
        <RouterLink
          v-if="chip.to"
          :to="chip.to"
          :class="['repo-chip', 'repo-chip-link', `tone-${chip.tone ?? 'ink'}`]"
          :title="chip.title ?? `${chip.label} · ${chip.value}`"
        >
          <strong>{{ chip.value }}</strong>
          <span>{{ chip.label }}</span>
        </RouterLink>
        <span
          v-else
          :class="['repo-chip', `tone-${chip.tone ?? 'ink'}`]"
          :title="chip.title ?? `${chip.label} · ${chip.value}`"
        >
          <strong>{{ chip.value }}</strong>
          <span>{{ chip.label }}</span>
        </span>
      </template>
    </div>
    <div
      v-if="cloneCommand"
      class="repo-clone"
      data-smoke="repo-clone"
    >
      <code class="repo-clone-cmd" :title="cloneCommandTitle" @click="copyClone">{{ cloneCommand }}</code>
      <button
        type="button"
        class="repo-clone-copy"
        :aria-pressed="cloneCopied"
        :title="cloneCopied ? 'Copied' : 'Copy clone command'"
        @click="copyClone"
      >
        {{ cloneCopied ? "copied" : "copy" }}
      </button>
    </div>
    <RepoTabs
      :segments="repoSegments"
      :repository-id="repository?.id ?? null"
      :open-issues="openIssues"
      :open-pulls="repository?.openPullRequests ?? 0"
      :failing-checks="failingChecks"
    />
  </header>

  <section v-if="loadState !== 'ready'" class="repo-state" :data-state="loadState">
    <span v-if="loadState === 'loading'">Loading repository context</span>
    <span v-else-if="loadState === 'missing'">Repository was not found</span>
    <span v-else>{{ loadError }}</span>
  </section>

  <template v-if="loadState === 'ready'">
    <!-- /r/:path → README home. Per the v3 layout direction, the home
         is the README, not a vertical pile of every extension. Extensions
         each own their own per-repo route — Code at /r/:path/code,
         Issues / Pulls / Checks via RepoTabs. Projects (a kernel concept)
         and Bookmarks (CUE-declared refs) live in a compact right rail
         alongside the README. -->
    <div v-if="view === 'overview'" class="repo-overview">
      <main class="repo-overview-main">
        <section
          v-if="renderedReadme"
          class="repo-readme"
          data-smoke="repo-readme"
          aria-label="README"
        >
          <header class="repo-readme-head">
            <span class="repo-readme-path">{{ readmeBlob?.path }}</span>
            <span v-if="readmeTruncated" class="repo-readme-truncated" title="Preview truncated by the kernel">
              preview
            </span>
          </header>
          <article ref="readmeBody" class="repo-readme-body prose" v-html="renderedReadme" />
        </section>
        <section v-else class="repo-readme repo-readme-empty">
          <p>No README at the repo root. Add one to introduce this repository.</p>
        </section>
      </main>

      <aside class="repo-overview-rail">
        <ProjectsPanel :repository-path="displayPath" :segments="repoSegments" />

        <section
          v-if="bookmarks.length > 0"
          class="repo-bookmarks"
          data-smoke="repo-bookmarks"
          :aria-label="bookmarksLabel"
        >
          <header class="repo-bookmarks-head">
            <h2>{{ bookmarksLabel }}</h2>
            <span class="repo-bookmarks-count">{{ bookmarks.length }} declared</span>
          </header>
          <p class="repo-bookmarks-hint">{{ bookmarksHint }}</p>
          <ul class="repo-bookmarks-list">
            <li
              v-for="bookmark in bookmarks"
              :key="bookmark.name"
              class="repo-bookmark"
              :class="{ unresolved: bookmark.resolved === false }"
            >
              <code>{{ bookmark.name }}</code>
              <span
                v-if="bookmark.label && bookmark.label !== bookmark.name"
                class="repo-bookmark-label"
              >{{ bookmark.label }}</span>
              <span
                v-if="bookmark.resolved && bookmark.commit"
                class="repo-bookmark-commit"
                :title="`Resolves to ${bookmark.commit}`"
              >{{ bookmark.commit.slice(0, 7) }}</span>
              <span
                v-else-if="bookmark.resolved === false"
                class="repo-bookmark-unresolved"
                title="No ref matches this bookmark on the backing repo"
              >unresolved</span>
              <span v-if="bookmark.description" class="repo-bookmark-description">{{ bookmark.description }}</span>
            </li>
          </ul>
        </section>

        <section
          v-if="commits.length > 0"
          class="repo-commits"
          data-smoke="repo-commits"
          aria-label="Recent commits"
        >
          <header class="repo-commits-head">
            <h2>Recent commits</h2>
            <span class="repo-commits-count">{{ commits.length }}</span>
          </header>
          <ul class="repo-commits-list">
            <li v-for="commit in commits" :key="commit.oid" class="repo-commit">
              <code class="repo-commit-oid" :title="commit.oid">{{ commit.shortOid }}</code>
              <code
                v-if="commit.changeId"
                class="repo-commit-change-id"
                :title="`jj change-id ${commit.changeId} — stable across amend/rebase`"
              >{{ commit.changeId.slice(0, 8) }}</code>
              <span class="repo-commit-subject">{{ commit.subject }}</span>
              <span class="repo-commit-meta">
                <span class="repo-commit-author">{{ commit.author }}</span>
                <span class="repo-commit-time">{{ commit.time }}</span>
              </span>
            </li>
          </ul>
        </section>

        <section
          v-if="labelEntries.length > 0"
          class="repo-labels"
          data-smoke="repo-labels"
          aria-label="Labels catalog"
        >
          <header class="repo-labels-head">
            <h2>Labels</h2>
            <span>{{ labelEntries.length }} declared</span>
          </header>
          <ul class="repo-labels-list">
            <li v-for="name in labelEntries" :key="name">
              <LabelPill :name="name" :catalog="labelCatalog" />
            </li>
          </ul>
        </section>

        <section
          v-if="repositoryId"
          class="repo-activity"
          data-smoke="repo-activity"
          aria-label="Recent activity"
        >
          <header class="repo-activity-head">
            <h2>Activity</h2>
          </header>
          <ActivityStream :repository-id="repositoryId" />
        </section>
      </aside>
    </div>

    <!-- /r/:path/config → read-only view of the evaluated CUE
         `comtrya.cue` for this repo. Surfaces the kernel-level
         #Repository block, the declared Projects with their
         per-extension policies, and any cuengine error. The
         source of truth for the rest of the workbench. -->
    <section v-else-if="view === 'config'" class="repo-config" data-smoke="repo-config">
      <p v-if="comtryaError" class="repo-config-error" role="alert">
        cuengine error: {{ comtryaError }}
      </p>

      <article v-if="comtryaRepository" class="repo-config-panel">
        <header>
          <h2>Repository</h2>
          <span class="hint"><code>package comtrya · repository</code></span>
        </header>
        <dl>
          <template v-for="(value, key) in comtryaRepository" :key="key">
            <dt>{{ key }}</dt>
            <dd>{{ formatConfigValue(value) }}</dd>
          </template>
        </dl>
      </article>

      <article
        v-for="project in comtryaProjects"
        :key="`${project.declaredAt}::${project.name}`"
        class="repo-config-panel"
      >
        <header>
          <h2>
            <span v-if="project.implicit" class="implicit-marker" title="No explicit declaration; the kernel synthesised a default Project covering the whole repo.">◌</span>
            Project · {{ project.name || "(unnamed)" }}
          </h2>
          <span v-if="project.declaredAt" class="hint">
            <code>{{ project.declaredAt }}/comtrya.cue</code>
          </span>
        </header>
        <dl class="project-meta">
          <dt>root</dt>
          <dd>{{ project.root || "." }}</dd>
          <template v-if="project.labels && project.labels.length > 0">
            <dt>labels</dt>
            <dd>{{ project.labels.join(", ") }}</dd>
          </template>
        </dl>
        <section
          v-for="policy in policyEntries(project)"
          :key="policy.slot"
          class="repo-config-slot"
        >
          <h3>{{ policy.slot }}</h3>
          <dl>
            <template v-for="row in policy.rows" :key="row.key">
              <dt>{{ row.key }}</dt>
              <dd>{{ row.value }}</dd>
            </template>
          </dl>
        </section>
      </article>

      <p
        v-if="!comtryaError && !comtryaRepository && comtryaProjects.length === 0"
        class="repo-config-empty"
      >
        This repo declares no <code>package comtrya</code> CUE. The forge falls back to shell defaults.
      </p>
    </section>

    <!-- /r/:path/code → repository-backed code surface plus repo-scoped widgets. -->
    <section v-else-if="view === 'code'" class="repo-code">
      <SlotMount
        name="repository.main"
        label="Main"
        :element-context="repoContext"
        smoke-prefix="repo-code"
      />
      <SlotMount
        name="repository.sidebar"
        label="Sidebar"
        :element-context="repoContext"
        smoke-prefix="repo-code"
      />
    </section>

    <!-- /r/:path/{pulls,issues,checks} → workbench-style embed of the
         matching extension's root route. The extension UI reads
         `?repositoryId=…` from the URL to scope itself, so RepoTabs
         carries the repo id through on every nav. The persistent
         header / tabs stay put because every per-repo view is the
         same RepoHome component. -->
    <section v-else-if="view === 'pulls'" class="repo-extension-embed" data-smoke="repo-pulls">
      <ExtensionRoute prefix="pulls" :rest="embeddedSubPath" />
    </section>
    <section v-else-if="view === 'issues'" class="repo-extension-embed" data-smoke="repo-issues">
      <ExtensionRoute prefix="issues" :rest="embeddedSubPath" />
    </section>
    <section v-else-if="view === 'checks'" class="repo-extension-embed" data-smoke="repo-checks">
      <ExtensionRoute prefix="checks" :rest="embeddedSubPath" />
    </section>
    <section v-else-if="view === 'epics'" class="repo-extension-embed" data-smoke="repo-epics">
      <ExtensionRoute prefix="epics" :rest="embeddedSubPath" />
    </section>
  </template>
</template>
