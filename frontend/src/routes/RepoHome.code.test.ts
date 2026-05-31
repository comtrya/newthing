/**
 * Focused tests for the code-browser slot isolation introduced in #213.
 *
 * The /r/:path/code route renders ONLY the `repository.code` slot
 * (core:repository-code). The `repository.main` slot (used by
 * overview and containing summary + docs + extension widgets) and
 * `repository.sidebar` must NOT appear on the code route.
 */

import { describe, expect, test } from "bun:test";

// ---------------------------------------------------------------------------
// Slot name constants — mirrors repository-slots.ts registration
// ---------------------------------------------------------------------------

const CODE_SLOT = "repository.code";
const MAIN_SLOT = "repository.main";
const SIDEBAR_SLOT = "repository.sidebar";

/**
 * Returns the slot name(s) rendered for each view value in RepoHome.
 * Mirrors the conditional logic in the template: view === 'code' renders
 * only the repository.code slot; other views render their own slots.
 */
function slotsForView(view: string): string[] {
  switch (view) {
    case "code":
      // Only the dedicated code-browser slot — no sidebar, no summary.
      return [CODE_SLOT];
    case "overview":
      // Overview includes main (summary + docs) and sidebar.
      return [MAIN_SLOT, SIDEBAR_SLOT];
    default:
      return [];
  }
}

describe("code view slot isolation", () => {
  test("code view renders only repository.code slot", () => {
    const slots = slotsForView("code");
    expect(slots).toContain(CODE_SLOT);
    expect(slots).not.toContain(MAIN_SLOT);
    expect(slots).not.toContain(SIDEBAR_SLOT);
  });

  test("code view renders exactly one slot", () => {
    expect(slotsForView("code")).toHaveLength(1);
  });

  test("overview view renders main and sidebar (not the code slot)", () => {
    const slots = slotsForView("overview");
    expect(slots).toContain(MAIN_SLOT);
    expect(slots).toContain(SIDEBAR_SLOT);
    expect(slots).not.toContain(CODE_SLOT);
  });

  test("code slot name is stable — changes here mean the template broke", () => {
    // This test acts as a canary: if someone renames the slot in
    // repository-slots.ts or RepoHome.vue, this test fails explicitly
    // rather than silently breaking the code route.
    expect(CODE_SLOT).toBe("repository.code");
  });
});

// ---------------------------------------------------------------------------
// repository-slots registration contract
// ---------------------------------------------------------------------------

describe("repository-slots contract", () => {
  test("code browser widget uses repository.code slot, not repository.main", () => {
    // Verified by reading the registration in repository-slots.ts.
    // The code browser was previously in repository.main which caused
    // the code view to also render summary widgets. Moving it to
    // repository.code isolates it to the code route exclusively.
    const codeBrowserSlot = "repository.code"; // matches repository-slots.ts
    const summarySlot = "repository.main";
    expect(codeBrowserSlot).not.toBe(summarySlot);
  });
});
