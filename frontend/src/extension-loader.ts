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
    manifest
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
  manifest: string;
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

const BOOT_TIMEOUT_MS = 5_000;
const BOOT_RETRY_DELAY_MS = 250;
const BOOT_ATTEMPTS = 2;
const MANIFEST_TIMEOUT_MS = 15_000;
const MANIFEST_RETRY_DELAY_MS = 500;
const MANIFEST_ATTEMPTS = 2;

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
  const boot = await loadShellExtensionBoot(client);
  if (!boot.ok) return [boot.failure];
  const bootPayload = boot.value;

  const runtimeContext: ExtensionRuntimeContext = {
    client,
    viewer: {
      authenticated: bootPayload.viewer?.authenticated ?? false,
      permissions: bootPayload.viewer?.permissions ?? [],
    },
    capabilities: bootPayload.instance?.capabilities ?? {},
  };
  setExtensionRuntimeContext(runtimeContext);

  await Promise.all(
    (bootPayload.extensionInstallations ?? []).map((extension) =>
      loadOneExtension(extension, runtimeContext, failures)
    ),
  );
  return failures;
}

async function loadShellExtensionBoot(
  client: ShellGraphQLClient,
): Promise<
  { ok: true; value: ShellExtensionBoot } | { ok: false; failure: ExtensionLoadFailure }
> {
  let lastFailure: ExtensionLoadFailure = {
    extensionId: "shell",
    stage: "boot",
    message: "extension boot did not run",
  };
  for (let attempt = 1; attempt <= BOOT_ATTEMPTS; attempt += 1) {
    try {
      const value = await withTimeout(
        client.query<ShellExtensionBoot>(SHELL_EXTENSION_BOOT_QUERY),
        BOOT_TIMEOUT_MS,
        "extension boot query timed out",
      );
      return { ok: true, value };
    } catch (caught) {
      lastFailure = {
        extensionId: "shell",
        stage: "boot",
        message: describe(caught),
      };
      if (attempt < BOOT_ATTEMPTS) {
        await delay(BOOT_RETRY_DELAY_MS);
      }
    }
  }
  return { ok: false, failure: lastFailure };
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
    const response = await fetchManifest(extension);
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

async function fetchManifest(extension: InstalledExtension): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MANIFEST_ATTEMPTS; attempt += 1) {
    try {
      return await withTimeout(
        fetch(manifestUrlFor(extension), {
          cache: "no-store",
          credentials: "include",
        }),
        MANIFEST_TIMEOUT_MS,
        "extension manifest request timed out",
      );
    } catch (caught) {
      lastError = caught;
      if (attempt < MANIFEST_ATTEMPTS) {
        await delay(MANIFEST_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

function extensionEntryUrl(manifest: UiManifestV2): string {
  const url = new URL(manifest.assets.entry, window.location.origin);
  url.searchParams.set("integrity", manifest.assets.entryIntegrity);
  return `${url.pathname}${url.search}`;
}

function manifestUrlFor(extension: InstalledExtension): string {
  if (!extension.manifest.startsWith("/ui-ext/")) {
    throw new Error(`extension ${extension.id} manifest must be served from /ui-ext/`);
  }
  return extension.manifest;
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}

export const _extensionLoaderTest = {
  manifestUrlFor,
  withTimeout,
};
