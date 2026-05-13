import { describe, expect, test, beforeEach } from "bun:test";
import { CardRegistry } from "./card-registry";

describe("CardRegistry", () => {
  let registry: CardRegistry;
  beforeEach(() => {
    registry = new CardRegistry();
  });

  test("extension claim wins over core default", () => {
    registry.registerCoreDefault({
      extensionId: "core",
      resourceKind: "issue",
      element: "comtrya-fallback-card",
      requiredPermission: "core.read",
    });
    expect(registry.winner("issue")?.extensionId).toBe("core");

    registry.add({
      extensionId: "ext_issues",
      resourceKind: "issue",
      element: "comtrya-issue-card",
      requiredPermission: "issues.read",
    });
    expect(registry.winner("issue")?.extensionId).toBe("ext_issues");
    expect(registry.winner("issue")?.element).toBe("comtrya-issue-card");
  });

  test("disposing the extension claim restores the core default", () => {
    registry.registerCoreDefault({
      extensionId: "core",
      resourceKind: "issue",
      element: "comtrya-fallback-card",
      requiredPermission: "core.read",
    });
    const disp = registry.add({
      extensionId: "ext_issues",
      resourceKind: "issue",
      element: "comtrya-issue-card",
      requiredPermission: "issues.read",
    });
    expect(registry.winner("issue")?.extensionId).toBe("ext_issues");
    disp.dispose();
    expect(registry.winner("issue")?.extensionId).toBe("core");
  });

  test("unknown kind returns undefined", () => {
    expect(registry.winner("issue")).toBeUndefined();
  });

  test("second extension claim for the same kind is rejected", () => {
    registry.add({
      extensionId: "ext_a",
      resourceKind: "issue",
      element: "card-a",
      requiredPermission: "p",
    });
    registry.add({
      extensionId: "ext_b",
      resourceKind: "issue",
      element: "card-b",
      requiredPermission: "p",
    });
    expect(registry.winner("issue")?.extensionId).toBe("ext_a");
  });

  test("the same extension can re-register and replace itself", () => {
    registry.add({
      extensionId: "ext_issues",
      resourceKind: "issue",
      element: "card-a",
      requiredPermission: "p",
    });
    registry.add({
      extensionId: "ext_issues",
      resourceKind: "issue",
      element: "card-b",
      requiredPermission: "p",
    });
    expect(registry.winner("issue")?.element).toBe("card-b");
  });

  test("listKinds returns kinds covered by either tier", () => {
    registry.registerCoreDefault({
      extensionId: "core",
      resourceKind: "epic",
      element: "fb",
      requiredPermission: "p",
    });
    registry.add({
      extensionId: "ext_issues",
      resourceKind: "issue",
      element: "ic",
      requiredPermission: "p",
    });
    expect(new Set(registry.listKinds())).toEqual(new Set(["epic", "issue"]));
  });

  test("disposing twice is a no-op", () => {
    const disp = registry.add({
      extensionId: "ext_a",
      resourceKind: "issue",
      element: "c",
      requiredPermission: "p",
    });
    disp.dispose();
    disp.dispose();
    expect(registry.winner("issue")).toBeUndefined();
  });
});
