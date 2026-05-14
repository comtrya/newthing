import {
  registerCard,
  registerRoute,
  registerSlot,
} from "@comtrya/sdk-core";
import { parseManifest, type UiManifestV2 } from "../../src/extension-host-sdk/manifest";
import {
  setExtensionRuntimeContext,
  type ExtensionRuntimeContext,
  type ShellGraphQLClient,
  type ShellViewer,
} from "./extension-runtime";

const SHELL_EXTENSION_BOOT_QUERY = `{
  viewer { authenticated permissions }
  instance { capabilities { extensionRuntime } }
  extensionInstallations { id routePrefix }
}`;

export interface InstalledExtension {
  id: string;
  routePrefix: string | null;
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
  registerSlot(
    name: string,
    contribution: {
      element: string;
      requiredPermission: string;
      priority?: number;
    },
  ): { dispose(): void };
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
}

export async function loadShellExtensions(): Promise<ExtensionLoadFailure[]> {
  const client = createGraphQLClient();
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

function createGraphQLClient(): ShellGraphQLClient {
  return {
    query: (query, variables) => graphql(query, variables),
    mutate: (mutation, variables) => graphql(mutation, variables),
  };
}

async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const envelope = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || envelope.errors?.length) {
    throw new Error(envelope.errors?.[0]?.message ?? response.statusText);
  }
  if (!envelope.data) throw new Error("GraphQL response did not include data");
  return envelope.data;
}

async function loadOneExtension(
  extension: InstalledExtension,
  context: ExtensionRuntimeContext,
  failures: ExtensionLoadFailure[],
): Promise<void> {
  let manifest: UiManifestV2;
  try {
    const response = await fetch(`/_extensions/${extension.id}/manifest.json`, {
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
    const module = await import(/* @vite-ignore */ manifest.assets.entry);
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
    registerSlot(name, contribution) {
      if (!manifest.contributes.slots.includes(name)) {
        throw new Error(`slot "${name}" is not declared by ${extensionId}`);
      }
      assertPermission(manifest, contribution.requiredPermission);
      const id = `${extensionId}:slot:${name}:${contribution.element}`;
      registerSlot(name, {
        id,
        extensionId,
        element: contribution.element,
        priority: contribution.priority ?? 1000,
      });
      return { dispose: () => undefined };
    },
    registerRoute(path, contribution) {
      if (!manifest.contributes.routes || !extension.routePrefix) {
        throw new Error(`routes are not enabled for ${extensionId}`);
      }
      assertPermission(manifest, contribution.requiredPermission);
      const id = `${extensionId}:route:${path}:${contribution.element}`;
      registerRoute({
        id,
        extensionId,
        routePrefix: extension.routePrefix,
        path,
        element: contribution.element,
      });
      return { dispose: () => undefined };
    },
    registerCard(contribution) {
      const allowed = manifest.contributes.cards?.some(
        (card) => card.resourceKind === contribution.resourceKind,
      );
      if (!allowed) {
        throw new Error(`card kind "${contribution.resourceKind}" is not declared by ${extensionId}`);
      }
      assertPermission(manifest, contribution.requiredPermission);
      registerCard({
        kind: contribution.resourceKind,
        element: contribution.element,
        extensionId,
      });
      return { dispose: () => undefined };
    },
  };
}

function assertPermission(manifest: UiManifestV2, permission: string): void {
  if (!manifest.permissions.includes(permission)) {
    throw new Error(`permission "${permission}" is not declared by ${manifest.id}`);
  }
}

function describe(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}
