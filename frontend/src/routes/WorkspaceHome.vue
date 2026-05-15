<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { invokeOp, subscribeLiveEvents } from "@comtrya/sdk-core";
import {
  classifyPrincipal,
  fetchComtryaProjects,
  useShortcuts,
  type ComtryaProject,
} from "@comtrya/sdk-vue";
import ActivityStream from "../components/ActivityStream.vue";
import SlotMount from "../components/SlotMount.vue";
import type { WorkspaceHomeSlotName } from "../workspace-home-slots";

interface RepositorySummary {
  id: string;
  name: string;
  path: string;
  groups: string[];
  description: string | null;
  openPullRequests: number | null;
  defaultBranch?: string | null;
  visibility?: string | null;
  updated?: string | null;
}

interface WorkspaceHomePayload {
  instance?: {
    id: string;
    name: string;
    capabilities?: {
      extensionRuntime?: boolean;
    };
  };
  workspace?: {
    id?: string | null;
    name: string;
    repositories: RepositorySummary[];
  };
  extensionInstallations?: Array<{
    id: string;
    routePrefix: string | null;
  }>;
}

const WORKSPACE_HOME_QUERY = `query ShellWorkspaceHome {
  instance { id name capabilities { extensionRuntime } }
  workspace {
    id
    name
    repositories {
      id name path groups description openPullRequests
      defaultBranch visibility updated
    }
  }
  extensionInstallations { id routePrefix }
}`;

const loadState = ref<"loading" | "ready" | "error">("loading");
const loadError = ref<string | null>(null);
const payload = ref<WorkspaceHomePayload | null>(null);
const workspace = computed(() => payload.value?.workspace ?? {
  name: "Workspace",
  repositories: [],
});
const repositories = computed(() => workspace.value.repositories);
const extensionCount = computed(() => payload.value?.extensionInstallations?.length ?? 0);
const extensionRuntime = computed(
  () => payload.value?.instance?.capabilities?.extensionRuntime ? "enabled" : "disabled",
);
const repositoryWord = computed(() => repositories.value.length === 1 ? "repository" : "repositories");

/**
 * Per-repo open-issue counts. Hydrated in parallel via
 * `invokeOp("ext_issues", "issues", "list-issues")` filtered to the
 * repo URI, counted client-side for OPEN + REOPENED. Live-synced
 * via the same SSE topics App.vue + RepoHome listen to, so opening
 * an issue from another tab updates the row's chip without reload.
 */
const openIssuesByRepoId = ref<Record<string, number>>({});
const issueUnsubscribers: Array<() => void> = [];
const workspaceId = computed(() => payload.value?.workspace?.id ?? null);

function repoUri(workspaceUlid: string, repositoryUlid: string): string {
  return `comtrya://workspace/${workspaceUlid}/repository/${repositoryUlid}`;
}

async function refreshOpenIssueCount(repoId: string, ws: string): Promise<void> {
  const result = await invokeOp<Array<{ state?: string }>>(
    "ext_issues",
    "issues",
    "list-issues",
    { repository: repoUri(ws, repoId), limit: 1024 },
  );
  if (!result.ok || !Array.isArray(result.value)) return;
  const count = result.value.filter((issue) => {
    const s = (issue.state ?? "").toUpperCase();
    return s === "OPEN" || s === "REOPENED";
  }).length;
  openIssuesByRepoId.value = { ...openIssuesByRepoId.value, [repoId]: count };
}

async function refreshAllOpenIssues(): Promise<void> {
  const ws = workspaceId.value;
  if (!ws || repositories.value.length === 0) return;
  await Promise.all(
    repositories.value.map((r) => refreshOpenIssueCount(r.id, ws)),
  );
}

/**
 * Aggregate CUE Projects declared across every repo in the
 * workspace. The Project spine is workspace-wide, not repo-wide:
 * a maintainer of `kernel` in `comtrya/dogfood` should see that
 * project from the workspace home without having to first know
 * which repo it lives in.
 *
 * Resolved lazily after repos load. Uses the iter 63 sdk-vue
 * helper for the actual fetch (one query per repo; the kernel's
 * `workspace.repositories[] { comtryaConfig }` listing doesn't
 * evaluate CUE per repo today). Failures per-repo are silent so
 * one bad repo doesn't break the panel.
 */
interface ProjectRow {
  /** Repo path (`comtrya/dogfood`) — disambiguates same-named projects. */
  repoPath: string;
  /** Repo path segments used to build /r/<...>/p/<project>. */
  segments: string[];
  project: ComtryaProject;
}

const projectRows = ref<ProjectRow[]>([]);
const projectsLoadState = ref<"idle" | "loading" | "ready">("idle");

async function refreshAllProjects(): Promise<void> {
  if (repositories.value.length === 0) {
    projectRows.value = [];
    projectsLoadState.value = "ready";
    return;
  }
  projectsLoadState.value = "loading";
  const fetched = await Promise.all(
    repositories.value.map(async (repo) => {
      const segments = (repo.path ?? "")
        .split("/")
        .filter(Boolean)
        .map(decodeURIComponent);
      const projects = segments.length > 0
        ? await fetchComtryaProjects(segments)
        : [];
      return projects.map((project): ProjectRow => ({
        repoPath: repo.path,
        segments,
        project,
      }));
    }),
  );
  const rows = fetched.flat().filter((row) => Boolean(row.project.name));
  rows.sort((a, b) => {
    const byProject = (a.project.name ?? "").localeCompare(b.project.name ?? "");
    if (byProject !== 0) return byProject;
    return a.repoPath.localeCompare(b.repoPath);
  });
  projectRows.value = rows;
  projectsLoadState.value = "ready";
}

function projectHomeHref(row: ProjectRow): string {
  const repoPath = row.segments.map(encodeURIComponent).join("/");
  return `/r/${repoPath}/p/${encodeURIComponent(row.project.name ?? "")}`;
}

function projectOwnerRefs(project: ComtryaProject): string[] {
  return (project.owners ?? [])
    .map((owner) => owner?.ref)
    .filter((ref): ref is string => typeof ref === "string" && ref.length > 0);
}

/**
 * Per-Project work counts — open / closed issues + epic state
 * tally bucketed by `projectName`. Workspace-wide single fetch
 * per resource so a workspace with N repos × M projects costs
 * exactly two ops calls, not N × M. Renders count chips on each
 * panel row; each chip links to the corresponding filtered queue
 * (iter 60 URL recipe).
 *
 * Live-synced via SSE on `dev.comtrya.issues.{opened,closed,
 * reopened}` and `dev.comtrya.epic.{created,state-changed}` so
 * opening an issue elsewhere updates the workspace panel without
 * refresh.
 */
interface ProjectCounts {
  openIssues: number;
  closedIssues: number;
  epicsPlanned: number;
  epicsInProgress: number;
  epicsDone: number;
}

const emptyCounts = (): ProjectCounts => ({
  openIssues: 0,
  closedIssues: 0,
  epicsPlanned: 0,
  epicsInProgress: 0,
  epicsDone: 0,
});

interface IssueLite {
  state?: string;
  projectName?: string | null;
}

interface EpicLite {
  state?: string;
  projectName?: string | null;
}

const projectCounts = ref<Record<string, ProjectCounts>>({});

async function refreshProjectCounts(): Promise<void> {
  const ws = workspaceId.value;
  if (!ws) return;
  const workspaceUri = `comtrya://workspace/${ws}`;
  const [issuesRes, epicsRes] = await Promise.all([
    invokeOp<IssueLite[]>("ext_issues", "issues", "list-issues", {
      repository: workspaceUri,
      limit: 4096,
    }),
    invokeOp<EpicLite[]>("ext_epics", "epics", "list-epics", {
      workspace: workspaceUri,
      limit: 4096,
    }),
  ]);
  const next: Record<string, ProjectCounts> = {};
  const bucket = (name: string): ProjectCounts =>
    (next[name] ??= emptyCounts());
  if (issuesRes.ok && Array.isArray(issuesRes.value)) {
    for (const issue of issuesRes.value) {
      const project = (issue.projectName ?? "").trim();
      if (!project) continue;
      const counts = bucket(project);
      const state = (issue.state ?? "").toUpperCase();
      if (state === "CLOSED") counts.closedIssues += 1;
      else counts.openIssues += 1;
    }
  }
  if (epicsRes.ok && Array.isArray(epicsRes.value)) {
    for (const epic of epicsRes.value) {
      const project = (epic.projectName ?? "").trim();
      if (!project) continue;
      const counts = bucket(project);
      const state = (epic.state ?? "").toUpperCase();
      if (state === "DONE" || state === "CANCELED") counts.epicsDone += 1;
      else if (state === "IN_PROGRESS" || state === "AT_RISK") {
        counts.epicsInProgress += 1;
      } else counts.epicsPlanned += 1;
    }
  }
  projectCounts.value = next;
}

function countsFor(name: string | undefined): ProjectCounts {
  if (!name) return emptyCounts();
  return projectCounts.value[name] ?? emptyCounts();
}

/**
 * Project filter for the workspace activity stream. The
 * ActivityStream component (iter 33) accepts a `projectName`
 * prop and drops events whose payload doesn't carry a matching
 * project; iter 74 surfaces a chip row above it so users can
 * scope the workspace canvas's "what just happened" feed to
 * one project without leaving the home.
 *
 * Compounds iter 64's `projectRows`: the chips dedupe by name
 * so cross-repo same-named projects collapse into a single
 * filter chip. "All" clears.
 */
const activityProjectFilter = ref("");

const uniqueActivityProjects = computed<string[]>(() => {
  const seen = new Set<string>();
  for (const row of projectRows.value) {
    const name = row.project.name;
    if (name) seen.add(name);
  }
  return Array.from(seen).sort();
});

function toggleActivityProject(name: string): void {
  activityProjectFilter.value =
    activityProjectFilter.value === name ? "" : name;
}

function projectFilterHref(
  surface: "issues" | "epics",
  name: string,
  state?: string,
): string {
  const encoded = encodeURIComponent(name);
  const suffix = state ? `&state=${state}` : "";
  return `/x/${surface}/?project=${encoded}${suffix}`;
}

/**
 * Group repositories by their first path segment (owner). Path
 * shapes the kernel returns include `comtrya/dogfood`,
 * `rawkode/rawkode`, `rawkode/hello/rawkode`, etc. — the first
 * segment is always the workspace's notion of "owner" (a user, a
 * team, or an imported source). Grouped collapsibles are the
 * polyrepo-scannable affordance from the LOOP_TODO macro bet.
 */
interface RepoGroup {
  owner: string;
  repos: RepositorySummary[];
  openPRs: number;
  openIssues: number;
}

const repoGroups = computed<RepoGroup[]>(() => {
  const buckets = new Map<string, RepositorySummary[]>();
  for (const repo of repositories.value) {
    const owner = (repo.path ?? "").split("/").filter(Boolean)[0] ?? "—";
    const bucket = buckets.get(owner) ?? [];
    bucket.push(repo);
    buckets.set(owner, bucket);
  }
  const groups: RepoGroup[] = [];
  for (const [owner, repos] of buckets.entries()) {
    let openPRs = 0;
    let openIssues = 0;
    for (const r of repos) {
      openPRs += r.openPullRequests ?? 0;
      openIssues += openIssuesByRepoId.value[r.id] ?? 0;
    }
    groups.push({ owner, repos, openPRs, openIssues });
  }
  groups.sort((a, b) => a.owner.localeCompare(b.owner));
  return groups;
});

/**
 * Flat order matching the visual order across groups, so the j/k
 * keyboard nav indexes into a single list and crosses group
 * boundaries transparently.
 */
const orderedRepos = computed<RepositorySummary[]>(() =>
  repoGroups.value.flatMap((g) => g.repos),
);

/**
 * Keyboard focus index into the repo list. Mirrors `IssuesList.vue`
 * and `PullsQueue.vue` — j/k advance, Enter opens the focused row.
 * Clamped on load so it never points past the end of the list, and
 * reset to 0 when the list grows from empty.
 */
const focusedRepoIdx = ref(0);
const router = useRouter();

watch(orderedRepos, (next) => {
  if (next.length === 0) {
    focusedRepoIdx.value = 0;
    return;
  }
  if (focusedRepoIdx.value >= next.length) {
    focusedRepoIdx.value = Math.max(0, next.length - 1);
  }
});

useShortcuts({
  j: (event) => {
    if (orderedRepos.value.length === 0) return;
    event.preventDefault();
    focusedRepoIdx.value = Math.min(
      focusedRepoIdx.value + 1,
      orderedRepos.value.length - 1,
    );
  },
  ArrowDown: (event) => {
    if (orderedRepos.value.length === 0) return;
    event.preventDefault();
    focusedRepoIdx.value = Math.min(
      focusedRepoIdx.value + 1,
      orderedRepos.value.length - 1,
    );
  },
  k: (event) => {
    if (orderedRepos.value.length === 0) return;
    event.preventDefault();
    focusedRepoIdx.value = Math.max(focusedRepoIdx.value - 1, 0);
  },
  ArrowUp: (event) => {
    if (orderedRepos.value.length === 0) return;
    event.preventDefault();
    focusedRepoIdx.value = Math.max(focusedRepoIdx.value - 1, 0);
  },
  Enter: (event) => {
    const repo = orderedRepos.value[focusedRepoIdx.value];
    if (!repo) return;
    event.preventDefault();
    void router.push(`/r/${repo.path}`);
  },
});
interface WorkspaceSlotRow {
  name: WorkspaceHomeSlotName;
  label: string;
}

const topSlot: WorkspaceSlotRow = { name: "workspace.home.top", label: "Focus" };
const leftSlot: WorkspaceSlotRow = { name: "workspace.home.left", label: "Activity" };
const centerSlot: WorkspaceSlotRow = {
  name: "workspace.home.center",
  label: "Extension Repositories",
};
const rightSlot: WorkspaceSlotRow = { name: "workspace.home.right", label: "Instance" };
const workspaceSlotContext = computed<Record<string, unknown>>(() => ({
  workspaceName: workspace.value.name,
  repositoryCount: repositories.value.length,
}));
let loadController: AbortController | undefined;

onMounted(() => {
  void loadWorkspaceHome();
  for (const type of [
    "dev.comtrya.issues.opened",
    "dev.comtrya.issues.closed",
    "dev.comtrya.issues.reopened",
  ]) {
    issueUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => {
          void refreshAllOpenIssues();
          void refreshProjectCounts();
        },
        onError: () => {},
      }),
    );
  }
  // iter 67 emits this when an issue is retroactively assigned
  // to a Project; the workspace per-Project counts (iter 65)
  // need to swap one bucket without a full re-scan.
  issueUnsubscribers.push(
    subscribeLiveEvents({
      type: "dev.comtrya.issues.project-changed",
      onEvent: () => void refreshProjectCounts(),
      onError: () => {},
    }),
  );
  for (const type of [
    "dev.comtrya.epic.created",
    "dev.comtrya.epic.state-changed",
    // iter 69 emits on retroactive epic-Project reassignment;
    // same bucket-swap motivation as the issues equivalent.
    "dev.comtrya.epic.project-changed",
  ]) {
    issueUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void refreshProjectCounts(),
        onError: () => {},
      }),
    );
  }
});
onUnmounted(() => {
  loadController?.abort();
  for (const off of issueUnsubscribers) off();
  issueUnsubscribers.length = 0;
});

// Hydrate per-repo issue counts once the workspace summary resolves.
watch([workspaceId, repositories], () => void refreshAllOpenIssues());

// Hydrate the workspace-wide CUE Projects list at the same time -
// triggered on repos changing (mount or live insert from
// imported-repository events).
watch(repositories, () => void refreshAllProjects(), { immediate: true });

// Per-project work counts depend on the workspace id being
// available; refresh once that and the repo set resolve, then
// keep the counts hot via the issue/epic SSE topics below.
watch([workspaceId, repositories], () => void refreshProjectCounts());

async function loadWorkspaceHome(): Promise<void> {
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  loadState.value = "loading";
  loadError.value = null;
  try {
    payload.value = await fetchWorkspaceHome(controller.signal);
    loadState.value = "ready";
  } catch (error) {
    if (controller.signal.aborted) return;
    payload.value = null;
    loadState.value = "error";
    loadError.value = error instanceof Error ? error.message : String(error);
  }
}

async function fetchWorkspaceHome(signal: AbortSignal): Promise<WorkspaceHomePayload> {
  const response = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: WORKSPACE_HOME_QUERY }),
    signal,
  });
  const envelope = (await response.json()) as {
    data?: WorkspaceHomePayload;
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || envelope.errors?.length) {
    throw new Error(envelope.errors?.[0]?.message ?? response.statusText);
  }
  if (!envelope.data?.workspace) {
    throw new Error("workspace home response did not include workspace data");
  }
  return envelope.data;
}

function openPullRequestText(repo: RepositorySummary): string {
  const count = repo.openPullRequests ?? 0;
  return `${count} open PR${count === 1 ? "" : "s"}`;
}

function openIssuesText(repo: RepositorySummary): string {
  const count = openIssuesByRepoId.value[repo.id] ?? 0;
  return `${count} open issue${count === 1 ? "" : "s"}`;
}

function flatIndexOf(repo: RepositorySummary): number {
  return orderedRepos.value.indexOf(repo);
}

function relativeUpdated(value: string | null | undefined): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return value;
  const diff = Math.max(0, Date.now() - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / week)}w ago`;
}
</script>

<template>
  <div data-smoke="home-shell">
    <section class="page-header">
      <div class="title-group">
        <span class="overline">Workspace</span>
        <h1>{{ workspace.name }}</h1>
      </div>
      <div class="summary-grid" aria-label="Workspace summary">
        <div>
          <span>Repositories</span>
          <strong>{{ repositories.length }}</strong>
        </div>
        <div>
          <span>Extensions</span>
          <strong>{{ extensionCount }}</strong>
        </div>
        <div>
          <span>Runtime</span>
          <strong>{{ extensionRuntime }}</strong>
        </div>
      </div>
    </section>

    <section class="home-actions">
      <div>
        <span class="overline">/ · workspace</span>
        <p>{{ repositories.length }} {{ repositoryWord }} available from the live kernel.</p>
      </div>
      <a href="/new" data-smoke="home-new-repo-cta">+ New repository</a>
    </section>

    <p v-if="loadState === 'error'" class="repo-state" role="alert">{{ loadError }}</p>

    <section class="home-grid">
      <div class="home-spine" data-smoke="home-spine">
        <div
          v-if="uniqueActivityProjects.length > 0"
          class="activity-project-filter"
          data-smoke="activity-project-filter"
          aria-label="Filter activity stream by project"
        >
          <span class="filter-label">scope ·</span>
          <button
            type="button"
            class="filter-chip"
            :class="{ active: activityProjectFilter === '' }"
            @click="activityProjectFilter = ''"
          >all</button>
          <button
            v-for="name in uniqueActivityProjects"
            :key="name"
            type="button"
            class="filter-chip"
            :class="{ active: activityProjectFilter === name }"
            @click="toggleActivityProject(name)"
          >◇ {{ name }}</button>
        </div>
        <ActivityStream :project-name="activityProjectFilter || undefined" />


        <SlotMount
          :name="topSlot.name"
          :label="topSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />

        <section class="panel home-repositories" data-smoke="home-repositories">
          <header class="panel-heading">
            <h2>Repositories</h2>
            <a href="/new" data-smoke="home-repositories-new">+ New</a>
          </header>

          <p v-if="loadState === 'loading'" class="home-empty">Loading repositories</p>
          <p v-else-if="repositories.length === 0" class="home-empty">
            No repositories yet. <a href="/new">Create one</a> to get started.
          </p>
          <div v-else class="home-repo-groups" role="listbox" aria-label="Repositories">
            <details
              v-for="group in repoGroups"
              :key="group.owner"
              class="home-repo-group"
              open
            >
              <summary class="home-repo-group-head">
                <span class="owner">{{ group.owner }}/</span>
                <span class="counts">
                  {{ group.repos.length }} repo<template v-if="group.repos.length !== 1">s</template>
                  <span class="sep">·</span>
                  {{ group.openPRs }} open PR<template v-if="group.openPRs !== 1">s</template>
                  <span class="sep">·</span>
                  {{ group.openIssues }} open issue<template v-if="group.openIssues !== 1">s</template>
                </span>
              </summary>
              <ul class="home-repo-list">
                <li
                  v-for="repo in group.repos"
                  :key="repo.id"
                  :class="{ focused: flatIndexOf(repo) === focusedRepoIdx }"
                  :aria-selected="flatIndexOf(repo) === focusedRepoIdx"
                  role="option"
                  @mouseenter="focusedRepoIdx = flatIndexOf(repo)"
                >
                  <a :href="`/r/${repo.path}`">{{ repo.path }}</a>
                  <p v-if="repo.description">{{ repo.description }}</p>
                  <span class="repo-meta">
                    <code v-if="repo.defaultBranch">{{ repo.defaultBranch }}</code>
                    <span v-if="repo.visibility">{{ repo.visibility.toLowerCase() }}</span>
                    <span>{{ openPullRequestText(repo) }}</span>
                    <span>{{ openIssuesText(repo) }}</span>
                    <span v-if="repo.updated">updated {{ relativeUpdated(repo.updated) }}</span>
                  </span>
                </li>
              </ul>
            </details>
          </div>
          <footer v-if="repositories.length > 0" class="home-repo-foot">
            <kbd>j</kbd> <kbd>k</kbd> navigate · <kbd>↵</kbd> open
          </footer>
        </section>

        <SlotMount
          :name="leftSlot.name"
          :label="leftSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />
      </div>

      <aside class="home-rail">
        <section
          v-if="projectRows.length > 0 || projectsLoadState === 'loading'"
          class="panel home-projects"
          data-smoke="home-projects"
        >
          <header class="panel-heading">
            <h2>Projects</h2>
            <span class="meta" aria-hidden="true">
              {{ projectRows.length }} declared
            </span>
          </header>
          <p v-if="projectsLoadState === 'loading'" class="home-empty">
            Resolving CUE projects…
          </p>
          <ul v-else class="home-projects-list" aria-label="CUE projects across the workspace">
            <li
              v-for="row in projectRows"
              :key="`${row.repoPath}::${row.project.name}`"
              class="home-project-row"
            >
              <RouterLink :to="projectHomeHref(row)" class="home-project-link">
                <span class="home-project-glyph" aria-hidden="true">◇</span>
                <span class="home-project-name">{{ row.project.name }}</span>
                <span class="home-project-repo">{{ row.repoPath }}</span>
              </RouterLink>
              <div class="home-project-counts" aria-label="Project work counts">
                <RouterLink
                  :to="projectFilterHref('issues', row.project.name ?? '')"
                  class="home-project-count"
                  :data-zero="countsFor(row.project.name).openIssues === 0"
                  :title="`Open issues in ${row.project.name}`"
                >
                  <span class="count-num">{{ countsFor(row.project.name).openIssues }}</span>
                  <span class="count-label">open</span>
                </RouterLink>
                <RouterLink
                  :to="projectFilterHref('epics', row.project.name ?? '', 'IN_PROGRESS')"
                  class="home-project-count"
                  :data-zero="countsFor(row.project.name).epicsInProgress === 0"
                  :title="`In-progress epics in ${row.project.name}`"
                >
                  <span class="count-num">{{ countsFor(row.project.name).epicsInProgress }}</span>
                  <span class="count-label">epics</span>
                </RouterLink>
                <RouterLink
                  :to="projectFilterHref('issues', row.project.name ?? '', 'CLOSED')"
                  class="home-project-count muted"
                  :data-zero="countsFor(row.project.name).closedIssues === 0"
                  :title="`Closed issues in ${row.project.name}`"
                >
                  <span class="count-num">{{ countsFor(row.project.name).closedIssues }}</span>
                  <span class="count-label">closed</span>
                </RouterLink>
              </div>
              <ul v-if="projectOwnerRefs(row.project).length > 0" class="home-project-owners">
                <li
                  v-for="ref in projectOwnerRefs(row.project)"
                  :key="ref"
                  class="home-project-owner"
                  :data-author-kind="classifyPrincipal(ref).kind"
                  :title="ref"
                >
                  <span class="chip-glyph">{{ classifyPrincipal(ref).glyph }}</span>
                  {{ classifyPrincipal(ref).label }}
                </li>
              </ul>
            </li>
          </ul>
          <p class="home-projects-source">
            From <code>package comtrya</code> across every repo in this workspace
          </p>
        </section>

        <SlotMount
          :name="centerSlot.name"
          :label="centerSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />
        <SlotMount
          :name="rightSlot.name"
          :label="rightSlot.label"
          :element-context="workspaceSlotContext"
          smoke-prefix="workspace-home-slot"
        />
      </aside>
    </section>
  </div>
</template>
