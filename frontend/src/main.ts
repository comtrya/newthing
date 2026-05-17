import { createApp } from "vue";
import type { Router } from "vue-router";
import { tinykeys } from "tinykeys";
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
import { bindProjectCommands } from "./project-commands";
import { bindRepositoryCommands } from "./repository-commands";
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
registerNavigationCommands(router);
bindGoChord(router);
bindProjectCommands(router);
bindRepositoryCommands(router);
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

function registerNavigationCommands(router: Router): void {
  registerCommand({
    id: "core.workspace-home",
    title: "Go to workspace home",
    category: "Navigation",
    shortcut: "g h",
    extensionId: "core",
    run: () => {
      void router.push("/");
    },
  });
  registerCommand({
    id: "core.inbox",
    title: "Open Inbox",
    category: "Navigation",
    shortcut: "g b",
    extensionId: "core",
    run: () => {
      void router.push("/inbox");
    },
  });
  registerCommand({
    id: "core.issues",
    title: "Open workspace issues queue",
    category: "Navigation",
    shortcut: "g i",
    extensionId: "core",
    run: () => {
      void router.push("/x/issues/");
    },
  });
  registerCommand({
    id: "core.pulls",
    title: "Open workspace pull-request queue",
    category: "Navigation",
    shortcut: "g p",
    extensionId: "core",
    run: () => {
      void router.push("/x/pulls/");
    },
  });
  registerCommand({
    id: "core.new-repository",
    title: "Create a new repository",
    category: "Navigation",
    shortcut: "g n",
    extensionId: "core",
    run: () => {
      void router.push("/new");
    },
  });
  registerCommand({
    id: "core.new-issue",
    title: "+ New issue",
    category: "Create",
    extensionId: "core",
    run: () => {
      void router.push("/x/issues/new");
    },
  });
  registerCommand({
    id: "core.new-epic",
    title: "+ New epic",
    category: "Create",
    extensionId: "core",
    run: () => {
      void router.push("/x/epics/new");
    },
  });
  registerCommand({
    id: "core.instance-health",
    title: "Open instance health",
    category: "Navigation",
    extensionId: "core",
    run: () => {
      void router.push("/instance");
    },
  });
  registerCommand({
    id: "core.settings",
    title: "Open settings",
    category: "Navigation",
    extensionId: "core",
    run: () => {
      void router.push("/settings");
    },
  });
}

/**
 * Two-key navigation chords: `g` followed by `h|b|i|p|n` jumps to a
 * destination. Backed by `tinykeys` for the sequence + timeout
 * semantics. tinykeys v3 fires on every keydown regardless of focus
 * target, so we explicitly skip when the user is typing in an input —
 * otherwise typing "go fishing" in a search box would trigger
 * `g`-then-other-letter chords.
 */
function bindGoChord(router: Router): void {
  if (typeof window === "undefined") return;
  const skipIfInInput = (handler: (event: KeyboardEvent) => void) => (event: KeyboardEvent) => {
    const t = event.target;
    if (
      t instanceof HTMLInputElement ||
      t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLElement && t.isContentEditable)
    ) {
      return;
    }
    handler(event);
  };
  const go = (path: string) => skipIfInInput(() => void router.push(path));
  tinykeys(window, {
    "g h": go("/"),
    "g b": go("/inbox"),
    "g i": go("/x/issues/"),
    "g p": go("/x/pulls/"),
    "g n": go("/new"),
  });
}
