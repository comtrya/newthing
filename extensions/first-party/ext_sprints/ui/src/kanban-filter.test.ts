import { describe, expect, test } from "bun:test";
import { filterKanbanSwimlanesByProject } from "./kanban-filter";
import type { ProjectKanbanSwimlane } from "./types";

const swimlanes: ProjectKanbanSwimlane[] = [
  {
    key: "project-backend",
    label: "backend",
    projectName: "backend",
    total: 2,
    columns: [
      {
        key: "open",
        label: "Open",
        count: 2,
        cards: [
          {
            issueRef: "comtrya://issue/ISS_1",
            title: "backend api",
            state: "open",
            projectName: "backend",
          },
          {
            issueRef: "comtrya://issue/ISS_2",
            title: "frontend shell",
            state: "open",
            projectName: "frontend",
          },
        ],
      },
    ],
  },
  {
    key: "project-frontend",
    label: "frontend",
    projectName: "frontend",
    total: 1,
    columns: [
      {
        key: "closed",
        label: "Closed",
        count: 1,
        cards: [
          {
            issueRef: "comtrya://issue/ISS_3",
            title: "frontend nav",
            state: "closed",
            projectName: "frontend",
          },
        ],
      },
    ],
  },
];

describe("filterKanbanSwimlanesByProject", () => {
  test("leaves swimlanes unchanged without a project filter", () => {
    expect(filterKanbanSwimlanesByProject(swimlanes, "")).toBe(swimlanes);
  });

  test("keeps only cards for the requested project", () => {
    const filtered = filterKanbanSwimlanesByProject(swimlanes, "backend");

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.projectName).toBe("backend");
    expect(filtered[0]?.total).toBe(1);
    expect(filtered[0]?.columns).toHaveLength(1);
    expect(filtered[0]?.columns[0]?.count).toBe(1);
    expect(filtered[0]?.columns[0]?.cards.map((card) => card.title)).toEqual([
      "backend api",
    ]);
  });

  test("drops empty lanes", () => {
    expect(filterKanbanSwimlanesByProject(swimlanes, "docs")).toEqual([]);
  });
});
