import type { ComtryaClient } from "../contracts";
import type { SlotRegistry } from "./slot-registry";
import {
  KNOWN_SLOT_NAMES,
  type ExtensionAllowlist,
  type ExtensionHost,
  type ResolvedRoute,
  type ViewerHandle,
} from "./types";

export function createHostFacade(
  allowlist: ExtensionAllowlist,
  registry: SlotRegistry,
  routeSink: ResolvedRoute[],
  client: ComtryaClient,
  viewer: ViewerHandle,
  capabilities: Record<string, boolean>,
): ExtensionHost {
  return {
    client,
    viewer,
    capabilities,
    registerSlot(name, contribution) {
      if (!KNOWN_SLOT_NAMES.has(name)) {
        throw new Error(`unknown slot name "${name}" — host does not recognize this slot`);
      }
      if (!allowlist.slots.has(name)) {
        throw new Error(`slot "${name}" is not in allowlist for ${allowlist.extensionId}`);
      }
      if (!allowlist.permissions.has(contribution.requiredPermission)) {
        throw new Error(`permission "${contribution.requiredPermission}" is not declared by ${allowlist.extensionId}`);
      }
      return registry.add({
        extensionId: allowlist.extensionId,
        element: contribution.element,
        requiredPermission: contribution.requiredPermission,
        priority: contribution.priority ?? 1000,
      }, name);
    },
    registerRoute(path, contribution) {
      if (!allowlist.routesAllowed || !allowlist.routePrefix) {
        throw new Error(`routes are not enabled for ${allowlist.extensionId}`);
      }
      if (!path.startsWith("/")) {
        throw new Error(`route path must start with "/", got "${path}"`);
      }
      if (!allowlist.permissions.has(contribution.requiredPermission)) {
        throw new Error(`permission "${contribution.requiredPermission}" is not declared by ${allowlist.extensionId}`);
      }
      const routePrefix = allowlist.routePrefix;
      const route: ResolvedRoute = {
        extensionId: allowlist.extensionId,
        routePrefix,
        path,
        element: contribution.element,
        requiredPermission: contribution.requiredPermission,
      };
      routeSink.push(route);
      let disposed = false;
      return {
        dispose: () => {
          if (disposed) return;
          disposed = true;
          const i = routeSink.indexOf(route);
          if (i >= 0) routeSink.splice(i, 1);
        },
      };
    },
  };
}
