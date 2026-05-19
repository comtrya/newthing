import { afterEach, describe, expect, test } from "bun:test";

import {
  _resetWorkspaceStoreForTesting,
  activeWorkspaceId,
  activeWorkspaceUri,
  setActiveWorkspaceId,
  subscribeWorkspaceId,
  whenWorkspaceReady,
} from "./workspace-store";

afterEach(() => {
  _resetWorkspaceStoreForTesting();
});

describe("workspace store", () => {
  test("activeWorkspaceId() returns null before any set", () => {
    expect(activeWorkspaceId()).toBeNull();
    expect(activeWorkspaceUri()).toBeNull();
  });

  test("setActiveWorkspaceId() makes the id readable", () => {
    setActiveWorkspaceId("ws_abc");
    expect(activeWorkspaceId()).toBe("ws_abc");
    expect(activeWorkspaceUri()).toBe("comtrya://workspace/ws_abc");
  });

  test("subscribers fire on change but not on no-op set", () => {
    const seen: Array<string | null> = [];
    const off = subscribeWorkspaceId((id) => seen.push(id));
    setActiveWorkspaceId("ws_1");
    setActiveWorkspaceId("ws_1"); // no-op (same value)
    setActiveWorkspaceId("ws_2");
    setActiveWorkspaceId(null);
    off();
    setActiveWorkspaceId("ws_3"); // after unsubscribe — not seen
    expect(seen).toEqual(["ws_1", "ws_2", null]);
  });

  test("whenWorkspaceReady() resolves with the next non-null set", async () => {
    const promise = whenWorkspaceReady();
    setActiveWorkspaceId("ws_late");
    expect(await promise).toBe("ws_late");
  });

  test("whenWorkspaceReady() resolves immediately if already set", async () => {
    setActiveWorkspaceId("ws_already");
    const id = await whenWorkspaceReady();
    expect(id).toBe("ws_already");
  });

  test("multiple concurrent whenWorkspaceReady() callers all resolve", async () => {
    const a = whenWorkspaceReady();
    const b = whenWorkspaceReady();
    setActiveWorkspaceId("ws_shared");
    expect(await a).toBe("ws_shared");
    expect(await b).toBe("ws_shared");
  });

  test("setActiveWorkspaceId(null) does NOT resolve pending whenWorkspaceReady callers", async () => {
    let resolved = false;
    void whenWorkspaceReady().then(() => {
      resolved = true;
    });
    setActiveWorkspaceId(null);
    // Give the microtask queue a turn.
    await new Promise((r) => setTimeout(r, 0));
    expect(resolved).toBe(false);
  });
});
