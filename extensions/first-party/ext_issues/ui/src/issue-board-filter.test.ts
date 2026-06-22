import { describe, expect, test } from "bun:test";
import {
  filterIssueBoard,
  type FilterableIssueBoard,
  type IssueBoardFilterQuery,
} from "./issue-board-filter";

function query(text = "", filters: Record<string, string[]> = {}): IssueBoardFilterQuery {
  return { text, filters };
}

const board: FilterableIssueBoard = {
  total: 3,
  columns: [
    {
      key: "ready",
      label: "Ready",
      count: 2,
      cards: [
        {
          issue: {
            number: 1,
            title: "first issue",
            bodyMarkdown: "Tracks the first slice of work.",
            state: "OPEN",
            authorRef: "comtrya://agent/ci",
            assignees: ["comtrya://user/rawkode"],
            labels: ["kind::ux", "priority::p0", "status::ready"],
            projectName: "kernel",
          },
          priority: "p0",
          priorityLabel: "P0",
          milestone: "v1.0",
          milestoneLabel: "v1.0",
          workflow: "ready",
          workflowLabel: "status::ready",
        },
        {
          issue: {
            number: 2,
            title: "second issue",
            state: "OPEN",
            authorRef: "comtrya://user/rawkode",
            labels: ["kind::bug", "priority::p1", "workflow/in-progress"],
            projectName: "kernel",
          },
          priority: "p1",
          priorityLabel: "P1",
          milestone: "v2.0",
          milestoneLabel: "v2.0",
          workflow: "in-progress",
          workflowLabel: "workflow/in-progress",
        },
      ],
    },
    {
      key: "closed",
      label: "Closed",
      count: 1,
      cards: [
        {
          issue: {
            number: 3,
            title: "closed follow-up",
            state: "CLOSED",
            authorRef: "comtrya://user/platform",
            labels: ["kind::cleanup"],
            projectName: "docs",
          },
        },
      ],
    },
  ],
};

describe("filterIssueBoard", () => {
  test("filters cards by state alias, project, assignee, label, and text", () => {
    const filtered = filterIssueBoard(
      board,
      query("first slice", {
        is: ["open"],
        project: ["kernel"],
        assignee: ["rawkode"],
        label: ["kind::ux"],
      }),
    );

    expect(filtered.total).toBe(1);
    expect(filtered.columns.map((column) => column.count)).toEqual([1, 0]);
    expect(filtered.columns[0]?.cards[0]?.issue.number).toBe(1);
  });

  test("matches issue number, priority, milestone, and workflow filters", () => {
    const filtered = filterIssueBoard(
      board,
      query("", {
        issue: ["#2"],
        priority: ["p1"],
        milestone: ["v2"],
        workflow: ["progress"],
      }),
    );

    expect(filtered.total).toBe(1);
    expect(filtered.columns[0]?.cards[0]?.issue.title).toBe("second issue");
  });

  test("requires all requested labels", () => {
    const filtered = filterIssueBoard(
      board,
      query("", { label: ["kind::bug", "priority::p1"] }),
    );

    expect(filtered.total).toBe(1);
    expect(filtered.columns[0]?.cards[0]?.issue.number).toBe(2);
  });

  test("rejects cards outside requested state", () => {
    const filtered = filterIssueBoard(board, query("", { is: ["done"] }));

    expect(filtered.total).toBe(1);
    expect(filtered.columns[1]?.cards[0]?.issue.title).toBe("closed follow-up");
  });
});
