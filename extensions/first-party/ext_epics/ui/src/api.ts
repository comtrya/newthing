import type { OpResult } from "@comtrya/sdk-core";
import { extEpicsXEpics } from "../../dist/ext_epics.client";
import type { ComtryaGraphQLClient, Epic, EpicProgress, EpicState } from "./types";

interface WitEpic {
  id: string;
  workspace?: string | null;
  workspaceId?: string | null;
  title: string;
  bodyMarkdown?: string | null;
  state?: string | null;
  targetDate?: string | null;
  ownerRef?: string | null;
  labels?: string[] | null;
  createdAt?: string | null;
  closedAt?: string | null;
  projectName?: string | null;
}

function opValue<T>(result: OpResult<unknown>, label: string): T {
  if (result.ok) return result.value as T;
  throw new Error(`${label}: ${result.error.message}`);
}

function workspaceUri(workspaceId: string): string {
  return `comtrya://workspace/${workspaceId}`;
}

function epicState(value?: string | null): EpicState {
  switch (value) {
    case "IN_PROGRESS":
    case "AT_RISK":
    case "DONE":
    case "CANCELED":
      return value;
    default:
      return "PLANNED";
  }
}

function normalizeEpic(value: WitEpic): Epic {
  return {
    id: value.id,
    workspaceId:
      value.workspaceId ??
      value.workspace?.replace(/^comtrya:\/\/workspace\//, "") ??
      "",
    title: value.title,
    bodyMarkdown: value.bodyMarkdown ?? "",
    state: epicState(value.state),
    targetDate: value.targetDate ?? null,
    ownerRef: value.ownerRef ?? null,
    labels: value.labels ?? [],
    createdAt: value.createdAt ?? null,
    closedAt: value.closedAt ?? null,
    projectName: value.projectName ?? null,
  };
}

export async function epicByRef(
  _client: ComtryaGraphQLClient,
  ref: string,
): Promise<Epic | null> {
  const result = await extEpicsXEpics.byRefEpic(ref);
  const epic = opValue<WitEpic | null>(result, "epicByRef");
  return epic ? normalizeEpic(epic) : null;
}

export async function listEpics(
  _client: ComtryaGraphQLClient,
  variables: { workspaceId: string; state?: string | null },
): Promise<Epic[]> {
  const result = await extEpicsXEpics.listEpics({
    workspace: workspaceUri(variables.workspaceId),
    limit: 1024,
  });
  const epics = opValue<WitEpic[]>(result, "listEpics").map(normalizeEpic);
  const state = variables.state ? epicState(variables.state) : null;
  return state ? epics.filter((epic) => epic.state === state) : epics;
}

export async function epicProgress(
  _client: ComtryaGraphQLClient,
  ref: string,
): Promise<EpicProgress | null> {
  const result = await extEpicsXEpics.progressEpic(ref);
  return opValue<EpicProgress | null>(result, "epicProgress");
}

export async function issuesInEpic(
  _client: ComtryaGraphQLClient,
  ref: string,
  limit: number = 1024,
): Promise<string[]> {
  const result = await extEpicsXEpics.issuesInEpic({ ref, limit });
  return opValue<string[]>(result, "issuesInEpic");
}

export async function changeEpicState(
  _client: ComtryaGraphQLClient,
  id: string,
  state: string,
): Promise<Epic> {
  const result = await extEpicsXEpics.changeStateEpic({ id, state });
  return normalizeEpic(opValue<WitEpic>(result, "changeEpicState"));
}

export async function createEpic(
  _client: ComtryaGraphQLClient | undefined,
  input: {
    workspaceId: string;
    title: string;
    bodyMarkdown?: string | null;
    projectName?: string | null;
  },
): Promise<Epic> {
  const result = await extEpicsXEpics.createEpic({
    workspace: workspaceUri(input.workspaceId),
    title: input.title,
    bodyMarkdown: input.bodyMarkdown ?? "",
    ownerRef: null,
    targetDate: null,
    labels: [],
    parentEpicRef: null,
    projectName: input.projectName ?? null,
  });
  return normalizeEpic(opValue<WitEpic>(result, "createEpic"));
}

/**
 * Retroactively assign (or clear) the Project this epic belongs
 * to. Routes through the iter 69 `assign-project` op (mirror of
 * iter 67's issues version). The kernel emits
 * `dev.comtrya.epic.project-changed` so workspace per-project
 * counts (iter 65) update live.
 */
export async function assignEpicProject(
  id: string,
  projectName: string | null,
): Promise<Epic> {
  const result = await extEpicsXEpics.assignProject({
    id,
    projectName: projectName ?? null,
  });
  return normalizeEpic(opValue<WitEpic>(result, "assignProject"));
}
