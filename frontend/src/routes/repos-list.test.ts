import { describe, expect, test } from "bun:test";
import {
  filterRepositories,
  repositoryCountLabel,
  sortRepositories,
  type RepositoryListRow,
} from "./repos-list";

const repos: RepositoryListRow[] = [
  { id: "2", name: "dogfood", path: "comtrya/dogfood", groups: ["comtrya"], openPullRequests: 0 },
  { id: "1", name: "comtrya", path: "comtrya/comtrya", groups: ["comtrya"], openPullRequests: 2 },
  { id: "3", name: "hello", path: "rawkode/hello/rawkode", groups: ["rawkode", "hello"], openPullRequests: 0 },
];

describe("repository list helpers", () => {
  test("sorts repositories by familiar path order", () => {
    expect(sortRepositories(repos).map((repo) => repo.path)).toEqual([
      "comtrya/comtrya",
      "comtrya/dogfood",
      "rawkode/hello/rawkode",
    ]);
  });

  test("filters across path, name, and groups", () => {
    expect(filterRepositories(repos, "dog").map((repo) => repo.path)).toEqual([
      "comtrya/dogfood",
    ]);
    expect(filterRepositories(repos, "raw hello").map((repo) => repo.path)).toEqual([
      "rawkode/hello/rawkode",
    ]);
  });

  test("keeps unfiltered count copy explicit", () => {
    expect(repositoryCountLabel(1, 1)).toBe("1 repository in this workspace");
    expect(repositoryCountLabel(3, 3)).toBe("3 repositories in this workspace");
    expect(repositoryCountLabel(3, 1)).toBe("1 of 3 repositories");
  });
});
