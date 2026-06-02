import { describe, expect, test } from "bun:test";
import { issueRouteContext } from "./route-context";

describe("issueRouteContext", () => {
  test("host repository context wins over stale URL scope while query filters apply", () => {
    expect(
      issueRouteContext(
        {
          workspaceId: "ws_host",
          repositoryId: "repo_host",
          projectName: "host-project",
          state: "CLOSED",
        },
        "?workspaceId=ws_query&repositoryId=repo_query&projectName=query-project&state=OPEN",
      ),
    ).toEqual({
      workspaceId: "ws_host",
      repositoryId: "repo_host",
      projectName: "host-project",
      state: "OPEN",
    });
  });

  test("URL query scopes generic extension routes when host props are absent", () => {
    expect(
      issueRouteContext(
        {},
        "?workspaceId=ws_query&repositoryId=repo_query&projectName=query-project&state=CLOSED",
      ),
    ).toEqual({
      workspaceId: "ws_query",
      repositoryId: "repo_query",
      projectName: "query-project",
      state: "CLOSED",
    });
  });

  test("host props win over route params", () => {
    expect(
      issueRouteContext(
        {
          workspaceId: "ws_host",
          repositoryId: "repo_host",
          routeParams: {
            params: {
              workspaceId: "ws_route",
              repositoryId: "repo_route",
              projectName: "route-project",
            },
          },
        },
        "",
      ),
    ).toEqual({
      workspaceId: "ws_host",
      repositoryId: "repo_host",
      projectName: "route-project",
      state: null,
    });
  });

  test("repositoryId query is enough to scope a repo tab when workspace comes from props", () => {
    expect(
      issueRouteContext(
        {
          workspaceId: "ws_shell",
        },
        "?repositoryId=repo_query",
      ),
    ).toEqual({
      workspaceId: "ws_shell",
      repositoryId: "repo_query",
      projectName: null,
      state: null,
    });
  });

  test("blank host values are treated as absent", () => {
    expect(
      issueRouteContext(
        {
          workspaceId: "",
          repositoryId: "  ",
          routeParams: {
            params: {
              workspaceId: "ws_route",
              repositoryId: "repo_route",
            },
          },
        },
        "?workspaceId=&repositoryId=",
      ),
    ).toEqual({
      workspaceId: "ws_route",
      repositoryId: "repo_route",
      projectName: null,
      state: null,
    });
  });
});
