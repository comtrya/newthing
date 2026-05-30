# Design: Extension Routes, Scopes, and Extension Points

Status: **Revised after 5-critic adversarial review** (security, soundness,
abstraction/coupling, project-conventions, feasibility). Section 11 records
every confirmed finding and its resolution.
Tracking: follow-up to #137 (per-repo opt-in) and #139 (kernel enforcement).
The issue↔epic link (#141) was originally planned as a bespoke `link-issue`
op gated in dispatch; the #142 continuation found that path dead on the real
UI flow and replaced it with generic relationship-type enforcement on the
relation write path (see §8 Slice 3 and `relationship_types.rs`).

## 1. Problem

The kernel gates extension behaviour per repository (#139), but the mechanism
does not generalise to the three capabilities we now need:

1. **Instance routes** — ops/URLs an extension serves instance-wide.
2. **Repository routes** — ops/URLs gated by a repo's opt-in.
3. **Extension points** — a typed, versioned integration contract one
   extension *provides* and another *requires* (epics↔issues being the first
   consumer), replacing the flat `allowedCrossCalls` string allowlist.

Debt this removes (recon anchors):

- **Scope is per resource-kind, not per route.** `has_repository_scoped_kinds`
  (`wasm_registry.rs:875`) is one boolean. Whether an op is gated, and *which
  repo* it gates against, is hand-written in each `dispatch_ext_*`
  (`wasm_invokers.rs`) with literal id strings.
- **The invoker map is hardcoded** in `build.rs` (`"ext_epics" =>
  "dispatch_ext_epics"`). See §5 for why this stays and what becomes generic.
- **Cross-calls are a flat allowlist** validated in `wasm_host.rs::invoke`; the
  callee declares nothing, no version, no contract.
- **No state machines.** `change-state-epic` accepts any target; nothing
  validates transitions.
- **UI routing is a single `routePrefix`**; no instance-vs-repository
  distinction, no declared UI extension points.

## 2. Goals & non-goals

Goals:

- **Two scope concepts, deliberately not unified** (critic A5/B5): a kernel
  **`DispatchScope`** (authorisation, enforced by the kernel) and a UI
  **`RouteScope`** (shell routing, enforced by the frontend). They share the
  vocabulary `instance | repository` but are different mechanisms in different
  layers and must not be modelled as one type.
- A declarative **extension-point** contract (`provides` / `requires`) with
  integer-exact versioning, resolved once at load into an immutable binding
  table; cross-calls authorised against resolved bindings, not raw strings.
- An explicit **participation gate** keyed on the *provider resource's*
  repository, with "binding exists" and "repo participates" as two separate
  checks (critic A2/D5).
- **Optional, component-authoritative resource-state validation** with a
  kernel fast-fail pre-check (critic A3/B3) — *not* a kernel-owned FSM that
  duplicates the WIT variant.

Non-goals (per "no backwards compat / no dead code"):

- We **replace** `allowedCrossCalls` and delete it — schema, wire struct,
  `HostManifest`, `wasm_host.rs::invoke` check, and every first-party manifest
  — atomically in the slice that introduces the binding table (critic C1/D8).
  No dual gate, no deprecation window.
- **Reactor `allowedMutations` is NOT folded into extension points** (critic
  A2/B2/C7). It is event-driven and gates on the *source* repo; cross-calls are
  synchronous and gate on the *target/provider* repo. Conflating them is wrong.
  It stays a separate allowlist.
- No migration shims for manifests; all first-party manifests are updated in
  the slice that needs them.

## 3. Core model

### 3.1 DispatchScope (kernel) and repo derivation

```
enum DispatchScope { Instance, Repository { derive: RepoDerivation } }

enum RepoDerivation {
    PayloadField(field_name),   // repo URI is a named field on the payload
    ResourceRef(param_name),    // derive via repository_ref_for_resource(param)
    LoadedSingle(repo_field),   // single-resource read; see gating rule below
}
```

`RepoDerivation` is a **typed enum**, serialised in the manifest as a tagged
object, never a bare string (critic C3). The kernel builds a `RouteTable`
(`(ext, iface, op) → DispatchScope`) at load from the manifest and consults it
in one generic gate wrapper, replacing the ~12 scattered `ensure_repo_enabled`
call sites (critic D2 counted them).

**Gating rules per derivation** (resolves the unsound `loaded`-after design,
critic A1/D3/D6/D10):

- `PayloadField` / `ResourceRef`: repo is known *before* invoke → gate
  **pre-invoke**. This is the default and is required for **all mutations** and
  **all ops that return collections or aggregates**. A repo-scoped op whose
  repo cannot be derived pre-invoke from the payload is a manifest error at
  load.
- `LoadedSingle`: permitted **only** for ops returning at most one
  repository-scoped resource carrying `repo_field`. The op runs, and if the
  result is `Some`, the kernel gates on `result[repo_field]`; **a denied result
  is returned as `NotFound`, never `Forbidden`** (so existence is not leaked,
  critic A7/D6). Collection/aggregate returns may **not** use `LoadedSingle` —
  enforced at manifest load.
- Instance-scoped ops that nonetheless accept a repository-scoped resource URI
  must declare `ResourceRef` for that param so the kernel gates the referenced
  repo (critic D10). An instance op with a repo-scoped resource param and no
  declared derivation is a manifest error.

### 3.2 Extension points (provides / requires)

Provider declares named, versioned points:

```jsonc
// ext_issues
"providesExtensionPoints": [
  { "id": "issue-membership", "version": 1,
    "ops": ["issues.state-counts-for-refs-issue"] }
]
```

Consumer declares requirements:

```jsonc
// ext_epics
"requiresExtensionPoints": [
  { "provider": "ext_issues", "point": "issue-membership", "version": 1 }
]
```

`boundResourceKind` is **dropped** (critic B1/A-redundant): the resource kind
is already known from `resourceKinds` and adds no authorisation power. A point
is exactly "this named, versioned set of ops the provider commits to".

**Resolution (two-pass, fail-closed — critic A4/D1):**

1. Pass 1: register all extensions (parse + schema-validate + compile-load).
2. Pass 2: resolve every `requires` against the *exact* `(provider, point,
   version)` among loaded providers. Build an **immutable** binding table
   keyed `(consumer, provider, point, version) → Vec<op>`.
3. Any unresolved or version-mismatched requirement → the **consumer** is moved
   to `ExtensionState::Failed`/inactive and dispatched calls through it are
   rejected. Resolution failure never silently yields an empty/absent binding
   that a later check treats as "allowed" (critic D1 fail-open).

**Cross-call authorisation (critic A/D2 op-spoofing):** on `ops.invoke(target,
op)`, the kernel looks up the binding by `(caller, target, …)` and requires
`op ∈ binding.ops` **and** `target == binding.provider`. The provider's own
declared op list is authoritative; a different extension declaring a superset
point cannot widen another consumer's binding, because the binding records the
resolved provider id. `OPS_INVOKE_DEPTH_CAP` still bounds recursion; load-time
cycle detection over the provides/requires graph is added (critic D7).

Versioning is integer exact-match; a provider offering two versions declares
two entries. Upgrades are deliberate and synchronous across first-party
consumers (documented constraint, critic B8).

### 3.3 Participation gate (not a stored FSM)

"Participation" is **derived, not stored**, and is two independent checks the
caller path performs in order:

1. **Binding check**: does an immutable binding authorise `(consumer, provider,
   point, op)`? If not → `Forbidden`.
2. **Repo-participation check**: for the **provider resource's** repository
   `R` (e.g. the issue's repo, resolved from stored data via
   `repository_ref_for_resource`, never from caller-asserted scope):
   - `R` is `Enabled` for the **provider** (`repository.extensions ∋ provider`),
     and
   - `R` is `Enabled` for the **consumer** (`repository.extensions ∋ consumer`).
   If either fails → `Forbidden`.

This resolves the "which repo for an instance-scoped epic?" ambiguity (critic
A2/D5): the gated repo is always the *repository-scoped* participant's repo
(the issue), never the instance-scoped container's (the epic has none).
`ensure_extension_enabled_for_repo` is the `Enabled` predicate;
`ensure_repo_participates` is check 2, expressed via the resolved point.

The epics↔issues link is then exactly: to create the `part-of` relation binding
a repo-scoped `issue` into an instance-scoped `epic`, the **issue's** repo must
be `Enabled` for both `ext_issues` and `ext_epics`.

### 3.4 Resource-state validation (component-authoritative, kernel fast-fail)

WIT remains the single source of truth for the *state set* (the `issue-state` /
`epic-state` variant). To avoid two sources of truth (critic B3/C2), the
manifest does **not** redeclare states. Instead:

- The component is **authoritative**: it validates the transition under its own
  storage optimistic-concurrency (`update_begin`/`update_commit`), which closes
  the TOCTOU the kernel-only pre-check could not (critic A3).
- The kernel offers an **optional fast-fail**: a manifest may list legal
  transition *edges* (over the WIT-declared states) for a state-mutation op; a
  load-time check verifies every edge's endpoints are members of the WIT
  variant (no drift). When present, the kernel rejects an obviously-illegal
  transition with `Conflict` before invoke — an optimisation and a clearer
  error, **not** the sole guard. Absent the declaration, the component is the
  only validator (today's behaviour).

This keeps "extension backends are authoritative for extension behavior"
(CLAUDE.md) while still letting the kernel reject `Planned → Done` early.

## 4. Manifest & schema deltas

Added: `providesExtensionPoints[]`, `requiresExtensionPoints[]`, per-op
`dispatch` block (`scope` + typed `derive`), optional
`resourceKinds[].transitions[]`. UI route scope lives in the **UI manifest**
(`ui/manifest.json`), not the backend manifest, reflecting the layer split.

Removed: `allowedCrossCalls` (schema + wire + host + all manifests + the
`wasm_host.rs::invoke` check + its tests), same slice.

Validation added at load (critic C9/D9): every op `dispatch` route matches a
WIT export; `requires` has no duplicate `(provider, point)`; `provides`
versions are unique per point; transition endpoints ⊆ WIT states; no cycles in
the provides/requires graph. `docs/manifest.schema.json` and
`docs/extensions.md` change in the same slice as the parser (CLAUDE.md).

## 5. Codegen genericity — honest scope (critic B6/D2)

`build.rs` keeps a hand-written, typed `wasmtime::component::bindgen!` invoker
per extension (`dispatch_ext_*`); this is inherent to typed host bindings and
is **not** what we claim to make generic. What becomes generic and
data-driven is: the **route table** (scope/derivation), the **binding table**,
the **participation gate**, and **state validation** — none of which contain
extension-specific branches. We explicitly drop the earlier overclaim of "no
kernel edit to add a route"; adding an extension still adds its typed invoker.
Codegen continues to know nothing about specific extensions (CLAUDE.md).

## 6. Dispatch flow (after)

```
ops.invoke / request
  → route = RouteTable.get(ext, iface, op)            // typed, load-built
  → is cross-call? authorise against binding table     // (caller,target,op)
  → DispatchScope::Repository?
       derive repo (PayloadField | ResourceRef)        // pre-invoke
       → Enabled gate (+ participation if op rides a point)
  → state-mutation with declared transitions? kernel fast-fail (Conflict)
  → invoke component                                   // component is authoritative
  → DispatchScope LoadedSingle? gate returned resource's repo, deny → NotFound
  → return
```

Per-`dispatch_ext_*` hand-coded gates are deleted; gating is table-driven.

## 7. Build / verification plan & ENVIRONMENT CONSTRAINTS

This session's toolchain: `cargo` 1.94 and `bun` 1.3 present; **`cargo-component`
ABSENT, Chrome MCP ABSENT**. Therefore:

- **Completable & verifiable here** (pure-Rust kernel): `RouteTable`,
  `RepoDerivation`, binding-table resolution, participation gate, state
  fast-fail, manifest parsing/validation — all unit-testable with mock
  manifests via `cargo test --workspace` / `cargo clippy -- -D warnings`. No
  WASM instantiation required (critic D6: ~80% is WASM-free).
- **NOT completable here**: regenerating `dist/*.wasm` (needs cargo-component),
  so the epics↔issues component consumer and any `lib.rs` change cannot be
  built/run; the host `bindgen!` will compile against new WIT but the shipped
  component won't implement new ops → end-to-end dispatch tests for new ops
  must run where the toolchain exists.
- **Partially completable here**: frontend code, typecheck, and `*.client.ts`
  regen are runnable with `bun`, but any rendered-UI change **cannot be
  merged** — Chrome MCP is absent and the UI Verification Hard Rule forbids
  reporting UI work done on bundle/typecheck evidence alone.

## 8. Slicing (critic D5 — four independently reviewable PRs)

- **Slice 1 (this environment): RouteTable + generic gate wrapper.** Introduce
  `DispatchScope`/`RepoDerivation`, build the route table from the manifest,
  replace the scattered `ensure_repo_enabled` calls. Pure Rust; no manifest
  semantics change for callers; full unit tests. *No wasm regen needed.*
- **Slice 2 (this environment): extension-point binding table + participation
  gate.** Add provides/requires parsing, two-pass fail-closed resolution,
  cross-call authorisation, delete `allowedCrossCalls` atomically, migrate
  first-party manifests' cross-call declarations. Unit-tested with mock
  manifests. *Host compiles; first-party wasm unaffected (manifests are kernel
  data).*
- **Slice 3 (superseded): epics↔issues link consumer.** Originally a bespoke
  `epics.link-issue` op + dispatch-arm participation gate. Adversarial review
  (#142 continuation) found this dead on the real path: the UI links an issue
  to an epic via the generic `relations.create` mutation, which never invoked
  `link-issue`, so its gate guarded a door no caller walked through while
  `relations.create` itself applied no kind authorisation at all. The op was
  removed (wasm regen) and replaced by a generic, kernel-side enforcement that
  makes manifest-declared `relationshipTypes` load-bearing on **both** relation
  write paths — see `relationship_types.rs`. The per-repo participation rule
  returns as an opt-in, per-relationship-type owner-authorisation hook rather
  than an extension-specific dispatch arm.
- **Slice 4 (codeable here with bun; needs Chrome MCP to merge): UI
  instance/repo routes + slots.** Can be designed, written, and typechecked in
  this environment, but stays **unmerged** until browser-verified per the UI
  Verification Hard Rule.

## 9. Resolved-design open points

- `LoadedSingle` is restricted to single-resource reads and denies as
  `NotFound`; collections/aggregates must derive pre-invoke. (Closed A1/D3.)
- Participation keys on the provider-resource's repo; binding-exists and
  repo-participates are separate. (Closed A2/D5.)
- Resource-state stays component-authoritative; kernel pre-check optional and
  drift-checked against WIT. (Closed A3/B3/C2.)
- Reactor mutations stay a separate allowlist. (Closed A2/B2/C7.)
- `allowedCrossCalls` deleted atomically, fail-closed binding resolution.
  (Closed C1/D1/D8.)
- Relationship-type write gate evaluates **most-restrictive** participation
  across all admitting shapes (a permissive shape cannot shadow a gated one),
  and `requiresParticipation` is rejected on `symmetric` types at load (the
  source endpoint would otherwise be caller-chosen). (Closed by adversarial
  review of the relationship-type slice.)

### Known follow-up (pre-existing, out of scope for the relationship-type slice)

- Symmetric-verb canonicalization is inconsistent: `canonicalize_relation_endpoints`
  keys symmetry off the hardcoded `CORE_VERBS` table, while the relationship-type
  registry's `admits` keys off each shape's declared `symmetric` flag. An
  extension-declared symmetric verb outside `CORE_VERBS` is therefore admitted in
  both orientations but never canonicalized, so the two orientations persist as
  distinct un-dedupable edges. Separately, the WASM `relations` host write path
  does not canonicalize endpoints at all, diverging from the GraphQL path for
  core symmetric verbs. Both predate this work and are data-dedup consistency
  issues, not authorisation holes (the symmetric+participation combination that
  would make them security-relevant is now rejected at load). Fix: drive
  `verb_is_symmetric` from the registry and share one canonicalization helper
  across both write paths.

## 10. Tests (WASM-free unless noted)

Route table parse + each derivation; pre-invoke vs `LoadedSingle` gating
(deny→NotFound); binding resolution (resolved / unresolved→fail / version
mismatch→fail / cycle→fail); cross-call authorisation incl. provider-id
binding (spoofing rejected); participation (issue-repo enabled for both / one
missing → Forbidden); state fast-fail (legal allowed, illegal→Conflict, edge
not in WIT states → load error). Slice 3/4 add WASM/browser e2e where the
toolchain exists.

## 11. Critic findings ledger

| Critic | Finding | Resolution in this revision |
|---|---|---|
| A1/D3/D6 | `loaded` runs before gate; leaks; can't filter collections | §3.1 `LoadedSingle` single-resource only, deny→NotFound; collections/aggregates derive pre-invoke |
| A2/D5 | participation undefined for instance-scoped epic | §3.3 gate on provider-resource (issue) repo; two separate checks |
| A3/B3/C2 | state-FSM TOCTOU + two sources of truth | §3.4 component-authoritative; kernel optional fast-fail; states from WIT only |
| A4/D1 | unresolved requirement could fail open | §3.2 two-pass, immutable table, consumer→Failed on miss |
| A/D2 | op-name spoofing / superset point | §3.2 binding records resolved provider; target==provider + op∈ops |
| A7/D6 | post-invoke gate leaks existence | §3.1 deny→`NotFound` |
| B1 | `boundResourceKind` redundant | §3.2 dropped |
| A2/B2/C7 | folding reactor mutations over-couples | §2 kept separate |
| A5/B5 | unifying backend+frontend RouteScope | §2 split DispatchScope vs UI RouteScope |
| B6/D2 | "generic dispatch" overclaim (build.rs) | §5 honest: typed invoker stays; tables generic |
| C3 | stringly-typed derivation | §3.1 typed `RepoDerivation` enum |
| C1/D8 | allowedCrossCalls deletion atomicity | §2/§4 deleted atomically, no dual gate |
| C9/D9/D7 | missing manifest validation | §4 route↔WIT, dup/version/transition/cycle checks |
| D10 | instance op with repo-scoped param | §3.1 must declare `ResourceRef`; else load error |
| D5 | PR too large | §8 four slices |
| D3(env)/D4 | wasm regen + UI unverifiable here | §7 constraints; slices 3–4 deferred to toolchained env |
| B8 | version upgrade path | §3.2 integer exact-match, synchronous upgrade, documented |
```
