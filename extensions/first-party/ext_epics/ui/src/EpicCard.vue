<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { epicByRef, epicProgress } from "./api";
import {
  epicHref,
  stateTone,
  type ComtryaGraphQLClient,
  type Epic,
  type EpicProgress,
  type LoadState,
} from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  epic?: Epic | null;
  ref?: string;
  resourceRef?: string;
  /**
   * Optional owner URN currently driving a list-level filter.
   * When set + matches this card's owner, the chip renders in
   * the active (inverted ink/paper) state.
   */
  activeOwner?: string | null;
  /**
   * Optional project name currently driving a list-level filter.
   * Set by the parent when an EpicsList consumer wants the chip
   * to show its active state.
   */
  activeProject?: string | null;
}>();

const emit = defineEmits<{
  /** Fired when the user clicks the owner chip — list owns the
   * filter state, so the click bubbles up rather than mutating
   * here. */
  (event: "owner-click", ownerRef: string): void;
  /** Same pattern for the project chip. */
  (event: "project-click", projectName: string): void;
}>();

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const loadedEpic = ref<Epic | null>(props.epic ?? null);
const progress = ref<EpicProgress | null>(null);
const resolvedRef = computed(() => props.resourceRef ?? props.ref ?? "");
const graphClient = computed(() => props.client ?? props.comtryaClient);
const epic = computed(() => props.epic ?? loadedEpic.value);
const tone = computed(() => stateTone(epic.value?.state));
const totalIssues = computed(
  () => (progress.value?.issuesOpen ?? 0) + (progress.value?.issuesClosed ?? 0),
);

onMounted(loadEpic);
watch(
  () => [graphClient.value, props.epic, resolvedRef.value],
  () => void loadEpic(),
);

async function loadEpic(): Promise<void> {
  if (props.epic) {
    loadedEpic.value = props.epic;
    loadState.value = "ready";
    error.value = null;
    await loadProgress();
    return;
  }
  if (!resolvedRef.value) {
    loadedEpic.value = null;
    progress.value = null;
    loadState.value = "error";
    error.value = "epic-card: missing ref";
    return;
  }
  if (!graphClient.value) {
    loadedEpic.value = null;
    progress.value = null;
    loadState.value = "error";
    error.value = "epic-card: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    loadedEpic.value = await epicByRef(graphClient.value, resolvedRef.value);
    loadState.value = loadedEpic.value ? "ready" : "empty";
    await loadProgress();
  } catch (caught) {
    loadedEpic.value = null;
    progress.value = null;
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function loadProgress(): Promise<void> {
  if (!graphClient.value || !resolvedRef.value) {
    progress.value = null;
    return;
  }
  try {
    progress.value = await epicProgress(graphClient.value, resolvedRef.value);
  } catch {
    progress.value = null;
  }
}

/**
 * Classifier for typed `comtrya://` owner refs. Same palette as
 * IssuesList / IssueDetail / PullsDetail — kept in sync
 * deliberately so the glyph + tone match across every surface
 * that renders an identity URN.
 */
function ownerLabel(ownerRef: string | null | undefined): {
  label: string;
  glyph: string;
  kind: "human" | "agent" | "credential" | "bot" | "team" | "unknown";
} {
  if (!ownerRef) return { label: "unknown", glyph: "·", kind: "unknown" };
  const stripped = ownerRef.replace(/^comtrya:\/\//, "");
  const [scheme = "", ...rest] = stripped.split("/");
  const id = rest.join("/") || ownerRef;
  if (scheme === "agent") return { label: id, glyph: "✦", kind: "agent" };
  if (scheme === "bot") return { label: id, glyph: "◆", kind: "bot" };
  if (scheme === "credential") return { label: id, glyph: "⚙", kind: "credential" };
  if (scheme === "team") return { label: id, glyph: "◇", kind: "team" };
  if (scheme === "user") return { label: id, glyph: id.slice(0, 1).toUpperCase(), kind: "human" };
  return { label: id, glyph: id.slice(0, 1).toUpperCase() || "·", kind: "unknown" };
}
</script>

<template>
  <article class="epic-card" :data-state="loadState" data-smoke="epic-card">
    <template v-if="epic">
      <div
        class="epic-card-body"
        :data-epic-id="epic.id"
        data-smoke="epic-card-body"
      >
        <div class="epic-card-title">
          <span class="epic-pill" :class="tone.className">{{ tone.label }}</span>
          <a class="epic-title-link" :href="epicHref(epic)">{{ epic.title }}</a>
          <button
            v-if="epic.ownerRef"
            type="button"
            class="epic-owner"
            :class="{ active: props.activeOwner === epic.ownerRef }"
            :data-author-kind="ownerLabel(epic.ownerRef).kind"
            :title="`${epic.ownerRef}\nClick to filter by this owner`"
            @click.prevent.stop="emit('owner-click', epic.ownerRef)"
          >
            <span class="owner-glyph">{{ ownerLabel(epic.ownerRef).glyph }}</span>
            {{ ownerLabel(epic.ownerRef).label }}
          </button>
          <button
            v-if="epic.projectName"
            type="button"
            class="epic-project"
            :class="{ active: props.activeProject === epic.projectName }"
            :title="`${epic.projectName}\nClick to filter by this project`"
            @click.prevent.stop="emit('project-click', epic.projectName)"
          >
            <span class="project-glyph">◇</span>
            {{ epic.projectName }}
          </button>
        </div>
        <div v-if="progress" class="epic-meta">
          <span>{{ progress.issuesClosed ?? 0 }}/{{ totalIssues }} issues</span>
          <span>{{ progress.percentComplete ?? 0 }}% complete</span>
        </div>
        <div v-if="epic.targetDate" class="epic-meta">
          <span>target: {{ epic.targetDate }}</span>
        </div>
      </div>
    </template>
    <p v-else-if="loadState === 'loading'" class="epic-line muted">
      Loading {{ resolvedRef }}
    </p>
    <div v-else class="epic-card-fallback">
      <p class="epic-line muted">{{ resolvedRef || "epic" }}</p>
      <p class="epic-line warn">{{ error ?? "epic not found" }}</p>
    </div>
  </article>
</template>

<style scoped>
.epic-card {
  display: block;
}

.epic-card-body {
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border: 0.5px solid var(--line, rgba(255,255,255,0.07));
}

.epic-card-title {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

.epic-pill,
.epic-meta,
.epic-line {
  font-family: var(--font-mono, monospace);
}

.epic-pill {
  padding: 1px 8px;
  border: 0.5px solid currentColor;
  font-size: 10px;
}

.epic-project {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
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

.epic-project:hover {
  background: var(--bg-2, #0e1014);
}

.epic-project.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
  border-color: var(--fg, rgba(255,255,255,0.94));
}

/* When owner + project are both present, owner pushes right and
   project sits snug against it. */
.epic-owner + .epic-project {
  margin-left: 4px;
}

.epic-project .project-glyph {
  font-size: 10px;
}

.epic-owner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 0 6px;
  border: 1px dashed currentColor;
  color: var(--fg-2, rgba(255,255,255,0.74));
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-family: var(--font-mono, monospace);
}

.epic-owner:hover {
  background: var(--bg-2, #0e1014);
}

.epic-owner.active {
  background: var(--fg, rgba(255,255,255,0.94));
  color: var(--bg, #0a0b0e);
  border-style: solid;
  border-color: var(--fg, rgba(255,255,255,0.94));
}

.epic-owner.active .owner-glyph {
  color: inherit;
}

.epic-owner .owner-glyph {
  width: 12px;
  height: 12px;
  display: inline-grid;
  place-items: center;
  font-size: 9px;
  font-weight: 700;
}

.epic-owner[data-author-kind="agent"]      { color: #6b3fa0; }
.epic-owner[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.epic-owner[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }
.epic-owner[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }

.epic-state-good {
  color: var(--ok, oklch(75% 0.15 150));
}

.epic-state-warn {
  color: var(--err, oklch(70% 0.19 25));
}

.epic-state-muted,
.epic-meta,
.muted {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.epic-title-link {
  min-width: 0;
  color: inherit;
  font-family: var(--font-serif, system-ui);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.epic-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
}

.epic-line {
  margin: 4px 0;
  font-size: 12px;
}

.warn {
  color: var(--err, oklch(70% 0.19 25));
}
</style>
