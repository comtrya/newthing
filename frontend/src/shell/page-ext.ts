import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import { loadExtensions } from "./extension-loader";
import type { ResolvedRoute, ViewerHandle } from "../extension-host-sdk/types";

async function boot() {
  applyStoredTheme();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const prefix = document.body.dataset.routePrefix ?? "";
  const subPath = document.body.dataset.subPath ?? "/";

  const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
  const client = new HttpComtryaClient(serverURL);
  const graphql = await client.query<{
    viewer: ViewerHandle;
    instance: { capabilities: { extensionRuntime: boolean } };
    workspace: { name: string; repositories: Array<{ id: string }> };
    extensionInstallations: Array<{ id: string; displayName: string; routePrefix: string | null }>;
  }>("{ viewer { authenticated permissions } instance { capabilities { extensionRuntime } } workspace { name repositories { id } } extensionInstallations { id displayName routePrefix } }");

  const ctx: ChromeContext = {
    workspaceName: graphql.workspace.name,
    repositoryCount: graphql.workspace.repositories.length,
    viewerName: "viewer",
    viewerPermissions: graphql.viewer.permissions ?? [],
    readyState: "ready",
    serverURL,
    extensionsWithRoutes: graphql.extensionInstallations
      .filter((e): e is typeof e & { routePrefix: string } => e.routePrefix !== null)
      .map((e) => ({ routePrefix: e.routePrefix, displayName: e.displayName })),
    isOperator: (graphql.viewer.permissions ?? []).includes("instance.admin"),
  };

  const content = el("main", { className: "main" },
    el("div", { className: "extension-slot-mount", dataset: { extensionRouteMount: "true" } }),
  );
  renderChrome(ctx, app, content);

  const descriptors = graphql.extensionInstallations.map((e) => ({
    id: e.id,
    manifestUrl: `${serverURL}/_extensions/${e.id}/manifest.json`,
    routePrefix: e.routePrefix,
  }));
  const { routes } = await loadExtensions(descriptors, client, graphql.viewer, {
    extensionRuntime: graphql.instance.capabilities.extensionRuntime,
  });

  const match = pickRoute(routes, prefix, subPath);
  const mount = document.querySelector<HTMLElement>("[data-extension-route-mount]");
  if (!mount) return;
  if (!match) {
    mount.replaceChildren(el("article", { className: "extension-placeholder" },
      text(`Route ${subPath} not registered under /x/${prefix}/`)));
    return;
  }
  if (!viewerHas(graphql.viewer, match.route.requiredPermission)) {
    mount.replaceChildren(el("article", { className: "extension-placeholder" },
      text(`Insufficient permissions for ${match.route.requiredPermission}`)));
    return;
  }
  const node = document.createElement(match.route.element) as HTMLElement & Record<string, unknown>;
  node.comtryaClient = client;
  node.viewer = graphql.viewer;
  node.routeParams = { scope: "extension", routePrefix: prefix, subPath, params: match.params };
  mount.replaceChildren(node);
}

function pickRoute(routes: ResolvedRoute[], prefix: string, subPath: string): { route: ResolvedRoute; params: Record<string, string> } | undefined {
  for (const route of routes) {
    if (route.routePrefix !== prefix) continue;
    const m = pathMatches(route.path, subPath);
    if (m.matched) return { route, params: m.params };
  }
  return undefined;
}

function pathMatches(pattern: string, actual: string): { matched: boolean; params: Record<string, string> } {
  if (pattern === "/" && (actual === "/" || actual === "")) return { matched: true, params: {} };
  const p = pattern.split("/").filter(Boolean);
  const a = actual.split("/").filter(Boolean);
  if (p.length !== a.length) return { matched: false, params: {} };
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    const pp = p[i]!;
    const aa = a[i]!;
    if (pp.startsWith(":")) params[pp.slice(1)] = aa;
    else if (pp !== aa) return { matched: false, params: {} };
  }
  return { matched: true, params };
}

function viewerHas(viewer: ViewerHandle, perm: string): boolean {
  return viewer.permissions.includes("instance.admin") || viewer.permissions.includes(perm);
}

boot().catch((e) => console.error("extension page boot failed", e));
