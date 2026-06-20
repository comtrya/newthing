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
  <section class="runtime-empty-page" data-smoke="releases-empty">
    <header class="runtime-empty-head hairline-b">
      <div>
        <p class="overline">{{ scope }}</p>
        <h1>Releases</h1>
      </div>
      <Chip tone="info">No releases yet</Chip>
    </header>

    <article class="runtime-empty-panel">
      <h2>No releases published</h2>
      <p>Published releases will appear here after you publish one for this scope.</p>
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
  font-family: var(--font-sans);
  margin: 0;
  font-size: 28px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.1;
}

.runtime-empty-head .overline {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
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
