<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { openPalette, subscribeLiveEvents } from "@comtrya/sdk-core";
import { useShortcuts } from "@comtrya/sdk-vue";
import CommandPalette from "./components/CommandPalette.vue";
import ShortcutsOverlay from "./components/ShortcutsOverlay.vue";

const ACCESS_TOKEN_STORAGE_KEY = "comtrya.accessToken";

interface ShellRepositorySummary {
  id: string;
  name: string;
  path: string;
  groups: string[];
  openPullRequests: number | null;
}

const workspace = ref<{
  name: string;
  repositories: ShellRepositorySummary[];
  serverURL: string;
}>({
  name: "Workspace",
  repositories: [],
  serverURL: "same-origin kernel proxy",
});

const liveState = ref<"connecting" | "live" | "idle" | "error">("connecting");
const liveEvents = ref(0);
let unsubscribeLiveEvents: (() => void) | undefined;

const isMac =
  typeof navigator !== "undefined"
    ? /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "")
    : false;
const cmdLabel = computed(() => (isMac ? "⌘" : "Ctrl"));

const firstRepoPath = computed(() => workspace.value.repositories[0]?.path ?? "");
const openPullRequestsTotal = computed(() =>
  workspace.value.repositories.reduce(
    (total, repo) => total + (repo.openPullRequests ?? 0),
    0,
  ),
);
const repositoryCount = computed(() => workspace.value.repositories.length);
const repositoryWord = computed(() =>
  repositoryCount.value === 1 ? "repository" : "repositories",
);

const navItems = computed(() => {
  const items: Array<{
    to: string;
    number: string;
    label: string;
    badge?: string;
    disabled?: boolean;
  }> = [
    { to: "/", number: "01", label: "Home" },
  ];
  if (firstRepoPath.value) {
    items.push({
      to: `/r/${firstRepoPath.value}`,
      number: "02",
      label: "Repository",
    });
  } else {
    items.push({
      to: "/new",
      number: "02",
      label: "Repository",
      disabled: true,
    });
  }
  items.push({
    to: "/x/issues/",
    number: "03",
    label: "Issues",
  });
  items.push({
    to: "/x/pulls/",
    number: "04",
    label: "Pull requests",
    badge: openPullRequestsTotal.value > 0 ? String(openPullRequestsTotal.value) : undefined,
  });
  items.push({ to: "/new", number: "+", label: "New repository" });
  items.push({ to: "/instance", number: "05", label: "Instance" });
  return items;
});

const shortcutsVisible = ref(false);

onMounted(() => {
  void loadShellSummary();
  const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? undefined;
  if (!token) {
    liveState.value = "idle";
  } else {
    unsubscribeLiveEvents = subscribeLiveEvents({
      token,
      onEvent: () => {
        liveEvents.value += 1;
        liveState.value = "live";
      },
      onError: () => {
        liveState.value = "error";
      },
    });
    window.setTimeout(() => {
      if (liveState.value === "connecting") liveState.value = "idle";
    }, 1500);
  }
});

onUnmounted(() => {
  unsubscribeLiveEvents?.();
});

useShortcuts({
  "?": (event) => {
    event.preventDefault();
    shortcutsVisible.value = !shortcutsVisible.value;
  },
  Escape: (event) => {
    if (!shortcutsVisible.value) return;
    event.preventDefault();
    shortcutsVisible.value = false;
  },
});

async function loadShellSummary(): Promise<void> {
  try {
    const response = await fetch("/graphql", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query:
          "{ workspace { name repositories { id name path groups openPullRequests } } }",
      }),
    });
    const envelope = (await response.json()) as {
      data?: {
        workspace?: {
          name?: string;
          repositories?: ShellRepositorySummary[];
        };
      };
    };
    workspace.value = {
      ...workspace.value,
      name: envelope.data?.workspace?.name ?? workspace.value.name,
      repositories: envelope.data?.workspace?.repositories ?? [],
    };
  } catch {
    // Keep the static fallback; route components surface their own load errors.
  }
}
</script>

<template>
  <div class="shell shell-app">
    <header class="topbar" role="banner">
      <div class="brand">
        <div class="mark">C</div>
        <div class="name">
          <span class="word">Comtrya</span>
          <span class="sub">workspace</span>
        </div>
      </div>
      <button class="cmdk" type="button" @click="openPalette">
        <span class="label">Cmd</span>
        <span class="cmdk-text">repository, pull, file, ref...</span>
        <kbd>{{ cmdLabel }} K</kbd>
      </button>
      <div class="topbar-actions">
        <span :class="['chip', liveState === 'live' ? 'ok' : liveState === 'error' ? 'err' : '']">
          {{ liveState }}
        </span>
        <span class="chip bare">{{ liveEvents }} events</span>
        <button
          type="button"
          class="chip bare help"
          @click="shortcutsVisible = !shortcutsVisible"
          aria-label="Show keyboard shortcuts"
        >
          shortcuts <kbd>?</kbd>
        </button>
        <code>{{ workspace.serverURL }}</code>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div class="workspace">
          <h4>Workspace</h4>
          <strong>{{ workspace.name }}</strong>
          <div class="meta">{{ repositoryCount }} {{ repositoryWord }} / single-tenant</div>
        </div>

        <div>
          <h4>Shell routes</h4>
          <nav class="nav" aria-label="Shell routes">
            <RouterLink
              v-for="item in navItems"
              :key="item.to + item.label"
              :to="item.to"
              :class="{ disabled: item.disabled }"
            >
              <span class="num">{{ item.number }}</span>
              <span class="label-text">{{ item.label }}</span>
              <span v-if="item.badge" class="badge">{{ item.badge }}</span>
            </RouterLink>
          </nav>
        </div>
      </aside>

      <main class="page">
        <RouterView />
      </main>
    </div>
    <CommandPalette />
    <ShortcutsOverlay
      v-if="shortcutsVisible"
      :cmd-label="cmdLabel"
      @close="shortcutsVisible = false"
    />
  </div>
</template>
