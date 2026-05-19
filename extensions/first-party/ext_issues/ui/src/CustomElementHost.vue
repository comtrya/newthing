<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = withDefaults(defineProps<{
  tag: string;
  attributes?: Record<string, string | null | undefined>;
  properties?: Record<string, unknown>;
}>(), {
  attributes: () => ({}),
  properties: () => ({}),
});

const mount = ref<HTMLElement | null>(null);
let element: (HTMLElement & Record<string, unknown>) | null = null;

onMounted(renderElement);
watch(
  () => [props.tag, props.attributes, props.properties],
  renderElement,
  { deep: true },
);

function renderElement(): void {
  const target = mount.value;
  if (!target) return;
  const needsNewElement = !element || element.tagName.toLowerCase() !== props.tag;
  if (!element || element.tagName.toLowerCase() !== props.tag) {
    element = document.createElement(props.tag) as HTMLElement &
      Record<string, unknown>;
  }
  for (const [key, value] of Object.entries(props.attributes)) {
    if (value === null || value === undefined) {
      if (element.hasAttribute(key)) {
        element.removeAttribute(key);
      }
    } else if (element.getAttribute(key) !== value) {
      element.setAttribute(key, value);
    }
  }
  for (const [key, value] of Object.entries(props.properties)) {
    if (element[key] !== value) {
      element[key] = value;
    }
  }
  if (needsNewElement) {
    target.replaceChildren(element);
  }
}
</script>

<template>
  <span ref="mount" class="custom-element-host" />
</template>

<style scoped>
.custom-element-host {
  display: contents;
}
</style>
