package comtrya

projects: kernel: {
	root:   "."
	labels: ["kernel", "rust", "wasmtime", "graphql"]
	owners: ["platform-maintainers"]

	docs: {
		adr: {
			slug:        "docs/adrs"
			label:       "Kernel ADRs"
			description: "Accepted architectural decisions for the Comtrya kernel."
			properties: {
				title:  "string"
				status: "string"
				date:   "string"
				author: {ref: "string", name: "string"}
			}
		}
		spec: {
			slug:  "docs/specs"
			label: "Kernel Specs"
			properties: {
				title:  "string"
				owner:  "string"
				status: "string"
			}
		}
	}

	pulls: {
		autoMerge:      false
		requiredChecks: ["cargo test", "cargo clippy"]
	}

	issues: {
		defaultLabels: ["kernel"]
		closeOnMerge:  true
	}
}
