import { Window } from "happy-dom";
const window = new Window();
globalThis.document = window.document as never;
globalThis.HTMLElement = window.HTMLElement as never;
globalThis.Node = window.Node as never;
globalThis.Text = window.Text as never;
