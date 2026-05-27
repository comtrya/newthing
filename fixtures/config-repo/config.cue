package comtrya

// Bundled GitOps config fixture. start.sh materialises this directory into a
// local git repo and points COMTRYA_CONFIG_REPO_URL at it. Production
// deployments point COMTRYA_CONFIG_REPO_URL at their own CUE config repo.

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

// Issuer id matches the frontend's default OIDC provider
// (DEFAULT_OIDC_LOGIN_PATH = "/auth/oidc/google/login") so the sign-in path
// resolves in the testbed. Replace with your real IdP in production.
oidc: issuers: [{
	id:           "google"
	issuerURL:    "https://issuer.example.test"
	clientID:     "comtrya"
	clientKind:   "confidential"
	clientSecret: "replace-with-real-oidc-client-secret"
	redirectURL:  "https://comtrya.localhost/auth/oidc/google/callback"
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
	name:       "Default"
	visibility: "PRIVATE"
}
