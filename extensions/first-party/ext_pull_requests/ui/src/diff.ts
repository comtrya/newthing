/**
 * Unified-diff parser.
 *
 * Splits a single unified-diff patch into per-file entries with hunks,
 * line numbers, and +/- classification. Deliberately minimal — no
 * binary diff handling, no rename detection beyond the `diff --git`
 * header, no per-line word diff. Built to feed a clean view, not to
 * be a git library.
 */

export type DiffLineKind = "context" | "add" | "del" | "header" | "meta";

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
  oldNumber: number | null;
  newNumber: number | null;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  displayPath: string;
  status: "added" | "deleted" | "renamed" | "modified";
  language: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  binary: boolean;
}

const FILE_BREAK = /^diff --git a\/(.+?) b\/(.+)$/;
const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;

export function parseUnifiedDiff(patch: string): DiffFile[] {
  if (!patch) return [];
  const files: DiffFile[] = [];
  const lines = patch.split("\n");
  let current: DiffFile | null = null;
  let hunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  const flushHunk = () => {
    if (current && hunk) current.hunks.push(hunk);
    hunk = null;
  };
  const flushFile = () => {
    flushHunk();
    if (current) files.push(current);
    current = null;
  };

  for (const raw of lines) {
    const fileMatch = raw.match(FILE_BREAK);
    if (fileMatch) {
      flushFile();
      const [, oldPath, newPath] = fileMatch;
      current = {
        oldPath: oldPath ?? "",
        newPath: newPath ?? "",
        displayPath: newPath || oldPath || "",
        status: "modified",
        language: languageFromPath(newPath || oldPath || ""),
        hunks: [],
        additions: 0,
        deletions: 0,
        binary: false,
      };
      continue;
    }

    if (!current) continue;

    if (raw.startsWith("new file mode")) {
      current.status = "added";
      continue;
    }
    if (raw.startsWith("deleted file mode")) {
      current.status = "deleted";
      continue;
    }
    if (raw.startsWith("rename from") || raw.startsWith("rename to")) {
      current.status = "renamed";
      continue;
    }
    if (raw.startsWith("Binary files")) {
      current.binary = true;
      continue;
    }
    if (raw.startsWith("index ") || raw.startsWith("---") || raw.startsWith("+++")) {
      continue;
    }

    const hunkMatch = raw.match(HUNK_HEADER);
    if (hunkMatch) {
      flushHunk();
      const oldStart = Number(hunkMatch[1] ?? 0);
      const oldLines = Number(hunkMatch[2] ?? 1);
      const newStart = Number(hunkMatch[3] ?? 0);
      const newLines = Number(hunkMatch[4] ?? 1);
      hunk = {
        header: raw,
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: [],
      };
      oldLine = oldStart;
      newLine = newStart;
      continue;
    }

    if (!hunk) continue;

    if (raw.startsWith("+")) {
      hunk.lines.push({
        kind: "add",
        text: raw.slice(1),
        oldNumber: null,
        newNumber: newLine,
      });
      newLine += 1;
      current.additions += 1;
    } else if (raw.startsWith("-")) {
      hunk.lines.push({
        kind: "del",
        text: raw.slice(1),
        oldNumber: oldLine,
        newNumber: null,
      });
      oldLine += 1;
      current.deletions += 1;
    } else if (raw.startsWith("\\")) {
      hunk.lines.push({
        kind: "meta",
        text: raw,
        oldNumber: null,
        newNumber: null,
      });
    } else {
      hunk.lines.push({
        kind: "context",
        text: raw.startsWith(" ") ? raw.slice(1) : raw,
        oldNumber: oldLine,
        newNumber: newLine,
      });
      oldLine += 1;
      newLine += 1;
    }
  }
  flushFile();
  return files;
}

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  rs: "rust",
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  vue: "vue",
  py: "python",
  go: "go",
  md: "markdown",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  sh: "shell",
  css: "css",
  html: "html",
};

function languageFromPath(path: string): string {
  const dot = path.lastIndexOf(".");
  if (dot < 0) return "plain";
  const ext = path.slice(dot + 1).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] ?? "plain";
}

export function summarize(files: DiffFile[]): {
  files: number;
  additions: number;
  deletions: number;
} {
  let additions = 0;
  let deletions = 0;
  for (const file of files) {
    additions += file.additions;
    deletions += file.deletions;
  }
  return { files: files.length, additions, deletions };
}
