import { resolveProjectOwners } from "@comtrya/sdk-vue";

/**
 * Snapshot of a Project's CUE-declared ownership. Mirrors the
 * `ext_issues/policy.ts` shape so callers across the trio of
 * planning surfaces see one vocabulary; epics don't have their
 * own `issues.*` sub-policy, so we only surface the owner refs
 * (the cross-cutting routing fact) here.
 *
 * Iter 63 thinned this module to a facade — the actual CUE fetch
 * + extraction lives in `@comtrya/sdk-vue::resolveProjectOwners`
 * so every Project-spine consumer (this module,
 * `frontend/src/project-commands.ts`, future surfaces) shares one
 * reader.
 */
export interface ProjectPolicy {
  /** Canonical URNs of the Project's declared owners. */
  ownerRefs: string[];
}

export const EMPTY_POLICY: ProjectPolicy = { ownerRefs: [] };

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
  return { ownerRefs: await resolveProjectOwners(projectName) };
}
