export const shellRoutePaths = {
  workspaceHome: "/",
  inbox: "/inbox",
  newRepository: "/new",
  instanceAdmin: "/instance",
  settings: "/settings",
  health: "/health",
  repoHome: "/r/:groups+/:repo",
  repoCode: "/r/:groups+/:repo/code",
  repoPulls: "/r/:groups+/:repo/pulls/:rest(.*)*",
  repoIssues: "/r/:groups+/:repo/issues/:rest(.*)*",
  repoChecks: "/r/:groups+/:repo/checks/:rest(.*)*",
  repoEpics: "/r/:groups+/:repo/epics/:rest(.*)*",
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
