# v3 cutover — settled decisions

These are the locked answers to the five `GOAL.md` pre-flight questions. They don't change without a deliberate revision; if a later milestone needs a different answer, update this file in its own commit, then proceed.

## 1. Shell rendering: **SPA**

The Vue 3 shell is a single-page application. Vite bundles, the kernel serves the static bundle, hydration is purely client-side. No SSR.

**Why:** Astro's SSR convenience is not worth the Vite-SSR setup cost for a single-tenant developer tool. Cold-load is a non-issue at the scales we serve (one user per kernel). If we ever need SSR for SEO or public surfaces, we revisit — but that's not what the kernel does today.

**Consequences:**
- M7 builds a Vite SPA, no server-side rendering plumbing.
- M9's Astro-page port is a route-by-route mapping into Vue components, not an SSR equivalence.
- Initial-load placeholders are skeleton elements (`<comtrya-skeleton>` already in sdk-core), not server-rendered content.

## 2. Frontend stack: **Vite + Vue, drop Astro entirely**

No Astro-with-Vue-islands. We delete Astro in M10 and rebuild on Vite.

**Why:** Coexisting Astro and Vue during the migration means double the routing layer, double the bundler config, and ambiguous ownership for shared bits (chrome, theming, error boundaries). A clean Vite project is simpler to reason about and faster to delete from when something is wrong.

**Consequences:**
- M7 creates `frontend/shell-v3/` as a Vite project, not an Astro project.
- M10 deletes `frontend/astro.config.mjs` and every Astro dep without a transition window.
- Any Astro-specific runtime behaviour (image optimisation, route islands, client directives) needs an explicit Vite equivalent if we used it — note in M9 if surprises emerge.

## 3. Demo seed handling: **keep `fixtures/demo/conference.json`; rewrite the seeder to drive WASM bootstrap**

Don't move seeding into per-extension install ops. Keep one seed payload at the repo root; rewrite the kernel-side seeder so it calls each extension's WASM `create` ops instead of writing collection JSON directly.

**Why:** The demo payload is a developer-experience artifact — running `./start.sh` should populate a usable workspace without each extension having to ship its own dev-seed code. Moving seeding into per-extension install ops makes the seed depend on the extension being installed, which means dev environments break when an extension is mid-migration. A single seeder that drives WASM ops at startup keeps the contract clean.

**Consequences:**
- M12 rewrites `ExtensionRuntimeStore::seed_from_demo_payload` to invoke `ext_issues/issues.open-issue`, `ext_pull_requests/pull-requests.open-pr`, etc., per the seed JSON.
- The hardcoded collection shapes in `ensure_schema` move into per-extension `contributes.collections`, but the seed payload itself stays as-is at `fixtures/demo/conference.json`.
- The seed runs on every fresh kernel boot (or on a `--reseed` flag); existing data is left alone.

## 4. GraphQL schema stability: **keep the existing schema; adapt codegen to match**

Existing GraphQL field names (`closeIssue`, `issuesByRefs`, `epicProgress`, etc.) stay. Codegen produces the same field shapes the Astro frontend uses today, so the cutover doesn't ripple into every caller.

**Why:** Breaking the schema means rewriting every Vue component query at the same time as introducing them, and breaks any external consumer that might exist. Keeping the schema means the cutover is purely server-side — clients see no difference.

**Consequences:**
- Codegen's `kebab_to_camel` already maps WIT op names to GraphQL fields (`close-issue` → `closeIssue`). Verify each generated field name matches the existing schema field name during M3; rename WIT ops if they don't.
- The few places where the WIT input record shape differs from today's GraphQL input variables (e.g. WIT `record close-issue-input { id, reason }` vs today's GraphQL `closeIssue(id, reason)`) need a thin adapter in the generated dispatch handler. The codegen should wrap the GraphQL variables into the WIT input record on the way in.
- If a WIT op genuinely cannot produce a backward-compatible field name, document the break in `docs/v3-decisions.md` (this file) under "GraphQL deviations" before merging the relevant milestone.

## 5. Toolchain versions: **pin current**

For the duration of the cutover:

- **Wasmtime:** `43.0.2` (already in `crates/server/Cargo.toml`). Transitively brings in `wit-bindgen 0.51` and `wit-bindgen 0.57` (different crates use different sides of the bindgen).
- **wit-parser:** `0.235` (codegen crate)
- **cargo-component:** `0.21.1` (pinned at M1 first use, installed via `cargo install cargo-component --locked --version 0.21.1`)
- **wit-bindgen-rt:** `0.44` — the latest published version on crates.io as of the M1 first build. Used by each per-extension component crate. Empirically ABI-compatible with wasmtime 43.0.2: the M1 smoke test (`wasm_host::m1_ext_issues_smoke::close_issue_round_trip`) round-trips records, enums, options, lists, and `result<T, error>` between Rust component code and Rust host code without divergence. The Component-Model canonical ABI for the types in play (plain records, scalars, strings, options, results, lists, variants) has been stable since CM 0.2.0 finalised. If a future milestone introduces resource handles or async, re-verify before assuming the pin still holds.

**Why:** Toolchain churn during a multi-milestone migration is the fastest way to lose a day to a bindgen regression. We pin, we ship, we upgrade in a separate workstream after M13.

**Consequences:**
- M1's first `cargo component` invocation locks the cargo-component + wit-bindgen versions. Record them in this file as soon as they're known.
- Any upgrade during the cutover requires its own commit + adversarial review pass.
