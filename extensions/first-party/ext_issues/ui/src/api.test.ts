import { describe, expect, test } from "bun:test";
import { repositoryUri } from "./scope";

describe("repositoryUri", () => {
  test("uses workspace-scoped repository URI when both ids are present", () => {
    expect(repositoryUri("ws_123", "repo_456")).toBe(
      "comtrya://workspace/ws_123/repository/repo_456",
    );
  });

  test("uses repo-only URI when the workspace id is not ready", () => {
    expect(repositoryUri("", "repo_456")).toBe("comtrya://repository/repo_456");
  });

  test("trims ids before building the URI", () => {
    expect(repositoryUri(" ws_123 ", " repo_456 ")).toBe(
      "comtrya://workspace/ws_123/repository/repo_456",
    );
  });

  test("uses workspace URI for workspace-wide lists", () => {
    expect(repositoryUri("ws_123", null)).toBe("comtrya://workspace/ws_123");
  });
});
