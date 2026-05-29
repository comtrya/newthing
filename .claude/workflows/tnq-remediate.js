export const meta = {
  name: 'tnq-remediate',
  description: 'Apply the thermo-nuclear review findings per crate, one fixer agent per area, each verifying its own gates',
  phases: [{ title: 'Remediate', detail: 'one fixer agent per crate/area' }],
}

const RULES = `
Project hard rules (this is the comtrya Rust workspace + frontend):
- NO backwards-compat, NO legacy aliases/routes, NO dead code. Delete unused code rather than keeping it. Assume no production users/data.
- NO #[allow(...)] / eslint-disable to silence lints. Clippy runs with -D warnings AND --all-targets.
- Type structured data at module/public-API boundaries; parse untyped input once at the edge; no stringly-typed payloads.
- WIT is the contract; codegen and dispatch must stay GENERIC — never special-case a specific extension (issues/epics/pulls/checks).
- Prefer small single-purpose files/functions.
You are editing the REAL working tree in place. Do NOT git commit — just edit files. Make minimal, surgical, correct changes.
Before deleting a symbol, grep the whole repo to confirm it is truly unreferenced (including tests, generated code, and frontend). If a deletion would break compilation, wire it correctly or skip that one finding and report why — never leave the crate broken.`

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    area: { type: 'string' },
    applied: { type: 'array', items: { type: 'string' } },
    skipped: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' }, reason: { type: 'string' } },
        required: ['title', 'reason'],
      },
    },
    files_changed: { type: 'array', items: { type: 'string' } },
    gates_passed: { type: 'boolean' },
    gate_output_tail: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['area', 'applied', 'skipped', 'files_changed', 'gates_passed', 'notes'],
}

// Per-area: the verify command and any cross-cutting decisions/caveats.
const AREAS = [
  {
    key: 'extension-oci',
    verify: 'cargo clippy -p comtrya-extension-oci --all-targets -- -D warnings && cargo test -p comtrya-extension-oci',
    extra:
      'DECISION: KEEP this crate. TODO.md tracks "wire OCI extension installation into startup" as deferred-but-intended, so it is NOT dead code. Skip the "entire crate unconsumed" finding (mark skipped: kept per TODO.md/maintainer decision) and do NOT remove ExtensionSource::Oci anywhere. Apply the real hardening: verify each pulled layer\'s sha256 against the manifest descriptor digest; build digest refs with "@" not ":"; use the typed OciReference at the boundary; select the layer by media type, not layers[0]; store the verified digest in CacheMetadata.content_digest. CAVEAT for the WASM-version finding: component binaries legitimately use header version 0x0d / layer 0x01 (NOT 1) — do NOT bail on `!= 1`; recognize the component encoding and only reject a truly-unknown version (or drop the brittle check and rely on the loader). Add focused tests for digest-mismatch rejection.',
  },
  {
    key: 'git-http',
    verify: 'cargo clippy -p comtrya-git-http --all-targets -- -D warnings && cargo test -p comtrya-git-http',
    extra:
      'Delete the dead receive-pack parsing block + its tests, the unused per-route axum handlers (keep `dispatch`), the env-gated git-subprocess backend (keep the pure-Rust path), the placeholder negotiation module + its `pub mod` line, and the unused PackBuildStats. Rewrite the stale "scaffold/501 placeholder" module doc comments to describe the implemented read-only v2 surface. For resolve_want_refs: surface an unresolvable want-ref as an error / pkt-line ERR rather than swallowing it into an empty pack.',
  },
  {
    key: 'wit-codegen',
    verify: 'cargo clippy -p comtrya-wit-codegen --all-targets -- -D warnings && cargo test -p comtrya-wit-codegen',
    extra:
      'Delete the unused OpSpec.input_schema/output_schema fields and the entire ty_to_schema/ty_to_schema_guarded machinery (this also resolves the recursion-guard bug — no need to fix code you are deleting). Remove the cosmetic OpKind enum / classify_op_name / kind field / unused serde derives; derive method_name via kebab->camel at render time. Fix the module doc (it emits a TS client, not "Rust dispatch arms") and the generated banner. Regenerate any generated artifacts from source rather than hand-editing them; update test literals to match.',
  },
  {
    key: 'cli',
    verify: 'cargo clippy -p comtrya-cli --all-targets -- -D warnings && cargo test -p comtrya-cli',
    extra:
      'Remove the undocumented `global-config`/`comtrya.cue` subcommand aliases (accept only `config`). Make `--dir`/`-d` reject a following value that starts with `-` (exit 2). Reject `--dir`/`--force` combined with `--stdout` (exit 2). Remove the no-input backup/restore demo subcommands from the shipped CLI surface (exercise BackupCoordinator via a core unit test instead if needed); update help text and any RUNBOOK references.',
  },
  {
    key: 'core',
    verify: 'cargo clippy -p comtrya-core --all-targets -- -D warnings && cargo test -p comtrya-core',
    extra:
      'DECISIONS: (a) DELETE the ExtensionHost + GraphqlComposer SDL-composition path (GOAL.md forbids extension GraphQL/SDL machinery; it is unexercised). (b) For events.rs: the live merge-reactor/EventEnvelope path STAYS; delete ONLY the genuinely-dead SSE serialization, visibility-filter, and cursor-resume surface, and replace any hand-built JSON string interpolation with serde. (c) KEEP TokenAction (production-used) but delete the dead CorePermission variants and the dead exchange_token/ScopedCredential path. (d) KEEP ExtensionSource::Oci and all OCI plumbing (the crate is staying). (e) KEEP ActiveDegraded (it is read). Other findings: delete the dead extension_storage.rs module + its lib.rs mod/use; delete JobOutcome; remove the test-only activate_with_failure_after_migration from production API; move reference_pull_requests() out of generic core into a test-support module; add #[serde(deny_unknown_fields)] to the Wire* config structs (+ make parse_visibility a closed parse, erroring on unknown values, threading Result through into_domain); wire ceilings through config or delete the inert ceiling fields/validation; serialize effective_config_json from a typed struct (or remove the misleading field); make login actually update existing users\' claims; attribute auth events to the real instance/workspace ref instead of a fabricated ULID; make claim_next honor (run_after_ms, enqueue-order); make commit_receive_pack fail-closed when config validation was required; delete CheckRegistry (checks.rs) + its lib.rs exports + MetadataStore.checks; thread a real clock into EventEnvelope/JobRecord timestamps; delete SPICEDB_MODEL_SKETCH; fix can_read_visibility to pick the read permission by resource kind (or delete the dead helpers); fix the Slug error to use err.message; collapse the theatrical lifecycle no-op assignments; for GraphqlGateway/InMemoryRepoStorage, if truly unused in production delete them, else at minimum replace format!-built manifest JSON with serde. Add/adjust tests for each behavioral change.',
  },
  {
    key: 'server',
    verify: 'cargo clippy -p comtrya-server --all-targets -- -D warnings && cargo test -p comtrya-server',
    extra:
      'DEFER the purely-mechanical 10.5k-line main.rs file split (note it; do not produce a giant unreviewable move-only diff) BUT DO fix the substance: replace the hand-rolled, extension-specific GraphQL field tokenizer + hardcoded relations.*/comments.* substring dispatch with typed/generic routing (hard-rule violation). Concrete fixes: derive viewer.permissions from the real PrincipalStatus (empty for Anonymous) instead of a hardcoded admin stub; use ONE shared indexed_fields extractor for create+update paths (preserve derived keys); enforce per-record author/owner on relations/comments edit/delete, not just the coarse permission; add an invalidated-on-write in-memory parse cache (or at least owner+collection-filtered loading) instead of reparsing the whole JSONL each read; delete the dead duplicate head/base keys in pull_request_to_json (keep headRef/baseRef); use a parameterized rusqlite Transaction for migrations instead of interpolating the filename into SQL; introduce a typed #[derive(Deserialize)] wire-manifest struct parsed once instead of duplicated json.pointer walks; make graphql_post return 400 on malformed JSON (still allow well-formed empty query); fix the wasm_invokers ABI docstring; drop the commitOid back-compat alias (keep commitOID); give config_sync poll() the same self-heal as bootstrap_and_load. KEEP all OCI plumbing (ExtensionSource::Oci, unsupported_oci_extension stub). Add/adjust tests for behavioral changes.',
  },
  {
    key: 'extensions',
    verify: 'cargo check -p ext_pull_requests 2>/dev/null || true; echo "(component crates may need cargo-component; verify source compiles best-effort)"',
    extra:
      'Make the ext_pull_requests PR-number assignment atomic using the same _meta atomic-counter pattern ext_issues uses (per-scope counter doc, update-begin/commit, seed-on-NotFound, bounded retry) instead of the racy scan-max next_number. Delete the orphaned legacy example extension that uses the retired v1 manifest/contract shape (extensions/examples/pull-requests or similar). Fix ext_issues manifest witWorld to point at its own ext-issues world, not the platform world. Verify the component source compiles (cargo check on the component crate if the wasm target/cargo-component is available; otherwise confirm by reading that types line up).',
  },
  {
    key: 'frontend',
    verify: 'cd frontend && bun run typecheck && bun run build && bun test',
    extra:
      'SAFE DELETIONS / NON-RENDERED CHANGES ONLY (per the UI hard rule, anything that changes rendered behavior needs browser verification which is unavailable here). DO: delete dead modules/components confirmed unimported (workspace-home-slots.ts, Sparkline.vue, Avi.vue, Kv.vue and their orphaned CSS), delete dead exports (repositoryHomeSlots/RepositoryHomeSlotName), remove unused deps @pierre/trees and @pierre/diffs from package.json (bun install to update lock), add the undeclared mermaid/@terrastruct/d2 deps to sdk-vue package.json, delete the orphaned example extension UI, fix the UseOpState.error conditional type to the real OpResult error shape, unify the registries\' shared-state strategy, remove the legacy back-compat manifest comment, and drop the `export` keyword on CORE_COMMENT_THREAD_ELEMENT (do NOT make extensions import it cross-bundle). SKIP and report (need browser verification): useProjectCounts genericization (#12), ProjectHome.load abort guard (#57), clickable <code> keyboard a11y (#89), and the route-precedence test refactor only if it changes runtime. Run typecheck + build + bun test as the gate.',
  },
  {
    key: 'docs-schema',
    verify: 'python3 -c "import json,sys; [json.load(open(p)) for p in [\\"docs/manifest.schema.json\\"]]" && echo schema-ok',
    extra:
      'Fix docs/extensions.md so allowedEventReads is described as "extension ids whose events this extension may read" (not event types). Delete the stale migrations/postgres directory (no Postgres backend exists). Constrain manifest.schema.json reactor.subscribes to the event-pattern grammar (allow per-segment `*` wildcards, unlike allowedEmits) and update any fixtures/tests. Also delete the retired wit/comtrya-extension.wit GraphQL-resolver contract and any WIT_SKETCH/stale references to comtrya:extension/extension (keep the live extension code).',
  },
]

const byKey = Object.fromEntries(AREAS.map((a) => [a.key, a]))
function runArea(key) {
  const a = byKey[key]
  return agent(
    `${RULES}\n\n=== AREA: ${a.key} ===\n` +
      `Read /tmp/tnq-remaining.json and extract the findings under .areas["${a.key}"] (e.g. \`python3 -c 'import json;print(json.dumps(json.load(open("/tmp/tnq-remaining.json"))["areas"]["${a.key}"],indent=1))'\`). ` +
      `Each finding has title/severity/file/line/evidence/why/fix. Apply every one you can, honoring this area's specific guidance below.\n\n` +
      `AREA GUIDANCE:\n${a.extra}\n\n` +
      `When done, run the gate: \`${a.verify}\` and ensure it passes (fix anything you broke). ` +
      `Then return the structured report: which findings you applied (by title), which you skipped (title + reason), the files you changed, whether the gate passed, and a short notes field for anything the human reviewer must know (e.g. deferred items, tests added, surprises).`,
    { label: `fix:${a.key}`, phase: 'Remediate', schema: REPORT_SCHEMA }
  ).catch((e) => ({
    area: a.key,
    applied: [],
    skipped: [],
    files_changed: [],
    gates_passed: false,
    notes: `agent errored: ${String(e).slice(0, 300)}`,
  }))
}

phase('Remediate')
// Wave 1: independent crates (no internal deps) + non-cargo areas. Wave 2:
// cli/server, which build core/git-http/wit-codegen and so must run only after
// those crates are stable.
const WAVE1 = ['core', 'git-http', 'extension-oci', 'wit-codegen', 'extensions', 'frontend', 'docs-schema']
const WAVE2 = ['cli', 'server']
log(`Wave 1 (independent): ${WAVE1.join(', ')}`)
const r1 = await parallel(WAVE1.map((k) => () => runArea(k)))
log(`Wave 2 (depend on core/git-http): ${WAVE2.join(', ')}`)
const r2 = await parallel(WAVE2.map((k) => () => runArea(k)))

const reports = [...r1, ...r2].filter(Boolean)
const ok = reports.filter((r) => r.gates_passed).map((r) => r.area)
const bad = reports.filter((r) => !r.gates_passed).map((r) => r.area)
log(`Gates passed: [${ok.join(', ')}]  |  needs attention: [${bad.join(', ')}]`)

return { reports }
