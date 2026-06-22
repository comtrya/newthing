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
    expect(labelForRoute("/r/comtrya/dogfood/docs")).toBe("comtrya/dogfood/Docs");
    expect(labelForRoute("/r/comtrya/dogfood/sprints")).toBe("comtrya/dogfood/Kanban");
    expect(labelForRoute("/r/comtrya/dogfood/pipelines")).toBe("comtrya/dogfood/Actions");
    expect(labelForRoute("/r/comtrya/dogfood/releases")).toBe("comtrya/dogfood/Releases");
    expect(labelForRoute("/r/comtrya/dogfood/commits/abc1234")).toBe(
      "comtrya/dogfood/Commits",
    );
  });

  test("labels workspace extension surfaces without raw x-prefixes", () => {
    expect(labelForRoute("/x/docs/scenarios")).toBe("Specs");
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
  });

  test("keeps detail labels for individual issue, pull, and epic routes", () => {
    expect(labelForRoute("/x/issues/ws_1/42")).toBe("issue #42");
    expect(labelForRoute("/x/pulls/pr_abcdef123")).toBe("pull pr_abcd");
    expect(labelForRoute("/x/epics/ws_1/epc_01ABCDEF")).toBe("epic 01ABCDE");
  });
});
