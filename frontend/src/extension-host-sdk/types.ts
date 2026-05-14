import type { ComtryaClient } from "../contracts";

export type SlotName =
  | "home.your-work"
  | "home.your-issues"
  | "home.your-epics"
  | "home.repositories"
  | "home.activity"
  | "home.instance"
  | "workspace.home.top"
  | "workspace.home.left"
  | "workspace.home.center"
  | "workspace.home.right"
  | "repository.overview"
  | "repository.code"
  | "repository.checks"
  | "repository.issues"
  | "workspace.issues"
  | "workspace.epics";

export const KNOWN_SLOT_NAMES: ReadonlySet<SlotName> = new Set([
  "home.your-work",
  "home.your-issues",
  "home.your-epics",
  "home.repositories",
  "home.activity",
  "home.instance",
  "workspace.home.top",
  "workspace.home.left",
  "workspace.home.center",
  "workspace.home.right",
  "repository.overview",
  "repository.code",
  "repository.checks",
  "repository.issues",
  "workspace.issues",
  "workspace.epics",
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

/**
 * A resource-card renderer. One contribution per `resourceKind` per
 * extension; the kernel picks one winner per kind (extension override
 * beats core default; see CardRegistry).
 */
export interface CardContribution {
  resourceKind: string;
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
  registerCard(contribution: CardContribution): Disposable;
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
  /** Resource kinds the extension is allowed to register card renderers for. */
  cardKinds: ReadonlySet<string>;
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

export interface ResolvedCard {
  extensionId: string;
  resourceKind: string;
  element: string;
  requiredPermission: string;
}
