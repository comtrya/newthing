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

interface GitTokenRecord {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  expiresAt?: number | null;
  createdAt: number;
  lastUsedAt?: number | null;
}

const INSTANCE_QUERY = `query ShellInstanceHealth {
  viewer { authenticated permissions }
  instance { id name publicURL capabilities { extensionRuntime gitHTTPS gitPush gitLFS graphqlSubscriptions sse } }
  extensionInstallations { id name routePrefix status }
}`;

const loadState = ref<"loading" | "ready" | "error">("loading");
const error = ref<string | null>(null);
const readyz = ref<ReadyzPayload | null>(null);
const healthz = ref<HealthPayload | null>(null);
const instance = ref<InstancePayload | null>(null);
const gitTokens = ref<GitTokenRecord[]>([]);
const gitTokenName = ref("Git CLI");
const gitTokenRead = ref(true);
const gitTokenWrite = ref(true);
const gitTokenSecret = ref<string | null>(null);
const gitTokenError = ref<string | null>(null);
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
    if (props.mode === "settings" && graph.viewer?.authenticated) {
      await loadGitTokens();
    }
    loadState.value = "ready";
  } catch (caught) {
    loadState.value = "error";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function loadGitTokens(): Promise<void> {
  const response = await fetch("/api/account/git-tokens", {
    credentials: "include",
  });
  const body = (await response.json()) as {
    personalAccessTokens?: GitTokenRecord[];
    errors?: Array<{ message?: string }>;
  };
  if (!response.ok) throw new Error(body.errors?.[0]?.message ?? response.statusText);
  gitTokens.value = body.personalAccessTokens ?? [];
}

async function createGitToken(): Promise<void> {
  gitTokenError.value = null;
  gitTokenSecret.value = null;
  const scopes = [
    gitTokenRead.value ? "git:read" : null,
    gitTokenWrite.value ? "git:write" : null,
  ].filter((scope): scope is string => scope !== null);
  try {
    const response = await fetch("/api/account/git-tokens", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: gitTokenName.value,
        scopes,
        expiresInDays: 90,
      }),
    });
    const body = (await response.json()) as {
      token?: string;
      personalAccessToken?: GitTokenRecord;
      errors?: Array<{ message?: string }>;
    };
    if (!response.ok) throw new Error(body.errors?.[0]?.message ?? response.statusText);
    gitTokenSecret.value = body.token ?? null;
    if (body.personalAccessToken) {
      gitTokens.value = [body.personalAccessToken, ...gitTokens.value];
    }
  } catch (caught) {
    gitTokenError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function revokeGitToken(id: string): Promise<void> {
  gitTokenError.value = null;
  try {
    const response = await fetch(`/api/account/git-tokens/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const body = (await response.json()) as { errors?: Array<{ message?: string }> };
    if (!response.ok) throw new Error(body.errors?.[0]?.message ?? response.statusText);
    gitTokens.value = gitTokens.value.filter((token) => token.id !== id);
  } catch (caught) {
    gitTokenError.value = caught instanceof Error ? caught.message : String(caught);
  }
}

function formatUnixSeconds(value: number | null | undefined): string {
  if (!value) return "never";
  return new Date(value * 1000).toISOString().slice(0, 10);
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

      <section
        v-if="props.mode === 'settings'"
        class="panel"
        data-smoke="git-token-settings"
      >
        <header class="panel-heading">
          <h2>Git personal access tokens</h2>
          <span class="chip ok">HTTPS push</span>
        </header>
        <p>
          Create a token for Git CLI authentication. Use it as the password for
          <code>git push</code>; the username can be anything.
        </p>
        <form class="admin-list" @submit.prevent="createGitToken">
          <label>
            <span>Name</span>
            <input v-model="gitTokenName" type="text" maxlength="80" required />
          </label>
          <label>
            <span>Scopes</span>
            <span>
              <input v-model="gitTokenRead" type="checkbox" /> git:read
              <input v-model="gitTokenWrite" type="checkbox" /> git:write
            </span>
          </label>
          <button type="submit">Create token</button>
        </form>
        <p v-if="gitTokenError" class="repo-state" role="alert">{{ gitTokenError }}</p>
        <p v-if="gitTokenSecret" class="repo-state" data-smoke="git-token-secret">
          Copy this token now. It will not be shown again:
          <code>{{ gitTokenSecret }}</code>
        </p>
        <div class="admin-list">
          <div v-for="token in gitTokens" :key="token.id">
            <span>{{ token.name }}</span>
            <code>{{ token.tokenPrefix }}… · {{ token.scopes.join(", ") }} · expires {{ formatUnixSeconds(token.expiresAt) }}</code>
            <button type="button" @click="revokeGitToken(token.id)">Revoke</button>
          </div>
          <div v-if="gitTokens.length === 0">
            <span>Tokens</span>
            <code>none</code>
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
