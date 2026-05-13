import { createApp } from "vue";
import "../../src/styles.css";
import "./styles.css";
import App from "./App.vue";
import { assertWorkspaceSdkDepsLinked } from "./workspace-deps";

assertWorkspaceSdkDepsLinked();
createApp(App).mount("#app");
