# Comtrya v3 Specification

Comtrya v3 is a schema-first forge prototype with a small Rust kernel and
feature behavior delivered by WASM extensions.

## Product Principles

- The core server stays small and owns identity, authorization, Git access,
  storage, events, extension loading, and kernel-owned APIs.
- First-party product features are extensions unless they are true kernel
  responsibilities.
- Extension backend behavior is implemented as WebAssembly Component Model
  components built from Rust `cargo-component` crates.
- Extension calls use canonical WIT operation routes under `/api/ops`.
- GraphQL is reserved for kernel-owned fields.
- The frontend is a Vite/Vue shell that loads extension UI bundles from
  `/_extensions/...`.
- The implementation favors deletion and current contracts over transition
  layers.

## Runtime Shape

- `crates/server` runs the Rust host.
- `extensions/wit/comtrya/platform` defines the platform WIT package.
- `extensions/first-party/<id>/wit` defines each extension's own WIT package.
- `extensions/first-party/<id>/component` builds the extension WASM artifact.
- `extensions/first-party/<id>/dist/<id>.wasm` is the runtime component.
- `frontend` is the canonical Vue application.

## Extension Contract

Each first-party extension must declare:

- `platformWitVersion`.
- `wasmComponent: "dist/<id>.wasm"`.
- host imports it needs.
- emitted event types.
- cross-extension calls it is allowed to make.
- storage collections and indexes it owns.
- UI manifest path when it contributes browser UI.

The host validates manifests at load time and rejects extensions that do not
match the current contract.

## Storage And Events

- Kernel-owned collections are declared in typed Rust values.
- Extension-owned collections are declared in extension manifests.
- Extension storage is versioned JSONL under
  `$COMTRYA_DATA_DIR/extensions/storage`.
- Events are typed records appended through the platform `events` import.
- Reactors are declared by extension manifests and invoked through generated
  WASM dispatch.

## Verification

The acceptance path is:

```sh
./start.sh --reset --oneshot
```

That smoke path builds the server and frontend, validates first-party extension
artifacts, starts the live stack, exercises auth, Git clone/fetch, GraphQL
kernel fields, extension assets, browser UI, `/api/ops` issue flows, and the
pull-request merge reactor.
