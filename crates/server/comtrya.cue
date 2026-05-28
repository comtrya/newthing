package comtrya

import "github.com/comtrya/comtrya/schema"

projects: kernel: {
	root:   "."
	labels: ["kernel", "rust", "wasmtime", "graphql"]

	// Typed owners — each entry's `kind` discriminator picks the
	// canonical URN scheme; the kernel derives `ref` from `slug`.
	owners: [
		schema.#OwnerRef & {kind: "team", slug: "platform-maintainers"},
		schema.#OwnerRef & {kind: "user", slug: "rawkode"},
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
