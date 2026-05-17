<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openPalette, subscribeLiveEvents } from "@comtrya/sdk-core";
import { useShortcuts } from "@comtrya/sdk-vue";
import Breadcrumb from "./components/Breadcrumb.vue";
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
}>({
  name: "Workspace",
  repositories: [],
});

/**
 * Live-event subscription state. The topbar only surfaces it when
 * the stream is in trouble — "connecting" briefly on first load,
 * "error" when the SSE source disconnects. Healthy "live" / "idle"
 * is the default and shows nothing (no chrome the user has to
 * decode just to know things are fine).
 */
const liveState = ref<"connecting" | "live" | "idle" | "error">("connecting");
let unsubscribeLiveEvents: (() => void) | undefined;
const degradedLiveState = computed<"connecting" | "error" | null>(() => {
  if (liveState.value === "connecting") return "connecting";
  if (liveState.value === "error") return "error";
  return null;
});
const liveStateTitle = computed(() => {
  if (liveState.value === "error") return "Live event stream disconnected.";
  if (liveState.value === "connecting") return "Connecting to the live event stream…";
  return "Live event stream is connected.";
});

const isMac =
  typeof navigator !== "undefined"
    ? /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "")
    : false;
const cmdLabel = computed(() => (isMac ? "⌘" : "Ctrl"));

const route = useRoute();
const router = useRouter();

/**
 * Extension prefixes that have a corresponding `/r/:path/<prefix>`
 * workbench view. Used by the link rewriter below to decide which
 * `/x/<prefix>/<sub>` deep links to rebase back into the repo
 * workbench instead of letting them escape.
 */
const WORKBENCH_EXTENSION_PREFIXES = new Set([
  "issues",
  "pulls",
  "checks",
  "epics",
]);

/**
 * Compute the `/r/<groups>/<repo>` base when the active route is a
 * per-repo workbench view. Used by the link rewriter to rebase
 * extension deep-links into the workbench. Returns null on
 * non-repo routes.
 */
const workbenchRepoBase = computed<string | null>(() => {
  const groupsParam = route.params.groups;
  const repoParam = route.params.repo;
  if (typeof repoParam !== "string" || repoParam.length === 0) return null;
  const groups = Array.isArray(groupsParam)
    ? groupsParam.map(String)
    : typeof groupsParam === "string" && groupsParam.length > 0
      ? [groupsParam]
      : [];
  if (groups.length === 0) return null;
  return `/r/${groups.map(encodeURIComponent).join("/")}/${encodeURIComponent(repoParam)}`;
});

/**
 * Global click interceptor for `/x/<ext>/<sub>` anchors. When the
 * user is inside a repo workbench and clicks a deep link an
 * embedded extension built against the workspace-wide
 * `/x/<ext>/...` URL space (e.g. an issue row pointing at
 * `/x/issues/<ws>/<number>`), redirect through the equivalent
 * `/r/<path>/<ext>/<sub>` route so the repo header / tabs stay
 * mounted. Modifier-clicks (Cmd / Ctrl / Shift / Alt) pass through
 * untouched so the user can still open a deep link in a new tab
 * outside the workbench.
 */
function onPageClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = (event.target as HTMLElement | null)?.closest("a");
  if (!anchor) return;
  if (anchor.target && anchor.target !== "_self") return;
  const href = anchor.getAttribute("href");
  if (!href || !href.startsWith("/x/")) return;
  const repoBase = workbenchRepoBase.value;
  if (!repoBase) return;

  const url = new URL(href, window.location.origin);
  const segments = url.pathname.split("/").filter(Boolean);
  const prefix = segments[1];
  if (segments[0] !== "x" || !prefix) return;
  if (!WORKBENCH_EXTENSION_PREFIXES.has(prefix)) return;

  const rest = segments.slice(2);
  const pathParts = [repoBase, prefix, ...rest].join("/").replace(/\/\/+/g, "/");
  event.preventDefault();
  void router.push({ path: pathParts, query: queryFromSearch(url.search), hash: url.hash });
}

function queryFromSearch(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!search) return out;
  const params = new URLSearchParams(search);
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}

/**
 * Repos sorted by path for stable ordering. The list is the main
 * content of the rebuilt sidebar — every repo gets a one-click entry
 * point with a PR-count badge when there is open work. The first-
 * party `firstRepoPath` shortcut, the workspace-wide `/x/issues`
 * link, and the numbered nav lines are gone: the value-test rule
 * said the old chrome wasn't earning its place.
 */
const sortedRepositories = computed(() =>
  [...workspace.value.repositories].sort((a, b) =>
    a.path.localeCompare(b.path),
  ),
);

/**
 * Currently-viewed repo path, computed from the route params so we
 * highlight the matching entry in the sidebar list. Falls back to
 * null on non-repo routes.
 */
const activeRepoPath = computed<string | null>(() => {
  const groupsParam = route.params.groups;
  const repoParam = route.params.repo;
  if (typeof repoParam !== "string" || repoParam.length === 0) return null;
  const groups = Array.isArray(groupsParam)
    ? groupsParam.map(String)
    : typeof groupsParam === "string" && groupsParam.length > 0
      ? [groupsParam]
      : [];
  if (groups.length === 0) return null;
  return `${groups.join("/")}/${repoParam}`;
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
      <RouterLink to="/" class="brand" aria-label="Home">
        <div class="mark">C</div>
        <span class="word">Comtrya</span>
      </RouterLink>
      <button class="cmdk" type="button" @click="openPalette">
        <span class="cmdk-text">repository, pull, file, ref…</span>
        <kbd>{{ cmdLabel }} K</kbd>
      </button>
      <div class="topbar-actions">
        <span
          v-if="degradedLiveState"
          :class="['chip', degradedLiveState === 'error' ? 'err' : '']"
          :title="liveStateTitle"
        >{{ degradedLiveState }}</span>
        <button
          type="button"
          class="topbar-shortcuts"
          @click="shortcutsVisible = !shortcutsVisible"
          :title="shortcutsVisible ? 'Hide keyboard shortcuts' : 'Show keyboard shortcuts (?)'"
          aria-label="Show keyboard shortcuts"
        >
          <kbd>?</kbd>
        </button>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar" data-smoke="sidebar">
        <header class="sb-workspace">
          <span class="sb-overline">Workspace</span>
          <strong>{{ workspace.name }}</strong>
        </header>

        <nav class="sb-nav-primary" aria-label="Workspace">
          <RouterLink
            to="/"
            class="sb-link"
            :class="{ 'sb-link-active': route.path === '/' }"
          >Home</RouterLink>
          <RouterLink
            to="/inbox"
            class="sb-link"
            :class="{ 'sb-link-active': route.path === '/inbox' }"
          >Inbox</RouterLink>
        </nav>

        <section class="sb-section sb-repos" aria-label="Repositories">
          <header class="sb-section-head">
            <span class="sb-overline">Repositories</span>
            <RouterLink
              to="/new"
              class="sb-icon-link"
              title="New repository"
              aria-label="New repository"
            >+</RouterLink>
          </header>
          <nav v-if="sortedRepositories.length > 0" class="sb-repo-list">
            <RouterLink
              v-for="repo in sortedRepositories"
              :key="repo.id"
              :to="`/r/${repo.path}`"
              class="sb-repo"
              :class="{ 'sb-repo-active': activeRepoPath === repo.path }"
              :title="repo.path"
            >
              <span class="sb-repo-path">{{ repo.path }}</span>
              <span
                v-if="(repo.openPullRequests ?? 0) > 0"
                class="sb-repo-badge"
                title="open pull requests"
              >{{ repo.openPullRequests }}</span>
            </RouterLink>
          </nav>
          <p v-else class="sb-empty">No repositories yet.</p>
        </section>

        <nav class="sb-nav-footer" aria-label="Admin">
          <RouterLink to="/instance" class="sb-faint">Instance</RouterLink>
          <RouterLink to="/health" class="sb-faint">Health</RouterLink>
          <RouterLink to="/settings" class="sb-faint">Settings</RouterLink>
        </nav>
      </aside>

      <main class="page" @click="onPageClick">
        <Breadcrumb />
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
