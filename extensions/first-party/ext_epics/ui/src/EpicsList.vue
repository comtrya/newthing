<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  fetchComtryaProjects,
  parseQueryFilters,
  useShortcuts,
  type ComtryaProject,
} from "@comtrya/sdk-vue";
import { assignEpicProject, createEpic, listEpics } from "./api";
import EpicCard from "./EpicCard.vue";
import {
  epicBoardHref as buildEpicBoardHref,
  defaultWorkspaceId,
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
  repositorySegments?: string[];
  state?: string | null;
  title?: string;
  showNewLink?: boolean;
  /** Scope listing to this Project; new-epic link stamps it on create. */
  projectName?: string;
}>(), {
  workspaceId: defaultWorkspaceId(),
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
const boardHref = computed(() => {
  if (typeof window === "undefined") return buildEpicBoardHref(props.workspaceId);
  const path = window.location.pathname.replace(/\/$/, "");
  if (path.endsWith("/epics")) {
    return `${path}/board${window.location.search}`;
  }
  return buildEpicBoardHref(props.workspaceId);
});

/**
 * Linear-shape inline quick-add — mirror of IssuesList iter 17.
 * Stamps the page Project on create when one is in scope (prop
 * wins over URL filter wins over nothing). `c` focuses the
 * input from anywhere on the page; `Esc` clears the field and
 * blurs; `Enter` submits.
 */
const quickAddTitle = ref("");
const quickAddBusy = ref(false);
const quickAddError = ref<string | null>(null);

const quickAddProject = computed(() =>
  props.projectName ?? effectiveProjectFilter.value ?? null,
);

const quickAddPlaceholder = computed(() => {
  const project = quickAddProject.value;
  return project ? `New epic in ${project}…` : "New epic…";
});

function focusQuickAdd(): void {
  document.querySelector<HTMLInputElement>("[data-smoke=\"epics-quick-add\"]")?.focus();
}

function onQuickAddEscape(event: KeyboardEvent): void {
  event.preventDefault();
  quickAddTitle.value = "";
  quickAddError.value = null;
  (event.target as HTMLInputElement | null)?.blur();
}

async function submitQuickAdd(): Promise<void> {
  const title = quickAddTitle.value.trim();
  if (!title || quickAddBusy.value) return;
  quickAddBusy.value = true;
  quickAddError.value = null;
  try {
    const created = await createEpic(graphClient.value, {
      workspaceId: props.workspaceId,
      title,
      bodyMarkdown: "",
      projectName: quickAddProject.value,
    });
    // Optimistic-merge: prepend if not already present.
    if (!loadedEpics.value.some((e) => e.id === created.id)) {
      loadedEpics.value = [created, ...loadedEpics.value];
    }
    quickAddTitle.value = "";
    loadState.value = "ready";
    void loadEpics();
    void nextTick(focusQuickAdd);
  } catch (caught) {
    quickAddError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    quickAddBusy.value = false;
  }
}

/**
 * Bulk selection scaffolding — mirror of iter 51's IssuesList
 * pattern. `focused` walks the rendered `epics` list via `j`/`k`;
 * `space` toggles the focused row's id into `selectedIds`; the
 * bulk action bar appears when ≥1 selected and offers a
 * `<select>` to reproject the whole selection via the iter 69
 * `assign-project` op. `Esc` clears the selection so the bar
 * dismisses. Mirrors the IssuesList iter-71 reproject shape
 * exactly so the keyboard vocabulary is identical across the
 * two planning queues.
 */
const focused = ref(0);
const selectedIds = ref<Set<string>>(new Set());
const bulkBusy = ref(false);
const bulkError = ref<string | null>(null);
const availableProjects = ref<ComtryaProject[]>([]);

onMounted(async () => {
  try {
    availableProjects.value = await fetchComtryaProjects(props.repositorySegments);
  } catch {
    availableProjects.value = [];
  }
});

watch(epics, (next) => {
  if (focused.value >= next.length) {
    focused.value = Math.max(0, next.length - 1);
  }
});

function toggleSelection(id: string): void {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function clearSelection(): void {
  selectedIds.value = new Set();
  bulkError.value = null;
}

async function reprojectSelected(projectName: string | null): Promise<void> {
  if (selectedIds.value.size === 0 || bulkBusy.value) return;
  const ids = Array.from(selectedIds.value);
  bulkBusy.value = true;
  bulkError.value = null;
  try {
    const results = await Promise.allSettled(
      ids.map((id) => assignEpicProject(id, projectName)),
    );
    const successById = new Map<string, Epic>();
    const failed = new Set<string>();
    results.forEach((result, idx) => {
      const id = ids[idx]!;
      if (result.status === "fulfilled") successById.set(id, result.value);
      else failed.add(id);
    });
    loadedEpics.value = loadedEpics.value.map((epic) =>
      successById.get(epic.id) ?? epic,
    );
    selectedIds.value = failed;
    if (failed.size > 0) {
      const label = projectName ?? "(no project)";
      bulkError.value =
        `${failed.size} of ${ids.length} reassignments to ${label} failed; retry the remaining selection.`;
    }
  } catch (caught) {
    bulkError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    bulkBusy.value = false;
  }
}

function onBulkReprojectChange(event: Event): void {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;
  const raw = target.value;
  // `__NONE__` sentinel distinguishes "clear project" from the
  // unactionable placeholder option (matches iter-71 IssuesList).
  const projectName = raw === "__NONE__" ? null : raw || null;
  target.value = "";
  if (raw === "") return;
  void reprojectSelected(projectName);
}

useShortcuts({
  c: (event) => {
    event.preventDefault();
    focusQuickAdd();
  },
  j: (event) => {
    if (epics.value.length === 0) return;
    event.preventDefault();
    focused.value = Math.min(epics.value.length - 1, focused.value + 1);
  },
  k: (event) => {
    if (epics.value.length === 0) return;
    event.preventDefault();
    focused.value = Math.max(0, focused.value - 1);
  },
  " ": (event) => {
    const epic = epics.value[focused.value];
    if (!epic) return;
    event.preventDefault();
    toggleSelection(epic.id);
  },
  Escape: (event) => {
    if (selectedIds.value.size === 0) return;
    event.preventDefault();
    clearSelection();
  },
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
      <div class="epics-list-actions">
        <a :href="boardHref">board</a>
        <a v-if="showNewLink" :href="newEpicHref">+ new</a>
      </div>
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

    <form
      class="epics-quick-add"
      :data-busy="quickAddBusy ? 'true' : 'false'"
      @submit.prevent="submitQuickAdd"
    >
      <span class="quick-add-glyph" aria-hidden="true">+</span>
      <input
        v-model="quickAddTitle"
        data-smoke="epics-quick-add"
        type="text"
        autocomplete="off"
        :placeholder="quickAddPlaceholder"
        :disabled="quickAddBusy"
        @keydown.esc="onQuickAddEscape"
      />
      <span v-if="quickAddBusy" class="quick-add-status">creating…</span>
      <span
        v-else-if="quickAddProject"
        class="quick-add-chip tone-blue"
        :title="`Stamps projectName = ${quickAddProject} on create`"
      >◇ {{ quickAddProject }}</span>
      <span class="quick-add-hint">
        <kbd>↵</kbd> create · <kbd>esc</kbd> clear · <kbd>c</kbd> focus
      </span>
    </form>
    <p v-if="quickAddError" class="epic-line warn" role="alert">{{ quickAddError }}</p>

    <div
      v-if="selectedIds.size > 0"
      class="epics-bulk-bar"
      data-smoke="epics-bulk-bar"
    >
      <span class="count">{{ selectedIds.size }} selected</span>
      <label class="bulk-reproject">
        <span class="bulk-reproject-label">reproject →</span>
        <select
          class="bulk-reproject-select"
          data-smoke="epics-bulk-reproject"
          :disabled="bulkBusy"
          @change="onBulkReprojectChange"
        >
          <option value="" disabled selected>pick project…</option>
          <option value="__NONE__">— no project —</option>
          <option
            v-for="proj in availableProjects"
            :key="proj.name"
            :value="proj.name ?? ''"
          >◇ {{ proj.name }}</option>
        </select>
      </label>
      <button
        type="button"
        class="bulk-clear"
        :disabled="bulkBusy"
        @click="clearSelection"
      >clear <kbd>esc</kbd></button>
      <span class="hint">
        <kbd>space</kbd> toggle row
      </span>
    </div>
    <p v-if="bulkError" class="epic-line warn" role="alert">{{ bulkError }}</p>

    <p v-if="loadState === 'loading'" class="epic-line muted">Loading epics</p>
    <p v-else-if="loadState === 'error'" class="epic-line warn">{{ error }}</p>
    <p v-else-if="scopedEpics.length === 0" class="epic-line muted">No epics yet.</p>
    <p v-else-if="epics.length === 0" class="epic-line muted">
      No {{ filter.toLowerCase().replace("_", " ") }} epics in scope.
    </p>
    <ul v-else class="epics-list-items" role="listbox" aria-label="Epic list">
      <li
        v-for="(epic, idx) in epics"
        :key="epic.id"
        :class="{
          focused: idx === focused,
          selected: selectedIds.has(epic.id),
        }"
        :aria-selected="selectedIds.has(epic.id)"
        role="option"
        @mouseenter="focused = idx"
      >
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
    <footer v-if="epics.length > 0" class="epics-list-foot">
      <kbd>j</kbd> <kbd>k</kbd> navigate · <kbd>space</kbd> select · <kbd>c</kbd> create
    </footer>
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
  font-family: var(--font-serif, system-ui);
  font-size: 14px;
}

.epics-list-header a,
.epic-line {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.epics-list-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.epics-list-header a {
  color: var(--fg-3, rgba(255,255,255,0.52));
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
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg, #0a0b0e);
  padding: 0 8px;
}

.epics-search input {
  flex: 1;
  border: 0;
  background: transparent;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  padding: 6px 0;
  outline: none;
  color: inherit;
  min-width: 0;
}

.epics-search input::placeholder {
  color: var(--fg-3, rgba(255,255,255,0.52));
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
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.epics-query-chips .query-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border: 0.5px solid currentColor;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.epics-query-chips .query-chip.tone-is {
  color: var(--accent-teal, #087f6f);
}

.epics-query-chips .query-chip.tone-owner {
  color: var(--fg, rgba(255,255,255,0.94));
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
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0;
}

.epics-query-chips .query-chips-hint code {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 0 4px;
  background: var(--bg-2, #0e1014);
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.epics-filter-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
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
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.epics-filter:not(:last-child) {
  border-right: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.epics-filter.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
}

.epics-filter .count {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-variant-numeric: tabular-nums;
}

.epics-filter.active .count {
  color: var(--bg-2, #0e1014);
}

/* Owner filter indicator — mirrors IssuesList's assignee filter
   shape (iter 35). Single dashed-border chip + clear button. */
.epics-owner-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg-2, #0e1014);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  align-self: flex-start;
}

.epics-owner-filter .prefix {
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.epics-owner-filter .active-chip {
  padding: 0 5px;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  color: var(--fg, rgba(255,255,255,0.94));
}

.epics-owner-filter .clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0 2px;
}

.epics-owner-filter .clear:hover {
  color: var(--fg, rgba(255,255,255,0.94));
}

/* Project filter indicator — same shape as owner but blue chip
   matching `.epic-project`. */
.epics-project-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg-2, #0e1014);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  align-self: flex-start;
}

.epics-project-filter .prefix {
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.epics-project-filter .active-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 5px;
  border: 0.5px solid currentColor;
  color: var(--accent-blue, #1d55a6);
}

.epics-project-filter .project-glyph {
  font-size: 10px;
}

.epics-project-filter .clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0 2px;
}

.epics-project-filter .clear:hover {
  color: var(--fg, rgba(255,255,255,0.94));
}

/* iter 70 — inline quick-add. Mirror of the IssuesList iter 17
 * shape: large display title input, mono hint chip, `c` focuses,
 * `Esc` clears. Project chip when one is in scope. */
.epics-quick-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg, #0a0b0e);
  transition: border-color 120ms ease;
}

.epics-quick-add:focus-within {
  border-color: var(--fg, rgba(255,255,255,0.94));
}

.epics-quick-add[data-busy="true"] {
  border-style: dashed;
  opacity: 0.85;
}

.epics-quick-add .quick-add-glyph {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  border: 0.5px solid currentColor;
  border-radius: 2px;
}

.epics-quick-add input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: var(--font-serif, system-ui);
  font-size: 15px;
  outline: none;
  padding: 4px 0;
}

.epics-quick-add input::placeholder {
  color: var(--fg-4, rgba(255,255,255,0.34));
  font-style: italic;
}

.epics-quick-add .quick-add-status {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.epics-quick-add .quick-add-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  padding: 1px 6px;
  border: 0.5px solid currentColor;
  white-space: nowrap;
}

.epics-quick-add .quick-add-chip.tone-blue {
  color: var(--accent-blue, #1d55a6);
}

.epics-quick-add .quick-add-hint {
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  color: var(--fg-4, rgba(255,255,255,0.34));
  white-space: nowrap;
}

.epics-quick-add .quick-add-hint kbd {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  padding: 0 4px;
  margin: 0 1px;
}

.epics-list-items {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* iter 72 — focused / selected row affordances. Same 3px ink
 * inset shadow + paper-tint background as IssuesList iter 51, so
 * the visual vocabulary for "current row" + "in selection" is
 * identical across the two planning queues. */
.epics-list-items > li {
  position: relative;
  transition: background 80ms ease;
}

.epics-list-items > li.focused {
  background: var(--bg-2, #0e1014);
}

.epics-list-items > li.selected {
  box-shadow: inset 3px 0 0 var(--fg, rgba(255,255,255,0.94));
}

.epics-list-items > li.focused.selected {
  box-shadow: inset 3px 0 0 var(--accent-teal, #087f6f);
}

.epics-list-foot {
  margin-top: 8px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0.04em;
}

.epics-list-foot kbd {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  padding: 0 4px;
  margin: 0 1px;
}

/* Bulk action bar — inverted ink-on-paper-tint, same shape as
 * the iter-51 IssuesList bar. Reproject `<select>` matches the
 * iter-71 wire-up exactly. */
.epics-bulk-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.epics-bulk-bar .count {
  font-weight: 600;
}

.epics-bulk-bar .bulk-reproject {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.epics-bulk-bar .bulk-reproject-label {
  color: var(--bg-2, #0e1014);
  letter-spacing: 0.04em;
}

.epics-bulk-bar .bulk-reproject-select {
  border: 0.5px solid var(--bg-2, #0e1014);
  background: transparent;
  color: var(--bg, #0a0b0e);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
  outline: none;
}

.epics-bulk-bar .bulk-reproject-select:disabled {
  opacity: 0.5;
  cursor: wait;
}

.epics-bulk-bar .bulk-reproject-select option {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
}

.epics-bulk-bar .bulk-clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--bg-2, #0e1014);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  cursor: pointer;
  padding: 0 4px;
}

.epics-bulk-bar .bulk-clear kbd {
  margin-left: 4px;
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-size: 10px;
}

.epics-bulk-bar .hint {
  color: var(--bg-2, #0e1014);
  font-size: 10.5px;
  letter-spacing: 0.04em;
}

.epics-bulk-bar .hint kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-size: 10px;
}

.epic-line {
  margin: 4px 0;
}

.muted {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.warn {
  color: var(--err, oklch(70% 0.19 25));
}
</style>
