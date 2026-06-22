export interface CoreNavigationCommand {
  id: string;
  title: string;
  category: "Create" | "Navigation" | "Work";
  path: string;
  shortcut?: string;
}

export const CORE_NAVIGATION_COMMANDS: CoreNavigationCommand[] = [
  {
    id: "core.workspace-home",
    title: "Go to workspace home",
    category: "Navigation",
    path: "/",
    shortcut: "g h",
  },
  {
    id: "core.inbox",
    title: "Open Inbox",
    category: "Navigation",
    path: "/inbox",
    shortcut: "g b",
  },
  {
    id: "core.actions",
    title: "Open Actions",
    category: "Navigation",
    path: "/pipelines",
    shortcut: "g a",
  },
  {
    id: "core.releases",
    title: "Open Releases",
    category: "Navigation",
    path: "/releases",
    shortcut: "g r",
  },
  {
    id: "core.issues",
    title: "Open workspace issues",
    category: "Work",
    path: "/x/issues/",
    shortcut: "g i",
  },
  {
    id: "core.pulls",
    title: "Open workspace pull requests",
    category: "Work",
    path: "/x/pulls/",
    shortcut: "g p",
  },
  {
    id: "core.epics",
    title: "Open workspace Epics",
    category: "Work",
    path: "/x/epics/board",
    shortcut: "g e",
  },
  {
    id: "core.kanban",
    title: "Open Kanban board",
    category: "Work",
    path: "/x/sprints/",
    shortcut: "g s",
  },
  {
    id: "core.specs",
    title: "Open Specs",
    category: "Work",
    path: "/x/docs/",
    shortcut: "g d",
  },
  {
    id: "core.new-repository",
    title: "Create a new repository",
    category: "Create",
    path: "/new",
    shortcut: "g n",
  },
  {
    id: "core.new-issue",
    title: "+ New issue",
    category: "Create",
    path: "/x/issues/new",
  },
  {
    id: "core.new-epic",
    title: "+ New epic",
    category: "Create",
    path: "/x/epics/new",
  },
  {
    id: "core.instance-health",
    title: "Open instance health",
    category: "Navigation",
    path: "/instance",
  },
  {
    id: "core.settings",
    title: "Open settings",
    category: "Navigation",
    path: "/settings",
  },
];
