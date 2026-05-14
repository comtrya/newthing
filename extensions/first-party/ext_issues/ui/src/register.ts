import { defineExtensionWidget } from "@comtrya/sdk-vue";
import IssueCard from "./IssueCard.vue";
import IssueDetail from "./IssueDetail.vue";
import IssueRelationships from "./IssueRelationships.vue";
import IssuesList from "./IssuesList.vue";
import { listIssues, openIssue } from "./api";
import { bindIssueCommands } from "./issue-commands";
import { resolveIssuesPolicy } from "./policy";
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
    bindIssueCommands(host.client);
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
  projectName?: string | null;
}

function routeContext(
  routeParams?: ExtensionRouteParams,
  context: IssueRouteContext = {},
): {
  workspaceId: string;
  repositoryId?: string | null;
  projectName?: string | null;
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
    projectName:
      params.get("projectName") ??
      context.projectName ??
      routeParams?.params?.projectName ??
      null,
  };
}

function issueNewForm(context: {
  workspaceId: string;
  repositoryId?: string | null;
  projectName?: string | null;
}): HTMLElement {
  ensureIssueNewStyles();
  const main = document.createElement("main");
  main.className = "issue-new";
  main.dataset.smoke = "issue-new";

  const header = document.createElement("header");
  header.className = "issue-new-head";
  const overline = document.createElement("span");
  overline.className = "issue-new-overline";
  overline.textContent = context.projectName ? `${context.projectName} · issue` : "Issue";
  const heading = document.createElement("h1");
  heading.textContent = "New issue";
  header.append(overline, heading);

  const form = document.createElement("form");
  form.className = "issue-new-form";

  const titleField = field("Title");
  const titleInput = document.createElement("input");
  titleInput.required = true;
  titleInput.placeholder = "What needs to be done?";
  titleField.append(titleInput);

  const bodyField = field("Description", "Optional. Supports Markdown.");
  const bodyInput = document.createElement("textarea");
  bodyInput.rows = 6;
  bodyInput.placeholder = "Add context, repro steps, links…";
  bodyField.append(bodyInput);

  const labelsField = field("Labels");
  const labelsInput = document.createElement("input");
  labelsInput.placeholder = "comma-separated";
  labelsInput.dataset.smoke = "issue-new-labels";
  labelsField.append(labelsInput);
  const labelsHint = document.createElement("p");
  labelsHint.className = "issue-new-hint";
  labelsHint.hidden = true;
  labelsField.append(labelsHint);

  // Compact policy chip row, hidden until we know the Project's policy.
  const policyRow = document.createElement("div");
  policyRow.className = "issue-new-policy";
  policyRow.hidden = true;
  policyRow.dataset.smoke = "issue-new-policy";

  let resolvedCloseOnMerge: boolean | null = null;

  if (context.projectName) {
    void resolveIssuesPolicy(context.projectName, "referrer").then((policy) => {
      if (policy.defaultLabels.length > 0) {
        if (labelsInput.value.trim().length === 0) {
          labelsInput.value = policy.defaultLabels.join(", ");
        }
        labelsHint.hidden = false;
        labelsHint.textContent =
          `Pre-filled from CUE · ${context.projectName} → issues.defaultLabels`;
      }
      resolvedCloseOnMerge = policy.closeOnMerge;
      if (policy.closeOnMerge !== null) {
        policyRow.hidden = false;
        const chip = document.createElement("span");
        chip.className = `issue-new-chip ${policy.closeOnMerge ? "chip-on" : "chip-off"}`;
        chip.textContent = policy.closeOnMerge
          ? "closeOnMerge · on"
          : "closeOnMerge · off";
        const detail = document.createElement("span");
        detail.className = "issue-new-chip-detail";
        detail.textContent = policy.closeOnMerge
          ? "Auto-closes when a linked PR merges."
          : "Stays open when a linked PR merges.";
        policyRow.replaceChildren(chip, detail);
      }
    });
  }

  const actions = document.createElement("div");
  actions.className = "issue-new-actions";
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "issue-new-submit";
  submit.textContent = "Create issue";
  actions.append(submit);

  const errorBox = document.createElement("p");
  errorBox.className = "issue-new-error";
  errorBox.setAttribute("role", "alert");
  errorBox.hidden = true;

  form.append(titleField, bodyField, labelsField, policyRow, actions, errorBox);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit.disabled = true;
    errorBox.hidden = true;
    void openIssue({
      workspaceId: context.workspaceId,
      repositoryId: context.repositoryId,
      projectName: context.projectName ?? null,
      title: titleInput.value.trim(),
      bodyMarkdown: bodyInput.value,
      labels: parseLabels(labelsInput.value),
      closeOnMerge: resolvedCloseOnMerge,
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

  main.append(header, form);
  return main;
}

function field(label: string, hint?: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "issue-new-field";
  const lab = document.createElement("label");
  lab.className = "issue-new-label";
  lab.textContent = label;
  wrap.append(lab);
  if (hint) {
    const hintEl = document.createElement("span");
    hintEl.className = "issue-new-hint";
    hintEl.textContent = hint;
    wrap.append(hintEl);
  }
  return wrap;
}

const ISSUE_NEW_STYLE_ID = "comtrya-issue-new-styles";
const ISSUE_NEW_CSS = `
.issue-new {
  display: grid;
  gap: 24px;
  max-width: 720px;
  font-family: var(--sans, system-ui);
  color: var(--ink, #111);
}
.issue-new-head {
  display: grid;
  gap: 6px;
  border-bottom: 1.5px solid var(--ink, #111);
  padding-bottom: 14px;
}
.issue-new-overline {
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint, #68645c);
}
.issue-new h1 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 36px;
  line-height: 1;
}
.issue-new-form {
  display: grid;
  gap: 18px;
}
.issue-new-field {
  display: grid;
  gap: 6px;
}
.issue-new-label {
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint, #68645c);
}
.issue-new-hint {
  margin: 0;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-fainter, #918b80);
}
.issue-new input,
.issue-new textarea {
  width: 100%;
  border: 1.5px solid var(--rule-light, #d8d1c4);
  background: var(--paper, #fffdf8);
  color: var(--ink, #111);
  padding: 10px 12px;
  font-family: var(--mono, monospace);
  font-size: 13px;
  outline: none;
  transition: border-color 120ms ease;
}
.issue-new input:focus,
.issue-new textarea:focus {
  border-color: var(--ink, #111);
}
.issue-new textarea {
  resize: vertical;
  font-family: var(--mono, monospace);
}
.issue-new-policy {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  border: 1px dashed var(--rule-light, #d8d1c4);
  padding: 8px 12px;
  background: var(--paper-tint, #f2efe7);
}
.issue-new-chip {
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid currentColor;
  padding: 1px 6px;
}
.issue-new-chip.chip-on {
  color: var(--accent-teal, #087f6f);
}
.issue-new-chip.chip-off {
  color: var(--accent-yellow, #c89300);
}
.issue-new-chip-detail {
  font-family: var(--sans, system-ui);
  font-size: 12px;
  color: var(--ink-soft, #2c2b28);
}
.issue-new-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}
.issue-new-submit {
  border: 1.5px solid var(--ink, #111);
  background: var(--ink, #111);
  color: var(--paper, #fffdf8);
  padding: 10px 18px;
  font-family: var(--display, system-ui);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.issue-new-submit:disabled {
  background: var(--ink-faint, #68645c);
  cursor: wait;
}
.issue-new-error {
  margin: 0;
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--accent-err, #c9341c);
}
`;

function ensureIssueNewStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(ISSUE_NEW_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = ISSUE_NEW_STYLE_ID;
  style.textContent = ISSUE_NEW_CSS;
  document.head.appendChild(style);
}

function parseLabels(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}
