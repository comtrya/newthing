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
	// features are off by default, so the root comtrya.cue opts the
	// whole repo into the first-party work surfaces once. Projects
	// inherit this enablement; per-project `issues` / `epics` blocks
	// are policy defaults, not feature toggles. ext_epics is listed so
	// project epics and issue-to-epic relationships are available to
	// every project in this repo. ext_docs is listed so project-owned
	// ADRs, specs, PRDs, and BDD scenarios render through the repository
	// docs surface instead of living as untyped files.
	extensions: ["ext_issues", "ext_pull_requests", "ext_checks", "ext_epics", "ext_docs"]

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

projects: backend: {
	root: "crates"
	labels: ["backend", "rust", "wasmtime", "graphql"]

	owners: [
		schema.#OwnerRef & {kind: "team", slug: "platform-maintainers"},
		schema.#OwnerRef & {kind: "user", slug: "rawkode"},
	]

	docs: {
		adr: {
			slug:        "server/docs/adrs"
			label:       "Backend ADRs"
			description: "Accepted architectural decisions for the Comtrya backend."
			properties: {
				title:  "string"
				status: "string"
				date:   "string"
				author: "principal-ref"
			}
		}
		spec: {
			slug:  "server/docs/specs"
			label: "Backend Specs"
			properties: {
				title:  "string"
				owner:  "principal-ref"
				status: "string"
			}
		}
		prd: {
			slug:        "server/docs/prds"
			label:       "Backend PRDs"
			description: "Product requirements for backend-owned forge capabilities."
			properties: {
				title:    "string"
				owner:    "principal-ref"
				status:   "string"
				audience: "string"
			}
		}
		scenario: {
			slug:        "server/docs/scenarios"
			label:       "BDD Scenarios"
			description: "Behavior scenarios that describe user-visible forge workflows."
			properties: {
				title:   "string"
				feature: "string"
				owner:   "principal-ref"
				status:  "string"
				tags:    "[...string]"
			}
		}
	}

	pulls: {
		autoMerge: false
		requiredChecks: ["cargo test", "cargo clippy"]
	}

	issues: {
		defaultLabels: ["backend"]
		closeOnMerge: true
	}

	epics: {
		defaultLabels: ["backend"]
		defaultStatus: "planned"
		requiredFields: ["title"]
	}

	checks: {
		catalog: {
			"cargo test": {
				displayName: "cargo test"
				required:    true
			}
			"cargo clippy": {
				displayName: "cargo clippy"
				description: "Run with `-D warnings`; warnings are errors."
				required:    true
			}
		}
	}
}
