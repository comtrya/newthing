import type { KanbanColumn, ProjectKanbanSwimlane } from "./types";

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

function filterKanbanColumn(column: KanbanColumn, projectName: string): KanbanColumn {
  const cards = column.cards.filter((card) => card.projectName === projectName);
  return {
    ...column,
    count: cards.length,
    cards,
  };
}
