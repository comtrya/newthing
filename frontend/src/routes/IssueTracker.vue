<script setup lang="ts">
import ExtensionRoute from "./ExtensionRoute.vue";
</script>

<template>
  <section class="repo-extension-embed" data-smoke="repo-issue-board">
    <ExtensionRoute prefix="issues" :rest="[]" />
  </section>
</template>
