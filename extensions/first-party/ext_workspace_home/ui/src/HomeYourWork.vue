<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { loadYourWork } from "./api";
import type { ComtryaGraphQLClient, LoadState, WorkItem } from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
}>();

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const reviewQueue = ref<WorkItem[]>([]);
const authoredPulls = ref<WorkItem[]>([]);
const failingChecks = ref<WorkItem[]>([]);
const graphClient = computed(() => props.client ?? props.comtryaClient);

onMounted(load);
watch(graphClient, () => void load());

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

function reviewCheckText(item: WorkItem): string {
  if (item.checks?.passed == null) return "-";
  return `${item.checks.passed}/${item.checks.total ?? item.checks.passed}`;
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
    <section class="section">
      <div class="section-strap">
        <span class="id">01</span>
        <h2>Review queue</h2>
        <span class="meta">{{ reviewQueue.length }} pulls</span>
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
        <h2>Your pulls</h2>
        <span class="meta">{{ authoredPulls.length }} authored</span>
      </div>
      <div v-for="item in authoredPulls" :key="String(item.id ?? item.number)" class="row">
        <span class="idn">{{ issueId(item) }}</span>
        <div>
          <div class="title">{{ item.title ?? "(untitled)" }}</div>
          <div class="sub">{{ repoLine(item) }} · {{ item.state?.toLowerCase() ?? "" }}</div>
        </div>
        <span class="check ok">ready</span>
        <span class="t">{{ item.updatedAt ?? item.time ?? "" }}</span>
      </div>
    </section>

    <section class="section">
      <div class="section-strap">
        <span class="id">03</span>
        <h2>Failing on your branches</h2>
        <span class="meta">{{ failingChecks.length }} checks</span>
      </div>
      <div v-for="item in failingChecks" :key="String(item.id ?? item.name)" class="row">
        <span class="idn">!CK</span>
        <div>
          <div class="title">{{ item.name ?? "(unnamed)" }}</div>
          <div class="sub">
            {{ repoLine(item) }}{{ item.branch ? ` · ${item.branch}` : "" }}
          </div>
        </div>
        <span class="check err">failing</span>
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
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.id,
.idn,
.sub,
.meta,
.check,
.t,
.extension-placeholder {
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.id,
.idn,
.sub,
.meta,
.t {
  color: var(--ink-faint, #888);
}

.title {
  font-family: var(--display, system-ui);
  font-weight: 600;
}

.ok {
  color: var(--ink-go, #008873);
}

.warn {
  color: var(--ink-warn, #c2410c);
}

.err {
  color: var(--ink-warn, #c2410c);
}
</style>
