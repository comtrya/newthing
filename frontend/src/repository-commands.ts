/**
 * Repository commands — palette entry per repo in the workspace.
 *
 * Cmd-K, type "dogfood", Enter → navigates to `/r/comtrya/dogfood`.
 * Cmd-K, type "core", Enter → switches to the core repo. Same shape
 * as `project-commands.ts` (Switch to project <name>), but at the
 * workspace boundary instead of the per-repo boundary.
 *
 * Live-synced via `dev.comtrya.repository.{created,imported}` SSE
 * topics (the kernel emits both on `createRepository` mutations).
 * On each event we refetch the workspace repository list and
 * signature-diff against the registered set — identical pattern to
 * the entity command modules in each extension.
 */

import type { Router } from "vue-router";
import { registerCommand, subscribeLiveEvents } from "@comtrya/sdk-core";

interface WorkspaceRepository {
  id?: string;
  name?: string;
  path?: string;
  description?: string | null;
  visibility?: string | null;
  defaultBranch?: string | null;
  openPullRequests?: number | null;
}

interface RegisteredEntry {
  signature: string;
  unregister: () => void;
}

const REPOSITORIES_QUERY = `{ workspace { repositories { id name path description visibility defaultBranch openPullRequests } } }`;

const active = new Map<string, RegisteredEntry>();

function repoSignature(repo: WorkspaceRepository): string {
  return [repo.id ?? "", repo.path ?? "", repo.openPullRequests ?? 0].join("|");
}

function registerForRepo(repo: WorkspaceRepository, router: Router): () => void {
  if (!repo.path || !repo.id) return () => {};
  const path = repo.path;
  return registerCommand({
    id: `core.switch-to-repository.${repo.id}`,
    title: `Switch to repository ${path}`,
    category: "Repositories",
    extensionId: "core",
    run: () => {
      void router.push(`/r/${path}`);
    },
  });
}

async function fetchRepositories(): Promise<WorkspaceRepository[]> {
  try {
    const response = await fetch("/graphql", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: REPOSITORIES_QUERY }),
    });
    const envelope = (await response.json()) as {
      data?: { workspace?: { repositories?: WorkspaceRepository[] } };
    };
    return envelope.data?.workspace?.repositories ?? [];
  } catch (caught) {
    console.warn("[repository-commands] fetch failed:", caught);
    return [];
  }
}

async function syncRepositoryCommands(router: Router): Promise<void> {
  const repos = await fetchRepositories();
  const wantedIds = new Set<string>();
  for (const repo of repos) {
    if (!repo.id) continue;
    wantedIds.add(repo.id);
    const signature = repoSignature(repo);
    const existing = active.get(repo.id);
    if (existing && existing.signature === signature) continue;
    existing?.unregister();
    active.set(repo.id, {
      signature,
      unregister: registerForRepo(repo, router),
    });
  }
  for (const [id, entry] of active) {
    if (!wantedIds.has(id)) {
      entry.unregister();
      active.delete(id);
    }
  }
}

export function bindRepositoryCommands(router: Router): void {
  void syncRepositoryCommands(router);
  for (const type of [
    "dev.comtrya.repository.created",
    "dev.comtrya.repository.imported",
  ]) {
    subscribeLiveEvents({
      type,
      onEvent: () => {
        void syncRepositoryCommands(router);
      },
      onError: () => {},
    });
  }
}
