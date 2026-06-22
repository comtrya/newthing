import { describe, expect, test } from "bun:test";
import {
  isRecordableRoute,
  labelForRoute,
  normalizeRecentEntry,
} from "./recents";

describe("recent route helpers", () => {
  test("keeps pinned shell destinations out of recents", () => {
    expect(isRecordableRoute("/")).toBe(false);
    expect(isRecordableRoute("/repos")).toBe(false);
    expect(isRecordableRoute("/pipelines")).toBe(false);
    expect(isRecordableRoute("/releases")).toBe(false);
    expect(isRecordableRoute("/admin")).toBe(false);
    expect(isRecordableRoute("/settings")).toBe(false);
    expect(isRecordableRoute("/r/comtrya/dogfood/docs")).toBe(true);
  });

  test("labels repo work surfaces with product language", () => {
    expect(labelForRoute("/r/comtrya/dogfood/docs")).toBe("comtrya/dogfood/Specs");
    expect(labelForRoute("/r/comtrya/dogfood/docs/scenarios")).toBe(
      "comtrya/dogfood/BDD Scenarios",
    );
    expect(labelForRoute("/r/comtrya/dogfood/docs/readiness")).toBe(
      "comtrya/dogfood/Readiness",
    );
    expect(labelForRoute("/r/comtrya/dogfood/docs/traceability")).toBe(
      "comtrya/dogfood/Traceability",
    );
    expect(labelForRoute("/r/comtrya/dogfood/sprints")).toBe("comtrya/dogfood/Kanban");
    expect(labelForRoute("/r/comtrya/dogfood/pipelines")).toBe("comtrya/dogfood/Actions");
    expect(labelForRoute("/r/comtrya/dogfood/releases")).toBe("comtrya/dogfood/Releases");
    expect(labelForRoute("/r/comtrya/dogfood/commits/abc1234")).toBe(
      "comtrya/dogfood/Commits",
    );
  });

  test("labels workspace extension surfaces without raw x-prefixes", () => {
    expect(labelForRoute("/x/docs/")).toBe("Specs");
    expect(labelForRoute("/x/docs/prds")).toBe("PRDs");
    expect(labelForRoute("/x/docs/scenarios")).toBe("BDD Scenarios");
    expect(labelForRoute("/x/docs/bdd")).toBe("BDD Scenarios");
    expect(labelForRoute("/x/docs/readiness")).toBe("Readiness");
    expect(labelForRoute("/x/sprints/")).toBe("Kanban");
    expect(labelForRoute("/x/epics/board")).toBe("Epics");
  });

  test("refreshes stored recent labels from current route copy", () => {
    expect(
      normalizeRecentEntry({
        path: "/r/comtrya/dogfood/sprints",
        label: "comtrya/dogfood/sprints",
        timestamp: 1,
      }),
    ).toEqual({
      path: "/r/comtrya/dogfood/sprints",
      label: "comtrya/dogfood/Kanban",
      timestamp: 1,
    });

    expect(
      normalizeRecentEntry({
        path: "/r/comtrya/dogfood/docs/scenarios",
        label: "comtrya/dogfood/docs",
        timestamp: 2,
      }),
    ).toEqual({
      path: "/r/comtrya/dogfood/docs/scenarios",
      label: "comtrya/dogfood/BDD Scenarios",
      timestamp: 2,
    });
  });

  test("keeps detail labels for individual issue, pull, and epic routes", () => {
    expect(labelForRoute("/x/issues/ws_1/42")).toBe("issue #42");
    expect(labelForRoute("/x/pulls/pr_abcdef123")).toBe("pull pr_abcd");
    expect(labelForRoute("/x/epics/ws_1/epc_01ABCDEF")).toBe("epic 01ABCDE");
  });
});
