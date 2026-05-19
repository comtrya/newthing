# Comtrya Development Guidelines

## Source Control and PR Workflow

- Use `jj` when `.jj/` exists; use `git` otherwise.
- Before non-trivial implementation work begins, create a branch and open a
  draft PR whose title summarizes the intended work and whose description
  contains the plan, unless explicitly told not to.
- When creating or editing PR descriptions with `gh`, pass multiline Markdown
  with real newlines, never escaped `\n` sequences. Verify the rendered body
  with `gh pr view` before moving on.
- Keep the PR title and description current. Before handoff, update them to
  describe the complete work done, include the plan, and remove draft status
  when the work is ready for review.
- The job does not stop after pushing. Monitor CI, inspect failing checks, and
  fix the branch until all required checks are green.

## No Backwards Compat, No Legacy, No Dead Code

- Breaking changes are the default for this project.
- Do not add backwards compatibility layers, migration shims, compatibility
  aliases, deprecated routes, or legacy handlers unless the user explicitly
  asks for them in that task.
- Assume no production servers, users, or durable external data unless the user
  says otherwise. Prefer clean design and deletion over compatibility.
- Remove dead compatibility code immediately. Do not preserve unused handlers,
  unused generated files, unused exports, unused dependencies, or stale docs.
- If replacing a path, delete the old path in the same change. Do not leave both
  systems running in parallel.
- Do not add broad ignore lists or warning suppressions to hide unused code.
  Wire the code into the exercised path or delete it.

## Planning and Review

- Read the relevant code before proposing a solution. Let the existing
  architecture define the edit surface.
- Divide non-trivial work into small, reviewable tasks. Use sub-agents and
  role-specific agents when available and allowed by the current runner.
- After implementation, use adversarial review passes when available. Repeat
  until reviewers find no real and actionable issues.
- Treat generated output as evidence, not intent. Change the source of truth and
  regenerate artifacts instead of hand-editing generated files.

## Active Technologies

- Rust workspace, edition 2024.
- Wasmtime Component Model and WIT for extension contracts.
- First-party extensions under `extensions/first-party/*` with backend
  `cargo-component` crates and optional browser UI bundles.
- TypeScript 5, Bun, Vite, Vue, and Preact in `frontend/` and extension UIs.

## Project Structure

```text
crates/                         Rust workspace crates
frontend/                       Vite/Vue shell and SDK packages
extensions/first-party/         First-party Component Model extensions
extensions/wit/comtrya/platform Shared platform WIT package
fixtures/                       Demo/bootstrap data
docs/                           Architecture, manifest, and runtime docs
start.sh                        End-to-end local smoke test runner
```

## Commands

- Rust tests: `cargo test --workspace`
- Rust lint: `cargo clippy --workspace -- -D warnings`
- Frontend tests: `cd frontend && bun test`
- Frontend typecheck: `cd frontend && bun run typecheck`
- Frontend build: `cd frontend && bun run build`
- Build one extension:
  `extensions/bundler/build-extension.sh extensions/first-party/<extension-id>`
- End-to-end smoke: `./start.sh --reset --oneshot`

Run focused checks first while iterating, then the broader checks that cover the
files and behavior changed.

## Bun Hard Rule

- Never use `npm`, `yarn`, or `pnpm` for installs, scripts, or CI.
- Use `bun` and `bunx` exclusively for JavaScript and TypeScript work.

## UI Verification Hard Rule

- Every change that affects rendered UI — shell components, extension UI
  bundles, styles, routing, keyboard shortcuts, slot mounts — must be
  verified end-to-end in a real browser via the Chrome MCP tools before
  the work is reported as complete or committed.
- Verification means: load the affected route against a running
  `./start.sh` instance, exercise the interaction (click, type, shortcut),
  read the DOM / console / network as needed, and confirm both the
  visual result and the behavioural result match the intent.
- Typecheck and bundle-build success are necessary but not sufficient.
  "Identifier appears in the bundle" does not prove the UI works.
- If Chrome MCP is unavailable in the session, do not skip verification —
  state the blocker explicitly, leave the change unmerged, and resume
  verification when the extension reconnects. Never claim a UI change is
  done based on data-path or bundle inspection alone.

## Clippy Hard Rule

- Local and CI clippy checks must run with `-D warnings`; warnings are errors.
- Do not add `#[allow(...)]`, `#![allow(...)]`, or clippy-specific suppressions
  unless absolutely necessary and explicitly justified in the PR description.
- Generated bindings may contain tool-emitted allows. Do not hand-edit generated
  bindings to silence lint; regenerate them from the source WIT/tooling.
- Prefer deleting dead code, wiring unused code into the exercised path, or
  narrowing visibility over suppressing warnings.

## WIT, Extension, and Protocol Rules

- WIT is the contract for extension-owned behavior. Keep codegen generic; it
  must not know about a specific first-party extension such as issues, epics,
  pulls, or checks.
- Extension backends are authoritative for extension behavior. UI bundles call
  the generated SDK/client path and must not duplicate backend rules.
- Use canonical WIT operation routes only. Do not add legacy GraphQL aliases,
  compatibility routes, or extension-specific dispatch special cases.
- First-party extensions must ship real Component Model artifacts at
  `dist/<extension-id>.wasm`; do not add `.wat` stubs or resolver shims.
- If a manifest, schema, WIT package, or documented protocol shape is changed,
  update the corresponding tests and docs in the same PR.

## Type and Data Boundaries

- Model structured data with typed Rust or TypeScript values at module and
  public API boundaries. Avoid stringly-typed payloads for structured data.
- Parse untyped input as early as possible, validate it once, then pass typed
  values through the rest of the system.
- Serialization to strings or bytes belongs at I/O boundaries.
- Error results should be typed or schema-shaped. Plain strings are acceptable
  for human-facing log messages, not structured payloads.

## Code Style

- Write single-purpose functions with explicit inputs and outputs.
- Prefer small, focused files organized around behavior, protocol boundary, or
  UI responsibility.
- Prefer pure helpers, immutable data, composition, and local reasoning where
  they improve clarity.
- Avoid broad utility modules and hidden shared state.
- Match local Rust, TypeScript, Vue, and Component Model idioms when functional
  style conflicts with framework clarity.

## Commit Messages

- Use Conventional Commits with a single scope:
  `fix(server): ...`, `feat(extensions): ...`, `fix(frontend): ...`.
- Do not use unscoped subjects. If a change spans multiple areas, scope it to
  the dominant subsystem or user-facing surface.
- Keep the subject lowercase after the colon.
