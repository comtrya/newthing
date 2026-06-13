/**
 * Tests for the WorkspaceHome summary-strip honest-state rules.
 *
 * The summary tiles must never flash a misleading value while their
 * data is still loading: each tile renders an em dash until its data
 * is ready, then the real value. Two readiness rules apply —
 *
 *  - Most tiles (repositories, pulls, extensions, runtime) are ready
 *    as soon as the main GraphQL load resolves (`loadState === "ready"`).
 *  - The "Open issues" total is hydrated by a *separate* invokeOp that
 *    runs after the main load, so it is ready only when BOTH the main
 *    load has finished AND that workspace-issues fetch has resolved.
 *
 * The predicates are mirrored here (matching the WorkspaceHome.onboard
 * convention) so they stay fast and dependency-free; any change to the
 * tile gating in WorkspaceHome.vue must be reflected here.
 */

import { describe, expect, test } from "bun:test";

type LoadState = "loading" | "ready" | "error";

const NOT_READY = "—";

// Mirrors the generic summary-tile gate in WorkspaceHome.vue:
//   {{ loadState === 'loading' ? '—' : value }}
function summaryTile(loadState: LoadState, value: number | string): number | string {
  return loadState === "loading" ? NOT_READY : value;
}

// Mirrors the "Open issues" tile gate in WorkspaceHome.vue, which also
// waits on the separate workspace-issues fetch:
//   {{ loadState === 'loading' || !workspaceOpenIssuesLoaded ? '—' : value }}
function openIssuesTile(
  loadState: LoadState,
  workspaceOpenIssuesLoaded: boolean,
  value: number,
): number | string {
  return loadState === "loading" || !workspaceOpenIssuesLoaded ? NOT_READY : value;
}

describe("WorkspaceHome summary tiles", () => {
  test("show an em dash while the main load is in flight", () => {
    expect(summaryTile("loading", 7)).toBe(NOT_READY);
  });

  test("show the real value once the workspace has resolved", () => {
    expect(summaryTile("ready", 7)).toBe(7);
    expect(summaryTile("ready", 0)).toBe(0);
    expect(summaryTile("ready", "disabled")).toBe("disabled");
  });

  test("show the value (not a fake zero) on the error path", () => {
    // The strip is not the error surface; a resolved-but-errored load
    // should not be masked as still-loading.
    expect(summaryTile("error", 0)).toBe(0);
  });
});

describe("WorkspaceHome open-issues tile", () => {
  test("stays an em dash while the main load is in flight", () => {
    expect(openIssuesTile("loading", false, 3)).toBe(NOT_READY);
    expect(openIssuesTile("loading", true, 3)).toBe(NOT_READY);
  });

  test("stays an em dash after main load but before the issues fetch resolves", () => {
    // This is the regression the gate guards: loadState flips to ready
    // first, but the count is 0 until refreshWorkspaceOpenIssues lands.
    expect(openIssuesTile("ready", false, 0)).toBe(NOT_READY);
  });

  test("shows the real total once both the load and the issues fetch resolve", () => {
    expect(openIssuesTile("ready", true, 3)).toBe(3);
    expect(openIssuesTile("ready", true, 0)).toBe(0);
  });
});
