import { activeWorkspaceId } from "@comtrya/sdk-core";

/**
 * Resolve the active workspace id from the shell store. Returns `""`
 * during the boot-race window only; production callers gate on
 * `whenWorkspaceReady()` first. Replaces the previous hardcoded
 * `DEFAULT_WORKSPACE_ID` export — see #8 P1-1 part 2.
 */
export function defaultWorkspaceId(): string {
  return activeWorkspaceId() ?? "";
}

export type EpicState = "PLANNED" | "IN_PROGRESS" | "AT_RISK" | "DONE" | "CANCELED";
export type LoadState = "idle" | "loading" | "ready" | "empty" | "error";

export interface Epic {
  id: string;
  workspaceId: string;
  title: string;
  bodyMarkdown?: string | null;
  state: EpicState;
  targetDate?: string | null;
  ownerRef?: string | null;
  labels?: string[] | null;
  createdAt?: string | null;
  closedAt?: string | null;
  /** Project this epic belongs to, stamped from the create input. */
  projectName?: string | null;
}

export interface EpicProgress {
  issuesOpen?: number | null;
  issuesClosed?: number | null;
  childEpicsOpen?: number | null;
  childEpicsClosed?: number | null;
  percentComplete?: number | null;
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

export interface EpicTone {
  label: string;
  className: string;
}

import { buildExtensionUrl } from "@comtrya/sdk-core";

export const EXT_EPICS_ROUTE_PREFIX = "epics";

export function epicRef(epic: Pick<Epic, "id">): string {
  return `comtrya://epic/${epic.id}`;
}

export function epicHref(epic: Pick<Epic, "workspaceId" | "id">): string {
  return buildExtensionUrl(
    EXT_EPICS_ROUTE_PREFIX,
    `/${epic.workspaceId}/${epic.id}`,
  );
}

export function newEpicHref(workspaceId: string): string {
  return `${buildExtensionUrl(EXT_EPICS_ROUTE_PREFIX, "/new")}?workspaceId=${workspaceId}`;
}

export function stateTone(state: EpicState | string | undefined): EpicTone {
  switch (state) {
    case "PLANNED":
      return { label: "planned", className: "epic-state-muted" };
    case "IN_PROGRESS":
      return { label: "in progress", className: "epic-state-good" };
    case "AT_RISK":
      return { label: "at risk", className: "epic-state-warn" };
    case "DONE":
      return { label: "done", className: "epic-state-good" };
    case "CANCELED":
      return { label: "canceled", className: "epic-state-muted" };
    default:
      return { label: "unknown", className: "epic-state-muted" };
  }
}
