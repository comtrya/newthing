<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Icon from "./Icon.vue";
import type { IconKey } from "./icons";

interface TabItem {
  id: string;
  to: string;
  icon: IconKey;
  label: string;
  matches: (path: string) => boolean;
}

const props = withDefaults(defineProps<{ workHref?: string }>(), {
  workHref: "/x/issues/",
});

const route = useRoute();
const tabs = computed<TabItem[]>(() => [
  {
    id: "home",
    to: "/",
    icon: "spark",
    label: "Home",
    matches: (p) =>
      p === "/" ||
      (p.startsWith("/r/") &&
        !isWorkPath(p) &&
        !isActionsPath(p) &&
        !isReleasesPath(p)),
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
    label: "Actions",
    matches: isActionsPath,
  },
  {
    id: "work",
    to: props.workHref,
    icon: "issue",
    label: "Work",
    matches: isWorkPath,
  },
  {
    id: "releases",
    to: "/releases",
    icon: "tag",
    label: "Releases",
    matches: isReleasesPath,
  },
  {
    id: "admin",
    to: "/admin",
    icon: "settings",
    label: "Admin",
    matches: (p) => p.startsWith("/admin"),
  },
]);
const activeId = computed(() => {
  const match = tabs.value.find((t) => t.matches(route.path));
  return match?.id ?? "home";
});

function isWorkPath(path: string): boolean {
  return /^\/x\/(issues|pulls|epics|sprints|docs)(\/|$)/.test(path) ||
    /^\/r\/.+\/(issues|pulls|epics|sprints|docs)(\/|$)/.test(path);
}

function isActionsPath(path: string): boolean {
  return path.startsWith("/pipelines") || /^\/r\/.+\/pipelines(\/|$)/.test(path);
}

function isReleasesPath(path: string): boolean {
  return path.startsWith("/releases") || /^\/r\/.+\/releases(\/|$)/.test(path);
}
</script>

<template>
  <nav class="mobile-tab-bar" aria-label="Primary navigation">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.to"
      class="mtb-tab"
      :class="{ 'is-active': activeId === tab.id }"
    >
      <span class="mtb-icon"><Icon :name="tab.icon" /></span>
      <span class="mtb-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.mobile-tab-bar {
  position: fixed;
  bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  left: 10px;
  right: 10px;
  height: 56px;
  border-radius: 22px;
  background: var(--glass-strong);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  backdrop-filter: blur(24px) saturate(160%);
  border: 0.5px solid var(--line-2);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 12px 30px rgba(0, 0, 0, 0.35);
  display: none;
  align-items: center;
  padding: 0 6px;
  z-index: 40;
  text-decoration: none;
}

.mtb-tab {
  flex: 1;
  height: 44px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  color: var(--fg-3);
  text-decoration: none;
}

.mtb-tab.is-active {
  background: var(--accent-soft);
  color: var(--accent);
}

.mtb-icon {
  display: inline-flex;
  transform: scale(1.15);
}

.mtb-label {
  font-size: 9.5px;
  font-weight: 500;
}

@media (max-width: 640px) {
  .mobile-tab-bar {
    display: flex;
  }
}
</style>
