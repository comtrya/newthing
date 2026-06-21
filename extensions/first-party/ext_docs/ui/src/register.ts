import { defineExtensionWidget } from "@comtrya/sdk-vue";
import DocsPanel from "./DocsPanel.vue";

const EXTENSION_ID = "ext_docs";
const DOCS_PANEL_TAG = "comtrya-docs-panel";

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

defineExtensionWidget({ tagName: DOCS_PANEL_TAG, component: DocsPanel });

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerWidget({
      id: "docs-panel",
      element: DOCS_PANEL_TAG,
      defaultSlot: "repository.main",
      defaultPriority: 80,
      requiredPermission: "workspace.read",
    });
    host.registerRoute("/", {
      element: DOCS_PANEL_TAG,
      requiredPermission: "workspace.read",
    });
  },
};

export default extension;
