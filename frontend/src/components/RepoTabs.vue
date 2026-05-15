<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

/**
 * Repo-scope navigation strip. Mounted on RepoHome below the
 * chip row + clone command. Surfaces the five sub-surfaces a
 * repo has — Overview (the current page), Code (in-page anchor
 * to the code-browser slot), Pulls / Issues / Checks (links to
 * the workspace-wide queues filtered by `repositoryId`).
 *
 * Editorial aesthetic per LOOP_TODO: bottom-border underline on
 * the active tab, no background pill, mono labels. The active
 * indicator follows `route.path` — Overview lights up on
 * `/r/<segments>`, other tabs are pure navigation today.
 *
 * Seeds the future Workbench layout (LOOP_TODO macro):
 * once the queues become nested routes (`/r/<repo>/issues`),
 * RepoTabs becomes the persistent top-of-pane strip and the
 * active highlight stays correct via the same route.path check.
 */

const props = withDefaults(defineProps<{
  /** Repo path segments — e.g. `["comtrya", "dogfood"]`. */
  segments: string[];
  /** Resolved repository ULID used to scope queue links. */
  repositoryId?: string | null;
}>(), {
  repositoryId: null,
});

const route = useRoute();

interface Tab {
  id: string;
  label: string;
  to: string;
}

const repoPath = computed(() =>
  props.segments.map(encodeURIComponent).join("/"),
);

const repoHomePath = computed(() => `/r/${repoPath.value}`);

/**
 * Append `?repositoryId=<id>` when known. The extension queues
 * (IssuesList iter 33+, PullsQueue iter 36+) read this from the
 * URL params and scope their listing to the repo. When the id is
 * still loading we fall back to the unscoped queue so the link
 * never breaks.
 */
function scoped(prefix: string): string {
  const base = `/x/${prefix}/`;
  if (!props.repositoryId) return base;
  return `${base}?repositoryId=${encodeURIComponent(props.repositoryId)}`;
}

const tabs = computed<Tab[]>(() => [
  { id: "overview", label: "Overview", to: repoHomePath.value },
  { id: "code",     label: "Code",     to: `${repoHomePath.value}#code` },
  { id: "pulls",    label: "Pulls",    to: scoped("pulls") },
  { id: "issues",   label: "Issues",   to: scoped("issues") },
  { id: "checks",   label: "Checks",   to: scoped("checks") },
]);

function isActive(tab: Tab): boolean {
  // Overview is the canonical "you are on the repo home" tab,
  // active any time `route.path` exactly matches the repo home
  // (the trailing `#code` hash doesn't affect path). Other tabs
  // only highlight if the route is literally on that extension
  // AND the `?repositoryId=` matches — for now we keep it
  // straightforward and only highlight Overview.
  if (tab.id === "overview") return route.path === repoHomePath.value;
  return false;
}
</script>

<template>
  <nav
    class="repo-tabs"
    role="tablist"
    aria-label="Repository sub-surfaces"
    data-smoke="repo-tabs"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.to"
      class="repo-tab"
      :class="{ active: isActive(tab) }"
      :aria-selected="isActive(tab)"
      role="tab"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
