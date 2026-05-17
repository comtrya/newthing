<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { invokeOp, openPalette, subscribeLiveEvents } from "@comtrya/sdk-core";
import { useShortcuts } from "@comtrya/sdk-vue";
import Breadcrumb from "./components/Breadcrumb.vue";
import CommandPalette from "./components/CommandPalette.vue";
import ShortcutsOverlay from "./components/ShortcutsOverlay.vue";

const WORKSPACE_URI = "comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";

interface IssueLite {
  id?: string;
  state?: string;
}

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

/**
 * Workspace-wide open-issue count. Hydrated once at boot via the
 * ext_issues list-issues op, then kept live by subscribing to the
 * SSE topics that mutate it. Surfaces as a badge on the Issues nav
 * item (mirroring the PR badge driven by `openPullRequests` on the
 * workspace repository summary).
 */
const openIssuesTotal = ref(0);
const issueUnsubscribers: Array<() => void> = [];

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
    badge: openIssuesTotal.value > 0 ? String(openIssuesTotal.value) : undefined,
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

async function refreshOpenIssuesTotal(): Promise<void> {
  const result = await invokeOp<IssueLite[]>(
    "ext_issues",
    "issues",
    "list-issues",
    { repository: WORKSPACE_URI, limit: 1024 },
  );
  if (!result.ok) return;
  const issues = Array.isArray(result.value) ? result.value : [];
  openIssuesTotal.value = issues.filter((i) => {
    const state = (i.state ?? "").toUpperCase();
    return state === "OPEN" || state === "REOPENED";
  }).length;
}

onMounted(() => {
  void loadShellSummary();
  void refreshOpenIssuesTotal();
  for (const type of [
    "dev.comtrya.issues.opened",
    "dev.comtrya.issues.closed",
    "dev.comtrya.issues.reopened",
  ]) {
    issueUnsubscribers.push(
      subscribeLiveEvents({
        type,
        onEvent: () => void refreshOpenIssuesTotal(),
        onError: () => {},
      }),
    );
  }
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
  for (const off of issueUnsubscribers) off();
  issueUnsubscribers.length = 0;
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
