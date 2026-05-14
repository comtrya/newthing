<script setup lang="ts">
import { applyOptimistic } from "@comtrya/sdk-core";
import { computed, onMounted, ref, watch } from "vue";
import {
  closeIssue,
  issueByNumber,
  issueRelations,
  reopenIssue,
} from "./api";
import CustomElementHost from "./CustomElementHost.vue";
import {
  DEFAULT_WORKSPACE_ID,
  issueRef,
  stateTone,
  type ComtryaGraphQLClient,
  type ExtensionRouteParams,
  type Issue,
  type LoadState,
  type Relation,
} from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  issue?: Issue | null;
  workspaceId?: string;
  number?: number | string;
  routeParams?: ExtensionRouteParams;
}>();

const loadState = ref<LoadState>("idle");
const actionState = ref<"idle" | "submitting">("idle");
const error = ref<string | null>(null);
const actionError = ref<string | null>(null);
const loadedIssue = ref<Issue | null>(props.issue ?? null);
const relations = ref<Relation[]>([]);
const graphClient = computed(() => props.client ?? props.comtryaClient);
const workspaceId = computed(
  () => props.workspaceId
    ?? props.routeParams?.params?.workspaceId
    ?? DEFAULT_WORKSPACE_ID,
);
const issue = computed(() => loadedIssue.value ?? props.issue ?? null);
const tone = computed(() => stateTone(issue.value?.state));
const issueNumber = computed(() => Number(
  props.number ?? props.routeParams?.params?.number,
));
const canLoad = computed(() => graphClient.value && Number.isFinite(issueNumber.value));

onMounted(loadIssue);
watch(
  () => [
    graphClient.value,
    props.issue,
    workspaceId.value,
    props.number,
    props.routeParams?.params?.number,
  ],
  () => void loadIssue(),
);

async function loadIssue(): Promise<void> {
  if (props.issue) {
    loadedIssue.value = props.issue;
    loadState.value = "ready";
    error.value = null;
    await loadRelations();
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
    loadedIssue.value = await issueByNumber(
      graphClient.value,
      workspaceId.value,
      issueNumber.value,
    );
    loadState.value = loadedIssue.value ? "ready" : "empty";
    await loadRelations();
  } catch (caught) {
    loadedIssue.value = null;
    relations.value = [];
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function loadRelations(): Promise<void> {
  if (!graphClient.value || !issue.value) {
    relations.value = [];
    return;
  }
  try {
    relations.value = await issueRelations(graphClient.value, issue.value.id);
  } catch {
    relations.value = [];
  }
}

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
    } else {
      await loadRelations();
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
    } else {
      await loadRelations();
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
      <header>
        <h1>{{ issue.title }}</h1>
        <div class="issue-detail-meta">
          <span class="issue-pill" :class="tone.className">{{ tone.label }}</span>
          <span>#{{ issue.number }}</span>
          <span>opened by {{ issue.authorRef ?? "unknown" }}</span>
          <span v-if="issue.createdAt">{{ issue.createdAt }}</span>
        </div>
      </header>

      <article
        class="issue-body"
        :data-issue-id="issue.id"
        data-smoke="issue-detail-main"
      >
        {{ issue.bodyMarkdown || "(no description)" }}
      </article>

      <section class="issue-epics" data-smoke="issue-detail-epics">
        <h3>Part of</h3>
        <div v-if="relations.length === 0" class="issue-line muted">not in any epic</div>
        <ul v-else>
          <li v-for="relation in relations" :key="relation.id">
            <CustomElementHost
              tag="comtrya-resource-card"
              :attributes="{ ref: relation.to }"
              :properties="{ ref: relation.to, comtryaClient: graphClient }"
            />
          </li>
        </ul>
      </section>

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

      <CustomElementHost
        tag="comtrya-comment-thread"
        :attributes="{ target: issueRef(issue) }"
        :properties="{ target: issueRef(issue), comtryaClient: graphClient }"
      />
    </template>
  </main>
</template>

<style scoped>
.issue-detail {
  max-width: 720px;
  display: grid;
  gap: 16px;
  padding: 24px 0;
}

.issue-detail h1 {
  margin: 0;
  font-family: var(--display, system-ui);
}

.issue-detail-meta,
.issue-line,
.issue-actions button,
.issue-epics {
  font-family: var(--mono, monospace);
}

.issue-detail-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--ink-faint, #888);
  font-size: 12px;
}

.issue-pill {
  padding: 1px 8px;
  border: 1px solid currentColor;
}

.issue-state-open {
  color: var(--ink-go, #008873);
}

.issue-state-closed {
  color: var(--ink-faint, #888);
}

.issue-body {
  min-height: 96px;
  padding: 12px;
  border: 1px solid var(--ink-rule, #d0cfc8);
  white-space: pre-wrap;
}

.issue-epics {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

.issue-epics h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 13px;
}

.issue-epics ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.issue-actions {
  display: flex;
  gap: 8px;
}

.issue-actions button {
  padding: 6px 14px;
  cursor: pointer;
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
</style>
