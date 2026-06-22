import { describe, expect, test } from "bun:test";
import { extensionHref } from "./extension-hrefs";

describe("extension hrefs", () => {
  test("uses the workspace extension route without repo context", () => {
    expect(extensionHref("issues", "/new")).toBe("/x/issues/new");
    expect(extensionHref("epics", "/")).toBe("/x/epics");
  });

  test("uses the repo workbench route with repo context", () => {
    expect(
      extensionHref("issues", "/ws_123/42", {
        repositorySegments: ["comtrya", "dog food"],
      }),
    ).toBe("/r/comtrya/dog%20food/issues/ws_123/42");
  });

  test("ignores blank repo segments", () => {
    expect(
      extensionHref("epics", "/board", {
        repositorySegments: ["", " comtrya ", "dogfood", ""],
      }),
    ).toBe("/r/comtrya/dogfood/epics/board");
  });

  test("keeps route prefix validation from extension routes", () => {
    expect(() => extensionHref("issues/detail", "/")).toThrow();
  });
});
