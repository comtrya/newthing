// Pure predicates the Inbox uses to decide what's "live" — open PRs
// and failing required checks. Extracted from Inbox.vue so they can
// be exercised by unit tests without spinning the Vue runtime.
//
// PR states are the canonical `pr-state` variant from
// `extensions/first-party/ext_pull_requests/wit/pull-requests.wit`:
//   draft | ready | review | merged | closed
// "Open" here means non-terminal — the user can still act on the PR.
// `OPEN` / `REOPENED` are *issue* states and must not leak into this
// set (that bug was #6 P0-6).
//
// Check states are the failure-side terminals from the checks
// extension; both `FAILURE` and `FAILED` appear in the wild because
// some providers normalize one way, some the other.

const OPEN_PR_STATES: ReadonlySet<string> = new Set(["DRAFT", "READY", "REVIEW"]);
const FAILED_CHECK_STATES: ReadonlySet<string> = new Set(["FAILURE", "FAILED"]);

export function isOpenPrState(state: string | null | undefined): boolean {
  return OPEN_PR_STATES.has((state ?? "").toUpperCase());
}

export function isFailedCheckState(state: string | null | undefined): boolean {
  return FAILED_CHECK_STATES.has((state ?? "").toUpperCase());
}
