/**
 * @comtrya/sdk-vue — Vue 3 adapter over @comtrya/sdk-core.
 *
 * Exposes:
 *   * `useOp` composable wrapping `invokeOp` with a reactive `{ data,
 *     error, pending }` triple.
 *   * `defineExtensionWidget` helper that wraps a Vue component as a
 *     custom element via `defineCustomElement`, so the resulting
 *     element can be registered with the shell's slot/card registry.
 */

import {
  defineCustomElement,
  ref,
  type Component,
  type Ref,
} from "vue";
import {
  invokeOp,
  type OpResult,
  type InvokeOpOptions,
  registerSlot,
  registerCard,
  type CardContribution,
  type SlotContribution,
} from "@comtrya/sdk-core";

export interface UseOpState<T> {
  data: Ref<T | undefined>;
  error: Ref<OpResult<T> extends { ok: false } ? unknown : unknown | undefined>;
  pending: Ref<boolean>;
  run: (input?: unknown) => Promise<OpResult<T>>;
}

/**
 * Reactive wrapper over `invokeOp`. Call `run(input)` to fire; the
 * `data` / `error` / `pending` refs update reactively.
 */
export function useOp<T = unknown>(
  extensionId: string,
  interfaceName: string,
  opName: string,
  options: InvokeOpOptions = {},
): UseOpState<T> {
  const data = ref<T | undefined>(undefined) as Ref<T | undefined>;
  const error = ref<unknown | undefined>(undefined);
  const pending = ref(false);
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
  /** Custom element tag name to register, e.g. `comtrya-issue-card`. */
  tagName: string;
  /** Vue component to mount inside the custom element. */
  component: Component;
}

/**
 * Wrap a Vue component as a custom element and register it. Returns
 * the constructor so the caller can also `customElements.define` it
 * directly if they want a different tag.
 */
export function defineExtensionWidget(
  opts: ExtensionWidgetOptions,
): CustomElementConstructor {
  const ctor = defineCustomElement(opts.component);
  if (
    typeof customElements !== "undefined" &&
    !customElements.get(opts.tagName)
  ) {
    customElements.define(opts.tagName, ctor);
  }
  return ctor;
}

/** Re-export the registries so Vue extensions have a single import. */
export { registerSlot, registerCard };
export type { CardContribution, SlotContribution };
