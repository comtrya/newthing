/**
 * Pull-request API surface for the ext_pull_requests UI.
 *
 * The kernel exposes the underlying WIT ops at /api/ops/<ext>/<iface>/<op>.
 * We invoke them through @comtrya/sdk-core::invokeOp so the UI bundle does
 * not need to wait for the codegen step to land a .client.ts on disk —
 * matches the contract enforced by crates/server/build.rs.
 */

import { getGraphQLClient, invokeOp, type OpResult } from "@comtrya/sdk-core";
import type { PrState, PullRequest } from "./types";

/** Verb the merge reactor and PR create flow stamp on PR→issue links. */
export const CLOSES_RELATION_KIND = "comtrya://rel/com.comtrya.pulls/closes";

export interface LinkedIssue {
  id: string;
  number: number | null;
  title: string;
  state: "OPEN" | "CLOSED" | "REOPENED";
  uri: string;
  projectName: string | null;
  workspaceId: string | null;
}

interface WitPullRequest {
  id: string;
  repository: string;
  workspace?: string | null;
  number: number;
  title: string;
  bodyMarkdown?: string | null;
  state?: string | { tag?: string } | null;
  authorRef: string;
  headRef: string;
  baseRef: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  mergedAt?: string | null;
  mergedByRef?: string | null;
  closedAt?: string | null;
  closedByRef?: string | null;
}

const EXTENSION_ID = "ext_pull_requests";
const INTERFACE = "pulls";

function repositoryUri(workspaceId: string, repositoryId?: string | null): string {
  return repositoryId
    ? `comtrya://workspace/${workspaceId}/repository/${repositoryId}`
    : `comtrya://workspace/${workspaceId}`;
}

function unwrap<T>(result: OpResult<unknown>, label: string): T {
  if (result.ok) return result.value as T;
  throw new Error(`${label}: ${result.error.message}`);
}

function normalizeState(value: WitPullRequest["state"]): PrState {
  const tag =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && typeof value.tag === "string"
        ? value.tag
        : "";
  switch (tag.toLowerCase()) {
    case "draft":
      return "DRAFT";
    case "merged":
      return "MERGED";
    case "closed":
      return "CLOSED";
    case "ready":
    default:
      return "READY";
  }
}

export function normalizePullRequest(value: WitPullRequest): PullRequest {
  return {
    id: value.id,
    repository: value.repository,
    workspace: value.workspace ?? null,
    number: value.number,
    title: value.title,
    bodyMarkdown: value.bodyMarkdown ?? "",
    state: normalizeState(value.state),
    authorRef: value.authorRef,
    headRef: value.headRef,
    baseRef: value.baseRef,
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
    mergedAt: value.mergedAt ?? null,
    mergedByRef: value.mergedByRef ?? null,
    closedAt: value.closedAt ?? null,
    closedByRef: value.closedByRef ?? null,
  };
}

export async function listPulls(input: {
  workspaceId: string;
  repositoryId?: string | null;
  limit?: number;
}): Promise<PullRequest[]> {
  const result = await invokeOp<WitPullRequest[]>(
    EXTENSION_ID,
    INTERFACE,
    "list-pulls",
    {
      repository: repositoryUri(input.workspaceId, input.repositoryId),
      limit: input.limit ?? 256,
    },
  );
  return unwrap<WitPullRequest[]>(result, "list-pulls").map(normalizePullRequest);
}

export async function getPull(id: string): Promise<PullRequest | null> {
  const result = await invokeOp<WitPullRequest | null>(
    EXTENSION_ID,
    INTERFACE,
    "get-pull",
    id,
  );
  const value = unwrap<WitPullRequest | null>(result, "get-pull");
  return value ? normalizePullRequest(value) : null;
}

export async function mergePull(
  id: string,
  mergedByRef?: string | null,
): Promise<PullRequest> {
  const result = await invokeOp<WitPullRequest>(
    EXTENSION_ID,
    INTERFACE,
    "merge-pull",
    { id, mergedByRef: mergedByRef ?? null },
  );
  return normalizePullRequest(unwrap<WitPullRequest>(result, "merge-pull"));
}

export async function closePull(
  id: string,
  closedByRef?: string | null,
): Promise<PullRequest> {
  const result = await invokeOp<WitPullRequest>(
    EXTENSION_ID,
    INTERFACE,
    "close-pull",
    { id, closedByRef: closedByRef ?? null },
  );
  return normalizePullRequest(unwrap<WitPullRequest>(result, "close-pull"));
}

interface WitIssueShape {
  id?: string;
  number?: number;
  title?: string;
  state?: string | { tag?: string } | null;
  projectName?: string | null;
  repository?: string | null;
  workspace?: string | null;
}

function normalizeIssueState(value: WitIssueShape["state"]): LinkedIssue["state"] {
  const tag =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && typeof value.tag === "string"
        ? value.tag
        : "";
  switch (tag.toLowerCase()) {
    case "closed":
      return "CLOSED";
    case "reopened":
      return "REOPENED";
    case "open":
    default:
      return "OPEN";
  }
}

interface RelationRow {
  id: string;
  kind?: string | null;
  from?: string | null;
  to?: string | null;
  source?: string | null;
  target?: string | null;
}

/**
 * Resolve the issues a pull request closes. Built on the kernel-owned
 * `relations.outgoing` GraphQL query and the `ext_issues/issues.by-ref-issue`
 * WIT op. The closes verb is namespaced (`com.comtrya.pulls/closes`) to
 * match what the merge reactor stamps when emitting
 * `dev.comtrya.pull-request.merged`.
 */
export async function listLinkedIssues(pullId: string): Promise<LinkedIssue[]> {
  if (!pullId) return [];
  const from = `comtrya://pull_request/${pullId}`;
  const data = await getGraphQLClient().query<{
    relations?: { outgoing?: RelationRow[] };
  }>(
    `query LinkedIssues($from: ResourceURN!, $kind: ResourceURN) {
      relations.outgoing(from: $from, kind: $kind) { id kind from to source target }
    }`,
    { from, kind: CLOSES_RELATION_KIND },
  );
  const rows = data.relations?.outgoing ?? [];
  const targets = Array.from(
    new Set(
      rows
        .map((row) => row.to ?? row.target ?? "")
        .filter((uri): uri is string => uri.startsWith("comtrya://issue/")),
    ),
  );
  const resolved = await Promise.all(targets.map(resolveIssue));
  return resolved.filter((issue): issue is LinkedIssue => issue !== null);
}

async function resolveIssue(uri: string): Promise<LinkedIssue | null> {
  const result = await invokeOp<WitIssueShape | null>(
    "ext_issues",
    "issues",
    "by-ref-issue",
    uri,
  );
  if (!result.ok) return null;
  const value = result.value;
  if (!value || typeof value !== "object") return null;
  const projectName =
    typeof value.projectName === "string" && value.projectName.trim().length > 0
      ? value.projectName.trim()
      : null;
  // Repository URIs come in three shapes:
  //   comtrya://workspace/<wsId>
  //   comtrya://workspace/<wsId>/repository/<repoId>
  //   comtrya://workspace/<wsId>/...
  // Anything else (e.g. a bare workspace URN passed in `workspace`)
  // falls back to that field. Either way the workspaceId is the
  // segment between `workspace/` and the next slash.
  const repoUri =
    typeof value.repository === "string" ? value.repository : null;
  const wsUri = typeof value.workspace === "string" ? value.workspace : null;
  const workspaceId = extractWorkspaceId(repoUri ?? wsUri);
  return {
    id: typeof value.id === "string" ? value.id : "",
    number: typeof value.number === "number" ? value.number : null,
    title: typeof value.title === "string" ? value.title : "(untitled)",
    state: normalizeIssueState(value.state),
    uri,
    projectName,
    workspaceId,
  };
}

function extractWorkspaceId(uri: string | null): string | null {
  if (!uri) return null;
  const match = uri.match(/^comtrya:\/\/workspace\/([^/]+)/);
  return match ? (match[1] ?? null) : null;
}
