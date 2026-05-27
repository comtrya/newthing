<script setup lang="ts">
import { computed } from "vue";
import ExtensionRoute from "./ExtensionRoute.vue";

const props = defineProps<{ groups: string[]; repo: string; id?: string }>();

const rest = computed(() => (props.id ? [props.id] : []));
</script>

<template>
  <section class="repo-extension-embed" data-smoke="repo-pull-review">
    <ExtensionRoute prefix="pulls" :rest="rest" />
  </section>
</template>
