import { activeWorkspaceId, buildExtensionUrl } from "@comtrya/sdk-core";

export const EXT_PULLS_ROUTE_PREFIX = "pulls";

export function defaultWorkspaceId(): string {
  return activeWorkspaceId() ?? "";
}

export type PrState = "DRAFT" | "READY" | "REVIEW" | "MERGED" | "CLOSED";

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

export function pullsIndexHref(repositoryPath?: string | null): string {
  return repositoryPullsBasePath(repositoryPath) ?? buildExtensionUrl(EXT_PULLS_ROUTE_PREFIX, "/");
}

export function pullHref(
  pull: Pick<PullRequest, "id">,
  repositoryPath?: string | null,
): string {
  const repoBase = repositoryPullsBasePath(repositoryPath);
  if (repoBase) return `${repoBase}/${encodeURIComponent(pull.id)}`;
  return buildExtensionUrl(EXT_PULLS_ROUTE_PREFIX, `/${pull.id}`);
}

function repositoryPullsBasePath(repositoryPath: string | null | undefined): string | null {
  const segments = repositoryPath?.split("/").filter(Boolean) ?? [];
  if (segments.length === 0) return null;
  return `/r/${segments.map(encodeURIComponent).join("/")}/pulls`;
}

export function stateTone(state: PrState | string | undefined): PrTone {
  switch (state) {
    case "READY":
      return { label: "open", className: "pr-state-ready" };
    case "DRAFT":
      return { label: "draft", className: "pr-state-draft" };
    case "REVIEW":
      return { label: "review", className: "pr-state-review" };
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

/**
 * Re-export the canonical principal classifier from sdk-vue as
 * `classifyAuthor` / `authorLabel` so existing call sites in this
 * extension keep their imports. The canonical helper (iter 62)
 * adds the `team` kind which the previous local implementation
 * missed, so CUE team URNs now render with the correct glyph.
 */
export {
  classifyPrincipal as classifyAuthor,
  principalLabel as authorLabel,
} from "@comtrya/sdk-vue";
export type {
  PrincipalClassification as AuthorIdentity,
  PrincipalKind as AuthorKind,
} from "@comtrya/sdk-vue";
