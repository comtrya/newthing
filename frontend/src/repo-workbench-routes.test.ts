import { describe, expect, test } from "bun:test";
import {
  rebaseExtensionHrefToRepo,
  repoBaseFromRouteParams,
  repoSegmentsFromRouteParams,
} from "./repo-workbench-routes";

describe("repo workbench route helpers", () => {
  test("builds repo bases from matched route params", () => {
    expect(repoSegmentsFromRouteParams({ groups: ["comtrya"], repo: "dogfood" }))
      .toEqual(["comtrya", "dogfood"]);
    expect(repoBaseFromRouteParams({ groups: ["comtrya"], repo: "dogfood" }))
      .toBe("/r/comtrya/dogfood");
  });

  test("supports single-segment repositories", () => {
    expect(repoSegmentsFromRouteParams({ repo: "rawkode" })).toEqual(["rawkode"]);
    expect(repoBaseFromRouteParams({ repo: "rawkode" })).toBe("/r/rawkode");
  });

  test("preserves encoding at the URL boundary", () => {
    expect(repoBaseFromRouteParams({ groups: ["raw kode"], repo: "forge ui" }))
      .toBe("/r/raw%20kode/forge%20ui");
  });

  test("rebases every repo-embedded extension prefix", () => {
    const repoBase = "/r/comtrya/dogfood";
    expect(
      rebaseExtensionHrefToRepo(
        "/x/docs/scenarios?workspaceId=ws_1#bdd",
        repoBase,
        "http://127.0.0.1:4321",
      ),
    ).toEqual({
      path: "/r/comtrya/dogfood/docs/scenarios",
      query: { workspaceId: "ws_1" },
      hash: "#bdd",
    });
    expect(
      rebaseExtensionHrefToRepo(
        "/x/sprints/?repositoryId=repo_1",
        repoBase,
        "http://127.0.0.1:4321",
      ),
    ).toEqual({
      path: "/r/comtrya/dogfood/sprints",
      query: { repositoryId: "repo_1" },
      hash: "",
    });
  });

  test("leaves non-workbench extension links alone", () => {
    expect(
      rebaseExtensionHrefToRepo(
        "/x/unknown/",
        "/r/comtrya/dogfood",
        "http://127.0.0.1:4321",
      ),
    ).toBeNull();
  });
});
