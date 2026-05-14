<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { loadActivity } from "./api";
import type { ActivityEvent, ComtryaGraphQLClient, LoadState } from "./types";

const props = defineProps<{
  client?: ComtryaGraphQLClient;
  comtryaClient?: ComtryaGraphQLClient;
}>();

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const events = ref<ActivityEvent[]>([]);
const graphClient = computed(() => props.client ?? props.comtryaClient);

onMounted(load);
watch(graphClient, () => void load());

async function load(): Promise<void> {
  if (!graphClient.value) {
    loadState.value = "error";
    error.value = "Failed to load activity: no client";
    return;
  }
  loadState.value = "loading";
  error.value = null;
  try {
    events.value = await loadActivity(graphClient.value);
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    error.value = `Failed to load activity: ${
      caught instanceof Error ? caught.message : String(caught)
    }`;
  }
}
</script>

<template>
  <article v-if="loadState === 'error'" class="extension-placeholder" data-smoke="home-activity">
    {{ error }}
  </article>
  <div v-else class="rail-section activity" data-smoke="home-activity">
    <div class="rail-strap">
      <span class="id">05</span>
      <h3>Activity</h3>
      <span class="count">live</span>
    </div>

    <div v-for="event in events" :key="`${event.summary}-${event.time}`" class="ev">
      <span class="summary">
        {{ event.summary ?? "(event)" }}
        <span class="src">{{ event.repositoryPath ?? event.actor ?? "" }}</span>
      </span>
      <span class="t">{{ event.time ?? "" }}</span>
    </div>
  </div>
</template>

<style scoped>
.rail-section {
  display: grid;
  gap: 8px;
}

.rail-strap,
.ev {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.rail-strap h3 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 14px;
}

.id,
.count,
.src,
.t,
.extension-placeholder {
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.id,
.count,
.src,
.t {
  color: var(--ink-faint, #888);
}

.summary {
  min-width: 0;
  font-family: var(--display, system-ui);
  font-weight: 600;
}
</style>
