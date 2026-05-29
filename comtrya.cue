package comtrya

import "github.com/comtrya/comtrya/schema"

// Kernel-level, per-repo settings. The forge reads these to project
// the repo to its JSON API; CUE is the source of truth where present,
// shell defaults are used otherwise. Lives at the repo root by
// convention so the discovery walk prefers it over nested instances.
//
// Authored against the published `github.com/comtrya/comtrya/schema`
// vocabulary — this repo dogfoods the same module external repos
// consume.
repository: schema.#Repository & {
	visibility:    "private"
	defaultBranch: "v3"
	vcs:           "git"
	description:   "Comtrya — a self-hosted Git forge and product-management platform built around a Rust kernel and WIT-typed extensions."

	// Per-repo extension opt-in (#137). Repository-scoped extension
	// features are off by default; this repo dogfoods issues, pull
	// requests, and checks, so it opts those in explicitly. ext_epics is
	// instance-scoped (an epic spans repos) and is listed for intent /
	// the future per-repo epic page (Phase 2.1) — it is currently a
	// no-op for the gate. Without this, the Phase-2 enforcement would
	// return Forbidden for every repo-scoped feature once it deploys.
	extensions: ["ext_issues", "ext_pull_requests", "ext_checks", "ext_epics"]

	bookmarks: [
		{
			name:        "v3"
			label:       "v3 — live development"
			description: "The long-lived development branch that will land as Comtrya v3."
		},
		{
			name:        "main"
			description: "Last released line. v3 is in flight against this."
		},
	]

	// First-light catalog for the typed-labels primitive. The kernel
	// owns this — any first-party or extension surface (issues, pulls,
	// epics, repos, boards) speaks the same vocabulary. The CUE type
	// is the discriminator: schema.#PlainLabel / schema.#ScopedLabel /
	// schema.#ExclusiveLabel. Wire form for all typed labels is `type::value`
	// regardless of exclusivity; consumers read the kind from the
	// catalog entry.
	labels: [
		// Plain labels.
		schema.#PlainLabel & {name: "good-first-issue", color: "#3aa676", description: "Approachable for a new contributor."},
		schema.#PlainLabel & {name: "needs-design", color: "#b5651d"},

		// Scoped (non-exclusive): a single piece of work can carry
		// `kind::ux` AND `kind::plumbing` — UX-driven plumbing.
		schema.#ScopedLabel & {type: "kind", value: "ux", color: "#5b6ed8", description: "User-visible UX or product surface."},
		schema.#ScopedLabel & {type: "kind", value: "plumbing", color: "#7a7a7a"},
		schema.#ScopedLabel & {type: "kind", value: "bug", color: "#d04848"},

		// Exclusive: a labelled thing carries at most one `priority`
		// value at a time. The catalog enforces the mutual-exclusion.
		schema.#ExclusiveLabel & {type: "priority", value: "p0", color: "#d04848", description: "Drop-everything."},
		schema.#ExclusiveLabel & {type: "priority", value: "p1", color: "#d99847"},
		schema.#ExclusiveLabel & {type: "priority", value: "p2", color: "#9c9c34"},
	]
}
