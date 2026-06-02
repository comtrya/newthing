//! Durable auth + session storage for the kernel (#9, #12).
//!
//! Replaces the three `Mutex<HashMap>` collections that previously
//! held sessions, credentials, and per-minute rate-limit counters in
//! `crates/server/src/main.rs`. State survives process restart so
//! `start.sh` smoke probes ("issue session, restart, session still
//! valid") pass and operators can roll the server without dropping
//! in-flight workloads.
//!
//! Storage: SQLite via `rusqlite` (bundled, no system dep). One file
//! at `data_dir/comtrya.db`. All schema lives in `migrations/sqlite/`
//! and is applied in lexical filename order by the embedded runner
//! on every open. The `schema_migrations(version, applied_at)` table
//! tracks which files have already run; re-applying is a no-op.
//!
//! Threading: `rusqlite::Connection` is `Send + !Sync`, so callers
//! reach it via the wrapping `PersistentStore`'s internal `Mutex`.
//! Every method takes `&self` and serialises through that mutex —
//! acceptable here because SQLite already serialises writes inside
//! a single connection, and the workload is dominated by reads that
//! each take <1ms.
//!
//! Eviction: lazy on read for sessions/credentials (expired rows are
//! ignored and culled at lookup time), and a periodic sweep in
//! `evict_expired` for the rate-limit table where staleness is
//! time-based rather than tied to a specific lookup.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};

/// PrincipalStatus mirror — kept here (instead of pulling from `main`)
/// so the persistence crate compiles independently and a future
/// reshuffle that moves the enum doesn't drag this file with it. The
/// serde tags MUST stay in lockstep with `main::PrincipalStatus`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum StoredPrincipal {
    OperatorCredential,
    /// An OIDC-authenticated bearer whose claims matched a configured admin.
    AdminCredential,
    Credential,
    Anonymous,
    Invalid,
}

#[derive(Debug, Clone)]
pub struct StoredCredential {
    pub principal: StoredPrincipal,
    pub principal_uri: String,
    pub actions: Vec<String>,
}

/// Opaque session record returned by admin list_active_sessions.
/// Does NOT contain the bearer token — that is the credential and must
/// never leave the auth boundary.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminSessionRecord {
    /// Opaque stable ID used to revoke the session via the admin API.
    pub session_id: String,
    /// Serde-rendered PrincipalStatus tag (e.g. "Credential").
    pub principal: String,
    /// Unix seconds when the session expires.
    pub expires_at: u64,
    /// Unix seconds when the session was created.
    pub created_at: u64,
}

/// A Git personal access token (PAT) row, sans secret material. The
/// `token_hash` (an argon2id PHC string) never leaves the persistence
/// layer except via [`PersistentStore::lookup_git_personal_access_token_by_id`],
/// which returns it alongside this record so the caller can verify the
/// presented secret before granting scope.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredGitPersonalAccessToken {
    pub id: String,
    pub owner_principal_uri: String,
    pub name: String,
    pub token_prefix: String,
    pub scopes: Vec<String>,
    pub expires_at: Option<u64>,
    pub created_at: u64,
    pub last_used_at: Option<u64>,
    pub revoked_at: Option<u64>,
}

/// A user-uploaded SSH public key stored in the kernel database.
/// Only the public material is persisted; fingerprints are computed from the
/// key bytes at add time and used as the dedup key per principal.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredSshPublicKey {
    pub id: String,
    pub owner_principal_uri: String,
    pub name: String,
    pub public_key: String,
    pub key_type: String,
    pub fingerprint: String,
    pub created_at: u64,
    pub last_used_at: Option<u64>,
    pub removed_at: Option<u64>,
}

/// A secure, long-lived OIDC refresh token record.
/// Only the SHA-256 hash of the token secret is stored.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredRefreshToken {
    pub id: String,
    pub family_id: String,
    pub owner_principal_uri: String,
    pub token_hash: String,
    pub token_prefix: String,
    pub scopes: Vec<String>,
    pub expires_at: u64,
    pub created_at: u64,
    pub last_used_at: Option<u64>,
    pub consumed_at: Option<u64>,
    pub replaced_by: Option<String>,
    pub revoked_at: Option<u64>,
}

pub struct PersistentStore {
    conn: Mutex<Connection>,
    db_path: PathBuf,
}

impl std::fmt::Debug for PersistentStore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PersistentStore")
            .field("db_path", &self.db_path)
            .finish_non_exhaustive()
    }
}

impl PersistentStore {
    /// Open (creating if needed) the kernel's SQLite database at
    /// `data_dir/comtrya.db` and apply every pending migration. Pass
    /// the absolute path to the migrations directory (one of the
    /// hardcoded callsites in `Runtime::start` resolves this via
    /// `CARGO_MANIFEST_DIR/../../migrations/sqlite`).
    pub fn open(data_dir: &Path, migrations_dir: &Path) -> Result<Self, String> {
        let db_path = data_dir.join("comtrya.db");
        std::fs::create_dir_all(data_dir)
            .map_err(|e| format!("mkdir {} failed: {e}", data_dir.display()))?;
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("open {} failed: {e}", db_path.display()))?;
        // WAL gets us concurrent read while a write is in flight; the
        // kernel reads more than it writes on the auth path. NORMAL
        // sync is the WAL default and matches the durability bar of
        // the JSONL event log we already accept.
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;",
        )
        .map_err(|e| format!("PRAGMA setup failed: {e}"))?;
        let store = Self {
            conn: Mutex::new(conn),
            db_path,
        };
        store.apply_migrations(migrations_dir)?;
        Ok(store)
    }

    /// Apply every `NNNN_*.sql` under `migrations_dir` whose version
    /// number hasn't been recorded in `schema_migrations`. Migration
    /// version is the first underscore-delimited token; this matches
    /// the existing `0001_core.sql` / `0002_auth.sql` convention and
    /// rejects files that don't follow it (so a stray `notes.sql`
    /// won't silently apply as version 0).
    fn apply_migrations(&self, migrations_dir: &Path) -> Result<(), String> {
        let mut conn = self.conn.lock().expect("conn lock poisoned");
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                filename TEXT NOT NULL,
                applied_at INTEGER NOT NULL
             )",
            [],
        )
        .map_err(|e| format!("create schema_migrations failed: {e}"))?;

        let mut entries: Vec<(u32, String, PathBuf)> = std::fs::read_dir(migrations_dir)
            .map_err(|e| format!("read_dir {} failed: {e}", migrations_dir.display()))?
            .filter_map(|entry| entry.ok())
            .filter_map(|entry| {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) != Some("sql") {
                    return None;
                }
                let stem = path.file_stem()?.to_str()?.to_string();
                let version_token = stem.split('_').next()?;
                let version: u32 = version_token.parse().ok()?;
                Some((version, stem, path))
            })
            .collect();
        entries.sort_by_key(|(v, _, _)| *v);

        let mut applied_versions: std::collections::HashSet<u32> = std::collections::HashSet::new();
        {
            let mut stmt = conn
                .prepare("SELECT version FROM schema_migrations")
                .map_err(|e| format!("query schema_migrations failed: {e}"))?;
            let rows = stmt
                .query_map([], |row| row.get::<_, u32>(0))
                .map_err(|e| format!("read schema_migrations failed: {e}"))?;
            for row in rows {
                applied_versions.insert(row.map_err(|e| format!("read row failed: {e}"))?);
            }
        }

        for (version, stem, path) in entries {
            if applied_versions.contains(&version) {
                continue;
            }
            let sql = std::fs::read_to_string(&path)
                .map_err(|e| format!("read {} failed: {e}", path.display()))?;
            // A real rusqlite `Transaction` gives all-or-nothing semantics:
            // the file's DDL and the `schema_migrations` bookkeeping row
            // commit together or roll back together, so we never record a
            // migration whose DDL only partially applied. The filename
            // stem is bound as a parameter rather than interpolated into
            // the SQL text, so a stem containing a quote cannot produce
            // malformed SQL.
            let tx = conn
                .transaction()
                .map_err(|e| format!("begin migration {stem} failed: {e}"))?;
            tx.execute_batch(&sql)
                .map_err(|e| format!("apply migration {stem} failed: {e}"))?;
            tx.execute(
                "INSERT INTO schema_migrations(version, filename, applied_at) \
                 VALUES (?1, ?2, strftime('%s','now'))",
                params![version, stem],
            )
            .map_err(|e| format!("record migration {stem} failed: {e}"))?;
            tx.commit()
                .map_err(|e| format!("commit migration {stem} failed: {e}"))?;
            tracing::info!(version, filename = %stem, "applied migration");
        }
        Ok(())
    }

    pub fn insert_session(
        &self,
        token: &str,
        session_id: &str,
        principal: StoredPrincipal,
        expires_at: u64,
        now: u64,
    ) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "INSERT INTO sessions(token, session_id, principal, expires_at, used, created_at) \
                 VALUES (?1, ?2, ?3, ?4, 0, ?5)",
                params![
                    token,
                    session_id,
                    principal_tag(principal),
                    expires_at as i64,
                    now as i64
                ],
            )
            .map_err(|e| format!("insert session failed: {e}"))?;
        Ok(())
    }

    /// Read + mark-used in one transaction. Returns the principal if
    /// the session is live and previously unused; returns `Ok(None)`
    /// if missing / expired / already used so the caller can return
    /// a single "unknown or expired" 401 without leaking which.
    pub fn take_session(&self, token: &str, now: u64) -> Result<Option<StoredPrincipal>, String> {
        let mut conn = self.conn.lock().expect("conn lock poisoned");
        let tx = conn
            .transaction()
            .map_err(|e| format!("begin take_session failed: {e}"))?;
        let result: Option<(String, i64, i64)> = tx
            .query_row(
                "SELECT principal, expires_at, used FROM sessions WHERE token = ?1",
                params![token],
                |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, i64>(1)?,
                        row.get::<_, i64>(2)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| format!("read session failed: {e}"))?;
        let Some((principal, expires_at, used)) = result else {
            tx.commit()
                .map_err(|e| format!("commit empty take failed: {e}"))?;
            return Ok(None);
        };
        if used != 0 || (expires_at as u64) <= now {
            tx.commit()
                .map_err(|e| format!("commit reject take failed: {e}"))?;
            return Ok(None);
        }
        tx.execute(
            "UPDATE sessions SET used = 1 WHERE token = ?1",
            params![token],
        )
        .map_err(|e| format!("mark session used failed: {e}"))?;
        tx.commit()
            .map_err(|e| format!("commit take failed: {e}"))?;
        Ok(parse_principal(&principal))
    }

    pub fn insert_credential(
        &self,
        token: &str,
        principal: StoredPrincipal,
        principal_uri: &str,
        actions: &[String],
        expires_at: u64,
        now: u64,
    ) -> Result<(), String> {
        let actions_json =
            serde_json::to_string(actions).map_err(|e| format!("serialize actions failed: {e}"))?;
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "INSERT INTO credentials(token, principal, principal_uri, actions_json, expires_at, created_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    token,
                    principal_tag(principal),
                    principal_uri,
                    actions_json,
                    expires_at as i64,
                    now as i64,
                ],
            )
            .map_err(|e| format!("insert credential failed: {e}"))?;
        Ok(())
    }

    /// Read credential by token. Returns `Ok(None)` for missing or
    /// expired credentials (the latter so callers don't accidentally
    /// honour a stale token if eviction hasn't run yet).
    pub fn lookup_credential(
        &self,
        token: &str,
        now: u64,
    ) -> Result<Option<StoredCredential>, String> {
        let row: Option<(String, String, String, i64)> = self
            .conn
            .lock()
            .expect("conn lock poisoned")
            .query_row(
                "SELECT principal, principal_uri, actions_json, expires_at \
                 FROM credentials WHERE token = ?1",
                params![token],
                |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, i64>(3)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| format!("lookup credential failed: {e}"))?;
        let Some((principal_tag_str, principal_uri, actions_json, expires_at)) = row else {
            return Ok(None);
        };
        if (expires_at as u64) <= now {
            return Ok(None);
        }
        let Some(principal) = parse_principal(&principal_tag_str) else {
            return Ok(None);
        };
        let actions: Vec<String> = serde_json::from_str(&actions_json)
            .map_err(|e| format!("decode actions failed: {e}"))?;
        Ok(Some(StoredCredential {
            principal,
            principal_uri,
            actions,
        }))
    }

    /// Increment the per-(bucket, minute) counter and return the new
    /// value. The minute slot is `now / 60`; the caller should pass
    /// `now_seconds()`.
    pub fn tally_rate(&self, bucket: &str, minute: u64) -> Result<u32, String> {
        let mut conn = self.conn.lock().expect("conn lock poisoned");
        let tx = conn
            .transaction()
            .map_err(|e| format!("begin tally failed: {e}"))?;
        tx.execute(
            "INSERT INTO rate_limits(bucket, minute, count) VALUES (?1, ?2, 1) \
             ON CONFLICT(bucket, minute) DO UPDATE SET count = count + 1",
            params![bucket, minute as i64],
        )
        .map_err(|e| format!("upsert rate failed: {e}"))?;
        let count: i64 = tx
            .query_row(
                "SELECT count FROM rate_limits WHERE bucket = ?1 AND minute = ?2",
                params![bucket, minute as i64],
                |row| row.get(0),
            )
            .map_err(|e| format!("read rate failed: {e}"))?;
        tx.commit()
            .map_err(|e| format!("commit tally failed: {e}"))?;
        Ok(count as u32)
    }

    /// Persist a new Git personal access token. `token_hash` is the
    /// argon2id PHC string for the full presented secret; the plaintext
    /// secret is never stored.
    pub fn insert_git_personal_access_token(
        &self,
        record: &StoredGitPersonalAccessToken,
        token_hash: &str,
    ) -> Result<(), String> {
        let scopes_json = serde_json::to_string(&record.scopes)
            .map_err(|e| format!("serialize PAT scopes failed: {e}"))?;
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "INSERT INTO git_personal_access_tokens(
                   id, owner_principal_uri, name, token_hash, token_prefix, scopes_json,
                   expires_at, created_at, last_used_at, revoked_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    record.id,
                    record.owner_principal_uri,
                    record.name,
                    token_hash,
                    record.token_prefix,
                    scopes_json,
                    record.expires_at.map(|v| v as i64),
                    record.created_at as i64,
                    record.last_used_at.map(|v| v as i64),
                    record.revoked_at.map(|v| v as i64),
                ],
            )
            .map_err(|e| format!("insert git personal access token failed: {e}"))?;
        Ok(())
    }

    /// List the active (non-revoked, unexpired) PATs owned by a principal,
    /// most recent first. Secret material is excluded.
    pub fn list_git_personal_access_tokens(
        &self,
        owner_principal_uri: &str,
        now: u64,
    ) -> Result<Vec<StoredGitPersonalAccessToken>, String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let mut stmt = conn
            .prepare(
                "SELECT id, owner_principal_uri, name, token_prefix, scopes_json, \
                        expires_at, created_at, last_used_at, revoked_at \
                 FROM git_personal_access_tokens \
                 WHERE owner_principal_uri = ?1 \
                   AND revoked_at IS NULL \
                   AND (expires_at IS NULL OR expires_at > ?2) \
                 ORDER BY created_at DESC, id DESC",
            )
            .map_err(|e| format!("prepare list git PATs failed: {e}"))?;
        let rows = stmt
            .query_map(
                params![owner_principal_uri, now as i64],
                Self::git_pat_from_row,
            )
            .map_err(|e| format!("query git PATs failed: {e}"))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("read git PAT row failed: {e}"))
    }

    /// Fetch a single PAT row by its (non-secret) id together with its
    /// stored argon2id hash, for secret verification at the auth boundary.
    /// Returns `Ok(None)` if the row is missing, revoked, or expired so the
    /// caller cannot distinguish those cases. The id is embedded in the
    /// presented token and indexed by the primary key, so lookup is O(1)
    /// even though the salted hash itself is not addressable.
    pub fn lookup_git_personal_access_token_by_id(
        &self,
        id: &str,
        now: u64,
    ) -> Result<Option<(StoredGitPersonalAccessToken, String)>, String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let row = conn
            .query_row(
                "SELECT id, owner_principal_uri, name, token_prefix, scopes_json, \
                        expires_at, created_at, last_used_at, revoked_at, token_hash \
                 FROM git_personal_access_tokens \
                 WHERE id = ?1",
                params![id],
                |row| {
                    let record = Self::git_pat_from_row(row)?;
                    let token_hash: String = row.get(9)?;
                    Ok((record, token_hash))
                },
            )
            .optional()
            .map_err(|e| format!("lookup git PAT failed: {e}"))?;
        let Some((record, token_hash)) = row else {
            return Ok(None);
        };
        if record.revoked_at.is_some() || record.expires_at.is_some_and(|expires| expires <= now) {
            return Ok(None);
        }
        Ok(Some((record, token_hash)))
    }

    /// Stamp `last_used_at` after a successful secret verification.
    pub fn touch_git_personal_access_token(&self, id: &str, now: u64) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "UPDATE git_personal_access_tokens SET last_used_at = ?1 WHERE id = ?2",
                params![now as i64, id],
            )
            .map_err(|e| format!("mark git PAT used failed: {e}"))?;
        Ok(())
    }

    /// Revoke a PAT owned by `owner_principal_uri`. Returns `true` if a
    /// previously-active row was revoked, `false` if nothing matched.
    pub fn revoke_git_personal_access_token(
        &self,
        owner_principal_uri: &str,
        id: &str,
        now: u64,
    ) -> Result<bool, String> {
        let changed = self
            .conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "UPDATE git_personal_access_tokens \
                 SET revoked_at = ?1 \
                 WHERE id = ?2 AND owner_principal_uri = ?3 AND revoked_at IS NULL",
                params![now as i64, id, owner_principal_uri],
            )
            .map_err(|e| format!("revoke git PAT failed: {e}"))?;
        Ok(changed > 0)
    }

    /// Test-only: force a PAT's `expires_at` so expiry handling can be
    /// exercised without sleeping.
    #[cfg(test)]
    pub fn force_expire_git_personal_access_token(
        &self,
        id: &str,
        expires_at: u64,
    ) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "UPDATE git_personal_access_tokens SET expires_at = ?1 WHERE id = ?2",
                params![expires_at as i64, id],
            )
            .map_err(|e| format!("force expire git PAT failed: {e}"))?;
        Ok(())
    }

    /// Simulate a credential-store outage by dropping the backing table, so a
    /// subsequent `lookup_credential` returns `Err` instead of `Ok(None)`.
    #[cfg(test)]
    pub fn drop_credentials_table_for_tests(&self) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute("DROP TABLE credentials", [])
            .map_err(|e| format!("drop credentials table failed: {e}"))?;
        Ok(())
    }

    fn git_pat_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<StoredGitPersonalAccessToken> {
        let scopes_json: String = row.get(4)?;
        let scopes = serde_json::from_str(&scopes_json).map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(
                4,
                rusqlite::types::Type::Text,
                Box::new(error),
            )
        })?;
        let expires_at: Option<i64> = row.get(5)?;
        let created_at: i64 = row.get(6)?;
        let last_used_at: Option<i64> = row.get(7)?;
        let revoked_at: Option<i64> = row.get(8)?;
        Ok(StoredGitPersonalAccessToken {
            id: row.get(0)?,
            owner_principal_uri: row.get(1)?,
            name: row.get(2)?,
            token_prefix: row.get(3)?,
            scopes,
            expires_at: expires_at.map(|v| v as u64),
            created_at: created_at as u64,
            last_used_at: last_used_at.map(|v| v as u64),
            revoked_at: revoked_at.map(|v| v as u64),
        })
    }

    // ── SSH public key storage ──────────────────────────────────────────────

    pub fn insert_ssh_public_key(&self, record: &StoredSshPublicKey) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "INSERT INTO ssh_public_keys(
                   id, owner_principal_uri, name, public_key, key_type, fingerprint,
                   created_at, last_used_at, removed_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    record.id,
                    record.owner_principal_uri,
                    record.name,
                    record.public_key,
                    record.key_type,
                    record.fingerprint,
                    record.created_at as i64,
                    record.last_used_at.map(|v| v as i64),
                    record.removed_at.map(|v| v as i64),
                ],
            )
            .map_err(|e| format!("insert ssh public key failed: {e}"))?;
        Ok(())
    }

    pub fn list_ssh_public_keys(
        &self,
        owner_principal_uri: &str,
    ) -> Result<Vec<StoredSshPublicKey>, String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let mut stmt = conn
            .prepare(
                "SELECT id, owner_principal_uri, name, public_key, key_type, fingerprint, \
                        created_at, last_used_at, removed_at \
                 FROM ssh_public_keys \
                 WHERE owner_principal_uri = ?1 AND removed_at IS NULL \
                 ORDER BY created_at DESC, id DESC",
            )
            .map_err(|e| format!("prepare list ssh keys failed: {e}"))?;
        let rows = stmt
            .query_map(params![owner_principal_uri], Self::ssh_key_from_row)
            .map_err(|e| format!("query ssh keys failed: {e}"))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("read ssh key row failed: {e}"))
    }

    pub fn remove_ssh_public_key(
        &self,
        owner_principal_uri: &str,
        id: &str,
        now: u64,
    ) -> Result<bool, String> {
        let rows = self
            .conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "UPDATE ssh_public_keys SET removed_at = ?1 \
                 WHERE id = ?2 AND owner_principal_uri = ?3 AND removed_at IS NULL",
                params![now as i64, id, owner_principal_uri],
            )
            .map_err(|e| format!("remove ssh key failed: {e}"))?;
        Ok(rows > 0)
    }

    fn ssh_key_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<StoredSshPublicKey> {
        let created_at: i64 = row.get(6)?;
        let last_used_at: Option<i64> = row.get(7)?;
        let removed_at: Option<i64> = row.get(8)?;
        Ok(StoredSshPublicKey {
            id: row.get(0)?,
            owner_principal_uri: row.get(1)?,
            name: row.get(2)?,
            public_key: row.get(3)?,
            key_type: row.get(4)?,
            fingerprint: row.get(5)?,
            created_at: created_at as u64,
            last_used_at: last_used_at.map(|v| v as u64),
            removed_at: removed_at.map(|v| v as u64),
        })
    }

    /// Periodic cleanup. Removes expired sessions/credentials and
    /// rate-limit rows older than `now - keep_seconds`. Safe to call
    /// concurrently with reads; SQLite serialises writes inside the
    /// connection.
    pub fn evict_expired(
        &self,
        now: u64,
        keep_seconds: u64,
    ) -> Result<(usize, usize, usize), String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let sessions = conn
            .execute(
                "DELETE FROM sessions WHERE expires_at <= ?1",
                params![now as i64],
            )
            .map_err(|e| format!("evict sessions failed: {e}"))?;
        let credentials = conn
            .execute(
                "DELETE FROM credentials WHERE expires_at <= ?1",
                params![now as i64],
            )
            .map_err(|e| format!("evict credentials failed: {e}"))?;
        let rate_cutoff = (now.saturating_sub(keep_seconds)) / 60;
        let rate_limits = conn
            .execute(
                "DELETE FROM rate_limits WHERE minute < ?1",
                params![rate_cutoff as i64],
            )
            .map_err(|e| format!("evict rate_limits failed: {e}"))?;

        // Delete refresh tokens expired or revoked more than 1 day ago so that
        // concurrent grace windows or recent reuse/theft detection can operate.
        let refresh_cutoff = now.saturating_sub(86400); // 1 day ago
        conn.execute(
            "DELETE FROM refresh_tokens WHERE expires_at <= ?1 OR (revoked_at IS NOT NULL AND revoked_at <= ?1)",
            params![refresh_cutoff as i64],
        )
        .map_err(|e| format!("evict refresh_tokens failed: {e}"))?;

        Ok((sessions, credentials, rate_limits))
    }

    pub fn insert_refresh_token(&self, record: &StoredRefreshToken) -> Result<(), String> {
        let scopes_json = serde_json::to_string(&record.scopes)
            .map_err(|e| format!("serialize scopes failed: {e}"))?;
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "INSERT INTO refresh_tokens(
                   id, family_id, owner_principal_uri, token_hash, token_prefix, scopes_json,
                   expires_at, created_at, last_used_at, consumed_at, replaced_by, revoked_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
                params![
                    record.id,
                    record.family_id,
                    record.owner_principal_uri,
                    record.token_hash,
                    record.token_prefix,
                    scopes_json,
                    record.expires_at as i64,
                    record.created_at as i64,
                    record.last_used_at.map(|v| v as i64),
                    record.consumed_at.map(|v| v as i64),
                    record.replaced_by,
                    record.revoked_at.map(|v| v as i64),
                ],
            )
            .map_err(|e| format!("insert refresh token failed: {e}"))?;
        Ok(())
    }

    pub fn lookup_refresh_token(&self, id: &str) -> Result<Option<StoredRefreshToken>, String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let mut stmt = conn
            .prepare(
                "SELECT id, family_id, owner_principal_uri, token_hash, token_prefix, scopes_json, \
                        expires_at, created_at, last_used_at, consumed_at, replaced_by, revoked_at \
                 FROM refresh_tokens WHERE id = ?1",
            )
            .map_err(|e| format!("prepare lookup_refresh_token failed: {e}"))?;

        let row = stmt
            .query_row(params![id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, i64>(6)?,
                    row.get::<_, i64>(7)?,
                    row.get::<_, Option<i64>>(8)?,
                    row.get::<_, Option<i64>>(9)?,
                    row.get::<_, Option<String>>(10)?,
                    row.get::<_, Option<i64>>(11)?,
                ))
            })
            .optional()
            .map_err(|e| format!("query lookup_refresh_token failed: {e}"))?;

        if let Some(r) = row {
            let scopes: Vec<String> = serde_json::from_str(&r.5)
                .map_err(|e| format!("deserialize scopes failed: {e}"))?;
            Ok(Some(StoredRefreshToken {
                id: r.0,
                family_id: r.1,
                owner_principal_uri: r.2,
                token_hash: r.3,
                token_prefix: r.4,
                scopes,
                expires_at: r.6 as u64,
                created_at: r.7 as u64,
                last_used_at: r.8.map(|v| v as u64),
                consumed_at: r.9.map(|v| v as u64),
                replaced_by: r.10,
                revoked_at: r.11.map(|v| v as u64),
            }))
        } else {
            Ok(None)
        }
    }

    pub fn rotate_refresh_token(
        &self,
        old_id: &str,
        new_record: &StoredRefreshToken,
        consumed_at: u64,
    ) -> Result<(), String> {
        let mut conn = self.conn.lock().expect("conn lock poisoned");
        let tx = conn
            .transaction()
            .map_err(|e| format!("begin rotate_refresh_token transaction failed: {e}"))?;

        // 1. Mark old token as consumed and reference its successor
        let rows_affected = tx.execute(
            "UPDATE refresh_tokens SET consumed_at = ?1, replaced_by = ?2 WHERE id = ?3 AND consumed_at IS NULL AND revoked_at IS NULL",
            params![consumed_at as i64, &new_record.id, old_id],
        )
        .map_err(|e| format!("update old refresh token consumed_at failed: {e}"))?;

        if rows_affected == 0 {
            return Err("Refresh token already consumed or revoked".to_string());
        }

        // 2. Insert new refresh token
        let scopes_json = serde_json::to_string(&new_record.scopes)
            .map_err(|e| format!("serialize scopes failed: {e}"))?;
        tx.execute(
            "INSERT INTO refresh_tokens(
               id, family_id, owner_principal_uri, token_hash, token_prefix, scopes_json,
               expires_at, created_at, last_used_at, consumed_at, replaced_by, revoked_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                new_record.id,
                new_record.family_id,
                new_record.owner_principal_uri,
                new_record.token_hash,
                new_record.token_prefix,
                scopes_json,
                new_record.expires_at as i64,
                new_record.created_at as i64,
                new_record.last_used_at.map(|v| v as i64),
                new_record.consumed_at.map(|v| v as i64),
                new_record.replaced_by,
                new_record.revoked_at.map(|v| v as i64),
            ],
        )
        .map_err(|e| format!("insert new refresh token failed: {e}"))?;

        tx.commit()
            .map_err(|e| format!("commit rotate_refresh_token failed: {e}"))?;
        Ok(())
    }

    pub fn revoke_refresh_token_family(
        &self,
        family_id: &str,
        revoked_at: u64,
    ) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "UPDATE refresh_tokens SET revoked_at = ?1 WHERE family_id = ?2 AND revoked_at IS NULL",
                params![revoked_at as i64, family_id],
            )
            .map_err(|e| format!("revoke family failed: {e}"))?;
        Ok(())
    }

    pub fn revoke_refresh_token_by_id(&self, id: &str, revoked_at: u64) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "UPDATE refresh_tokens SET revoked_at = ?1 WHERE id = ?2 AND revoked_at IS NULL",
                params![revoked_at as i64, id],
            )
            .map_err(|e| format!("revoke refresh token by id failed: {e}"))?;
        Ok(())
    }

    #[cfg(test)]
    pub fn touch_refresh_token(&self, id: &str, last_used_at: u64) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "UPDATE refresh_tokens SET last_used_at = ?1 WHERE id = ?2",
                params![last_used_at as i64, id],
            )
            .map_err(|e| format!("touch refresh token failed: {e}"))?;
        Ok(())
    }

    /// List active (non-expired, non-used) sessions for the admin panel.
    /// Returns session metadata WITHOUT the bearer token — the token is
    /// the credential and must never be exposed outside the auth boundary.
    pub fn list_active_sessions(&self, now: u64) -> Result<Vec<AdminSessionRecord>, String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let mut stmt = conn
            .prepare(
                "SELECT session_id, principal, expires_at, created_at \
                 FROM sessions \
                 WHERE expires_at > ?1 AND used = 0 AND session_id IS NOT NULL \
                 ORDER BY created_at DESC \
                 LIMIT 500",
            )
            .map_err(|e| format!("prepare list_sessions failed: {e}"))?;
        let rows: Vec<AdminSessionRecord> = stmt
            .query_map(params![now as i64], |row| {
                Ok(AdminSessionRecord {
                    session_id: row.get(0)?,
                    principal: row.get(1)?,
                    expires_at: row.get::<_, i64>(2)? as u64,
                    created_at: row.get::<_, i64>(3)? as u64,
                })
            })
            .map_err(|e| format!("query sessions failed: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(rows)
    }

    /// Revoke a session by its opaque session_id. Marks the session as
    /// used so the bearer token is immediately rejected on next use.
    /// Returns `true` if a live session was revoked, `false` if not found.
    pub fn revoke_session(&self, session_id: &str, now: u64) -> Result<bool, String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let updated = conn
            .execute(
                "UPDATE sessions SET used = 1 \
                 WHERE session_id = ?1 AND expires_at > ?2 AND used = 0",
                params![session_id, now as i64],
            )
            .map_err(|e| format!("revoke session failed: {e}"))?;
        Ok(updated > 0)
    }

    /// Revoke all active sessions for a given principal tag. Used by the
    /// admin "deactivate user" action to invalidate all sessions at once.
    pub fn revoke_sessions_for_principal(
        &self,
        principal_tag_value: &str,
        now: u64,
    ) -> Result<u64, String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let updated = conn
            .execute(
                "UPDATE sessions SET used = 1 \
                 WHERE principal = ?1 AND expires_at > ?2 AND used = 0",
                params![principal_tag_value, now as i64],
            )
            .map_err(|e| format!("revoke sessions for principal failed: {e}"))?;
        Ok(updated as u64)
    }

    pub fn telemetry_counts(&self, now: u64) -> Result<(u64, u64, u64), String> {
        let conn = self.conn.lock().expect("conn lock poisoned");
        let sessions = conn
            .query_row(
                "SELECT COUNT(*) FROM sessions WHERE expires_at > ?1",
                params![now as i64],
                |row| row.get::<_, u64>(0),
            )
            .map_err(|e| format!("count sessions failed: {e}"))?;
        let credentials = conn
            .query_row(
                "SELECT COUNT(*) FROM credentials WHERE expires_at > ?1",
                params![now as i64],
                |row| row.get::<_, u64>(0),
            )
            .map_err(|e| format!("count credentials failed: {e}"))?;
        let rate_limit_rows = conn
            .query_row("SELECT COUNT(*) FROM rate_limits", [], |row| {
                row.get::<_, u64>(0)
            })
            .map_err(|e| format!("count rate limits failed: {e}"))?;
        Ok((sessions, credentials, rate_limit_rows))
    }
}

fn principal_tag(p: StoredPrincipal) -> &'static str {
    match p {
        StoredPrincipal::OperatorCredential => "OperatorCredential",
        StoredPrincipal::AdminCredential => "AdminCredential",
        StoredPrincipal::Credential => "Credential",
        StoredPrincipal::Anonymous => "Anonymous",
        StoredPrincipal::Invalid => "Invalid",
    }
}

fn parse_principal(tag: &str) -> Option<StoredPrincipal> {
    match tag {
        "OperatorCredential" => Some(StoredPrincipal::OperatorCredential),
        "AdminCredential" => Some(StoredPrincipal::AdminCredential),
        "Credential" => Some(StoredPrincipal::Credential),
        "Anonymous" => Some(StoredPrincipal::Anonymous),
        "Invalid" => Some(StoredPrincipal::Invalid),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn fresh_store() -> (TempDir, PersistentStore) {
        let tmp = tempfile::Builder::new()
            .prefix("comtrya-persistence-")
            .tempdir()
            .unwrap();
        let migrations_dir = workspace_migrations_dir();
        let store = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        (tmp, store)
    }

    /// Locate the repo's `migrations/sqlite/` directory at test time
    /// by walking up from the crate root. Avoids hardcoding an
    /// absolute path and works under `cargo test` from any CWD.
    fn workspace_migrations_dir() -> PathBuf {
        let mut dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        for _ in 0..3 {
            let candidate = dir.join("migrations/sqlite");
            if candidate.is_dir() {
                return candidate;
            }
            if !dir.pop() {
                break;
            }
        }
        panic!(
            "could not locate migrations/sqlite/ above {}",
            env!("CARGO_MANIFEST_DIR")
        );
    }

    #[test]
    fn migration_runner_applies_all_files_on_fresh_db() {
        let (_tmp, store) = fresh_store();
        let conn = store.conn.lock().unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert!(
            count >= 2,
            "expected at least the two migration files (0001, 0002) to be recorded; got {count}",
        );
        // The auth schema must be queryable end-to-end.
        let _ = conn
            .query_row("SELECT COUNT(*) FROM sessions", [], |row| {
                row.get::<_, i64>(0)
            })
            .unwrap();
    }

    #[test]
    fn migration_runner_is_idempotent_on_reopen() {
        let tmp = tempfile::Builder::new()
            .prefix("comtrya-persistence-idem-")
            .tempdir()
            .unwrap();
        let migrations_dir = workspace_migrations_dir();
        let first = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        let first_count: i64 = first
            .conn
            .lock()
            .unwrap()
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .unwrap();
        drop(first);
        let second = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        let second_count: i64 = second
            .conn
            .lock()
            .unwrap()
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(first_count, second_count);
    }

    #[test]
    fn migration_runner_handles_quote_in_filename_stem() {
        // The bookkeeping INSERT binds the stem as a parameter, so a stem
        // containing a single quote must apply cleanly instead of producing
        // malformed SQL that aborts startup.
        let migrations_src = tempfile::Builder::new()
            .prefix("comtrya-migrations-quote-")
            .tempdir()
            .unwrap();
        std::fs::write(
            migrations_src.path().join("0001_o'brien.sql"),
            "CREATE TABLE quoted_demo (id INTEGER PRIMARY KEY);",
        )
        .unwrap();
        let data = tempfile::Builder::new()
            .prefix("comtrya-migrations-quote-db-")
            .tempdir()
            .unwrap();
        let store = PersistentStore::open(data.path(), migrations_src.path())
            .expect("migration with quote in stem applies cleanly");
        let conn = store.conn.lock().unwrap();
        let stem: String = conn
            .query_row(
                "SELECT filename FROM schema_migrations WHERE version = 1",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(stem, "0001_o'brien");
        // The DDL committed in the same transaction as the bookkeeping row.
        let _ = conn
            .query_row("SELECT COUNT(*) FROM quoted_demo", [], |row| {
                row.get::<_, i64>(0)
            })
            .unwrap();
    }

    #[test]
    fn session_survives_restart() {
        let tmp = tempfile::Builder::new()
            .prefix("comtrya-persistence-session-")
            .tempdir()
            .unwrap();
        let migrations_dir = workspace_migrations_dir();
        let store = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        store
            .insert_session(
                "sess_abc",
                "test_session_abc",
                StoredPrincipal::OperatorCredential,
                9_999_999_999,
                1000,
            )
            .unwrap();
        drop(store);
        // New process, same DB.
        let reopened = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        let principal = reopened.take_session("sess_abc", 1001).unwrap();
        assert_eq!(principal, Some(StoredPrincipal::OperatorCredential));
    }

    #[test]
    fn session_take_is_single_use() {
        let (_tmp, store) = fresh_store();
        store
            .insert_session(
                "sess_once",
                "test_session_once",
                StoredPrincipal::Credential,
                9_999_999_999,
                1,
            )
            .unwrap();
        assert_eq!(
            store.take_session("sess_once", 2).unwrap(),
            Some(StoredPrincipal::Credential),
        );
        assert_eq!(
            store.take_session("sess_once", 3).unwrap(),
            None,
            "second take must fail",
        );
    }

    #[test]
    fn expired_session_is_not_taken() {
        let (_tmp, store) = fresh_store();
        store
            .insert_session(
                "sess_exp",
                "test_session_exp",
                StoredPrincipal::Credential,
                100,
                50,
            )
            .unwrap();
        assert_eq!(store.take_session("sess_exp", 200).unwrap(), None,);
    }

    #[test]
    fn credential_survives_restart() {
        let tmp = tempfile::Builder::new()
            .prefix("comtrya-persistence-cred-")
            .tempdir()
            .unwrap();
        let migrations_dir = workspace_migrations_dir();
        let store = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        store
            .insert_credential(
                "tok_xyz",
                StoredPrincipal::OperatorCredential,
                "comtrya://credential/prn_1",
                &["graphql:read".to_string(), "git:read".to_string()],
                9_999_999_999,
                1000,
            )
            .unwrap();
        drop(store);
        let reopened = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        let cred = reopened
            .lookup_credential("tok_xyz", 1001)
            .unwrap()
            .unwrap();
        assert_eq!(cred.principal, StoredPrincipal::OperatorCredential);
        assert_eq!(cred.principal_uri, "comtrya://credential/prn_1");
        assert_eq!(cred.actions, vec!["graphql:read", "git:read"]);
    }

    #[test]
    fn rate_limit_count_survives_restart() {
        let tmp = tempfile::Builder::new()
            .prefix("comtrya-persistence-rate-")
            .tempdir()
            .unwrap();
        let migrations_dir = workspace_migrations_dir();
        let store = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        for _ in 0..5 {
            store.tally_rate("graphql", 12345).unwrap();
        }
        drop(store);
        let reopened = PersistentStore::open(tmp.path(), &migrations_dir).unwrap();
        let count = reopened.tally_rate("graphql", 12345).unwrap();
        assert_eq!(count, 6, "pre-restart 5 + post-restart 1 = 6");
    }

    #[test]
    fn evict_expired_drops_only_old_rows() {
        let (_tmp, store) = fresh_store();
        store
            .insert_session(
                "live",
                "test_session_live",
                StoredPrincipal::Credential,
                9_999_999_999,
                1,
            )
            .unwrap();
        store
            .insert_session(
                "dead",
                "test_session_dead",
                StoredPrincipal::Credential,
                100,
                1,
            )
            .unwrap();
        let (sessions_evicted, _, _) = store.evict_expired(500, 60).unwrap();
        assert_eq!(sessions_evicted, 1);
        assert!(store.take_session("live", 600).unwrap().is_some());
    }

    #[test]
    fn refresh_token_lifecycle_and_rotation() {
        let (_tmp, store) = fresh_store();

        let token = StoredRefreshToken {
            id: "rt_1".to_string(),
            family_id: "family_a".to_string(),
            owner_principal_uri: "comtrya://user/123".to_string(),
            token_hash: "hash_1".to_string(),
            token_prefix: "crt_rt_1".to_string(),
            scopes: vec!["git:read".to_string()],
            expires_at: 1000,
            created_at: 100,
            last_used_at: None,
            consumed_at: None,
            replaced_by: None,
            revoked_at: None,
        };

        // 1. Insert and lookup
        store.insert_refresh_token(&token).unwrap();
        let fetched = store.lookup_refresh_token("rt_1").unwrap().unwrap();
        assert_eq!(fetched.id, "rt_1");
        assert_eq!(fetched.family_id, "family_a");
        assert_eq!(fetched.token_hash, "hash_1");
        assert_eq!(fetched.scopes, vec!["git:read".to_string()]);
        assert_eq!(fetched.expires_at, 1000);
        assert!(fetched.consumed_at.is_none());

        // 2. Touch/update last used
        store.touch_refresh_token("rt_1", 150).unwrap();
        let fetched = store.lookup_refresh_token("rt_1").unwrap().unwrap();
        assert_eq!(fetched.last_used_at, Some(150));

        // 3. Rotate
        let rotated = StoredRefreshToken {
            id: "rt_2".to_string(),
            family_id: "family_a".to_string(),
            owner_principal_uri: "comtrya://user/123".to_string(),
            token_hash: "hash_2".to_string(),
            token_prefix: "crt_rt_2".to_string(),
            scopes: vec!["git:read".to_string()],
            expires_at: 2000,
            created_at: 200,
            last_used_at: None,
            consumed_at: None,
            replaced_by: None,
            revoked_at: None,
        };
        store.rotate_refresh_token("rt_1", &rotated, 200).unwrap();

        let old = store.lookup_refresh_token("rt_1").unwrap().unwrap();
        assert_eq!(old.consumed_at, Some(200));
        assert_eq!(old.replaced_by, Some("rt_2".to_string()));

        let new = store.lookup_refresh_token("rt_2").unwrap().unwrap();
        assert_eq!(new.id, "rt_2");
        assert!(new.consumed_at.is_none());

        // 4. Revoke family
        store.revoke_refresh_token_family("family_a", 300).unwrap();
        let old = store.lookup_refresh_token("rt_1").unwrap().unwrap();
        assert_eq!(old.revoked_at, Some(300));
        let new = store.lookup_refresh_token("rt_2").unwrap().unwrap();
        assert_eq!(new.revoked_at, Some(300));
    }
}
