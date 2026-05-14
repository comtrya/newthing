import type { ComtryaGraphQLClient, Issue, Relation } from "./types";

export const ISSUES_LIST_QUERY = `query($workspaceId: ID, $repositoryId: ID, $state: String) {
  issues.list(workspaceId: $workspaceId, repositoryId: $repositoryId, state: $state) {
    id workspaceId repositoryId number title state authorRef labels createdAt
  }
}`;

export const ISSUE_BY_REF_QUERY = `query($ref: ResourceURN!) {
  issues.byRef(ref: $ref) {
    id workspaceId repositoryId number title bodyMarkdown state stateReason authorRef labels createdAt closedAt
  }
}`;

export const ISSUE_BY_NUMBER_QUERY = `query($workspaceId: ID!, $number: Int!) {
  issues.byNumber(workspaceId: $workspaceId, number: $number) {
    id workspaceId repositoryId number title bodyMarkdown state stateReason authorRef labels createdAt closedAt
  }
}`;

export const CLOSE_ISSUE_MUTATION = `mutation($input: CloseIssueInput!) {
  issues.close(input: $input) { id workspaceId repositoryId number title bodyMarkdown state stateReason authorRef labels createdAt closedAt }
}`;

export const REOPEN_ISSUE_MUTATION = `mutation($input: ReopenIssueInput!) {
  issues.reopen(input: $input) { id workspaceId repositoryId number title bodyMarkdown state stateReason authorRef labels createdAt closedAt }
}`;

export const ISSUE_RELATIONS_QUERY = `query($from: ResourceURN!) {
  relations.outgoing(from: $from, kind: "comtrya://rel/part-of") { id to }
}`;

export async function listIssues(
  client: ComtryaGraphQLClient,
  variables: {
    workspaceId: string;
    repositoryId?: string | null;
    state?: string | null;
  },
): Promise<Issue[]> {
  const data = await client.query<{ issues?: { list?: Issue[] } }>(
    ISSUES_LIST_QUERY,
    {
      workspaceId: variables.workspaceId,
      repositoryId: variables.repositoryId ?? null,
      state: variables.state ?? null,
    },
  );
  return data.issues?.list ?? [];
}

export async function issueByRef(
  client: ComtryaGraphQLClient,
  ref: string,
): Promise<Issue | null> {
  const data = await client.query<{ issues?: { byRef?: Issue | null } }>(
    ISSUE_BY_REF_QUERY,
    { ref },
  );
  return data.issues?.byRef ?? null;
}

export async function issueByNumber(
  client: ComtryaGraphQLClient,
  workspaceId: string,
  number: number,
): Promise<Issue | null> {
  const data = await client.query<{ issues?: { byNumber?: Issue | null } }>(
    ISSUE_BY_NUMBER_QUERY,
    { workspaceId, number },
  );
  return data.issues?.byNumber ?? null;
}

export async function closeIssue(
  client: ComtryaGraphQLClient,
  id: string,
): Promise<Issue> {
  const data = await client.mutate<{ issues?: { close?: Issue } }>(
    CLOSE_ISSUE_MUTATION,
    { input: { id, reason: "completed" } },
  );
  if (!data.issues?.close) throw new Error("closeIssue returned no issue");
  return data.issues.close;
}

export async function reopenIssue(
  client: ComtryaGraphQLClient,
  id: string,
): Promise<Issue> {
  const data = await client.mutate<{ issues?: { reopen?: Issue } }>(
    REOPEN_ISSUE_MUTATION,
    { input: { id } },
  );
  if (!data.issues?.reopen) throw new Error("reopenIssue returned no issue");
  return data.issues.reopen;
}

export async function issueRelations(
  client: ComtryaGraphQLClient,
  issueId: string,
): Promise<Relation[]> {
  const data = await client.query<{ relations?: { outgoing?: Relation[] } }>(
    ISSUE_RELATIONS_QUERY,
    { from: `comtrya://issue/${issueId}` },
  );
  return data.relations?.outgoing ?? [];
}
