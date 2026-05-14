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

export interface IssueAuthor {
  kind: "user" | "agent" | "bot" | "credential" | "unknown";
  glyph: string;
  label: string;
}

export function classifyIssueAuthor(value: string | null): IssueAuthor {
  if (!value) return { kind: "unknown", glyph: "○", label: "unknown" };
  if (value.startsWith("comtrya://agent/")) {
    return {
      kind: "agent",
      glyph: "✦",
      label: value.slice("comtrya://agent/".length) || "agent",
    };
  }
  if (value.startsWith("comtrya://bot/")) {
    return {
      kind: "bot",
      glyph: "◉",
      label: value.slice("comtrya://bot/".length) || "bot",
    };
  }
  if (value.startsWith("comtrya://credential/")) {
    return {
      kind: "credential",
      glyph: "⚙",
      label: value.slice("comtrya://credential/".length) || "credential",
    };
  }
  if (value.startsWith("comtrya://user/")) {
    return {
      kind: "user",
      glyph: "●",
      label: value.slice("comtrya://user/".length) || "user",
    };
  }
  return { kind: "unknown", glyph: "○", label: value };
}
