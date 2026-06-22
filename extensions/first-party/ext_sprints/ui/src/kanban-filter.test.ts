import { describe, expect, test } from "bun:test";
import {
  filterKanbanSwimlanes,
  filterKanbanSwimlanesByProject,
  filterSprintBoardColumns,
  filterSprintPlanningBoard,
  matchesSprintFilters,
  type BoardFilterQuery,
} from "./kanban-filter";
import type {
  ProjectKanbanSwimlane,
  SprintBoardColumn,
  SprintPlanningBoard,
} from "./types";

function query(text = "", filters: Record<string, string[]> = {}): BoardFilterQuery {
  return { text, filters };
}

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

const planningBoard: SprintPlanningBoard = {
  workspace: "workspace-1",
  total: 2,
  columns: [
    {
      key: "planned",
      label: "Planned",
      count: 1,
      cards: [
        {
          sprint: {
            id: "SPRINT_1",
            workspace: "workspace-1",
            number: 7,
            title: "API hardening",
            state: "planned",
            goal: "Close auth gaps",
            startDate: null,
            endDate: null,
            createdAt: "2026-06-01T00:00:00Z",
            updatedAt: "2026-06-01T00:00:00Z",
          },
        },
      ],
    },
    {
      key: "completed",
      label: "Completed",
      count: 1,
      cards: [
        {
          sprint: {
            id: "SPRINT_2",
            workspace: "workspace-1",
            number: 8,
            title: "Shell polish",
            state: "completed",
            goal: "Improve navigation",
            startDate: null,
            endDate: null,
            createdAt: "2026-06-02T00:00:00Z",
            updatedAt: "2026-06-02T00:00:00Z",
          },
        },
      ],
    },
  ],
};

const issueColumns: SprintBoardColumn[] = [
  {
    key: "open",
    label: "Open",
    count: 2,
    issues: [
      {
        issueRef: "comtrya://issue/ISS_1",
        id: "ISS_1",
        number: 10,
        title: "backend api",
        state: "open",
      },
      {
        issueRef: "comtrya://issue/ISS_2",
        id: "ISS_2",
        number: 11,
        title: "frontend shell",
        state: "reopened",
      },
    ],
  },
  {
    key: "closed",
    label: "Closed",
    count: 1,
    issues: [
      {
        issueRef: "comtrya://issue/ISS_3",
        id: "ISS_3",
        number: 12,
        title: "docs checklist",
        state: "closed",
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

describe("filterSprintPlanningBoard", () => {
  test("filters sprint lifecycle cards by state alias and text", () => {
    const filtered = filterSprintPlanningBoard(
      planningBoard,
      query("shell", { is: ["done"] }),
    );

    expect(filtered.total).toBe(1);
    expect(filtered.columns.map((column) => column.count)).toEqual([0, 1]);
    expect(filtered.columns[1]?.cards[0]?.sprint.title).toBe("Shell polish");
  });

  test("filters sprint lifecycle cards by sprint number", () => {
    const filtered = filterSprintPlanningBoard(
      planningBoard,
      query("", { sprint: ["7"] }),
    );

    expect(filtered.total).toBe(1);
    expect(filtered.columns[0]?.cards[0]?.sprint.title).toBe("API hardening");
  });
});

describe("filterSprintBoardColumns", () => {
  test("filters selected sprint issues by issue number and open-state aliases", () => {
    const sprint = planningBoard.columns[0]?.cards[0]?.sprint;
    const filtered = filterSprintBoardColumns(
      issueColumns,
      query("", { issue: ["11"], is: ["open"] }),
      sprint,
    );

    expect(filtered.map((column) => column.count)).toEqual([1, 0]);
    expect(filtered[0]?.issues[0]?.title).toBe("frontend shell");
  });

  test("clears issue columns when sprint filters do not match the selected sprint", () => {
    const sprint = planningBoard.columns[0]?.cards[0]?.sprint;
    const filtered = filterSprintBoardColumns(
      issueColumns,
      query("", { sprint: ["8"] }),
      sprint,
    );

    expect(filtered.map((column) => column.count)).toEqual([0, 0]);
  });
});

describe("filterKanbanSwimlanes", () => {
  test("filters kanban cards by project query and state alias", () => {
    const sprint = planningBoard.columns[0]?.cards[0]?.sprint;
    const filtered = filterKanbanSwimlanes(
      swimlanes,
      "",
      query("", { project: ["frontend"], is: ["open"] }),
      sprint,
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.projectName).toBe("frontend");
    expect(filtered[0]?.total).toBe(1);
    expect(filtered[0]?.columns[0]?.cards[0]?.title).toBe("frontend shell");
  });

  test("keeps the explicit project scope before applying query filters", () => {
    const sprint = planningBoard.columns[0]?.cards[0]?.sprint;
    const filtered = filterKanbanSwimlanes(
      swimlanes,
      "backend",
      query("", { project: ["frontend"] }),
      sprint,
    );

    expect(filtered).toEqual([]);
  });
});

describe("matchesSprintFilters", () => {
  test("matches sprint filters against title and number", () => {
    const sprint = planningBoard.columns[1]?.cards[0]?.sprint;

    expect(matchesSprintFilters(sprint, ["shell"])).toBe(true);
    expect(matchesSprintFilters(sprint, ["8"])).toBe(true);
    expect(matchesSprintFilters(sprint, ["api"])).toBe(false);
  });
});
