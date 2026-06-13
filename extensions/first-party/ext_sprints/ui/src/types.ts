export type SprintState = "planned" | "active" | "completed" | "canceled";
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
