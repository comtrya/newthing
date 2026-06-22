import type {
  KanbanCard,
  KanbanColumn,
  ProjectKanbanSwimlane,
  Sprint,
  SprintBoardColumn,
  SprintBoardIssue,
  SprintPlanningBoard,
  SprintPlanningCard,
} from "./types";

export interface BoardFilterQuery {
  text: string;
  filters: Record<string, string[]>;
}

export function filterKanbanSwimlanesByProject(
  swimlanes: ProjectKanbanSwimlane[],
  projectName: string | null | undefined,
): ProjectKanbanSwimlane[] {
  const project = projectName?.trim();
  if (!project) return swimlanes;

  return swimlanes
    .map((lane) => {
      const columns = lane.columns
        .map((column) => filterKanbanColumn(column, project))
        .filter((column) => column.cards.length > 0);
      const total = columns.reduce((sum, column) => sum + column.cards.length, 0);
      return {
        ...lane,
        label: lane.projectName === project ? lane.label : project,
        projectName: lane.projectName === project ? lane.projectName : project,
        total,
        columns,
      };
    })
    .filter((lane) => lane.total > 0);
}

export function filterSprintPlanningBoard(
  board: SprintPlanningBoard,
  query: BoardFilterQuery,
): SprintPlanningBoard {
  if (!hasBoardQuery(query)) return board;
  const columns = board.columns.map((column) => {
    const cards = column.cards.filter((card) => sprintPlanningCardMatches(card, query));
    return {
      ...column,
      count: cards.length,
      cards,
    };
  });
  return {
    ...board,
    total: columns.reduce((sum, column) => sum + column.cards.length, 0),
    columns,
  };
}

export function filterSprintBoardColumns(
  columns: SprintBoardColumn[],
  query: BoardFilterQuery,
  sprint: Sprint | null | undefined,
): SprintBoardColumn[] {
  if (!hasBoardQuery(query) && matchesSprintFilters(sprint, query.filters.sprint ?? [])) {
    return columns;
  }
  if (!matchesSprintFilters(sprint, query.filters.sprint ?? [])) {
    return columns.map((column) => ({ ...column, count: 0, issues: [] }));
  }
  return columns.map((column) => {
    const issues = column.issues.filter((issue) => sprintIssueMatches(issue, query));
    return {
      ...column,
      count: issues.length,
      issues,
    };
  });
}

export function filterKanbanSwimlanes(
  swimlanes: ProjectKanbanSwimlane[],
  projectName: string | null | undefined,
  query: BoardFilterQuery,
  sprint: Sprint | null | undefined,
): ProjectKanbanSwimlane[] {
  const scoped = filterKanbanSwimlanesByProject(swimlanes, projectName);
  if (!hasBoardQuery(query) && matchesSprintFilters(sprint, query.filters.sprint ?? [])) {
    return scoped;
  }
  if (!matchesSprintFilters(sprint, query.filters.sprint ?? [])) return [];

  return scoped
    .map((lane) => {
      const columns = lane.columns
        .map((column) => {
          const cards = column.cards.filter((card) => kanbanCardMatches(card, query));
          return {
            ...column,
            count: cards.length,
            cards,
          };
        })
        .filter((column) => column.cards.length > 0);
      const filteredProjectName = query.filters.project?.length
        ? visibleProjectName(columns)
        : null;
      return {
        ...lane,
        label: filteredProjectName ?? lane.label,
        projectName: filteredProjectName ?? lane.projectName,
        total: columns.reduce((sum, column) => sum + column.cards.length, 0),
        columns,
      };
    })
    .filter((lane) => lane.total > 0);
}

export function matchesSprintFilters(
  sprint: Sprint | null | undefined,
  filters: string[],
): boolean {
  if (filters.length === 0) return true;
  if (!sprint) return false;
  return matchesAnyQuery(sprintSearchFields(sprint), filters);
}

function filterKanbanColumn(column: KanbanColumn, projectName: string): KanbanColumn {
  const cards = column.cards.filter((card) => card.projectName === projectName);
  return {
    ...column,
    count: cards.length,
    cards,
  };
}

function sprintPlanningCardMatches(
  card: SprintPlanningCard,
  query: BoardFilterQuery,
): boolean {
  const sprint = card.sprint;
  if (!matchesStateQuery(sprint.state, query.filters.is ?? [])) return false;
  if (!matchesSprintFilters(sprint, query.filters.sprint ?? [])) return false;
  if (!matchesText(sprintSearchFields(sprint), query.text)) return false;
  if ((query.filters.issue ?? []).length > 0) return false;
  if ((query.filters.project ?? []).length > 0) return false;
  return true;
}

function sprintIssueMatches(issue: SprintBoardIssue, query: BoardFilterQuery): boolean {
  if (!matchesStateQuery(issue.state, query.filters.is ?? [])) return false;
  if (!matchesAnyQuery(issueSearchFields(issue), query.filters.issue ?? [])) return false;
  if (!matchesText(issueSearchFields(issue), query.text)) return false;
  if ((query.filters.project ?? []).length > 0) return false;
  return true;
}

function kanbanCardMatches(card: KanbanCard, query: BoardFilterQuery): boolean {
  if (!matchesStateQuery(card.state, query.filters.is ?? [])) return false;
  if (!matchesAnyQuery(issueSearchFields(card), query.filters.issue ?? [])) return false;
  if (!matchesAnyQuery([card.projectName], query.filters.project ?? [])) return false;
  if (!matchesText(kanbanCardSearchFields(card), query.text)) return false;
  return true;
}

function visibleProjectName(columns: KanbanColumn[]): string | null {
  const projects = new Set(
    columns
      .flatMap((column) => column.cards.map((card) => card.projectName?.trim()))
      .filter((project): project is string => !!project),
  );
  return projects.size === 1 ? Array.from(projects)[0] ?? null : null;
}

function hasBoardQuery(query: BoardFilterQuery): boolean {
  return (
    query.text.trim().length > 0 ||
    Object.values(query.filters).some((values) => values.length > 0)
  );
}

function matchesStateQuery(state: string, filters: string[]): boolean {
  if (filters.length === 0) return true;
  const normalizedState = normalizeSearchValue(state);
  return filters.some((filter) => {
    const normalized = normalizeSearchValue(filter);
    const expected = STATE_ALIASES[normalized] ?? [normalized];
    return expected.includes(normalizedState) || normalizedState.includes(normalized);
  });
}

function matchesAnyQuery(values: Array<string | number | null | undefined>, filters: string[]): boolean {
  if (filters.length === 0) return true;
  const haystack = values.map(normalizeSearchValue).filter(Boolean);
  return filters.some((filter) =>
    haystack.some((value) => value.includes(normalizeSearchValue(filter))),
  );
}

function matchesText(values: Array<string | number | null | undefined>, text: string): boolean {
  const needle = normalizeSearchValue(text);
  if (!needle) return true;
  return values.map(normalizeSearchValue).join(" ").includes(needle);
}

function sprintSearchFields(sprint: Sprint): Array<string | number | null | undefined> {
  return [
    sprint.id,
    sprint.number,
    `#${sprint.number}`,
    sprint.title,
    sprint.goal,
    sprint.state,
    sprint.startDate,
    sprint.endDate,
  ];
}

function issueSearchFields(
  issue: Pick<SprintBoardIssue, "id" | "issueRef" | "number" | "state" | "title">,
): Array<string | number | null | undefined> {
  return [
    issue.id,
    issue.issueRef,
    issue.number,
    issue.number == null ? null : `#${issue.number}`,
    issue.title,
    issue.state,
  ];
}

function kanbanCardSearchFields(card: KanbanCard): Array<string | number | null | undefined> {
  return [
    ...issueSearchFields(card),
    card.projectName,
    card.projectName ? `project:${card.projectName}` : null,
  ];
}

function normalizeSearchValue(value: string | number | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

const STATE_ALIASES: Record<string, string[]> = {
  active: ["active"],
  planned: ["planned"],
  backlog: ["planned"],
  completed: ["completed", "closed"],
  complete: ["completed", "closed"],
  done: ["completed", "closed"],
  closed: ["closed", "completed"],
  canceled: ["canceled"],
  cancelled: ["canceled"],
  open: ["open", "reopened"],
  todo: ["open", "reopened"],
  reopened: ["reopened"],
  missing: ["missing"],
};
