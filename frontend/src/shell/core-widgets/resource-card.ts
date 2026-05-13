import type { CardRegistry } from "../../extension-host-sdk/card-registry";
import type { ViewerHandle } from "../../extension-host-sdk/types";
import type { ComtryaClient } from "../../contracts";

const CORE_RESOURCE_CARD_TAG = "comtrya-resource-card";

/** Module-level singleton — the shell boots one CardRegistry per page and
 *  sets it here after loadExtensions returns. Resource-card elements
 *  consult this on connect. */
let activeRegistry: CardRegistry | null = null;

export function setActiveCardRegistry(registry: CardRegistry): void {
  activeRegistry = registry;
}

class ComtryaResourceCard extends HTMLElement {
  /** URI of the resource to render, e.g. `comtrya://issue/iss_X`. */
  ref?: string;
  comtryaClient?: ComtryaClient;
  viewer?: ViewerHandle;

  static get observedAttributes(): string[] {
    return ["ref"];
  }

  connectedCallback(): void {
    // Allow `ref` to come from an attribute when callers prefer markup.
    if (!this.ref) {
      const attr = this.getAttribute("ref");
      if (attr) this.ref = attr;
    }
    this.render();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === "ref" && value !== null) {
      this.ref = value;
      if (this.isConnected) this.render();
    }
  }

  private render(): void {
    const ref = this.ref;
    if (!ref) {
      this.replaceChildren(buildErrorCard("missing ref on <comtrya-resource-card>"));
      return;
    }

    // Recursion guard: if any ancestor resource-card is already rendering
    // this same ref, render a compact reference instead of recursing.
    if (this.hasAncestorWithRef(ref)) {
      this.replaceChildren(buildCompactRef(ref));
      return;
    }

    const kind = parseKindFromUri(ref);
    if (!kind) {
      this.replaceChildren(buildErrorCard(`malformed resource URI: ${ref}`));
      return;
    }

    const registry = activeRegistry;
    if (!registry) {
      this.replaceChildren(buildUnavailableCard(ref, "no card registry on this page"));
      return;
    }

    const entry = registry.winner(kind);
    if (!entry) {
      this.replaceChildren(buildUnavailableCard(ref, `kind "${kind}" has no registered renderer`));
      return;
    }

    const client = this.comtryaClient ?? this.findAncestorProperty<ComtryaClient>("comtryaClient");
    const viewer = this.viewer ?? this.findAncestorProperty<ViewerHandle>("viewer");

    if (viewer && !viewerHas(viewer, entry.requiredPermission)) {
      this.replaceChildren(buildForbiddenCard(ref, entry.requiredPermission));
      return;
    }

    const node = document.createElement(entry.element) as HTMLElement & {
      ref?: string;
      comtryaClient?: ComtryaClient;
      viewer?: ViewerHandle;
    };
    node.ref = ref;
    if (client) node.comtryaClient = client;
    if (viewer) node.viewer = viewer;
    this.replaceChildren(node);
  }

  private hasAncestorWithRef(ref: string): boolean {
    let cursor: HTMLElement | null = this.parentElement;
    while (cursor) {
      if (cursor.tagName.toLowerCase() === CORE_RESOURCE_CARD_TAG) {
        const other = (cursor as ComtryaResourceCard).ref;
        if (other === ref) return true;
      }
      cursor = cursor.parentElement;
    }
    return false;
  }

  private findAncestorProperty<T>(prop: string): T | undefined {
    let cursor: HTMLElement | null = this.parentElement;
    while (cursor) {
      const candidate = (cursor as unknown as Record<string, unknown>)[prop];
      if (candidate !== undefined && candidate !== null) return candidate as T;
      cursor = cursor.parentElement;
    }
    return undefined;
  }
}

function parseKindFromUri(uri: string): string | null {
  if (!uri.startsWith("comtrya://")) return null;
  const rest = uri.slice("comtrya://".length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  const kind = rest.slice(0, slash);
  if (kind.length === 0) return null;
  for (const byte of kind) {
    if (!/[a-z0-9_\-]/.test(byte)) return null;
  }
  return kind;
}

function viewerHas(viewer: ViewerHandle, perm: string): boolean {
  return viewer.permissions.includes("instance.admin") || viewer.permissions.includes(perm);
}

function buildCardFrame(tone: "muted" | "warn", lines: string[]): HTMLElement {
  const wrap = document.createElement("article");
  wrap.dataset.smoke = "resource-card-fallback";
  wrap.style.cssText = [
    "padding: 8px 12px",
    "border: 1px solid var(--ink-rule, #d0cfc8)",
    "font-family: var(--mono, monospace)",
    "font-size: 12px",
    tone === "warn" ? "color: var(--ink-warn, #c2410c)" : "color: var(--ink-faint, #666)",
    "background: var(--bg, transparent)",
  ].join("; ");
  for (const line of lines) {
    const p = document.createElement("div");
    p.textContent = line;
    wrap.append(p);
  }
  return wrap;
}

function buildUnavailableCard(ref: string, reason: string): HTMLElement {
  const card = buildCardFrame("muted", [ref, `unavailable — ${reason}`]);
  card.dataset.tone = "unavailable";
  return card;
}

function buildForbiddenCard(ref: string, permission: string): HTMLElement {
  const card = buildCardFrame("warn", [ref, `forbidden — missing "${permission}"`]);
  card.dataset.tone = "forbidden";
  return card;
}

function buildErrorCard(message: string): HTMLElement {
  const card = buildCardFrame("warn", [message]);
  card.dataset.tone = "error";
  return card;
}

function buildCompactRef(ref: string): HTMLElement {
  const span = document.createElement("span");
  span.dataset.smoke = "resource-card-compact-ref";
  span.style.cssText =
    "display: inline-block; padding: 2px 8px; font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-faint, #888); border: 1px dashed var(--ink-rule, #d0cfc8);";
  span.textContent = `↻ ${ref}`;
  return span;
}

export function defineResourceCard(): void {
  if (!customElements.get(CORE_RESOURCE_CARD_TAG)) {
    customElements.define(CORE_RESOURCE_CARD_TAG, ComtryaResourceCard);
  }
}

export const RESOURCE_CARD_TAG = CORE_RESOURCE_CARD_TAG;
