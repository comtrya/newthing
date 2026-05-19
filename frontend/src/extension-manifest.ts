export interface UiManifestV2 {
  schemaVersion: "comtrya.ui-extension/v2";
  id: string;
  extension: string;
  version: string;
  publisher: string;
  assets: { entry: string; entryIntegrity: string; styles: string[] };
  permissions: string[];
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
  // Slot, route, and card declarations are runtime, not manifest.
  // `contributes.slots/routes/cards` (if present) is tolerated for
  // back-compat with not-yet-cleaned manifests but otherwise ignored.
  return m;
}
