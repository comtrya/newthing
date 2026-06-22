export interface ProjectFilterParamInput {
  projectFilter?: string | null;
  scopedProjectName?: string | null;
  currentSearch?: string | URLSearchParams | null;
}

export function syncProjectFilterParam(
  params: URLSearchParams,
  input: ProjectFilterParamInput,
): void {
  const projectFilter = present(input.projectFilter);
  if (!projectFilter) {
    params.delete("project");
    return;
  }
  if (shouldWriteProjectFilterParam(projectFilter, input)) {
    params.set("project", projectFilter);
  } else {
    params.delete("project");
  }
}

export function shouldWriteProjectFilterParam(
  projectFilter: string,
  input: Omit<ProjectFilterParamInput, "projectFilter">,
): boolean {
  const scopedProjectName = present(input.scopedProjectName);
  if (!scopedProjectName) return true;
  if (scopedProjectName !== projectFilter) return false;

  const current = paramsFromSearch(input.currentSearch);
  return current.get("project") === projectFilter && !current.has("projectName");
}

function paramsFromSearch(search: string | URLSearchParams | null | undefined): URLSearchParams {
  if (search instanceof URLSearchParams) return new URLSearchParams(search);
  return new URLSearchParams(search ?? "");
}

function present(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
