package comtrya

instance: {
	id:          "comtrya-dev"
	name:        "Comtrya Dev"
	publicURL:   "http://localhost:8080"
	environment: "development"
	allowedOrigins: ["http://localhost:4321"]
}

database: {
	kind: "sqlite"
	url:  "sqlite://comtrya.db"
}

oidc: issuers: [{
	id:          "dev"
	issuerURL:   "https://issuer.example.test"
	clientID:    "comtrya"
	clientKind:  "confidential"
	clientSecret: "dev-secret"
	redirectURL: "http://localhost:8080/auth/oidc/dev/callback"
	allowed: domains: ["example.test"]
}]

storage: repositories: {
	default: "local"
	backends: local: {
		kind: "local"
		path: "./data/repos"
	}
}

authz: kind: "spicedb"

workspaces: default: {
	name: "Default"
	visibility: "PRIVATE"
}

// Extensions to install on boot. Each entry references a Wasm Component Model
// artifact, either by OCI reference or by local filesystem path. The CUE
// parser in v3 is still gaining typed support; until then the loader treats
// this section as documentation and defers to filesystem-discovered first-
// party extensions. See SPEC.md §extensions for the full contract.
extensions: [
	{
		id: "pull-requests"
		source: {
			kind: "oci"
			registry: "ghcr.io"
			image: "comtrya/extensions/pull-requests"
			reference: "v1.0.0"
		}
		enabled: true
	},
	{
		id: "code-browser"
		source: {
			kind: "oci"
			registry: "ghcr.io"
			image: "comtrya/extensions/code-browser"
			reference: "v1.0.0"
		}
		enabled: true
	},
	{
		id: "checks"
		source: {
			kind: "oci"
			registry: "ghcr.io"
			image: "comtrya/extensions/checks"
			reference: "v1.0.0"
		}
		enabled: true
	},
]
