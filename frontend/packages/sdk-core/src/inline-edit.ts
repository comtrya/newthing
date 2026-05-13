/**
 * `<comtrya-inline-edit>` — framework-agnostic in-place editor.
 *
 * Attributes:
 *   value      — current value (string)
 *   placeholder — placeholder text
 *
 * Events:
 *   commit     — fires with `{ value }` when the user confirms (Enter/blur)
 *   cancel     — fires when the user presses Esc
 *
 * Extensions wire it to an op via:
 *   el.addEventListener('commit', e => invokeOp(...))
 */

export interface InlineEditElement extends HTMLElement {
  value: string;
}

export function defineInlineEditElement(): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get("comtrya-inline-edit")) return;
  customElements.define(
    "comtrya-inline-edit",
    class extends HTMLElement implements InlineEditElement {
      static observedAttributes = ["value", "placeholder"];
      private input?: HTMLInputElement;
      private span?: HTMLSpanElement;
      private editing = false;
      get value(): string {
        return this.getAttribute("value") ?? "";
      }
      set value(v: string) {
        this.setAttribute("value", v);
      }
      connectedCallback() {
        this.render();
      }
      attributeChangedCallback() {
        this.render();
      }
      private render() {
        if (this.editing) return;
        this.replaceChildren();
        this.span = document.createElement("span");
        this.span.className = "comtrya-inline-edit-display";
        this.span.textContent =
          this.value || this.getAttribute("placeholder") || "";
        this.span.tabIndex = 0;
        this.span.addEventListener("click", () => this.beginEdit());
        this.span.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.beginEdit();
          }
        });
        this.appendChild(this.span);
      }
      private beginEdit() {
        this.editing = true;
        this.replaceChildren();
        this.input = document.createElement("input");
        this.input.value = this.value;
        this.input.className = "comtrya-inline-edit-input";
        this.input.addEventListener("blur", () => this.commit());
        this.input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            this.cancel();
          }
        });
        this.appendChild(this.input);
        this.input.focus();
        this.input.select();
      }
      private commit() {
        if (!this.input || !this.editing) return;
        const next = this.input.value;
        this.editing = false;
        const changed = next !== this.value;
        this.value = next;
        if (changed) {
          this.dispatchEvent(
            new CustomEvent("commit", { detail: { value: next }, bubbles: true }),
          );
        }
        this.render();
      }
      private cancel() {
        this.editing = false;
        this.dispatchEvent(new CustomEvent("cancel", { bubbles: true }));
        this.render();
      }
    },
  );
}
