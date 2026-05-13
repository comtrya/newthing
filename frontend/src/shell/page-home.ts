import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import { loadExtensions } from "./extension-loader";
import { defineResourceCard, setActiveCardRegistry } from "./core-widgets/resource-card";
import type { SlotName, ViewerHandle } from "../extension-host-sdk/types";

const HOME_SLOTS: SlotName[] = ["home.your-work", "home.activity", "home.instance"];

interface RepoSummary {
  id: string;
  name: string;
  path: string;
  groups: string[];
  description: string | null;
  openPullRequests: number | null;
}

async function boot() {
  applyStoredTheme();
  defineResourceCard();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;

  const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
  const client = new HttpComtryaClient(serverURL);

  const graphql = await client.query<{
    viewer: ViewerHandle;
    instance: { id: string; name: string; capabilities: { extensionRuntime: boolean } };
    workspace: { name: string; repositories: RepoSummary[] };
    extensionInstallations: Array<{ id: string; displayName: string; routePrefix: string | null }>;
  }>("{ viewer { authenticated permissions } instance { id name capabilities { extensionRuntime } } workspace { name repositories { id name path groups description openPullRequests } } extensionInstallations { id displayName routePrefix } }");

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

  const content = buildHomeContent(graphql.workspace.repositories);
  renderChrome(ctx, app, content);

  const descriptors = graphql.extensionInstallations.map((e) => ({
    id: e.id,
    manifestUrl: `${serverURL}/_extensions/${e.id}/manifest.json`,
    routePrefix: e.routePrefix,
  }));
  const { registry, cards, failures } = await loadExtensions(
    descriptors, client, graphql.viewer,
    { extensionRuntime: graphql.instance.capabilities.extensionRuntime },
  );
  setActiveCardRegistry(cards);

  for (const slot of HOME_SLOTS) {
    const mount = document.querySelector<HTMLElement>(`[data-extension-slot-mount="${slot}"]`);
    if (!mount) continue;
    const winner = registry.winner(slot);
    if (!winner) {
      mount.replaceChildren(buildPlaceholder(`No extension claims ${slot}`));
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
    mount.replaceChildren(node);
  }

  if (failures.length > 0) console.warn("extension load failures", failures);
}

function buildHomeContent(repositories: RepoSummary[]): HTMLElement {
  const main = el("main", { className: "main" });

  const pagehead = el("section", { className: "pagehead" },
    el("div", {},
      el("div", { className: "meta-left", textContent: "/ · workspace" }),
      el("h1", { textContent: "Home." }),
    ),
    el("div", {}),
    el("div", { className: "meta-right" },
      el("a", {
        attrs: {
          href: "/new",
          "data-smoke": "home-new-repo-cta",
          style: "padding: 8px 14px; font-family: var(--display); font-weight: 600; border: 1px solid currentColor; text-decoration: none; color: inherit;",
        },
        textContent: "+ New repository",
      }),
    ),
  );
  main.appendChild(pagehead);

  const spine = el("div", { className: "col-spine", dataset: { smoke: "home-spine" } },
    slotFrame("home.your-work"),
    buildRepositoriesSection(repositories),
    slotFrame("home.activity"),
  );
  const rail = el("aside", { className: "col-rail" }, slotFrame("home.instance"));
  main.appendChild(el("section", { className: "grid" }, spine, rail));

  return main;
}

function buildRepositoriesSection(repositories: RepoSummary[]): HTMLElement {
  const header = el("header", {
    attrs: { style: "display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px;" },
  },
    el("h2", { attrs: { style: "margin: 0; font-family: var(--display);" }, textContent: "Repositories" }),
    el("a", {
      attrs: {
        href: "/new",
        "data-smoke": "home-repositories-new",
        style: "font-family: var(--mono); font-size: 12px; color: var(--ink-faint); text-decoration: none;",
      },
      textContent: "+ New",
    }),
  );

  const body = repositories.length === 0
    ? el("p", { attrs: { style: "font-family: var(--mono); font-size: 13px; color: var(--ink-faint);" } },
        text("No repositories yet. "),
        el("a", { attrs: { href: "/new" }, textContent: "Create one" }),
        text(" to get started."),
      )
    : buildRepoList(repositories);

  return el("section", {
    className: "core-section",
    dataset: { smoke: "home-repositories" },
  }, header, body);
}

function buildRepoList(repositories: RepoSummary[]): HTMLElement {
  const list = el("ul", { attrs: { style: "list-style: none; padding: 0; margin: 0; display: grid; gap: 8px;" } });
  for (const repo of repositories) {
    const meta = repo.openPullRequests && repo.openPullRequests > 0
      ? `${repo.openPullRequests} open PR${repo.openPullRequests === 1 ? "" : "s"}`
      : "0 open PRs";
    const description = repo.description ?? "";
    list.appendChild(
      el("li", { attrs: { style: "padding: 10px 12px; border: 1px solid var(--ink-rule, #d0cfc8);" } },
        el("a", {
          attrs: { href: `/r/${repo.path}`, style: "font-family: var(--display); font-weight: 600; color: inherit; text-decoration: none;" },
          textContent: repo.path,
        }),
        description
          ? el("p", { attrs: { style: "margin: 6px 0 0; font-family: var(--mono); font-size: 12px; color: var(--ink-faint);" }, textContent: description })
          : null,
        el("p", { attrs: { style: "margin: 6px 0 0; font-family: var(--mono); font-size: 11px; color: var(--ink-faint);" }, textContent: meta }),
      ),
    );
  }
  return list;
}

function slotFrame(slot: SlotName): HTMLElement {
  return el("section", {
    className: "extension-slot-frame",
    dataset: { smoke: `home-slot-${slot}` },
  },
    el("div", { className: "extension-slot-mount", dataset: { extensionSlotMount: slot } },
      buildPlaceholder(`Loading ${slot}…`),
    ),
  );
}

function buildPlaceholder(message: string): HTMLElement {
  return el("article", { className: "extension-placeholder" }, text(message));
}

function viewerHas(viewer: ViewerHandle, perm: string): boolean {
  return viewer.permissions.includes("instance.admin") || viewer.permissions.includes(perm);
}

boot().catch((e) => console.error("homepage boot failed", e));
