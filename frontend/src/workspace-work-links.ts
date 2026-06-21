export interface WorkspaceWorkLink {
  id: string;
  label: string;
  href: string;
  active: boolean;
}

const WORK_LINKS = [
  { id: "issues", label: "Issues", path: "/x/issues/" },
  { id: "pulls", label: "Pull requests", path: "/x/pulls/" },
  { id: "epics", label: "Epics", path: "/x/epics/board" },
  { id: "kanban", label: "Kanban", path: "/x/sprints/" },
  { id: "specs", label: "Specs", path: "/x/docs/" },
] as const;

export function workspaceWorkLinks(
  workspaceId: string | null | undefined,
  currentPath: string,
): WorkspaceWorkLink[] {
  return WORK_LINKS.map((link) => ({
    id: link.id,
    label: link.label,
    href: scopedHref(link.path, workspaceId),
    active: workLinkActive(link.id, currentPath),
  }));
}

function scopedHref(path: string, workspaceId: string | null | undefined): string {
  if (!workspaceId) return path;
  const params = new URLSearchParams({ workspaceId });
  return `${path}?${params.toString()}`;
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
