package comtrya

// Kernel-level, per-repo settings. The forge reads these to project
// the repo to its JSON API; CUE is the source of truth where present,
// shell defaults are used otherwise. Lives at the repo root by
// convention so the discovery walk prefers it over nested instances.
repository: {
	visibility:    "private"
	defaultBranch: "v3"
	vcs:           "git"
	description:   "Comtrya — a self-hosted Git forge and product-management platform built around a Rust kernel and WIT-typed extensions."
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
	// epics, repos, boards) speaks the same vocabulary.
	labels: [
		// Plain labels.
		{name: "good-first-issue", color: "#3aa676", description: "Approachable for a new contributor."},
		{name: "needs-design", color: "#b5651d"},

		// Typed non-exclusive: `kind::ux`, `kind::plumbing` (a single
		// piece of work can be both — UX-driven plumbing).
		{type: "kind", value: "ux", color: "#5b6ed8", description: "User-visible UX or product surface."},
		{type: "kind", value: "plumbing", color: "#7a7a7a"},
		{type: "kind", value: "bug", color: "#d04848"},

		// Typed exclusive: priority is a single value per labelled
		// thing; the catalog enforces the mutual-exclusion.
		{type: "priority", value: "p0", exclusive: true, color: "#d04848", description: "Drop-everything."},
		{type: "priority", value: "p1", exclusive: true, color: "#d99847"},
		{type: "priority", value: "p2", exclusive: true, color: "#9c9c34"},
	]
}
