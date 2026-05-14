package comtrya

projects: ext_docs: {
	root:   "."
	labels: ["extension", "rust", "wasm", "typescript", "vue"]
	owners: ["platform-maintainers"]

	docs: {
		rfc: {
			slug:  "docs/rfcs"
			label: "Docs Extension RFCs"
			properties: {
				title:  "string"
				status: "string"
			}
		}
	}
}
