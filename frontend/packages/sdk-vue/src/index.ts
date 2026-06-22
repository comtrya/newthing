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
  type Ref,
} from "vue";
import {
  invokeOp,
  type OpError,
  type OpResult,
  type InvokeOpOptions,
  registerCard,
  registerRelationshipTargetProvider,
  registerWidget,
  type CardContribution,
  type GraphQLClient,
  type RelationshipTarget,
  type RelationshipTargetContext,
  type RelationshipTargetProvider,
  type WidgetContribution,
} from "@comtrya/sdk-core";
import { getGraphQLClient } from "@comtrya/sdk-core";

export interface UseOpState<T> {
  data: Ref<T | undefined>;
  error: Ref<OpError | undefined>;
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
  const error = ref<OpError | undefined>(undefined);
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
  component: Parameters<typeof defineCustomElement>[0];
  /** Use light DOM by default so extension smoke hooks remain host-visible. */
  shadowRoot?: boolean;
  /** Host property aliases for custom-element API adaptation. */
  propertyAliases?: Record<string, string>;
}

/**
 * Wrap a Vue component as a custom element and register it. Returns
 * the constructor so the caller can also `customElements.define` it
 * directly if they want a different tag.
 */
export function defineExtensionWidget(
  opts: ExtensionWidgetOptions,
): CustomElementConstructor {
  injectLightDomStyles(opts.tagName, opts.component);
  const ctor = defineCustomElement(opts.component, {
    shadowRoot: opts.shadowRoot ?? false,
  });
  for (const [alias, target] of Object.entries(opts.propertyAliases ?? {})) {
    Object.defineProperty(ctor.prototype, alias, {
      configurable: true,
      get(this: Record<string, unknown>) {
        return this[target];
      },
      set(this: HTMLElement & Record<string, unknown>, value: unknown) {
        this[target] = value;
        if (typeof value === "string") {
          this.setAttribute(kebabCase(target), value);
        }
      },
    });
  }
  if (
    typeof customElements !== "undefined" &&
    !customElements.get(opts.tagName)
  ) {
    customElements.define(opts.tagName, ctor);
  }
  return ctor;
}

function injectLightDomStyles(
  tagName: string,
  component: Parameters<typeof defineCustomElement>[0],
): void {
  if (typeof document === "undefined") return;
  const styles = componentStyles(component);
  if (styles.length === 0) return;
  const marker = `comtrya-widget-styles:${tagName}`;
  if (document.head.querySelector(`style[data-comtrya-widget-styles="${marker}"]`)) {
    return;
  }
  const style = document.createElement("style");
  style.dataset.comtryaWidgetStyles = marker;
  style.textContent = styles.join("\n");
  document.head.append(style);
}

function componentStyles(
  component: Parameters<typeof defineCustomElement>[0],
): string[] {
  if (!component || typeof component !== "object") return [];
  const styles = (component as { styles?: unknown }).styles;
  if (!Array.isArray(styles)) return [];
  return styles.filter((style): style is string => typeof style === "string");
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/**
 * Reactive wrapper over the shared GraphQL client. Returns refs that
 * update when `run()` resolves; the underlying transport is the
 * singleton `getGraphQLClient()` shared by every extension and the
 * shell itself.
 */
export function useGraphQL<T = unknown>(): {
  data: Ref<T | undefined>;
  error: Ref<unknown | undefined>;
  pending: Ref<boolean>;
  query(query: string, variables?: Record<string, unknown>): Promise<T>;
  mutate(mutation: string, variables?: Record<string, unknown>): Promise<T>;
} {
  const data = ref<T | undefined>(undefined) as Ref<T | undefined>;
  const error = ref<unknown | undefined>(undefined);
  const pending = ref(false);
  const call = async (
    operation: string,
    variables?: Record<string, unknown>,
    method: "query" | "mutate" = "query",
  ): Promise<T> => {
    pending.value = true;
    error.value = undefined;
    try {
      const client = getGraphQLClient();
      const result = await (method === "query"
        ? client.query<T>(operation, variables)
        : client.mutate<T>(operation, variables));
      data.value = result;
      return result;
    } catch (caught) {
      error.value = caught;
      throw caught;
    } finally {
      pending.value = false;
    }
  };
  return {
    data,
    error,
    pending,
    query: (q, v) => call(q, v, "query"),
    mutate: (m, v) => call(m, v, "mutate"),
  };
}

/** Re-export the registries so Vue extensions have a single import. */
export {
  registerCard,
  registerRelationshipTargetProvider,
  registerWidget,
  getGraphQLClient,
};
export type {
  CardContribution,
  GraphQLClient,
  RelationshipTarget,
  RelationshipTargetContext,
  RelationshipTargetProvider,
  WidgetContribution,
};

export { useShortcuts } from "./use-shortcuts";
export type { UseShortcutsOptions } from "./use-shortcuts";

export { renderMarkdown, bodyExcerpt } from "./markdown";

export { parseQueryFilters } from "./parse-query";
export type { ParsedQuery } from "./parse-query";

export {
  shouldWriteProjectFilterParam,
  syncProjectFilterParam,
} from "./project-query";
export type { ProjectFilterParamInput } from "./project-query";

export { extensionHref } from "./extension-hrefs";
export type { ExtensionHrefOptions } from "./extension-hrefs";

export { classifyPrincipal, principalLabel } from "./classify-principal";
export type {
  PrincipalClassification,
  PrincipalKind,
} from "./classify-principal";

export { fetchComtryaProjects, resolveProjectOwners } from "./comtrya-config";
export type { ComtryaOwnerRef, ComtryaProject } from "./comtrya-config";

export { useProjectCounts, emptyProjectCounts } from "./use-project-counts";
export type { ProjectCounts, UseProjectCountsOptions } from "./use-project-counts";

export { default as LabelPill } from "./LabelPill.vue";
export type {
  LabelKind,
  LabelCatalogEntry,
  LabelCatalog,
} from "./LabelPill.vue";

export { useDiagrams } from "./use-diagrams";

export {
  useWorkspaceContext,
  currentWorkspaceUri,
  type WorkspaceContext,
} from "./use-workspace-context";
