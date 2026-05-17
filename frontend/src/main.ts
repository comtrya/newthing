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
 * Two-key navigation chords backed by `tinykeys`. Some chords are
 * context-aware: when the user is inside a repo workbench
 * (`/r/<groups>/<repo>/...`) the destination scopes to that repo's
 * tab; outside a workbench they fall through to the workspace-wide
 * equivalent (or no-op when no workspace equivalent exists).
 *
 * tinykeys v3 fires on every keydown regardless of focus target,
 * so we explicitly skip when the user is typing in an input —
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
  /**
   * Best-effort extractor for the `/r/<groups>/<repo>` prefix of
   * the current route. Returns null when not on a workbench.
   * Stops at `/p/<project>` so project routes still bubble up to
   * the owning repo for `g i`/`g p` etc.
   */
  const repoBase = (): string | null => {
    const path = router.currentRoute.value.path;
    const match = /^(\/r\/[^/]+(?:\/[^/]+)+?)(\/(?:code|config|pulls|issues|checks|epics|p)(?:\/.*)?)?$/.exec(path);
    return match?.[1] ?? null;
  };
  const go = (path: string) => skipIfInInput(() => void router.push(path));
  /**
   * Build a chord that picks between a repo-scoped path (when on
   * a workbench) and a fallback. The fallback may be `null` for
   * chords that only make sense on a workbench — in that case the
   * chord no-ops off-workbench.
   */
  const scoped = (suffix: string, fallback: string | null) =>
    skipIfInInput(() => {
      const base = repoBase();
      if (base) {
        void router.push(`${base}${suffix}`);
        return;
      }
      if (fallback) void router.push(fallback);
    });
  tinykeys(window, {
    "g h": go("/"),
    "g b": go("/inbox"),
    "g n": go("/new"),
    "g o": scoped("", null),
    "g c": scoped("/code", null),
    "g i": scoped("/issues", "/x/issues/"),
    "g p": scoped("/pulls", "/x/pulls/"),
    "g e": scoped("/epics", null),
    "g k": scoped("/checks", null),
    "g f": scoped("/config", null),
  });
}
