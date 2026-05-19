/**
 * Vue composable wrapping `@comtrya/sdk-core`'s workspace store.
 *
 * Replaces the per-component hardcoded `ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3`
 * constant. The shell pushes the discovered workspace ID into the store
 * at boot (`App.vue::loadShellSummary`); this composable exposes that
 * value as Vue refs and tears down the subscription on unmount.
 *
 * Usage:
 *
 * ```ts
 * const { workspaceId, workspaceUri, ready } = useWorkspaceContext();
 * watch(workspaceId, (id) => { if (id) refresh(id); }, { immediate: true });
 * // Or, for async code paths that need a real ID:
 * const id = await ready;
 * ```
 *
 * Returns:
 * - `workspaceId`: `Ref<string | null>` — `null` until the shell has
 *   resolved the workspace. Subscribers re-render automatically.
 * - `workspaceUri`: `ComputedRef<string | null>` — the canonical
 *   `comtrya://workspace/<id>` URI, or `null`.
 * - `ready`: `Promise<string>` — resolves with the ID as soon as one
 *   is known. Already-set on subscribe → resolves immediately.
 */

import { computed, onUnmounted, ref, type ComputedRef, type Ref } from "vue";
import {
  activeWorkspaceId,
  activeWorkspaceUri,
  subscribeWorkspaceId,
  whenWorkspaceReady,
} from "@comtrya/sdk-core";

export interface WorkspaceContext {
  workspaceId: Ref<string | null>;
  workspaceUri: ComputedRef<string | null>;
  ready: Promise<string>;
}

export function useWorkspaceContext(): WorkspaceContext {
  const workspaceId = ref<string | null>(activeWorkspaceId());
  const workspaceUri = computed<string | null>(() =>
    workspaceId.value ? `comtrya://workspace/${workspaceId.value}` : null,
  );

  const unsubscribe = subscribeWorkspaceId((id) => {
    workspaceId.value = id;
  });

  // Guard the unmount hook — `useWorkspaceContext` may be invoked from
  // module scope in command bindings where there is no setup context.
  // In that case we never unmount, which is fine: those bindings live
  // for the whole process and the store outlives them too.
  try {
    onUnmounted(unsubscribe);
  } catch {
    // Outside a Vue setup; the binding will live as long as the
    // workspace store does (forever in production). No teardown
    // needed.
  }

  return {
    workspaceId,
    workspaceUri,
    ready: whenWorkspaceReady(),
  };
}

/**
 * Sync getter for callers outside a Vue setup context (module-scope
 * command bindings, plain functions). Returns the current ID without
 * subscribing. Prefer `useWorkspaceContext` inside components so the
 * UI re-renders on change.
 */
export function currentWorkspaceUri(): string | null {
  return activeWorkspaceUri();
}
