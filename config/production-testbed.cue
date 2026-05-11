package forgepoint

instance: {
	id:          "forgepoint-production-testbed"
	name:        "Forgepoint Production Testbed"
	publicURL:   "https://forgepoint.localhost"
	environment: "production"
	allowedOrigins: ["https://forgepoint.localhost"]
}

database: {
	kind: "sqlite"
	url:  "sqlite:///private/tmp/forgepoint-production-testbed/metadata/forgepoint.db"
}

oidc: issuers: [{
	id:           "testbed"
	issuerURL:    "https://issuer.example.test"
	clientID:     "forgepoint"
	clientKind:   "confidential"
	clientSecret: "replace-with-real-oidc-client-secret"
	redirectURL:  "https://forgepoint.localhost/auth/oidc/testbed/callback"
	allowed: domains: ["example.test"]
}]

storage: repositories: {
	default: "local"
	backends: local: {
		kind: "local"
		path: "/private/tmp/forgepoint-production-testbed/repositories"
	}
}

authz: kind: "spicedb"

workspaces: default: {
	name: "Default"
	visibility: "PRIVATE"
}
