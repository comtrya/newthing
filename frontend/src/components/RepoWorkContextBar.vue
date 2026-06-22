<script setup lang="ts">
import { computed } from "vue";
import type {
  RepoWorkContextLink,
  RepoWorkContextLinkId,
  RepoWorkContextSurface,
} from "../repo-work-context";
import { buildRepoWorkContextLinks } from "../repo-work-context";
import Icon from "./Icon.vue";
import type { IconKey } from "./icons";

const props = withDefaults(defineProps<{
  repoSegments: string[];
  repositoryPath: string;
  projectName?: string | null;
  workspaceId?: string | null;
  repositoryId?: string | null;
  activeSurface?: RepoWorkContextSurface | null;
  activeBoard?: string | null;
}>(), {
  projectName: null,
  workspaceId: null,
  repositoryId: null,
  activeSurface: null,
  activeBoard: null,
});

const projectNameLabel = computed(() => props.projectName?.trim() ?? "");
const context = computed(() => {
  if (!projectNameLabel.value) return null;
  return buildRepoWorkContextLinks({
    repoSegments: props.repoSegments,
    projectName: projectNameLabel.value,
    workspaceId: props.workspaceId,
    repositoryId: props.repositoryId,
    activeSurface: props.activeSurface,
    activeBoard: props.activeBoard,
  });
});
const projectHref = computed(() => context.value?.projectHref ?? "#");
const viewLinks = computed(() =>
  context.value?.links.filter((link) => link.kind === "view") ?? [],
);
const createLinks = computed(() =>
  context.value?.links.filter((link) => link.kind === "create") ?? [],
);
const ariaLabel = computed(() =>
  `Project work navigation for ${projectNameLabel.value}`,
);

const linkIcons: Record<RepoWorkContextLinkId, IconKey> = {
  issues: "issue",
  epics: "tag",
  kanban: "ds",
  specs: "file",
  scenarios: "msg",
  "new-issue": "plus",
  "new-epic": "plus",
};

function iconFor(link: RepoWorkContextLink): IconKey {
  return linkIcons[link.id];
}
</script>

<template>
  <section
    v-if="context"
    class="repo-work-context"
    data-smoke="repo-work-context-bar"
    :aria-label="ariaLabel"
  >
    <RouterLink
      class="repo-work-context-scope"
      :to="projectHref"
      :title="`Open ${projectNameLabel} Project home`"
    >
      <Icon name="folder" aria-hidden="true" />
      <span class="scope-repo">{{ repositoryPath }}</span>
      <span aria-hidden="true" class="scope-separator">/</span>
      <strong>{{ projectNameLabel }}</strong>
    </RouterLink>

    <nav class="repo-work-context-links" aria-label="Project work surfaces">
      <RouterLink
        v-for="link in viewLinks"
        :key="link.id"
        :to="link.href"
        :class="['repo-work-context-link', { active: link.active }]"
        :aria-current="link.active ? 'page' : undefined"
      >
        <Icon :name="iconFor(link)" aria-hidden="true" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </nav>

    <nav class="repo-work-context-actions" aria-label="Create project work">
      <RouterLink
        v-for="link in createLinks"
        :key="link.id"
        :to="link.href"
        class="repo-work-context-action"
      >
        <Icon :name="iconFor(link)" aria-hidden="true" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </nav>
  </section>
</template>

<style scoped>
.repo-work-context {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 10px 12px;
  margin-bottom: 16px;
  border: 0.5px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--surface);
}

.repo-work-context-scope,
.repo-work-context-link,
.repo-work-context-action {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  text-decoration: none;
  letter-spacing: 0;
}

.repo-work-context-scope {
  flex: 1 1 220px;
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: 12px;
}

.repo-work-context-scope .icon {
  flex: 0 0 auto;
  color: var(--accent);
}

.scope-repo {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--fg-3);
}

.scope-separator {
  color: var(--fg-4);
}

.repo-work-context-scope strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--fg);
  font-weight: 650;
}

.repo-work-context-links,
.repo-work-context-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.repo-work-context-links {
  flex: 2 1 420px;
}

.repo-work-context-actions {
  flex: 0 1 auto;
  justify-content: flex-end;
}

.repo-work-context-link,
.repo-work-context-action {
  flex: 0 0 auto;
  padding: 0 9px;
  border: 0.5px solid transparent;
  border-radius: var(--r-xs);
  color: var(--fg-3);
  font-family: var(--font-sans);
  font-size: 12px;
}

.repo-work-context-link:hover,
.repo-work-context-action:hover {
  color: var(--fg);
  background: var(--surface-2);
  border-color: var(--line-2);
}

.repo-work-context-link.active {
  color: var(--fg);
  background: var(--accent-soft);
  border-color: var(--accent-line);
}

.repo-work-context-action {
  color: var(--fg-2);
  background: var(--surface-2);
  border-color: var(--line);
}

@media (max-width: 720px) {
  .repo-work-context {
    align-items: stretch;
  }

  .repo-work-context-scope,
  .repo-work-context-links,
  .repo-work-context-actions {
    flex: 1 1 100%;
  }

  .repo-work-context-actions {
    justify-content: flex-start;
  }
}
</style>
