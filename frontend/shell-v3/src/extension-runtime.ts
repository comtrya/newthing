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

export function setExtensionRuntimeContext(next: ExtensionRuntimeContext): void {
  context = next;
}

export function extensionElementContext(): Record<string, unknown> {
  if (!context) return {};
  return {
    comtryaClient: context.client,
    viewer: context.viewer,
    capabilities: context.capabilities,
  };
}

export function extensionClient(): ShellGraphQLClient | undefined {
  return context?.client;
}
