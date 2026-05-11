import type { ExtensionUiManifest, ForgepointClient } from "./contracts";
import { validateUiManifest } from "./contracts";

export interface ExtensionContext {
  forgepointClient: ForgepointClient;
  viewer: unknown;
  resource: string;
  routeParams: Record<string, string>;
  capabilities: Record<string, boolean>;
}

export class ExtensionHostElement extends HTMLElement {
  private manifest?: ExtensionUiManifest;
  private context?: ExtensionContext;

  configure(manifest: ExtensionUiManifest, context: ExtensionContext): void {
    validateUiManifest(manifest);
    this.manifest = manifest;
    this.context = context;
    this.render();
  }

  private render(): void {
    if (!this.manifest || !this.context) {
      return;
    }
    const route = this.manifest.routes[0];
    if (!route) {
      this.replaceChildren();
      return;
    }
    const element = document.createElement(route.element) as HTMLElement & {
      forgepointClient?: ForgepointClient;
      viewer?: unknown;
      resource?: string;
      routeParams?: Record<string, string>;
      capabilities?: Record<string, boolean>;
    };
    element.forgepointClient = this.context.forgepointClient;
    element.viewer = this.context.viewer;
    element.resource = this.context.resource;
    element.routeParams = this.context.routeParams;
    element.capabilities = this.context.capabilities;
    this.replaceChildren(element);
  }
}

customElements.define("forgepoint-extension-host", ExtensionHostElement);
