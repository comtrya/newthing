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

async function pullRequestData(host) {
  const data = extensionData(host, "ext_pull_requests");
  if (data) {
    return data;
  }
  return host.comtryaClient.query(
    "query PullRequests { repository { pullRequests } extensionResolvers }",
  );
}

function renderFailure(error) {
  const section = child("section", "extension-surface");
  section.setAttribute("data-smoke", "extension-surface-pull-requests");
  section.dataset.extensionRendered = "error";
  const article = child("article");
  article.append(
    child("strong", undefined, "Pull requests unavailable"),
    child("span", undefined, error instanceof Error ? error.message : text(error)),
  );
  section.append(article);
  return section;
}

class ComtryaPullRequests extends HTMLElement {
  async connectedCallback() {
    try {
      const data = await pullRequestData(this);
      const pulls = Array.isArray(data.repository?.pullRequests)
        ? data.repository.pullRequests
        : [];
      const resolver =
        data.resolver ?? data.extensionResolvers?.find((item) => item.id === "ext_pull_requests");
      const output = resolver?.output ?? {};

      const section = child("section", "extension-surface");
      section.setAttribute("data-smoke", "extension-surface-pull-requests");
      section.dataset.extensionRendered = pulls.length > 0 ? "non-empty" : "empty";

      const header = child("header");
      header.append(
        child("span", undefined, "Pull request extension"),
        child("strong", undefined, `${pulls.length} active reviews`),
      );

      const list = child("div", "extension-list");
      for (const pull of pulls) {
        const article = child("article");
        const body = child("div");
        body.append(
          child("strong", undefined, `#${text(pull.number)} ${text(pull.title)}`),
          child(
            "span",
            undefined,
            `${text(pull.author)} wants to merge ${text(pull.head)} into ${text(pull.base)}`,
          ),
          child(
            "small",
            undefined,
            `${text(pull.review)} · ${text(pull.comments, 0)} comments · ${text(pull.changes)}`,
          ),
        );
        const state = child("mark", cssToken(pull.state), text(pull.state, "UNKNOWN"));
        article.append(body, state);
        list.append(article);
      }

      const summary = child(
        "small",
        undefined,
        `${text(resolver?.outputType, "resolver unavailable")} · ${text(output.ready, 0)} ready · ${text(output.draft, 0)} draft`,
      );
      section.append(header, list, summary);
      this.replaceChildren(section);
    } catch (error) {
      this.replaceChildren(renderFailure(error));
    }
  }
}

if (!customElements.get("comtrya-pull-requests")) {
  customElements.define("comtrya-pull-requests", ComtryaPullRequests);
}
