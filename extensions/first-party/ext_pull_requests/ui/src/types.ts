import { buildExtensionUrl } from "@comtrya/sdk-core";

export const EXT_PULLS_ROUTE_PREFIX = "pulls";

export type PrState = "DRAFT" | "READY" | "MERGED" | "CLOSED";

export interface PullRequest {
  id: string;
  repository: string;
  workspace: string | null;
  number: number;
  title: string;
  bodyMarkdown: string;
  state: PrState;
  authorRef: string;
  headRef: string;
  baseRef: string;
  createdAt: string | null;
  updatedAt: string | null;
  mergedAt: string | null;
  mergedByRef: string | null;
  closedAt: string | null;
  closedByRef: string | null;
}

export interface PrTone {
  label: string;
  className: string;
}

export type LoadState = "idle" | "loading" | "ready" | "empty" | "error";

export interface ExtensionRouteParams {
  scope?: string;
  routePrefix?: string;
  subPath?: string;
  params?: Record<string, string | undefined>;
}

export function pullsIndexHref(): string {
  return buildExtensionUrl(EXT_PULLS_ROUTE_PREFIX, "/");
}

export function pullHref(pull: Pick<PullRequest, "id">): string {
  return buildExtensionUrl(EXT_PULLS_ROUTE_PREFIX, `/${pull.id}`);
}

export function stateTone(state: PrState | string | undefined): PrTone {
  switch (state) {
    case "READY":
      return { label: "open", className: "pr-state-ready" };
    case "DRAFT":
      return { label: "draft", className: "pr-state-draft" };
    case "MERGED":
      return { label: "merged", className: "pr-state-merged" };
    case "CLOSED":
      return { label: "closed", className: "pr-state-closed" };
    default:
      return { label: "unknown", className: "pr-state-closed" };
  }
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return value;
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / week)}w ago`;
}

export function authorLabel(value: string | null | undefined): string {
  if (!value) return "unknown";
  const tail = value.split("/").pop() ?? value;
  return tail || value;
}

export type AuthorKind = "human" | "agent" | "credential" | "bot" | "unknown";

export interface AuthorIdentity {
  kind: AuthorKind;
  label: string;
  glyph: string;
  tone: string;
}

/**
 * Classify an author URN. The forge treats agent- and credential-issued
 * commits as first-class identities with their own visible badge so a
 * reviewer can tell at a glance whether a pull came from a human, an
 * automation, or an AI agent. URN conventions:
 *
 *   comtrya://user/<name>         human
 *   comtrya://agent/<id>          named AI agent (claude-code, cursor, etc.)
 *   comtrya://bot/<id>            named bot
 *   comtrya://credential/<id>     scoped automation credential (PRN_*)
 */
export function classifyAuthor(value: string | null | undefined): AuthorIdentity {
  if (!value) return { kind: "unknown", label: "unknown", glyph: "·", tone: "neutral" };
  const stripped = value.replace(/^comtrya:\/\//, "");
  const [scheme = "", ...rest] = stripped.split("/");
  const id = rest.join("/") || authorLabel(value);
  switch (scheme) {
    case "user":
      return { kind: "human", label: id, glyph: id.slice(0, 1).toUpperCase(), tone: "human" };
    case "agent":
      return { kind: "agent", label: id, glyph: "✦", tone: "agent" };
    case "bot":
      return { kind: "bot", label: id, glyph: "◆", tone: "bot" };
    case "credential":
      return { kind: "credential", label: id, glyph: "⚙", tone: "credential" };
    default:
      return {
        kind: "unknown",
        label: id,
        glyph: id.slice(0, 1).toUpperCase() || "·",
        tone: "neutral",
      };
  }
}
