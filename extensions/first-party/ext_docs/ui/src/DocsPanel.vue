<script setup lang="ts">
/**
 * Repo-resident docs surface, owned by ext_docs.
 *
 * Reads `repository.comtryaConfig.projects` (kernel-evaluated from the
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

import { computed, onMounted, ref, watch } from "vue";
import { getGraphQLClient } from "@comtrya/sdk-core";
import { bodyExcerpt, renderMarkdown, useShortcuts } from "@comtrya/sdk-vue";

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
  repository?: ResolvedRepository;
}

const props = defineProps<{
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
  repositorySegments?: string[];
  /**
   * When set (typically on a project home page), DocsPanel renders only
   * the named Project's doc types instead of every Project in the repo.
   */
  projectName?: string;
}>();

const loadState = ref<"loading" | "ready" | "error">("loading");
const error = ref<string | null>(null);
const config = ref<ComtryaConfig | null>(null);
const blobs = ref<RepositoryBlob[]>([]);

const allProjects = computed<ComtryaProject[]>(
  () => config.value?.projects ?? [],
);

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
  void load();
});
watch(() => props.repositoryPath, () => void load());

async function load(): Promise<void> {
  loadState.value = "loading";
  error.value = null;
  try {
    const segments = props.repositorySegments ?? [];
    const data = segments.length > 0
      ? await getGraphQLClient().query<RepositoryPayload>(
          `query Q($segments: [String!]!) {
            workspace { repositoryByPath(segments: $segments) { comtryaConfig blobs { path preview size } } }
          }`,
          { segments },
        )
      : await getGraphQLClient().query<RepositoryPayload>(
          `{ repository { comtryaConfig blobs { path preview size } } }`,
        );
    const resolved = data.workspace?.repositoryByPath ?? data.repository ?? null;
    config.value = resolved?.comtryaConfig ?? null;
    blobs.value = resolved?.blobs ?? [];
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
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
</script>

<template>
  <section class="docs-panel" data-smoke="docs-panel">
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
              v-html="renderMarkdown(doc.body)"
            />
          </li>
        </ol>
        <p v-else class="muted no-files">
          No MDX files in <code>{{ scopeFor(project, entry.type) }}/</code> yet.
        </p>
      </section>
    </article>
  </section>
</template>

<style>
.docs-panel {
  display: grid;
  gap: 14px;
  font-family: var(--sans, system-ui);
}

.docs-panel .docs-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1.5px solid var(--ink, #111);
  padding-bottom: 6px;
}

.docs-panel h2 {
  margin: 0;
  font-family: var(--display, system-ui);
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
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.docs-panel .muted code {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-soft, #2c2b28);
  background: var(--paper-tint, #f2efe7);
  padding: 0 4px;
}

.docs-panel .muted.error {
  color: var(--accent-err, #c9341c);
}

.docs-panel .docs-project {
  border: 1.5px solid var(--ink, #111);
  background: var(--paper, #fffdf8);
}

.docs-panel .docs-project-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--paper-tint, #f2efe7);
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.docs-panel .docs-project-head h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 16px;
  line-height: 1;
}

.docs-panel .docs-project-root {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-soft, #2c2b28);
}

.docs-panel .docs-type {
  padding: 12px 14px;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
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
  font-family: var(--mono, monospace);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent-blue, #1d55a6);
}

.docs-panel .docs-type-label {
  font-family: var(--display, system-ui);
  font-size: 14px;
  font-weight: 600;
}

.docs-panel .docs-type-scope {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-soft, #2c2b28);
  background: var(--paper-tint, #f2efe7);
  padding: 0 5px;
}

.docs-panel .docs-type-count {
  margin-left: auto;
}

.docs-panel .docs-type-desc {
  margin: 0 0 8px;
  font-family: var(--sans, system-ui);
  font-size: 13px;
  color: var(--ink-soft, #2c2b28);
}

.docs-panel .docs-type-props {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 14px;
  margin: 0 0 10px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.docs-panel .docs-type-props dt {
  font-weight: 600;
}

.docs-panel .docs-type-props dt code {
  color: var(--ink, #111);
}

.docs-panel .docs-type-props .implicit code,
.docs-panel .docs-type-props .implicit {
  color: var(--ink-fainter, #918b80);
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
  border-left: 2px solid var(--rule-light, #d8d1c4);
  padding: 6px 0 6px 12px;
  cursor: pointer;
  transition: border-color 120ms ease;
}

.docs-panel .docs-file:hover,
.docs-panel .docs-file.focused {
  border-left-color: var(--ink-faint, #68645c);
  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 50%, transparent);
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
  color: var(--ink-faint, #68645c);
  font-family: var(--mono, monospace);
}

.docs-panel .docs-file-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.docs-panel .docs-file-title {
  font-family: var(--display, system-ui);
  font-size: 13px;
}

.docs-panel .docs-file-path {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.docs-panel .docs-file-front {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1px 12px;
  margin: 0 0 4px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.docs-panel .docs-file-front dt code {
  color: var(--ink-soft, #2c2b28);
}

.docs-panel .docs-file-body {
  margin: 0;
  font-family: var(--sans, system-ui);
  font-size: 12px;
  color: var(--ink-soft, #2c2b28);
  white-space: pre-wrap;
  word-break: break-word;
}

.docs-panel .docs-file-rendered {
  margin-top: 8px;
  border-top: 1px solid var(--rule-light, #d8d1c4);
  padding: 12px 0 4px;
  font-family: var(--sans, system-ui);
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink, #111);
}

.docs-panel .docs-file-rendered h1,
.docs-panel .docs-file-rendered h2,
.docs-panel .docs-file-rendered h3,
.docs-panel .docs-file-rendered h4 {
  margin: 12px 0 6px;
  font-family: var(--display, system-ui);
  line-height: 1.2;
}

.docs-panel .docs-file-rendered h1 { font-size: 20px; }
.docs-panel .docs-file-rendered h2 { font-size: 16px; }
.docs-panel .docs-file-rendered h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint, #68645c); }

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
  font-family: var(--mono, monospace);
  font-size: 12px;
  background: var(--paper-tint, #f2efe7);
  padding: 0 4px;
  border-radius: 2px;
}

.docs-panel .docs-file-rendered pre {
  margin: 8px 0;
  padding: 10px 12px;
  background: var(--paper-tint, #f2efe7);
  font-family: var(--mono, monospace);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  border-left: 2px solid var(--rule-light, #d8d1c4);
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
</style>
