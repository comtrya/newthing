import { describe, expect, test } from "bun:test";

import { parseUnifiedDiff, summarize } from "./diff";

const SAMPLE_PATCH = `diff --git a/src/lib.rs b/src/lib.rs
index 0000001..0000002 100644
--- a/src/lib.rs
+++ b/src/lib.rs
@@ -1,5 +1,6 @@
 pub fn one() -> u32 { 1 }
+pub fn two() -> u32 { 2 }
 pub fn three() -> u32 {
-    3
+    3 + 0
 }
diff --git a/README.md b/README.md
new file mode 100644
index 0000000..0000003
--- /dev/null
+++ b/README.md
@@ -0,0 +1,2 @@
+# Title
+
diff --git a/deleted.txt b/deleted.txt
deleted file mode 100644
index 0000004..0000000
--- a/deleted.txt
+++ /dev/null
@@ -1 +0,0 @@
-gone
diff --git a/old.bin b/new.bin
similarity index 100%
rename from old.bin
rename to new.bin
Binary files a/old.bin and b/new.bin differ
`;

describe("parseUnifiedDiff", () => {
  test("returns no files for an empty patch", () => {
    expect(parseUnifiedDiff("")).toEqual([]);
  });

  test("splits the sample into four files", () => {
    const files = parseUnifiedDiff(SAMPLE_PATCH);
    expect(files.map((f) => f.displayPath)).toEqual([
      "src/lib.rs",
      "README.md",
      "deleted.txt",
      "new.bin",
    ]);
  });

  test("tags status from header lines (modified/added/deleted/renamed)", () => {
    const files = parseUnifiedDiff(SAMPLE_PATCH);
    expect(files.map((f) => f.status)).toEqual([
      "modified",
      "added",
      "deleted",
      "renamed",
    ]);
  });

  test("classifies lines into add/del/context with correct line numbers", () => {
    const [lib] = parseUnifiedDiff(SAMPLE_PATCH);
    const kinds = lib!.hunks[0]!.lines.map((l) => l.kind);
    // `pub fn one() -> u32 { 1 }` context, `pub fn two…` add,
    // `pub fn three() {` context, `3` del, `3 + 0` add, `}` context.
    expect(kinds).toEqual(["context", "add", "context", "del", "add", "context"]);
    expect(lib!.additions).toBe(2);
    expect(lib!.deletions).toBe(1);
  });

  test("flags binary diffs and skips parsing their body", () => {
    const files = parseUnifiedDiff(SAMPLE_PATCH);
    const bin = files.find((f) => f.displayPath === "new.bin");
    expect(bin?.binary).toBe(true);
  });

  test("infers language from the path extension", () => {
    const files = parseUnifiedDiff(SAMPLE_PATCH);
    expect(files.find((f) => f.displayPath === "src/lib.rs")?.language).toBe(
      "rust",
    );
    expect(files.find((f) => f.displayPath === "README.md")?.language).toBe(
      "markdown",
    );
    // `.txt` has no mapping → defaults to "plain"
    expect(files.find((f) => f.displayPath === "deleted.txt")?.language).toBe(
      "plain",
    );
  });

  test("preserves context-line text and old/new line numbers", () => {
    const [lib] = parseUnifiedDiff(SAMPLE_PATCH);
    const ctx = lib!.hunks[0]!.lines[0]!;
    expect(ctx.kind).toBe("context");
    expect(ctx.text).toBe("pub fn one() -> u32 { 1 }");
    expect(ctx.oldNumber).toBe(1);
    expect(ctx.newNumber).toBe(1);
  });
});

describe("summarize", () => {
  test("aggregates file count and additions/deletions across files", () => {
    const files = parseUnifiedDiff(SAMPLE_PATCH);
    const t = summarize(files);
    expect(t.files).toBe(4);
    // src/lib.rs (+2, -1) + README.md (+2, -0) + deleted.txt (+0, -1)
    // + new.bin (binary, +0, -0) = +4, -2
    expect(t.additions).toBe(4);
    expect(t.deletions).toBe(2);
  });

  test("handles empty input", () => {
    expect(summarize([])).toEqual({ files: 0, additions: 0, deletions: 0 });
  });
});
