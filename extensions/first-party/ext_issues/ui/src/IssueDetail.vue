<script setup lang="ts">
import { applyOptimistic } from "@comtrya/sdk-core";
import {
  classifyPrincipal as authorLabel,
  fetchComtryaProjects,
  LabelPill,
  renderMarkdown,
  type ComtryaProject,
  type LabelCatalog,
} from "@comtrya/sdk-vue";
import { computed, onMounted, ref, watch } from "vue";
import {
  assignIssueProject,
  closeIssue,
  issueByNumber,
  reopenIssue,
} from "./api";
import CustomElementHost from "./CustomElementHost.vue";
import { resolveIssuesPolicy, type IssuesPolicy } from "./policy";
import {
  DEFAULT_WORKSPACE_ID,
  issueRef,
  stateTone,
  type ComtryaGraphQLClient,
  type ExtensionRouteParams,
  type Issue,
  type LoadState,
} from "./types";

const ISSUE_RELATIONSHIPS_TAG = "comtrya-issue-relationships";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  issue?: Issue | null;
  workspaceId?: string;
  repositoryId?: string | null;
  repositoryPath?: string | null;
  number?: number | string;
  routeParams?: ExtensionRouteParams;
  /**
   * Active repo's label catalog, stamped onto the custom element by
   * the shell's extension runtime when the user is inside a repo
   * workbench. Threads through to `LabelPill` so typed labels
   * declared as `#ExclusiveLabel` render with the exclusive class
   * instead of falling back to scoped.
   */
  labelCatalog?: LabelCatalog | null;
}>();

const loadState = ref<LoadState>("idle");
const actionState = ref<"idle" | "submitting">("idle");
const error = ref<string | null>(null);
const actionError = ref<string | null>(null);
const loadedIssue = ref<Issue | null>(props.issue ?? null);
const graphClient = computed(() => props.client ?? props.comtryaClient);
const workspaceId = computed(
  () => props.workspaceId
    ?? props.routeParams?.params?.workspaceId
    ?? DEFAULT_WORKSPACE_ID,
);
const issue = computed(() => loadedIssue.value ?? props.issue ?? null);
const tone = computed(() => stateTone(issue.value?.state));
const hasBody = computed(() => Boolean(issue.value?.bodyMarkdown?.trim()));
const renderedBody = computed(() =>
  hasBody.value
    ? renderMarkdown(issue.value?.bodyMarkdown ?? "", { workspaceId: workspaceId.value })
    : "",
);

const createdAtLabel = computed(() => formatTimestamp(issue.value?.createdAt));
const openedRelative = computed(() => relativeTime(issue.value?.createdAt));
/**
 * "Updated" chip only fires when the kernel restamped `updatedAt` after
 * the issue was opened — i.e. close, reopen, or project change happened.
 * Hiding it when it equals `createdAt` keeps the chip row from
 * stuttering on freshly-opened issues.
 */
const updatedRelative = computed(() => {
  const u = issue.value?.updatedAt;
  const c = issue.value?.createdAt;
  if (!u || u === c) return null;
  return relativeTime(u);
});
const updatedAtLabel = computed(() => formatTimestamp(issue.value?.updatedAt));
const repositoryLabel = computed(() => props.repositoryPath ?? issue.value?.repositoryId ?? null);
const issueNumber = computed(() => Number(
  props.number ?? props.routeParams?.params?.number,
));
const canLoad = computed(() => graphClient.value && Number.isFinite(issueNumber.value));

/**
 * CUE Project ownership routing — when an issue is scoped to a
 * Project, surface the Project's declared `owners[].ref` so the
 * detail page reads as "this work is routed to <team> +
 * <maintainer>". Reuses `resolveIssuesPolicy()` (which already
 * extracts `ownerRefs` from the merged CUE config) so the
 * vocabulary stays single-sourced.
 *
 * Re-resolved whenever `issue.projectName` changes; cleared when
 * the issue has no project so the panel hides cleanly.
 */
const policy = ref<IssuesPolicy | null>(null);
const projectOwners = computed<string[]>(() => policy.value?.ownerRefs ?? []);

watch(
  () => issue.value?.projectName ?? "",
  async (projectName) => {
    if (!projectName) {
      policy.value = null;
      return;
    }
    try {
      policy.value = await resolveIssuesPolicy(projectName);
    } catch {
      policy.value = null;
    }
  },
  { immediate: true },
);

/**
 * Project picker — retroactively assigns (or clears) the
 * Project this issue belongs to via the iter 67
 * `assign-project` op. Routes the kernel event
 * `dev.comtrya.issues.project-changed` so workspace-wide
 * per-project counts (iter 65) update without refresh.
 *
 * `availableProjects` is loaded once on mount from the repo's
 * CUE config (iter 63 helper). If the helper fails or no
 * Projects are declared, the dropdown still includes the
 * current project as a fallback option so the user isn't
 * locked out of seeing what's stamped.
 */
const availableProjects = ref<ComtryaProject[]>([]);
const projectActionState = ref<"idle" | "submitting">("idle");
const projectActionError = ref<string | null>(null);

onMounted(async () => {
  try {
    availableProjects.value = await fetchComtryaProjects();
  } catch {
    availableProjects.value = [];
  }
});

async function onProjectChange(event: Event): Promise<void> {
  const target = event.target as HTMLSelectElement | null;
  if (!target || !issue.value) return;
  const current = issue.value;
  const nextName = target.value || null;
  if ((current.projectName ?? null) === nextName) return;
  projectActionState.value = "submitting";
  projectActionError.value = null;
  // Optimistic update so the rest of the page (Routed-to panel,
  // hero chip row) reflects the new value immediately.
  const previous = current.projectName ?? null;
  loadedIssue.value = { ...current, projectName: nextName };
  try {
    const updated = await assignIssueProject(current.id, nextName);
    loadedIssue.value = updated;
  } catch (caught) {
    // Roll back optimistic update on failure.
    loadedIssue.value = { ...current, projectName: previous };
    target.value = previous ?? "";
    projectActionError.value =
      caught instanceof Error ? caught.message : String(caught);
  } finally {
    projectActionState.value = "idle";
  }
}

onMounted(loadIssue);
watch(
  () => [
    graphClient.value,
    props.issue,
    workspaceId.value,
    props.repositoryId,
    props.number,
    props.routeParams?.params?.number,
  ],
  () => void loadIssue(),
);

async function loadIssue(): Promise<void> {
  if (props.issue) {
    loadedIssue.value = issueMatchesRepository(props.issue) ? props.issue : null;
    loadState.value = loadedIssue.value ? "ready" : "empty";
    error.value = null;
    return;
  }
  if (!canLoad.value || !graphClient.value) {
    loadedIssue.value = null;
    loadState.value = "error";
    error.value = "issue-detail: missing params";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    const found = await issueByNumber(
      graphClient.value,
      workspaceId.value,
      issueNumber.value,
    );
    loadedIssue.value = found && issueMatchesRepository(found) ? found : null;
    loadState.value = loadedIssue.value ? "ready" : "empty";
  } catch (caught) {
    loadedIssue.value = null;
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function issueMatchesRepository(candidate: Issue): boolean {
  return !props.repositoryId || candidate.repositoryId === props.repositoryId;
}

function formatTimestamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function relativeTime(value?: string | null): string | null {
  if (!value) return null;
  const then = Date.parse(value);
  if (!Number.isFinite(then)) return null;
  const diff = Math.max(0, Date.now() - then);
  const min = 60_000, hr = 60 * min, day = 24 * hr, wk = 7 * day;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < wk) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / wk)}w ago`;
}

// Classifier moved to `@comtrya/sdk-vue::classifyPrincipal`
// (iter 62); imported above as `authorLabel` so existing
// template bindings keep working.

async function closeCurrentIssue(): Promise<void> {
  if (!graphClient.value || !issue.value) return;
  const client = graphClient.value;
  const previous = issue.value;
  const optimistic: Issue = {
    ...previous,
    state: "CLOSED",
    stateReason: "completed",
  };
  actionState.value = "submitting";
  actionError.value = null;
  try {
    const result = await applyOptimistic<Issue>({
      apply: () => {
        loadedIssue.value = optimistic;
      },
      rollback: () => {
        loadedIssue.value = previous;
      },
      op: async () => ({
        ok: true,
        value: await closeIssue(client, previous.id),
      }),
      onSuccess: (updated) => {
        loadedIssue.value = updated;
      },
    });
    if (!result.ok) {
      actionError.value = result.error.message;
    }
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

async function reopenCurrentIssue(): Promise<void> {
  if (!graphClient.value || !issue.value) return;
  const client = graphClient.value;
  const previous = issue.value;
  const optimistic: Issue = {
    ...previous,
    state: "OPEN",
    stateReason: null,
    closedAt: null,
  };
  actionState.value = "submitting";
  actionError.value = null;
  try {
    const result = await applyOptimistic<Issue>({
      apply: () => {
        loadedIssue.value = optimistic;
      },
      rollback: () => {
        loadedIssue.value = previous;
      },
      op: async () => ({
        ok: true,
        value: await reopenIssue(client, previous.id),
      }),
      onSuccess: (updated) => {
        loadedIssue.value = updated;
      },
    });
    if (!result.ok) {
      actionError.value = result.error.message;
    }
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}
</script>

<template>
  <main
    class="issue-detail"
    :data-state="loadState"
    :data-issue-id="issue?.id"
    data-smoke="issue-detail"
  >
    <p v-if="loadState === 'loading'" class="issue-line muted">Loading issue</p>
    <p v-else-if="loadState === 'error'" class="issue-line warn">{{ error }}</p>
    <p v-else-if="!issue" class="issue-line warn">
      No issue #{{ Number.isFinite(issueNumber) ? issueNumber : "?" }} in {{ workspaceId }}
    </p>

    <template v-else>
      <div class="issue-detail-shell">
        <section class="issue-main">
          <header class="issue-hero">
            <div class="issue-kicker">
              <span class="issue-pill" :class="tone.className">{{ tone.label }}</span>
              <span class="issue-number">#{{ issue.number }}</span>
              <span v-if="repositoryLabel" class="issue-repository">{{ repositoryLabel }}</span>
            </div>
            <h1>{{ issue.title }}</h1>
            <div class="issue-chip-row" aria-label="Issue metadata">
              <a
                v-if="issue.projectName"
                class="issue-chip tone-project issue-chip-link"
                :href="`/x/issues/?project=${encodeURIComponent(issue.projectName)}`"
                :title="`Filter issues by project ${issue.projectName}`"
              >
                <span class="chip-glyph">◇</span>{{ issue.projectName }}
              </a>
              <LabelPill
                v-for="label in (issue.labels ?? [])"
                :key="`label-${label}`"
                :name="label"
                :catalog="labelCatalog ?? null"
              />
              <span
                v-if="issue.closeOnMerge === false"
                class="issue-chip tone-warn"
                title="closeOnMerge=false — opted out of the PR merge reactor's auto-close path."
              >closeOnMerge · off</span>
              <span
                v-for="ref in (issue.assignees ?? [])"
                :key="`assignee-${ref}`"
                class="issue-chip tone-assignee"
                :data-author-kind="authorLabel(ref).kind"
                :title="ref"
              >
                <span class="chip-glyph">{{ authorLabel(ref).glyph }}</span>
                {{ authorLabel(ref).label }}
              </span>
              <span
                v-if="issue.authorRef"
                class="issue-chip tone-author"
                :data-author-kind="authorLabel(issue.authorRef).kind"
                :title="`Opened by ${issue.authorRef}`"
              >
                <span class="chip-glyph">{{ authorLabel(issue.authorRef).glyph }}</span>
                by {{ authorLabel(issue.authorRef).label }}
              </span>
              <span
                v-if="openedRelative"
                class="issue-chip tone-time"
                :title="createdAtLabel ?? ''"
              >opened {{ openedRelative }}</span>
              <span
                v-if="updatedRelative"
                class="issue-chip tone-time tone-updated"
                :title="updatedAtLabel ?? ''"
              >updated {{ updatedRelative }}</span>
            </div>
          </header>

          <article
            v-if="hasBody"
            class="issue-body prose"
            :data-issue-id="issue.id"
            data-smoke="issue-detail-main"
            v-html="renderedBody"
          />
          <article
            v-else
            class="issue-body is-empty"
            :data-issue-id="issue.id"
            data-smoke="issue-detail-main"
          >
            No description has been added yet.
          </article>

          <section class="issue-thread">
            <header>
              <h2>Activity</h2>
            </header>
            <CustomElementHost
              tag="comtrya-comment-thread"
              :attributes="{ target: issueRef(issue) }"
              :properties="{ target: issueRef(issue), comtryaClient: graphClient }"
            />
          </section>
        </section>

        <aside class="issue-sidebar" aria-label="Issue sidebar">
          <section class="issue-panel">
            <header>
              <h2>State</h2>
            </header>
            <div class="issue-state-summary">
              <span class="issue-pill" :class="tone.className">{{ tone.label }}</span>
              <span v-if="issue.stateReason">{{ issue.stateReason }}</span>
            </div>
            <div class="issue-actions">
              <button
                v-if="issue.state === 'OPEN' || issue.state === 'REOPENED'"
                type="button"
                :disabled="actionState === 'submitting'"
                @click="closeCurrentIssue"
              >
                Close issue
              </button>
              <button
                v-else
                type="button"
                :disabled="actionState === 'submitting'"
                @click="reopenCurrentIssue"
              >
                Reopen issue
              </button>
            </div>
            <p v-if="actionError" class="issue-line warn" role="alert">{{ actionError }}</p>
          </section>

          <section class="issue-panel" data-smoke="issue-project-picker">
            <header>
              <h2>Project</h2>
            </header>
            <select
              class="issue-project-select"
              data-smoke="issue-project-select"
              :value="issue.projectName ?? ''"
              :disabled="projectActionState === 'submitting'"
              @change="onProjectChange"
            >
              <option value="">— no project —</option>
              <option
                v-for="proj in availableProjects"
                :key="proj.name"
                :value="proj.name ?? ''"
              >{{ proj.name }}</option>
            </select>
            <p v-if="projectActionError" class="issue-line warn" role="alert">
              {{ projectActionError }}
            </p>
            <p class="issue-line muted">
              Stamps <code>projectName</code> on this issue. Lights up the
              workspace per-Project counts.
            </p>
          </section>

          <section
            v-if="issue.projectName && projectOwners.length > 0"
            class="issue-panel"
            data-smoke="issue-project-owners"
          >
            <header>
              <h2>Routed to</h2>
              <a
                :href="`/x/issues/?project=${encodeURIComponent(issue.projectName)}`"
                class="issue-panel-link"
                :title="`Filter to project ${issue.projectName}`"
              >◇ {{ issue.projectName }}</a>
            </header>
            <ul class="issue-owners">
              <li
                v-for="ref in projectOwners"
                :key="ref"
                class="issue-owner"
                :data-author-kind="authorLabel(ref).kind"
                :title="ref"
              >
                <span class="chip-glyph">{{ authorLabel(ref).glyph }}</span>
                {{ authorLabel(ref).label }}
              </li>
            </ul>
            <p class="issue-line muted">
              From <code>package comtrya</code> · projects.{{ issue.projectName }}.owners
            </p>
          </section>

          <CustomElementHost
            :tag="ISSUE_RELATIONSHIPS_TAG"
            :properties="{
              client: graphClient,
              issue,
              workspaceId,
              repositoryId: issue.repositoryId,
              repositoryPath: props.repositoryPath,
            }"
          />
        </aside>
      </div>
    </template>
  </main>
</template>

<style scoped>
.issue-detail {
  width: min(100%, 1180px);
  display: grid;
  gap: 24px;
  padding: 8px 0 48px;
  color: var(--ink, #111);
}

.issue-detail-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 32px;
  align-items: start;
}

.issue-main,
.issue-sidebar,
.issue-panel,
.issue-thread {
  min-width: 0;
}

.issue-main {
  display: grid;
  gap: 24px;
}

.issue-sidebar {
  display: grid;
  gap: 16px;
}

.issue-detail h1 {
  max-width: 820px;
  margin: 10px 0 0;
  font-family: var(--display, system-ui);
  font-size: 42px;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.issue-hero {
  display: grid;
  gap: 14px;
  padding-bottom: 22px;
  border-bottom: 2px solid var(--ink, #111);
}

.issue-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.issue-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 0;
}

.issue-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--rule-light, #d8d1c4);
  font-family: var(--mono, monospace);
  font-size: 11px;
  line-height: 16px;
  color: var(--ink-soft, #2c2b28);
}

.issue-chip .chip-glyph {
  width: 13px;
  height: 13px;
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
}

.issue-chip.tone-project {
  color: var(--accent-blue, #1d55a6);
  border-color: currentColor;
}

.issue-chip-link {
  text-decoration: none;
  cursor: pointer;
}

.issue-chip-link:hover {
  background: rgba(29, 85, 166, 0.06);
}

.issue-chip.tone-label {
  color: var(--accent-teal, #087f6f);
  border-color: currentColor;
}

.issue-chip.tone-warn {
  color: var(--accent-yellow, #c89300);
  border-color: currentColor;
  text-transform: lowercase;
}

.issue-chip.tone-assignee {
  border-style: dashed;
  border-color: currentColor;
  cursor: help;
}

.issue-chip.tone-author,
.issue-chip.tone-assignee {
  color: var(--ink-soft, #2c2b28);
}

.issue-chip.tone-author[data-author-kind="agent"],
.issue-chip.tone-assignee[data-author-kind="agent"] { color: #6b3fa0; }
.issue-chip.tone-author[data-author-kind="credential"],
.issue-chip.tone-assignee[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }
.issue-chip.tone-author[data-author-kind="bot"],
.issue-chip.tone-assignee[data-author-kind="bot"] { color: var(--accent-blue, #1d55a6); }
.issue-chip.tone-author[data-author-kind="team"],
.issue-chip.tone-assignee[data-author-kind="team"] { color: var(--accent-teal, #087f6f); }

.issue-chip.tone-time {
  color: var(--ink-faint, #68645c);
  border-style: none;
  padding-left: 2px;
}

.issue-line,
.issue-kicker,
.issue-panel,
.issue-actions button {
  font-family: var(--mono, monospace);
}

.issue-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 8px;
  border: 1px solid currentColor;
  font-family: var(--mono, monospace);
  font-size: 11px;
  line-height: 1;
  text-transform: lowercase;
}

.issue-number,
.issue-repository {
  color: var(--ink-faint, #888);
  font-size: 12px;
}

.issue-state-open {
  color: var(--ink-go, #008873);
}

.issue-state-closed {
  color: var(--ink-faint, #888);
}

.issue-body {
  min-height: 156px;
  padding: 20px;
  border: 1px solid var(--ink-rule, #d0cfc8);
  background: color-mix(in srgb, var(--paper, #f7f4ec) 86%, white);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.issue-body.is-empty {
  color: var(--ink-faint, #888);
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.issue-thread {
  display: grid;
  gap: 12px;
  padding-top: 4px;
}

.issue-thread header,
.issue-panel header {
  min-height: 36px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--ink-rule, #d0cfc8);
}

.issue-thread h2,
.issue-panel h2 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 18px;
  line-height: 1;
}

.issue-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ink-rule, #d0cfc8);
  background: color-mix(in srgb, var(--paper, #f7f4ec) 94%, white);
}

.issue-state-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--ink-faint, #888);
  font-size: 12px;
}

.issue-actions {
  display: grid;
  gap: 8px;
}

/* iter 68 — inline Project picker. Linear-style autosave on
 * change; native `<select>` element keeps the keyboard
 * affordance (arrows + Enter) without a custom dropdown. */
.issue-project-select {
  width: 100%;
  border: 1.5px solid var(--ink-rule, #d0cfc8);
  background: var(--paper, #fffdf8);
  color: var(--ink, #111);
  padding: 8px 10px;
  font-family: var(--mono, monospace);
  font-size: 13px;
  outline: none;
  transition: border-color 120ms ease;
}

.issue-project-select:focus {
  border-color: var(--ink, #111);
}

.issue-project-select:disabled {
  cursor: wait;
  opacity: 0.55;
}

/* "Routed to" panel — surfaces CUE project owners. The header
 * carries an inline link back to the project-scoped queue so
 * the panel doubles as a Project shortcut. */
.issue-panel header .issue-panel-link {
  margin-left: auto;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--accent-blue, #1d55a6);
  text-decoration: none;
  letter-spacing: 0.02em;
}

.issue-panel header .issue-panel-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.issue-owners {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.issue-owner {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid currentColor;
  color: var(--ink, #111);
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.issue-owner .chip-glyph {
  font-family: var(--display, system-ui);
  font-size: 12px;
  line-height: 1;
}

/* Tone the chip border by classifier kind — same palette the
 * hero chip row uses so the visual vocabulary is consistent. */
.issue-owner[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }
.issue-owner[data-author-kind="human"]      { color: var(--ink, #111); }
.issue-owner[data-author-kind="agent"]      { color: #6b3fa0; }
.issue-owner[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.issue-owner[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }

.issue-line.muted code {
  font-family: var(--mono, monospace);
  font-size: 11px;
  padding: 0 4px;
  background: var(--paper-tint, #f2efe7);
  color: var(--ink-soft, #2c2b28);
}

.issue-actions button {
  min-height: 34px;
  border: 1.5px solid var(--ink, #111);
  background: transparent;
  color: inherit;
  padding: 8px 12px;
  cursor: pointer;
  text-align: left;
}

.issue-actions button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.issue-line {
  margin: 4px 0;
  font-size: 12px;
}

.muted {
  color: var(--ink-faint, #888);
}

.warn {
  color: var(--ink-warn, #c2410c);
}

@media (max-width: 920px) {
  .issue-detail-shell {
    grid-template-columns: 1fr;
  }

  .issue-detail h1 {
    font-size: 34px;
  }
}
</style>
