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
  if (!element || element.tagName.toLowerCase() !== props.tag) {
    element = document.createElement(props.tag) as HTMLElement &
      Record<string, unknown>;
    target.replaceChildren(element);
  }
  for (const [key, value] of Object.entries(props.attributes)) {
    if (value === null || value === undefined) {
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, value);
    }
  }
  for (const [key, value] of Object.entries(props.properties)) {
    element[key] = value;
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
