export const repositoryHomeSlots = [
  { name: "repository.overview", label: "Overview" },
  { name: "repository.code", label: "Code" },
  { name: "repository.issues", label: "Issues" },
  { name: "repository.checks", label: "Checks" },
] as const;

export type RepositoryHomeSlotName = (typeof repositoryHomeSlots)[number]["name"];
