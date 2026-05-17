<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  fetchComtryaProjects,
  LabelPill,
  renderMarkdown,
  useShortcuts,
  type ComtryaProject,
  type LabelCatalog,
} from "@comtrya/sdk-vue";
import {
  assignEpicProject,
  changeEpicState,
  epicByRef,
  epicProgress,
  issuesInEpic,
} from "./api";
import {
  resolveIssues,
  classifyIssueAuthor,
  type ResolvedIssue,
} from "./issue-rows";
import { ensureEpicDetailStyles } from "./epic-detail-styles";
import CustomElementHost from "./CustomElementHost.vue";
import { resolveProjectPolicy, type ProjectPolicy } from "./project-policy";
import {
  DEFAULT_WORKSPACE_ID,
  epicRef,
  stateTone,
  type ComtryaGraphQLClient,
  type Epic,
  type EpicProgress,
  type EpicState,
  type ExtensionRouteParams,
  type LoadState,
} from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  epic?: Epic | null;
  workspaceId?: string;
  id?: string;
  routeParams?: ExtensionRouteParams;
  labelCatalog?: LabelCatalog | null;
}>();

const targetStates: EpicState[] = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"];
const loadState = ref<LoadState>("idle");
const actionState = ref<"idle" | "submitting">("idle");
const error = ref<string | null>(null);
const actionError = ref<string | null>(null);
const loadedEpic = ref<Epic | null>(props.epic ?? null);
const progress = ref<EpicProgress | null>(null);
const issues = ref<ResolvedIssue[]>([]);
const focusedIssueIdx = ref<number | null>(null);

const graphClient = computed(() => props.client ?? props.comtryaClient);
const workspaceId = computed(
  () => props.workspaceId
    ?? props.routeParams?.params?.workspaceId
    ?? DEFAULT_WORKSPACE_ID,
);
const epicId = computed(() => props.id ?? props.routeParams?.params?.id ?? "");
const currentRef = computed(() => props.epic ? epicRef(props.epic) : `comtrya://epic/${epicId.value}`);
const epic = computed(() => loadedEpic.value ?? props.epic ?? null);
const tone = computed(() => stateTone(epic.value?.state));
const availableStates = computed(
  () => targetStates.filter((target) => target !== epic.value?.state),
);
const totalIssues = computed(
  () => (progress.value?.issuesOpen ?? 0) + (progress.value?.issuesClosed ?? 0),
);
const percent = computed(() => Math.max(0, Math.min(100, progress.value?.percentComplete ?? 0)));
const openCount = computed(() => issues.value.filter((i) => i.state !== "CLOSED").length);
const closedCount = computed(() => issues.value.filter((i) => i.state === "CLOSED").length);
const renderedBody = computed(() => renderMarkdown(epic.value?.bodyMarkdown ?? ""));
const canLoad = computed(() => graphClient.value && Boolean(epicId.value));
const ownerLabel = computed(() => {
  const ref = epic.value?.ownerRef;
  if (!ref) return null;
  if (ref.startsWith("comtrya://user/")) return ref.slice("comtrya://user/".length);
  if (ref.startsWith("comtrya://agent/")) return `${ref.slice("comtrya://agent/".length)} (agent)`;
  return ref;
});
const createdLabel = computed(() => relativeTime(epic.value?.createdAt));

/**
 * CUE Project ownership routing — when the epic is scoped to a
 * Project, surface the Project's declared `owners[].ref` so the
 * detail page reads as "this work is routed to <team> +
 * <maintainer>". Pulled from the repo's merged `package comtrya`
 * CUE evaluation (`comtryaConfig.projects[].owners[].ref`).
 *
 * Re-resolved whenever `epic.projectName` changes; cleared when
 * the epic has no project so the panel hides cleanly.
 */
const projectPolicy = ref<ProjectPolicy | null>(null);
const projectOwners = computed<string[]>(
  () => projectPolicy.value?.ownerRefs ?? [],
);

watch(
  () => epic.value?.projectName ?? "",
  async (projectName) => {
    if (!projectName) {
      projectPolicy.value = null;
      return;
    }
    try {
      projectPolicy.value = await resolveProjectPolicy(projectName);
    } catch {
      projectPolicy.value = null;
    }
  },
  { immediate: true },
);

// `classifyOwner` was a local copy of the iter 59 classifier;
// iter 62 routes through `classifyIssueAuthor` (re-export of
// the canonical `classifyPrincipal` from sdk-vue).
const classifyOwner = classifyIssueAuthor;

/**
 * Project picker — retroactively assigns or clears the Project
 * via the iter 69 `assign-project` op. Mirrors the iter 68
 * IssueDetail picker: optimistic update, rollback on error,
 * disabled select while the op is in flight.
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
  if (!target || !epic.value) return;
  const current = epic.value;
  const nextName = target.value || null;
  if ((current.projectName ?? null) === nextName) return;
  projectActionState.value = "submitting";
  projectActionError.value = null;
  const previous = current.projectName ?? null;
  // Optimistic update: hero meta chip + Routed-to panel refresh
  // before the op returns so the page stays responsive.
  loadedEpic.value = { ...current, projectName: nextName };
  try {
    const updated = await assignEpicProject(current.id, nextName);
    loadedEpic.value = updated;
  } catch (caught) {
    loadedEpic.value = { ...current, projectName: previous };
    target.value = previous ?? "";
    projectActionError.value =
      caught instanceof Error ? caught.message : String(caught);
  } finally {
    projectActionState.value = "idle";
  }
}

onMounted(() => {
  ensureEpicDetailStyles();
  void loadEpic();
});

const moveFocus = (delta: 1 | -1) => {
  if (issues.value.length === 0) return;
  const next = focusedIssueIdx.value === null
    ? 0
    : Math.max(0, Math.min(issues.value.length - 1, focusedIssueIdx.value + delta));
  focusedIssueIdx.value = next;
  void nextTick(() => focusIssueRow(next));
};

useShortcuts({
  j: (event) => { event.preventDefault(); moveFocus(1); },
  ArrowDown: (event) => { event.preventDefault(); moveFocus(1); },
  k: (event) => { event.preventDefault(); moveFocus(-1); },
  ArrowUp: (event) => { event.preventDefault(); moveFocus(-1); },
  Enter: (event) => {
    if (focusedIssueIdx.value === null) return;
    const issue = issues.value[focusedIssueIdx.value];
    if (!issue) return;
    event.preventDefault();
    openIssue(issue);
  },
});
watch(
  () => [graphClient.value, props.epic, workspaceId.value, epicId.value],
  () => void loadEpic(),
);

async function loadEpic(): Promise<void> {
  if (props.epic) {
    loadedEpic.value = props.epic;
    loadState.value = "ready";
    error.value = null;
    await loadRelated();
    return;
  }
  if (!canLoad.value || !graphClient.value) {
    loadedEpic.value = null;
    progress.value = null;
    issues.value = [];
    loadState.value = "error";
    error.value = "epic-detail: missing params";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    loadedEpic.value = await epicByRef(graphClient.value, currentRef.value);
    loadState.value = loadedEpic.value ? "ready" : "empty";
    await loadRelated();
  } catch (caught) {
    loadedEpic.value = null;
    progress.value = null;
    issues.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function loadRelated(): Promise<void> {
  if (!graphClient.value || !epic.value) {
    progress.value = null;
    issues.value = [];
    return;
  }
  const ref = epicRef(epic.value);
  const [progressResult, refsResult] = await Promise.allSettled([
    epicProgress(graphClient.value, ref),
    issuesInEpic(graphClient.value, ref),
  ]);
  progress.value = progressResult.status === "fulfilled" ? progressResult.value : null;
  const refs = refsResult.status === "fulfilled" ? refsResult.value : [];
  issues.value = await resolveIssues(refs);
  // Sort: open first, then closed; both by number desc so newer floats up.
  issues.value.sort((a, b) => {
    const aOpen = a.state !== "CLOSED";
    const bOpen = b.state !== "CLOSED";
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return (b.number ?? 0) - (a.number ?? 0);
  });
}

async function markState(state: EpicState): Promise<void> {
  if (!graphClient.value || !epic.value) return;
  actionState.value = "submitting";
  actionError.value = null;
  try {
    loadedEpic.value = await changeEpicState(graphClient.value, epic.value.id, state);
    await loadRelated();
  } catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    actionState.value = "idle";
  }
}

function labelForState(state: EpicState): string {
  return state.toLowerCase().replace("_", " ");
}

function openIssue(issue: ResolvedIssue): void {
  if (issue.href) window.location.assign(issue.href);
}

function focusIssueRow(idx: number): void {
  const list = document.querySelector(".epic-detail [data-smoke=\"epic-issues-list\"]");
  if (!list) return;
  const rows = list.querySelectorAll<HTMLElement>(".epic-issue-row");
  rows[idx]?.focus();
}

function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diff = Date.now() - then;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
</script>

<template>
  <main
    class="epic-detail"
    :data-state="loadState"
    :data-epic-id="epic?.id"
    data-smoke="epic-detail"
  >
    <p v-if="loadState === 'loading'" class="epic-line muted">Loading epic</p>
    <p v-else-if="loadState === 'error'" class="epic-line warn">{{ error }}</p>
    <p v-else-if="!epic" class="epic-line warn">
      No epic {{ epicId || "?" }} in {{ workspaceId }}
    </p>

    <template v-else>
      <header class="epic-header">
        <p class="epic-overline">epic</p>
        <h1 class="epic-title">{{ epic.title }}</h1>
        <div class="epic-meta">
          <span class="epic-pill" :class="tone.className">{{ tone.label }}</span>
          <span v-if="epic.projectName" class="epic-chip tone-blue" :title="`Scoped to project ${epic.projectName}`">
            <span class="chip-glyph">◇</span>{{ epic.projectName }}
          </span>
          <LabelPill v-for="label in epic.labels" :key="label" :name="label" :catalog="labelCatalog" />
          <span v-if="ownerLabel" class="epic-chip tone-grey" title="Owner">
            <span class="chip-glyph">@</span>{{ ownerLabel }}
          </span>
          <span v-if="epic.targetDate" class="epic-chip tone-grey">
            target {{ epic.targetDate }}
          </span>
          <span v-if="createdLabel" class="epic-meta-time">opened {{ createdLabel }}</span>
        </div>
      </header>

      <section class="epic-progress" data-smoke="epic-progress" v-if="progress || issues.length > 0">
        <div class="epic-progress-head">
          <span class="epic-progress-stat">
            <strong>{{ progress?.issuesClosed ?? closedCount }}</strong>
            <span class="stat-of">/ {{ totalIssues || issues.length }}</span>
            <span class="stat-label">closed</span>
          </span>
          <span class="epic-progress-sep">·</span>
          <span class="epic-progress-stat">
            <strong>{{ percent }}</strong>
            <span class="stat-label">% complete</span>
          </span>
          <span v-if="(progress?.childEpicsOpen ?? 0) + (progress?.childEpicsClosed ?? 0) > 0" class="epic-progress-sep">·</span>
          <span v-if="(progress?.childEpicsOpen ?? 0) + (progress?.childEpicsClosed ?? 0) > 0" class="epic-progress-stat">
            <strong>{{ progress?.childEpicsOpen ?? 0 }}</strong>
            <span class="stat-label">child epics open</span>
          </span>
        </div>
        <div class="epic-progress-bar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
          <div class="epic-progress-fill" :style="{ width: percent + '%' }"></div>
        </div>
      </section>

      <section class="epic-routed" data-smoke="epic-project-picker">
        <header class="epic-routed-head">
          <span class="epic-routed-label">Project</span>
          <a
            v-if="epic.projectName"
            :href="`/x/epics/?project=${encodeURIComponent(epic.projectName)}`"
            class="epic-routed-project"
            :title="`Filter epics to project ${epic.projectName}`"
          >◇ {{ epic.projectName }}</a>
        </header>
        <select
          class="epic-project-select"
          data-smoke="epic-project-select"
          :value="epic.projectName ?? ''"
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
        <p v-if="projectActionError" class="epic-line warn" role="alert">
          {{ projectActionError }}
        </p>
        <p class="epic-routed-source">
          Stamps <code>projectName</code> on this epic. Lights up workspace
          per-Project counts.
        </p>
      </section>

      <section
        v-if="epic.projectName && projectOwners.length > 0"
        class="epic-routed"
        data-smoke="epic-project-owners"
      >
        <header class="epic-routed-head">
          <span class="epic-routed-label">Routed to</span>
          <a
            :href="`/x/epics/?project=${encodeURIComponent(epic.projectName)}`"
            class="epic-routed-project"
            :title="`Filter epics to project ${epic.projectName}`"
          >◇ {{ epic.projectName }}</a>
        </header>
        <ul class="epic-routed-list">
          <li
            v-for="ref in projectOwners"
            :key="ref"
            class="epic-routed-owner"
            :data-author-kind="classifyOwner(ref).kind"
            :title="ref"
          >
            <span class="chip-glyph">{{ classifyOwner(ref).glyph }}</span>
            {{ classifyOwner(ref).label }}
          </li>
        </ul>
        <p class="epic-routed-source">
          From <code>package comtrya</code> · projects.{{ epic.projectName }}.owners
        </p>
      </section>

      <article
        v-if="renderedBody"
        class="epic-body prose"
        :data-epic-id="epic.id"
        data-smoke="epic-detail-main"
        v-html="renderedBody"
      ></article>
      <p v-else class="epic-body muted">No description yet.</p>

      <section class="epic-section" data-smoke="epic-issues">
        <header class="epic-section-head">
          <h3>Issues in this epic</h3>
          <span class="epic-section-count">
            <span :data-zero="openCount === 0">{{ openCount }}</span> open
            <span class="sep">·</span>
            <span :data-zero="closedCount === 0">{{ closedCount }}</span> closed
          </span>
        </header>
        <p v-if="issues.length === 0" class="epic-line muted">
          No issues linked yet. Link issues via the issue's "part of epic" relation.
        </p>
        <ul v-else class="epic-issues-list" data-smoke="epic-issues-list">
          <li
            v-for="(issue, idx) in issues"
            :key="issue.ref"
            class="epic-issue-row"
            :class="[`state-${issue.state.toLowerCase()}`, { focused: focusedIssueIdx === idx }]"
            tabindex="0"
            @click="openIssue(issue)"
            @keydown.enter.prevent="openIssue(issue)"
            @keydown.space.prevent="openIssue(issue)"
            @focus="focusedIssueIdx = idx"
          >
            <span class="row-state" :data-state="issue.state">
              <span v-if="issue.state === 'CLOSED'">●</span>
              <span v-else>○</span>
            </span>
            <span class="row-number">#{{ issue.number ?? "—" }}</span>
            <span class="row-title">{{ issue.title }}</span>
            <span class="row-trailing">
              <span v-if="issue.projectName" class="epic-chip tone-blue compact" :title="issue.projectName">
                <span class="chip-glyph">◇</span>{{ issue.projectName }}
              </span>
              <LabelPill v-for="label in issue.labels" :key="label" :name="label" />
              <span
                v-if="issue.authorRef"
                class="row-author"
                :data-author-kind="classifyIssueAuthor(issue.authorRef).kind"
                :title="issue.authorRef"
              >
                <span class="author-glyph">{{ classifyIssueAuthor(issue.authorRef).glyph }}</span>
                {{ classifyIssueAuthor(issue.authorRef).label }}
              </span>
            </span>
          </li>
        </ul>
        <p v-if="issues.length > 0" class="epic-kbd-hint muted">
          <kbd>j</kbd> / <kbd>k</kbd> move · <kbd>↵</kbd> open
        </p>
      </section>

      <section class="epic-actions-section">
        <h3 class="epic-actions-heading">Change state</h3>
        <div class="epic-actions">
          <button
            v-for="state in availableStates"
            :key="state"
            type="button"
            :disabled="actionState === 'submitting'"
            @click="markState(state)"
          >
            mark {{ labelForState(state) }}
          </button>
        </div>
        <p v-if="actionError" class="epic-line warn" role="alert">{{ actionError }}</p>
      </section>

      <section class="epic-comments">
        <CustomElementHost
          tag="comtrya-comment-thread"
          :attributes="{ target: epicRef(epic) }"
          :properties="{ target: epicRef(epic), comtryaClient: graphClient }"
        />
      </section>
    </template>
  </main>
</template>
