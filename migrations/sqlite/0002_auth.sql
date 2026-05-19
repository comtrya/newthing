-- Durable auth storage (#9, #12). Replaces the in-memory
-- `Mutex<HashMap>` for sessions / credentials / rate-limit counters
-- inside `crates/server/src/main.rs`. Tokens are opaque bearer
-- strings the kernel hands out; the row keyed by the token IS the
-- record. PrincipalStatus is stored as its serde-rendered tag (the
-- enum variant name); deserialisation rejects unknown values so a
-- schema-change here that adds a new variant requires a writer +
-- reader rollout.

CREATE TABLE sessions (
  -- Bearer token, 5-char prefix + 32 hex chars (see next_secure_token).
  token TEXT PRIMARY KEY,
  -- Serde-rendered PrincipalStatus tag (e.g. "OperatorCredential").
  principal TEXT NOT NULL,
  -- Unix seconds. Compared against `now_seconds()` at consume time.
  expires_at INTEGER NOT NULL,
  -- Single-use marker for event-stream sessions.
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE credentials (
  token TEXT PRIMARY KEY,
  principal TEXT NOT NULL,
  principal_uri TEXT NOT NULL,
  -- JSON array of granted actions (string list). Kept as TEXT not
  -- normalised because the action set is small per credential and
  -- always read whole.
  actions_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX credentials_expires_at_idx ON credentials(expires_at);

CREATE TABLE rate_limits (
  -- Bucket name, e.g. "graphql" or "api_ops".
  bucket TEXT NOT NULL,
  -- Minute slot (now_seconds() / 60).
  minute INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (bucket, minute)
);

-- Cleanup index — eviction walks (`SELECT … WHERE minute < ?`).
CREATE INDEX rate_limits_minute_idx ON rate_limits(minute);
