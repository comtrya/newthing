import { describe, expect, test } from "bun:test";
import type { OpResult } from "@comtrya/sdk-core";
import {
  countOpenIssues,
  issueRepositoryId,
  listWorkspaceRepositoryIssues,
  openIssueCountsByRepository,
  workspaceIdFromUri,
  workspaceRepositoryUri,
  type WorkspaceIssueRow,
} from "./workspace-issues";

describe("workspace issue helpers", () => {
  test("builds and parses workspace repository URIs", () => {
    expect(workspaceRepositoryUri("ws_123", "repo_456")).toBe(
      "comtrya://workspace/ws_123/repository/repo_456",
    );
    expect(workspaceIdFromUri("comtrya://workspace/ws_123")).toBe("ws_123");
    expect(
      workspaceIdFromUri("comtrya://workspace/ws_123/repository/repo_456"),
    ).toBe("ws_123");
    expect(workspaceIdFromUri("comtrya://repository/repo_456")).toBeNull();
  });

  test("counts open issue states by repository", () => {
    const issues: WorkspaceIssueRow[] = [
      {
        repository: "comtrya://workspace/ws_123/repository/repo_a",
        state: "open",
      },
      {
        repository: "comtrya://workspace/ws_123/repository/repo_a",
        state: "reopened",
      },
      {
        repository: "comtrya://workspace/ws_123/repository/repo_a",
        state: "closed",
      },
      {
        repository: "comtrya://workspace/ws_123/repository/repo_b",
        state: "OPEN",
      },
    ];

    expect(issueRepositoryId(issues[0]!)).toBe("repo_a");
    expect(countOpenIssues(issues)).toBe(3);
    expect(
      openIssueCountsByRepository(
        [{ id: "repo_a" }, { id: "repo_b" }, { id: "repo_disabled" }],
        issues,
      ),
    ).toEqual({
      repo_a: 2,
      repo_b: 1,
      repo_disabled: 0,
    });
  });

  test("lists issues by repo and ignores disabled repositories", async () => {
    const calls: unknown[] = [];
    const invoke = async <T>(
      extensionId: string,
      interfaceName: string,
      opName: string,
      input?: unknown,
    ): Promise<OpResult<T>> => {
      calls.push({ extensionId, interfaceName, opName, input });
      const repository = (input as { repository?: string }).repository ?? "";
      if (repository.endsWith("/repo_disabled")) {
        return {
          ok: false,
          error: {
            code: "forbidden",
            message: "extension_not_enabled",
          },
        };
      }
      return {
        ok: true,
        value: [
          {
            repository,
            state: "open",
          },
        ] as T,
      };
    };

    const rows = await listWorkspaceRepositoryIssues(
      "ws_123",
      [{ id: "repo_a" }, { id: "repo_disabled" }],
      { invoke, limitPerRepository: 12 },
    );

    expect(rows).toEqual([
      {
        repository: "comtrya://workspace/ws_123/repository/repo_a",
        state: "open",
      },
    ]);
    expect(calls).toEqual([
      {
        extensionId: "ext_issues",
        interfaceName: "issues",
        opName: "list-issues",
        input: {
          repository: "comtrya://workspace/ws_123/repository/repo_a",
          limit: 12,
        },
      },
      {
        extensionId: "ext_issues",
        interfaceName: "issues",
        opName: "list-issues",
        input: {
          repository: "comtrya://workspace/ws_123/repository/repo_disabled",
          limit: 12,
        },
      },
    ]);
  });

  test("coalesces concurrent repo issue reads", async () => {
    let calls = 0;
    const invoke = async <T>(
      _extensionId: string,
      _interfaceName: string,
      _opName: string,
      input?: unknown,
    ): Promise<OpResult<T>> => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        ok: true,
        value: [
          {
            repository: (input as { repository?: string }).repository ?? "",
            state: "open",
          },
        ] as T,
      };
    };

    const repositories = [{ id: "repo_a" }];
    const [left, right] = await Promise.all([
      listWorkspaceRepositoryIssues("ws_123", repositories, {
        invoke,
        coalesce: true,
      }),
      listWorkspaceRepositoryIssues("ws_123", repositories, {
        invoke,
        coalesce: true,
      }),
    ]);

    expect(calls).toBe(1);
    expect(left).toEqual(right);
    expect(left).toEqual([
      {
        repository: "comtrya://workspace/ws_123/repository/repo_a",
        state: "open",
      },
    ]);
  });
});
