<script setup lang="ts">
import { computed } from "vue";
import Chip from "../components/Chip.vue";

const props = withDefaults(defineProps<{
  groups?: string[];
  repo?: string;
}>(), {
  groups: () => [],
  repo: "",
});

const repoPath = computed(() =>
  [...props.groups, props.repo].filter(Boolean).join("/"),
);
const scope = computed(() => repoPath.value || "Workspace");
</script>

<template>
  <section class="runtime-empty-page" data-smoke="pipelines-empty">
    <header class="runtime-empty-head hairline-b">
      <div>
        <p class="overline">{{ scope }}</p>
        <h1>Pipelines</h1>
      </div>
      <Chip tone="info">Not yet available</Chip>
    </header>

    <article class="runtime-empty-panel">
      <h2>No pipeline runs recorded</h2>
      <p>Comtrya has no persisted pipeline run data for this scope.</p>
    </article>
  </section>
</template>

<style scoped>
.runtime-empty-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.runtime-empty-head {
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.runtime-empty-head h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}

.runtime-empty-panel {
  margin: 28px;
  border-top: 0.5px solid var(--line-2);
  padding-top: 18px;
  max-width: 680px;
}

.runtime-empty-panel h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

.runtime-empty-panel p {
  margin: 0;
  color: var(--fg-2);
}
</style>
