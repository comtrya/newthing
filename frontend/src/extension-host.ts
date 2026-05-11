import type { ExtensionUiManifest, ComtryaClient } from "./contracts";
import { validateUiManifest } from "./contracts";

export interface ExtensionContext {
  comtryaClient: ComtryaClient;
  viewer: unknown;
  resource: string;
  routeParams: Record<string, string>;
  capabilities: Record<string, boolean>;
  data?: {
    slot?: string;
    workspace?: unknown;
    repository?: unknown;
    extensionInstallation?: unknown;
    extensionResolver?: unknown;
    extensionResolvers?: unknown[];
    activityEvents?: unknown[];
  };
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
      comtryaData?: ExtensionContext["data"];
      comtryaRepository?: unknown;
      extensionResolver?: unknown;
      extensionResolvers?: unknown[];
      extensionInstallation?: unknown;
      extensionSlot?: string;
    };
    element.comtryaClient = this.context.comtryaClient;
    element.viewer = this.context.viewer;
    element.resource = this.context.resource;
    element.routeParams = this.context.routeParams;
    element.capabilities = this.context.capabilities;
    element.comtryaData = this.context.data;
    element.comtryaRepository = this.context.data?.repository;
    element.extensionResolver = this.context.data?.extensionResolver;
    element.extensionResolvers = this.context.data?.extensionResolvers;
    element.extensionInstallation = this.context.data?.extensionInstallation;
    element.extensionSlot = slot?.slot;
    this.replaceChildren(element);
  }
}

customElements.define("comtrya-extension-host", ExtensionHostElement);
