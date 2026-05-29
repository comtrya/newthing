export const meta = {
  name: 'thermo-nuclear-code-quality-review',
  description: 'Exhaustive, adversarially-verified code quality review across every subsystem and lens; returns deduped, confirmed, prioritized findings with proposed fixes',
  whenToUse: 'Drive a codebase toward impeccable: fan out finders over (area x lens), refute each finding adversarially, dedupe, and synthesize a ranked plan. Re-run between fix rounds until it returns zero confirmed findings.',
  phases: [
    { title: 'Review', detail: 'one finder per (area x lens) — read-only, structured findings' },
    { title: 'Verify', detail: 'adversarial refutation of each finding against the real source' },
    { title: 'Synthesize', detail: 'dedupe, rank, and write the report' },
  ],
}

// ---------------------------------------------------------------------------
// Shared rubric. Every finder gets the project's hard rules so findings are
// scored against THIS codebase's standards, not generic ones.
// ---------------------------------------------------------------------------
const RUBRIC = `
You are a ruthless, senior code reviewer doing a THERMO-NUCLEAR quality pass on the comtrya
codebase. The bar is "impeccable". Report only TRUE, ACTIONABLE issues backed by specific
file:line evidence you actually read. Do NOT invent issues to pad the list; an empty list is a
valid and good result for clean code.

Project hard rules (violations are findings):
- NO backwards-compat layers, migration shims, compat aliases, deprecated/legacy routes or
  handlers unless explicitly required. Assume no production users/data.
- NO dead code: unused handlers, exports, generated files, deps, or stale docs must be deleted.
  If a replacement exists, the old path must be gone.
- NO broad #[allow(...)]/#![allow(...)] or warning suppressions to hide unused/lint-failing code.
- Clippy runs with -D warnings (warnings are errors), including --all-targets.
- Type & data boundaries: model structured data with typed Rust/TS values at module & public API
  boundaries; avoid stringly-typed payloads; parse untyped input once at the edge.
- WIT is the contract. Codegen must stay GENERIC — it must not special-case a specific extension
  (issues/epics/pulls/checks). No legacy GraphQL aliases or extension-specific dispatch.
- Prefer small, single-purpose files & functions. Flag god-files/functions and hidden shared state.
- Conventional Commits, typed errors at boundaries.

Severity:
- P0: correctness/security bug, data loss, panic on reachable input, auth bypass, broken contract.
- P1: likely-wrong behavior, resource/concurrency hazard, hard rule violation with real impact.
- P2: maintainability/dead-code/boundary issues, missing validation, risky patterns.
- P3: minor polish, naming, small redundancy.

Categories: correctness | security | concurrency | dead-code | legacy-compat | type-boundary
| wit-contract | error-handling | performance | maintainability | tests-docs | style.

For each finding give: title, severity, category, file, line (or range), evidence (the actual
code/why it's wrong), why (impact), fix (concrete change), confidence (high/medium/low).
Read the cited code before reporting. Prefer precision over volume.`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          category: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'string' },
          evidence: { type: 'string' },
          why: { type: 'string' },
          fix: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['title', 'severity', 'category', 'file', 'line', 'evidence', 'why', 'fix', 'confidence'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    real: { type: 'boolean' },
    severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
    reason: { type: 'string' },
    fix_assessment: { type: 'string' },
  },
  required: ['real', 'severity', 'reason', 'fix_assessment'],
}

// ---------------------------------------------------------------------------
// Review units: (area x focused lenses). Split the giant server/core files so
// each finder owns a bounded, readable surface.
// ---------------------------------------------------------------------------
const UNITS = [
  { key: 'server-http',     focus: 'HTTP routing, request handlers, response shaping, status/error mapping, panics & unwrap on request paths, dead/legacy routes', paths: 'crates/server/src/main.rs' },
  { key: 'server-wasm-host', focus: 'Wasmtime Component Model host: store/linker setup, resource lifetimes, fuel/epoch limits, trap handling, host-call safety', paths: 'crates/server/src/wasm_host.rs' },
  { key: 'server-wasm-invoke', focus: 'extension invocation & registry: dispatch genericity (NO per-extension special cases), error propagation, caching, concurrency', paths: 'crates/server/src/wasm_invokers.rs crates/server/src/wasm_registry.rs' },
  { key: 'server-config',   focus: 'cue_config/config_sync/persistence/reconcile: parsing, validation-once-at-edge, transactional correctness, partial-failure handling', paths: 'crates/server/src/cue_config.rs crates/server/src/config_sync.rs crates/server/src/persistence.rs crates/server/src/reconcile.rs' },
  { key: 'server-oidc',     focus: 'OIDC/auth security: token validation, signature/issuer/aud/nonce/expiry checks, callback CSRF/state, secret handling', paths: 'crates/server/src/oidc.rs' },
  { key: 'core-extensions', focus: 'extension model & storage: lifecycle, manifest handling, generic codegen boundary, dead code', paths: 'crates/core/src/extensions.rs crates/core/src/extension_storage.rs' },
  { key: 'core-config',     focus: 'config/instance_config_eval/frontend_contracts: typed boundaries, stringly-typed payloads, eval correctness', paths: 'crates/core/src/config.rs crates/core/src/instance_config_eval.rs crates/core/src/frontend_contracts.rs' },
  { key: 'core-auth',       focus: 'auth/authz/ids/domain: identity correctness, authorization checks (missing/incorrect), id generation collisions, domain invariants', paths: 'crates/core/src/auth.rs crates/core/src/authz.rs crates/core/src/ids.rs crates/core/src/domain.rs' },
  { key: 'core-events',     focus: 'events/jobs/git_storage/graphql/checks: event ordering, job retry/idempotency, storage consistency, error handling', paths: 'crates/core/src/events.rs crates/core/src/jobs.rs crates/core/src/git_storage.rs crates/core/src/graphql.rs crates/core/src/checks.rs' },
  { key: 'git-http',        focus: 'git smart-http protocol: pack negotiation, ref resolution, path traversal, untrusted input parsing, clippy hygiene (incl. test-module ordering)', paths: 'crates/git-http/src' },
  { key: 'extension-oci',   focus: 'OCI registry pull/push: manifest/digest verification, TLS, path handling, untrusted registry data', paths: 'crates/extension-oci/src' },
  { key: 'wit-codegen',     focus: 'codegen GENERICITY (must not know any specific extension), correctness of generated shapes, dead code', paths: 'crates/wit-codegen/src' },
  { key: 'cli',             focus: 'CLI arg handling, error UX, exit codes, dead code', paths: 'crates/cli/src' },
  { key: 'extensions-be',   focus: 'first-party extension backends: WIT contract adherence, backend-authoritative rules not duplicated/contradicted, no extension-specific dispatch leakage, dead code', paths: 'extensions/first-party' },
  { key: 'wit-contracts',   focus: 'WIT package correctness & generality; docs/schema/migrations kept in sync with contracts', paths: 'wit extensions/wit docs schema migrations' },
  { key: 'frontend-shell',  focus: 'Vue shell/routes/components/core-widgets: type safety (no any), reactivity correctness, dead code, legacy styles/routes, a11y of interactive elements', paths: 'frontend/src' },
  { key: 'frontend-sdk',    focus: 'sdk-core/sdk-vue/sdk-preact packages: public API typing, generic SDK path (no backend-rule duplication), dead exports', paths: 'frontend/packages' },
  { key: 'compat-sweep',    focus: 'CROSS-CUTTING: hunt backwards-compat shims, deprecated/legacy aliases & routes, #[allow]/eslint-disable suppressions, unused deps in Cargo.toml/package.json, stale docs vs code', paths: 'crates extensions frontend docs Cargo.toml frontend/package.json' },
]

function fkey(f) {
  return `${(f.file || '').trim()}::${(f.category || '').trim()}::${(f.title || '').trim().toLowerCase().slice(0, 60)}`
}

// ---------------------------------------------------------------------------
phase('Review')
log(`Thermo-nuclear review: ${UNITS.length} finder units across the workspace`)
if (args && args.baselineGates) log(`Known baseline gate state: ${args.baselineGates}`)

const perUnit = await pipeline(
  UNITS,
  // Stage 1: find
  (u) => agent(
    `${RUBRIC}\n\n=== REVIEW UNIT: ${u.key} ===\nFocused lenses: ${u.focus}\nPaths to review (read these thoroughly): ${u.paths}\n\nReview ALL source under those paths through the focused lenses AND the general rubric. ` +
    `Return every true, actionable finding with real file:line evidence. If the code is clean, return an empty findings array.`,
    { label: `find:${u.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }
  ),
  // Stage 2: adversarially verify each finding for this unit (concurrent)
  (res, u) => {
    const findings = (res && res.findings) || []
    if (!findings.length) return []
    return parallel(findings.map((f) => () =>
      agent(
        `You are an adversarial verifier. A reviewer claims the following issue in the comtrya codebase. ` +
        `Your DEFAULT is to REFUTE: open ${f.file} (around ${f.line}) and the surrounding code, and only confirm if you independently reproduce the problem from the actual source. ` +
        `Reject if the cited code does not exist, the reasoning is wrong, the "issue" is intended/correct behavior, it is already handled elsewhere, or it is speculative.\n\n` +
        `CLAIM\n title: ${f.title}\n severity: ${f.severity}\n category: ${f.category}\n file: ${f.file}\n line: ${f.line}\n evidence: ${f.evidence}\n why: ${f.why}\n proposed fix: ${f.fix}\n\n` +
        `Rules for THIS project (use to judge legitimacy): ${RUBRIC}\n\n` +
        `Return real=true ONLY if you confirmed it against the source. Set the correct severity. In fix_assessment, say whether the proposed fix is correct/safe or what the right fix is.`,
        { label: `verify:${u.key}`, phase: 'Verify', schema: VERDICT_SCHEMA }
      ).then((v) => ({ ...f, unit: u.key, verdict: v })).catch(() => null)
    ))
  }
)

// ---------------------------------------------------------------------------
phase('Synthesize')
const verified = perUnit.flat().filter(Boolean).filter((f) => f.verdict && f.verdict.real)

// Dedupe across units, keep the highest severity instance.
const sevRank = { P0: 0, P1: 1, P2: 2, P3: 3 }
const byKey = new Map()
for (const f of verified) {
  const merged = { ...f, severity: (f.verdict && f.verdict.severity) || f.severity }
  const k = fkey(merged)
  const prev = byKey.get(k)
  if (!prev || sevRank[merged.severity] < sevRank[prev.severity]) byKey.set(k, merged)
}
const confirmed = [...byKey.values()].sort((a, b) => sevRank[a.severity] - sevRank[b.severity])

const counts = confirmed.reduce((m, f) => ((m[f.severity] = (m[f.severity] || 0) + 1), m), {})
log(`Confirmed findings: ${confirmed.length} (P0:${counts.P0 || 0} P1:${counts.P1 || 0} P2:${counts.P2 || 0} P3:${counts.P3 || 0})`)

let report = '_No agent-confirmed findings._'
if (confirmed.length) {
  const lines = confirmed.map((f, i) =>
    `${i + 1}. [${f.severity}/${f.category}] ${f.title}\n   ${f.file}:${f.line}\n   why: ${f.why}\n   fix: ${f.fix}\n   verifier: ${f.verdict.reason} | fix-check: ${f.verdict.fix_assessment}`
  ).join('\n\n')
  const synthInput =
    `Write a concise, prioritized remediation plan for these ADVERSARIALLY-CONFIRMED findings in the comtrya codebase. ` +
    `Group by severity, then by subsystem. For each, give the one-line action. Call out any findings that should be fixed together (same file/refactor). ` +
    `Baseline gate state: ${args && args.baselineGates ? args.baselineGates : 'unknown'}.\n\nFINDINGS:\n${lines}`
  report = await agent(synthInput, { label: 'synthesize', phase: 'Synthesize' })
}

return { confirmed, counts, total: confirmed.length, report }
