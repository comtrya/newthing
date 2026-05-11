class ComtryaCodeBrowser extends HTMLElement {
  async connectedCallback() {
    const data = await this.comtryaClient.query("query CodeBrowser { repository { files treeEntries blobs } extensionResolvers }");
    const files = data.repository.files;
    const resolver = data.extensionResolvers.find((item) => item.id === "ext_code_browser");
    const output = resolver?.output ?? {};
    this.innerHTML = `
      <section class="extension-surface">
        <header><span>Code browser extension</span><strong>${data.repository.treeEntries.length} tree entries</strong></header>
        <div class="code-browser-grid">
          <nav>${files.map((file) => `<button type="button">${file.path}</button>`).join("")}</nav>
          <pre>${files[0]?.preview ?? ""}</pre>
        </div>
        <small>${resolver?.outputType ?? "resolver unavailable"} · ${output.repositoryRefs ?? 0} refs · ${output.blobPreviews ?? 0} blobs</small>
      </section>
    `;
    const pre = this.querySelector("pre");
    this.querySelectorAll("button").forEach((button, index) => {
      button.addEventListener("click", () => {
        if (pre) pre.textContent = files[index]?.preview ?? "";
      });
    });
  }
}

if (!customElements.get("comtrya-code-browser")) {
  customElements.define("comtrya-code-browser", ComtryaCodeBrowser);
}
