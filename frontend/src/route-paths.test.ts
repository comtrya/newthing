// Routing coverage for the single-tenant `/r/<...groups>/<repo>/...`
// URL scheme. Tests vue-router's pattern matching against the
// `shellRoutePaths` constants — the pure-TS source of truth for the
// shell's URL surface.
//
// IMPORTANT: this test builds its own memory router from
// `shellRoutePaths`, in the same declaration order as production
// `frontend/src/router.ts`. The two arrays must be kept in sync by
// hand — if `router.ts` re-orders e.g. `repoIssueBoard` after
// `repoIssues`, the production matching changes but these tests
// still pass. Production declaration-order is not guarded by this
// PR; see issue #13 for the deferred sub-PR that closes that gap
// (needs a bun-test `.vue` loader plugin or a `router.ts` refactor
// that doesn't strip route `props`).
//
// What IS guarded here:
//   - `route-paths.ts` glob modifier syntax (`+`, `*`, `(.*)*`).
//   - vue-router 4 param shapes (array vs string for `+`/`*`).
//   - `projectHref` URL-encoding + round-trip.
//   - Pattern-precedence between specific and catch-all when
//     declared in the production order.

import { describe, expect, test } from "bun:test";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import {
  projectHref,
  projectNewWorkHref,
  projectWorkHref,
  shellRoutePaths,
} from "./route-paths";

const Stub = defineComponent({ render: () => null });

function buildRouter() {
  // Declaration order MIRRORS production `router.ts`. Specific
  // routes (issue-board, pull-review, project-home) must precede
  // their catch-all siblings (issues, pulls, repo-home) — that's
  // the only way vue-router's "first match wins" picks the right
  // one.
  const routes: RouteRecordRaw[] = [
    { name: "workspace-home", path: shellRoutePaths.workspaceHome, component: Stub },
    { name: "inbox", path: shellRoutePaths.inbox, component: Stub },
    { name: "new-repository", path: shellRoutePaths.newRepository, component: Stub },
    { name: "repos", path: shellRoutePaths.repos, component: Stub },
    { name: "instance-admin", path: shellRoutePaths.instanceAdmin, component: Stub },
    { name: "settings", path: shellRoutePaths.settings, component: Stub },
    { name: "health", path: shellRoutePaths.health, component: Stub },
    { name: "pipelines", path: shellRoutePaths.pipelines, component: Stub },
    { name: "releases", path: shellRoutePaths.releases, component: Stub },
    { name: "admin-overview", path: shellRoutePaths.adminOverview, component: Stub },
    { name: "admin-access", path: shellRoutePaths.adminAccess, component: Stub },
    { name: "admin-storage", path: shellRoutePaths.adminStorage, component: Stub },
    { name: "project-home", path: shellRoutePaths.projectHome, component: Stub },
    { name: "repo-code", path: shellRoutePaths.repoCode, component: Stub },
    { name: "repo-branches", path: shellRoutePaths.repoBranches, component: Stub },
    { name: "repo-tags", path: shellRoutePaths.repoTags, component: Stub },
    { name: "repo-commits", path: shellRoutePaths.repoCommits, component: Stub },
    { name: "repo-pull-review", path: shellRoutePaths.repoPullReview, component: Stub },
    { name: "repo-issue-board", path: shellRoutePaths.repoIssueBoard, component: Stub },
    { name: "repo-commit-detail", path: shellRoutePaths.repoCommitDetail, component: Stub },
    { name: "repo-pipelines", path: shellRoutePaths.repoPipelines, component: Stub },
    { name: "repo-releases", path: shellRoutePaths.repoReleases, component: Stub },
    { name: "repo-config", path: shellRoutePaths.repoConfig, component: Stub },
    { name: "repo-pulls", path: shellRoutePaths.repoPulls, component: Stub },
    { name: "repo-issues", path: shellRoutePaths.repoIssues, component: Stub },
    { name: "repo-checks", path: shellRoutePaths.repoChecks, component: Stub },
    { name: "repo-epics", path: shellRoutePaths.repoEpics, component: Stub },
    { name: "repo-docs", path: shellRoutePaths.repoDocs, component: Stub },
    { name: "repo-sprints", path: shellRoutePaths.repoSprints, component: Stub },
    { name: "repo-home", path: shellRoutePaths.repoHome, component: Stub },
    { name: "extension-route", path: shellRoutePaths.extensionRoute, component: Stub },
  ];
  // Pass explicit "/" base so vue-router 5 doesn't probe the DOM for
  // a <base> tag; happy-dom's SyntaxError surrogate isn't a
  // constructor in this bun-test setup and the probe throws.
  return createRouter({ history: createMemoryHistory("/"), routes });
}

describe("shell route paths", () => {
  const router = buildRouter();

  test("workspace home resolves at /", () => {
    const r = router.resolve("/");
    expect(r.name).toBe("workspace-home");
  });

  test("repo root resolves with single-group infinite-nesting params", () => {
    const r = router.resolve("/r/acme/web");
    expect(r.name).toBe("repo-home");
    expect(r.params.groups).toEqual(["acme"]);
    expect(r.params.repo).toBe("web");
  });

  test("single-segment repo (no group) resolves", () => {
    // `:groups*` (zero-or-more) — a repo imported with a one-segment
    // path like `rawkode` has no group prefix. With `:groups+` this
    // matched nothing and rendered an empty page.
    const r = router.resolve("/r/rawkode");
    expect(r.name).toBe("repo-home");
    expect(r.params.repo).toBe("rawkode");
    // vue-router omits an empty repeatable param; the router prop
    // adapter normalizes the absent value to [].
    expect(r.params.groups ?? []).toEqual([]);
  });

  test("single-segment repo sub-surfaces resolve", () => {
    expect(router.resolve("/r/rawkode/code").name).toBe("repo-code");
    expect(router.resolve("/r/rawkode/issues/board").name).toBe(
      "repo-issue-board",
    );
    expect(router.resolve("/r/rawkode/issues/12").name).toBe("repo-issues");
    expect(router.resolve("/r/rawkode/p/launch").name).toBe("project-home");
  });

  test("repo root with 3 groups deeply nested", () => {
    const r = router.resolve("/r/acme/team-x/proj-y/web");
    expect(r.name).toBe("repo-home");
    expect(r.params.groups).toEqual(["acme", "team-x", "proj-y"]);
    expect(r.params.repo).toBe("web");
  });

  test("repo code tab preserves group/repo destructuring", () => {
    const r = router.resolve("/r/acme/team/web/code");
    expect(r.name).toBe("repo-code");
    expect(r.params.groups).toEqual(["acme", "team"]);
    expect(r.params.repo).toBe("web");
  });

  test("repo branches list preserves group/repo destructuring", () => {
    const r = router.resolve("/r/acme/team/web/branches");
    expect(r.name).toBe("repo-branches");
    expect(r.params.groups).toEqual(["acme", "team"]);
    expect(r.params.repo).toBe("web");
  });

  test("repo tags list preserves group/repo destructuring", () => {
    const r = router.resolve("/r/acme/team/web/tags");
    expect(r.name).toBe("repo-tags");
    expect(r.params.groups).toEqual(["acme", "team"]);
    expect(r.params.repo).toBe("web");
  });

  test("repo commits list and detail preserve group/repo destructuring", () => {
    const list = router.resolve("/r/acme/team/web/commits");
    expect(list.name).toBe("repo-commits");
    expect(list.params.groups).toEqual(["acme", "team"]);
    expect(list.params.repo).toBe("web");

    const detail = router.resolve("/r/acme/team/web/commits/abc1234");
    expect(detail.name).toBe("repo-commit-detail");
    expect(detail.params.groups).toEqual(["acme", "team"]);
    expect(detail.params.repo).toBe("web");
    expect(detail.params.oid).toBe("abc1234");
  });

  test("issue board wins over issues catch-all", () => {
    const r = router.resolve("/r/acme/web/issues/board");
    expect(r.name).toBe("repo-issue-board");
  });

  test("issues catch-all captures sub-path as rest array", () => {
    const r = router.resolve("/r/acme/web/issues/123");
    expect(r.name).toBe("repo-issues");
    // `:rest(.*)*` — the `.*` regex consumes the whole sub-path as a
    // single segment; for "123" that's ["123"].
    expect(r.params.rest).toEqual(["123"]);
  });

  test("pull review wins over pulls catch-all", () => {
    const r = router.resolve("/r/acme/web/pulls/45/review");
    expect(r.name).toBe("repo-pull-review");
    expect(r.params.id).toBe("45");
  });

  test("pulls catch-all matches sub-paths the specific routes don't", () => {
    const r = router.resolve("/r/acme/web/pulls/queue");
    expect(r.name).toBe("repo-pulls");
    expect(r.params.rest).toEqual(["queue"]);
  });

  test("docs and sprints repo routes embed extension sub-paths", () => {
    const docs = router.resolve("/r/acme/web/docs/prds");
    expect(docs.name).toBe("repo-docs");
    expect(docs.params.rest).toEqual(["prds"]);

    const sprints = router.resolve("/r/acme/web/sprints/current");
    expect(sprints.name).toBe("repo-sprints");
    expect(sprints.params.rest).toEqual(["current"]);
  });

  test("project home parses :project segment", () => {
    const r = router.resolve("/r/acme/web/p/launch-q4");
    expect(r.name).toBe("project-home");
    expect(r.params.groups).toEqual(["acme"]);
    expect(r.params.repo).toBe("web");
    expect(r.params.project).toBe("launch-q4");
  });

  test("extension route uses plain :rest* (split on slash)", () => {
    const r = router.resolve("/x/issues/list/all");
    expect(r.name).toBe("extension-route");
    expect(r.params.prefix).toBe("issues");
    // Plain `:rest*` (no regex) yields per-segment array.
    expect(r.params.rest).toEqual(["list", "all"]);
  });

  test("projectHref round-trip with simple segments", () => {
    // NB: `projectHref(segments, name)` lays segments + name into the
    // URL but vue-router's `:groups+/:repo` greedily-then-backtracking
    // match collapses the LAST `segments[]` entry into `:repo`. For
    // `segments=["acme","team"]` the resolved params split as
    // groups=["acme"], repo="team". Callers who want the full segment
    // list back should use the original segments, not router params.
    const href = projectHref(["acme", "team"], "launch-q4");
    expect(href).toBe("/r/acme/team/p/launch-q4");
    const r = router.resolve(href);
    expect(r.name).toBe("project-home");
    expect(r.params.groups).toEqual(["acme"]);
    expect(r.params.repo).toBe("team");
    expect(r.params.project).toBe("launch-q4");
  });

  test("projectHref round-trip with URL-encoded spaces", () => {
    const href = projectHref(["acme", "my repo"], "launch q4");
    expect(href).toContain("my%20repo");
    expect(href).toContain("launch%20q4");
    const r = router.resolve(href);
    expect(r.name).toBe("project-home");
    // vue-router decodes percent-encoded path segments back to raw
    // strings. Same backtracking behavior as the simple-segments
    // round-trip: last segment binds to :repo, not :groups+.
    expect(r.params.groups).toEqual(["acme"]);
    expect(r.params.repo).toBe("my repo");
    expect(r.params.project).toBe("launch q4");
  });

  test("projectWorkHref keeps workspace project queues on extension routes", () => {
    expect(projectWorkHref({
      surface: "issues",
      projectName: "frontend",
      workspaceId: "ws_123",
    })).toBe("/x/issues/?project=frontend&workspaceId=ws_123");

    expect(projectWorkHref({
      surface: "epics",
      projectName: "launch q4",
      state: "IN_PROGRESS",
      workspaceId: "ws_123",
    })).toBe("/x/epics/?project=launch+q4&state=IN_PROGRESS&workspaceId=ws_123");
  });

  test("projectWorkHref scopes repository project queues to the workbench", () => {
    const href = projectWorkHref({
      surface: "issues",
      projectName: "backend",
      state: "CLOSED",
      repoSegments: ["comtrya", "dogfood"],
      workspaceId: "ws_123",
      repositoryId: "repo_456",
    });

    expect(href).toBe(
      "/r/comtrya/dogfood/issues?project=backend&state=CLOSED&workspaceId=ws_123&repositoryId=repo_456",
    );
    const r = router.resolve(href);
    expect(r.name).toBe("repo-issues");
    expect(r.params.groups).toEqual(["comtrya"]);
    expect(r.params.repo).toBe("dogfood");
  });

  test("projectNewWorkHref keeps workspace creation routes on extensions", () => {
    expect(projectNewWorkHref({
      surface: "issues",
      projectName: "frontend",
      workspaceId: "ws_123",
    })).toBe("/x/issues/new?projectName=frontend&workspaceId=ws_123");

    expect(projectNewWorkHref({
      surface: "epics",
      projectName: "launch q4",
      workspaceId: "ws_123",
    })).toBe("/x/epics/new?projectName=launch+q4&workspaceId=ws_123");
  });

  test("projectNewWorkHref scopes repository creation routes to the workbench", () => {
    const href = projectNewWorkHref({
      surface: "epics",
      projectName: "launch q4",
      repoSegments: ["comtrya", "dog food"],
      workspaceId: "ws_123",
      repositoryId: "repo_456",
    });

    expect(href).toBe(
      "/r/comtrya/dog%20food/epics/new?projectName=launch+q4&workspaceId=ws_123&repositoryId=repo_456",
    );
    const r = router.resolve(href);
    expect(r.name).toBe("repo-epics");
    expect(r.params.groups).toEqual(["comtrya"]);
    expect(r.params.repo).toBe("dog food");
    expect(r.params.rest).toEqual(["new"]);
  });
});
