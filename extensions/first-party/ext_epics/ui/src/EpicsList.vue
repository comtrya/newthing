<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { parseQueryFilters } from "@comtrya/sdk-vue";
import { listEpics } from "./api";
import EpicCard from "./EpicCard.vue";
import {
  DEFAULT_WORKSPACE_ID,
  epicRef,
  newEpicHref as buildNewEpicHref,
  type ComtryaGraphQLClient,
  type Epic,
  type EpicState,
  type LoadState,
} from "./types";

const props = withDefaults(defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  epics?: Epic[] | null;
  workspaceId?: string;
  state?: string | null;
  title?: string;
  showNewLink?: boolean;
  /** Scope listing to this Project; new-epic link stamps it on create. */
  projectName?: string;
}>(), {
  workspaceId: DEFAULT_WORKSPACE_ID,
  state: null,
  title: "Epics",
  showNewLink: true,
  projectName: undefined,
});

type Filter = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED" | "ALL";

const FILTERS: Array<{ id: Filter; label: string; key: string }> = [
  { id: "IN_PROGRESS", label: "In progress", key: "i" },
  { id: "PLANNED", label: "Planned", key: "p" },
  { id: "DONE", label: "Done", key: "d" },
  { id: "CANCELED", label: "Canceled", key: "x" },
  { id: "ALL", label: "All", key: "a" },
];

const URL_FILTER_VALUES = new Set<Filter>([
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
  "ALL",
]);

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const loadedEpics = ref<Epic[]>(props.epics ?? []);
const filter = ref<Filter>("ALL");
const search = ref("");

/**
 * Active owner filter — a canonical `comtrya://` URN or empty.
 * Set by clicking an owner chip on a card, cleared via the
 * controls-row clear button. URL-synced as `?owner=<urn>` so
 * `/x/epics/?owner=comtrya://user/rawkode` is a shareable
 * "rawkode's epics" view. Mirrors iter 35's IssuesList assignee
 * filter, scoped to the epic's single `ownerRef`.
 */
const ownerFilter = ref("");

/**
 * Active project filter — a CUE Project name. URL-synced as
 * `?project=<name>`. Skipped when `props.projectName` is set
 * (project page wins, matches iter 46 IssuesList rule).
 */
const projectFilter = ref("");

const scopedEpics = computed(() => {
  const all = props.epics ?? loadedEpics.value;
  if (!props.projectName) return all;
  return all.filter((epic) => epic.projectName === props.projectName);
});

/**
 * Linear-style filter syntax inside the search input, mirroring
 * iter 55 (PullsQueue) and iter 56 (IssuesList) so the three
 * planning queues share one vocabulary. Recognised tokens:
 *   `is:<state>`    — planned / in-progress / done / canceled / all
 *   `owner:<urn>`   — canonical comtrya:// URN
 *   `project:<name>`— CUE Project name
 *
 * Token wins over the corresponding chip / URL ref for the
 * duration of the search; clearing the input restores the chip
 * state. `props.projectName` (mounted on a project page) still
 * wins regardless.
 */
const EPICS_FILTER_KEYS = ["is", "owner", "project"] as const;

const STATE_TOKEN_TO_FILTER: Record<string, Filter> = {
  planned: "PLANNED",
  "in-progress": "IN_PROGRESS",
  in_progress: "IN_PROGRESS",
  inprogress: "IN_PROGRESS",
  done: "DONE",
  canceled: "CANCELED",
  cancelled: "CANCELED",
  all: "ALL",
};

const parsedQuery = computed(() =>
  parseQueryFilters(search.value, EPICS_FILTER_KEYS),
);

const effectiveStateFilter = computed<Filter>(() => {
  for (const token of parsedQuery.value.filters.is ?? []) {
    const mapped = STATE_TOKEN_TO_FILTER[token.toLowerCase()];
    if (mapped) return mapped;
  }
  return filter.value;
});

const effectiveOwnerFilter = computed<string>(() => {
  for (const token of parsedQuery.value.filters.owner ?? []) {
    if (token.startsWith("comtrya://")) return token;
  }
  return ownerFilter.value;
});

const effectiveProjectFilter = computed<string>(() => {
  if (props.projectName) return "";
  for (const token of parsedQuery.value.filters.project ?? []) {
    if (token.trim()) return token.trim();
  }
  return projectFilter.value;
});

const epics = computed(() => {
  let result = scopedEpics.value;
  const state = effectiveStateFilter.value;
  if (state !== "ALL") {
    result = result.filter((epic) => epic.state === state);
  }
  const project = effectiveProjectFilter.value;
  if (project) {
    result = result.filter((epic) => epic.projectName === project);
  }
  const owner = effectiveOwnerFilter.value;
  if (owner) {
    result = result.filter((epic) => epic.ownerRef === owner);
  }
  const q = parsedQuery.value.text.trim().toLowerCase();
  if (q) {
    result = result.filter((epic) => {
      const owner = (epic.ownerRef ?? "").split("/").pop() ?? "";
      const haystack = `${epic.title} ${owner} ${epic.projectName ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  return result;
});

interface QueueFilterChip {
  key: string;
  value: string;
  label: string;
  tone: "is" | "owner" | "project" | "unknown";
}

const queueFilterChips = computed<QueueFilterChip[]>(() => {
  const chips: QueueFilterChip[] = [];
  for (const token of parsedQuery.value.filters.is ?? []) {
    const mapped = STATE_TOKEN_TO_FILTER[token.toLowerCase()];
    chips.push({
      key: "is",
      value: token,
      label: mapped
        ? `is · ${mapped.toLowerCase().replace("_", " ")}`
        : `is · ${token}`,
      tone: "is",
    });
  }
  for (const token of parsedQuery.value.filters.owner ?? []) {
    chips.push({
      key: "owner",
      value: token,
      label: `→ ${shortOwnerLabel(token)}`,
      tone: "owner",
    });
  }
  for (const token of parsedQuery.value.filters.project ?? []) {
    chips.push({
      key: "project",
      value: token,
      label: `◇ ${token}`,
      tone: "project",
    });
  }
  for (const key of parsedQuery.value.unknown) {
    chips.push({
      key,
      value: "",
      label: `unknown · ${key}:`,
      tone: "unknown",
    });
  }
  return chips;
});

function toggleOwnerFilter(ref: string): void {
  if (ownerFilter.value === ref) ownerFilter.value = "";
  else ownerFilter.value = ref;
}

function clearOwnerFilter(): void {
  ownerFilter.value = "";
}

function toggleProjectFilter(name: string): void {
  if (projectFilter.value === name) projectFilter.value = "";
  else projectFilter.value = name;
}

function clearProjectFilter(): void {
  projectFilter.value = "";
}

function shortOwnerLabel(ref: string): string {
  return ref.replace(/^comtrya:\/\/[a-z]+\//, "");
}

const counts = computed(() => {
  const out: Record<Filter, number> = {
    PLANNED: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELED: 0,
    ALL: scopedEpics.value.length,
  };
  for (const epic of scopedEpics.value) {
    if (epic.state === "PLANNED") out.PLANNED += 1;
    else if (epic.state === "IN_PROGRESS") out.IN_PROGRESS += 1;
    else if (epic.state === "DONE") out.DONE += 1;
    else if (epic.state === "CANCELED") out.CANCELED += 1;
  }
  return out;
});

const graphClient = computed(() => props.client ?? props.comtryaClient);
const newEpicHref = computed(() => {
  const base = buildNewEpicHref(props.workspaceId);
  return props.projectName
    ? `${base}&projectName=${encodeURIComponent(props.projectName)}`
    : base;
});

/**
 * URL-persisted filter state. Mirrors IssuesList (iter 32) +
 * PullsQueue (iter 36): readUrlState on mount, replaceState on
 * change, popstate sync. Defaults to `ALL` (epics are fewer than
 * issues/PRs and skewed across states, so showing only one slice
 * by default risks an empty queue on first load).
 */
function readUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const rawState = (params.get("state") ?? "").toUpperCase();
  if (URL_FILTER_VALUES.has(rawState as Filter)) {
    filter.value = rawState as Filter;
  }
  const rawOwner = params.get("owner") ?? "";
  ownerFilter.value = rawOwner.startsWith("comtrya://") ? rawOwner : "";
  const rawProject = params.get("project") ?? "";
  projectFilter.value = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(rawProject) ? rawProject : "";
  const rawQ = params.get("q");
  if (rawQ !== null) search.value = rawQ;
}

function writeUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (filter.value === "ALL") params.delete("state");
  else params.set("state", filter.value);
  if (ownerFilter.value) params.set("owner", ownerFilter.value);
  else params.delete("owner");
  if (projectFilter.value && !props.projectName) params.set("project", projectFilter.value);
  else params.delete("project");
  const trimmedQ = search.value.trim();
  if (trimmedQ) params.set("q", trimmedQ);
  else params.delete("q");
  const next = params.toString();
  const target = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`;
  if (target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", target);
  }
}

let suppressUrlWrite = false;

function onPopState(): void {
  suppressUrlWrite = true;
  readUrlState();
  nextTick(() => {
    suppressUrlWrite = false;
  });
}

onMounted(() => {
  suppressUrlWrite = true;
  readUrlState();
  suppressUrlWrite = false;
  void loadEpics();
  window.addEventListener("popstate", onPopState);
});

onUnmounted(() => {
  window.removeEventListener("popstate", onPopState);
});

watch(
  () => [graphClient.value, props.epics, props.workspaceId, props.state],
  () => void loadEpics(),
);

watch([filter, ownerFilter, projectFilter, search], () => {
  if (suppressUrlWrite) return;
  writeUrlState();
});

async function loadEpics(): Promise<void> {
  if (props.epics) {
    loadedEpics.value = props.epics;
    loadState.value = props.epics.length > 0 ? "ready" : "empty";
    error.value = null;
    return;
  }
  if (!graphClient.value) {
    loadedEpics.value = [];
    loadState.value = "error";
    error.value = "epics: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    loadedEpics.value = await listEpics(graphClient.value, {
      workspaceId: props.workspaceId,
      state: props.state,
    });
    loadState.value = loadedEpics.value.length > 0 ? "ready" : "empty";
  } catch (caught) {
    loadedEpics.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}
</script>

<template>
  <section class="epics-list" :data-state="loadState" data-smoke="epics-list">
    <header class="epics-list-header">
      <h3>{{ title }}</h3>
      <a v-if="showNewLink" :href="newEpicHref">+ new</a>
    </header>

    <div
      v-if="scopedEpics.length > 0"
      class="epics-controls"
    >
      <div
        class="epics-filter-row"
        role="tablist"
        aria-label="Filter epics by state"
      >
        <button
          v-for="f in FILTERS"
          :key="f.id"
          type="button"
          role="tab"
          :aria-selected="filter === f.id"
          :class="['epics-filter', { active: filter === f.id }]"
          @click="filter = f.id"
        >
          <span>{{ f.label }}</span>
          <span class="count">{{ counts[f.id] }}</span>
        </button>
      </div>
      <label class="epics-search">
        <input
          data-epics-search
          v-model="search"
          type="search"
          placeholder="Filter — try is:in-progress · project:&lt;name&gt; · owner:&lt;urn&gt; · text"
          autocomplete="off"
        />
      </label>
    </div>

    <div
      v-if="queueFilterChips.length > 0"
      class="epics-query-chips"
      data-smoke="epics-query-chips"
      aria-label="Parsed search filters"
    >
      <span
        v-for="chip in queueFilterChips"
        :key="`${chip.key}:${chip.value || 'unknown'}`"
        :class="['query-chip', `tone-${chip.tone}`]"
        :title="chip.tone === 'unknown' ? `Unknown filter key: ${chip.key}` : chip.value"
      >{{ chip.label }}</span>
      <span class="query-chips-hint">
        syntax: <code>is:in-progress</code> · <code>project:&lt;name&gt;</code> · <code>owner:&lt;urn&gt;</code>
      </span>
    </div>

    <div
      v-if="ownerFilter"
      class="epics-owner-filter"
      data-smoke="epics-owner-filter"
    >
      <span class="prefix">owner</span>
      <span class="active-chip" :title="ownerFilter">
        {{ shortOwnerLabel(ownerFilter) }}
      </span>
      <button
        type="button"
        class="clear"
        @click="clearOwnerFilter"
        aria-label="Clear owner filter"
      >clear ✕</button>
    </div>

    <div
      v-if="projectFilter && !props.projectName"
      class="epics-project-filter"
      data-smoke="epics-project-filter"
    >
      <span class="prefix">project</span>
      <span class="active-chip" :title="`Scoped to project ${projectFilter}`">
        <span class="project-glyph">◇</span>
        {{ projectFilter }}
      </span>
      <button
        type="button"
        class="clear"
        @click="clearProjectFilter"
        aria-label="Clear project filter"
      >clear ✕</button>
    </div>

    <p v-if="loadState === 'loading'" class="epic-line muted">Loading epics</p>
    <p v-else-if="loadState === 'error'" class="epic-line warn">{{ error }}</p>
    <p v-else-if="scopedEpics.length === 0" class="epic-line muted">No epics yet.</p>
    <p v-else-if="epics.length === 0" class="epic-line muted">
      No {{ filter.toLowerCase().replace("_", " ") }} epics in scope.
    </p>
    <ul v-else class="epics-list-items">
      <li v-for="epic in epics" :key="epic.id">
        <EpicCard
          :epic="epic"
          :resource-ref="epicRef(epic)"
          :client="graphClient"
          :active-owner="ownerFilter"
          :active-project="projectFilter"
          @owner-click="toggleOwnerFilter"
          @project-click="toggleProjectFilter"
        />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.epics-list {
  display: grid;
  gap: 8px;
}

.epics-list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.epics-list-header h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.epics-list-header a,
.epic-line {
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.epics-list-header a {
  color: var(--ink-faint, #888);
  text-decoration: none;
}

.epics-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.epics-search {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 280px;
  border: 1px solid var(--rule-light, #d8d1c4);
  background: var(--paper, #fffdf8);
  padding: 0 8px;
}

.epics-search input {
  flex: 1;
  border: 0;
  background: transparent;
  font-family: var(--mono, monospace);
  font-size: 12px;
  padding: 6px 0;
  outline: none;
  color: inherit;
  min-width: 0;
}

.epics-search input::placeholder {
  color: var(--ink-faint, #68645c);
}

/* Parsed-filter chip strip — mirrors the IssuesList iter-56
 * aesthetic so the three planning queues read identically. Tone
 * colours match the cross-queue palette:
 *   is:       accent-teal
 *   owner:    ink
 *   project:  accent-blue (Project-spine accent)
 *   unknown:  dashed warning */
.epics-query-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
  font-family: var(--mono, monospace);
  font-size: 11px;
}

.epics-query-chips .query-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border: 1px solid currentColor;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.epics-query-chips .query-chip.tone-is {
  color: var(--accent-teal, #087f6f);
}

.epics-query-chips .query-chip.tone-owner {
  color: var(--ink, #111);
}

.epics-query-chips .query-chip.tone-project {
  color: var(--accent-blue, #1d55a6);
}

.epics-query-chips .query-chip.tone-unknown {
  color: var(--accent-yellow, #c89300);
  border-style: dashed;
}

.epics-query-chips .query-chips-hint {
  margin-left: 4px;
  color: var(--ink-faint, #68645c);
  letter-spacing: 0;
}

.epics-query-chips .query-chips-hint code {
  font-family: var(--mono, monospace);
  font-size: 11px;
  padding: 0 4px;
  background: var(--paper-tint, #f2efe7);
  color: var(--ink-soft, #2c2b28);
}

.epics-filter-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0;
  border: 1px solid var(--ink, #111);
  align-self: flex-start;
}

.epics-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-family: var(--mono, monospace);
  font-size: 11px;
}

.epics-filter:not(:last-child) {
  border-right: 1px solid var(--rule-light, #d8d1c4);
}

.epics-filter.active {
  background: var(--ink, #111);
  color: var(--paper, #fffdf8);
}

.epics-filter .count {
  color: var(--ink-faint, #68645c);
  font-variant-numeric: tabular-nums;
}

.epics-filter.active .count {
  color: var(--paper-tint, #f2efe7);
}

/* Owner filter indicator — mirrors IssuesList's assignee filter
   shape (iter 35). Single dashed-border chip + clear button. */
.epics-owner-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--rule-light, #d8d1c4);
  background: var(--paper-tint, #f2efe7);
  font-family: var(--mono, monospace);
  font-size: 11px;
  align-self: flex-start;
}

.epics-owner-filter .prefix {
  color: var(--ink-faint, #68645c);
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.epics-owner-filter .active-chip {
  padding: 0 5px;
  border: 1px solid var(--ink, #111);
  color: var(--ink, #111);
}

.epics-owner-filter .clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--ink-faint, #68645c);
  font-family: var(--mono, monospace);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0 2px;
}

.epics-owner-filter .clear:hover {
  color: var(--ink, #111);
}

/* Project filter indicator — same shape as owner but blue chip
   matching `.epic-project`. */
.epics-project-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--rule-light, #d8d1c4);
  background: var(--paper-tint, #f2efe7);
  font-family: var(--mono, monospace);
  font-size: 11px;
  align-self: flex-start;
}

.epics-project-filter .prefix {
  color: var(--ink-faint, #68645c);
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.epics-project-filter .active-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 5px;
  border: 1px solid currentColor;
  color: var(--accent-blue, #1d55a6);
}

.epics-project-filter .project-glyph {
  font-size: 10px;
}

.epics-project-filter .clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--ink-faint, #68645c);
  font-family: var(--mono, monospace);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0 2px;
}

.epics-project-filter .clear:hover {
  color: var(--ink, #111);
}

.epics-list-items {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.epic-line {
  margin: 4px 0;
}

.muted {
  color: var(--ink-faint, #888);
}

.warn {
  color: var(--ink-warn, #c2410c);
}
</style>
