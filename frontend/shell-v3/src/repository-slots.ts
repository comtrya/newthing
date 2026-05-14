import { registerSlot } from "@comtrya/sdk-core";

const REPOSITORY_SUMMARY_TAG = "comtrya-repository-summary";

export const repositoryHomeSlots = [
  { name: "repository.overview", label: "Overview" },
  { name: "repository.code", label: "Code" },
  { name: "repository.issues", label: "Issues" },
  { name: "repository.checks", label: "Checks" },
] as const;

export type RepositoryHomeSlotName = (typeof repositoryHomeSlots)[number]["name"];

export function registerRepositoryShellSlots(): void {
  defineRepositorySummaryElement();
  registerSlot("repository.overview", {
    id: "core.repository-summary",
    extensionId: "core",
    element: REPOSITORY_SUMMARY_TAG,
    priority: 0,
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
