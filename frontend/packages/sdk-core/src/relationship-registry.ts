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

const TYPES = new Map<string, RelationshipTypeContribution>();
const PROVIDERS = new Map<string, RelationshipTargetProvider>();
const SUBSCRIBERS = new Set<() => void>();

export function registerRelationshipType(
  contribution: RelationshipTypeContribution,
): void {
  TYPES.set(contribution.id, contribution);
  notify();
}

export function relationshipTypesForSourceKind(
  kind: string,
): RelationshipTypeContribution[] {
  return [...TYPES.values()]
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
  PROVIDERS.set(provider.resourceKind, provider);
  notify();
}

export function relationshipTargetProviderForKind(
  resourceKind: string,
): RelationshipTargetProvider | undefined {
  return PROVIDERS.get(resourceKind);
}

/** Remove a registered relationship target provider by resource kind. */
export function unregisterRelationshipTargetProvider(resourceKind: string): void {
  PROVIDERS.delete(resourceKind);
  notify();
}

export function subscribeRelationshipTypes(callback: () => void): () => void {
  SUBSCRIBERS.add(callback);
  return () => SUBSCRIBERS.delete(callback);
}

function notify(): void {
  for (const subscriber of SUBSCRIBERS) subscriber();
}

/** Test-only. */
export function _resetRelationshipsForTesting(): void {
  TYPES.clear();
  PROVIDERS.clear();
  SUBSCRIBERS.clear();
}
