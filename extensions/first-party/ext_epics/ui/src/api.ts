import type { ComtryaGraphQLClient, Epic, EpicProgress } from "./types";

export const EPIC_BY_REF_QUERY = `query($ref: ResourceURN!) {
  epics.byRef(ref: $ref) {
    id workspaceId title bodyMarkdown state targetDate ownerRef labels createdAt closedAt
  }
}`;

export const EPICS_LIST_QUERY = `query($workspaceId: ID!, $state: String) {
  epics.list(workspaceId: $workspaceId, state: $state) {
    id workspaceId title state targetDate ownerRef labels
  }
}`;

export const EPIC_PROGRESS_QUERY = `query($ref: ResourceURN!) {
  epics.progress(ref: $ref) {
    issuesOpen issuesClosed childEpicsOpen childEpicsClosed percentComplete
  }
}`;

export const EPIC_ISSUES_IN_QUERY = `query($ref: ResourceURN!) {
  epics.issuesIn(ref: $ref)
}`;

export const CREATE_EPIC_MUTATION = `mutation($input: CreateEpicInput!) {
  epics.create(input: $input) { id workspaceId title state }
}`;

export const CHANGE_STATE_MUTATION = `mutation($input: ChangeEpicStateInput!) {
  epics.changeState(input: $input) { id workspaceId title bodyMarkdown state targetDate ownerRef labels createdAt closedAt }
}`;

export async function epicByRef(
  client: ComtryaGraphQLClient,
  ref: string,
): Promise<Epic | null> {
  const data = await client.query<{ epics?: { byRef?: Epic | null } }>(
    EPIC_BY_REF_QUERY,
    { ref },
  );
  return data.epics?.byRef ?? null;
}

export async function listEpics(
  client: ComtryaGraphQLClient,
  variables: { workspaceId: string; state?: string | null },
): Promise<Epic[]> {
  const data = await client.query<{ epics?: { list?: Epic[] } }>(
    EPICS_LIST_QUERY,
    {
      workspaceId: variables.workspaceId,
      state: variables.state ?? null,
    },
  );
  return data.epics?.list ?? [];
}

export async function epicProgress(
  client: ComtryaGraphQLClient,
  ref: string,
): Promise<EpicProgress | null> {
  const data = await client.query<{ epics?: { progress?: EpicProgress | null } }>(
    EPIC_PROGRESS_QUERY,
    { ref },
  );
  return data.epics?.progress ?? null;
}

export async function issuesInEpic(
  client: ComtryaGraphQLClient,
  ref: string,
): Promise<string[]> {
  const data = await client.query<{ epics?: { issuesIn?: string[] } }>(
    EPIC_ISSUES_IN_QUERY,
    { ref },
  );
  return data.epics?.issuesIn ?? [];
}

export async function changeEpicState(
  client: ComtryaGraphQLClient,
  id: string,
  state: string,
): Promise<Epic> {
  const data = await client.mutate<{ epics?: { changeState?: Epic } }>(
    CHANGE_STATE_MUTATION,
    { input: { id, state } },
  );
  if (!data.epics?.changeState) throw new Error("changeEpicState returned no epic");
  return data.epics.changeState;
}

export async function createEpic(
  client: ComtryaGraphQLClient,
  input: {
    workspaceId: string;
    title: string;
    bodyMarkdown?: string | null;
  },
): Promise<Epic> {
  const data = await client.mutate<{ epics?: { create?: Epic } }>(
    CREATE_EPIC_MUTATION,
    { input },
  );
  if (!data.epics?.create) throw new Error("createEpic returned no epic");
  return data.epics.create;
}
