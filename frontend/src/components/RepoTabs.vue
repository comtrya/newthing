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
  /**
   * Extension opt-in set from `repository.extensions` in the repo's
   * `comtrya.cue`. Extension tabs (issues, pulls, epics, checks) are
   * only shown when the matching ID appears in this list.
   * `null` / `undefined` means the list hasn't loaded yet; all
   * extension tabs are hidden until the repo config is known.
   */
  enabledExtensions?: string[] | null;
  /** Counts surfaced on the matching tab labels.
   *  Zero or undefined hides the count chip. */
  openIssues?: number | null;
  openPulls?: number | null;
  failingChecks?: number | null;
}>(), {
  repositoryId: null,
  enabledExtensions: null,
  openIssues: 0,
  openPulls: 0,
  failingChecks: 0,
});

const route = useRoute();

interface Tab {
  id: string;
  label: string;
  to: string;
  count?: number;
  countTone?: "ink" | "alarm";
}

const repoPath = computed(() =>
  props.segments.map(encodeURIComponent).join("/"),
);

const repoHomePath = computed(() => `/r/${repoPath.value}`);
const repoCodePath = computed(() => `${repoHomePath.value}/code`);
const repoConfigPath = computed(() => `${repoHomePath.value}/config`);

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

/**
 * Returns true when an extension tab should be visible.
 * Hidden while the repo config is still loading (null) and hidden
 * when the repo has not opted into that extension ([] or absent).
 */
function extEnabled(id: string): boolean {
  if (props.enabledExtensions === null) return false;
  return props.enabledExtensions.includes(id);
}

const tabs = computed<Tab[]>(() => {
  const all: Tab[] = [
    { id: "overview", label: "Overview", to: repoHomePath.value },
    { id: "code", label: "Code", to: repoCodePath.value },
  ];
  if (extEnabled("issues")) {
    all.push({
      id: "issues",
      label: "Issues",
      to: repoExtPath("issues"),
      count: props.openIssues ?? 0,
    });
  }
  if (extEnabled("pulls")) {
    all.push({
      id: "pulls",
      label: "Pulls",
      to: repoExtPath("pulls"),
      count: props.openPulls ?? 0,
    });
  }
  if (extEnabled("epics")) {
    all.push({ id: "epics", label: "Epics", to: repoExtPath("epics") });
  }
  if (extEnabled("checks")) {
    all.push({
      id: "checks",
      label: "Checks",
      to: repoExtPath("checks"),
      count: props.failingChecks ?? 0,
      countTone: "alarm",
    });
  }
  all.push({ id: "config", label: "Config", to: repoConfigPath.value });
  return all;
});

function isActive(tab: Tab): boolean {
  // Highlight on prefix match so that workbench deep links (e.g.
  // `/r/:path/issues/<ws>/<num>`) keep the Issues tab active.
  // Overview only highlights on the exact repo home path because
  // every per-extension URL nests under the same base.
  if (tab.id === "overview") return route.path === repoHomePath.value;
  const prefix = `${repoHomePath.value}/${tab.id}`;
  // Config is a leaf; use exact match so we don't accidentally
  // collide with future `/config/<sub>` routes if they appear.
  if (tab.id === "config") return route.path === prefix;
  return route.path === prefix || route.path.startsWith(`${prefix}/`);
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
      <span class="repo-tab-label">{{ tab.label }}</span>
      <span
        v-if="(tab.count ?? 0) > 0"
        :class="['repo-tab-count', `tone-${tab.countTone ?? 'ink'}`]"
      >{{ tab.count }}</span>
    </RouterLink>
  </nav>
</template>
