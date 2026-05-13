# v3 schema-first overhaul — phase log

This document is the canonical map of what shipped in the v3 branch,
phase by phase, plus the adversarial-review status for each.

## What changed at the architecture level

- **Schema-first foundation.** `extensions/wit/comtrya/platform/`
  declares `comtrya:platform@0.1.0` — the WIT contract every
  extension implements. The kernel reads each installed extension's
  per-extension WIT and generates GraphQL dispatch + a typed TS
  client from it.
- **All behaviour runs in WASM.** The kernel becomes plumbing: host
  imports for storage / relations / comments / events / identity /
  time / ids / ops / log, plus the cross-extension broker. Extension
  business logic lives in WASM components, not in `crates/server`.
- **Rust + cargo-component** is the canonical authoring toolchain
  for first-party extensions; the WIT is language-agnostic so any
  Component Model toolchain works.
- **Vue 3 shell + framework-agnostic SDK.**
  - `@comtrya/sdk-core` — transport, registries, custom elements
    (resource-card, inline-edit, skeleton, command palette,
    optimistic helper, live-events).
  - `@comtrya/sdk-vue` — Vue 3 adapter (`useOp`,
    `defineExtensionWidget`).
  - `@comtrya/sdk-preact` — Preact adapter (`useOp`,
    `defineExtensionWidget`).

## Phase log

| # | Phase | Status | Adversarial reviews |
|---|------|--------|---------------------|
| 1 | WIT contract design | Done | 3 rounds × 4 lenses (FSM / FP / extensibility / composition). All CRITICAL + IMPORTANT resolved. |
| 2 | Kernel host imports (`crates/server/src/wasm_host.rs`) | Done | 1 round; CRITICAL items addressed (TOCTOU OCC, ISO-8601, token validation, ID uniqueness, base64 payloads, permission grammar). |
| 3 | Codegen (`crates/wit-codegen/`) | Done | 1 round; CRITICAL items addressed (per-extension fn names, recursion guard, kind serialization, `::` namespace separator). |
| 4 | SDK packages (`frontend/packages/sdk-{core,vue,preact}/`) | Done | Scaffolded; full Vue shell migration is a follow-on. |
| 5 | Extension bundler (`extensions/bundler/build-extension.sh`) | Done | Shell wrapper around `cargo component` + `wit-codegen` + per-ext UI build. |
| 6 | `ext_issues` migrated | Done | WIT + manifest under `extensions/first-party/ext_issues/`. |
| 7 | `ext_epics` migrated | Done | WIT + manifest under `extensions/first-party/ext_epics/`. |
| 8 | `ext_pull_requests` + reactor | Done | WIT + manifest declares reactor subscription + cross-call allowlist. |
| 9 | `ext_checks` + `ext_workspace_home` | Done | WITs in place. |
| 10 | UX primitives | Done | `inline-edit`, `skeleton`, `live-events`. |
| 11 | UX delight | Done | command palette + global shortcut + optimistic helper. |
| 12 | Cleanup + docs | Done | this file. |

## Known follow-on work

These items are not blockers for the v3 surface but should be tackled
before declaring the migration complete in production:

- **Vue shell**. The Astro frontend (`frontend/src/shell/`) still runs
  the legacy host. Phase 4 ships the SDK packages; the actual shell
  migration is its own multi-week effort with its own review loop.
- **Real WASM components**. Every first-party extension still ships
  `component.wat` (stub WAT). Replacing those with cargo-component
  Rust crates is the per-extension work that lives alongside the
  `wit/` directories already in place.
- **Manifest JSON Schema**. The manifest shape is currently in the
  per-extension `manifest.json` files only; a `docs/manifest.schema.json`
  with full validation would close one of the Phase 1 deferred items.
- **Storage indexing**. `wasm_host::extract_indexed_fields` indexes
  every top-level scalar; the per-extension WIT's declared indexed
  fields should drive a generated extractor.
- **Event-log unification**. Today `events.append` writes to
  `extensions/storage/events.jsonl`; legacy kernel writes to
  `metadata/events.jsonl`. Reactors only see the former.
- **Real ULID minter**. `wasm_host::UlidMinter` is a timestamp+counter
  placeholder; `crates/core/src/ids.rs` has the real ULID machinery
  and needs to be wired in.
- **Subscription / streaming WIT primitive**. Deferred to WIT 0.3.
- **Outbound HTTP host import**. Deferred to platform 0.2.0.

## Reviewing this work

Every phase's adversarial review (transcripts, prompts, and the
findings list each agent produced) lives in the conversation log for
the v3 branch. The pattern is:

1. Read the deliverable.
2. Spawn one or more `feature-dev:code-reviewer` agents with explicit
   lenses (FSM / FP / extensibility / composition).
3. Address every CRITICAL finding before moving to the next phase.
4. Note IMPORTANT findings and either fix in-phase or document as a
   follow-on.
5. NITs surface in the long tail and are addressed opportunistically.

Phase 1 went through three review rounds (one per lens-set revision).
Phases 2–11 each had one review round; Phase 12 (this document) is
the final consolidation.
