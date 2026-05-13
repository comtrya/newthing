import { FileTree } from "@pierre/trees";
import type { ComtryaClient } from "../../contracts";
import type { ViewerHandle } from "../../extension-host-sdk/types";

interface RepoFile {
  path: string;
  size: number;
  kind: string;
  preview?: string;
}

interface RepoCodePayload {
  id: string;
  path: string;
  defaultBranch: string | null;
  headOid: string | null;
  files: RepoFile[];
}

const REPO_CODE_QUERY = `query($segments: [String!]!) {
  workspace {
    repositoryByPath(segments: $segments) {
      id
      path
      defaultBranch
      headOid
      files { path size kind preview }
    }
  }
}`;

const CORE_CODE_BROWSER_TAG = "comtrya-core-code-browser";

class ComtryaCoreCodeBrowser extends HTMLElement {
  comtryaClient?: ComtryaClient;
  viewer?: ViewerHandle;
  repositoryGroups?: string[] | string;
  repositoryName?: string;
  private tree?: FileTree;
  private unsubscribe?: () => void;

  async connectedCallback(): Promise<void> {
    this.dataset.smoke = "repo-code-section";
    const root = document.createElement("div");
    root.className = "extension-payload";
    this.replaceChildren(root);

    const segments = this.segments();
    if (segments.length === 0) {
      renderMessage(root, "code: missing repository path on host element", "error");
      return;
    }
    if (!this.comtryaClient || typeof this.comtryaClient.query !== "function") {
      renderMessage(root, "code: no comtryaClient bound on host element", "error");
      return;
    }

    renderHeader(root, segments.join("/"), null, null);
    renderMessage(root, "Loading tree…", "muted", { append: true });

    try {
      const data = await this.comtryaClient.query<{
        workspace: { repositoryByPath: RepoCodePayload | null };
      }>(REPO_CODE_QUERY, { segments });
      const repo = data?.workspace?.repositoryByPath ?? null;
      if (!repo) {
        renderMessage(root, `code: no repository at "${segments.join("/")}"`, "error");
        return;
      }
      this.renderBrowser(root, repo);
    } catch (err) {
      renderMessage(root, `code: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.tree?.cleanUp();
  }

  private segments(): string[] {
    const raw = this.repositoryGroups;
    let groups: string[] = [];
    if (Array.isArray(raw)) {
      groups = raw.filter((s) => typeof s === "string" && s.length > 0);
    } else if (typeof raw === "string" && raw.length > 0) {
      groups = raw.split("/").filter((s) => s.length > 0);
    }
    const name = this.repositoryName;
    return name ? [...groups, name] : groups;
  }

  private renderBrowser(root: HTMLElement, repo: RepoCodePayload): void {
    root.replaceChildren();
    renderHeader(root, repo.path, repo.defaultBranch, repo.headOid);

    if (!repo.files || repo.files.length === 0) {
      renderMessage(
        root,
        "This repository has no commits yet. Push to it or import content to see files here.",
        "muted",
        { append: true },
      );
      return;
    }

    const layout = document.createElement("div");
    layout.style.cssText =
      "display: grid; grid-template-columns: minmax(260px, 1fr) minmax(0, 2fr); gap: 16px; align-items: stretch; margin-top: 12px;";

    const treeMount = document.createElement("div");
    treeMount.dataset.smoke = "repo-code-tree";
    treeMount.style.cssText =
      "height: 480px; min-width: 260px; border: 1px solid var(--ink-rule, #d0cfc8);";

    const preview = document.createElement("article");
    preview.setAttribute("aria-label", "File preview");
    preview.style.cssText =
      "height: 480px; overflow: auto; padding: 12px; border: 1px solid var(--ink-rule, #d0cfc8); font-family: var(--mono, monospace); font-size: 12px;";
    preview.append(buildPreview(repo.files[0]));

    layout.append(treeMount, preview);
    root.append(layout);

    const byPath = new Map<string, RepoFile>(repo.files.map((file) => [file.path, file]));

    this.tree = new FileTree({
      paths: repo.files.map((file) => file.path),
      flattenEmptyDirectories: true,
      initialExpansion: "open",
      search: true,
    });
    this.tree.render({ containerWrapper: treeMount });

    let lastFocused: string | null = null;
    this.unsubscribe = this.tree.subscribe(() => {
      const focused = this.tree?.getFocusedPath();
      if (focused && focused !== lastFocused) {
        lastFocused = focused;
        const file = byPath.get(focused);
        if (file) preview.replaceChildren(buildPreview(file));
      }
    });
  }
}

function renderHeader(
  root: HTMLElement,
  repoPath: string,
  defaultBranch: string | null | undefined,
  headOid: string | null | undefined,
): void {
  const header = document.createElement("header");
  header.style.cssText =
    "display: flex; align-items: baseline; justify-content: space-between; gap: 12px;";
  const title = document.createElement("h2");
  title.style.cssText = "margin: 0; font-family: var(--display); font-size: 16px;";
  title.textContent = `Code · ${repoPath}`;
  const meta = document.createElement("div");
  meta.style.cssText =
    "font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-faint, #888);";
  const branch = defaultBranch ?? "main";
  const shortHead = typeof headOid === "string" && headOid.length > 0 ? headOid.slice(0, 12) : "—";
  meta.textContent = `${branch} · ${shortHead}`;
  header.append(title, meta);
  root.append(header);
}

function renderMessage(
  root: HTMLElement,
  text: string,
  tone: "muted" | "error",
  options: { append?: boolean } = {},
): void {
  if (!options.append) root.replaceChildren();
  const note = document.createElement("p");
  if (tone === "error") note.setAttribute("role", "alert");
  const color = tone === "error" ? "var(--ink-warn, #c2410c)" : "var(--ink-faint, #666)";
  note.style.cssText = `margin: 6px 0 0; font-family: var(--mono, monospace); font-size: 12px; color: ${color};`;
  note.textContent = text;
  root.append(note);
}

function buildPreview(file: RepoFile | undefined): DocumentFragment {
  const wrap = document.createDocumentFragment();
  if (!file) {
    const empty = document.createElement("p");
    empty.textContent = "Select a file from the tree.";
    wrap.append(empty);
    return wrap;
  }
  const header = document.createElement("div");
  header.style.cssText = "margin-bottom: 8px; color: var(--ink-faint, #666); font-size: 11px;";
  header.textContent = `${file.path} · ${file.kind ?? "file"} · ${humanSize(file.size)}`;
  wrap.append(header);
  if (typeof file.preview === "string" && file.preview.length > 0) {
    const pre = document.createElement("pre");
    pre.style.cssText = "margin: 0; white-space: pre-wrap; word-break: break-word;";
    pre.textContent = file.preview;
    wrap.append(pre);
  } else {
    const note = document.createElement("p");
    note.style.cssText = "color: var(--ink-faint, #888);";
    note.textContent = "No inline preview (binary or unsupported file kind). Clone the repo to inspect.";
    wrap.append(note);
  }
  return wrap;
}

function humanSize(bytes: number): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function defineCoreCodeBrowser(): void {
  if (!customElements.get(CORE_CODE_BROWSER_TAG)) {
    customElements.define(CORE_CODE_BROWSER_TAG, ComtryaCoreCodeBrowser);
  }
}

export const CORE_CODE_BROWSER_ELEMENT = CORE_CODE_BROWSER_TAG;
