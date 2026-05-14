<script setup lang="ts">
import { computed } from "vue";
import type { ExtensionRouteParams } from "./types";

const props = defineProps<{
  routeParams?: ExtensionRouteParams;
}>();

const pullId = computed(() => props.routeParams?.params?.pullId ?? "unknown");
</script>

<template>
  <div class="extension-payload" data-smoke="pulls-detail">
    <strong>Pull #{{ pullId }}</strong>
  </div>
</template>

<style scoped>
.extension-payload {
  display: grid;
  gap: 4px;
}
</style>
