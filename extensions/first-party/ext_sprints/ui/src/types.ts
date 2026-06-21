export type SprintState = "planned" | "active" | "completed" | "canceled";
export type SprintIssueState = "open" | "reopened" | "closed" | "missing";
export type LoadState = "idle" | "loading" | "ready" | "empty" | "error";

export interface Sprint {
  id: string;
  workspace: string;
  title: string;
  number: number;
  state: SprintState;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SprintPlanningCard {
  sprint: Sprint;
}

export interface SprintPlanningColumn {
  key: string;
  label: string;
  count: number;
  cards: SprintPlanningCard[];
}

export interface SprintPlanningBoard {
  workspace: string;
  workspaceId?: string | null;
  total: number;
  columns: SprintPlanningColumn[];
}

export interface SprintBoardIssue {
  issueRef: string;
  id?: string | null;
  number?: number | null;
  title: string;
  state: SprintIssueState;
}

export interface SprintBoardColumn {
  key: string;
  label: string;
  count: number;
  issues: SprintBoardIssue[];
}

export interface SprintBoard {
  sprintRef: string;
  total: number;
  columns: SprintBoardColumn[];
}
