import { describe, expect, test } from "bun:test";
import { buildRepoWorkContextLinks } from "./repo-work-context";

describe("repo work context links", () => {
  test("builds project-scoped repo work links with repository context", () => {
    const context = buildRepoWorkContextLinks({
      repoSegments: ["comtrya", "dogfood"],
      projectName: "backend",
      workspaceId: "ws_123",
      repositoryId: "repo_456",
      activeSurface: "sprints",
    });

    expect(context.projectHref).toBe("/r/comtrya/dogfood/p/backend");
    expect(context.links.map((link) => [link.id, link.href])).toEqual([
      [
        "issues",
        "/r/comtrya/dogfood/issues?project=backend&workspaceId=ws_123&repositoryId=repo_456",
      ],
      [
        "epics",
        "/r/comtrya/dogfood/epics?project=backend&workspaceId=ws_123&repositoryId=repo_456",
      ],
      [
        "kanban",
        "/r/comtrya/dogfood/sprints/?project=backend&workspaceId=ws_123&repositoryId=repo_456",
      ],
      [
        "specs",
        "/r/comtrya/dogfood/docs/prds?project=backend&workspaceId=ws_123&repositoryId=repo_456",
      ],
      [
        "scenarios",
        "/r/comtrya/dogfood/docs/scenarios?project=backend&workspaceId=ws_123&repositoryId=repo_456",
      ],
      [
        "new-issue",
        "/r/comtrya/dogfood/issues/new?projectName=backend&workspaceId=ws_123&repositoryId=repo_456",
      ],
      [
        "new-epic",
        "/r/comtrya/dogfood/epics/new?projectName=backend&workspaceId=ws_123&repositoryId=repo_456",
      ],
    ]);
  });

  test("marks Kanban active on sprints surfaces", () => {
    const links = buildRepoWorkContextLinks({
      repoSegments: ["comtrya", "dogfood"],
      projectName: "backend",
      activeSurface: "sprints",
    }).links;

    expect(activeIds(links)).toEqual(["kanban"]);
  });

  test("marks Specs active for docs root and PRD aliases", () => {
    for (const activeBoard of ["", "prds", "specs", "type"]) {
      const links = buildRepoWorkContextLinks({
        repoSegments: ["comtrya", "dogfood"],
        projectName: "backend",
        activeSurface: "docs",
        activeBoard,
      }).links;

      expect(activeIds(links)).toEqual(["specs"]);
    }
  });

  test("marks BDD scenarios active for scenario aliases", () => {
    for (const activeBoard of ["scenarios", "bdd", "bdd-scenarios"]) {
      const links = buildRepoWorkContextLinks({
        repoSegments: ["comtrya", "dogfood"],
        projectName: "backend",
        activeSurface: "docs",
        activeBoard,
      }).links;

      expect(activeIds(links)).toEqual(["scenarios"]);
    }
  });

  test("leaves docs planning links inactive on other docs boards", () => {
    const links = buildRepoWorkContextLinks({
      repoSegments: ["comtrya", "dogfood"],
      projectName: "backend",
      activeSurface: "docs",
      activeBoard: "readiness",
    }).links;

    expect(activeIds(links)).toEqual([]);
  });
});

function activeIds(links: Array<{ id: string; active: boolean }>): string[] {
  return links.filter((link) => link.active).map((link) => link.id);
}
