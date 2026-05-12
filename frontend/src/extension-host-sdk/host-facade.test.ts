import { describe, expect, test, beforeEach } from "bun:test";
import { createHostFacade } from "./host-facade";
import { SlotRegistry } from "./slot-registry";
import { KNOWN_SLOT_NAMES, type ExtensionAllowlist } from "./types";

const STUB_CLIENT = {} as never;
const STUB_VIEWER = { authenticated: true, permissions: ["workspace.read"] };
const STUB_CAPS = {};

function allowlist(over: Partial<ExtensionAllowlist> = {}): ExtensionAllowlist {
  return {
    extensionId: "ext_test",
    routePrefix: null,
    permissions: new Set(["workspace.read"]),
    slots: new Set(["home.your-work"]),
    routesAllowed: false,
    ...over,
  };
}

describe("createHostFacade", () => {
  let registry: SlotRegistry;
  beforeEach(() => { registry = new SlotRegistry(); });

  test("registerSlot succeeds for allowlisted slot", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    const disp = facade.registerSlot("home.your-work", { element: "x-el", requiredPermission: "workspace.read" });
    expect(typeof disp.dispose).toBe("function");
    expect(registry.winner("home.your-work")?.extensionId).toBe("ext_test");
  });

  test("registerSlot rejects slot not in allowlist", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerSlot("home.activity", { element: "x-el", requiredPermission: "p" }))
      .toThrow(/home.activity.*not in allowlist/);
  });

  test("registerSlot rejects slot not in known set", () => {
    const facade = createHostFacade(allowlist({ slots: new Set(["bogus" as never]) }), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerSlot("bogus" as never, { element: "x-el", requiredPermission: "p" }))
      .toThrow(/unknown slot name/);
  });

  test("registerSlot rejects permission not in allowlist", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerSlot("home.your-work", { element: "x-el", requiredPermission: "events.read" }))
      .toThrow(/events.read.*not declared/);
  });

  test("registerRoute rejects when routes not allowed", () => {
    const facade = createHostFacade(allowlist(), registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS);
    expect(() => facade.registerRoute("/", { element: "x-el", requiredPermission: "workspace.read" }))
      .toThrow(/routes are not enabled/);
  });

  test("registerRoute records route under prefix", () => {
    const routes: import("./types").ResolvedRoute[] = [];
    const facade = createHostFacade(
      allowlist({ routePrefix: "pulls", routesAllowed: true, permissions: new Set(["pull-requests.read"]) }),
      registry, routes, STUB_CLIENT, STUB_VIEWER, STUB_CAPS
    );
    facade.registerRoute("/:pullId", { element: "x-detail", requiredPermission: "pull-requests.read" });
    expect(routes).toEqual([{
      extensionId: "ext_test",
      routePrefix: "pulls",
      path: "/:pullId",
      element: "x-detail",
      requiredPermission: "pull-requests.read",
    }]);
  });

  test("registerRoute rejects path not starting with /", () => {
    const facade = createHostFacade(
      allowlist({ routePrefix: "pulls", routesAllowed: true }),
      registry, [], STUB_CLIENT, STUB_VIEWER, STUB_CAPS
    );
    expect(() => facade.registerRoute("nope", { element: "x", requiredPermission: "workspace.read" }))
      .toThrow(/route path must start with/);
  });

  test("exposes known slot names externally", () => {
    expect(KNOWN_SLOT_NAMES.has("home.your-work")).toBe(true);
    expect(KNOWN_SLOT_NAMES.has("bogus" as never)).toBe(false);
  });

  test("registerRoute dispose removes route from sink", () => {
    const routes: import("./types").ResolvedRoute[] = [];
    const facade = createHostFacade(
      allowlist({ routePrefix: "pulls", routesAllowed: true, permissions: new Set(["pull-requests.read"]) }),
      registry, routes, STUB_CLIENT, STUB_VIEWER, STUB_CAPS
    );
    const disp = facade.registerRoute("/:id", { element: "x", requiredPermission: "pull-requests.read" });
    expect(routes).toHaveLength(1);
    disp.dispose();
    expect(routes).toHaveLength(0);
  });

  test("registerRoute double-dispose is safe", () => {
    const routes: import("./types").ResolvedRoute[] = [];
    const facade = createHostFacade(
      allowlist({ routePrefix: "pulls", routesAllowed: true, permissions: new Set(["pull-requests.read"]) }),
      registry, routes, STUB_CLIENT, STUB_VIEWER, STUB_CAPS
    );
    const disp = facade.registerRoute("/:id", { element: "x", requiredPermission: "pull-requests.read" });
    disp.dispose();
    expect(() => disp.dispose()).not.toThrow();
    expect(routes).toHaveLength(0);
  });
});
