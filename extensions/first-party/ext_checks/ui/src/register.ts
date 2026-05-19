import { defineExtensionWidget } from "@comtrya/sdk-vue";
import ChecksBoard from "./ChecksBoard.vue";

const EXTENSION_ID = "ext_checks";
const CHECKS_BOARD_TAG = "comtrya-checks-board";

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

defineExtensionWidget({ tagName: CHECKS_BOARD_TAG, component: ChecksBoard });

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerWidget({
      id: "checks-board",
      element: CHECKS_BOARD_TAG,
      defaultSlot: "repository.sidebar",
      defaultPriority: 200,
      requiredPermission: "checks.read",
    });
    host.registerRoute("/", {
      element: CHECKS_BOARD_TAG,
      requiredPermission: "checks.read",
    });
  },
};

export default extension;
