CREATE TABLE ssh_public_keys (
  id TEXT PRIMARY KEY,
  owner_principal_uri TEXT NOT NULL,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  key_type TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  removed_at INTEGER
);

CREATE UNIQUE INDEX ssh_public_keys_fingerprint_owner_idx
  ON ssh_public_keys(owner_principal_uri, fingerprint)
  WHERE removed_at IS NULL;

CREATE INDEX ssh_public_keys_owner_idx
  ON ssh_public_keys(owner_principal_uri, removed_at);
