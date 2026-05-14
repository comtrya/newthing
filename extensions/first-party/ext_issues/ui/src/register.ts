import { defineExtensionWidget } from "@comtrya/sdk-vue";
import IssueCard from "./IssueCard.vue";
import IssueDetail from "./IssueDetail.vue";
import IssuesList from "./IssuesList.vue";
import type { ComtryaGraphQLClient } from "./types";

const EXTENSION_ID = "ext_issues";
const ISSUE_CARD_TAG = "comtrya-issue-card";
const ISSUES_LIST_TAG = "comtrya-issues-list";
const ISSUES_REPO_LIST_TAG = "comtrya-issues-repo-list";
const ISSUE_DETAIL_TAG = "comtrya-issue-detail";
const ISSUE_NEW_TAG = "comtrya-issue-new";

const CREATE_ISSUE_MUTATION = `mutation($input: CreateIssueInput!) {
  issues.create(input: $input) {
    id workspaceId number title state
  }
}`;

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

interface CreatedIssue {
  workspaceId: string;
  number: number;
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
      comtryaClient?: ComtryaGraphQLClient;

      connectedCallback(): void {
        const client = this.comtryaClient;
        if (!client) {
          this.replaceChildren(line("issue-new: no client", "warn"));
          return;
        }
        this.replaceChildren(issueNewForm(client));
      }
    },
  );
}

function issueNewForm(client: ComtryaGraphQLClient): HTMLElement {
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
    void client
      .mutate<{ issues?: { create?: CreatedIssue } }>(CREATE_ISSUE_MUTATION, {
        input: {
          workspaceId: "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
          title: titleInput.value.trim(),
          bodyMarkdown: bodyInput.value,
        },
      })
      .then((result) => {
        const created = result.issues?.create;
        if (created) {
          window.location.assign(`/x/issues/${created.workspaceId}/${created.number}`);
        }
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
