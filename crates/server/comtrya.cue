package comtrya

projects: kernel: {
	root:   "."
	labels: ["kernel", "rust", "wasmtime", "graphql"]

	// Typed owners — each entry's `kind` discriminator picks the
	// canonical URN scheme; the kernel derives `ref` from `slug`.
	owners: [
		{kind: "team", slug: "platform-maintainers"},
		{kind: "user", slug: "rawkode"},
	]

	docs: {
		adr: {
			slug:        "docs/adrs"
			label:       "Kernel ADRs"
			description: "Accepted architectural decisions for the Comtrya kernel."
			properties: {
				title:  "string"
				status: "string"
				date:   "string"
				// Author is a typed principal ref. Doc-type properties
				// declare the *expected shape*; ext_docs' schema
				// validates front-matter values against it.
				author: "principal-ref"
			}
		}
		spec: {
			slug:  "docs/specs"
			label: "Kernel Specs"
			properties: {
				title:  "string"
				owner:  "principal-ref"
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

	epics: {
		defaultLabels:  ["kernel"]
		defaultStatus:  "planned"
		requiredFields: ["title"]
	}
}
