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

pub struct PersistentStore {
    conn: Mutex<Connection>,
    #[allow(dead_code)]
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
        let conn = self.conn.lock().expect("conn lock poisoned");
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
            // `execute_batch` runs every statement in one transaction;
            // failure rolls everything back so we never end up with a
            // half-applied migration that records `schema_migrations`
            // but missed half its DDL.
            conn.execute_batch(&format!(
                "BEGIN;\n{sql}\nINSERT INTO schema_migrations(version, filename, applied_at) \
                 VALUES ({version}, '{stem}', strftime('%s','now'));\nCOMMIT;"
            ))
            .map_err(|e| format!("apply migration {stem} failed: {e}"))?;
            tracing::info!(version, filename = %stem, "applied migration");
        }
        Ok(())
    }

    pub fn insert_session(
        &self,
        token: &str,
        principal: StoredPrincipal,
        expires_at: u64,
        now: u64,
    ) -> Result<(), String> {
        self.conn
            .lock()
            .expect("conn lock poisoned")
            .execute(
                "INSERT INTO sessions(token, principal, expires_at, used, created_at) \
                 VALUES (?1, ?2, ?3, 0, ?4)",
                params![
                    token,
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
        Ok((sessions, credentials, rate_limits))
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
            .insert_session("sess_once", StoredPrincipal::Credential, 9_999_999_999, 1)
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
            .insert_session("sess_exp", StoredPrincipal::Credential, 100, 50)
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
            .insert_session("live", StoredPrincipal::Credential, 9_999_999_999, 1)
            .unwrap();
        store
            .insert_session("dead", StoredPrincipal::Credential, 100, 1)
            .unwrap();
        let (sessions_evicted, _, _) = store.evict_expired(500, 60).unwrap();
        assert_eq!(sessions_evicted, 1);
        assert!(store.take_session("live", 600).unwrap().is_some());
    }
}
