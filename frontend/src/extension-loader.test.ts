import { describe, expect, test } from "bun:test";
import { _extensionLoaderTest, type InstalledExtension } from "./extension-loader";

const extension = (manifest: string): InstalledExtension => ({
  id: "ext_workspace_home",
  manifest,
  routePrefix: null,
  relationshipTypes: [],
});

describe("extension loader", () => {
  test("uses the kernel-provided forge-ui manifest URL", () => {
    expect(
      _extensionLoaderTest.manifestUrlFor(
        extension("/forge-ui/6578745f776f726b73706163655f686f6d65/meta.json"),
      ),
    ).toBe("/forge-ui/6578745f776f726b73706163655f686f6d65/meta.json");
  });

  test("rejects non-forge manifest URLs", () => {
    expect(() =>
      _extensionLoaderTest.manifestUrlFor(extension("/assets/ext_workspace_home.json"))
    ).toThrow("manifest must be served from /forge-ui/");
  });

  test("surfaces hung loader stages as bounded failures", async () => {
    await expect(
      _extensionLoaderTest.withTimeout(
        new Promise<string>(() => {}),
        1,
        "stage timed out",
      ),
    ).rejects.toThrow("stage timed out");
  });
});
