import type { OpResult } from "@comtrya/sdk-core";
import { extSprintsXSprints } from "../../dist/ext_sprints.client";
import type {
  Sprint,
  SprintPlanningBoard,
  SprintPlanningColumn,
  SprintState,
} from "./types";

interface WitSprint {
  id: string;
  workspace: string;
  workspaceId?: string | null;
  title: string;
  number: number;
  state?: string | null;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WitSprintPlanningCard {
  sprint: WitSprint;
}

interface WitSprintPlanningColumn {
  key?: string | null;
  label?: string | null;
  count?: number | null;
  cards?: WitSprintPlanningCard[] | null;
}

interface WitSprintPlanningBoard {
  workspace?: string | null;
  workspaceId?: string | null;
  total?: number | null;
  columns?: WitSprintPlanningColumn[] | null;
}

function opValue<T>(result: OpResult<unknown>, label: string): T {
  if (result.ok) return result.value as T;
  throw new Error(`${label}: ${result.error.message}`);
}

function sprintState(value?: string | null): SprintState {
  switch ((value ?? "").toLowerCase()) {
    case "active":
    case "completed":
    case "canceled":
      return value;
    default:
      return "planned";
  }
}

function normalizeSprint(value: WitSprint): Sprint {
  return {
    id: value.id,
    workspace: value.workspace,
    title: value.title,
    number: value.number,
    state: sprintState(value.state),
    goal: value.goal ?? null,
    startDate: value.startDate ?? null,
    endDate: value.endDate ?? null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function workspaceUri(workspace: string): string {
  const value = workspace.trim();
  if (!value || value.startsWith("comtrya://workspace/")) return value;
  return `comtrya://workspace/${value}`;
}

function normalizePlanningColumn(value: WitSprintPlanningColumn): SprintPlanningColumn {
  const cards = value.cards ?? [];
  return {
    key: value.key ?? "",
    label: value.label ?? value.key ?? "",
    count: value.count ?? cards.length,
    cards: cards.map((card) => ({ sprint: normalizeSprint(card.sprint) })),
  };
}

function normalizePlanningBoard(value: WitSprintPlanningBoard): SprintPlanningBoard {
  const columns = value.columns ?? [];
  return {
    workspace: value.workspace ?? "",
    workspaceId: value.workspaceId ?? null,
    total:
      value.total ??
      columns.reduce(
        (sum, column) => sum + (column.count ?? column.cards?.length ?? 0),
        0,
      ),
    columns: columns.map(normalizePlanningColumn),
  };
}

export async function listSprints(workspace: string): Promise<Sprint[]> {
  const result = await extSprintsXSprints.listSprints({
    workspace: workspaceUri(workspace),
    limit: 1024,
  });
  return opValue<WitSprint[]>(result, "listSprints").map(normalizeSprint);
}

export async function planningBoard(workspace: string): Promise<SprintPlanningBoard> {
  const result = await extSprintsXSprints.planningBoard({
    workspace: workspaceUri(workspace),
    limit: 1024,
  });
  return normalizePlanningBoard(opValue<WitSprintPlanningBoard>(result, "planningBoard"));
}
