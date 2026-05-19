/**
 * Entity-reference hover preview.
 *
 * Iter 40 markdown bodies render bare `#N` references as
 * `<a class="issue-ref" href="/x/issues/<ws>/<n>">#N</a>`. Iter 45
 * stamped the issue title + state onto that link's native browser
 * tooltip on first hover. Iter 49 generalises the same pattern to
 * every link that points at a detail surface — issue, pull, or
 * epic — regardless of where the link was rendered (ActivityStream
 * rows, IssuesList rows, Inbox cards, RepoHome chips). The same
 * delegated `mouseover` listener handles all three URL shapes:
 *
 *   /x/issues/<workspaceId>/<number>  →  ext_issues by-number-issue
 *   /x/pulls/<id>                     →  ext_pull_requests get-pull
 *   /x/epics/<id>                     →  ext_epics by-ref-epic
 *
 * Why shell-side and not per-component? Mounting a Vue composable
 * inside every extension that renders these links would force every
 * extension bundle to pull the fetch path (iter 37's experience with
 * Mermaid). One delegated listener on `document` is enough and pays
 * its cost exactly once per page, no matter how many surfaces
 * eventually emit eligible links.
 *
 * Per-kind in-memory cache keyed by the URL identifier; repeated
 * hovers (or several links to the same entity on the same page)
 * resolve synchronously after the first fetch.
 */

import { invokeOp } from "@comtrya/sdk-core";

interface EntitySummary {
  title?: string | null;
  state?: string | null;
}

interface IssueRef {
  kind: "issue";
  workspaceId: string;
  number: number;
}

interface PullRef {
  kind: "pull";
  id: string;
  number?: number | null;
}

interface EpicRef {
  kind: "epic";
  id: string;
}

type EntityRef = IssueRef | PullRef | EpicRef;

type CacheEntry =
  | { kind: "pending"; promise: Promise<EntitySummary | null> }
  | { kind: "resolved"; value: EntitySummary | null };

const ISSUE_PATTERN = /^\/x\/issues\/([^/]+)\/(\d+)(?:[/?#]|$)/;
// Pulls can be linked workspace-wide (`/x/pulls/<id>`) or repo-scoped
// (`/r/<groups>/<repo>/pulls/<id>`) — the Inbox uses the repo-scoped
// form when it knows the repo path. Cover both.
const PULL_PATTERN = /^\/(?:x\/pulls|r\/[^/]+(?:\/[^/]+)+?\/pulls)\/([^/?#]+)(?:[/?#]|$)/;
// Epics are linked as `/x/epics/<id>` (palette / EpicDetail back-nav)
// or `/x/epics/<workspaceId>/<id>` (EpicsList row links). The ID
// always starts with `epc_`; pick whichever segment matches that
// prefix so both URL shapes resolve to the same epic.
const EPIC_PATTERN = /^\/x\/epics\/(?:[^/]+\/)?(epc_[^/?#]+)(?:[/?#]|$)/;
const SKIP_IDS = new Set(["new"]);
const cache = new Map<string, CacheEntry>();

function parseRef(href: string): EntityRef | null {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    const issueMatch = ISSUE_PATTERN.exec(url.pathname);
    if (issueMatch) {
      const number = Number.parseInt(issueMatch[2] ?? "", 10);
      if (!Number.isFinite(number)) return null;
      return { kind: "issue", workspaceId: issueMatch[1] ?? "", number };
    }
    const pullMatch = PULL_PATTERN.exec(url.pathname);
    if (pullMatch) {
      const id = pullMatch[1] ?? "";
      if (!id || SKIP_IDS.has(id)) return null;
      return { kind: "pull", id };
    }
    const epicMatch = EPIC_PATTERN.exec(url.pathname);
    if (epicMatch) {
      const id = epicMatch[1] ?? "";
      if (!id || SKIP_IDS.has(id)) return null;
      return { kind: "epic", id };
    }
    return null;
  } catch {
    return null;
  }
}

function cacheKey(ref: EntityRef): string {
  switch (ref.kind) {
    case "issue":
      return `issue:${ref.workspaceId}:${ref.number}`;
    case "pull":
      return `pull:${ref.id}`;
    case "epic":
      return `epic:${ref.id}`;
  }
}

async function fetchSummary(ref: EntityRef): Promise<EntitySummary | null> {
  let result;
  switch (ref.kind) {
    case "issue":
      result = await invokeOp<EntitySummary & { number?: number }>(
        "ext_issues",
        "issues",
        "by-number-issue",
        { workspaceId: ref.workspaceId, number: ref.number },
      );
      break;
    case "pull":
      result = await invokeOp<EntitySummary & { number?: number }>(
        "ext_pull_requests",
        "pulls",
        "get-pull",
        ref.id,
      );
      break;
    case "epic":
      result = await invokeOp<EntitySummary>(
        "ext_epics",
        "epics",
        "by-ref-epic",
        `comtrya://epic/${ref.id}`,
      );
      break;
  }
  if (!result.ok) return null;
  return result.value ?? null;
}

function load(ref: EntityRef): Promise<EntitySummary | null> {
  const key = cacheKey(ref);
  const cached = cache.get(key);
  if (cached?.kind === "resolved") return Promise.resolve(cached.value);
  if (cached?.kind === "pending") return cached.promise;
  const promise = fetchSummary(ref)
    .catch(() => null)
    .then((value) => {
      cache.set(key, { kind: "resolved", value });
      return value;
    });
  cache.set(key, { kind: "pending", promise });
  return promise;
}

function refLabel(ref: EntityRef, summary: EntitySummary | null): string {
  switch (ref.kind) {
    case "issue":
      return `#${ref.number}`;
    case "pull": {
      const witNumber = (summary as { number?: number } | null)?.number;
      return typeof witNumber === "number" ? `PR #${witNumber}` : "Pull request";
    }
    case "epic":
      return "Epic";
  }
}

function formatTitle(ref: EntityRef, summary: EntitySummary | null): string {
  const label = refLabel(ref, summary);
  if (!summary) return label;
  const title = (summary.title ?? "").trim();
  const state = (summary.state ?? "").toLowerCase();
  const head = title ? `${label} · ${title}` : label;
  return state ? `${head}\n${state}` : head;
}

/**
 * Install the global listener. Idempotent — calling twice is a no-op
 * (second invocation returns the original unbind).
 */
let installed: (() => void) | null = null;
export function installIssueRefHover(): () => void {
  if (installed) return installed;
  if (typeof document === "undefined") {
    installed = () => {};
    return installed;
  }
  const onMouseOver = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const link = target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.dataset.entityRefLoaded === "true") return;
    const ref = parseRef(link.getAttribute("href") ?? "");
    if (!ref) return;
    link.dataset.entityRefLoaded = "pending";
    const placeholder = refLabel(ref, null);
    if (!link.title || link.title === placeholder) {
      link.title = `${placeholder}\nloading…`;
    }
    void load(ref).then((summary) => {
      link.title = formatTitle(ref, summary);
      link.dataset.entityRefLoaded = "true";
      if (summary?.state) {
        link.dataset.entityState = summary.state.toLowerCase();
      }
    });
  };
  document.addEventListener("mouseover", onMouseOver, { passive: true });
  installed = () => {
    document.removeEventListener("mouseover", onMouseOver);
    installed = null;
  };
  return installed;
}
