// Coverage for the repo clone-command builders. The clone URL must use
// the unified `/r/<repo>` base (the same path the SPA browses, #127 /
// #136), and the tool prefix must follow the repo's declared `vcs`.

import { describe, expect, test } from "bun:test";

import { cloneCommand, cloneTool, cloneUrl } from "./repo-clone";

describe("cloneTool", () => {
  test("jj repos clone via jj-on-git", () => {
    expect(cloneTool("jj")).toBe("jj git clone");
  });

  test("git and unset repos use plain git clone", () => {
    expect(cloneTool("git")).toBe("git clone");
    expect(cloneTool(undefined)).toBe("git clone");
    expect(cloneTool(null)).toBe("git clone");
  });
});

describe("cloneUrl", () => {
  test("prefixes the unified /r/ git path with the origin", () => {
    expect(cloneUrl("/r/comtrya/dogfood", "https://code.rawkode.academy")).toBe(
      "https://code.rawkode.academy/r/comtrya/dogfood",
    );
  });

  test("returns the bare path when origin is absent (SSR)", () => {
    expect(cloneUrl("/r/comtrya/dogfood", null)).toBe("/r/comtrya/dogfood");
    expect(cloneUrl("/r/comtrya/dogfood")).toBe("/r/comtrya/dogfood");
  });

  test("empty when the repo has no gitHttpPath", () => {
    expect(cloneUrl(undefined, "https://code.rawkode.academy")).toBe("");
    expect(cloneUrl(null, "https://code.rawkode.academy")).toBe("");
    expect(cloneUrl("", "https://code.rawkode.academy")).toBe("");
  });
});

describe("cloneCommand", () => {
  test("git repo over the unified /r/ base", () => {
    expect(
      cloneCommand("/r/comtrya/dogfood", "https://code.rawkode.academy", "git"),
    ).toBe("git clone https://code.rawkode.academy/r/comtrya/dogfood");
  });

  test("jj repo gets the jj-on-git tool over the same base", () => {
    expect(
      cloneCommand("/r/comtrya/dogfood", "https://code.rawkode.academy", "jj"),
    ).toBe("jj git clone https://code.rawkode.academy/r/comtrya/dogfood");
  });

  test("empty when there is no clone URL", () => {
    expect(cloneCommand(undefined, "https://code.rawkode.academy", "git")).toBe(
      "",
    );
  });
});
