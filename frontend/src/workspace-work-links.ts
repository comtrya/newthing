export interface WorkspaceWorkLink {
  id: string;
  label: string;
  href: string;
  active: boolean;
}

export interface WorkspaceWorkLinkScope {
  repoSegments?: readonly string[] | null;
  repositoryId?: string | null;
}

const WORK_LINKS = [
  { id: "issues", label: "Issues", workspacePath: "/x/issues/", repoPath: "issues" },
  { id: "pulls", label: "Pull requests", workspacePath: "/x/pulls/", repoPath: "pulls" },
  { id: "epics", label: "Epics", workspacePath: "/x/epics/board", repoPath: "epics/board" },
  { id: "kanban", label: "Kanban", workspacePath: "/x/sprints/", repoPath: "sprints" },
  { id: "specs", label: "Specs", workspacePath: "/x/docs/", repoPath: "docs" },
] as const;

export function workspaceWorkLinks(
  workspaceId: string | null | undefined,
  currentPath: string,
  scope: WorkspaceWorkLinkScope = {},
): WorkspaceWorkLink[] {
  return WORK_LINKS.map((link) => ({
    id: link.id,
    label: link.label,
    href: scopedHref(link, workspaceId, scope),
    active: workLinkActive(link.id, currentPath),
  }));
}

function scopedHref(
  link: (typeof WORK_LINKS)[number],
  workspaceId: string | null | undefined,
  scope: WorkspaceWorkLinkScope,
): string {
  const repoSegments = normalizedRepoSegments(scope.repoSegments);
  const path = repoSegments
    ? `/r/${repoSegments.map(encodeURIComponent).join("/")}/${link.repoPath}`
    : link.workspacePath;
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (repoSegments && scope.repositoryId) params.set("repositoryId", scope.repositoryId);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function normalizedRepoSegments(
  segments: readonly string[] | null | undefined,
): string[] | null {
  const clean = segments
    ?.map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  return clean && clean.length > 0 ? clean : null;
}

function workLinkActive(id: string, currentPath: string): boolean {
  switch (id) {
    case "issues":
      return currentPath.startsWith("/x/issues") ||
        currentPath.includes("/issues");
    case "pulls":
      return currentPath.startsWith("/x/pulls") ||
        currentPath.includes("/pulls");
    case "epics":
      return currentPath.startsWith("/x/epics") ||
        currentPath.includes("/epics");
    case "kanban":
      return currentPath.startsWith("/x/sprints") ||
        currentPath.includes("/sprints");
    case "specs":
      return currentPath.startsWith("/x/docs") ||
        currentPath.includes("/docs");
    default:
      return false;
  }
}
