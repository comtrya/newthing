export const shellRoutePaths = {
  workspaceHome: "/",
  newRepository: "/new",
  instanceAdmin: "/instance",
  settings: "/settings",
  health: "/health",
  repoHome: "/r/:groups+/:repo",
  extensionRoute: "/x/:prefix/:rest*",
} as const;
