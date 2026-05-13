export const workspaceHomeSlots = [
  { name: "workspace.home.top", label: "Focus" },
  { name: "workspace.home.left", label: "Planning" },
  { name: "workspace.home.center", label: "Repositories" },
  { name: "workspace.home.right", label: "Reviews" },
] as const;

export type WorkspaceHomeSlotName = (typeof workspaceHomeSlots)[number]["name"];
