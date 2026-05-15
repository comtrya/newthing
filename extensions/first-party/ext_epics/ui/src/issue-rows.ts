import { invokeOp, buildExtensionUrl } from "@comtrya/sdk-core";

export interface ResolvedIssue {
  ref: string;
  id: string;
  number: number | null;
  title: string;
  state: "OPEN" | "CLOSED" | "REOPENED";
  projectName: string | null;
  labels: string[];
  authorRef: string | null;
  href: string | null;
}

interface WitIssueShape {
  id?: unknown;
  number?: unknown;
  title?: unknown;
  state?: unknown;
  authorRef?: unknown;
  projectName?: unknown;
  labels?: unknown;
  repository?: unknown;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normaliseState(value: unknown): "OPEN" | "CLOSED" | "REOPENED" {
  const upper = typeof value === "string" ? value.toUpperCase() : "";
  if (upper === "CLOSED") return "CLOSED";
  if (upper === "REOPENED") return "REOPENED";
  return "OPEN";
}

function workspaceFromRepository(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(
    /^comtrya:\/\/workspace\/([^/]+)(?:\/repository\/[^/]+)?$/,
  );
  return match?.[1] ?? null;
}

export async function resolveIssue(ref: string): Promise<ResolvedIssue | null> {
  const result = await invokeOp<WitIssueShape | null>(
    "ext_issues",
    "issues",
    "by-ref-issue",
    ref,
  );
  if (!result.ok || !result.value || typeof result.value !== "object") {
    return null;
  }
  const value = result.value;
  const number = asNumber(value.number);
  const workspaceId = workspaceFromRepository(value.repository);
  const href = number !== null && workspaceId
    ? buildExtensionUrl("issues", `/${workspaceId}/${number}`)
    : null;
  return {
    ref,
    id: asString(value.id),
    number,
    title: asString(value.title, "(untitled)"),
    state: normaliseState(value.state),
    projectName: typeof value.projectName === "string" ? value.projectName : null,
    labels: Array.isArray(value.labels)
      ? value.labels.filter((label): label is string => typeof label === "string")
      : [],
    authorRef: typeof value.authorRef === "string" ? value.authorRef : null,
    href,
  };
}

export async function resolveIssues(refs: string[]): Promise<ResolvedIssue[]> {
  const resolved = await Promise.all(refs.map((ref) => resolveIssue(ref)));
  return resolved.filter((value): value is ResolvedIssue => value !== null);
}

/**
 * `classifyIssueAuthor` previously shipped its own glyphs (`●`,
 * `◉`, `○`) that drifted from the rest of the forge. Iter 62
 * routes through the canonical `@comtrya/sdk-vue::classifyPrincipal`
 * so issue-row authors render with the same glyph set as the
 * hero chip rows and the "Routed to" panels (initial letter for
 * humans, ✦/◆/⚙/◇ for agents/bots/credentials/teams).
 */
export { classifyPrincipal as classifyIssueAuthor } from "@comtrya/sdk-vue";
export type { PrincipalClassification as IssueAuthor } from "@comtrya/sdk-vue";
