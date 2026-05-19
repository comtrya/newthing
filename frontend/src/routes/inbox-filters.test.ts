import { describe, expect, test } from "bun:test";

import { isFailedCheckState, isOpenPrState } from "./inbox-filters";

describe("isOpenPrState", () => {
  test.each(["draft", "ready", "review", "DRAFT", "Ready", "ReViEw"])(
    "accepts canonical pr-state %p (case-insensitive)",
    (state) => {
      expect(isOpenPrState(state)).toBe(true);
    },
  );

  test.each(["merged", "closed", "MERGED", "Closed"])(
    "rejects terminal pr-state %p",
    (state) => {
      expect(isOpenPrState(state)).toBe(false);
    },
  );

  // #6 P0-6 — issue states must not pass the PR filter. This is the
  // regression that motivated extracting the predicate.
  test.each(["open", "OPEN", "reopened", "REOPENED"])(
    "rejects issue-state %p (would mis-classify issues as open PRs)",
    (state) => {
      expect(isOpenPrState(state)).toBe(false);
    },
  );

  test("treats null / undefined / empty string as not-open", () => {
    expect(isOpenPrState(null)).toBe(false);
    expect(isOpenPrState(undefined)).toBe(false);
    expect(isOpenPrState("")).toBe(false);
  });
});

describe("isFailedCheckState", () => {
  test.each(["FAILURE", "FAILED", "failure", "failed", "Failure"])(
    "accepts both failure spellings (case-insensitive): %p",
    (state) => {
      expect(isFailedCheckState(state)).toBe(true);
    },
  );

  test.each(["SUCCESS", "PENDING", "QUEUED", "RUNNING", "CANCELLED"])(
    "rejects non-failure state %p",
    (state) => {
      expect(isFailedCheckState(state)).toBe(false);
    },
  );

  test("treats null / undefined / empty string as not-failed", () => {
    expect(isFailedCheckState(null)).toBe(false);
    expect(isFailedCheckState(undefined)).toBe(false);
    expect(isFailedCheckState("")).toBe(false);
  });
});
