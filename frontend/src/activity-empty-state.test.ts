import { describe, expect, test } from "bun:test";

import { activityEmptyStateCopy } from "./activity-empty-state";

describe("activity stream empty state", () => {
  test("keeps the signed-out prompt only for unauthenticated idle streams", () => {
    expect(
      activityEmptyStateCopy({
        status: "idle",
        error: null,
        hasSession: false,
      }),
    ).toEqual({
      kind: "signed-out",
      message:
        "Sign in to see live activity. Recent activity will appear here after events occur.",
    });
  });

  test("shows a normal empty feed for signed-in idle streams", () => {
    expect(
      activityEmptyStateCopy({
        status: "idle",
        error: null,
        hasSession: true,
      }),
    ).toEqual({
      kind: "empty",
      message: "No activity yet. Open an issue or push a branch to see it appear here.",
    });
  });

  test("keeps transient and error states explicit", () => {
    expect(
      activityEmptyStateCopy({
        status: "connecting",
        error: null,
        hasSession: true,
      }),
    ).toEqual({
      kind: "connecting",
      message: "Connecting to the live stream...",
    });

    expect(
      activityEmptyStateCopy({
        status: "error",
        error: "Live stream disconnected.",
        hasSession: true,
      }),
    ).toEqual({
      kind: "error",
      message: "Live stream disconnected.",
    });
  });
});
