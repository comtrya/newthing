import { describe, expect, test } from "bun:test";
import { expressiveCodeLanguage, highlightRepoFile } from "./code-highlighter";

describe("expressiveCodeLanguage", () => {
  test("maps repository file kinds to Expressive Code language ids", () => {
    expect(expressiveCodeLanguage({ kind: "typescript", path: "src/main.ts" })).toBe("ts");
    expect(expressiveCodeLanguage({ kind: "javascript", path: "assets/index.js" })).toBe("js");
    expect(expressiveCodeLanguage({ kind: "markdown", path: "README.md" })).toBe("md");
    expect(expressiveCodeLanguage({ kind: "rust", path: "crates/server/src/main.rs" })).toBe("rust");
    expect(expressiveCodeLanguage({ kind: "cue", path: "comtrya.cue" })).toBe("cue");
    expect(expressiveCodeLanguage({ kind: "wit", path: "extensions/wit/comtrya/platform/world.wit" })).toBe("wit");
  });

  test("falls back to extensions when the backend kind is generic", () => {
    expect(expressiveCodeLanguage({ kind: "file", path: "src/App.vue" })).toBe("vue");
    expect(expressiveCodeLanguage({ kind: "file", path: "docs/example.mdx" })).toBe("mdx");
    expect(expressiveCodeLanguage({ kind: "file", path: "extensions/wit/world.wit" })).toBe("wit");
    expect(expressiveCodeLanguage({ kind: "file", path: "config/settings.yml" })).toBe("yaml");
  });

  test("uses plaintext for unknown file types", () => {
    expect(expressiveCodeLanguage({ kind: "file", path: "dist/archive.bin" })).toBe("plaintext");
    expect(expressiveCodeLanguage({ kind: "unknown", path: "LICENSE" })).toBe("plaintext");
  });

  test("escapes repository-controlled source before inserting highlighted HTML", async () => {
    const highlighted = await highlightRepoFile({
      kind: "typescript",
      path: "src/example.ts",
      preview: "<script>alert(1)</script>",
      size: 25,
    });

    expect(highlighted.html).toContain("expressive-code");
    expect(highlighted.html).not.toContain("<script>");
  });
});
