import { HttpComtryaClient } from "./client";
import type { ExtensionUiManifest, ComtryaClient, ComtryaEvent } from "./contracts";
import { validateUiManifest } from "./contracts";
import "./extension-host";

const DEFAULT_RESOURCE = "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
const TOKEN_ACTIONS = ["graphql:read", "graphql:write", "events:read", "git:read", "checks:read"];

const app = document.querySelector<HTMLElement>("#app");
const serverURL = import.meta.env.PUBLIC_COMTRYA_SERVER_URL || window.location.origin;
const seededOperatorCode = import.meta.env.PUBLIC_COMTRYA_OPERATOR_CODE || "";
const client = new HttpComtryaClient(serverURL);
const extensionClient: ComtryaClient = {
  query: async <TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): Promise<TData> => {
    if (state.graphql) {
      return state.graphql as TData;
    }
    return client.query<TData, TVars>(document, variables, opts);
  },
  mutate: <TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): Promise<TData> => client.mutate<TData, TVars>(document, variables, opts),
  subscribe: <TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string },
  ): AsyncIterable<TData> => client.subscribe<TData, TVars>(document, variables, opts),
  permissions: (resourceURN: string): Promise<string[]> => client.permissions(resourceURN),
  events: (filter, opts): AsyncIterable<ComtryaEvent> => client.events(filter, opts),
  navigate: (path, opts): void => client.navigate(path, opts),
  toast: (level, message): void => client.toast(level, message),
};

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
  extensions: ExtensionInstallation[];
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

const SLOT_LABELS: Record<string, { title: string; detail: string }> = {
  "repository.code": {
    title: "Code Browser",
    detail: "Connect to load repository files.",
  },
  "repository.overview": {
    title: "Pull Requests",
    detail: "Connect to load review state.",
  },
  "repository.checks": {
    title: "Checks",
    detail: "Connect to load check runs.",
  },
};

function slotPlaceholderMarkup(slotName: string): string {
  const label = SLOT_LABELS[slotName] ?? {
    title: "Extension slot",
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
    <header class="topbar">
      <div class="brand-lockup">
        <span class="brand-mark">F</span>
        <div>
          <strong>Comtrya</strong>
          <span>Conference demo environment</span>
        </div>
      </div>
      <label class="global-search">
        <span>Search</span>
        <input type="search" value="comtrya/comtrya" aria-label="Search Comtrya" />
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
            <h1 id="repo-title">comtrya / comtrya</h1>
            <p id="repo-description">Connect to load repository state.</p>
          </div>
          <div class="repo-actions">
            <button type="button">Watch</button>
            <button type="button">Star</button>
            <button type="button">Fork</button>
          </div>
        </section>

        <section class="metric-grid" aria-label="Repository metrics">
          <article><span>Refs</span><strong id="metric-refs">0</strong></article>
          <article><span>Branches</span><strong id="metric-branches">0</strong></article>
          <article><span>Files</span><strong id="metric-files">0</strong></article>
          <article><span>Checks</span><strong id="metric-checks">0/0</strong></article>
        </section>

        <section class="repo-context-grid">
          <aside class="panel intelligence-panel">
            <div class="panel-heading">
              <div>
                <h2>Repository Context</h2>
                <p id="branch-summary">main</p>
              </div>
              <code id="commit-hash">------</code>
            </div>
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
          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>Commits</h2>
                <p>Live commit history read from the local bare Git repository.</p>
              </div>
            </div>
            <ol id="commit-list" class="commit-list"></ol>
          </section>
        </section>

        <div id="extension-slots" class="extension-surfaces" data-smoke="manifest-driven-extension-slots">
          <section id="code" class="panel extension-zone">
            <div class="panel-heading">
              <div>
                <h2>Code Browser</h2>
                <p>Tree, blobs, and review context.</p>
              </div>
              <span class="status-pill status-warn">extension</span>
            </div>
            <div class="extension-slot-mount" data-extension-slot-mount="repository.code">
              ${slotPlaceholderMarkup("repository.code")}
            </div>
          </section>

          <section id="pulls" class="panel extension-zone">
            <div class="panel-heading">
              <div>
                <h2>Pull Requests</h2>
                <p>Reviews, branch comparison, and merge readiness.</p>
              </div>
              <span id="graphql-pill" class="status-pill status-warn">waiting</span>
            </div>
            <div class="extension-slot-mount" data-extension-slot-mount="repository.overview">
              ${slotPlaceholderMarkup("repository.overview")}
            </div>
          </section>

          <section id="checks" class="panel extension-zone">
            <div class="panel-heading">
              <div>
                <h2>Checks</h2>
                <p>CI, deployment evidence, and protected branch state.</p>
              </div>
              <span id="checks-pill" class="status-pill status-warn">waiting</span>
            </div>
            <div class="extension-slot-mount" data-extension-slot-mount="repository.checks">
              ${slotPlaceholderMarkup("repository.checks")}
            </div>
          </section>
        </div>

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
            <code class="command">git clone ${escapeHtml(serverURL)}/git/comtrya/comtrya.git</code>
            <p class="muted">Smoke validation clones and fetches this seeded bare repository through the Astro origin with a scoped Comtrya credential.</p>
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
  setText("#metric-refs", formatCount(demo.refs.length));
  setText("#metric-branches", formatCount(demo.branches.length));
  setText("#metric-files", formatCount(demo.files.length));
  setText("#metric-checks", `${passing}/${demo.checks.length}`);
  setText("#branch-summary", `${repo.defaultBranch} · ${demo.branches.length} branches`);
  setText("#commit-hash", repo.currentCommit);
  setText("#repo-language", repo.language);
  setText("#repo-license", repo.license);
  setText("#repo-updated", repo.updated);
  setText("#viewer-state", graphql.viewer.authenticated ? "operator credential" : "anonymous");
  setText("#tree-count", demo.treeEntries.length);
  setText("#blob-count", demo.blobs.length);

  renderRefs(demo);
  renderCommits(demo);
  renderExtensionRegistry(demo);
  renderActivity(demo);
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
  const resolver = graphql?.extensionResolvers.find((candidate) => candidate.id === installation.id);
  return {
    comtryaClient: extensionClient,
    viewer: graphql?.viewer ?? { authenticated: false },
    resource: DEFAULT_RESOURCE,
    routeParams: { workspace: "comtrya", repo: "comtrya" },
    capabilities: { extensionRuntime: graphql?.instance.capabilities.extensionRuntime === true },
    data: {
      slot: slotName,
      workspace: graphql?.workspace,
      repository: graphql?.repository,
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
  const mounts = app?.querySelectorAll<HTMLElement>("[data-extension-slot-mount]") ?? [];
  for (const mount of mounts) {
    if (mount.dataset.extensionSlotMount === slotName) {
      return mount;
    }
  }
  const fallback = app?.querySelector<HTMLElement>("#extension-slots");
  return fallback?.querySelector("[data-extension-slot-mount]") ? undefined : (fallback ?? undefined);
}

function clearExtensionSlotMounts(): void {
  const mounts = app?.querySelectorAll<HTMLElement>("[data-extension-slot-mount]") ?? [];
  for (const mount of mounts) {
    delete mount.dataset.extensionMounted;
    mount.innerHTML = slotPlaceholderMarkup(mount.dataset.extensionSlotMount ?? "");
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

function renderIssueForSlots(
  slots: ExtensionUiManifest["slots"],
  issue: ExtensionMountIssue,
): void {
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

  if (seededOperatorCode) {
    connect(seededOperatorCode).catch((error) => {
      setStatus("#ready-pill", false, "error");
      setText("#viewer-state", error instanceof Error ? error.message : "connection failed");
    });
  }
}

renderShell();
bind();
