# v3 decisions

## The north star (read/write transport split)

- **All reads go through the GraphQL endpoint.** The kernel serves a
  federated GraphQL supergraph; per-extension subgraphs are composed in via
  Apollo Federation v2. The frontend uses GraphQL for every read, never
  `/api/ops`. Tracking issue: [#203 SP6](https://github.com/comtrya/comtrya/issues/203).
- **All writes go through RPC.** Target transport: tarpc
  (https://github.com/google/tarpc). The frontend uses RPC for every write,
  never `/api/ops`. Tracking issue: #207.
- **The frontend never calls `/api/ops` directly.** The interim WIT
  operation surface is for extension backends and kernel-internal codegen
  only; the browser surface is GraphQL (reads) + RPC (writes).

## Current shipped architecture (interim, not the goal)

- Frontend: Vite + Vue SPA.
- Extension backend: Rust `cargo-component` crates compiled to Component Model
  WASM.
- Extension operation transport: canonical WIT routes under `/api/ops`. This
  carries BOTH reads and writes today and is the interim shape — SP6 replaces
  the read half with federated GraphQL; the tarpc migration replaces the
  write half with RPC.
- Kernel API: kernel-owned GraphQL fields served by the Rust host. These
  fields (auth, identity, instance config) stay as the kernel half of the
  federated graph after SP6 lands.
- Runtime storage: typed kernel declarations plus manifest-declared extension
  collections.
- Verification: `./start.sh --reset --oneshot`.

## SP6 — federated reads

The spec (`docs/spec-gap-analysis.md` §A7) is the source of truth: every
extension emits Fed-v2 subgraph SDL, the host composes a supergraph with
`graphql-composition`, plans with Hive Router, and executes the plan via a
new `graphql-resolve` WIT export. SP6 is a separate spec→plan→build cycle.
Reads currently served via `/api/ops` (`list-issues`, `list-epics`,
`by-ref-*`, `by-refs-*`, etc.) migrate to the federated subgraphs.

## tarpc — RPC writes

All writes — `create-*`, `close-*`, `assign-*`, `change-state-*`,
`merge-*`, etc. — migrate from `/api/ops` to RPC over tarpc. The kernel
hosts the RPC server; each extension exposes a typed write surface via the
generated codegen. The frontend SDK gets a typed RPC client per extension.
Designed for: typed request/response shapes (matches the WIT inputs we
already have), bidirectional streaming if writes need progress feedback,
and a single sub-second transport for the whole write surface.

## Do not reintroduce

- Transition field names, duplicate routing layers, resolver probes, or
  WAT/stub artifacts from earlier sweeps. That restriction is about avoiding
  cruft and dead aliases.
- New `/api/ops` routes whose only purpose is to be called from the
  frontend. SP6 / tarpc are the destination surfaces; do not extend
  `/api/ops` for the browser case.
