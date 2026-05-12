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

class ComtryaCodeBrowser extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Code browser";
    root.append(title);
    this.replaceChildren(root);
  }
}
class ComtryaCodeTree extends HTMLElement {
  connectedCallback() {
    const root = document.createElement("div");
    root.className = "extension-payload";
    const title = document.createElement("strong");
    title.textContent = "Code tree";
    root.append(title);
    this.replaceChildren(root);
  }
}

if (!customElements.get("comtrya-code-browser")) {
  customElements.define("comtrya-code-browser", ComtryaCodeBrowser);
}
if (!customElements.get("comtrya-code-tree")) {
  customElements.define("comtrya-code-tree", ComtryaCodeTree);
}

export default defineExtension({
  id: "ext_code_browser",
  setup(host) {
    host.registerSlot("repository.code", {
      element: "comtrya-code-browser",
      requiredPermission: "code.read",
      priority: 100,
    });
    host.registerRoute("/", {
      element: "comtrya-code-tree",
      requiredPermission: "code.read",
    });
  },
});
