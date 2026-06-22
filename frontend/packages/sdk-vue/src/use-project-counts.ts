/**
 * Workspace-wide per-Project work counts.
 *
 * Two surfaces shipped the same bucketing logic with subtle drift:
 *   - WorkspaceHome (iter 65) — the spine canvas counts.
 *   - RepoHome ProjectsPanel (iter 75) — counts on each project
 *     card.
 *
 * This composable promotes the shared shape to `@comtrya/sdk-vue`
 * so future Project-spine surfaces (epic side rails, project home
 * tabs, board view) read from one source. The counts ref + SSE
 * subscription set is the part that genuinely repeats; the
 * filter URL builders stay at the call site since they're
 * extension-specific.
 *
 * Triggers `refresh()` on mount and re-runs whenever any of the
 * seven `dev.comtrya.{issues,epic}.*` topics fires. The single
 * stream tears down on unmount automatically. Issue reads fan out
 * across repository-scoped extension installations; epic reads remain
 * workspace-scoped.
 */

import { onMounted, onUnmounted, ref } from "vue";
import {
  activeWorkspaceUri,
  getGraphQLClient,
  getSessionToken,
  invokeOp,
  subscribeLiveEvents,
  whenWorkspaceReady,
} from "@comtrya/sdk-core";
import {
  listWorkspaceRepositoryIssues,
  workspaceIdFromUri,
  type WorkspaceIssueRepository,
} from "./workspace-issues";

const TRACKED_TOPICS = new Set([
  "dev.comtrya.issues.opened",
  "dev.comtrya.issues.closed",
  "dev.comtrya.issues.reopened",
  "dev.comtrya.issues.project-changed",
  "dev.comtrya.epic.created",
  "dev.comtrya.epic.state-changed",
  "dev.comtrya.epic.project-changed",
]);

export interface ProjectCounts {
  openIssues: number;
  closedIssues: number;
  epicsPlanned: number;
  epicsInProgress: number;
  epicsDone: number;
}

export function emptyProjectCounts(): ProjectCounts {
  return {
    openIssues: 0,
    closedIssues: 0,
    epicsPlanned: 0,
    epicsInProgress: 0,
    epicsDone: 0,
  };
}

export interface UseProjectCountsOptions {
  /**
   * Workspace URI to scope listing against. Defaults to the
   * shell-active workspace published by `App.vue::loadShellSummary`
   * via `setActiveWorkspaceId`. Callers may override (e.g. an
   * embedded preview rendering a different workspace's projects).
   */
  workspace?: string;
}

interface IssueLite {
  repository?: string;
  state?: string;
  projectName?: string | null;
}

interface EpicLite {
  state?: string;
  projectName?: string | null;
}

export function useProjectCounts(options: UseProjectCountsOptions = {}) {
  const counts = ref<Record<string, ProjectCounts>>({});
  const isReady = ref(false);
  const unsubscribers: Array<() => void> = [];
  let streamStarting = false;

  async function loadWorkspaceRepositories(): Promise<WorkspaceIssueRepository[]> {
    const data = await getGraphQLClient().query<{
      workspace?: { repositories?: WorkspaceIssueRepository[] };
    }>("{ workspace { repositories { id } } }");
    return data.workspace?.repositories ?? [];
  }

  /** Resolve the workspace ID fresh on each refresh so we pick up
   *  whichever ID the shell store has by then. An explicit `options.
   *  workspace` always wins. Returns `null` if neither is available
   *  (we then skip the fetch instead of querying the wrong scope). */
  async function resolveWorkspaceId(): Promise<string | null> {
    if (options.workspace) return workspaceIdFromUri(options.workspace);
    const live = activeWorkspaceUri();
    const liveWorkspaceId = live ? workspaceIdFromUri(live) : null;
    if (liveWorkspaceId) return liveWorkspaceId;
    // Bootstrap window: wait until the shell has resolved a workspace.
    return await whenWorkspaceReady();
  }

  async function refresh(): Promise<void> {
    const workspaceId = await resolveWorkspaceId();
    if (!workspaceId) return;
    const [repositories, epicsRes] = await Promise.all([
      loadWorkspaceRepositories(),
      invokeOp<EpicLite[]>("ext_epics", "epics", "list-epics", {
        workspace: `comtrya://workspace/${workspaceId}`,
        limit: 4096,
      }),
    ]);
    const issues = await listWorkspaceRepositoryIssues<IssueLite>(
      workspaceId,
      repositories,
      { limitPerRepository: 4096 },
    );
    const next: Record<string, ProjectCounts> = {};
    const bucket = (name: string): ProjectCounts =>
      (next[name] ??= emptyProjectCounts());
    for (const issue of issues) {
      const project = (issue.projectName ?? "").trim();
      if (!project) continue;
      const c = bucket(project);
      const state = (issue.state ?? "").toUpperCase();
      if (state === "CLOSED") c.closedIssues += 1;
      else c.openIssues += 1;
    }
    if (epicsRes.ok && Array.isArray(epicsRes.value)) {
      for (const epic of epicsRes.value) {
        const project = (epic.projectName ?? "").trim();
        if (!project) continue;
        const c = bucket(project);
        const state = (epic.state ?? "").toUpperCase();
        if (state === "DONE" || state === "CANCELED") c.epicsDone += 1;
        else if (state === "IN_PROGRESS" || state === "AT_RISK") {
          c.epicsInProgress += 1;
        } else c.epicsPlanned += 1;
      }
    }
    counts.value = next;
    isReady.value = true;
  }

  function countsFor(name: string | null | undefined): ProjectCounts {
    if (!name) return emptyProjectCounts();
    return counts.value[name] ?? emptyProjectCounts();
  }

  async function startLiveRefreshStream(): Promise<void> {
    if (unsubscribers.length > 0 || streamStarting) return;
    streamStarting = true;
    let token: string | undefined;
    try {
      token = await getSessionToken();
    } catch {
      token = undefined;
    } finally {
      streamStarting = false;
    }
    unsubscribers.push(
      subscribeLiveEvents({
        token,
        onEvent: (event) => {
          if (TRACKED_TOPICS.has(event.eventType)) void refresh();
        },
        onError: () => {},
      }),
    );
  }

  onMounted(() => {
    void refresh();
    void startLiveRefreshStream();
  });

  onUnmounted(() => {
    for (const off of unsubscribers) off();
    unsubscribers.length = 0;
  });

  return { counts, isReady, refresh, countsFor };
}
