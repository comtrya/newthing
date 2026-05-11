customElements.define(
  "comtrya-pull-request-list",
  class extends HTMLElement {
    connectedCallback() {
      this.textContent = "Pull requests extension loaded";
    }
  },
);
