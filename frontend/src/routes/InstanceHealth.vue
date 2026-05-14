<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = defineProps<{
  mode: "instance" | "settings" | "health";
}>();

interface ReadyzPayload {
  ready?: boolean;
  mode?: string;
  checks?: Record<string, boolean>;
  unsupported?: Array<{
    id: string;
    pathPrefix: string;
    message: string;
  }>;
}

interface HealthPayload {
  status?: string;
}

interface InstancePayload {
  instance?: {
    id: string;
    name: string;
    publicURL?: string | null;
    capabilities?: Record<string, boolean>;
  };
  viewer?: {
    authenticated: boolean;
    permissions: string[];
  };
  extensionInstallations?: Array<{
    id: string;
    name?: string;
    routePrefix: string | null;
    status?: string;
  }>;
}

const INSTANCE_QUERY = `query ShellInstanceHealth {
  viewer { authenticated permissions }
  instance { id name publicURL capabilities { extensionRuntime gitHTTPS gitLFS graphqlSubscriptions sse } }
  extensionInstallations { id name routePrefix status }
}`;

const loadState = ref<"loading" | "ready" | "error">("loading");
const error = ref<string | null>(null);
const readyz = ref<ReadyzPayload | null>(null);
const healthz = ref<HealthPayload | null>(null);
const instance = ref<InstancePayload | null>(null);
const title = computed(() => {
  if (props.mode === "settings") return "Settings";
  if (props.mode === "health") return "Health";
  return "Instance";
});
const smokeName = computed(() => `${props.mode}-admin-shell`);
const readyChecks = computed(() => Object.entries(readyz.value?.checks ?? {}));
const capabilities = computed(() => Object.entries(instance.value?.instance?.capabilities ?? {}));

onMounted(() => void load());

async function load(): Promise<void> {
  loadState.value = "loading";
  error.value = null;
  try {
    const [ready, health, graph] = await Promise.all([
      getJson<ReadyzPayload>("/readyz"),
      getJson<HealthPayload>("/healthz"),
      graphql<InstancePayload>(INSTANCE_QUERY),
    ]);
    readyz.value = ready;
    healthz.value = health;
    instance.value = graph;
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  const body = (await response.json()) as T;
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return body;
}

async function graphql<T>(query: string): Promise<T> {
  const response = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const envelope = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok || envelope.errors?.length) {
    throw new Error(envelope.errors?.[0]?.message ?? response.statusText);
  }
  if (!envelope.data) throw new Error("GraphQL response did not include data");
  return envelope.data;
}
</script>

<template>
  <div :data-smoke="smokeName">
    <section class="page-header">
      <div class="title-group">
        <span class="overline">Admin</span>
        <h1>{{ title }}</h1>
      </div>
      <div class="summary-grid" aria-label="Instance health summary">
        <div>
          <span>Ready</span>
          <strong>{{ readyz?.ready === true ? "yes" : "no" }}</strong>
        </div>
        <div>
          <span>Health</span>
          <strong>{{ healthz?.status ?? "unknown" }}</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>{{ readyz?.mode ?? "unknown" }}</strong>
        </div>
      </div>
    </section>

    <p v-if="loadState === 'error'" class="repo-state" role="alert">{{ error }}</p>

    <section class="admin-grid">
      <section class="panel" data-smoke="instance-health">
        <header class="panel-heading">
          <h2>{{ instance?.instance?.name ?? "Instance" }}</h2>
          <span class="chip ok">{{ instance?.instance?.id ?? "loading" }}</span>
        </header>
        <div class="admin-list">
          <div>
            <span>Public URL</span>
            <code>{{ instance?.instance?.publicURL ?? "-" }}</code>
          </div>
          <div>
            <span>Viewer</span>
            <code>{{ instance?.viewer?.authenticated ? "authenticated" : "anonymous" }}</code>
          </div>
          <div>
            <span>Extensions</span>
            <code>{{ instance?.extensionInstallations?.length ?? 0 }}</code>
          </div>
        </div>
      </section>

      <section class="panel" data-smoke="instance-readyz">
        <header class="panel-heading">
          <h2>Readiness</h2>
          <span class="chip" :class="readyz?.ready ? 'ok' : 'err'">{{ readyz?.ready ? "ready" : "not ready" }}</span>
        </header>
        <div class="admin-list">
          <div v-for="[name, ok] in readyChecks" :key="name">
            <span>{{ name }}</span>
            <code>{{ ok ? "ok" : "fail" }}</code>
          </div>
        </div>
      </section>

      <section class="panel" data-smoke="instance-capabilities">
        <header class="panel-heading">
          <h2>Capabilities</h2>
        </header>
        <div class="admin-list">
          <div v-for="[name, enabled] in capabilities" :key="name">
            <span>{{ name }}</span>
            <code>{{ enabled ? "enabled" : "disabled" }}</code>
          </div>
        </div>
      </section>

      <section class="panel" data-smoke="instance-unsupported">
        <header class="panel-heading">
          <h2>Unsupported Surfaces</h2>
        </header>
        <div class="admin-list">
          <div v-for="surface in readyz?.unsupported ?? []" :key="surface.id">
            <span>{{ surface.id }}</span>
            <code>{{ surface.pathPrefix }}</code>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>
