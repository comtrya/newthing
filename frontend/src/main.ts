import { FileDiff, parsePatchFiles } from "@pierre/diffs";
import { FileTree } from "@pierre/trees";
import type { GitStatusEntry } from "@pierre/trees";
import { HttpForgepointClient } from "./client";
import type { ExtensionUiManifest, ForgepointEvent } from "./contracts";
import { validateUiManifest } from "./contracts";
import "./extension-host";

const DEFAULT_RESOURCE = "forgepoint://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
const EXTENSIONS = ["ext_pull_requests", "ext_code_browser", "ext_checks"] as const;
const TOKEN_ACTIONS = ["graphql:read", "graphql:write", "events:read", "git:read", "checks:read"];

const app = document.querySelector<HTMLElement>("#app");
const serverURL = import.meta.env.PUBLIC_FORGEPOINT_SERVER_URL || window.location.origin;
const seededOperatorCode = import.meta.env.PUBLIC_FORGEPOINT_OPERATOR_CODE || "";
const client = new HttpForgepointClient(serverURL);
let repositoryTree: FileTree | undefined;
let reviewDiff: FileDiff | undefined;

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

type TokenExchangePayload = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  scope: string[];
  resource: string;
};

type DemoState = {
  workspace: {
    name: string;
    slug: string;
    visibility: string;
    members: number;
  };
  repository: {
    owner: string;
    name: string;
    path: string;
    visibility: string;
    description: string;
    defaultBranch: string;
    currentCommit: string;
    stars: number;
    forks: number;
    watchers: number;
    language: string;
    license: string;
    updated: string;
  };
  refs: Array<{ name: string; target: string; shortTarget: string }>;
  branches: Array<{ name: string; commit: string; ahead: number; behind: number }>;
  commits: Array<{ oid: string; shortOid: string; subject: string; author: string; time: string }>;
  treeEntries: Array<{ path: string; mode: string; kind: string; oid: string; size: number }>;
  files: Array<{
    path: string;
    kind: string;
    status: string;
    mode: string;
    oid: string;
    size: number;
    preview: string;
  }>;
  blobs: Array<{ path: string; oid: string; size: number; preview: string }>;
  diff: { path: string; language: string; patch: string };
  pullRequests: Array<{
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
  }>;
  checks: Array<{ name: string; provider: string; conclusion: string; duration: string }>;
  extensions: Array<{ id: string; name: string; status: string; description: string }>;
  extensionResolvers: Array<{
    id: string;
    component: string;
    resolver: string;
    outputType: string;
    output: Record<string, unknown>;
    status: string;
  }>;
  activity: Array<{ type: string; summary: string; actor: string; time: string }>;
};

type RepositoryPayload = DemoState["repository"] & {
  refs: DemoState["refs"];
  branches: DemoState["branches"];
  commits: DemoState["commits"];
  treeEntries: DemoState["treeEntries"];
  files: DemoState["files"];
  blobs: DemoState["blobs"];
  diff: DemoState["diff"];
  pullRequests: DemoState["pullRequests"];
  checks: DemoState["checks"];
};

type GraphqlPayload = {
  viewer: { authenticated: boolean; permissions: string[] };
  instance: {
    id: string;
    name: string;
    publicURL: string;
    capabilities: Record<string, boolean>;
  };
  workspace: DemoState["workspace"];
  repository: RepositoryPayload;
  extensionInstallations: DemoState["extensions"];
  extensionResolvers: DemoState["extensionResolvers"];
  activityEvents: DemoState["activity"];
};

type AppState = {
  ready?: ReadyPayload;
  graphql?: GraphqlPayload;
};

const state: AppState = {};

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard" }).format(
    value,
  );
}

function setText(selector: string, value: unknown): void {
  const element = app?.querySelector<HTMLElement>(selector);
  if (element) {
    element.textContent = String(value);
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

function renderShell(): void {
  if (!app) {
    return;
  }

  app.innerHTML = `
    <header class="topbar">
      <div class="brand-lockup">
        <span class="brand-mark">F</span>
        <div>
          <strong>Forgepoint</strong>
          <span>Conference demo environment</span>
        </div>
      </div>
      <label class="global-search">
        <span>Search</span>
        <input type="search" value="forgepoint/forgepoint" aria-label="Search Forgepoint" />
      </label>
      <div class="topbar-actions">
        <span id="ready-pill" class="status-pill status-warn">offline</span>
        <code class="server-url">${escapeHtml(serverURL)}</code>
      </div>
    </header>

    <section class="forge-layout">
      <aside class="sidebar">
        <form id="operator-form" class="operator-form">
          <label for="operator-code">Operator code</label>
          <div class="operator-row">
            <input id="operator-code" name="operatorCode" type="password" autocomplete="off" value="${escapeHtml(seededOperatorCode)}" />
            <button type="submit">Connect</button>
          </div>
        </form>
        <nav class="repo-nav" aria-label="Repository navigation">
          <a class="active" href="#overview">Overview</a>
          <a href="#code">Code</a>
          <a href="#pulls">Pull requests</a>
          <a href="#checks">Checks</a>
          <a href="#extensions">Extensions</a>
          <a href="#activity">Activity</a>
        </nav>
      </aside>

      <main class="content">
        <section id="overview" class="repo-hero">
          <div>
            <span class="eyebrow">Private workspace</span>
            <h1 id="repo-title">forgepoint / forgepoint</h1>
            <p id="repo-description">Connect to load repository state.</p>
          </div>
          <div class="repo-actions">
            <button type="button">Watch</button>
            <button type="button">Star</button>
            <button type="button">Fork</button>
          </div>
        </section>

        <section class="metric-grid" aria-label="Repository metrics">
          <article><span>Stars</span><strong id="metric-stars">0</strong></article>
          <article><span>Forks</span><strong id="metric-forks">0</strong></article>
          <article><span>Watchers</span><strong id="metric-watchers">0</strong></article>
          <article><span>Checks</span><strong id="metric-checks">0/0</strong></article>
        </section>

        <section id="code" class="workbench">
          <div class="workbench-main panel">
            <div class="panel-heading">
              <div>
                <h2>Repository</h2>
                <p id="branch-summary">main</p>
              </div>
              <code id="commit-hash">------</code>
            </div>
            <div class="repo-workspace">
              <div id="file-tree" class="tree-host" aria-label="Repository file tree"></div>
              <div>
                <pre id="file-preview" class="file-preview"></pre>
                <div class="diff-panel">
                  <div class="diff-header">
                    <strong id="diff-path">Review diff</strong>
                    <span>Rendered by @pierre/diffs</span>
                  </div>
                  <div id="review-diff" class="review-diff"></div>
                </div>
              </div>
            </div>
          </div>
          <aside class="panel intelligence-panel">
            <h2>Repository Intelligence</h2>
            <dl>
              <div><dt>Language</dt><dd id="repo-language">unknown</dd></div>
              <div><dt>License</dt><dd id="repo-license">unknown</dd></div>
              <div><dt>Last update</dt><dd id="repo-updated">unknown</dd></div>
              <div><dt>Viewer</dt><dd id="viewer-state">anonymous</dd></div>
              <div><dt>Tree entries</dt><dd id="tree-count">0</dd></div>
              <div><dt>Blobs</dt><dd id="blob-count">0</dd></div>
            </dl>
            <h3>Refs</h3>
            <ol id="ref-list" class="compact-list"></ol>
          </aside>
        </section>

        <section class="panel">
          <div class="panel-heading">
            <div>
              <h2>Commits</h2>
              <p>Live commit history read from the local bare Git repository.</p>
            </div>
          </div>
          <ol id="commit-list" class="commit-list"></ol>
        </section>

        <section class="panel">
          <div class="panel-heading">
            <div>
              <h2>Blob Previews</h2>
              <p>Blob object metadata and previews from Git object storage.</p>
            </div>
          </div>
          <div id="blob-list" class="blob-list"></div>
        </section>

        <section id="pulls" class="panel">
          <div class="panel-heading">
            <div>
              <h2>Pull Requests</h2>
              <p>First-party PR extension data rendered in the host UI.</p>
            </div>
            <span id="graphql-pill" class="status-pill status-warn">waiting</span>
          </div>
          <div id="pull-list" class="pull-list"></div>
        </section>

        <section id="checks" class="panel">
          <div class="panel-heading">
            <div>
              <h2>Checks</h2>
              <p>Protected-branch status, CI evidence, and extension-owned signals.</p>
            </div>
            <span id="checks-pill" class="status-pill status-warn">waiting</span>
          </div>
          <div id="check-list" class="check-list"></div>
        </section>

        <section id="extensions" class="panel">
          <div class="panel-heading">
            <div>
              <h2>Extensions</h2>
              <p>Runtime-discovered manifests and ESM web components served by Rust.</p>
            </div>
            <span id="extension-pill" class="status-pill status-warn">not loaded</span>
          </div>
          <div id="extension-registry" class="extension-registry"></div>
          <div class="extension-grid">
            <forgepoint-extension-host id="host-ext_pull_requests" class="extension-frame"></forgepoint-extension-host>
            <forgepoint-extension-host id="host-ext_code_browser" class="extension-frame"></forgepoint-extension-host>
            <forgepoint-extension-host id="host-ext_checks" class="extension-frame"></forgepoint-extension-host>
          </div>
        </section>

        <section id="activity" class="activity-grid">
          <div class="panel">
            <div class="panel-heading">
              <h2>Live Events</h2>
              <span id="events-pill" class="status-pill status-warn">waiting</span>
            </div>
            <ol id="event-list" class="event-list"></ol>
          </div>
          <div class="panel">
            <div class="panel-heading">
              <h2>Clone</h2>
              <span class="status-pill status-ok">Git upload-pack live</span>
            </div>
            <code class="command">git clone ${escapeHtml(serverURL)}/git/forgepoint/forgepoint.git</code>
            <p class="muted">Smoke validation clones and fetches this seeded bare repository through the Astro origin with a scoped Forgepoint credential.</p>
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
      grantType: "urn:forgepoint:grant:operator-code",
      subjectToken: operatorCode,
      subjectTokenType: "urn:forgepoint:token-type:operator-code",
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
      "{ viewer { authenticated permissions } instance { id name publicURL capabilities } workspace repository extensionInstallations extensionResolvers activityEvents }",
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
  const demo: DemoState = {
    workspace: graphql.workspace,
    repository: graphql.repository,
    refs: graphql.repository.refs,
    branches: graphql.repository.branches,
    commits: graphql.repository.commits,
    treeEntries: graphql.repository.treeEntries,
    files: graphql.repository.files,
    blobs: graphql.repository.blobs,
    diff: graphql.repository.diff,
    pullRequests: graphql.repository.pullRequests,
    checks: graphql.repository.checks,
    extensions: graphql.extensionInstallations,
    extensionResolvers: graphql.extensionResolvers,
    activity: graphql.activityEvents,
  };
  const repo = demo.repository;
  const passing = demo.checks.filter((check) => check.conclusion === "SUCCESS").length;

  setStatus("#ready-pill", ready.ready, ready.ready ? "ready" : "not ready");
  setStatus("#graphql-pill", graphql.viewer.authenticated, "authenticated");
  setStatus("#checks-pill", passing === demo.checks.length, `${passing}/${demo.checks.length} passing`);
  setText("#repo-title", `${repo.owner} / ${repo.name}`);
  setText("#repo-description", repo.description);
  setText("#metric-stars", formatCount(repo.stars));
  setText("#metric-forks", formatCount(repo.forks));
  setText("#metric-watchers", formatCount(repo.watchers));
  setText("#metric-checks", `${passing}/${demo.checks.length}`);
  setText("#branch-summary", `${repo.defaultBranch} · ${demo.branches.length} branches`);
  setText("#commit-hash", repo.currentCommit);
  setText("#repo-language", repo.language);
  setText("#repo-license", repo.license);
  setText("#repo-updated", repo.updated);
  setText("#viewer-state", graphql.viewer.authenticated ? "operator credential" : "anonymous");
  setText("#tree-count", demo.treeEntries.length);
  setText("#blob-count", demo.blobs.length);

  void renderFiles(demo);
  renderRefs(demo);
  renderCommits(demo);
  renderBlobs(demo);
  renderPulls(demo);
  renderChecks(demo);
  renderExtensionRegistry(demo);
  renderActivity(demo);
}

async function renderFiles(demo: DemoState): Promise<void> {
  const treeMount = app?.querySelector<HTMLElement>("#file-tree");
  const preview = app?.querySelector<HTMLPreElement>("#file-preview");
  const diffPath = app?.querySelector<HTMLElement>("#diff-path");
  const reviewDiffMount = app?.querySelector<HTMLElement>("#review-diff");
  if (!treeMount || !preview || !reviewDiffMount) {
    return;
  }

  const fileByPath = new Map(demo.files.map((file) => [file.path, file]));
  const paths = demo.files.map((file) => file.path);
  const gitStatus: GitStatusEntry[] = demo.files.map((file) => ({
    path: file.path,
    status: statusForFile(file.status),
  }));

  repositoryTree?.cleanUp();
  treeMount.replaceChildren();
  repositoryTree = new FileTree({
    density: "compact",
    fileTreeSearchMode: "hide-non-matches",
    flattenEmptyDirectories: true,
    gitStatus,
    icons: "standard",
    initialExpansion: "open",
    initialSelectedPaths: [paths[0] ?? ""].filter(Boolean),
    onSelectionChange: (selectedPaths) => {
      const selected = fileByPath.get(selectedPaths[0] ?? "") ?? demo.files[0];
      preview.textContent = selected
        ? `${selected.path}\n${selected.oid} | ${selected.size} bytes\n\n${selected.preview}`
        : "";
    },
    paths,
    search: true,
    stickyFolders: true,
  });
  repositoryTree.render({ containerWrapper: treeMount });
  const first = demo.files[0];
  preview.textContent = first
    ? `${first.path}\n${first.oid} | ${first.size} bytes\n\n${first.preview}`
    : "";

  if (diffPath) {
    diffPath.textContent = demo.diff.path;
  }
  const patch = parsePatchFiles(demo.diff.patch, "forgepoint-demo", true)[0];
  const fileDiff = patch?.files[0];
  reviewDiff?.cleanUp();
  reviewDiffMount.replaceChildren();
  reviewDiff = new FileDiff({
    diffIndicators: "bars",
    diffStyle: "unified",
    hunkSeparators: "line-info-basic",
    lineDiffType: "word",
    overflow: "scroll",
    theme: "github-light",
  });
  if (fileDiff) {
    reviewDiff.render({ containerWrapper: reviewDiffMount, fileDiff });
  } else {
    reviewDiffMount.replaceChildren("No review diff available.");
  }
}

function renderRefs(demo: DemoState): void {
  const list = app?.querySelector<HTMLOListElement>("#ref-list");
  if (!list) {
    return;
  }
  list.innerHTML = demo.refs
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

function renderCommits(demo: DemoState): void {
  const list = app?.querySelector<HTMLOListElement>("#commit-list");
  if (!list) {
    return;
  }
  list.innerHTML = demo.commits
    .map(
      (commit) => `
        <li>
          <code>${escapeHtml(commit.shortOid)}</code>
          <div>
            <strong>${escapeHtml(commit.subject)}</strong>
            <span>${escapeHtml(commit.author)} | ${escapeHtml(commit.time)}</span>
          </div>
        </li>
      `,
    )
    .join("");
}

function renderBlobs(demo: DemoState): void {
  const list = app?.querySelector<HTMLElement>("#blob-list");
  if (!list) {
    return;
  }
  list.innerHTML = demo.blobs
    .slice(0, 6)
    .map(
      (blob) => `
        <article>
          <div>
            <strong>${escapeHtml(blob.path)}</strong>
            <span>${escapeHtml(blob.oid.slice(0, 12))} | ${blob.size} bytes</span>
          </div>
          <pre>${escapeHtml(blob.preview.slice(0, 360))}</pre>
        </article>
      `,
    )
    .join("");
}

function statusForFile(status: string): GitStatusEntry["status"] {
  if (status.includes("new") || status.includes("added")) {
    return "added";
  }
  if (status.includes("deleted")) {
    return "deleted";
  }
  if (status.includes("renamed")) {
    return "renamed";
  }
  if (status.includes("untracked")) {
    return "untracked";
  }
  return "modified";
}

function renderPulls(demo: DemoState): void {
  const list = app?.querySelector<HTMLElement>("#pull-list");
  if (!list) {
    return;
  }
  list.innerHTML = demo.pullRequests
    .map(
      (pull) => `
        <article>
          <div class="avatar">${escapeHtml(pull.avatar)}</div>
          <div>
            <strong>#${pull.number} ${escapeHtml(pull.title)}</strong>
            <span>${escapeHtml(pull.author)} wants to merge ${escapeHtml(pull.head)} into ${escapeHtml(pull.base)}</span>
            <small>${escapeHtml(pull.review)} · ${pull.comments} comments · ${escapeHtml(pull.changes)}</small>
          </div>
          <mark class="${pull.state.toLowerCase()}">${escapeHtml(pull.state)}</mark>
        </article>
      `,
    )
    .join("");
}

function renderChecks(demo: DemoState): void {
  const list = app?.querySelector<HTMLElement>("#check-list");
  if (!list) {
    return;
  }
  list.innerHTML = demo.checks
    .map(
      (check) => `
        <article>
          <span class="check-icon ${check.conclusion.toLowerCase()}"></span>
          <div>
            <strong>${escapeHtml(check.name)}</strong>
            <span>${escapeHtml(check.provider)} · ${escapeHtml(check.duration)}</span>
          </div>
          <mark class="${check.conclusion.toLowerCase()}">${escapeHtml(check.conclusion)}</mark>
        </article>
      `,
    )
    .join("");
}

function renderExtensionRegistry(demo: DemoState): void {
  const registry = app?.querySelector<HTMLElement>("#extension-registry");
  if (!registry) {
    return;
  }
  registry.innerHTML = demo.extensions
    .map((extension) => {
      const resolver = demo.extensionResolvers.find((item) => item.id === extension.id);
      return `
        <article>
          <strong>${escapeHtml(extension.name)}</strong>
          <span>${escapeHtml(extension.description)}</span>
          <mark>${escapeHtml(extension.status)} | ${escapeHtml(resolver?.outputType ?? "not executed")}</mark>
        </article>
      `;
    })
    .join("");
}

function renderActivity(demo: DemoState): void {
  const list = app?.querySelector<HTMLOListElement>("#event-list");
  if (!list) {
    return;
  }
  list.innerHTML = demo.activity
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

async function renderEvents(): Promise<void> {
  const list = app?.querySelector<HTMLOListElement>("#event-list");
  if (!list) {
    return;
  }
  let count = 0;
  for await (const event of client.events()) {
    const typedEvent = event as ForgepointEvent;
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

async function importExtensionAsset(pathname: string): Promise<void> {
  const session = await client.issueExtensionSession();
  const url = new URL(pathname, serverURL);
  url.searchParams.set("session", session);
  await import(/* @vite-ignore */ url.href);
}

async function mountExtension(extensionId: (typeof EXTENSIONS)[number]): Promise<void> {
  const manifest = await fetchExtensionManifest(extensionId);
  await importExtensionAsset(manifest.assets.entry);

  const host = app?.querySelector(`#host-${extensionId}`) as
    | (HTMLElement & {
        configure?: (manifest: ExtensionUiManifest, context: Record<string, unknown>) => void;
      })
    | null;
  host?.configure?.(manifest, {
    forgepointClient: client,
    viewer: { authenticated: true },
    resource: DEFAULT_RESOURCE,
    routeParams: { workspace: "forgepoint", repo: "forgepoint" },
    capabilities: { extensionRuntime: true },
  });
}

async function mountExtensions(): Promise<void> {
  await Promise.all(EXTENSIONS.map((extensionId) => mountExtension(extensionId)));
  setStatus("#extension-pill", true, `${EXTENSIONS.length} loaded`);
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

  if (seededOperatorCode) {
    connect(seededOperatorCode).catch((error) => {
      setStatus("#ready-pill", false, "error");
      setText("#viewer-state", error instanceof Error ? error.message : "connection failed");
    });
  }
}

renderShell();
bind();
