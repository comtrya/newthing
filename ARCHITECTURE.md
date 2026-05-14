# Comtrya v3 architecture

This document describes the runnable v3 production-testbed shape. It is not a
claim that every Comtrya v1 product surface is complete.

## Rust host

The Rust host lives in `crates/server/src/main.rs`. It owns startup gates,
runtime state, auth/session issuance, GraphQL, extension asset serving, event
streams, unsupported-surface errors, and the Git smart HTTP endpoint.

Startup reads `config/production-testbed.cue` through `COMTRYA_CONFIG`,
initializes `$COMTRYA_DATA_DIR`, opens or seeds the demo bare repository,
opens extension runtime storage, validates installed extension packages, and
loads first-party Component Model artifacts from `dist/<extension-id>.wasm`.
`/readyz` reports runtime checks and the explicitly unsupported surfaces.

Production-testbed startup fails closed when required production posture is
missing: TLS termination, absolute data paths, HTTPS origins, local repository
storage paths, first-party extension files, demo Git refs, component artifacts,
manifest validation, or operator-code requirements. `COMTRYA_EXTERNAL_DEMO=1`
also rejects the local default operator code from `.envrc.example`.

## GraphQL and WASM dispatch

The platform contract lives under `extensions/wit/comtrya/platform/` and is
locked at `comtrya:platform@0.1.0`.

Each first-party extension declares its own WIT under
`extensions/first-party/<id>/wit/` and implements that world in a
`cargo-component` crate under `component/`. `crates/server/build.rs` discovers
installed extensions and runs `crates/wit-codegen` to generate the dispatch
table used by GraphQL.

At request time the GraphQL handler parses the root field, resolves it through
the generated dispatch table, builds a host state with the authenticated
principal/resource/manifest context, and invokes the typed extension component
through Wasmtime. Hand-written substring routing is gone.

## Host imports

`crates/server/src/wasm_host.rs` implements the platform imports exposed to
extensions:

- storage
- relations
- comments
- events
- identity
- time
- ids
- cross-extension `ops.invoke`
- log

Manifest allowlists gate host imports, emitted event types, event reads,
cross-extension calls, and reactor-issued mutations.

## Reactors

Extensions can subscribe to events through their WIT reactor export and
manifest reactor declaration. The host records subscriptions at startup and
dispatches matching appended events through Wasmtime.

The current first-party proof is `ext_pull_requests`: merging a pull request
emits `dev.comtrya.pull-request.merged`; the pull-request reactor reads
`closes` relations and calls `ext_issues/issues.close-issue` through
`ops.invoke`; `ext_issues` persists the issue state and emits
`dev.comtrya.issues.closed`.

## Vue shell

The frontend lives under `frontend/` and is a Vite Vue SPA.

The shell owns navigation, route handling, auth/session exchange, GraphQL
transport, extension UI loading, core widgets, and shared layout. Extension UI
bundles are browser ESM assets served from `/_extensions/<id>/assets/...` and
loaded through the SDK registry.

Route ownership:

- `/`: workspace homepage.
- `/r/<group>/<...>/<repo>`: repository dashboard.
- `/x/<prefix>/<...>`: extension-owned pages.
- `/new`, `/instance`, `/settings`, `/health`: shell-owned operational pages.

## Extension package layout

First-party extension packages live in `extensions/first-party/<extension-id>/`.
Each package has:

- `manifest.json`: backend identity, Component Model artifact path,
  host-import allowlists, event allowlists, storage collections, resource kinds,
  reactor policy, and UI manifest path.
- `wit/`: extension-local WIT package.
- `component/`: Rust `cargo-component` crate.
- `dist/<extension-id>.wasm`: real Component Model artifact loaded by the host.
- `ui/manifest.json`: browser UI schema, route/slot declarations, entry asset,
  and SHA-256 integrity.
- `assets/index.js`: browser ESM bundle imported by the Vue shell.

The current first-party extensions are `ext_issues`, `ext_epics`,
`ext_pull_requests`, `ext_checks`, and `ext_workspace_home`.

## Extension storage

Extension runtime storage is under
`$COMTRYA_DATA_DIR/extensions/storage/`.

- `schema.json`: generated from core-owned declarations and installed
  extension `contributes.collections`.
- `documents.jsonl`: versioned extension documents.
- `events.jsonl`: extension storage and product events.

On first startup, `fixtures/demo/conference.json` is copied into
`$COMTRYA_DATA_DIR/metadata/demo-state.json` by `start.sh`. The Rust host uses
that file as seed input, then writes extension-owned records through the same
WASM-backed creation paths used by runtime behavior.

## Git storage and protocol

The demo repositories are real local bare Git repositories under
`$COMTRYA_DATA_DIR/repositories/`.

Git clone/fetch works through the Vue origin and Rust host using the pure-Rust
`comtrya-git-http` Smart HTTP v2 path. Receive-pack/push remains explicitly
unsupported and returns the registered `UNSUPPORTED` surface until write
support is implemented.

## Known unsupported surfaces

- Git receive-pack/push is disabled.
- Full OIDC browser callback validation is disabled in the testbed.
- Legacy Comtrya v1 HTTP APIs are intentionally unsupported.
- The `demo` GraphQL aggregate remains as a compatibility convenience, assembled
  from Git, runtime storage, and extension data.
