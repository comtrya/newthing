import { defineExtensionWidget } from "@comtrya/sdk-vue";
import IssueCard from "./IssueCard.vue";
import IssueDetail from "./IssueDetail.vue";
import IssuesList from "./IssuesList.vue";
import { openIssue } from "./api";
import { DEFAULT_WORKSPACE_ID, type ExtensionRouteParams } from "./types";

const EXTENSION_ID = "ext_issues";
const ISSUE_CARD_TAG = "comtrya-issue-card";
const ISSUES_LIST_TAG = "comtrya-issues-list";
const ISSUES_REPO_LIST_TAG = "comtrya-issues-repo-list";
const ISSUE_DETAIL_TAG = "comtrya-issue-detail";
const ISSUE_NEW_TAG = "comtrya-issue-new";

interface ExtensionHost {
  registerCard(contribution: {
    resourceKind: string;
    element: string;
    requiredPermission: string;
  }): unknown;
  registerSlot(
    name: string,
    contribution: {
      element: string;
      requiredPermission: string;
      priority?: number;
    },
  ): unknown;
  registerRoute(
    path: string,
    contribution: {
      element: string;
      requiredPermission: string;
    },
  ): unknown;
}

interface ExtensionDefinition {
  id: string;
  setup(host: ExtensionHost): void | Promise<void>;
}

defineExtensionWidget({
  tagName: ISSUE_CARD_TAG,
  component: IssueCard,
  propertyAliases: { ref: "resourceRef" },
});
defineExtensionWidget({ tagName: ISSUES_LIST_TAG, component: IssuesList });
defineExtensionWidget({ tagName: ISSUES_REPO_LIST_TAG, component: IssuesList });
defineExtensionWidget({ tagName: ISSUE_DETAIL_TAG, component: IssueDetail });
defineIssueNewElement();

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerCard({
      resourceKind: "issue",
      element: ISSUE_CARD_TAG,
      requiredPermission: "issues.read",
    });
    host.registerSlot("repository.issues", {
      element: ISSUES_LIST_TAG,
      requiredPermission: "issues.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: ISSUES_LIST_TAG,
      requiredPermission: "issues.read",
    });
    host.registerRoute("/new", {
      element: ISSUE_NEW_TAG,
      requiredPermission: "issues.write",
    });
    host.registerRoute("/:workspaceId/:number", {
      element: ISSUE_DETAIL_TAG,
      requiredPermission: "issues.read",
    });
  },
};

export default extension;

function defineIssueNewElement(): void {
  if (typeof customElements === "undefined" || customElements.get(ISSUE_NEW_TAG)) {
    return;
  }

  customElements.define(
    ISSUE_NEW_TAG,
    class extends HTMLElement {
      routeParams?: ExtensionRouteParams;

      connectedCallback(): void {
        this.replaceChildren(issueNewForm(routeContext(this.routeParams)));
      }
    },
  );
}

function routeContext(routeParams?: ExtensionRouteParams): {
  workspaceId: string;
  repositoryId?: string | null;
} {
  const params = new URLSearchParams(window.location.search);
  return {
    workspaceId:
      params.get("workspaceId") ??
      routeParams?.params?.workspaceId ??
      DEFAULT_WORKSPACE_ID,
    repositoryId: params.get("repositoryId") ?? routeParams?.params?.repositoryId ?? null,
  };
}

function issueNewForm(context: { workspaceId: string; repositoryId?: string | null }): HTMLElement {
  const main = document.createElement("main");
  main.className = "issue-new";
  main.dataset.smoke = "issue-new";

  const heading = document.createElement("h1");
  heading.textContent = "New issue";

  const form = document.createElement("form");
  const titleInput = document.createElement("input");
  titleInput.required = true;
  titleInput.placeholder = "Issue title";

  const bodyInput = document.createElement("textarea");
  bodyInput.rows = 6;
  bodyInput.placeholder = "Description (optional)";

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Create issue";

  const errorBox = line("", "warn");
  errorBox.setAttribute("role", "alert");
  errorBox.hidden = true;

  form.append(titleInput, bodyInput, submit, errorBox);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit.disabled = true;
    errorBox.hidden = true;
    void openIssue({
      workspaceId: context.workspaceId,
      repositoryId: context.repositoryId,
      title: titleInput.value.trim(),
      bodyMarkdown: bodyInput.value,
    })
      .then((created) => {
        window.location.assign(`/x/issues/${created.workspaceId}/${created.number}`);
      })
      .catch((error: unknown) => {
        errorBox.textContent = error instanceof Error ? error.message : String(error);
        errorBox.hidden = false;
        submit.disabled = false;
      });
  });

  main.append(heading, form);
  return main;
}

function line(text: string, tone: "muted" | "warn"): HTMLElement {
  const node = document.createElement("p");
  node.className = `issue-line ${tone}`;
  node.textContent = text;
  return node;
}
