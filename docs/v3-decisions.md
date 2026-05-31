# v3 decisions

The v3 cutover's **current** shipped architecture is:

- Frontend: Vite + Vue SPA.
- Extension backend: Rust `cargo-component` crates compiled to Component Model
  WASM.
- Extension operation transport: canonical WIT routes under `/api/ops`.
- Kernel API: kernel-owned GraphQL fields served by the Rust host. This is the
  CURRENT shape, not the v3 north star.
- Runtime storage: typed kernel declarations plus manifest-declared extension
  collections.
- Verification: `./start.sh --reset --oneshot`.

**North-star direction (SP6 — Apollo Federation v2 rebuild).** The spec
(`docs/spec-gap-analysis.md` §A7) is the source of truth: every extension
emits Fed-v2 subgraph SDL, the host composes a supergraph with
`graphql-composition`, plans with Hive Router, and executes the plan via a
new `graphql-resolve` WIT export. SP6 is a separate spec→plan→build cycle
tracked in its own issue; until that lands, kernel-owned GraphQL is the
shipping shape and remains so for any field the kernel must own (auth,
identity, instance config).

**Do not reintroduce** the removed transition field names, duplicate routing
layers, resolver probes, or WAT/stub artifacts from earlier sweeps. That
restriction is about avoiding cruft and dead aliases, not about preventing
the SP6 federation rebuild — when SP6 builds federation, it does so against
the spec, not by restoring the deleted SDL-composition scaffolding from
git history.
