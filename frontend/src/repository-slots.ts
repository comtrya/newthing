import { registerWidget } from "@comtrya/sdk-core";
import {
  CORE_CODE_BROWSER_ELEMENT,
  defineCoreCodeBrowser,
} from "./core-widgets/code-browser";

const REPOSITORY_SUMMARY_TAG = "comtrya-repository-summary";

/**
 * Core (shell-owned) widgets are registered through the same widget
 * registry every extension uses. They're treated identically — the user
 * can move them, hide them, or override their priority just like an
 * extension widget.
 */
export function registerRepositoryShellSlots(): void {
  defineRepositorySummaryElement();
  defineCoreCodeBrowser();
  registerWidget({
    id: "core:repository-summary",
    extensionId: "core",
    element: REPOSITORY_SUMMARY_TAG,
    defaultSlot: "repository.main",
    defaultPriority: 0,
  });
  // The code browser gets its own slot so the /code route can render
  // it exclusively (no summary, no docs, no sidebar). The overview
  // route renders repository.main (summary + extension widgets).
  registerWidget({
    id: "core:repository-code",
    extensionId: "core",
    element: CORE_CODE_BROWSER_ELEMENT,
    defaultSlot: "repository.code",
    defaultPriority: 0,
  });
}

function defineRepositorySummaryElement(): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(REPOSITORY_SUMMARY_TAG)) return;

  customElements.define(
    REPOSITORY_SUMMARY_TAG,
    class extends HTMLElement {
      repositoryId?: string;
      repositoryName?: string;
      repositoryPath?: string;

      connectedCallback(): void {
        const path = this.repositoryPath ?? "unknown";
        const name = this.repositoryName ?? path.split("/").at(-1) ?? "unknown";
        const id = this.repositoryId ?? path;
        this.replaceChildren(
          line("Repository", name),
          line("Path", path),
          line("Resource", `comtrya://repository/${id}`),
        );
      }
    },
  );
}

function line(label: string, value: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "repo-summary-row";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  row.append(labelNode, valueNode);
  return row;
}
