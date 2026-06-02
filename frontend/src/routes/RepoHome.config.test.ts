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
