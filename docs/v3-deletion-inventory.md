# v3 retired-artifact summary

The v3 cutover is complete.

This file used to track milestone-by-milestone removals while the cutover was
in progress. The live source of truth is now the code and the smoke tests:

- Extension calls use canonical WIT operation routes under `/api/ops`.
- GraphQL exposes kernel-owned fields only.
- First-party extensions ship Component Model WASM artifacts from `dist/`.
- `start.sh` owns the structural smoke checks that keep removed paths from
  returning.

Do not add transition aliases, removed route names, or historical handler
tables back to this document. If a removed path is needed again, design and
name a current replacement instead.
