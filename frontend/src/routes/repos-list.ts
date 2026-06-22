export interface RepositoryListRow {
  id: string;
  name?: string | null;
  path: string;
  groups?: string[] | null;
  openPullRequests?: number | null;
}

export function sortRepositories<T extends RepositoryListRow>(repos: readonly T[]): T[] {
  return [...repos].sort((a, b) => a.path.localeCompare(b.path));
}

export function filterRepositories<T extends RepositoryListRow>(
  repos: readonly T[],
  query: string,
): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const sorted = sortRepositories(repos);
  if (terms.length === 0) return sorted;
  return sorted.filter((repo) => {
    const searchable = [
      repo.path,
      repo.name ?? "",
      ...(repo.groups ?? []),
    ].join(" ").toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

export function repositoryCountLabel(total: number, visible: number): string {
  const noun = total === 1 ? "repository" : "repositories";
  if (visible !== total) return `${visible} of ${total} ${noun}`;
  return `${total} ${noun} in this workspace`;
}
