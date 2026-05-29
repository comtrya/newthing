CREATE TABLE git_personal_access_tokens (
  id TEXT PRIMARY KEY,
  owner_principal_uri TEXT NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  revoked_at INTEGER
);

CREATE INDEX git_personal_access_tokens_owner_idx
  ON git_personal_access_tokens(owner_principal_uri, revoked_at, expires_at);

