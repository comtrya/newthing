<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  slotsFor,
  subscribeSlots,
  subscribeWidgets,
  widgetsForSlot,
  type ResolvedWidget,
  type SlotContribution,
} from "@comtrya/sdk-core";
import { extensionElementContext } from "../extension-runtime";

interface MountEntry {
  extensionId: string;
  element: string;
  priority: number;
  init?: unknown;
}

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

const contributions = ref<MountEntry[]>([]);
const mount = ref<HTMLElement | null>(null);
const unsubscribers: Array<() => void> = [];
const contextKey = computed(() => stableContextKey(props.elementContext));

function refresh(): void {
  contributions.value = mergeContributions(slotsFor(props.name), widgetsForSlot(props.name));
  void nextTick(renderSlot);
}

function mergeContributions(
  legacy: SlotContribution[],
  widgets: ResolvedWidget[],
): MountEntry[] {
  const entries: MountEntry[] = [];
  for (const entry of legacy) {
    entries.push({
      extensionId: entry.extensionId,
      element: entry.element,
      priority: entry.priority,
      init: entry.init,
    });
  }
  for (const widget of widgets) {
    entries.push({
      extensionId: widget.extensionId,
      element: widget.element,
      priority: widget.priority,
    });
  }
  entries.sort((a, b) => a.priority - b.priority);
  return entries;
}

onMounted(() => {
  refresh();
  unsubscribers.push(
    subscribeSlots((slot) => {
      if (slot === props.name) refresh();
    }),
  );
  unsubscribers.push(
    subscribeWidgets((slot) => {
      if (slot === null || slot === props.name) refresh();
    }),
  );
});

watch(() => props.name, refresh);
watch(contextKey, () => void nextTick(renderSlot));
onUnmounted(() => {
  for (const fn of unsubscribers) fn();
});

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

function buildContributionElement(entry: MountEntry): HTMLElement {
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
  if (entry.init !== undefined) node.init = entry.init;
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
