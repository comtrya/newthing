<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useShortcuts } from "@comtrya/sdk-vue";
import { listIssues, openIssue } from "./api";
import { resolveIssuesPolicy, type IssuesPolicy } from "./policy";
import {
  DEFAULT_WORKSPACE_ID,
  issueHref,
  newIssueHref as newIssueHrefBuilder,
  stateTone,
  type ComtryaGraphQLClient,
  type Issue,
  type IssueState,
  type LoadState,
} from "./types";

const props = withDefaults(defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  issues?: Issue[] | null;
  workspaceId?: string;
  repositoryId?: string | null;
  state?: string | null;
  title?: string;
  showNewLink?: boolean;
  /** Scope listing to this Project; new-issue link stamps it on open. */
  projectName?: string;
}>(), {
  workspaceId: DEFAULT_WORKSPACE_ID,
  repositoryId: null,
  state: null,
  title: "Issues",
  showNewLink: true,
  projectName: undefined,
});

type Filter = "OPEN" | "CLOSED" | "ALL";

const FILTERS: Array<{ id: Filter; label: string; key: string }> = [
  { id: "OPEN", label: "Open", key: "o" },
  // `c` now focuses quick-add (Linear-style create); CLOSED moves to `x`.
  { id: "CLOSED", label: "Closed", key: "x" },
  { id: "ALL", label: "All", key: "a" },
];

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const loaded = ref<Issue[]>(props.issues ?? []);
const filter = ref<Filter>("OPEN");
const search = ref("");
const focused = ref(0);

// Quick-add (Linear-style) — projectName scope auto-stamps policy from CUE.
const quickAddTitle = ref("");
const quickAddBusy = ref(false);
const quickAddError = ref<string | null>(null);
const quickAddPolicy = ref<IssuesPolicy>({ defaultLabels: [], closeOnMerge: null, ownerRefs: [] });
const quickAddPolicyResolved = ref(false);

const issues = computed(() => {
  const all = props.issues ?? loaded.value;
  if (!props.projectName) return all;
  return all.filter((issue) => issue.projectName === props.projectName);
});
const graphClient = computed(() => props.client ?? props.comtryaClient);
const newIssueHref = computed(() => {
  const base = newIssueHrefBuilder();
  const params = new URLSearchParams({ workspaceId: props.workspaceId });
  if (props.repositoryId) params.set("repositoryId", props.repositoryId);
  if (props.projectName) params.set("projectName", props.projectName);
  return `${base}?${params.toString()}`;
});

const matchesFilter = (issue: Issue, f: Filter): boolean => {
  if (f === "ALL") return true;
  if (f === "OPEN") return issue.state === "OPEN" || issue.state === "REOPENED";
  return issue.state === "CLOSED";
};

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return issues.value
    .filter((issue) => matchesFilter(issue, filter.value))
    .filter((issue) => {
      if (!q) return true;
      const author = (issue.authorRef ?? "").split("/").pop() ?? "";
      const haystack = `${issue.number} ${issue.title} ${author}`.toLowerCase();
      return haystack.includes(q);
    });
});

const quickAddPlaceholder = computed(() => {
  if (props.projectName) return `New issue in ${props.projectName}…`;
  return "New issue…";
});

const counts = computed(() => {
  const out: Record<Filter, number> = { OPEN: 0, CLOSED: 0, ALL: issues.value.length };
  for (const issue of issues.value) {
    if (issue.state === "OPEN" || issue.state === "REOPENED") out.OPEN += 1;
    if (issue.state === "CLOSED") out.CLOSED += 1;
  }
  return out;
});

function authorLabel(authorRef: string | null | undefined): {
  label: string;
  glyph: string;
  kind: "human" | "agent" | "credential" | "bot" | "team" | "unknown";
} {
  if (!authorRef) return { label: "unknown", glyph: "·", kind: "unknown" };
  const stripped = authorRef.replace(/^comtrya:\/\//, "");
  const [scheme = "", ...rest] = stripped.split("/");
  const id = rest.join("/") || authorRef;
  if (scheme === "agent") return { label: id, glyph: "✦", kind: "agent" };
  if (scheme === "bot") return { label: id, glyph: "◆", kind: "bot" };
  if (scheme === "credential") return { label: id, glyph: "⚙", kind: "credential" };
  if (scheme === "team") return { label: id, glyph: "◇", kind: "team" };
  if (scheme === "user") return { label: id, glyph: id.slice(0, 1).toUpperCase(), kind: "human" };
  return { label: id, glyph: id.slice(0, 1).toUpperCase() || "·", kind: "unknown" };
}

function relativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return value;
  const diff = Math.max(0, Date.now() - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / week)}w ago`;
}

/**
 * URL-persisted filter + search state.
 *
 * Lets `/x/issues/?state=closed&q=auth` and
 * `/r/comtrya/dogfood/p/kernel?state=closed` be shareable
 * filtered views. On mount we read the current URL once and
 * apply; on subsequent filter/search changes we write back via
 * `history.replaceState` (no history pollution — pressing back
 * still takes the user one logical hop up, not through every
 * letter typed in the search box).
 *
 * popstate listener re-syncs from the URL when the user uses
 * browser back/forward across saved filter URLs.
 */
const URL_FILTER_VALUES = new Set<Filter>(["OPEN", "CLOSED", "ALL"]);

function readUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const rawState = (params.get("state") ?? "").toUpperCase();
  if (URL_FILTER_VALUES.has(rawState as Filter)) {
    filter.value = rawState as Filter;
  }
  const rawQ = params.get("q");
  if (rawQ !== null) search.value = rawQ;
}

function writeUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  // OPEN is the default — keep it out of the URL so a clean
  // "/x/issues/" link stays clean.
  if (filter.value === "OPEN") params.delete("state");
  else params.set("state", filter.value);
  const trimmed = search.value.trim();
  if (trimmed) params.set("q", trimmed);
  else params.delete("q");
  const next = params.toString();
  const target = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`;
  if (target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", target);
  }
}

let suppressUrlWrite = false;

onMounted(() => {
  suppressUrlWrite = true;
  readUrlState();
  suppressUrlWrite = false;
  void load();
  void loadPolicy();
  window.addEventListener("popstate", onPopState);
});

onUnmounted(() => {
  window.removeEventListener("popstate", onPopState);
});

function onPopState(): void {
  suppressUrlWrite = true;
  readUrlState();
  nextTick(() => {
    suppressUrlWrite = false;
  });
}

watch([filter, search], () => {
  if (suppressUrlWrite) return;
  writeUrlState();
});

// Library-driven keybindings. tinykeys skips edit fields by default,
// so j/k/Enter/'/'/c/o/x/a only fire outside inputs — which is the
// behaviour we want. Escape inside an input is handled by the input's
// own `@keydown.esc` so it can branch on which input is focused.
const filterShortcuts = Object.fromEntries(
  FILTERS.map((f) => [
    f.key,
    (event: KeyboardEvent) => {
      event.preventDefault();
      filter.value = f.id;
    },
  ]),
);

useShortcuts({
  j: (event) => {
    event.preventDefault();
    focused.value = Math.min(focused.value + 1, Math.max(0, filtered.value.length - 1));
  },
  ArrowDown: (event) => {
    event.preventDefault();
    focused.value = Math.min(focused.value + 1, Math.max(0, filtered.value.length - 1));
  },
  k: (event) => {
    event.preventDefault();
    focused.value = Math.max(focused.value - 1, 0);
  },
  ArrowUp: (event) => {
    event.preventDefault();
    focused.value = Math.max(focused.value - 1, 0);
  },
  Enter: (event) => {
    const issue = filtered.value[focused.value];
    if (!issue) return;
    event.preventDefault();
    window.location.href = issueHref(issue);
  },
  "/": (event) => {
    event.preventDefault();
    document.querySelector<HTMLInputElement>("[data-issues-search]")?.focus();
  },
  c: (event) => {
    event.preventDefault();
    focusQuickAdd();
  },
  ...filterShortcuts,
});

function onSearchEscape(event: KeyboardEvent): void {
  if (!search.value) return;
  event.preventDefault();
  search.value = "";
}

function onQuickAddEscape(event: KeyboardEvent): void {
  event.preventDefault();
  quickAddTitle.value = "";
  quickAddError.value = null;
  (event.target as HTMLInputElement | null)?.blur();
}

watch(
  () => [graphClient.value, props.issues, props.workspaceId, props.repositoryId, props.state],
  () => void load(),
);

watch(() => props.projectName, () => void loadPolicy());

watch(filtered, (next) => {
  if (focused.value >= next.length) focused.value = Math.max(0, next.length - 1);
});

async function loadPolicy(): Promise<void> {
  if (!props.projectName) {
    quickAddPolicy.value = { defaultLabels: [], closeOnMerge: null, ownerRefs: [] };
    quickAddPolicyResolved.value = true;
    return;
  }
  quickAddPolicy.value = await resolveIssuesPolicy(props.projectName, "location");
  quickAddPolicyResolved.value = true;
}

async function load(): Promise<void> {
  if (props.issues) {
    loaded.value = props.issues;
    loadState.value = props.issues.length > 0 ? "ready" : "empty";
    error.value = null;
    return;
  }
  if (!graphClient.value) {
    loaded.value = [];
    loadState.value = "error";
    error.value = "issues: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    const list = await listIssues(graphClient.value, {
      workspaceId: props.workspaceId,
      repositoryId: props.repositoryId,
      state: props.state,
    });
    loaded.value = list;
    loadState.value = list.length > 0 ? "ready" : "empty";
  } catch (caught) {
    loaded.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function focusQuickAdd(): void {
  document.querySelector<HTMLInputElement>("[data-smoke=\"issues-quick-add\"]")?.focus();
}

async function submitQuickAdd(): Promise<void> {
  const title = quickAddTitle.value.trim();
  if (!title || quickAddBusy.value) return;
  quickAddBusy.value = true;
  quickAddError.value = null;
  try {
    const created = await openIssue({
      workspaceId: props.workspaceId,
      repositoryId: props.repositoryId,
      projectName: props.projectName ?? null,
      title,
      bodyMarkdown: "",
      labels: quickAddPolicy.value.defaultLabels,
      closeOnMerge: quickAddPolicy.value.closeOnMerge,
      assignees: quickAddPolicy.value.ownerRefs,
    });
    // Optimistic-merge: prepend if not already present (server may
    // be slightly behind on cross-list reads).
    if (!loaded.value.some((i) => i.id === created.id)) {
      loaded.value = [created, ...loaded.value];
    }
    quickAddTitle.value = "";
    loadState.value = "ready";
    // Refresh from server to settle any state we missed (e.g. another
    // tab opened an issue in parallel).
    void load();
    void nextTick(focusQuickAdd);
  } catch (caught) {
    quickAddError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    quickAddBusy.value = false;
  }
}
</script>

<template>
  <section class="issues-queue" data-smoke="issues-list">
    <header class="issues-queue-head">
      <div class="head-row">
        <h2>{{ title }}</h2>
        <a v-if="showNewLink" :href="newIssueHref" class="issues-new">+ new</a>
      </div>
      <div class="issues-controls">
        <div class="issues-filter-row" role="tablist" aria-label="Filter issues by state">
          <button
            v-for="f in FILTERS"
            :key="f.id"
            type="button"
            role="tab"
            :aria-selected="filter === f.id"
            :class="['issues-filter', { active: filter === f.id }]"
            @click="filter = f.id"
          >
            <span>{{ f.label }}</span>
            <span class="count">{{ counts[f.id] }}</span>
            <kbd>{{ f.key }}</kbd>
          </button>
        </div>
        <label class="issues-search">
          <input
            data-issues-search
            v-model="search"
            type="search"
            placeholder="Filter by title or author"
            autocomplete="off"
            @keydown.esc="onSearchEscape"
          />
          <kbd>/</kbd>
        </label>
      </div>
    </header>

    <form
      class="issues-quick-add"
      :data-busy="quickAddBusy ? 'true' : 'false'"
      @submit.prevent="submitQuickAdd"
    >
      <span class="quick-add-glyph" aria-hidden="true">+</span>
      <input
        v-model="quickAddTitle"
        data-smoke="issues-quick-add"
        type="text"
        autocomplete="off"
        :placeholder="quickAddPlaceholder"
        :disabled="quickAddBusy"
        @keydown.esc="onQuickAddEscape"
      />
      <span v-if="quickAddBusy" class="quick-add-status">opening…</span>
      <span
        v-else-if="quickAddPolicy.defaultLabels.length > 0"
        class="quick-add-chip tone-teal"
        :title="`Labels will be pre-stamped: ${quickAddPolicy.defaultLabels.join(', ')}`"
      >
        labels · {{ quickAddPolicy.defaultLabels.join(", ") }}
      </span>
      <span
        v-if="quickAddPolicy.closeOnMerge === false"
        class="quick-add-chip tone-yellow"
        title="closeOnMerge=false — opt-out from PR auto-close reactor"
      >closeOnMerge · off</span>
      <span
        v-if="quickAddPolicy.ownerRefs.length > 0"
        class="quick-add-chip tone-teal"
        :title="`Assigned on create: ${quickAddPolicy.ownerRefs.join(', ')}`"
      >→ {{ quickAddPolicy.ownerRefs.map((r) => r.split('/').pop()).join(' · ') }}</span>
      <span class="quick-add-hint">
        <kbd>↵</kbd> create · <kbd>esc</kbd> clear · <kbd>c</kbd> focus
      </span>
    </form>
    <p
      v-if="quickAddError"
      class="quick-add-error"
      role="alert"
    >{{ quickAddError }}</p>

    <p v-if="loadState === 'loading'" class="muted">Loading issues…</p>
    <p v-else-if="loadState === 'error'" class="muted error" role="alert">{{ error }}</p>
    <p v-else-if="issues.length === 0" class="muted">
      No issues yet. <a :href="newIssueHref">Create one</a> to get started.
    </p>
    <p v-else-if="filtered.length === 0" class="muted">
      No issues match the current filter.
    </p>

    <ol v-else class="issues-list" role="listbox" aria-label="Issue list">
      <li
        v-for="(issue, index) in filtered"
        :key="issue.id"
        :class="['issues-row', { focused: index === focused }]"
        role="option"
        :aria-selected="index === focused"
        @mouseenter="focused = index"
      >
        <a :href="issueHref(issue)" class="issues-row-link">
          <span class="issues-row-number">#{{ issue.number }}</span>
          <span class="issues-row-body">
            <span class="issues-row-title">{{ issue.title }}</span>
            <span class="issues-row-meta">
              <span :class="['issue-state', stateTone(issue.state).className]">
                {{ stateTone(issue.state).label }}
              </span>
              <span
                v-if="issue.projectName"
                class="issue-project"
                :title="`Scoped to project ${issue.projectName}`"
              >
                <span class="project-glyph">◇</span>
                {{ issue.projectName }}
              </span>
              <span
                v-for="label in (issue.labels ?? [])"
                :key="label"
                class="issue-label"
              >{{ label }}</span>
              <span
                v-for="ref in (issue.assignees ?? [])"
                :key="`assignee-${ref}`"
                class="issue-assignee"
                :data-author-kind="authorLabel(ref).kind"
                :title="ref"
              >
                <span class="author-glyph">{{ authorLabel(ref).glyph }}</span>
                {{ authorLabel(ref).label }}
              </span>
              <span
                v-if="issue.authorRef"
                class="issue-author"
                :data-author-kind="authorLabel(issue.authorRef).kind"
              >
                <span class="author-glyph">{{ authorLabel(issue.authorRef).glyph }}</span>
                {{ authorLabel(issue.authorRef).label }}
                <span
                  v-if="authorLabel(issue.authorRef).kind === 'agent'"
                  class="author-badge"
                >agent</span>
                <span
                  v-else-if="authorLabel(issue.authorRef).kind === 'credential'"
                  class="author-badge"
                >bot</span>
                <span
                  v-else-if="authorLabel(issue.authorRef).kind === 'bot'"
                  class="author-badge"
                >bot</span>
              </span>
            </span>
          </span>
          <span class="issues-row-age">{{ relativeTime(issue.createdAt) }}</span>
        </a>
      </li>
    </ol>

    <footer class="issues-foot">
      <span>
        <kbd>j</kbd> <kbd>k</kbd> navigate · <kbd>↵</kbd> open ·
        <kbd>/</kbd> search · <kbd>c</kbd> create ·
        <kbd>o</kbd> open <kbd>x</kbd> closed <kbd>a</kbd> all
      </span>
    </footer>
  </section>
</template>

<style scoped>
.issues-queue {
  display: grid;
  gap: 14px;
  font-family: var(--sans, system-ui);
  color: var(--ink, #111);
}

.issues-queue-head {
  display: grid;
  gap: 12px;
}

.head-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.issues-queue-head h2 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 22px;
  line-height: 1;
}

.issues-new {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
  text-decoration: none;
  border: 1.5px solid var(--ink, #111);
  padding: 6px 12px;
}

.issues-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.issues-quick-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  border: 1.5px solid var(--rule-light, #d8d1c4);
  background: var(--paper, #fffdf8);
  transition: border-color 120ms ease;
}

.issues-quick-add:focus-within {
  border-color: var(--ink, #111);
}

.issues-quick-add[data-busy="true"] {
  border-style: dashed;
  opacity: 0.85;
}

.quick-add-glyph {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-family: var(--mono, monospace);
  font-size: 13px;
  color: var(--ink-faint, #68645c);
  border: 1px solid currentColor;
  border-radius: 2px;
}

.issues-quick-add input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: var(--display, system-ui);
  font-size: 15px;
  outline: none;
  padding: 4px 0;
}

.issues-quick-add input::placeholder {
  color: var(--ink-fainter, #918b80);
  font-style: italic;
}

.quick-add-status {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.quick-add-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  padding: 1px 6px;
  border: 1px solid currentColor;
  white-space: nowrap;
}

.quick-add-chip.tone-teal {
  color: var(--accent-teal, #087f6f);
}

.quick-add-chip.tone-yellow {
  color: var(--accent-yellow, #c89300);
}

.quick-add-hint {
  font-family: var(--mono, monospace);
  font-size: 10.5px;
  color: var(--ink-fainter, #918b80);
  white-space: nowrap;
}

.quick-add-hint kbd {
  border: 1px solid currentColor;
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
}

.quick-add-error {
  margin: -6px 0 0;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--accent-err, #c9341c);
}

.issues-filter-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  border: 1.5px solid var(--ink, #111);
}

.issues-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.issues-filter:not(:last-child) {
  border-right: 1px solid var(--rule-light, #d8d1c4);
}

.issues-filter.active {
  background: var(--ink, #111);
  color: var(--paper, #fffdf8);
}

.issues-filter .count {
  color: var(--ink-faint, #68645c);
  font-variant-numeric: tabular-nums;
}

.issues-filter.active .count {
  color: var(--paper-tint, #f2efe7);
}

.issues-filter kbd {
  border: 1px solid currentColor;
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
  opacity: 0.6;
}

.issues-search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid var(--ink, #111);
  padding: 4px 10px;
  min-width: 240px;
  flex: 1 1 240px;
  max-width: 420px;
}

.issues-search input {
  flex: 1;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  outline: none;
  min-width: 0;
}

.issues-search kbd {
  border: 1px solid var(--ink, #111);
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--ink-faint, #68645c);
}

.muted {
  font-family: var(--mono, monospace);
  font-size: 13px;
  color: var(--ink-faint, #68645c);
  padding: 18px 0;
  border-top: 1.5px solid var(--rule-light, #d8d1c4);
}

.muted.error {
  color: var(--accent-err, #c9341c);
}

.issues-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  border-top: 1.5px solid var(--ink, #111);
}

.issues-row {
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.issues-row.focused {
  background: var(--paper-tint, #f2efe7);
}

.issues-row-link {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 12px 12px 12px 6px;
  color: inherit;
  text-decoration: none;
}

.issues-row-link:hover {
  text-decoration: none;
  background: var(--paper-tint, #f2efe7);
}

.issues-row-number {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.issues-row-body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.issues-row-title {
  font-family: var(--display, system-ui);
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issues-row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.issue-state {
  border: 1px solid currentColor;
  padding: 0 6px;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.issue-state.issue-state-open {
  color: var(--accent-teal, #087f6f);
}

.issue-state.issue-state-closed {
  color: var(--accent-blue, #1d55a6);
}

.issue-project {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--accent-blue, #1d55a6);
  border: 1px solid currentColor;
  padding: 0 6px;
}

.issue-project .project-glyph {
  font-size: 10px;
}

.issue-label {
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--accent-teal, #087f6f);
  border: 1px solid currentColor;
  padding: 0 5px;
  letter-spacing: 0.02em;
}

.issue-author {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.issue-author .author-glyph {
  width: 14px;
  height: 14px;
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid currentColor;
  color: var(--ink-faint, #68645c);
}

.issue-author[data-author-kind="agent"] {
  color: #6b3fa0;
}

.issue-author[data-author-kind="credential"] {
  color: var(--accent-yellow, #c89300);
}

.issue-author[data-author-kind="bot"] {
  color: var(--accent-blue, #1d55a6);
}

.issue-author .author-badge {
  border: 1px solid currentColor;
  padding: 0 4px;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/**
 * Assignee chips. Mirror the author classifier glyphs/colours so
 * an `agent` assignee reads as the same colour family as an
 * `agent` author, but use a tighter / less prominent shape so a
 * row with two assignees + an author doesn't overload the meta
 * strip.
 */
.issue-assignee {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  padding: 0 5px;
  border: 1px dashed currentColor;
  color: var(--ink-soft, #2c2b28);
  cursor: help;
}

.issue-assignee .author-glyph {
  width: 12px;
  height: 12px;
  display: inline-grid;
  place-items: center;
  font-size: 9px;
  font-weight: 700;
  border: 0;
  color: inherit;
}

.issue-assignee[data-author-kind="agent"]      { color: #6b3fa0; }
.issue-assignee[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }
.issue-assignee[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.issue-assignee[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }

.issues-row-age {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
  white-space: nowrap;
}

.issues-foot {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.issues-foot kbd {
  border: 1px solid currentColor;
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
}
</style>
