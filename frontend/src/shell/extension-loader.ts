import { parseManifest } from "../extension-host-sdk/manifest";
import { createHostFacade } from "../extension-host-sdk/host-facade";
import { CardRegistry } from "../extension-host-sdk/card-registry";
import { SlotRegistry } from "../extension-host-sdk/slot-registry";
import {
  KNOWN_SLOT_NAMES,
  type ExtensionAllowlist,
  type ExtensionDefinition,
  type ResolvedRoute,
  type SlotName,
  type ViewerHandle,
} from "../extension-host-sdk/types";
import type { ComtryaClient } from "../contracts";

export interface ExtensionLoadResult {
  registry: SlotRegistry;
  cards: CardRegistry;
  routes: ResolvedRoute[];
  failures: ExtensionLoadFailure[];
}

export interface ExtensionLoadFailure {
  extensionId: string;
  kind: "manifest" | "esm" | "setup";
  message: string;
}

export interface InstalledExtensionDescriptor {
  id: string;
  manifestUrl: string;
  routePrefix: string | null;
}

export async function loadExtensions(
  descriptors: InstalledExtensionDescriptor[],
  client: ComtryaClient,
  viewer: ViewerHandle,
  capabilities: Record<string, boolean>,
): Promise<ExtensionLoadResult> {
  const registry = new SlotRegistry();
  const cards = new CardRegistry();
  const routes: ResolvedRoute[] = [];
  const failures: ExtensionLoadFailure[] = [];

  for (const desc of descriptors) {
    let manifest;
    try {
      const raw = await fetch(desc.manifestUrl, { credentials: "include" });
      if (!raw.ok) throw new Error(`HTTP ${raw.status}`);
      manifest = parseManifest(await raw.json());
    } catch (e) {
      failures.push({ extensionId: desc.id, kind: "manifest", message: describe(e) });
      continue;
    }

    const allowlist: ExtensionAllowlist = {
      extensionId: desc.id,
      routePrefix: desc.routePrefix,
      permissions: new Set(manifest.permissions),
      slots: new Set(
        manifest.contributes.slots.filter((s): s is SlotName => KNOWN_SLOT_NAMES.has(s as SlotName)),
      ),
      cardKinds: new Set((manifest.contributes.cards ?? []).map((c) => c.resourceKind)),
      routesAllowed: manifest.contributes.routes && desc.routePrefix !== null,
    };

    let definition: ExtensionDefinition;
    try {
      const mod = await import(/* @vite-ignore */ manifest.assets.entry);
      definition = mod.default as ExtensionDefinition;
      if (!definition || typeof definition.setup !== "function") {
        throw new Error("default export must be defineExtension(...)");
      }
    } catch (e) {
      failures.push({ extensionId: desc.id, kind: "esm", message: describe(e) });
      continue;
    }

    try {
      const facade = createHostFacade(
        allowlist,
        registry,
        cards,
        routes,
        client,
        viewer,
        capabilities,
      );
      await definition.setup(facade);
    } catch (e) {
      failures.push({ extensionId: desc.id, kind: "setup", message: describe(e) });
    }
  }
  return { registry, cards, routes, failures };
}

function describe(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
