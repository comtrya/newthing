<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { getGraphQLClient, invokeOp, subscribeLiveEvents } from "@comtrya/sdk-core";
import ProjectsPanel from "../components/ProjectsPanel.vue";
import RepoTabs from "../components/RepoTabs.vue";
import SlotMount from "../components/SlotMount.vue";
import { renderMarkdown } from "@comtrya/sdk-vue";
import { repositoryHomeSlots } from "../repository-slots";
import { applyUserLayoutFor } from "../user-layout";

const props = defineProps<{
  groups: string[];
  repo: string;
}>();

interface RepositoryBlob {
  path: string;
  preview?: string | null;
  size?: number | null;
}

interface RepositoryBookmark {
  name: string;
  label?: string | null;
  description?: string | null;
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
      }
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
 * `/git/comtrya/dogfood.git`). One of the most-used DX touchpoints
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
const cloneCommand = computed(() => (cloneUrl.value ? `git clone ${cloneUrl.value}` : ""));
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
  tone?: "ink" | "muted" | "warn" | "good";
  title?: string;
}

function relativeUpdated(value: string | null | undefined): string | null {
  if (!value) return null;
  // The kernel returns `updated` in three shapes depending on the
  // repository's source: an ISO-8601 timestamp for imported repos,
  // a human-readable "3 minutes ago" string for some demo repos,
  // and an `@<epoch-seconds>` form for ones with only a unix mtime.
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
  chips.push({
    label: "branch",
    value: branch,
    tone: "ink",
    title: `default branch · ${branch}`,
  });
  const visibility = (repository.value?.visibility ?? "PRIVATE").toLowerCase();
  chips.push({
    label: "visibility",
    value: visibility,
    tone: visibility === "public" ? "good" : "muted",
  });
  const vcs = (repository.value?.vcs ?? "git").toLowerCase();
  chips.push({
    label: "vcs",
    value: vcs,
    tone: vcs === "jj" ? "ink" : "muted",
    title: `version control · ${vcs}`,
  });
  const prs = repository.value?.openPullRequests ?? 0;
  chips.push({
    label: prs === 1 ? "open PR" : "open PRs",
    value: String(prs),
    tone: prs > 0 ? "ink" : "muted",
  });
  const open = openIssues.value;
  chips.push({
    label: open === 1 ? "open issue" : "open issues",
    value: String(open),
    tone: open > 0 ? "ink" : "muted",
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

const readmePreview = computed(() => readmeBlob.value?.preview ?? "");
const renderedReadme = computed(() =>
  readmePreview.value ? renderMarkdown(readmePreview.value) : "",
);
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
      await applyUserLayoutFor(identity.repository?.id ?? null);
      if (identity.repository && identity.workspaceId) {
        void refreshOpenIssues();
        setupIssueListeners();
      } else {
        teardownIssueListeners();
        openIssues.value = 0;
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      workspaceId.value = null;
      repository.value = null;
      loadState.value = "error";
      loadError.value = error instanceof Error ? error.message : String(error);
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
      <span
        v-for="chip in repoChips"
        :key="chip.label"
        :class="['repo-chip', `tone-${chip.tone ?? 'ink'}`]"
        :title="chip.title ?? `${chip.label} · ${chip.value}`"
      >
        <strong>{{ chip.value }}</strong>
        <span>{{ chip.label }}</span>
      </span>
    </div>
    <div
      v-if="cloneCommand"
      class="repo-clone"
      data-smoke="repo-clone"
    >
      <code class="repo-clone-cmd" @click="copyClone">{{ cloneCommand }}</code>
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
    />
  </header>

  <section v-if="loadState !== 'ready'" class="repo-state" :data-state="loadState">
    <span v-if="loadState === 'loading'">Loading repository context</span>
    <span v-else-if="loadState === 'missing'">Repository was not found</span>
    <span v-else>{{ loadError }}</span>
  </section>

  <template v-if="loadState === 'ready'">
    <ProjectsPanel :repository-path="displayPath" :segments="repoSegments" />

    <section
      v-if="bookmarks.length > 0"
      class="repo-bookmarks"
      data-smoke="repo-bookmarks"
      aria-label="Bookmarks"
    >
      <header class="repo-bookmarks-head">
        <h2>Bookmarks</h2>
        <span class="repo-bookmarks-count">{{ bookmarks.length }} declared</span>
      </header>
      <ul class="repo-bookmarks-list">
        <li
          v-for="bookmark in bookmarks"
          :key="bookmark.name"
          class="repo-bookmark"
        >
          <code>{{ bookmark.name }}</code>
          <span
            v-if="bookmark.label && bookmark.label !== bookmark.name"
            class="repo-bookmark-label"
          >{{ bookmark.label }}</span>
          <span v-if="bookmark.description" class="repo-bookmark-description">{{ bookmark.description }}</span>
        </li>
      </ul>
    </section>

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
      <article class="repo-readme-body prose" v-html="renderedReadme" />
    </section>

    <section class="repo-slot-stack">
      <section
        v-for="slot in repositoryHomeSlots"
        :id="slot.name.split('.')[1] ?? slot.name"
        :key="slot.name"
      >
        <SlotMount
          :name="slot.name"
          :label="slot.label"
          :element-context="repoContext"
          smoke-prefix="repo-slot"
        />
      </section>
    </section>
  </template>
</template>
