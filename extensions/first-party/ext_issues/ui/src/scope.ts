export function repositoryUri(
  workspaceId?: string | null,
  repositoryId?: string | null,
): string {
  const workspace = presentId(workspaceId);
  const repository = presentId(repositoryId);
  if (workspace && repository) {
    return `comtrya://workspace/${workspace}/repository/${repository}`;
  }
  if (repository) {
    return `comtrya://repository/${repository}`;
  }
  if (workspace) {
    return `comtrya://workspace/${workspace}`;
  }
  return "comtrya://issues";
}

function presentId(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
