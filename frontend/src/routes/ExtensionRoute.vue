<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import {
  routeFor,
  subscribeRoutes,
  type RouteMatch,
} from "@comtrya/sdk-core";
import {
  extensionRouteElementContext,
  extensionRouteQueryContext,
  extensionRouteQueryContextKey,
} from "../extension-route-context";
import { extensionElementContext } from "../extension-runtime";

const props = defineProps<{
  prefix: string;
  rest: string[];
  elementContext?: Record<string, unknown>;
}>();

const mount = ref<HTMLElement | null>(null);
const route = useRoute();
const routeTail = computed(() => props.rest.join("/"));
const subPath = computed(() => (routeTail.value ? `/${routeTail.value}` : "/"));
const routeQueryContext = computed(() => extensionRouteQueryContext(route.query));
const routeContextKey = computed(() =>
  extensionRouteQueryContextKey(routeQueryContext.value),
);
const elementContextKey = computed(() => stableElementContextKey(props.elementContext ?? {}));
const matchedRoute = ref<RouteMatch | undefined>();
let unsubscribe: (() => void) | undefined;

// Auto-tracking refresh: re-runs whenever any reactive dep
// `refreshRoute` reads changes (prop prefix, computed subPath, the
// underlying `props.rest` array contents). The previous explicit
// `watch([prefix, subPath], …)` was missing a propagation path
// when RepoHome stayed mounted across `/r/:path/<ext>` →
// `/r/:path/<ext>/<sub>` navigation, leaving the embedded
// extension element stale until a reload.
watchEffect(() => {
  void routeContextKey.value;
  void elementContextKey.value;
  refreshRoute();
});

onMounted(() => {
  unsubscribe = subscribeRoutes((prefix) => {
    if (prefix === props.prefix) refreshRoute();
  });
});

onUnmounted(() => unsubscribe?.());

function refreshRoute(): void {
  matchedRoute.value = routeFor(props.prefix, subPath.value);
  void nextTick(renderRoute);
}

function renderRoute(): void {
  const target = mount.value;
  if (!target) return;
  const match = matchedRoute.value;
  if (!match) {
    target.replaceChildren(buildPlaceholder(`No route registered for ${subPath.value}`));
    return;
  }

  const node = document.createElement(match.route.element) as HTMLElement &
    Record<string, unknown>;
  node.dataset.extensionId = match.route.extensionId;
  node.dataset.extensionRoute = match.route.path;
  const context = {
    ...extensionRouteElementContext(extensionElementContext(), route.query),
    ...(props.elementContext ?? {}),
  };
  for (const [key, value] of Object.entries(context)) {
    node[key] = value;
  }
  node.routeParams = {
    scope: "extension",
    routePrefix: props.prefix,
    subPath: subPath.value,
    params: match.params,
  };
  if (match.route.init !== undefined) {
    node.init = match.route.init;
  }
  target.replaceChildren(node);
}

function buildPlaceholder(message: string): HTMLElement {
  const node = document.createElement("article");
  node.className = "slot-placeholder";
  const label = document.createElement("span");
  label.textContent = message;
  node.append(label);
  return node;
}

function stableElementContextKey(context: Record<string, unknown>): string {
  return Object.keys(context)
    .sort()
    .map((key) => `${key}:${stableElementContextValue(context[key])}`)
    .join("|");
}

function stableElementContextValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableElementContextValue).join(",")}]`;
  }
  return typeof value;
}
</script>

<template>
  <section class="extension-route-page" data-smoke="extension-page">
    <div
      ref="mount"
      class="extension-route-mount"
      data-extension-route-mount="true"
    />
  </section>
</template>
