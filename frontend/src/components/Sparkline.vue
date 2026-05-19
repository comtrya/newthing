<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    data: number[];
    width?: number;
    height?: number;
    accent?: boolean;
  }>(),
  { width: 80, height: 20, accent: false },
);

const points = computed(() => {
  const max = Math.max(...props.data);
  const min = Math.min(...props.data);
  const range = max - min || 1;
  return props.data
    .map((v, i) => {
      const x = (i / (props.data.length - 1)) * props.width;
      const y = props.height - ((v - min) / range) * (props.height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
});

const cls = computed(() => "spark" + (props.accent ? " spark-accent" : ""));
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`">
    <polyline :class="cls" :points="points" />
  </svg>
</template>
