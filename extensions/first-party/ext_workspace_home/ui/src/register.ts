import { defineExtensionWidget } from "@comtrya/sdk-vue";
import HomeActivity from "./HomeActivity.vue";
import HomeInstance from "./HomeInstance.vue";
import HomeRepositories from "./HomeRepositories.vue";
import HomeYourWork from "./HomeYourWork.vue";

const EXTENSION_ID = "ext_workspace_home";
const YOUR_WORK_TAG = "comtrya-home-your-work";
const REPOSITORIES_TAG = "comtrya-home-repositories";
const ACTIVITY_TAG = "comtrya-home-activity";
const INSTANCE_TAG = "comtrya-home-instance";

interface ExtensionHost {
  registerWidget(contribution: {
    id: string;
    element: string;
    defaultSlot?: string;
    defaultPriority?: number;
    requiredPermission: string;
  }): unknown;
}

interface ExtensionDefinition {
  id: string;
  setup(host: ExtensionHost): void | Promise<void>;
}

defineExtensionWidget({ tagName: YOUR_WORK_TAG, component: HomeYourWork });
defineExtensionWidget({ tagName: REPOSITORIES_TAG, component: HomeRepositories });
defineExtensionWidget({ tagName: ACTIVITY_TAG, component: HomeActivity });
defineExtensionWidget({ tagName: INSTANCE_TAG, component: HomeInstance });

const extension: ExtensionDefinition = {
  id: EXTENSION_ID,
  setup(host) {
    host.registerWidget({
      id: "home-your-work",
      element: YOUR_WORK_TAG,
      defaultSlot: "home.your-work",
      defaultPriority: 1000,
      requiredPermission: "workspace.read",
    });
    host.registerWidget({
      id: "home-repositories",
      element: REPOSITORIES_TAG,
      defaultSlot: "home.repositories",
      defaultPriority: 1000,
      requiredPermission: "workspace.read",
    });
    host.registerWidget({
      id: "home-activity",
      element: ACTIVITY_TAG,
      defaultSlot: "home.activity",
      defaultPriority: 1000,
      requiredPermission: "events.read",
    });
    host.registerWidget({
      id: "home-instance",
      element: INSTANCE_TAG,
      defaultSlot: "home.instance",
      defaultPriority: 1000,
      requiredPermission: "instance.admin",
    });
  },
};

export default extension;
