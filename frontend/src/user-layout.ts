/**
 * User layout persistence — repository-scoped widget→slot overrides.
 *
 * For now the layout lives in localStorage, keyed on the resolved
 * repository id. The shape is identical to what a future GraphQL
 * mutation would accept (see `docs/extensions.md` for the intended
 * federated schema), so swapping the persistence layer is a single
 * function change here.
 */

import { setUserLayout, type UserLayout } from "@comtrya/sdk-core";

const STORAGE_PREFIX = "comtrya.userLayout.";

function storageKey(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

export function loadUserLayout(scope: string): UserLayout {
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

export function saveUserLayout(scope: string, layout: UserLayout): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(layout));
  } catch {
    // best-effort — storage may be full or disabled
  }
}

/**
 * Apply a stored layout to the widget registry. The shell calls this
 * each time the active repository changes; `null` scope clears any
 * prior override so default placements take over.
 */
export function applyUserLayoutFor(scope: string | null): void {
  if (scope === null) {
    setUserLayout({});
    return;
  }
  setUserLayout(loadUserLayout(scope));
}

function isUserLayout(value: unknown): value is UserLayout {
  if (!value || typeof value !== "object") return false;
  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") return false;
  }
  return true;
}
