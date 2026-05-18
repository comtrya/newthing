import type { OpResult } from "@comtrya/sdk-core";
import { extIssuesXIssues } from "../../dist/ext_issues.client";
import type { ComtryaGraphQLClient, Issue, IssueState, Relation } from "./types";

export const ISSUE_OUTGOING_RELATIONS_QUERY = `query($from: ResourceURN!, $kind: ResourceURN) {
  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }
}`;

export const ISSUE_INCOMING_RELATIONS_QUERY = `query($to: ResourceURN!, $kind: ResourceURN) {
  relations.incoming(to: $to, kind: $kind) { id kind from to source target }
}`;

export const CREATE_RELATION_MUTATION = `mutation($input: RelationCreateInput!) {
  relations.create(input: $input) { id kind from to source target }
}`;

export const DELETE_RELATION_MUTATION = `mutation($input: RelationDeleteInput!) {
  relations.delete(input: $input)
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
  projectName?: string | null;
  labels?: string[] | null;
  closeOnMerge?: boolean | null;
  assignees?: string[] | null;
}

interface OpenIssueInput {
  workspaceId: string;
  repositoryId?: string | null;
  title: string;
  bodyMarkdown?: string | null;
  projectName?: string | null;
  labels?: string[] | null;
  closeOnMerge?: boolean | null;
  assignees?: string[] | null;
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
    labels: value.labels ?? [],
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
    closedAt: value.closedAt ?? null,
    projectName: value.projectName ?? null,
    closeOnMerge: value.closeOnMerge ?? null,
    assignees: value.assignees ?? [],
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
    projectName: input.projectName ?? null,
    labels: input.labels ?? [],
    closeOnMerge: input.closeOnMerge ?? null,
    assignees: input.assignees ?? [],
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

/**
 * Retroactively assign (or clear) the Project this issue belongs
 * to. Routes through the iter 67 `assign-project` op, which trims
 * and normalises `projectName` server-side so blank values
 * become `null`. The op emits `dev.comtrya.issues.project-changed`
 * so workspace per-project counts (iter 65) update without a
 * refresh.
 */
export async function assignIssueProject(
  id: string,
  projectName: string | null,
): Promise<Issue> {
  const result = await extIssuesXIssues.assignProject({
    id,
    projectName: projectName ?? null,
  });
  return normalizeIssue(opValue<WitIssue>(result, "assignProject"));
}

export async function outgoingRelations(
  client: ComtryaGraphQLClient,
  from: string,
  kind?: string | null,
): Promise<Relation[]> {
  const data = await client.query<{ relations?: { outgoing?: Relation[] } }>(
    ISSUE_OUTGOING_RELATIONS_QUERY,
    kind ? { from, kind } : { from },
  );
  return (data.relations?.outgoing ?? []).map(normalizeRelation);
}

export async function incomingRelations(
  client: ComtryaGraphQLClient,
  to: string,
  kind?: string | null,
): Promise<Relation[]> {
  const data = await client.query<{ relations?: { incoming?: Relation[] } }>(
    ISSUE_INCOMING_RELATIONS_QUERY,
    kind ? { to, kind } : { to },
  );
  return (data.relations?.incoming ?? []).map(normalizeRelation);
}

export async function createRelation(
  client: ComtryaGraphQLClient,
  input: { from: string; to: string; kind: string },
): Promise<Relation> {
  const data = await client.mutate<{ relations?: { create?: Relation } }>(
    CREATE_RELATION_MUTATION,
    { input },
  );
  const relation = data.relations?.create;
  if (!relation) throw new Error("relations.create returned no relation");
  return normalizeRelation(relation);
}

export async function deleteRelation(
  client: ComtryaGraphQLClient,
  id: string,
): Promise<boolean> {
  const data = await client.mutate<{ relations?: { delete?: boolean } }>(
    DELETE_RELATION_MUTATION,
    { input: { id } },
  );
  return data.relations?.delete ?? false;
}

function normalizeRelation(relation: Relation): Relation {
  const from = relation.from ?? relation.source ?? "";
  const to = relation.to ?? relation.target ?? "";
  return {
    ...relation,
    from,
    to,
    source: relation.source ?? from,
    target: relation.target ?? to,
  };
}
