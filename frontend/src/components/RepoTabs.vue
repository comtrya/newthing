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
 * Build the per-repo workbench URL for an embedded extension. The
 * `?repositoryId=<id>` query is what the embedded extension's UI
 * (IssuesList, PullsQueue, ChecksBoard, …) reads to scope its
 * listing. Carrying it on the URL means the repo workbench stays
 * mounted across deep links and reloads. When the id is still
 * loading we fall back to the bare per-repo path; the extension
 * shows its full queue rather than 404'ing.
 */
function repoExtPath(slug: string): string {
  const base = `${repoHomePath.value}/${slug}`;
  if (!props.repositoryId) return base;
  return `${base}?repositoryId=${encodeURIComponent(props.repositoryId)}`;
}

const tabs = computed<Tab[]>(() => [
  { id: "overview", label: "Overview", to: repoHomePath.value },
  { id: "code",     label: "Code",     to: repoCodePath.value },
  { id: "pulls",    label: "Pulls",    to: repoExtPath("pulls") },
  { id: "issues",   label: "Issues",   to: repoExtPath("issues") },
  { id: "checks",   label: "Checks",   to: repoExtPath("checks") },
]);

function isActive(tab: Tab): boolean {
  // Active by exact route.path match. The `?repositoryId=…` query
  // string sits on every per-repo extension URL and does not affect
  // route.path, so the highlight is stable as the user moves around.
  if (tab.id === "overview") return route.path === repoHomePath.value;
  return route.path === `${repoHomePath.value}/${tab.id}`;
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
