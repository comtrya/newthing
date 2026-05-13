import { createApp } from "vue";
import {
  defineInlineEditElement,
  defineResourceCardElement,
  defineSkeletonElement,
} from "@comtrya/sdk-core";
import "../../src/styles.css";
import "./styles.css";
import App from "./App.vue";
import { createShellRouter } from "./router";
import { assertWorkspaceSdkDepsLinked } from "./workspace-deps";

assertWorkspaceSdkDepsLinked();
defineResourceCardElement();
defineInlineEditElement();
defineSkeletonElement();
const app = createApp(App);
app.use(createShellRouter());
app.mount("#app");
