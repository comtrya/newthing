class ComtryaChecksBoard extends HTMLElement {
  async connectedCallback() {
    const data = await this.comtryaClient.query("query Checks { repository { checks } extensionResolvers }");
    const checks = data.repository.checks;
    const passing = checks.filter((check) => check.conclusion === "SUCCESS").length;
    const resolver = data.extensionResolvers.find((item) => item.id === "ext_checks");
    const output = resolver?.output ?? {};
    this.innerHTML = `
      <section class="extension-surface">
        <header><span>Checks extension</span><strong>${passing}/${checks.length} passing</strong></header>
        <div class="checks-grid">
          ${checks.map((check) => `
            <article>
              <strong>${check.name}</strong>
              <span>${check.provider} | ${check.duration}</span>
              <mark class="${check.conclusion.toLowerCase()}">${check.conclusion}</mark>
            </article>
          `).join("")}
        </div>
        <small>${resolver?.outputType ?? "resolver unavailable"} · aggregate ${output.aggregateStatus ?? "UNKNOWN"}</small>
      </section>
    `;
  }
}

if (!customElements.get("comtrya-checks-board")) {
  customElements.define("comtrya-checks-board", ComtryaChecksBoard);
}
