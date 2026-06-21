import { describe, expect, test } from "bun:test";
import {
  checkStateLabel,
  matchesActionFilter,
  relativeTime,
  sortChecksByUpdated,
  statusForCheck,
  statusForChecks,
} from "./pipeline-summary";

describe("pipeline summary status bucketing", () => {
  test("treats failed required checks as blocking", () => {
    expect(statusForCheck({ state: "FAILURE", required: true })).toBe("blocking");
    expect(statusForCheck({ state: "FAILED", required: true })).toBe("blocking");
    expect(statusForCheck({ state: "FAILURE", required: false })).toBe("failed");
  });

  test("rolls repository status up by operational priority", () => {
    expect(statusForChecks([])).toBe("empty");
    expect(statusForChecks([{ state: "SUCCESS", required: true }])).toBe("passing");
    expect(statusForChecks([{ state: "FAILURE", required: false }])).toBe("failed");
    expect(statusForChecks([{ state: "PENDING" }, { state: "SUCCESS" }])).toBe("queued");
    expect(statusForChecks([{ state: "RUNNING" }, { state: "PENDING" }])).toBe("running");
    expect(statusForChecks([{ state: "RUNNING" }, { state: "FAILURE", required: true }])).toBe("blocking");
  });

  test("matches segmented filters without hiding skipped runs from passing", () => {
    expect(matchesActionFilter("blocking", "blocking")).toBe(true);
    expect(matchesActionFilter("running", "blocking")).toBe(false);
    expect(matchesActionFilter("skipped", "passing")).toBe(true);
    expect(matchesActionFilter("empty", "all")).toBe(true);
  });

  test("formats check labels and recency for compact rows", () => {
    const now = Date.parse("2026-06-21T12:00:00.000Z");
    expect(checkStateLabel("SUCCESS")).toBe("Passed");
    expect(checkStateLabel("RUNNING")).toBe("Running");
    expect(relativeTime("2026-06-21T11:45:00.000Z", now)).toBe("15m ago");
    expect(relativeTime("not-a-date", now)).toBe("");
  });

  test("sorts checks newest first using updatedAt before createdAt", () => {
    const sorted = sortChecksByUpdated([
      { state: "SUCCESS", createdAt: "2026-06-21T10:00:00.000Z" },
      { state: "RUNNING", updatedAt: "2026-06-21T11:00:00.000Z" },
      { state: "PENDING", updatedAt: "2026-06-21T09:00:00.000Z" },
    ]);
    expect(sorted.map((check) => check.state)).toEqual([
      "RUNNING",
      "SUCCESS",
      "PENDING",
    ]);
  });
});
