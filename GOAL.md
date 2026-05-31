# GOAL — v3 schema-first WASM overhaul

Status: v3 cutover complete; read/write transport split is the north star
(SP6 federation + tarpc RPC migration).

## The north star (read/write transport split)

- **All reads go through the GraphQL endpoint.** The kernel owns the GraphQL
  gateway; per-extension subgraphs are federated in via Apollo Federation v2
  (SP6 — tracking issue #203). The frontend uses GraphQL for every read.
- **All writes go through RPC.** Target transport: tarpc
  (https://github.com/google/tarpc — tracking issue #207). The frontend uses
  RPC for every write.
- **The frontend does not call `/api/ops` directly.** Reads come from
  GraphQL, writes go through RPC, period.

## Current shipped state (interim, not the goal)

- First-party extension backend operations are Component Model WASM components.
- Extension operation calls (BOTH reads and writes today) use canonical WIT
  routes under `/api/ops`. This is the interim transport that SP6 (for reads)
  and the tarpc migration (for writes) are replacing.
- Kernel-owned GraphQL fields cover the kernel's mandatory concerns (auth,
  identity, instance config) and stay as the kernel half of the federated
  graph after SP6 lands.
- The Vue/Vite shell is the only frontend.
- Extension UI bundles are generated from the `ui/` sources and served from
  `/_extensions/...`.
- `start.sh --reset --oneshot` is the end-to-end acceptance path.

Do not restore removed transition routes, old GraphQL aliases, resolver stubs,
WAT components, or shell fallback implementations. If a removed behavior is
needed again, design it for the north star — federated subgraph fields for
reads, an RPC route for writes — not a new `/api/ops` surface. Until SP6 and
tarpc land, `/api/ops` is the shipping interim; do not extend it beyond what
the existing extensions need.
