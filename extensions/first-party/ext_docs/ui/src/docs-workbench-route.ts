export type DocsBoardId =
  | "type"
  | "project"
  | "owner"
  | "tag"
  | "status"
  | "scenario"
  | "readiness"
  | "decision"
  | "handoff"
  | "traceability"
  | "implementation";

export interface DocsBoardTab {
  id: DocsBoardId;
  label: string;
  pathSegment: string;
}

export const DOCS_BOARD_TABS: DocsBoardTab[] = [
  { id: "type", label: "Specs", pathSegment: "" },
  { id: "project", label: "Projects", pathSegment: "projects" },
  { id: "owner", label: "Owners", pathSegment: "owners" },
  { id: "tag", label: "Tags", pathSegment: "tags" },
  { id: "status", label: "Status", pathSegment: "status" },
  { id: "scenario", label: "Scenarios", pathSegment: "scenarios" },
  { id: "readiness", label: "Readiness", pathSegment: "readiness" },
  { id: "decision", label: "Review", pathSegment: "review" },
  { id: "handoff", label: "Handoff", pathSegment: "handoff" },
  { id: "traceability", label: "Traceability", pathSegment: "traceability" },
  { id: "implementation", label: "Implementation", pathSegment: "implementation" },
];

const BOARD_ALIASES: Record<string, DocsBoardId> = {
  "": "type",
  bdd: "scenario",
  "bdd-scenarios": "scenario",
  decision: "decision",
  decisions: "decision",
  handoff: "handoff",
  implementation: "implementation",
  owner: "owner",
  owners: "owner",
  prd: "type",
  prds: "type",
  project: "project",
  projects: "project",
  readiness: "readiness",
  review: "decision",
  scenario: "scenario",
  scenarios: "scenario",
  spec: "type",
  specs: "type",
  status: "status",
  tag: "tag",
  tags: "tag",
  traceability: "traceability",
  type: "type",
  types: "type",
};

export function docsBoardFromRouteSubPath(
  routeSubPath: string | null | undefined,
): DocsBoardId {
  const segment = firstRouteSegment(routeSubPath);
  return BOARD_ALIASES[segment] ?? "type";
}

export function docsBoardHref(input: {
  boardId: DocsBoardId;
  pathname: string;
  routeSubPath?: string | null;
  search?: string | null;
}): string {
  const basePath = docsWorkbenchBasePath(input.pathname, input.routeSubPath);
  const segment = pathSegmentForBoard(input.boardId);
  const path = segment ? `${basePath}/${segment}` : basePath;
  const search = input.search && input.search !== "?" ? input.search : "";
  return `${path}${search}`;
}

function pathSegmentForBoard(boardId: DocsBoardId): string {
  return DOCS_BOARD_TABS.find((tab) => tab.id === boardId)?.pathSegment ?? "";
}

function docsWorkbenchBasePath(pathname: string, routeSubPath: string | null | undefined): string {
  const cleanPath = stripTrailingSlashes(pathname || "/");
  const cleanSubPath = stripTrailingSlashes(routeSubPath || "/");
  if (cleanSubPath !== "/" && cleanPath.endsWith(cleanSubPath)) {
    return stripTrailingSlashes(cleanPath.slice(0, -cleanSubPath.length) || "/");
  }
  return cleanPath;
}

function firstRouteSegment(routeSubPath: string | null | undefined): string {
  return (routeSubPath ?? "")
    .split("/")
    .filter(Boolean)[0]
    ?.toLowerCase() ?? "";
}

function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 1 && value.charCodeAt(end - 1) === 0x2f) end -= 1;
  return value.slice(0, end);
}
