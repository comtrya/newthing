/**
 * Active workspace identity, shared across the shell and SDK.
 *
 * The shell discovers the active workspace at boot
 * (`App.vue::loadShellSummary`) and pushes it here. Every other surface
 * — shell components, SDK composables, eventually extension UIs — reads
 * from this store instead of hardcoding a workspace ULID.
 *
 * Boot-time race: callers may need the workspace ID before the shell's
 * `workspace { id }` query resolves. `whenWorkspaceReady()` returns a
 * Promise that resolves with the ID as soon as `setActiveWorkspaceId`
 * fires. If a real ID is already known, the Promise resolves
 * immediately.
 *
 * Lifecycle: there is no "unset" path in production — the workspace
 * doesn't change mid-session. `setActiveWorkspaceId(null)` is provided
 * for tests and for the (rare) sign-out flow.
 */

type Subscriber = (workspaceId: string | null) => void;

let current: string | null = null;
const subscribers = new Set<Subscriber>();
let readyResolvers: Array<(id: string) => void> = [];

/** Returns the active workspace ID, or `null` if not yet known. */
export function activeWorkspaceId(): string | null {
  return current;
}

/**
 * Build the `comtrya://workspace/<id>` URI for the active workspace,
 * or `null` if not yet known. Callers that need the URI string
 * directly (graph filters, op invocations) should go through this so
 * the URI shape lives in one place.
 */
export function activeWorkspaceUri(): string | null {
  return current ? `comtrya://workspace/${current}` : null;
}

/**
 * Push a new active workspace ID and notify every subscriber. Passing
 * `null` is a sign-out / test-reset path; production code only calls
 * this once with a real ID at boot.
 */
export function setActiveWorkspaceId(id: string | null): void {
  if (id === current) return;
  current = id;
  for (const fn of subscribers) fn(id);
  if (id !== null) {
    const pending = readyResolvers;
    readyResolvers = [];
    for (const resolve of pending) resolve(id);
  }
}

/**
 * Subscribe to active-workspace changes. The returned function
 * unsubscribes; callers must invoke it on unmount to avoid leaks.
 * The handler does NOT fire on subscription with the current value
 * — callers can read `activeWorkspaceId()` for that.
 */
export function subscribeWorkspaceId(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/**
 * Resolve with the workspace ID as soon as one is known. If a real
 * ID is already set, resolves synchronously on the next microtask.
 * Used by composables that need to fetch workspace-scoped data
 * before they can render anything meaningful.
 */
export function whenWorkspaceReady(): Promise<string> {
  if (current !== null) return Promise.resolve(current);
  return new Promise<string>((resolve) => {
    readyResolvers.push(resolve);
  });
}

/** Test-only — clear state so tests start from a known baseline. */
export function _resetWorkspaceStoreForTesting(): void {
  current = null;
  subscribers.clear();
  readyResolvers = [];
}
