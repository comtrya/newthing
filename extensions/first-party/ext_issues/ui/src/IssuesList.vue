<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  classifyPrincipal as authorLabel,
  fetchComtryaProjects,
  LabelPill,
  parseQueryFilters,
  useShortcuts,
  type ComtryaProject,
  type LabelCatalog,
} from "@comtrya/sdk-vue";
import {
  assignIssueProject,
  closeIssue,
  listIssues,
  openIssue,
} from "./api";
import { resolveIssuesPolicy, type IssuesPolicy } from "./policy";
import {
  defaultWorkspaceId,
  issueHref,
  newIssueHref as newIssueHrefBuilder,
  stateTone,
  type ComtryaGraphQLClient,
  type ExtensionRouteParams,
  type Issue,
  type IssueState,
  type LoadState,
} from "./types";
import { issueRouteContext } from "./route-context";

const props = withDefaults(defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  issues?: Issue[] | null;
  workspaceId?: string;
  repositoryId?: string | null;
  repositorySegments?: string[];
  routeParams?: ExtensionRouteParams;
  state?: string | null;
  title?: string;
  showNewLink?: boolean;
  /** Scope listing to this Project; new-issue link stamps it on open. */
  projectName?: string;
  /** Active repo's label catalog (see IssueDetail for details). */
  labelCatalog?: LabelCatalog | null;
}>(), {
  workspaceId: defaultWorkspaceId(),
  repositoryId: null,
  state: null,
  title: "Issues",
  showNewLink: true,
  projectName: undefined,
  labelCatalog: null,
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

/**
 * Active assignee filter — a canonical `comtrya://` URN or empty.
 * Set by clicking an assignee chip on a row, cleared via the
 * controls-row clear button. URL-synced as `?assignee=<urn>` so
 * `/x/issues/?assignee=comtrya://user/rawkode` is a shareable
 * "what's on rawkode's plate" view.
 */
const assigneeFilter = ref("");

/**
 * Active project filter — a CUE Project name, or empty. URL-synced
 * as `?project=<name>` so `/x/issues/?project=kernel` is a
 * shareable "everything scoped to the kernel project" view.
 *
 * Skipped when `props.projectName` is already set (i.e. the list
 * is mounted on a project page — the prop wins). At `/x/issues/`
 * the filter is set by clicking a row's project chip.
 */
const projectFilter = ref("");

/**
 * Bulk selection — Linear pattern. Space toggles the focused
 * row's id in this Set. When non-empty, the floating action bar
 * appears with count + bulk close. Esc clears the selection.
 * Closed issues are dropped from the selection automatically
 * once the bulk action returns.
 */
const selectedIds = ref<Set<string>>(new Set());
const bulkBusy = ref(false);
const bulkError = ref<string | null>(null);
const locationSearch = ref(typeof window === "undefined" ? "" : window.location.search);

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

async function closeSelected(): Promise<void> {
  if (selectedIds.value.size === 0 || bulkBusy.value) return;
  if (!graphClient.value) return;
  const client = graphClient.value;
  const ids = Array.from(selectedIds.value);
  bulkBusy.value = true;
  bulkError.value = null;
  try {
    const results = await Promise.allSettled(
      ids.map((id) => closeIssue(client, id)),
    );
    // Optimistic local update — replace closed issues in `loaded`
    // with their new state. Failures stay in selection so the
    // user can retry.
    const successById = new Map<string, Issue>();
    const failed = new Set<string>();
    results.forEach((result, idx) => {
      const id = ids[idx]!;
      if (result.status === "fulfilled") successById.set(id, result.value);
      else failed.add(id);
    });
    loaded.value = loaded.value.map((issue) =>
      successById.get(issue.id) ?? issue,
    );
    selectedIds.value = failed;
    if (failed.size > 0) {
      bulkError.value = `${failed.size} of ${ids.length} close calls failed; retry the remaining selection.`;
    }
  } catch (caught) {
    bulkError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    bulkBusy.value = false;
  }
}

/**
 * Bulk reproject — assign (or clear) the Project on every
 * selected issue in one pass. Compounds iter 51 (bulk close) +
 * iter 68 (assign-project op) so a team can drag a batch of
 * untagged issues into their right Project from the queue
 * canvas. Mirrors `closeSelected`: Promise.allSettled, optimistic
 * local update, failures stay in `selectedIds` for retry.
 *
 * Triggered from the bulk action bar's `<select>`. Loading
 * `availableProjects` happens once on mount; until that resolves
 * the picker just shows "(no project)" so the user can at least
 * unscope a selection.
 */
const availableProjects = ref<ComtryaProject[]>([]);

onMounted(async () => {
  try {
    availableProjects.value = await fetchComtryaProjects(props.repositorySegments);
  } catch {
    availableProjects.value = [];
  }
});

async function reprojectSelected(projectName: string | null): Promise<void> {
  if (selectedIds.value.size === 0 || bulkBusy.value) return;
  const ids = Array.from(selectedIds.value);
  bulkBusy.value = true;
  bulkError.value = null;
  try {
    const results = await Promise.allSettled(
      ids.map((id) => assignIssueProject(id, projectName)),
    );
    const successById = new Map<string, Issue>();
    const failed = new Set<string>();
    results.forEach((result, idx) => {
      const id = ids[idx]!;
      if (result.status === "fulfilled") successById.set(id, result.value);
      else failed.add(id);
    });
    // Optimistic local update — patch each updated issue in
    // place so the row's project chip flips immediately.
    loaded.value = loaded.value.map((issue) =>
      successById.get(issue.id) ?? issue,
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
  // Sentinel for the "no project" option — distinguishes the
  // "clear scope" verb from the placeholder option's empty
  // string, which isn't actionable.
  const projectName = raw === "__NONE__" ? null : raw || null;
  // Reset the select so a repeat-pick of the same value still
  // fires a change event next time. The actual stamped value
  // lives on the issues, not on the picker control.
  target.value = "";
  if (raw === "") return;
  void reprojectSelected(projectName);
}

// Quick-add (Linear-style) — projectName scope auto-stamps policy from CUE.
const quickAddTitle = ref("");
const quickAddBusy = ref(false);
const quickAddError = ref<string | null>(null);
const quickAddPolicy = ref<IssuesPolicy>({ defaultLabels: [], closeOnMerge: null, ownerRefs: [] });
const quickAddPolicyResolved = ref(false);

const issues = computed(() => {
  const all = props.issues ?? loaded.value;
  const projectName = effectiveProjectName.value;
  if (!projectName) return all;
  return all.filter((issue) => issue.projectName === projectName);
});
const graphClient = computed(() => props.client ?? props.comtryaClient);
const routeContext = computed(() =>
  issueRouteContext(
    {
      workspaceId: props.workspaceId,
      repositoryId: props.repositoryId,
      repositorySegments: props.repositorySegments,
      routeParams: props.routeParams,
      projectName: props.projectName,
      state: props.state,
    },
    locationSearch.value,
  ),
);
const effectiveWorkspaceId = computed(() => routeContext.value.workspaceId);
const effectiveRepositoryId = computed(() => routeContext.value.repositoryId ?? null);
const effectiveProjectName = computed(() => routeContext.value.projectName ?? null);
const effectiveRouteState = computed(() => routeContext.value.state ?? null);
const newIssueHref = computed(() => {
  const base = newIssueHrefBuilder();
  const params = new URLSearchParams({ workspaceId: effectiveWorkspaceId.value });
  if (effectiveRepositoryId.value) params.set("repositoryId", effectiveRepositoryId.value);
  if (effectiveProjectName.value) params.set("projectName", effectiveProjectName.value);
  return `${base}?${params.toString()}`;
});

const matchesFilter = (issue: Issue, f: Filter): boolean => {
  if (f === "ALL") return true;
  if (f === "OPEN") return issue.state === "OPEN" || issue.state === "REOPENED";
  return issue.state === "CLOSED";
};

/**
 * Linear-style filter syntax inside the search input. Uses the
 * shared `parseQueryFilters` (iter 55) with the issues-specific
 * vocabulary: `is:` (state), `assignee:` (assignee URN),
 * `project:` (Project name from CUE). The recognised key list
 * stays small on purpose — every new token is one extra branch
 * below and one extra entry in the chip strip.
 *
 * Compose with the URL-pinned refs: a token always overrides
 * the corresponding chip ref for the duration of the search.
 * `project:kernel` typed in the input is equivalent to clicking
 * the kernel project chip but doesn't mutate `projectFilter.value`
 * itself, so clearing the search restores the prior chip state.
 */
const ISSUES_FILTER_KEYS = ["is", "assignee", "project"] as const;

const STATE_TOKEN_TO_FILTER: Record<string, Filter> = {
  open: "OPEN",
  closed: "CLOSED",
  reopened: "OPEN",
  all: "ALL",
};

const parsedQuery = computed(() =>
  parseQueryFilters(search.value, ISSUES_FILTER_KEYS),
);

const effectiveStateFilter = computed<Filter>(() => {
  for (const token of parsedQuery.value.filters.is ?? []) {
    const mapped = STATE_TOKEN_TO_FILTER[token.toLowerCase()];
    if (mapped) return mapped;
  }
  return filter.value;
});

const effectiveAssigneeFilter = computed<string>(() => {
  for (const token of parsedQuery.value.filters.assignee ?? []) {
    if (token.startsWith("comtrya://")) return token;
  }
  return assigneeFilter.value;
});

const effectiveProjectFilter = computed<string>(() => {
  // Prop wins regardless of input: mounted on a project page,
  // the list is already scoped and a `project:` token would be
  // contradictory.
  if (effectiveProjectName.value) return "";
  for (const token of parsedQuery.value.filters.project ?? []) {
    if (token.trim()) return token.trim();
  }
  return projectFilter.value;
});

/**
 * Default ordering: most recently touched first. Falls back through
 * `updatedAt → createdAt → number` so a freshly-opened batch (where
 * every issue shares the same second-resolution timestamp) still
 * ranks the highest number first instead of looking randomly
 * ordered. Mirrors PullsQueue's sort so the two queues read the
 * same way.
 */
function recencyKey(issue: Issue): number {
  const updated = Date.parse(issue.updatedAt ?? "") || 0;
  if (updated) return updated;
  const created = Date.parse(issue.createdAt ?? "") || 0;
  return created;
}

const filtered = computed(() => {
  const q = parsedQuery.value.text.trim().toLowerCase();
  const assignee = effectiveAssigneeFilter.value;
  const project = effectiveProjectFilter.value;
  const state = effectiveStateFilter.value;
  return issues.value
    .filter((issue) => matchesFilter(issue, state))
    .filter((issue) => {
      if (!project) return true;
      return issue.projectName === project;
    })
    .filter((issue) => {
      if (!assignee) return true;
      return (issue.assignees ?? []).includes(assignee);
    })
    .filter((issue) => {
      if (!q) return true;
      const author = (issue.authorRef ?? "").split("/").pop() ?? "";
      const haystack = `${issue.number} ${issue.title} ${author}`.toLowerCase();
      return haystack.includes(q);
    })
    .slice()
    .sort((a, b) => {
      const diff = recencyKey(b) - recencyKey(a);
      if (diff !== 0) return diff;
      return (b.number ?? 0) - (a.number ?? 0);
    });
});

interface QueueFilterChip {
  key: string;
  value: string;
  label: string;
  tone: "is" | "assignee" | "project" | "unknown";
}

const queueFilterChips = computed<QueueFilterChip[]>(() => {
  const chips: QueueFilterChip[] = [];
  for (const token of parsedQuery.value.filters.is ?? []) {
    const mapped = STATE_TOKEN_TO_FILTER[token.toLowerCase()];
    chips.push({
      key: "is",
      value: token,
      label: mapped ? `is · ${mapped.toLowerCase()}` : `is · ${token}`,
      tone: "is",
    });
  }
  for (const token of parsedQuery.value.filters.assignee ?? []) {
    const cls = authorLabel(token);
    chips.push({
      key: "assignee",
      value: token,
      label: `→ ${cls.label}`,
      tone: "assignee",
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

function toggleAssigneeFilter(ref: string): void {
  if (assigneeFilter.value === ref) {
    assigneeFilter.value = "";
  } else {
    assigneeFilter.value = ref;
  }
}

function clearAssigneeFilter(): void {
  assigneeFilter.value = "";
}

function toggleProjectFilter(name: string): void {
  if (projectFilter.value === name) {
    projectFilter.value = "";
  } else {
    projectFilter.value = name;
  }
}

function clearProjectFilter(): void {
  projectFilter.value = "";
}

const quickAddPlaceholder = computed(() => {
  const projectName = effectiveProjectName.value;
  if (projectName) return `New issue in ${projectName}…`;
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

// `authorLabel` was an inline classifier duplicate; iter 62
// re-routes to the canonical `@comtrya/sdk-vue::classifyPrincipal`
// imported above as `authorLabel`.

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
 * Tooltip for the row's age column. When the issue was touched after
 * it was opened (kernel restamps `updatedAt` on every state change),
 * surface both timestamps in plain text so a triager can tell stale
 * work from active work without leaving the list.
 */
function ageTooltip(issue: Issue): string {
  const created = issue.createdAt ?? null;
  const updated = issue.updatedAt ?? null;
  if (!updated || updated === created) {
    return created ? `opened ${created}` : "";
  }
  const lines: string[] = [];
  if (created) lines.push(`opened ${created}`);
  lines.push(`updated ${updated}`);
  return lines.join("\n");
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
  const rawAssignee = params.get("assignee") ?? "";
  // Only accept canonical comtrya:// URNs — guards against junk
  // sneaking in via crafted URLs.
  assigneeFilter.value = rawAssignee.startsWith("comtrya://") ? rawAssignee : "";
  const rawProject = params.get("project") ?? "";
  // Accept slug-ish identifiers (project names in CUE are
  // `string`-typed without further constraint, but the URL should
  // not become a vector for HTML). Strip anything that's not a
  // safe identifier character.
  projectFilter.value = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(rawProject) ? rawProject : "";
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
  if (assigneeFilter.value) params.set("assignee", assigneeFilter.value);
  else params.delete("assignee");
  // Skip writing `?project=` when the list is project-scoped via
  // its prop — the project comes from the route already.
  if (projectFilter.value && !effectiveProjectName.value) params.set("project", projectFilter.value);
  else params.delete("project");
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
  locationSearch.value = window.location.search;
  readUrlState();
  nextTick(() => {
    suppressUrlWrite = false;
  });
}

watch([filter, search, assigneeFilter, projectFilter], () => {
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
  " ": (event) => {
    const issue = filtered.value[focused.value];
    if (!issue) return;
    event.preventDefault();
    toggleSelection(issue.id);
  },
  Escape: (event) => {
    if (selectedIds.value.size === 0) return;
    event.preventDefault();
    clearSelection();
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
  () => [
    graphClient.value,
    props.issues,
    effectiveWorkspaceId.value,
    effectiveRepositoryId.value,
    effectiveRouteState.value,
  ],
  () => void load(),
);

watch(effectiveProjectName, () => void loadPolicy());

watch(filtered, (next) => {
  if (focused.value >= next.length) focused.value = Math.max(0, next.length - 1);
});

async function loadPolicy(): Promise<void> {
  const projectName = effectiveProjectName.value;
  if (!projectName) {
    quickAddPolicy.value = { defaultLabels: [], closeOnMerge: null, ownerRefs: [] };
    quickAddPolicyResolved.value = true;
    return;
  }
  quickAddPolicy.value = await resolveIssuesPolicy(projectName, "location");
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
      workspaceId: effectiveWorkspaceId.value,
      repositoryId: effectiveRepositoryId.value,
      state: effectiveRouteState.value,
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
      workspaceId: effectiveWorkspaceId.value,
      repositoryId: effectiveRepositoryId.value,
      projectName: effectiveProjectName.value,
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
            placeholder="Filter — try is:open · project:&lt;name&gt; · assignee:&lt;urn&gt; · text"
            autocomplete="off"
            @keydown.esc="onSearchEscape"
          />
          <kbd>/</kbd>
        </label>
      </div>
      <div
        v-if="queueFilterChips.length > 0"
        class="issues-query-chips"
        data-smoke="issues-query-chips"
        aria-label="Parsed search filters"
      >
        <span
          v-for="chip in queueFilterChips"
          :key="`${chip.key}:${chip.value || 'unknown'}`"
          :class="['query-chip', `tone-${chip.tone}`]"
          :title="chip.tone === 'unknown' ? `Unknown filter key: ${chip.key}` : chip.value"
        >{{ chip.label }}</span>
        <span class="query-chips-hint">
          syntax: <code>is:open</code> · <code>project:&lt;name&gt;</code> · <code>assignee:&lt;urn&gt;</code>
        </span>
      </div>

      <div
        v-if="assigneeFilter"
        class="issues-assignee-filter"
        data-smoke="issues-assignee-filter"
      >
        <span class="prefix">assigned to</span>
        <span
          class="active-chip"
          :data-author-kind="authorLabel(assigneeFilter).kind"
          :title="assigneeFilter"
        >
          <span class="author-glyph">{{ authorLabel(assigneeFilter).glyph }}</span>
          {{ authorLabel(assigneeFilter).label }}
        </span>
        <button type="button" class="clear" @click="clearAssigneeFilter" aria-label="Clear assignee filter">
          clear ✕
        </button>
      </div>
      <div
        v-if="projectFilter && !effectiveProjectName"
        class="issues-project-filter"
        data-smoke="issues-project-filter"
      >
        <span class="prefix">project</span>
        <span class="active-chip" :title="`Scoped to project ${projectFilter}`">
          <span class="project-glyph">◇</span>
          {{ projectFilter }}
        </span>
        <button type="button" class="clear" @click="clearProjectFilter" aria-label="Clear project filter">
          clear ✕
        </button>
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

    <div
      v-if="selectedIds.size > 0"
      class="issues-bulk-bar"
      data-smoke="issues-bulk-bar"
    >
      <span class="count">{{ selectedIds.size }} selected</span>
      <button
        type="button"
        class="bulk-action"
        :disabled="bulkBusy"
        @click="closeSelected"
      >
        {{ bulkBusy ? "closing…" : `close ${selectedIds.size}` }}
      </button>
      <label class="bulk-reproject">
        <span class="bulk-reproject-label">reproject →</span>
        <select
          class="bulk-reproject-select"
          data-smoke="issues-bulk-reproject"
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
    <p v-if="bulkError" class="quick-add-error" role="alert">{{ bulkError }}</p>

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
        :class="['issues-row', { focused: index === focused, selected: selectedIds.has(issue.id) }]"
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
              <button
                v-if="issue.projectName"
                type="button"
                class="issue-project"
                :class="{ active: projectFilter === issue.projectName }"
                :title="`${issue.projectName}\nClick to filter by this project`"
                @click.prevent.stop="toggleProjectFilter(issue.projectName)"
              >
                <span class="project-glyph">◇</span>
                {{ issue.projectName }}
              </button>
              <LabelPill
                v-for="label in (issue.labels ?? [])"
                :key="label"
                :name="label"
                :catalog="labelCatalog"
              />
              <button
                v-for="ref in (issue.assignees ?? [])"
                :key="`assignee-${ref}`"
                type="button"
                class="issue-assignee"
                :class="{ active: assigneeFilter === ref }"
                :data-author-kind="authorLabel(ref).kind"
                :title="`${ref}\nClick to filter by this assignee`"
                @click.prevent.stop="toggleAssigneeFilter(ref)"
              >
                <span class="author-glyph">{{ authorLabel(ref).glyph }}</span>
                {{ authorLabel(ref).label }}
              </button>
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
          <span
            class="issues-row-age"
            :title="ageTooltip(issue)"
          >{{ relativeTime(issue.updatedAt ?? issue.createdAt) }}</span>
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
  min-width: 0;
  display: grid;
  gap: 14px;
  font-family: var(--font-sans, system-ui);
  color: var(--fg, rgba(255,255,255,0.94));
}

.issues-queue-head {
  min-width: 0;
  display: grid;
  gap: 12px;
}

.head-row {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.issues-queue-head h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 22px;
  line-height: 1;
}

.issues-new {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  text-decoration: none;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding: 6px 12px;
}

.issues-controls {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Parsed-filter chip strip — mirrors the PullsQueue iter-55
 * aesthetic. Tone colour communicates the filter kind:
 *   is:        accent-teal
 *   assignee:  ink (carries the classifier glyph via label)
 *   project:   accent-blue (the Project spine accent)
 *   unknown:   dashed warning */
.issues-query-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.issues-query-chips .query-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border: 0.5px solid currentColor;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.issues-query-chips .query-chip.tone-is {
  color: var(--accent-teal, #087f6f);
}

.issues-query-chips .query-chip.tone-assignee {
  color: var(--fg, rgba(255,255,255,0.94));
}

.issues-query-chips .query-chip.tone-project {
  color: var(--accent-blue, #1d55a6);
}

.issues-query-chips .query-chip.tone-unknown {
  color: var(--accent-yellow, #c89300);
  border-style: dashed;
}

.issues-query-chips .query-chips-hint {
  margin-left: 4px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0;
}

.issues-query-chips .query-chips-hint code {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 0 4px;
  background: var(--bg-2, #0e1014);
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.issues-assignee-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg-2, #0e1014);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.issues-assignee-filter .prefix {
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.issues-assignee-filter .active-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 5px;
  border: 0.5px solid currentColor;
  color: var(--fg, rgba(255,255,255,0.94));
}

.issues-assignee-filter .active-chip[data-author-kind="agent"]      { color: #6b3fa0; }
.issues-assignee-filter .active-chip[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }
.issues-assignee-filter .active-chip[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.issues-assignee-filter .active-chip[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }

/* Project filter indicator — same shape as assignee filter but
   blue tone matching the row .issue-project chip. */
.issues-project-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 10px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg-2, #0e1014);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.issues-project-filter .prefix {
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.issues-project-filter .active-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 5px;
  border: 0.5px solid currentColor;
  color: var(--accent-blue, #1d55a6);
}

.issues-project-filter .project-glyph {
  font-size: 10px;
}

.issues-project-filter .clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0 2px;
}

.issues-project-filter .clear:hover {
  color: var(--fg, rgba(255,255,255,0.94));
}

.issues-assignee-filter .author-glyph {
  width: 12px;
  height: 12px;
  display: inline-grid;
  place-items: center;
  font-size: 9px;
  font-weight: 700;
}

.issues-assignee-filter .clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0 2px;
}

.issues-assignee-filter .clear:hover {
  color: var(--fg, rgba(255,255,255,0.94));
}

.issues-quick-add {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
  background: var(--bg, #0a0b0e);
  transition: border-color 120ms ease;
}

.issues-quick-add:focus-within {
  border-color: var(--fg, rgba(255,255,255,0.94));
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
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  border: 0.5px solid currentColor;
  border-radius: 2px;
}

.issues-quick-add input {
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

.issues-quick-add input::placeholder {
  color: var(--fg-4, rgba(255,255,255,0.34));
  font-style: italic;
}

.quick-add-status {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.quick-add-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  padding: 1px 6px;
  border: 0.5px solid currentColor;
  white-space: nowrap;
}

.quick-add-chip.tone-teal {
  color: var(--accent-teal, #087f6f);
}

.quick-add-chip.tone-yellow {
  color: var(--accent-yellow, #c89300);
}

.quick-add-hint {
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  color: var(--fg-4, rgba(255,255,255,0.34));
  white-space: nowrap;
}

.quick-add-hint kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
}

.quick-add-error {
  margin: -6px 0 0;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--accent-err, #c9341c);
}

.issues-filter-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
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
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.issues-filter:not(:last-child) {
  border-right: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.issues-filter.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
}

.issues-filter .count {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-variant-numeric: tabular-nums;
}

.issues-filter.active .count {
  color: var(--bg-2, #0e1014);
}

.issues-filter kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  opacity: 0.6;
}

.issues-search {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding: 4px 10px;
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
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.muted {
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  padding: 18px 0;
  border-top: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.muted.error {
  color: var(--accent-err, #c9341c);
}

.issues-list {
  min-width: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  border-top: 0.5px solid var(--fg, rgba(255,255,255,0.94));
}

.issues-row {
  min-width: 0;
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
  position: relative;
}

.issues-row.focused {
  background: var(--bg-2, #0e1014);
}

.issues-row.selected {
  background: var(--bg-2, #0e1014);
  box-shadow: inset 3px 0 0 var(--fg, rgba(255,255,255,0.94));
}

.issues-row.selected.focused {
  background: var(--bg-2, #0e1014);
  box-shadow: inset 3px 0 0 var(--accent-teal, #087f6f);
}

/**
 * Bulk action bar — appears above the list when at least one
 * row is selected. Sticky to the top of the scrollable area so
 * it stays visible as the user scans for more rows to select.
 */
.issues-bulk-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin: 8px 0;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.issues-bulk-bar .count {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.issues-bulk-bar .bulk-action {
  border: 0.5px solid var(--bg, #0a0b0e);
  background: transparent;
  color: var(--bg, #0a0b0e);
  padding: 4px 10px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  cursor: pointer;
  letter-spacing: 0.02em;
  text-transform: lowercase;
}

.issues-bulk-bar .bulk-action:hover:not(:disabled) {
  background: var(--bg, #0a0b0e);
  color: var(--fg, rgba(255,255,255,0.94));
}

.issues-bulk-bar .bulk-action:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* iter 71 — bulk reproject control. Sits in the inverted dark
 * bulk-action bar, so the select uses paper text on the same
 * background, keeping the editorial aesthetic. */
.issues-bulk-bar .bulk-reproject {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.issues-bulk-bar .bulk-reproject-label {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--bg-2, #0e1014);
  letter-spacing: 0.04em;
}

.issues-bulk-bar .bulk-reproject-select {
  border: 0.5px solid var(--bg-2, #0e1014);
  background: transparent;
  color: var(--bg, #0a0b0e);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
  outline: none;
}

.issues-bulk-bar .bulk-reproject-select:disabled {
  opacity: 0.5;
  cursor: wait;
}

.issues-bulk-bar .bulk-reproject-select option {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
}

.issues-bulk-bar .bulk-clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--bg-2, #0e1014);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  cursor: pointer;
  padding: 0 4px;
}

.issues-bulk-bar .bulk-clear kbd {
  margin-left: 4px;
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-size: 10px;
}

.issues-bulk-bar .hint {
  color: var(--bg-2, #0e1014);
  font-size: 10.5px;
  letter-spacing: 0.04em;
}

.issues-bulk-bar .hint kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-size: 10px;
}

.issues-row-link {
  min-width: 0;
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
  background: var(--bg-2, #0e1014);
}

.issues-row-number {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.issues-row-body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.issues-row-title {
  font-family: var(--font-serif, system-ui);
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
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.issue-state {
  border: 0.5px solid currentColor;
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
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--accent-blue, #1d55a6);
  border: 0.5px solid currentColor;
  padding: 0 6px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-family: var(--font-mono, monospace);
}

.issue-project:hover {
  background: var(--bg-2, #0e1014);
}

.issue-project.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
  border-color: var(--fg, rgba(255,255,255,0.94));
}

.issue-project .project-glyph {
  font-size: 10px;
}

.issue-label {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--accent-teal, #087f6f);
  border: 0.5px solid currentColor;
  padding: 0 5px;
  letter-spacing: 0.02em;
}

.issue-author {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.issue-author .author-glyph {
  width: 14px;
  height: 14px;
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  border: 0.5px solid currentColor;
  color: var(--fg-3, rgba(255,255,255,0.52));
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
  border: 0.5px solid currentColor;
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
 * strip. The button is clickable — toggles the URL-persisted
 * assignee filter (iteration 35).
 */
.issue-assignee {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 0 5px;
  border: 1px dashed currentColor;
  color: var(--fg-2, rgba(255,255,255,0.74));
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-family: var(--font-mono, monospace);
}

.issue-assignee:hover {
  background: var(--bg-2, #0e1014);
}

.issue-assignee.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
  border-color: var(--fg, rgba(255,255,255,0.94));
}

.issue-assignee.active .author-glyph {
  color: inherit;
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
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  white-space: nowrap;
}

.issues-foot {
  min-width: 0;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.issues-foot kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
}

@media (max-width: 520px) {
  .head-row,
  .issues-controls,
  .issues-quick-add {
    align-items: stretch;
  }

  .head-row {
    flex-wrap: wrap;
  }

  .issues-new {
    justify-self: start;
  }

  .issues-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .issues-search {
    width: 100%;
    max-width: none;
    flex-basis: auto;
  }

  .issues-quick-add {
    flex-wrap: wrap;
  }

  .quick-add-status,
  .quick-add-hint {
    max-width: 100%;
    white-space: normal;
  }

  .issues-row-link {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
  }

  .issues-row-age {
    grid-column: 2;
    justify-self: start;
  }

  .issues-foot {
    overflow-wrap: anywhere;
  }
}
</style>
