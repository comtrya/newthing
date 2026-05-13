import { HttpComtryaClient } from "../client";
import { el, text } from "./dom";
import { applyStoredTheme } from "./theme";
import { renderChrome, type ChromeContext } from "./chrome";
import type { ViewerHandle } from "../extension-host-sdk/types";

async function boot() {
  applyStoredTheme();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;

  const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
  const client = new HttpComtryaClient(serverURL);
  const graphql = await client.query<{
    viewer: ViewerHandle;
    workspace: { name: string; repositories: Array<{ id: string }> };
    extensionInstallations: Array<{ id: string; displayName: string; routePrefix: string | null }>;
  }>("{ viewer { authenticated permissions } workspace { name repositories { id } } extensionInstallations { id displayName routePrefix } }");

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

  renderChrome(ctx, app, buildContent(serverURL));
}

function buildContent(serverURL: string): HTMLElement {
  const main = el("main", { className: "main" });

  main.appendChild(el("section", { className: "pagehead", dataset: { smoke: "new-repo-header" } },
    el("div", {},
      el("div", { className: "meta-left", textContent: "/new · workspace" }),
      el("h1", { textContent: "New repository." }),
    ),
    el("div", {}),
    el("div", { className: "meta-right" },
      el("span", { textContent: "Groups don't need to exist first; paths nest infinitely." }),
    ),
  ));

  const errorBox = el("p", {
    className: "new-repo-error",
    attrs: { role: "alert", style: "color: var(--ink-warn, #f04a1e); font-family: var(--mono); display: none;" },
  });

  const inputStyle = "width: 100%; padding: 12px 14px; font-family: var(--mono); font-size: 14px; border: 1px solid var(--ink-rule, #d0cfc8); background: var(--bg, #fff); color: var(--ink, #0a0a0a);";
  const labelStyle = "display: grid; gap: 6px; font-family: var(--mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint);";
  const hintStyle = "text-transform: none; letter-spacing: 0; color: var(--ink-faint); font-size: 11px;";

  const pathInput = el("input", {
    type: "text",
    attrs: {
      name: "path",
      autocomplete: "off",
      spellcheck: "false",
      required: "",
      placeholder: "rawkode/hello/rawkode",
      style: inputStyle,
    },
  }) as HTMLInputElement;

  const cloneInput = el("input", {
    type: "url",
    attrs: {
      name: "cloneFromUrl",
      autocomplete: "off",
      spellcheck: "false",
      placeholder: "https://github.com/owner/repo.git (optional)",
      style: inputStyle,
    },
  }) as HTMLInputElement;

  const submitBtn = el("button", {
    attrs: { type: "submit", style: "padding: 10px 18px; font-family: var(--display); font-weight: 600; cursor: pointer;" },
    textContent: "Create repository",
  }) as HTMLButtonElement;

  cloneInput.addEventListener("input", () => {
    submitBtn.textContent = cloneInput.value.trim() ? "Import repository" : "Create repository";
  });

  const form = el("form", {
    attrs: { style: "display: grid; gap: 18px; max-width: 560px;" },
  },
    el("label", { attrs: { style: labelStyle } },
      el("span", { textContent: "Path" }),
      pathInput,
      el("span", {
        attrs: { style: hintStyle },
        textContent: "Slash-separated. Each segment: lowercase a–z, 0–9, dash, underscore, dot.",
      }),
    ),
    el("label", { attrs: { style: labelStyle } },
      el("span", { textContent: "Import from URL" }),
      cloneInput,
      el("span", {
        attrs: { style: hintStyle },
        textContent: "Optional. Accepts http://, https://, git://, file://. Leave blank to start an empty repo.",
      }),
    ),
    errorBox,
    el("div", { attrs: { style: "display: flex; gap: 12px; align-items: center;" } },
      submitBtn,
      el("a", { attrs: { href: "/", style: "color: var(--ink-faint); font-family: var(--mono); font-size: 12px;" }, textContent: "Cancel" }),
    ),
  ) as HTMLFormElement;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submit(serverURL, pathInput, cloneInput, submitBtn, errorBox);
  });

  main.appendChild(el("section", { attrs: { style: "padding: 32px 0; max-width: 720px;" } }, form));
  return main;
}

async function submit(
  serverURL: string,
  pathInput: HTMLInputElement,
  cloneInput: HTMLInputElement,
  submitBtn: HTMLButtonElement,
  errorBox: HTMLElement,
): Promise<void> {
  const path = pathInput.value.trim();
  if (!path) {
    showError(errorBox, "path is required");
    return;
  }
  const cloneFromUrl = cloneInput.value.trim();
  const isImport = cloneFromUrl.length > 0;
  const originalLabel = isImport ? "Import repository" : "Create repository";
  submitBtn.disabled = true;
  submitBtn.textContent = isImport ? "Importing…" : "Creating…";
  errorBox.style.display = "none";

  try {
    const input: Record<string, string> = { path };
    if (isImport) input.cloneFromUrl = cloneFromUrl;
    const response = await fetch(new URL("/graphql", serverURL), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: "mutation($input: CreateRepositoryInput!) { createRepository(input: $input) { repository { id path } } }",
        variables: { input },
      }),
    });
    const body = await response.json();
    if (!response.ok || body.errors) {
      const message = body.errors?.[0]?.message ?? `request failed (${response.status})`;
      throw new Error(message);
    }
    const createdPath = body?.data?.createRepository?.repository?.path ?? path;
    window.location.assign(`/r/${createdPath}`);
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
    showError(errorBox, err instanceof Error ? err.message : String(err));
  }
}

function showError(errorBox: HTMLElement, message: string): void {
  errorBox.replaceChildren(text(message));
  errorBox.style.display = "block";
}

boot().catch((e) => console.error("new-repo boot failed", e));
