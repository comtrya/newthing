export const DEFAULT_WORKSPACE_ID = "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";

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
  closedAt?: string | null;
}

export interface Relation {
  id: string;
  to: string;
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

export function issueHref(issue: Pick<Issue, "workspaceId" | "number">): string {
  return `/x/issues/${issue.workspaceId}/${issue.number}`;
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
