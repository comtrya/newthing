# Comtrya Production-Testbed Architecture

This document describes the runnable production-testbed shape. It is not a claim
that the full Comtrya v1 product is complete.

## Rust Host

The Rust host lives in `crates/server/src/main.rs`. It owns startup gates,
runtime state, auth/session issuance, GraphQL responses, extension asset
serving, event streams, unsupported-surface errors, and the temporary Git smart
HTTP adapter.

Startup reads `config/production-testbed.cue` through `COMTRYA_CONFIG`,
initializes `$COMTRYA_DATA_DIR`, opens or seeds the demo bare repository,
opens extension runtime storage, validates first-party extension packages, and
instantiates the minimal Wasmtime resolver components. `/readyz` reports the
runtime checks and the explicitly unsupported surfaces.

Production-testbed startup fails closed when required production posture is
missing: TLS termination, absolute data paths, HTTPS origins, local repository
storage paths, first-party extension files, demo Git refs, resolver exports, or
operator-code requirements. `COMTRYA_EXTERNAL_DEMO=1` additionally rejects
the local default operator code from `.envrc.example`.

## Astro Shell

The Astro shell lives under `frontend/`.

- `frontend/src/server/comtrya.ts` proxies requests to the Rust host and
  forwards only the HTTP headers the testbed needs.
- `frontend/src/client.ts` is the browser client for GraphQL, mutation,
  subscription-shaped calls, events, extension sessions, navigation, and toast
  hooks.
- `frontend/src/main.ts` renders the current repository shell, exchanges the
  operator code for a bearer credential, fetches typed GraphQL roots, mounts
  extension slots from runtime manifests, and shows extension load/resolver/
  permission failures in the Extensions panel.
- `frontend/src/extension-host.ts` defines the `<comtrya-extension-host>`
  custom element that passes the host client, viewer, resource, route params,
  and capability context into extension UI elements.

The shell still renders substantial product UI directly. The intended end state
is a smaller host shell that delegates code browsing, pull requests, and checks
to first-party extension surfaces.

## Extension Package Layout

First-party extension packages live in `extensions/first-party/<extension-id>/`.
Each package has:

- `manifest.json`: backend extension metadata, component path, resolver name,
  and output type.
- `component.wat`: minimal Component Model proof component loaded by Wasmtime.
- `ui/manifest.json`: UI schema, extension id/name, entry asset, SHA-256
  integrity, routes, and mountable slots.
- `assets/index.js`: browser ESM that defines the extension custom element.

The current first-party extensions are `ext_pull_requests`,
`ext_code_browser`, and `ext_checks`.

## Wasmtime Invocation Path

Startup loads every first-party extension manifest, validates the matching UI
manifest, checks the declared UI entry asset integrity, compiles the `.wat`
component, instantiates it with Wasmtime, verifies the expected resolver export,
and calls that export once. Runtime GraphQL exposes resolver records with typed
summary outputs for the code browser, pull requests, and checks extensions.

What is not real yet: the components still expose a minimal proof ABI. The host
computes the typed summaries; real WIT input/output types and resolver-owned
business logic are still TODO work.

## Extension Storage

Extension runtime storage is under
`$COMTRYA_DATA_DIR/extensions/storage/`.

- `schema.json`: storage schema version, migration list, collections, and
  indexes.
- `documents.jsonl`: versioned extension documents for workspaces,
  repositories, pull requests, check runs, extension installs, and activity.
- `events.jsonl`: storage-level events such as seeding and document updates.

On first startup, `fixtures/demo/conference.json` is copied into
`$COMTRYA_DATA_DIR/metadata/demo-state.json` by `start.sh`; the Rust host
imports that seed input into extension storage. Request-time GraphQL reads Git
state plus these extension storage documents instead of reading the fixture
directly.

## Git Storage And Protocol Adapter

The demo repository is a real local bare Git repository under
`$COMTRYA_DATA_DIR/repositories/comtrya/comtrya.git`. Startup seeds or
opens it idempotently, validates `HEAD`, and checks expected demo branch refs.

Git clone/fetch currently works through the Astro origin and Rust host by
shelling out to `git http-backend`. That is an intentional production-testbed
adapter, not native `gix` storage. Receive-pack/push remains explicitly
unsupported and returns the registered `UNSUPPORTED` surface until write support
is implemented.

## Known Not Real Yet

- Typed WIT resolver calls do not yet own code browser, pull request, or checks
  behavior.
- Pull request and checks behavior is seeded extension storage plus host-side
  GraphQL aggregation, not full extension-owned product logic.
- The host UI still renders product panels directly.
- Receive-pack/push is disabled.
- Only the seeded `comtrya/comtrya.git` repository path is supported.
- Some workspace/repository metadata remains seeded demo data.
