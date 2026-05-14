import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import ExtensionRoute from "./routes/ExtensionRoute.vue";
import InstanceHealth from "./routes/InstanceHealth.vue";
import NewRepository from "./routes/NewRepository.vue";
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
  // Permanent redirect: /r/<repo>/issues* used to live in the shell.
  // The issues extension now owns /x/issues/... entirely.
  {
    path: "/r/:groups+/:repo/issues/:rest(.*)*",
    redirect: () => ({ path: "/x/issues" }),
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
