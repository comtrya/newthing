import { defineExtensionWidget } from "@comtrya/sdk-vue";
import SprintsList from "./SprintsList.vue";

const EXTENSION_ID = "ext_sprints";
const SPRINTS_LIST_TAG = "comtrya-sprints-list";

interface ExtensionHost {
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

defineExtensionWidget({ tagName: SPRINTS_LIST_TAG, component: SprintsList });

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerWidget({
      id: "sprints-list",
      element: SPRINTS_LIST_TAG,
      defaultSlot: "repository.sidebar",
      defaultPriority: 150,
      requiredPermission: "sprints.read",
    });
    host.registerRoute("/", {
      element: SPRINTS_LIST_TAG,
      requiredPermission: "sprints.read",
    });
  },
};

export default extension;
