export type Visibility = "PUBLIC" | "INTERNAL" | "PRIVATE";

export interface EventFilter {
  resource?: string;
  types?: string[];
  visibility?: Visibility[];
}

export interface ForgepointEvent {
  id: string;
  type: string;
  source: string;
  visibility: Visibility;
  data: unknown;
}

export interface ForgepointClient {
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
  events(filter?: EventFilter, opts?: { signal?: AbortSignal }): AsyncIterable<ForgepointEvent>;
  navigate(path: string, opts?: { replace?: boolean }): void;
  toast(level: "info" | "success" | "warn" | "error", message: string): void;
}

export interface ExtensionUiManifest {
  schemaVersion: "forgepoint.ui-extension/v1";
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
  if (manifest.schemaVersion !== "forgepoint.ui-extension/v1") {
    throw new Error("unsupported UI extension manifest schema");
  }
  if (!manifest.assets.entry.startsWith("/_extensions/")) {
    throw new Error("extension entry must be served by the Rust asset API");
  }
  if (!manifest.assets.entryIntegrity?.startsWith("sha256-")) {
    throw new Error("extension entry must advertise a sha256 integrity value");
  }
  for (const route of manifest.routes) {
    if (route.path.startsWith("/_")) {
      throw new Error("extension routes cannot use reserved paths");
    }
  }
}
