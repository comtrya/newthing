export interface ComtryaGraphQLClient {
  query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
}

export type LoadState = "idle" | "loading" | "ready" | "empty" | "error";

export interface WorkItem {
  id?: string | number | null;
  number?: string | number | null;
  title?: string | null;
  author?: string | null;
  repository?: string | null;
  repositoryPath?: string | null;
  state?: string | null;
  branch?: string | null;
  name?: string | null;
  updatedAt?: string | null;
  time?: string | null;
  checks?: {
    passed?: number | null;
    total?: number | null;
  } | null;
}

export interface RepositoryItem {
  id: string;
  name?: string | null;
  groups?: string[] | null;
  openPullRequests?: number | null;
  checkSummary?: {
    passed?: number | null;
    total?: number | null;
  } | null;
  lastCommitAt?: string | null;
}

export interface ActivityEvent {
  summary?: string | null;
  repositoryPath?: string | null;
  actor?: string | null;
  time?: string | null;
}
