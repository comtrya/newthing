/**
 * User layout persistence — repository-scoped widget→slot overrides.
 *
 * Loads/saves through the federated GraphQL endpoint. Falls back to
 * localStorage for unauthenticated principals or if the server is
 * unreachable, so the hybrid model still works in offline / demo mode.
 */

import { getGraphQLClient, setUserLayout, type UserLayout } from "@comtrya/sdk-core";

const USER_LAYOUT_QUERY = `query UserLayout($repositoryId: ID!) {
  userLayout(repositoryId: $repositoryId) {
    repositoryId
    entries
  }
}`;

const SET_USER_LAYOUT_MUTATION = `mutation SetUserLayout($repositoryId: ID!, $layout: UserLayoutInput!) {
  setUserLayout(repositoryId: $repositoryId, layout: $layout) {
    repositoryId
    entries
  }
}`;

interface UserLayoutPayload {
  userLayout?: {
    repositoryId?: string;
    entries?: unknown;
  };
}

interface SetUserLayoutPayload {
  setUserLayout?: {
    repositoryId?: string;
    entries?: unknown;
  };
}

const STORAGE_PREFIX = "comtrya.userLayout.";

function storageKey(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

function readLocal(scope: string): UserLayout {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return isUserLayout(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(scope: string, layout: UserLayout): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(layout));
  } catch {
    // storage may be full or disabled — best-effort
  }
}

export async function loadUserLayout(scope: string): Promise<UserLayout> {
  try {
    const data = await getGraphQLClient().query<UserLayoutPayload>(
      USER_LAYOUT_QUERY,
      { repositoryId: scope },
    );
    const entries = data.userLayout?.entries;
    if (isUserLayout(entries)) return entries;
    return {};
  } catch {
    return readLocal(scope);
  }
}

export async function saveUserLayout(scope: string, layout: UserLayout): Promise<void> {
  writeLocal(scope, layout);
  try {
    await getGraphQLClient().mutate<SetUserLayoutPayload>(
      SET_USER_LAYOUT_MUTATION,
      { repositoryId: scope, layout: { entries: layout } },
    );
  } catch {
    // already mirrored to localStorage — surface no error to caller
  }
}

/**
 * Apply a stored layout to the widget registry. The shell calls this
 * each time the active repository changes; `null` scope clears any
 * prior override so default placements take over.
 */
export async function applyUserLayoutFor(scope: string | null): Promise<void> {
  if (scope === null) {
    setUserLayout({});
    return;
  }
  const layout = await loadUserLayout(scope);
  setUserLayout(layout);
}

function isUserLayout(value: unknown): value is UserLayout {
  if (!value || typeof value !== "object") return false;
  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") return false;
  }
  return true;
}
