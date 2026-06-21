import { describe, expect, test } from "bun:test";
import {
  repositoryExtensionEnabled,
  type RepositoryExtensionSlug,
} from "../repository-extensions";

// RepoTabs is a Vue SFC; test the extension-filtering logic directly
// (the computed `tabs` logic) without mounting a full Vue app.

// Re-implement the filtering logic mirroring RepoTabs.vue so we get
// fast, dependency-free unit coverage. The logic is simple enough to
// express as a pure function that maps (enabledExtensions, counts) →
// visible tab IDs. Any change to the component's logic should be
// reflected here.

type CountTone = "ink" | "alarm";

interface Tab {
  id: string;
  label: string;
  icon: string;
  count?: number;
  countAriaLabel?: string;
  showZeroCount?: boolean;
  countTone?: CountTone;
}

function buildTabs(opts: {
  enabledExtensions: string[] | null;
  openIssues?: number;
  openPulls?: number;
  failingChecks?: number;
}): Tab[] {
  const { enabledExtensions, openIssues = 0, openPulls = 0, failingChecks = 0 } = opts;

  function extEnabled(id: RepositoryExtensionSlug): boolean {
    return repositoryExtensionEnabled(enabledExtensions, id);
  }

  const all: Tab[] = [
    { id: "overview", label: "README", icon: "file" },
    { id: "code", label: "Code", icon: "folder" },
  ];
  if (extEnabled("issues"))
    all.push({
      id: "issues",
      label: "Issues",
      icon: "issue",
      count: openIssues,
      countAriaLabel: `${openIssues} open issues`,
      showZeroCount: true,
    });
  if (extEnabled("pulls"))
    all.push({
      id: "pulls",
      label: "Pull requests",
      icon: "pr",
      count: openPulls,
      countAriaLabel: `${openPulls} open pull requests`,
      showZeroCount: true,
    });
  all.push({ id: "pipelines", label: "Actions", icon: "bolt" });
  if (extEnabled("epics")) all.push({ id: "epics", label: "Epics", icon: "tag" });
  if (extEnabled("checks"))
    all.push({
      id: "checks",
      label: "Checks",
      icon: "check",
      count: failingChecks,
      countAriaLabel: `${failingChecks} failing checks`,
      countTone: "alarm",
    });
  all.push({ id: "releases", label: "Releases", icon: "rocket" });
  all.push({ id: "config", label: "Config", icon: "settings" });
  return all;
}

function visibleIds(
  enabledExtensions: string[] | null,
  overrides: Partial<Parameters<typeof buildTabs>[0]> = {},
): string[] {
  return buildTabs({ enabledExtensions, ...overrides }).map((t) => t.id);
}

function repoExtPath(opts: {
  repoPath: string;
  slug: string;
  repositoryId?: string | null;
  workspaceId?: string | null;
}): string {
  const base = `/r/${opts.repoPath}/${opts.slug}`;
  if (!opts.repositoryId) return base;
  const params = new URLSearchParams({ repositoryId: opts.repositoryId });
  if (opts.workspaceId) params.set("workspaceId", opts.workspaceId);
  return `${base}?${params.toString()}`;
}

describe("RepoTabs extension filtering", () => {
  test("shows core repo tabs when no extensions are enabled", () => {
    const ids = visibleIds([]);
    expect(ids).toEqual(["overview", "code", "pipelines", "releases", "config"]);
  });

  test("hides only extension tabs while enabledExtensions is null (loading)", () => {
    const ids = visibleIds(null);
    expect(ids).toEqual(["overview", "code", "pipelines", "releases", "config"]);
  });

  test("shows Issues tab when 'ext_issues' is in enabledExtensions", () => {
    expect(visibleIds(["ext_issues"])).toContain("issues");
    expect(visibleIds([])).not.toContain("issues");
  });

  test("shows Pulls tab when 'ext_pull_requests' is in enabledExtensions", () => {
    expect(visibleIds(["ext_pull_requests"])).toContain("pulls");
    expect(visibleIds([])).not.toContain("pulls");
  });

  test("shows Epics tab when 'ext_epics' is in enabledExtensions", () => {
    expect(visibleIds(["ext_epics"])).toContain("epics");
    expect(visibleIds([])).not.toContain("epics");
  });

  test("shows Checks tab when 'ext_checks' is in enabledExtensions", () => {
    expect(visibleIds(["ext_checks"])).toContain("checks");
    expect(visibleIds([])).not.toContain("checks");
  });

  test("shows multiple extension tabs when all enabled", () => {
    const ids = visibleIds([
      "ext_issues",
      "ext_pull_requests",
      "ext_epics",
      "ext_checks",
    ]);
    expect(ids).toContain("issues");
    expect(ids).toContain("pulls");
    expect(ids).toContain("epics");
    expect(ids).toContain("checks");
  });

  test("preserves README-Code-...-Config ordering", () => {
    const ids = visibleIds([
      "ext_checks",
      "ext_issues",
      "ext_pull_requests",
      "ext_epics",
    ]);
    expect(ids[0]).toBe("overview");
    expect(ids[1]).toBe("code");
    expect(ids[ids.length - 1]).toBe("config");
    expect(ids).toEqual([
      "overview",
      "code",
      "issues",
      "pulls",
      "pipelines",
      "epics",
      "checks",
      "releases",
      "config",
    ]);
    // Canonical extension order: issues, pulls, epics, checks
    const extOrder = ids.filter((id) =>
      ["issues", "pulls", "epics", "checks"].includes(id),
    );
    expect(extOrder).toEqual(["issues", "pulls", "epics", "checks"]);
  });

  test("issues tab carries openIssues count", () => {
    const tabs = buildTabs({
      enabledExtensions: ["ext_issues"],
      openIssues: 7,
    });
    const issues = tabs.find((t) => t.id === "issues");
    expect(issues?.count).toBe(7);
    expect(issues?.countAriaLabel).toBe("7 open issues");
  });

  test("issues and pull request tabs opt into zero-count badges", () => {
    const tabs = buildTabs({
      enabledExtensions: ["ext_issues", "ext_pull_requests", "ext_checks"],
    });
    const issues = tabs.find((t) => t.id === "issues");
    const pulls = tabs.find((t) => t.id === "pulls");
    const checks = tabs.find((t) => t.id === "checks");
    expect(issues?.count).toBe(0);
    expect(issues?.showZeroCount).toBe(true);
    expect(issues?.countAriaLabel).toBe("0 open issues");
    expect(pulls?.count).toBe(0);
    expect(pulls?.showZeroCount).toBe(true);
    expect(pulls?.countAriaLabel).toBe("0 open pull requests");
    expect(checks?.count).toBe(0);
    expect(checks?.showZeroCount).toBeUndefined();
  });

  test("checks tab uses alarm countTone and count label", () => {
    const tabs = buildTabs({
      enabledExtensions: ["ext_checks"],
      failingChecks: 3,
    });
    const checks = tabs.find((t) => t.id === "checks");
    expect(checks?.countTone).toBe("alarm");
    expect(checks?.count).toBe(3);
    expect(checks?.countAriaLabel).toBe("3 failing checks");
  });

  test("partial extension set — only requested extension tabs appear", () => {
    // Repo enabled only issues and epics
    const ids = visibleIds(["ext_issues", "ext_epics"]);
    expect(ids).toContain("issues");
    expect(ids).toContain("epics");
    expect(ids).not.toContain("pulls");
    expect(ids).not.toContain("checks");
  });

  test("unknown extension IDs in opt-in set do not create tabs", () => {
    const ids = visibleIds(["ext_issues", "unknown-extension", "future-ext"]);
    expect(ids).not.toContain("unknown-extension");
    expect(ids).not.toContain("future-ext");
    expect(ids).toContain("issues");
  });

  test("uses familiar forge icons for core and extension tabs", () => {
    const tabs = buildTabs({
      enabledExtensions: [
        "ext_issues",
        "ext_pull_requests",
        "ext_epics",
        "ext_checks",
      ],
    });
    expect(
      Object.fromEntries(tabs.map((tab) => [tab.id, tab.icon])),
    ).toEqual({
      overview: "file",
      code: "folder",
      issues: "issue",
      pulls: "pr",
      pipelines: "bolt",
      epics: "tag",
      checks: "check",
      releases: "rocket",
      config: "settings",
    });
  });

  test("uses README language for the repo-home route without changing the overview id", () => {
    const tabs = buildTabs({ enabledExtensions: [] });
    const overview = tabs.find((tab) => tab.id === "overview");
    expect(overview?.label).toBe("README");
    expect(overview?.id).toBe("overview");
  });

  test("uses GitHub-familiar pull request language without changing the extension id", () => {
    const tabs = buildTabs({ enabledExtensions: ["ext_pull_requests"] });
    const pulls = tabs.find((tab) => tab.id === "pulls");
    expect(pulls?.label).toBe("Pull requests");
    expect(pulls?.id).toBe("pulls");
  });

  test("short extension slugs are not feature enablement ids", () => {
    const ids = visibleIds(["issues", "pulls", "epics", "checks"]);
    expect(ids).toEqual(["overview", "code", "pipelines", "releases", "config"]);
  });
});

// ---------------------------------------------------------------------------
// ARIA semantics — navigation links, not ARIA tabs
// ---------------------------------------------------------------------------

// Mirrors the ARIA attribute logic from the RepoTabs.vue template.
// The component uses aria-current="page" on the active link rather than
// role=tab/aria-selected, which would imply arrow-key navigation and a
// tabpanel association that doesn't exist.

function ariaCurrent(isActive: boolean): string | undefined {
  return isActive ? "page" : undefined;
}

describe("RepoTabs ARIA semantics", () => {
  test("active link gets aria-current=page", () => {
    expect(ariaCurrent(true)).toBe("page");
  });

  test("inactive link gets no aria-current attribute", () => {
    expect(ariaCurrent(false)).toBeUndefined();
  });

  test("aria-current is undefined (not false) for inactive links", () => {
    // Vue omits the attribute entirely when the binding is undefined,
    // but includes it as 'aria-current="false"' if we bind false.
    // We must return undefined, not false, to match the Vue template.
    const result = ariaCurrent(false);
    expect(result).not.toBe("false");
    expect(result).not.toBe(false);
    expect(result).toBeUndefined();
  });
});

describe("RepoTabs extension URLs", () => {
  test("carries repository and workspace scope when both ids are known", () => {
    expect(
      repoExtPath({
        repoPath: "comtrya/dogfood",
        slug: "issues",
        workspaceId: "ws_123",
        repositoryId: "repo_456",
      }),
    ).toBe("/r/comtrya/dogfood/issues?repositoryId=repo_456&workspaceId=ws_123");
  });

  test("still carries repository scope while workspace id is loading", () => {
    expect(
      repoExtPath({
        repoPath: "comtrya/dogfood",
        slug: "issues",
        repositoryId: "repo_456",
      }),
    ).toBe("/r/comtrya/dogfood/issues?repositoryId=repo_456");
  });
});
