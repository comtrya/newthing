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
  registerSlot(
    name: string,
    contribution: {
      element: string;
      requiredPermission: string;
      priority?: number;
    },
  ): unknown;
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
    host.registerSlot("home.your-work", {
      element: YOUR_WORK_TAG,
      requiredPermission: "workspace.read",
      priority: 1000,
    });
    host.registerSlot("home.repositories", {
      element: REPOSITORIES_TAG,
      requiredPermission: "workspace.read",
      priority: 1000,
    });
    host.registerSlot("home.activity", {
      element: ACTIVITY_TAG,
      requiredPermission: "events.read",
      priority: 1000,
    });
    host.registerSlot("home.instance", {
      element: INSTANCE_TAG,
      requiredPermission: "instance.admin",
      priority: 1000,
    });
    registerOptionalSlot(host, "workspace.home.top", {
      element: YOUR_WORK_TAG,
      requiredPermission: "workspace.read",
      priority: 1000,
    });
    registerOptionalSlot(host, "workspace.home.center", {
      element: REPOSITORIES_TAG,
      requiredPermission: "workspace.read",
      priority: 1000,
    });
    registerOptionalSlot(host, "workspace.home.left", {
      element: ACTIVITY_TAG,
      requiredPermission: "events.read",
      priority: 1000,
    });
    registerOptionalSlot(host, "workspace.home.right", {
      element: INSTANCE_TAG,
      requiredPermission: "instance.admin",
      priority: 1000,
    });
  },
};

export default extension;

function registerOptionalSlot(
  host: ExtensionHost,
  name: string,
  contribution: {
    element: string;
    requiredPermission: string;
    priority: number;
  },
): void {
  try {
    host.registerSlot(name, contribution);
  } catch (error) {
    if (!name.startsWith("workspace.home.")) throw error;
  }
}
