import type { ExtensionUiManifest, ComtryaClient } from "./contracts";
import { validateUiManifest } from "./contracts";

export interface ExtensionContext {
  comtryaClient: ComtryaClient;
  viewer: unknown;
  resource: string;
  routeParams: Record<string, string>;
  capabilities: Record<string, boolean>;
}

export class ExtensionHostElement extends HTMLElement {
  private manifest?: ExtensionUiManifest;
  private context?: ExtensionContext;
  private slotName?: string;

  configure(manifest: ExtensionUiManifest, context: ExtensionContext, slotName?: string): void {
    validateUiManifest(manifest);
    this.manifest = manifest;
    this.context = context;
    this.slotName = slotName;
    this.render();
  }

  private render(): void {
    if (!this.manifest || !this.context) {
      return;
    }
    const slot = this.slotName
      ? this.manifest.slots.find((candidate) => candidate.slot === this.slotName)
      : this.manifest.slots[0];
    const route = this.manifest.routes[0];
    const elementName = slot?.element ?? route?.element;
    if (!elementName) {
      this.replaceChildren();
      return;
    }
    const element = document.createElement(elementName) as HTMLElement & {
      comtryaClient?: ComtryaClient;
      viewer?: unknown;
      resource?: string;
      routeParams?: Record<string, string>;
      capabilities?: Record<string, boolean>;
    };
    element.comtryaClient = this.context.comtryaClient;
    element.viewer = this.context.viewer;
    element.resource = this.context.resource;
    element.routeParams = this.context.routeParams;
    element.capabilities = this.context.capabilities;
    this.replaceChildren(element);
  }
}

customElements.define("comtrya-extension-host", ExtensionHostElement);
