/**
 * Diagram rendering for markdown surfaces.
 *
 * `useDiagrams(rootRef)` watches a container element holding
 * markdown-rendered HTML (from `renderMarkdown`), scans for
 * fenced code blocks tagged `mermaid` or `d2`, and replaces
 * each `<pre data-lang="…">` with the rendered SVG inline.
 *
 * Both renderers are lazy-imported the first time a diagram of
 * that flavour is encountered — Mermaid is ~700 KB minified and
 * D2 is a WASM bundle, so they only enter the user's network
 * graph when a diagram is actually present. A repo with no
 * diagrams pays zero cost.
 *
 * If a render fails the original `<pre>` stays in place with a
 * `data-diagram-error` attribute carrying the error text — the
 * markdown source is never destroyed.
 */

import { onMounted, onUnmounted, type Ref, watch } from "vue";

type DiagramKind = "mermaid" | "d2";

const MERMAID_CONFIG = {
  startOnLoad: false,
  securityLevel: "strict",
  theme: "neutral",
  fontFamily:
    "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

interface MermaidLike {
  render: (id: string, src: string) => Promise<{ svg: string }>;
}

let mermaidPromise: Promise<MermaidLike> | null = null;

async function loadMermaid(): Promise<MermaidLike> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const mermaid = m.default as unknown as MermaidLike & {
        initialize: (config: unknown) => void;
      };
      mermaid.initialize(MERMAID_CONFIG);
      return mermaid;
    });
  }
  return mermaidPromise;
}

interface D2Like {
  compile: (input: string) => Promise<{ diagram: unknown; renderOptions: unknown }>;
  // The .d.ts says `Promise<string>` but the 0.1.x runtime actually
  // returns `{ svg: string }` (or sometimes the SVG element). Treat
  // it as unknown and normalise at the call site.
  render: (diagram: unknown, options: unknown) => Promise<unknown>;
}

let d2Promise: Promise<D2Like> | null = null;

async function loadD2(): Promise<D2Like> {
  if (!d2Promise) {
    d2Promise = (async () => {
      // The terrastruct/d2 package ships a WASM bundle behind
      // the `browser` export. Lazy-import so it doesn't enter
      // the main chunk.
      const mod = (await import("@terrastruct/d2")) as unknown as {
        D2: new () => D2Like;
      };
      return new mod.D2();
    })();
  }
  return d2Promise;
}

function svgFromUnknown(result: unknown): string {
  if (typeof result === "string") return result;
  // d2 0.1.x browser build returns `{ diagram, renderOptions, svg?, result? }`
  // depending on version. Walk shallowly for an SVG-shaped string.
  if (result && typeof result === "object") {
    const stack: unknown[] = [result];
    const seen = new WeakSet<object>();
    while (stack.length > 0) {
      const cur = stack.shift();
      if (typeof cur === "string" && cur.includes("<svg")) return cur;
      if (cur && typeof cur === "object" && !seen.has(cur as object)) {
        seen.add(cur as object);
        for (const v of Object.values(cur as Record<string, unknown>)) {
          stack.push(v);
        }
      }
    }
    const keys = Object.keys(result as Record<string, unknown>).join(", ");
    throw new Error(`render returned object with keys [${keys}], no SVG string`);
  }
  throw new Error(
    `unexpected render output (${typeof result}); expected string SVG`,
  );
}

let nextId = 0;
function uniqueDiagramId(): string {
  nextId += 1;
  return `comtrya-diagram-${nextId}`;
}

async function renderMermaid(src: string): Promise<string> {
  const mermaid = await loadMermaid();
  const { svg } = await mermaid.render(uniqueDiagramId(), src);
  return svg;
}

async function renderD2(src: string): Promise<string> {
  const d2 = await loadD2();
  const { diagram, renderOptions } = await d2.compile(src);
  return svgFromUnknown(await d2.render(diagram, renderOptions));
}

function replacePreWithSvg(pre: HTMLElement, svg: string): void {
  const wrap = document.createElement("figure");
  wrap.className = "diagram-figure";
  wrap.dataset.diagramKind = pre.dataset.lang ?? "";
  wrap.innerHTML = svg;
  pre.replaceWith(wrap);
}

function markFailed(pre: HTMLElement, message: string): void {
  pre.dataset.diagramError = message;
  pre.classList.add("diagram-failed");
}

async function processBlock(pre: HTMLElement, kind: DiagramKind): Promise<void> {
  const code = pre.querySelector("code");
  const src = (code?.textContent ?? pre.textContent ?? "").trim();
  if (src.length === 0) return;
  try {
    const svg =
      kind === "mermaid" ? await renderMermaid(src) : await renderD2(src);
    replacePreWithSvg(pre, svg);
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    markFailed(pre, msg);
  }
}

async function scan(root: HTMLElement): Promise<void> {
  const pres = Array.from(
    root.querySelectorAll<HTMLElement>(
      'pre[data-lang="mermaid"]:not(.diagram-failed), pre[data-lang="d2"]:not(.diagram-failed)',
    ),
  );
  await Promise.all(
    pres.map((pre) => {
      const kind = (pre.dataset.lang ?? "") as DiagramKind;
      if (kind !== "mermaid" && kind !== "d2") return Promise.resolve();
      return processBlock(pre, kind);
    }),
  );
}

/**
 * Mount on every markdown-rendering surface that uses
 * `renderMarkdown` + `v-html`. Pass the container element ref;
 * call it once near the top of the component's `<script setup>`.
 * The composable re-scans whenever the container changes or its
 * contents mutate via `v-html`.
 */
export function useDiagrams(rootRef: Ref<HTMLElement | null | undefined>): void {
  let mo: MutationObserver | undefined;

  const attach = () => {
    const el = rootRef.value;
    if (!el || typeof MutationObserver === "undefined") return;
    void scan(el);
    mo?.disconnect();
    mo = new MutationObserver(() => {
      void scan(el);
    });
    mo.observe(el, { childList: true, subtree: true, characterData: false });
  };

  onMounted(attach);
  watch(rootRef, attach);
  onUnmounted(() => {
    mo?.disconnect();
  });
}
