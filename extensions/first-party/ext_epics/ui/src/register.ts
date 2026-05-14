import { buildExtensionUrl } from "@comtrya/sdk-core";
import { defineExtensionWidget } from "@comtrya/sdk-vue";
import { createEpic, listEpics } from "./api";
import EpicCard from "./EpicCard.vue";
import EpicDetail from "./EpicDetail.vue";
import EpicsList from "./EpicsList.vue";
import {
  DEFAULT_WORKSPACE_ID,
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
          workspaceId: context.workspaceId ?? DEFAULT_WORKSPACE_ID,
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
        this.replaceChildren(epicNewForm(workspaceIdFromRoute(this.routeParams)));
      }
    },
  );
}

function workspaceIdFromRoute(routeParams?: ExtensionRouteParams): string {
  return (
    new URLSearchParams(window.location.search).get("workspaceId") ??
    routeParams?.params?.workspaceId ??
    DEFAULT_WORKSPACE_ID
  );
}

function epicNewForm(workspaceId: string): HTMLElement {
  const main = document.createElement("main");
  main.className = "epic-new";
  main.dataset.smoke = "epic-new";

  const heading = document.createElement("h3");
  heading.textContent = "New epic";

  const form = document.createElement("form");
  const titleInput = document.createElement("input");
  titleInput.required = true;
  titleInput.placeholder = "Epic title";

  const bodyInput = document.createElement("textarea");
  bodyInput.rows = 5;
  bodyInput.placeholder = "Description (optional)";

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Create epic";

  const errorBox = line("", "warn");
  errorBox.setAttribute("role", "alert");
  errorBox.hidden = true;

  form.append(titleInput, bodyInput, submit, errorBox);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit.disabled = true;
    errorBox.hidden = true;
    void createEpic(undefined, {
      workspaceId,
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
