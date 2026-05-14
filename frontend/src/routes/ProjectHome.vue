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

import { computed, onMounted, ref, watch } from "vue";
import { getGraphQLClient, invokeOp, type OpResult } from "@comtrya/sdk-core";
import SlotMount from "../components/SlotMount.vue";
import { repositoryHomeSlots } from "../repository-slots";

interface ComtryaProject {
  name?: string;
  root?: string;
  labels?: string[];
  owners?: string[];
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

const projectContext = computed<Record<string, unknown>>(() => ({
  workspaceId: workspaceId.value ?? undefined,
  repositoryId: repository.value?.id,
  repositoryGroups: props.groups,
  repositoryName: props.repo,
  repositoryPath: repoPath.value,
  repositorySegments: repoSegments.value,
  projectName: project.value?.name,
  projectRoot: project.value?.root,
  projectLabels: project.value?.labels,
  scope: "project",
}));

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
      return;
    }
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    loadError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

interface IssueLite {
  state?: string;
  projectName?: string | null;
  labels?: string[];
}

interface EpicLite {
  state?: string;
  projectName?: string | null;
}

const summary = ref<{
  issuesOpen: number;
  issuesClosed: number;
  epicsPlanned: number;
  epicsInProgress: number;
  epicsDone: number;
  docsCount: number;
  loaded: boolean;
}>({
  issuesOpen: 0,
  issuesClosed: 0,
  epicsPlanned: 0,
  epicsInProgress: 0,
  epicsDone: 0,
  docsCount: 0,
  loaded: false,
});

const policyChips = computed<Array<{ key: string; value: string; tone: "info" | "warn" }>>(() => {
  const out: Array<{ key: string; value: string; tone: "info" | "warn" }> = [];
  if (!project.value) return out;
  const issuesPolicy = project.value.issues as Record<string, unknown> | undefined;
  if (issuesPolicy && typeof issuesPolicy === "object") {
    if (typeof issuesPolicy.closeOnMerge === "boolean") {
      out.push({
        key: "closeOnMerge",
        value: issuesPolicy.closeOnMerge ? "on" : "off",
        tone: issuesPolicy.closeOnMerge ? "info" : "warn",
      });
    }
    if (Array.isArray(issuesPolicy.defaultLabels) && issuesPolicy.defaultLabels.length > 0) {
      out.push({
        key: "defaultLabels",
        value: (issuesPolicy.defaultLabels as string[]).join(", "),
        tone: "info",
      });
    }
  }
  const pullsPolicy = project.value.pulls as Record<string, unknown> | undefined;
  if (pullsPolicy && typeof pullsPolicy === "object") {
    if (typeof pullsPolicy.autoMerge === "boolean") {
      out.push({
        key: "autoMerge",
        value: pullsPolicy.autoMerge ? "on" : "off",
        tone: pullsPolicy.autoMerge ? "info" : "warn",
      });
    }
    if (Array.isArray(pullsPolicy.requiredChecks) && pullsPolicy.requiredChecks.length > 0) {
      out.push({
        key: "requiredChecks",
        value: (pullsPolicy.requiredChecks as string[]).join(", "),
        tone: "info",
      });
    }
  }
  return out;
});

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
  const workspaceUri = `comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3`;
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
  if (issuesRes.ok) {
    for (const issue of issuesRes.value as IssueLite[]) {
      if (issue.projectName !== proj) continue;
      if (issue.state === "closed") issuesClosed += 1;
      else issuesOpen += 1;
    }
  }
  if (epicsRes.ok) {
    for (const epic of epicsRes.value as EpicLite[]) {
      if (epic.projectName !== proj) continue;
      const state = (epic.state ?? "").toUpperCase();
      if (state === "DONE" || state === "CANCELED") epicsDone += 1;
      else if (state === "IN_PROGRESS" || state === "AT_RISK") epicsInProgress += 1;
      else epicsPlanned += 1;
    }
  }
  summary.value = {
    issuesOpen,
    issuesClosed,
    epicsPlanned,
    epicsInProgress,
    epicsDone,
    docsCount: docsByType.value.reduce((n, t) => n + (t.count || 1), 0),
    loaded: true,
  };
}

watch(
  () => project.value?.name,
  () => void loadSummary(),
  { immediate: true },
);
</script>

<template>
  <section class="page-header" data-smoke="project-home">
    <div class="title-group">
      <span class="overline">
        <RouterLink :to="`/r/${repoPath}`">{{ repoPath }}</RouterLink>
        · project
      </span>
      <h1>{{ props.project }}</h1>
    </div>
    <div class="summary-grid" aria-label="Project summary" v-if="project">
      <div>
        <span>Root</span>
        <strong>{{ project.root || "<repo root>" }}/</strong>
      </div>
      <div>
        <span>Labels</span>
        <strong>{{ (project.labels ?? []).join(" · ") || "—" }}</strong>
      </div>
      <div>
        <span>Owners</span>
        <strong>{{ (project.owners ?? []).join(" · ") || "—" }}</strong>
      </div>
    </div>
  </section>

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
    <section class="project-summary" data-smoke="project-summary">
      <div class="stat">
        <span class="stat-num" :data-zero="summary.issuesOpen === 0">{{ summary.issuesOpen }}</span>
        <span class="stat-label">open issue<template v-if="summary.issuesOpen !== 1">s</template></span>
      </div>
      <div class="stat">
        <span class="stat-num muted">{{ summary.issuesClosed }}</span>
        <span class="stat-label">closed</span>
      </div>
      <div class="stat-sep" aria-hidden="true" />
      <div class="stat">
        <span class="stat-num" :data-zero="summary.epicsInProgress === 0">{{ summary.epicsInProgress }}</span>
        <span class="stat-label">epic<template v-if="summary.epicsInProgress !== 1">s</template> in progress</span>
      </div>
      <div class="stat">
        <span class="stat-num muted">{{ summary.epicsPlanned }}</span>
        <span class="stat-label">planned</span>
      </div>
      <div class="stat">
        <span class="stat-num muted">{{ summary.epicsDone }}</span>
        <span class="stat-label">done</span>
      </div>
      <div class="stat-sep" aria-hidden="true" />
      <div class="stat">
        <span class="stat-num">{{ docsByType.length }}</span>
        <span class="stat-label">doc type<template v-if="docsByType.length !== 1">s</template></span>
      </div>
    </section>

    <section v-if="policyChips.length > 0" class="project-policy" data-smoke="project-policy">
      <span class="policy-prefix">policy</span>
      <span
        v-for="chip in policyChips"
        :key="chip.key"
        :class="['policy-chip', `tone-${chip.tone}`]"
        :title="`From package comtrya · ${project?.declaredAt || 'repo root'}/comtrya.cue`"
      >
        <span class="policy-key">{{ chip.key }}</span>
        <span class="policy-sep">·</span>
        <span class="policy-value">{{ chip.value }}</span>
      </span>
    </section>

    <section class="project-slots">
      <SlotMount
        v-for="slot in repositoryHomeSlots"
        :key="slot.name"
        :name="slot.name"
        :label="`${slot.label} · ${props.project}`"
        :element-context="projectContext"
        smoke-prefix="project-slot"
      />
    </section>
  </template>
</template>

<style scoped>
.project-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 28px;
  padding: 20px 0 16px;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.stat-num {
  font-family: var(--display, system-ui);
  font-size: 26px;
  line-height: 1;
  font-weight: 650;
  color: var(--ink, #111);
  font-variant-numeric: tabular-nums;
}

.stat-num[data-zero="true"],
.stat-num.muted {
  color: var(--ink-fainter, #918b80);
  font-weight: 500;
}

.stat-label {
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  color: var(--ink-faint, #68645c);
}

.stat-sep {
  width: 1px;
  height: 22px;
  background: var(--rule-light, #d8d1c4);
}

.project-policy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 0 4px;
}

.policy-prefix {
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint, #68645c);
  padding-right: 4px;
}

.policy-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid currentColor;
  padding: 2px 8px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  cursor: help;
}

.policy-chip.tone-info {
  color: var(--accent-teal, #087f6f);
}

.policy-chip.tone-warn {
  color: var(--accent-yellow, #c89300);
}

.policy-key {
  font-weight: 600;
}

.policy-sep {
  color: var(--ink-fainter, #918b80);
}

.policy-value {
  color: var(--ink, #111);
}

.project-slots {
  display: grid;
  gap: 28px;
  padding-top: 28px;
}
</style>
