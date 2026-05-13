/**
 * Slot registry — the framework-agnostic mounting story.
 *
 * Extensions contribute UI fragments at named slots (e.g.
 * `workspace.home.left`, `issue.detail.sidebar`). The shell renders
 * a slot by looking up every contribution and asking each one for a
 * custom element to mount.
 *
 * Storage is a Map; mutations notify subscribers so reactive shells
 * (Vue, Preact) can re-render when contributions change.
 */

export interface SlotContribution {
  /** Stable id for unregistering. */
  id: string;
  /** Owning extension. */
  extensionId: string;
  /** Custom element name to mount (e.g. `comtrya-issue-card`). */
  element: string;
  /** Priority — lower numbers render first. */
  priority: number;
  /** Optional initialization payload as JSON. */
  init?: unknown;
}

export interface SlotRegistry {
  contributions: Map<string, SlotContribution[]>;
  subscribers: Set<(slot: string) => void>;
}

const REGISTRY: SlotRegistry = {
  contributions: new Map(),
  subscribers: new Set(),
};

export function registerSlot(slot: string, contribution: SlotContribution): void {
  const list = REGISTRY.contributions.get(slot) ?? [];
  // Deduplicate by id to make this idempotent under hot-reload.
  const filtered = list.filter((c) => c.id !== contribution.id);
  filtered.push(contribution);
  filtered.sort((a, b) => a.priority - b.priority);
  REGISTRY.contributions.set(slot, filtered);
  for (const sub of REGISTRY.subscribers) sub(slot);
}

export function unregisterSlot(slot: string, id: string): void {
  const list = REGISTRY.contributions.get(slot);
  if (!list) return;
  const filtered = list.filter((c) => c.id !== id);
  if (filtered.length === 0) {
    REGISTRY.contributions.delete(slot);
  } else {
    REGISTRY.contributions.set(slot, filtered);
  }
  for (const sub of REGISTRY.subscribers) sub(slot);
}

export function slotsFor(slot: string): SlotContribution[] {
  return REGISTRY.contributions.get(slot) ?? [];
}

export function subscribe(callback: (slot: string) => void): () => void {
  REGISTRY.subscribers.add(callback);
  return () => REGISTRY.subscribers.delete(callback);
}

/** Test-only — clears all registrations. */
export function _resetSlotsForTesting(): void {
  REGISTRY.contributions.clear();
  REGISTRY.subscribers.clear();
}
