import { describe, expect, test } from "bun:test";
import {
  checkSummaryLabel,
  readinessTone,
  reviewSummaryLabel,
} from "./merge-readiness";

describe("pull merge readiness labels", () => {
  test("classifies blocking and waiting lanes", () => {
    expect(readinessTone("blocked-review")).toBe("blocked");
    expect(readinessTone("blocked-checks")).toBe("blocked");
    expect(readinessTone("needs-review")).toBe("review");
    expect(readinessTone("waiting-checks")).toBe("checks");
    expect(readinessTone("ready")).toBe("ready");
    expect(readinessTone("merged")).toBe("terminal");
  });

  test("summarizes required check blockers before pending checks", () => {
    expect(
      checkSummaryLabel({
        pullId: "pr_1",
        requiredMissing: 1,
        requiredFailing: 2,
        pending: 4,
        optionalFailing: 1,
        passing: 0,
        total: 8,
      }),
    ).toBe("3 required checks blocking");
  });

  test("summarizes review blockers before approvals", () => {
    expect(
      reviewSummaryLabel({
        requiredApprovals: 2,
        approvalCount: 1,
        changeRequestCount: 1,
        commentCount: 3,
      }),
    ).toBe("1 change request");
  });
});
