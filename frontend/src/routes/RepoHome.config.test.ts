/**
 * Focused tests for the config-view helpers and extension opt-in
 * logic in RepoHome.vue. Tests the pure functions extracted from
 * the component's script section without mounting a full Vue app.
 */

import { describe, expect, test } from "bun:test";
import { repositoryExtensionEnabled } from "../repository-extensions";

// ---------------------------------------------------------------------------
// formatConfigValue — used in the config view DL to pretty-print CUE values
// ---------------------------------------------------------------------------

// Mirrors the formatConfigValue function in RepoHome.vue exactly.
function formatConfigValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.map(formatConfigValue).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

describe("formatConfigValue", () => {
  test("null returns em-dash", () => {
    expect(formatConfigValue(null)).toBe("—");
  });

  test("undefined returns em-dash", () => {
    expect(formatConfigValue(undefined)).toBe("—");
  });

  test("empty array returns []", () => {
    expect(formatConfigValue([])).toBe("[]");
  });

  test("string array joins with comma", () => {
    expect(formatConfigValue(["issues", "pulls"])).toBe("issues, pulls");
  });

  test("single-element array returns the element string", () => {
    expect(formatConfigValue(["issues"])).toBe("issues");
  });

  test("nested array formats recursively", () => {
    expect(formatConfigValue([["a", "b"], "c"])).toBe("a, b, c");
  });

  test("object is JSON-serialised", () => {
    expect(formatConfigValue({ visibility: "PUBLIC" })).toBe(
      JSON.stringify({ visibility: "PUBLIC" }),
    );
  });

  test("string passes through as-is", () => {
    expect(formatConfigValue("PUBLIC")).toBe("PUBLIC");
  });

  test("number converts to string", () => {
    expect(formatConfigValue(42)).toBe("42");
  });

  test("boolean converts to string", () => {
    expect(formatConfigValue(true)).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// README header metadata — mirrors RepoHome.vue's size label helper
// ---------------------------------------------------------------------------

function formatReadmeSize(size: number | null | undefined): string | null {
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const precision = value >= 10 || unit === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unit]}`;
}

describe("README header metadata", () => {
  test("omits unknown or invalid sizes", () => {
    expect(formatReadmeSize(null)).toBeNull();
    expect(formatReadmeSize(undefined)).toBeNull();
    expect(formatReadmeSize(Number.NaN)).toBeNull();
    expect(formatReadmeSize(-1)).toBeNull();
  });

  test("formats byte, KB, and MB labels for the README file header", () => {
    expect(formatReadmeSize(12)).toBe("12 B");
    expect(formatReadmeSize(1536)).toBe("1.5 KB");
    expect(formatReadmeSize(12 * 1024)).toBe("12 KB");
    expect(formatReadmeSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});

// ---------------------------------------------------------------------------
// Repository chip copy — mirrors RepoHome.vue's repoChips labels
// ---------------------------------------------------------------------------

function openPullRequestChipLabel(count: number): string {
  return count === 1 ? "open pull request" : "open pull requests";
}

describe("repository chip copy", () => {
  test("uses full pull request language instead of PR abbreviation", () => {
    expect(openPullRequestChipLabel(0)).toBe("open pull requests");
    expect(openPullRequestChipLabel(1)).toBe("open pull request");
    expect(openPullRequestChipLabel(2)).toBe("open pull requests");
  });
});

// ---------------------------------------------------------------------------
// Clone action copy — mirrors RepoHome.vue's green Code button label
// ---------------------------------------------------------------------------

function cloneActionLabel(copied: boolean): string {
  return copied ? "Copied" : "Code";
}

function cloneCopyStatus(copied: boolean, unavailable: boolean): string {
  if (copied) return "Clone command copied";
  if (unavailable) return "Copy unavailable";
  return "Copy clone command";
}

describe("clone action copy", () => {
  test("uses familiar Code language before switching to Copied feedback", () => {
    expect(cloneActionLabel(false)).toBe("Code");
    expect(cloneActionLabel(true)).toBe("Copied");
  });

  test("exposes copy, copied, and unavailable states to assistive tech", () => {
    expect(cloneCopyStatus(false, false)).toBe("Copy clone command");
    expect(cloneCopyStatus(true, false)).toBe("Clone command copied");
    expect(cloneCopyStatus(false, true)).toBe("Copy unavailable");
  });
});

// ---------------------------------------------------------------------------
// Repository visibility copy — mirrors RepoHome.vue's badge label
// ---------------------------------------------------------------------------

function repositoryVisibilityLabel(visibility: string | null | undefined): string {
  return (visibility ?? "PRIVATE").toLowerCase() === "public" ? "Public" : "Private";
}

describe("repository visibility copy", () => {
  test("uses GitHub-like title-case labels instead of uppercase system copy", () => {
    expect(repositoryVisibilityLabel("PUBLIC")).toBe("Public");
    expect(repositoryVisibilityLabel("public")).toBe("Public");
    expect(repositoryVisibilityLabel("PRIVATE")).toBe("Private");
    expect(repositoryVisibilityLabel(undefined)).toBe("Private");
  });
});

// ---------------------------------------------------------------------------
// enabledExtensions logic — mirrors RepoHome.vue's computed
// ---------------------------------------------------------------------------

// The computed derives from repository.value?.extensions ?? null.
// Null means "still loading" (tabs and badges should be hidden).
// [] means "loaded, no extensions enabled".
// [...] means "loaded, these extensions are enabled".

function deriveEnabledExtensions(
  repositoryExtensions: string[] | null | undefined,
): string[] | null {
  return repositoryExtensions ?? null;
}

describe("enabledExtensions derivation", () => {
  test("undefined repository returns null (loading state)", () => {
    expect(deriveEnabledExtensions(undefined)).toBeNull();
  });

  test("null extensions field returns null (loading / no repo)", () => {
    expect(deriveEnabledExtensions(null)).toBeNull();
  });

  test("empty array returns [] (loaded, none enabled)", () => {
    expect(deriveEnabledExtensions([])).toEqual([]);
  });

  test("extension list is preserved as-is", () => {
    const exts = ["ext_issues", "ext_pull_requests", "ext_epics"];
    expect(deriveEnabledExtensions(exts)).toEqual(exts);
  });
});

// ---------------------------------------------------------------------------
// Extension guard — mirrors the conditional in RepoHome.vue's loadIdentity
// ---------------------------------------------------------------------------

function shouldRefreshIssues(exts: string[]): boolean {
  return repositoryExtensionEnabled(exts, "issues");
}

function shouldRefreshChecks(exts: string[]): boolean {
  return repositoryExtensionEnabled(exts, "checks");
}

describe("extension refresh gates", () => {
  test("refreshes issues when 'ext_issues' is enabled", () => {
    expect(shouldRefreshIssues(["ext_issues", "ext_pull_requests"])).toBe(true);
  });

  test("skips issue refresh when 'ext_issues' is absent", () => {
    expect(shouldRefreshIssues(["ext_pull_requests", "ext_epics"])).toBe(false);
  });

  test("skips issue refresh when extensions list is empty", () => {
    expect(shouldRefreshIssues([])).toBe(false);
  });

  test("refreshes checks when 'ext_checks' is enabled", () => {
    expect(shouldRefreshChecks(["ext_checks"])).toBe(true);
  });

  test("skips checks refresh when 'ext_checks' is absent", () => {
    expect(shouldRefreshChecks(["ext_issues"])).toBe(false);
  });

  test("short extension slugs do not trigger repo refresh work", () => {
    expect(shouldRefreshIssues(["issues"])).toBe(false);
    expect(shouldRefreshChecks(["checks"])).toBe(false);
  });
});

type RepositoryQueryMode = "context" | "overview" | "config";

function queryModeForView(view: string): RepositoryQueryMode {
  if (view === "overview") return "overview";
  if (view === "config") return "config";
  return "context";
}

interface TestRepositoryIdentity {
  path: string;
  name: string;
  blobs?: Array<{ path: string }>;
  commits?: Array<{ oid: string }>;
  labels?: string[];
  comtryaConfig?: { projects?: Array<{ name: string }> } | null;
}

function mergeRepositoryIdentity(
  previous: TestRepositoryIdentity | null,
  next: TestRepositoryIdentity | null,
  mode: RepositoryQueryMode,
): TestRepositoryIdentity | null {
  if (!previous || !next || previous.path !== next.path) return next;
  const preserveHeavy = mode === "context" || mode === "config";
  return {
    ...previous,
    ...next,
    blobs: preserveHeavy ? previous.blobs : next.blobs,
    commits: preserveHeavy ? previous.commits : next.commits,
    labels: mode === "context" ? previous.labels : next.labels,
    comtryaConfig: mode === "context" ? previous.comtryaConfig : next.comtryaConfig,
  };
}

describe("repository query modes", () => {
  test("extension workbench routes use lightweight repository context", () => {
    expect(queryModeForView("issues")).toBe("context");
    expect(queryModeForView("pulls")).toBe("context");
    expect(queryModeForView("epics")).toBe("context");
    expect(queryModeForView("checks")).toBe("context");
    expect(queryModeForView("code")).toBe("context");
  });

  test("overview and config request their heavier data explicitly", () => {
    expect(queryModeForView("overview")).toBe("overview");
    expect(queryModeForView("config")).toBe("config");
  });

  test("lightweight refresh preserves same-repo heavy fields", () => {
    const previous: TestRepositoryIdentity = {
      path: "comtrya/dogfood",
      name: "dogfood",
      blobs: [{ path: "README.md" }],
      commits: [{ oid: "abc" }],
      labels: ["kind::ux"],
      comtryaConfig: { projects: [{ name: "frontend" }] },
    };
    const next: TestRepositoryIdentity = {
      path: "comtrya/dogfood",
      name: "dogfood",
    };

    expect(mergeRepositoryIdentity(previous, next, "context")).toEqual(previous);
  });

  test("config refresh can update config without discarding README data", () => {
    const previous: TestRepositoryIdentity = {
      path: "comtrya/dogfood",
      name: "dogfood",
      blobs: [{ path: "README.md" }],
      commits: [{ oid: "abc" }],
      comtryaConfig: { projects: [{ name: "frontend" }] },
    };
    const next: TestRepositoryIdentity = {
      path: "comtrya/dogfood",
      name: "dogfood",
      comtryaConfig: { projects: [{ name: "backend" }] },
    };

    expect(mergeRepositoryIdentity(previous, next, "config")).toEqual({
      path: "comtrya/dogfood",
      name: "dogfood",
      blobs: [{ path: "README.md" }],
      commits: [{ oid: "abc" }],
      labels: undefined,
      comtryaConfig: { projects: [{ name: "backend" }] },
    });
  });
});
