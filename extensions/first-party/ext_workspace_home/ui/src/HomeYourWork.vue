<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { invokeOp, subscribeLiveEvents } from "@comtrya/sdk-core";
import { loadYourWork } from "./api";
import type { ComtryaGraphQLClient, LoadState, WorkItem } from "./types";


const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
  workspaceId?: string | null;
}>();

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const reviewQueue = ref<WorkItem[]>([]);
const authoredPulls = ref<WorkItem[]>([]);
const failingChecks = ref<WorkItem[]>([]);

/**
 * Open issues with at least one assignee. Until the kernel
 * resolves `viewer { urn }`, the fallback shape is "everything
 * routed to anyone" — once viewer auth lands, this filter
 * narrows to assignees that include the viewer.
 *
 * Sources from `ext_issues/list-issues` directly so it picks up
 * the iteration-34 `assignees: list<uri>` field. Subscribes to
 * the canonical `dev.comtrya.issues.{opened,closed,reopened}`
 * SSE topics for live updates.
 */
const assignedIssues = ref<WorkItem[]>([]);
const issueUnsubscribers: Array<() => void> = [];

const graphClient = computed(() => props.client ?? props.comtryaClient);
const workspaceUri = computed(() =>
  props.workspaceId ? `comtrya://workspace/${props.workspaceId}` : null,
);

onMounted(() => {
  void load();
  void refreshAssignedIssues();
  for (const type of [
    "dev.comtrya.issues.opened",
    "dev.comtrya.issues.closed",
    "dev.comtrya.issues.reopened",
  ]) {
    issueUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void refreshAssignedIssues(),
        onError: () => {},
      }),
    );
  }
});

onUnmounted(() => {
  for (const off of issueUnsubscribers) off();
  issueUnsubscribers.length = 0;
});

watch(graphClient, () => void load());
watch(workspaceUri, () => void refreshAssignedIssues());

async function load(): Promise<void> {
  if (!graphClient.value) {
    loadState.value = "error";
    error.value = "Failed to load your work: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    const data = await loadYourWork(graphClient.value);
    reviewQueue.value = data.reviewQueue;
    authoredPulls.value = data.authoredPulls;
    failingChecks.value = data.failingChecks;
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    error.value = `Failed to load your work: ${
      caught instanceof Error ? caught.message : String(caught)
    }`;
  }
}

function issueId(item: WorkItem): string {
  return `#${item.number ?? item.id ?? "?"}`;
}

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function stateLabel(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

interface AssigneeIssue {
  id?: string;
  number?: number;
  title?: string;
  state?: string;
  projectName?: string | null;
  assignees?: string[];
}

function shortAssignee(ref: string): string {
  return ref.replace(/^comtrya:\/\/[a-z]+\//, "");
}

async function refreshAssignedIssues(): Promise<void> {
  const repository = workspaceUri.value;
  if (!repository) {
    assignedIssues.value = [];
    return;
  }
  const result = await invokeOp<AssigneeIssue[]>(
    "ext_issues",
    "issues",
    "list-issues",
    { repository, limit: 1024 },
  );
  if (!result.ok || !Array.isArray(result.value)) {
    assignedIssues.value = [];
    return;
  }
  assignedIssues.value = result.value
    .filter((issue) => {
      const state = (issue.state ?? "").toUpperCase();
      const isOpen = state === "OPEN" || state === "REOPENED";
      const hasAssignee = Array.isArray(issue.assignees) && issue.assignees.length > 0;
      return isOpen && hasAssignee;
    })
    .slice(0, 8)
    .map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title ?? "(untitled)",
      state: issue.state,
      author:
        (issue.assignees ?? []).map(shortAssignee).join(", ") || null,
      repositoryPath: issue.projectName ?? null,
    }));
}

function reviewCheckText(item: WorkItem): string {
  if (item.checks?.passed == null) return "No checks";
  const total = item.checks.total ?? item.checks.passed;
  return `${item.checks.passed}/${total} checks`;
}

function reviewCheckClass(item: WorkItem): string {
  return item.checks?.passed === item.checks?.total ? "ok" : "warn";
}

function repoLine(item: WorkItem): string {
  return item.repositoryPath ?? item.repository ?? "";
}
</script>

<template>
  <article v-if="loadState === 'error'" class="extension-placeholder" data-smoke="home-your-work">
    {{ error }}
  </article>
  <div v-else data-smoke="home-your-work">
    <section v-if="assignedIssues.length > 0" class="section">
      <div class="section-strap">
        <span class="id">00</span>
        <h2>Assigned issues</h2>
        <span class="meta">{{ countLabel(assignedIssues.length, "assigned issue") }}</span>
      </div>
      <div
        v-for="item in assignedIssues"
        :key="String(item.id ?? item.number)"
        class="row"
      >
        <span class="idn">{{ issueId(item) }}</span>
        <div>
          <div class="title">{{ item.title ?? "(untitled)" }}</div>
          <div class="sub">
            <template v-if="item.author">Assigned to {{ item.author }}</template>
            <template v-if="item.repositoryPath">
              <template v-if="item.author"> · </template>{{ item.repositoryPath }}
            </template>
          </div>
        </div>
        <span class="check ok">{{ stateLabel(item.state) }}</span>
        <span class="t"></span>
      </div>
    </section>

    <section class="section">
      <div class="section-strap">
        <span class="id">01</span>
        <h2>Pull requests awaiting review</h2>
        <span class="meta">{{ countLabel(reviewQueue.length, "pull request") }}</span>
      </div>
      <div v-for="item in reviewQueue" :key="String(item.id ?? item.number)" class="row">
        <span class="idn">{{ issueId(item) }}</span>
        <div>
          <div class="title">{{ item.title ?? "(untitled)" }}</div>
          <div class="sub">
            {{ item.author ? `@${item.author} · ` : "" }}{{ repoLine(item) }}
          </div>
        </div>
        <span class="check" :class="reviewCheckClass(item)">{{ reviewCheckText(item) }}</span>
        <span class="t">{{ item.updatedAt ?? item.time ?? "" }}</span>
      </div>
    </section>

    <section class="section">
      <div class="section-strap">
        <span class="id">02</span>
        <h2>Your pull requests</h2>
        <span class="meta">{{ countLabel(authoredPulls.length, "authored pull request") }}</span>
      </div>
      <div v-for="item in authoredPulls" :key="String(item.id ?? item.number)" class="row">
        <span class="idn">{{ issueId(item) }}</span>
        <div>
          <div class="title">{{ item.title ?? "(untitled)" }}</div>
          <div class="sub">{{ repoLine(item) }} · {{ item.state?.toLowerCase() ?? "" }}</div>
        </div>
        <span class="check ok">Ready</span>
        <span class="t">{{ item.updatedAt ?? item.time ?? "" }}</span>
      </div>
    </section>

    <section class="section">
      <div class="section-strap">
        <span class="id">03</span>
        <h2>Failing checks</h2>
        <span class="meta">{{ countLabel(failingChecks.length, "check") }}</span>
      </div>
      <div v-for="item in failingChecks" :key="String(item.id ?? item.name)" class="row">
        <span class="idn">!CK</span>
        <div>
          <div class="title">{{ item.name ?? "(unnamed)" }}</div>
          <div class="sub">
            {{ repoLine(item) }}{{ item.branch ? ` · ${item.branch}` : "" }}
          </div>
        </div>
        <span class="check err">Failing</span>
        <span class="t">{{ item.updatedAt ?? item.time ?? "" }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section {
  display: grid;
  gap: 8px;
}

.section + .section {
  margin-top: 16px;
}

.section-strap,
.row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px;
  align-items: baseline;
}

.section-strap h2 {
  margin: 0;
  font-family: var(--font-sans, system-ui);
  font-size: 14px;
  font-weight: 600;
}

.id,
.idn,
.sub,
.meta,
.check,
.t,
.extension-placeholder {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.sub,
.meta,
.check,
.t,
.extension-placeholder {
  font-family: var(--font-sans, system-ui);
}

.id,
.idn,
.sub,
.meta,
.t {
  color: var(--fg-3, rgba(255,255,255,0.52));
}

.title {
  font-family: var(--font-sans, system-ui);
  font-weight: 600;
}

.ok {
  color: var(--ok, oklch(75% 0.15 150));
}

.warn {
  color: var(--err, oklch(70% 0.19 25));
}

.err {
  color: var(--err, oklch(70% 0.19 25));
}
</style>
