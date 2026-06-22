export type ActionCheckStatus =
  | "blocking"
  | "failed"
  | "running"
  | "queued"
  | "passing"
  | "skipped"
  | "empty";

export type ActionFilter =
  | "all"
  | "blocking"
  | "running"
  | "queued"
  | "passing";

export interface ActionCheckLike {
  state?: string | null;
  required?: boolean | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

const FAILED_STATES = new Set(["FAILURE", "FAILED"]);

export function normalizedCheckState(state: string | null | undefined): string {
  return (state ?? "").trim().toUpperCase();
}

export function isBlockingCheck(check: ActionCheckLike): boolean {
  return check.required === true && FAILED_STATES.has(normalizedCheckState(check.state));
}

export function statusForCheck(check: ActionCheckLike): ActionCheckStatus {
  const state = normalizedCheckState(check.state);
  if (isBlockingCheck(check)) return "blocking";
  if (FAILED_STATES.has(state)) return "failed";
  if (state === "RUNNING") return "running";
  if (state === "PENDING") return "queued";
  if (state === "SUCCESS" || state === "SUCCEEDED") return "passing";
  if (state === "SKIPPED") return "skipped";
  return "queued";
}

export function statusForChecks(checks: ActionCheckLike[]): ActionCheckStatus {
  if (checks.length === 0) return "empty";
  if (checks.some(isBlockingCheck)) return "blocking";
  if (checks.some((check) => FAILED_STATES.has(normalizedCheckState(check.state)))) {
    return "failed";
  }
  if (checks.some((check) => normalizedCheckState(check.state) === "RUNNING")) {
    return "running";
  }
  if (checks.some((check) => normalizedCheckState(check.state) === "PENDING")) {
    return "queued";
  }
  if (checks.every((check) => normalizedCheckState(check.state) === "SKIPPED")) {
    return "skipped";
  }
  return "passing";
}

export function matchesActionFilter(
  status: ActionCheckStatus,
  filter: ActionFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "passing") return status === "passing" || status === "skipped";
  return status === filter;
}

export function checkTimestamp(check: ActionCheckLike): string {
  return check.updatedAt ?? check.createdAt ?? "";
}

export function sortChecksByUpdated<T extends ActionCheckLike>(checks: T[]): T[] {
  return [...checks].sort((a, b) =>
    checkTimestamp(b).localeCompare(checkTimestamp(a)),
  );
}

export function relativeTime(value: string | null | undefined, now = Date.now()): string {
  if (!value) return "";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / week)}w ago`;
}

export function checkStateLabel(state: string | null | undefined): string {
  switch (normalizedCheckState(state)) {
    case "FAILURE":
    case "FAILED":
      return "Failed";
    case "RUNNING":
      return "Running";
    case "PENDING":
      return "Queued";
    case "SUCCESS":
    case "SUCCEEDED":
      return "Passed";
    case "SKIPPED":
      return "Skipped";
    default:
      return "Queued";
  }
}

export function statusLabel(status: ActionCheckStatus): string {
  switch (status) {
    case "blocking":
      return "Blocking";
    case "failed":
      return "Failed";
    case "running":
      return "Running";
    case "queued":
      return "Queued";
    case "passing":
      return "Passing";
    case "skipped":
      return "Skipped";
    case "empty":
      return "No runs";
  }
}
