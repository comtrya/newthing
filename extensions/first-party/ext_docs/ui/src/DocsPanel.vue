<script setup lang="ts">
/**
 * Repo-resident docs surface, owned by ext_docs.
 *
 * Reads `workspace.repositoryByPath(...).comtryaConfig.projects` (kernel-evaluated from the
 * repo's `package comtrya` CUE config) and `repository.blobs` (file
 * preview content). Iterates every Project's `docs` map — keyed by
 * user-chosen type names ("adr", "rfc", "prd", "runbook", …) — and for
 * each type lists the MDX files under `<project.root>/<type.slug>/`,
 * parsing YAML front-matter into typed properties. Every doc carries
 * an implicit `body` (the MDX body) which the kernel does not validate.
 *
 * The doc-type SHAPE (slug, label, properties, Person) is declared by
 * the CUE schema this extension registers via
 * `manifest.contributes.cueSchemas`. The kernel doesn't know what a
 * "spec" or "ADR" is — extensions do. Removing this extension makes
 * the `docs` field vanish from `comtryaConfig`.
 */

import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getGraphQLClient, type OpResult } from "@comtrya/sdk-core";
import { bodyExcerpt, renderMarkdown, useShortcuts } from "@comtrya/sdk-vue";
import { extDocsXDocs } from "../../dist/ext_docs.client";
import {
  DOCS_BOARD_TABS,
  docsBoardFromRouteSubPath,
  docsBoardHref,
  type DocsBoardId,
} from "./docs-workbench-route";

interface DocProperty {
  // intentionally any — typed by the per-type `properties` CUE block
  [key: string]: unknown;
}

interface DocType {
  slug?: string;
  label?: string;
  description?: string;
  properties?: Record<string, unknown>;
}

interface ComtryaProject {
  name?: string;
  root?: string;
  labels?: string[];
  docs?: Record<string, DocType>;
  [key: string]: unknown;
}

interface ComtryaConfig {
  projects?: ComtryaProject[];
  error?: string | null;
}

interface RepositoryBlob {
  oid?: string;
  path?: string;
  preview?: string;
  size?: number;
}

interface ResolvedRepository {
  comtryaConfig?: ComtryaConfig | null;
  blobs?: RepositoryBlob[];
}

interface RepositoryPayload {
  workspace?: {
    repositoryByPath?: ResolvedRepository | null;
  };
}

interface SummarizeDocInput {
  path: string;
  preview: string;
}

interface DocCatalogTypeInput {
  projectName: string;
  typeName: string;
  label: string;
  description: string | null;
  slug: string;
  files: SummarizeDocInput[];
}

interface DocCatalogInput {
  types: DocCatalogTypeInput[];
}

interface DocBoardCard {
  projectName?: string;
  typeName?: string;
  typeLabel?: string;
  path?: string;
  title?: string;
  status?: string | null;
  owner?: string | null;
  tags?: string[];
  feature?: string | null;
  scenarioCount?: number;
  stepCount?: number;
  scenariosWithoutSteps?: number;
  checklistTotal?: number;
  checklistChecked?: number;
  referenceCount?: number;
  implementationReferenceCount?: number;
  docReferenceCount?: number;
  otherReferenceCount?: number;
  decisionCount?: number;
  openQuestionCount?: number;
  riskCount?: number;
}

interface DocBoardColumn {
  key: string;
  label: string;
  count: number;
  docs: DocBoardCard[];
}

interface DocBoard {
  totalDocs: number;
  columns: DocBoardColumn[];
}

interface ExtensionRouteParams {
  scope?: string;
  routePrefix?: string;
  subPath?: string;
  params?: Record<string, string | undefined>;
}

const props = defineProps<{
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
  repositorySegments?: string[];
  extensionSlot?: string | null;
  /**
   * When set (typically on a project home page), DocsPanel renders only
   * the named Project's doc types instead of every Project in the repo.
   */
  projectName?: string;
  routeParams?: ExtensionRouteParams;
}>();

const loadState = ref<"loading" | "ready" | "error">("loading");
const error = ref<string | null>(null);
const config = ref<ComtryaConfig | null>(null);
const blobs = ref<RepositoryBlob[]>([]);

const allProjects = computed<ComtryaProject[]>(
  () => config.value?.projects ?? [],
);
const isOverviewSummary = computed(() => props.extensionSlot === "repository.main");

const projects = computed<ComtryaProject[]>(() => {
  if (!props.projectName) return allProjects.value;
  return allProjects.value.filter((p) => p.name === props.projectName);
});

const totalDocs = computed(() => {
  let total = 0;
  for (const project of projects.value) {
    for (const type of Object.values(project.docs ?? {})) {
      total += filesForType(project, type).length;
    }
  }
  return total;
});

const expandedDocPath = ref<string | null>(null);
const focusedDocPath = ref<string | null>(null);
const boardState = ref<"idle" | "loading" | "ready" | "error">("idle");
const boardError = ref<string | null>(null);
const activeBoardId = ref<DocsBoardId>("type");
const boards = ref<Record<DocsBoardId, DocBoard | null>>(emptyBoards());
const boardTabs = DOCS_BOARD_TABS;
const activeBoard = computed(() => boards.value[activeBoardId.value]);
const docTypeSummaries = computed(() => {
  const byKey = new Map<string, { key: string; label: string; count: number }>();
  for (const project of projects.value) {
    for (const entry of docTypesFor(project)) {
      const key = entry.key;
      const current = byKey.get(key) ?? {
        key,
        label: entry.type.label || key,
        count: 0,
      };
      current.count += filesForType(project, entry.type).length;
      byKey.set(key, current);
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const byCount = b.count - a.count;
    if (byCount !== 0) return byCount;
    return a.label.localeCompare(b.label);
  });
});
const visibleDocTypeSummaries = computed(() =>
  docTypeSummaries.value.filter((entry) => entry.count > 0).slice(0, 4),
);
const docsRouteHref = computed(() => {
  const path = (props.repositoryPath ?? "")
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent)
    .join("/");
  const params = new URLSearchParams();
  if (props.workspaceId) params.set("workspaceId", props.workspaceId);
  if (props.repositoryId) params.set("repositoryId", props.repositoryId);
  const query = params.toString();
  return `/r/${path || "repository"}/docs${query ? `?${query}` : ""}`;
});
const overviewHeadline = computed(() => {
  if (loadState.value === "loading") return "Loading";
  if (loadState.value === "error" || config.value?.error) return "Unavailable";
  if (totalDocs.value === 0) return "No docs";
  return `${totalDocs.value} docs`;
});

function emptyBoards(): Record<DocsBoardId, DocBoard | null> {
  return {
    type: null,
    project: null,
    owner: null,
    tag: null,
    status: null,
    scenario: null,
    readiness: null,
    decision: null,
    handoff: null,
    traceability: null,
    implementation: null,
  };
}

function resetBoards(): void {
  boards.value = emptyBoards();
  boardState.value = "idle";
  boardError.value = null;
}

function isExpanded(path: string): boolean {
  return expandedDocPath.value === path;
}

function toggleDoc(path: string): void {
  expandedDocPath.value = isExpanded(path) ? null : path;
  focusedDocPath.value = path;
}

function focusDoc(path: string): void {
  focusedDocPath.value = path;
}

function openDocsWorkbench(event: MouseEvent): void {
  event.preventDefault();
  window.location.assign(docsRouteHref.value);
}

/** Flat list of every visible doc path in render order — for j/k nav. */
const orderedDocPaths = computed<string[]>(() => {
  const out: string[] = [];
  for (const project of projects.value) {
    for (const entry of docTypesFor(project)) {
      for (const doc of filesForType(project, entry.type)) {
        out.push(doc.path);
      }
    }
  }
  return out;
});

function moveFocus(delta: number): void {
  const list = orderedDocPaths.value;
  if (list.length === 0) return;
  const current = focusedDocPath.value;
  const index = current ? list.indexOf(current) : -1;
  const next = Math.max(0, Math.min(list.length - 1, index + delta));
  focusedDocPath.value = list[next] ?? null;
}

// j/k/Enter only fire when this panel is the focused surface
// (focused row is set), so they don't hijack the PR queue / issues
// list shortcuts when the panel isn't in focus.
useShortcuts({
  Escape: (event) => {
    if (!expandedDocPath.value) return;
    event.preventDefault();
    expandedDocPath.value = null;
  },
  j: (event) => {
    if (!focusedDocPath.value) return;
    event.preventDefault();
    moveFocus(1);
  },
  ArrowDown: (event) => {
    if (!focusedDocPath.value) return;
    event.preventDefault();
    moveFocus(1);
  },
  k: (event) => {
    if (!focusedDocPath.value) return;
    event.preventDefault();
    moveFocus(-1);
  },
  ArrowUp: (event) => {
    if (!focusedDocPath.value) return;
    event.preventDefault();
    moveFocus(-1);
  },
  Enter: (event) => {
    if (!focusedDocPath.value) return;
    event.preventDefault();
    toggleDoc(focusedDocPath.value);
  },
  " ": (event) => {
    if (!focusedDocPath.value) return;
    event.preventDefault();
    toggleDoc(focusedDocPath.value);
  },
});

onMounted(() => {
  syncBoardFromRoute();
  window.addEventListener("popstate", syncBoardFromLocation);
  void load();
});
onUnmounted(() => {
  window.removeEventListener("popstate", syncBoardFromLocation);
});
watch(
  [() => props.repositoryPath, () => props.projectName, () => props.extensionSlot],
  () => void load(),
);
watch(
  () => props.routeParams?.subPath,
  () => syncBoardFromRoute(),
);

function syncBoardFromRoute(): void {
  activeBoardId.value = docsBoardFromRouteSubPath(props.routeParams?.subPath);
}

function syncBoardFromLocation(): void {
  activeBoardId.value = docsBoardFromRouteSubPath(currentDocsSubPath());
}

function currentDocsSubPath(): string {
  if (typeof window === "undefined") return props.routeParams?.subPath ?? "/";
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] === "x" && segments[1] === "docs") {
    return routeSubPathFromSegments(segments.slice(2));
  }
  const docsIndex = segments.lastIndexOf("docs");
  if (docsIndex >= 0) {
    return routeSubPathFromSegments(segments.slice(docsIndex + 1));
  }
  return props.routeParams?.subPath ?? "/";
}

function boardHref(boardId: DocsBoardId): string {
  if (typeof window === "undefined") return "#";
  return docsBoardHref({
    boardId,
    pathname: window.location.pathname,
    routeSubPath: currentDocsSubPath(),
    search: window.location.search,
  });
}

function selectBoard(boardId: DocsBoardId, event: MouseEvent): void {
  event.preventDefault();
  activeBoardId.value = boardId;
  if (typeof window === "undefined") return;
  const href = boardHref(boardId);
  const current = `${window.location.pathname}${window.location.search}`;
  if (href !== current) {
    window.history.pushState({}, "", href);
  }
}

function routeSubPathFromSegments(segments: string[]): string {
  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

async function load(): Promise<void> {
  loadState.value = "loading";
  error.value = null;
  resetBoards();
  try {
    const segments = props.repositorySegments ?? [];
    if (segments.length === 0) {
      config.value = null;
      blobs.value = [];
      loadState.value = "ready";
      return;
    }
    const data = await getGraphQLClient().query<RepositoryPayload>(
      `query Q($segments: [String!]!) {
        workspace { repositoryByPath(segments: $segments) { comtryaConfig blobs { path preview size } } }
      }`,
      { segments },
    );
    const resolved = data.workspace?.repositoryByPath ?? null;
    config.value = resolved?.comtryaConfig ?? null;
    blobs.value = resolved?.blobs ?? [];
    loadState.value = "ready";
    if (isOverviewSummary.value) {
      boards.value = emptyBoards();
      boardState.value = "ready";
      boardError.value = null;
    } else {
      void loadDocBoards();
    }
  } catch (caught) {
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
    resetBoards();
  }
}

function joinPath(root: string, sub: string): string {
  const a = (root ?? "").replace(/\/+$/g, "").replace(/^\.\/?/, "");
  const b = (sub ?? "").replace(/^\/+/g, "").replace(/^\.\//, "");
  if (!a) return b;
  if (!b || b === ".") return a;
  return `${a}/${b}`;
}

function scopeFor(project: ComtryaProject, type: DocType): string {
  const root = (project.root ?? "").replace(/\/+$/g, "");
  return joinPath(root, type.slug ?? "");
}

interface DocFile {
  path: string;
  fileName: string;
  title: string;
  frontMatter: DocProperty;
  body: string;
  preview: string;
}

function parseFrontMatter(raw: string | undefined | null): { props: DocProperty; body: string } {
  const text = raw ?? "";
  if (!text.startsWith("---")) return { props: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end < 0) return { props: {}, body: text };
  const front = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n/, "");
  const props: DocProperty = {};
  for (const line of front.split("\n")) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1]!;
    const value = match[2]!.trim();
    props[key] = parseFrontMatterValue(value);
  }
  return { props, body };
}

function parseFrontMatterValue(raw: string): unknown {
  const value = raw.trim();
  if (!value) return "";
  if (value === "true" || value === "false") return value === "true";
  if (/^-?\d+$/.test(value)) return Number(value);
  // [a, b, c] inline list
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim().replace(/^"(.*)"$/, "$1"))
      .filter((s) => s.length > 0);
  }
  return value.replace(/^"(.*)"$/, "$1");
}

function filesForType(project: ComtryaProject, type: DocType): DocFile[] {
  const scope = scopeFor(project, type);
  const prefix = scope ? `${scope}/` : "";
  return blobs.value
    .filter((blob) => {
      if (!blob.path) return false;
      if (!blob.path.endsWith(".mdx") && !blob.path.endsWith(".md")) return false;
      return prefix ? blob.path.startsWith(prefix) : true;
    })
    .map((blob) => {
      const { props, body } = parseFrontMatter(blob.preview);
      const title =
        typeof props.title === "string" && props.title.length > 0
          ? props.title
          : (blob.path ?? "").split("/").pop() ?? blob.path ?? "(untitled)";
      const fileName = (blob.path ?? "").split("/").pop() ?? blob.path ?? "";
      return {
        path: blob.path ?? "",
        fileName,
        title,
        frontMatter: props,
        body,
        preview: blob.preview ?? "",
      };
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function docTypesFor(project: ComtryaProject): Array<{ key: string; type: DocType }> {
  if (!project.docs) return [];
  return Object.entries(project.docs)
    .map(([key, type]) => ({ key, type }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function propertyEntries(type: DocType): Array<{ name: string; spec: unknown }> {
  if (!type.properties) return [];
  return Object.entries(type.properties).map(([name, spec]) => ({ name, spec }));
}

function describeSpec(spec: unknown): string {
  if (typeof spec === "string") return spec;
  if (spec === null || spec === undefined) return "any";
  if (typeof spec === "object") {
    // #Person-like — show its known fields concisely
    return Object.keys(spec).join(" | ") || "object";
  }
  return String(spec);
}

function describeFrontMatterValue(value: unknown): string {
  if (value === null || value === undefined) return "·";
  if (Array.isArray(value)) return value.map(describeFrontMatterValue).join(" · ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}=${describeFrontMatterValue(v)}`)
      .join(" · ");
  }
  return String(value);
}

function docCatalogInput(): DocCatalogInput {
  const types: DocCatalogTypeInput[] = [];
  for (const project of projects.value) {
    for (const entry of docTypesFor(project)) {
      types.push({
        projectName: project.name ?? "(unnamed project)",
        typeName: entry.key,
        label: entry.type.label || entry.key,
        description: entry.type.description ?? null,
        slug: entry.type.slug ?? "",
        files: filesForType(project, entry.type).map((doc) => ({
          path: doc.path,
          preview: doc.preview,
        })),
      });
    }
  }
  return { types };
}

function opValue<T>(result: OpResult<unknown>, label: string): T {
  if (result.ok) return result.value as T;
  throw new Error(`${label}: ${result.error.message}`);
}

async function loadDocBoards(): Promise<void> {
  const input = docCatalogInput();
  if (!input.types.some((type) => type.files.length > 0)) {
    boards.value = emptyBoards();
    boardState.value = "ready";
    boardError.value = null;
    return;
  }

  boardState.value = "loading";
  boardError.value = null;
  try {
    const [
      type,
      project,
      owner,
      tag,
      status,
      scenario,
      readiness,
      decision,
      handoff,
      traceability,
      implementation,
    ] = await Promise.all([
      extDocsXDocs.typeBoard(input),
      extDocsXDocs.projectBoard(input),
      extDocsXDocs.ownerBoard(input),
      extDocsXDocs.tagBoard(input),
      extDocsXDocs.statusBoard(input),
      extDocsXDocs.scenarioBoard(input),
      extDocsXDocs.readinessBoard(input),
      extDocsXDocs.decisionBoard(input),
      extDocsXDocs.handoffBoard(input),
      extDocsXDocs.traceabilityBoard(input),
      extDocsXDocs.implementationBoard(input),
    ]);
    boards.value = {
      type: opValue<DocBoard>(type, "type board"),
      project: opValue<DocBoard>(project, "project board"),
      owner: opValue<DocBoard>(owner, "owner board"),
      tag: opValue<DocBoard>(tag, "tag board"),
      status: opValue<DocBoard>(status, "status board"),
      scenario: opValue<DocBoard>(scenario, "scenario board"),
      readiness: opValue<DocBoard>(readiness, "readiness board"),
      decision: opValue<DocBoard>(decision, "review board"),
      handoff: opValue<DocBoard>(handoff, "handoff board"),
      traceability: opValue<DocBoard>(traceability, "traceability board"),
      implementation: opValue<DocBoard>(implementation, "implementation board"),
    };
    boardState.value = "ready";
  } catch (caught) {
    boards.value = emptyBoards();
    boardState.value = "error";
    boardError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function boardTabTotal(id: DocsBoardId): number {
  return boards.value[id]?.totalDocs ?? 0;
}

function cardTypeLabel(card: DocBoardCard): string {
  return card.typeLabel || card.typeName || "doc";
}

function metricRows(card: DocBoardCard): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  if (card.status) rows.push({ label: "status", value: card.status });
  if (card.projectName) rows.push({ label: "project", value: card.projectName });
  if (card.owner) rows.push({ label: "owner", value: card.owner });
  if (card.feature) rows.push({ label: "feature", value: card.feature });
  if (Array.isArray(card.tags) && card.tags.length > 0) {
    rows.push({ label: "tags", value: card.tags.join(", ") });
  }
  if (typeof card.scenarioCount === "number") {
    rows.push({ label: "scenarios", value: String(card.scenarioCount) });
  }
  if (typeof card.stepCount === "number") {
    rows.push({ label: "steps", value: String(card.stepCount) });
  }
  if (
    typeof card.scenariosWithoutSteps === "number" &&
    card.scenariosWithoutSteps > 0
  ) {
    rows.push({
      label: "empty",
      value: String(card.scenariosWithoutSteps),
    });
  }
  if (typeof card.checklistTotal === "number") {
    rows.push({
      label: "checklist",
      value: `${card.checklistChecked ?? 0}/${card.checklistTotal}`,
    });
  }
  if (typeof card.referenceCount === "number") {
    rows.push({ label: "refs", value: String(card.referenceCount) });
  }
  if (typeof card.implementationReferenceCount === "number") {
    rows.push({
      label: "impl refs",
      value: String(card.implementationReferenceCount),
    });
  }
  if (typeof card.docReferenceCount === "number") {
    rows.push({ label: "doc refs", value: String(card.docReferenceCount) });
  }
  if (typeof card.otherReferenceCount === "number" && card.otherReferenceCount > 0) {
    rows.push({ label: "other refs", value: String(card.otherReferenceCount) });
  }
  if (typeof card.decisionCount === "number") {
    rows.push({ label: "decisions", value: String(card.decisionCount) });
  }
  if (typeof card.openQuestionCount === "number") {
    rows.push({ label: "questions", value: String(card.openQuestionCount) });
  }
  if (typeof card.riskCount === "number") {
    rows.push({ label: "risks", value: String(card.riskCount) });
  }
  return rows;
}
</script>

<template>
  <section
    class="docs-panel"
    :class="{ 'docs-panel--summary': isOverviewSummary }"
    data-smoke="docs-panel"
  >
    <article
      v-if="isOverviewSummary"
      class="docs-overview-card"
      data-smoke="docs-overview-card"
    >
      <header class="docs-overview-head">
        <div>
          <p class="docs-overview-eyebrow">{{ repositoryPath || "Repository" }}</p>
          <h2>Specs &amp; Docs</h2>
        </div>
        <span class="docs-overview-pill">{{ overviewHeadline }}</span>
      </header>

      <p v-if="loadState === 'error'" class="docs-overview-message error" role="alert">
        {{ error }}
      </p>
      <p v-else-if="config?.error" class="docs-overview-message error" role="alert">
        {{ config.error }}
      </p>
      <p v-else-if="loadState === 'loading'" class="docs-overview-message">
        Reading the repo docs catalog...
      </p>
      <template v-else-if="totalDocs > 0">
        <p class="docs-overview-copy">
          Product intent, PRDs, and BDD scenarios live with the repository.
        </p>
        <dl class="docs-overview-stats" aria-label="Docs summary">
          <div>
            <dt>Docs</dt>
            <dd>{{ totalDocs }}</dd>
          </div>
          <div>
            <dt>Types</dt>
            <dd>{{ docTypeSummaries.length }}</dd>
          </div>
          <div>
            <dt>Projects</dt>
            <dd>{{ projects.length }}</dd>
          </div>
        </dl>
        <ul class="docs-overview-types" aria-label="Doc types">
          <li v-for="entry in visibleDocTypeSummaries" :key="entry.key">
            <span>{{ entry.label }}</span>
            <strong>{{ entry.count }}</strong>
          </li>
        </ul>
        <a class="docs-overview-link" :href="docsRouteHref" @click="openDocsWorkbench">
          Open docs workbench
        </a>
      </template>
      <template v-else>
        <p class="docs-overview-message">
          No specs, PRDs, or BDD scenarios declared for this repository.
        </p>
        <a class="docs-overview-link" :href="docsRouteHref" @click="openDocsWorkbench">
          Open docs workbench
        </a>
      </template>
    </article>

    <template v-else>
    <header class="docs-head">
      <div class="title-block">
        <h2>Docs</h2>
        <span class="muted">
          <template v-if="loadState === 'loading'">reading repo CUE config…</template>
          <template v-else-if="loadState === 'error'">unavailable</template>
          <template v-else-if="totalDocs === 0">
            No MDX docs declared. Add a
            <code>docs</code> block to a Project in
            <code>package comtrya</code> to surface them here.
          </template>
          <template v-else>
            {{ totalDocs }} doc<template v-if="totalDocs !== 1">s</template>
            across {{ projects.length }} project<template v-if="projects.length !== 1">s</template>
            · shape from <code>ext_docs</code>'s registered CUE schema
          </template>
        </span>
      </div>
    </header>

    <p v-if="loadState === 'error'" class="muted error" role="alert">{{ error }}</p>
    <p v-else-if="config?.error" class="muted error" role="alert">{{ config.error }}</p>

    <section
      v-if="loadState === 'ready' && totalDocs > 0"
      class="docs-workbench"
      data-smoke="docs-workbench"
    >
      <header class="docs-workbench-head">
        <div class="docs-workbench-title">
          <h3>Docs workbench</h3>
          <span class="muted">
            {{ activeBoard?.totalDocs ?? totalDocs }} doc<template v-if="(activeBoard?.totalDocs ?? totalDocs) !== 1">s</template>
          </span>
        </div>
        <nav class="docs-board-tabs" aria-label="Docs workbench views">
          <a
            v-for="tab in boardTabs"
            :key="tab.id"
            :href="boardHref(tab.id)"
            :class="['docs-board-tab', { active: activeBoardId === tab.id }]"
            :aria-current="activeBoardId === tab.id ? 'page' : undefined"
            @click="selectBoard(tab.id, $event)"
          >
            <span>{{ tab.label }}</span>
            <strong>{{ boardTabTotal(tab.id) }}</strong>
          </a>
        </nav>
      </header>

      <p v-if="boardState === 'loading'" class="muted docs-board-status">
        Loading docs board…
      </p>
      <p
        v-else-if="boardState === 'error'"
        class="muted error docs-board-status"
        role="alert"
      >
        {{ boardError }}
      </p>
      <div
        v-else-if="activeBoard"
        class="docs-board"
        :data-board="activeBoardId"
      >
        <section
          v-for="column in activeBoard.columns"
          :key="column.key"
          class="docs-board-column"
        >
          <header class="docs-board-column-head">
            <h4>{{ column.label }}</h4>
            <span>{{ column.count }}</span>
          </header>
          <ol v-if="column.docs.length > 0" class="docs-board-cards">
            <li
              v-for="doc in column.docs"
              :key="doc.path"
              class="docs-board-card"
            >
              <header class="docs-board-card-head">
                <span class="docs-board-type">{{ cardTypeLabel(doc) }}</span>
                <strong>{{ doc.title || doc.path }}</strong>
              </header>
              <code v-if="doc.path" class="docs-board-path">{{ doc.path }}</code>
              <dl v-if="metricRows(doc).length > 0" class="docs-board-metrics">
                <template v-for="row in metricRows(doc)" :key="`${doc.path}-${row.label}`">
                  <dt>{{ row.label }}</dt>
                  <dd>{{ row.value }}</dd>
                </template>
              </dl>
            </li>
          </ol>
          <p v-else class="muted docs-board-empty">No docs</p>
        </section>
      </div>
    </section>

    <article
      v-for="project in projects"
      v-show="docTypesFor(project).length > 0"
      :key="project.name"
      class="docs-project"
    >
      <header class="docs-project-head">
        <h3>{{ project.name }}</h3>
        <code class="docs-project-root">{{ project.root || "&lt;repo root&gt;" }}/</code>
      </header>

      <section
        v-for="entry in docTypesFor(project)"
        :key="entry.key"
        class="docs-type"
      >
        <header class="docs-type-head">
          <code class="docs-type-key">{{ entry.key }}</code>
          <span class="docs-type-label">{{ entry.type.label || entry.key }}</span>
          <code class="docs-type-scope">{{ scopeFor(project, entry.type) || "&lt;project root&gt;" }}/</code>
          <span class="muted docs-type-count">
            {{ filesForType(project, entry.type).length }} file<template v-if="filesForType(project, entry.type).length !== 1">s</template>
          </span>
        </header>

        <p v-if="entry.type.description" class="docs-type-desc">
          {{ entry.type.description }}
        </p>

        <dl v-if="propertyEntries(entry.type).length > 0" class="docs-type-props">
          <template v-for="prop in propertyEntries(entry.type)" :key="prop.name">
            <dt><code>{{ prop.name }}</code></dt>
            <dd>{{ describeSpec(prop.spec) }}</dd>
          </template>
          <dt class="implicit"><code>body</code></dt>
          <dd class="implicit">MDX body (implicit)</dd>
        </dl>

        <ol v-if="filesForType(project, entry.type).length > 0" class="docs-files">
          <li
            v-for="doc in filesForType(project, entry.type)"
            :key="doc.path"
            :class="[
              'docs-file',
              { focused: focusedDocPath === doc.path, expanded: isExpanded(doc.path) },
            ]"
            tabindex="0"
            @click="toggleDoc(doc.path)"
            @focus="focusDoc(doc.path)"
            @mouseenter="focusDoc(doc.path)"
            @keydown.enter.prevent="toggleDoc(doc.path)"
          >
            <header class="docs-file-head">
              <span class="docs-file-caret">{{ isExpanded(doc.path) ? "▾" : "▸" }}</span>
              <strong class="docs-file-title">{{ doc.title }}</strong>
              <code class="docs-file-path">{{ doc.path }}</code>
            </header>
            <dl v-if="Object.keys(doc.frontMatter).length > 0" class="docs-file-front">
              <template v-for="(value, key) in doc.frontMatter" :key="key">
                <dt><code>{{ key }}</code></dt>
                <dd>{{ describeFrontMatterValue(value) }}</dd>
              </template>
            </dl>
            <p v-if="doc.body && !isExpanded(doc.path)" class="docs-file-body">
              {{ bodyExcerpt(doc.body) }}
            </p>
            <article
              v-if="doc.body && isExpanded(doc.path)"
              class="docs-file-rendered"
              v-html="renderMarkdown(doc.body, { workspaceId: workspaceId ?? '' })"
            />
          </li>
        </ol>
        <p v-else class="muted no-files">
          No MDX files in <code>{{ scopeFor(project, entry.type) }}/</code> yet.
        </p>
      </section>
    </article>
    </template>
  </section>
</template>

<style>
.docs-panel {
  display: grid;
  gap: 14px;
  font-family: var(--font-sans, system-ui);
  min-width: 0;
}

.docs-panel--summary {
  gap: 0;
}

.docs-overview-card {
  min-width: 0;
  display: grid;
  gap: 12px;
  padding: 14px;
  color: var(--fg, rgba(255,255,255,0.94));
}

.docs-overview-head {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.docs-overview-head h2 {
  margin: 0;
  font-family: var(--font-sans, system-ui);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0;
}

.docs-overview-eyebrow {
  margin: 0 0 4px;
  overflow: hidden;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-sans, system-ui);
  font-size: 12px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docs-overview-pill {
  flex: 0 0 auto;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  border: 0.5px solid var(--line-2, rgba(255,255,255,0.12));
  border-radius: var(--r-sm, 6px);
  padding: 0 8px;
  color: var(--accent, #3b82f6);
  background: var(--accent-soft, rgba(59,130,246,0.14));
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.docs-overview-copy,
.docs-overview-message {
  margin: 0;
  color: var(--fg-2, rgba(255,255,255,0.74));
  font-size: 13px;
  line-height: 1.45;
}

.docs-overview-message {
  border: 0.5px solid var(--line-2, rgba(255,255,255,0.12));
  border-radius: var(--r-sm, 6px);
  padding: 10px 12px;
  background: var(--surface, rgba(255,255,255,0.03));
}

.docs-overview-message.error {
  color: var(--err, #f87171);
  border-color: var(--err-soft, rgba(248,113,113,0.2));
  background: var(--err-soft, rgba(248,113,113,0.12));
}

.docs-overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.docs-overview-stats > div {
  min-width: 0;
  border: 0.5px solid var(--line-2, rgba(255,255,255,0.12));
  border-radius: var(--r-sm, 6px);
  padding: 9px;
  background: var(--surface, rgba(255,255,255,0.03));
}

.docs-overview-stats dt {
  overflow-wrap: anywhere;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-size: 11px;
  line-height: 1.25;
}

.docs-overview-stats dd {
  margin: 6px 0 0;
  color: var(--fg, rgba(255,255,255,0.94));
  font-family: var(--font-mono, monospace);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.docs-overview-types {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-overview-types li {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  border-radius: var(--r-sm, 6px);
  padding: 8px 9px;
  background: var(--surface, rgba(255,255,255,0.03));
}

.docs-overview-types span {
  min-width: 0;
  overflow: hidden;
  color: var(--fg-2, rgba(255,255,255,0.74));
  font-size: 13px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docs-overview-types strong {
  color: var(--fg, rgba(255,255,255,0.94));
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  line-height: 1;
}

.docs-overview-link {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0.5px solid var(--line-2, rgba(255,255,255,0.12));
  border-radius: var(--r-sm, 6px);
  padding: 0 10px;
  color: var(--fg, rgba(255,255,255,0.94));
  background: var(--surface, rgba(255,255,255,0.03));
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.docs-overview-link:hover {
  border-color: var(--accent, #3b82f6);
  color: var(--accent, #3b82f6);
}

.docs-panel .docs-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding-bottom: 6px;
}

.docs-panel h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 22px;
  line-height: 1;
}

.docs-panel .title-block {
  display: inline-flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}

.docs-panel .muted {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.docs-panel .muted code {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-2, rgba(255,255,255,0.74));
  background: var(--bg-2, #0e1014);
  padding: 0 4px;
}

.docs-panel .muted.error {
  color: var(--accent-err, #c9341c);
}

.docs-panel .docs-workbench {
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--surface, rgba(255,255,255,0.03));
}

.docs-panel .docs-workbench-head {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.docs-panel .docs-workbench-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.docs-panel .docs-workbench-title h3 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 16px;
  line-height: 1;
}

.docs-panel .docs-board-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.docs-panel .docs-board-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  max-width: 100%;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  border-radius: 6px;
  background: var(--bg, #0a0b0e);
  color: var(--fg-2, rgba(255,255,255,0.74));
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.docs-panel .docs-board-tab:hover,
.docs-panel .docs-board-tab.active {
  border-color: var(--fg-3, rgba(255,255,255,0.52));
  color: var(--fg, rgba(255,255,255,0.94));
}

.docs-panel .docs-board-tab.active {
  background: var(--bg-2, #0e1014);
}

.docs-panel .docs-board-tab strong {
  min-width: 16px;
  border-radius: 6px;
  padding: 3px 5px;
  background: var(--surface-2, rgba(255,255,255,0.06));
  color: var(--fg, rgba(255,255,255,0.94));
  text-align: center;
  font-weight: 700;
}

.docs-panel .docs-board-status {
  margin: 0;
  padding: 12px;
}

.docs-panel .docs-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  padding: 10px;
  align-items: start;
}

.docs-panel .docs-board-column {
  min-width: 0;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg, #0a0b0e);
}

.docs-panel .docs-board-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg-2, #0e1014);
}

.docs-panel .docs-board-column-head h4 {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  line-height: 1.2;
  color: var(--fg, rgba(255,255,255,0.94));
}

.docs-panel .docs-board-column-head span {
  flex: 0 0 auto;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.docs-panel .docs-board-cards {
  list-style: none;
  margin: 0;
  padding: 8px;
  display: grid;
  gap: 8px;
}

.docs-panel .docs-board-card {
  min-width: 0;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  border-radius: 6px;
  padding: 8px;
  background: var(--surface, rgba(255,255,255,0.03));
}

.docs-panel .docs-board-card-head {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.docs-panel .docs-board-card-head strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: var(--font-serif, system-ui);
  font-size: 13px;
  line-height: 1.2;
}

.docs-panel .docs-board-type {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  line-height: 1;
  color: var(--accent-blue, #1d55a6);
}

.docs-panel .docs-board-path {
  display: block;
  margin-top: 6px;
  overflow-wrap: anywhere;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  line-height: 1.3;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.docs-panel .docs-board-metrics {
  display: grid;
  grid-template-columns: minmax(64px, max-content) 1fr;
  gap: 2px 8px;
  margin: 8px 0 0;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  line-height: 1.35;
}

.docs-panel .docs-board-metrics dt {
  color: var(--fg-4, rgba(255,255,255,0.34));
}

.docs-panel .docs-board-metrics dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.docs-panel .docs-board-empty {
  margin: 0;
  padding: 8px 10px 10px;
}

.docs-panel .docs-project {
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  background: var(--bg, #0a0b0e);
}

.docs-panel .docs-project-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--bg-2, #0e1014);
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.docs-panel .docs-project-head h3 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 16px;
  line-height: 1;
}

.docs-panel .docs-project-root {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.docs-panel .docs-type {
  padding: 12px 14px;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.docs-panel .docs-type:last-child {
  border-bottom: 0;
}

.docs-panel .docs-type-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 6px;
}

.docs-panel .docs-type-key {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent-blue, #1d55a6);
}

.docs-panel .docs-type-label {
  font-family: var(--font-serif, system-ui);
  font-size: 14px;
  font-weight: 600;
}

.docs-panel .docs-type-scope {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-2, rgba(255,255,255,0.74));
  background: var(--bg-2, #0e1014);
  padding: 0 5px;
}

.docs-panel .docs-type-count {
  margin-left: auto;
}

.docs-panel .docs-type-desc {
  margin: 0 0 8px;
  font-family: var(--font-sans, system-ui);
  font-size: 13px;
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.docs-panel .docs-type-props {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 14px;
  margin: 0 0 10px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.docs-panel .docs-type-props dt {
  font-weight: 600;
}

.docs-panel .docs-type-props dt code {
  color: var(--fg, rgba(255,255,255,0.94));
}

.docs-panel .docs-type-props .implicit code,
.docs-panel .docs-type-props .implicit {
  color: var(--fg-4, rgba(255,255,255,0.34));
  font-style: italic;
}

.docs-panel .docs-files {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.docs-panel .docs-file {
  border-left: 2px solid var(--line, rgba(255,255,255,0.07));
  padding: 6px 0 6px 12px;
  cursor: pointer;
  transition: border-color 120ms ease;
}

.docs-panel .docs-file:hover,
.docs-panel .docs-file.focused {
  border-left-color: var(--fg-3, rgba(255,255,255,0.52));
  background: var(--surface);
}

.docs-panel .docs-file.expanded {
  border-left-color: var(--accent-blue, #1d55a6);
  cursor: default;
}

.docs-panel .docs-file:focus {
  outline: none;
}

.docs-panel .docs-file-caret {
  display: inline-block;
  width: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
}

.docs-panel .docs-file-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.docs-panel .docs-file-title {
  font-family: var(--font-serif, system-ui);
  font-size: 13px;
}

.docs-panel .docs-file-path {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.docs-panel .docs-file-front {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1px 12px;
  margin: 0 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.docs-panel .docs-file-front dt code {
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.docs-panel .docs-file-body {
  margin: 0;
  font-family: var(--font-sans, system-ui);
  font-size: 12px;
  color: var(--fg-2, rgba(255,255,255,0.74));
  white-space: pre-wrap;
  word-break: break-word;
}

.docs-panel .docs-file-rendered {
  margin-top: 8px;
  border-top: 0.5px solid var(--line, rgba(255,255,255,0.07));
  padding: 12px 0 4px;
  font-family: var(--font-sans, system-ui);
  font-size: 13px;
  line-height: 1.55;
  color: var(--fg, rgba(255,255,255,0.94));
}

.docs-panel .docs-file-rendered h1,
.docs-panel .docs-file-rendered h2,
.docs-panel .docs-file-rendered h3,
.docs-panel .docs-file-rendered h4 {
  margin: 12px 0 6px;
  font-family: var(--font-serif, system-ui);
  line-height: 1.2;
}

.docs-panel .docs-file-rendered h1 { font-size: 20px; }
.docs-panel .docs-file-rendered h2 { font-size: 16px; }
.docs-panel .docs-file-rendered h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--fg-3, rgba(255,255,255,0.52)); }

.docs-panel .docs-file-rendered p {
  margin: 0 0 8px;
}

.docs-panel .docs-file-rendered ul {
  margin: 0 0 8px 18px;
  padding: 0;
  list-style: disc;
}

.docs-panel .docs-file-rendered ul li {
  margin: 2px 0;
}

.docs-panel .docs-file-rendered code {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  background: var(--bg-2, #0e1014);
  padding: 0 4px;
  border-radius: 2px;
}

.docs-panel .docs-file-rendered pre {
  margin: 8px 0;
  padding: 10px 12px;
  background: var(--bg-2, #0e1014);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  border-left: 2px solid var(--line, rgba(255,255,255,0.07));
}

.docs-panel .docs-file-rendered pre code {
  background: transparent;
  padding: 0;
}

.docs-panel .docs-file-rendered strong {
  font-weight: 700;
}

.docs-panel .docs-file-rendered em {
  font-style: italic;
}

.docs-panel .no-files {
  margin: 0;
}

@media (max-width: 760px) {
  .docs-panel .docs-workbench-head {
    grid-template-columns: 1fr;
  }

  .docs-panel .docs-board-tabs {
    justify-content: flex-start;
  }
}
</style>
