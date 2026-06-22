<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getGraphQLClient,
  invokeOp,
  openPalette,
  setActiveWorkspaceId,
  subscribeLiveEvents,
} from "@comtrya/sdk-core";
import { useShortcuts } from "@comtrya/sdk-vue";
import CommandPalette from "./components/CommandPalette.vue";
import MobileTabBar from "./components/MobileTabBar.vue";
import ShortcutsOverlay from "./components/ShortcutsOverlay.vue";
import SideRail from "./components/SideRail.vue";
import {
  clearRecents,
  labelForRoute,
  recentRoutes,
  recordRouteVisit,
} from "./recents";
import { fetchOidcProviders, type OidcProvider } from "./auth";
import {
  repoBaseFromRouteParams,
  repoSegmentsFromRouteParams,
  rebaseExtensionHrefToRepo,
} from "./repo-workbench-routes";
import { workspaceWorkLinks } from "./workspace-work-links";

const ACCESS_TOKEN_STORAGE_KEY = "comtrya.accessToken";

interface ShellRepositorySummary {
  id: string;
  name: string;
  path: string;
  groups: string[];
  openPullRequests: number | null;
}

interface ShellSummaryPayload {
  viewer?: {
    authenticated?: boolean;
  };
  workspace?: {
    id?: string;
    name?: string;
    repositories?: ShellRepositorySummary[];
  };
}

const workspace = ref<{
  id: string | null;
  name: string;
  repositories: ShellRepositorySummary[];
}>({
  id: null,
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
const recents = recentRoutes();
const oidcProviders = ref<OidcProvider[]>([]);
const viewerAuthenticated = ref(false);
const loginProvider = computed(() => oidcProviders.value[0] ?? null);

router.afterEach((to) => {
  recordRouteVisit(to.path, labelForRoute(to.path));
});

/**
 * Compute the `/r/<groups>/<repo>` base when the active route is a
 * per-repo workbench view. Used by the link rewriter to rebase
 * extension deep-links into the workbench. Returns null on
 * non-repo routes.
 */
const workbenchRepoBase = computed<string | null>(() => {
  return repoBaseFromRouteParams(route.params);
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

  const rebased = rebaseExtensionHrefToRepo(href, repoBase, window.location.origin);
  if (!rebased) return;

  event.preventDefault();
  void router.push({ path: rebased.path, query: rebased.query, hash: rebased.hash });
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
  const segments = repoSegmentsFromRouteParams(route.params);
  return segments.length > 0 ? segments.join("/") : null;
});
const activeRepository = computed<ShellRepositorySummary | null>(() => {
  const path = activeRepoPath.value;
  if (!path) return null;
  return workspace.value.repositories.find((repo) => repo.path === path) ?? null;
});
const activeRepoSegments = computed<string[] | null>(() => {
  const path = activeRepoPath.value;
  return path ? path.split("/").filter((segment) => segment.length > 0) : null;
});
const workspaceWorkItems = computed(() =>
  workspaceWorkLinks(workspace.value.id, route.path, {
    repoSegments: activeRepoSegments.value,
    repositoryId: activeRepository.value?.id ?? null,
  }),
);
const mobileWorkHref = computed(
  () => workspaceWorkItems.value.find((item) => item.id === "issues")?.href ?? "/x/issues/",
);

const shortcutsVisible = ref(false);

onMounted(() => {
  void loadAuthProviders();
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
    const envelope = await getGraphQLClient().query<ShellSummaryPayload>(
      "{ viewer { authenticated } workspace { id name repositories { id name path groups openPullRequests } } }",
    );
    viewerAuthenticated.value = envelope.viewer?.authenticated === true;
    workspace.value = {
      ...workspace.value,
      id: envelope.workspace?.id ?? workspace.value.id,
      name: envelope.workspace?.name ?? workspace.value.name,
      repositories: envelope.workspace?.repositories ?? [],
    };
    const workspaceId = envelope.workspace?.id;
    if (workspaceId) {
      // Publish to the SDK store BEFORE the failing-checks fan-out so
      // composables that subscribe (`useWorkspaceContext`, the
      // injected `workspaceId` on extension custom elements) see the
      // resolved ID before any downstream render.
      setActiveWorkspaceId(workspaceId);
      void refreshFailingChecksMap(workspaceId);
    }
  } catch {
    // Keep the static fallback; route components surface their own load errors.
  }
}

/**
 * Per-repo failing-required-check counts, refreshed alongside the
 * sidebar's repo list. Fans out one `list-checks` call per repo
 * (the op is repo-scoped) in parallel, filters to
 * `required && state ∈ {FAILURE, FAILED}`, and writes the resulting
 * counts into a ref the sidebar template consults to render a red
 * dot next to repos with ship-blocking state. Mirrors the per-repo
 * RepoHome chip from iter 27 — same data, different surface.
 */
const failingChecksByRepoId = ref<Record<string, number>>({});

/**
 * Workspace-wide failing-required-check tally. Drives the small
 * red dot next to the sidebar's Inbox link so the user sees
 * "something is broken, go look" from any page without
 * navigating. Matches the same alarm semantic as the per-repo
 * dot in the repo list and the chip on RepoHome.
 */
const totalFailingChecks = computed(() =>
  Object.values(failingChecksByRepoId.value).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  ),
);

async function refreshFailingChecksMap(workspaceId: string): Promise<void> {
  const repos = workspace.value.repositories;
  if (repos.length === 0) {
    failingChecksByRepoId.value = {};
    return;
  }
  const entries = await Promise.all(
    repos.map(async (repo) => {
      const result = await invokeOp<
        Array<{ state?: string; required?: boolean }>
      >("ext_checks", "checks", "list-checks", {
        repository: `comtrya://workspace/${workspaceId}/repository/${repo.id}`,
        limit: 256,
      });
      if (!result.ok || !Array.isArray(result.value)) return [repo.id, 0] as const;
      const failing = result.value.filter((c) => {
        if (c.required !== true) return false;
        const s = (c.state ?? "").toUpperCase();
        return s === "FAILURE" || s === "FAILED";
      }).length;
      return [repo.id, failing] as const;
    }),
  );
  const map: Record<string, number> = {};
  for (const [id, n] of entries) map[id] = n;
  failingChecksByRepoId.value = map;
}

async function loadAuthProviders(): Promise<void> {
  try {
    oidcProviders.value = await fetchOidcProviders();
  } catch {
    oidcProviders.value = [];
  }
}
</script>

<template>
  <div class="shell shell-app" @click.capture="onPageClick">
    <header class="topbar" role="banner">
      <RouterLink to="/" class="brand" aria-label="Home">
        <div class="mark">C</div>
        <span class="word">Comtrya</span>
      </RouterLink>
      <button class="cmdk" type="button" @click="openPalette">
        <span class="cmdk-text">Search or jump to...</span>
        <kbd>{{ cmdLabel }} K</kbd>
      </button>
      <div class="topbar-actions">
        <span
          v-if="degradedLiveState"
          :class="['chip', degradedLiveState === 'error' ? 'err' : '']"
          :title="liveStateTitle"
        >{{ degradedLiveState }}</span>
        <span
          v-if="viewerAuthenticated"
          class="chip ok"
          title="Authenticated session"
        >signed in</span>
        <a
          v-else-if="loginProvider"
          class="topbar-auth"
          data-smoke="sign-in"
          :href="loginProvider.loginUrl"
        >Sign in</a>
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
      <SideRail />

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
          >
            <span class="sb-link-text">Inbox</span>
            <span
              v-if="totalFailingChecks > 0"
              class="sb-link-alarm"
              aria-label="failing required checks workspace-wide"
              :title="`${totalFailingChecks} failing required check${totalFailingChecks === 1 ? '' : 's'} across the workspace`"
            />
          </RouterLink>
          <RouterLink
            to="/pipelines"
            class="sb-link"
            :class="{ 'sb-link-active': route.path.startsWith('/pipelines') }"
          >Actions</RouterLink>
          <RouterLink
            to="/releases"
            class="sb-link"
            :class="{ 'sb-link-active': route.path.startsWith('/releases') }"
          >Releases</RouterLink>
        </nav>

        <section
          class="sb-section sb-work"
          aria-label="Work"
          data-smoke="sidebar-work"
        >
          <header class="sb-section-head">
            <span class="sb-overline">Work</span>
          </header>
          <nav class="sb-work-list">
            <RouterLink
              v-for="item in workspaceWorkItems"
              :key="item.id"
              :to="item.href"
              class="sb-link sb-work-link"
              :class="{ 'sb-link-active': item.active }"
              :data-smoke="`sidebar-work-${item.id}`"
            >{{ item.label }}</RouterLink>
          </nav>
        </section>

        <section
          v-if="recents.length > 0"
          class="sb-section sb-recents"
          aria-label="Recently visited"
          data-smoke="sidebar-recents"
        >
          <header class="sb-section-head">
            <span class="sb-overline">Recent</span>
            <button
              type="button"
              class="sb-icon-link"
              title="Clear recent routes"
              aria-label="Clear recent routes"
              data-smoke="sidebar-recents-clear"
              @click="clearRecents"
            >×</button>
          </header>
          <nav class="sb-recent-list">
            <RouterLink
              v-for="entry in recents"
              :key="entry.path"
              :to="entry.path"
              class="sb-recent"
              data-smoke="recent-visit"
              :title="entry.path"
            >{{ entry.label }}</RouterLink>
          </nav>
        </section>

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
              <span class="sb-repo-path">
                <span
                  v-if="(failingChecksByRepoId[repo.id] ?? 0) > 0"
                  class="sb-repo-alarm"
                  aria-label="failing required checks"
                  :title="`${failingChecksByRepoId[repo.id]} failing required check${failingChecksByRepoId[repo.id] === 1 ? '' : 's'}`"
                />
                {{ repo.path }}
              </span>
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
          <RouterLink to="/admin" class="sb-faint">Site admin</RouterLink>
          <RouterLink to="/instance" class="sb-faint">Instance</RouterLink>
          <RouterLink to="/health" class="sb-faint">Health</RouterLink>
          <RouterLink to="/settings" class="sb-faint">Settings</RouterLink>
        </nav>
      </aside>

      <main class="page">
        <RouterView />
      </main>
    </div>
    <CommandPalette />
    <MobileTabBar :work-href="mobileWorkHref" />
    <ShortcutsOverlay
      v-if="shortcutsVisible"
      :cmd-label="cmdLabel"
      @close="shortcutsVisible = false"
    />
  </div>
</template>
