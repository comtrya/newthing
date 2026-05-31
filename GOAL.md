# GOAL — v3 schema-first WASM overhaul

Status: complete.

The v3 cutover now uses one current extension path:

- First-party extension backend operations are Component Model WASM components.
- Extension operation calls use canonical WIT routes under `/api/ops`.
- GraphQL exposes kernel-owned fields only.
- The Vue/Vite shell is the only frontend.
- Extension UI bundles are generated from the `ui/` sources and served from
  `/_extensions/...`.
- `start.sh --reset --oneshot` is the end-to-end acceptance path.

Do not restore removed transition routes, old GraphQL aliases, resolver stubs,
WAT components, or shell fallback implementations. If a removed behavior is
needed again, design a current WIT operation or kernel-owned GraphQL field with
tests and smoke coverage — or land it through the SP6 Apollo Federation v2
rebuild once that work begins (see `docs/v3-decisions.md` and
`docs/spec-gap-analysis.md` §A7 for the north-star direction).
