import { defaultWorkspaceId, type ExtensionRouteParams } from "./types";

export interface IssueRouteContextInput {
  workspaceId?: string | null;
  repositoryId?: string | null;
  projectName?: string | null;
  state?: string | null;
  routeParams?: ExtensionRouteParams;
}

export interface IssueRouteContext {
  workspaceId: string;
  repositoryId?: string | null;
  projectName?: string | null;
  state?: string | null;
}

export function issueRouteContext(
  input: IssueRouteContextInput = {},
  search = currentSearch(),
): IssueRouteContext {
  const params = new URLSearchParams(search);
  return {
    workspaceId:
      present(params.get("workspaceId")) ??
      present(input.workspaceId) ??
      present(input.routeParams?.params?.workspaceId) ??
      defaultWorkspaceId(),
    repositoryId:
      present(params.get("repositoryId")) ??
      present(input.repositoryId) ??
      present(input.routeParams?.params?.repositoryId) ??
      null,
    projectName:
      present(params.get("projectName")) ??
      present(input.projectName) ??
      present(input.routeParams?.params?.projectName) ??
      null,
    state: present(params.get("state")) ?? present(input.state) ?? null,
  };
}

function currentSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}

function present(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
