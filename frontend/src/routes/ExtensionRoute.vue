<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  routeFor,
  subscribeRoutes,
  type RouteMatch,
} from "@comtrya/sdk-core";
import { extensionElementContext } from "../extension-runtime";

const props = defineProps<{
  prefix: string;
  rest: string[];
}>();

const mount = ref<HTMLElement | null>(null);
const routeTail = computed(() => props.rest.join("/"));
const subPath = computed(() => (routeTail.value ? `/${routeTail.value}` : "/"));
const matchedRoute = ref<RouteMatch | undefined>();
let unsubscribe: (() => void) | undefined;

onMounted(() => {
  refreshRoute();
  unsubscribe = subscribeRoutes((prefix) => {
    if (prefix === props.prefix) refreshRoute();
  });
});

watch([() => props.prefix, subPath], refreshRoute);
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
  for (const [key, value] of Object.entries(extensionElementContext())) {
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
</script>

<template>
  <div data-smoke="extension-page">
    <section class="page-header">
      <div class="title-group">
        <span class="overline">Extension</span>
        <h1>{{ prefix }}</h1>
      </div>
      <div class="summary-grid" aria-label="Extension route summary">
        <div>
          <span>Prefix</span>
          <strong>{{ prefix }}</strong>
        </div>
        <div>
          <span>Route tail</span>
          <strong>{{ routeTail || "/" }}</strong>
        </div>
        <div>
          <span>Mount</span>
          <strong>{{ matchedRoute ? matchedRoute.route.element : "Missing" }}</strong>
        </div>
      </div>
    </section>

    <section class="work-grid">
      <section class="slot-frame" data-smoke="extension-route-frame">
        <header class="slot-heading">
          <h2>Extension Route</h2>
          <span class="chip info">/x</span>
        </header>
        <div class="route-list">
          <div class="route-row">
            <span>prefix</span>
            <code>{{ prefix }}</code>
            <span class="state">required</span>
          </div>
          <div class="route-row">
            <span>rest</span>
            <code>{{ routeTail || "/" }}</code>
            <span class="state">catch-all</span>
          </div>
        </div>
        <div
          ref="mount"
          class="slot-mount"
          data-extension-route-mount="true"
        />
      </section>
    </section>
  </div>
</template>
