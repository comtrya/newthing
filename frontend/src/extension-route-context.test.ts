import { describe, expect, test } from "bun:test";
import {
  extensionRouteElementContext,
  extensionRouteQueryContext,
  extensionRouteQueryContextKey,
} from "./extension-route-context";

describe("extensionRouteQueryContext", () => {
  test("extracts repository route scope from query params", () => {
    expect(
      extensionRouteQueryContext({
        workspaceId: "ws_123",
        repositoryId: "repo_456",
        state: "OPEN",
      }),
    ).toEqual({
      workspaceId: "ws_123",
      repositoryId: "repo_456",
      state: "OPEN",
    });
  });

  test("ignores unrelated and null query params", () => {
    expect(
      extensionRouteQueryContext({
        repositoryId: null,
        ignored: "value",
      }),
    ).toEqual({});
  });

  test("uses the first string from repeated query params", () => {
    expect(
      extensionRouteQueryContext({
        workspaceId: [null, "ws_first", "ws_second"],
        repositoryId: ["repo_first", "repo_second"],
      }),
    ).toEqual({
      workspaceId: "ws_first",
      repositoryId: "repo_first",
    });
  });

  test("maps project filters into projectName for extension props", () => {
    expect(
      extensionRouteQueryContext({
        project: "backend",
      }),
    ).toEqual({
      projectName: "backend",
    });

    expect(
      extensionRouteQueryContext({
        project: "backend",
        projectName: "frontend",
      }),
    ).toEqual({
      projectName: "frontend",
    });
  });
});

describe("extensionRouteElementContext", () => {
  test("query scope overrides generic shell context", () => {
    expect(
      extensionRouteElementContext(
        {
          workspaceId: "ws_shell",
          repositoryId: "repo_shell",
          comtryaClient: "client",
        },
        {
          workspaceId: "ws_route",
          repositoryId: "repo_route",
        },
      ),
    ).toEqual({
      workspaceId: "ws_route",
      repositoryId: "repo_route",
      comtryaClient: "client",
    });
  });

  test("preserves shell context when route query has no scope", () => {
    expect(
      extensionRouteElementContext(
        {
          workspaceId: "ws_shell",
          comtryaClient: "client",
        },
        {},
      ),
    ).toEqual({
      workspaceId: "ws_shell",
      comtryaClient: "client",
    });
  });
});

describe("extensionRouteQueryContextKey", () => {
  test("is stable across object insertion order", () => {
    expect(
      extensionRouteQueryContextKey({
        repositoryId: "repo_456",
        workspaceId: "ws_123",
      }),
    ).toBe(
      extensionRouteQueryContextKey({
        workspaceId: "ws_123",
        repositoryId: "repo_456",
      }),
    );
  });
});
