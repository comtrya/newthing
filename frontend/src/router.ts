import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import AdminAccess from "./routes/AdminAccess.vue";
import AdminOverview from "./routes/AdminOverview.vue";
import AdminStorage from "./routes/AdminStorage.vue";
import ExtensionRoute from "./routes/ExtensionRoute.vue";
import Inbox from "./routes/Inbox.vue";
import InstanceHealth from "./routes/InstanceHealth.vue";
import NewRepository from "./routes/NewRepository.vue";
import Pipelines from "./routes/Pipelines.vue";
import ProjectHome from "./routes/ProjectHome.vue";
import Releases from "./routes/Releases.vue";
import RepoHome from "./routes/RepoHome.vue";
import WorkspaceHome from "./routes/WorkspaceHome.vue";
import { shellRoutePaths } from "./route-paths";

export const shellRoutes: RouteRecordRaw[] = [
  {
    path: shellRoutePaths.workspaceHome,
    name: "workspace-home",
    component: WorkspaceHome,
  },
  {
    path: shellRoutePaths.inbox,
    name: "inbox",
    component: Inbox,
  },
  {
    path: shellRoutePaths.newRepository,
    name: "new-repository",
    component: NewRepository,
  },
  {
    path: shellRoutePaths.instanceAdmin,
    name: "instance-admin",
    component: InstanceHealth,
    props: { mode: "instance" },
  },
  {
    path: shellRoutePaths.settings,
    name: "settings",
    component: InstanceHealth,
    props: { mode: "settings" },
  },
  {
    path: shellRoutePaths.health,
    name: "health",
    component: InstanceHealth,
    props: { mode: "health" },
  },
  {
    path: shellRoutePaths.pipelines,
    name: "pipelines",
    component: Pipelines,
  },
  {
    path: shellRoutePaths.releases,
    name: "releases",
    component: Releases,
  },
  {
    path: shellRoutePaths.adminOverview,
    name: "admin-overview",
    component: AdminOverview,
  },
  {
    path: shellRoutePaths.adminAccess,
    name: "admin-access",
    component: AdminAccess,
  },
  {
    path: shellRoutePaths.adminStorage,
    name: "admin-storage",
    component: AdminStorage,
  },
  {
    // The project route is more specific than repoHome and must
    // appear FIRST so vue-router matches it before the catch-all
    // `/r/:groups+/:repo` pattern.
    path: shellRoutePaths.projectHome,
    name: "project-home",
    component: ProjectHome,
    props: projectRouteProps,
  },
  // Per-repo workbench surfaces. Each renders RepoHome with a
  // different `view`, so the persistent repo header / tabs stay
  // mounted across intra-repo navigation. The repo's
  // `?repositoryId=…` carried in the query lets the extension
  // element scope itself to this repo without changing how it
  // reads URL params on the canonical `/x/<ext>/` route.
  {
    path: shellRoutePaths.repoCode,
    name: "repo-code",
    component: RepoHome,
    props: (route: RouteLocationNormalizedLoaded) => ({
      ...repoRouteProps(route),
      view: "code",
    }),
  },
  {
    path: shellRoutePaths.repoConfig,
    name: "repo-config",
    component: RepoHome,
    props: (route: RouteLocationNormalizedLoaded) => ({
      ...repoRouteProps(route),
      view: "config",
    }),
  },
  {
    path: shellRoutePaths.repoPulls,
    name: "repo-pulls",
    component: RepoHome,
    props: (route: RouteLocationNormalizedLoaded) => ({
      ...repoRouteProps(route),
      view: "pulls",
      embeddedSubPath: paramSegments(route.params.rest),
    }),
  },
  {
    path: shellRoutePaths.repoIssues,
    name: "repo-issues",
    component: RepoHome,
    props: (route: RouteLocationNormalizedLoaded) => ({
      ...repoRouteProps(route),
      view: "issues",
      embeddedSubPath: paramSegments(route.params.rest),
    }),
  },
  {
    path: shellRoutePaths.repoChecks,
    name: "repo-checks",
    component: RepoHome,
    props: (route: RouteLocationNormalizedLoaded) => ({
      ...repoRouteProps(route),
      view: "checks",
      embeddedSubPath: paramSegments(route.params.rest),
    }),
  },
  {
    path: shellRoutePaths.repoEpics,
    name: "repo-epics",
    component: RepoHome,
    props: (route: RouteLocationNormalizedLoaded) => ({
      ...repoRouteProps(route),
      view: "epics",
      embeddedSubPath: paramSegments(route.params.rest),
    }),
  },
  {
    path: shellRoutePaths.repoHome,
    name: "repo-home",
    component: RepoHome,
    props: repoRouteProps,
  },
  {
    path: shellRoutePaths.extensionRoute,
    name: "extension-route",
    component: ExtensionRoute,
    props: extensionRouteProps,
  },
];

export function createShellRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: shellRoutes,
  });
}

function repoRouteProps(route: RouteLocationNormalizedLoaded) {
  return {
    groups: paramSegments(route.params.groups),
    repo: paramValue(route.params.repo),
  };
}

function projectRouteProps(route: RouteLocationNormalizedLoaded) {
  return {
    groups: paramSegments(route.params.groups),
    repo: paramValue(route.params.repo),
    project: paramValue(route.params.project),
  };
}

function extensionRouteProps(route: RouteLocationNormalizedLoaded) {
  return {
    prefix: paramValue(route.params.prefix),
    rest: paramSegments(route.params.rest),
  };
}

function paramSegments(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function paramValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}
