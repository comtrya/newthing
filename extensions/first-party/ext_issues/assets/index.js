function defineExtension(def) {
  if (typeof def.id !== "string" || def.id.length === 0) {
    throw new Error("extension id must be a non-empty string");
  }
  if (typeof def.setup !== "function") {
    throw new Error("extension setup must be a function");
  }
  return def;
}

const STATE_TONE = {
  OPEN: { label: "open", color: "var(--ink-go, #008873)" },
  CLOSED: { label: "closed", color: "var(--ink-faint, #888)" },
};

const ISSUES_LIST_QUERY = `query($workspaceId: ID, $repositoryId: ID, $state: String) {
  issues.list(workspaceId: $workspaceId, repositoryId: $repositoryId, state: $state) {
    id workspaceId repositoryId number title state authorRef labels createdAt
  }
}`;

const ISSUE_BY_REF_QUERY = `query($ref: ResourceURN!) {
  issues.byRef(ref: $ref) {
    id workspaceId repositoryId number title bodyMarkdown state stateReason authorRef labels createdAt closedAt
  }
}`;

const ISSUE_BY_NUMBER_QUERY = `query($workspaceId: ID!, $number: Int!) {
  issues.byNumber(workspaceId: $workspaceId, number: $number) {
    id workspaceId repositoryId number title bodyMarkdown state stateReason authorRef labels createdAt closedAt
  }
}`;

const CREATE_ISSUE_MUTATION = `mutation($input: CreateIssueInput!) {
  issues.create(input: $input) {
    id workspaceId number title state
  }
}`;

const CLOSE_ISSUE_MUTATION = `mutation($input: CloseIssueInput!) {
  issues.close(input: $input) { id state stateReason closedAt }
}`;

const REOPEN_ISSUE_MUTATION = `mutation($input: ReopenIssueInput!) {
  issues.reopen(input: $input) { id state }
}`;

// ── Issue card (kind="issue") ───────────────────────────────────────────────
class ComtryaIssueCard extends HTMLElement {
  ref;
  comtryaClient;
  viewer;

  async connectedCallback() {
    this.dataset.smoke = "issue-card";
    const ref = this.ref ?? this.getAttribute("ref") ?? "";
    if (!ref) {
      this.replaceChildren(buildLine("issue-card: missing ref", "warn"));
      return;
    }
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) {
      this.replaceChildren(buildLine("issue-card: no client", "warn"));
      return;
    }
    renderSkeleton(this, ref);
    try {
      const data = await client.query(ISSUE_BY_REF_QUERY, { ref });
      const issue = data?.issues?.byRef;
      if (!issue) {
        renderFallback(this, ref, "issue not found");
        return;
      }
      renderIssueCard(this, issue);
    } catch (err) {
      renderFallback(this, ref, err instanceof Error ? err.message : String(err));
    }
  }
}

function renderSkeleton(host, ref) {
  host.replaceChildren(buildLine(`Loading ${ref}…`, "muted"));
}

function renderFallback(host, ref, message) {
  host.replaceChildren(
    buildLine(ref, "muted"),
    buildLine(message, "warn"),
  );
}

function renderIssueCard(host, issue) {
  const wrap = document.createElement("article");
  wrap.dataset.issueId = issue.id;
  wrap.dataset.smoke = "issue-card-body";
  wrap.style.cssText = "padding: 8px 12px; border: 1px solid var(--ink-rule, #d0cfc8);";

  const titleRow = document.createElement("div");
  titleRow.style.cssText = "display: flex; gap: 8px; align-items: baseline;";
  const pill = document.createElement("span");
  const tone = STATE_TONE[issue.state] ?? STATE_TONE.CLOSED;
  pill.textContent = tone.label;
  pill.style.cssText = `font-family: var(--mono, monospace); font-size: 10px; padding: 1px 8px; border: 1px solid ${tone.color}; color: ${tone.color};`;
  const number = document.createElement("span");
  number.textContent = `#${issue.number}`;
  number.style.cssText = "font-family: var(--mono, monospace); font-size: 12px; color: var(--ink-faint, #888);";
  const titleLink = document.createElement("a");
  titleLink.href = `/x/issues/${issue.workspaceId}/${issue.number}`;
  titleLink.textContent = issue.title;
  titleLink.style.cssText = "color: inherit; font-family: var(--display); font-weight: 600;";
  titleRow.append(pill, number, titleLink);

  const meta = document.createElement("div");
  meta.style.cssText = "margin-top: 4px; font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-faint, #888);";
  const labels = Array.isArray(issue.labels) && issue.labels.length > 0 ? ` · ${issue.labels.join(", ")}` : "";
  meta.textContent = `by ${issue.authorRef ?? "unknown"}${labels}`;

  wrap.append(titleRow, meta);
  host.replaceChildren(wrap);
}

// ── Slot widget: repository.issues ──────────────────────────────────────────
class ComtryaIssuesRepoList extends HTMLElement {
  comtryaClient;
  viewer;
  repositoryId;
  repositoryGroups;
  repositoryName;

  async connectedCallback() {
    this.dataset.smoke = "issues-repo-list";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) {
      this.replaceChildren(buildLine("issues: no client", "warn"));
      return;
    }
    this.replaceChildren(buildLine("Loading issues…", "muted"));
    try {
      // Workspace id is on the page body via data-* (set by the SSR
      // pages); fall back to the seeded workspace if not present.
      const workspaceId =
        document.body.dataset.workspaceId ?? "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3";
      const data = await client.query(ISSUES_LIST_QUERY, {
        workspaceId,
        repositoryId: this.repositoryId ?? null,
        state: null,
      });
      renderIssuesList(this, data?.issues?.list ?? [], { kind: "repo", workspaceId });
    } catch (err) {
      renderFallback(this, "issues", err instanceof Error ? err.message : String(err));
    }
  }
}

function renderIssuesList(host, issues, ctx) {
  const wrap = document.createElement("section");
  wrap.dataset.smoke = "issues-list";

  const header = document.createElement("header");
  header.style.cssText = "display: flex; align-items: baseline; justify-content: space-between;";
  const title = document.createElement("h3");
  title.style.cssText = "margin: 0; font-family: var(--display); font-size: 14px;";
  title.textContent = "Issues";
  const newLink = document.createElement("a");
  newLink.href = `/x/issues/new${ctx?.workspaceId ? `?workspaceId=${ctx.workspaceId}` : ""}`;
  newLink.textContent = "+ new";
  newLink.style.cssText = "font-family: var(--mono, monospace); font-size: 12px; color: var(--ink-faint, #888); text-decoration: none;";
  header.append(title, newLink);
  wrap.append(header);

  if (issues.length === 0) {
    wrap.append(buildLine("No issues yet.", "muted"));
    host.replaceChildren(wrap);
    return;
  }
  const list = document.createElement("ul");
  list.style.cssText = "list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 6px;";
  for (const issue of issues) {
    const li = document.createElement("li");
    const card = document.createElement("comtrya-issue-card");
    card.ref = `comtrya://issue/${issue.id}`;
    card.comtryaClient = host.comtryaClient ?? findAncestorProperty(host, "comtryaClient");
    li.append(card);
    list.append(li);
  }
  wrap.append(list);
  host.replaceChildren(wrap);
}

// ── Routes ──────────────────────────────────────────────────────────────────
class ComtryaIssuesIndex extends HTMLElement {
  comtryaClient;
  viewer;

  async connectedCallback() {
    this.dataset.smoke = "issues-index";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) {
      this.replaceChildren(buildLine("issues index: no client", "warn"));
      return;
    }
    try {
      const data = await client.query(ISSUES_LIST_QUERY, {
        workspaceId: "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
        repositoryId: null,
        state: null,
      });
      const layout = document.createElement("main");
      layout.style.cssText = "padding: 24px 0; max-width: 720px;";
      const heading = document.createElement("h1");
      heading.style.cssText = "font-family: var(--display); margin: 0 0 16px;";
      heading.textContent = "Issues";
      layout.append(heading);
      renderIssuesList(layout, data?.issues?.list ?? [], { workspaceId: "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3" });
      this.replaceChildren(layout);
    } catch (err) {
      this.replaceChildren(buildLine(err instanceof Error ? err.message : String(err), "warn"));
    }
  }
}

class ComtryaIssueDetail extends HTMLElement {
  comtryaClient;
  viewer;
  routeParams;

  async connectedCallback() {
    this.dataset.smoke = "issue-detail";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    const ws = this.routeParams?.params?.workspaceId;
    const number = Number(this.routeParams?.params?.number);
    if (!client || !ws || !Number.isFinite(number)) {
      this.replaceChildren(buildLine("issue-detail: missing params", "warn"));
      return;
    }
    try {
      const data = await client.query(ISSUE_BY_NUMBER_QUERY, { workspaceId: ws, number });
      const issue = data?.issues?.byNumber;
      if (!issue) {
        this.replaceChildren(buildLine(`No issue #${number} in ${ws}`, "warn"));
        return;
      }
      this.replaceChildren(renderIssueDetail(issue, client));
    } catch (err) {
      this.replaceChildren(buildLine(err instanceof Error ? err.message : String(err), "warn"));
    }
  }
}

function renderIssueDetail(issue, client) {
  const main = document.createElement("main");
  main.dataset.issueId = issue.id;
  main.dataset.smoke = "issue-detail-main";
  main.style.cssText = "padding: 24px 0; max-width: 720px; display: grid; gap: 16px;";

  const tone = STATE_TONE[issue.state] ?? STATE_TONE.CLOSED;
  const header = document.createElement("header");
  const title = document.createElement("h1");
  title.style.cssText = "margin: 0; font-family: var(--display);";
  title.textContent = issue.title;
  const meta = document.createElement("div");
  meta.style.cssText = "margin-top: 4px; font-family: var(--mono, monospace); font-size: 12px; color: var(--ink-faint, #888); display: flex; gap: 8px;";
  const pill = document.createElement("span");
  pill.textContent = tone.label;
  pill.style.cssText = `padding: 1px 8px; border: 1px solid ${tone.color}; color: ${tone.color};`;
  meta.append(pill, document.createTextNode(`#${issue.number} · opened by ${issue.authorRef ?? "unknown"} · ${issue.createdAt}`));
  header.append(title, meta);
  main.append(header);

  const body = document.createElement("article");
  body.style.cssText = "padding: 12px; border: 1px solid var(--ink-rule, #d0cfc8); font-size: 13px; white-space: pre-wrap;";
  body.textContent = issue.bodyMarkdown || "(no description)";
  main.append(body);

  // Parent epic (if linked via part-of)
  const epicsBox = document.createElement("section");
  epicsBox.dataset.smoke = "issue-detail-epics";
  epicsBox.style.cssText = "display: grid; gap: 6px;";
  const epicsTitle = document.createElement("h3");
  epicsTitle.style.cssText = "margin: 0; font-family: var(--display); font-size: 13px;";
  epicsTitle.textContent = "Part of";
  epicsBox.append(epicsTitle);
  const epicsList = document.createElement("div");
  epicsList.style.cssText = "display: grid; gap: 6px;";
  epicsBox.append(epicsList);
  main.append(epicsBox);

  client
    .query(
      `query($from: ResourceURN!) { relations.outgoing(from: $from, kind: "comtrya://rel/part-of") { id to } }`,
      { from: `comtrya://issue/${issue.id}` },
    )
    .then((relData) => {
      const rels = relData?.relations?.outgoing ?? [];
      if (rels.length === 0) {
        epicsList.append(buildLine("not in any epic", "muted"));
        return;
      }
      for (const rel of rels) {
        const card = document.createElement("comtrya-resource-card");
        card.setAttribute("ref", rel.to);
        card.comtryaClient = client;
        epicsList.append(card);
      }
    })
    .catch((err) => epicsList.append(buildLine(`epics: ${err.message}`, "warn")));

  // Action row: close / reopen
  const actions = document.createElement("div");
  actions.style.cssText = "display: flex; gap: 8px;";
  if (issue.state === "OPEN") {
    actions.append(
      buildActionButton("Close issue", async () => {
        await client.mutate(CLOSE_ISSUE_MUTATION, {
          input: { id: issue.id, reason: "completed" },
        });
        window.location.reload();
      }),
    );
  } else {
    actions.append(
      buildActionButton("Reopen issue", async () => {
        await client.mutate(REOPEN_ISSUE_MUTATION, { input: { id: issue.id } });
        window.location.reload();
      }),
    );
  }
  main.append(actions);

  // Comments
  const thread = document.createElement("comtrya-comment-thread");
  thread.setAttribute("target", `comtrya://issue/${issue.id}`);
  thread.comtryaClient = client;
  main.append(thread);

  return main;
}

class ComtryaIssueNew extends HTMLElement {
  comtryaClient;
  viewer;

  connectedCallback() {
    this.dataset.smoke = "issue-new";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) {
      this.replaceChildren(buildLine("issue-new: no client", "warn"));
      return;
    }
    const main = document.createElement("main");
    main.style.cssText = "padding: 24px 0; max-width: 560px; display: grid; gap: 16px;";
    const heading = document.createElement("h1");
    heading.style.cssText = "margin: 0; font-family: var(--display);";
    heading.textContent = "New issue";
    main.append(heading);

    const form = document.createElement("form");
    form.style.cssText = "display: grid; gap: 12px;";
    const titleInput = document.createElement("input");
    titleInput.required = true;
    titleInput.placeholder = "Issue title";
    titleInput.style.cssText = "padding: 8px 10px; font-family: var(--mono, monospace); font-size: 14px; border: 1px solid var(--ink-rule, #d0cfc8);";
    const bodyInput = document.createElement("textarea");
    bodyInput.rows = 6;
    bodyInput.placeholder = "Description (optional)";
    bodyInput.style.cssText = "padding: 8px 10px; font-family: var(--mono, monospace); font-size: 13px; border: 1px solid var(--ink-rule, #d0cfc8); resize: vertical;";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Create issue";
    submit.style.cssText = "padding: 8px 14px; font-family: var(--display); font-weight: 600; cursor: pointer; justify-self: start;";
    form.append(titleInput, bodyInput, submit);

    const errorBox = document.createElement("p");
    errorBox.setAttribute("role", "alert");
    errorBox.style.cssText = "color: var(--ink-warn, #c2410c); font-family: var(--mono, monospace); font-size: 12px; display: none;";
    form.append(errorBox);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try {
        const result = await client.mutate(CREATE_ISSUE_MUTATION, {
          input: {
            workspaceId: "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            title: titleInput.value.trim(),
            bodyMarkdown: bodyInput.value,
          },
        });
        const created = result?.issues?.create;
        if (created) {
          window.location.assign(`/x/issues/${created.workspaceId}/${created.number}`);
        }
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : String(err);
        errorBox.style.display = "block";
        submit.disabled = false;
      }
    });

    main.append(form);
    this.replaceChildren(main);
  }
}

// ── helpers ────────────────────────────────────────────────────────────────
function buildLine(text, tone) {
  const p = document.createElement("p");
  p.style.cssText = `margin: 4px 0; font-family: var(--mono, monospace); font-size: 12px; color: ${
    tone === "warn" ? "var(--ink-warn, #c2410c)" : "var(--ink-faint, #888)"
  };`;
  p.textContent = text;
  return p;
}

function buildActionButton(label, handler) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.style.cssText = "padding: 6px 14px; font-family: var(--mono, monospace); font-size: 12px; cursor: pointer;";
  btn.addEventListener("click", () => {
    btn.disabled = true;
    handler().catch((err) => {
      btn.textContent = `error: ${err.message}`;
      btn.disabled = false;
    });
  });
  return btn;
}

function findAncestorProperty(node, prop) {
  let cursor = node.parentElement;
  while (cursor) {
    if (cursor[prop] !== undefined && cursor[prop] !== null) return cursor[prop];
    cursor = cursor.parentElement;
  }
  return undefined;
}

if (!customElements.get("comtrya-issue-card")) {
  customElements.define("comtrya-issue-card", ComtryaIssueCard);
}
if (!customElements.get("comtrya-issues-repo-list")) {
  customElements.define("comtrya-issues-repo-list", ComtryaIssuesRepoList);
}
if (!customElements.get("comtrya-issues-index")) {
  customElements.define("comtrya-issues-index", ComtryaIssuesIndex);
}
if (!customElements.get("comtrya-issue-detail")) {
  customElements.define("comtrya-issue-detail", ComtryaIssueDetail);
}
if (!customElements.get("comtrya-issue-new")) {
  customElements.define("comtrya-issue-new", ComtryaIssueNew);
}

export default defineExtension({
  id: "ext_issues",
  setup(host) {
    host.registerCard({
      resourceKind: "issue",
      element: "comtrya-issue-card",
      requiredPermission: "issues.read",
    });
    host.registerSlot("repository.issues", {
      element: "comtrya-issues-repo-list",
      requiredPermission: "issues.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-issues-index",
      requiredPermission: "issues.read",
    });
    host.registerRoute("/new", {
      element: "comtrya-issue-new",
      requiredPermission: "issues.write",
    });
    host.registerRoute("/:workspaceId/:number", {
      element: "comtrya-issue-detail",
      requiredPermission: "issues.read",
    });
  },
});
