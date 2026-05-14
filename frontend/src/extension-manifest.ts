const KNOWN_SLOT_NAMES = new Set([
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

export interface UiManifestCardEntry {
  resourceKind: string;
  element: string;
}

export interface UiManifestV2 {
  schemaVersion: "comtrya.ui-extension/v2";
  id: string;
  extension: string;
  version: string;
  publisher: string;
  assets: { entry: string; entryIntegrity: string; styles: string[] };
  permissions: string[];
  contributes: {
    slots: string[];
    routes: boolean;
    cards?: UiManifestCardEntry[];
  };
}

export function parseManifest(input: unknown): UiManifestV2 {
  if (!input || typeof input !== "object") throw new Error("manifest must be an object");
  const raw = input as Record<string, unknown>;
  if (raw.schemaVersion === "comtrya.ui-extension/v1") {
    throw new Error("v1 manifest is deprecated — migrate to comtrya.ui-extension/v2");
  }
  if (raw.schemaVersion !== "comtrya.ui-extension/v2") {
    throw new Error(`unsupported manifest schemaVersion: ${String(raw.schemaVersion)}`);
  }
  const m = input as UiManifestV2;
  if (typeof m.id !== "string" || m.id.length === 0) {
    throw new Error("manifest must include a non-empty string id");
  }
  if (!m.assets?.entry?.startsWith("/_extensions/")) {
    throw new Error("entry must be served by the Rust asset API at /_extensions/");
  }
  if (!m.assets.entryIntegrity?.startsWith("sha256-")) {
    throw new Error("entryIntegrity must be a sha256-prefixed value");
  }
  if (!Array.isArray(m.permissions) || !m.permissions.every((p) => typeof p === "string")) {
    throw new Error("permissions must be an array of strings");
  }
  if (!m.contributes || typeof m.contributes !== "object") throw new Error("contributes block is required");
  if (!Array.isArray(m.contributes.slots)) throw new Error("contributes.slots must be an array of slot names");
  if (typeof m.contributes.routes !== "boolean") throw new Error("contributes.routes must be a boolean");
  const hasCards = Array.isArray(m.contributes.cards) && m.contributes.cards.length > 0;
  if (m.contributes.slots.length === 0 && !m.contributes.routes && !hasCards) {
    throw new Error("manifest must declare at least one of slots, routes, or cards in contributes");
  }
  for (const slot of m.contributes.slots) {
    if (!KNOWN_SLOT_NAMES.has(slot)) {
      throw new Error(`unknown slot name "${slot}" in contributes.slots`);
    }
  }
  if (m.contributes.cards !== undefined) {
    if (!Array.isArray(m.contributes.cards)) {
      throw new Error("contributes.cards must be an array");
    }
    for (const card of m.contributes.cards) {
      if (
        !card ||
        typeof card !== "object" ||
        typeof card.resourceKind !== "string" ||
        typeof card.element !== "string" ||
        card.resourceKind.length === 0 ||
        card.element.length === 0
      ) {
        throw new Error(
          'each contributes.cards entry must be { resourceKind: string, element: string }',
        );
      }
    }
  }
  return m;
}
