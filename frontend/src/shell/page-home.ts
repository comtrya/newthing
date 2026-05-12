import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import { loadExtensions } from "./extension-loader";
import type { SlotName, ViewerHandle } from "../extension-host-sdk/types";

const HOME_SLOTS: SlotName[] = ["home.your-work", "home.repositories", "home.activity", "home.instance"];

async function boot() {
  applyStoredTheme();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;

  const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
  const client = new HttpComtryaClient(serverURL);

  const graphql = await client.query<{
    viewer: ViewerHandle;
    instance: { id: string; name: string; capabilities: { extensionRuntime: boolean } };
    workspace: { name: string; repositories: Array<{ id: string }> };
    extensionInstallations: Array<{ id: string; displayName: string; routePrefix: string | null }>;
  }>("{ viewer { authenticated permissions } instance { id name capabilities { extensionRuntime } } workspace { name repositories { id } } extensionInstallations { id displayName routePrefix } }");

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

  const content = buildHomeContent();
  renderChrome(ctx, app, content);

  const descriptors = graphql.extensionInstallations.map((e) => ({
    id: e.id,
    manifestUrl: `${serverURL}/_extensions/${e.id}/manifest.json`,
    routePrefix: e.routePrefix,
  }));
  const { registry, failures } = await loadExtensions(
    descriptors, client, graphql.viewer,
    { extensionRuntime: graphql.instance.capabilities.extensionRuntime },
  );

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

function buildHomeContent(): HTMLElement {
  const main = el("main", { className: "main" });

  const pagehead = el("section", { className: "pagehead" },
    el("div", {},
      el("div", { className: "meta-left", textContent: "/ · workspace" }),
      el("h1", { textContent: "Home." }),
    ),
    el("div", {}),
    el("div", { className: "meta-right" }),
  );
  main.appendChild(pagehead);

  const spine = el("div", { className: "col-spine", dataset: { smoke: "home-spine" } },
    slotFrame("home.your-work"),
    slotFrame("home.repositories"),
    slotFrame("home.activity"),
  );
  const rail = el("aside", { className: "col-rail" }, slotFrame("home.instance"));
  main.appendChild(el("section", { className: "grid" }, spine, rail));

  return main;
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
