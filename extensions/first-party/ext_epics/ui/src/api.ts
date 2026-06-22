import type { OpResult } from "@comtrya/sdk-core";
import { extEpicsXEpics } from "../../dist/ext_epics.client";
import type {
  ComtryaGraphQLClient,
  Epic,
  EpicProgress,
  EpicState,
  Relation,
} from "./types";

export const EPIC_OUTGOING_RELATIONS_QUERY = `query($from: ResourceURN!, $kind: ResourceURN) {
  relations.outgoing(from: $from, kind: $kind) { id kind from to source target }
}`;

export const CREATE_RELATION_MUTATION = `mutation($input: RelationCreateInput!) {
  relations.create(input: $input) { id kind from to source target }
}`;

export const DELETE_RELATION_MUTATION = `mutation($input: RelationDeleteInput!) {
  relations.delete(input: $input)
}`;

interface WitEpic {
  id: string;
  workspace?: string | null;
  workspaceId?: string | null;
  number?: number | null;
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

export type EpicBoardId =
  | "roadmap"
  | "project"
  | "owner"
  | "priority"
  | "milestone"
  | "label"
  | "target";

interface WitEpicBoardCard {
  epic: WitEpic;
  progress?: EpicProgress | null;
  ownerRef?: string | null;
  projectName?: string | null;
  priority?: string | null;
  priorityLabel?: string | null;
  milestone?: string | null;
  milestoneLabel?: string | null;
}

interface WitEpicBoardColumn {
  key: string;
  label: string;
  count: number;
  cards?: WitEpicBoardCard[] | null;
  ownerRef?: string | null;
  projectName?: string | null;
  priority?: string | null;
  milestone?: string | null;
}

interface WitEpicBoard {
  workspace?: string | null;
  total?: number | null;
  today?: string | null;
  columns?: WitEpicBoardColumn[] | null;
}

export interface EpicBoardCard {
  epic: Epic;
  progress: EpicProgress | null;
  ownerRef?: string | null;
  projectName?: string | null;
  priority?: string | null;
  priorityLabel?: string | null;
  milestone?: string | null;
  milestoneLabel?: string | null;
}

export interface EpicBoardColumn {
  key: string;
  label: string;
  count: number;
  ownerRef?: string | null;
  projectName?: string | null;
  priority?: string | null;
  milestone?: string | null;
  cards: EpicBoardCard[];
}

export interface EpicBoard {
  workspace: string;
  total: number;
  today: string | null;
  columns: EpicBoardColumn[];
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
    number: value.number ?? null,
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

function normalizeEpicBoard(value: WitEpicBoard): EpicBoard {
  return {
    workspace: value.workspace ?? "",
    total: value.total ?? 0,
    today: value.today ?? null,
    columns: (value.columns ?? []).map((column) => ({
      key: column.key,
      label: column.label,
      count: column.count,
      ownerRef: column.ownerRef ?? null,
      projectName: column.projectName ?? null,
      priority: column.priority ?? null,
      milestone: column.milestone ?? null,
      cards: (column.cards ?? []).map((card) => ({
        epic: normalizeEpic(card.epic),
        progress: card.progress ?? null,
        ownerRef: card.ownerRef ?? null,
        projectName: card.projectName ?? null,
        priority: card.priority ?? null,
        priorityLabel: card.priorityLabel ?? null,
        milestone: card.milestone ?? null,
        milestoneLabel: card.milestoneLabel ?? null,
      })),
    })),
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

export async function loadEpicBoard(
  board: EpicBoardId,
  variables: { workspaceId: string; limit?: number },
): Promise<EpicBoard> {
  const input = {
    workspace: workspaceUri(variables.workspaceId),
    limit: variables.limit ?? 128,
  };
  const result = await epicBoardOp(board)(input);
  return normalizeEpicBoard(opValue<WitEpicBoard>(result, `${board}Board`));
}

function epicBoardOp(
  board: EpicBoardId,
): (input: unknown) => Promise<OpResult<unknown>> {
  switch (board) {
    case "roadmap":
      return extEpicsXEpics.roadmapBoard;
    case "project":
      return extEpicsXEpics.projectBoard;
    case "owner":
      return extEpicsXEpics.ownerBoard;
    case "priority":
      return extEpicsXEpics.priorityBoard;
    case "milestone":
      return extEpicsXEpics.milestoneBoard;
    case "label":
      return extEpicsXEpics.labelBoard;
    case "target":
      return extEpicsXEpics.targetBoard;
  }
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

export async function outgoingRelations(
  client: ComtryaGraphQLClient,
  from: string,
  kind?: string | null,
): Promise<Relation[]> {
  const data = await client.query<{ relations?: { outgoing?: Relation[] } }>(
    EPIC_OUTGOING_RELATIONS_QUERY,
    kind ? { from, kind } : { from },
  );
  return (data.relations?.outgoing ?? []).map(normalizeRelation);
}

export async function createRelation(
  client: ComtryaGraphQLClient,
  input: { from: string; to: string; kind: string },
): Promise<Relation> {
  const data = await client.mutate<{ relations?: { create?: Relation } }>(
    CREATE_RELATION_MUTATION,
    { input },
  );
  const relation = data.relations?.create;
  if (!relation) throw new Error("relations.create returned no relation");
  return normalizeRelation(relation);
}

export async function deleteRelation(
  client: ComtryaGraphQLClient,
  id: string,
): Promise<boolean> {
  const data = await client.mutate<{ relations?: { delete?: boolean } }>(
    DELETE_RELATION_MUTATION,
    { input: { id } },
  );
  return data.relations?.delete ?? false;
}

function normalizeRelation(relation: Relation): Relation {
  const from = relation.from ?? relation.source ?? "";
  const to = relation.to ?? relation.target ?? "";
  return {
    ...relation,
    from,
    to,
    source: relation.source ?? from,
    target: relation.target ?? to,
  };
}
