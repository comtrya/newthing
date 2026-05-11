# Comtrya Stage-Ready Demo TODO

This file is intentionally blunt. The current demo has some real paths, but it is not yet a fully honest product demo where every visible surface is produced by real Git storage, real Wasmtime Component Model extensions, and durable first-class runtime state.

## Current Truth

- Real: `start.sh` builds and launches the Rust server and Astro frontend.
- Real: the operator-code flow exchanges the seeded `.envrc` code for a scoped bearer credential.
- Real: the server seeds or opens a local bare Git repository under `$COMTRYA_DATA_DIR/repositories`.
- Real: Rust tests cover seeded Git repository idempotent open and snapshot extraction from refs, tree, blobs, and diff.
- Real: GraphQL returns refs, branches, commits, tree entries, blobs, file previews, and diffs derived from that Git repository.
- Real: Git clone/fetch works through the Astro origin using a scoped Comtrya credential.
- Real: extension UI manifests and assets are served from `/_extensions/...`.
- Real: Astro dynamically imports extension JS assets.
- Real: Wasmtime compiles, instantiates, and executes minimal Component Model resolver components.
- Real: extension runtime data is imported at startup into versioned storage files under `$COMTRYA_DATA_DIR/extensions/storage`.
- Real: request-time GraphQL demo aggregation reads pull requests, checks, extension installs, activity, workspace, and repository metadata from extension storage documents instead of a runtime JSON blob.
- Real: extension resolver records expose typed code-browser, pull-request, and checks output summaries instead of UI-visible numeric proof values.
- Real: `start.sh` uses structured JSON assertions for readyz, token exchange, GraphQL Git data, GraphQL storage data, and typed resolver summaries.
- Real: `start.sh` validates `git ls-remote`, branch-specific fetch, and clone HEAD matching GraphQL `repository.headOid`.
- Real: `start.sh` validates the SSR-rendered frontend head OID matches GraphQL and cloned Git HEAD.
- Real: `start.sh` validates the GraphQL diff patch exactly matches `git diff --patch --find-renames HEAD~1 HEAD` from the cloned repository.
- Real: `start.sh` prints the seeded repository path, live branch list, and installed extension list from GraphQL.
- Real: `start.sh` validates Git no-token, wrong-token, missing-`git:read`, single-use and expired session failures, and receive-pack fail-closed auth/error behavior.
- Real: Rust route tests cover Git upload-pack no-auth, wrong-scope, path traversal, and receive-pack fail-closed behavior.
- Real: startup validates first-party backend extension manifests against their UI manifests and entry asset paths.
- Real: Rust tests prove first-party extension manifests load from disk with expected component/resolver/output metadata.
- Real: Rust tests cover first-party Wasmtime component compile, missing resolver export, and resolver trap failures.
- Real: GraphQL exposes typed `workspace`, `repository`, `extensionInstallations`, `extensionResolvers`, and `activityEvents` roots; the Astro frontend and first-party extension UI assets consume those roots instead of the generic `demo` aggregate.
- Real: startup computes SHA-256 for first-party extension entry assets and rejects stale UI manifest `entryIntegrity` values.
- Real: startup validates the seeded bare Git repository HEAD and expected demo branch refs.
- Real: the frontend mounts extension host elements from runtime extension installations and UI manifest slot declarations instead of hardcoded extension IDs.
- Real: visible repository metric cards use live Git/storage counts, and seed metadata cannot override derived repository metrics, language, license, or update timestamp.
- Not real enough: the host page is still mostly Astro/TypeScript host UI, not a shell composed from real extension-provided surfaces.
- Not real enough: pull request, checks, extension registry, and activity data are storage documents seeded from `fixtures/demo/conference.json`, but typed first-party extension resolvers still do not own the product behavior.
- Not real enough: the WASM components still expose a minimal execution proof ABI; typed WIT resolver calls do not yet own the business logic for code browsing, pull requests, or checks.
- Not real enough: receive-pack/push is explicitly disabled.
- Not real enough: workspace identity, repository description, and some first-party extension documents are seeded demo metadata.

## Definition Of Done

The demo is proper when a skeptical reviewer can start `./start.sh`, open `http://127.0.0.1:4321/`, and every visible product surface can be traced to one of these real sources:

- Git object database, refs, commits, trees, blobs, diffs, or push/fetch protocol.
- Durable Comtrya runtime storage with explicit schema and migrations.
- A first-party Wasmtime Component Model extension called by the host through a real resolver interface.
- Authenticated Comtrya API calls made through the Astro origin.

No visible product data should come from inline JS constants, fixture-only JSON, hardcoded fake metrics, or host-side placeholder models.

## 1. Replace Fixture-Seeded Runtime JSON With Real Runtime Storage

- Create a proper extension/runtime storage schema instead of `$COMTRYA_DATA_DIR/extensions/runtime-state.json`.
- Add migrations for extension documents, indexes, activity events, pull requests, review comments, check suites, check runs, and extension install records.
- Move seeded demo data import behind explicit seed commands or startup seed logic that writes through the same storage APIs used by runtime code.
- Delete the direct `fixtures/demo/conference.json` fallback from request-time product paths.
- Keep fixtures only as seed input or tests, never as the live source of product API responses.
- Add storage repository APIs for:
  - creating extension documents,
  - querying by indexed fields,
  - updating documents atomically,
  - appending events in the same transaction,
  - reading extension-owned data with permission checks.
- Make `demo_payload()` assemble data from Git plus runtime storage repositories, not raw JSON values.
- Real: server tests prove deleting the fixture after initial seed does not break runtime storage-backed API output.
- Real: server tests prove runtime storage changes immediately affect GraphQL output; browser/UI proof is still tracked in the smoke gaps.

## 2. Make Extensions Own Their Product Data

- Define the real host-to-extension resolver ABI in WIT for first-party extensions.
- Add typed resolver calls for:
  - code browser tree/read/blob/diff queries,
  - pull request list/detail/create/update/merge-readiness queries,
  - checks list/detail/status aggregation queries.
- Stop treating Wasmtime resolver execution as a numeric proof only.
- Replace the remaining minimal component return-value ABI with real typed resolver outputs produced by the components themselves.
- Define extension input/output types in WIT and mirror them in Rust.
- Add a host capability context passed into each extension invocation:
  - authenticated principal,
  - requested resource,
  - repository id/path,
  - requested action,
  - trace id,
  - storage handle,
  - Git read/write handle,
  - event append handle.
- Enforce declared extension capabilities at resolver invocation time.
- Add extension-level error codes and fail-closed behavior for missing grants, bad resolver names, bad component exports, and schema mismatch.
- Add tests where an extension without `git.read` cannot resolve repository files.
- Add tests where an extension without `storage.documents` cannot read PR/check state.
- Add tests where a resolver crash returns an explicit extension error and does not poison the host.

## 3. Build Real First-Party Code Browser Extension

- Move code browser data fetching out of the host shell and into the code browser extension resolver.
- Implement code browser resolver methods:
  - `repository_refs`,
  - `repository_branches`,
  - `commit_history`,
  - `tree_entries`,
  - `blob_preview`,
  - `diff_between`.
- Make those resolvers read from the real bare Git repository through the host Git API.
- Return typed data to the extension UI instead of having the UI query generic `demo`.
- Remove host-rendered code browser panels that duplicate extension-owned behavior.
- Keep the file tree rendered with `@pierre/trees`.
- Keep diffs rendered with `@pierre/diffs`.
- Add UI loading, empty, denied, and resolver-error states.
- Add smoke validation that the code browser extension route renders a known commit/tree/blob read from Git.
- Add tests proving the code browser updates when the underlying Git repo changes.

## 4. Build Real Pull Request Extension

- Define a pull request data model in runtime storage:
  - repository id,
  - PR number,
  - title,
  - body,
  - author,
  - base ref,
  - head ref,
  - state,
  - draft flag,
  - created/updated timestamps,
  - reviewers,
  - comments,
  - requested checks,
  - mergeability snapshot.
- Implement PR resolvers:
  - list PRs,
  - get PR detail,
  - create PR from branches,
  - update title/body/state,
  - add review/comment,
  - compute changed files from Git,
  - compute diff from Git,
  - compute ahead/behind from Git,
  - compute merge readiness from checks and branch protection rules.
- Make PR data extension-owned in durable storage, not inline frontend state and not fixture JSON.
- Make PR changed files and diffs come from Git.
- Make PR check summaries come from the checks extension/runtime storage.
- Add permission checks for read/write/admin PR actions.
- Add fail-closed behavior for missing base/head refs.
- Add tests for PR creation against real branches in the seeded repo.
- Add tests proving PR diff output changes when the head branch changes.
- Add smoke validation that the visible PR list is resolver-backed.

## 5. Build Real Checks Extension

- Define check suite/check run runtime schema:
  - repository id,
  - commit oid,
  - provider,
  - check name,
  - status,
  - conclusion,
  - started/completed timestamps,
  - details URL,
  - annotations,
  - required flag.
- Implement checks resolvers:
  - list check runs for commit,
  - summarize branch protection status,
  - create/update check run,
  - list required checks,
  - compute aggregate status for a PR.
- Make check data durable extension-owned runtime state.
- Add host APIs for checks writes from trusted extension/workload contexts.
- Remove hardcoded check rows and seeded fixture-only check paths.
- Add tests for required-check success/failure across real commit oids.
- Add smoke validation that checks shown in UI are read from runtime storage through the checks extension.

## 6. Make Git Storage And Protocol Proper

- Replace shelling out to `git http-backend` with the intended Git implementation path when ready.
- Decide whether stage demo accepts shell-backed Git as a temporary production-testbed adapter or requires native `gix` immediately.
- If shell-backed Git remains temporarily:
  - Real: `ARCHITECTURE.md` documents it honestly as a temporary production-testbed adapter,
  - Real: the shell-backed implementation is isolated behind a `GitSmartHttpAdapter` trait,
  - Real: server tests cover the shell-backed adapter boundary,
  - remove all claims that it is native `gix`.
- Implement receive-pack/push support or explicitly keep the stage demo read-only.
- If push is in scope:
  - authenticate `git:write`,
  - enforce protected refs,
  - stage packs locally,
  - validate repository config,
  - update refs atomically,
  - append ref update events,
  - update PR/check derived state as needed.
- Add smart HTTP tests with real `git clone`, `git fetch`, and `git push`.
- Partial: route tests and smoke cover unauthorized upload-pack; push remains disabled/unsupported.
- Partial: route tests prove `git:write` alone cannot fetch; push remains disabled before write-scope validation is meaningful.
- Real: route tests cover path traversal rejection for `/git/...`.
- Add multiple repository support instead of one hardcoded `comtrya/comtrya.git`.
- Make repository metadata derive from the repository record and Git config, not literals.

## 7. Make GraphQL Honest

- Replace the generic `demo` GraphQL field with real typed fields:
  - `repository(id/path)`,
  - `repository.refs`,
  - `repository.branches`,
  - `repository.commits`,
  - `repository.tree`,
  - `repository.blob`,
  - `repository.diff`,
  - extension-provided fields for PRs/checks.
- Keep a demo aggregation query only if it is explicitly named as a demo convenience and assembled from real resolvers.
- The `demo` aggregate remains as a compatibility/convenience field assembled from Git, storage, and resolver output.
- Add GraphQL schema coverage tests for every field the UI uses.
- Add resolver tests that fail when data comes from fixtures instead of storage/Git.
- Add authz checks per GraphQL field.
- Add stable error codes for unsupported or denied fields.
- Add query shape tests for Astro frontend queries.

## 8. Make The Frontend A Real Extension Host

- Reduce host UI to navigation, layout, auth/session management, extension loading, and shared primitives.
- Move code browser surface rendering into the code browser extension.
- Move PR surface rendering into the pull request extension.
- Move checks surface rendering into the checks extension.
- Stop the host shell from directly rendering PR/check fake product cards.
- Real: extension host elements are created from runtime extension installations and UI manifest slot declarations instead of hardcoded host elements.
- Real: extension slots are rendered based on manifest slot declarations.
- Startup validates extension asset integrity beyond checking that `entryIntegrity` exists.
- Real: extension asset imports include the manifest integrity as a version key, and the Rust asset route returns content-hash ETags with immutable private cache headers.
- Real: frontend validates UI manifest schema version, id, entry integrity, reserved routes, and slot declarations before mounting.
- Real: the frontend renders visible extension-panel error states for load failure, resolver failure, and permission denial.
- Add smoke validation that dynamically imported extension elements render non-empty content.
- Add browser-level UI tests if Playwright or the Browser plugin is available in the environment.

## 9. Remove Fake Metrics And Metadata

- Real: visible stars/forks/watchers metrics were removed from the demo UI.
- Real: visible refs/branches/files/checks metrics are derived from live Git/storage data.
- Real: license/language are derived from repository files and cannot be overridden by seed metadata.
- Replace hardcoded workspace/member counts with runtime storage.
- Replace relative time strings from fixtures with timestamps formatted by the frontend from real stored timestamps.
- Real: server tests prevent seeded repository metrics/language/license from overriding derived runtime facts.

## 10. Harden Startup And Seeding

- Make `start.sh` idempotently seed:
  - repo record,
  - workspace record,
  - bare Git repo,
  - branches,
  - extension installations,
  - extension-owned PR/check/activity documents.
- Real: `start.sh --reset` and `COMTRYA_RESET_DEMO_DATA=1` intentionally reset generated runtime state.
- Real: `start.sh` reset deletion is guarded so only generated paths under `COMTRYA_DATA_DIR` can be removed.
- Real: `start.sh` prints the seeded repository path, branch list, and extension install list from live GraphQL data.
- Real: startup validates that first-party extension files exist before starting the server.
- Real: startup validates that Wasmtime components export the expected resolver before starting the server.
- Real: startup validates extension UI manifests and backend extension manifests agree.
- Real: startup validates that the Git repo has expected refs and HEAD.
- Real: `COMTRYA_EXTERNAL_DEMO=1` makes startup reject the local default `.envrc` operator code.

## 11. Smoke Test Coverage Gaps

- Current smoke uses structured JSON assertions for GraphQL Git/storage/resolver coverage, but not yet for every endpoint response.
- Current smoke checks typed resolver summaries for all first-party extensions; real WIT resolver execution coverage is still needed once the ABI is implemented.
- Current smoke checks extension assets contain `customElements.define`. Also verify the imported elements render content in the browser.
- Current smoke validates Git clone/fetch, `git ls-remote`, branch-specific fetch, and cloned commit equality with GraphQL.
- Real: smoke validates that the cloned commit equals the commit shown in the SSR-rendered UI shell.
- Real: smoke validates the GraphQL diff patch comes from `git diff --patch --find-renames HEAD~1 HEAD`; browser-level proof that the rendered diff widget consumes that patch is still needed.
- Add smoke validation that deleting or changing runtime PR/check storage changes UI output.
- Smoke validates receive-pack fails with the documented explicit `UNSUPPORTED` error until push is implemented.
- Real: smoke validates unsupported old/v1 routes return explicit `UNSUPPORTED` errors, not fake success.
- Smoke validates auth failure for no token, wrong token, token without `git:read`, single-use session reuse, and expired session rejection.

## 12. Unsupported V1 Surfaces Must Be Enumerated

- Real: intentionally unsupported v1/testbed surfaces live in one runtime registry.
- Real: `/readyz` reports unsupported surfaces from that registry.
- Real: unsupported routes return an explicit `UNSUPPORTED` error code and message.
- Real: route tests cover the registered unsupported HTTP surfaces.
- Remove broad or misleading unsupported text once a surface is implemented.
- Keep receive-pack status honest: either implement it or keep it clearly read-only/fail-closed.
- Make docs match runtime exactly.

## 13. Delete Or Quarantine Legacy Demo Artifacts

- Remove any product path that imports directly from `fixtures/demo/conference.json` after storage seeding is implemented.
- Move fixture seed files under a clear seed/test path.
- Delete inline extension JS constants from Rust server code. Extension assets must only come from extension package files.
- Real: hardcoded first-party extension ids were removed from the frontend once manifest-driven slot mounting was in place.
- Delete hardcoded repository id/path from frontend after repository routing is real.
- Delete the generic `demo` GraphQL product path when typed API fields are in place.

## 14. Test Matrix Needed Before Calling It Proper

- Real: Rust unit tests cover Git repository seeding/opening.
- Real: Rust unit tests cover Git snapshot extraction.
- Real: Rust route tests cover Git upload-pack auth/scope behavior.
- Real: Rust route tests cover receive-pack fail-closed behavior.
- Real: Rust tests cover extension manifest loading from disk.
- Real: Rust tests cover Wasmtime resolver compile/export/call failures.
- Real: Rust tests cover extension storage read/write/query behavior.
- Rust tests for PR resolver behavior against real Git refs.
- Rust tests for checks resolver behavior against real commit oids.
- Frontend typecheck.
- Astro build.
- Browser-rendered smoke for extension elements and repository UI.
- End-to-end `start.sh` smoke with:
  - readiness,
  - auth,
  - GraphQL,
  - events,
  - Git clone/fetch,
  - extension manifest/assets,
  - Wasmtime resolver execution,
  - rendered UI,
  - unsupported routes fail-closed.

## 15. Documentation Needed

- Update `PRODUCTION_TESTBED.md` every time a shortcut is removed or added.
- Real: `ARCHITECTURE.md` documents:
  - Rust host,
  - Astro shell,
  - extension package layout,
  - Wasmtime invocation path,
  - extension storage,
  - Git storage/protocol adapter.
- Real: `DEMO_RUNBOOK.md` documents:
  - clean reset,
  - start,
  - URLs,
  - expected credentials,
  - smoke output,
  - where data lives,
  - how to inspect seeded Git repository,
  - how to inspect extension storage.
- Real: `ARCHITECTURE.md` and `DEMO_RUNBOOK.md` include "known not real yet" sections.

## Immediate Next Steps

1. Expand the versioned extension storage schema into full migration/query/write APIs for PRs, checks, extension installs, and activity.
2. Replace the remaining minimal Wasmtime proof ABI with typed WIT resolver calls for code browser, PRs, and checks.
3. Move host-rendered PR/check/code-browser product panels into extension-owned UI surfaces.
4. Finish replacing `demo` GraphQL with per-field authorization/error behavior, then remove the compatibility aggregate.
5. Add structured smoke assertions that prove UI data matches Git/storage/resolver output.
6. Decide whether stage demo remains read-only Git or must support push/receive-pack.
7. Remove remaining fixture-only product paths after seeding writes through real storage.
