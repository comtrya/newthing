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
  enabledExtensions?: string[] | null;
  framed?: boolean;
  hideEmpty?: boolean;
}>(), {
  smokePrefix: "slot",
  elementContext: () => ({}),
  framed: true,
  hideEmpty: false,
});

const contributions = ref<ResolvedWidget[]>([]);
const mount = ref<HTMLElement | null>(null);
let unsubscribe: (() => void) | undefined;
const contextKey = computed(() => stableContextKey(props.elementContext));
const enabledExtensionsKey = computed(() =>
  props.enabledExtensions === undefined
    ? "*"
    : (props.enabledExtensions ?? []).join("|"),
);

function refresh(): void {
  contributions.value = widgetsForSlot(props.name).filter(widgetEnabledForRepo);
  void nextTick(renderSlot);
}

onMounted(() => {
  refresh();
  unsubscribe = subscribeWidgets((slot) => {
    if (slot === null || slot === props.name) refresh();
  });
});

watch(() => props.name, refresh);
watch(enabledExtensionsKey, refresh);
watch(contextKey, () => void nextTick(renderSlot));
onUnmounted(() => unsubscribe?.());

function widgetEnabledForRepo(entry: ResolvedWidget): boolean {
  if (props.enabledExtensions === undefined) return true;
  return (props.enabledExtensions ?? []).includes(entry.extensionId);
}

function renderSlot(): void {
  const target = mount.value;
  if (!target) return;

  if (contributions.value.length === 0) {
    target.replaceChildren(buildPlaceholder());
    return;
  }

  if (canReuseChildren(target, contributions.value)) {
    for (const child of Array.from(target.children)) {
      updateContributionElement(child as HTMLElement & Record<string, unknown>);
    }
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
  node.dataset.extensionWidget = entry.id;
  updateContributionElement(node);
  return node;
}

function updateContributionElement(
  node: HTMLElement & Record<string, unknown>,
): void {
  node.extensionSlot = props.name;
  for (const [key, value] of Object.entries(extensionElementContext())) {
    syncContextAttribute(node, key, value);
    node[key] = value;
  }
  for (const [key, value] of Object.entries(props.elementContext)) {
    syncContextAttribute(node, key, value);
    node[key] = value;
  }
}

function canReuseChildren(target: HTMLElement, entries: ResolvedWidget[]): boolean {
  const children = Array.from(target.children) as HTMLElement[];
  if (children.length !== entries.length) return false;
  return entries.every((entry, index) => {
    const child = children[index];
    return child?.dataset.extensionWidget === entry.id &&
      child.tagName.toLowerCase() === entry.element;
  });
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

function syncContextAttribute(node: HTMLElement, key: string, value: unknown): void {
  const attribute = kebabCase(key);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    node.setAttribute(attribute, String(value));
  } else {
    node.removeAttribute(attribute);
  }
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
</script>

<template>
  <section
    v-show="!hideEmpty || contributions.length > 0"
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
