import type { IconKey } from "./icons";

export interface RailItem {
  id: string;
  to: string;
  icon: IconKey;
  label: string;
  matches: (path: string) => boolean;
}

export const primaryRailItems: RailItem[] = [
  {
    id: "home",
    to: "/",
    icon: "spark",
    label: "Home",
    matches: (p) => p === "/",
  },
  {
    id: "repos",
    to: "/repos",
    icon: "folder",
    label: "Repositories",
    matches: (p) => p.startsWith("/repos") || p.startsWith("/r/") || p === "/new",
  },
  {
    id: "inbox",
    to: "/inbox",
    icon: "inbox",
    label: "Inbox",
    matches: (p) => p.startsWith("/inbox"),
  },
  {
    id: "pipelines",
    to: "/pipelines",
    icon: "bolt",
    label: "Actions",
    matches: (p) => p.startsWith("/pipelines"),
  },
  {
    id: "releases",
    to: "/releases",
    icon: "tag",
    label: "Releases",
    matches: (p) => p.startsWith("/releases"),
  },
];

export const footerRailItems: RailItem[] = [
  {
    id: "admin",
    to: "/admin",
    icon: "lock",
    label: "Site admin",
    matches: (p) => p.startsWith("/admin"),
  },
  {
    id: "account",
    to: "/account/git-tokens",
    icon: "user",
    label: "Account",
    matches: (p) => p.startsWith("/account"),
  },
  {
    id: "settings",
    to: "/settings",
    icon: "settings",
    label: "Settings",
    matches: (p) => p.startsWith("/settings") || p.startsWith("/instance") || p.startsWith("/health"),
  },
];

export function activeRailIdForPath(path: string): string {
  return [...primaryRailItems, ...footerRailItems].find((item) => item.matches(path))?.id ?? "home";
}
