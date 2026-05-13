import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import { loadExtensions } from "./extension-loader";
import { CORE_CODE_BROWSER_ELEMENT, defineCoreCodeBrowser } from "./core-widgets/code-browser";
import { defineCommentThread } from "./core-widgets/comment-thread";
import { defineResourceCard, setActiveCardRegistry } from "./core-widgets/resource-card";
import type { SlotName, ViewerHandle } from "../extension-host-sdk/types";

const REPO_SLOTS: SlotName[] = ["repository.overview", "repository.code", "repository.checks"];

async function boot() {
  applyStoredTheme();
  defineCoreCodeBrowser();
  defineResourceCard();
  defineCommentThread();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const body = document.body;
  const repoId = body.dataset.repoId ?? "";
  const repoName = body.dataset.repoName ?? "";
  const groups = (body.dataset.repoGroups ?? "").split("/").filter((s) => s.length > 0);

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

  const content = buildRepoContent(groups, repoName, repoId);
  renderChrome(ctx, app, content);

  const descriptors = graphql.extensionInstallations.map((e) => ({
    id: e.id,
    manifestUrl: `${serverURL}/_extensions/${e.id}/manifest.json`,
    routePrefix: e.routePrefix,
  }));
  const { registry, cards } = await loadExtensions(
    descriptors, client, graphql.viewer,
    { extensionRuntime: graphql.instance.capabilities.extensionRuntime },
  );
  setActiveCardRegistry(cards);

  // Core defaults are registered AFTER extension loading so that any extension
  // claim on the slot is already present in the extension tier; the registry's
  // winner() resolves the extension tier first and falls back to core defaults
  // only when no extension has claimed the slot.
  registry.registerCoreDefault(
    {
      extensionId: "core",
      element: CORE_CODE_BROWSER_ELEMENT,
      requiredPermission: "code.read",
      priority: 0,
    },
    "repository.code",
  );

  for (const slot of REPO_SLOTS) {
    const mount = document.querySelector<HTMLElement>(`[data-extension-slot-mount="${slot}"]`);
    if (!mount) continue;
    const winner = registry.winner(slot);
    if (!winner) {
      mount.replaceChildren(el("article", { className: "extension-placeholder" }, text(`No extension claims ${slot}`)));
      continue;
    }
    if (!viewerHas(graphql.viewer, winner.requiredPermission)) {
      mount.remove();
      continue;
    }
    const node = document.createElement(winner.element) as HTMLElement & Record<string, unknown>;
    node.comtryaClient = client;
    node.viewer = graphql.viewer;
    node.extensionSlot = slot;
    node.repositoryId = repoId;
    node.repositoryGroups = groups;
    node.repositoryName = repoName;
    mount.replaceChildren(node);
  }
}

function buildRepoContent(groups: string[], repoName: string, repoId: string): HTMLElement {
  const main = el("main", { className: "main" });
  const groupPath = groups.length > 0 ? groups.join("/") + "/" : "";

  main.appendChild(el("section", { className: "pagehead", dataset: { smoke: "repo-dashboard" } },
    el("div", {},
      el("div", { className: "meta-left", textContent: "/r/" + groupPath + repoName }),
      el("h1", { textContent: groupPath + repoName }),
    ),
    el("div", {}),
    el("div", { className: "meta-right" },
      el("span", { textContent: "repoId " + repoId }),
    ),
  ));

  const tabs = el("nav", { className: "repo-tabs", attrs: { "aria-label": "Repository tabs" } },
    el("a", { attrs: { href: "#overview" }, className: "active", textContent: "Overview" }),
    el("a", { attrs: { href: "#code" }, textContent: "Code" }),
    el("a", { attrs: { href: "#checks" }, textContent: "Checks" }),
  );
  main.appendChild(tabs);

  for (const slot of REPO_SLOTS) {
    main.appendChild(el("section", {
      className: "extension-slot-frame",
      attrs: { id: slot.split(".")[1] ?? slot },
      dataset: { smoke: `repo-slot-${slot}` },
    },
      el("div", { className: "extension-slot-mount", dataset: { extensionSlotMount: slot } },
        el("article", { className: "extension-placeholder" }, text(`Loading ${slot}…`)),
      ),
    ));
  }
  return main;
}

function viewerHas(viewer: ViewerHandle, perm: string): boolean {
  return viewer.permissions.includes("instance.admin") || viewer.permissions.includes(perm);
}

boot().catch((e) => console.error("repo dashboard boot failed", e));
