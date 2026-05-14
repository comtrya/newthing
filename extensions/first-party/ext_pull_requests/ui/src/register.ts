import { defineExtensionWidget } from "@comtrya/sdk-vue";
import PullsDetail from "./PullsDetail.vue";
import PullsOverview from "./PullsOverview.vue";
import PullsQueue from "./PullsQueue.vue";
import PullsYourWork from "./PullsYourWork.vue";

const EXTENSION_ID = "ext_pull_requests";
const PULLS_QUEUE_TAG = "comtrya-pulls-queue";
const PULLS_DETAIL_TAG = "comtrya-pulls-detail";
const PULLS_YOUR_WORK_TAG = "comtrya-pulls-your-work";
const PULLS_OVERVIEW_TAG = "comtrya-pulls-overview";

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

defineExtensionWidget({ tagName: PULLS_QUEUE_TAG, component: PullsQueue });
defineExtensionWidget({ tagName: PULLS_DETAIL_TAG, component: PullsDetail });
defineExtensionWidget({ tagName: PULLS_YOUR_WORK_TAG, component: PullsYourWork });
defineExtensionWidget({ tagName: PULLS_OVERVIEW_TAG, component: PullsOverview });

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerWidget({
      id: "pulls-your-work",
      element: PULLS_YOUR_WORK_TAG,
      defaultSlot: "home.your-work",
      defaultPriority: 100,
      requiredPermission: "pull-requests.read",
    });
    host.registerWidget({
      id: "pulls-overview",
      element: PULLS_OVERVIEW_TAG,
      defaultSlot: "repository.sidebar",
      defaultPriority: 100,
      requiredPermission: "pull-requests.read",
    });
    host.registerRoute("/", {
      element: PULLS_QUEUE_TAG,
      requiredPermission: "pull-requests.read",
    });
    host.registerRoute("/:pullId", {
      element: PULLS_DETAIL_TAG,
      requiredPermission: "pull-requests.read",
    });
  },
};

export default extension;
