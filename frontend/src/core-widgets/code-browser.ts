import type { ShellGraphQLClient, ShellViewer } from "../extension-runtime";

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
    renderMessage(root, "Loading tree...", "muted", { append: true });

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

    const layout = document.createElement("div");
    layout.className = "repo-code-layout";

    const tree = document.createElement("ul");
    tree.dataset.smoke = "repo-code-tree";
    tree.className = "repo-code-tree";

    const preview = document.createElement("article");
    preview.dataset.smoke = "repo-code-preview";
    preview.className = "repo-code-preview";
    preview.setAttribute("aria-label", "File preview");
    preview.append(buildPreview(repo.files[0]));

    for (const file of repo.files) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = file.path;
      button.addEventListener("click", () => {
        preview.replaceChildren(buildPreview(file));
      });
      item.append(button);
      tree.append(item);
    }

    layout.append(tree, preview);
    root.append(layout);
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

function buildPreview(file: RepoFile | undefined): DocumentFragment {
  const wrap = document.createDocumentFragment();
  if (!file) {
    const empty = document.createElement("p");
    empty.textContent = "Select a file from the tree.";
    wrap.append(empty);
    return wrap;
  }
  const header = document.createElement("div");
  header.className = "repo-code-preview-meta";
  header.textContent = `${file.path} · ${file.kind ?? "file"} · ${humanSize(file.size)}`;
  wrap.append(header);
  if (typeof file.preview === "string" && file.preview.length > 0) {
    const pre = document.createElement("pre");
    pre.textContent = file.preview;
    wrap.append(pre);
  } else {
    const note = document.createElement("p");
    note.textContent = "No inline preview (binary or unsupported file kind). Clone the repo to inspect.";
    wrap.append(note);
  }
  return wrap;
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
