function defineExtension(def) {
  if (typeof def.id !== "string" || def.id.length === 0) {
    throw new Error("extension id must be a non-empty string");
  }
  if (typeof def.setup !== "function") {
    throw new Error("extension setup must be a function");
  }
  return def;
}

class ComtryaPullsQueue extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Pulls queue";
    const desc = document.createElement("span");
    desc.textContent = "Mounted by ext_pull_requests via SDK";
    root.append(title, desc);
    this.replaceChildren(root);
  }
}
class ComtryaPullsDetail extends HTMLElement {
  connectedCallback() {
    const pullId = this.routeParams?.params?.pullId ?? "unknown";
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Pull #" + pullId;
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaPullsYourWork extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Your work · pulls";
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaPullsOverview extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Repo · pulls overview";
    root.append(title);
    this.replaceChildren(root);
  }
}

customElements.define("comtrya-pulls-queue", ComtryaPullsQueue);
customElements.define("comtrya-pulls-detail", ComtryaPullsDetail);
customElements.define("comtrya-pulls-your-work", ComtryaPullsYourWork);
customElements.define("comtrya-pulls-overview", ComtryaPullsOverview);

export default defineExtension({
  id: "ext_pull_requests",
  setup(host) {
    host.registerSlot("home.your-work", {
      element: "comtrya-pulls-your-work",
      requiredPermission: "pull-requests.read",
      priority: 100,
    });
    host.registerSlot("repository.overview", {
      element: "comtrya-pulls-overview",
      requiredPermission: "pull-requests.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-pulls-queue",
      requiredPermission: "pull-requests.read",
    });
    host.registerRoute("/:pullId", {
      element: "comtrya-pulls-detail",
      requiredPermission: "pull-requests.read",
    });
  },
});
