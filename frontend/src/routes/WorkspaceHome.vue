<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { invokeOp, subscribeLiveEvents } from "@comtrya/sdk-core";
import {
  classifyPrincipal,
  fetchComtryaProjects,
  useProjectCounts,
  type ComtryaProject,
} from "@comtrya/sdk-vue";
import ActivityStream from "../components/ActivityStream.vue";

interface RepositorySummary {
  id: string;
  name: string;
  path: string;
  groups: string[];
  description: string | null;
  openPullRequests: number | null;
  defaultBranch?: string | null;
  visibility?: string | null;
  vcs?: string | null;
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
      defaultBranch visibility vcs updated
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

/**
 * Workspace-wide aggregates surfaced on the summary strip. Both
 * tally counts already loaded per-repo: pull-request counts come
 * from the workspace GraphQL projection (`openPullRequests`),
 * issue counts from the per-repo `list-issues` op pass that the
 * sidebar uses too. The Inbox is the authoritative open-work
 * surface; these tiles link there so they read as actionable
 * jump-offs, not vanity numbers.
 */
const totalOpenIssues = computed(() => totalOpenIssuesFetched.value);
const totalOpenPulls = computed(() =>
  repositories.value.reduce((sum, r) => sum + (r.openPullRequests ?? 0), 0),
);
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

/**
 * Workspace-wide open-issue count. Per-repo `list-issues` calls
 * miss issues that were opened against the bare workspace URI
 * (workspace-scoped issues — what start.sh's smoke seeds), so the
 * summary tile fans out one extra `list-issues` against the
 * workspace URN itself and uses that as the authoritative total.
 * Re-fired on the same SSE topics the per-repo counts watch.
 */
const totalOpenIssuesFetched = ref(0);
// Tracks whether the workspace-wide open-issue fetch has resolved at least
// once. The count is hydrated by a separate invokeOp after the main GraphQL
// load, so the summary tile must show `—` (not a misleading 0) until then.
const workspaceOpenIssuesLoaded = ref(false);

async function refreshWorkspaceOpenIssues(): Promise<void> {
  const ws = workspaceId.value;
  if (!ws) return;
  const result = await invokeOp<Array<{ state?: string }>>(
    "ext_issues",
    "issues",
    "list-issues",
    { repository: `comtrya://workspace/${ws}`, limit: 1024 },
  );
  if (!result.ok || !Array.isArray(result.value)) return;
  totalOpenIssuesFetched.value = result.value.filter((issue) => {
    const s = (issue.state ?? "").toUpperCase();
    return s === "OPEN" || s === "REOPENED";
  }).length;
  workspaceOpenIssuesLoaded.value = true;
}

async function refreshAllOpenIssues(): Promise<void> {
  const ws = workspaceId.value;
  if (!ws) return;
  await Promise.all([
    refreshWorkspaceOpenIssues(),
    ...repositories.value.map((r) => refreshOpenIssueCount(r.id, ws)),
  ]);
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
// iter 76 — routed through the canonical
// `@comtrya/sdk-vue::useProjectCounts` composable so this surface
// and `ProjectsPanel` (iter 75) share one fetch + SSE subscriber
// implementation. The composable runs two workspace-wide ops on
// mount and re-fires on the seven topics that mutate
// project-tagged work; the watch below remains for resilience
// against the kernel re-emitting workspace id after initial
// mount.
const { countsFor, refresh: refreshProjectCounts } = useProjectCounts();

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

let loadController: AbortController | undefined;

onMounted(() => {
  void loadWorkspaceHome();
  // The per-repo open-issue counts are independent of the
  // workspace-wide per-project counts; iter 76 leaves only this
  // subscription here. The `useProjectCounts` composable owns
  // the seven topics that mutate project-tagged work.
  for (const type of [
    "dev.comtrya.issues.opened",
    "dev.comtrya.issues.closed",
    "dev.comtrya.issues.reopened",
  ]) {
    issueUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void refreshAllOpenIssues(),
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

</script>

<template>
  <div data-smoke="home-shell">
    <section class="page-header">
      <div class="title-group">
        <span class="overline">Workspace</span>
        <h1>{{ workspace.name }}</h1>
      </div>
      <div class="summary-grid" aria-label="Workspace summary" :aria-busy="loadState === 'loading'">
        <div>
          <span>Repositories</span>
          <strong>{{ loadState === 'loading' ? '—' : repositories.length }}</strong>
        </div>
        <RouterLink to="/inbox" class="summary-tile-link" :title="`${totalOpenIssues} open issues — see the Inbox`">
          <span>Open issues</span>
          <strong>{{ loadState === 'loading' || !workspaceOpenIssuesLoaded ? '—' : totalOpenIssues }}</strong>
        </RouterLink>
        <RouterLink to="/inbox" class="summary-tile-link" :title="`${totalOpenPulls} open pull requests — see the Inbox`">
          <span>Open pulls</span>
          <strong>{{ loadState === 'loading' ? '—' : totalOpenPulls }}</strong>
        </RouterLink>
        <div>
          <span>Extensions</span>
          <strong>{{ loadState === 'loading' ? '—' : extensionCount }}</strong>
        </div>
        <div>
          <span>Runtime</span>
          <strong>{{ loadState === 'loading' ? '—' : extensionRuntime }}</strong>
        </div>
      </div>
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
      </aside>
    </section>
  </div>
</template>
