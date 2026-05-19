export const shellRoutePaths = {
  workspaceHome: "/",
  inbox: "/inbox",
  newRepository: "/new",
  repos: "/repos",
  instanceAdmin: "/instance",
  settings: "/settings",
  health: "/health",
  pipelines: "/pipelines",
  releases: "/releases",
  adminOverview: "/admin",
  adminAccess: "/admin/access",
  adminStorage: "/admin/storage",
  repoHome: "/r/:groups+/:repo",
  repoCode: "/r/:groups+/:repo/code",
  repoConfig: "/r/:groups+/:repo/config",
  repoPullReview: "/r/:groups+/:repo/pulls/:id/review",
  repoPulls: "/r/:groups+/:repo/pulls/:rest(.*)*",
  repoIssueBoard: "/r/:groups+/:repo/issues/board",
  repoIssues: "/r/:groups+/:repo/issues/:rest(.*)*",
  repoChecks: "/r/:groups+/:repo/checks/:rest(.*)*",
  repoEpics: "/r/:groups+/:repo/epics/:rest(.*)*",
  repoPipelines: "/r/:groups+/:repo/pipelines",
  repoReleases: "/r/:groups+/:repo/releases",
  projectHome: "/r/:groups+/:repo/p/:project",
  extensionRoute: "/x/:prefix/:rest*",
} as const;

/** Build a Project home URL. */
export function projectHref(
  segments: string[],
  projectName: string,
): string {
  const repoPath = segments.map(encodeURIComponent).join("/");
  return `/r/${repoPath}/p/${encodeURIComponent(projectName)}`;
}
