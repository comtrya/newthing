import { defineExtensionWidget } from "@comtrya/sdk-vue";
import IssueCard from "./IssueCard.vue";
import IssueDetail from "./IssueDetail.vue";
import IssueRelationships from "./IssueRelationships.vue";
import IssuesList from "./IssuesList.vue";
import { listIssues, openIssue } from "./api";
import {
  DEFAULT_WORKSPACE_ID,
  issueHref,
  issueRef,
  type ComtryaGraphQLClient,
  type ExtensionRouteParams,
} from "./types";

const EXTENSION_ID = "ext_issues";
const ISSUE_CARD_TAG = "comtrya-issue-card";
const ISSUES_LIST_TAG = "comtrya-issues-list";
const ISSUES_REPO_LIST_TAG = "comtrya-issues-repo-list";
const ISSUE_DETAIL_TAG = "comtrya-issue-detail";
const ISSUE_RELATIONSHIPS_TAG = "comtrya-issue-relationships";
const ISSUE_NEW_TAG = "comtrya-issue-new";

interface ExtensionHost {
  readonly client: ComtryaGraphQLClient;
  registerCard(contribution: {
    resourceKind: string;
    element: string;
    requiredPermission: string;
  }): unknown;
  registerRelationshipTargetProvider(contribution: {
    resourceKind: string;
    loadTargets(context: {
      workspaceId?: string;
      repositoryId?: string | null;
    }): Promise<Array<{
      ref: string;
      kind: string;
      title: string;
      subtitle?: string | null;
    }>>;
  }): unknown;
  registerWidget(contribution: {
    id: string;
    element: string;
    defaultSlot?: string;
    defaultPriority?: number;
    requiredPermission: string;
  }): unknown;
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
defineExtensionWidget({ tagName: ISSUE_RELATIONSHIPS_TAG, component: IssueRelationships });
defineIssueNewElement();

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerCard({
      resourceKind: "issue",
      element: ISSUE_CARD_TAG,
      requiredPermission: "issues.read",
    });
    host.registerRelationshipTargetProvider({
      resourceKind: "issue",
      loadTargets: async (context) => {
        const issues = await listIssues(host.client, {
          workspaceId: context.workspaceId ?? DEFAULT_WORKSPACE_ID,
          repositoryId: context.repositoryId,
        });
        return issues.map((issue) => ({
          ref: issueRef(issue),
          kind: "issue",
          title: `#${issue.number} ${issue.title}`,
          subtitle: issue.state.toLowerCase(),
        }));
      },
    });
    host.registerWidget({
      id: "issues-list",
      element: ISSUES_LIST_TAG,
      defaultSlot: "repository.main",
      defaultPriority: 100,
      requiredPermission: "issues.read",
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

  class IssueNewElement extends HTMLElement {
    routeParams?: ExtensionRouteParams;
    workspaceId?: string;
    repositoryId?: string | null;

    connectedCallback(): void {
      this.replaceChildren(issueNewForm(routeContext(this.routeParams, this)));
    }
  }

  customElements.define(ISSUE_NEW_TAG, IssueNewElement);
}

interface IssueRouteContext {
  workspaceId?: string | null;
  repositoryId?: string | null;
}

function routeContext(
  routeParams?: ExtensionRouteParams,
  context: IssueRouteContext = {},
): {
  workspaceId: string;
  repositoryId?: string | null;
} {
  const params = new URLSearchParams(window.location.search);
  return {
    workspaceId:
      params.get("workspaceId") ??
      context.workspaceId ??
      routeParams?.params?.workspaceId ??
      DEFAULT_WORKSPACE_ID,
    repositoryId:
      params.get("repositoryId") ??
      context.repositoryId ??
      routeParams?.params?.repositoryId ??
      null,
  };
}

function issueNewForm(context: {
  workspaceId: string;
  repositoryId?: string | null;
}): HTMLElement {
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
        window.location.assign(issueHref(created));
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
