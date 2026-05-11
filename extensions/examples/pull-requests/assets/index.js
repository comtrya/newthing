customElements.define(
  "forgepoint-pull-request-list",
  class extends HTMLElement {
    connectedCallback() {
      this.textContent = "Pull requests extension loaded";
    }
  },
);
