<script setup lang="ts">
/**
 * Command palette — Headless UI Combobox under the hood.
 *
 * Owns: shell-side rendering, fuzzy filter, group rendering, the
 * editorial visual design. Defers to the library for: focus trap,
 * focus restoration, arrow-key nav, Enter to select, Escape to close,
 * click-outside, aria roles and labels. Cmd-K opens via
 * `bindGlobalShortcut` (tinykeys, in sdk-core).
 *
 * Migration note: before iteration 21 this was a hand-rolled
 * `Teleport` + `<input>` + `<button>` list with a bespoke
 * keydown handler. That code is gone; the surface is half its
 * previous size and the keyboard semantics now match the rest of
 * the Linear-adjacent ecosystem (cmdk, kbar, vue-command-palette
 * all sit on the same primitives).
 */

import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  Dialog,
  DialogPanel,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";
import {
  configurePaletteOpener,
  filterCommands,
  getGraphQLClient,
  invokeOp,
  listCommands,
  subscribeCommands,
  type CommandContribution,
} from "@comtrya/sdk-core";
import { recentRoutes, type RecentEntry } from "../recents";

/**
 * Workspace URI used for the cross-workspace `list-issues` fetch.
 * This is the single workspace the running shell knows about today;
 * when multi-workspace support lands the palette will need to read
 * the active workspace from the router or a session store.
 */
const WORKSPACE_URI = "comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";

interface IssueResult {
  kind: "issue";
  id: string;
  number: number;
  title: string;
  state?: string | null;
  workspaceId: string;
}

interface PullResult {
  kind: "pull";
  id: string;
  number: number | null;
  title: string;
  state?: string | null;
}

interface EpicResult {
  kind: "epic";
  id: string;
  title: string;
  state?: string | null;
}

interface RepoResult {
  kind: "repo";
  id: string;
  /** Path used for both display and routing — e.g. `comtrya/dogfood`. */
  path: string;
  title: string;
  description?: string | null;
}

interface RecentResult {
  kind: "recent";
  path: string;
  label: string;
}

type EntityResult = IssueResult | PullResult | EpicResult | RepoResult | RecentResult;

const router = useRouter();
const open = ref(false);
const query = ref("");
const commands = ref<CommandContribution[]>([]);
const issues = ref<IssueResult[]>([]);
const pulls = ref<PullResult[]>([]);
const epics = ref<EpicResult[]>([]);
const repos = ref<RepoResult[]>([]);
const recents = recentRoutes();
let unsubscribe: (() => void) | undefined;

/**
 * Recent routes are only useful when the user opens the palette to
 * jump somewhere fast (empty query). Once they start typing, the
 * intent is search — recents become noise, so the group hides.
 */
const recentResults = computed<RecentResult[]>(() => {
  if (normalisedQuery.value.length > 0) return [];
  return recents.value.map((entry: RecentEntry) => ({
    kind: "recent" as const,
    path: entry.path,
    label: entry.label,
  }));
});

const filteredCommands = computed(() => filterCommands(query.value, commands.value));

/**
 * Issues whose title contains the query (case-insensitive). Empty
 * query returns nothing — the palette's primary surface is still
 * commands; entity search kicks in only when the user starts
 * typing. Cap at 8 results so a noisy query doesn't push commands
 * off-screen.
 */
function filterEntities<T extends { title: string; number?: number | null }>(
  list: T[],
  q: string,
  cap = 8,
): T[] {
  if (q.length === 0) return [];
  const out: T[] = [];
  for (const item of list) {
    const matchesTitle = item.title.toLowerCase().includes(q);
    const matchesNumber =
      typeof item.number === "number" && `#${item.number}`.includes(q);
    if (matchesTitle || matchesNumber) {
      out.push(item);
      if (out.length >= cap) break;
    }
  }
  return out;
}

const normalisedQuery = computed(() => query.value.trim().toLowerCase());

/**
 * Highlight a single match of `q` inside `text` by wrapping it in
 * `<mark>`. The input is HTML-escaped first so user-provided titles
 * (issue / pull / epic / repo) can't smuggle markup into the
 * palette via this v-html sink. Empty query → just-escaped text;
 * no match → just-escaped text. Linear / Spotlight / VSCode all
 * highlight matched substrings; cmd-K scanning is half the speed
 * without it.
 */
const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};
function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}
function highlight(text: string | null | undefined, q: string): string {
  const s = text ?? "";
  if (!q) return escapeHtml(s);
  const i = s.toLowerCase().indexOf(q);
  if (i === -1) return escapeHtml(s);
  return (
    escapeHtml(s.slice(0, i)) +
    "<mark>" + escapeHtml(s.slice(i, i + q.length)) + "</mark>" +
    escapeHtml(s.slice(i + q.length))
  );
}
const filteredIssues = computed<IssueResult[]>(() =>
  filterEntities(issues.value, normalisedQuery.value),
);
const filteredPulls = computed<PullResult[]>(() =>
  filterEntities(pulls.value, normalisedQuery.value),
);
const filteredEpics = computed<EpicResult[]>(() =>
  filterEntities(epics.value, normalisedQuery.value),
);
/**
 * Repos by `path` (or `title`) substring. The repo list is small so
 * we surface them on every keystroke including the empty one — gives
 * the palette an "Open recents" feel when the user pops it without
 * typing first.
 */
const filteredRepos = computed<RepoResult[]>(() => {
  const q = normalisedQuery.value;
  const list = repos.value;
  if (q.length === 0) return list.slice(0, 8);
  const out: RepoResult[] = [];
  for (const repo of list) {
    if (repo.path.toLowerCase().includes(q) || repo.title.toLowerCase().includes(q)) {
      out.push(repo);
      if (out.length >= 8) break;
    }
  }
  return out;
});

interface CommandGroup {
  category: string;
  commands: CommandContribution[];
}

const grouped = computed<CommandGroup[]>(() => {
  const map = new Map<string, CommandContribution[]>();
  for (const cmd of filteredCommands.value) {
    const key = cmd.category ?? cmd.extensionId;
    const bucket = map.get(key) ?? [];
    bucket.push(cmd);
    map.set(key, bucket);
  }
  return Array.from(map.entries()).map(([category, commands]) => ({
    category,
    commands,
  }));
});

onMounted(() => {
  refreshCommands();
  unsubscribe = subscribeCommands(refreshCommands);
  configurePaletteOpener(() => {
    query.value = "";
    open.value = true;
    // Refresh issues each time the palette opens so titles stay fresh
    // without burning a fetch on every keystroke. Workspace-scoped
    // issue counts are small enough that an on-open fetch is cheap.
    void refreshIssues();
    void refreshPulls();
    void refreshEpics();
    void refreshRepos();
  });
});

onUnmounted(() => {
  unsubscribe?.();
});

watch(open, (isOpen) => {
  if (!isOpen) query.value = "";
});

function refreshCommands(): void {
  commands.value = listCommands();
}

async function refreshIssues(): Promise<void> {
  const result = await invokeOp<Array<{
    id: string;
    number: number;
    title: string;
    state?: string;
    repository?: string;
  }>>(
    "ext_issues",
    "issues",
    "list-issues",
    { repository: WORKSPACE_URI, limit: 1024 },
  );
  if (!result.ok || !Array.isArray(result.value)) return;
  // Extract workspaceId from each issue's `repository` URI (or fall
  // back to the shell-default constant). The detail route shape is
  // /x/issues/<workspaceId>/<number>, so we need a workspace id
  // per-issue rather than per-result-set.
  issues.value = result.value
    .map((issue) => {
      const match = /^comtrya:\/\/workspace\/([^/]+)/.exec(issue.repository ?? "");
      return {
        kind: "issue" as const,
        id: issue.id,
        number: issue.number,
        title: issue.title ?? "",
        state: issue.state ?? null,
        workspaceId: match?.[1] ?? WORKSPACE_URI.replace("comtrya://workspace/", ""),
      };
    });
}

async function refreshPulls(): Promise<void> {
  const result = await invokeOp<Array<{
    id: string;
    number?: number | null;
    title: string;
    state?: string;
  }>>(
    "ext_pull_requests",
    "pulls",
    "list-pulls",
    { repository: WORKSPACE_URI, limit: 1024 },
  );
  if (!result.ok || !Array.isArray(result.value)) return;
  pulls.value = result.value.map((pull) => ({
    kind: "pull" as const,
    id: pull.id,
    number: pull.number ?? null,
    title: pull.title ?? "",
    state: pull.state ?? null,
  }));
}

async function refreshRepos(): Promise<void> {
  try {
    const data = await getGraphQLClient().query<{
      workspace?: {
        repositories?: Array<{
          id: string;
          name?: string | null;
          path?: string | null;
          description?: string | null;
        }> | null;
      } | null;
    }>(
      "{ workspace { repositories { id name path description } } }",
    );
    const rows = data.workspace?.repositories ?? [];
    repos.value = rows
      .filter((row): row is { id: string; name?: string | null; path?: string | null; description?: string | null } => Boolean(row?.id))
      .map((row) => ({
        kind: "repo" as const,
        id: row.id,
        path: row.path ?? row.name ?? row.id,
        title: row.name ?? row.path ?? row.id,
        description: row.description ?? null,
      }));
  } catch {
    // Swallow — palette stays usable without repo results.
  }
}

async function refreshEpics(): Promise<void> {
  const result = await invokeOp<Array<{
    id: string;
    title: string;
    state?: string;
  }>>(
    "ext_epics",
    "epics",
    "list-epics",
    { workspace: WORKSPACE_URI, limit: 1024 },
  );
  if (!result.ok || !Array.isArray(result.value)) return;
  epics.value = result.value.map((epic) => ({
    kind: "epic" as const,
    id: epic.id,
    title: epic.title ?? "",
    state: epic.state ?? null,
  }));
}

type PaletteEntry = CommandContribution | EntityResult;

function isEntityResult(entry: PaletteEntry): entry is EntityResult {
  return typeof (entry as EntityResult).kind === "string";
}

function closePalette(): void {
  open.value = false;
}

function navigateForEntity(entry: EntityResult): string {
  switch (entry.kind) {
    case "issue":
      return `/x/issues/${entry.workspaceId}/${entry.number}`;
    case "pull":
      return `/x/pulls/${entry.id}`;
    case "epic":
      return `/x/epics/${entry.id}`;
    case "repo":
      return `/r/${entry.path}`;
    case "recent":
      return entry.path;
  }
}

async function onSelect(entry: PaletteEntry | null): Promise<void> {
  if (!entry) return;
  closePalette();
  if (isEntityResult(entry)) {
    await router.push(navigateForEntity(entry));
    return;
  }
  await entry.run();
}
</script>

<template>
  <TransitionRoot :show="open" as="template" appear>
    <Dialog class="palette-dialog" @close="closePalette">
      <TransitionChild
        as="template"
        enter="palette-fade-enter"
        enter-from="palette-fade-from"
        enter-to="palette-fade-to"
        leave="palette-fade-leave"
        leave-from="palette-fade-to"
        leave-to="palette-fade-from"
      >
        <div class="palette-backdrop" aria-hidden="true" />
      </TransitionChild>

      <div class="palette-positioner">
        <TransitionChild
          as="template"
          enter="palette-pop-enter"
          enter-from="palette-pop-from"
          enter-to="palette-pop-to"
          leave="palette-pop-leave"
          leave-from="palette-pop-to"
          leave-to="palette-pop-from"
        >
          <DialogPanel class="palette-panel">
            <Combobox @update:model-value="onSelect" nullable>
              <ComboboxInput
                class="palette-input"
                placeholder="Search repos, issues, pulls, epics, commands…"
                autocomplete="off"
                spellcheck="false"
                :display-value="() => ''"
                @change="query = ($event.target as HTMLInputElement).value"
              />

              <ComboboxOptions
                class="palette-list"
                static
              >
                <template v-if="recentResults.length > 0">
                  <header class="palette-group">Recent</header>
                  <ComboboxOption
                    v-for="entry in recentResults"
                    :key="`recent-${entry.path}`"
                    v-slot="{ active }"
                    :value="entry"
                    as="template"
                  >
                    <li
                      :class="['palette-command', 'palette-issue', { active }]"
                      :data-smoke="`palette-recent-${entry.path}`"
                    >
                      <span class="palette-title">{{ entry.label }}</span>
                      <span class="palette-meta">
                        <code>{{ entry.path }}</code>
                      </span>
                    </li>
                  </ComboboxOption>
                </template>
                <template v-for="group in grouped" :key="group.category">
                  <header class="palette-group">{{ group.category }}</header>
                  <ComboboxOption
                    v-for="command in group.commands"
                    :key="command.id"
                    v-slot="{ active }"
                    :value="command"
                    as="template"
                  >
                    <li
                      :class="['palette-command', { active }]"
                      :data-smoke="`palette-cmd-${command.id}`"
                    >
                      <span class="palette-title">{{ command.title }}</span>
                      <span class="palette-meta">
                        <kbd v-if="command.shortcut">{{ command.shortcut }}</kbd>
                        <code>{{ command.category ?? command.extensionId }}</code>
                      </span>
                    </li>
                  </ComboboxOption>
                </template>
                <template v-if="filteredIssues.length > 0">
                  <header class="palette-group">Issues</header>
                  <ComboboxOption
                    v-for="issue in filteredIssues"
                    :key="`issue-${issue.id}`"
                    v-slot="{ active }"
                    :value="issue"
                    as="template"
                  >
                    <li
                      :class="['palette-command', 'palette-issue', { active }]"
                      :data-smoke="`palette-issue-${issue.number}`"
                    >
                      <span class="palette-title">
                        <span class="palette-issue-number">#{{ issue.number }}</span>
                        <span v-html="highlight(issue.title || '(untitled)', normalisedQuery)" />
                      </span>
                      <span class="palette-meta">
                        <code>{{ (issue.state ?? "open").toLowerCase() }}</code>
                      </span>
                    </li>
                  </ComboboxOption>
                </template>
                <template v-if="filteredPulls.length > 0">
                  <header class="palette-group">Pull requests</header>
                  <ComboboxOption
                    v-for="pull in filteredPulls"
                    :key="`pull-${pull.id}`"
                    v-slot="{ active }"
                    :value="pull"
                    as="template"
                  >
                    <li
                      :class="['palette-command', 'palette-issue', { active }]"
                      :data-smoke="`palette-pull-${pull.id}`"
                    >
                      <span class="palette-title">
                        <span v-if="pull.number !== null" class="palette-issue-number">#{{ pull.number }}</span>
                        <span v-html="highlight(pull.title || '(untitled)', normalisedQuery)" />
                      </span>
                      <span class="palette-meta">
                        <code>{{ (pull.state ?? "").toLowerCase() }}</code>
                      </span>
                    </li>
                  </ComboboxOption>
                </template>
                <template v-if="filteredEpics.length > 0">
                  <header class="palette-group">Epics</header>
                  <ComboboxOption
                    v-for="epic in filteredEpics"
                    :key="`epic-${epic.id}`"
                    v-slot="{ active }"
                    :value="epic"
                    as="template"
                  >
                    <li
                      :class="['palette-command', 'palette-issue', { active }]"
                      :data-smoke="`palette-epic-${epic.id}`"
                    >
                      <span
                        class="palette-title"
                        v-html="highlight(epic.title || '(untitled)', normalisedQuery)"
                      />
                      <span class="palette-meta">
                        <code>{{ (epic.state ?? "").toLowerCase() }}</code>
                      </span>
                    </li>
                  </ComboboxOption>
                </template>
                <template v-if="filteredRepos.length > 0">
                  <header class="palette-group">Repositories</header>
                  <ComboboxOption
                    v-for="repo in filteredRepos"
                    :key="`repo-${repo.id}`"
                    v-slot="{ active }"
                    :value="repo"
                    as="template"
                  >
                    <li
                      :class="['palette-command', 'palette-issue', { active }]"
                      :data-smoke="`palette-repo-${repo.id}`"
                    >
                      <span
                        class="palette-title"
                        v-html="highlight(repo.path, normalisedQuery)"
                      />
                      <span class="palette-meta">
                        <code v-if="repo.description">{{ repo.description }}</code>
                        <code v-else>repository</code>
                      </span>
                    </li>
                  </ComboboxOption>
                </template>
                <p
                  v-if="filteredCommands.length === 0 && filteredIssues.length === 0 && filteredPulls.length === 0 && filteredEpics.length === 0 && filteredRepos.length === 0"
                  class="palette-empty"
                >
                  No matches for "{{ query }}"
                </p>
              </ComboboxOptions>

              <footer class="palette-foot">
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span><kbd>↵</kbd> run</span>
                <span><kbd>Esc</kbd> close</span>
              </footer>
            </Combobox>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.palette-dialog {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.palette-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 14, 0.32);
}

.palette-positioner {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: start center;
  padding: 12vh 24px 24px;
  pointer-events: none;
}

.palette-panel {
  pointer-events: auto;
  width: min(680px, calc(100vw - 48px));
  background: var(--paper, #fffdf8);
  border: 1.5px solid var(--ink, #111);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-height: min(70vh, 720px);
  box-shadow: 0 30px 60px -20px rgba(20, 18, 14, 0.45);
}

.palette-input {
  width: 100%;
  border: 0;
  border-bottom: 1.5px solid var(--ink, #111);
  background: transparent;
  font-family: var(--display, system-ui);
  font-size: 18px;
  padding: 14px 18px;
  color: var(--ink, #111);
  outline: none;
}

.palette-input::placeholder {
  color: var(--ink-fainter, #918b80);
  font-style: italic;
}

.palette-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.palette-list:focus-visible,
.palette-list:focus {
  outline: none;
}

.palette-group {
  font-family: var(--mono, monospace);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint, #68645c);
  padding: 10px 18px 4px;
  background: var(--paper-tint, #f2efe7);
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
}

.palette-command {
  min-height: 44px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 8px 18px;
  color: var(--ink, #111);
  cursor: pointer;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
  user-select: none;
}

.palette-command.active {
  background: var(--paper-tint, #f2efe7);
}

.palette-command.active .palette-title {
  font-weight: 600;
}

.palette-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.palette-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.palette-meta kbd {
  border: 1px solid var(--ink, #111);
  padding: 1px 6px;
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--ink, #111);
  background: var(--paper, #fffdf8);
}

.palette-meta code {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
  letter-spacing: 0.02em;
}

.palette-empty {
  margin: 0;
  padding: 20px 18px;
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.palette-issue-number {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
  padding-right: 6px;
}

.palette-title mark {
  background: transparent;
  color: inherit;
  font-weight: 700;
  border-bottom: 1.5px solid var(--accent-orange, #e34a20);
  padding: 0;
}

.palette-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: flex-end;
  border-top: 1.5px solid var(--ink, #111);
  padding: 8px 16px;
  background: var(--paper-tint, #f2efe7);
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--ink-faint, #68645c);
}

.palette-foot kbd {
  border: 1px solid var(--ink, #111);
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
  color: var(--ink, #111);
  margin-right: 4px;
}

.palette-fade-enter,
.palette-fade-leave { transition: opacity 120ms ease; }
.palette-fade-from { opacity: 0; }
.palette-fade-to { opacity: 1; }

.palette-pop-enter,
.palette-pop-leave { transition: opacity 120ms ease, transform 120ms ease; }
.palette-pop-from { opacity: 0; transform: translateY(-6px) scale(0.985); }
.palette-pop-to { opacity: 1; transform: translateY(0) scale(1); }
</style>
