import { HttpComtryaClient } from "./client";
import type { ExtensionUiManifest, ComtryaEvent } from "./contracts";
import { validateUiManifest } from "./contracts";
import "./extension-host";

const DEFAULT_RESOURCE = "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
const TOKEN_ACTIONS = ["graphql:read", "graphql:write", "events:read", "git:read", "checks:read"];
const SELECTED_REPOSITORY_KEY = "comtrya:selected-repository";

const app = document.querySelector<HTMLElement>("#app");
const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
const seededOperatorCode = import.meta.env.PUBLIC_COMTRYA_OPERATOR_CODE || "";
const client = new HttpComtryaClient(serverURL);

type ReadyPayload = {
  ready: boolean;
  mode: string;
  checks: Record<string, boolean>;
  unsupported: Array<{
    id: string;
    pathPrefix: string;
    message: string;
  }>;
};

type ExtensionInstallation = {
  id: string;
  name: string;
  status: string;
  description: string;
};

type TokenExchangePayload = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  scope: string[];
  resource: string;
};

type WorkspacePayload = {
  name: string;
  slug: string;
  visibility: string;
  members: number;
};

type RefPayload = { name: string; target: string; shortTarget: string };
type BranchPayload = { name: string; commit: string; ahead: number; behind: number };
type CommitPayload = {
  oid: string;
  shortOid: string;
  subject: string;
  author: string;
  time: string;
};
type TreeEntryPayload = { path: string; mode: string; kind: string; oid: string; size: number };
type FilePayload = {
  path: string;
  kind: string;
  status: string;
  mode: string;
  oid: string;
  size: number;
  preview: string;
};
type BlobPayload = { path: string; oid: string; size: number; preview: string };
type DiffPayload = { path: string; language: string; patch: string };
type PullRequestPayload = {
  number: number;
  title: string;
  author: string;
  avatar: string;
  state: string;
  base: string;
  head: string;
  comments: number;
  changes: string;
  checks: string;
  review: string;
};
type CheckPayload = { name: string; provider: string; conclusion: string; duration: string };
type ActivityPayload = { type: string; summary: string; actor: string; time: string };

type RepositorySummary = {
  id?: string;
  owner: string;
  name: string;
  path: string;
  gitHttpPath?: string;
  visibility: string;
  description: string;
  defaultBranch: string;
  currentCommit?: string;
  headOid?: string;
  language?: string;
  license?: string;
  updated?: string;
  refs?: RefPayload[];
  branches?: BranchPayload[];
  commits?: CommitPayload[];
  treeEntries?: TreeEntryPayload[];
  files?: FilePayload[];
  blobs?: BlobPayload[];
  diff?: DiffPayload;
  pullRequests?: PullRequestPayload[];
  checks?: CheckPayload[];
};

type RepositoryPayload = Required<
  Pick<
    RepositorySummary,
    | "owner"
    | "name"
    | "path"
    | "visibility"
    | "description"
    | "defaultBranch"
    | "refs"
    | "branches"
    | "commits"
    | "treeEntries"
    | "files"
    | "blobs"
    | "diff"
    | "pullRequests"
    | "checks"
  >
> &
  RepositorySummary;

type GraphqlPayload = {
  viewer: { authenticated: boolean; permissions: string[] };
  instance: {
    id: string;
    name: string;
    publicURL: string;
    capabilities: Record<string, boolean>;
  };
  workspace: WorkspacePayload;
  repository: RepositoryPayload;
  repositories?: RepositorySummary[];
  extensionInstallations: ExtensionInstallation[];
  extensionResolvers: Array<{
    id: string;
    component: string;
    resolver: string;
    outputType: string;
    output: Record<string, unknown>;
    status: string;
  }>;
  activityEvents: ActivityPayload[];
};

type ExtensionMountIssueKind = "load" | "resolver" | "permission";

type ExtensionMountIssue = {
  extensionId: string;
  extensionName: string;
  kind: ExtensionMountIssueKind;
  slotName?: string;
  title: string;
  detail: string;
};

type ExtensionMountResult = {
  slots: number;
  issues: ExtensionMountIssue[];
};

type AppState = {
  ready?: ReadyPayload;
  graphql?: GraphqlPayload;
  selectedRepositoryPath?: string;
  repositoryFilter: string;
};

const state: AppState = {
  selectedRepositoryPath: localStorage.getItem(SELECTED_REPOSITORY_KEY) ?? undefined,
  repositoryFilter: "",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatCount(value: number | undefined): string {
  return new Intl.NumberFormat("en", { notation: value && value > 9999 ? "compact" : "standard" })
    .format(value ?? 0);
}

function setText(selector: string, value: unknown): void {
  const element = app?.querySelector<HTMLElement>(selector);
  if (element) {
    element.textContent = String(value ?? "");
  }
}

function setStatus(selector: string, ok: boolean, label: string): void {
  const element = app?.querySelector<HTMLElement>(selector);
  if (!element) {
    return;
  }
  element.className = ok ? "status-pill status-ok" : "status-pill status-warn";
  element.textContent = label;
}

function statusClass(value: unknown): string {
  return String(value ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
}

function arrayOrEmpty<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function repoPath(repo: Partial<RepositorySummary> | undefined): string {
  if (!repo) {
    return "comtrya/comtrya";
  }
  return repo.path || [repo.owner, repo.name].filter(Boolean).join("/") || "comtrya/comtrya";
}

function repoOwner(repo: RepositorySummary): string {
  return repo.owner || repo.path.split("/").slice(0, -1).join("/") || "comtrya";
}

function repoName(repo: RepositorySummary): string {
  return repo.name || repo.path.split("/").at(-1) || "repository";
}

function ensureRepositoryPayload(repo: RepositorySummary): RepositoryPayload {
  return {
    owner: repoOwner(repo),
    name: repoName(repo),
    path: repoPath(repo),
    gitHttpPath: repo.gitHttpPath,
    visibility: repo.visibility ?? "PRIVATE",
    description: repo.description ?? "Repository registered in this Comtrya instance.",
    defaultBranch: repo.defaultBranch ?? "main",
    currentCommit: repo.currentCommit ?? "unknown",
    headOid: repo.headOid,
    language: repo.language ?? "unknown",
    license: repo.license ?? "unknown",
    updated: repo.updated ?? "unknown",
    refs: arrayOrEmpty(repo.refs),
    branches: arrayOrEmpty(repo.branches),
    commits: arrayOrEmpty(repo.commits),
    treeEntries: arrayOrEmpty(repo.treeEntries),
    files: arrayOrEmpty(repo.files),
    blobs: arrayOrEmpty(repo.blobs),
    diff: repo.diff ?? { path: "unavailable", language: "diff", patch: "" },
    pullRequests: arrayOrEmpty(repo.pullRequests),
    checks: arrayOrEmpty(repo.checks),
    id: repo.id,
  };
}

function repositoriesFromGraphql(graphql: GraphqlPayload): RepositoryPayload[] {
  const byPath = new Map<string, RepositoryPayload>();
  for (const repo of graphql.repositories ?? []) {
    const payload = ensureRepositoryPayload(repo);
    byPath.set(payload.path, payload);
  }
  const live = ensureRepositoryPayload(graphql.repository);
  byPath.set(live.path, { ...byPath.get(live.path), ...live });
  return Array.from(byPath.values()).sort((a, b) => a.path.localeCompare(b.path));
}

function activeRepository(graphql: GraphqlPayload): RepositoryPayload {
  const repositories = repositoriesFromGraphql(graphql);
  const selected = state.selectedRepositoryPath
    ? repositories.find((repo) => repo.path === state.selectedRepositoryPath)
    : undefined;
  const active = selected ?? repositories[0] ?? ensureRepositoryPayload(graphql.repository);
  state.selectedRepositoryPath = active.path;
  localStorage.setItem(SELECTED_REPOSITORY_KEY, active.path);
  return active;
}

function repositoryResource(repo: RepositoryPayload): string {
  return repo.id ? `comtrya://repository/${repo.id}` : DEFAULT_RESOURCE;
}

function cloneURL(repo: RepositoryPayload): string {
  const gitPath = repo.gitHttpPath ?? `/git/${repo.path}.git`;
  return `${serverURL}${gitPath.startsWith("/") ? gitPath : `/${gitPath}`}`;
}

function shortOid(value: string | undefined): string {
  if (!value || value === "unknown") {
    return "unknown";
  }
  return value.slice(0, 12);
}

function passingChecks(checks: CheckPayload[]): number {
  return checks.filter((check) => check.conclusion === "SUCCESS").length;
}

function readyReviews(pulls: PullRequestPayload[]): number {
  return pulls.filter((pull) => pull.state === "READY").length;
}

const SLOT_LABELS: Record<string, { title: string; detail: string }> = {
  "repository.code": {
    title: "Code Browser",
    detail: "Repository tree and file previews mount here when the extension is available.",
  },
  "repository.overview": {
    title: "Pull Requests",
    detail: "Review queues and merge readiness mount here when the extension is available.",
  },
  "repository.checks": {
    title: "Checks",
    detail: "CI and deployment evidence mount here when the extension is available.",
  },
};

function slotPlaceholderMarkup(slotName: string): string {
  const label = SLOT_LABELS[slotName] ?? {
    title: "Extension Slot",
    detail: "Waiting for a matching extension manifest slot.",
  };
  return `
    <article class="extension-placeholder" data-extension-slot-placeholder="${escapeHtml(slotName)}">
      <strong>${escapeHtml(label.title)}</strong>
      <span>${escapeHtml(label.detail)}</span>
    </article>
  `;
}

function renderShell(): void {
  if (!app) {
    return;
  }

  app.innerHTML = `
    <header class="topbar" role="banner">
      <div class="brand-lockup">
        <span class="brand-mark">c</span>
        <div class="brand-text">
          <strong>comtrya</strong>
          <span>operator console</span>
        </div>
        <span class="brand-divider" aria-hidden="true"></span>
        <span class="brand-workspace" id="brand-workspace">Comtrya Labs</span>
      </div>
      <label class="command-search" aria-label="Repository switcher">
        <span>Jump to</span>
        <input id="repo-search" type="search" value="" placeholder="Search repositories, files, refs…" aria-label="Search repositories" />
        <kbd>⌘K</kbd>
      </label>
      <div class="topbar-actions">
        <span id="ready-pill" class="status-pill status-warn">offline</span>
        <code class="server-url" title="${escapeHtml(serverURL)}">${escapeHtml(serverURL)}</code>
      </div>
    </header>

    <section class="forge-layout">
      <aside class="workspace-sidebar" aria-label="Workspace navigation">
        <section class="workspace-card">
          <span class="eyebrow">Workspace</span>
          <strong id="workspace-name">Comtrya Labs</strong>
          <span id="workspace-meta">single tenant</span>
        </section>

        <form id="operator-form" class="operator-form">
          <label for="operator-code">Operator code</label>
          <div class="operator-row">
            <input id="operator-code" name="operatorCode" type="password" autocomplete="off" placeholder="paste credential" value="${escapeHtml(seededOperatorCode)}" />
            <button type="submit" class="primary">Connect</button>
          </div>
        </form>

        <section class="repo-browser">
          <div class="section-heading">
            <span>Repositories</span>
            <strong id="repo-count">0</strong>
          </div>
          <div id="repo-list" class="repo-list" aria-live="polite">
            <button type="button" class="repo-row active" disabled>
              <span>comtrya/comtrya</span>
              <small>connect to load</small>
            </button>
          </div>
        </section>

        <nav class="workspace-nav" aria-label="Repository sections">
          <a class="active" href="#overview" data-glyph="◆">Summary<kbd>g s</kbd></a>
          <a href="#code" data-glyph="{}">Code<kbd>g c</kbd></a>
          <a href="#pulls" data-glyph="⇄">Pull requests<kbd>g p</kbd></a>
          <a href="#checks" data-glyph="✓">Checks<kbd>g k</kbd></a>
          <a href="#extensions" data-glyph="◇">Extensions<kbd>g e</kbd></a>
          <a href="#activity" data-glyph="≋">Activity<kbd>g a</kbd></a>
        </nav>
      </aside>

      <main class="content">
        <section id="overview" class="repo-toolbar">
          <div class="repo-identity">
            <span class="breadcrumb" id="repo-breadcrumb">comtrya / repository</span>
            <h1 id="repo-title">comtrya / comtrya</h1>
            <p id="repo-description">Connect to load repository state.</p>
          </div>
          <div class="repo-actions">
            <button id="copy-clone" type="button">Copy clone URL</button>
            <a class="button-link" href="#extensions">Extension status</a>
            <span id="repo-visibility" class="status-pill status-info">private</span>
          </div>
        </section>

        <section class="repo-tabs" aria-label="Repository tabs">
          <a class="active" href="#overview">Summary</a>
          <a href="#code">Code</a>
          <a href="#pulls">Reviews</a>
          <a href="#checks">Checks</a>
          <a href="#activity">Activity</a>
        </section>

        <section class="metric-grid" aria-label="Repository metrics">
          <article><span>Refs</span><strong id="metric-refs">0</strong></article>
          <article><span>Branches</span><strong id="metric-branches">0</strong></article>
          <article><span>Files</span><strong id="metric-files">0</strong></article>
          <article><span>Checks</span><strong id="metric-checks">0/0</strong></article>
        </section>

        <section class="work-grid">
          <div class="primary-column">
            <section class="panel branch-panel">
              <div class="panel-heading">
                <div>
                  <h2>Branches</h2>
                  <p id="branch-summary">main</p>
                </div>
                <code id="commit-hash">------</code>
              </div>
              <div id="branch-list" class="branch-list"></div>
            </section>

            <div id="extension-slots" class="extension-surfaces" data-smoke="manifest-driven-extension-slots">
              <section id="code" class="panel extension-zone extension-zone-wide">
                <div class="panel-heading">
                  <div>
                    <h2>Code</h2>
                    <p>Extension-owned repository browser.</p>
                  </div>
                  <span class="status-pill status-info">extension</span>
                </div>
                <div class="extension-slot-mount" data-smoke="extension-slot-surface" data-extension-slot-mount="repository.code">
                  ${slotPlaceholderMarkup("repository.code")}
                </div>
              </section>

              <section id="pulls" class="panel extension-zone">
                <div class="panel-heading">
                  <div>
                    <h2>Pull Requests</h2>
                    <p>Review queue and merge readiness.</p>
                  </div>
                  <span id="graphql-pill" class="status-pill status-warn">waiting</span>
                </div>
                <div class="extension-slot-mount" data-smoke="extension-slot-surface" data-extension-slot-mount="repository.overview">
                  ${slotPlaceholderMarkup("repository.overview")}
                </div>
              </section>

              <section id="checks" class="panel extension-zone">
                <div class="panel-heading">
                  <div>
                    <h2>Checks</h2>
                    <p>CI and deployment evidence.</p>
                  </div>
                  <span id="checks-pill" class="status-pill status-warn">waiting</span>
                </div>
                <div class="extension-slot-mount" data-smoke="extension-slot-surface" data-extension-slot-mount="repository.checks">
                  ${slotPlaceholderMarkup("repository.checks")}
                </div>
              </section>
            </div>

            <section class="panel">
              <div class="panel-heading">
                <div>
                  <h2>Commits</h2>
                  <p>Latest history from Git storage.</p>
                </div>
              </div>
              <ol id="commit-list" class="commit-list"></ol>
            </section>
          </div>

          <aside class="ops-rail">
            <section class="panel repo-facts">
              <div class="panel-heading">
                <h2>Repository Facts</h2>
                <span class="status-pill" id="repo-id-pill">git</span>
              </div>
              <dl>
                <div><dt>Language</dt><dd id="repo-language">unknown</dd></div>
                <div><dt>License</dt><dd id="repo-license">unknown</dd></div>
                <div><dt>Updated</dt><dd id="repo-updated">unknown</dd></div>
                <div><dt>Viewer</dt><dd id="viewer-state">anonymous</dd></div>
                <div><dt>Tree</dt><dd id="tree-count">0</dd></div>
                <div><dt>Blobs</dt><dd id="blob-count">0</dd></div>
              </dl>
            </section>

            <section class="panel queue-panel">
              <div class="panel-heading">
                <div>
                  <h2>Work Queue</h2>
                  <p>Review and automation pressure.</p>
                </div>
              </div>
              <div class="queue-stats">
                <article><strong id="queue-reviews">0</strong><span>Ready reviews</span></article>
                <article><strong id="queue-actions">0</strong><span>Attention checks</span></article>
              </div>
              <ol id="queue-list" class="queue-list"></ol>
            </section>

            <section class="panel clone-panel">
              <div class="panel-heading">
                <h2>Clone</h2>
                <span class="status-pill status-ok">git over https</span>
              </div>
              <code id="clone-command" class="command">git clone ${escapeHtml(serverURL)}/git/comtrya/comtrya.git</code>
              <p class="muted">Scoped credentials issued through the operator flow.</p>
            </section>

            <section class="panel refs-panel">
              <div class="panel-heading">
                <h2>Refs</h2>
                <span id="ref-total" class="status-pill status-info">0</span>
              </div>
              <ol id="ref-list" class="compact-list"></ol>
            </section>
          </aside>
        </section>

        <section id="extensions" class="panel">
          <div class="panel-heading">
            <div>
              <h2>Extensions</h2>
              <p>Installed surfaces, resolver output, and load status.</p>
            </div>
            <span id="extension-pill" class="status-pill status-warn">not loaded</span>
          </div>
          <div id="extension-registry" class="extension-registry"></div>
          <div id="extension-errors" class="extension-errors" aria-live="polite"></div>
          <div id="extension-generic-slots" class="extension-generic-slots" data-smoke="extension-generic-slots" aria-live="polite"></div>
        </section>

        <section id="activity" class="activity-grid">
          <div class="panel">
            <div class="panel-heading">
              <h2>Activity</h2>
              <span id="events-pill" class="status-pill status-warn">waiting</span>
            </div>
            <ol id="event-list" class="event-list"></ol>
          </div>
          <div class="panel unsupported-panel">
            <div class="panel-heading">
              <h2>Runtime Boundaries</h2>
              <span id="boundary-count" class="status-pill status-info">0</span>
            </div>
            <div id="unsupported-list" class="unsupported-list"></div>
          </div>
        </section>
      </main>
    </section>
  `;
}

async function exchangeOperatorCode(operatorCode: string): Promise<TokenExchangePayload> {
  const response = await fetch(new URL("/auth/token-exchange", serverURL), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grantType: "urn:comtrya:grant:operator-code",
      subjectToken: operatorCode,
      subjectTokenType: "urn:comtrya:token-type:operator-code",
      requestedResource: DEFAULT_RESOURCE,
      requestedActions: TOKEN_ACTIONS,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.errors?.[0]?.message ?? "operator code exchange failed");
  }
  return body as TokenExchangePayload;
}

async function fetchReady(): Promise<ReadyPayload> {
  const response = await fetch(new URL("/readyz", serverURL), { credentials: "include" });
  if (!response.ok) {
    throw new Error(`readyz returned ${response.status}`);
  }
  return (await response.json()) as ReadyPayload;
}

async function refreshState(): Promise<void> {
  const [ready, graphql] = await Promise.all([
    fetchReady(),
    client.query<GraphqlPayload>(
      "{ viewer { authenticated permissions } instance { id name publicURL capabilities } workspace repository repositories extensionInstallations extensionResolvers activityEvents }",
    ),
  ]);
  state.ready = ready;
  state.graphql = graphql;
  renderData();
}

function renderData(): void {
  const ready = state.ready;
  const graphql = state.graphql;
  if (!ready || !graphql) {
    return;
  }

  const repo = activeRepository(graphql);
  const repositories = repositoriesFromGraphql(graphql);
  const checks = repo.checks;
  const passing = passingChecks(checks);
  const blockedChecks = checks.length - passing;

  setStatus("#ready-pill", ready.ready, ready.ready ? "ready" : "not ready");
  setStatus("#graphql-pill", graphql.viewer.authenticated, "authenticated");
  setStatus("#checks-pill", passing === checks.length, `${passing}/${checks.length} passing`);
  setStatus("#repo-visibility", repo.visibility === "PRIVATE", repo.visibility.toLowerCase());
  setText("#workspace-name", graphql.workspace.name);
  setText("#brand-workspace", graphql.workspace.name);
  setText(
    "#workspace-meta",
    `${graphql.workspace.visibility.toLowerCase()} · ${formatCount(graphql.workspace.members)} members`,
  );
  setText("#repo-count", repositories.length);
  setText("#repo-breadcrumb", repo.path.replace("/", " / "));
  setText("#repo-title", `${repo.owner} / ${repo.name}`);
  setText("#repo-description", repo.description);
  setText("#metric-refs", formatCount(repo.refs.length));
  setText("#metric-branches", formatCount(repo.branches.length));
  setText("#metric-files", formatCount(repo.files.length));
  setText("#metric-checks", `${passing}/${checks.length}`);
  setText("#branch-summary", `${repo.defaultBranch} · ${repo.branches.length} branches`);
  setText("#commit-hash", shortOid(repo.currentCommit));
  setText("#repo-language", repo.language);
  setText("#repo-license", repo.license);
  setText("#repo-updated", repo.updated);
  setText("#viewer-state", graphql.viewer.authenticated ? "operator credential" : "anonymous");
  setText("#tree-count", repo.treeEntries.length);
  setText("#blob-count", repo.blobs.length);
  setText("#queue-reviews", readyReviews(repo.pullRequests));
  setText("#queue-actions", blockedChecks);
  setText("#ref-total", repo.refs.length);
  setText("#clone-command", `git clone ${cloneURL(repo)}`);
  setText("#boundary-count", ready.unsupported.length);

  renderRepositoryList(repositories);
  renderBranches(repo);
  renderRefs(repo);
  renderCommits(repo);
  renderQueue(repo);
  renderExtensionRegistry(graphql);
  renderActivity(graphql.activityEvents);
  renderUnsupported(ready);
}

function renderRepositoryList(repositories: RepositoryPayload[]): void {
  const list = app?.querySelector<HTMLElement>("#repo-list");
  if (!list) {
    return;
  }
  const filter = state.repositoryFilter.trim().toLowerCase();
  const filtered = repositories.filter((repo) => {
    const haystack = `${repo.path} ${repo.description} ${repo.language ?? ""}`.toLowerCase();
    return !filter || haystack.includes(filter);
  });
  list.innerHTML = filtered
    .map((repo) => {
      const active = repo.path === state.selectedRepositoryPath;
      const meta = `${repo.visibility.toLowerCase()} · ${formatCount(repo.branches.length)} branches · ${
        repo.language ?? "unknown"
      }`;
      return `
        <button type="button" class="repo-row${active ? " active" : ""}" data-repo-path="${escapeHtml(repo.path)}" aria-current="${active ? "page" : "false"}">
          <span>${escapeHtml(repo.path)}</span>
          <small>${escapeHtml(meta)}</small>
        </button>
      `;
    })
    .join("");
  if (!filtered.length) {
    list.innerHTML = `
      <article class="empty-state">
        <strong>No repositories match</strong>
        <span>Clear the switcher filter to return to the workspace list.</span>
      </article>
    `;
  }
}

function renderBranches(repo: RepositoryPayload): void {
  const list = app?.querySelector<HTMLElement>("#branch-list");
  if (!list) {
    return;
  }
  list.innerHTML = repo.branches
    .slice(0, 6)
    .map((branch) => {
      const current = branch.name === repo.defaultBranch;
      return `
        <article class="${current ? "current" : ""}">
          <div>
            <strong>${escapeHtml(branch.name)}</strong>
            <span>${escapeHtml(branch.commit)} · +${formatCount(branch.ahead)} / -${formatCount(branch.behind)}</span>
          </div>
          <mark>${current ? "default" : "branch"}</mark>
        </article>
      `;
    })
    .join("");
  if (!repo.branches.length) {
    list.innerHTML = `<article class="empty-state"><strong>No branches</strong><span>This repository has no branch data yet.</span></article>`;
  }
}

function renderRefs(repo: RepositoryPayload): void {
  const list = app?.querySelector<HTMLOListElement>("#ref-list");
  if (!list) {
    return;
  }
  list.innerHTML = repo.refs
    .slice(0, 8)
    .map(
      (ref) => `
        <li>
          <strong>${escapeHtml(ref.name.replace("refs/heads/", ""))}</strong>
          <code>${escapeHtml(ref.shortTarget)}</code>
        </li>
      `,
    )
    .join("");
}

function renderCommits(repo: RepositoryPayload): void {
  const list = app?.querySelector<HTMLOListElement>("#commit-list");
  if (!list) {
    return;
  }
  list.innerHTML = repo.commits
    .map(
      (commit) => `
        <li>
          <code>${escapeHtml(commit.shortOid)}</code>
          <span class="commit-dot" aria-hidden="true"></span>
          <div>
            <strong>${escapeHtml(commit.subject)}</strong>
            <span>${escapeHtml(commit.author)} · ${escapeHtml(commit.time)}</span>
          </div>
        </li>
      `,
    )
    .join("");
}

function renderQueue(repo: RepositoryPayload): void {
  const list = app?.querySelector<HTMLOListElement>("#queue-list");
  if (!list) {
    return;
  }
  const pulls = repo.pullRequests.slice(0, 4);
  list.innerHTML = pulls
    .map(
      (pull) => `
        <li>
          <div>
            <strong>#${escapeHtml(pull.number)} ${escapeHtml(pull.title)}</strong>
            <span>${escapeHtml(pull.head)} into ${escapeHtml(pull.base)} · ${escapeHtml(pull.checks)}</span>
          </div>
          <mark class="${escapeHtml(statusClass(pull.state))}">${escapeHtml(pull.state)}</mark>
        </li>
      `,
    )
    .join("");
  if (!pulls.length) {
    list.innerHTML = `<li class="empty-state"><strong>No active reviews</strong><span>Pull request data will appear when the extension returns it.</span></li>`;
  }
}

function renderExtensionRegistry(graphql: GraphqlPayload): void {
  const registry = app?.querySelector<HTMLElement>("#extension-registry");
  if (!registry) {
    return;
  }
  registry.innerHTML = graphql.extensionInstallations
    .map((extension) => {
      const resolver = graphql.extensionResolvers.find((item) => item.id === extension.id);
      return `
        <article>
          <div>
            <strong>${escapeHtml(extension.name)}</strong>
            <span>${escapeHtml(extension.description)}</span>
          </div>
          <mark>${escapeHtml(extension.status)} · ${escapeHtml(resolver?.outputType ?? "not executed")}</mark>
        </article>
      `;
    })
    .join("");
}

function renderActivity(events: ActivityPayload[]): void {
  const list = app?.querySelector<HTMLOListElement>("#event-list");
  if (!list) {
    return;
  }
  list.innerHTML = events
    .map(
      (event) => `
        <li>
          <strong>${escapeHtml(event.summary)}</strong>
          <span>${escapeHtml(event.actor)} · ${escapeHtml(event.type)} · ${escapeHtml(event.time)}</span>
        </li>
      `,
    )
    .join("");
}

function renderUnsupported(ready: ReadyPayload): void {
  const list = app?.querySelector<HTMLElement>("#unsupported-list");
  if (!list) {
    return;
  }
  list.innerHTML = ready.unsupported
    .map(
      (surface) => `
        <article>
          <strong>${escapeHtml(surface.id.replaceAll("_", " "))}</strong>
          <span>${escapeHtml(surface.message)}</span>
        </article>
      `,
    )
    .join("");
}

async function renderEvents(): Promise<void> {
  const list = app?.querySelector<HTMLOListElement>("#event-list");
  if (!list) {
    return;
  }
  let count = 0;
  for await (const event of client.events()) {
    const typedEvent = event as ComtryaEvent;
    const item = document.createElement("li");
    item.innerHTML = `<strong>${escapeHtml(typedEvent.type)}</strong><span>${escapeHtml(typedEvent.source)}</span>`;
    list.prepend(item);
    count += 1;
  }
  setStatus("#events-pill", count > 0, `${count} live events`);
}

async function fetchExtensionManifest(extensionId: string): Promise<ExtensionUiManifest> {
  const session = await client.issueExtensionSession();
  const url = new URL(`/_extensions/${extensionId}/manifest.json`, serverURL);
  url.searchParams.set("session", session);
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`${extensionId} manifest returned ${response.status}`);
  }
  const manifest = (await response.json()) as ExtensionUiManifest;
  validateUiManifest(manifest);
  return manifest;
}

function extensionHostContext(installation: ExtensionInstallation, slotName: string) {
  const graphql = state.graphql;
  const repo = graphql ? activeRepository(graphql) : undefined;
  const resolver = graphql?.extensionResolvers.find((candidate) => candidate.id === installation.id);
  const [workspace = "comtrya", repoNameValue = "comtrya"] = repoPath(repo).split("/");
  return {
    comtryaClient: client,
    viewer: graphql?.viewer ?? { authenticated: false },
    resource: repo ? repositoryResource(repo) : DEFAULT_RESOURCE,
    routeParams: { workspace, repo: repoNameValue },
    capabilities: { extensionRuntime: graphql?.instance.capabilities.extensionRuntime === true },
    data: {
      slot: slotName,
      workspace: graphql?.workspace,
      repository: repo,
      extensionInstallation: installation,
      extensionResolver: resolver,
      extensionResolvers: graphql?.extensionResolvers ?? [],
      activityEvents: graphql?.activityEvents ?? [],
    },
  };
}

function hasRequiredPermission(permission: string): boolean {
  const permissions = state.graphql?.viewer.permissions ?? [];
  return permissions.includes("instance.admin") || permissions.includes(permission);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function resolverIssuesFor(installation: ExtensionInstallation): ExtensionMountIssue[] {
  const resolver = state.graphql?.extensionResolvers.find((candidate) => candidate.id === installation.id);
  if (!resolver) {
    return [
      {
        extensionId: installation.id,
        extensionName: installation.name,
        kind: "resolver",
        title: "Resolver unavailable",
        detail: "No runtime resolver record was returned for this installed extension.",
      },
    ];
  }
  if (resolver.status !== "executed") {
    return [
      {
        extensionId: installation.id,
        extensionName: installation.name,
        kind: "resolver",
        title: "Resolver failed",
        detail: `${resolver.resolver} returned status ${resolver.status}.`,
      },
    ];
  }
  return [];
}

function renderExtensionIssues(issues: ExtensionMountIssue[]): void {
  const container = app?.querySelector<HTMLElement>("#extension-errors");
  if (!container) {
    return;
  }
  container.innerHTML = issues
    .map(
      (issue) => `
        <article class="extension-error extension-error-${issue.kind}" data-extension-id="${escapeHtml(issue.extensionId)}">
          <div>
            <strong>${escapeHtml(issue.extensionName)}: ${escapeHtml(issue.title)}</strong>
            <span>${escapeHtml(issue.detail)}</span>
          </div>
          <mark>${escapeHtml(issue.kind)}</mark>
        </article>
      `,
    )
    .join("");
}

function extensionSlotMount(slotName: string): HTMLElement | undefined {
  const dedicatedMounts =
    app?.querySelectorAll<HTMLElement>("#extension-slots [data-extension-slot-mount]") ?? [];
  for (const mount of dedicatedMounts) {
    if (mount.dataset.extensionSlotMount === slotName) {
      return mount;
    }
  }
  return genericSlotMount(slotName);
}

function genericSlotMount(slotName: string): HTMLElement | undefined {
  const container = app?.querySelector<HTMLElement>("#extension-generic-slots");
  if (!container) {
    return undefined;
  }
  const existing = Array.from(
    container.querySelectorAll<HTMLElement>("[data-extension-slot-mount]"),
  ).find((mount) => mount.dataset.extensionSlotMount === slotName);
  if (existing) {
    return existing;
  }

  const frame = document.createElement("section");
  frame.className = "extension-generic-slot";
  frame.dataset.extensionSlotFrame = slotName;

  const heading = document.createElement("div");
  heading.className = "panel-heading";
  const title = document.createElement("h3");
  title.textContent = "Extension Slot";
  const slotLabel = document.createElement("span");
  slotLabel.className = "status-pill status-warn";
  slotLabel.textContent = slotName;
  heading.append(title, slotLabel);

  const mount = document.createElement("div");
  mount.className = "extension-slot-mount";
  mount.dataset.extensionSlotMount = slotName;
  mount.setAttribute("data-smoke", "extension-slot-surface");
  mount.innerHTML = slotPlaceholderMarkup(slotName);

  frame.append(heading, mount);
  container.append(frame);
  return mount;
}

function clearExtensionSlotMounts(): void {
  const mounts = app?.querySelectorAll<HTMLElement>("#extension-slots [data-extension-slot-mount]") ?? [];
  for (const mount of mounts) {
    delete mount.dataset.extensionMounted;
    mount.innerHTML = slotPlaceholderMarkup(mount.dataset.extensionSlotMount ?? "");
  }
  app?.querySelector<HTMLElement>("#extension-generic-slots")?.replaceChildren();
}

function updateExtensionSmokeCounts(mountedSlots: number, issueCount: number): void {
  for (const container of [
    app?.querySelector<HTMLElement>("#extension-slots"),
    app?.querySelector<HTMLElement>("#extension-generic-slots"),
  ]) {
    if (!container) {
      continue;
    }
    container.dataset.mountedSlots = String(mountedSlots);
    container.dataset.extensionIssues = String(issueCount);
  }
}

function issueMarkup(issue: ExtensionMountIssue): string {
  return `
    <article class="extension-error extension-error-${issue.kind}" data-extension-id="${escapeHtml(issue.extensionId)}">
      <div>
        <strong>${escapeHtml(issue.extensionName)}: ${escapeHtml(issue.title)}</strong>
        <span>${escapeHtml(issue.detail)}</span>
      </div>
      <mark>${escapeHtml(issue.kind)}</mark>
    </article>
  `;
}

function renderSlotIssue(slotName: string, issue: ExtensionMountIssue): void {
  const mount = extensionSlotMount(slotName);
  if (!mount) {
    return;
  }
  delete mount.dataset.extensionMounted;
  mount.innerHTML = issueMarkup({ ...issue, slotName });
}

function renderIssueForSlots(slots: ExtensionUiManifest["slots"], issue: ExtensionMountIssue): void {
  for (const slot of slots) {
    renderSlotIssue(slot.slot, { ...issue, slotName: slot.slot });
  }
}

async function importExtensionAsset(pathname: string, version?: string): Promise<void> {
  const session = await client.issueExtensionSession();
  const url = new URL(pathname, serverURL);
  url.searchParams.set("session", session);
  if (version) {
    url.searchParams.set("v", version);
  }
  await import(/* @vite-ignore */ url.href);
}

async function mountExtension(installation: ExtensionInstallation): Promise<ExtensionMountResult> {
  const manifest = await fetchExtensionManifest(installation.id);
  if (manifest.id !== installation.id) {
    throw new Error(`${installation.id} manifest id mismatch: ${manifest.id}`);
  }
  const resolverIssues = resolverIssuesFor(installation);
  if (resolverIssues.length > 0) {
    renderIssueForSlots(manifest.slots, resolverIssues[0]!);
    return { slots: 0, issues: resolverIssues };
  }
  try {
    await importExtensionAsset(manifest.assets.entry, manifest.assets.entryIntegrity);
  } catch (error) {
    const issue = {
      extensionId: installation.id,
      extensionName: installation.name,
      kind: "load" as const,
      title: "Asset import failed",
      detail: describeError(error),
    };
    renderIssueForSlots(manifest.slots, issue);
    return { slots: 0, issues: [issue] };
  }

  const issues: ExtensionMountIssue[] = [];
  let mountedSlots = 0;
  for (const slot of manifest.slots) {
    const mount = extensionSlotMount(slot.slot);
    if (!mount) {
      continue;
    }
    if (!hasRequiredPermission(slot.requiredPermission)) {
      const issue = {
        extensionId: manifest.id,
        extensionName: installation.name,
        kind: "permission",
        slotName: slot.slot,
        title: "Permission denied",
        detail: `${slot.slot} requires ${slot.requiredPermission}.`,
      } satisfies ExtensionMountIssue;
      issues.push(issue);
      renderSlotIssue(slot.slot, issue);
      continue;
    }
    if (!customElements.get(slot.element)) {
      const issue = {
        extensionId: manifest.id,
        extensionName: installation.name,
        kind: "load",
        slotName: slot.slot,
        title: "Element not registered",
        detail: `${slot.element} was not defined by ${manifest.assets.entry}.`,
      } satisfies ExtensionMountIssue;
      issues.push(issue);
      renderSlotIssue(slot.slot, issue);
      continue;
    }
    const host = document.createElement("comtrya-extension-host") as HTMLElement & {
      configure?: (
        manifest: ExtensionUiManifest,
        context: ReturnType<typeof extensionHostContext>,
        slotName?: string,
      ) => void;
    };
    host.id = `host-${manifest.id}-${slot.slot.replaceAll(".", "-")}`;
    host.className = "extension-frame";
    host.dataset.extensionId = manifest.id;
    host.dataset.extensionSlot = slot.slot;
    host.setAttribute("data-smoke", "extension-slot-mounted");
    host.setAttribute("aria-label", `${installation.name} extension slot ${slot.slot}`);
    host.configure?.(manifest, extensionHostContext(installation, slot.slot), slot.slot);
    if (!mount.dataset.extensionMounted) {
      mount.replaceChildren();
      mount.dataset.extensionMounted = "true";
    }
    mount.append(host);
    mountedSlots += 1;
  }

  return { slots: mountedSlots, issues };
}

async function mountExtensions(): Promise<void> {
  const installations = state.graphql?.extensionInstallations ?? [];
  clearExtensionSlotMounts();
  if (installations.length === 0) {
    renderExtensionIssues([]);
    updateExtensionSmokeCounts(0, 0);
    setStatus("#extension-pill", false, "no manifests");
    return;
  }
  const results = await Promise.all(
    installations.map(async (installation): Promise<ExtensionMountResult> => {
      try {
        return await mountExtension(installation);
      } catch (error) {
        return {
          slots: 0,
          issues: [
            {
              extensionId: installation.id,
              extensionName: installation.name,
              kind: "load",
              title: "Load failed",
              detail: describeError(error),
            },
          ],
        };
      }
    }),
  );
  const mountedSlots = results.reduce((total, result) => total + result.slots, 0);
  const issues = results.flatMap((result) => result.issues);
  renderExtensionIssues(issues);
  updateExtensionSmokeCounts(mountedSlots, issues.length);
  const statusLabel =
    issues.length > 0
      ? `${mountedSlots} slots, ${issues.length} issues`
      : `${mountedSlots} slots from ${installations.length} extensions`;
  setStatus("#extension-pill", mountedSlots > 0 && issues.length === 0, statusLabel);
}

async function connect(operatorCode: string): Promise<void> {
  if (!operatorCode.trim()) {
    throw new Error("operator code is required");
  }
  const credential = await exchangeOperatorCode(operatorCode.trim());
  client.setAccessToken(credential.accessToken);
  await refreshState();
  await Promise.all([renderEvents(), mountExtensions()]);
}

function bind(): void {
  const form = app?.querySelector<HTMLFormElement>("#operator-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    try {
      await connect(String(data.get("operatorCode") ?? ""));
    } catch (error) {
      setStatus("#ready-pill", false, "error");
      setText("#viewer-state", error instanceof Error ? error.message : "connection failed");
    }
  });

  app?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const repoButton = target.closest<HTMLButtonElement>("[data-repo-path]");
    if (repoButton?.dataset.repoPath) {
      state.selectedRepositoryPath = repoButton.dataset.repoPath;
      localStorage.setItem(SELECTED_REPOSITORY_KEY, state.selectedRepositoryPath);
      renderData();
      if (state.graphql) {
        await mountExtensions();
      }
      return;
    }
    if (target.closest("#copy-clone") && state.graphql) {
      const repo = activeRepository(state.graphql);
      const command = `git clone ${cloneURL(repo)}`;
      await navigator.clipboard?.writeText(command).catch(() => undefined);
      const button = app?.querySelector<HTMLButtonElement>("#copy-clone");
      if (button) {
        button.textContent = "Clone URL copied";
        window.setTimeout(() => {
          button.textContent = "Copy clone URL";
        }, 1600);
      }
    }
  });

  app?.querySelector<HTMLInputElement>("#repo-search")?.addEventListener("input", (event) => {
    state.repositoryFilter = (event.target as HTMLInputElement).value;
    if (state.graphql) {
      renderRepositoryList(repositoriesFromGraphql(state.graphql));
    }
  });

  if (seededOperatorCode) {
    connect(seededOperatorCode).catch((error) => {
      setStatus("#ready-pill", false, "error");
      setText("#viewer-state", error instanceof Error ? error.message : "connection failed");
    });
  }
}

renderShell();
bind();
