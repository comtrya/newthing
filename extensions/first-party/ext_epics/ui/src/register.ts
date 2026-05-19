import { buildExtensionUrl } from "@comtrya/sdk-core";
import { defineExtensionWidget, fetchComtryaProjects } from "@comtrya/sdk-vue";
import { createEpic, listEpics } from "./api";
import { bindEpicCommands } from "./epic-commands";
import EpicCard from "./EpicCard.vue";
import EpicDetail from "./EpicDetail.vue";
import EpicsList from "./EpicsList.vue";
import {
  defaultWorkspaceId,
  epicRef,
  type ComtryaGraphQLClient,
  type ExtensionRouteParams,
} from "./types";

const EPICS_ROUTE_PREFIX = "epics";

const EXTENSION_ID = "ext_epics";
const EPIC_CARD_TAG = "comtrya-epic-card";
const EPICS_BOARD_TAG = "comtrya-epics-board";
const EPICS_INDEX_TAG = "comtrya-epics-index";
const EPIC_DETAIL_TAG = "comtrya-epic-detail";
const EPIC_NEW_TAG = "comtrya-epic-new";

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
  tagName: EPIC_CARD_TAG,
  component: EpicCard,
  propertyAliases: { ref: "resourceRef" },
});
defineExtensionWidget({ tagName: EPICS_BOARD_TAG, component: EpicsList });
defineExtensionWidget({ tagName: EPICS_INDEX_TAG, component: EpicsList });
defineExtensionWidget({ tagName: EPIC_DETAIL_TAG, component: EpicDetail });
defineEpicNewElement();

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerCard({
      resourceKind: "epic",
      element: EPIC_CARD_TAG,
      requiredPermission: "epics.read",
    });
    host.registerRelationshipTargetProvider({
      resourceKind: "epic",
      loadTargets: async (context) => {
        const epics = await listEpics(host.client, {
          workspaceId: context.workspaceId ?? defaultWorkspaceId(),
        });
        return epics.map((epic) => ({
          ref: epicRef(epic),
          kind: "epic",
          title: epic.title,
          subtitle: epic.state.toLowerCase().replace(/_/g, " "),
        }));
      },
    });
    host.registerWidget({
      id: "epics-board",
      element: EPICS_BOARD_TAG,
      defaultSlot: "repository.sidebar",
      defaultPriority: 100,
      requiredPermission: "epics.read",
    });
    host.registerRoute("/", {
      element: EPICS_INDEX_TAG,
      requiredPermission: "epics.read",
    });
    host.registerRoute("/new", {
      element: EPIC_NEW_TAG,
      requiredPermission: "epics.write",
    });
    host.registerRoute("/:workspaceId/:id", {
      element: EPIC_DETAIL_TAG,
      requiredPermission: "epics.read",
    });
    bindEpicCommands(host.client);
  },
};

export default extension;

function defineEpicNewElement(): void {
  if (typeof customElements === "undefined" || customElements.get(EPIC_NEW_TAG)) {
    return;
  }

  customElements.define(
    EPIC_NEW_TAG,
    class extends HTMLElement {
      routeParams?: ExtensionRouteParams;

      connectedCallback(): void {
        const ctx = newEpicRouteContext(this.routeParams);
        this.replaceChildren(epicNewForm(ctx));
      }
    },
  );
}

interface NewEpicContext {
  workspaceId: string;
  projectName: string | null;
}

function newEpicRouteContext(routeParams?: ExtensionRouteParams): NewEpicContext {
  const params = new URLSearchParams(window.location.search);
  return {
    workspaceId:
      params.get("workspaceId") ??
      routeParams?.params?.workspaceId ??
      defaultWorkspaceId(),
    projectName:
      params.get("projectName") ??
      routeParams?.params?.projectName ??
      null,
  };
}

function epicNewForm(context: NewEpicContext): HTMLElement {
  const main = document.createElement("main");
  main.className = "epic-new";
  main.dataset.smoke = "epic-new";

  const heading = document.createElement("h3");
  heading.textContent = context.projectName
    ? `New epic in ${context.projectName}`
    : "New epic";

  const form = document.createElement("form");
  const titleInput = document.createElement("input");
  titleInput.required = true;
  titleInput.placeholder = "Epic title";

  /**
   * Project picker — mirrors the iter-66 IssueNew addition.
   * Populated from the repo's CUE `comtryaConfig.projects` so an
   * epic can be scoped to a Project on creation without
   * pre-stamping the URL with `?projectName=...`. Closes the
   * iter 64/65 loop on the epic side: per-project counts and the
   * workspace Projects panel light up the moment an epic gets
   * tagged.
   */
  const projectSelect = document.createElement("select");
  projectSelect.className = "epic-new-project-select";
  projectSelect.dataset.smoke = "epic-new-project";
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "— no project —";
  projectSelect.append(placeholderOption);
  void fetchComtryaProjects().then((projects) => {
    for (const project of projects) {
      if (!project.name) continue;
      const option = document.createElement("option");
      option.value = project.name;
      option.textContent = project.name;
      if (project.name === context.projectName) option.selected = true;
      projectSelect.append(option);
    }
  });
  projectSelect.addEventListener("change", () => {
    heading.textContent = projectSelect.value
      ? `New epic in ${projectSelect.value}`
      : "New epic";
  });

  const bodyInput = document.createElement("textarea");
  bodyInput.rows = 5;
  bodyInput.placeholder = "Description (optional)";

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Create epic";

  const errorBox = line("", "warn");
  errorBox.setAttribute("role", "alert");
  errorBox.hidden = true;

  form.append(titleInput, projectSelect, bodyInput, submit, errorBox);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit.disabled = true;
    errorBox.hidden = true;
    void createEpic(undefined, {
      workspaceId: context.workspaceId,
      projectName: projectSelect.value || null,
      title: titleInput.value.trim(),
      bodyMarkdown: bodyInput.value,
    })
      .then((created) => {
        window.location.assign(
          buildExtensionUrl(EPICS_ROUTE_PREFIX, `/${created.workspaceId}/${created.id}`),
        );
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
  node.className = `epic-line ${tone}`;
  node.textContent = text;
  return node;
}
