import { afterEach, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  _resetCardsForTesting,
  registerCard,
} from "./card-registry";
import { defineResourceCardElement } from "./resource-card";

const originals = {
  window: globalThis.window,
  document: globalThis.document,
  customElements: globalThis.customElements,
  HTMLElement: globalThis.HTMLElement,
};

afterEach(() => {
  _resetCardsForTesting();
  globalThis.window = originals.window;
  globalThis.document = originals.document;
  globalThis.customElements = originals.customElements;
  globalThis.HTMLElement = originals.HTMLElement;
});

test("resource card re-renders when host context arrives after connection", () => {
  installDom();
  const client = { query: () => Promise.resolve({}) };

  customElements.define(
    "test-issue-card",
    class extends HTMLElement {
      private client?: unknown;

      get comtryaClient(): unknown {
        return this.client;
      }

      set comtryaClient(value: unknown) {
        this.client = value;
      }

      connectedCallback(): void {
        this.textContent = this.client ? "has client" : "no client";
      }
    },
  );
  registerCard({
    kind: "issue",
    element: "test-issue-card",
    extensionId: "ext_issues",
  });
  defineResourceCardElement();

  const card = document.createElement("comtrya-resource-card") as HTMLElement & {
    comtryaClient?: unknown;
  };
  card.setAttribute("ref", "comtrya://issue/iss_1");
  document.body.append(card);

  expect(card.textContent).toBe("no client");

  card.comtryaClient = client;

  const concrete = card.firstElementChild as HTMLElement & {
    comtryaClient?: unknown;
  };
  expect(concrete.tagName.toLowerCase()).toBe("test-issue-card");
  expect(card.textContent).toBe("has client");
  expect(concrete.comtryaClient).toBe(client);
});

function installDom(): void {
  const window = new Window();
  globalThis.window = window as unknown as typeof globalThis.window;
  globalThis.document = window.document as unknown as typeof globalThis.document;
  globalThis.customElements = window.customElements as unknown as typeof globalThis.customElements;
  globalThis.HTMLElement = window.HTMLElement as unknown as typeof globalThis.HTMLElement;
}
