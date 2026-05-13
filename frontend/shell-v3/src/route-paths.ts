export const shellRoutePaths = {
  workspaceHome: "/",
  repoHome: "/r/:groups+/:repo",
  extensionRoute: "/x/:prefix/:rest*",
} as const;
