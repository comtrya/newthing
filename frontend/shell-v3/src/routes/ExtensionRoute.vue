<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  prefix: string;
  rest: string[];
}>();

const routeTail = computed(() => props.rest.join("/"));
</script>

<template>
  <section class="page-header">
    <div class="title-group">
      <span class="overline">Extension</span>
      <h1>{{ prefix }}</h1>
    </div>
    <div class="summary-grid" aria-label="Extension route summary">
      <div>
        <span>Prefix</span>
        <strong>{{ prefix }}</strong>
      </div>
      <div>
        <span>Route tail</span>
        <strong>{{ routeTail || "/" }}</strong>
      </div>
      <div>
        <span>Mount</span>
        <strong>Pending</strong>
      </div>
    </div>
  </section>

  <section class="work-grid">
    <div class="panel route-panel">
      <div class="panel-heading">
        <h2>Extension Route</h2>
        <span class="chip info">/x</span>
      </div>
      <div class="route-list">
        <div class="route-row">
          <span>prefix</span>
          <code>{{ prefix }}</code>
          <span class="state">required</span>
        </div>
        <div class="route-row">
          <span>rest</span>
          <code>{{ routeTail || "/" }}</code>
          <span class="state">catch-all</span>
        </div>
      </div>
    </div>
  </section>
</template>
