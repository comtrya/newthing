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

class ComtryaChecksBoard extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Checks board";
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaChecksDetail extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Check detail";
    root.append(title);
    this.replaceChildren(root);
  }
}

if (!customElements.get("comtrya-checks-board")) {
  customElements.define("comtrya-checks-board", ComtryaChecksBoard);
}
if (!customElements.get("comtrya-checks-detail")) {
  customElements.define("comtrya-checks-detail", ComtryaChecksDetail);
}

export default defineExtension({
  id: "ext_checks",
  setup(host) {
    host.registerSlot("repository.checks", {
      element: "comtrya-checks-board",
      requiredPermission: "checks.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-checks-board",
      requiredPermission: "checks.read",
    });
  },
});
