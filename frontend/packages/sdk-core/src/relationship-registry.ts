export interface RelationshipTypeContribution {
  id: string;
  extensionId: string;
  kind: string;
  sourceKinds: string[];
  targetKinds: string[];
  outgoingLabel: string;
  incomingLabel: string;
  symmetric: boolean;
  order: number;
}

export interface RelationshipTarget {
  ref: string;
  kind: string;
  title: string;
  subtitle?: string | null;
}

export interface RelationshipTargetContext {
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
  currentRef: string;
  currentKind: string;
  relationshipType: RelationshipTypeContribution;
  direction: "outgoing" | "incoming" | "symmetric";
  targetKind: string;
}

export interface RelationshipTargetProvider {
  id: string;
  extensionId: string;
  resourceKind: string;
  loadTargets(
    context: RelationshipTargetContext,
  ): Promise<RelationshipTarget[]> | RelationshipTarget[];
}

interface RelationshipRegistry {
  types: Map<string, RelationshipTypeContribution>;
  providers: Map<string, RelationshipTargetProvider>;
  subscribers: Set<() => void>;
}

const REGISTRY_KEY = Symbol.for("comtrya.relationship-registry");

const REGISTRY = sharedRegistry();

function sharedRegistry(): RelationshipRegistry {
  const root = globalThis as typeof globalThis & {
    [REGISTRY_KEY]?: RelationshipRegistry;
  };
  root[REGISTRY_KEY] ??= {
    types: new Map(),
    providers: new Map(),
    subscribers: new Set(),
  };
  return root[REGISTRY_KEY];
}

export function registerRelationshipType(
  contribution: RelationshipTypeContribution,
): void {
  REGISTRY.types.set(contribution.id, contribution);
  notify();
}

export function relationshipTypesForSourceKind(
  kind: string,
): RelationshipTypeContribution[] {
  return [...REGISTRY.types.values()]
    .filter((type) => (
      type.sourceKinds.includes(kind) ||
      type.targetKinds.includes(kind)
    ))
    .sort((left, right) => (
      left.order - right.order || left.id.localeCompare(right.id)
    ));
}

export function registerRelationshipTargetProvider(
  provider: RelationshipTargetProvider,
): void {
  REGISTRY.providers.set(provider.resourceKind, provider);
  notify();
}

export function relationshipTargetProviderForKind(
  resourceKind: string,
): RelationshipTargetProvider | undefined {
  return REGISTRY.providers.get(resourceKind);
}

export function subscribeRelationshipTypes(callback: () => void): () => void {
  REGISTRY.subscribers.add(callback);
  return () => REGISTRY.subscribers.delete(callback);
}

function notify(): void {
  for (const subscriber of REGISTRY.subscribers) subscriber();
}

/** Test-only. */
export function _resetRelationshipsForTesting(): void {
  REGISTRY.types.clear();
  REGISTRY.providers.clear();
  REGISTRY.subscribers.clear();
}
