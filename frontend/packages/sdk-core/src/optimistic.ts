/**
 * Optimistic mutation helper. Wraps an op call so the UI updates
 * immediately, then either confirms on success or rolls back on
 * failure.
 *
 *   const result = await applyOptimistic({
 *     apply: () => store.setIssueClosed(id, true),
 *     rollback: () => store.setIssueClosed(id, false),
 *     op: () => closeIssue({ id }),
 *   });
 *
 * The pattern is intentionally not Vue/Preact specific — both frameworks
 * call this from their own composable / hook wrappers.
 */

import type { OpResult } from "./runtime";

export interface OptimisticOptions<T> {
  /** Apply the optimistic UI mutation. Called synchronously, before
   * the op fires. */
  apply: () => void;
  /** Rollback the optimistic mutation. Called only on op failure. */
  rollback: () => void;
  /** The actual op call. */
  op: () => Promise<OpResult<T>>;
  /** Optional success callback; receives the op's value. */
  onSuccess?: (value: T) => void;
}

export async function applyOptimistic<T>(
  options: OptimisticOptions<T>,
): Promise<OpResult<T>> {
  options.apply();
  let result: OpResult<T>;
  try {
    result = await options.op();
  } catch (err) {
    options.rollback();
    return {
      ok: false,
      error: {
        code: "internal",
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
  if (result.ok) {
    options.onSuccess?.(result.value);
  } else {
    options.rollback();
  }
  return result;
}
