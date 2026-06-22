import { describe, expect, test } from "bun:test";
import {
  internalIssueRefTitle,
  issueNumberLabel,
  issueReferenceLabel,
} from "./issue-labels";

describe("issue labels", () => {
  test("formats visible issue numbers like a forge issue reference", () => {
    expect(issueNumberLabel({ number: 42 })).toBe("#42");
    expect(issueReferenceLabel({ number: 42, issueRef: "comtrya://issue/iss_42" })).toBe(
      "Issue #42",
    );
  });

  test("does not expose internal issue refs as a visible fallback", () => {
    expect(issueReferenceLabel({ issueRef: "comtrya://issue/iss_01" })).toBe(
      "Missing issue",
    );
  });

  test("uses a human title when the issue number is unavailable", () => {
    expect(issueReferenceLabel({ title: "Write the PRD" })).toBe("Write the PRD");
  });

  test("keeps the internal ref available as hover context", () => {
    expect(internalIssueRefTitle({ issueRef: "comtrya://issue/iss_01" })).toBe(
      "Internal issue ref: comtrya://issue/iss_01",
    );
    expect(internalIssueRefTitle({ issueRef: " " })).toBeUndefined();
  });
});
