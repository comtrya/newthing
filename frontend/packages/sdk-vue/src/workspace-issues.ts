import { invokeOp, type OpResult } from "@comtrya/sdk-core";

export interface WorkspaceIssueRepository {
  id: string;
}

export interface WorkspaceIssueRow {
  repository?: string;
  state?: string;
  projectName?: string | null;
}

type IssueInvoke = <T = unknown>(
  extensionId: string,
  interfaceName: string,
  opName: string,
  input?: unknown,
) => Promise<OpResult<T>>;

export interface ListWorkspaceRepositoryIssuesOptions {
  limitPerRepository?: number;
  invoke?: IssueInvoke;
  coalesce?: boolean;
}

const pendingRepositoryIssueReads = new Map<string, Promise<WorkspaceIssueRow[]>>();

export function workspaceRepositoryUri(
  workspaceId: string,
  repositoryId: string,
): string {
  return `comtrya://workspace/${workspaceId}/repository/${repositoryId}`;
}

export function workspaceIdFromUri(uri: string): string | null {
  const match = /^comtrya:\/\/workspace\/([^/]+)(?:$|\/)/.exec(uri);
  return match?.[1] ?? null;
}

export function issueRepositoryId(issue: WorkspaceIssueRow): string | null {
  const repository = issue.repository ?? "";
  const match = /\/repository\/([^/]+)$/.exec(repository);
  return match?.[1] ?? null;
}

export function isOpenIssueState(state: string | null | undefined): boolean {
  const normalized = (state ?? "").toUpperCase();
  return normalized === "OPEN" || normalized === "REOPENED";
}

export function countOpenIssues(issues: readonly WorkspaceIssueRow[]): number {
  return issues.filter((issue) => isOpenIssueState(issue.state)).length;
}

export function openIssueCountsByRepository(
  repositories: readonly WorkspaceIssueRepository[],
  issues: readonly WorkspaceIssueRow[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const repo of repositories) counts[repo.id] = 0;
  for (const issue of issues) {
    if (!isOpenIssueState(issue.state)) continue;
    const repoId = issueRepositoryId(issue);
    if (!repoId || !(repoId in counts)) continue;
    counts[repoId] = (counts[repoId] ?? 0) + 1;
  }
  return counts;
}

export async function listWorkspaceRepositoryIssues<
  T extends WorkspaceIssueRow = WorkspaceIssueRow,
>(
  workspaceId: string,
  repositories: readonly WorkspaceIssueRepository[],
  options: ListWorkspaceRepositoryIssuesOptions = {},
): Promise<T[]> {
  if (repositories.length === 0) return [];
  const call = options.invoke ?? invokeOp;
  const limit = options.limitPerRepository ?? 1024;
  const coalesce = options.coalesce ?? !options.invoke;
  const results = await Promise.all(
    repositories.map((repo) =>
      listRepositoryIssues<T>(workspaceId, repo.id, limit, call, coalesce),
    ),
  );
  return results.flat();
}

async function listRepositoryIssues<T extends WorkspaceIssueRow>(
  workspaceId: string,
  repositoryId: string,
  limit: number,
  call: IssueInvoke,
  coalesce: boolean,
): Promise<T[]> {
  const cacheKey = `${workspaceId}\0${repositoryId}\0${limit}`;
  if (coalesce) {
    const pending = pendingRepositoryIssueReads.get(cacheKey);
    if (pending) return pending as Promise<T[]>;
  }
  const pending = call<T[]>("ext_issues", "issues", "list-issues", {
    repository: workspaceRepositoryUri(workspaceId, repositoryId),
    limit,
  }).then((result) =>
    result.ok && Array.isArray(result.value) ? result.value : [],
  );
  if (!coalesce) return pending;
  pendingRepositoryIssueReads.set(cacheKey, pending);
  try {
    return await pending;
  } finally {
    if (pendingRepositoryIssueReads.get(cacheKey) === pending) {
      pendingRepositoryIssueReads.delete(cacheKey);
    }
  }
}
