import {
  activeWorkspaceId,
  relationshipTargetProviderForKind,
  relationshipTypesForSourceKind,
  subscribeRelationshipTypes,
  type RelationshipTargetProvider,
  type RelationshipTypeContribution,
} from "@comtrya/sdk-core";

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

export interface ShellRelationshipRegistry {
  relationshipTypesForSourceKind(kind: string): RelationshipTypeContribution[];
  relationshipTargetProviderForKind(
    resourceKind: string,
  ): RelationshipTargetProvider | undefined;
  subscribeRelationshipTypes(callback: () => void): () => void;
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
    relationshipRegistry: {
      relationshipTypesForSourceKind,
      relationshipTargetProviderForKind,
      subscribeRelationshipTypes,
    } satisfies ShellRelationshipRegistry,
    labelCatalog: activeLabelCatalog,
    // Workspace ID is read from the shared store every time the
    // context is built so a slot mount that re-runs after
    // `loadShellSummary` resolves picks up the live value. Extensions
    // that read `workspaceId` from their element props no longer need
    // to hardcode a fallback ULID — once their fallback is removed
    // (PR 2 of #8 P1-1), this is the authoritative source.
    workspaceId: activeWorkspaceId(),
  };
}

export function extensionClient(): ShellGraphQLClient | undefined {
  return context?.client;
}
