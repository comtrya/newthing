package comtrya

import "github.com/comtrya/comtrya/schema"

projects: extensions: {
	root: "."
	labels: ["extensions", "rust", "wasm", "typescript", "vue"]

	owners: [
		schema.#OwnerRef & {kind: "team", slug: "platform-maintainers"},
	]

	docs: {
		rfc: {
			slug:  "first-party/ext_docs/docs/rfcs"
			label: "Extension RFCs"
			properties: {
				title:  "string"
				status: "string"
				author: "principal-ref"
			}
		}
	}

	issues: {
		defaultLabels: ["extensions"]
		closeOnMerge: true
	}

	epics: {
		defaultLabels: ["extensions"]
		defaultStatus: "planned"
	}

	sprints: {
		cadence:         "weekly"
		defaultCapacity: 6
	}
}
