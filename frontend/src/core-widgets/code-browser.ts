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
  branches?: RepoCodeBranch[] | null;
  commits?: RepoCodeCommit[] | null;
  files: RepoFile[];
}

interface RepoCodeBranch {
  name: string;
  oid: string;
  commit: string;
  ahead: number;
  behind: number;
}

interface RepoCodeCommit {
  oid: string;
  shortOid: string;
  subject: string;
  author: string;
  time: string;
}

const REPO_CODE_QUERY = `query ShellRepoCode($segments: [String!]!) {
  workspace {
    repositoryByPath(segments: $segments) {
      id
      path
      defaultBranch
      headOid
      branches { name oid commit ahead behind }
      commits { oid shortOid subject author time }
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
  private activeFilterInput: HTMLInputElement | null = null;
  private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.key !== "/") return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (isEditableTarget(event.target)) return;
    const filter = this.activeFilterInput;
    if (!filter || !this.contains(filter) || filter.disabled) return;
    event.preventDefault();
    filter.focus();
    filter.select();
  };

  async connectedCallback(): Promise<void> {
    document.removeEventListener("keydown", this.handleDocumentKeydown);
    document.addEventListener("keydown", this.handleDocumentKeydown);
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

    renderHeader(root, segments.join("/"));
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

  disconnectedCallback(): void {
    document.removeEventListener("keydown", this.handleDocumentKeydown);
    this.activeFilterInput = null;
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
    let filterText = "";

    const navigateToDirectory = (path: string): void => {
      currentPath = normalizePath(path);
      openFilePath = null;
      filterText = "";
      render();
    };
    const openFile = (file: RepoFile): void => {
      currentPath = parentPath(file.path);
      openFilePath = file.path;
      render();
    };
    const render = (): void => {
      root.replaceChildren();
      renderHeader(root, repo.path);

      if (!repo.files.length) {
        this.activeFilterInput = null;
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
      let body: HTMLElement;
      if (openFileEntry) {
        this.activeFilterInput = null;
        body = buildFileView(openFileEntry);
      } else {
        body = buildDirectoryView(
          repo,
          currentPath,
          filterText,
          (value) => {
            filterText = value;
          },
          navigateToDirectory,
          openFile,
        );
        this.activeFilterInput = body.querySelector(".repo-code-file-filter");
      }
      browser.append(buildBrowserToolbar(repo, currentPath, openFileEntry, navigateToDirectory), body);
      root.append(browser);
    };

    render();
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

function renderHeader(root: HTMLElement, repoPath: string): void {
  const header = document.createElement("header");
  header.className = "repo-code-header";
  const title = document.createElement("h2");
  title.textContent = `Code · ${repoPath}`;
  header.append(title);
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

  const primary = document.createElement("div");
  primary.className = "repo-code-toolbar-primary";
  primary.append(
    buildRefbar(repo.defaultBranch, repo.headOid, repo.path),
    buildBreadcrumbs(repo.path, openFile?.path ?? currentPath, navigateToDirectory),
  );

  const meta = document.createElement("span");
  meta.className = "repo-code-toolbar-meta";
  meta.textContent = openFile
    ? `${openFile.kind ?? "file"} · ${humanSize(openFile.size)}`
    : directorySummary(repo.files, currentPath);

  const secondary = document.createElement("div");
  secondary.className = "repo-code-toolbar-secondary";
  const branches = buildBranchesLink(repo);
  if (branches) secondary.append(branches);
  const history = buildHistoryLink(repo);
  if (history) secondary.append(history);
  secondary.append(meta);

  toolbar.append(primary, secondary);
  return toolbar;
}

function buildRefbar(
  defaultBranch: string | null | undefined,
  headOid: string | null | undefined,
  repoPath: string,
): HTMLElement {
  const refbar = document.createElement("div");
  refbar.className = "repo-code-refbar";
  refbar.setAttribute("aria-label", "Current code reference");
  const branch = defaultBranch?.trim() || "main";
  const commit = headOid?.trim() || "";
  refbar.append(
    refPill("branch", branch, "Default branch", branchListHref(repoPath)),
    refPill(
      "commit",
      shortCommit(headOid),
      headOid || "No commit recorded",
      commit ? commitDetailHref(repoPath, commit) : null,
    ),
  );
  return refbar;
}

function refPill(
  iconName: "branch" | "commit",
  text: string,
  title: string,
  href: string | null = null,
): HTMLElement {
  const pill = href ? document.createElement("a") : document.createElement("span");
  pill.className = `repo-code-ref-pill repo-code-ref-pill--${iconName}`;
  pill.title = title;
  if (href) {
    (pill as HTMLAnchorElement).href = href;
    pill.dataset.smoke = `repo-code-${iconName}-link`;
  }
  pill.append(icon(iconName), textNode(text));
  return pill;
}

function buildBranchesLink(repo: RepoCodePayload): HTMLAnchorElement | null {
  if (!repo.branches?.length) return null;
  const link = document.createElement("a");
  link.className = "repo-code-branches-link";
  link.dataset.smoke = "repo-code-branches-link";
  link.href = branchListHref(repo.path);
  link.append(icon("branch"), textNode("Branches"));
  return link;
}

function buildHistoryLink(repo: RepoCodePayload): HTMLAnchorElement | null {
  if (!repo.commits?.length) return null;
  const link = document.createElement("a");
  link.className = "repo-code-history-link";
  link.dataset.smoke = "repo-code-history-link";
  link.href = commitListHref(repo.path);
  link.append(icon("commit"), textNode("History"));
  return link;
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
  repo: RepoCodePayload,
  currentPath: string,
  filterText: string,
  setFilterText: (value: string) => void,
  navigateToDirectory: (path: string) => void,
  openFile: (file: RepoFile) => void,
): HTMLElement {
  const panel = document.createElement("section");
  panel.dataset.smoke = "repo-code-directory";
  panel.className = "repo-code-directory";
  panel.setAttribute("aria-label", currentPath ? `Files in ${currentPath}` : "Repository files");

  const controls = buildDirectoryControls(filterText);
  const rows = document.createElement("ul");
  rows.className = "repo-code-rows";

  const entries = entriesForPath(repo.files, currentPath);
  const renderRows = (query: string): void => {
    rows.replaceChildren();

    const filteredEntries = filterEntries(entries, query);
    if (filteredEntries.length === 0) {
      const empty = document.createElement("li");
      empty.className = "repo-code-empty-row";
      empty.textContent = query.trim()
        ? `No files or folders match "${query.trim()}".`
        : "No files in this directory.";
      rows.append(empty);
      return;
    }

    for (const entry of filteredEntries) {
      rows.append(buildEntryRow(entry, navigateToDirectory, openFile));
    }
  };

  const filter = controls.querySelector<HTMLInputElement>(".repo-code-file-filter");
  filter?.addEventListener("input", () => {
    const value = filter.value;
    setFilterText(value);
    renderRows(value);
  });
  renderRows(filterText);

  panel.append(buildDirectorySummary(repo, currentPath), controls, rows);
  return panel;
}

function buildDirectoryControls(filterText: string): HTMLElement {
  const controls = document.createElement("div");
  controls.className = "repo-code-directory-controls";
  const label = document.createElement("label");
  label.className = "repo-code-filter-control";
  label.append(icon("file"));
  const input = document.createElement("input");
  input.type = "search";
  input.className = "repo-code-file-filter";
  input.dataset.smoke = "repo-code-file-filter";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "Find file or folder");
  input.placeholder = "Find file or folder";
  input.value = filterText;
  label.append(input);
  controls.append(label);
  return controls;
}

function filterEntries(entries: BrowserEntry[], query: string): BrowserEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((entry) =>
    entry.name.toLowerCase().includes(needle)
    || entry.path.toLowerCase().includes(needle),
  );
}

function buildDirectorySummary(repo: RepoCodePayload, currentPath: string): HTMLElement {
  const summary = document.createElement("div");
  summary.className = "repo-code-directory-summary";
  const treeSummary = directorySummary(repo.files, currentPath);
  const latest = buildLatestCommit(repo);
  summary.setAttribute("aria-label", `${latest.getAttribute("aria-label")}; ${treeSummary}`);

  const tree = document.createElement("span");
  tree.className = "repo-code-directory-counts";
  tree.textContent = treeSummary;

  summary.append(latest, tree);
  return summary;
}

function buildLatestCommit(repo: RepoCodePayload): HTMLElement {
  const commit = repo.commits?.[0] ?? null;
  const latest = commit ? document.createElement("a") : document.createElement("span");
  latest.className = "repo-code-latest-commit";

  if (!commit) {
    const short = shortCommit(repo.headOid);
    latest.setAttribute("aria-label", `Latest commit ${short}`);
    latest.append(icon("commit"), textNode("Latest commit "), commitLabel(repo.headOid));
    return latest;
  }

  latest.classList.add("repo-code-latest-commit-link");
  latest.dataset.smoke = "repo-code-latest-commit-link";
  (latest as HTMLAnchorElement).href = commitDetailHref(repo.path, commit.oid);
  const author = commit.author.trim() || "Unknown author";
  const subject = commit.subject.trim() || "No commit message";
  const time = commit.time.trim();
  const short = commit.shortOid.trim() || shortCommit(commit.oid);
  latest.setAttribute(
    "aria-label",
    `Latest commit ${subject} by ${author} (${short})${time ? ` ${time}` : ""}`,
  );
  latest.append(
    icon("commit"),
    commitText("repo-code-latest-author", author),
    commitText("repo-code-latest-subject", subject),
    commitLabel(short),
  );
  if (time) latest.append(commitText("repo-code-latest-time", time));
  return latest;
}

function commitText(className: string, text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function commitLabel(headOid: string | null | undefined): HTMLElement {
  const label = document.createElement("code");
  label.className = "repo-code-commit-label";
  label.textContent = shortCommit(headOid);
  return label;
}

function shortCommit(headOid: string | null | undefined): string {
  return typeof headOid === "string" && headOid.length > 0 ? headOid.slice(0, 12) : "no commits";
}

function repoPathHref(repoPath: string): string {
  return `/r/${repoPath.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`;
}

function branchListHref(repoPath: string): string {
  return `${repoPathHref(repoPath)}/branches`;
}

function commitListHref(repoPath: string): string {
  return `${repoPathHref(repoPath)}/commits`;
}

function commitDetailHref(repoPath: string, oid: string): string {
  return `${commitListHref(repoPath)}/${encodeURIComponent(oid)}`;
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

function buildFileView(file: RepoFile): HTMLElement {
  const article = document.createElement("article");
  article.dataset.smoke = "repo-code-file-view";
  article.className = "repo-code-file";

  const header = document.createElement("div");
  header.className = "repo-code-file-header";
  const title = document.createElement("h3");
  title.append(icon("file"), textNode(file.path));
  const meta = document.createElement("span");
  meta.className = "repo-code-file-meta";
  meta.textContent = `${file.kind ?? "file"} · ${humanSize(file.size)}`;
  const headerActions = document.createElement("div");
  headerActions.className = "repo-code-file-header-actions";
  headerActions.append(meta, copyFilePathButton(file.path));
  header.append(title, headerActions);

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

  article.append(header, body);
  return article;
}

function copyFilePathButton(path: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "repo-code-copy-path";
  button.title = "Copy file path";
  button.setAttribute("aria-label", `Copy file path ${path}`);
  button.setAttribute("aria-pressed", "false");

  const render = (copied: boolean): void => {
    button.setAttribute("aria-pressed", String(copied));
    button.title = copied ? "Copied file path" : "Copy file path";
    button.replaceChildren(icon("copy"), textNode(copied ? "Copied" : "Copy path"));
  };
  render(false);

  button.addEventListener("click", async () => {
    try {
      await writeClipboardText(path);
      render(true);
      window.setTimeout(() => render(false), 1600);
    } catch {
      button.title = "Copy unavailable";
    }
  });

  return button;
}

async function writeClipboardText(text: string): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard?.writeText) {
    await clipboard.writeText(text);
    return;
  }

  const target = document.createElement("textarea");
  target.value = text;
  target.readOnly = true;
  target.style.position = "fixed";
  target.style.inset = "0";
  target.style.opacity = "0";
  document.body.append(target);
  target.select();
  const copied = document.execCommand?.("copy") ?? false;
  target.remove();
  if (!copied) throw new Error("copy command rejected");
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

function icon(name: "branch" | "commit" | "copy" | "file" | "folder"): HTMLElement {
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
