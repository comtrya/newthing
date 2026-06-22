<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Icon from "./Icon.vue";
import {
  activeRailIdForPath,
  footerRailItems,
  primaryRailItems,
} from "./side-rail";

const route = useRoute();
const activeId = computed(() => activeRailIdForPath(route.path));
</script>

<template>
  <aside class="side-rail hairline-r" aria-label="Primary navigation">
    <RouterLink
      v-for="item in primaryRailItems"
      :key="item.id"
      :to="item.to"
      :title="item.label"
      :aria-label="item.label"
      :aria-current="activeId === item.id ? 'page' : undefined"
      class="rail-item"
      :class="{ 'is-active': activeId === item.id }"
    >
      <Icon :name="item.icon" aria-hidden="true" />
      <span
        v-if="activeId === item.id"
        class="rail-active-indicator"
        aria-hidden="true"
      />
    </RouterLink>
    <span class="rail-spacer" />
    <RouterLink
      v-for="item in footerRailItems"
      :key="item.id"
      :to="item.to"
      :title="item.label"
      :aria-label="item.label"
      :aria-current="activeId === item.id ? 'page' : undefined"
      class="rail-item"
      :class="{ 'is-active': activeId === item.id }"
    >
      <Icon :name="item.icon" aria-hidden="true" />
      <span
        v-if="activeId === item.id"
        class="rail-active-indicator"
        aria-hidden="true"
      />
    </RouterLink>
  </aside>
</template>

<style scoped>
.side-rail {
  width: 56px;
  flex-shrink: 0;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--surface);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  min-height: 100%;
}

.rail-spacer { flex: 1; }

.rail-item {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-3);
  background: transparent;
  border: 0.5px solid transparent;
  position: relative;
  text-decoration: none;
}

.rail-item:hover {
  color: var(--fg-2);
  background: var(--surface-2);
}

.rail-item.is-active {
  color: var(--fg);
  background: var(--surface-3);
  border-color: var(--line-2);
}

.rail-active-indicator {
  position: absolute;
  left: -10px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: 999px;
  background: var(--accent);
}

@media (max-width: 640px) {
  .side-rail { display: none; }
}
</style>
