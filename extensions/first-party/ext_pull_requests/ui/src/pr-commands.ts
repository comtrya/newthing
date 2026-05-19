/**
 * Palette commands per pull request.
 *
 * Same shape as ext_issues' issue-commands: every PR contributes
 * `Open PR #N`, plus state-conditional `Merge PR #N` / `Close PR #N`
 * verbs. Live-synced via `dev.comtrya.pull-request.{created,closed,
 * merged}` SSE topics — the merge reactor (PR merged auto-closes
 * linked issues) is the canonical case where these would otherwise
 * drift.
 */

import {
  registerCommand,
  subscribeLiveEvents,
  whenWorkspaceReady,
} from "@comtrya/sdk-core";
import { closePull, listPulls, mergePull } from "./api";
import { pullHref, type PullRequest } from "./types";

interface RegisteredEntry {
  signature: string;
  unregister: () => void;
}

const active = new Map<string, RegisteredEntry>();

function pullSignature(pull: PullRequest): string {
  return [pull.id, pull.number, pull.title, pull.state].join("|");
}

function registerForPull(pull: PullRequest): () => void {
  const offs: Array<() => void> = [];

  offs.push(
    registerCommand({
      id: `ext_pull_requests.open.${pull.id}`,
      title: `Open PR #${pull.number} — ${pull.title}`,
      category: "Pull requests",
      extensionId: "ext_pull_requests",
      run: () => {
        window.location.href = pullHref(pull);
      },
    }),
  );

  // `Merge` only when the PR is in a mergeable state.
  if (pull.state === "READY" || pull.state === "DRAFT") {
    offs.push(
      registerCommand({
        id: `ext_pull_requests.merge.${pull.id}`,
        title: `Merge PR #${pull.number} — ${pull.title}`,
        category: "Pull requests",
        extensionId: "ext_pull_requests",
        run: async () => {
          await mergePull(pull.id);
        },
      }),
    );
  }

  // `Close` whenever the PR isn't already closed or merged.
  if (pull.state !== "CLOSED" && pull.state !== "MERGED") {
    offs.push(
      registerCommand({
        id: `ext_pull_requests.close.${pull.id}`,
        title: `Close PR #${pull.number} — ${pull.title}`,
        category: "Pull requests",
        extensionId: "ext_pull_requests",
        run: async () => {
          await closePull(pull.id);
        },
      }),
    );
  }

  return () => offs.forEach((off) => off());
}

async function syncPullCommands(workspaceId: string): Promise<void> {
  let pulls: PullRequest[];
  try {
    pulls = await listPulls({ workspaceId });
  } catch (caught) {
    console.warn("[ext_pull_requests] palette sync failed:", caught);
    return;
  }

  const wantedIds = new Set<string>();
  for (const pull of pulls) {
    wantedIds.add(pull.id);
    const signature = pullSignature(pull);
    const existing = active.get(pull.id);
    if (existing && existing.signature === signature) continue;
    existing?.unregister();
    active.set(pull.id, {
      signature,
      unregister: registerForPull(pull),
    });
  }

  for (const [id, entry] of active) {
    if (!wantedIds.has(id)) {
      entry.unregister();
      active.delete(id);
    }
  }
}

export function bindPrCommands(): () => void {
  // Defer binding until the shell publishes a workspace id
  // (`App.vue::loadShellSummary`). This replaces the previous
  // hardcoded ULID; the binding is idempotent on the workspace id, so
  // a single resolution at bind time is enough — the workspace
  // doesn't change mid-session in production.
  const unsubscribers: Array<() => void> = [];
  let cancelled = false;

  void whenWorkspaceReady().then((workspaceId) => {
    if (cancelled) return;
    void syncPullCommands(workspaceId);
    const topics = [
      "dev.comtrya.pull-request.created",
      "dev.comtrya.pull-request.merged",
      "dev.comtrya.pull-request.closed",
    ];
    for (const type of topics) {
      unsubscribers.push(
        subscribeLiveEvents({
          type,
          onEvent: () => {
            void syncPullCommands(workspaceId);
          },
          onError: () => {},
        }),
      );
    }
  });

  return () => {
    cancelled = true;
    for (const off of unsubscribers) off();
    for (const entry of active.values()) entry.unregister();
    active.clear();
  };
}
