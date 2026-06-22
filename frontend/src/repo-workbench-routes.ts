export const WORKBENCH_EXTENSION_PREFIXES = new Set([
  "issues",
  "pulls",
  "checks",
  "epics",
  "docs",
  "sprints",
]);

type RouteParams = Record<string, unknown>;

export interface RepoScopedExtensionLink {
  path: string;
  query: Record<string, string>;
  hash: string;
}

export function repoSegmentsFromRouteParams(params: RouteParams): string[] {
  const repo = paramValue(params.repo);
  if (!repo) return [];
  return [...paramSegments(params.groups), repo];
}

export function repoBaseFromRouteParams(params: RouteParams): string | null {
  const segments = repoSegmentsFromRouteParams(params);
  if (segments.length === 0) return null;
  return `/r/${segments.map(encodeURIComponent).join("/")}`;
}

export function rebaseExtensionHrefToRepo(
  href: string,
  repoBase: string,
  origin: string,
): RepoScopedExtensionLink | null {
  if (!href.startsWith("/x/")) return null;

  const url = new URL(href, origin);
  const segments = url.pathname.split("/").filter(Boolean);
  const prefix = segments[1];
  if (segments[0] !== "x" || !prefix) return null;
  if (!WORKBENCH_EXTENSION_PREFIXES.has(prefix)) return null;

  const rest = segments.slice(2);
  const path = [repoBase, prefix, ...rest].join("/").replace(/\/+/g, "/");
  return {
    path,
    query: queryFromSearch(url.search),
    hash: url.hash,
  };
}

function queryFromSearch(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!search) return out;
  const params = new URLSearchParams(search);
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}

function paramSegments(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function paramValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}
