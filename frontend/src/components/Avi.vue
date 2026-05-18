<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    hue?: number;
    size?: number;
  }>(),
  { hue: 200, size: 22 },
);

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size * 0.42}px`,
  background: `linear-gradient(135deg, oklch(70% 0.12 ${props.hue}), oklch(60% 0.16 ${(props.hue + 60) % 360}))`,
  color: "#0a0b0e",
}));
</script>

<template>
  <span class="avi" :style="style">{{ initials }}</span>
</template>
