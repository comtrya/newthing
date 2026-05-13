/**
 * @comtrya/sdk-preact — Preact adapter over @comtrya/sdk-core.
 *
 * Exposes:
 *   * `useOp` hook wrapping `invokeOp` with `@preact/signals` for
 *     reactive state.
 *   * `defineExtensionWidget` wrapping a Preact component as a custom
 *     element via `@preact/preact-custom-element`.
 *
 * The peer dependencies (preact, @preact/signals,
 * @preact/preact-custom-element) are intentionally not bundled — the
 * shell owns the Preact version so every extension uses the same one.
 */

import { invokeOp, registerCard, registerSlot } from "@comtrya/sdk-core";
import type {
  CardContribution,
  InvokeOpOptions,
  OpResult,
  SlotContribution,
} from "@comtrya/sdk-core";

// We declare the Preact + signals + custom-element bindings as
// late-bound peer deps so the SDK itself remains framework-agnostic at
// build time. The shell injects the real bindings before any extension
// loads; if it didn't, the calls below would throw, surfacing the
// missing peer-dep early instead of silently degrading.

interface PreactBindings {
  signal<T>(value: T): { value: T };
  registerCustomElement(
    component: unknown,
    tagName: string,
    propNames: string[],
    options: { shadow: boolean },
  ): void;
}

let bindings: PreactBindings | null = null;

export function configurePreactBindings(b: PreactBindings): void {
  bindings = b;
}

function requireBindings(): PreactBindings {
  if (!bindings) {
    throw new Error(
      "@comtrya/sdk-preact: Preact bindings not configured. Call configurePreactBindings(...) from the shell before mounting extensions.",
    );
  }
  return bindings;
}

export interface UseOpSignal<T> {
  data: { value: T | undefined };
  error: { value: unknown | undefined };
  pending: { value: boolean };
  run: (input?: unknown) => Promise<OpResult<T>>;
}

export function useOp<T = unknown>(
  extensionId: string,
  interfaceName: string,
  opName: string,
  options: InvokeOpOptions = {},
): UseOpSignal<T> {
  const { signal } = requireBindings();
  const data = signal<T | undefined>(undefined);
  const error = signal<unknown | undefined>(undefined);
  const pending = signal(false);
  const run = async (input?: unknown): Promise<OpResult<T>> => {
    pending.value = true;
    error.value = undefined;
    const result = await invokeOp<T>(
      extensionId,
      interfaceName,
      opName,
      input,
      options,
    );
    if (result.ok) {
      data.value = result.value;
    } else {
      error.value = result.error;
    }
    pending.value = false;
    return result;
  };
  return { data, error, pending, run };
}

export interface ExtensionWidgetOptions {
  tagName: string;
  component: unknown;
  /** List of attribute names to surface as props. */
  propNames?: string[];
  shadow?: boolean;
}

export function defineExtensionWidget(opts: ExtensionWidgetOptions): void {
  const { registerCustomElement } = requireBindings();
  registerCustomElement(
    opts.component,
    opts.tagName,
    opts.propNames ?? [],
    { shadow: opts.shadow ?? false },
  );
}

export { registerCard, registerSlot };
export type { CardContribution, SlotContribution };
