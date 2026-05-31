import {
  configureGraphQLClient,
  getGraphQLClient,
  registerCard,
  unregisterCard,
  registerRelationshipTargetProvider,
  unregisterRelationshipTargetProvider,
  registerRelationshipType,
  registerRoute,
  unregisterRoute,
  registerWidget,
  unregisterWidget,
  type RelationshipTargetProvider,
} from "@comtrya/sdk-core";
import { parseManifest, type UiManifestV2 } from "./extension-manifest";
import {
  setExtensionRuntimeContext,
  type ExtensionRuntimeContext,
  type ShellGraphQLClient,
  type ShellViewer,
} from "./extension-runtime";

const SHELL_EXTENSION_BOOT_QUERY = `{
  viewer { authenticated permissions }
  instance { capabilities { extensionRuntime } }
  extensionInstallations {
    id
    routePrefix
    relationshipTypes {
      id
      kind
      sourceKinds
      targetKinds
      outgoingLabel
      incomingLabel
      symmetric
      order
    }
  }
}`;

export interface InstalledExtension {
  id: string;
  routePrefix: string | null;
  relationshipTypes?: InstalledRelationshipType[];
}

export interface InstalledRelationshipType {
  id: string;
  kind: string;
  sourceKinds: string[];
  targetKinds: string[];
  outgoingLabel: string;
  incomingLabel: string;
  symmetric?: boolean;
  order?: number;
}

export interface ShellExtensionBoot {
  viewer: ShellViewer;
  instance?: {
    capabilities?: Record<string, boolean>;
  };
  extensionInstallations?: InstalledExtension[];
}

export interface ExtensionLoadFailure {
  extensionId: string;
  stage: "boot" | "manifest" | "bundle" | "setup";
  message: string;
}

interface ExtensionDefinition {
  id: string;
  setup(host: ExtensionHost): void | Promise<void>;
}

interface ExtensionHost {
  readonly client: ShellGraphQLClient;
  readonly viewer: ShellViewer;
  readonly capabilities: Record<string, boolean>;
  readonly routePrefix: string | null;
  registerWidget(contribution: {
    id: string;
    element: string;
    defaultSlot?: string;
    defaultPriority?: number;
    requiredPermission: string;
  }): { dispose(): void };
  registerRoute(
    path: string,
    contribution: {
      element: string;
      requiredPermission: string;
    },
  ): { dispose(): void };
  registerCard(contribution: {
    resourceKind: string;
    element: string;
    requiredPermission: string;
  }): { dispose(): void };
  registerRelationshipTargetProvider(contribution: {
    resourceKind: string;
    loadTargets: RelationshipTargetProvider["loadTargets"];
  }): { dispose(): void };
}

export async function loadShellExtensions(): Promise<ExtensionLoadFailure[]> {
  // Configure the shared GraphQL client up-front so both shell and
  // extensions reuse the same transport, credentials, and error envelope.
  configureGraphQLClient();
  const client = createShellGraphQLClient();
  const failures: ExtensionLoadFailure[] = [];
  let boot: ShellExtensionBoot;
  try {
    boot = await client.query<ShellExtensionBoot>(SHELL_EXTENSION_BOOT_QUERY);
  } catch (caught) {
    return [{
      extensionId: "shell",
      stage: "boot",
      message: describe(caught),
    }];
  }

  const runtimeContext: ExtensionRuntimeContext = {
    client,
    viewer: {
      authenticated: boot.viewer?.authenticated ?? false,
      permissions: boot.viewer?.permissions ?? [],
    },
    capabilities: boot.instance?.capabilities ?? {},
  };
  setExtensionRuntimeContext(runtimeContext);

  for (const extension of boot.extensionInstallations ?? []) {
    await loadOneExtension(extension, runtimeContext, failures);
  }
  return failures;
}

function createShellGraphQLClient(): ShellGraphQLClient {
  const client = getGraphQLClient();
  return {
    query: (query, variables) => client.query(query, variables),
    mutate: (mutation, variables) => client.mutate(mutation, variables),
  };
}

async function loadOneExtension(
  extension: InstalledExtension,
  context: ExtensionRuntimeContext,
  failures: ExtensionLoadFailure[],
): Promise<void> {
  let manifest: UiManifestV2;
  try {
    const response = await fetch(`/_extensions/${extension.id}/manifest.json`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    manifest = parseManifest(await response.json());
  } catch (caught) {
    failures.push({
      extensionId: extension.id,
      stage: "manifest",
      message: describe(caught),
    });
    return;
  }

  let definition: ExtensionDefinition;
  try {
    registerManifestRelationshipTypes(extension);
    const module = await import(/* @vite-ignore */ extensionEntryUrl(manifest));
    definition = module.default as ExtensionDefinition;
    if (!definition || typeof definition.setup !== "function") {
      throw new Error("default export must expose setup(host)");
    }
  } catch (caught) {
    failures.push({
      extensionId: extension.id,
      stage: "bundle",
      message: describe(caught),
    });
    return;
  }

  try {
    await definition.setup(createHost(extension, manifest, context));
  } catch (caught) {
    failures.push({
      extensionId: extension.id,
      stage: "setup",
      message: describe(caught),
    });
  }
}

function extensionEntryUrl(manifest: UiManifestV2): string {
  const url = new URL(manifest.assets.entry, window.location.origin);
  url.searchParams.set("integrity", manifest.assets.entryIntegrity);
  return `${url.pathname}${url.search}`;
}

function createHost(
  extension: InstalledExtension,
  manifest: UiManifestV2,
  context: ExtensionRuntimeContext,
): ExtensionHost {
  const extensionId = extension.id;
  return {
    client: context.client,
    viewer: context.viewer,
    capabilities: context.capabilities,
    routePrefix: extension.routePrefix,
    registerWidget(contribution) {
      assertPermission(manifest, contribution.requiredPermission);
      const widgetId = `${extensionId}:${contribution.id}`;
      registerWidget({
        id: widgetId,
        extensionId,
        element: contribution.element,
        defaultSlot: contribution.defaultSlot,
        defaultPriority: contribution.defaultPriority,
        requiredPermission: contribution.requiredPermission,
      });
      return { dispose: () => unregisterWidget(widgetId) };
    },
    registerRoute(path, contribution) {
      if (!extension.routePrefix) {
        throw new Error(
          `extension ${extensionId} has no routePrefix; extensions own /x/<routePrefix>/ only`,
        );
      }
      assertPermission(manifest, contribution.requiredPermission);
      const routeId = `${extensionId}:route:${path}:${contribution.element}`;
      registerRoute({
        id: routeId,
        extensionId,
        routePrefix: extension.routePrefix,
        path,
        element: contribution.element,
      });
      return { dispose: () => unregisterRoute(routeId) };
    },
    registerCard(contribution) {
      assertPermission(manifest, contribution.requiredPermission);
      const cardKind = contribution.resourceKind;
      registerCard({
        kind: cardKind,
        element: contribution.element,
        extensionId,
      });
      return { dispose: () => unregisterCard(cardKind) };
    },
    registerRelationshipTargetProvider(contribution) {
      const relationshipKind = contribution.resourceKind;
      registerRelationshipTargetProvider({
        id: `${extensionId}:relationship-target:${relationshipKind}`,
        extensionId,
        resourceKind: relationshipKind,
        loadTargets: contribution.loadTargets,
      });
      return { dispose: () => unregisterRelationshipTargetProvider(relationshipKind) };
    },
  };
}

function registerManifestRelationshipTypes(extension: InstalledExtension): void {
  for (const type of extension.relationshipTypes ?? []) {
    registerRelationshipType({
      id: type.id,
      extensionId: extension.id,
      kind: type.kind,
      sourceKinds: type.sourceKinds,
      targetKinds: type.targetKinds,
      outgoingLabel: type.outgoingLabel,
      incomingLabel: type.incomingLabel,
      symmetric: type.symmetric ?? false,
      order: type.order ?? 1000,
    });
  }
}

function assertPermission(manifest: UiManifestV2, permission: string): void {
  if (!manifest.permissions.includes(permission)) {
    throw new Error(`permission "${permission}" is not declared by ${manifest.id}`);
  }
}

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}
