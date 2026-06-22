import { getGraphQLClient } from "@comtrya/sdk-core";

/**
 * Snapshot of a Project's `issues.*` policy from its CUE config.
 * The schema for `issues` is registered by this extension via
 * `manifest.contributes.cueSchemas` and unified into the repo's
 * `package comtrya` CUE evaluation by the kernel. Callers use this
 * snapshot to pre-fill labels and stamp closeOnMerge on new issues.
 */
export interface IssuesPolicy {
  defaultLabels: string[];
  closeOnMerge: boolean | null;
  /**
   * Canonical URNs of the Project's declared owners (typed `#Ref`
   * family from iteration 26). The new-issue form pre-fills the
   * assignee set with these so a `kernel` issue opens with
   * `comtrya://team/platform-maintainers` + `comtrya://user/rawkode`
   * already attached.
   */
  ownerRefs: string[];
}

export const EMPTY_POLICY: IssuesPolicy = {
  defaultLabels: [],
  closeOnMerge: null,
  ownerRefs: [],
};

interface CueOwnerRef {
  kind?: string;
  slug?: string;
  ref?: string;
}

interface CueProject {
  name?: string;
  issues?: { defaultLabels?: string[]; closeOnMerge?: boolean };
  owners?: CueOwnerRef[];
}

interface IssuesPolicyConfig {
  workspace?: {
    repositoryByPath?: {
      comtryaConfig?: { projects?: CueProject[] } | null;
    } | null;
  };
}

export type SegmentsSource = "location" | "referrer";
export type RepositorySegmentsSource = SegmentsSource | string[];

export function repositorySegmentsFromLocation(
  source: SegmentsSource = "location",
): string[] {
  const path = source === "location"
    ? (typeof window !== "undefined" ? window.location.pathname : "")
    : pathFromReferrer();
  if (!path.startsWith("/r/")) return [];
  const rest = path.slice("/r/".length);
  const projectIdx = rest.indexOf("/p/");
  const repoPath = projectIdx >= 0 ? rest.slice(0, projectIdx) : rest;
  return repoPath.split("/").filter(Boolean).map(decodeURIComponent);
}

function pathFromReferrer(): string {
  const referrer = typeof document !== "undefined" ? document.referrer || "" : "";
  if (!referrer) return "";
  try {
    return new URL(referrer).pathname;
  } catch {
    return "";
  }
}

/**
 * Look up the Project's `issues.*` policy from the repo's CUE config.
 *
 * `source` controls where we read the repo segments from. The
 * standalone new-issue route (`/x/issues/new`) lives outside the
 * repo path, so it reads the referring Project page. The inline
 * quick-add lives inside `/r/.../p/<project>`, so it reads
 * `window.location`.
 */
export async function resolveIssuesPolicy(
  projectName: string,
  source: RepositorySegmentsSource = "location",
): Promise<IssuesPolicy> {
  try {
    const segments = Array.isArray(source)
      ? source.map((segment) => segment.trim()).filter(Boolean)
      : repositorySegmentsFromLocation(source);
    if (segments.length === 0) return EMPTY_POLICY;
    const data = await getGraphQLClient().query<IssuesPolicyConfig>(
      `query Q($segments: [String!]!) {
        workspace { repositoryByPath(segments: $segments) { comtryaConfig } }
      }`,
      { segments },
    );
    const config = data.workspace?.repositoryByPath?.comtryaConfig ?? null;
    const project = (config?.projects ?? []).find((p) => p.name === projectName);
    const ownerRefs = (project?.owners ?? [])
      .map((owner) => owner?.ref)
      .filter((ref): ref is string => typeof ref === "string" && ref.length > 0);
    return {
      defaultLabels: project?.issues?.defaultLabels ?? [],
      closeOnMerge: typeof project?.issues?.closeOnMerge === "boolean"
        ? project.issues.closeOnMerge
        : null,
      ownerRefs,
    };
  } catch {
    return EMPTY_POLICY;
  }
}
