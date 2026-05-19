/**
 * Palette commands per epic.
 *
 * For each epic in the workspace the palette gains:
 *   `Open epic <title>`                            (always)
 *   `Mark epic <title> in progress`                (when not IN_PROGRESS)
 *   `Mark epic <title> done`                       (when not DONE)
 *   `Mark epic <title> canceled`                   (when not CANCELED)
 *
 * Live-synced via `dev.comtrya.epic.{created,state-changed}` SSE
 * topics — state-changed is emitted from the PR merge reactor and
 * from every UI state-change button, so the palette stays current
 * across tabs.
 */

import {
  registerCommand,
  subscribeLiveEvents,
  whenWorkspaceReady,
} from "@comtrya/sdk-core";
import { changeEpicState, listEpics } from "./api";
import {
  epicHref,
  type ComtryaGraphQLClient,
  type Epic,
  type EpicState,
} from "./types";

interface RegisteredEntry {
  signature: string;
  unregister: () => void;
}

const active = new Map<string, RegisteredEntry>();

function epicSignature(epic: Epic): string {
  return [epic.id, epic.title, epic.state, epic.projectName ?? ""].join("|");
}

const STATE_VERBS: Array<{ state: EpicState; verb: string }> = [
  { state: "IN_PROGRESS", verb: "in progress" },
  { state: "DONE", verb: "done" },
  { state: "CANCELED", verb: "canceled" },
];

function projectSuffix(epic: Epic): string {
  return epic.projectName ? ` (${epic.projectName})` : "";
}

function registerForEpic(epic: Epic, client: ComtryaGraphQLClient): () => void {
  const offs: Array<() => void> = [];
  const titleSuffix = projectSuffix(epic);

  offs.push(
    registerCommand({
      id: `ext_epics.open.${epic.id}`,
      title: `Open epic ${epic.title}${titleSuffix}`,
      category: "Epics",
      extensionId: "ext_epics",
      run: () => {
        window.location.href = epicHref(epic);
      },
    }),
  );

  for (const { state, verb } of STATE_VERBS) {
    if (epic.state === state) continue;
    offs.push(
      registerCommand({
        id: `ext_epics.mark.${state.toLowerCase()}.${epic.id}`,
        title: `Mark epic ${epic.title} ${verb}${titleSuffix}`,
        category: "Epics",
        extensionId: "ext_epics",
        run: async () => {
          await changeEpicState(client, epic.id, state);
        },
      }),
    );
  }

  return () => offs.forEach((off) => off());
}

async function syncEpicCommands(
  client: ComtryaGraphQLClient,
  workspaceId: string,
): Promise<void> {
  let epics: Epic[];
  try {
    epics = await listEpics(client, { workspaceId });
  } catch (caught) {
    console.warn("[ext_epics] palette sync failed:", caught);
    return;
  }

  const wantedIds = new Set<string>();
  for (const epic of epics) {
    wantedIds.add(epic.id);
    const signature = epicSignature(epic);
    const existing = active.get(epic.id);
    if (existing && existing.signature === signature) continue;
    existing?.unregister();
    active.set(epic.id, {
      signature,
      unregister: registerForEpic(epic, client),
    });
  }

  for (const [id, entry] of active) {
    if (!wantedIds.has(id)) {
      entry.unregister();
      active.delete(id);
    }
  }
}

export function bindEpicCommands(client: ComtryaGraphQLClient): () => void {
  // Defer binding until the shell publishes a workspace id
  // (`App.vue::loadShellSummary`). Replaces the previous hardcoded
  // ULID; production workspaces don't change mid-session.
  const unsubscribers: Array<() => void> = [];
  let cancelled = false;

  void whenWorkspaceReady().then((workspaceId) => {
    if (cancelled) return;
    void syncEpicCommands(client, workspaceId);
    for (const type of [
      "dev.comtrya.epic.created",
      "dev.comtrya.epic.state-changed",
    ]) {
      unsubscribers.push(
        subscribeLiveEvents({
          type,
          onEvent: () => {
            void syncEpicCommands(client, workspaceId);
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
