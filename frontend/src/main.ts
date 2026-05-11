import { HttpForgepointClient } from "./client";
import "./extension-host";

const app = document.querySelector<HTMLElement>("#app");

if (app) {
  const client = new HttpForgepointClient("http://localhost:8080", async () => "development-session");
  app.innerHTML = `
    <nav class="topbar">
      <strong>Forgepoint</strong>
      <span>Self-hosted code forge kernel</span>
    </nav>
    <section class="panel">
      <h1>Instance Contracts</h1>
      <dl class="contract-grid">
        <div><dt>Git HTTPS</dt><dd>enabled</dd></div>
        <div><dt>Git LFS</dt><dd>deferred in v1</dd></div>
        <div><dt>Extensions</dt><dd>WASM component model</dd></div>
        <div><dt>Events</dt><dd>CloudEvents over SSE</dd></div>
      </dl>
      <button class="primary" type="button">Check Viewer Permissions</button>
      <output class="output" aria-live="polite"></output>
    </section>
  `;
  const button = app.querySelector<HTMLButtonElement>("button");
  const output = app.querySelector<HTMLOutputElement>("output");
  button?.addEventListener("click", async () => {
    try {
      const permissions = await client.permissions(
        "forgepoint://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
      );
      if (output) {
        output.value = permissions.length ? permissions.join(", ") : "no permissions";
      }
    } catch (error) {
      if (output) {
        output.value = error instanceof Error ? error.message : "request failed";
      }
    }
  });
}
