import { defineExtensionWidget } from "@comtrya/sdk-vue";
import ChecksBoard from "./ChecksBoard.vue";
import ChecksDetail from "./ChecksDetail.vue";

const EXTENSION_ID = "ext_checks";
const CHECKS_BOARD_TAG = "comtrya-checks-board";
const CHECKS_DETAIL_TAG = "comtrya-checks-detail";

interface ExtensionHost {
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

defineExtensionWidget({ tagName: CHECKS_BOARD_TAG, component: ChecksBoard });
defineExtensionWidget({ tagName: CHECKS_DETAIL_TAG, component: ChecksDetail });

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerSlot("repository.checks", {
      element: CHECKS_BOARD_TAG,
      requiredPermission: "checks.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: CHECKS_BOARD_TAG,
      requiredPermission: "checks.read",
    });
  },
};

export default extension;
