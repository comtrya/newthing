<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  groups: string[];
  repo: string;
}>();

const ownerPath = computed(() => props.groups.join("/"));
const repoPath = computed(() => [...props.groups, props.repo].join("/"));

const repoRows = computed(() => [
  { label: "Owner path", value: ownerPath.value || "unknown" },
  { label: "Repository", value: props.repo || "unknown" },
  { label: "Route name", value: repoPath.value || "unknown" },
]);
</script>

<template>
  <section class="page-header">
    <div class="title-group">
      <span class="overline">Repository</span>
      <h1>{{ repo }}</h1>
    </div>
    <div class="summary-grid" aria-label="Repository summary">
      <div v-for="row in repoRows" :key="row.label">
        <span>{{ row.label }}</span>
        <strong>{{ row.value }}</strong>
      </div>
    </div>
  </section>

  <section class="work-grid">
    <div class="panel route-panel">
      <div class="panel-heading">
        <h2>Route Params</h2>
        <span class="chip info">repo</span>
      </div>
      <div class="route-list">
        <div class="route-row">
          <span>groups</span>
          <code>{{ groups.join("/") }}</code>
          <span class="state">repeatable</span>
        </div>
        <div class="route-row">
          <span>repo</span>
          <code>{{ repo }}</code>
          <span class="state">leaf</span>
        </div>
      </div>
    </div>
  </section>
</template>
