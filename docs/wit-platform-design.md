# `comtrya:platform` WIT — design notes

Phase 1 deliverable of the schema-first foundation overhaul. The WIT
itself lives in `extensions/wit/comtrya/platform/*.wit` and parses with
`wasm-tools component wit extensions/wit/comtrya/platform`.

## What an extension is, after this lands

A Wasmtime-loaded Component Model component that:

- **Imports** the kernel-provided interfaces (`storage`, `relations`,
  `comments`, `events`, `identity`, `time`, `ids`, `ops`, `log`).
- **Exports** the `reactor` interface (`subscribed-event-types` +
  `on-event`).
- **Declares its own ops in its own WIT** (in a per-extension package
  that depends on `comtrya:platform`). The kernel reads that WIT at
  install time and generates the GraphQL handler arms + a typed TS
  client method per op.

The kernel has *no* string-match dispatch and *no* kernel-resident
behaviour for extension-owned resources. The component is the single
source of truth.

## Worlds

Three worlds are declared. Extensions pick the smallest world that
covers what they need; the manifest's `host-imports` allowlist remains
the runtime trust boundary, but the world choice makes the capability
shape visible at WIT-link time and shapes codegen.

| World | Use | Imports |
|---|---|---|
| `reader-extension` | audit viewers, dashboards, search backends | reads only (`storage.get`/`query`/`list-all`, `relations.outgoing`/`incoming`/`between`, `events.read-recent`, `identity`, `time`, `log`) |
| `reactor-extension` | event-driven automations that don't directly own storage | reader + `events.append`, `ops.invoke`, `ids.mint` |
| `extension` | full-capability author of new resource kinds | every host interface |

## Interfaces

### `types`
Shared records and aliases:
- `id`, `uri`, `iso-timestamp`, `principal-uri`, `extension-id` — opaque
  string aliases for codegen / documentation discipline.
- `version` — opaque OCC token returned by `storage.update-begin`.
- `event-pattern` — grammar-restricted glob for reactor subscriptions
  (`<segment>(.<segment>)*` where `<segment>` is `[a-z][a-z0-9-]*` or
  `*`; no `**`).
- `op-name` — `<extension-id>/<op-name>` or `<op-name>`.
- `error-code` variant mapping to HTTP statuses
  (`not-found → 404`, `conflict → 409`, etc.) with explicit
  `internal` vs `unavailable` semantics (the latter is retry-able).
- `delete-result` variant (`deleted | was-absent`) used uniformly by
  every `delete` in the package.
- `page-token` record — shared opaque cursor used by every list-style
  function in the package.
- `event` record — kernel-minted; lives in `types` so the `reactor`
  export can reference it without forcing every reactor-exporting world
  to also import the `events` interface (which is the difference
  between `reader-extension` and `reactor-extension`).
- `log-level` variant for the `log` host import.

### `storage`
Per-extension document namespace. Operations:
- `create(collection, id, data, metadata)` — kernel validates that
  `id` was minted for this extension.
- `get(collection, id) -> option<doc-snapshot>` — snapshot carries
  a `version` token.
- `update-begin -> doc-snapshot` (missing returns `err(not-found)`)
  + `update-commit(expected-version, ...)` — version-tokened
  optimistic concurrency. `conflict` is returned when the document
  advanced between the two calls; the extension retries.
- `delete -> delete-result` — idempotent, `was-absent` distinguishes
  no-op from state-transition.
- `query(filters, order, limit, after)` and
  `list-all(limit, after)` — required `limit` (kernel cap 1024) and
  opaque `page-token` cursor. `index-filter` is a tagged variant
  (`scalar-cmp | null-check`) so illegal states like "equals null"
  cannot be constructed. `scalar-op` covers `eq | neq | lt | lte |
  gt | gte`; `%in` and full-text predicates defer to 0.2.0.

The extension cannot read another extension's collections; cross-
extension reads happen through `relations`, `comments`, `events`, or
`ops.invoke`.

### `relations`
Same semantics as the existing GraphQL surface. `create` returns a
`create-result` variant (`created(relation) | already-existed(relation)`)
so callers can distinguish a fresh insert from an idempotent hit on
the `(canonical-source, canonical-target, kind)` triple. Attributes
are NOT merged on idempotent hit; use `replace-attributes` for an
atomic in-place update. `delete` returns `delete-result`. All three
query functions (`outgoing` / `incoming` / `between`) require `limit`
and return a `relation-page` with cursor pagination.

WIT-reserved-word note: relation endpoints are `source` / `target` in
WIT (escaped with `%` since `from`/`to` are reserved). The codegen
aliases them back to `from`/`to` on the way out to GraphQL — extension
authors writing TS never see the WIT-side names.

### `comments`
Core nested-thread comments. `thread(target, limit, after)` returns
a `comment-page` (kernel cap 256). `post(target, parent: option<id>,
body)` — `parent` is typed as a comment id, not an arbitrary URI, so
the type itself prevents pointing replies at non-comments.
`edit(id, body)`, `delete(id) -> delete-result`. Parent-cycle attempts
are rejected with `bad-input`; deleted parents leave replies orphaned
(kernel does not cascade).

### `events`
- `append(event-type, payload, source-uri?) -> event` — returns the
  full persisted record (id, timestamp, kernel-injected emitter
  extension). Kernel validates the type is in the extension's
  `allowed-emits`. The `event` record itself is declared in `types`
  so the reactor export can consume it without dragging `events` into
  every world.
- `read-recent(limit, type-filter, source-extension-filter, after)` —
  returns an `event-page` with the same `page-token` cursor model as
  `storage.query`; kernel-scoped to the calling extension's own
  events plus any explicitly allowed in the manifest's
  `allowed-event-reads`.

### `identity`
Two principals per invocation:
- `current-principal()` — the user/credential that triggered this op.
- `extension-credential()` — the extension's own synthetic principal.
- `has-permission(name) -> result<bool, error>` — authz check via the
  kernel's authz layer; `err(unavailable)` distinguishes "authz down"
  from definitive denial. Permission strings are
  `<extension-id>.<verb>`-shaped.

### `time`
`now-iso` and `now-millis`. Substituted with a fake clock in tests.
The two functions agree to within one second within a single
invocation (single monotonic clock read).

### `ids`
`mint(kind-name) -> id`. The kernel validates the calling extension is
allowed to mint that kind (per its manifest's
`contributes.resource-kinds`) and records the minted id so subsequent
`storage.create`s using a non-minted id are rejected with `forbidden`.

### `log`
`emit(level, message, fields?)` — best-effort structured logging that
does NOT go through the event log and never returns an error. Used for
diagnostics; use `events.append` for state transitions other extensions
or the UI need to observe.

### `ops` — cross-extension invocation broker
`invoke(target-extension, op, payload)`. The kernel:
1. Checks the caller's manifest declares
   `allowed-cross-calls` containing `<target>/<op-name>`.
2. Validates `payload` against the target's WIT-declared input schema.
3. Invokes the target's WASM with the validated input.
4. Returns the result bytes, also schema-validated.
5. Enforces a synchronous call-stack depth cap of 32 across nested
   `ops.invoke` chains (independent from the reactor recursion cap).

Phase 3 codegen produces a typed wrapper per `allowed-cross-calls`
entry in each language SDK; authors never call `invoke` raw.

### `reactor` — the one required export
- `subscribed-event-types() -> result<list<event-pattern>, error>` —
  returns the dispatch filter, called once at install time on a
  dedicated init-time component instance.
- `on-event(env) -> result<list<reaction>, error>` — called per
  matching event. `event` is the single record from `types` (no
  duplicate `event-envelope`). Reactions are typed:
  `invoke-mutation | emit-event`. Empty list means "acknowledged, no
  reactions"; there is no explicit `no-op` marker. Returning `err(...)`
  signals a processing failure that the kernel may retry per its
  delivery policy.
- `mutation-call.payload` uses the same name as `ops.invoke.payload`
  for consistency.
- Reactions in 0.1.0 are independent — failures are logged and the
  next reaction proceeds. Multi-step pipelines compose via emitted
  events flowing into other extensions' reactors.
- Per-event reactor recursion is capped at 8. Reactions emitted at
  depth 8 are dropped and a `comtrya.kernel.reaction-depth-exceeded`
  event is appended for observability.

## Decisions baked in

| Decision | Rationale |
|---|---|
| Typed `result<T, error>` everywhere | Generated TS client gets pattern-matched errors; kernel auto-maps to HTTP. |
| Records for kernel-known types; opaque `list<u8>` for extension records | Per-extension WIT declares its own records; cross-extension payloads travel as JSON bytes that the kernel validates against the *target's* schema. |
| Per-extension storage namespace | Trust boundary is enforced at host imports, not by convention. |
| Two-step `update-begin`/`update-commit` with explicit `version` token | WIT 0.2 lacks closure support; OCC is enforced by token comparison at commit time. Replaced when WIT 0.3 closures stabilise. |
| `ops.invoke` brokers cross-extension calls | No direct WASM-to-WASM; the kernel mediates so allowlists, payload schemas, and identity all stay enforceable. |
| Three worlds (`reader-extension`, `reactor-extension`, `extension`) | Capability shape is visible at WIT-link time; manifest stays runtime authority. |
| No subscriptions in WIT yet | Live UI updates happen via the existing `/events` SSE stream consumed by the TS SDK; the WASM side doesn't need streaming. |
| Outbound HTTP omitted in 0.1.0 | Capability-scoped network egress requires URL allowlists, response-size caps, timeouts, DNS-rebinding protection. Comes in 0.2.0. |
| `log` is best-effort, no error | Logging never blocks or fails a reaction; extension authors cannot accidentally swallow real errors into log retries. |
| Reactor depth cap of 8 | Same limit as today's Rust-resident reactor dispatcher; breaches emit a kernel diagnostic event. |
| Synchronous `ops.invoke` cap of 32 | Prevents stack overflow from cross-call cycles; independent of reactor recursion. |
| Required `limit` on `query` / `list-all` | Avoids unbounded result sets crossing the WASM linear-memory boundary; cursor pagination is the only safe path forward. |

## Things the WIT does *not* say

These live in the per-extension manifest, not the WIT:

- The extension's id and version.
- The platform WIT version it was built against (`platformWitVersion`).
- Which kinds it owns (`contributes.resource-kinds`).
- Which host-import interfaces it's permitted to call (`host-imports`).
- Which other extensions' events it can read (`allowed-event-reads`).
- The `reactor.allowed-mutations` and `reactor.allowed-emits` allowlists.
- The `allowed-cross-calls` list (`<target>/<op>` strings).
- Indexed field declarations per collection.
- Card renderer bindings (`contributes.cards`).
- Slot contributions (`contributes.slots`).
- Routes (`contributes.routes`).

This split keeps WIT to *interface description* and manifest to
*identity / capability declaration*, matching the existing
[memory: manifest-is-identity-not-behaviour].

## What changes for the GraphQL surface

In the v3 runtime, GraphQL roots are mapped to generated dispatch routes before
the kernel-owned fallback roots are considered.

Current dispatch flow:

1. Extension's per-extension WIT declares:
   ```wit
   interface issues {
     record close-issue-input { id: id, reason: option<string>, closed-by-ref: option<uri> }
     close-issue: func(input: close-issue-input) -> result<issue, error>;
   }
   ```
2. The kernel's codegen produces, at build time, a typed route:
   ```rust
   ext_issues/issues.close-issue
   ```
   The generated table accepts the stable GraphQL field name and resolves it to
   the extension-owned WIT route.
3. The dispatcher looks up the loaded `ext_issues` component, invokes its
   `close-issue` export with the deserialised input record, and returns the
   result.

The old string-match table has been removed; extension-owned GraphQL operations
enter through generated dispatch.

## Open items deliberately deferred from this WIT

- **Subscriptions** as a WIT primitive (Component Model 0.3 streams).
- **Outbound HTTP** for extensions that need to call external services.
- **WASI HTTP** as the per-extension network surface.
- **Closure support** in `storage.update` (Component Model 0.3).
- **Resource handles** for storage / relation entities (WIT 0.2
  supports them; we deliberately use plain records + version tokens
  for simpler codegen). Resource handles are a candidate revisit for
  the OCC update path once Phase 2 lands.
- **Cross-extension type imports** (extension C declaring a record that
  contains A's and B's record types directly). 0.1.0 references go
  via opaque `uri`; full Phase 3 codegen may auto-resolve those URIs
  into typed GraphQL union fields.
- **Lifecycle hooks** (`on-install`, `on-uninstall`, `on-upgrade`).
  Phase 2 will define these alongside the kernel's extension lifecycle
  state machine.
- **Manifest composition / capability groups**. Manifests stay flat in
  0.1.0; reuse story is Phase 2.
- **Range / full-text predicates** beyond the scalar filter operators
  declared here. Phase 2 will add `match` / `contains` once we know
  the index implementation.

## Sign-off checklist

Before Phase 2 starts:
- [x] WIT parses with `wasm-tools component wit
       extensions/wit/comtrya/platform`
- [x] Every interface has a docstring
- [x] No WIT reserved-word collisions in field names
- [x] Error shape supports HTTP status mapping
- [x] Trust boundaries (per-extension namespaces, manifest-declared
       allowlists) are enforceable at host imports
- [x] OCC is enforced at the type level (version token in
       `update-commit`)
- [x] Pagination is required on every list-returning function
- [x] `result<>` wraps every fallible call, including `on-event` and
       `has-permission`
- [x] Architectural decisions documented in this file
- [x] Adversarial review pass complete across four lenses
       (FSM / FP / extensibility / composition)
