/**
 * Canonical fetcher for the repo's merged `package comtrya` CUE
 * configuration. The kernel evaluates this server-side via
 * `cuengine` and exposes it on `repository.comtryaConfig` —
 * surfaces the typed-#Ref Project entries (`name`, `root`,
 * `labels`, `owners`, `issues`, `pulls`, `docs`) every Project-
 * spine consumer reads from.
 *
 * Replaces the duplicated GraphQL + projects-extraction logic
 * previously living in `frontend/src/project-commands.ts` and
 * `extensions/first-party/ext_epics/ui/src/project-policy.ts`.
 * `ext_issues/policy.ts` and `ext_pull_requests/PullsDetail.vue`
 * batch CUE config with other fetches (issues policy + diff
 * respectively); they can opt into this helper later or keep
 * batching.
 */
import { getGraphQLClient } from "@comtrya/sdk-core";

export interface ComtryaOwnerRef {
  kind?: string;
  slug?: string;
  ref?: string;
}

export interface ComtryaProject {
  name?: string;
  root?: string;
  labels?: string[];
  owners?: ComtryaOwnerRef[];
  /**
   * Sub-policy blocks (issues, pulls, docs, ...) — extension-
   * specific shapes the kernel preserves verbatim from CUE.
   * Consumers cast / narrow on the field they care about.
   */
  [key: string]: unknown;
}

interface ComtryaConfigRoot {
  workspace?: {
    repositoryByPath?: {
      comtryaConfig?: { projects?: ComtryaProject[] } | null;
    } | null;
  };
  repository?: {
    comtryaConfig?: { projects?: ComtryaProject[] } | null;
  };
}

/**
 * Read the repo path segments from `window.location.pathname`.
 * Mirrors `ext_issues/policy.ts::repositorySegmentsFromLocation`
 * so the conversion stays a single rule.
 */
function repositorySegmentsFromLocation(): string[] {
  if (typeof window === "undefined") return [];
  const path = window.location.pathname;
  if (!path.startsWith("/r/")) return [];
  const rest = path.slice("/r/".length);
  const projectIdx = rest.indexOf("/p/");
  const repoPath = projectIdx >= 0 ? rest.slice(0, projectIdx) : rest;
  return repoPath.split("/").filter(Boolean).map(decodeURIComponent);
}

/**
 * Fetch the CUE Projects declared in the repo's `package comtrya`
 * config. Accepts explicit `segments` (e.g. from the route
 * params) or falls back to the current location. Returns `[]` on
 * any failure (network, parse, repo not found) so the caller can
 * render unconditionally on the value.
 */
export async function fetchComtryaProjects(
  segments?: string[],
): Promise<ComtryaProject[]> {
  try {
    const repoSegments = segments ?? repositorySegmentsFromLocation();
    const query = repoSegments.length > 0
      ? `query ComtryaProjects($segments: [String!]!) {
          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }
        }`
      : `query ComtryaProjectsCwd { repository { comtryaConfig } }`;
    const variables = repoSegments.length > 0 ? { segments: repoSegments } : undefined;
    const data = await getGraphQLClient().query<ComtryaConfigRoot>(
      query,
      variables,
    );
    const config = data.workspace?.repositoryByPath?.comtryaConfig
      ?? data.repository?.comtryaConfig
      ?? null;
    return (config?.projects ?? []).filter(
      (p): p is ComtryaProject => p !== null && typeof p === "object",
    );
  } catch {
    return [];
  }
}

/**
 * Resolve the canonical `owners[].ref` set for one CUE Project.
 * Convenience over `fetchComtryaProjects` for the common case
 * where a consumer only needs the routing identity refs.
 */
export async function resolveProjectOwners(
  projectName: string,
  segments?: string[],
): Promise<string[]> {
  const projects = await fetchComtryaProjects(segments);
  const project = projects.find((p) => p.name === projectName);
  return (project?.owners ?? [])
    .map((owner) => owner?.ref)
    .filter((ref): ref is string => typeof ref === "string" && ref.length > 0);
}
