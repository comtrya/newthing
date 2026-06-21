import type {
  PullMergeCheckSummary,
  PullMergeReadinessCard,
  PullMergeReviewSummary,
} from "./api";

export const READINESS_LANE_KEYS = [
  "draft",
  "blocked-review",
  "blocked-checks",
  "needs-review",
  "waiting-checks",
  "ready",
  "merged",
  "closed",
] as const;

export type ReadinessLaneTone =
  | "blocked"
  | "review"
  | "checks"
  | "ready"
  | "draft"
  | "terminal";

export interface PullReadinessView {
  laneKey: string;
  laneLabel: string;
  tone: ReadinessLaneTone;
  checkLabel: string;
  reviewLabel: string;
  title: string;
}

function plural(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

export function readinessTone(laneKey: string): ReadinessLaneTone {
  switch (laneKey) {
    case "blocked-review":
      return "blocked";
    case "blocked-checks":
      return "blocked";
    case "needs-review":
      return "review";
    case "waiting-checks":
      return "checks";
    case "ready":
      return "ready";
    case "merged":
    case "closed":
      return "terminal";
    case "draft":
    default:
      return "draft";
  }
}

export function checkSummaryLabel(summary?: PullMergeCheckSummary | null): string {
  if (!summary) return "checks unknown";
  const blocking = summary.requiredFailing + summary.requiredMissing;
  if (blocking > 0) return `${plural(blocking, "required check")} blocking`;
  if (summary.pending > 0) return `${plural(summary.pending, "check")} pending`;
  if (summary.optionalFailing > 0) {
    return `${plural(summary.optionalFailing, "optional check")} failing`;
  }
  if (summary.total === 0) return "no checks";
  return `${summary.passing}/${summary.total} checks passing`;
}

export function reviewSummaryLabel(summary: PullMergeReviewSummary): string {
  if (summary.changeRequestCount > 0) {
    return `${plural(summary.changeRequestCount, "change request")}`;
  }
  if (summary.requiredApprovals > summary.approvalCount) {
    return `${summary.approvalCount}/${summary.requiredApprovals} approvals`;
  }
  if (summary.approvalCount > 0) return `${plural(summary.approvalCount, "approval")}`;
  if (summary.commentCount > 0) return `${plural(summary.commentCount, "comment")}`;
  return "no reviews";
}

export function readinessView(
  card: PullMergeReadinessCard,
  laneKey: string,
  laneLabel: string,
): PullReadinessView {
  const checkLabel = checkSummaryLabel(card.checkSummary);
  const reviewLabel = reviewSummaryLabel(card.reviewSummary);
  return {
    laneKey,
    laneLabel,
    tone: readinessTone(laneKey),
    checkLabel,
    reviewLabel,
    title: `${laneLabel}: ${checkLabel}; ${reviewLabel}`,
  };
}
