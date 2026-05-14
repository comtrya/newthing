import type {
  ActivityEvent,
  ComtryaGraphQLClient,
  RepositoryItem,
  WorkItem,
} from "./types";

export const YOUR_WORK_QUERY = `{
  viewer {
    reviewQueue { aggregated items }
    authoredPulls { aggregated items }
    failingChecks { aggregated items }
  }
}`;

export const REPOSITORIES_QUERY = `{
  workspace { repositories { id name groups openPullRequests checkSummary { passed total } lastCommitAt } }
}`;

export const ACTIVITY_QUERY = `{ workspace { events } }`;

export interface YourWorkData {
  reviewQueue: WorkItem[];
  authoredPulls: WorkItem[];
  failingChecks: WorkItem[];
}

export async function loadYourWork(
  client: ComtryaGraphQLClient,
): Promise<YourWorkData> {
  const data = await client.query<{
    viewer?: {
      reviewQueue?: { items?: WorkItem[] };
      authoredPulls?: { items?: WorkItem[] };
      failingChecks?: { items?: WorkItem[] };
    };
  }>(YOUR_WORK_QUERY);
  return {
    reviewQueue: data.viewer?.reviewQueue?.items ?? [],
    authoredPulls: data.viewer?.authoredPulls?.items ?? [],
    failingChecks: data.viewer?.failingChecks?.items ?? [],
  };
}

export async function loadRepositories(
  client: ComtryaGraphQLClient,
): Promise<RepositoryItem[]> {
  const data = await client.query<{
    workspace?: { repositories?: RepositoryItem[] };
  }>(REPOSITORIES_QUERY);
  return data.workspace?.repositories ?? [];
}

export async function loadActivity(
  client: ComtryaGraphQLClient,
): Promise<ActivityEvent[]> {
  const data = await client.query<{
    workspace?: { events?: ActivityEvent[] };
  }>(ACTIVITY_QUERY);
  return data.workspace?.events ?? [];
}
