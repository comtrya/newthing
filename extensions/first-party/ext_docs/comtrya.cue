package comtrya

projects: ext_docs: {
	root:   "."
	labels: ["extension", "rust", "wasm", "typescript", "vue"]

	owners: [
		{kind: "team", slug: "platform-maintainers"},
	]

	docs: {
		rfc: {
			slug:  "docs/rfcs"
			label: "Docs Extension RFCs"
			properties: {
				title:  "string"
				status: "string"
				author: "principal-ref"
			}
		}
	}
}
