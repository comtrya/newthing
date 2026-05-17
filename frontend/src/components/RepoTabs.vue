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
const repoCodePath = computed(() => `${repoHomePath.value}/code`);

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
  { id: "code",     label: "Code",     to: repoCodePath.value },
  { id: "pulls",    label: "Pulls",    to: scoped("pulls") },
  { id: "issues",   label: "Issues",   to: scoped("issues") },
  { id: "checks",   label: "Checks",   to: scoped("checks") },
]);

function isActive(tab: Tab): boolean {
  // Per-repo nested routes (Overview, Code) highlight by exact path
  // match. Extension queues live outside the /r/ tree today, so they
  // don't highlight on those /x/ pages; once they get true per-repo
  // routes the same path-match rule will apply uniformly.
  if (tab.id === "overview") return route.path === repoHomePath.value;
  if (tab.id === "code") return route.path === repoCodePath.value;
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
