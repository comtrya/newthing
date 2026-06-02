export const REPOSITORY_EXTENSION_IDS = {
  issues: "ext_issues",
  pulls: "ext_pull_requests",
  epics: "ext_epics",
  checks: "ext_checks",
} as const;

export type RepositoryExtensionSlug = keyof typeof REPOSITORY_EXTENSION_IDS;

export function repositoryExtensionEnabled(
  enabledExtensions: readonly string[] | null | undefined,
  slug: RepositoryExtensionSlug,
): boolean {
  if (!enabledExtensions) return false;
  return enabledExtensions.includes(REPOSITORY_EXTENSION_IDS[slug]);
}
