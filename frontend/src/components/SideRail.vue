<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Icon from "./Icon.vue";
import type { IconKey } from "./icons";

interface RailItem {
  id: string;
  to: string;
  icon: IconKey;
  label: string;
  matches: (path: string) => boolean;
}

const items: RailItem[] = [
  {
    id: "home",
    to: "/",
    icon: "spark",
    label: "Home",
    matches: (p) => p === "/",
  },
  {
    id: "repos",
    to: "/repos",
    icon: "folder",
    label: "Repositories",
    matches: (p) => p.startsWith("/repos") || p.startsWith("/r/") || p === "/new",
  },
  {
    id: "inbox",
    to: "/inbox",
    icon: "inbox",
    label: "Inbox",
    matches: (p) => p.startsWith("/inbox"),
  },
  {
    id: "pipelines",
    to: "/pipelines",
    icon: "bolt",
    label: "Pipelines",
    matches: (p) => p.startsWith("/pipelines"),
  },
  {
    id: "releases",
    to: "/releases",
    icon: "tag",
    label: "Releases",
    matches: (p) => p.startsWith("/releases"),
  },
];

const footerItems: RailItem[] = [
  {
    id: "admin",
    to: "/admin",
    icon: "lock",
    label: "Site admin",
    matches: (p) => p.startsWith("/admin"),
  },
  {
    id: "account",
    to: "/account/git-tokens",
    icon: "user",
    label: "Account",
    matches: (p) => p.startsWith("/account"),
  },
  {
    id: "settings",
    to: "/settings",
    icon: "settings",
    label: "Settings",
    matches: (p) => p.startsWith("/settings") || p.startsWith("/instance") || p.startsWith("/health"),
  },
];

const route = useRoute();
const activeId = computed(() => {
  const all = [...items, ...footerItems];
  return all.find((i) => i.matches(route.path))?.id ?? "home";
});
</script>

<template>
  <aside class="side-rail hairline-r" aria-label="Primary navigation">
    <RouterLink
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      :title="item.label"
      class="rail-item"
      :class="{ 'is-active': activeId === item.id }"
    >
      <Icon :name="item.icon" />
      <span
        v-if="activeId === item.id"
        class="rail-active-indicator"
        aria-hidden="true"
      />
    </RouterLink>
    <span class="rail-spacer" />
    <RouterLink
      v-for="item in footerItems"
      :key="item.id"
      :to="item.to"
      :title="item.label"
      class="rail-item"
      :class="{ 'is-active': activeId === item.id }"
    >
      <Icon :name="item.icon" />
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
