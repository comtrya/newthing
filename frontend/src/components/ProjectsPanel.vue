<script setup lang="ts">
/**
 * Kernel-discovered Projects for the current repository.
 *
 * Reads `workspace.repositoryByPath(...).comtryaConfig.projects` (populated by the
 * `cuengine`-backed evaluator) and renders one card per Project with
 * its root path, labels, owners, and every per-extension config slice
 * (`pulls`, `issues`, `docs`, `builds`, `agents`, etc.). The kernel
 * doesn't know what these fields mean — extensions register them via
 * `contributes.cueSchemas` — but the panel surfaces them generically.
 */

import { computed, onMounted, ref, watch } from "vue";
import { getGraphQLClient } from "@comtrya/sdk-core";
import { useProjectCounts } from "@comtrya/sdk-vue";
import { projectHref, projectWorkHref } from "../route-paths";

/**
 * Typed reference emitted by the kernel's `#ComtryaRef` family.
 * Every owner / author / assignee carries both a `slug` (compact
 * identifier the user typed in CUE) and a derived `ref` (canonical
 * `comtrya://` URN the forge links against).
 */
interface ComtryaRef {
  /** Canonical `comtrya://` URN, derived by CUE from kind + slug. */
  ref: string;
  /** Compact identifier the user typed in CUE. */
  slug: string;
  /** Discriminator: "user" | "agent" | "bot" | "credential" | "team". */
  kind?: string;
}

interface ComtryaProject {
  name?: string;
  root?: string;
  labels?: string[];
  owners?: ComtryaRef[];
  declaredAt?: string;
  implicit?: boolean;
  [key: string]: unknown;
}

interface ComtryaConfig {
  projects?: ComtryaProject[];
  instances?: unknown[];
  error?: string | null;
  note?: string | null;
}

interface RepositoryFile {
  path?: string;
  kind?: string;
}

interface ResolvedRepository {
  comtryaConfig?: ComtryaConfig | null;
  files?: RepositoryFile[];
}

interface RepositoryPayload {
  workspace?: {
    repositoryByPath?: ResolvedRepository | null;
  };
}

const props = defineProps<{
  repositoryPath?: string;
  segments?: string[];
  workspaceId?: string | null;
  repositoryId?: string | null;
}>();

const loadState = ref<"loading" | "ready" | "error">("loading");
const config = ref<ComtryaConfig | null>(null);
const repoFiles = ref<RepositoryFile[]>([]);
const loadError = ref<string | null>(null);

const projects = computed<ComtryaProject[]>(() => config.value?.projects ?? []);
const instanceCount = computed(() => config.value?.instances?.length ?? 0);
const projectCountLabels = {
  openIssues: "open issues",
  epicsInProgress: "in-progress epics",
  closedIssues: "closed issues",
} as const;

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

function projectSummaryLabel(projectCount: number, sourceCount: number, implicit: boolean): string {
  if (implicit) return "1 default project";
  const projectWord = plural(projectCount, "project");
  const sourceWord = plural(sourceCount, "config source");
  return `${projectCount} ${projectWord} from ${sourceCount} ${sourceWord}`;
}

function humanizeKeyLabel(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (words.length === 0) return key;
  return words
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function normalizedProjectRoot(root: string | null | undefined): string {
  return root?.trim().replace(/\/+$/, "") ?? "";
}

function projectRootLabel(root: string | null | undefined): string {
  const normalized = normalizedProjectRoot(root);
  return normalized ? `${normalized}/` : "Repository root";
}

function projectRootTitle(root: string | null | undefined): string {
  const normalized = normalizedProjectRoot(root);
  return normalized ? `${normalized}/` : "<repo root>";
}

const projectsSummaryLabel = computed(() => {
  if (loadState.value === "loading") return "discovering...";
  if (loadState.value === "error") return "unavailable";
  return projectSummaryLabel(
    projects.value.length,
    instanceCount.value,
    projects.value.length === 1 && projects.value[0]?.implicit === true,
  );
});
const reservedKeys = new Set([
  "name",
  "root",
  "labels",
  "owners",
  "declaredAt",
  "implicit",
]);

// iter 76 — per-project work counts routed through the shared
// `@comtrya/sdk-vue::useProjectCounts` composable. The composable
// fetches both lists in parallel on mount, buckets by
// `projectName`, and subscribes to the seven SSE topics that
// mutate project-tagged work. WorkspaceHome (iter 65) uses the
// same composable so both surfaces share one fetch implementation.
const { countsFor } = useProjectCounts();

function projectFilterHref(
  surface: "issues" | "epics",
  name: string,
  state?: string,
): string {
  return projectWorkHref({
    surface,
    projectName: name,
    state,
    repoSegments: props.segments,
    workspaceId: props.workspaceId,
    repositoryId: props.repositoryId,
  });
}

onMounted(() => void load());
watch(() => props.repositoryPath, () => void load());

async function load(): Promise<void> {
  loadState.value = "loading";
  loadError.value = null;
  try {
    const segments = props.segments ?? [];
    if (segments.length === 0) {
      config.value = null;
      repoFiles.value = [];
      loadState.value = "ready";
      return;
    }
    const data = await getGraphQLClient().query<RepositoryPayload>(
      `query Q($segments: [String!]!) {
        workspace { repositoryByPath(segments: $segments) { comtryaConfig files { path kind } } }
      }`,
      { segments },
    );
    const resolved = data.workspace?.repositoryByPath ?? null;
    config.value = resolved?.comtryaConfig ?? null;
    repoFiles.value = resolved?.files ?? [];
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    loadError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

interface DocSurface {
  key: string;
  label: string;
  scopePath: string;
  files: string[];
}

function joinPath(root: string, sub: string): string {
  const a = (root ?? "").trim().replace(/\/+$/g, "").replace(/^\.\/?/, "");
  const b = (sub ?? "").trim().replace(/^\/+/g, "").replace(/^\.\//, "");
  if (!a) return b;
  if (!b || b === ".") return a;
  return `${a}/${b}`;
}

function projectDocs(project: ComtryaProject): DocSurface[] {
  const docs = project.docs;
  if (!docs || typeof docs !== "object" || Array.isArray(docs)) return [];
  const root = (project.root ?? "").replace(/\/+$/g, "");
  return Object.entries(docs as Record<string, unknown>).map(([key, raw]) => {
    const entry = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const subPath = typeof entry.path === "string" ? entry.path : "";
    const label = typeof entry.label === "string" ? entry.label : key;
    const scopePath = joinPath(root, subPath).replace(/\/+$/g, "");
    const prefix = scopePath ? `${scopePath}/` : "";
    const files = repoFiles.value
      .filter((file) => {
        if (!file.path) return false;
        if (!file.path.endsWith(".mdx") && !file.path.endsWith(".md")) return false;
        return prefix ? file.path.startsWith(prefix) : true;
      })
      .map((file) => file.path!)
      .sort();
    return { key, label, scopePath, files };
  });
}

function projectClaims(project: ComtryaProject): Array<{ key: string; value: unknown }> {
  return Object.entries(project)
    .filter(([key]) => !reservedKeys.has(key))
    .map(([key, value]) => ({ key, value }));
}

function summariseValue(value: unknown): string {
  if (value === null || value === undefined) return "·";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(summariseValue).join(" · ");
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return entries
      .map(([k, v]) => `${k}: ${summariseValue(v)}`)
      .join(" · ");
  }
  return String(value);
}

function ownerLabel(owner: ComtryaRef): string {
  return owner.slug;
}

/**
 * Map the URN scheme to the author-classifier kinds used elsewhere
 * in the UI (`human` / `agent` / `credential` / `bot` / `team`).
 * Drives the chip's data-author-kind attribute.
 */
function authorKindOfOwner(owner: ComtryaRef): string {
  const scheme = owner.ref?.match(/^comtrya:\/\/([a-z][a-z0-9_-]*)\//)?.[1];
  switch (scheme) {
    case "user": return "human";
    case "agent": return "agent";
    case "bot": return "bot";
    case "credential": return "credential";
    case "team": return "team";
    default: return "unknown";
  }
}
</script>

<template>
  <section class="projects-panel" data-smoke="projects-panel">
    <header class="projects-head">
      <div class="title-block">
        <h2>Projects</h2>
        <span class="muted">
          {{ projectsSummaryLabel }}
        </span>
      </div>
    </header>

    <p v-if="loadState === 'error'" class="muted error" role="alert">{{ loadError }}</p>
    <p v-else-if="config?.error" class="muted error" role="alert">{{ config.error }}</p>
    <p v-else-if="config?.note" class="muted">{{ config.note }}</p>

    <ol v-if="projects.length > 0" class="projects-list">
      <li v-for="project in projects" :key="project.name" class="project-card">
        <header class="project-card-head">
          <div class="project-identity">
            <h3>
              <RouterLink
                v-if="props.segments && project.name"
                :to="projectHref(props.segments, project.name)"
              >
                {{ project.name }}
              </RouterLink>
              <template v-else>{{ project.name }}</template>
            </h3>
            <span class="project-root" :title="projectRootTitle(project.root)">
              {{ projectRootLabel(project.root) }}
            </span>
            <span v-if="project.implicit" class="implicit-badge">implicit</span>
          </div>
          <div class="project-meta">
            <span v-if="project.labels?.length" class="labels">
              <span v-for="label in project.labels" :key="label" class="label" :title="label">
                {{ humanizeKeyLabel(label) }}
              </span>
            </span>
            <span v-if="project.owners?.length" class="owners">
              <span class="owners-prefix">owners</span>
              <span
                v-for="owner in project.owners"
                :key="owner.ref"
                class="owner"
                :data-author-kind="authorKindOfOwner(owner)"
                :title="owner.ref"
              >
                {{ ownerLabel(owner) }}
              </span>
            </span>
          </div>
          <div
            v-if="project.name"
            class="project-counts"
            data-smoke="project-counts"
            aria-label="Project work counts"
          >
            <RouterLink
              :to="projectFilterHref('issues', project.name)"
              class="project-count"
              :data-zero="countsFor(project.name).openIssues === 0"
              :title="`Open issues in ${project.name}`"
            >
              <span class="count-num">{{ countsFor(project.name).openIssues }}</span>
              <span class="count-label">{{ projectCountLabels.openIssues }}</span>
            </RouterLink>
            <RouterLink
              :to="projectFilterHref('epics', project.name, 'IN_PROGRESS')"
              class="project-count"
              :data-zero="countsFor(project.name).epicsInProgress === 0"
              :title="`In-progress epics in ${project.name}`"
            >
              <span class="count-num">{{ countsFor(project.name).epicsInProgress }}</span>
              <span class="count-label">{{ projectCountLabels.epicsInProgress }}</span>
            </RouterLink>
            <RouterLink
              :to="projectFilterHref('issues', project.name, 'CLOSED')"
              class="project-count muted"
              :data-zero="countsFor(project.name).closedIssues === 0"
              :title="`Closed issues in ${project.name}`"
            >
              <span class="count-num">{{ countsFor(project.name).closedIssues }}</span>
              <span class="count-label">{{ projectCountLabels.closedIssues }}</span>
            </RouterLink>
          </div>
        </header>

        <!-- Docs are owned by ext_docs and rendered in its own widget;
             ProjectsPanel only surfaces non-doc claims here. -->
        <div v-if="projectClaims(project).filter(c => c.key !== 'docs').length > 0" class="project-claims">
          <article
            v-for="claim in projectClaims(project).filter(c => c.key !== 'docs')"
            :key="claim.key"
            class="claim"
          >
            <header>
              <span class="claim-key" :title="claim.key">{{ humanizeKeyLabel(claim.key) }}</span>
            </header>
            <ul v-if="claim.value && typeof claim.value === 'object' && !Array.isArray(claim.value)" class="claim-fields">
              <li
                v-for="(fieldValue, fieldKey) in (claim.value as Record<string, unknown>)"
                :key="fieldKey"
              >
                <code class="field-key">{{ fieldKey }}</code>
                <span class="field-value">{{ summariseValue(fieldValue) }}</span>
              </li>
            </ul>
            <p v-else class="claim-scalar">{{ summariseValue(claim.value) }}</p>
          </article>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.projects-panel {
  display: grid;
  gap: 14px;
  font-family: var(--font-sans);
}

.projects-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 0.5px solid var(--line);
  padding-bottom: 6px;
}

.title-block {
  display: inline-flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}

.projects-panel h2 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 22px;
  line-height: 1;
}

.muted {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: var(--fg-3);
}

.muted code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-2);
  background: var(--bg-2);
  padding: 0 4px;
}

.muted.error {
  color: var(--err);
}

.projects-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
}

.project-card {
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-md);
  background: var(--surface);
  display: grid;
  overflow: hidden;
}

.project-card-head {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-2);
}

.project-identity {
  display: inline-flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.project-identity h3 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 18px;
  line-height: 1;
}

.project-root {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-3);
}

.implicit-badge {
  border: 0.5px solid var(--fg-3);
  border-radius: var(--r-xs);
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
}

.labels {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.label {
  border: 1px solid currentColor;
  border-radius: 999px;
  padding: 1px 7px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 18px;
  text-transform: none;
}

.owners {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.owners-prefix {
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.owner {
  color: var(--fg-2);
}

/* iter 75 — per-project work counts on RepoHome's
 * ProjectsPanel. Mirror of iter 65 (workspace Projects panel)
 * for the per-repo card view. Editorial chip aesthetic: count
 * in display weight + mono lowercase label, bottom-border
 * underline on hover, zero-count dim. */
.project-counts {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 2px;
}

.project-count {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  color: inherit;
  text-decoration: none;
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0;
  border-bottom: 1px solid transparent;
  transition: border-color 80ms ease;
}

.project-count:hover {
  border-bottom-color: var(--fg);
}

.project-count .count-num {
  font-family: var(--font-sans);
  font-weight: 650;
  font-size: 14px;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.project-count[data-zero="true"] .count-num,
.project-count.muted .count-num {
  color: var(--fg-4);
  font-weight: 500;
}

.project-count .count-label {
  color: var(--fg-3);
  text-transform: lowercase;
}

.project-claims {
  display: grid;
  gap: 0;
}

.claim {
  border-bottom: 1px solid var(--line);
  padding: 10px 14px;
}

.claim:last-child {
  border-bottom: 0;
}

.claim header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.claim-key {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  color: var(--fg);
}

.claim-source {
  font-size: 10px;
}

.claim-fields {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.claim-fields li {
  display: grid;
  grid-template-columns: minmax(120px, 0.3fr) minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: 12px;
}

.field-key {
  color: var(--fg-3);
}

.field-value {
  color: var(--fg-2);
  overflow-wrap: anywhere;
}

.claim-scalar {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--fg-2);
}

.no-claims {
  padding: 10px 14px;
}

.project-docs {
  display: grid;
  border-bottom: 1px solid var(--line);
}

.project-docs:last-child {
  border-bottom: 0;
}

.docs-surface {
  border-bottom: 1px solid var(--line);
  padding: 10px 14px;
}

.docs-surface:last-child {
  border-bottom: 0;
}

.docs-surface-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 6px;
}

.docs-surface-key {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--info);
}

.docs-surface-label {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
}

.docs-surface-scope {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-2);
  background: var(--bg-2);
  padding: 0 5px;
}

.docs-surface-count {
  margin-left: auto;
}

.docs-files {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
}

.docs-files li {
  font-family: var(--font-mono);
  font-size: 12px;
}

.docs-file-path {
  color: var(--fg-2);
}
</style>
