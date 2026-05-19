/**
 * Palette commands per issue.
 *
 * The Linear palette pattern: every entity in the active workspace
 * has at least one verb. For issues that's `Open`, plus `Close` /
 * `Reopen` depending on current state. Cmd-K, type `#43`, Enter →
 * navigate. Cmd-K, type "close auth", Enter → close the auth issue.
 * No mouse, no clicks through lists.
 *
 * Implementation: on extension setup we list all issues once and
 * register a command per issue per applicable verb. We then
 * subscribe to the kernel's `dev.comtrya.issues.{opened,closed,
 * reopened}` SSE topics; each event triggers a refetch + diff so
 * commands stay in sync as state changes elsewhere (other tabs,
 * the PR merge reactor, etc.). The set is small (<200 issues in
 * any realistic workspace right now), so a full refetch on each
 * event is fine.
 */

import {
  registerCommand,
  subscribeLiveEvents,
  whenWorkspaceReady,
} from "@comtrya/sdk-core";
import { closeIssue, listIssues, reopenIssue } from "./api";
import {
  issueHref,
  type ComtryaGraphQLClient,
  type Issue,
} from "./types";

interface RegisteredIssue {
  signature: string;
  unregister: () => void;
}

const active = new Map<string, RegisteredIssue>();

/**
 * Build a signature that captures everything we surface in the
 * commands. A change in signature triggers re-registration; an
 * unchanged signature keeps the existing commands intact (no
 * churn on the palette subscriber list).
 */
function issueSignature(issue: Issue): string {
  return [issue.id, issue.number, issue.title, issue.state].join("|");
}

function registerForIssue(issue: Issue, client: ComtryaGraphQLClient): () => void {
  const offs: Array<() => void> = [];

  offs.push(
    registerCommand({
      id: `ext_issues.open.${issue.id}`,
      title: `Open issue #${issue.number} — ${issue.title}`,
      category: "Issues",
      extensionId: "ext_issues",
      run: () => {
        window.location.href = issueHref(issue);
      },
    }),
  );

  if (issue.state === "OPEN" || issue.state === "REOPENED") {
    offs.push(
      registerCommand({
        id: `ext_issues.close.${issue.id}`,
        title: `Close issue #${issue.number} — ${issue.title}`,
        category: "Issues",
        extensionId: "ext_issues",
        run: async () => {
          await closeIssue(client, issue.id);
        },
      }),
    );
  } else if (issue.state === "CLOSED") {
    offs.push(
      registerCommand({
        id: `ext_issues.reopen.${issue.id}`,
        title: `Reopen issue #${issue.number} — ${issue.title}`,
        category: "Issues",
        extensionId: "ext_issues",
        run: async () => {
          await reopenIssue(client, issue.id);
        },
      }),
    );
  }

  return () => offs.forEach((off) => off());
}

async function syncIssueCommands(
  client: ComtryaGraphQLClient,
  workspaceId: string,
): Promise<void> {
  let issues: Issue[];
  try {
    issues = await listIssues(client, { workspaceId });
  } catch (caught) {
    console.warn("[ext_issues] palette sync failed:", caught);
    return;
  }

  const wantedIds = new Set<string>();
  for (const issue of issues) {
    wantedIds.add(issue.id);
    const signature = issueSignature(issue);
    const existing = active.get(issue.id);
    if (existing && existing.signature === signature) continue;
    existing?.unregister();
    active.set(issue.id, {
      signature,
      unregister: registerForIssue(issue, client),
    });
  }

  for (const [id, entry] of active) {
    if (!wantedIds.has(id)) {
      entry.unregister();
      active.delete(id);
    }
  }
}

/**
 * Subscribe to the kernel's issue topics so commands stay fresh as
 * state changes elsewhere. SSE events arrive with `eventType` like
 * `dev.comtrya.issues.opened`; we just re-run the diff on any of
 * them.
 */
export function bindIssueCommands(client: ComtryaGraphQLClient): () => void {
  // Defer binding until the shell publishes a workspace id
  // (`App.vue::loadShellSummary`). Replaces the previous hardcoded
  // ULID; production workspaces don't change mid-session so a single
  // resolution at bind time is enough.
  const unsubscribers: Array<() => void> = [];
  let cancelled = false;

  void whenWorkspaceReady().then((workspaceId) => {
    if (cancelled) return;
    void syncIssueCommands(client, workspaceId);

    for (const type of [
      "dev.comtrya.issues.opened",
      "dev.comtrya.issues.closed",
      "dev.comtrya.issues.reopened",
    ]) {
      unsubscribers.push(
        subscribeLiveEvents({
          type,
          onEvent: () => {
            void syncIssueCommands(client, workspaceId);
          },
          onError: () => {
            // Stream-level errors are best-effort; we'll re-sync on next event.
          },
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
