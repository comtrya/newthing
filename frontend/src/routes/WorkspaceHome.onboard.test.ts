/**
 * Tests for the WorkspaceHome first-run onboarding gate.
 *
 * WorkspaceHome swaps its normal activity/projects grid for a guided
 * onboarding panel when the workspace has resolved with zero
 * repositories. The predicate is mirrored here (matching the
 * RepoTabs / AccountNav test convention) so it stays fast and
 * dependency-free; any change to `isFreshWorkspace` in the SFC must
 * be reflected here.
 */

import { describe, expect, test } from "bun:test";

type LoadState = "loading" | "ready" | "error";

// Mirrors `isFreshWorkspace` in WorkspaceHome.vue.
function isFreshWorkspace(loadState: LoadState, repoCount: number): boolean {
  return loadState === "ready" && repoCount === 0;
}

describe("WorkspaceHome onboarding gate", () => {
  test("shows onboarding once a resolved workspace has no repos", () => {
    expect(isFreshWorkspace("ready", 0)).toBe(true);
  });

  test("hides onboarding while the workspace is still loading", () => {
    // Avoid flashing the first-run panel during a slow load.
    expect(isFreshWorkspace("loading", 0)).toBe(false);
  });

  test("hides onboarding on a load error", () => {
    expect(isFreshWorkspace("error", 0)).toBe(false);
  });

  test("hides onboarding as soon as any repository exists", () => {
    expect(isFreshWorkspace("ready", 1)).toBe(false);
    expect(isFreshWorkspace("ready", 12)).toBe(false);
  });
});
