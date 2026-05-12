// defineExtension — inlined from @comtrya/extension-host (extension assets are served raw, no module resolution)
function defineExtension(def) {
  if (typeof def.id !== "string" || def.id.length === 0) {
    throw new Error("extension id must be a non-empty string");
  }
  if (typeof def.setup !== "function") {
    throw new Error("extension setup must be a function");
  }
  return def;
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.textContent !== undefined) node.textContent = props.textContent;
  if (props.dataset) for (const [k, v] of Object.entries(props.dataset)) node.dataset[k] = v;
  if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) node.setAttribute(k, v);
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function row(idn, title, sub, checkText, checkClass, time) {
  return el("div", { className: "row" },
    el("span", { className: "idn", textContent: idn }),
    el("div", {},
      el("div", { className: "title", textContent: title }),
      el("div", { className: "sub", textContent: sub }),
    ),
    el("span", { className: "check " + checkClass, textContent: checkText }),
    el("span", { className: "t", textContent: time }),
  );
}

function section(id, heading, meta, ...rows) {
  return el("section", { className: "section" },
    el("div", { className: "section-strap" },
      el("span", { className: "id", textContent: id }),
      el("h2", { textContent: heading }),
      el("span", { className: "meta", textContent: meta }),
    ),
    ...rows,
  );
}

class HomeYourWork extends HTMLElement {
  async connectedCallback() {
    try {
      const data = await this.comtryaClient.query(`{
        viewer {
          reviewQueue { aggregated items }
          authoredPulls { aggregated items }
          failingChecks { aggregated items }
        }
      }`);
      const reviewItems = (data?.viewer?.reviewQueue?.items ?? []).map((p) =>
        row(
          "#" + (p.number ?? p.id ?? "?"),
          p.title ?? "(untitled)",
          (p.author ? "@" + p.author + " · " : "") + (p.repositoryPath ?? p.repository ?? ""),
          p.checks?.passed != null ? p.checks.passed + "/" + (p.checks.total ?? p.checks.passed) : "—",
          p.checks?.passed === p.checks?.total ? "ok" : "warn",
          p.updatedAt ?? p.time ?? ""
        )
      );
      const pullItems = (data?.viewer?.authoredPulls?.items ?? []).map((p) =>
        row(
          "#" + (p.number ?? p.id ?? "?"),
          p.title ?? "(untitled)",
          (p.repositoryPath ?? p.repository ?? "") + " · " + (p.state?.toLowerCase?.() ?? ""),
          "ready",
          "ok",
          p.updatedAt ?? p.time ?? ""
        )
      );
      const failingItems = (data?.viewer?.failingChecks?.items ?? []).map((c) =>
        row(
          "!CK",
          c.name ?? "(unnamed)",
          (c.repositoryPath ?? c.repository ?? "") + (c.branch ? " · " + c.branch : ""),
          "failing",
          "err",
          c.updatedAt ?? c.time ?? ""
        )
      );
      this.replaceChildren(
        section("01", "Review queue", (data?.viewer?.reviewQueue?.items?.length ?? 0) + " pulls", ...reviewItems),
        section("02", "Your pulls", (data?.viewer?.authoredPulls?.items?.length ?? 0) + " authored", ...pullItems),
        section("03", "Failing on your branches", (data?.viewer?.failingChecks?.items?.length ?? 0) + " checks", ...failingItems),
      );
    } catch (e) {
      this.replaceChildren(el("article", { className: "extension-placeholder", textContent: "Failed to load your work: " + (e?.message ?? e) }));
    }
  }
}

class HomeRepositories extends HTMLElement {
  async connectedCallback() {
    try {
      const data = await this.comtryaClient.query(`{
        workspace { repositories { id name groups openPullRequests checkSummary { passed total } lastCommitAt } }
      }`);
      const repos = (data?.workspace?.repositories ?? []).map((r) => {
        const groups = Array.isArray(r.groups) ? r.groups : [];
        const prefix = groups.length > 0 ? groups.join("/") + "/" : "";
        const checkOk = r.checkSummary && r.checkSummary.passed === r.checkSummary.total;
        const checkText = r.checkSummary ? (checkOk ? r.checkSummary.total + " ✓" : r.checkSummary.passed + "/" + r.checkSummary.total) : "—";
        return el("div", { className: "repo" },
          el("span", { className: "name" },
            el("span", { className: "prefix", textContent: prefix }),
            el("span", { className: "leaf", textContent: r.name ?? "(unnamed)" }),
          ),
          el("span", { className: "stats" },
            el("span", { textContent: (r.openPullRequests ?? 0) + " pr" }),
            el("span", { className: checkOk ? "ok" : "warn", textContent: checkText }),
            el("span", { textContent: r.lastCommitAt ?? "" }),
          ),
        );
      });
      this.replaceChildren(
        el("div", { className: "rail-section" },
          el("div", { className: "rail-strap" },
            el("span", { className: "id", textContent: "04" }),
            el("h3", { textContent: "Repositories" }),
            el("span", { className: "count", textContent: repos.length + " total" }),
          ),
          ...repos,
        ),
      );
    } catch (e) {
      this.replaceChildren(el("article", { className: "extension-placeholder", textContent: "Failed to load repositories: " + (e?.message ?? e) }));
    }
  }
}

class HomeActivity extends HTMLElement {
  async connectedCallback() {
    try {
      const data = await this.comtryaClient.query(`{ workspace { events } }`);
      const events = (data?.workspace?.events ?? []).map((e) =>
        el("div", { className: "ev" },
          el("span", { className: "summary" },
            document.createTextNode(e.summary ?? "(event)"),
            el("span", { className: "src", textContent: e.repositoryPath ?? e.actor ?? "" }),
          ),
          el("span", { className: "t", textContent: e.time ?? "" }),
        )
      );
      this.replaceChildren(
        el("div", { className: "rail-section activity" },
          el("div", { className: "rail-strap" },
            el("span", { className: "id", textContent: "05" }),
            el("h3", { textContent: "Activity" }),
            el("span", { className: "count", textContent: "live" }),
          ),
          ...events,
        ),
      );
    } catch (e) {
      this.replaceChildren(el("article", { className: "extension-placeholder", textContent: "Failed to load activity: " + (e?.message ?? e) }));
    }
  }
}

class HomeInstance extends HTMLElement {
  async connectedCallback() {
    try {
      const ready = await fetch("/readyz").then((r) => r.json());
      const boundaryCount = (ready?.unsupported ?? []).length;
      const allOk = boundaryCount === 0;
      this.replaceChildren(
        el("section", { className: "instance" },
          el("span", { className: "id", textContent: "06" }),
          el("div", { className: "stats" },
            el("span", { className: allOk ? "ok" : "err", textContent: allOk ? "● READY" : "● NOT READY" }),
            el("span", {}, el("strong", { textContent: String(boundaryCount) }), document.createTextNode(" boundaries")),
          ),
          el("code", { className: "clone", textContent: "git clone " + location.origin + "/git/comtrya.git" }),
          el("a", { className: "link", attrs: { href: "/instance" }, textContent: "→ /instance" }),
        ),
      );
    } catch (e) {
      this.replaceChildren(el("article", { className: "extension-placeholder", textContent: "Failed to load instance: " + (e?.message ?? e) }));
    }
  }
}

if (!customElements.get("comtrya-home-your-work")) {
  customElements.define("comtrya-home-your-work", HomeYourWork);
}
if (!customElements.get("comtrya-home-repositories")) {
  customElements.define("comtrya-home-repositories", HomeRepositories);
}
if (!customElements.get("comtrya-home-activity")) {
  customElements.define("comtrya-home-activity", HomeActivity);
}
if (!customElements.get("comtrya-home-instance")) {
  customElements.define("comtrya-home-instance", HomeInstance);
}

export default defineExtension({
  id: "ext_workspace_home",
  setup(host) {
    host.registerSlot("home.your-work",    { element: "comtrya-home-your-work",    requiredPermission: "workspace.read", priority: 1000 });
    host.registerSlot("home.repositories", { element: "comtrya-home-repositories", requiredPermission: "workspace.read", priority: 1000 });
    host.registerSlot("home.activity",     { element: "comtrya-home-activity",     requiredPermission: "events.read",    priority: 1000 });
    host.registerSlot("home.instance",     { element: "comtrya-home-instance",     requiredPermission: "instance.admin", priority: 1000 });
  },
});
