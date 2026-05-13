<script setup lang="ts">
import SlotMount from "../components/SlotMount.vue";
import { workspaceHomeSlots } from "../workspace-home-slots";

const workspace = {
  name: "Comtrya",
  repositories: 1,
};
</script>

<template>
  <section class="page-header">
    <div class="title-group">
      <span class="overline">Workspace</span>
      <h1>{{ workspace.name }}</h1>
    </div>
    <div class="summary-grid" aria-label="Workspace summary">
      <div>
        <span>Repositories</span>
        <strong>{{ workspace.repositories }}</strong>
      </div>
      <div>
        <span>Extensions</span>
        <strong>4</strong>
      </div>
      <div>
        <span>Live stream</span>
        <strong>Idle</strong>
      </div>
    </div>
  </section>

  <section class="work-grid">
    <SlotMount
      v-for="slot in workspaceHomeSlots"
      :key="slot.name"
      :name="slot.name"
      :label="slot.label"
      smoke-prefix="workspace-home-slot"
    />
  </section>
</template>
