import { describe, expect, test } from "bun:test";
import {
  directorySummary,
  entriesForPath,
  normalizePath,
  parentPath,
  type RepoFile,
} from "./code-browser-model";

const files: RepoFile[] = [
  { path: "README.md", size: 120, kind: "markdown", preview: "# Readme" },
  { path: "src/main.ts", size: 240, kind: "typescript", preview: "main()" },
  { path: "src/routes/RepoHome.vue", size: 512, kind: "vue", preview: "<template />" },
  { path: "src/routes/router.ts", size: 256, kind: "typescript", preview: "router" },
  { path: "Cargo.toml", size: 80, kind: "toml", preview: "[workspace]" },
];

describe("code browser directory model", () => {
  test("root entries group child directories before files", () => {
    expect(
      entriesForPath(files, "").map((entry) => ({
        type: entry.type,
        name: entry.name,
        path: entry.path,
      })),
    ).toEqual([
      { type: "directory", name: "src", path: "src" },
      { type: "file", name: "Cargo.toml", path: "Cargo.toml" },
      { type: "file", name: "README.md", path: "README.md" },
    ]);
  });

  test("nested entries keep browsing at one directory level", () => {
    expect(
      entriesForPath(files, "src").map((entry) => ({
        type: entry.type,
        name: entry.name,
        path: entry.path,
      })),
    ).toEqual([
      { type: "directory", name: "routes", path: "src/routes" },
      { type: "file", name: "main.ts", path: "src/main.ts" },
    ]);
  });

  test("directory summary distinguishes visible files from descendants", () => {
    expect(directorySummary(files, "src")).toBe("1 directory · 1 file shown · 3 total");
  });

  test("path helpers normalize slashes and return parent directories", () => {
    expect(normalizePath("/src/routes/")).toBe("src/routes");
    expect(parentPath("src/routes/RepoHome.vue")).toBe("src/routes");
    expect(parentPath("README.md")).toBe("");
  });
});
