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
