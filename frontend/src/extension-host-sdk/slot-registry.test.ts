import { describe, expect, test, beforeEach } from "bun:test";
import { SlotRegistry } from "./slot-registry";

describe("SlotRegistry", () => {
  let registry: SlotRegistry;
  beforeEach(() => { registry = new SlotRegistry(); });

  test("single claim resolves to itself", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "perm.a", priority: 1000 }, "home.your-work");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_a");
    expect(registry.shadowed("home.your-work")).toEqual([]);
  });

  test("lower priority wins contention", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 1000 }, "home.your-work");
    registry.add({ extensionId: "ext_b", element: "el-b", requiredPermission: "p", priority: 100 }, "home.your-work");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_b");
    expect(registry.shadowed("home.your-work").map((s) => s.extensionId)).toEqual(["ext_a"]);
  });

  test("install order breaks priority ties", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    registry.add({ extensionId: "ext_b", element: "el-b", requiredPermission: "p", priority: 100 }, "home.your-work");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_a");
  });

  test("removing the winner promotes the next claim", () => {
    const aDisp = registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    registry.add({ extensionId: "ext_b", element: "el-b", requiredPermission: "p", priority: 1000 }, "home.your-work");
    aDisp.dispose();
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_b");
    expect(registry.shadowed("home.your-work")).toEqual([]);
  });

  test("disposing twice is a no-op", () => {
    const disp = registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    disp.dispose();
    disp.dispose();
    expect(registry.winner("home.your-work")).toBeUndefined();
  });

  test("listSlots returns all slot names with at least one claim", () => {
    registry.add({ extensionId: "ext_a", element: "el-a", requiredPermission: "p", priority: 100 }, "home.your-work");
    registry.add({ extensionId: "ext_a", element: "el-a2", requiredPermission: "p", priority: 100 }, "home.activity");
    expect(new Set(registry.listSlots())).toEqual(new Set(["home.your-work", "home.activity"]));
  });
});
