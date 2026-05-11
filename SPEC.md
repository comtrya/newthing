# Forgepoint v2 Specification

## 1. Mission

Forgepoint v2 is a self-host-first GitHub replacement designed for every person or organization to run their own code forge. The product is intentionally minimal by default. Core provides only the kernel required to host Git repositories, authenticate users, enforce policy, run extensions, validate configuration, emit events, and expose a coherent API.

Almost all product features are delivered as extensions. Pull requests, code browsing, epics, Kanban boards, PRDs, docs, wiki, federation publishers, and similar capabilities are not built into the default product surface. They are installed as WASM feature packages.

The system must support both monorepo and polyrepo workflows by default. Monorepos are modeled through path-scoped projects inside repositories. Polyrepo users can group repositories recursively, similar to GitLab groups.

## 2. Product Principles

- Every instance is owned by one person or organization.
- The core server ships almost no product features by default.
- Extensions are the primary way to add product behavior.
- Repository and project behavior should be configured in Git whenever possible.
- The default deployment must be simple enough for a small self-hosted instance.
- The architecture must still support larger organization deployments without changing public APIs.
- Git compatibility is mandatory, but the implementation must be Rust-native.
- Events are durable first-class records that can be projected to other protocols.
- Local operation must not depend on a hosted Forgepoint service.

## 3. Deployment Model

Forgepoint v2 is single-tenant. One instance is owned by one person or organization and can contain many users, teams, workspaces, groups, repositories, and projects.

The v1 deployment topology is strictly single-node:

- One Rust server binary serves the GraphQL API, Git-over-HTTPS endpoints, event stream, extension runtime, background jobs, asset API, and health endpoints.
- The frontend is a separate Astro/TypeScript/Bun application.
- The frontend talks to the Rust server over GraphQL and loads installed extension UI assets from the Rust asset API.
- Multiple replicas of the Rust server are not supported in v1. Several normative behaviors (S3 ref CAS, SQLite job claim, in-memory authorization caches, schema reload) assume a single writer.
- Scale-out deployments are deferred (see §27) and will require additional coordination components (a ref-lock service for S3, a multi-worker job claim protocol on Postgres, schema-reload coordination). The v1 GraphQL, CUE, event, and storage contracts must not assume multi-node.

Transport posture:

- TLS is required for every public endpoint in production (`/graphql`, `/graphql/stream`, `/events`, `/git/...`, `/_extensions/...`, `/auth/...`).
- The frontend may be served from the same origin as the server or from a different origin. Cross-origin operation is supported and is the assumed default for local development.
- Cross-origin contract: see §13.5 (CORS, cookies, SSE auth).

Release artifacts:

- Native Rust server binary.
- OCI container image for the server.
- Separately built frontend artifact.

Development environment:

- Nix flake/devshell should pin Rust, Bun, CUE tooling, SpiceDB-compatible development services, and test dependencies.
- Native installation remains possible but is not the primary development path.

## 4. Core Responsibilities

Core owns:

- OIDC authentication plumbing.
- User, team, workspace, group, repository, and project registry.
- Git smart HTTP hosting.
- Repository storage adapter contract.
- Local, S3-compatible, and Cloudflare Artifacts repository storage backends.
- CUE configuration evaluation and validation.
- GraphQL gateway and schema composition.
- WASM extension runtime.
- Extension installation metadata, manifests, grants, and asset serving.
- Authorization adapter, with SpiceDB via Prescience as the default implementation.
- Checks/statuses as a generic primitive.
- Durable event outbox.
- SSE event stream.
- GraphQL subscriptions.
- Background job queue and scheduler.
- Host-managed extension storage.
- Host-managed secret store.
- Audit events, health checks, structured logs, metrics, and traces.

Core does not own:

- Pull requests.
- Code browsing UI.
- Issues.
- Epics.
- Kanban.
- PRDs.
- Docs.
- Wiki.
- Federation publishing implementations.
- Product-specific check providers.
- Product-specific checks/status UI.

Those are extensions.

## 5. Technology Stack

Server:

- Rust.
- Tokio.
- Axum.
- Tower.
- async-graphql.
- SQLx.
- Wasmtime.
- WASM Component Model.
- WIT interfaces.
- gix for all Git operations.

Frontend:

- Astro.
- TypeScript.
- Bun.
- Web components for extension UI.
- Full Forgepoint component kit for visual consistency.

Persistence:

- SQLite for simple self-hosted instances.
- Postgres for larger instances.
- SQLx behind narrow repository traits.
- Explicit migrations.
- Same behavior semantics for SQLite and Postgres.

Authorization:

- Adapter-based authorization layer.
- SpiceDB-compatible implementation using Prescience by default.

Configuration:

- CUE.
- Embedded runtime evaluation through `cuengine`.
- No production dependency on shelling out to the `cue` binary.

## 6. Identity And Authentication

Forgepoint v2 uses OIDC only.

Core must not introduce its own social identity protocol. ATProto, ActivityPub, or other identities may be linked or used by extensions and publishers, but OIDC is the authentication mechanism.

OIDC client kinds:

- Each configured issuer declares `clientKind: "public" | "confidential"`.
- Confidential clients (browser/web login) must provide a non-empty `clientSecret`. Empty secrets are a config validation error in `environment: "production"`.
- Public clients (CLI device flow, native helpers) use PKCE and must not store a `clientSecret`.
- Refresh tokens are persisted for confidential clients only. Public clients re-authenticate via short device-flow loops.
- TLS is required on `/auth/oidc/*` and `/auth/token-exchange` in production. Issuer metadata must be fetched over TLS with signature verification.

User provisioning:

- Users are created just-in-time on first successful OIDC login.
- JIT provisioning is allowed only when configured issuer, domain, group, or claim rules permit it.
- Admins may also pre-provision users.
- JIT provisioning emits `dev.forgepoint.user.created` (see §32.2).

Human Git authentication:

- Forgepoint does not use personal access tokens by default.
- Humans authenticate through an OIDC browser or device flow.
- A Forgepoint CLI credential helper obtains short-lived scoped Git credentials from the server.
- Git session credentials last minutes and can be refreshed by the helper.
- Credential issuance is audited.

Automation authentication:

- CI and other automation use OIDC token exchange only.
- Trusted workload OIDC issuers exchange JWTs for short-lived Forgepoint credentials.
- Issued credentials are scoped by configured policy and authorization checks.
- Forgepoint v1 does not require long-lived bot tokens for automation.
- Workload token exchange requires TLS. Optional mTLS may be configured per-issuer in `config.cue` for higher-assurance workloads; v1 does not require it.

Token scope model:

- Credentials are scoped by resource and action.
- Action names are drawn from a closed enum, registered by core and by extensions through their capability manifests. Core actions in v1: `git:read`, `git:write`, `graphql:read`, `graphql:write`, `events:read`, `checks:read`, `checks:write`. Unknown action names are rejected with `BAD_USER_INPUT`.
- Resource scopes may target instance, workspace, group, repository, project, or extension-owned resources, expressed as canonical `forgepoint://...` URIs (see §29.2).

## 7. Authorization

Authorization is adapter-based.

The default implementation uses SpiceDB through the Rust Prescience library. The core domain model should be expressed in relationship-oriented terms compatible with SpiceDB.

Core owns:

- Users.
- Teams.
- Team membership.
- Resource hierarchy relationships.
- Core permissions.
- Extension-declared permission registration.

The authorization model is scoped and hierarchical. Permissions can be evaluated at instance, workspace, group, repository, and project scopes.

Extensions declare permissions and resource types in their manifests. Core maps those declarations into the authorization adapter. Extensions do not bypass core authorization for core resources.

## 8. Namespace Model

The namespace hierarchy is:

- Instance.
- Workspace.
- Recursive groups.
- Repositories.
- Projects.

Repositories belong to groups. Groups may contain other groups. Projects represent meaningful units of work inside repositories, especially monorepos.

A project may map to:

- A whole repository.
- A path inside a repository.

Project boundaries are primarily configured through repository-local CUE.

## 9. Git Hosting

Core implements Git smart HTTP over HTTPS.

SSH is not part of v1 core. It may be added later as an extension or core module if required.

The implementation must use `gix` only:

- No Git CLI fallback in production code.
- No libgit2 dependency.
- Git protocol behavior must be tested against real standard Git clients (canonical `git`, libgit2-based clients, and JGit).

Required Git protocol surface for v1:

- Smart HTTP transport (RFC-compliant `info/refs`, `git-upload-pack`, `git-receive-pack`).
- Protocol v2 (`Git-Protocol: version=2`) as the preferred transport. Protocol v0 supported as fallback.
- Sideband-64k progress / error reporting.
- Capability advertisements: `multi_ack_detailed`, `no-done`, `ofs-delta`, `report-status`, `delete-refs`, `quiet`, `atomic`, `agent`, `object-format=sha1`.
- Shallow clone (`shallow`, `deepen`, `deepen-since`, `deepen-not`).
- Filter modes: at least `blob:none` and `tree:0` (sufficient for partial clone of large monorepos).
- Push options (`push-option`) — passed to hooks and CUE validators where applicable.
- SHA-1 object format only in v1; SHA-256 is deferred.

Anything outside this surface is out of scope for v1. If `gix` upstream cannot supply a required feature at release time, the corresponding test in §39 is gated and a tracking issue is filed before shipping.

Core exposes controlled Git capabilities to extensions:

- Read commits, refs, trees, blobs, and diffs.
- Request transactional ref updates.
- Create commits or refs only through host APIs (see WIT `host-git` in §35.3).
- All writes pass through core authorization, hooks, branch rules, CUE validation, and storage transactions.

Git LFS:

- Git LFS is **deferred** to a post-v1 release (see §27).
- `InstanceCapabilities.gitLFS` always returns `false` in v1; the field is retained on the schema for forward compatibility.
- v1 must not silently accept LFS pointer pushes against missing LFS storage; pushes that introduce `.gitattributes` entries declaring `filter=lfs` are accepted, but the LFS batch API is not served.

Repository import:

- Importing existing remote repositories is out of scope for v1.
- Users can create empty repositories and push from local clones.

## 10. Repository Storage

Repository storage is adapter-based.

V1 must ship these backends:

- Local filesystem bare Git repositories (default, self-hosted, required).
- S3-compatible storage (required).

V1 may ship:

- Cloudflare Artifacts (optional; not required for the v1 acceptance criteria in §25).

Local storage is the default for self-hosting and is the only backend that requires no external service.

Cloudflare Artifacts is an optional managed backend. If shipped, it must conform to the same `RepoStorage` behavior as the other backends; if not shipped in a given release, instances must still self-host without it. Any limits Cloudflare Artifacts imposes (max blob size, objects per namespace, request rate) are surfaced as `STORAGE_UNAVAILABLE` or `CONFLICT` GraphQL errors at the boundary and documented in the backend's CUE schema fragment.

S3-compatible backend:

- Core receives Git pushes.
- Core validates authorization, hooks, CUE config, and ref rules.
- Core commits packs and refs through a locking repository storage transaction API.
- Direct browser/client writes to S3 are not part of the repository write path.
- v1 assumes the Rust server is single-node (§3). Multi-node S3 with concurrent ref CAS requires an external coordination service (e.g., a lock object on a transactional store) and is out of scope for v1.
- Local staging is required during receive-pack: pack streams must be staged on the server's local disk before validation and atomic commit to S3. Per-push staging must be bounded by configurable budget (default: `staging_max_bytes = 2 * pack_size` and `staging_max_concurrent = 4`); breaches return `STORAGE_UNAVAILABLE`.

The storage adapter must support:

- Repository creation.
- Repository deletion.
- Clone/fetch object reads.
- Push object writes.
- Ref reads.
- Transactional ref updates.
- Locking or compare-and-swap semantics. Local backend uses filesystem locks; S3 uses a manifest object with conditional write (`If-Match` / `If-None-Match`); Cloudflare Artifacts uses the equivalent conditional-write primitive on the underlying namespace.
- Snapshot metadata required for CUE evaluation and indexing.

## 11. Metadata Persistence

Core metadata supports both SQLite and Postgres.

SQLx is used behind narrow repository traits. The rest of core should not depend on raw SQL details.

Migrations:

- Explicit SQL migrations.
- Checked at startup.
- Pending or incompatible core migrations block startup.
- Extension storage migrations block extension activation if incompatible.
- v1 is single-node (§3), so the startup-blocking policy is sufficient. Future multi-node deployments will require coordinated rolling migrations; the policy will be revised in that release.

Backend parity:

- SQLite and Postgres must pass the same integration test suite. Backend-specific SQL is acceptable, but externally observable semantics must match.
- Concurrency model differs: SQLite is single-writer, Postgres supports concurrent writers. v1 ships single-node and accepts SQLite's writer-serialization as the global write ordering.
- The job queue (§16, §38.2) uses a backend-specific claim algorithm: Postgres uses `SELECT ... FOR UPDATE SKIP LOCKED`; SQLite uses `BEGIN IMMEDIATE` plus `UPDATE ... WHERE state = 'queued' AND locked_by IS NULL ... RETURNING` with jittered retry on `SQLITE_BUSY`. Both yield at-most-one claimed-by-one-worker.

Core metadata includes:

- Users.
- Teams.
- Workspaces.
- Groups.
- Repositories.
- Projects.
- Extension installations.
- Extension manifests and grants.
- Event outbox.
- Jobs.
- Checks/statuses.
- CUE config snapshots.
- Audit events.
- Secrets metadata.

## 12. Configuration

Forgepoint has two configuration layers:

- Local instance configuration.
- Repository-local configuration.

### 12.1 Local Instance Configuration

V1 instance configuration lives in a local `config.cue` file.

It owns:

- OIDC issuer/client settings.
- Initial admin rules.
- Storage backend definitions.
- Workspace definitions.
- Team definitions and mappings.
- Extension installs.
- Extension versions.
- Extension capability grants.
- Global defaults.
- Global ceilings for repository-local config.

The server validates `config.cue` on startup.

Config changes can be applied through a manual reload command. Reload must validate the new config and apply it atomically. Invalid config must not partially apply.

Remote instance config repositories are explicitly deferred.

### 12.2 Repository Configuration

Repository-local configuration uses CUE files with `package forgepoint`.

Rules:

- Forgepoint evaluates only CUE files in `package forgepoint`.
- These files may live anywhere in the repository.
- Evaluation uses path inheritance.
- Core computes effective typed config snapshots per relevant path.
- Any invalid Forgepoint CUE on a protected/default ref rejects the ref update.
- Incompatible inherited concrete values are validation errors.
- Repository config can configure behavior only within ceilings set by local instance config.

Evaluation budget (DoS protection):

- Synchronous CUE validation on receive-pack must observe a per-push budget. Default values are normative for v1 and are overridable through `cue.evalBudget` in `config.cue` within `ceilings.repository.cueEvalBudget`:
  - `wallTimeMs: 5000`
  - `memoryBytes: 256_000_000` (256 MiB)
  - `maxFiles: 1024` (total `package forgepoint` files across the affected tree)
  - `maxDepth: 16` (max nesting depth of inherited paths)
  - `maxBytes: 8_000_000` (total CUE source bytes across affected tree)
- Any breach rejects the push with `CONFIG_INVALID` and emits `dev.forgepoint.repository.config.rejected` with `reason: "evaluation_budget"`.
- The budget is per-push (not per-effective-path); concurrent pushes do not share budget.

Repository CUE may configure:

- Project boundaries.
- Labels.
- Ownership hints.
- Visibility.
- Default branches.
- Branch/ref protection.
- Checks requirements.
- Event publishing routes.
- Extension configuration namespaces.
- Extension behavior, within granted capabilities.

CUE schema versioning:

- V1 uses a rolling schema.
- The current server validates against the current schema.
- Repositories must update config when server upgrades require schema changes.

### 12.3 Push Validation

Protected/default ref updates must synchronously validate Forgepoint CUE.

If any Forgepoint CUE in the pushed default/protected ref is invalid, the push is rejected.

Core should also support explicit pre-merge checks so invalid configuration cannot be merged into the default branch through a PR extension.

Bootstrap (first push to an empty repository):

- A brand-new repository has no CUE config. The default ref (commonly `refs/heads/main`) is protected by default.
- A push that introduces zero `package forgepoint` files is accepted (validation succeeds trivially).
- A push that introduces one or more `package forgepoint` files must produce a valid effective config at every relevant path; otherwise the push is rejected.
- After the first valid CUE-bearing push, the repository's `refs.protected` config governs subsequent pushes.

## 13. GraphQL API

GraphQL is the primary API for core, frontend, CLI, and extensions.

Core exposes a GraphQL schema for:

- Instance metadata.
- Current user/session.
- Workspaces.
- Groups.
- Repositories.
- Projects.
- Extension manifests.
- Extension UI manifests.
- Checks/statuses.
- Events.
- Jobs where appropriate.
- Admin operations.

Extensions contribute GraphQL SDL fragments and resolvers.

Composition rules:

- Extension SDL is composed with the core schema.
- Type and field conflicts fail install/startup.
- Extensions may explicitly extend allowed core types.
- Extensions may add queries, mutations, subscriptions, and types.
- Extensions must declare required permissions and capabilities in their manifest.

GraphQL subscriptions:

- Core and extensions may define subscription fields.
- Subscriptions expose typed projections over the durable event source.
- They are intended for frontend and product UI updates.

### 13.5 Cross-Origin And SSE Authentication

The Astro frontend runs on a potentially different origin from the Rust server. v1 must support both same-origin and cross-origin deployments.

CORS:

- `config.cue` declares allowed origins under `instance.allowedOrigins: [...string]` (exact URL prefixes, no wildcards). At least one origin must be configured before the frontend can authenticate.
- The server emits `Access-Control-Allow-Origin` reflecting the request origin only if it matches an entry; otherwise the request is rejected at the boundary.
- `Access-Control-Allow-Credentials: true` is set for `/graphql`, `/graphql/stream`, `/events`, `/auth/*`, and `/_extensions/*`.
- Preflight (`OPTIONS`) is handled for the same routes with `Access-Control-Allow-Methods` reflecting the route's allowed methods.

Cookie posture:

- Browser sessions use first-party cookies with `Secure; HttpOnly; SameSite=Lax` (production) or `SameSite=Strict` if the frontend is served same-origin.
- Cookies must not be used by GraphQL clients from non-browser environments. Non-browser clients must pass `Authorization: Bearer <token>` instead.

SSE authentication:

- Browsers cannot set `Authorization` on `EventSource`. To authenticate browser SSE clients, the server issues a short-lived (≤ 5 minutes), single-use SSE session token via a `POST /events/session` call that the browser makes before opening `EventSource`.
- The browser appends the token as `?session=<opaque>` to the SSE URL. The server consumes the token on first connection, binds it to the connection's authorization context, and rejects reuse.
- Non-browser SSE clients (CLI, publisher daemons) may use the long-lived `Authorization: Bearer <token>` header directly and skip the session-token dance.

Rate limits:

- `RATE_LIMITED` (see §31.2) is raised when ceilings are exceeded.
- v1 default ceilings (overridable in `config.cue` under `instance.rateLimits`):
  - `/auth/oidc/.../callback`: 10/min/IP.
  - `/auth/token-exchange`: 30/min/principal.
  - `/graphql` queries/mutations: 600/min/principal; 60/min/IP for unauthenticated.
  - `/graphql/stream`, `/events`: 10 new connections/min/principal; max 25 concurrent connections/principal.
  - `/git/*/info/refs`: 120/min/principal.
  - `/git/*/git-receive-pack`: 30/min/principal.
- Rate limits are evaluated after authentication but before authorization. Anonymous traffic is bucketed by IP; authenticated traffic is bucketed by principal (user, workload, or extension actor).

## 14. Event System

Core maintains a durable event outbox.

The event envelope is CloudEvents 1.0 JSON, with the structural concession that the `actor` and `resources` extension attributes are object- and array-valued respectively (see §32.1). The envelope is interoperable with CloudEvents consumers that tolerate non-primitive extension attributes; strict consumers must read the equivalent primitives (`actor` as URI, `resources` as JSON array inside `data`) emitted alongside in the publisher projection.

Events include:

- Stable event ID.
- Event type.
- Source.
- Subject.
- Timestamp.
- Actor.
- Resource references.
- Visibility.
- Correlation ID.
- Causation ID.
- Extension payload namespace when applicable.
- Payload data.

Retention:

- Events are retained indefinitely by default.
- They are audit records unless an explicit admin retention policy is introduced later.

Event visibility:

- Every event has visibility and resource references.
- Event APIs filter per caller using authorization checks.
- Private activity must not leak through public streams, GraphQL queries, subscriptions, publisher extensions, or RSS-like outputs.

Live event APIs:

- SSE exposes raw resumable CloudEvents.
- GraphQL subscriptions expose typed projections.

SSE:

- Plain HTTP.
- Cursor/resume support.
- Compatible with `Last-Event-ID` where practical.
- Suitable for CLIs, external consumers, and publisher daemons.

Publisher extensions:

- ATProto PDS.
- ActivityPub.
- RSS.
- Webhooks.
- Other external projections.

Publishing is opt-in. Installing a publisher extension does not publish anything by default. CUE or admin configuration maps selected event types/resources to publisher targets.

Federation actor model:

- Resource actors are the default.
- Instance, workspace, repository, or project actors publish activity.
- User attribution is included when visibility allows.

ATProto record shapes are deferred to the first-party ATProto publisher extension. Core must not require a specific custom Lexicon or `app.bsky.feed.post` strategy in v1.

## 15. Checks And Statuses

Checks/statuses are a core primitive because branch protection and merge policy need a generic, stable status model.

Core stores:

- Check suite/status identity.
- Commit/ref association.
- Producer identity.
- State.
- Conclusion.
- Timestamps.
- Summary/details URL.
- Visibility.
- Required/optional relationship through config.

Core does not ship product-specific checks UI or CI provider integrations by default. Those are extensions.

Branch protection can reference checks/statuses from core config and repository CUE.

## 16. Background Jobs

Core provides a DB-backed durable job queue and scheduler.

It is used for:

- Repository indexing.
- CUE snapshot evaluation after accepted refs.
- Event delivery retries.
- Publisher extension work.
- Extension background tasks.
- Maintenance tasks.

Jobs must be durable across server restarts.

The v1 scheduler is single-node. It should be designed so a future multi-worker implementation can claim jobs safely.

## 17. WASM Extension System

Extensions are WASM Component Model packages using WIT-defined interfaces.

Runtime:

- Wasmtime.
- WASI where explicitly granted.
- No ambient network.
- Host-mediated capabilities.
- Per-extension quotas.

An extension package may include:

- WASM backend component.
- GraphQL SDL fragments.
- GraphQL resolver bindings.
- CUE schema fragments.
- Event handlers.
- Git hooks.
- Background job handlers.
- UI manifest.
- Prebuilt ESM frontend assets.
- CSS assets.
- Static assets.
- Capability manifest.
- Permission manifest.

Extension distribution:

- OCI artifacts for production.
- Local filesystem paths for development.
- OCI digest pinning.
- Extension signatures are optional in v1.
- Local dev mode can bypass production validation explicitly.

Extension install source:

- Local `config.cue` declares installed extensions, versions, capabilities, and grants.

Extension activation:

- Validate manifest.
- Validate requested capabilities against local config grants.
- Validate GraphQL composition.
- Validate CUE schema composition.
- Validate storage migrations.
- Initialize WASM component.
- Register UI assets and routes.
- Register jobs, hooks, event handlers, and permissions.

Activation failure must disable that extension without corrupting core state.

Permission namespacing:

- Permissions declared by an extension are automatically namespaced as `<extension-name>.<permission-name>` when registered with the authorization adapter. Two extensions declaring the same short name do not collide.
- The `manifest.permissions[].name` may be referenced as either the short or the namespaced form in repository CUE; core resolves both deterministically.

Schema reload semantics:

- A successful `reloadInstanceConfig` may add or remove extensions, which changes the composed GraphQL schema. The reload is atomic from the perspective of new connections: every new request after the reload sees the new schema.
- In-flight GraphQL operations against the old schema are allowed to drain for `reloadDrainSeconds` (default 30); subscriptions whose underlying fields no longer exist are closed with extension `code: "SCHEMA_CHANGED"`.
- A failed reload (invalid config, schema composition conflict, capability-grant mismatch) does not partially apply and does not affect running operations.

Migration rollback:

- Extension storage migrations must declare a reverse step (`down` migration) for every forward step (`up`). An activation that fails after running migrations must attempt the matching reverse steps in reverse order.
- If a reverse step also fails, the extension enters `failed` with the storage in a partially-migrated state. Core records the partial state in the extension installation record; the operator must intervene with the CLI (see §23) before activation can be retried.

## 18. Extension Capabilities

Extensions receive only explicitly granted host capabilities.

Capability categories:

- GraphQL schema/resolver registration.
- Host storage.
- Blob storage.
- Secret access.
- Event read/write.
- Job scheduling.
- Git read.
- Controlled Git write.
- HTTP client.
- UI asset registration.
- CUE schema contribution.
- Check/status write.

Network:

- Extensions have no ambient network.
- Outbound HTTP goes through a host HTTP capability.
- Host HTTP access is governed by allowlists in config.
- Requests are audited where appropriate.

HTTP allowlist grammar:

- Allowlist entries are URI prefix patterns of the form `<scheme>://<host>[:<port>][/<path-prefix>]`.
- `scheme` is `https` (required in production) or `http` (development only). Other schemes are rejected at config-load time.
- `host` is a DNS name. A leading `*.` denotes a single level of subdomain wildcard (`*.example.com` matches `api.example.com` and `foo.example.com`, not `example.com` and not `a.b.example.com`).
- `port` is optional. If omitted, the default port for the scheme is matched.
- `path-prefix` is an exact byte-prefix; `*` is not allowed in the path. An entry without a path is equivalent to a path of `/`.
- A request URL matches an entry when scheme, host (literal or one-level subdomain), port, and path-prefix all match. Query strings are not considered.
- IP literals are allowed only with explicit configuration (`instance.allowExtensionHttpToIPs: true`) to discourage SSRF; loopback and link-local addresses are always denied.

Resource limits:

- Memory.
- CPU fuel or execution timeout.
- Storage quota.
- Blob quota.
- Outbound HTTP quota/rate.
- Background job concurrency.

Limits are configurable per extension.

## 19. Extension Storage

Extensions persist data through a host-managed storage API.

The storage model is:

- Namespaced document collections.
- Declared indexes.
- Blob attachments.
- Cursor pagination.
- Indexed filters.
- Sort order.
- Resource and visibility constraints.

Transactions:

- Extensions can open scoped host transactions.
- A transaction can update extension storage and atomically emit events/jobs.
- Transactions cannot bypass core authorization or visibility rules.

Extensions must not directly own arbitrary database connections in v1.

Portability:

- Every extension must expose host-standard export/import for document, index, and blob data.
- First-party extensions must support complete backup and restore of their state.

## 20. Secrets

Core provides a host-managed secret store for extensions.

Secret scopes:

- Instance.
- Workspace.
- Repository.
- Project.
- User where needed.
- Extension namespace.

Secrets may be used for:

- Publisher credentials.
- External API credentials.
- Webhook signing keys.
- Extension-specific integrations.

Secret access is capability-gated and audited.

The storage encryption mechanism is implementation-specific but must support future integration with external secret managers.

## 21. Frontend

The frontend is a separate Astro/TypeScript/Bun app.

It discovers backend capabilities through:

- GraphQL introspection.
- Core capability manifest.
- Extension UI manifests.

Extension UI delivery:

- Extensions ship prebuilt ESM JS/CSS assets.
- The Rust server serves installed extension assets through an asset API.
- The frontend dynamically imports extension assets at runtime.
- Extension UI uses web components.
- No frontend rebuild is required when installing an extension.

The frontend must use the Forgepoint component kit for consistent UI.

The component kit should include:

- Layout primitives.
- Navigation.
- Forms.
- Tables.
- Dialogs.
- Menus.
- Tabs.
- Badges.
- Avatars.
- Toasts.
- Empty states.
- Editors/viewers where needed.

Default UI with no feature extensions:

- Login.
- Instance setup/status.
- Workspace/group/repository/project registry.
- Extension manager/status.
- Git clone/push instructions.
- Event feed.
- Admin/config diagnostics.

No code browser is required in the default UI.

## 22. First-Party Extension Roadmap

The first-party extension set should validate the platform rather than expand core.

Forge validation pack:

- Code browser extension.
- Pull requests and reviews extension.
- Checks/status UI/provider extension.
- Docs/wiki extension.
- ATProto publisher extension.
- ActivityPub publisher extension.
- RSS publisher extension.

Pull requests:

- First-party extension.
- Uses core Git read APIs.
- Uses controlled Git write APIs for merges/ref updates.
- Uses core branch rules.
- Uses core checks/statuses.
- Stores PR/review/workflow state in extension storage.
- Emits CloudEvents through core transactions.
- Uses the WIT `resolve-batch` primitive (see §35.3) for list-typed GraphQL fields to avoid the per-row WASM trap cost; PR-list views, review threads, and timeline aggregations must batch.

Docs/wiki:

- Git-first.
- Markdown/MDX/CUE-backed docs live in repositories.
- Extension provides rendering, navigation, permissions, indexing, search, and publishing.

Feature data residency:

- Git-first when natural.
- Docs, wiki, PRDs, and other authored files should prefer repository files.
- Workflow state such as boards, reviews, check provider state, and notification state should use extension storage.

## 23. CLI

The Forgepoint CLI supports:

- OIDC Git credential helper flow.
- CUE validation for local and repository config.
- Local instance config reload.
- Operational recovery commands.
- Extension diagnostics.
- Extension manifest inspection.
- Server health/debug helpers.

The CLI does not need to manage every core resource in v1. GraphQL and the frontend cover normal administration.

## 24. Observability And Audit

Core ships:

- Structured logs.
- OpenTelemetry traces.
- OpenTelemetry metrics.
- Health endpoints.
- Readiness endpoints.
- Immutable audit events.

Audit-relevant actions include:

- Login (success and failure).
- Credential issuance.
- Git pushes: every accepted and rejected push (one audit record per push).
- Git fetches: only rejections are audited (successful fetches are observable through metrics and access logs, not audit).
- Config reload (success and failure).
- Extension install/activation/failure.
- Secret access.
- Permission changes.
- Publisher delivery attempts.
- Repository creation/deletion.
- Protected ref updates.
- JIT user creation and user deactivation.
- Backup/restore operations (see §27a).

## 25. MVP Acceptance Criteria

The kernel MVP is successful when the following end-to-end flow works:

1. Configure an instance with local `config.cue`.
2. Start the Rust server against SQLite.
3. Log in with OIDC.
4. Create or expose a workspace, group, and repository.
5. Authenticate Git over HTTPS through the Forgepoint credential helper.
6. Push to the repository using a standard Git client.
7. Reject invalid `package forgepoint` CUE on a protected/default ref.
8. Accept valid CUE and store effective path config snapshots.
9. Emit durable CloudEvents for repository activity.
10. Stream visible events over SSE.
11. Expose typed live updates over GraphQL subscriptions.
12. Install a local development extension.
13. Compose its GraphQL schema.
14. Activate its WASM component.
15. Serve its ESM UI assets through the Rust asset API.
16. Render its UI in the separate frontend.
17. Enforce authorization through the adapter.
18. Record audit events for sensitive operations.

## 26. Test Plan

Core tests:

- GraphQL query/mutation behavior.
- GraphQL SDL composition and conflict failures.
- GraphQL subscription delivery.
- SSE cursor/resume behavior.
- Event visibility filtering.
- OIDC JIT provisioning rules.
- OIDC credential exchange.
- Authorization adapter behavior.
- SQLx repository behavior on SQLite and Postgres.
- Migration startup gates.
- Job queue durability.
- Secret store access controls.

Git tests:

- Clone with standard Git client.
- Fetch with standard Git client.
- Push with standard Git client.
- Push rejection on failed authz.
- Push rejection on invalid CUE.
- Protected/default ref validation.
- Transactional ref update conflicts.
- Local backend behavior.
- S3-compatible backend behavior.
- Cloudflare Artifacts backend behavior where available.

CUE tests:

- Local `config.cue` startup validation.
- Manual reload success.
- Manual reload failure without partial apply.
- Repository `package forgepoint` discovery.
- Path inheritance.
- Incompatible inherited value failure.
- Effective path snapshot generation.
- Instance ceiling enforcement.
- Rolling schema upgrade failure.

Extension tests:

- Component Model loading.
- WIT interface compatibility.
- Manifest validation.
- Capability grant enforcement.
- GraphQL schema contribution.
- CUE schema contribution.
- Host storage document/index/blob operations.
- Scoped storage/event/job transactions.
- HTTP allowlist enforcement.
- Resource quota failures.
- UI manifest discovery.
- ESM asset serving.
- Extension activation failure isolation.
- Export/import conformance.

End-to-end tests:

- Fresh instance setup.
- OIDC login.
- Git credential helper flow.
- Push valid repository config.
- Install reference extension.
- Render extension UI.
- Emit and consume events.
- Enforce private/internal/public visibility.

## 26a. Backup And Restore

A self-hosted instance must be backupable and restorable without bespoke procedures.

Core ships a backup operation that produces a consistent point-in-time snapshot spanning:

- Core metadata database (SQLite file or `pg_dump` for Postgres).
- Repository storage for each configured backend (file tree for local; manifest + referenced objects for S3 / Cloudflare Artifacts).
- Extension storage (documents, indexes, blobs) for every installed extension.
- Secret store ciphertext and key material identifiers (not the underlying KMS material).
- Effective config snapshots and the active `config.cue` content.

Consistency requirements:

- The backup must observe a single "as-of" point with respect to the metadata DB.
- Repository storage and extension storage backups may be taken concurrently provided the metadata DB row indicating their as-of cursors is captured atomically with the metadata snapshot.
- During backup, receive-pack and `reloadInstanceConfig` are paused (queued); foreground reads continue.

Restore:

- `forgepointctl restore <bundle>` validates schema compatibility, applies all components, and verifies cross-component referential integrity (every `Repository.id` referenced by metadata exists in the repo-storage component, etc.).
- A failed restore must not partially clobber an existing instance: restore targets an empty data directory or a freshly provisioned database.
- Restore emits `dev.forgepoint.instance.restore.completed` (or `.failed`).

Encryption: bundles are signed and (optionally) encrypted with operator-managed keys. Key material is not embedded in the bundle.

The exact bundle format is implementation-defined but must be documented and stable within a v1.x release line.

## 27. Explicitly Deferred

Deferred from v1:

- SSH Git hosting.
- Remote instance config repositories.
- Repository import from remote Git hosts.
- Multi-node deployments (server replicas, multi-worker job claim on Postgres, S3 ref CAS with external coordination, rolling schema migrations).
- Multi-node scheduler semantics.
- Git LFS (the optional core module is removed from v1; the `gitLFS` capability field is retained on the schema and always returns `false`).
- SHA-256 Git object format.
- Built-in pull requests.
- Built-in code browser.
- Built-in issues.
- Built-in docs/wiki.
- Built-in Kanban/epics/PRDs.
- Required extension signatures.
- ATProto Lexicon design.
- SaaS multi-tenant hosting.

## 28. Normative Contract Rules

The contract sections below are normative for v1 unless explicitly marked as a sketch or example.

Language:

- `must` means required for v1 compatibility.
- `should` means expected unless there is a documented implementation reason.
- `may` means allowed but not required.
- `core` means the Rust server and its persistent kernel state.
- `extension` means an installed WASM package and its declared UI/assets/config.

Compatibility:

- Public GraphQL fields, CUE schemas, event envelopes, WIT interfaces, extension manifests, and storage contracts must be versioned before incompatible changes.
- Internal Rust module names are not public API.
- Storage adapter implementation details are not public API, but adapter behavior is.
- Feature extensions must not require core schema changes once the v1 extension ABI is stable.

Default security posture:

- Unknown users are denied.
- Unknown extensions are disabled.
- Unknown CUE fields are validation errors unless explicitly modeled as extension namespaces.
- Unknown event visibility is private.
- Unknown storage backend capabilities fail closed.
- Unknown GraphQL extension conflicts fail activation.

## 29. Core Domain Contracts

### 29.1 Identifiers

All durable core resources must have stable opaque IDs and human-readable slugs.

Opaque IDs:

- Use lowercase prefixed identifiers.
- The body after the prefix is a Crockford-base32 ULID (RFC: github.com/ulid/spec): 26 characters, monotonic within a millisecond, lexicographically sortable.
- Total ID length is `len(prefix) + 26` (e.g. `repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3`, 31 characters).
- Must be globally unique inside one instance.
- Must not encode database primary key sequence numbers.
- Must remain stable across slug/path changes.
- ID generation is server-side. Clients must not propose IDs.

Required prefixes:

- `usr_` for users.
- `team_` for teams.
- `ws_` for workspaces.
- `grp_` for groups.
- `repo_` for repositories.
- `proj_` for projects.
- `ext_` for extension installations.
- `chk_` for checks.
- `job_` for jobs.
- `evt_` for events.
- `sec_` for secret metadata records.

Slugs:

- Lowercase ASCII by default.
- Allowed characters: `a-z`, `0-9`, `-`, `_`, and `.`.
- Must not start with `.`.
- Must not contain `/`.
- Must be 1–64 characters.
- Reserved exact-match names: `_forgepoint`, `_system`, `_assets`, `_extensions`, `.git`.
- Reserved prefixes for core use: any slug beginning with `_` is reserved for core and is not assignable by users; extensions must not register UI route segments under leading-underscore slugs.

### 29.2 Resource References

Every object exposed to authorization, events, checks, jobs, or extensions must be representable as a resource reference.

Canonical string form:

```text
forgepoint://<kind>/<opaque-id>
```

Examples:

```text
forgepoint://workspace/ws_01hv...
forgepoint://repository/repo_01hv...
forgepoint://project/proj_01hv...
```

Human path form:

```text
/<workspace>/<group-path>/<repository>
/<workspace>/<group-path>/<repository>/<project-path>
```

Opaque references are authoritative. Human paths are routing and display identifiers.

### 29.3 Visibility

Core visibility values:

- `PUBLIC`: visible without authentication where public access is enabled.
- `INTERNAL`: visible to authenticated users accepted by the instance.
- `PRIVATE`: visible only to explicitly authorized users, teams, or service workloads.

Visibility applies to:

- Workspaces.
- Groups.
- Repositories.
- Projects.
- Events.
- Checks/statuses.
- Extension-owned records that opt into core visibility filtering.

Visibility inheritance:

- Child resources may be more restrictive than parents.
- Child resources must not be less restrictive than a parent unless the parent explicitly allows public descendants.
- The `allowPublicDescendants` knob is available at every level that can have children: workspace, group, and repository (see `#WorkspaceCeilings`, `#GroupCeilings`, `#RepositoryCeilings` in §30.1). A child request with broader visibility than its parent is rejected with `CONFIG_INVALID` when the relevant ancestor's `allowPublicDescendants` is `false`.
- Effective visibility is evaluated at read time and cached only with invalidation tied to authorization/config changes.
- For long-lived SSE and GraphQL subscription connections, visibility is re-checked per event delivery; an event the caller is no longer authorized to see is silently dropped from the stream. Permission changes (membership, visibility config) must invalidate stream caches within 5 seconds.

### 29.4 Timestamps And Concurrency

Durable records must include:

- `created_at`.
- `updated_at`.
- `deleted_at` when soft deletion is used.
- `version` or equivalent compare-and-swap token where concurrent updates matter.

Time values:

- UTC.
- RFC 3339 in public APIs.
- Database-native timestamp internally.

Mutation APIs must be idempotent where practical. APIs that are not idempotent must expose request IDs or explicit conflict responses.

## 30. CUE Contracts

### 30.1 Local Instance Config

The local instance config file is `config.cue`.

It must use:

```cue
package forgepoint
```

The top-level shape is:

```cue
package forgepoint

instance: {
	id:               string
	name:             string
	publicURL:        string
	environment:      *"development" | "production"
	allowedOrigins?: [...string]   // exact URL prefixes, no wildcards
	rateLimits?:      #RateLimits
	allowExtensionHttpToIPs?: *false | bool
}

database: {
	kind: "sqlite" | "postgres"
	url:  string
}

oidc: {
	issuers: [...{
		id:           string
		issuerURL:    string
		clientID:     string
		clientKind:   "public" | "confidential"
		// Required and must be non-empty when clientKind == "confidential".
		// Must be unset or empty when clientKind == "public".
		clientSecret?: string
		redirectURL:  string
		// Optional mTLS for workload exchange. Ignored for browser login.
		workloadMTLS?: {
			caPEM:  string
			required: *false | bool
		}
		allowed: {
			domains?: [...string]
			groups?:  [...string]
			subjects?: [...string]
		}
		claimMapping?: {
			subject: *"sub" | string
			email:   *"email" | string
			name:    *"name" | string
			groups:  *"groups" | string
		}
	}]
}

admins: {
	subjects?: [...string]
	groups?:   [...string]
}

storage: {
	repositories: {
		default: string
		backends: [string]: #RepoStorageBackend
	}
	blobs?: {
		default: string
		backends: [string]: #BlobStorageBackend
	}
}

authz: {
	kind: *"spicedb" | string
	spicedb?: {
		endpoint: string
		token:    string
		insecureTLS?: *false | bool
	}
}

workspaces: [string]: {
	name:       string
	visibility: *"PRIVATE" | "INTERNAL" | "PUBLIC"
	description?: string
	allowPublicDescendants?: *false | bool
	teams?: [string]: {
		name: string
		members?: [...#PrincipalSelector]
	}
}

extensions: [string]: {
	source: {
		kind: "oci" | "local"
		image?: string
		digest?: string
		path?: string
	}
	enabled: *true | bool
	signaturePolicy: *"optional" | "required" | "disabled"
	// Requested capabilities. The grant shape matches the manifest's request shape;
	// every requested:true must be granted:true here for activation to succeed.
	capabilities: #ExtensionCapabilities
	quotas?: #ExtensionQuotas
	// Extension-specific config. Validated against the extension's CUE schema
	// at install time. Unknown fields fail config validation.
	config?: _
}

ceilings: {
	repository?: #RepositoryCeilings
	workspace?:  #WorkspaceCeilings
	group?:      #GroupCeilings
	publishers?: #PublisherCeilings
	// Per-extension ceilings; each value is validated against the extension's
	// CUE schema fragment marked as "ceiling-shape".
	extensions?: [string]: _
}
```

Storage backend variants:

```cue
#RepoStorageBackend: {
	kind: "local"
	path: string
} | {
	kind: "s3"
	bucket: string
	prefix?: string
	region?: string
	endpoint?: string
	credentials: {
		accessKeyID:     string
		secretAccessKey: string
	}
} | {
	kind: "cloudflare-artifacts"
	accountID: string
	namespace: string
	token: string
}

#BlobStorageBackend: {
	kind: "local"
	path: string
} | {
	kind: "s3"
	bucket: string
	prefix?: string
	region?: string
	endpoint?: string
	credentials: {
		accessKeyID:     string
		secretAccessKey: string
	}
}
```

Principal selector variants:

```cue
#PrincipalSelector: {
	kind: "user-subject"
	issuer: string
	subject: string
} | {
	kind: "oidc-group"
	issuer: string
	group: string
} | {
	kind: "email-domain"
	domain: string
}

#ExtensionCapabilities: {
	graphql?: *false | bool
	cue?: *false | bool
	ui?: *false | bool
	events?: {
		read?: *false | bool
		write?: *false | bool
		subscribe?: *false | bool
	}
	git?: {
		read?: *false | bool
		controlledWrite?: *false | bool
		hooks?: *false | bool
	}
	storage?: {
		documents?: *false | bool
		indexes?: *false | bool
		blobs?: *false | bool
	}
	jobs?: {
		schedule?: *false | bool
		run?: *false | bool
	}
	http?: {
		enabled?: *false | bool
		allow?: [...string]
	}
	secrets?: {
		read?: [...string]
		write?: [...string]
	}
	checks?: {
		read?: *false | bool
		write?: *false | bool
	}
}

#ExtensionQuotas: {
	memoryBytes?: int
	cpuFuel?: int
	wallTimeMs?: int
	storageBytes?: int
	blobBytes?: int
	httpRequestsPerMinute?: int
	concurrentJobs?: int
}

#RepositoryCeilings: {
	allowedVisibility?: [..."PRIVATE" | "INTERNAL" | "PUBLIC"]
	allowPublicDescendants?: *false | bool
	protectedRefsMustValidateConfig?: *true | bool
	allowedPublishers?: [...string]
	allowedStorageBackends?: [...string]
	cueEvalBudget?: #CueEvalBudget
}

#WorkspaceCeilings: {
	allowedVisibility?: [..."PRIVATE" | "INTERNAL" | "PUBLIC"]
	allowPublicDescendants?: *false | bool
	allowedStorageBackends?: [...string]
}

#GroupCeilings: {
	allowedVisibility?: [..."PRIVATE" | "INTERNAL" | "PUBLIC"]
	allowPublicDescendants?: *false | bool
}

#PublisherCeilings: {
	allowedExtensions?: [...string]
	allowedEventTypes?: [...string]
	allowPrivateEvents?: *false | bool
	requireExplicitRoutes?: *true | bool
}

#CueEvalBudget: {
	wallTimeMs?:   *5000     | int
	memoryBytes?:  *256000000 | int
	maxFiles?:     *1024     | int
	maxDepth?:     *16       | int
	maxBytes?:     *8000000  | int
}

#RateLimits: {
	// Requests per minute per principal (or per IP for unauthenticated callers).
	auth?: {
		oidcCallbackPerIP?:           *10  | int
		tokenExchangePerPrincipal?:   *30  | int
	}
	graphql?: {
		perPrincipal?:        *600 | int
		perIPUnauthenticated?: *60 | int
	}
	streams?: {
		newConnectionsPerMinute?: *10 | int
		maxConcurrent?:           *25 | int
	}
	git?: {
		infoRefsPerPrincipal?:    *120 | int
		receivePackPerPrincipal?: *30  | int
	}
}
```

### 30.2 Repository Config

Repository config files:

- Must use `package forgepoint`.
- May live anywhere in the repository tree.
- Are discovered from the Git tree being validated.
- Are evaluated through embedded `cuengine`.

Repository config shape:

```cue
package forgepoint

repo?: {
	name?: string
	description?: string
	defaultBranch?: string
	visibility?: "PRIVATE" | "INTERNAL" | "PUBLIC"
	labels?: [string]: {
		color?: string
		description?: string
	}
}

projects?: [string]: {
	path: string
	name?: string
	description?: string
	visibility?: "PRIVATE" | "INTERNAL" | "PUBLIC"
	owners?: [...string]
	tags?: [...string]
}

refs?: {
	protected?: [string]: #ProtectedRefRule
}

checks?: [string]: {
	required?: bool
	description?: string
	contextPattern?: string
}

events?: {
	routes?: [...#EventRoute]
}

// Per-extension config namespaces. The map key is the extension's manifest `name`
// (not its installation `ext_...` ID). The value is validated against the
// activated extension's CUE schema fragment at push time. A push that references
// an uninstalled extension is rejected with CONFIG_INVALID.
extensions?: [string]: _
```

Protected ref rule:

```cue
#ProtectedRefRule: {
	pattern: string
	push: {
		allow?: [...string]
		deny?: [...string]
	}
	require?: {
		validForgepointConfig?: *true | bool
		checks?: [...string]
		linearHistory?: *false | bool
		signedCommits?: *false | bool
	}
}
```

Event route:

```cue
#EventRoute: {
	name: string
	match: {
		types?: [...string]
		resources?: [...string]
		visibility?: [..."PUBLIC" | "INTERNAL" | "PRIVATE"]
	}
	target: {
		// Manifest `name` of the target extension, so that reinstalls (which produce
		// new `ext_...` IDs) do not break routes committed to Git. Two simultaneous
		// installations sharing the same name are rejected at install time.
		extension: string
		config?: _
	}
	enabled: *true | bool
}
```

### 30.3 Path Inheritance

Path inheritance is based on file location.

For an effective path `/a/b/c`:

1. Collect all `package forgepoint` CUE files at repository root.
2. Collect all `package forgepoint` CUE files under `/a`.
3. Collect all `package forgepoint` CUE files under `/a/b`.
4. Collect all `package forgepoint` CUE files under `/a/b/c`.
5. Unify them in ancestor-to-descendant order.
6. Export the typed effective config for `/a/b/c`.

CUE unification semantics are authoritative. Child config does not override parent config by assignment convention. It must unify. Incompatible concrete values make the effective config invalid.

### 30.4 Config Snapshot Records

For each validated default/protected ref, core stores config snapshots:

```text
repository_id
commit_oid
path
config_hash
effective_config_json
created_at
validation_status
validation_errors
```

Note: v1 uses a rolling CUE schema (see §12.2), so there is no `schema_version` field on snapshots. When schema versioning is introduced (post-v1), it becomes a separate normative change.

Snapshot activation:

- A push updates a protected/default ref only after CUE validation succeeds.
- Snapshot generation must be transactional with ref acceptance where the storage backend supports it.
- If post-accept indexing later fails, the event log records the failure, but the already accepted ref remains valid because synchronous validation passed.

## 31. GraphQL Contract

### 31.1 API Shape

GraphQL endpoint:

```text
POST /graphql
GET /graphql
```

Subscriptions:

```text
GET /graphql/stream
```

The exact transport for subscriptions may be WebSocket or SSE-backed GraphQL transport, but the schema contract must expose GraphQL subscription fields.

All GraphQL IDs are opaque core IDs unless a field name explicitly says `path`.

### 31.2 Error Conventions

GraphQL errors must include `extensions.code`.

Required codes:

- `BAD_USER_INPUT`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `CONFIG_INVALID`
- `EXTENSION_DISABLED`
- `EXTENSION_ACTIVATION_FAILED`
- `STORAGE_UNAVAILABLE`
- `RATE_LIMITED`
- `INTERNAL_SERVER_ERROR`

Errors that relate to a resource should include:

```json
{
  "extensions": {
    "code": "FORBIDDEN",
    "resource": "forgepoint://repository/repo_...",
    "permission": "repo.read"
  }
}
```

### 31.3 Core SDL Baseline

The core schema must include the following concepts. Field names may be refined during implementation, but removing these concepts requires a spec update.

```graphql
scalar DateTime
scalar JSON
"Canonical resource reference: forgepoint://<kind>/<opaque-id>"
scalar ResourceURN

enum Visibility {
  PUBLIC
  INTERNAL
  PRIVATE
}

enum CheckState {
  QUEUED
  IN_PROGRESS
  COMPLETED
}

enum CheckConclusion {
  SUCCESS
  FAILURE
  CANCELLED
  SKIPPED
  NEUTRAL
  TIMED_OUT
  ACTION_REQUIRED
}

"Closed set of v1 core token actions. Extensions register additional actions through their permission manifests; those are not part of this enum but flow through the same token-exchange shape."
enum TokenAction {
  GIT_READ
  GIT_WRITE
  GRAPHQL_READ
  GRAPHQL_WRITE
  EVENTS_READ
  CHECKS_READ
  CHECKS_WRITE
}

type Query {
  viewer: Viewer!
  instance: Instance!
  workspace(id: ID, slug: String): Workspace
  repository(id: ID, path: String): Repository
  project(id: ID, path: String): Project
  event(id: ID!): Event
  events(first: Int = 50, after: String, filter: EventFilter): EventConnection!
  extension(id: ID, name: String): ExtensionInstallation
  extensions: [ExtensionInstallation!]!
}

type Mutation {
  reloadInstanceConfig(input: ReloadInstanceConfigInput!): ReloadInstanceConfigPayload!
  createRepository(input: CreateRepositoryInput!): CreateRepositoryPayload!
  updateRepository(input: UpdateRepositoryInput!): UpdateRepositoryPayload!
  createGroup(input: CreateGroupInput!): CreateGroupPayload!
  createCheckRun(input: CreateCheckRunInput!): CreateCheckRunPayload!
  updateCheckRun(input: UpdateCheckRunInput!): UpdateCheckRunPayload!
  issueGitCredential(input: IssueGitCredentialInput!): IssueGitCredentialPayload!
}

type Subscription {
  "Filter is a delivery hint — authorization is authoritative. Events the viewer is not authorized to see are silently dropped, not errored."
  events(filter: EventFilter): Event!
  checkUpdated(repositoryID: ID, commit: String): CheckRun!
  "Subscribing to an extension's events requires read access to that extension's resources."
  extensionEvent(extensionID: ID!): Event!
}

type Viewer {
  user: User
  authenticated: Boolean!
  "Resource is a canonical `forgepoint://<kind>/<opaque-id>` URN. Returns the empty list when the viewer has no permissions on the resource or when the resource is unknown — never errors, to avoid existence disclosure."
  permissions(resource: ResourceURN!): [String!]!
}

type Instance {
  id: ID!
  name: String!
  publicURL: String!
  workspaces: [Workspace!]!
  capabilities: InstanceCapabilities!
}

type Workspace {
  id: ID!
  slug: String!
  name: String!
  visibility: Visibility!
  groups: [Group!]!
  repositories: [Repository!]!
  teams: [Team!]!
}

type Group {
  id: ID!
  slug: String!
  path: String!
  name: String!
  visibility: Visibility!
  groups: [Group!]!
  repositories: [Repository!]!
}

type Repository {
  id: ID!
  slug: String!
  "Canonical human path: /<workspace>/<group-path>/<repo>."
  path: String!
  name: String!
  visibility: Visibility!
  defaultBranch: String
  storageBackend: String!
  projects: [Project!]!
  refs(first: Int = 50, after: String, prefix: String): RefConnection!
  checks(commit: String, first: Int = 50, after: String): CheckRunConnection!
  effectiveConfig(path: String = "/"): EffectiveConfig
  "Read a single object at a given commit and path. Used by core diagnostics (e.g. surfacing the file that caused a CUE rejection)."
  objectAt(commit: String!, path: String!): RepositoryObject
  "Read a tree listing at a given commit and path."
  tree(commit: String!, path: String = "/"): RepositoryTree
  "Compute a diff between two commits."
  diff(base: String!, head: String!, pathFilter: [String!]): RepositoryDiff
}

type RepositoryObject {
  oid: String!
  mode: String!
  size: Int!
  kind: String!  # blob, tree, commit, tag
  textContent: String
  "Base64-encoded bytes when textContent is null (binary)."
  binaryContent: String
}

type RepositoryTree {
  entries: [RepositoryTreeEntry!]!
}

type RepositoryTreeEntry {
  name: String!
  oid: String!
  mode: String!
  kind: String!
}

type RepositoryDiff {
  base: String!
  head: String!
  files: [RepositoryDiffFile!]!
}

type RepositoryDiffFile {
  path: String!
  status: String!  # added, deleted, modified, renamed
  oldPath: String
  patch: String
}

type Project {
  id: ID!
  slug: String!
  "Canonical human path: /<workspace>/<group-path>/<repo>/<project-slug>."
  path: String!
  repository: Repository!
  "Root directory inside the repository working tree that this project owns."
  rootPath: String!
  visibility: Visibility!
  effectiveConfig: EffectiveConfig
}

type EffectiveConfig {
  repositoryID: ID!
  commit: String!
  path: String!
  hash: String!
  json: JSON!
  createdAt: DateTime!
}

type Event {
  id: ID!
  type: String!
  source: String!
  subject: String
  actor: Actor
  visibility: Visibility!
  resourceRefs: [String!]!
  data: JSON!
  time: DateTime!
}

type CheckRun {
  id: ID!
  repository: Repository!
  commit: String!
  name: String!
  state: CheckState!
  conclusion: CheckConclusion
  detailsURL: String
  summary: String
  startedAt: DateTime
  completedAt: DateTime
}

type ExtensionInstallation {
  id: ID!
  name: String!
  version: String!
  enabled: Boolean!
  state: String!
  "Public, non-sensitive manifest fields (declared permissions, capabilities, UI manifest reference). The `config` block and `secrets` are stripped from this projection."
  manifest: JSON!
  "Full manifest including `config` and per-install `quotas`. Requires `instance.admin`. Returns null otherwise."
  manifestAdmin: JSON
  uiManifest: JSON
}

union Actor = User | Team | WorkloadActor | ExtensionActor

type User {
  id: ID!
  subject: String!
  issuer: String!
  email: String
  displayName: String
}

type Team {
  id: ID!
  slug: String!
  name: String!
}

type WorkloadActor {
  issuer: String!
  subject: String!
  displayName: String
}

type ExtensionActor {
  extensionID: ID!
  name: String!
}

type Ref {
  name: String!
  target: String!
}

type RefConnection {
  nodes: [Ref!]!
  pageInfo: PageInfo!
}

type CheckRunConnection {
  nodes: [CheckRun!]!
  pageInfo: PageInfo!
}

type EventConnection {
  nodes: [Event!]!
  pageInfo: PageInfo!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type InstanceCapabilities {
  gitHTTPS: Boolean!
  "Always false in v1 (LFS deferred — see §27). Retained on the schema for forward compatibility."
  gitLFS: Boolean!
  sse: Boolean!
  graphqlSubscriptions: Boolean!
  extensionRuntime: Boolean!
}

input EventFilter {
  resource: String
  types: [String!]
  visibility: [Visibility!]
  afterTime: DateTime
}

input ReloadInstanceConfigInput {
  dryRun: Boolean = false
}

input CreateRepositoryInput {
  groupID: ID!
  slug: String!
  name: String
  visibility: Visibility = PRIVATE
  "Optional. When provided, must match `#RepositoryCeilings.allowedStorageBackends` for the workspace. When omitted, defaults to the workspace/instance default backend. Choosing a backend outside the ceiling returns FORBIDDEN."
  storageBackend: String
}

input UpdateRepositoryInput {
  id: ID!
  name: String
  visibility: Visibility
  defaultBranch: String
}

input CreateGroupInput {
  workspaceID: ID
  parentGroupID: ID
  slug: String!
  name: String
  visibility: Visibility = PRIVATE
}

input CreateCheckRunInput {
  repositoryID: ID!
  commit: String!
  name: String!
  detailsURL: String
  summary: String
}

input UpdateCheckRunInput {
  id: ID!
  state: CheckState!
  conclusion: CheckConclusion
  detailsURL: String
  summary: String
}

input IssueGitCredentialInput {
  repositoryID: ID!
  actions: [TokenAction!]!
}

type ReloadInstanceConfigPayload {
  accepted: Boolean!
  dryRun: Boolean!
  diagnostics: [ConfigDiagnostic!]!
}

type CreateRepositoryPayload {
  repository: Repository!
}

type UpdateRepositoryPayload {
  repository: Repository!
}

type CreateGroupPayload {
  group: Group!
}

type CreateCheckRunPayload {
  checkRun: CheckRun!
}

type UpdateCheckRunPayload {
  checkRun: CheckRun!
}

type IssueGitCredentialPayload {
  accessToken: String!
  tokenType: String!
  expiresAt: DateTime!
  scope: [String!]!
}

type ConfigDiagnostic {
  severity: String!
  path: String
  message: String!
}
```

### 31.4 Extension Composition Rules

Extension SDL:

- May add root query, mutation, and subscription fields.
- May add object, input, enum, scalar, interface, and union types.
- May extend explicitly allowed core types.
- Must not replace core field definitions.
- Must not define fields starting with `_forgepoint`.
- Must namespace custom directives with the extension name.

On conflict:

- Local dev mode may report detailed diagnostics and keep the extension disabled.
- Production activation must fail closed.

### 31.5 Token Exchange Surface

The `issueGitCredential` mutation and the REST endpoint `POST /auth/token-exchange` (§34.2) serve the same operation. v1 designates `POST /auth/token-exchange` as the canonical surface; the GraphQL mutation is a thin wrapper that delegates to the REST handler so audit, rate limiting, and policy decisions live in one path. Both surfaces are subject to the rate limits in §13.5.

## 32. Event Contract

### 32.1 Envelope

The canonical event envelope is CloudEvents-style JSON:

```json
{
  "specversion": "1.0",
  "id": "evt_01hv...",
  "type": "dev.forgepoint.repository.ref.updated",
  "source": "forgepoint://repository/repo_01hv...",
  "subject": "refs/heads/main",
  "time": "2026-05-11T10:00:00Z",
  "datacontenttype": "application/json",
  "dataschema": "https://forgepoint.dev/schemas/events/repository-ref-updated.v1.json",
  "actor": {
    "kind": "user",
    "id": "usr_01hv...",
    "displayName": "Rawkode"
  },
  "visibility": "INTERNAL",
  "resources": [
    "forgepoint://workspace/ws_01hv...",
    "forgepoint://repository/repo_01hv..."
  ],
  "correlationid": "evt_01hv...",
  "causationid": "evt_01hv...",
  "data": {
    "repositoryID": "repo_01hv...",
    "ref": "refs/heads/main",
    "oldOid": "0000000000000000000000000000000000000000",
    "newOid": "0123456789abcdef0123456789abcdef01234567"
  }
}
```

Required extension attributes:

- `actor`
- `visibility`
- `resources`
- `correlationid`
- `causationid`

CloudEvents compliance note:

- `correlationid`, `causationid`, and `visibility` are CloudEvents-compliant string-valued extension attributes.
- `actor` (object) and `resources` (array) are non-primitive and therefore not strict-CloudEvents-compliant. Forgepoint's outbox and SSE stream emit them as shown for ergonomic consumption by Forgepoint-aware clients.
- Publisher extensions targeting strict CloudEvents consumers (e.g. external webhooks, ActivityPub bridges) must project the envelope to a strict form: `actor` becomes a URI string under the extension attribute name `actor`, and `resources` is moved inside `data`. Core provides a helper for this projection through the publisher capability.

### 32.2 Core Event Types

Required core event type names:

Instance:

- `dev.forgepoint.instance.config.reload.started`
- `dev.forgepoint.instance.config.reload.succeeded`
- `dev.forgepoint.instance.config.reload.failed`
- `dev.forgepoint.instance.backup.started`
- `dev.forgepoint.instance.backup.succeeded`
- `dev.forgepoint.instance.backup.failed`
- `dev.forgepoint.instance.restore.started`
- `dev.forgepoint.instance.restore.completed`
- `dev.forgepoint.instance.restore.failed`

Auth and identity:

- `dev.forgepoint.auth.login.succeeded`
- `dev.forgepoint.auth.login.failed`
- `dev.forgepoint.auth.credential.issued`
- `dev.forgepoint.user.created`
- `dev.forgepoint.user.deactivated`
- `dev.forgepoint.team.created`
- `dev.forgepoint.team.deleted`
- `dev.forgepoint.team.member.added`
- `dev.forgepoint.team.member.removed`

Namespaces and resources:

- `dev.forgepoint.workspace.created`
- `dev.forgepoint.workspace.updated`
- `dev.forgepoint.workspace.deleted`
- `dev.forgepoint.group.created`
- `dev.forgepoint.group.updated`
- `dev.forgepoint.group.moved`
- `dev.forgepoint.group.deleted`
- `dev.forgepoint.repository.created`
- `dev.forgepoint.repository.updated`
- `dev.forgepoint.repository.renamed`
- `dev.forgepoint.repository.visibility.changed`
- `dev.forgepoint.repository.deleted`
- `dev.forgepoint.repository.ref.updated`
- `dev.forgepoint.repository.push.rejected`
- `dev.forgepoint.repository.config.validated`
- `dev.forgepoint.repository.config.rejected`
- `dev.forgepoint.project.created`
- `dev.forgepoint.project.updated`
- `dev.forgepoint.project.deleted`

Checks, jobs, extensions:

- `dev.forgepoint.check.created`
- `dev.forgepoint.check.updated`
- `dev.forgepoint.job.queued`
- `dev.forgepoint.job.started`
- `dev.forgepoint.job.succeeded`
- `dev.forgepoint.job.failed`
- `dev.forgepoint.job.dead`
- `dev.forgepoint.extension.installed`
- `dev.forgepoint.extension.activated`
- `dev.forgepoint.extension.disabled`
- `dev.forgepoint.extension.failed`
- `dev.forgepoint.secret.accessed`
- `dev.forgepoint.publisher.delivery.succeeded`
- `dev.forgepoint.publisher.delivery.failed`

Extensions must use event types under:

```text
dev.forgepoint.extension.<extension-name>.<event-name>
```

Third-party extension authors may use their own DNS-style prefix if declared in the extension manifest.

### 32.3 SSE Protocol

Endpoint:

```text
GET /events
```

Query parameters:

- `cursor` — server-issued opaque token (see Cursors below).
- `session` — single-use SSE session token for browser callers (see §13.5).
- `workspace`
- `repository`
- `project`
- `type`
- `visibility`

Headers:

- `Authorization: Bearer <token>` for non-browser callers; optional for fully public streams.
- `Last-Event-ID` accepted for resume on a best-effort basis (see Cursors).

Event format (the `id:` line carries the cursor, not the raw event ID):

```text
id: <opaque-cursor>
event: dev.forgepoint.repository.ref.updated
data: {"specversion":"1.0","id":"evt_01hv...", ...}
```

Cursors:

- Cursors are opaque, server-signed tokens binding a position in the visibility-filtered projection of the outbox to the caller's authorization context at the time of issue.
- Cursors are not interchangeable across callers: a cursor issued to user A is rejected when presented by user B with `BAD_USER_INPUT`.
- On resume, the server re-applies visibility filtering. Events the caller is no longer authorized to see are silently skipped. Events the caller has just gained access to are *not* retroactively replayed past the cursor; they appear in subsequent events naturally.
- `Last-Event-ID` is treated as a cursor for compatibility. If the value is invalid or stale (older than 24h), the stream begins from "now" and the server emits an initial `event: dev.forgepoint.stream.resume.rejected` with the rejection reason in `data`.

The stream must apply the same visibility and authorization filtering as GraphQL event queries.

## 33. Git And Repository Storage Contracts

### 33.1 Git HTTP Routes

Core must expose Git smart HTTP routes compatible with standard Git clients:

```text
GET  /git/<workspace>/<group-path>/<repo>.git/info/refs?service=git-upload-pack
POST /git/<workspace>/<group-path>/<repo>.git/git-upload-pack
GET  /git/<workspace>/<group-path>/<repo>.git/info/refs?service=git-receive-pack
POST /git/<workspace>/<group-path>/<repo>.git/git-receive-pack
```

Authorization:

- `git-upload-pack` requires `git:read`.
- `git-receive-pack` requires `git:write`.
- Protected refs require additional ref-specific authorization and checks.

Path stability under rename:

- Resource IDs are stable; human paths may change when workspaces, groups, or repositories are renamed.
- A repository slug history is retained for 30 days after rename. Requests to old `/git/<old-path>.git/*` URLs return `301 Moved Permanently` with the new canonical path.
- After the retention window, old paths return `404 Not Found`.
- GraphQL `repository(path:)` and `workspace(slug:)` look up only the current canonical path; old paths return `NOT_FOUND` rather than redirecting.

### 33.2 Storage Trait Sketch

The Rust API should preserve these semantics even if exact trait names differ:

```rust
pub trait RepoStorage: Send + Sync {
    async fn create_repository(&self, repo: RepoStorageRef) -> Result<(), StorageError>;
    async fn delete_repository(&self, repo: RepoStorageRef) -> Result<(), StorageError>;
    async fn open_repository(&self, repo: RepoStorageRef) -> Result<Box<dyn RepoHandle>, StorageError>;
    async fn begin_receive_pack(&self, repo: RepoStorageRef) -> Result<Box<dyn ReceivePackTxn>, StorageError>;
}

pub trait RepoHandle: Send + Sync {
    async fn read_ref(&self, name: &str) -> Result<Option<GitOid>, StorageError>;
    async fn list_refs(&self, prefix: Option<&str>) -> Result<Vec<GitRef>, StorageError>;
    async fn read_object(&self, oid: GitOid) -> Result<ObjectBytes, StorageError>;
    async fn has_object(&self, oid: GitOid) -> Result<bool, StorageError>;
}

pub trait ReceivePackTxn: Send {
    async fn stage_pack(&mut self, pack: PackStream) -> Result<PackSummary, StorageError>;
    async fn proposed_ref_updates(&self) -> Result<Vec<RefUpdate>, StorageError>;
    async fn validate_config_tree(&mut self, validator: ConfigValidator) -> Result<ConfigValidation, StorageError>;
    async fn commit(self: Box<Self>, accepted: Vec<AcceptedRefUpdate>) -> Result<ReceivePackResult, StorageError>;
    async fn abort(self: Box<Self>) -> Result<(), StorageError>;
}
```

Required transaction behavior:

- Ref updates must be compare-and-swap.
- Pack data must not become visible as accepted repository state until commit.
- Failed validation must abort the transaction.
- Config validation must run against the proposed new tree for affected protected/default refs.
- Events are emitted only after successful commit, except rejection audit events.

S3-compatible backend storage layout (normative):

- Each repository occupies a key prefix `<prefix>/<repo_id>/` under the configured bucket.
- Objects are stored as `<prefix>/<repo_id>/objects/<oid[0:2]>/<oid[2:]>` (loose) and `<prefix>/<repo_id>/packs/<pack-hash>.pack`/`.idx` (packed).
- Refs are represented as a single packed-refs JSON manifest at `<prefix>/<repo_id>/refs/manifest.json`. The manifest carries a monotonically increasing version. Updates use the conditional write primitive (`If-Match` on ETag, or equivalent on Cloudflare Artifacts) to enforce CAS.
- Receive-pack stages packs locally (see §10), then performs ordered S3 writes: pack objects first, then a single conditional write of the new refs manifest. A failure between pack write and manifest write leaves orphan packs that the maintenance job (§16) reaps.
- Conditional write failure (concurrent push winning the CAS) returns `CONFLICT`.

Cloudflare Artifacts is optional (§10). When shipped, it must implement the same layout semantics via its native conditional-write primitive. Documented platform limits are surfaced through CUE schema and runtime errors as described in §10.

### 33.3 Backend Requirements

Local backend (required):

- Stores bare repositories on disk.
- Uses filesystem locks or equivalent.
- Optimized for small self-hosted installs.

S3 backend (required):

- Stores Git objects/packs and refs in S3-compatible object storage following the layout in §33.2.
- Uses the refs-manifest object's conditional write as the CAS primitive.
- Must not rely on S3 eventual list consistency for correctness; ref discovery reads the manifest, not a list of objects.
- Requires local temporary staging during receive-pack (see §10).
- v1 assumes a single Rust server (§3). Multi-node S3 ref CAS requires an external coordination service and is deferred.

Cloudflare Artifacts backend (optional):

- Uses Artifacts repositories as the managed storage substrate.
- Must conform to the same `RepoStorage` behavior, including the §33.2 layout adapted to Artifacts primitives.
- Must document any Artifacts platform limits surfaced to users.
- Must not be required for self-hosted default operation.
- Not part of the v1 acceptance criteria (§25); an implementation may ship without it.

## 34. Authentication And Authorization Contracts

### 34.1 OIDC Login Flow

Required routes:

```text
GET  /auth/oidc/<issuer-id>/login
GET  /auth/oidc/<issuer-id>/callback
POST /auth/logout
```

Login must:

1. Validate issuer metadata (fetched over TLS with signature verification).
2. Use PKCE.
3. Validate state and nonce.
4. Validate ID token issuer, audience, expiry, and signature.
5. Apply JIT allow rules.
6. Create or update local user record.
7. Emit audit event.

Per-issuer behavior depends on `clientKind` (§30.1):

- `confidential` clients exchange the auth code with `clientSecret` and may persist a refresh token.
- `public` clients (used by the CLI device flow) complete PKCE without a `clientSecret` and do not persist refresh tokens.

### 34.2 Git Credential Helper Flow

CLI flow:

1. Git invokes Forgepoint credential helper.
2. Helper requests a device or browser OIDC flow.
3. User authenticates with configured OIDC issuer.
4. Helper calls Forgepoint token exchange endpoint.
5. Forgepoint returns a short-lived Git credential scoped to the requested resource/action.
6. Helper returns username/password material to Git's HTTPS credential protocol.

Required endpoint:

```text
POST /auth/token-exchange
```

TLS is required. Rate limits apply (§13.5). The GraphQL `issueGitCredential` mutation delegates to this handler (§31.5).

Request fields:

```json
{
  "grantType": "urn:forgepoint:grant:oidc-token-exchange",
  "subjectToken": "<oidc-jwt>",
  "subjectTokenType": "urn:ietf:params:oauth:token-type:jwt",
  "requestedResource": "forgepoint://repository/repo_...",
  "requestedActions": ["git:read", "git:write"]
}
```

Response fields:

```json
{
  "accessToken": "<opaque-short-lived-token>",
  "tokenType": "Bearer",
  "expiresIn": 300,
  "scope": ["git:read", "git:write"],
  "resource": "forgepoint://repository/repo_..."
}
```

### 34.3 Workload OIDC Exchange

CI systems authenticate through the same token exchange endpoint with workload issuer configuration.

Workload exchange must validate:

- Issuer.
- Audience.
- Subject.
- Expiry.
- Signature.
- Configured claims.
- Requested resource/action.
- Authorization policy.

No long-lived CI token is required in v1.

### 34.4 SpiceDB Model Sketch

The default SpiceDB schema should model relationships similar to:

```zed
definition user {}

definition anonymous {}  // singleton; the unauthenticated principal

definition team {
  relation parent: instance
  relation member: user | team#member
}

definition instance {
  relation owner: user | team#member
  relation admin: user | team#member
  relation member: user | team#member
  // Wildcard binding to enable unauthenticated PUBLIC visibility.
  relation public_viewer: user:* | anonymous:*

  permission administer = owner + admin
  permission view_internal = administer + member
  permission view_public = view_internal + public_viewer
}

definition workspace {
  relation parent: instance
  relation owner: user | team#member
  relation admin: user | team#member
  relation maintainer: user | team#member
  relation viewer: user | team#member
  relation public_viewer: user:* | anonymous:*

  permission administer = owner + admin + parent->administer
  permission write = administer + maintainer
  permission read = write + viewer + parent->view_internal
  permission view_public = read + public_viewer
}

definition group {
  relation parent_workspace: workspace
  relation parent_group: group
  relation owner: user | team#member
  relation maintainer: user | team#member
  relation viewer: user | team#member
  relation public_viewer: user:* | anonymous:*

  permission administer = owner + parent_workspace->administer + parent_group->administer
  permission write = administer + maintainer + parent_workspace->write + parent_group->write
  permission read = write + viewer + parent_workspace->read + parent_group->read
  permission view_public = read + public_viewer + parent_workspace->view_public + parent_group->view_public
}

definition repository {
  relation parent_group: group
  relation owner: user | team#member
  relation maintainer: user | team#member
  relation developer: user | team#member
  relation viewer: user | team#member
  relation public_viewer: user:* | anonymous:*

  permission administer = owner + parent_group->administer
  permission git_write = administer + maintainer + developer
  permission git_read = git_write + viewer + parent_group->read
  permission view_public = git_read + public_viewer + parent_group->view_public
  permission checks_write = administer + maintainer
}

definition project {
  relation repository: repository
  relation owner: user | team#member
  relation maintainer: user | team#member
  relation viewer: user | team#member
  relation public_viewer: user:* | anonymous:*

  permission administer = owner + repository->administer
  permission write = administer + maintainer + repository->git_write
  permission read = write + viewer + repository->git_read
  permission view_public = read + public_viewer + repository->view_public
}
```

Anonymous principal:

- Unauthenticated callers are represented as `anonymous:*`. The authorization adapter resolves to this principal for any request lacking valid auth.
- `view_public` is the only permission an anonymous caller may hold.

Extension authorization model:

- v1 emits per-extension SpiceDB schema fragments at install time. Each extension's manifest permissions (§35.1) become relations on a synthetic `<extension-name>_resource` definition plus permission rules that delegate appropriately to parent resources.
- Schema fragments are namespaced by extension name to avoid collisions across extensions.
- Schema evolution: adding new permissions is backward-compatible (additive fragment). Removing or renaming a permission requires a coordinated extension version bump and a migration step run during activation; the migration may rewrite tuples (`zedtoken`-stable) and update the active schema atomically. Failure to migrate cleanly transitions the extension to `failed` (see §35.2).

## 35. Extension Package Contract

### 35.1 Manifest

Each extension package must include a manifest.

Required logical fields:

```json
{
  "schemaVersion": "forgepoint.extension/v1",
  "name": "pull-requests",
  "displayName": "Pull Requests",
  "version": "0.1.0",
  "publisher": "forgepoint-dev",
  "description": "Pull request and review workflow",
  "wasm": {
    "component": "extension.wasm",
    "witWorld": "forgepoint:extension/extension"
  },
  "graphql": {
    "sdl": "schema.graphql"
  },
  "cue": {
    "schemas": ["schema.cue"]
  },
  "ui": {
    "manifest": "ui/manifest.json"
  },
  "permissions": [
    {
      "name": "pull_request.read",
      "resourceKinds": ["repository", "project"]
    },
    {
      "name": "pull_request.write",
      "resourceKinds": ["repository", "project"]
    }
  ],
  "subscribedEventTypes": [
    "dev.forgepoint.repository.ref.updated",
    "dev.forgepoint.check.updated"
  ],
  "capabilities": {
    "graphql": true,
    "cue": true,
    "ui": true,
    "git": {
      "read": true,
      "controlledWrite": true,
      "hooks": false
    },
    "events": {
      "read": true,
      "write": true,
      "subscribe": true
    },
    "storage": {
      "documents": true,
      "indexes": true,
      "blobs": true
    },
    "jobs": {
      "schedule": true,
      "run": true
    },
    "http": {
      "enabled": false,
      "allow": []
    },
    "secrets": {
      "read": [],
      "write": []
    }
  }
}
```

Manifest capabilities use the same shape as `#ExtensionCapabilities` in `config.cue` (§30.1). Activation succeeds only when every `true` in the manifest has a corresponding `true` in the per-install grant; pointwise inequality fails activation with `EXTENSION_ACTIVATION_FAILED`.

### 35.2 Lifecycle

Extension lifecycle states:

- `discovered`
- `fetched`
- `verified`
- `validated`
- `migrating`
- `activating`
- `active`
- `disabled`
- `failed`

Activation pipeline:

1. Load local or OCI package.
2. Verify digest.
3. Verify signature if required by config.
4. Parse manifest.
5. Validate requested capabilities against local `config.cue`.
6. Validate WIT compatibility.
7. Validate GraphQL SDL composition.
8. Validate CUE schema composition.
9. Run or verify storage migrations.
10. Instantiate WASM component.
11. Call `init`.
12. Register event handlers, hooks, jobs, and UI assets.
13. Mark active.
14. Emit activation event.

If activation fails, the extension remains disabled or failed. Core must keep serving without that extension.

Index build during activation:

- Newly declared indexes on existing collections are built asynchronously after the extension transitions to `active`. While an index is being built, the extension is `active` but queries against the in-progress index return `STORAGE_UNAVAILABLE` and the extension's state field exposes `active-degraded` until completion.
- Index builds emit job progress events. A failed index build transitions the extension to `failed` and triggers the migration rollback in §17.
- Activation has no time limit; operators may cancel a long-running build with the CLI, which reverses the migration and disables the extension.

### 35.3 WIT Sketch

The WIT interface should include these capabilities:

```wit
package forgepoint:extension;

world extension {
  import host-log;
  import host-events;
  import host-storage;
  import host-git;
  import host-http;
  import host-secrets;
  import host-jobs;

  export extension-api;
}

interface extension-api {
  // ---- Lifecycle ----
  record init-context {
    installation-id: string,
    extension-name: string,
    version: string,
    // CUE-evaluated, defaults-filled JSON for the extension's config block.
    // Never raw CUE text. Validated against the extension's schema before init.
    config-json: string,
  }

  init: func(ctx: init-context) -> result<_, string>;
  shutdown: func() -> result<_, string>;
  graphql-sdl: func() -> result<string, string>;

  // ---- GraphQL resolver ----
  record resolver-request {
    field-path: string,        // e.g. "Repository.pullRequests"
    parent-json: option<string>,
    args-json: string,
    viewer-json: string,       // see Viewer shape below
    // Selection set the client requested; lets the resolver fetch only what's needed.
    selection-json: string,
  }
  record resolver-response {
    result-json: string,
  }

  // Batched form: one trap resolves a list of parents for the same field.
  // The host invokes this for list-typed fields and for sub-fields of list parents.
  record resolver-batch-request {
    field-path: string,
    parents-json: string,      // JSON array of parent values
    args-json: string,
    viewer-json: string,
    selection-json: string,
  }
  record resolver-batch-response {
    results-json: string,      // JSON array, one entry per parent, in order
  }

  resolve: func(req: resolver-request) -> result<resolver-response, string>;
  resolve-batch: func(req: resolver-batch-request) -> result<resolver-batch-response, string>;

  // ---- Events ----
  // Tri-state outcome lets the host route correctly.
  variant event-outcome {
    handled,
    ignored,
    retry(u32),               // retry after N milliseconds
    dead-letter(string),      // permanent failure with reason
  }
  handle-event: func(event-json: string) -> result<event-outcome, string>;

  // ---- Background jobs ----
  record job-context {
    job-id: string,
    kind: string,
    payload-json: string,
    attempt: u32,
    correlation-id: option<string>,
  }
  variant job-outcome {
    succeeded(string),        // result JSON
    failed(string),           // permanent failure
    retry(u32),               // retry after N milliseconds
  }
  run-job: func(ctx: job-context) -> result<job-outcome, string>;
}
```

Viewer JSON shape passed in resolver requests:

```json
{
  "id": "usr_01HV...",
  "kind": "user",
  "subject": "...",
  "issuer": "...",
  "displayName": "..."
}
```

The viewer object does not carry precomputed permissions. Resolvers that need to authorize an operation call `host-storage` / `host-events` (which check authorization internally) or use the `host-permissions.check(resource, action)` import to query authorization on demand.

Async and streaming:

- v1 uses synchronous WIT functions only. Component Model `future` / `stream` are out of scope for v1; resolvers and event handlers are single-call.
- Hosts may dispatch many concurrent resolver calls into the same extension instance; the WASM component must be reentrant and stateless across calls (state lives in host storage).
- The N+1 ceiling for list-typed fields is mitigated by `resolve-batch`. The host runtime is required to batch list-typed sub-resolvers within a single GraphQL request when the extension exports `resolve-batch` for the relevant field.

Host imports (sketch):

```wit
interface host-log {
  log: func(level: string, message: string);
}

interface host-permissions {
  // Returns the list of action names the viewer holds on the given URN.
  check: func(resource-urn: string) -> list<string>;
}

interface host-git {
  // ---- Read ----
  read-ref: func(repo: string, ref: string) -> result<option<string>, string>;
  list-refs: func(repo: string, prefix: option<string>) -> result<list<git-ref>, string>;
  read-object: func(repo: string, oid: string) -> result<git-object, string>;
  read-tree: func(repo: string, commit: string, path: string) -> result<git-tree, string>;
  diff: func(repo: string, base: string, head: string, paths: option<list<string>>) -> result<git-diff, string>;
  // ---- Write (controlled) ----
  create-blob: func(repo: string, content: list<u8>) -> result<string, string>;
  create-tree: func(repo: string, entries: list<git-tree-entry-input>) -> result<string, string>;
  create-commit: func(repo: string, args: git-commit-input) -> result<string, string>;
  // CAS update; old-oid empty means "ref must not exist".
  update-ref: func(repo: string, ref: string, new-oid: string, old-oid: string) -> result<_, string>;

  record git-ref { name: string, target: string }
  record git-object { oid: string, kind: string, content: list<u8> }
  record git-tree { entries: list<git-tree-entry> }
  record git-tree-entry { name: string, oid: string, mode: string, kind: string }
  record git-tree-entry-input { name: string, oid: string, mode: string }
  record git-diff { files: list<git-diff-file> }
  record git-diff-file { path: string, status: string, patch: string }
  record git-commit-input {
    tree: string,
    parents: list<string>,
    author: git-signature,
    committer: git-signature,
    message: string,
  }
  record git-signature { name: string, email: string, when: string }
}

interface host-jobs {
  // Schedule a job. Returns the job ID.
  schedule: func(kind: string, payload-json: string, run-after-ms: option<u32>) -> result<string, string>;
  // Extend the running job's lock by N milliseconds. Required for long-running jobs.
  extend-lock: func(job-id: string, ms: u32) -> result<_, string>;
}
```

Exact WIT should be split into smaller interfaces during implementation, but the capabilities, surfaces, and lifecycle responsibilities above are required.

## 36. Host Extension Storage Contract

### 36.1 Document Collections

Extensions declare collections and indexes in their manifest or CUE schema.

Collection declaration:

```json
{
  "name": "pull_requests",
  "resourceScoped": true,
  "visibilityField": "visibility",
  "indexes": [
    {
      "name": "by_repository_state_updated",
      "fields": ["repositoryID", "state", "updatedAt"],
      "unique": false
    },
    {
      "name": "by_repository_number",
      "fields": ["repositoryID", "number"],
      "unique": true
    }
  ]
}
```

Document requirements:

- JSON object.
- Stable `id`.
- `createdAt`.
- `updatedAt`.
- Optional `resourceRefs`.
- Optional `visibility`.
- Version/CAS token.

### 36.2 Query API

Host storage query model:

```json
{
  "collection": "pull_requests",
  "index": "by_repository_state_updated",
  "where": {
    "repositoryID": {"eq": "repo_01hv..."},
    "state": {"in": ["OPEN", "REVIEW"]},
    "updatedAt": {"gt": "2026-01-01T00:00:00Z"}
  },
  "order": [
    {"field": "updatedAt", "direction": "DESC"}
  ],
  "first": 50,
  "after": "cursor"
}
```

`where` clause grammar:

- Each entry is `<field>: { <op>: <value> }`.
- Supported operators: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`, `notIn`, `prefix`.
- Bare scalar form `"field": "value"` is sugar for `"field": {"eq": "value"}`.
- Every queried field must be covered by the chosen index (the field appears in the index's `fields` list at a position consistent with the operator: equality for prefix positions, ranges for the trailing position).
- Composite operators (`and`, `or`) are not supported in v1; clients compose multiple queries client-side or model the predicate as a denormalized index field.

Queries must use declared indexes. Unindexed scans are not allowed in production mode and return `BAD_USER_INPUT` with the missing-index diagnostic.

### 36.3 Transactions

Storage transactions may include:

- Document create/update/delete.
- Blob create/delete.
- Event append.
- Job enqueue.

Transactions must not include:

- Arbitrary SQL.
- Direct mutation of core tables.
- Network calls.
- Long-running Git operations.

## 37. Frontend Extension Contract

### 37.1 UI Manifest

Extension UI manifest:

```json
{
  "schemaVersion": "forgepoint.ui-extension/v1",
  "extension": "pull-requests",
  "assets": {
    "entry": "/_extensions/ext_01hv/assets/index.js",
    "styles": ["/_extensions/ext_01hv/assets/styles.css"]
  },
  "routes": [
    {
      "path": "/:workspace/:group*/:repo/pulls",
      "element": "forgepoint-pull-request-list",
      "requiredPermission": "pull_request.read"
    },
    {
      "path": "/:workspace/:group*/:repo/pulls/:number",
      "element": "forgepoint-pull-request-detail",
      "requiredPermission": "pull_request.read"
    }
  ],
  "slots": [
    {
      "slot": "repository.nav",
      "element": "forgepoint-pull-request-nav",
      "requiredPermission": "pull_request.read"
    }
  ]
}
```

### 37.2 Web Component Contract

Extension web components receive context through properties, not global mutable state.

Required properties:

- `forgepointClient` (see interface below)
- `viewer`
- `resource`
- `routeParams`
- `capabilities`

Components must dispatch standard DOM events for navigation and toast/notification requests. They must not assume a specific frontend framework runtime.

`forgepointClient` interface (TypeScript):

```typescript
interface ForgepointClient {
  /** GraphQL query. Returns parsed `data` or throws with a `code` from §31.2. */
  query<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string }
  ): Promise<TData>;

  /** GraphQL mutation. Same shape as `query`. */
  mutate<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string }
  ): Promise<TData>;

  /** GraphQL subscription. Returns an async iterable. */
  subscribe<TData = unknown, TVars = Record<string, unknown>>(
    document: string,
    variables?: TVars,
    opts?: { signal?: AbortSignal; operationName?: string }
  ): AsyncIterable<TData>;

  /** Permissions held on a canonical resource URN. */
  permissions(resourceURN: string): Promise<string[]>;

  /** Live event stream filtered by the host's authorization context. */
  events(filter?: EventFilter, opts?: { signal?: AbortSignal }): AsyncIterable<Event>;

  /** Imperative navigation hook. The host frontend handles the navigation. */
  navigate(path: string, opts?: { replace?: boolean }): void;

  /** Show a toast to the user. */
  toast(level: "info" | "success" | "warn" | "error", message: string): void;

  /** Credential lifecycle: the host transparently refreshes short-lived tokens.
   *  Components do not see access tokens directly; the client handles them. */
}
```

Credential refresh is handled by the client; components must not access or store tokens.

The interface is stable within the v1 line; additions are allowed; removals require a major schema version bump.

### 37.3 Asset Serving

Rust asset API:

```text
GET /_extensions/<extension-installation-id>/manifest.json
GET /_extensions/<extension-installation-id>/assets/<path>
```

Responses must include:

- Strong cache validators (`ETag`, immutable `Cache-Control: max-age=31536000, immutable` when the asset path includes a content hash).
- `Content-Type` set per asset extension.
- `Sec-Fetch-Mode: cors` is honored; CORS headers per §13.5.
- Subresource integrity hash for the entry asset advertised in the UI manifest (`assets.entryIntegrity`); the frontend must validate.

Content Security Policy:

- Asset responses set `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'`.
- `unsafe-inline` and `unsafe-eval` are prohibited.
- Extensions that require additional `connect-src` origins must declare them in the UI manifest under `csp.connectSrc`; the host merges declared origins (allowlisted against `instance.allowedOrigins` and the HTTP allowlist) into the response CSP.

Asset auth model:

- For a `PUBLIC`-visibility instance, asset endpoints are unauthenticated.
- For `INTERNAL`/`PRIVATE` instances, asset endpoints require the same SSE session-token model (§13.5) for browsers: the frontend obtains a short-lived asset token via `POST /_extensions/session` and appends it as `?session=<opaque>` to asset URLs. Non-browser callers use `Authorization: Bearer <token>`.

## 38. Checks, Jobs, And Operational Data

### 38.1 Checks/Statuses

Check identity:

```text
repository_id
commit_oid
name
producer
```

States:

- `QUEUED`
- `IN_PROGRESS`
- `COMPLETED`

Conclusions:

- `SUCCESS`
- `FAILURE`
- `CANCELLED`
- `SKIPPED`
- `NEUTRAL`
- `TIMED_OUT`
- `ACTION_REQUIRED`

A check may be required by branch protection only if it has a stable name or configured context pattern.

### 38.2 Job Records

Job fields:

```text
id
kind
queue
payload_json
state
attempts
max_attempts
run_after
locked_by
locked_until
created_at
updated_at
last_error
correlation_id
```

States:

- `queued`
- `running`
- `succeeded`
- `failed`
- `cancelled`
- `dead`

Retries:

- Exponential backoff with jitter.
- Dead-letter after `max_attempts`.
- Job failures emit events when visible and audit-relevant.

Claim semantics:

- v1 is single-node (§3). The queue must still use a correct claim protocol so multi-worker readiness is preserved for a future release.
- Postgres backend: `SELECT ... FOR UPDATE SKIP LOCKED` to claim, transactional update to set `locked_by`/`locked_until`.
- SQLite backend: `BEGIN IMMEDIATE` + `UPDATE jobs SET locked_by = ?, locked_until = ? WHERE state = 'queued' AND locked_by IS NULL ... RETURNING ...` with jittered retry on `SQLITE_BUSY`. SQLite's writer-serialization plus `RETURNING` yields exactly-one claim.

Lock extension:

- A running job whose handler approaches `locked_until` calls `host-jobs.extend-lock(jobID, ms)` (see §35.3). Extensions are capped at `quotas.wallTimeMs`; further extension requests are rejected.
- A worker that loses its lock (process crash, lease expiry, host preemption) must not write outcome data for the job. The next worker observing the expired lock requeues.

## 39. Acceptance Test Matrix

The MVP must include automated tests for these workflows:

| Area | Scenario | Expected Result |
| --- | --- | --- |
| OIDC | Allowed user first login | User record created and audit event emitted |
| OIDC | Disallowed issuer/group | Login rejected with no user record |
| OIDC | Confidential client with empty `clientSecret` in production | Config reload rejected with `CONFIG_INVALID` |
| Git | Clone public repository | Standard Git client succeeds without auth if public access is enabled |
| Git | Clone private repository without auth | Standard Git client receives auth failure |
| Git | Push with valid short-lived credential | Ref update succeeds |
| Git | Push after credential expiry | Ref update fails and helper can refresh |
| Git | Repository rename and clone old URL within retention | 301 redirect to new path |
| Git | Repository rename and clone old URL after retention | 404 |
| CUE | Push invalid `package forgepoint` to default ref | Push rejected |
| CUE | Push valid inherited config | Effective path snapshots stored |
| CUE | Child conflicts with parent | Push rejected with config diagnostics |
| CUE | Push exceeds `cueEvalBudget` | Push rejected with `CONFIG_INVALID` and `dev.forgepoint.repository.config.rejected` event with `reason: "evaluation_budget"` |
| CUE | Bootstrap push with no `package forgepoint` files to a brand-new repo | Accepted |
| CUE | Bootstrap push with invalid `package forgepoint` to a brand-new repo | Rejected |
| Visibility | Create PUBLIC repo under PRIVATE workspace with `allowPublicDescendants: false` | Rejected with `CONFIG_INVALID` |
| Visibility | Create PUBLIC repo under workspace with `allowPublicDescendants: true` | Accepted |
| Storage | Concurrent ref update | One update wins, the other gets conflict |
| Storage | S3 receive-pack staging exceeds budget | Push rejected with `STORAGE_UNAVAILABLE` |
| GraphQL | Extension SDL conflict | Extension activation fails closed |
| GraphQL | `viewer.permissions` for an unknown resource | Returns empty list, not an error |
| GraphQL | `createRepository` with backend outside `allowedStorageBackends` | `FORBIDDEN` |
| GraphQL | `ExtensionInstallation.manifestAdmin` for a non-admin viewer | Returns null |
| Events | Private event over public SSE | Event is not delivered |
| Events | Cursor resume after user lost access | Resumed stream omits no-longer-visible events |
| Events | `Last-Event-ID` older than 24h | Stream begins from "now" with `dev.forgepoint.stream.resume.rejected` |
| Events | CloudEvents strict projection through publisher | `actor` is URI string and `resources` lives in `data` |
| Authz | User loses team membership | Subsequent reads and streams stop exposing resource within 5s |
| Authz | Unauthenticated request to PUBLIC repository | Allowed via `anonymous:*` |
| Authz | Unauthenticated request to INTERNAL repository | Denied |
| Extension | Manifest capability shape matches `#ExtensionCapabilities` | Validation succeeds |
| Extension | Missing required capability grant | Extension disabled with activation error |
| Extension | Two extensions declare same permission short name | Activation succeeds; both registered under namespaced names |
| Extension | `handle-event` returns `retry(N)` | Host retries after N ms with backoff cap |
| Extension | `run-job` calls `host-jobs.extend-lock` during long run | Lock extension succeeds; another worker cannot steal the job |
| Extension | `resolve-batch` invoked for list-typed field | Single trap resolves N parents |
| Extension | Host storage transaction emits event | Document and event commit atomically |
| Extension | Host storage `where` with operator not covered by chosen index | `BAD_USER_INPUT` |
| Extension | Schema reload removes an extension with active subscription | Subscription closed with `SCHEMA_CHANGED` |
| Extension | Activation fails after migration; reverse step runs | Storage returned to pre-migration state; extension `disabled` |
| Frontend | Installed UI extension manifest | Frontend discovers route and loads ESM asset |
| Frontend | Asset response includes CSP and SRI for entry | Headers present and SRI matches manifest |
| Frontend | Cross-origin GraphQL fetch from disallowed origin | Rejected at boundary |
| Checks | Required check fails | Protected ref merge/update is blocked |
| Jobs | Server restarts with queued job | Job remains queued and later runs |
| Jobs | SQLite single-writer claim under concurrent attempts | Exactly one worker claims each job |
| Rate | `/auth/token-exchange` exceeds per-principal ceiling | `RATE_LIMITED` |
| Backup | `forgepointctl backup` followed by `restore` to empty dir | Repository state, extension storage, secrets, and metadata fully recovered |

## 40. References

- Cloudflare Artifacts: https://developers.cloudflare.com/artifacts/
- Cloudflare Artifacts limits: https://developers.cloudflare.com/artifacts/platform/limits/
- Prescience: https://github.com/rawkode/prescience
- GitHub authentication documentation: https://docs.github.com/en/authentication
- GitHub Actions OIDC documentation: https://docs.github.com/en/actions/concepts/security/openid-connect
- cuengine crate documentation: https://docs.rs/cuengine
