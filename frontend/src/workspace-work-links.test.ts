import { describe, expect, test } from "bun:test";
import { workspaceWorkLinks } from "./workspace-work-links";

describe("workspaceWorkLinks", () => {
  test("builds familiar workspace work links with workspace scope", () => {
    expect(workspaceWorkLinks("ws_123", "/")[0]).toEqual({
      id: "issues",
      label: "Issues",
      href: "/x/issues/?workspaceId=ws_123",
      active: false,
    });
    expect(workspaceWorkLinks("ws_123", "/").map((link) => link.href)).toEqual([
      "/x/issues/?workspaceId=ws_123",
      "/x/pulls/?workspaceId=ws_123",
      "/x/epics/board?workspaceId=ws_123",
      "/x/sprints/?workspaceId=ws_123",
      "/x/docs/?workspaceId=ws_123",
    ]);
  });

  test("keeps links usable before workspace bootstrap resolves", () => {
    expect(workspaceWorkLinks(null, "/").map((link) => link.href)).toEqual([
      "/x/issues/",
      "/x/pulls/",
      "/x/epics/board",
      "/x/sprints/",
      "/x/docs/",
    ]);
  });

  test("scopes work links to the active repository", () => {
    expect(
      workspaceWorkLinks("ws_123", "/r/comtrya/dogfood/issues", {
        repoSegments: ["comtrya", "dog food"],
        repositoryId: "repo_456",
      }).map((link) => link.href),
    ).toEqual([
      "/r/comtrya/dog%20food/issues?workspaceId=ws_123&repositoryId=repo_456",
      "/r/comtrya/dog%20food/pulls?workspaceId=ws_123&repositoryId=repo_456",
      "/r/comtrya/dog%20food/epics/board?workspaceId=ws_123&repositoryId=repo_456",
      "/r/comtrya/dog%20food/sprints?workspaceId=ws_123&repositoryId=repo_456",
      "/r/comtrya/dog%20food/docs?workspaceId=ws_123&repositoryId=repo_456",
    ]);
  });

  test("marks extension and repo workbench surfaces active", () => {
    expect(activeIds("/x/epics/board")).toEqual(["epics"]);
    expect(activeIds("/r/comtrya/dogfood/sprints")).toEqual(["kanban"]);
    expect(activeIds("/r/comtrya/dogfood/docs")).toEqual(["specs"]);
  });
});

function activeIds(path: string): string[] {
  return workspaceWorkLinks("ws_123", path)
    .filter((link) => link.active)
    .map((link) => link.id);
}
