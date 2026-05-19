<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  subscribeWidgets,
  widgetsForSlot,
  type ResolvedWidget,
} from "@comtrya/sdk-core";
import { extensionElementContext } from "../extension-runtime";

const props = withDefaults(defineProps<{
  name: string;
  label: string;
  smokePrefix?: string;
  elementContext?: Record<string, unknown>;
  framed?: boolean;
}>(), {
  smokePrefix: "slot",
  elementContext: () => ({}),
  framed: true,
});

const contributions = ref<ResolvedWidget[]>([]);
const mount = ref<HTMLElement | null>(null);
let unsubscribe: (() => void) | undefined;
const contextKey = computed(() => stableContextKey(props.elementContext));

function refresh(): void {
  contributions.value = widgetsForSlot(props.name);
  void nextTick(renderSlot);
}

onMounted(() => {
  refresh();
  unsubscribe = subscribeWidgets((slot) => {
    if (slot === null || slot === props.name) refresh();
  });
});

watch(() => props.name, refresh);
watch(contextKey, () => void nextTick(renderSlot));
onUnmounted(() => unsubscribe?.());

function renderSlot(): void {
  const target = mount.value;
  if (!target) return;

  if (contributions.value.length === 0) {
    target.replaceChildren(buildPlaceholder());
    return;
  }

  target.replaceChildren(
    ...contributions.value.map((entry) => buildContributionElement(entry)),
  );
}

function buildContributionElement(entry: ResolvedWidget): HTMLElement {
  const node = document.createElement(entry.element) as HTMLElement &
    Record<string, unknown>;
  node.dataset.extensionId = entry.extensionId;
  node.dataset.extensionSlot = props.name;
  node.extensionSlot = props.name;
  for (const [key, value] of Object.entries(extensionElementContext())) {
    node[key] = value;
  }
  for (const [key, value] of Object.entries(props.elementContext)) {
    node[key] = value;
  }
  return node;
}

function buildPlaceholder(): HTMLElement {
  const node = document.createElement("article");
  node.className = "slot-placeholder";
  const label = document.createElement("span");
  label.textContent = "No extension claims this slot";
  node.append(label);
  return node;
}

function stableContextKey(context: Record<string, unknown>): string {
  return Object.entries(context)
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.join("/") : String(value)}`)
    .join("|");
}
</script>

<template>
  <section
    class="slot-frame"
    :class="{ 'slot-frame--bare': !framed }"
    :data-smoke="`${smokePrefix}-${name}`"
  >
    <header v-if="framed" class="slot-heading">
      <h2>{{ label }}</h2>
      <code>{{ name }}</code>
    </header>
    <div
      ref="mount"
      class="slot-mount"
      :data-extension-slot-mount="name"
    />
  </section>
</template>
