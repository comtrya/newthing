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
}
