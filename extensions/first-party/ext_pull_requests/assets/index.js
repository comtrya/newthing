class ForgepointPullRequests extends HTMLElement {
  async connectedCallback() {
    const data = await this.forgepointClient.query("query PullRequests { repository { pullRequests } extensionResolvers }");
    const pulls = data.repository.pullRequests;
    const resolver = data.extensionResolvers.find((item) => item.id === "ext_pull_requests");
    const output = resolver?.output ?? {};
    this.innerHTML = `
      <section class="extension-surface">
        <header><span>Pull request extension</span><strong>${pulls.length} active reviews</strong></header>
        <div class="extension-list">
          ${pulls.map((pull) => `
            <article>
              <div><strong>#${pull.number} ${pull.title}</strong><span>${pull.author} wants to merge ${pull.head} into ${pull.base}</span></div>
              <mark class="${pull.state.toLowerCase()}">${pull.state}</mark>
            </article>
          `).join("")}
        </div>
        <small>${resolver?.outputType ?? "resolver unavailable"} · ${output.ready ?? 0} ready · ${output.draft ?? 0} draft</small>
      </section>
    `;
  }
}

if (!customElements.get("forgepoint-pull-requests")) {
  customElements.define("forgepoint-pull-requests", ForgepointPullRequests);
}
