-- Schema migration 0006 — Refresh tokens table for OIDC device CLI flow (#128).
-- Stores long-lived OIDC-derived credentials securely.
--
-- Features SHA-256 hashing (token_hash), family_id for rotation,
-- stable user identity linking, and observation tracking.

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  owner_principal_uri TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  consumed_at INTEGER,
  replaced_by TEXT,
  revoked_at INTEGER
);

CREATE INDEX refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens(family_id);
