/**
 * Recently-visited routes — localStorage-tracked, capped at 5.
 *
 * The sidebar mounts a "Recent" section above the Repositories list
 * so a user can jump back to an issue, pull request, or epic they
 * were just looking at without remembering its number. Persists
 * across reloads but lives only in the browser; no kernel state.
 *
 * Routes the sidebar already exposes via direct links (workspace
 * home, inbox) and new-thing forms are filtered out so the list shows
 * only "real" destinations.
 */

import { ref, type Ref } from "vue";

const STORAGE_KEY = "comtrya.recentRoutes";
const MAX_ENTRIES = 5;
const DIRECT_SHELL_ROUTES = new Set([
  "/",
  "/inbox",
  "/new",
  "/repos",
  "/pipelines",
  "/releases",
  "/admin",
  "/admin/access",
  "/admin/storage",
  "/instance",
  "/health",
  "/settings",
  "/account",
  "/account/git-tokens",
  "/account/ssh-keys",
]);

const REPO_SURFACE_LABELS: Record<string, string> = {
  code: "Code",
  branches: "Branches",
  tags: "Tags",
  commits: "Commits",
  pulls: "Pull requests",
  issues: "Issues",
  checks: "Checks",
  epics: "Epics",
  docs: "Docs",
  sprints: "Kanban",
  pipelines: "Actions",
  releases: "Releases",
  config: "Config",
};

const WORKSPACE_SURFACE_LABELS: Record<string, string> = {
  issues: "Issues",
  pulls: "Pull requests",
  checks: "Checks",
  epics: "Epics",
  docs: "Specs",
  sprints: "Kanban",
};

export interface RecentEntry {
  /** Route path (without origin). Used as both key and href. */
  path: string;
  /** Human-friendly label for the sidebar row. */
  label: string;
  /** Milliseconds since epoch — used to order recents most-recent first. */
  timestamp: number;
}

function safeRead(): RecentEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentEntry =>
        e && typeof e.path === "string" && typeof e.label === "string",
    ).map(normalizeRecentEntry);
  } catch {
    return [];
  }
}

function safeWrite(entries: RecentEntry[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota or disabled localStorage — silent.
  }
}

/**
 * Reactive recent-entries ref. Singleton-ish: every reader sees the
 * same ref so the sidebar updates as the user navigates without an
 * explicit re-fetch.
 */
const recents: Ref<RecentEntry[]> = ref(safeRead());

export function recentRoutes(): Ref<RecentEntry[]> {
  return recents;
}

export function isRecordableRoute(path: string): boolean {
  if (DIRECT_SHELL_ROUTES.has(path)) return false;
  if (/\/new$/.test(path)) return false;
  if (/\/new\?/.test(path)) return false;
  return true;
}

/**
 * Wipe the recents list — browser-local. Used by the sidebar's
 * "clear" affordance for users who want to drop personal history
 * (e.g. before screen-sharing). Returns nothing; the reactive ref
 * empties immediately.
 */
export function clearRecents(): void {
  recents.value = [];
  safeWrite([]);
}

/**
 * Record a visit. Idempotent on repeat visits (same path moves to
 * the top instead of inserting a duplicate).
 */
export function recordRouteVisit(path: string, label: string): void {
  if (!isRecordableRoute(path) || !label) return;
  const next = recents.value.filter((e) => e.path !== path);
  next.unshift({ path, label, timestamp: Date.now() });
  recents.value = next.slice(0, MAX_ENTRIES);
  safeWrite(recents.value);
}

export function normalizeRecentEntry(entry: RecentEntry): RecentEntry {
  return {
    ...entry,
    label: labelForRoute(entry.path) || entry.label,
  };
}

/**
 * Derive a short human label from a route path. Falls back to the
 * raw path stripped of the leading slash when the URL shape doesn't
 * match any of the known surfaces — so an unfamiliar route still
 * earns a row instead of a blank.
 */
export function labelForRoute(path: string): string {
  const issueMatch = path.match(/^\/x\/issues\/[^/]+\/(\d+)\b/);
  if (issueMatch) return "issue #" + (issueMatch[1] ?? "");

  const pullMatch = path.match(/^\/x\/pulls\/([^/?#]+)/);
  if (pullMatch) return "pull " + (pullMatch[1] ?? "").slice(0, 7);

  const epicMatch = path.match(/^\/x\/epics\/(?:[^/]+\/)?(epc_[^/?#]+)/);
  if (epicMatch) return "epic " + (epicMatch[1] ?? "").slice(4, 11);

  const workspaceSurfaceMatch = path.match(/^\/x\/([^/?#]+)(?:\/|$)/);
  const workspaceSurface = workspaceSurfaceMatch?.[1] ?? "";
  if (WORKSPACE_SURFACE_LABELS[workspaceSurface]) {
    return WORKSPACE_SURFACE_LABELS[workspaceSurface];
  }

  const repoTabMatch = path.match(
    new RegExp(
      "^/r/(.+?)/(" + Object.keys(REPO_SURFACE_LABELS).join("|") + ")(?:/|$)",
    ),
  );
  if (repoTabMatch) {
    const repo = repoTabMatch[1] ?? "";
    const surface = repoTabMatch[2] ?? "";
    return repo + "/" + (REPO_SURFACE_LABELS[surface] ?? surface);
  }

  const repoMatch = path.match(/^\/r\/([^?#]+?)\/?$/);
  if (repoMatch) return repoMatch[1] ?? path;

  return path.replace(/^\//, "");
}
