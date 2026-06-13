import type { OpResult } from "@comtrya/sdk-core";
import { extSprintsXSprints } from "../../dist/ext_sprints.client";
import type { Sprint, SprintState } from "./types";

interface WitSprint {
  id: string;
  workspace: string;
  title: string;
  number: number;
  state?: string | null;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

function opValue<T>(result: OpResult<unknown>, label: string): T {
  if (result.ok) return result.value as T;
  throw new Error(`${label}: ${result.error.message}`);
}

function sprintState(value?: string | null): SprintState {
  switch (value) {
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

export async function listSprints(workspace: string): Promise<Sprint[]> {
  const result = await extSprintsXSprints.listSprints({
    workspace,
    limit: 1024,
  });
  return opValue<WitSprint[]>(result, "listSprints").map(normalizeSprint);
}
