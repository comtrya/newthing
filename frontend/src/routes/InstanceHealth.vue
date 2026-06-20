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
const readySummary = computed(() => {
  if (loadState.value !== "ready") return "—";
  return readyz.value?.ready === true ? "Ready" : "Not ready";
});
const healthSummary = computed(() => {
  if (loadState.value !== "ready") return "—";
  return formatStatusLabel(healthz.value?.status ?? "unknown");
});
const modeSummary = computed(() => {
  if (loadState.value !== "ready") return "—";
  return formatStatusLabel(readyz.value?.mode ?? "unknown");
});
const readyChecks = computed(() =>
  Object.entries(readyz.value?.checks ?? {}).map(([name, ok]) => ({
    name,
    label: systemLabel(name),
    status: ok ? "Passing" : "Failing",
  })),
);
const capabilities = computed(() =>
  Object.entries(instance.value?.instance?.capabilities ?? {}).map(([name, enabled]) => ({
    name,
    label: systemLabel(name),
    status: enabled ? "Enabled" : "Disabled",
  })),
);

const systemLabels: Record<string, string> = {
  auditLogWritable: "Audit log",
  configValid: "Configuration",
  dataDirWritable: "Data directory",
  eventLogWritable: "Event log",
  extensionRuntime: "Extension runtime",
  extensionStorageDocuments: "Extension storage documents",
  extensionStorageSchema: "Extension storage schema",
  gitHTTPS: "Git HTTPS",
  gitLFS: "Git LFS",
  graphqlSubscriptions: "GraphQL subscriptions",
  operatorCodeConfigured: "Operator code",
  productionTlsTerminated: "TLS termination",
  repositoryRoot: "Repository root",
  sse: "Server-sent events",
};

function systemLabel(name: string): string {
  return systemLabels[name] ?? titleCaseWords(name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
}

function formatStatusLabel(value: string): string {
  if (value.toLowerCase() === "ok") return "OK";
  return titleCaseWords(value);
}

function titleCaseWords(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

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
  <div class="admin-shell" :data-smoke="smokeName">
    <section class="page-header">
      <div class="title-group">
        <span class="overline">Admin</span>
        <h1>{{ title }}</h1>
      </div>
      <div class="summary-grid" aria-label="Instance health summary" :aria-busy="loadState !== 'ready'">
        <div>
          <span>Ready</span>
          <strong>{{ readySummary }}</strong>
        </div>
        <div>
          <span>Health</span>
          <strong>{{ healthSummary }}</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>{{ modeSummary }}</strong>
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
            <code>{{ instance?.instance?.publicURL ?? "Not configured" }}</code>
          </div>
          <div>
            <span>Viewer</span>
            <code>{{ instance?.viewer?.authenticated ? "Authenticated" : "Anonymous" }}</code>
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
          <span class="chip" :class="readyz?.ready ? 'ok' : 'err'">{{ readyz?.ready ? "Ready" : "Not ready" }}</span>
        </header>
        <div class="admin-list">
          <div v-for="check in readyChecks" :key="check.name">
            <span>{{ check.label }}</span>
            <code>{{ check.status }}</code>
          </div>
        </div>
      </section>

      <section class="panel" data-smoke="instance-capabilities">
        <header class="panel-heading">
          <h2>Capabilities</h2>
        </header>
        <div class="admin-list">
          <div v-for="capability in capabilities" :key="capability.name">
            <span>{{ capability.label }}</span>
            <code>{{ capability.status }}</code>
          </div>
        </div>
      </section>

      <section class="panel" data-smoke="instance-unsupported">
        <header class="panel-heading">
          <h2>Unsupported routes</h2>
        </header>
        <div v-if="(readyz?.unsupported?.length ?? 0) > 0" class="admin-list">
          <div v-for="surface in readyz?.unsupported ?? []" :key="surface.id">
            <span>{{ systemLabel(surface.id) }}</span>
            <code>{{ surface.pathPrefix }}</code>
          </div>
        </div>
        <p v-else class="panel-empty">No unsupported routes.</p>
      </section>
    </section>
  </div>
</template>
