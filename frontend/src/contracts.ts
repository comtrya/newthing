export type Visibility = "PUBLIC" | "INTERNAL" | "PRIVATE";

export interface EventFilter {
  resource?: string;
  types?: string[];
  visibility?: Visibility[];
}

export interface ComtryaEvent {
  id: string;
  type: string;
  source: string;
  visibility: Visibility;
  data: unknown;
}

export interface ComtryaClient {
  query<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): Promise<TData>;
  mutate<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): Promise<TData>;
  subscribe<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): AsyncIterable<TData>;
  permissions(resourceURN: string): Promise<string[]>;
  events(filter?: EventFilter, opts?: { signal?: AbortSignal }): AsyncIterable<ComtryaEvent>;
  navigate(path: string, opts?: { replace?: boolean }): void;
  toast(level: "info" | "success" | "warn" | "error", message: string): void;
}

export interface ExtensionUiManifest {
  schemaVersion: "comtrya.ui-extension/v1";
  id: string;
  extension: string;
  assets: {
    entry: string;
    entryIntegrity?: string;
    styles: string[];
  };
  routes: Array<{
    path: string;
    element: string;
    requiredPermission: string;
  }>;
  slots: Array<{
    slot: string;
    element: string;
    requiredPermission: string;
  }>;
}

export function validateUiManifest(manifest: ExtensionUiManifest): void {
  if (manifest.schemaVersion !== "comtrya.ui-extension/v1") {
    throw new Error("unsupported UI extension manifest schema");
  }
  if (!manifest.id) {
    throw new Error("extension manifest must include an id");
  }
  if (!manifest.assets.entry.startsWith("/_extensions/")) {
    throw new Error("extension entry must be served by the Rust asset API");
  }
  if (!manifest.assets.entryIntegrity?.startsWith("sha256-")) {
    throw new Error("extension entry must advertise a sha256 integrity value");
  }
  if (manifest.slots.length === 0) {
    throw new Error("extension manifest must declare at least one slot");
  }
  for (const route of manifest.routes) {
    if (route.path.startsWith("/_")) {
      throw new Error("extension routes cannot use reserved paths");
    }
  }
  for (const slot of manifest.slots) {
    if (!slot.slot || !slot.element) {
      throw new Error("extension slots must include a slot name and element");
    }
  }
}
