<script setup lang="ts">
/**
 * Project home — one Project from a repo's `package comtrya` config.
 *
 * The route is `/r/<groups>/<repo>/p/<project>`. We fetch the repo's
 * `comtryaConfig` (kernel-evaluated by cuengine) and the file tree,
 * scope rendering to the named Project, and let `ext_docs`'s panel
 * surface this Project's docs in isolation. Per-extension claim
 * blocks (`pulls`, `issues`, `agents`, `builds`, …) render with the
 * `shape from contributes.cueSchemas` annotation.
 *
 * This page is the spine for project planning: future iterations
 * mount per-Project epic/issue/milestone surfaces inside it.
 */

import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getGraphQLClient, invokeOp, type OpResult } from "@comtrya/sdk-core";
import { LabelPill, type LabelCatalog } from "@comtrya/sdk-vue";
import { whenWorkspaceReady } from "@comtrya/sdk-core";
import ActivityStream from "../components/ActivityStream.vue";
import { setActiveLabelCatalog } from "../extension-runtime";

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
  error?: string | null;
}

interface RepositoryIdentity {
  id: string;
  name: string;
  path: string;
  groups: string[];
  description?: string | null;
  defaultBranch?: string | null;
  visibility?: string | null;
  updated?: string | null;
  comtryaConfig?: ComtryaConfig | null;
  labelCatalog?: LabelCatalog | null;
}

interface RepoPayload {
  workspace?: {
    id?: string | null;
    repositoryByPath?: RepositoryIdentity | null;
  };
}

const props = defineProps<{
  groups: string[];
  repo: string;
  project: string;
}>();

const REPO_QUERY = `query ProjectHome($segments: [String!]!) {
  workspace {
    id
    repositoryByPath(segments: $segments) {
      id name path groups description defaultBranch visibility updated
      comtryaConfig
      labelCatalog
    }
  }
}`;

const repository = ref<RepositoryIdentity | null>(null);
const workspaceId = ref<string | null>(null);
const loadState = ref<"loading" | "ready" | "missing" | "error">("loading");
const loadError = ref<string | null>(null);

const repoPath = computed(() => [...props.groups, props.repo].join("/"));
const repoSegments = computed(() => [...props.groups, props.repo]);
const projects = computed<ComtryaProject[]>(
  () => repository.value?.comtryaConfig?.projects ?? [],
);
const project = computed<ComtryaProject | null>(
  () => projects.value.find((p) => p.name === props.project) ?? null,
);
const projectExists = computed(() => project.value !== null);

onMounted(() => void load());
watch(() => [repoSegments.value, props.project], () => void load());

async function load(): Promise<void> {
  loadState.value = "loading";
  loadError.value = null;
  try {
    const data = await getGraphQLClient().query<RepoPayload>(REPO_QUERY, {
      segments: repoSegments.value,
    });
    workspaceId.value = data.workspace?.id ?? null;
    repository.value = data.workspace?.repositoryByPath ?? null;
    if (!repository.value) {
      loadState.value = "missing";
      setActiveLabelCatalog(null);
      return;
    }
    setActiveLabelCatalog(
      (repository.value.labelCatalog as Record<string, unknown> | null) ?? null,
    );
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    loadError.value = caught instanceof Error ? caught.message : String(caught);
    setActiveLabelCatalog(null);
  }
}

onUnmounted(() => setActiveLabelCatalog(null));

interface IssueLite {
  id?: string;
  number?: number;
  title?: string;
  state?: string;
  projectName?: string | null;
  labels?: string[];
  updatedAt?: string | null;
}

interface EpicLite {
  id?: string;
  title?: string;
  state?: string;
  projectName?: string | null;
  labels?: string[];
  updatedAt?: string | null;
}

const MINI_LIST_LIMIT = 6;

const summary = ref<{
  issuesOpen: number;
  issuesClosed: number;
  epicsPlanned: number;
  epicsInProgress: number;
  epicsDone: number;
  docsCount: number;
  loaded: boolean;
  openIssues: IssueLite[];
  inProgressEpics: EpicLite[];
}>({
  issuesOpen: 0,
  issuesClosed: 0,
  epicsPlanned: 0,
  epicsInProgress: 0,
  epicsDone: 0,
  docsCount: 0,
  loaded: false,
  openIssues: [],
  inProgressEpics: [],
});

interface PolicyChip {
  id: string;
  label: string;
  value: string;
  tone: "info" | "warn";
}

/** Scalar (on/off, single value) policy chips rendered as plain label·value. */
const policyChips = computed<PolicyChip[]>(() => {
  const out: PolicyChip[] = [];
  if (!project.value) return out;
  const issuesPolicy = project.value.issues as Record<string, unknown> | undefined;
  if (issuesPolicy && typeof issuesPolicy === "object") {
    if (typeof issuesPolicy.closeOnMerge === "boolean") {
      out.push({
        id: "closeOnMerge",
        label: "Close on merge",
        value: issuesPolicy.closeOnMerge ? "on" : "off",
        tone: issuesPolicy.closeOnMerge ? "info" : "warn",
      });
    }
  }
  const pullsPolicy = project.value.pulls as Record<string, unknown> | undefined;
  if (pullsPolicy && typeof pullsPolicy === "object") {
    if (typeof pullsPolicy.autoMerge === "boolean") {
      out.push({
        id: "autoMerge",
        label: "Auto-merge",
        value: pullsPolicy.autoMerge ? "on" : "off",
        tone: pullsPolicy.autoMerge ? "info" : "warn",
      });
    }
    if (Array.isArray(pullsPolicy.requiredChecks) && pullsPolicy.requiredChecks.length > 0) {
      out.push({
        id: "requiredChecks",
        label: "Required checks",
        value: (pullsPolicy.requiredChecks as string[]).join(", "),
        tone: "info",
      });
    }
  }
  return out;
});

/** Project's `issues.defaultLabels` rendered as pills against the
 *  active label catalog (kind from catalog entry → exclusive vs
 *  scoped vs plain). When the catalog is missing, LabelPill falls
 *  back to the scoped-vs-plain shape inference. */
const defaultLabelPills = computed<string[]>(() => {
  const issuesPolicy = project.value?.issues as Record<string, unknown> | undefined;
  if (!issuesPolicy || typeof issuesPolicy !== "object") return [];
  const labels = issuesPolicy.defaultLabels;
  return Array.isArray(labels) ? labels.filter((l): l is string => typeof l === "string") : [];
});

const labelCatalog = computed<LabelCatalog | null>(
  () =>
    (repository.value?.labelCatalog as Record<string, unknown> | null) as LabelCatalog | null,
);

const docsByType = computed<Array<{ key: string; label: string; count: number }>>(() => {
  const docs = (project.value?.docs ?? {}) as Record<string, { slug?: string; label?: string }>;
  return Object.entries(docs).map(([key, type]) => ({
    key,
    label: type?.label ?? key,
    count: docsCountForType(type?.slug ?? ""),
  }));
});

function docsCountForType(slug: string): number {
  // We count via repository.blobs in DocsPanel; for the summary header
  // it's enough to surface declared types. Real per-type counts come
  // from ext_docs's own listing; the summary just says "N types".
  return slug ? 1 : 0;
}

async function loadSummary(): Promise<void> {
  if (!project.value) return;
  const proj = project.value.name;
  if (!proj) return;
  // Sourced from the shell-wide store published by
  // `App.vue::loadShellSummary`; the local `workspaceId` ref filled
  // by `load()` is a per-repo signal, not always populated by the
  // time `loadSummary` fires (`immediate: true` watch).
  const id = await whenWorkspaceReady();
  const workspaceUri = `comtrya://workspace/${id}`;
  // Issues
  const issuesRes = await invokeOp<IssueLite[]>(
    "ext_issues",
    "issues",
    "list-issues",
    { repository: workspaceUri, limit: 1024 },
  );
  const epicsRes = await invokeOp<EpicLite[]>(
    "ext_epics",
    "epics",
    "list-epics",
    { workspace: workspaceUri, limit: 1024 },
  );
  let issuesOpen = 0;
  let issuesClosed = 0;
  let epicsPlanned = 0;
  let epicsInProgress = 0;
  let epicsDone = 0;
  const openIssues: IssueLite[] = [];
  const inProgressEpics: EpicLite[] = [];
  if (issuesRes.ok) {
    for (const issue of issuesRes.value as IssueLite[]) {
      if (issue.projectName !== proj) continue;
      if (issue.state === "closed") {
        issuesClosed += 1;
      } else {
        issuesOpen += 1;
        openIssues.push(issue);
      }
    }
  }
  if (epicsRes.ok) {
    for (const epic of epicsRes.value as EpicLite[]) {
      if (epic.projectName !== proj) continue;
      const state = (epic.state ?? "").toUpperCase();
      if (state === "DONE" || state === "CANCELED") {
        epicsDone += 1;
      } else if (state === "IN_PROGRESS" || state === "AT_RISK") {
        epicsInProgress += 1;
        inProgressEpics.push(epic);
      } else {
        epicsPlanned += 1;
      }
    }
  }
  // Most recent first; cap to the mini-list ceiling.
  const byUpdated = <T extends { updatedAt?: string | null }>(rows: T[]): T[] =>
    [...rows]
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
      .slice(0, MINI_LIST_LIMIT);
  summary.value = {
    issuesOpen,
    issuesClosed,
    epicsPlanned,
    epicsInProgress,
    epicsDone,
    docsCount: docsByType.value.reduce((n, t) => n + (t.count || 1), 0),
    loaded: true,
    openIssues: byUpdated(openIssues),
    inProgressEpics: byUpdated(inProgressEpics),
  };
}

/** Per-row hrefs for the mini-lists — issue detail and epic detail
 *  routes inside the workbench. */
function issueDetailHref(issue: IssueLite): string {
  // `workspaceId` is the local ref populated by `load()`'s repo
  // query; under the page's render guard (loadState === "ready") it's
  // always set by the time this href is computed.
  return `/x/issues/${workspaceId.value ?? "unknown"}/${issue.number ?? 0}`;
}

function epicDetailHref(epic: EpicLite): string {
  return `/x/epics/${epic.id ?? ""}`;
}

watch(
  () => project.value?.name,
  () => void loadSummary(),
  { immediate: true },
);

/**
 * Build queue-filter URLs scoped to this Project. Each card on
 * the summary strip becomes a hyperlink to the corresponding
 * filtered queue, using the URL filter shape that iter 46
 * (IssuesList) and iter 57 (EpicsList) shipped. Centralised here
 * so the template stays declarative.
 */
const projectQueueHrefs = computed(() => {
  const name = project.value?.name;
  if (!name) {
    return {
      issuesOpen: "#",
      issuesClosed: "#",
      epicsInProgress: "#",
      epicsPlanned: "#",
      epicsDone: "#",
      newIssue: "#",
      newEpic: "#",
    };
  }
  const encoded = encodeURIComponent(name);
  return {
    // IssuesList chip default is OPEN, so this lands on the
    // "open + this-project" slice with no state= param.
    issuesOpen: `/x/issues/?project=${encoded}`,
    issuesClosed: `/x/issues/?project=${encoded}&state=CLOSED`,
    epicsInProgress: `/x/epics/?project=${encoded}&state=IN_PROGRESS`,
    epicsPlanned: `/x/epics/?project=${encoded}&state=PLANNED`,
    epicsDone: `/x/epics/?project=${encoded}&state=DONE`,
    // New-issue / new-epic routes already accept `projectName`
    // in the URL (see ext_issues/register.ts + ext_epics/
    // register.ts). The form pre-fills CUE policy from this.
    newIssue: `/x/issues/new?projectName=${encoded}`,
    newEpic: `/x/epics/new?projectName=${encoded}`,
  };
});
</script>

<template>
  <header class="project-header" data-smoke="project-home">
    <p class="overline">
      <RouterLink :to="`/r/${repoPath}`">{{ repoPath }}</RouterLink>
      · project
    </p>
    <h1>{{ props.project }}</h1>

    <nav
      v-if="projects.length > 1"
      class="project-switcher"
      role="tablist"
      aria-label="Switch project"
    >
      <RouterLink
        v-for="p in projects"
        :key="p.name"
        :to="`/r/${repoPath}/p/${p.name}`"
        :class="['project-tab', { active: p.name === props.project }]"
        :aria-selected="p.name === props.project"
        role="tab"
      >
        <span class="tab-glyph">◇</span>{{ p.name }}
      </RouterLink>
    </nav>

    <div v-if="project" class="project-chip-row" aria-label="Project at a glance">
      <span class="project-chip">
        <strong>{{ project.root || "." }}/</strong>
        <span>root</span>
      </span>
      <span
        v-for="label in (project.labels ?? [])"
        :key="`label-${label}`"
        class="project-chip tone-label"
      >
        <strong>{{ label }}</strong>
        <span>label</span>
      </span>
      <span
        v-for="owner in (project.owners ?? [])"
        :key="`owner-${owner.ref}`"
        class="project-chip tone-owner"
        :title="owner.ref"
      >
        <strong>{{ owner.slug }}</strong>
        <span>{{ owner.kind ?? 'owner' }}</span>
      </span>
    </div>
  </header>

  <section v-if="loadState !== 'ready'" class="repo-state" :data-state="loadState">
    <span v-if="loadState === 'loading'">Loading project context</span>
    <span v-else-if="loadState === 'missing'">Repository was not found</span>
    <span v-else>{{ loadError }}</span>
  </section>

  <section v-else-if="!projectExists" class="repo-state" role="alert">
    No project named <code>{{ props.project }}</code> in
    <RouterLink :to="`/r/${repoPath}`">{{ repoPath }}</RouterLink>'s
    <code>package comtrya</code> configuration.
    <template v-if="projects.length > 0">
      Available:
      <template v-for="(p, idx) in projects" :key="p.name">
        <RouterLink :to="`/r/${repoPath}/p/${p.name}`"><code>{{ p.name }}</code></RouterLink>
        <template v-if="idx < projects.length - 1"> · </template>
      </template>
    </template>
  </section>

  <template v-else>
    <section class="project-summary" data-smoke="project-summary" :aria-busy="!summary.loaded">
      <RouterLink :to="projectQueueHrefs.issuesOpen" class="stat" :title="`Open issues in ${project?.name}`">
        <span class="stat-num" :data-zero="summary.loaded && summary.issuesOpen === 0">{{ summary.loaded ? summary.issuesOpen : '—' }}</span>
        <span class="stat-label">open issue<template v-if="summary.issuesOpen !== 1">s</template></span>
      </RouterLink>
      <RouterLink :to="projectQueueHrefs.issuesClosed" class="stat" :title="`Closed issues in ${project?.name}`">
        <span class="stat-num muted">{{ summary.loaded ? summary.issuesClosed : '—' }}</span>
        <span class="stat-label">closed</span>
      </RouterLink>
      <div class="stat-sep" aria-hidden="true" />
      <RouterLink
        :to="projectQueueHrefs.epicsInProgress"
        class="stat"
        :title="`In-progress epics in ${project?.name}`"
      >
        <span class="stat-num" :data-zero="summary.loaded && summary.epicsInProgress === 0">{{ summary.loaded ? summary.epicsInProgress : '—' }}</span>
        <span class="stat-label">epic<template v-if="summary.epicsInProgress !== 1">s</template> in progress</span>
      </RouterLink>
      <RouterLink
        :to="projectQueueHrefs.epicsPlanned"
        class="stat"
        :title="`Planned epics in ${project?.name}`"
      >
        <span class="stat-num muted">{{ summary.loaded ? summary.epicsPlanned : '—' }}</span>
        <span class="stat-label">planned</span>
      </RouterLink>
      <RouterLink
        :to="projectQueueHrefs.epicsDone"
        class="stat"
        :title="`Done epics in ${project?.name}`"
      >
        <span class="stat-num muted">{{ summary.loaded ? summary.epicsDone : '—' }}</span>
        <span class="stat-label">done</span>
      </RouterLink>
      <div class="stat-sep" aria-hidden="true" />
      <div class="stat stat-static">
        <span class="stat-num">{{ summary.loaded ? docsByType.length : '—' }}</span>
        <span class="stat-label">doc type<template v-if="docsByType.length !== 1">s</template></span>
      </div>
    </section>

    <section class="project-quick-actions" data-smoke="project-quick-actions" aria-label="Quick actions">
      <RouterLink
        :to="projectQueueHrefs.newIssue"
        class="quick-action"
        :title="`Open a new issue scoped to ${project?.name}`"
      >+ new issue</RouterLink>
      <RouterLink
        :to="projectQueueHrefs.newEpic"
        class="quick-action"
        :title="`Open a new epic scoped to ${project?.name}`"
      >+ new epic</RouterLink>
    </section>

    <section
      v-if="policyChips.length > 0 || defaultLabelPills.length > 0"
      class="project-policy"
      data-smoke="project-policy"
    >
      <span class="policy-prefix">Policy</span>
      <span
        v-for="chip in policyChips"
        :key="chip.id"
        :class="['policy-chip', `tone-${chip.tone}`]"
        :title="`From package comtrya · ${project?.declaredAt || 'repo root'}/comtrya.cue`"
      >
        <span class="policy-key">{{ chip.label }}</span>
        <span class="policy-sep">·</span>
        <span class="policy-value">{{ chip.value }}</span>
      </span>
      <template v-if="defaultLabelPills.length > 0">
        <span class="policy-chip tone-info policy-chip-labels">
          <span class="policy-key">Default labels</span>
          <span class="policy-sep">·</span>
          <LabelPill
            v-for="label in defaultLabelPills"
            :key="label"
            :name="label"
            :catalog="labelCatalog"
          />
        </span>
      </template>
    </section>

    <section
      v-if="summary.openIssues.length > 0 || summary.inProgressEpics.length > 0"
      class="project-work"
      data-smoke="project-work"
    >
      <article
        v-if="summary.openIssues.length > 0"
        class="project-work-panel"
        data-smoke="project-work-issues"
      >
        <header>
          <h3>Open issues</h3>
          <RouterLink :to="projectQueueHrefs.issuesOpen" class="see-all">see all ›</RouterLink>
        </header>
        <ul>
          <li v-for="issue in summary.openIssues" :key="issue.id">
            <RouterLink :to="issueDetailHref(issue)" class="project-work-row">
              <span class="number">#{{ issue.number }}</span>
              <span class="title">{{ issue.title || "(untitled)" }}</span>
              <span v-if="issue.labels && issue.labels.length > 0" class="labels">
                <LabelPill
                  v-for="label in issue.labels"
                  :key="label"
                  :name="label"
                  :catalog="labelCatalog"
                />
              </span>
            </RouterLink>
          </li>
        </ul>
      </article>
      <article
        v-if="summary.inProgressEpics.length > 0"
        class="project-work-panel"
        data-smoke="project-work-epics"
      >
        <header>
          <h3>In-progress epics</h3>
          <RouterLink :to="projectQueueHrefs.epicsInProgress" class="see-all">see all ›</RouterLink>
        </header>
        <ul>
          <li v-for="epic in summary.inProgressEpics" :key="epic.id">
            <RouterLink :to="epicDetailHref(epic)" class="project-work-row">
              <span class="title">{{ epic.title || "(untitled)" }}</span>
              <span v-if="epic.labels && epic.labels.length > 0" class="labels">
                <LabelPill
                  v-for="label in epic.labels"
                  :key="label"
                  :name="label"
                  :catalog="labelCatalog"
                />
              </span>
            </RouterLink>
          </li>
        </ul>
      </article>
    </section>

    <section class="project-activity" data-smoke="project-activity">
      <ActivityStream :project-name="props.project" />
    </section>
  </template>
</template>

<style scoped>
.project-header {
  display: grid;
  gap: 10px;
  border-bottom: 0.5px solid var(--line);
  padding-bottom: 18px;
}

.project-header .overline {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-3);
}

.project-header .overline a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}

.project-header h1 {
  font-family: var(--font-serif);
  font-size: 56px;
  font-weight: 400;
  font-style: italic;
  line-height: 0.95;
  letter-spacing: 0;
  margin: 0;
}

.project-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 10px;
}

.project-tab {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 10px;
  border: 0.5px solid var(--line);
  border-radius: var(--r-xs);
  background: var(--bg);
  color: var(--fg-2);
  font-family: var(--font-mono);
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  letter-spacing: 0.02em;
}

.project-tab:hover {
  background: var(--bg-2);
  color: var(--fg);
}

.project-tab.active {
  background: var(--fg);
  color: var(--bg);
  border-color: var(--fg);
}

.project-tab.active .tab-glyph {
  color: inherit;
}

.tab-glyph {
  color: var(--fg-3);
  font-size: 10px;
}

.project-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.project-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-xs);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 14px;
  letter-spacing: 0.02em;
}

.project-chip strong {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 13px;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.project-chip span {
  color: var(--fg-3);
  text-transform: lowercase;
}

.project-chip.tone-label strong {
  color: var(--ok);
}

.project-chip.tone-owner {
  cursor: help;
}

.project-chip.tone-owner strong {
  color: var(--info);
}

.project-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 28px;
  padding: 20px 0 16px;
  border-bottom: 1px solid var(--line);
}

.stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 80ms ease;
}

/* Hover affordance on navigable stats. The doc-count stat is
 * static (no filter URL yet); `.stat-static` opts it out. */
a.stat:hover {
  border-bottom-color: var(--fg);
}

a.stat:hover .stat-label {
  color: var(--fg);
}

.stat-static {
  cursor: default;
}

.stat-num {
  font-family: var(--font-sans);
  font-size: 26px;
  line-height: 1;
  font-weight: 650;
  color: var(--fg);
  font-variant-numeric: tabular-nums;
}

.stat-num[data-zero="true"],
.stat-num.muted {
  color: var(--fg-4);
  font-weight: 500;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  color: var(--fg-3);
}

.stat-sep {
  width: 1px;
  height: 22px;
  background: var(--line);
}

/* Quick-create entrypoints — small editorial chips that
 * pre-stamp `projectName` on the new-issue / new-epic forms.
 * Sit below the navigable summary so creating work in this
 * Project is one click from the spine canvas. */
.project-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0 4px;
}

.quick-action {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-xs);
  background: var(--surface);
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: background 80ms ease, color 80ms ease;
}

.quick-action:hover {
  background: var(--surface-2);
  border-color: var(--fg-3);
}

.project-policy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 0 4px;
}

.policy-prefix {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  color: var(--fg-2);
  padding-right: 4px;
}

.policy-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0.5px solid currentColor;
  border-radius: var(--r-xs);
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: help;
}

.policy-chip.tone-info {
  color: var(--ok);
}

.policy-chip.tone-warn {
  color: var(--warn);
}

.policy-key {
  font-weight: 600;
}

.policy-sep {
  color: var(--fg-4);
}

.policy-value {
  color: var(--fg);
}

.policy-chip-labels {
  flex-wrap: wrap;
  gap: 4px;
}

.policy-chip-labels .label-pill {
  background: var(--bg);
}

.project-work {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding-top: 24px;
}

@media (max-width: 920px) {
  .project-work {
    grid-template-columns: 1fr;
  }
}

.project-work-panel {
  border: 0.5px solid var(--line-2);
  border-radius: var(--r-md);
  background: var(--surface);
  overflow: hidden;
}

.project-work-panel > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--fg-3);
}

.project-work-panel > header h3 {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: inherit;
  text-transform: inherit;
  color: var(--fg);
}

.project-work-panel .see-all {
  color: var(--fg-3);
  font-size: 10px;
}

.project-work-panel .see-all:hover {
  color: var(--fg);
}

.project-work-panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.project-work-panel li {
  border-bottom: 1px solid var(--line);
}

.project-work-panel li:last-child {
  border-bottom: none;
}

.project-work-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 8px;
  padding: 8px 16px;
  color: var(--fg);
}

.project-work-row:hover {
  background: var(--bg-2);
}

.project-work-row .number {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-3);
}

.project-work-row .title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-work-row .labels {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.project-activity {
  padding-top: 24px;
}
</style>
