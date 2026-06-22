# Comtrya remaining work

This file is intentionally blunt. The v3 branch now has real WASM extension
execution and a Vue shell, but the production testbed is still not the complete
Comtrya product.

## Current truth

- Real: `start.sh` builds and launches the Rust server and Vite/Vue frontend.
- Real: the operator-code flow exchanges the configured `.envrc` code for scoped
  bearer credentials.
- Real: the server opens local bare Git repositories under
  `$COMTRYA_DATA_DIR/repositories`; repositories are created/imported through
  GraphQL.
- Real: GraphQL returns refs, branches, commits, tree entries, blobs, file
  previews, and diffs derived from Git.
- Real: Git clone/fetch works through the Vue origin using a scoped Comtrya
  credential.
- Real: extension UI manifests and assets are served from `/forge-ui/...`.
- Real: the Vue shell discovers installed extensions, validates UI manifests,
  imports versioned entry assets, and mounts slot/route contributions.
- Real: first-party backend extensions are Rust `cargo-component` crates that
  build to real Component Model artifacts in `dist/`.
- Real: product operations for issues, epics, pull requests, and checks use
  canonical WIT operation routes under `/api/ops`.
- Real: the pull-request merge reactor closes linked issues through
  cross-extension WASM calls.
- Real: extension runtime data is stored in versioned JSONL storage under
  `$COMTRYA_DATA_DIR/extensions/storage`.
- Real: extension-owned collections and indexes are declared in manifests.
- Real: `start.sh --reset --oneshot` asserts the structural v3 cutover and runs
  end-to-end smoke through the live stack.
- Not complete: Git receive-pack/push is explicitly disabled.
- Not complete: full OIDC browser callback validation is disabled in the
  testbed.
- Not complete: OCI extension distribution exists as code/contracts, but local
  first-party extension directories are still the production-testbed install
  source.
- Not complete: repository creation/import exists, but this is not yet a full
  multi-tenant hosted Git product.

## Definition of a proper product demo

A skeptical reviewer should be able to start `./start.sh`, open
`http://127.0.0.1:4321/`, and trace every visible product surface to one of
these real sources:

- Git object database, refs, commits, trees, blobs, diffs, or protocol output.
- Durable Comtrya runtime storage with explicit schema.
- A first-party Component Model extension called by the host through generated
  dispatch.
- Authenticated Comtrya API calls made through the Vue origin.

No visible product data should come from inline browser constants, direct
fixture reads at request time, hardcoded fake metrics, or host-side placeholder
models.

## Product backlog

- Implement receive-pack/push:
  authenticate `git:write`, enforce protected refs, stage packs safely, update
  refs atomically, append ref update events, and update PR/check derived state.
- Expand typed field-level authorization and stable error codes for kernel-owned
  GraphQL fields.
- Expand repository metadata so language, license, and activity derive from
  records and Git config.
- Finish production OIDC callback validation and replace the operator-code-only
  testbed posture in production environments.
- Wire OCI extension installation into startup so configured OCI references can
  install into the runtime without local first-party source directories.
- Add richer extension-owned code browsing for tree/blob/diff flows if the core
  widget remains too host-owned.
- Add browser-level regression tests for the Vue shell and extension UI flows.
- Add resolver tests for PR/check behavior against real Git refs and commit
  oids.
- Remove broad unsupported text as surfaces are implemented; keep `/readyz`
  aligned with runtime behavior.

## Documentation upkeep

- Keep `PRODUCTION_TESTBED.md` aligned with runtime gates and unsupported
  surfaces.
- Keep `ARCHITECTURE.md` aligned with the actual server/frontend/extension
  split.
- Keep `DEMO_RUNBOOK.md` aligned with `start.sh` output and data paths.
- Keep `docs/extensions.md` aligned with the extension package contract.
- Treat dated files under `docs/superpowers/` as historical planning archive,
  not current runtime documentation.
