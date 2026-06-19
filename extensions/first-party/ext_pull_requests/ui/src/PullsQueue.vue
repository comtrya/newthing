<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { parseQueryFilters, useShortcuts } from "@comtrya/sdk-vue";
import { listPulls } from "./api";
import {
  classifyAuthor,
  defaultWorkspaceId,
  pullHref,
  relativeTime,
  stateTone,
  type LoadState,
  type PrState,
  type PullRequest,
} from "./types";

interface HostContext {
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}

const props = defineProps<{
  host?: HostContext;
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
}>();

type Filter = "OPEN" | "DRAFT" | "MERGED" | "CLOSED" | "ALL";

const FILTERS: Array<{ id: Filter; label: string; key: string }> = [
  { id: "OPEN", label: "Open", key: "o" },
  { id: "DRAFT", label: "Draft", key: "d" },
  { id: "MERGED", label: "Merged", key: "m" },
  { id: "CLOSED", label: "Closed", key: "c" },
  { id: "ALL", label: "All", key: "a" },
];


const filter = ref<Filter>("OPEN");
const search = ref("");

/**
 * Active author filter — a canonical `comtrya://` URN or empty.
 * Set by clicking an author chip on a row, cleared via the
 * controls-row clear button. URL-synced as `?author=<urn>` so
 * `/x/pulls/?author=comtrya://user/rawkode` is a shareable
 * "rawkode's PRs" view. Mirrors iter 35's IssuesList assignee
 * filter pattern.
 */
const authorFilter = ref("");
const pulls = ref<PullRequest[]>([]);
const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const focusedIndex = ref(0);

const workspaceId = computed(
  () => props.workspaceId ?? props.host?.workspaceId ?? defaultWorkspaceId(),
);
const repositoryId = computed(() => props.repositoryId ?? props.host?.repositoryId ?? null);
const repositoryPath = computed(() => props.repositoryPath ?? props.host?.repositoryPath ?? null);

const matchesFilter = (pull: PullRequest, f: Filter): boolean => {
  if (f === "ALL") return true;
  if (f === "OPEN") return pull.state === "READY";
  return pull.state === (f as PrState);
};

/**
 * Linear-style filter syntax inside the search input. The parser
 * extracts known tokens (`is:`, `author:`) into structured filters
 * and leaves the rest as free text. Tokens compose with the URL
 * filter chips: typing `is:draft` narrows on top of the row
 * filter; typing the same chip-key surfaces a "redundant" path
 * (handled by the consumer — currently `is:` overrides the row
 * chip so the search input is the source of truth).
 *
 * The set of recognised keys is declared at the call site so a
 * future addition (`label:`, `repo:`, `project:`) is a one-line
 * extension of `QUEUE_FILTER_KEYS` plus a consumer branch below.
 */
const QUEUE_FILTER_KEYS = ["is", "author"] as const;

const STATE_TOKEN_TO_FILTER: Record<string, Filter> = {
  open: "OPEN",
  draft: "DRAFT",
  merged: "MERGED",
  closed: "CLOSED",
  all: "ALL",
};

const parsedQuery = computed(() =>
  parseQueryFilters(search.value, QUEUE_FILTER_KEYS),
);

const effectiveStateFilter = computed<Filter>(() => {
  const tokens = parsedQuery.value.filters.is ?? [];
  for (const token of tokens) {
    const mapped = STATE_TOKEN_TO_FILTER[token.toLowerCase()];
    if (mapped) return mapped;
  }
  return filter.value;
});

const effectiveAuthorFilter = computed<string>(() => {
  const tokens = parsedQuery.value.filters.author ?? [];
  for (const token of tokens) {
    if (token.startsWith("comtrya://")) return token;
  }
  return authorFilter.value;
});

const filtered = computed(() => {
  const q = parsedQuery.value.text.trim().toLowerCase();
  const author = effectiveAuthorFilter.value;
  const state = effectiveStateFilter.value;
  return pulls.value
    .filter((p) => matchesFilter(p, state))
    .filter((p) => {
      if (!author) return true;
      return p.authorRef === author;
    })
    .filter((p) => {
      if (!q) return true;
      const cls = classifyAuthor(p.authorRef);
      const haystack =
        `${p.number} ${p.title} ${p.headRef} ${p.baseRef} ${cls.label} ${cls.kind}`
          .toLowerCase();
      return haystack.includes(q);
    });
});

interface QueueFilterChip {
  key: string;
  value: string;
  label: string;
  tone: "is" | "author" | "unknown";
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
  for (const token of parsedQuery.value.filters.author ?? []) {
    const cls = classifyAuthor(token);
    chips.push({
      key: "author",
      value: token,
      label: `author · ${cls.label}`,
      tone: "author",
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

function toggleAuthorFilter(ref: string): void {
  if (authorFilter.value === ref) authorFilter.value = "";
  else authorFilter.value = ref;
}

function clearAuthorFilter(): void {
  authorFilter.value = "";
}

const counts = computed(() => {
  const out: Record<Filter, number> = {
    OPEN: 0,
    DRAFT: 0,
    MERGED: 0,
    CLOSED: 0,
    ALL: pulls.value.length,
  };
  for (const p of pulls.value) {
    if (p.state === "READY") out.OPEN += 1;
    if (p.state === "DRAFT") out.DRAFT += 1;
    if (p.state === "MERGED") out.MERGED += 1;
    if (p.state === "CLOSED") out.CLOSED += 1;
  }
  return out;
});

/**
 * URL-persisted filter + search state.
 *
 * `/x/pulls/?state=merged&q=auth` becomes a shareable filtered
 * view. Same shape as IssuesList (iteration 32): replaceState on
 * change (no per-keystroke history pollution), popstate listener
 * for browser back/forward across saved filter URLs, suppression
 * guard so the initial read doesn't immediately write back.
 */
const URL_FILTER_VALUES = new Set<Filter>(["OPEN", "DRAFT", "MERGED", "CLOSED", "ALL"]);

function readUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const rawState = (params.get("state") ?? "").toUpperCase();
  if (URL_FILTER_VALUES.has(rawState as Filter)) {
    filter.value = rawState as Filter;
  }
  const rawQ = params.get("q");
  if (rawQ !== null) search.value = rawQ;
  const rawAuthor = params.get("author") ?? "";
  // Only accept canonical comtrya:// URNs — same guard as iter 35.
  authorFilter.value = rawAuthor.startsWith("comtrya://") ? rawAuthor : "";
}

function writeUrlState(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  // OPEN is the default — keep it out of the URL so a clean
  // `/x/pulls/` link stays clean.
  if (filter.value === "OPEN") params.delete("state");
  else params.set("state", filter.value);
  const trimmed = search.value.trim();
  if (trimmed) params.set("q", trimmed);
  else params.delete("q");
  if (authorFilter.value) params.set("author", authorFilter.value);
  else params.delete("author");
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
  void load();
  window.addEventListener("popstate", onPopState);
});

onUnmounted(() => {
  window.removeEventListener("popstate", onPopState);
});

watch(
  () => [workspaceId.value, repositoryId.value],
  () => void load(),
);

watch(filtered, () => {
  if (focusedIndex.value >= filtered.value.length) {
    focusedIndex.value = Math.max(0, filtered.value.length - 1);
  }
});

watch([filter, search, authorFilter], () => {
  if (suppressUrlWrite) return;
  writeUrlState();
});

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
    focusedIndex.value = Math.min(focusedIndex.value + 1, Math.max(0, filtered.value.length - 1));
  },
  ArrowDown: (event) => {
    event.preventDefault();
    focusedIndex.value = Math.min(focusedIndex.value + 1, Math.max(0, filtered.value.length - 1));
  },
  k: (event) => {
    event.preventDefault();
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
  },
  ArrowUp: (event) => {
    event.preventDefault();
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
  },
  Enter: (event) => {
    const pull = filtered.value[focusedIndex.value];
    if (!pull) return;
    event.preventDefault();
    window.location.href = pullDetailHref(pull);
  },
  "/": (event) => {
    event.preventDefault();
    document.querySelector<HTMLInputElement>("[data-pulls-search]")?.focus();
  },
  ...filterShortcuts,
});

function onSearchEscape(event: KeyboardEvent): void {
  if (!search.value) return;
  event.preventDefault();
  search.value = "";
}

function pullDetailHref(pull: Pick<PullRequest, "id">): string {
  return pullHref(pull, repositoryPath.value);
}

async function load(): Promise<void> {
  loadState.value = "loading";
  error.value = null;
  try {
    const list = await listPulls({
      workspaceId: workspaceId.value,
      repositoryId: repositoryId.value,
    });
    pulls.value = list.sort((a, b) => {
      const ad = Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0;
      const bd = Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0;
      return bd - ad;
    });
    loadState.value = pulls.value.length > 0 ? "ready" : "empty";
  } catch (caught) {
    pulls.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

</script>

<template>
  <section class="pulls-queue" data-smoke="pulls-queue">
    <header class="pulls-queue-head">
      <h2>Pull requests</h2>
      <div class="pulls-queue-controls">
        <div class="pulls-filter-row" role="tablist" aria-label="Filter pull requests by state">
          <button
            v-for="f in FILTERS"
            :key="f.id"
            type="button"
            role="tab"
            :aria-selected="filter === f.id"
            :class="['pulls-filter', { active: filter === f.id }]"
            @click="filter = f.id"
          >
            <span>{{ f.label }}</span>
            <span class="count">{{ counts[f.id] }}</span>
            <kbd>{{ f.key }}</kbd>
          </button>
        </div>
        <label class="pulls-search">
          <input
            data-pulls-search
            v-model="search"
            type="search"
            placeholder="Search pull requests"
            autocomplete="off"
            @keydown.esc="onSearchEscape"
          />
          <kbd>/</kbd>
        </label>
      </div>
      <div
        v-if="queueFilterChips.length > 0"
        class="pulls-query-chips"
        data-smoke="pulls-query-chips"
        aria-label="Parsed search filters"
      >
        <span
          v-for="chip in queueFilterChips"
          :key="`${chip.key}:${chip.value || 'unknown'}`"
          :class="['query-chip', `tone-${chip.tone}`]"
          :title="chip.tone === 'unknown' ? `Unknown filter key: ${chip.key}` : chip.value"
        >{{ chip.label }}</span>
        <span class="query-chips-hint">
          syntax: <code>is:open</code> · <code>is:draft</code> · <code>author:&lt;urn&gt;</code>
        </span>
      </div>

      <div
        v-if="authorFilter"
        class="pulls-author-filter"
        data-smoke="pulls-author-filter"
      >
        <span class="prefix">authored by</span>
        <span
          class="active-chip"
          :data-author-kind="classifyAuthor(authorFilter).kind"
          :title="authorFilter"
        >
          <span class="author-glyph">{{ classifyAuthor(authorFilter).glyph }}</span>
          {{ classifyAuthor(authorFilter).label }}
        </span>
        <button
          type="button"
          class="clear"
          @click="clearAuthorFilter"
          aria-label="Clear author filter"
        >clear ✕</button>
      </div>
    </header>

    <p v-if="loadState === 'loading'" class="pulls-empty">Loading pull requests…</p>
    <p v-else-if="loadState === 'error'" class="pulls-error" role="alert">{{ error }}</p>
    <p v-else-if="pulls.length === 0" class="pulls-empty">
      No pull requests yet. Push a branch and open one through the
      <code>create-pull</code> op or the SDK.
    </p>
    <p v-else-if="filtered.length === 0" class="pulls-empty">
      No pull requests match the current filter.
    </p>

    <ol v-else class="pulls-list" role="listbox" aria-label="Pull requests">
      <li
        v-for="(pull, index) in filtered"
        :key="pull.id"
        :class="['pulls-row', { focused: index === focusedIndex }]"
        role="option"
        :aria-selected="index === focusedIndex"
        @mouseenter="focusedIndex = index"
      >
        <a :href="pullDetailHref(pull)" class="pulls-row-link">
          <span class="pulls-row-number">#{{ pull.number }}</span>
          <span class="pulls-row-body">
            <span class="pulls-row-title">{{ pull.title }}</span>
            <span class="pulls-row-meta">
              <span :class="['pulls-state', stateTone(pull.state).className]">
                {{ stateTone(pull.state).label }}
              </span>
              <code class="pulls-branch">
                {{ pull.headRef }} <span>→</span> {{ pull.baseRef }}
              </code>
              <button
                type="button"
                class="pulls-author"
                :class="{ active: authorFilter === pull.authorRef }"
                :data-author-kind="classifyAuthor(pull.authorRef).kind"
                :title="`${pull.authorRef}\nClick to filter by this author`"
                @click.prevent.stop="toggleAuthorFilter(pull.authorRef)"
              >
                <span class="author-glyph">{{ classifyAuthor(pull.authorRef).glyph }}</span>
                <span class="author-label">{{ classifyAuthor(pull.authorRef).label }}</span>
              </button>
            </span>
          </span>
          <span class="pulls-row-age">{{ relativeTime(pull.updatedAt ?? pull.createdAt) }}</span>
        </a>
      </li>
    </ol>

    <footer class="pulls-queue-foot">
      <span>
        <kbd>j</kbd> <kbd>k</kbd> navigate · <kbd>↵</kbd> open ·
        <kbd>/</kbd> search ·
        <kbd>o</kbd> open <kbd>d</kbd> draft <kbd>m</kbd> merged <kbd>c</kbd> closed <kbd>a</kbd> all
      </span>
    </footer>
  </section>
</template>

<style scoped>
.pulls-queue {
  display: grid;
  gap: 16px;
  font-family: var(--font-sans, system-ui);
  color: var(--fg, rgba(255,255,255,0.94));
}

.pulls-queue-head {
  display: grid;
  gap: 12px;
}

.pulls-queue-head h2 {
  margin: 0;
  font-family: var(--font-serif, system-ui);
  font-size: 22px;
  line-height: 1;
}

.pulls-queue-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pulls-filter-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
}

.pulls-filter {
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

.pulls-filter:not(:last-child) {
  border-right: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.pulls-filter.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
}

.pulls-filter .count {
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-variant-numeric: tabular-nums;
}

.pulls-filter.active .count {
  color: var(--bg-2, #0e1014);
}

.pulls-filter kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  opacity: 0.6;
}

.pulls-search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding: 4px 10px;
  min-width: 240px;
  flex: 1 1 240px;
  max-width: 420px;
}

.pulls-search input {
  flex: 1;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  outline: none;
  min-width: 0;
}

.pulls-search kbd {
  border: 0.5px solid var(--fg, rgba(255,255,255,0.94));
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-list {
  display: grid;
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 0.5px solid var(--fg, rgba(255,255,255,0.94));
}

.pulls-row {
  border-bottom: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.pulls-row.focused {
  background: var(--bg-2, #0e1014);
}

.pulls-row-link {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 12px 12px 12px 6px;
  color: inherit;
  text-decoration: none;
}

.pulls-row-link:hover {
  text-decoration: none;
  background: var(--bg-2, #0e1014);
}

.pulls-row-number {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.pulls-row-body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.pulls-row-title {
  font-family: var(--font-serif, system-ui);
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pulls-row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-state {
  border: 0.5px solid currentColor;
  padding: 0 6px;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pulls-state.pr-state-ready {
  color: var(--accent-teal, #087f6f);
}

.pulls-state.pr-state-draft {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-state.pr-state-merged {
  color: var(--accent-blue, #1d55a6);
}

.pulls-state.pr-state-closed {
  color: var(--accent-err, #c9341c);
}

.pulls-branch {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-2, rgba(255,255,255,0.74));
}

.pulls-branch span {
  color: var(--fg-4, rgba(255,255,255,0.34));
  padding: 0 4px;
}

.pulls-author {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 5px;
  border: 1px dashed transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  cursor: pointer;
}

.pulls-author:hover {
  border-color: currentColor;
  background: var(--bg-2, #0e1014);
}

.pulls-author.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
  border-color: var(--fg, rgba(255,255,255,0.94));
  border-style: solid;
}

.pulls-author.active .author-glyph,
.pulls-author.active .author-label {
  color: inherit;
}

/* Parsed-filter chip strip — surfaces tokens extracted from
 * the search input (is:, author:, unknown:). Mirrors the
 * existing chip-row aesthetic; tone colour communicates the
 * filter kind without an icon. */
.pulls-query-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.pulls-query-chips .query-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border: 0.5px solid currentColor;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.pulls-query-chips .query-chip.tone-is {
  color: var(--accent-teal, #087f6f);
}

.pulls-query-chips .query-chip.tone-author {
  color: var(--fg, rgba(255,255,255,0.94));
}

.pulls-query-chips .query-chip.tone-unknown {
  color: var(--accent-warn, #c89300);
  border-style: dashed;
}

.pulls-query-chips .query-chips-hint {
  margin-left: 4px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0;
}

.pulls-query-chips .query-chips-hint code {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 0 4px;
  background: var(--bg-2, #0e1014);
  color: var(--fg-2, rgba(255,255,255,0.74));
}

/* Author filter indicator — mirrors iter 35's IssuesList shape. */
.pulls-author-filter {
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

.pulls-author-filter .prefix {
  color: var(--fg-3, rgba(255,255,255,0.52));
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.pulls-author-filter .active-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 5px;
  border: 0.5px solid currentColor;
  color: var(--fg, rgba(255,255,255,0.94));
}

.pulls-author-filter .active-chip[data-author-kind="agent"]      { color: #6b3fa0; }
.pulls-author-filter .active-chip[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }
.pulls-author-filter .active-chip[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.pulls-author-filter .active-chip[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }

.pulls-author-filter .author-glyph {
  width: 12px;
  height: 12px;
  display: inline-grid;
  place-items: center;
  font-size: 9px;
  font-weight: 700;
}

.pulls-author-filter .clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--fg-3, rgba(255,255,255,0.52));
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  cursor: pointer;
  padding: 0 2px;
}

.pulls-author-filter .clear:hover {
  color: var(--fg, rgba(255,255,255,0.94));
}

.pulls-author .author-glyph {
  width: 14px;
  height: 14px;
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  border: 0.5px solid currentColor;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-author[data-author-kind="agent"] .author-glyph,
.pulls-author[data-author-kind="agent"] .author-label,
.pulls-author[data-author-kind="agent"] .author-badge {
  color: #6b3fa0;
}

.pulls-author[data-author-kind="credential"] .author-glyph,
.pulls-author[data-author-kind="credential"] .author-label,
.pulls-author[data-author-kind="credential"] .author-badge {
  color: var(--accent-yellow, #c89300);
}

.pulls-author[data-author-kind="bot"] .author-glyph,
.pulls-author[data-author-kind="bot"] .author-label,
.pulls-author[data-author-kind="bot"] .author-badge {
  color: var(--accent-blue, #1d55a6);
}

.pulls-author .author-badge {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pulls-row-age {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  white-space: nowrap;
}

.pulls-empty,
.pulls-error {
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: var(--fg-3, rgba(255,255,255,0.52));
  padding: 18px 0;
  border-top: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.pulls-error {
  color: var(--accent-err, #c9341c);
}

.pulls-queue-foot {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.pulls-queue-foot kbd {
  border: 0.5px solid currentColor;
  padding: 0 4px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
}
</style>
