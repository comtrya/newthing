import { cardFor } from "./card-registry";

const RESOURCE_CARD_TAG = "comtrya-resource-card";

export interface ResourceCardElement extends HTMLElement {
  ref?: string;
  comtryaClient?: unknown;
  viewer?: unknown;
  capabilities?: unknown;
}

export function defineResourceCardElement(): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(RESOURCE_CARD_TAG)) return;

  customElements.define(
    RESOURCE_CARD_TAG,
    class extends HTMLElement implements ResourceCardElement {
      static observedAttributes = ["ref"];
      private currentRef?: string;
      private currentComtryaClient?: unknown;
      private currentViewer?: unknown;
      private currentCapabilities?: unknown;

      get ref(): string | undefined {
        return this.currentRef;
      }

      set ref(value: string | undefined) {
        const next = value || undefined;
        if (this.currentRef === next) return;
        this.currentRef = next;
        if (this.isConnected) this.render();
      }

      get comtryaClient(): unknown {
        return this.currentComtryaClient;
      }

      set comtryaClient(value: unknown) {
        if (this.currentComtryaClient === value) return;
        this.currentComtryaClient = value;
        if (this.isConnected) this.render();
      }

      get viewer(): unknown {
        return this.currentViewer;
      }

      set viewer(value: unknown) {
        if (this.currentViewer === value) return;
        this.currentViewer = value;
        if (this.isConnected) this.render();
      }

      get capabilities(): unknown {
        return this.currentCapabilities;
      }

      set capabilities(value: unknown) {
        if (this.currentCapabilities === value) return;
        this.currentCapabilities = value;
        if (this.isConnected) this.render();
      }

      connectedCallback(): void {
        this.syncRefFromAttribute();
        this.render();
      }

      attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null,
      ): void {
        if (name !== "ref") return;
        if (oldValue === newValue) return;
        this.currentRef = newValue ?? undefined;
        if (this.isConnected) this.render();
      }

      private syncRefFromAttribute(): void {
        if (this.currentRef) return;
        this.currentRef = this.getAttribute("ref") ?? undefined;
      }

      private render(): void {
        const ref = this.currentRef;
        if (!ref) {
          this.replaceChildren(buildFallback("missing resource ref"));
          return;
        }

        if (this.hasAncestorWithRef(ref)) {
          this.replaceChildren(buildCompactRef(ref));
          return;
        }

        const kind = parseKindFromUri(ref);
        if (!kind) {
          this.replaceChildren(buildFallback(`malformed resource ref: ${ref}`));
          return;
        }

        const contribution = cardFor(kind);
        if (!contribution) {
          this.replaceChildren(buildFallback(`no renderer for ${kind}`));
          return;
        }

        const node = document.createElement(contribution.element) as HTMLElement & {
          ref?: string;
          comtryaClient?: unknown;
          viewer?: unknown;
          capabilities?: unknown;
        };
        node.ref = ref;
        node.comtryaClient = this.currentComtryaClient;
        node.viewer = this.currentViewer;
        node.capabilities = this.currentCapabilities;
        node.setAttribute("ref", ref);
        this.replaceChildren(node);
      }

      private hasAncestorWithRef(ref: string): boolean {
        let cursor = this.parentElement;
        while (cursor) {
          if (cursor.tagName.toLowerCase() === RESOURCE_CARD_TAG) {
            const other = (cursor as ResourceCardElement).ref;
            if (other === ref || cursor.getAttribute("ref") === ref) return true;
          }
          cursor = cursor.parentElement;
        }
        return false;
      }
    },
  );
}

function parseKindFromUri(uri: string): string | null {
  if (!uri.startsWith("comtrya://")) return null;
  const rest = uri.slice("comtrya://".length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  const kind = rest.slice(0, slash);
  return /^[a-z0-9_-]+$/.test(kind) ? kind : null;
}

function buildFallback(message: string): HTMLElement {
  const node = document.createElement("span");
  node.dataset.comtryaResourceCardFallback = "true";
  node.textContent = message;
  return node;
}

function buildCompactRef(ref: string): HTMLElement {
  const node = document.createElement("span");
  node.dataset.comtryaResourceCardCompact = "true";
  node.textContent = ref;
  return node;
}
