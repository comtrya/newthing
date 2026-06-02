import type { ShellGraphQLClient, ShellViewer } from "../extension-runtime";
import { Ic } from "../components/icons";
import {
  directorySummary,
  entriesForPath,
  normalizePath,
  parentPath,
  splitPath,
  type BrowserEntry,
  type RepoFile,
} from "./code-browser-model";

interface RepoCodePayload {
  id: string;
  path: string;
  defaultBranch: string | null;
  headOid: string | null;
  files: RepoFile[];
}

const REPO_CODE_QUERY = `query ShellRepoCode($segments: [String!]!) {
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

export const CORE_CODE_BROWSER_ELEMENT = "comtrya-core-code-browser";

class ComtryaCoreCodeBrowser extends HTMLElement {
  comtryaClient?: ShellGraphQLClient;
  viewer?: ShellViewer;
  repositoryGroups?: string[] | string;
  repositoryName?: string;
  repositoryPath?: string;

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
    if (!this.comtryaClient) {
      renderMessage(root, "code: no comtryaClient bound on host element", "error");
      return;
    }

    renderHeader(root, segments.join("/"), null, null);
    renderMessage(root, "Loading files...", "muted", { append: true });

    try {
      const data = await this.comtryaClient.query<{
        workspace?: { repositoryByPath?: RepoCodePayload | null };
      }>(REPO_CODE_QUERY, { segments });
      const repo = data.workspace?.repositoryByPath ?? null;
      if (!repo) {
        renderMessage(root, `code: no repository at "${segments.join("/")}"`, "error");
        return;
      }
      this.renderBrowser(root, repo);
    } catch (error) {
      renderMessage(root, `code: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  }

  private segments(): string[] {
    if (this.repositoryPath) {
      return this.repositoryPath.split("/").filter((segment) => segment.length > 0);
    }
    const raw = this.repositoryGroups;
    const groups = Array.isArray(raw)
      ? raw.filter((segment) => typeof segment === "string" && segment.length > 0)
      : typeof raw === "string"
        ? raw.split("/").filter((segment) => segment.length > 0)
        : [];
    return this.repositoryName ? [...groups, this.repositoryName] : groups;
  }

  private renderBrowser(root: HTMLElement, repo: RepoCodePayload): void {
    let currentPath = "";
    let openFilePath: string | null = null;

    const navigateToDirectory = (path: string): void => {
      currentPath = normalizePath(path);
      openFilePath = null;
      render();
    };
    const openFile = (file: RepoFile): void => {
      currentPath = parentPath(file.path);
      openFilePath = file.path;
      render();
    };
    const render = (): void => {
      root.replaceChildren();
      renderHeader(root, repo.path, repo.defaultBranch, repo.headOid);

      if (!repo.files.length) {
        renderMessage(
          root,
          "This repository has no commits yet. Push to it or import content to see files here.",
          "muted",
          { append: true },
        );
        return;
      }

      const openFileEntry = openFilePath ? repo.files.find((file) => file.path === openFilePath) ?? null : null;
      const browser = document.createElement("section");
      browser.dataset.smoke = "repo-code-browser";
      browser.className = "repo-code-browser";
      browser.append(
        buildBrowserToolbar(repo, currentPath, openFileEntry, navigateToDirectory),
        openFileEntry
          ? buildFileView(openFileEntry, () => navigateToDirectory(parentPath(openFileEntry.path)))
          : buildDirectoryView(repo.files, currentPath, navigateToDirectory, openFile),
      );
      root.append(browser);
    };

    render();
  }
}

function renderHeader(
  root: HTMLElement,
  repoPath: string,
  defaultBranch: string | null | undefined,
  headOid: string | null | undefined,
): void {
  const header = document.createElement("header");
  header.className = "repo-code-header";
  const title = document.createElement("h2");
  title.textContent = `Code · ${repoPath}`;
  const meta = document.createElement("div");
  const branch = defaultBranch ?? "main";
  const shortHead = typeof headOid === "string" && headOid.length > 0 ? headOid.slice(0, 12) : "-";
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
  note.className = `repo-code-message ${tone}`;
  if (tone === "error") note.setAttribute("role", "alert");
  note.textContent = text;
  root.append(note);
}

function buildBrowserToolbar(
  repo: RepoCodePayload,
  currentPath: string,
  openFile: RepoFile | null,
  navigateToDirectory: (path: string) => void,
): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.className = "repo-code-toolbar";
  toolbar.append(buildBreadcrumbs(repo.path, openFile?.path ?? currentPath, navigateToDirectory));

  const meta = document.createElement("span");
  meta.className = "repo-code-toolbar-meta";
  meta.textContent = openFile
    ? `${openFile.kind ?? "file"} · ${humanSize(openFile.size)}`
    : directorySummary(repo.files, currentPath);
  toolbar.append(meta);
  return toolbar;
}

function buildBreadcrumbs(
  repoPath: string,
  path: string,
  navigateToDirectory: (path: string) => void,
): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "repo-code-breadcrumbs";
  nav.setAttribute("aria-label", "Code path");

  const repoName = repoPath.split("/").filter(Boolean).at(-1) ?? repoPath;
  const pathParts = splitPath(path);
  nav.append(buildBreadcrumbCrumb(repoName, "", pathParts.length === 0, navigateToDirectory));

  pathParts.forEach((part, index) => {
    const crumbPath = pathParts.slice(0, index + 1).join("/");
    const isLast = index === pathParts.length - 1;
    nav.append(buildBreadcrumbSeparator());
    nav.append(buildBreadcrumbCrumb(part, crumbPath, isLast, navigateToDirectory));
  });

  return nav;
}

function buildBreadcrumbCrumb(
  label: string,
  path: string,
  active: boolean,
  navigateToDirectory: (path: string) => void,
): HTMLElement {
  if (active) {
    const current = document.createElement("span");
    current.className = "repo-code-breadcrumb-current";
    current.setAttribute("aria-current", "page");
    current.textContent = label;
    return current;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "repo-code-breadcrumb";
  button.textContent = label;
  button.addEventListener("click", () => navigateToDirectory(path));
  return button;
}

function buildBreadcrumbSeparator(): HTMLElement {
  const separator = document.createElement("span");
  separator.className = "repo-code-breadcrumb-separator";
  separator.setAttribute("aria-hidden", "true");
  separator.textContent = "/";
  return separator;
}

function buildDirectoryView(
  files: RepoFile[],
  currentPath: string,
  navigateToDirectory: (path: string) => void,
  openFile: (file: RepoFile) => void,
): HTMLElement {
  const panel = document.createElement("section");
  panel.dataset.smoke = "repo-code-directory";
  panel.className = "repo-code-directory";
  panel.setAttribute("aria-label", currentPath ? `Files in ${currentPath}` : "Repository files");

  const header = document.createElement("div");
  header.className = "repo-code-directory-header";
  header.append(columnLabel("Name"), columnLabel("Type"), columnLabel("Size"));

  const rows = document.createElement("ul");
  rows.className = "repo-code-rows";

  if (currentPath) {
    rows.append(buildParentRow(currentPath, navigateToDirectory));
  }

  const entries = entriesForPath(files, currentPath);
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "repo-code-empty-row";
    empty.textContent = "No files in this directory.";
    rows.append(empty);
  } else {
    for (const entry of entries) {
      rows.append(buildEntryRow(entry, navigateToDirectory, openFile));
    }
  }

  panel.append(header, rows);
  return panel;
}

function columnLabel(text: string): HTMLElement {
  const label = document.createElement("span");
  label.textContent = text;
  return label;
}

function buildParentRow(currentPath: string, navigateToDirectory: (path: string) => void): HTMLElement {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "repo-code-row repo-code-row--parent";
  button.setAttribute("aria-label", "Back to parent directory");
  button.addEventListener("click", () => navigateToDirectory(parentPath(currentPath)));
  button.append(rowName("folder", ".."), rowMeta("parent directory"), rowMeta(""));
  item.append(button);
  return item;
}

function buildEntryRow(
  entry: BrowserEntry,
  navigateToDirectory: (path: string) => void,
  openFile: (file: RepoFile) => void,
): HTMLElement {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = `repo-code-row repo-code-row--${entry.type}`;
  button.title = entry.path;

  if (entry.type === "directory") {
    button.setAttribute("aria-label", `Open directory ${entry.path}`);
    button.addEventListener("click", () => navigateToDirectory(entry.path));
    button.append(rowName("folder", entry.name), rowMeta(`${entry.fileCount} ${entry.fileCount === 1 ? "file" : "files"}`), rowMeta(""));
  } else {
    button.dataset.smoke = "repo-code-file-row";
    button.setAttribute("aria-label", `Open file ${entry.path}`);
    button.addEventListener("click", () => openFile(entry.file));
    button.append(rowName("file", entry.name), rowMeta(entry.file.kind ?? "file"), rowMeta(humanSize(entry.file.size)));
  }

  item.append(button);
  return item;
}

function rowName(iconName: "file" | "folder", text: string): HTMLElement {
  const name = document.createElement("span");
  name.className = "repo-code-row-name";
  name.append(icon(iconName), textNode(text));
  return name;
}

function rowMeta(text: string): HTMLElement {
  const meta = document.createElement("span");
  meta.className = "repo-code-row-meta";
  meta.textContent = text;
  return meta;
}

function buildFileView(file: RepoFile, backToDirectory: () => void): HTMLElement {
  const article = document.createElement("article");
  article.dataset.smoke = "repo-code-file-view";
  article.className = "repo-code-file";

  const actions = document.createElement("div");
  actions.className = "repo-code-file-actions";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "repo-code-back";
  back.append(icon("chev"), textNode("Back to directory"));
  back.addEventListener("click", backToDirectory);
  actions.append(back);

  const header = document.createElement("div");
  header.className = "repo-code-file-header";
  const title = document.createElement("h3");
  title.append(icon("file"), textNode(file.path));
  const meta = document.createElement("span");
  meta.textContent = `${file.kind ?? "file"} · ${humanSize(file.size)}`;
  header.append(title, meta);

  const body = document.createElement("div");
  body.className = "repo-code-file-body";
  if (typeof file.preview === "string" && file.preview.length > 0) {
    const loading = document.createElement("p");
    loading.className = "repo-code-highlight-loading";
    loading.textContent = "Rendering syntax highlighting...";
    body.append(loading);
    void renderHighlightedPreview(file, body);
  } else {
    const note = document.createElement("p");
    note.textContent = "No inline preview (binary or unsupported file kind). Clone the repo to inspect.";
    body.append(note);
  }

  article.append(actions, header, body);
  return article;
}

async function renderHighlightedPreview(file: RepoFile, body: HTMLElement): Promise<void> {
  try {
    const { highlightRepoFile } = await import("./code-highlighter");
    const highlighted = await highlightRepoFile(file);
    if (!body.isConnected) return;

    body.replaceChildren();
    if (highlighted.styles) {
      const styles = document.createElement("style");
      styles.textContent = highlighted.styles;
      body.append(styles);
    }
    const rendered = document.createElement("div");
    rendered.dataset.smoke = "repo-code-file-preview";
    rendered.className = "repo-code-expressive";
    rendered.innerHTML = highlighted.html;
    body.append(rendered);
  } catch {
    if (!body.isConnected) return;
    renderPlainPreview(file, body);
  }
}

function renderPlainPreview(file: RepoFile, body: HTMLElement): void {
  body.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "repo-code-plain";
  const pre = document.createElement("pre");
  pre.dataset.smoke = "repo-code-file-preview";
  pre.textContent = file.preview ?? "";
  wrap.append(pre);
  body.append(wrap);
}

function icon(name: "chev" | "file" | "folder"): HTMLElement {
  const span = document.createElement("span");
  span.className = `repo-code-icon repo-code-icon--${name}`;
  span.innerHTML = Ic[name];
  return span;
}

function textNode(text: string): Text {
  return document.createTextNode(text);
}

function humanSize(bytes: number): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function defineCoreCodeBrowser(): void {
  if (!customElements.get(CORE_CODE_BROWSER_ELEMENT)) {
    customElements.define(CORE_CODE_BROWSER_ELEMENT, ComtryaCoreCodeBrowser);
  }
}
