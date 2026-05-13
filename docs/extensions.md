# Comtrya extensions

Comtrya extensions have two distinct surfaces that travel together inside one
extension directory but are completely independent at runtime.

## Two surfaces per extension

1. **Server-side WASM resolver** — `component.wat` (or precompiled `.wasm`)
   compiled to a Component Model component, executed by Wasmtime on the
   server. Defined by a WIT world (`comtrya:extension/extension`). The
   resolver's job is *data shaping*: take server state, return typed output
   (e.g. `comtrya.code-browser/summary.v1`). No DOM, no `document`, no
   `window`.
2. **Client-side UI extension** — `assets/index.js`, fetched by the browser
   and `import()`-ed by the shell. Defines custom elements and registers slot
   contributions through the host SDK. This is where rendering happens.

A given extension can have either surface, both, or — rarely — neither (pure
config).

## Slot resolution: core defaults + extension overrides

The shell renders many surfaces (`repository.code`, `repository.overview`,
`repository.checks`, `home.*`, …) through slot mounts. The slot registry has
two tiers:

- **Core defaults** — registered by the shell itself before extensions load.
  The shell ships the canonical implementation of slots that are part of the
  forge kernel (code browsing, repo overview chrome, etc.).
- **Extension contributions** — registered by extensions through their setup
  function. Any extension claim on a slot fully overrides the core default
  for that slot; among multiple extension claims, the slot registry's
  priority rules apply.

This means: *if you do nothing*, core renders the slot. *If you install an
extension that claims the slot*, the extension renders the slot instead. The
shell never composes core + extension on the same slot.

## Bundling and npm

UI extensions can use any npm package on the client by going through the
extension bundling pipeline (see "Stage 2" in the architecture work, when
present). The pipeline takes `extensions/<id>/src/index.ts` plus a
`package.json`, runs a bundler, and writes `assets/index.js` with all deps
inlined plus a regenerated SRI integrity hash in the UI manifest.

WASM resolvers do **not** consume npm directly. If you want to author a
resolver in JS+npm, compile it to a Component Model component via
`@bytecodealliance/jco componentize`; the resulting `.wasm` runs server-side
in Wasmtime exactly like any other resolver.

## Future direction: WASM UI

Today, UI rendering lives in JS. A bundled extension swaps in its own
DOM-rendering library (a different tree component, a syntax highlighter,
etc.) through Stage 2.

Two emerging Wasm-side capabilities may eventually let extensions render UI
directly from WASM:

- **WASI Preview 3** — promises async + composition primitives that make it
  practical to ship richer host-imported APIs to Wasm components.
- **WebGPU / DOM bindings in the Component Model** — there's active interest
  in giving Wasm components host-provided imports for surface-level
  rendering, so a Wasm UI component could paint pixels (WebGPU) or
  manipulate a DOM subtree (DOM bindings) without going back through JS for
  every call.

Neither is shippable today, and even when they land the JS bundling path
will still be the pragmatic choice for npm-flavored UI work. We're keeping
the JS UI surface as the canonical one. If/when P3 + WebGPU/DOM bindings
mature, we can add a third surface ("`ui-wasm/index.wasm`" alongside
`assets/index.js`) without changing the rest of the model.
