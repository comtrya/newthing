<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { LoadState } from "./types";

interface ReadyResponse {
  unsupported?: unknown[];
}

const loadState = ref<LoadState>("idle");
const error = ref<string | null>(null);
const boundaryCount = ref(0);
const origin = ref("");
const allOk = computed(() => boundaryCount.value === 0);

onMounted(load);

async function load(): Promise<void> {
  loadState.value = "loading";
  error.value = null;
  origin.value = window.location.origin;
  try {
    const ready = await fetch("/readyz").then((response) => response.json() as Promise<ReadyResponse>);
    boundaryCount.value = ready.unsupported?.length ?? 0;
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    error.value = `Failed to load instance: ${
      caught instanceof Error ? caught.message : String(caught)
    }`;
  }
}
</script>

<template>
  <article v-if="loadState === 'error'" class="extension-placeholder" data-smoke="home-instance">
    {{ error }}
  </article>
  <section v-else class="instance" data-smoke="home-instance">
    <span class="id">06</span>
    <div class="stats">
      <span :class="allOk ? 'ok' : 'err'">{{ allOk ? "READY" : "NOT READY" }}</span>
      <span><strong>{{ boundaryCount }}</strong> boundaries</span>
    </div>
    <code class="clone">git clone {{ origin }}/git/comtrya.git</code>
    <a class="link" href="/instance">/instance</a>
  </section>
</template>

<style scoped>
.instance {
  display: grid;
  gap: 8px;
}

.id,
.stats,
.clone,
.link,
.extension-placeholder {
  font-family: var(--mono, monospace);
  font-size: 12px;
}

.id,
.clone,
.link {
  color: var(--ink-faint, #888);
}

.stats {
  display: flex;
  gap: 8px;
}

.ok {
  color: var(--ink-go, #008873);
}

.err {
  color: var(--ink-warn, #c2410c);
}
</style>
