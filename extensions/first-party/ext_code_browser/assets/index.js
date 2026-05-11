function text(value, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

function child(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent !== undefined) {
    element.textContent = text(textContent);
  }
  return element;
}

function extensionData(host, extensionId) {
  const hostData = host.comtryaData ?? {};
  const repository = hostData.repository;
  const resolvers = hostData.extensionResolvers;
  if (repository && Array.isArray(resolvers)) {
    return {
      repository,
      extensionResolvers: resolvers,
      resolver:
        hostData.extensionResolver?.id === extensionId
          ? hostData.extensionResolver
          : resolvers.find((item) => item.id === extensionId),
    };
  }
  return undefined;
}

async function codeBrowserData(host) {
  const data = extensionData(host, "ext_code_browser");
  if (data) {
    return data;
  }
  return host.comtryaClient.query(
    "query CodeBrowser { repository { files treeEntries blobs diff } extensionResolvers }",
  );
}

function filePreview(file) {
  if (!file) {
    return "No file preview available.";
  }
  return `${text(file.path)}\n${text(file.oid)} · ${text(file.size, 0)} bytes\n\n${text(file.preview)}`;
}

function renderFailure(error) {
  const section = child("section", "extension-surface");
  section.setAttribute("data-smoke", "extension-surface-code-browser");
  section.dataset.extensionRendered = "error";
  const article = child("article");
  article.append(
    child("strong", undefined, "Code browser unavailable"),
    child("span", undefined, error instanceof Error ? error.message : text(error)),
  );
  section.append(article);
  return section;
}

class ComtryaCodeBrowser extends HTMLElement {
  async connectedCallback() {
    try {
      const data = await codeBrowserData(this);
      const repository = data.repository ?? {};
      const files = Array.isArray(repository.files) ? repository.files : [];
      const treeEntries = Array.isArray(repository.treeEntries) ? repository.treeEntries : [];
      const blobs = Array.isArray(repository.blobs) ? repository.blobs : [];
      const diff = repository.diff ?? {};
      const resolver =
        data.resolver ?? data.extensionResolvers?.find((item) => item.id === "ext_code_browser");
      const output = resolver?.output ?? {};

      const section = child("section", "extension-surface");
      section.setAttribute("data-smoke", "extension-surface-code-browser");
      section.dataset.extensionRendered = treeEntries.length > 0 || files.length > 0 ? "non-empty" : "empty";

      const header = child("header");
      header.append(
        child("span", undefined, "Code browser extension"),
        child("strong", undefined, `${treeEntries.length} tree entries`),
      );

      const browser = child("div", "code-browser-grid");
      const nav = child("nav");
      const preview = child("pre", undefined, filePreview(files[0]));
      files.slice(0, 8).forEach((file, index) => {
        const button = child("button", undefined, file.path);
        button.type = "button";
        button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
        button.addEventListener("click", () => {
          preview.textContent = filePreview(file);
          nav.querySelectorAll("button").forEach((candidate) =>
            candidate.setAttribute("aria-pressed", "false"),
          );
          button.setAttribute("aria-pressed", "true");
        });
        nav.append(button);
      });
      browser.append(nav, preview);

      const context = child("div", "code-browser-context");
      const treeArticle = child("article");
      treeArticle.append(
        child("strong", undefined, "Tree"),
        child(
          "span",
          undefined,
          treeEntries
            .slice(0, 5)
            .map((entry) => `${text(entry.kind)} ${text(entry.path)}`)
            .join(" · ") || "No tree entries",
        ),
      );
      const blobArticle = child("article");
      blobArticle.append(
        child("strong", undefined, "Blobs"),
        child(
          "span",
          undefined,
          blobs
            .slice(0, 4)
            .map((blob) => `${text(blob.path)} (${text(blob.size, 0)} bytes)`)
            .join(" · ") || "No blobs",
        ),
      );
      const diffArticle = child("article", "code-browser-diff");
      diffArticle.append(
        child("strong", undefined, text(diff.path, "Review diff")),
        child("span", undefined, text(output.diffPath, diff.path ?? "No diff path")),
        child("pre", undefined, text(diff.patch, "No diff available.").slice(0, 1200)),
      );
      context.append(treeArticle, blobArticle, diffArticle);

      const summary = child(
        "small",
        undefined,
        `${text(resolver?.outputType, "resolver unavailable")} · ${text(output.repositoryRefs, 0)} refs · ${text(output.blobPreviews, blobs.length)} blobs`,
      );

      section.append(header, browser, context, summary);
      this.replaceChildren(section);
    } catch (error) {
      this.replaceChildren(renderFailure(error));
    }
  }
}

if (!customElements.get("comtrya-code-browser")) {
  customElements.define("comtrya-code-browser", ComtryaCodeBrowser);
}
