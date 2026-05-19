import { activeWorkspaceId } from "@comtrya/sdk-core";

/**
 * Resolve the active workspace id, sourced from the shell-published
 * store at call time. Returns `""` during the brief boot-race window
 * before `App.vue::loadShellSummary` runs; callers downstream of
 * `whenWorkspaceReady()` or `useWorkspaceContext()` (the preferred
 * paths) will never see the empty value. Replaces the previous
 * hardcoded `DEFAULT_WORKSPACE_ID` export — see #8 P1-1 part 2.
 */
export function defaultWorkspaceId(): string {
  return activeWorkspaceId() ?? "";
}

export type IssueState = "OPEN" | "CLOSED" | "REOPENED";

export interface Issue {
  id: string;
  workspaceId: string;
  repositoryId?: string | null;
  number: number;
  title: string;
  bodyMarkdown?: string | null;
  state: IssueState;
  stateReason?: string | null;
  authorRef?: string | null;
  labels?: string[] | null;
  createdAt?: string | null;
  /**
   * Kernel-stamped on open and on every state transition (close /
   * reopen / project-change). Used on list rows so the age column
   * reflects "last touched", not just "opened".
   */
  updatedAt?: string | null;
  closedAt?: string | null;
  /** Project this issue belongs to, stamped from the open-issue input. */
  projectName?: string | null;
  /**
   * Stamped from the Project's `issues.closeOnMerge` CUE config at open
   * time. `false` opts the issue out of the PR merge reactor's
   * auto-close path. `null`/undefined keeps the historical default.
   */
  closeOnMerge?: boolean | null;
  /**
   * Typed `comtrya://` URN assignees, pre-filled by the new-issue form
   * from the Project's CUE `owners[]` (iteration 26 typed-ref family).
   * Each entry is `comtrya://{user,agent,bot,credential,team}/<slug>`.
   */
  assignees?: string[] | null;
}

export interface Relation {
  id: string;
  kind: string;
  from?: string | null;
  to: string;
  source?: string | null;
  target?: string | null;
}

export interface ComtryaGraphQLClient {
  query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
  mutate<T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
}

export interface ExtensionRouteParams {
  scope?: string;
  routePrefix?: string;
  subPath?: string;
  params?: Record<string, string | undefined>;
}

export interface IssueTone {
  label: string;
  className: string;
}

export type LoadState = "idle" | "loading" | "ready" | "empty" | "error";

export function issueRef(issue: Pick<Issue, "id">): string {
  return `comtrya://issue/${issue.id}`;
}

import { buildExtensionUrl } from "@comtrya/sdk-core";

export const EXT_ISSUES_ROUTE_PREFIX = "issues";

export function issueHref(issue: Pick<Issue, "workspaceId" | "number">): string {
  return buildExtensionUrl(
    EXT_ISSUES_ROUTE_PREFIX,
    `/${issue.workspaceId}/${issue.number}`,
  );
}

export function issuesIndexHref(): string {
  return buildExtensionUrl(EXT_ISSUES_ROUTE_PREFIX, "/");
}

export function newIssueHref(): string {
  return buildExtensionUrl(EXT_ISSUES_ROUTE_PREFIX, "/new");
}

export function stateTone(state: IssueState | string | undefined): IssueTone {
  switch (state) {
    case "OPEN":
    case "REOPENED":
      return { label: "open", className: "issue-state-open" };
    case "CLOSED":
      return { label: "closed", className: "issue-state-closed" };
    default:
      return { label: "unknown", className: "issue-state-closed" };
  }
}
