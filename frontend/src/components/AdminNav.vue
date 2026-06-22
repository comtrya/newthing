<script setup lang="ts">
/**
 * AdminNav — 200px secondary nav rendered inside the admin area.
 *
 * The outer 56px icon rail is provided by the shell; this component
 * only owns the secondary nav strip that sits between the rail and
 * the page body. Three entries (Overview, Access, Storage) have real
 * routes today and render as RouterLinks; the rest are placeholders
 * rendered as inert spans until they're wired up.
 */

import { computed } from "vue";
import { RouterLink } from "vue-router";
import Icon from "./Icon.vue";
import type { IconKey } from "./icons";

type AdminItemId =
  | "overview"
  | "users"
  | "storage"
  | "domains"
  | "runners"
  | "audit"
  | "updates"
  | "settings";

const props = defineProps<{
  active: AdminItemId;
}>();

interface Item {
  id: AdminItemId;
  icon: IconKey;
  label: string;
  to: string | null;
}

const items: readonly Item[] = [
  { id: "overview", icon: "spark", label: "Overview", to: "/admin" },
  { id: "users", icon: "lock", label: "Access", to: "/admin/access" },
  { id: "storage", icon: "ds", label: "Storage", to: "/admin/storage" },
  { id: "domains", icon: "globe", label: "Domains", to: null },
  { id: "runners", icon: "bolt", label: "Runners", to: null },
  { id: "audit", icon: "eye", label: "Audit log", to: null },
  { id: "updates", icon: "rocket", label: "Updates", to: null },
  { id: "settings", icon: "settings", label: "Settings", to: null },
];

function rowStyle(itemId: AdminItemId) {
  const isActive = itemId === props.active;
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 10px",
    borderRadius: "7px",
    marginBottom: "1px",
    background: isActive ? "var(--surface-2)" : "transparent",
    color: isActive ? "var(--fg)" : "var(--fg-2)",
    border: isActive ? "0.5px solid var(--line-2)" : "0.5px solid transparent",
    fontSize: "12.5px",
    textDecoration: "none",
    cursor: isActive ? "default" : "pointer",
  } as const;
}

function iconStyle(itemId: AdminItemId) {
  return {
    color: itemId === props.active ? "var(--accent)" : "var(--fg-3)",
    display: "inline-flex",
  } as const;
}

const navStyle = computed(
  () =>
    ({
      width: "200px",
      flexShrink: 0,
      padding: "16px 10px",
      overflowY: "auto",
      background: "var(--surface)",
    }) as const,
);
</script>

<template>
  <div class="hairline-r admin-nav" :style="navStyle">
    <div class="eyebrow" style="padding: 0 8px 10px">Site admin</div>
    <template v-for="item in items" :key="item.id">
      <RouterLink
        v-if="item.to && item.id !== props.active"
        :to="item.to"
        :style="rowStyle(item.id)"
      >
        <span :style="iconStyle(item.id)"><Icon :name="item.icon" /></span>
        <span>{{ item.label }}</span>
      </RouterLink>
      <span v-else :style="rowStyle(item.id)">
        <span :style="iconStyle(item.id)"><Icon :name="item.icon" /></span>
        <span>{{ item.label }}</span>
      </span>
    </template>
  </div>
</template>

<style scoped>
.admin-nav :deep(a) {
  text-decoration: none;
}
</style>
