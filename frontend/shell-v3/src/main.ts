import { createApp } from "vue";
import "../../src/styles.css";
import "./styles.css";
import App from "./App.vue";
import { createShellRouter } from "./router";
import { assertWorkspaceSdkDepsLinked } from "./workspace-deps";

assertWorkspaceSdkDepsLinked();
const app = createApp(App);
app.use(createShellRouter());
app.mount("#app");
