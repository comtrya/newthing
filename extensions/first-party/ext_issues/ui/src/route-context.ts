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
  const inputWorkspaceId = present(input.workspaceId);
  const routeWorkspaceId = present(input.routeParams?.params?.workspaceId);
  const queryWorkspaceId = present(params.get("workspaceId"));
  const inputRepositoryId = present(input.repositoryId);
  const routeRepositoryId = present(input.routeParams?.params?.repositoryId);
  const queryRepositoryId = present(params.get("repositoryId"));
  const explicitRepositoryId = inputRepositoryId ?? routeRepositoryId;
  const inputProjectName = present(input.projectName);
  const routeProjectName = present(input.routeParams?.params?.projectName);
  const queryProjectName = present(params.get("projectName"));

  return {
    workspaceId: explicitRepositoryId
      ? inputWorkspaceId ?? routeWorkspaceId ?? queryWorkspaceId ?? defaultWorkspaceId()
      : queryWorkspaceId ?? inputWorkspaceId ?? routeWorkspaceId ?? defaultWorkspaceId(),
    repositoryId: explicitRepositoryId ?? queryRepositoryId ?? null,
    projectName: inputProjectName ?? routeProjectName ?? queryProjectName ?? null,
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
