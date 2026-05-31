<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed } from "vue";
import Icon from "./Icon.vue";

const route = useRoute();

const tabs = [
  { id: "git-tokens", label: "Personal access tokens", to: "/account/git-tokens", icon: "token" },
  { id: "ssh-keys", label: "SSH keys", to: "/account/ssh-keys", icon: "key" },
];

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(to + "/");
}
</script>

<template>
  <nav
    class="account-nav"
    aria-label="Account sub-surfaces"
    data-smoke="account-nav"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.to"
      class="account-nav-item"
      :class="{ active: isActive(tab.to) }"
      :aria-current="isActive(tab.to) ? 'page' : undefined"
    >
      <span class="account-nav-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.account-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--hairline);
  padding-bottom: 0;
}

.account-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.1s, border-color 0.1s;
}

.account-nav-item:hover {
  color: var(--text);
}

.account-nav-item.active {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.account-nav-label {
  font-family: var(--font-mono);
}
</style>
