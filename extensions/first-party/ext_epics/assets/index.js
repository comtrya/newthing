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
  PLANNED: "#888",
  IN_PROGRESS: "#008873",
  AT_RISK: "#f2c100",
  DONE: "#008873",
  CANCELED: "#888",
};

const EPIC_BY_REF_QUERY = `query($ref: ResourceURN!) {
  epics.byRef(ref: $ref) {
    id workspaceId title bodyMarkdown state targetDate ownerRef labels createdAt closedAt
  }
}`;

const EPICS_LIST_QUERY = `query($workspaceId: ID!, $state: String) {
  epics.list(workspaceId: $workspaceId, state: $state) {
    id workspaceId title state targetDate ownerRef labels
  }
}`;

const EPIC_PROGRESS_QUERY = `query($ref: ResourceURN!) {
  epics.progress(ref: $ref) {
    issuesOpen issuesClosed childEpicsOpen childEpicsClosed percentComplete
  }
}`;

const EPIC_ISSUES_IN_QUERY = `query($ref: ResourceURN!) {
  epics.issuesIn(ref: $ref)
}`;

const CREATE_EPIC_MUTATION = `mutation($input: CreateEpicInput!) {
  epics.create(input: $input) { id workspaceId title state }
}`;

const CHANGE_STATE_MUTATION = `mutation($input: ChangeEpicStateInput!) {
  epics.changeState(input: $input) { id state }
}`;

// ── Card renderer (kind="epic") ─────────────────────────────────────────────
class ComtryaEpicCard extends HTMLElement {
  ref;
  comtryaClient;
  viewer;

  async connectedCallback() {
    this.dataset.smoke = "epic-card";
    const ref = this.ref ?? this.getAttribute("ref") ?? "";
    if (!ref) {
      this.replaceChildren(line("epic-card: missing ref", "warn"));
      return;
    }
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) {
      this.replaceChildren(line("epic-card: no client", "warn"));
      return;
    }
    this.replaceChildren(line(`Loading ${ref}…`, "muted"));
    try {
      const data = await client.query(EPIC_BY_REF_QUERY, { ref });
      const epic = data?.epics?.byRef;
      if (!epic) {
        this.replaceChildren(line(`${ref} unavailable`, "muted"));
        return;
      }
      const progress = await client
        .query(EPIC_PROGRESS_QUERY, { ref })
        .then((p) => p?.epics?.progress)
        .catch(() => null);
      this.replaceChildren(renderEpicCard(epic, progress));
    } catch (err) {
      this.replaceChildren(line(err instanceof Error ? err.message : String(err), "warn"));
    }
  }
}

function renderEpicCard(epic, progress) {
  const wrap = document.createElement("article");
  wrap.dataset.smoke = "epic-card-body";
  wrap.style.cssText = "padding: 10px 12px; border: 1px solid var(--ink-rule, #d0cfc8); display: grid; gap: 6px;";

  const head = document.createElement("div");
  head.style.cssText = "display: flex; align-items: baseline; gap: 8px;";
  const pill = document.createElement("span");
  pill.textContent = epic.state.toLowerCase().replace("_", " ");
  const tone = STATE_TONE[epic.state] ?? "#888";
  pill.style.cssText = `font-family: var(--mono, monospace); font-size: 10px; padding: 1px 8px; border: 1px solid ${tone}; color: ${tone};`;
  const link = document.createElement("a");
  link.href = `/x/epics/${epic.workspaceId}/${epic.id}`;
  link.textContent = epic.title;
  link.style.cssText = "color: inherit; font-family: var(--display); font-weight: 600;";
  head.append(pill, link);
  wrap.append(head);

  if (progress) {
    const totalIssues = (progress.issuesOpen ?? 0) + (progress.issuesClosed ?? 0);
    const bar = document.createElement("div");
    bar.style.cssText = "display: flex; align-items: center; gap: 8px; font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-faint, #888);";
    bar.textContent = `${progress.issuesClosed}/${totalIssues} issues · ${progress.percentComplete}% complete`;
    wrap.append(bar);
  }
  if (epic.targetDate) {
    const due = document.createElement("div");
    due.style.cssText = "font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-faint, #888);";
    due.textContent = `target: ${epic.targetDate}`;
    wrap.append(due);
  }

  return wrap;
}

// ── Slot widget: workspace.epics ───────────────────────────────────────────
class ComtryaEpicsBoard extends HTMLElement {
  comtryaClient;
  viewer;

  async connectedCallback() {
    this.dataset.smoke = "epics-board";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) {
      this.replaceChildren(line("epics: no client", "warn"));
      return;
    }
    this.replaceChildren(line("Loading epics…", "muted"));
    try {
      const data = await client.query(EPICS_LIST_QUERY, {
        workspaceId: "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
        state: null,
      });
      renderEpicsList(this, data?.epics?.list ?? [], "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3");
    } catch (err) {
      this.replaceChildren(line(err instanceof Error ? err.message : String(err), "warn"));
    }
  }
}

function renderEpicsList(host, epics, workspaceId) {
  const wrap = document.createElement("section");
  wrap.dataset.smoke = "epics-list";

  const header = document.createElement("header");
  header.style.cssText = "display: flex; align-items: baseline; justify-content: space-between;";
  const title = document.createElement("h3");
  title.style.cssText = "margin: 0; font-family: var(--display); font-size: 14px;";
  title.textContent = "Epics";
  const newLink = document.createElement("a");
  newLink.href = `/x/epics/new?workspaceId=${workspaceId}`;
  newLink.textContent = "+ new";
  newLink.style.cssText = "font-family: var(--mono, monospace); font-size: 12px; color: var(--ink-faint, #888); text-decoration: none;";
  header.append(title, newLink);
  wrap.append(header);

  if (epics.length === 0) {
    wrap.append(line("No epics yet.", "muted"));
    host.replaceChildren(wrap);
    return;
  }
  const list = document.createElement("ul");
  list.style.cssText = "list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 8px;";
  for (const epic of epics) {
    const li = document.createElement("li");
    const card = document.createElement("comtrya-epic-card");
    card.ref = `comtrya://epic/${epic.id}`;
    card.comtryaClient = host.comtryaClient ?? findAncestorProperty(host, "comtryaClient");
    li.append(card);
    list.append(li);
  }
  wrap.append(list);
  host.replaceChildren(wrap);
}

// ── Routes ─────────────────────────────────────────────────────────────────
class ComtryaEpicsIndex extends HTMLElement {
  comtryaClient;
  viewer;
  async connectedCallback() {
    this.dataset.smoke = "epics-index";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) return;
    try {
      const data = await client.query(EPICS_LIST_QUERY, {
        workspaceId: "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
        state: null,
      });
      const layout = document.createElement("main");
      layout.style.cssText = "padding: 24px 0; max-width: 720px;";
      const heading = document.createElement("h1");
      heading.style.cssText = "font-family: var(--display); margin: 0 0 16px;";
      heading.textContent = "Epics";
      layout.append(heading);
      renderEpicsList(layout, data?.epics?.list ?? [], "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3");
      this.replaceChildren(layout);
    } catch (err) {
      this.replaceChildren(line(err instanceof Error ? err.message : String(err), "warn"));
    }
  }
}

class ComtryaEpicDetail extends HTMLElement {
  comtryaClient;
  viewer;
  routeParams;

  async connectedCallback() {
    this.dataset.smoke = "epic-detail";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    const id = this.routeParams?.params?.id;
    if (!client || !id) {
      this.replaceChildren(line("epic-detail: missing params", "warn"));
      return;
    }
    const ref = `comtrya://epic/${id}`;
    try {
      const data = await client.query(EPIC_BY_REF_QUERY, { ref });
      const epic = data?.epics?.byRef;
      if (!epic) {
        this.replaceChildren(line(`No epic ${id}`, "warn"));
        return;
      }
      this.replaceChildren(renderEpicDetail(epic, client, ref));
    } catch (err) {
      this.replaceChildren(line(err instanceof Error ? err.message : String(err), "warn"));
    }
  }
}

function renderEpicDetail(epic, client, ref) {
  const main = document.createElement("main");
  main.dataset.smoke = "epic-detail-main";
  main.style.cssText = "padding: 24px 0; max-width: 720px; display: grid; gap: 16px;";

  const header = document.createElement("header");
  const title = document.createElement("h1");
  title.style.cssText = "margin: 0; font-family: var(--display);";
  title.textContent = epic.title;
  const meta = document.createElement("div");
  meta.style.cssText = "font-family: var(--mono, monospace); font-size: 12px; color: var(--ink-faint, #888); margin-top: 4px;";
  meta.textContent = `${epic.state} · created ${epic.createdAt}${epic.targetDate ? ` · target ${epic.targetDate}` : ""}`;
  header.append(title, meta);
  main.append(header);

  const body = document.createElement("article");
  body.style.cssText = "padding: 12px; border: 1px solid var(--ink-rule, #d0cfc8); white-space: pre-wrap;";
  body.textContent = epic.bodyMarkdown || "(no description)";
  main.append(body);

  // Progress
  const progressBox = document.createElement("section");
  progressBox.dataset.smoke = "epic-progress";
  progressBox.append(buildHeading("Progress"));
  const progressLine = document.createElement("div");
  progressLine.style.cssText = "font-family: var(--mono, monospace); font-size: 12px;";
  progressBox.append(progressLine);
  main.append(progressBox);

  client
    .query(EPIC_PROGRESS_QUERY, { ref })
    .then((data) => {
      const p = data?.epics?.progress;
      if (p) {
        const total = (p.issuesOpen ?? 0) + (p.issuesClosed ?? 0);
        progressLine.textContent = `${p.issuesClosed}/${total} issues closed · ${p.percentComplete}%`;
      }
    })
    .catch(() => {});

  // Issues
  const issuesBox = document.createElement("section");
  issuesBox.dataset.smoke = "epic-issues";
  issuesBox.append(buildHeading("Issues in this epic"));
  const issuesList = document.createElement("div");
  issuesList.style.cssText = "display: grid; gap: 6px;";
  issuesBox.append(issuesList);
  main.append(issuesBox);

  client
    .query(EPIC_ISSUES_IN_QUERY, { ref })
    .then((data) => {
      const refs = data?.epics?.issuesIn ?? [];
      if (refs.length === 0) {
        issuesList.append(line("no issues linked yet", "muted"));
        return;
      }
      for (const issueRef of refs) {
        const card = document.createElement("comtrya-resource-card");
        card.setAttribute("ref", issueRef);
        card.comtryaClient = client;
        issuesList.append(card);
      }
    })
    .catch((err) => issuesList.append(line(err.message, "warn")));

  // State change actions
  const actions = document.createElement("div");
  actions.style.cssText = "display: flex; gap: 8px;";
  for (const target of ["PLANNED", "IN_PROGRESS", "DONE", "CANCELED"]) {
    if (target === epic.state) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `mark ${target.toLowerCase().replace("_", " ")}`;
    btn.style.cssText = "padding: 4px 12px; font-family: var(--mono, monospace); font-size: 12px; cursor: pointer;";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await client.mutate(CHANGE_STATE_MUTATION, {
          input: { id: epic.id, state: target },
        });
        window.location.reload();
      } catch (err) {
        btn.textContent = `error: ${err.message}`;
      }
    });
    actions.append(btn);
  }
  main.append(actions);

  // Comments
  const thread = document.createElement("comtrya-comment-thread");
  thread.setAttribute("target", ref);
  thread.comtryaClient = client;
  main.append(thread);

  return main;
}

class ComtryaEpicNew extends HTMLElement {
  comtryaClient;
  viewer;

  connectedCallback() {
    this.dataset.smoke = "epic-new";
    const client = this.comtryaClient ?? findAncestorProperty(this, "comtryaClient");
    if (!client) return;
    const main = document.createElement("main");
    main.style.cssText = "padding: 24px 0; max-width: 560px; display: grid; gap: 16px;";
    main.append(buildHeading("New epic"));
    const form = document.createElement("form");
    form.style.cssText = "display: grid; gap: 12px;";
    const titleInput = document.createElement("input");
    titleInput.required = true;
    titleInput.placeholder = "Epic title";
    titleInput.style.cssText = "padding: 8px 10px; font-family: var(--mono, monospace); font-size: 14px; border: 1px solid var(--ink-rule, #d0cfc8);";
    const bodyInput = document.createElement("textarea");
    bodyInput.rows = 5;
    bodyInput.placeholder = "Description (optional)";
    bodyInput.style.cssText = "padding: 8px 10px; font-family: var(--mono, monospace); font-size: 13px; border: 1px solid var(--ink-rule, #d0cfc8); resize: vertical;";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Create epic";
    submit.style.cssText = "padding: 8px 14px; font-family: var(--display); font-weight: 600; cursor: pointer; justify-self: start;";
    form.append(titleInput, bodyInput, submit);
    main.append(form);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try {
        const result = await client.mutate(CREATE_EPIC_MUTATION, {
          input: {
            workspaceId: "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            title: titleInput.value.trim(),
            bodyMarkdown: bodyInput.value,
          },
        });
        const created = result?.epics?.create;
        if (created) {
          window.location.assign(`/x/epics/${created.workspaceId}/${created.id}`);
        }
      } catch (err) {
        submit.textContent = `error: ${err.message}`;
        submit.disabled = false;
      }
    });
    this.replaceChildren(main);
  }
}

// ── helpers ────────────────────────────────────────────────────────────────
function line(text, tone) {
  const p = document.createElement("p");
  p.style.cssText = `margin: 4px 0; font-family: var(--mono, monospace); font-size: 12px; color: ${
    tone === "warn" ? "var(--ink-warn, #c2410c)" : "var(--ink-faint, #888)"
  };`;
  p.textContent = text;
  return p;
}

function buildHeading(text) {
  const h = document.createElement("h3");
  h.style.cssText = "margin: 0; font-family: var(--display); font-size: 13px;";
  h.textContent = text;
  return h;
}

function findAncestorProperty(node, prop) {
  let cursor = node.parentElement;
  while (cursor) {
    if (cursor[prop] !== undefined && cursor[prop] !== null) return cursor[prop];
    cursor = cursor.parentElement;
  }
  return undefined;
}

if (!customElements.get("comtrya-epic-card")) {
  customElements.define("comtrya-epic-card", ComtryaEpicCard);
}
if (!customElements.get("comtrya-epics-board")) {
  customElements.define("comtrya-epics-board", ComtryaEpicsBoard);
}
if (!customElements.get("comtrya-epics-index")) {
  customElements.define("comtrya-epics-index", ComtryaEpicsIndex);
}
if (!customElements.get("comtrya-epic-detail")) {
  customElements.define("comtrya-epic-detail", ComtryaEpicDetail);
}
if (!customElements.get("comtrya-epic-new")) {
  customElements.define("comtrya-epic-new", ComtryaEpicNew);
}

export default defineExtension({
  id: "ext_epics",
  setup(host) {
    host.registerCard({
      resourceKind: "epic",
      element: "comtrya-epic-card",
      requiredPermission: "epics.read",
    });
    host.registerSlot("workspace.epics", {
      element: "comtrya-epics-board",
      requiredPermission: "epics.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-epics-index",
      requiredPermission: "epics.read",
    });
    host.registerRoute("/new", {
      element: "comtrya-epic-new",
      requiredPermission: "epics.write",
    });
    host.registerRoute("/:workspaceId/:id", {
      element: "comtrya-epic-detail",
      requiredPermission: "epics.read",
    });
  },
});
