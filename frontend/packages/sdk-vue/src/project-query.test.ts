import { describe, expect, test } from "bun:test";
import {
  shouldWriteProjectFilterParam,
  syncProjectFilterParam,
} from "./project-query";

describe("project query filter persistence", () => {
  test("writes project when the queue is controlled by a filter", () => {
    const params = new URLSearchParams("workspaceId=ws_1");
    syncProjectFilterParam(params, { projectFilter: "backend" });
    expect(params.toString()).toBe("workspaceId=ws_1&project=backend");
  });

  test("removes project when no filter is active", () => {
    const params = new URLSearchParams("workspaceId=ws_1&project=backend");
    syncProjectFilterParam(params, { projectFilter: "" });
    expect(params.toString()).toBe("workspaceId=ws_1");
  });

  test("omits redundant project when scope comes from a host prop", () => {
    const params = new URLSearchParams("workspaceId=ws_1");
    syncProjectFilterParam(params, {
      projectFilter: "backend",
      scopedProjectName: "backend",
      currentSearch: "?workspaceId=ws_1",
    });
    expect(params.toString()).toBe("workspaceId=ws_1");
  });

  test("preserves project when the scoped prop came from the project query alias", () => {
    const params = new URLSearchParams("workspaceId=ws_1&project=backend");
    syncProjectFilterParam(params, {
      projectFilter: "backend",
      scopedProjectName: "backend",
      currentSearch: "?workspaceId=ws_1&project=backend",
    });
    expect(params.toString()).toBe("workspaceId=ws_1&project=backend");
  });

  test("does not treat projectName as the filter query alias", () => {
    expect(
      shouldWriteProjectFilterParam("backend", {
        scopedProjectName: "backend",
        currentSearch: "?projectName=backend",
      }),
    ).toBe(false);
  });
});
