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
import { defineCoreCommentThread } from "./core-widgets/comment-thread";
import { defineCoreSlotMountElement } from "./core-widgets/slot-mount-element";
import { loadShellExtensions } from "./extension-loader";
import { installIssueRefHover } from "./issue-ref-hover";
import { bindProjectCommands } from "./project-commands";
import { registerRepositoryShellSlots } from "./repository-slots";
import { createShellRouter } from "./router";
import { assertWorkspaceSdkDepsLinked } from "./workspace-deps";

assertWorkspaceSdkDepsLinked();
defineResourceCardElement();
defineInlineEditElement();
defineSkeletonElement();
defineCoreCommentThread();
defineCoreSlotMountElement();
registerRepositoryShellSlots();
bindGlobalShortcut();
installIssueRefHover();
const router = createShellRouter();
registerNavigationCommands(router);
bindGoChord(router);
bindProjectCommands(router);
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
    title: "Open workspace issues",
    category: "Navigation",
    shortcut: "g i",
    extensionId: "core",
    run: () => {
      void router.push("/x/issues/");
    },
  });
  registerCommand({
    id: "core.pulls",
    title: "Open workspace pull requests",
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
  const isInInput = (t: EventTarget | null): boolean =>
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    (t instanceof HTMLElement && t.isContentEditable);
  const skipIfInInput = (handler: (event: KeyboardEvent) => void) => (event: KeyboardEvent) => {
    if (isInInput(event.target)) return;
    handler(event);
  };
  /**
   * tinykeys fires both the sequence handler (`g c`) and the
   * standalone handler (`c`) on the second keypress of a chord.
   * To make the single-key create shortcut composable with the
   * `g <letter>` chord layer, we stamp the keyboard event itself
   * in the capture phase: pressing `g` arms a 1050 ms single-use
   * lock; the next non-`g` keydown inside that window gets a
   * `__chordSecond` marker and disarms the lock. Standalone
   * handlers skip when their event carries the marker. The lock
   * matches tinykeys' default 1 s chord timeout so a standalone
   * key pressed long after a stray `g` still fires normally.
   */
  let gChordLockUntil = 0;
  const CHORD_SECOND_FLAG = "__comtryaChordSecond";
  type StampedEvent = KeyboardEvent & { [CHORD_SECOND_FLAG]?: boolean };
  window.addEventListener(
    "keydown",
    (event) => {
      const now = Date.now();
      if (event.key === "g" && !isInInput(event.target)) {
        gChordLockUntil = now + 1050;
        return;
      }
      if (now < gChordLockUntil) {
        (event as StampedEvent)[CHORD_SECOND_FLAG] = true;
        gChordLockUntil = 0;
      }
    },
    true,
  );
  const skipDuringGChord = (handler: (event: KeyboardEvent) => void) =>
    skipIfInInput((event) => {
      if ((event as StampedEvent)[CHORD_SECOND_FLAG]) return;
      handler(event);
    });
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
  /**
   * Single-key `c` ("create") routes to the create form for whatever
   * the user is currently looking at — but only on surfaces that
   * don't already own a `c` handler. The issues / epics LIST routes
   * mount IssuesList / EpicsList, both of which bind `c` to focus
   * an inline quick-add (Linear-style); the inline path is faster
   * than navigating to a separate form, so we defer to the component
   * by returning null. The DETAIL routes (e.g. `/x/issues/<ws>/<n>`)
   * and the Inbox don't have a quick-add — `c` there means "create
   * a new one of the same kind". Everywhere else, no-op.
   *
   * `c` (not `n`) so it doesn't collide with the `g n` chord —
   * tinykeys fires both the sequence and the standalone last key,
   * which would double-route every `g n` press.
   */
  const ISSUE_LIST = /^\/(?:r\/.+?\/issues|x\/issues)\/?$/;
  const EPIC_LIST = /^\/(?:r\/.+?\/epics|x\/epics)\/?$/;
  const ISSUE_DETAIL_OR_SUB = /^\/(?:r\/.+?\/issues|x\/issues)\//;
  const EPIC_DETAIL_OR_SUB = /^\/(?:r\/.+?\/epics|x\/epics)\//;
  const currentCreateTarget = (): string | null => {
    const path = router.currentRoute.value.path;
    if (path === "/x/issues/new" || path === "/x/epics/new") return null;
    if (ISSUE_LIST.test(path) || EPIC_LIST.test(path)) return null;
    if (ISSUE_DETAIL_OR_SUB.test(path)) return "/x/issues/new";
    if (EPIC_DETAIL_OR_SUB.test(path)) return "/x/epics/new";
    if (path === "/inbox") return "/x/issues/new";
    return null;
  };
  /**
   * Where a comment-thread composer is mounted (IssueDetail,
   * PullsDetail, EpicDetail) the create chord should focus its
   * textarea instead of navigating away — composing a reply is the
   * natural "create" verb on a detail page, and the iter 41 default
   * of routing to `/x/issues/new` left the reviewer stranded mid-
   * thought. Use the smoke hook the comment-thread composer
   * already stamps on its form.
   */
  const focusVisibleComposer = (): boolean => {
    if (typeof document === "undefined") return false;
    const composer = document.querySelector<HTMLElement>(
      '[data-smoke="comment-thread-composer"]',
    );
    const textarea = composer?.querySelector<HTMLTextAreaElement>("textarea");
    if (!textarea) return false;
    textarea.focus();
    // Scroll so the composer is visible when the page is taller than
    // the viewport (detail pages usually are).
    textarea.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  };
  const createOnSurface = skipDuringGChord(() => {
    if (focusVisibleComposer()) return;
    const target = currentCreateTarget();
    if (target) void router.push(target);
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
    "c": createOnSurface,
  });
}
