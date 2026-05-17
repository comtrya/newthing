export interface ShellGraphQLClient {
  query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
  mutate<T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
}

export interface ShellViewer {
  authenticated: boolean;
  permissions: string[];
}

export interface ExtensionRuntimeContext {
  client: ShellGraphQLClient;
  viewer: ShellViewer;
  capabilities: Record<string, boolean>;
}

let context: ExtensionRuntimeContext | undefined;
let activeLabelCatalog: Record<string, unknown> | null = null;

export function setExtensionRuntimeContext(next: ExtensionRuntimeContext): void {
  context = next;
}

/**
 * Stash the active repo's label catalog on the shell-side extension
 * runtime so embedded extension elements receive it as a property at
 * mount time (alongside `comtryaClient`, `viewer`, …). Set on repo
 * navigation; cleared when the user leaves a repo route. The catalog
 * shape is the same `wireName → LabelCatalogEntry` map the server
 * projects on `repository.labelCatalog`.
 */
export function setActiveLabelCatalog(
  next: Record<string, unknown> | null,
): void {
  activeLabelCatalog = next;
}

export function extensionElementContext(): Record<string, unknown> {
  if (!context) return {};
  return {
    comtryaClient: context.client,
    viewer: context.viewer,
    capabilities: context.capabilities,
    labelCatalog: activeLabelCatalog,
  };
}

export function extensionClient(): ShellGraphQLClient | undefined {
  return context?.client;
}
