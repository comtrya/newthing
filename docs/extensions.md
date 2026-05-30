# Comtrya extension authoring

Comtrya extensions ship as one directory with a backend Component Model
component and, optionally, a browser UI bundle.

First-party extensions live at `extensions/first-party/<extension-id>/`.

## Directory layout

```text
extensions/first-party/ext_issues/
  manifest.json
  wit/
  component/
    Cargo.toml
    src/lib.rs
  dist/ext_issues.wasm
  ui/
    package.json
    manifest.json
    src/
  assets/index.js
```

The backend component is authoritative for product behavior. The UI bundle is
only browser code; it talks to GraphQL through the shell SDK.

## Backend component

Each first-party backend is a Rust `cargo-component` crate under
`component/`. The crate imports the locked platform package from
`extensions/wit/comtrya/platform/` and exports the extension's own WIT world
from the extension-local `wit/` directory.

Build one extension with:

```sh
extensions/bundler/build-extension.sh extensions/first-party/ext_issues
```

The bundler runs the component build, emits generated dispatch metadata, builds
the optional UI bundle, refreshes UI manifest integrity, and writes the real
Component Model artifact to `dist/<extension-id>.wasm`.

`component.wat` stubs are not part of the v3 runtime. A first-party extension
must have `component/Cargo.toml` and a real `dist/<extension-id>.wasm`.

## WIT

The platform WIT is locked at `comtrya:platform@0.1.0`.

Extension WIT declares product operations and reactor exports. The server build
discovers installed extensions, runs `crates/wit-codegen`, and generates the
typed dispatch table that maps GraphQL roots to WIT exports.

Typical WIT shape:

```wit
package comtrya:ext-issues@0.1.0;

world ext-issues {
  // Inherit every host import + the reactor export from the platform.
  include comtrya:platform/extension@0.1.0;
  export issues;
}
```

The world `include`s `comtrya:platform/extension@0.1.0`, which brings in
every platform host import and the `reactor` export. The extension only
adds `export <iface>;` for the product interface(s) it implements; it does
not list per-interface imports or re-export `reactor`.

Host imports are capability-checked against `manifest.json`.

## Manifest

`manifest.json` is the backend contract the host validates at startup. The
important v3 fields are:

- `id`: extension id, matching the directory name.
- `platformWitVersion`: currently `"0.1.0"`.
- `wasmComponent`: must be `dist/<extension-id>.wasm` for first-party
  extensions.
- `hostImports`: platform imports the component may call.
- `allowedEmits`: event types the component may append.
- `allowedEventReads`: ids of other extensions whose events this extension may
  read via `events.read-recent`.
- `providesExtensionPoints`: named, versioned sets of ops this extension
  exposes for others to call synchronously via `ops.invoke`. Each point is
  `{id, version, ops}` where `ops` are canonical `<interface>.<op>`
  descriptors. A point is the unit another extension binds to.
- `requiresExtensionPoints`: exact `{provider, point, version}` entries this
  extension depends on. At load the kernel resolves every requirement against
  the providers' `providesExtensionPoints` with an exact integer version
  match and builds an immutable per-consumer binding table; a synchronous
  `ops.invoke` is authorised only when a resolved binding includes the
  `(provider, op)` pair. Resolution is fail-closed: an unresolved
  requirement, a duplicate declaration, or a requirement cycle aborts the
  load. (This replaces the former flat `allowedCrossCalls` allowlist.
  Reactor mutations are a separate, asynchronous path — see
  `reactor.allowedMutations` — and are not modelled as extension points.)
- `reactor`: subscription, mutation, emit, and recursion policy for event
  reactions. `reactor.scope` (`"repository"` default, or `"instance"`)
  selects whether event dispatch to this extension is gated per-repository
  by the source repo's `repository.extensions` opt-in. A
  repository-scoped reactor is skipped for events whose source repository
  has not enabled the extension; an instance-scoped reactor always runs.
- `contributes.resourceKinds`: resource URI kinds owned by the extension.
  Each entry's `scope` (`"repository"` default, or `"instance"`) selects
  whether ops on that kind are gated per-repository by the target repo's
  `repository.extensions` opt-in. Repository-scoped ops against a
  repo that has not enabled the extension are rejected with `Forbidden`.
- `dispatchRoutes`: per-op kernel dispatch scope. Each entry names a
  canonical `<interface>.<op>` and declares whether that op is gated by
  the per-repository opt-in (`"scope": "repository"`) or always available
  (`"scope": "instance"`). A repository-scoped route carries a typed
  `derive` telling the kernel how to find the repository to gate against;
  today `{"strategy": "payloadField", "field": "<name>"}` reads the
  repository URI from a named payload field, before the component runs.
  The kernel builds a typed route table from these entries at load and
  applies one generic pre-invoke gate to every extension — no
  per-extension dispatch special-casing. Every `op` must be a real WIT
  export; a route that names no export, a repository route with no
  `derive`, or an instance route with a `derive` fails the load. Ops not
  listed are not gated in the pre-invoke phase.
- `contributes.relationshipTypes`: relation verbs and labels the extension
  makes available to UI surfaces for typed relationship creation.
- `contributes.collections`: storage collections and indexes
  declarations owned by the extension.
- `ui.manifest`: path to the browser-side UI manifest (nested under the `ui`
  object), when the extension has a UI surface.

The server validates manifests against `docs/manifest.schema.json` before the
extension is installed into the runtime.

## UI bundle

The UI surface is a browser ESM bundle built from `ui/` into
`assets/index.js`. It registers widgets and routes through
`@comtrya/sdk-core` plus the framework adapter used by the extension, currently
Vue for first-party UI.

The shell loads installed extension UI manifests through
`/_extensions/<id>/manifest.json`, verifies asset integrity, imports
`assets/index.js`, and calls the bundle's default `setup(host)` function.

The backend component and browser bundle are intentionally separate. Backend
behavior runs in Wasmtime on the server; DOM rendering runs in the browser.

### Manifest is identity, not behavior

The manifest declares **what the extension is** — id, version, publisher,
asset entry, permissions, owned resource kinds, owned collections, owned
relationship types. It does **not** declare what the extension does at
runtime. There is no `contributes.slots`, no `contributes.routes`, no
`contributes.cards`. Those are runtime registrations through the SDK host.

### Widgets

An extension publishes a widget by calling `host.registerWidget`:

```ts
host.registerWidget({
  id: "issues-list",
  element: "comtrya-issues-list",
  defaultSlot: "repository.main",
  defaultPriority: 100,
  requiredPermission: "issues.read",
});
```

The shell defines a small set of generic slots (`repository.main`,
`repository.sidebar`, `home.your-work`, etc.). The widget's `defaultSlot`
is where it appears out of the box; a persisted **user layout** (per-user,
per-repository) can override placement, priority, or hide the widget. The
shell calls `setUserLayout(...)` from `@comtrya/sdk-core` on boot and
again when the active repository changes.

The current persistence is `localStorage` (`frontend/src/user-layout.ts`).
The shape is identical to what a federated GraphQL mutation will accept,
so swapping to server-side persistence is one function change. The
intended schema, for the follow-up:

```graphql
type Query { userLayout(repositoryId: ID!): UserLayout }
type Mutation { setUserLayout(repositoryId: ID!, layout: UserLayoutInput!): UserLayout }
type UserLayout { entries: [UserLayoutEntry!]! }
type UserLayoutEntry { widgetId: ID!, slot: String, priority: Int, hidden: Boolean }
```

### Routes

Extensions own only `/x/<routePrefix>/...`. Never `/`, never `/r/...`.
The route prefix lives in the **backend** manifest as `routePrefix` —
that's identity. URLs are constructed with `buildExtensionUrl` from
`@comtrya/sdk-core`; hand-rolling `/x/<prefix>/...` strings is wrong.

```ts
import { buildExtensionUrl } from "@comtrya/sdk-core";

const detailUrl = buildExtensionUrl("issues", `/${workspaceId}/${number}`);
// → "/x/issues/<workspaceId>/<number>"
```

`registerRoute` rejects empty or compound `routePrefix` at runtime, so
mistakes fail loudly.

### Data access

Every query — from the shell, from extensions, from anywhere — goes
through the shared GraphQL client:

```ts
import { getGraphQLClient } from "@comtrya/sdk-core";

const data = await getGraphQLClient().query(QUERY, { variables });
```

The schema is federated: each extension contributes its slice through
the WIT dispatch table. There is no second transport, no per-extension
`fetch("/graphql", ...)`, no REST shim.

## Runtime checks

The final smoke path verifies the extension cutover:

```sh
./start.sh --reset --oneshot
```

That smoke fails if a first-party extension still has a `.wat` stub, lacks
`platformWitVersion: "0.1.0"`, points at anything other than
`dist/<extension-id>.wasm`, lacks `component/Cargo.toml`, or ships a non-WASM
artifact.
