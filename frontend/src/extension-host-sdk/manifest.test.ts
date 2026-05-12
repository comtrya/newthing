import { describe, expect, test } from "bun:test";
import { parseManifest, type UiManifestV2 } from "./manifest";

const VALID: UiManifestV2 = {
  schemaVersion: "comtrya.ui-extension/v2",
  id: "ext_workspace_home",
  extension: "workspace-home",
  version: "0.1.0",
  publisher: "comtrya-dev",
  assets: { entry: "/_extensions/ext_workspace_home/assets/index.js", entryIntegrity: "sha256-abc", styles: [] },
  permissions: ["workspace.read"],
  contributes: { slots: ["home.your-work"], routes: false },
};

describe("parseManifest", () => {
  test("accepts a valid v2 manifest", () => {
    const r = parseManifest(VALID);
    expect(r.id).toBe("ext_workspace_home");
    expect(r.contributes.slots).toEqual(["home.your-work"]);
  });

  test("rejects v1 schema version", () => {
    expect(() => parseManifest({ ...VALID, schemaVersion: "comtrya.ui-extension/v1" as never }))
      .toThrow(/v1 manifest is deprecated/);
  });

  test("rejects unknown slot in contributes.slots", () => {
    expect(() => parseManifest({ ...VALID, contributes: { slots: ["bogus"], routes: false } }))
      .toThrow(/unknown slot.*bogus/);
  });

  test("rejects entry path not under /_extensions/", () => {
    expect(() => parseManifest({ ...VALID, assets: { ...VALID.assets, entry: "/foo.js" } }))
      .toThrow(/entry must be served by the Rust asset API/);
  });

  test("rejects missing entryIntegrity", () => {
    expect(() => parseManifest({ ...VALID, assets: { ...VALID.assets, entryIntegrity: "" } }))
      .toThrow(/entryIntegrity/);
  });

  test("requires at least one of slots or routes in contributes", () => {
    expect(() => parseManifest({ ...VALID, contributes: { slots: [], routes: false } }))
      .toThrow(/must declare at least one of slots or routes/);
  });

  test("rejects non-string id", () => {
    expect(() => parseManifest({ ...VALID, id: 42 as never }))
      .toThrow(/non-empty string id/);
  });

  test("rejects non-string permission entries", () => {
    expect(() => parseManifest({ ...VALID, permissions: ["valid", 42 as never] }))
      .toThrow(/permissions must be an array of strings/);
  });
});
