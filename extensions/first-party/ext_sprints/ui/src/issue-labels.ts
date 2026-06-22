export interface IssueLabelInput {
  issueRef?: string | null;
  number?: number | null;
  title?: string | null;
}

export function issueNumberLabel(issue: Pick<IssueLabelInput, "number">): string {
  return issue.number == null ? "missing" : `#${issue.number}`;
}

export function issueReferenceLabel(issue: IssueLabelInput): string {
  if (issue.number != null) return `Issue #${issue.number}`;

  const title = issue.title?.trim();
  if (title && !title.startsWith("comtrya://")) return title;

  return "Missing issue";
}

export function internalIssueRefTitle(
  issue: Pick<IssueLabelInput, "issueRef">,
): string | undefined {
  const ref = issue.issueRef?.trim();
  return ref ? `Internal issue ref: ${ref}` : undefined;
}
