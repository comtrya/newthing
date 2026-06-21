import { describe, expect, test } from "bun:test";
import {
  docsBoardFromRouteSubPath,
  docsBoardHref,
} from "./docs-workbench-route";

describe("docs workbench routes", () => {
  test("maps root and spec-oriented aliases to the specs board", () => {
    expect(docsBoardFromRouteSubPath("/")).toBe("type");
    expect(docsBoardFromRouteSubPath("/types")).toBe("type");
    expect(docsBoardFromRouteSubPath("/specs")).toBe("type");
    expect(docsBoardFromRouteSubPath("/prds")).toBe("type");
  });

  test("maps scenario-oriented aliases to the scenarios board", () => {
    expect(docsBoardFromRouteSubPath("/scenarios")).toBe("scenario");
    expect(docsBoardFromRouteSubPath("/bdd")).toBe("scenario");
    expect(docsBoardFromRouteSubPath("/bdd-scenarios")).toBe("scenario");
  });

  test("builds canonical extension workbench links and preserves query context", () => {
    expect(
      docsBoardHref({
        boardId: "scenario",
        pathname: "/x/docs",
        routeSubPath: "/",
        search: "?workspaceId=ws_1",
      }),
    ).toBe("/x/docs/scenarios?workspaceId=ws_1");

    expect(
      docsBoardHref({
        boardId: "type",
        pathname: "/x/docs/scenarios",
        routeSubPath: "/scenarios",
        search: "?workspaceId=ws_1",
      }),
    ).toBe("/x/docs?workspaceId=ws_1");
  });

  test("builds repo-embedded workbench links from the forwarded extension subpath", () => {
    expect(
      docsBoardHref({
        boardId: "readiness",
        pathname: "/r/comtrya/dogfood/docs/scenarios",
        routeSubPath: "/scenarios",
        search: "?workspaceId=ws_1&repositoryId=repo_1",
      }),
    ).toBe(
      "/r/comtrya/dogfood/docs/readiness?workspaceId=ws_1&repositoryId=repo_1",
    );
  });
});
