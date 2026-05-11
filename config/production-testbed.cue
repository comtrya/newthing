package comtrya

instance: {
	id:          "comtrya-production-testbed"
	name:        "Comtrya Production Testbed"
	publicURL:   "https://comtrya.localhost"
	environment: "production"
	allowedOrigins: ["https://comtrya.localhost"]
}

database: {
	kind: "sqlite"
	url:  "sqlite:///private/tmp/comtrya-production-testbed/metadata/comtrya.db"
}

oidc: issuers: [{
	id:           "testbed"
	issuerURL:    "https://issuer.example.test"
	clientID:     "comtrya"
	clientKind:   "confidential"
	clientSecret: "replace-with-real-oidc-client-secret"
	redirectURL:  "https://comtrya.localhost/auth/oidc/testbed/callback"
	allowed: domains: ["example.test"]
}]

storage: repositories: {
	default: "local"
	backends: local: {
		kind: "local"
		path: "/private/tmp/comtrya-production-testbed/repositories"
	}
}

authz: kind: "spicedb"

workspaces: default: {
	name: "Default"
	visibility: "PRIVATE"
}
