import { Window } from "happy-dom";
import { beforeEach } from "bun:test";

const window = new Window();
const g = globalThis as Record<string, unknown>;
g.window = window;
g.document = window.document;
g.HTMLElement = window.HTMLElement;
g.Node = window.Node;
g.Text = window.Text;
g.MouseEvent = window.MouseEvent;
g.Event = window.Event;
g.localStorage = window.localStorage;
g.customElements = window.customElements;

// Reset DOM state between tests so shared-Window pollution doesn't bite Tasks 18-22.
beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-theme");
  if (window.localStorage) window.localStorage.clear();
});
