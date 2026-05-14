package comtrya

projects: frontend: {
	root:   "."
	labels: ["shell", "typescript", "vue"]
	owners: ["frontend-maintainers"]

	docs: {
		prd: {
			slug:  "docs/prds"
			label: "Frontend PRDs"
			properties: {
				title:  "string"
				status: "string"
				owner:  "string"
			}
		}
	}

	// Opt the frontend Project out of the PR merge reactor's
	// auto-close path. The CUE schema for `issues` is registered by
	// ext_issues via contributes.cueSchemas; setting closeOnMerge
	// here causes new issues opened from this Project's page to be
	// stamped with the field, and the reactor in ext_pull_requests
	// reads it via `by-ref-issue` before deciding to close.
	issues: {
		defaultLabels: ["frontend"]
		closeOnMerge:  false
	}
}
