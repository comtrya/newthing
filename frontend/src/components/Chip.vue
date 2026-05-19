<script setup lang="ts">
import { computed } from "vue";

type Tone = "ok" | "warn" | "err" | "info" | "accent";

const props = withDefaults(
  defineProps<{
    tone?: Tone;
    mono?: boolean;
    dot?: boolean;
  }>(),
  { mono: false, dot: false },
);

const cls = computed(() => {
  const c = ["chip"];
  if (props.tone) c.push(`chip-${props.tone}`);
  if (props.mono) c.push("chip-mono");
  return c.join(" ");
});
</script>

<template>
  <span :class="cls">
    <span v-if="dot" class="chip-dot" />
    <slot />
  </span>
</template>
