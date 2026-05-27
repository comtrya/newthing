# Comtrya v3 architecture

This document describes the runnable v3 production-testbed shape. It is not a
claim that every Comtrya v1 product surface is complete.

## Rust host

The Rust host lives in `crates/server/src/main.rs`. It owns startup gates,
runtime state, auth/session issuance, GraphQL, extension asset serving, event
streams, unsupported-surface errors, and the Git smart HTTP endpoint.

Startup clones the external CUE config repo (`COMTRYA_CONFIG_REPO_URL`) into
`$COMTRYA_DATA_DIR/config-repo` and evaluates it into the typed instance config,
initializes `$COMTRYA_DATA_DIR`, opens extension runtime storage, bootstraps
configured workspaces and extension installation records, validates installed extension packages, and
loads first-party Component Model artifacts from `dist/<extension-id>.wasm`.
`/readyz` reports runtime checks and the explicitly unsupported surfaces.

Production-testbed startup fails closed when required production posture is
missing: TLS termination, absolute data paths, HTTPS origins, local repository
storage paths, first-party extension files, component artifacts, manifest
validation, or operator-code requirements.

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

- `/`: workspace homepage (shell-owned).
- `/r/<group>/<...>/<repo>`: repository dashboard (shell-owned). Renders
  `repository.main` and `repository.sidebar` slots filled by widgets.
- `/x/<prefix>/<...>`: extension-owned pages. Extensions own this
  namespace and nothing else; `buildExtensionUrl` is the only sanctioned
  URL constructor and rejects anything outside `/x/<routePrefix>/`.
- `/new`, `/instance`, `/settings`, `/health`: shell-owned operational pages.

The shell does not own any extension-specific routes (e.g. there is no
shell-owned `/r/.../issues` — `/x/issues/...` is the only entry point;
a redirect rule covers links from earlier releases).

## Slot model

Slots are generic regions the shell defines (`repository.main`,
`repository.sidebar`, `home.your-work`, etc.). Extensions publish widgets
through `host.registerWidget({ defaultSlot, defaultPriority, ... })`.

A persisted user layout (per-user, per-repository) can override widget
placement, priority, or hide a widget. The layout currently lives in
`localStorage` (`frontend/src/user-layout.ts`); the shape matches what a
federated GraphQL mutation will accept, so swapping the persistence
layer is a single function change.

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

On first startup, the Rust host creates only configured workspace records and
loaded extension installation records. Repositories and extension-owned product
records are created through GraphQL and canonical WIT operation routes.

## Git storage and protocol

Repositories are real local bare Git repositories under
`$COMTRYA_DATA_DIR/repositories/`.

Git clone/fetch works through the Vue origin and Rust host using the pure-Rust
`comtrya-git-http` Smart HTTP v2 path. Receive-pack/push remains explicitly
unsupported and returns the registered `UNSUPPORTED` surface until write
support is implemented.

## Known unsupported surfaces

- Git receive-pack/push is disabled.
- Full OIDC browser callback validation is disabled in the testbed.
