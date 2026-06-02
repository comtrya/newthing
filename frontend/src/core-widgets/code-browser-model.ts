export interface RepoFile {
  path: string;
  size: number;
  kind: string;
  preview?: string | null;
}

export interface DirectoryEntry {
  type: "directory";
  name: string;
  path: string;
  fileCount: number;
}

export interface FileEntry {
  type: "file";
  name: string;
  path: string;
  file: RepoFile;
}

export type BrowserEntry = DirectoryEntry | FileEntry;

export function entriesForPath(files: RepoFile[], path: string): BrowserEntry[] {
  const currentParts = splitPath(path);
  const directories = new Map<string, DirectoryEntry>();
  const entries: BrowserEntry[] = [];

  for (const file of files) {
    const parts = splitPath(file.path);
    if (!isPathWithin(parts, currentParts)) continue;
    const remaining = parts.slice(currentParts.length);
    if (remaining.length === 0) continue;
    const entryName = remaining[0];
    if (!entryName) continue;

    if (remaining.length === 1) {
      entries.push({
        type: "file",
        name: entryName,
        path: file.path,
        file,
      });
      continue;
    }

    const directoryPath = [...currentParts, entryName].join("/");
    const existing = directories.get(directoryPath);
    if (existing) {
      existing.fileCount += 1;
    } else {
      directories.set(directoryPath, {
        type: "directory",
        name: entryName,
        path: directoryPath,
        fileCount: 1,
      });
    }
  }

  return [...directories.values(), ...entries].sort(compareEntries);
}

export function directorySummary(files: RepoFile[], path: string): string {
  const entries = entriesForPath(files, path);
  const directories = entries.filter((entry) => entry.type === "directory").length;
  const visibleFiles = entries.filter((entry) => entry.type === "file").length;
  const totalFiles = files.filter((file) => isPathWithin(splitPath(file.path), splitPath(path))).length;
  return `${directories} ${directories === 1 ? "directory" : "directories"} · ${visibleFiles} ${visibleFiles === 1 ? "file" : "files"} shown · ${totalFiles} total`;
}

export function normalizePath(path: string): string {
  return splitPath(path).join("/");
}

export function parentPath(path: string): string {
  return splitPath(path).slice(0, -1).join("/");
}

export function splitPath(path: string): string[] {
  return path.split("/").filter((part) => part.length > 0);
}

function compareEntries(left: BrowserEntry, right: BrowserEntry): number {
  if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
  return left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true });
}

function isPathWithin(pathParts: string[], parentParts: string[]): boolean {
  if (pathParts.length < parentParts.length) return false;
  return parentParts.every((part, index) => pathParts[index] === part);
}
