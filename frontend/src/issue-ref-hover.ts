/**
 * Issue-reference hover preview.
 *
 * Markdown bodies render bare `#N` references as
 * `<a class="issue-ref" href="/x/issues/<ws>/<n>">#N</a>` (iter 40).
 * On their own those links are clickable but opaque — you don't know
 * what `#42` is until you click through. A single document-level
 * `mouseover` listener bridges that: on first hover of any
 * `a.issue-ref`, fetch the issue's title + state and stamp it onto
 * the element's `title` attribute, so the native browser tooltip
 * answers the question.
 *
 * Why shell-side and not per-component? Mounting a Vue composable
 * inside every extension that renders markdown would force every
 * extension bundle to pull the fetch path (iter 37's experience with
 * Mermaid). One delegated listener on `document` is enough and pays
 * its cost exactly once per page, no matter how many surfaces
 * eventually call `renderMarkdown`.
 *
 * Cache keyed by `<workspaceId>:<number>`; repeated hovers (or
 * multiple links to the same issue on the same page) resolve
 * synchronously after the first fetch.
 */

import { invokeOp } from "@comtrya/sdk-core";

interface IssueSummary {
  title?: string | null;
  state?: string | null;
  closedAt?: string | null;
  createdAt?: string | null;
}

type CacheEntry =
  | { kind: "pending"; promise: Promise<IssueSummary | null> }
  | { kind: "resolved"; value: IssueSummary | null };

const REF_PATTERN = /^\/x\/issues\/([^/]+)\/(\d+)(?:[/?#]|$)/;
const cache = new Map<string, CacheEntry>();

function parseRef(href: string): { workspaceId: string; number: number } | null {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    const match = REF_PATTERN.exec(url.pathname);
    if (!match) return null;
    const number = Number.parseInt(match[2] ?? "", 10);
    if (!Number.isFinite(number)) return null;
    return { workspaceId: match[1] ?? "", number };
  } catch {
    return null;
  }
}

async function fetchSummary(
  workspaceId: string,
  number: number,
): Promise<IssueSummary | null> {
  const result = await invokeOp<IssueSummary>(
    "ext_issues",
    "issues",
    "by-number-issue",
    { workspaceId, number },
  );
  if (!result.ok) return null;
  return result.value ?? null;
}

function load(workspaceId: string, number: number): Promise<IssueSummary | null> {
  const key = `${workspaceId}:${number}`;
  const cached = cache.get(key);
  if (cached?.kind === "resolved") return Promise.resolve(cached.value);
  if (cached?.kind === "pending") return cached.promise;
  const promise = fetchSummary(workspaceId, number)
    .catch(() => null)
    .then((value) => {
      cache.set(key, { kind: "resolved", value });
      return value;
    });
  cache.set(key, { kind: "pending", promise });
  return promise;
}

function formatTitle(number: number, summary: IssueSummary | null): string {
  if (!summary) return `#${number}`;
  const title = (summary.title ?? "").trim();
  const state = (summary.state ?? "").toLowerCase();
  const head = title ? `#${number} · ${title}` : `#${number}`;
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
    const link = target.closest("a.issue-ref");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.dataset.issueRefLoaded === "true") return;
    const ref = parseRef(link.getAttribute("href") ?? "");
    if (!ref) return;
    link.dataset.issueRefLoaded = "pending";
    if (!link.title || link.title === `#${ref.number}`) {
      link.title = `#${ref.number}\nloading…`;
    }
    void load(ref.workspaceId, ref.number).then((summary) => {
      link.title = formatTitle(ref.number, summary);
      link.dataset.issueRefLoaded = "true";
      if (summary?.state) {
        link.dataset.issueState = summary.state.toLowerCase();
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
