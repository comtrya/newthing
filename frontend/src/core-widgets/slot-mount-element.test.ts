import { afterEach, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { setExtensionRuntimeContext } from "../extension-runtime";
import {
  _resetWidgetsForTesting,
  registerWidget,
} from "../../packages/sdk-core/src/widget-registry";
import { defineCoreSlotMountElement } from "./slot-mount-element";

const originals = {
  window: globalThis.window,
  document: globalThis.document,
  customElements: globalThis.customElements,
  HTMLElement: globalThis.HTMLElement,
  CustomEvent: globalThis.CustomEvent,
};

afterEach(() => {
  _resetWidgetsForTesting();
  globalThis.window = originals.window;
  globalThis.document = originals.document;
  globalThis.customElements = originals.customElements;
  globalThis.HTMLElement = originals.HTMLElement;
  globalThis.CustomEvent = originals.CustomEvent;
});

test("core slot mount renders registered widgets with shell and element context", () => {
  installDom();
  const client = { query: () => Promise.resolve({}), mutate: () => Promise.resolve({}) };
  setExtensionRuntimeContext({
    client,
    viewer: { authenticated: true, permissions: ["epics.write"] },
    capabilities: { graphql: true },
  });

  customElements.define(
    "test-issue-sidebar-widget",
    class extends HTMLElement {
      set issue(value: { id?: string } | undefined) {
        this.dataset.issueId = value?.id ?? "";
      }

      set comtryaClient(value: unknown) {
        this.dataset.hasClient = value === client ? "yes" : "no";
      }

      connectedCallback(): void {
        this.textContent = `${this.dataset.issueId}:${this.dataset.hasClient}`;
      }
    },
  );
  registerWidget({
    id: "ext_epics:issue-epic-linker",
    extensionId: "ext_epics",
    element: "test-issue-sidebar-widget",
    defaultSlot: "issue.detail.sidebar",
  });
  defineCoreSlotMountElement();

  const mount = document.createElement("comtrya-slot-mount") as HTMLElement & {
    name?: string;
    elementContext?: Record<string, unknown>;
  };
  mount.name = "issue.detail.sidebar";
  mount.elementContext = { issue: { id: "iss_1" } };
  document.body.append(mount);

  const widget = mount.firstElementChild as HTMLElement;
  expect(widget.tagName.toLowerCase()).toBe("test-issue-sidebar-widget");
  expect(widget.dataset.extensionId).toBe("ext_epics");
  expect(widget.dataset.extensionSlot).toBe("issue.detail.sidebar");
  expect(widget.dataset.issueId).toBe("iss_1");
  expect(widget.dataset.hasClient).toBe("yes");
});

test("core slot mount forwards relationship change events from widgets", () => {
  installDom();
  setExtensionRuntimeContext({
    client: { query: () => Promise.resolve({}), mutate: () => Promise.resolve({}) },
    viewer: { authenticated: true, permissions: ["epics.write"] },
    capabilities: { graphql: true },
  });

  customElements.define(
    "test-relationship-widget",
    class extends HTMLElement {
      connectedCallback(): void {
        this.dispatchEvent(new CustomEvent("comtrya-relationship-changed", {
          detail: { source: "test-widget", action: "created" },
        }));
      }
    },
  );
  registerWidget({
    id: "ext_epics:relationship-widget",
    extensionId: "ext_epics",
    element: "test-relationship-widget",
    defaultSlot: "issue.detail.sidebar",
  });
  defineCoreSlotMountElement();

  const mount = document.createElement("comtrya-slot-mount") as HTMLElement & {
    name?: string;
  };
  let detail: unknown;
  mount.addEventListener("comtrya-relationship-changed", (event) => {
    detail = (event as CustomEvent).detail;
  });
  mount.name = "issue.detail.sidebar";
  document.body.append(mount);

  expect(detail).toEqual({ source: "test-widget", action: "created" });
});

function installDom(): void {
  const window = new Window();
  globalThis.window = window as unknown as typeof globalThis.window;
  globalThis.document = window.document as unknown as typeof globalThis.document;
  globalThis.customElements = window.customElements as unknown as typeof globalThis.customElements;
  globalThis.HTMLElement = window.HTMLElement as unknown as typeof globalThis.HTMLElement;
  globalThis.CustomEvent = window.CustomEvent as unknown as typeof globalThis.CustomEvent;
}
