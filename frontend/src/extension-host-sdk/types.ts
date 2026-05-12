import type { ComtryaClient } from "../contracts";

export type SlotName =
  | "home.your-work"
  | "home.repositories"
  | "home.activity"
  | "home.instance"
  | "repository.overview"
  | "repository.code"
  | "repository.checks";

export const KNOWN_SLOT_NAMES: ReadonlySet<SlotName> = new Set([
  "home.your-work",
  "home.repositories",
  "home.activity",
  "home.instance",
  "repository.overview",
  "repository.code",
  "repository.checks",
]);

export interface SlotContribution {
  element: string;
  requiredPermission: string;
  priority?: number;
}

export interface RouteContribution {
  element: string;
  requiredPermission: string;
}

export interface Disposable {
  dispose(): void;
}

export interface ViewerHandle {
  authenticated: boolean;
  permissions: string[];
}

export interface ExtensionHost {
  readonly client: ComtryaClient;
  readonly viewer: ViewerHandle;
  readonly capabilities: Record<string, boolean>;
  registerSlot(name: SlotName, contribution: SlotContribution): Disposable;
  registerRoute(path: string, contribution: RouteContribution): Disposable;
}

export interface ExtensionDefinition {
  id: string;
  setup: (host: ExtensionHost) => void | Promise<void>;
}

export interface ExtensionAllowlist {
  extensionId: string;
  routePrefix: string | null;
  permissions: ReadonlySet<string>;
  slots: ReadonlySet<SlotName>;
  routesAllowed: boolean;
}

export interface ResolvedSlot {
  extensionId: string;
  element: string;
  requiredPermission: string;
  priority: number;
}

export interface ResolvedRoute {
  extensionId: string;
  routePrefix: string;
  path: string;
  element: string;
  requiredPermission: string;
}
