# Comtrya extension authoring

Comtrya extensions ship as one directory with a backend Component Model
component and, optionally, a browser UI bundle.

First-party extensions live at `extensions/first-party/<extension-id>/`.

## Directory layout

```text
extensions/first-party/ext_issues/
  manifest.json
  wit/
  component/
    Cargo.toml
    src/lib.rs
  dist/ext_issues.wasm
  ui/
    package.json
    manifest.json
    src/
  assets/index.js
```

The backend component is authoritative for product behavior. The UI bundle is
only browser code; it talks to GraphQL through the shell SDK.

## Backend component

Each first-party backend is a Rust `cargo-component` crate under
`component/`. The crate imports the locked platform package from
`extensions/wit/comtrya/platform/` and exports the extension's own WIT world
from the extension-local `wit/` directory.

Build one extension with:

```sh
extensions/bundler/build-extension.sh extensions/first-party/ext_issues
```

The bundler runs the component build, emits generated dispatch metadata, builds
the optional UI bundle, refreshes UI manifest integrity, and writes the real
Component Model artifact to `dist/<extension-id>.wasm`.

`component.wat` stubs are not part of the v3 runtime. A first-party extension
must have `component/Cargo.toml` and a real `dist/<extension-id>.wasm`.

## WIT

The platform WIT is locked at `comtrya:platform@0.1.0`.

Extension WIT declares product operations and reactor exports. The server build
discovers installed extensions, runs `crates/wit-codegen`, and generates the
typed dispatch table that maps GraphQL roots to WIT exports.

Typical WIT shape:

```wit
package comtrya:ext-issues@0.1.0;

world ext-issues {
  import comtrya:platform/storage@0.1.0;
  import comtrya:platform/events@0.1.0;
  import comtrya:platform/ids@0.1.0;

  export issues;
  export reactor;
}
```

Host imports are capability-checked against `manifest.json`.

## Manifest

`manifest.json` is the backend contract the host validates at startup. The
important v3 fields are:

- `id`: extension id, matching the directory name.
- `platformWitVersion`: currently `"0.1.0"`.
- `wasmComponent`: must be `dist/<extension-id>.wasm` for first-party
  extensions.
- `hostImports`: platform imports the component may call.
- `allowedEmits`: event types the component may append.
- `allowedEventReads`: event types the component may read.
- `allowedCrossCalls`: cross-extension operation routes allowed through
  `ops.invoke`.
- `reactor`: subscription, mutation, emit, and recursion policy for event
  reactions.
- `contributes.resourceKinds`: resource URI kinds owned by the extension.
- `contributes.collections`: storage collections, indexes, and demo bootstrap
  declarations owned by the extension.
- `uiManifest`: path to the browser-side UI manifest, when the extension has a
  UI surface.

The server validates manifests against `docs/manifest.schema.json` before the
extension is installed into the runtime.

## UI bundle

The UI surface is a browser ESM bundle built from `ui/` into
`assets/index.js`. It registers widgets and routes through
`@comtrya/sdk-core` plus the framework adapter used by the extension, currently
Vue for first-party UI.

The shell loads installed extension UI manifests through
`/_extensions/<id>/manifest.json`, verifies asset integrity, imports
`assets/index.js`, and calls the bundle's default `setup(host)` function.

The backend component and browser bundle are intentionally separate. Backend
behavior runs in Wasmtime on the server; DOM rendering runs in the browser.

## Runtime checks

The final smoke path verifies the extension cutover:

```sh
./start.sh --reset --oneshot
```

That smoke fails if a first-party extension still has a `.wat` stub, lacks
`platformWitVersion: "0.1.0"`, points at anything other than
`dist/<extension-id>.wasm`, lacks `component/Cargo.toml`, or ships a non-WASM
artifact.
