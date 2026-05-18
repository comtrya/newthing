<script setup lang="ts">
import { Ic, type IconKey } from "./icons";

const props = defineProps<{ name: IconKey }>();
</script>

<template>
  <span class="icon" v-html="Ic[name]" />
</template>

<style scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  color: inherit;
}
.icon :deep(svg) {
  display: block;
}
</style>
