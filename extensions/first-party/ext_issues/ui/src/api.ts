import type { OpResult } from "@comtrya/sdk-core";
import { extIssuesXIssues } from "../../dist/ext_issues.client";
import type { ComtryaGraphQLClient, Issue, IssueState, Relation } from "./types";

export const ISSUE_RELATIONS_QUERY = `query($from: ResourceURN!) {
  relations.outgoing(from: $from, kind: "comtrya://rel/part-of") { id to }
}`;

interface WitIssue {
  id: string;
  repository?: string | null;
  title: string;
  bodyMarkdown?: string | null;
  state?: string | null;
  stateReason?: string | null;
  number: number;
  authorRef?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  closedAt?: string | null;
}

interface OpenIssueInput {
  workspaceId: string;
  repositoryId?: string | null;
  title: string;
  bodyMarkdown?: string | null;
}

function opValue<T>(result: OpResult<unknown>, label: string): T {
  if (result.ok) return result.value as T;
  throw new Error(`${label}: ${result.error.message}`);
}

function repositoryUri(workspaceId: string, repositoryId?: string | null): string {
  return repositoryId
    ? `comtrya://workspace/${workspaceId}/repository/${repositoryId}`
    : `comtrya://workspace/${workspaceId}`;
}

function repositoryParts(repository?: string | null): {
  workspaceId: string;
  repositoryId?: string | null;
} {
  const match = repository?.match(
    /^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/([^/]+))?$/,
  );
  return {
    workspaceId: match?.[1] ?? "",
    repositoryId: match?.[2] ?? null,
  };
}

function issueState(value?: string | null): IssueState {
  switch (value) {
    case "closed":
    case "CLOSED":
      return "CLOSED";
    case "reopened":
    case "REOPENED":
      return "REOPENED";
    default:
      return "OPEN";
  }
}

function normalizeIssue(value: WitIssue): Issue {
  const parts = repositoryParts(value.repository);
  return {
    id: value.id,
    workspaceId: parts.workspaceId,
    repositoryId: parts.repositoryId,
    number: value.number,
    title: value.title,
    bodyMarkdown: value.bodyMarkdown ?? "",
    state: issueState(value.state),
    stateReason: value.stateReason ?? null,
    authorRef: value.authorRef ?? null,
    labels: [],
    createdAt: value.createdAt ?? null,
    closedAt: value.closedAt ?? null,
  };
}

export async function listIssues(
  _client: ComtryaGraphQLClient,
  variables: {
    workspaceId: string;
    repositoryId?: string | null;
    state?: string | null;
  },
): Promise<Issue[]> {
  const result = await extIssuesXIssues.listIssues({
    repository: repositoryUri(variables.workspaceId, variables.repositoryId),
    limit: 1024,
  });
  const issues = opValue<WitIssue[]>(result, "listIssues").map(normalizeIssue);
  const state = variables.state ? issueState(variables.state) : null;
  return state ? issues.filter((issue) => issue.state === state) : issues;
}

export async function issueByRef(
  _client: ComtryaGraphQLClient,
  ref: string,
): Promise<Issue | null> {
  const result = await extIssuesXIssues.byRefIssue(ref);
  const issue = opValue<WitIssue | null>(result, "issueByRef");
  return issue ? normalizeIssue(issue) : null;
}

export async function issueByNumber(
  _client: ComtryaGraphQLClient,
  workspaceId: string,
  number: number,
): Promise<Issue | null> {
  const result = await extIssuesXIssues.byNumberIssue({ workspaceId, number });
  const issue = opValue<WitIssue | null>(result, "issueByNumber");
  return issue ? normalizeIssue(issue) : null;
}

export async function openIssue(input: OpenIssueInput): Promise<Issue> {
  const result = await extIssuesXIssues.openIssue({
    repository: repositoryUri(input.workspaceId, input.repositoryId),
    title: input.title,
    bodyMarkdown: input.bodyMarkdown ?? "",
  });
  return normalizeIssue(opValue<WitIssue>(result, "openIssue"));
}

export async function closeIssue(
  _client: ComtryaGraphQLClient,
  id: string,
): Promise<Issue> {
  const result = await extIssuesXIssues.closeIssue({
    id,
    reason: "completed",
  });
  return normalizeIssue(opValue<WitIssue>(result, "closeIssue"));
}

export async function reopenIssue(
  _client: ComtryaGraphQLClient,
  id: string,
): Promise<Issue> {
  const result = await extIssuesXIssues.reopenIssue(id);
  return normalizeIssue(opValue<WitIssue>(result, "reopenIssue"));
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
