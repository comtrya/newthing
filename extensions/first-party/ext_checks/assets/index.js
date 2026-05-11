function text(value, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

function cssToken(value) {
  return text(value, "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
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

async function checksData(host) {
  const data = extensionData(host, "ext_checks");
  if (data) {
    return data;
  }
  return host.comtryaClient.query("query Checks { repository { checks } extensionResolvers }");
}

function renderFailure(error) {
  const section = child("section", "extension-surface");
  section.setAttribute("data-smoke", "extension-surface-checks");
  section.dataset.extensionRendered = "error";
  const article = child("article");
  article.append(
    child("strong", undefined, "Checks unavailable"),
    child("span", undefined, error instanceof Error ? error.message : text(error)),
  );
  section.append(article);
  return section;
}

class ComtryaChecksBoard extends HTMLElement {
  async connectedCallback() {
    try {
      const data = await checksData(this);
      const checks = Array.isArray(data.repository?.checks) ? data.repository.checks : [];
      const passing = checks.filter((check) => check.conclusion === "SUCCESS").length;
      const resolver = data.resolver ?? data.extensionResolvers?.find((item) => item.id === "ext_checks");
      const output = resolver?.output ?? {};

      const section = child("section", "extension-surface");
      section.setAttribute("data-smoke", "extension-surface-checks");
      section.dataset.extensionRendered = checks.length > 0 ? "non-empty" : "empty";

      const header = child("header");
      header.append(
        child("span", undefined, "Checks extension"),
        child("strong", undefined, `${passing}/${checks.length} passing`),
      );

      const grid = child("div", "checks-grid");
      for (const check of checks) {
        const article = child("article");
        const body = child("div");
        body.append(
          child("strong", undefined, check.name),
          child("span", undefined, `${text(check.provider)} · ${text(check.duration)}`),
        );
        article.append(
          body,
          child("mark", cssToken(check.conclusion), text(check.conclusion, "UNKNOWN")),
        );
        grid.append(article);
      }

      const summary = child(
        "small",
        undefined,
        `${text(resolver?.outputType, "resolver unavailable")} · aggregate ${text(output.aggregateStatus, "UNKNOWN")}`,
      );
      section.append(header, grid, summary);
      this.replaceChildren(section);
    } catch (error) {
      this.replaceChildren(renderFailure(error));
    }
  }
}

if (!customElements.get("comtrya-checks-board")) {
  customElements.define("comtrya-checks-board", ComtryaChecksBoard);
}
