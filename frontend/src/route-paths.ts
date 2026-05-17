export const shellRoutePaths = {
  workspaceHome: "/",
  newRepository: "/new",
  instanceAdmin: "/instance",
  settings: "/settings",
  health: "/health",
  repoHome: "/r/:groups+/:repo",
  repoCode: "/r/:groups+/:repo/code",
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
