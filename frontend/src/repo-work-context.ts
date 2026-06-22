import {
  projectHref,
  projectNewWorkHref,
  projectPlanningHref,
  projectWorkHref,
} from "./route-paths";

export type RepoWorkContextSurface = "issues" | "epics" | "docs" | "sprints";

export type RepoWorkContextLinkId =
  | "issues"
  | "epics"
  | "kanban"
  | "specs"
  | "scenarios"
  | "new-issue"
  | "new-epic";

export interface RepoWorkContextLink {
  id: RepoWorkContextLinkId;
  label: string;
  href: string;
  active: boolean;
  kind: "view" | "create";
}

export interface RepoWorkContextLinks {
  projectHref: string;
  links: RepoWorkContextLink[];
}

export interface RepoWorkContextOptions {
  repoSegments: string[];
  projectName: string;
  workspaceId?: string | null;
  repositoryId?: string | null;
  activeSurface?: RepoWorkContextSurface | null;
  activeBoard?: string | null;
}

export function buildRepoWorkContextLinks({
  repoSegments,
  projectName,
  workspaceId,
  repositoryId,
  activeSurface,
  activeBoard,
}: RepoWorkContextOptions): RepoWorkContextLinks {
  const scoped = { repoSegments, workspaceId, repositoryId };
  const docsBoard = normalizeDocsBoard(activeBoard);
  return {
    projectHref: projectHref(repoSegments, projectName),
    links: [
      {
        id: "issues",
        label: "Issues",
        href: projectWorkHref({ surface: "issues", projectName, ...scoped }),
        active: activeSurface === "issues",
        kind: "view",
      },
      {
        id: "epics",
        label: "Epics",
        href: projectWorkHref({ surface: "epics", projectName, ...scoped }),
        active: activeSurface === "epics",
        kind: "view",
      },
      {
        id: "kanban",
        label: "Kanban",
        href: projectPlanningHref({ surface: "sprints", projectName, ...scoped }),
        active: activeSurface === "sprints",
        kind: "view",
      },
      {
        id: "specs",
        label: "Specs / PRDs",
        href: projectPlanningHref({
          surface: "docs",
          projectName,
          board: "prds",
          ...scoped,
        }),
        active: activeSurface === "docs" && docsBoard === "specs",
        kind: "view",
      },
      {
        id: "scenarios",
        label: "BDD scenarios",
        href: projectPlanningHref({
          surface: "docs",
          projectName,
          board: "scenarios",
          ...scoped,
        }),
        active: activeSurface === "docs" && docsBoard === "scenarios",
        kind: "view",
      },
      {
        id: "new-issue",
        label: "New issue",
        href: projectNewWorkHref({ surface: "issues", projectName, ...scoped }),
        active: false,
        kind: "create",
      },
      {
        id: "new-epic",
        label: "New epic",
        href: projectNewWorkHref({ surface: "epics", projectName, ...scoped }),
        active: false,
        kind: "create",
      },
    ],
  };
}

function normalizeDocsBoard(board: string | null | undefined): "specs" | "scenarios" | "other" {
  const first = (board ?? "")
    .split("/")
    .filter(Boolean)[0]
    ?.trim()
    .toLowerCase() ?? "";
  if (["", "prd", "prds", "spec", "specs", "type", "types"].includes(first)) {
    return "specs";
  }
  if (["bdd", "bdd-scenarios", "scenario", "scenarios"].includes(first)) {
    return "scenarios";
  }
  return "other";
}
