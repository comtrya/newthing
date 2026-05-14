# v3 decisions

The v3 cutover has one current architecture:

- Frontend: Vite + Vue SPA.
- Extension backend: Rust `cargo-component` crates compiled to Component Model
  WASM.
- Extension operation transport: canonical WIT routes under `/api/ops`.
- Kernel API: GraphQL fields owned by the Rust host.
- Runtime storage: typed kernel declarations plus manifest-declared extension
  collections.
- Verification: `./start.sh --reset --oneshot`.

Do not reintroduce transition field names, duplicate routing layers, resolver
probes, or generated stubs.
