//! Host-side implementation of the `comtrya:platform@0.1.0` WIT.
//!
//! This module exposes:
//!   * [`HostState`] — the per-invocation `Store` data the linker carries.
//!   * [`add_to_linker`] — registers every imported interface against a
//!     `wasmtime::component::Linker<HostState>`.
//!   * [`PlatformBindings`] — the generated bindings (`bindgen!`) for
//!     re-export so the main module can drive an extension component
//!     under the configured linker.
//!
//! Trust boundary: every host call resolves the calling extension via
//! `HostState::extension_id` and scopes storage / event access to that
//! extension. The kernel — not the WIT — is the security boundary.
//!
//! Phase 2 scope: `time`, `log`, `identity`, `ids`, and `storage` are
//! wired to real backing state. `relations`, `comments`, `events`, and
//! `ops` return `error-code::internal` with an explicit "not yet
//! implemented" message; their Phase 2 wiring lands in a follow-on
//! commit once the kernel's event-dispatcher refactor is in place.

use std::collections::BTreeMap;
use std::sync::{Arc, RwLock};

use serde_json::Value;
use wasmtime::Engine;
use wasmtime::component::Linker;

use crate::ExtensionRuntimeStore;

wasmtime::component::bindgen!({
    path: "../../extensions/wit/comtrya/platform",
    world: "extension",
});

pub use comtrya::platform::{
    comments as wit_comments, events as wit_events, identity as wit_identity, ids as wit_ids,
    log as wit_log, ops as wit_ops, relations as wit_relations, storage as wit_storage,
    time as wit_time, types as wit_types,
};

/// Per-invocation host state. One of these is created per WASM op
/// invocation; it carries the calling extension's identity and a
/// shared handle to the persistent extension store.
pub struct HostState {
    /// e.g. `ext_issues`. Used as the storage namespace key.
    pub extension_id: String,
    /// `comtrya://extension/ext_…`. Returned by `extension-credential`.
    pub extension_principal: String,
    /// `comtrya://user/usr_…` or the anonymous principal for
    /// unauthenticated calls. Returned by `current-principal`.
    pub current_principal: String,
    /// Shared persistent storage. The host uses `extension_id` to scope
    /// every operation; the underlying store is multi-extension.
    pub store: Arc<ExtensionRuntimeStore>,
    /// Authz layer hook. Returns `Some(true)`/`Some(false)` for a
    /// decision; `None` if the layer is unreachable.
    pub authz: Arc<dyn AuthzLayer + Send + Sync>,
    /// Manifest-declared permissions, parsed at extension load time.
    pub manifest: Arc<HostManifest>,
    /// Diagnostic sink for `log.emit`. Defaults to `eprintln!`.
    pub log_sink: Arc<dyn LogSink + Send + Sync>,
    /// Clock. Defaults to system time; tests substitute a fake clock.
    pub clock: Arc<dyn Clock + Send + Sync>,
    /// Id minter. Wraps `ulid` generation + manifest kind-validation.
    pub id_minter: Arc<dyn IdMinter + Send + Sync>,
    /// In-progress OCC tokens: extension_id → (collection, id) → version.
    /// Held in-process for the lifetime of the kernel; on restart all
    /// outstanding tokens become invalid (callers re-read).
    pub occ_tokens: Arc<RwLock<BTreeMap<(String, String, String), String>>>,
    /// Cross-extension op dispatcher (kernel-supplied).
    pub ops_dispatcher: Arc<dyn OpsDispatcher>,
    /// Current synchronous depth of `ops.invoke` chains. Incremented
    /// before each call, decremented after.
    pub ops_invoke_depth: u32,
}

/// Parsed extension manifest — only the fields the host enforces.
#[derive(Debug, Clone, Default)]
pub struct HostManifest {
    /// `<extension-id>.<verb>` permission strings the extension claims.
    pub permissions: Vec<String>,
    /// Event types this extension may `events.append`.
    pub allowed_emits: Vec<String>,
    /// Extension ids whose events this extension may `read-recent`.
    pub allowed_event_reads: Vec<String>,
    /// `<target>/<op>` strings this extension may `ops.invoke`.
    pub allowed_cross_calls: Vec<String>,
    /// `<target>/<op>` strings reactions may invoke from `on-event`.
    pub reactor_allowed_mutations: Vec<String>,
    /// Event types reactions may emit from `on-event`.
    pub reactor_allowed_emits: Vec<String>,
    /// Resource kinds this extension owns / may mint ids for.
    pub contributes_resource_kinds: Vec<String>,
    /// Host import groups this extension is permitted to call.
    pub host_imports: Vec<String>,
}

pub trait AuthzLayer {
    fn has_permission(&self, principal: &str, permission: &str) -> Option<bool>;
}

pub trait LogSink {
    fn emit(&self, extension_id: &str, level: wit_types::LogLevel, message: &str, fields: Option<&[u8]>);
}

pub trait Clock {
    fn now_iso(&self) -> String;
    fn now_millis(&self) -> u64;
}

pub trait IdMinter {
    fn mint(&self, kind: &str) -> Result<String, MintError>;
    /// Register a new mintable kind at runtime. The registry calls this
    /// at extension load time so each extension's declared kinds
    /// become mintable. Idempotent — registering an existing kind
    /// does not overwrite the prefix.
    fn register_kind(&self, _kind: &str, _prefix: &str) {}
}

#[derive(Debug)]
pub enum MintError {
    UnknownKind(String),
    Forbidden(String),
    Internal(String),
}

// ---- default backings ----

pub struct SystemClock;

impl Clock for SystemClock {
    fn now_iso(&self) -> String {
        chrono_now_iso()
    }

    fn now_millis(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }
}

fn chrono_now_iso() -> String {
    // The kernel's existing helpers use `now_seconds()` for stringly-
    // formatted seconds. For the WIT we want ISO-8601; we format
    // manually to keep this module dependency-free.
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    seconds_to_iso8601(secs)
}

fn seconds_to_iso8601(secs: u64) -> String {
    let days = secs / 86_400;
    let rem = secs % 86_400;
    let h = rem / 3600;
    let m = (rem % 3600) / 60;
    let s = rem % 60;
    let (y, mo, d) = days_to_ymd(days as i64 + 719_468);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        y, mo, d, h, m, s
    )
}

fn days_to_ymd(g: i64) -> (i64, u32, u32) {
    let era = g.div_euclid(146_097);
    let doe = g.rem_euclid(146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = (if mp < 10 { mp + 3 } else { mp - 9 }) as u32;
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}

pub struct StderrLogSink;

impl LogSink for StderrLogSink {
    fn emit(&self, extension_id: &str, level: wit_types::LogLevel, message: &str, fields: Option<&[u8]>) {
        let level_str = match level {
            wit_types::LogLevel::Trace => "TRACE",
            wit_types::LogLevel::Debug => "DEBUG",
            wit_types::LogLevel::Info => "INFO",
            wit_types::LogLevel::Warn => "WARN",
            wit_types::LogLevel::Error => "ERROR",
        };
        let fields_str = fields
            .and_then(|b| std::str::from_utf8(b).ok())
            .unwrap_or("");
        eprintln!("[wasm:{}] {} {} {}", extension_id, level_str, message, fields_str);
    }
}

pub struct DefaultAuthz;

impl AuthzLayer for DefaultAuthz {
    fn has_permission(&self, _principal: &str, _permission: &str) -> Option<bool> {
        // Phase 2: permissive default. The kernel's existing authz layer
        // (crates/core/src/authz.rs) wires in here once the broker is
        // refactored to accept WIT principals.
        Some(true)
    }
}

pub struct UlidMinter {
    pub kinds: Arc<RwLock<BTreeMap<String, String>>>, // kind -> prefix
    pub authorized: Arc<RwLock<BTreeMap<String, Vec<String>>>>, // extension_id -> allowed kinds
}

impl UlidMinter {
    pub fn new(kind_prefixes: BTreeMap<String, String>) -> Self {
        Self {
            kinds: Arc::new(RwLock::new(kind_prefixes)),
            authorized: Arc::new(RwLock::new(BTreeMap::new())),
        }
    }

    /// Constructor that pre-seeds the kernel-internal kinds (`event`,
    /// `relation`, `comment`) the host imports mint directly when
    /// persisting on an extension's behalf. Extension-owned kinds
    /// must still be added on top via `kind_prefixes`. Use this from
    /// every kernel call site so the seeds can't be forgotten by one
    /// caller and present in another.
    pub fn with_kernel_kinds(mut kind_prefixes: BTreeMap<String, String>) -> Self {
        kind_prefixes
            .entry("event".to_string())
            .or_insert_with(|| "evt".to_string());
        kind_prefixes
            .entry("relation".to_string())
            .or_insert_with(|| "rel".to_string());
        kind_prefixes
            .entry("comment".to_string())
            .or_insert_with(|| "cmt".to_string());
        Self::new(kind_prefixes)
    }
}

impl IdMinter for UlidMinter {
    fn register_kind(&self, kind: &str, prefix: &str) {
        if let Ok(mut kinds) = self.kinds.write() {
            kinds
                .entry(kind.to_string())
                .or_insert_with(|| prefix.to_string());
        }
    }

    fn mint(&self, kind: &str) -> Result<String, MintError> {
        let kinds = self.kinds.read().map_err(|e| MintError::Internal(e.to_string()))?;
        let prefix = kinds
            .get(kind)
            .ok_or_else(|| MintError::UnknownKind(kind.to_string()))?;
        // Timestamp + per-process counter + thread-randomish. Avoids
        // millisecond collisions; the kernel's `IdPrefix` machinery in
        // `crates/core/src/ids.rs` (real ULID) replaces this once both
        // call sites are unified.
        use std::sync::atomic::{AtomicU64, Ordering};
        static MONOTONIC: AtomicU64 = AtomicU64::new(0);
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        let counter = MONOTONIC.fetch_add(1, Ordering::Relaxed);
        // Mix in a per-thread random-ish component derived from the
        // thread id hash so concurrent threads cannot collide.
        let tid_mix = {
            use std::collections::hash_map::DefaultHasher;
            use std::hash::{Hash, Hasher};
            let mut h = DefaultHasher::new();
            std::thread::current().id().hash(&mut h);
            h.finish()
        };
        Ok(format!(
            "{}_{:013X}{:08X}{:08X}",
            prefix,
            now,
            counter as u32,
            tid_mix as u32
        ))
    }
}

// ---- bindgen helpers ----

fn err(code: wit_types::ErrorCode, message: impl Into<String>) -> wit_types::Error {
    wit_types::Error {
        code,
        message: message.into(),
        path: None,
    }
}

fn internal_unimplemented(what: &str) -> wit_types::Error {
    err(
        wit_types::ErrorCode::Internal,
        format!("{} is declared in WIT but the kernel host import is not yet wired", what),
    )
}

// ---- types (no methods; bindgen emits an empty Host trait) ----

impl wit_types::Host for HostState {}

// ---- time ----

impl wit_time::Host for HostState {
    fn now_iso(&mut self) -> wit_types::IsoTimestamp {
        self.clock.now_iso()
    }

    fn now_millis(&mut self) -> u64 {
        self.clock.now_millis()
    }
}

// ---- log ----

impl wit_log::Host for HostState {
    fn emit(&mut self, level: wit_types::LogLevel, message: String, fields: Option<Vec<u8>>) {
        self.log_sink
            .emit(&self.extension_id, level, &message, fields.as_deref());
    }
}

// ---- identity ----

impl wit_identity::Host for HostState {
    fn current_principal(&mut self) -> Result<wit_types::PrincipalUri, wit_types::Error> {
        Ok(self.current_principal.clone())
    }

    fn extension_credential(&mut self) -> Result<wit_types::PrincipalUri, wit_types::Error> {
        Ok(self.extension_principal.clone())
    }

    fn has_permission(&mut self, permission: String) -> Result<bool, wit_types::Error> {
        if !is_valid_permission_grammar(&permission) {
            return Err(err(
                wit_types::ErrorCode::BadInput,
                format!(
                    "permission '{}' does not match <extension-id>.<verb> grammar",
                    permission
                ),
            ));
        }
        match self.authz.has_permission(&self.current_principal, &permission) {
            Some(value) => Ok(value),
            None => Err(err(
                wit_types::ErrorCode::Unavailable,
                "authz layer unreachable",
            )),
        }
    }
}

fn is_valid_permission_grammar(s: &str) -> bool {
    // Grammar: <extension-id>.<verb> — both halves required, both
    // non-empty, both built from `[a-z0-9_-]`. A leading dot, trailing
    // dot, multiple dots, or empty string all return false.
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() != 2 {
        return false;
    }
    let (prefix, verb) = (parts[0], parts[1]);
    if prefix.is_empty() || verb.is_empty() {
        return false;
    }
    let valid_char = |ch: char| matches!(ch, 'a'..='z' | '0'..='9' | '-' | '_');
    prefix.chars().all(valid_char) && verb.chars().all(valid_char)
}

// ---- ids ----

impl wit_ids::Host for HostState {
    fn mint(&mut self, kind_name: String) -> Result<wit_types::Id, wit_types::Error> {
        if !self
            .manifest
            .contributes_resource_kinds
            .iter()
            .any(|k| k == &kind_name)
        {
            return Err(err(
                wit_types::ErrorCode::Forbidden,
                format!(
                    "extension {} did not declare kind '{}' in its manifest",
                    self.extension_id, kind_name
                ),
            ));
        }
        match self.id_minter.mint(&kind_name) {
            Ok(id) => Ok(id),
            Err(MintError::UnknownKind(k)) => Err(err(
                wit_types::ErrorCode::BadInput,
                format!("unknown resource kind: {}", k),
            )),
            Err(MintError::Forbidden(reason)) => Err(err(wit_types::ErrorCode::Forbidden, reason)),
            Err(MintError::Internal(reason)) => Err(err(wit_types::ErrorCode::Internal, reason)),
        }
    }
}

// ---- storage ----

impl wit_storage::Host for HostState {
    fn create(
        &mut self,
        collection: String,
        id: wit_types::Id,
        data: Vec<u8>,
        metadata: wit_storage::DocumentMetadata,
    ) -> Result<(), wit_types::Error> {
        let json: Value = serde_json::from_slice(&data).map_err(|e| {
            err(wit_types::ErrorCode::BadInput, format!("invalid JSON: {}", e))
        })?;
        let record = crate::ExtensionDocumentRecord {
            schema_version: crate::EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
            owner_extension: self.extension_id.clone(),
            collection: collection.clone(),
            id: id.clone(),
            resource: metadata.resource_uri.clone(),
            resource_refs: metadata.resource_refs.clone(),
            visibility: "private".to_string(),
            indexed_fields: extract_indexed_fields(&json),
            version: 1,
            updated_at: self.clock.now_iso(),
            data: json,
        };
        self.store.create_document(record).map_err(|e| {
            if e.contains("already exists") {
                err(wit_types::ErrorCode::Conflict, e)
            } else {
                err(wit_types::ErrorCode::Internal, e)
            }
        })
    }

    fn get(
        &mut self,
        collection: String,
        id: wit_types::Id,
    ) -> Result<Option<wit_storage::DocSnapshot>, wit_types::Error> {
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        Ok(records
            .into_iter()
            .filter(|r| r.owner_extension == self.extension_id)
            .find(|r| r.collection == collection && r.id == id)
            .map(|r| wit_storage::DocSnapshot {
                data: serde_json::to_vec(&r.data).unwrap_or_default(),
                version: r.version.to_string(),
            }))
    }

    fn update_begin(
        &mut self,
        collection: String,
        id: wit_types::Id,
    ) -> Result<wit_storage::DocSnapshot, wit_types::Error> {
        let snap = self.get(collection.clone(), id.clone())?;
        let snap = snap.ok_or_else(|| {
            err(
                wit_types::ErrorCode::NotFound,
                format!("document not found: {}/{}", collection, id),
            )
        })?;
        let mut tokens = self
            .occ_tokens
            .write()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e.to_string()))?;
        tokens.insert(
            (self.extension_id.clone(), collection, id),
            snap.version.clone(),
        );
        Ok(snap)
    }

    fn update_commit(
        &mut self,
        collection: String,
        id: wit_types::Id,
        expected_version: wit_types::Version,
        data: Vec<u8>,
    ) -> Result<(), wit_types::Error> {
        let json: Value = serde_json::from_slice(&data).map_err(|e| {
            err(wit_types::ErrorCode::BadInput, format!("invalid JSON: {}", e))
        })?;
        // Token validation: a prior `update-begin` must have minted a
        // token matching this (extension, collection, id). Without one,
        // an extension cannot fabricate an `expected_version`.
        let token_key = (self.extension_id.clone(), collection.clone(), id.clone());
        {
            let tokens = self
                .occ_tokens
                .read()
                .map_err(|e| err(wit_types::ErrorCode::Internal, e.to_string()))?;
            let token = tokens.get(&token_key).cloned();
            drop(tokens);
            match token {
                Some(t) if t == expected_version => {}
                Some(_) => {
                    return Err(err(
                        wit_types::ErrorCode::BadInput,
                        "expected-version does not match update-begin token",
                    ));
                }
                None => {
                    return Err(err(
                        wit_types::ErrorCode::BadInput,
                        "no open update-begin for this (collection, id) on this extension",
                    ));
                }
            }
        }
        let expected_u64: u64 = expected_version
            .parse()
            .map_err(|_| err(wit_types::ErrorCode::BadInput, "expected-version must parse as u64"))?;
        let commit_result = self
            .store
            .update_document_if_version(&collection, &id, Some(expected_u64), |val, _v| {
                *val = json;
            });
        // Always drop the token, regardless of commit outcome — a failed
        // commit means the extension MUST re-issue update-begin to retry.
        if let Ok(mut tokens) = self.occ_tokens.write() {
            tokens.remove(&token_key);
        }
        match commit_result {
            Ok(()) => Ok(()),
            Err(e) if e.contains("version conflict") => Err(err(
                wit_types::ErrorCode::Conflict,
                e,
            )),
            Err(e) if e.contains("not found") => Err(err(
                wit_types::ErrorCode::NotFound,
                e,
            )),
            Err(e) => Err(err(wit_types::ErrorCode::Internal, e)),
        }
    }

    fn delete(
        &mut self,
        collection: String,
        id: wit_types::Id,
    ) -> Result<wit_types::DeleteResult, wit_types::Error> {
        match self.store.delete_document(&collection, &id) {
            Ok(()) => Ok(wit_types::DeleteResult::Deleted),
            Err(e) if e.contains("not found") => Ok(wit_types::DeleteResult::WasAbsent),
            Err(e) => Err(err(wit_types::ErrorCode::Internal, e)),
        }
    }

    fn query(
        &mut self,
        collection: String,
        _filters: Vec<wit_storage::IndexFilter>,
        _order: Option<wit_storage::OrderBy>,
        limit: u32,
        _after: Option<wit_types::PageToken>,
    ) -> Result<wit_storage::DocPage, wit_types::Error> {
        if limit > 1024 {
            return Err(err(
                wit_types::ErrorCode::BadInput,
                "limit must not exceed 1024",
            ));
        }
        // Phase 2: minimal — fetch all docs in the extension's collection
        // up to `limit`. Filter / order / cursor are TODO; the kernel's
        // existing `query_documents_by_index` covers the index-fields
        // case but not the variant index-filter shape yet.
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        let docs: Vec<Vec<u8>> = records
            .into_iter()
            .filter(|r| r.owner_extension == self.extension_id && r.collection == collection)
            .take(limit as usize)
            .map(|r| serde_json::to_vec(&r.data).unwrap_or_default())
            .collect();
        Ok(wit_storage::DocPage {
            docs,
            next_page: None,
        })
    }

    fn list_all(
        &mut self,
        collection: String,
        limit: u32,
        _after: Option<wit_types::PageToken>,
    ) -> Result<wit_storage::DocPage, wit_types::Error> {
        self.query(collection, Vec::new(), None, limit, None)
    }
}

fn extract_indexed_fields(json: &Value) -> BTreeMap<String, Value> {
    // Phase 2 stub: index every top-level scalar. The Phase 3 codegen
    // will read the extension's WIT-declared indexed fields and emit
    // a per-collection extractor.
    let mut out = BTreeMap::new();
    if let Some(obj) = json.as_object() {
        for (k, v) in obj {
            if v.is_string() || v.is_number() || v.is_boolean() || v.is_null() {
                out.insert(k.clone(), v.clone());
            }
        }
    }
    out
}

// ---- stubs (relations, comments, events, ops) ----
//
// These return `error-code::internal` with a TODO marker. The kernel
// host import wiring lands in a follow-on commit alongside the event-
// dispatcher refactor.

impl wit_relations::Host for HostState {
    fn create(
        &mut self,
        source: wit_types::Uri,
        target: wit_types::Uri,
        kind: wit_types::Uri,
        attributes: Option<Vec<u8>>,
    ) -> Result<wit_relations::CreateResult, wit_types::Error> {
        // Idempotent on (source, target, kind). Stored as documents in
        // the `relations` collection.
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        if let Some(existing) = records.iter().find(|r| {
            r.collection == "relations"
                && r.data.get("source").and_then(Value::as_str) == Some(&source)
                && r.data.get("target").and_then(Value::as_str) == Some(&target)
                && r.data.get("kind").and_then(Value::as_str) == Some(&kind)
        }) {
            return Ok(wit_relations::CreateResult::AlreadyExisted(
                record_to_relation(existing),
            ));
        }
        let id = self
            .id_minter
            .mint("relation")
            .map_err(|e| err(wit_types::ErrorCode::Internal, format!("{:?}", e)))?;
        let created_at = self.clock.now_iso();
        let data = serde_json::json!({
            "id": id,
            "source": source,
            "target": target,
            "kind": kind,
            "attributes": attributes.as_deref().and_then(|b| serde_json::from_slice::<Value>(b).ok()),
            "createdAt": created_at,
        });
        let record = crate::ExtensionDocumentRecord {
            schema_version: crate::EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
            owner_extension: "core".to_string(),
            collection: "relations".to_string(),
            id: id.clone(),
            resource: source.clone(),
            resource_refs: vec![source.clone(), target.clone()],
            visibility: "internal".to_string(),
            indexed_fields: relation_indexed_fields(&source, &target, &kind),
            version: 1,
            updated_at: created_at.clone(),
            data: data.clone(),
        };
        self.store
            .create_document(record.clone())
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        Ok(wit_relations::CreateResult::Created(record_to_relation(&record)))
    }

    fn replace_attributes(
        &mut self,
        id: wit_types::Id,
        attributes: Option<Vec<u8>>,
    ) -> Result<wit_relations::Relation, wit_types::Error> {
        let attrs_value: Value = attributes
            .as_deref()
            .and_then(|b| serde_json::from_slice::<Value>(b).ok())
            .unwrap_or(Value::Null);
        let id_for_lookup = id.clone();
        self.store
            .update_document_atomically("relations", &id, move |doc| {
                if let Some(obj) = doc.as_object_mut() {
                    obj.insert("attributes".to_string(), attrs_value);
                }
            })
            .map_err(|e| err(wit_types::ErrorCode::NotFound, e))?;
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        let record = records
            .iter()
            .find(|r| r.collection == "relations" && r.id == id_for_lookup)
            .ok_or_else(|| err(wit_types::ErrorCode::NotFound, "relation gone after update"))?;
        Ok(record_to_relation(record))
    }

    fn delete(&mut self, id: wit_types::Id) -> Result<wit_types::DeleteResult, wit_types::Error> {
        match self.store.delete_document("relations", &id) {
            Ok(()) => Ok(wit_types::DeleteResult::Deleted),
            Err(e) if e.contains("not found") => Ok(wit_types::DeleteResult::WasAbsent),
            Err(e) => Err(err(wit_types::ErrorCode::Internal, e)),
        }
    }

    fn outgoing(
        &mut self,
        source: wit_types::Uri,
        kind_filter: Option<wit_types::Uri>,
        limit: u32,
        _after: Option<wit_types::PageToken>,
    ) -> Result<wit_relations::RelationPage, wit_types::Error> {
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        let relations: Vec<wit_relations::Relation> = records
            .iter()
            .filter(|r| {
                r.collection == "relations"
                    && r.data.get("source").and_then(Value::as_str) == Some(&source)
                    && kind_filter
                        .as_deref()
                        .map(|k| r.data.get("kind").and_then(Value::as_str) == Some(k))
                        .unwrap_or(true)
            })
            .take(limit.min(1024) as usize)
            .map(record_to_relation)
            .collect();
        Ok(wit_relations::RelationPage {
            relations,
            next_page: None,
        })
    }

    fn incoming(
        &mut self,
        target: wit_types::Uri,
        kind_filter: Option<wit_types::Uri>,
        limit: u32,
        _after: Option<wit_types::PageToken>,
    ) -> Result<wit_relations::RelationPage, wit_types::Error> {
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        let relations: Vec<wit_relations::Relation> = records
            .iter()
            .filter(|r| {
                r.collection == "relations"
                    && r.data.get("target").and_then(Value::as_str) == Some(&target)
                    && kind_filter
                        .as_deref()
                        .map(|k| r.data.get("kind").and_then(Value::as_str) == Some(k))
                        .unwrap_or(true)
            })
            .take(limit.min(1024) as usize)
            .map(record_to_relation)
            .collect();
        Ok(wit_relations::RelationPage {
            relations,
            next_page: None,
        })
    }

    fn between(
        &mut self,
        source: wit_types::Uri,
        target: wit_types::Uri,
        kind_filter: Option<wit_types::Uri>,
        limit: u32,
        _after: Option<wit_types::PageToken>,
    ) -> Result<wit_relations::RelationPage, wit_types::Error> {
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        let relations: Vec<wit_relations::Relation> = records
            .iter()
            .filter(|r| {
                r.collection == "relations"
                    && r.data.get("source").and_then(Value::as_str) == Some(&source)
                    && r.data.get("target").and_then(Value::as_str) == Some(&target)
                    && kind_filter
                        .as_deref()
                        .map(|k| r.data.get("kind").and_then(Value::as_str) == Some(k))
                        .unwrap_or(true)
            })
            .take(limit.min(1024) as usize)
            .map(record_to_relation)
            .collect();
        Ok(wit_relations::RelationPage {
            relations,
            next_page: None,
        })
    }
}

fn base64_encode(bytes: &[u8]) -> String {
    const CHARS: &[u8; 64] =
        b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((bytes.len() + 2) / 3 * 4);
    let mut i = 0;
    while i + 3 <= bytes.len() {
        let n = ((bytes[i] as u32) << 16) | ((bytes[i + 1] as u32) << 8) | (bytes[i + 2] as u32);
        out.push(CHARS[((n >> 18) & 0x3F) as usize] as char);
        out.push(CHARS[((n >> 12) & 0x3F) as usize] as char);
        out.push(CHARS[((n >> 6) & 0x3F) as usize] as char);
        out.push(CHARS[(n & 0x3F) as usize] as char);
        i += 3;
    }
    let rem = bytes.len() - i;
    if rem == 1 {
        let n = (bytes[i] as u32) << 16;
        out.push(CHARS[((n >> 18) & 0x3F) as usize] as char);
        out.push(CHARS[((n >> 12) & 0x3F) as usize] as char);
        out.push('=');
        out.push('=');
    } else if rem == 2 {
        let n = ((bytes[i] as u32) << 16) | ((bytes[i + 1] as u32) << 8);
        out.push(CHARS[((n >> 18) & 0x3F) as usize] as char);
        out.push(CHARS[((n >> 12) & 0x3F) as usize] as char);
        out.push(CHARS[((n >> 6) & 0x3F) as usize] as char);
        out.push('=');
    }
    out
}

fn base64_decode(s: &str) -> Option<Vec<u8>> {
    let bytes = s.as_bytes();
    if bytes.len() % 4 != 0 {
        return None;
    }
    let lookup = |c: u8| -> Option<u32> {
        Some(match c {
            b'A'..=b'Z' => (c - b'A') as u32,
            b'a'..=b'z' => (c - b'a' + 26) as u32,
            b'0'..=b'9' => (c - b'0' + 52) as u32,
            b'+' => 62,
            b'/' => 63,
            _ => return None,
        })
    };
    let mut out = Vec::with_capacity(bytes.len() / 4 * 3);
    let mut i = 0;
    while i < bytes.len() {
        let c0 = lookup(bytes[i])?;
        let c1 = lookup(bytes[i + 1])?;
        let pad2 = bytes[i + 2] == b'=';
        let pad3 = bytes[i + 3] == b'=';
        let c2 = if pad2 { 0 } else { lookup(bytes[i + 2])? };
        let c3 = if pad3 { 0 } else { lookup(bytes[i + 3])? };
        let n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
        out.push((n >> 16) as u8);
        if !pad2 {
            out.push((n >> 8) as u8);
        }
        if !pad3 {
            out.push(n as u8);
        }
        i += 4;
    }
    Some(out)
}

fn record_to_relation(record: &crate::ExtensionDocumentRecord) -> wit_relations::Relation {
    let attrs = record.data.get("attributes").and_then(|v| {
        if v.is_null() {
            None
        } else {
            serde_json::to_vec(v).ok()
        }
    });
    wit_relations::Relation {
        id: record.id.clone(),
        kind: record
            .data
            .get("kind")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        source: record
            .data
            .get("source")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        target: record
            .data
            .get("target")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        attributes: attrs,
        // Created-at is the JSON field set at insert time; `record.updated_at`
        // advances on every replace-attributes call so it cannot stand in.
        created_at: record
            .data
            .get("createdAt")
            .and_then(Value::as_str)
            .unwrap_or(&record.updated_at)
            .to_string(),
    }
}

fn relation_indexed_fields(source: &str, target: &str, kind: &str) -> BTreeMap<String, Value> {
    let mut out = BTreeMap::new();
    out.insert("source".to_string(), Value::String(source.to_string()));
    out.insert("target".to_string(), Value::String(target.to_string()));
    out.insert("kind".to_string(), Value::String(kind.to_string()));
    out
}

impl wit_comments::Host for HostState {
    fn thread(
        &mut self,
        target: wit_types::Uri,
        limit: u32,
        _after: Option<wit_types::PageToken>,
    ) -> Result<wit_comments::CommentPage, wit_types::Error> {
        if limit == 0 || limit > 256 {
            return Err(err(
                wit_types::ErrorCode::BadInput,
                "limit must be 1..=256",
            ));
        }
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        let mut comments: Vec<wit_comments::Comment> = records
            .iter()
            .filter(|r| {
                r.collection == "comments"
                    && r.data.get("target").and_then(Value::as_str) == Some(&target)
            })
            .map(record_to_comment)
            .collect();
        comments.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        comments.truncate(limit as usize);
        Ok(wit_comments::CommentPage {
            comments,
            next_page: None,
        })
    }

    fn post(
        &mut self,
        target: wit_types::Uri,
        parent: Option<wit_types::Id>,
        body_markdown: String,
    ) -> Result<wit_comments::Comment, wit_types::Error> {
        if body_markdown.len() > 64 * 1024 {
            return Err(err(
                wit_types::ErrorCode::BadInput,
                "body must be <= 64KiB",
            ));
        }
        // Parent-cycle / non-existent-parent check.
        if let Some(parent_id) = &parent {
            let records = self
                .store
                .load_records()
                .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
            if !records
                .iter()
                .any(|r| r.collection == "comments" && r.id == *parent_id)
            {
                return Err(err(
                    wit_types::ErrorCode::BadInput,
                    "parent comment does not exist",
                ));
            }
        }
        let id = self
            .id_minter
            .mint("comment")
            .map_err(|e| err(wit_types::ErrorCode::Internal, format!("{:?}", e)))?;
        let created_at = self.clock.now_iso();
        let data = serde_json::json!({
            "id": id,
            "target": target,
            "parent": parent,
            "authorRef": self.current_principal,
            "bodyMarkdown": body_markdown,
            "createdAt": created_at,
            "updatedAt": created_at,
            "editedAt": Value::Null,
        });
        let record = crate::ExtensionDocumentRecord {
            schema_version: crate::EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
            owner_extension: "core".to_string(),
            collection: "comments".to_string(),
            id: id.clone(),
            resource: target.clone(),
            resource_refs: vec![target.clone()],
            visibility: "internal".to_string(),
            indexed_fields: {
                let mut m = BTreeMap::new();
                m.insert("target".to_string(), Value::String(target.clone()));
                m
            },
            version: 1,
            updated_at: created_at.clone(),
            data: data.clone(),
        };
        self.store
            .create_document(record.clone())
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        Ok(record_to_comment(&record))
    }

    fn edit(
        &mut self,
        id: wit_types::Id,
        body_markdown: String,
    ) -> Result<wit_comments::Comment, wit_types::Error> {
        if body_markdown.len() > 64 * 1024 {
            return Err(err(
                wit_types::ErrorCode::BadInput,
                "body must be <= 64KiB",
            ));
        }
        let now = self.clock.now_iso();
        let now_for_closure = now.clone();
        let id_for_lookup = id.clone();
        self.store
            .update_document_atomically("comments", &id, move |doc| {
                if let Some(obj) = doc.as_object_mut() {
                    obj.insert("bodyMarkdown".to_string(), Value::String(body_markdown));
                    obj.insert("editedAt".to_string(), Value::String(now_for_closure.clone()));
                    obj.insert("updatedAt".to_string(), Value::String(now_for_closure));
                }
            })
            .map_err(|e| err(wit_types::ErrorCode::NotFound, e))?;
        let records = self
            .store
            .load_records()
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        let record = records
            .iter()
            .find(|r| r.collection == "comments" && r.id == id_for_lookup)
            .ok_or_else(|| err(wit_types::ErrorCode::NotFound, "comment vanished after edit"))?;
        let _ = now;
        Ok(record_to_comment(record))
    }

    fn delete(&mut self, id: wit_types::Id) -> Result<wit_types::DeleteResult, wit_types::Error> {
        match self.store.delete_document("comments", &id) {
            Ok(()) => Ok(wit_types::DeleteResult::Deleted),
            Err(e) if e.contains("not found") => Ok(wit_types::DeleteResult::WasAbsent),
            Err(e) => Err(err(wit_types::ErrorCode::Internal, e)),
        }
    }
}

fn record_to_comment(record: &crate::ExtensionDocumentRecord) -> wit_comments::Comment {
    wit_comments::Comment {
        id: record.id.clone(),
        target: record
            .data
            .get("target")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        parent: record
            .data
            .get("parent")
            .and_then(Value::as_str)
            .map(str::to_string),
        author_ref: record
            .data
            .get("authorRef")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        body_markdown: record
            .data
            .get("bodyMarkdown")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        created_at: record
            .data
            .get("createdAt")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        updated_at: record
            .data
            .get("updatedAt")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        edited_at: record
            .data
            .get("editedAt")
            .and_then(Value::as_str)
            .map(str::to_string),
    }
}

impl wit_events::Host for HostState {
    fn append(
        &mut self,
        event_type: String,
        payload: Vec<u8>,
        source_uri: Option<wit_types::Uri>,
    ) -> Result<wit_types::Event, wit_types::Error> {
        if !self.manifest.allowed_emits.iter().any(|e| e == &event_type) {
            return Err(err(
                wit_types::ErrorCode::Forbidden,
                format!("event type '{}' not in allowed-emits", event_type),
            ));
        }
        // Payload is opaque bytes per the WIT — we persist them as a
        // base64 blob so the round-trip via `read-recent` returns the
        // same bytes the extension supplied, even when they are not
        // valid JSON.
        let payload_b64 = base64_encode(&payload);
        let source = source_uri.unwrap_or_else(|| self.extension_principal.clone());
        let id = self
            .id_minter
            .mint("event")
            .map_err(|e| err(wit_types::ErrorCode::Internal, format!("{:?}", e)))?;
        let timestamp_ms = self.clock.now_millis();
        let event = wit_types::Event {
            id: id.clone(),
            event_type: event_type.clone(),
            payload: payload.clone(),
            timestamp_ms,
            source_uri: source.clone(),
            emitter_extension: self.extension_id.clone(),
        };
        self.store
            .append_storage_event(
                &event_type,
                serde_json::json!({
                    "id": id,
                    "eventType": event_type,
                    "payloadB64": payload_b64,
                    "timestampMs": timestamp_ms,
                    "sourceUri": source,
                    "emitterExtension": self.extension_id,
                }),
            )
            .map_err(|e| err(wit_types::ErrorCode::Internal, e))?;
        Ok(event)
    }

    fn read_recent(
        &mut self,
        limit: u32,
        type_filter: Option<String>,
        source_extension_filter: Option<wit_types::ExtensionId>,
        _after: Option<wit_types::PageToken>,
    ) -> Result<wit_events::EventPage, wit_types::Error> {
        if limit == 0 || limit > 256 {
            return Err(err(
                wit_types::ErrorCode::BadInput,
                "limit must be 1..=256",
            ));
        }
        let path = self.store.events_path();
        if !path.is_file() {
            return Ok(wit_events::EventPage {
                events: Vec::new(),
                next_page: None,
            });
        }
        let source = std::fs::read_to_string(&path)
            .map_err(|e| err(wit_types::ErrorCode::Internal, e.to_string()))?;
        let mut events: Vec<wit_types::Event> = source
            .lines()
            .rev()
            .filter_map(|line| serde_json::from_str::<Value>(line).ok())
            .filter_map(|v| {
                let data = v.get("data")?;
                let emitter = data
                    .get("emitterExtension")
                    .and_then(Value::as_str)
                    .unwrap_or("core")
                    .to_string();
                // Visibility: own events + manifest-allowed extensions.
                if emitter != self.extension_id
                    && !self
                        .manifest
                        .allowed_event_reads
                        .iter()
                        .any(|e| e == &emitter)
                {
                    return None;
                }
                let event_type = data
                    .get("eventType")
                    .and_then(Value::as_str)
                    .or_else(|| v.get("type").and_then(Value::as_str))?
                    .to_string();
                if let Some(filter) = &type_filter {
                    if &event_type != filter {
                        return None;
                    }
                }
                if let Some(filter) = &source_extension_filter {
                    if &emitter != filter {
                        return None;
                    }
                }
                let payload = data
                    .get("payloadB64")
                    .and_then(Value::as_str)
                    .and_then(base64_decode)
                    .or_else(|| {
                        // Backwards compat with the legacy
                        // `payload` JSON-value field.
                        data.get("payload")
                            .map(|p| serde_json::to_vec(p).unwrap_or_default())
                    })
                    .unwrap_or_default();
                Some(wit_types::Event {
                    id: data
                        .get("id")
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string(),
                    event_type,
                    payload,
                    timestamp_ms: data
                        .get("timestampMs")
                        .and_then(Value::as_u64)
                        .or_else(|| v.get("time").and_then(Value::as_u64).map(|s| s * 1000))
                        .unwrap_or(0),
                    source_uri: data
                        .get("sourceUri")
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string(),
                    emitter_extension: emitter,
                })
            })
            .take(limit as usize)
            .collect();
        // Already reversed (newest-first) by iter().rev() over the JSONL.
        events.shrink_to_fit();
        Ok(wit_events::EventPage {
            events,
            next_page: None,
        })
    }
}

/// Counter (per HostState) for the cross-call synchronous depth. The
/// kernel enforces a cap of 32 across nested `ops.invoke` chains.
const OPS_INVOKE_DEPTH_CAP: u32 = 32;

/// Trait the kernel implements to actually dispatch a cross-extension
/// op. Defining it as a trait keeps `wasm_host.rs` from depending on
/// the kernel's extension registry shape; main.rs supplies the impl.
pub trait OpsDispatcher: Send + Sync {
    fn dispatch(
        &self,
        target_extension: &str,
        op: &str,
        payload: &[u8],
        depth: u32,
    ) -> Result<Vec<u8>, wit_types::Error>;
}

/// No-op dispatcher used in tests and during the bootstrap window
/// before the kernel registers a real implementation.
pub struct NoopDispatcher;
impl OpsDispatcher for NoopDispatcher {
    fn dispatch(
        &self,
        target_extension: &str,
        op: &str,
        _payload: &[u8],
        _depth: u32,
    ) -> Result<Vec<u8>, wit_types::Error> {
        Err(err(
            wit_types::ErrorCode::Unavailable,
            format!(
                "no dispatcher registered; cannot invoke {}/{}",
                target_extension, op
            ),
        ))
    }
}

impl wit_ops::Host for HostState {
    fn invoke(
        &mut self,
        target_extension: wit_types::ExtensionId,
        op: wit_types::OpName,
        payload: Vec<u8>,
    ) -> Result<Vec<u8>, wit_types::Error> {
        let route = format!("{}/{}", target_extension, op);
        if !self.manifest.allowed_cross_calls.iter().any(|r| r == &route) {
            return Err(err(
                wit_types::ErrorCode::Forbidden,
                format!("cross-call '{}' not in allowed-cross-calls", route),
            ));
        }
        let depth = self.ops_invoke_depth + 1;
        if depth > OPS_INVOKE_DEPTH_CAP {
            return Err(err(
                wit_types::ErrorCode::Unavailable,
                format!(
                    "ops.invoke depth cap {} exceeded",
                    OPS_INVOKE_DEPTH_CAP
                ),
            ));
        }
        self.ops_invoke_depth = depth;
        let result = self
            .ops_dispatcher
            .dispatch(&target_extension, &op, &payload, depth);
        self.ops_invoke_depth = depth - 1;
        result
    }
}

// ---- linker registration ----

/// Register every imported interface against the linker. Call once on
/// kernel startup; the resulting `Linker<HostState>` is reused across
/// every component instantiation.
pub fn add_to_linker(linker: &mut Linker<HostState>) -> wasmtime::Result<()> {
    type D = wasmtime::component::HasSelf<HostState>;
    wit_types::add_to_linker::<_, D>(linker, |s| s)?;
    wit_time::add_to_linker::<_, D>(linker, |s| s)?;
    wit_log::add_to_linker::<_, D>(linker, |s| s)?;
    wit_identity::add_to_linker::<_, D>(linker, |s| s)?;
    wit_ids::add_to_linker::<_, D>(linker, |s| s)?;
    wit_storage::add_to_linker::<_, D>(linker, |s| s)?;
    wit_relations::add_to_linker::<_, D>(linker, |s| s)?;
    wit_comments::add_to_linker::<_, D>(linker, |s| s)?;
    wit_events::add_to_linker::<_, D>(linker, |s| s)?;
    wit_ops::add_to_linker::<_, D>(linker, |s| s)?;
    Ok(())
}


/// Build a fully-configured `Linker<HostState>` ready to instantiate
/// platform-world components. Call once at kernel startup; the linker
/// is reused across every extension instantiation.
pub fn make_platform_linker(engine: &Engine) -> wasmtime::Result<Linker<HostState>> {
    let mut linker = Linker::<HostState>::new(engine);
    add_to_linker(&mut linker)?;
    Ok(linker)
}

/// Convenience constructor: build a HostState with sensible defaults
/// for an op invocation on behalf of `extension_id`.
pub fn host_state_for_op(
    extension_id: impl Into<String>,
    extension_principal: impl Into<String>,
    current_principal: impl Into<String>,
    store: Arc<ExtensionRuntimeStore>,
    manifest: Arc<HostManifest>,
    clock: Arc<dyn Clock + Send + Sync>,
    id_minter: Arc<dyn IdMinter + Send + Sync>,
    log_sink: Arc<dyn LogSink + Send + Sync>,
    authz: Arc<dyn AuthzLayer + Send + Sync>,
    ops_dispatcher: Arc<dyn OpsDispatcher>,
    occ_tokens: Arc<RwLock<BTreeMap<(String, String, String), String>>>,
) -> HostState {
    HostState {
        extension_id: extension_id.into(),
        extension_principal: extension_principal.into(),
        current_principal: current_principal.into(),
        store,
        authz,
        manifest,
        log_sink,
        clock,
        id_minter,
        occ_tokens,
        ops_dispatcher,
        ops_invoke_depth: 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn permission_grammar_accepts_valid_strings() {
        assert!(is_valid_permission_grammar("issues.write"));
        assert!(is_valid_permission_grammar("ext-issues.close-issue"));
    }

    #[test]
    fn permission_grammar_rejects_malformed() {
        assert!(!is_valid_permission_grammar(""));
        assert!(!is_valid_permission_grammar("issues"));
        assert!(!is_valid_permission_grammar("Issues.Write"));
        assert!(!is_valid_permission_grammar("issues.a.b"));
        assert!(!is_valid_permission_grammar(".write"));
    }

    #[test]
    fn iso_timestamp_round_trip() {
        let s = seconds_to_iso8601(0);
        assert_eq!(s, "1970-01-01T00:00:00Z");
        let s = seconds_to_iso8601(1_700_000_000);
        assert!(s.starts_with("2023-11-"));
    }
}

#[cfg(test)]
mod m1_ext_issues_smoke {
    //! M1 acceptance: load ext_issues.wasm under Linker<HostState>,
    //! call close-issue, assert storage state changes accordingly.
    //!
    //! Uses a second wasmtime bindgen invocation against the per-
    //! extension WIT to get a typed caller for ext-issues exports.
    //! That bindgen generates its own copies of platform types (Error,
    //! Event, etc.), which is fine — we only call into the WASM with
    //! them; the host imports the WASM calls (storage, events, etc.)
    //! are still satisfied by `HostState`'s impls of the outer bindgen
    //! traits because the Component-Model ABI is type-erased at the
    //! linker boundary.

    use std::sync::{Arc, RwLock};

    use wasmtime::component::{Component, Linker};
    use wasmtime::{Engine, Store};

    use super::*;

    wasmtime::component::bindgen!({
        path: "../../extensions/first-party/ext_issues/wit",
        world: "ext-issues",
    });

    use self::exports::comtrya::ext_issues::issues::{
        CloseIssueInput, IssueState, OpenIssueInput,
    };

    fn wasm_path() -> std::path::PathBuf {
        std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues/dist/ext_issues.wasm")
    }

    fn fresh_host_state(
        store_arc: Arc<crate::ExtensionRuntimeStore>,
    ) -> HostState {
        let manifest = Arc::new(HostManifest {
            permissions: vec!["ext_issues.write".into()],
            allowed_emits: vec![
                "dev.comtrya.issues.opened".into(),
                "dev.comtrya.issues.closed".into(),
                "dev.comtrya.issues.reopened".into(),
            ],
            allowed_event_reads: vec![],
            allowed_cross_calls: vec![],
            reactor_allowed_mutations: vec![],
            reactor_allowed_emits: vec![],
            contributes_resource_kinds: vec!["issue".into()],
            host_imports: vec![
                "storage.read".into(),
                "storage.write".into(),
                "events.read".into(),
                "events.write".into(),
                "identity".into(),
                "time".into(),
                "ids".into(),
                "log".into(),
            ],
        });
        let mut kind_prefixes = std::collections::BTreeMap::new();
        kind_prefixes.insert("issue".to_string(), "iss".to_string());
        // Kernel-internal kinds (`event`, `relation`, `comment`) are
        // added by `UlidMinter::with_kernel_kinds` below — see the
        // constructor for why this lives there.
        host_state_for_op(
            "ext_issues",
            "comtrya://extension/ext_issues",
            "comtrya://user/usr_test",
            store_arc,
            manifest,
            Arc::new(SystemClock),
            Arc::new(UlidMinter::with_kernel_kinds(kind_prefixes)),
            Arc::new(StderrLogSink),
            Arc::new(DefaultAuthz),
            Arc::new(NoopDispatcher),
            Arc::new(RwLock::new(std::collections::BTreeMap::new())),
        )
    }

    #[test]
    fn close_issue_round_trip() {
        let wasm = wasm_path();
        if !wasm.is_file() {
            // Skip rather than fail — `cargo test` on a fresh clone
            // shouldn't break for not having run the bundler. CI
            // (post-M2 build.rs) will fail loudly if the bundler step
            // is required and missing.
            eprintln!(
                "SKIP close_issue_round_trip: {} not found. Run \
                 `bash extensions/bundler/build-extension.sh \
                 extensions/first-party/ext_issues` first.",
                wasm.display()
            );
            return;
        }

        // Fresh extension store in a tempdir so the test is isolated
        // from any developer's dev state.
        let tmp = tempdir_for_test();
        let store_arc = Arc::new(
            crate::ExtensionRuntimeStore::open(&tmp).expect("open ext store"),
        );

        let engine = Engine::default();
        let linker: Linker<HostState> =
            make_platform_linker(&engine).expect("build linker");
        // The ext-issues bindgen generates host-trait stubs for
        // platform types it sees via `include`. Those duplicate the
        // outer bindgen's traits and would shadow them in the linker
        // if we called `Ext_issues::add_to_linker`. We DON'T — the
        // outer `add_to_linker` already wired the same imports against
        // `HostState`, and the Component-Model ABI doesn't care which
        // generated trait the host impl came from.

        let component =
            Component::from_file(&engine, &wasm).expect("read wasm");
        let state = fresh_host_state(store_arc.clone());
        let mut store = Store::new(&engine, state);

        let instance = linker
            .instantiate(&mut store, &component)
            .expect("instantiate ext_issues");

        // ---- open an issue ----
        let issues = ExtIssues::new(&mut store, &instance)
            .expect("bind ExtIssues world");
        let open_input = OpenIssueInput {
            repository: "comtrya://repository/repo_test".into(),
            title: "M1 smoke".into(),
            body_markdown: "test body".into(),
        };
        let opened = issues
            .comtrya_ext_issues_issues()
            .call_open_issue(&mut store, &open_input)
            .expect("open-issue call")
            .expect("open-issue ok");
        assert_eq!(opened.title, "M1 smoke");
        assert!(matches!(opened.state, IssueState::Open));
        assert_eq!(opened.number, 1);
        let issue_id = opened.id.clone();

        // ---- close it ----
        let close_input = CloseIssueInput {
            id: issue_id.clone(),
            reason: Some("completed".into()),
        };
        let closed = issues
            .comtrya_ext_issues_issues()
            .call_close_issue(&mut store, &close_input)
            .expect("close-issue call")
            .expect("close-issue ok");
        assert_eq!(closed.id, issue_id);
        assert!(matches!(closed.state, IssueState::Closed));
        assert!(closed.closed_at.is_some(), "closed_at must be set");
        assert!(closed.closed_by_ref.is_some(), "closed_by_ref must be set");

        // ---- verify persisted state via the store directly ----
        let records = store_arc.load_records().expect("load records");
        let issue_rec = records
            .iter()
            .find(|r| r.collection == "issues" && r.id == issue_id)
            .expect("issue persisted");
        assert_eq!(
            issue_rec.data.get("state").and_then(|v| v.as_str()),
            Some("closed"),
            "stored state should be closed after close-issue"
        );
    }

    /// Per-test tempdir; cleaned up when the kernel test binary exits.
    fn tempdir_for_test() -> std::path::PathBuf {
        let base = std::env::temp_dir();
        let pid = std::process::id();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let path = base.join(format!("comtrya-m1-{}-{}", pid, now));
        std::fs::create_dir_all(&path).expect("mkdir tempdir");
        path
    }
}
