import { afterEach, describe, expect, test } from "bun:test";
import {
  _resetRoutesForTesting,
  buildExtensionUrl,
  registerRoute,
  routeFor,
} from "./route-registry";

afterEach(() => _resetRoutesForTesting());

describe("route-registry", () => {
  test("registers and resolves a route", () => {
    registerRoute({
      id: "ext_issues:detail",
      extensionId: "ext_issues",
      routePrefix: "issues",
      path: "/:workspaceId/:number",
      element: "comtrya-issue-detail",
    });
    const match = routeFor("issues", "/ws-1/42");
    expect(match?.params).toEqual({ workspaceId: "ws-1", number: "42" });
  });

  test("rejects registration with empty routePrefix", () => {
    expect(() =>
      registerRoute({
        id: "x",
        extensionId: "ext_issues",
        routePrefix: "",
        path: "/",
        element: "el",
      }),
    ).toThrow(/routePrefix/);
  });

  test("rejects routePrefix containing a slash", () => {
    expect(() =>
      registerRoute({
        id: "x",
        extensionId: "ext_issues",
        routePrefix: "issues/foo",
        path: "/",
        element: "el",
      }),
    ).toThrow(/single path segment/);
  });

  test("buildExtensionUrl constructs /x/<prefix>/<path>", () => {
    expect(buildExtensionUrl("issues")).toBe("/x/issues");
    expect(buildExtensionUrl("issues", "/")).toBe("/x/issues");
    expect(buildExtensionUrl("issues", "/ws-1/42")).toBe("/x/issues/ws-1/42");
    expect(buildExtensionUrl("issues", "ws-1/42")).toBe("/x/issues/ws-1/42");
  });

  test("buildExtensionUrl rejects empty or compound prefix", () => {
    expect(() => buildExtensionUrl("")).toThrow();
    expect(() => buildExtensionUrl("issues/foo")).toThrow();
  });
});
