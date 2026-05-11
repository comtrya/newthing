package forgepoint

instance: {
	id:          "forgepoint-dev"
	name:        "Forgepoint Dev"
	publicURL:   "http://localhost:8080"
	environment: "development"
	allowedOrigins: ["http://localhost:4321"]
}

database: {
	kind: "sqlite"
	url:  "sqlite://forgepoint.db"
}

oidc: issuers: [{
	id:          "dev"
	issuerURL:   "https://issuer.example.test"
	clientID:    "forgepoint"
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
