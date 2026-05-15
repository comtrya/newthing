import { getGraphQLClient } from "@comtrya/sdk-core";

/**
 * Snapshot of a Project's CUE-declared ownership. Mirrors the
 * `ext_issues/policy.ts` shape so callers across the trio of
 * planning surfaces see one vocabulary; epics don't have their
 * own `issues.*` sub-policy, so we only surface the owner refs
 * (the cross-cutting routing fact) here.
 */
export interface ProjectPolicy {
  /**
   * Canonical URNs of the Project's declared owners (typed
   * `#Ref` family from the kernel CUE schema). Used to render
   * the "Routed to" sidebar on epic detail surfaces.
   */
  ownerRefs: string[];
}

export const EMPTY_POLICY: ProjectPolicy = { ownerRefs: [] };

interface CueOwnerRef {
  kind?: string;
  slug?: string;
  ref?: string;
}

interface CueProject {
  name?: string;
  owners?: CueOwnerRef[];
}

interface ProjectPolicyConfig {
  workspace?: {
    repositoryByPath?: {
      comtryaConfig?: { projects?: CueProject[] } | null;
    } | null;
  };
  repository?: {
    comtryaConfig?: { projects?: CueProject[] } | null;
  };
}

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
 * Look up the Project's `owners[].ref` from the repo's CUE
 * config. Returns `EMPTY_POLICY` on any failure (network, parse,
 * project not declared) so callers can render the panel
 * unconditionally on the resolved value without try/catch
 * branches in the template.
 */
export async function resolveProjectPolicy(
  projectName: string,
): Promise<ProjectPolicy> {
  try {
    const segments = repositorySegmentsFromLocation();
    const query = segments.length > 0
      ? `query EpicProjectPolicy($segments: [String!]!) {
          workspace { repositoryByPath(segments: $segments) { comtryaConfig } }
        }`
      : `query EpicProjectPolicyRepo { repository { comtryaConfig } }`;
    const variables = segments.length > 0 ? { segments } : undefined;
    const data = await getGraphQLClient().query<ProjectPolicyConfig>(
      query,
      variables,
    );
    const config = data.workspace?.repositoryByPath?.comtryaConfig
      ?? data.repository?.comtryaConfig
      ?? null;
    const project = (config?.projects ?? []).find((p) => p.name === projectName);
    const ownerRefs = (project?.owners ?? [])
      .map((owner) => owner?.ref)
      .filter((ref): ref is string => typeof ref === "string" && ref.length > 0);
    return { ownerRefs };
  } catch {
    return EMPTY_POLICY;
  }
}
