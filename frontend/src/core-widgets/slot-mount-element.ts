import {
  subscribeWidgets,
  widgetsForSlot,
  type ResolvedWidget,
} from "@comtrya/sdk-core";
import { extensionElementContext } from "../extension-runtime";

export const CORE_SLOT_MOUNT_ELEMENT = "comtrya-slot-mount";

type ElementContext = Record<string, unknown>;

export interface CoreSlotMountElement extends HTMLElement {
  name?: string;
  label?: string;
  smokePrefix?: string;
  framed?: boolean;
  elementContext?: ElementContext;
}

export function defineCoreSlotMountElement(): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(CORE_SLOT_MOUNT_ELEMENT)) return;

  customElements.define(
    CORE_SLOT_MOUNT_ELEMENT,
    class extends HTMLElement implements CoreSlotMountElement {
      private currentName = "";
      private currentLabel = "";
      private currentSmokePrefix = "slot";
      private currentFramed = false;
      private currentElementContext: ElementContext = {};
      private unsubscribe?: () => void;

      static observedAttributes = ["name", "label"];

      get name(): string | undefined {
        return this.currentName || undefined;
      }

      set name(value: string | undefined) {
        this.currentName = value ?? "";
        this.render();
      }

      get label(): string | undefined {
        return this.currentLabel || undefined;
      }

      set label(value: string | undefined) {
        this.currentLabel = value ?? "";
        this.render();
      }

      get smokePrefix(): string | undefined {
        return this.currentSmokePrefix;
      }

      set smokePrefix(value: string | undefined) {
        this.currentSmokePrefix = value || "slot";
        this.render();
      }

      get framed(): boolean | undefined {
        return this.currentFramed;
      }

      set framed(value: boolean | undefined) {
        this.currentFramed = value === true;
        this.render();
      }

      get elementContext(): ElementContext | undefined {
        return this.currentElementContext;
      }

      set elementContext(value: ElementContext | undefined) {
        this.currentElementContext = isRecord(value) ? value : {};
        this.render();
      }

      connectedCallback(): void {
        this.syncAttributes();
        this.unsubscribe = subscribeWidgets((slot) => {
          if (slot === null || slot === this.currentName) this.render();
        });
        this.render();
      }

      disconnectedCallback(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
      }

      attributeChangedCallback(
        name: string,
        _oldValue: string | null,
        newValue: string | null,
      ): void {
        if (name === "name") this.currentName = newValue ?? "";
        if (name === "label") this.currentLabel = newValue ?? "";
        this.render();
      }

      private syncAttributes(): void {
        this.currentName = this.currentName || this.getAttribute("name") || "";
        this.currentLabel = this.currentLabel || this.getAttribute("label") || "";
      }

      private render(): void {
        if (!this.isConnected) return;
        const slotName = this.currentName;
        if (!slotName) {
          this.replaceChildren(buildPlaceholder("No slot name provided"));
          return;
        }
        const contributions = widgetsForSlot(slotName);
        if (this.currentFramed) {
          this.replaceChildren(this.buildFrame(contributions));
          return;
        }
        if (contributions.length === 0) {
          this.replaceChildren();
          return;
        }
        const nodes = contributions.map((entry) => this.buildContribution(entry));
        this.replaceChildren(...nodes);
        for (const node of nodes) this.applyContributionContext(node);
      }

      private buildFrame(contributions: ResolvedWidget[]): HTMLElement {
        const frame = document.createElement("section");
        frame.className = "slot-frame";
        frame.dataset.smoke = `${this.currentSmokePrefix}-${this.currentName}`;
        const heading = document.createElement("header");
        heading.className = "slot-heading";
        const title = document.createElement("h2");
        title.textContent = this.currentLabel || this.currentName;
        const code = document.createElement("code");
        code.textContent = this.currentName;
        heading.append(title, code);
        const mount = document.createElement("div");
        mount.className = "slot-mount";
        mount.dataset.extensionSlotMount = this.currentName;
        if (contributions.length === 0) {
          mount.append(buildPlaceholder("No extension claims this slot"));
        } else {
          const nodes = contributions.map((entry) => this.buildContribution(entry));
          mount.append(...nodes);
          for (const node of nodes) this.applyContributionContext(node);
        }
        frame.append(heading, mount);
        return frame;
      }

      private buildContribution(
        entry: ResolvedWidget,
      ): HTMLElement & Record<string, unknown> {
        const node = document.createElement(entry.element) as HTMLElement &
          Record<string, unknown>;
        node.addEventListener("comtrya-relationship-changed", (event) => {
          event.stopPropagation();
          this.dispatchEvent(new CustomEvent("comtrya-relationship-changed", {
            detail: (event as CustomEvent).detail,
            bubbles: true,
            composed: true,
          }));
        });
        node.dataset.extensionId = entry.extensionId;
        node.dataset.extensionSlot = this.currentName;
        this.applyContributionContext(node);
        return node;
      }

      private applyContributionContext(
        node: HTMLElement & Record<string, unknown>,
      ): void {
        node.extensionSlot = this.currentName;
        for (const [key, value] of Object.entries(extensionElementContext())) {
          syncContextAttribute(node, key, value);
          node[key] = value;
        }
        for (const [key, value] of Object.entries(this.currentElementContext)) {
          syncContextAttribute(node, key, value);
          node[key] = value;
        }
      }
    },
  );
}

function buildPlaceholder(message: string): HTMLElement {
  const node = document.createElement("article");
  node.className = "slot-placeholder";
  const label = document.createElement("span");
  label.textContent = message;
  node.append(label);
  return node;
}

function isRecord(value: unknown): value is ElementContext {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function syncContextAttribute(node: HTMLElement, key: string, value: unknown): void {
  const attribute = kebabCase(key);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    node.setAttribute(attribute, String(value));
  } else {
    node.removeAttribute(attribute);
  }
}

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
