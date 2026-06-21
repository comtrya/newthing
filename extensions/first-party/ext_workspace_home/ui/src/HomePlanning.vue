<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  getGraphQLClient,
  invokeOp,
  subscribeLiveEvents,
  type OpResult,
} from "@comtrya/sdk-core";
import type { ComtryaGraphQLClient, LoadState } from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  workspaceId?: string | null;
}>();

interface BoardColumn<TCard = unknown> {
  key?: string | null;
  label?: string | null;
  count?: number | null;
  cards?: TCard[] | null;
  docs?: unknown[] | null;
}

interface EpicBoard {
  total?: number | null;
  columns?: BoardColumn[] | null;
}

interface SprintPlanningBoard {
  total?: number | null;
  columns?: BoardColumn[] | null;
}

interface DocBoard {
  totalDocs?: number | null;
  columns?: BoardColumn[] | null;
}

interface RepositoryRow {
  path?: string | null;
}

interface WorkspaceRepositoriesPayload {
  workspace?: {
    repositories?: RepositoryRow[];
  };
}

interface DocType {
  slug?: string;
  label?: string;
  description?: string | null;
}

interface ComtryaProject {
  name?: string;
  root?: string;
  docs?: Record<string, DocType>;
}

interface RepositoryBlob {
  path?: string;
  preview?: string;
}

interface RepositoryDocsPayload {
  workspace?: {
    repositoryByPath?: {
      comtryaConfig?: {
        projects?: ComtryaProject[];
      } | null;
      blobs?: RepositoryBlob[];
    } | null;
  };
}

interface DocCatalogTypeInput {
  projectName: string;
  typeName: string;
  label: string;
  description: string | null;
  slug: string;
  files: Array<{ path: string; preview: string }>;
}

interface PlanningSummary {
  roadmapTotal: number;
  activeEpics: number;
  atRiskEpics: number;
  activeSprints: number;
  plannedSprints: number;
  docsTotal: number;
  docsReady: number;
  docsNeedWork: number;
  scenarioDocs: number;
  firstDocsRepoPath: string | null;
}

const PLANNING_REPOSITORIES_QUERY = `query HomePlanningRepositories {
  workspace { repositories { path } }
}`;

const REPOSITORY_DOCS_QUERY = `query HomePlanningRepositoryDocs($segments: [String!]!) {
  workspace {
    repositoryByPath(segments: $segments) {
      comtryaConfig
      blobs { path preview size }
    }
  }
}`;

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const summary = ref<PlanningSummary>({
  roadmapTotal: 0,
  activeEpics: 0,
  atRiskEpics: 0,
  activeSprints: 0,
  plannedSprints: 0,
  docsTotal: 0,
  docsReady: 0,
  docsNeedWork: 0,
  scenarioDocs: 0,
  firstDocsRepoPath: null,
});
const unsubscribers: Array<() => void> = [];
const PLANNING_FETCH_TIMEOUT_MS = 2_500;
let loadRun = 0;

const graphClient = computed(() => props.client ?? props.comtryaClient);
const workspaceId = computed(() => props.workspaceId ?? "");
const workspaceRef = computed(() =>
  workspaceId.value ? `comtrya://workspace/${workspaceId.value}` : "",
);
const hasPlanning = computed(() =>
  summary.value.roadmapTotal > 0 ||
  summary.value.activeSprints + summary.value.plannedSprints > 0 ||
  summary.value.docsTotal > 0,
);
const epicsHref = computed(() =>
  `/x/epics/board${workspaceId.value ? `?workspaceId=${workspaceId.value}` : ""}`,
);
const sprintsHref = computed(() =>
  `/x/sprints/${workspaceId.value ? `?workspaceId=${workspaceId.value}` : ""}`,
);
const docsHref = computed(() => {
  const path = summary.value.firstDocsRepoPath;
  if (!path) return "/x/docs/";
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const query = workspaceId.value ? `?workspaceId=${workspaceId.value}` : "";
  return `/r/${encoded}/docs${query}`;
});

onMounted(() => {
  void loadPlanning();
  for (const type of [
    "dev.comtrya.epic.created",
    "dev.comtrya.epic.state-changed",
    "dev.comtrya.epic.project-changed",
    "dev.comtrya.sprint.created",
    "dev.comtrya.sprint.state-changed",
  ]) {
    unsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void loadPlanning(),
        onError: () => {},
      }),
    );
  }
});

onUnmounted(() => {
  for (const off of unsubscribers) off();
  unsubscribers.length = 0;
});

watch([graphClient, workspaceRef], () => void loadPlanning());

async function loadPlanning(): Promise<void> {
  const run = ++loadRun;
  if (!workspaceRef.value) {
    summary.value = emptySummary();
    loadState.value = "ready";
    return;
  }

  loadState.value = "loading";
  error.value = null;
  const [roadmap, sprints, docs] = await Promise.all([
    loadPartial(
      loadRoadmap(),
      "epic roadmap",
      { roadmapTotal: 0, activeEpics: 0, atRiskEpics: 0 },
    ),
    loadPartial(
      loadSprints(),
      "sprint planning",
      { activeSprints: 0, plannedSprints: 0 },
    ),
    loadPartial(
      loadDocs(),
      "docs readiness",
      {
        docsTotal: 0,
        docsReady: 0,
        docsNeedWork: 0,
        scenarioDocs: 0,
        firstDocsRepoPath: null,
      },
    ),
  ]);
  if (run !== loadRun) return;
  summary.value = { ...emptySummary(), ...roadmap, ...sprints, ...docs };
  loadState.value = "ready";
}

function emptySummary(): PlanningSummary {
  return {
    roadmapTotal: 0,
    activeEpics: 0,
    atRiskEpics: 0,
    activeSprints: 0,
    plannedSprints: 0,
    docsTotal: 0,
    docsReady: 0,
    docsNeedWork: 0,
    scenarioDocs: 0,
    firstDocsRepoPath: null,
  };
}

async function loadRoadmap(): Promise<Pick<PlanningSummary, "roadmapTotal" | "activeEpics" | "atRiskEpics">> {
  const board = await invokeValue<EpicBoard>(
    "ext_epics",
    "epics",
    "roadmap-board",
    { workspace: workspaceRef.value, limit: 128 },
    "epic roadmap",
  );
  return {
    roadmapTotal: board.total ?? countColumns(board.columns),
    activeEpics: countColumn(board.columns, ["in_progress", "in progress"]),
    atRiskEpics: countColumn(board.columns, ["at_risk", "at risk"]),
  };
}

async function loadSprints(): Promise<Pick<PlanningSummary, "activeSprints" | "plannedSprints">> {
  const board = await invokeValue<SprintPlanningBoard>(
    "ext_sprints",
    "sprints",
    "planning-board",
    { workspace: workspaceRef.value, limit: 128 },
    "sprint planning",
  );
  return {
    activeSprints: countColumn(board.columns, ["active"]),
    plannedSprints: countColumn(board.columns, ["planned"]),
  };
}

async function loadDocs(): Promise<Pick<
  PlanningSummary,
  "docsTotal" | "docsReady" | "docsNeedWork" | "scenarioDocs" | "firstDocsRepoPath"
>> {
  const catalog = await docCatalogInput();
  const firstDocsRepoPath = catalog.firstDocsRepoPath;
  if (!catalog.types.some((type) => type.files.length > 0)) {
    return {
      docsTotal: 0,
      docsReady: 0,
      docsNeedWork: 0,
      scenarioDocs: 0,
      firstDocsRepoPath,
    };
  }
  const [readiness, scenarios] = await Promise.all([
    invokeValue<DocBoard>(
      "ext_docs",
      "docs",
      "readiness-board",
      { types: catalog.types },
      "docs readiness",
    ),
    invokeValue<DocBoard>(
      "ext_docs",
      "docs",
      "scenario-board",
      { types: catalog.types },
      "docs scenarios",
    ),
  ]);
  return {
    docsTotal: readiness.totalDocs ?? countColumns(readiness.columns),
    docsReady: countColumn(readiness.columns, ["ready"]),
    docsNeedWork: countColumns(readiness.columns) - countColumn(readiness.columns, ["ready"]),
    scenarioDocs: countColumns(scenarios.columns),
    firstDocsRepoPath,
  };
}

async function invokeValue<T>(
  extension: string,
  namespace: string,
  op: string,
  input: unknown,
  label: string,
): Promise<T> {
  const result = await invokeOp<T>(extension, namespace, op, input);
  return opValue<T>(result, label);
}

async function loadPartial<T>(
  promise: Promise<T>,
  label: string,
  fallback: T,
): Promise<T> {
  try {
    return await withTimeout(
      promise,
      PLANNING_FETCH_TIMEOUT_MS,
      `${label} timed out`,
    );
  } catch {
    return fallback;
  }
}

function opValue<T>(result: OpResult<T>, label: string): T {
  if (result.ok) return result.value;
  throw new Error(`${label}: ${result.error.message}`);
}

function countColumn(columns: BoardColumn[] | null | undefined, keys: string[]): number {
  const wanted = new Set(keys.map(normalizeKey));
  const column = (columns ?? []).find((entry) =>
    wanted.has(normalizeKey(entry.key ?? entry.label ?? "")),
  );
  return columnCount(column);
}

function countColumns(columns: BoardColumn[] | null | undefined): number {
  return (columns ?? []).reduce((sum, column) => sum + columnCount(column), 0);
}

function columnCount(column: BoardColumn | null | undefined): number {
  if (!column) return 0;
  if (typeof column.count === "number") return column.count;
  return column.cards?.length ?? column.docs?.length ?? 0;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, "_");
}

async function docCatalogInput(): Promise<{
  types: DocCatalogTypeInput[];
  firstDocsRepoPath: string | null;
}> {
  const client = graphClient.value ?? getGraphQLClient();
  const data = await client.query<WorkspaceRepositoriesPayload>(
    PLANNING_REPOSITORIES_QUERY,
  );
  const repositories = data.workspace?.repositories ?? [];
  const resolved = await Promise.all(
    repositories.map(async (repo) => {
      const segments = pathSegments(repo.path);
      if (segments.length === 0) return { repo, types: [] };
      const payload = await client.query<RepositoryDocsPayload>(
        REPOSITORY_DOCS_QUERY,
        { segments },
      );
      const repository = payload.workspace?.repositoryByPath;
      return {
        repo,
        types: catalogTypesForRepository(
          repo.path ?? null,
          repository?.comtryaConfig?.projects ?? [],
          repository?.blobs ?? [],
        ),
      };
    }),
  );
  return {
    types: resolved.flatMap((entry) => entry.types),
    firstDocsRepoPath:
      resolved.find((entry) => entry.types.some((type) => type.files.length > 0))
        ?.repo.path ?? null,
  };
}

function catalogTypesForRepository(
  repoPath: string | null,
  projects: ComtryaProject[],
  blobs: RepositoryBlob[],
): DocCatalogTypeInput[] {
  const prefix = repoPath ? `${repoPath}:` : "";
  const types: DocCatalogTypeInput[] = [];
  for (const project of projects) {
    for (const [typeName, type] of Object.entries(project.docs ?? {})) {
      types.push({
        projectName: project.name ?? "(unnamed project)",
        typeName,
        label: type.label || typeName,
        description: type.description ?? null,
        slug: type.slug ?? "",
        files: filesForType(project, type, blobs).map((file) => ({
          path: `${prefix}${file.path}`,
          preview: file.preview,
        })),
      });
    }
  }
  return types;
}

function filesForType(
  project: ComtryaProject,
  type: DocType,
  blobs: RepositoryBlob[],
): Array<{ path: string; preview: string }> {
  const scope = joinPath(project.root ?? "", type.slug ?? "");
  const prefix = scope ? `${scope}/` : "";
  return blobs
    .filter((blob) => {
      if (!blob.path) return false;
      if (!blob.path.endsWith(".mdx") && !blob.path.endsWith(".md")) return false;
      return prefix ? blob.path.startsWith(prefix) : true;
    })
    .map((blob) => ({
      path: blob.path ?? "",
      preview: blob.preview ?? "",
    }));
}

function joinPath(root: string, sub: string): string {
  const a = root.replace(/\/+$/g, "").replace(/^\.\/?/, "");
  const b = sub.replace(/^\/+/g, "").replace(/^\.\//, "");
  if (!a) return b;
  if (!b || b === ".") return a;
  return `${a}/${b}`;
}

function pathSegments(path: string | null | undefined): string[] {
  return (path ?? "").split("/").filter(Boolean).map(decodeURIComponent);
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}
</script>

<template>
  <article v-if="loadState === 'error'" class="extension-placeholder" data-smoke="home-planning">
    {{ error }}
  </article>
  <section v-else class="planning" data-smoke="home-planning" :aria-busy="loadState === 'loading'">
    <div class="planning-strap">
      <span class="id">05</span>
      <h3>Planning pulse</h3>
      <span class="count">{{ loadState === "loading" ? "loading" : `${summary.roadmapTotal + summary.docsTotal} tracked` }}</span>
    </div>

    <p v-if="loadState !== 'loading' && !hasPlanning" class="empty">
      No planning work yet.
    </p>

    <div v-else class="planning-grid">
      <a class="metric" :href="epicsHref">
        <span>Roadmap</span>
        <strong>{{ loadState === "loading" ? "-" : summary.activeEpics }}</strong>
        <small>active epics</small>
        <em v-if="summary.atRiskEpics > 0">{{ summary.atRiskEpics }} at risk</em>
      </a>
      <a class="metric" :href="sprintsHref">
        <span>Kanban</span>
        <strong>{{ loadState === "loading" ? "-" : summary.activeSprints }}</strong>
        <small>active sprints</small>
        <em>{{ summary.plannedSprints }} planned</em>
      </a>
      <a class="metric" :href="docsHref">
        <span>Specs</span>
        <strong>{{ loadState === "loading" ? "-" : summary.docsReady }}</strong>
        <small>ready docs</small>
        <em>{{ summary.docsNeedWork }} need work</em>
      </a>
    </div>

    <div class="planning-lines" aria-label="Planning queues">
      <a :href="epicsHref">
        <span>Epics</span>
        <strong>{{ summary.roadmapTotal }}</strong>
      </a>
      <a :href="sprintsHref">
        <span>Sprints</span>
        <strong>{{ summary.activeSprints + summary.plannedSprints }}</strong>
      </a>
      <a :href="docsHref">
        <span>BDD scenarios</span>
        <strong>{{ summary.scenarioDocs }}</strong>
      </a>
    </div>
  </section>
</template>

<style scoped>
.planning,
.planning-grid,
.planning-lines {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.planning-strap,
.metric,
.planning-lines a {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.planning-strap h3 {
  margin: 0;
  font-family: var(--font-sans, system-ui);
  font-size: 14px;
  font-weight: 600;
}

.id,
.count,
.metric span,
.metric small,
.metric em,
.planning-lines span,
.extension-placeholder,
.empty {
  font-family: var(--font-sans, system-ui);
  font-size: 12px;
}

.id,
.count,
.metric span,
.metric small,
.planning-lines span,
.extension-placeholder,
.empty {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.id {
  font-family: var(--font-mono, monospace);
}

.metric {
  border: 0.5px solid var(--line, rgba(255,255,255,0.08));
  border-radius: var(--r-sm, 6px);
  padding: 9px 10px;
  color: inherit;
  background: var(--surface, rgba(255,255,255,0.03));
  text-decoration: none;
}

.metric strong {
  flex: 0 0 auto;
  font-family: var(--font-mono, monospace);
  font-size: 22px;
  line-height: 1;
}

.metric small {
  margin-left: auto;
}

.metric em {
  flex: 0 0 auto;
  color: var(--fg-2, rgba(255,255,255,0.76));
  font-style: normal;
}

.planning-lines {
  border-top: 0.5px solid var(--line, rgba(255,255,255,0.08));
  padding-top: 8px;
}

.planning-lines a {
  color: inherit;
  text-decoration: none;
}

.planning-lines strong {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.empty {
  margin: 0;
}

@media (max-width: 720px) {
  .metric {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .metric small {
    margin-left: 0;
  }
}
</style>
