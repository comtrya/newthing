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
 * seven `dev.comtrya.{issues,epic}.*` topics fires. Subscriptions
 * tear down on unmount automatically. Pass `workspace` if you
 * want to scope the listing; the default is the dogfood workspace
 * URI (matches the existing call sites' constant).
 */

import { onMounted, onUnmounted, ref } from "vue";
import { invokeOp, subscribeLiveEvents } from "@comtrya/sdk-core";

const DEFAULT_WORKSPACE_URI = "comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";

const TRACKED_TOPICS = [
  "dev.comtrya.issues.opened",
  "dev.comtrya.issues.closed",
  "dev.comtrya.issues.reopened",
  "dev.comtrya.issues.project-changed",
  "dev.comtrya.epic.created",
  "dev.comtrya.epic.state-changed",
  "dev.comtrya.epic.project-changed",
] as const;

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
   * dogfood workspace URI to match the existing call sites'
   * behaviour. Once the kernel exposes the current viewer's
   * workspace via auth, the call sites can pass it explicitly.
   */
  workspace?: string;
}

interface IssueLite {
  state?: string;
  projectName?: string | null;
}

interface EpicLite {
  state?: string;
  projectName?: string | null;
}

export function useProjectCounts(options: UseProjectCountsOptions = {}) {
  const workspace = options.workspace ?? DEFAULT_WORKSPACE_URI;
  const counts = ref<Record<string, ProjectCounts>>({});
  const isReady = ref(false);
  const unsubscribers: Array<() => void> = [];

  async function refresh(): Promise<void> {
    const [issuesRes, epicsRes] = await Promise.all([
      invokeOp<IssueLite[]>("ext_issues", "issues", "list-issues", {
        repository: workspace,
        limit: 4096,
      }),
      invokeOp<EpicLite[]>("ext_epics", "epics", "list-epics", {
        workspace,
        limit: 4096,
      }),
    ]);
    const next: Record<string, ProjectCounts> = {};
    const bucket = (name: string): ProjectCounts =>
      (next[name] ??= emptyProjectCounts());
    if (issuesRes.ok && Array.isArray(issuesRes.value)) {
      for (const issue of issuesRes.value) {
        const project = (issue.projectName ?? "").trim();
        if (!project) continue;
        const c = bucket(project);
        const state = (issue.state ?? "").toUpperCase();
        if (state === "CLOSED") c.closedIssues += 1;
        else c.openIssues += 1;
      }
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

  onMounted(() => {
    void refresh();
    for (const type of TRACKED_TOPICS) {
      unsubscribers.push(
        subscribeLiveEvents({
          type,
          onEvent: () => void refresh(),
          onError: () => {},
        }),
      );
    }
  });

  onUnmounted(() => {
    for (const off of unsubscribers) off();
    unsubscribers.length = 0;
  });

  return { counts, isReady, refresh, countsFor };
}
