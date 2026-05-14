import { createApp } from "vue";
import {
  bindGlobalShortcut,
  defineInlineEditElement,
  defineResourceCardElement,
  defineSkeletonElement,
  registerCommand,
} from "@comtrya/sdk-core";
import "./styles.css";
import App from "./App.vue";
import { loadShellExtensions } from "./extension-loader";
import { registerRepositoryShellSlots } from "./repository-slots";
import { createShellRouter } from "./router";
import { assertWorkspaceSdkDepsLinked } from "./workspace-deps";

assertWorkspaceSdkDepsLinked();
defineResourceCardElement();
defineInlineEditElement();
defineSkeletonElement();
registerRepositoryShellSlots();
bindGlobalShortcut();
const router = createShellRouter();
registerCommand({
  id: "core.workspace-home",
  title: "Open workspace home",
  category: "Navigation",
  extensionId: "core",
  run: () => {
    void router.push("/");
  },
});
registerCommand({
  id: "core.repository-home",
  title: "Open comtrya repository",
  category: "Navigation",
  extensionId: "core",
  run: () => {
    void router.push("/r/comtrya/comtrya");
  },
});
registerCommand({
  id: "core.issues",
  title: "Open issues",
  category: "Extensions",
  extensionId: "core",
  run: () => {
    void router.push("/x/issues/");
  },
});
void loadShellExtensions().then((failures) => {
  for (const failure of failures) {
    console.warn(
      `[shell-app] extension ${failure.extensionId} ${failure.stage} failed: ${failure.message}`,
    );
  }
});
const app = createApp(App);
app.use(router);
app.mount("#app");
