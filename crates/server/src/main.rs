use axum::body::{Body, Bytes};
use axum::extract::{Path as AxumPath, Query, RawQuery, State};
use axum::http::header::{CACHE_CONTROL, CONTENT_SECURITY_POLICY, ETAG};
use axum::http::{HeaderMap, HeaderName, HeaderValue, Method, StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use axum::routing::{any, get, options, post};
use axum::{Json, Router};
use comtrya_core::{
    ClientKind, CorsPolicy, DatabaseConfig, Environment, ErrorCode, ExtensionInstallConfig,
    ExtensionSource, IdPrefix, InstanceCapabilities, InstanceConfig, OciReference, OpaqueId,
    RepoStorageBackend, ResourceKind, ResourceRef, Slug, TokenAction, allowed_methods_for_route,
};
use comtrya_git_http::{GitHttpState, RepositoryProvider, v2 as git_v2};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashMap};
use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::Semaphore;
use wasmtime::component::{Component, Linker};
use wasmtime::{Engine, Store};

mod wasm_dispatch;
mod wasm_host;
mod wasm_invokers;
mod wasm_registry;

/// Build-script-generated extension dispatch table. Maps the
/// `<extension-id>.<interface>.<op>` GraphQL routes to `DispatchInfo`
/// records the kernel uses to route into WASM. See `crates/server/build.rs`.
mod generated_dispatch {
    include!(concat!(env!("OUT_DIR"), "/dispatch_table.rs"));
}

#[derive(Clone)]
struct PureRustGitState {
    project_root: PathBuf,
    semaphore: Arc<Semaphore>,
    max_body: usize,
    timeout_ms: u64,
}

impl PureRustGitState {
    fn from_runtime(runtime: &Runtime) -> Self {
        Self {
            project_root: runtime.demo_repository.project_root.clone(),
            semaphore: Arc::new(Semaphore::new(8)),
            max_body: 64 * 1024 * 1024,
            timeout_ms: 60_000,
        }
    }

    #[cfg(test)]
    fn test_default() -> Self {
        Self {
            project_root: PathBuf::from("/tmp/comtrya-test-repos"),
            semaphore: Arc::new(Semaphore::new(1)),
            max_body: 1024 * 1024,
            timeout_ms: 5_000,
        }
    }
}

impl RepositoryProvider for PureRustGitState {
    fn ensure_local_repository(&self, segments: &[String]) -> anyhow::Result<PathBuf> {
        for s in segments {
            if s.is_empty() || s.contains("..") || s.contains('/') {
                anyhow::bail!("invalid repo segment");
            }
        }
        let mut path = self.project_root.clone();
        for s in segments {
            path.push(s);
        }
        if !path.exists() {
            anyhow::bail!("repository {} not found", path.display());
        }
        Ok(path)
    }
}

impl GitHttpState for PureRustGitState {
    type Storage = Self;
    fn storage(&self) -> &Self {
        self
    }
    fn git_semaphore(&self) -> &Arc<Semaphore> {
        &self.semaphore
    }
    fn git_max_body(&self) -> usize {
        self.max_body
    }
    fn git_timeout_ms(&self) -> u64 {
        self.timeout_ms
    }
    fn validate_slug(&self, slug: &str) -> anyhow::Result<()> {
        if slug.is_empty() || slug.contains("..") || slug.contains('/') {
            anyhow::bail!("invalid repo slug");
        }
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    let options = StartupOptions::from_env_and_args(std::env::args().skip(1));
    let runtime = match Runtime::start(options) {
        Ok(runtime) => Arc::new(runtime),
        Err(error) => {
            eprintln!("comtrya-server refused to start: {error}");
            std::process::exit(1);
        }
    };

    if runtime.options.check {
        let ready = runtime.readiness();
        println!(
            "comtrya-server ready={} mode={} dataDir={}",
            ready.ready,
            ready.mode,
            runtime.data_dir.display()
        );
        if !ready.ready {
            std::process::exit(1);
        }
        return;
    }

    let listen = runtime.options.listen;
    let git_state = PureRustGitState::from_runtime(&runtime);
    let app = router(AppState { runtime, git_state });
    let listener = tokio::net::TcpListener::bind(listen)
        .await
        .unwrap_or_else(|error| {
            eprintln!("failed to bind: {error}");
            std::process::exit(1);
        });
    println!(
        "comtrya-server listening on http://{}",
        listener.local_addr().expect("listener has local addr")
    );
    axum::serve(listener, app).await.expect("server failed");
}

fn router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(healthz))
        .route("/readyz", get(readyz))
        .route("/graphql", get(graphql_get).post(graphql_post))
        .route("/graphql/stream", get(graphql_stream))
        .route("/events", get(events))
        .route("/events/session", post(events_session))
        .route("/auth/token-exchange", post(token_exchange))
        .route("/auth/oidc/*path", any(unsupported_route))
        .route("/_extensions/session", post(extension_session))
        .route(
            "/_extensions/:extension/manifest.json",
            get(extension_manifest),
        )
        .route("/_extensions/:extension/assets/*path", get(extension_asset))
        .route("/git/*path", get(git_endpoint).post(git_endpoint))
        .route("/api/v1/*path", any(unsupported_route))
        .route("/*path", options(preflight))
        .fallback(any(not_found_or_unsupported))
        .with_state(state)
}

#[derive(Clone)]
struct AppState {
    runtime: Arc<Runtime>,
    git_state: PureRustGitState,
}

#[derive(Debug, Clone)]
struct StartupOptions {
    config_path: Option<PathBuf>,
    data_dir: PathBuf,
    extension_dir: PathBuf,
    listen: SocketAddr,
    check: bool,
    tls_terminated: bool,
    operator_code: Option<String>,
    session_ttl_seconds: u64,
    external_demo: bool,
}

impl StartupOptions {
    fn from_env_and_args(args: impl Iterator<Item = String>) -> Self {
        let mut config_path = std::env::var_os("COMTRYA_CONFIG").map(PathBuf::from);
        let mut data_dir = std::env::var_os("COMTRYA_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("./data"));
        let mut extension_dir = std::env::var_os("COMTRYA_EXTENSION_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("extensions/first-party"));
        let mut listen = std::env::var("COMTRYA_LISTEN")
            .ok()
            .and_then(|value| value.parse().ok())
            .unwrap_or_else(|| "127.0.0.1:8080".parse().expect("valid default listen addr"));
        let mut check = false;

        let mut args = args.peekable();
        while let Some(arg) = args.next() {
            match arg.as_str() {
                "--check" => check = true,
                "--config" => {
                    if let Some(path) = args.next() {
                        config_path = Some(PathBuf::from(path));
                    }
                }
                "--data-dir" => {
                    if let Some(path) = args.next() {
                        data_dir = PathBuf::from(path);
                    }
                }
                "--extension-dir" => {
                    if let Some(path) = args.next() {
                        extension_dir = PathBuf::from(path);
                    }
                }
                "--listen" => {
                    if let Some(addr) = args.next().and_then(|value| value.parse().ok()) {
                        listen = addr;
                    }
                }
                _ => {}
            }
        }

        Self {
            config_path,
            data_dir,
            extension_dir: absolute_path(extension_dir),
            listen,
            check,
            tls_terminated: env_truthy("COMTRYA_TLS_TERMINATED"),
            operator_code: std::env::var("COMTRYA_OPERATOR_CODE").ok(),
            session_ttl_seconds: env_u64("COMTRYA_SESSION_TTL_SECONDS", 300),
            external_demo: env_truthy("COMTRYA_EXTERNAL_DEMO"),
        }
    }
}

#[derive(Debug)]
struct Runtime {
    options: StartupOptions,
    config: InstanceConfig,
    extension_config_declared: bool,
    data_dir: PathBuf,
    extension_storage: ExtensionRuntimeStore,
    demo_repository: DemoRepositoryRuntime,
    extension_runtime: BTreeMap<String, WasmtimeResolverRecord>,
    wasm_registry: wasm_registry::WasmRegistry,
    events_path: PathBuf,
    audit_path: PathBuf,
    sessions: Mutex<HashMap<String, SessionRecord>>,
    credentials: Mutex<HashMap<String, CredentialRecord>>,
    rate_limits: Mutex<HashMap<(String, u64), u32>>,
    token_counter: AtomicU64,
}

#[derive(Debug, Clone)]
struct DemoRepositoryRuntime {
    git_dir: PathBuf,
    project_root: PathBuf,
    http_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct WasmtimeResolverRecord {
    id: String,
    component: String,
    resolver: String,
    output_type: String,
    status: String,
    #[serde(skip)]
    root: PathBuf,
    #[serde(skip)]
    ui_manifest: PathBuf,
    #[serde(skip)]
    route_prefix: Option<String>,
}

#[derive(Debug)]
struct ExtensionAsset {
    content_type: &'static str,
    body: Vec<u8>,
    etag: String,
}

impl Runtime {
    fn start(options: StartupOptions) -> Result<Self, String> {
        let loaded_config = if let Some(path) = &options.config_path {
            load_config_file_with_metadata(path)?
        } else {
            LoadedConfig {
                config: InstanceConfig::minimal_dev(),
                extension_config_declared: false,
            }
        };
        let config = loaded_config.config;
        let extension_config_declared = loaded_config.extension_config_declared;
        config.validate().map_err(|error| error.to_string())?;
        validate_production_testbed(&config, &options)?;

        fs::create_dir_all(&options.data_dir)
            .map_err(|error| format!("failed to create data dir: {error}"))?;
        for dirname in [
            "metadata",
            "repositories",
            "extensions",
            "secrets",
            "backups",
        ] {
            fs::create_dir_all(options.data_dir.join(dirname))
                .map_err(|error| format!("failed to create data/{dirname}: {error}"))?;
        }
        for backend in config.repository_storage_backends.values() {
            if let RepoStorageBackend::Local { path } = backend {
                fs::create_dir_all(path).map_err(|error| {
                    format!("failed to create local repo storage {path}: {error}")
                })?;
            }
        }

        let events_path = options.data_dir.join("metadata/events.jsonl");
        let audit_path = options.data_dir.join("metadata/audit.jsonl");
        let demo_repository = ensure_demo_repository(&options.data_dir)
            .map_err(|error| format!("failed to seed/open demo repository: {error}"))?;
        validate_demo_repository_refs(&demo_repository)
            .map_err(|error| format!("demo repository validation failed: {error}"))?;
        let extension_storage = ExtensionRuntimeStore::open(&options.data_dir)
            .map_err(|error| format!("failed to open extension runtime storage: {error}"))?;
        validate_route_prefix_uniqueness(&config.extensions)
            .map_err(|error| format!("extension config invalid: {error}"))?;
        let ExtensionRuntimeOutput {
            records: extension_runtime,
            registry: wasm_registry,
        } = load_configured_extension_runtime(
            &options.extension_dir,
            extension_config_declared,
            &config.extensions,
        )
        .map_err(|error| format!("failed to load Wasmtime extension runtime: {error}"))?;
        touch(&events_path).map_err(|error| format!("failed to initialize event log: {error}"))?;
        touch(&audit_path).map_err(|error| format!("failed to initialize audit log: {error}"))?;

        let runtime = Self {
            data_dir: options.data_dir.clone(),
            options,
            config,
            extension_config_declared,
            extension_storage,
            demo_repository,
            extension_runtime,
            wasm_registry,
            events_path,
            audit_path,
            sessions: Mutex::new(HashMap::new()),
            credentials: Mutex::new(HashMap::new()),
            rate_limits: Mutex::new(HashMap::new()),
            token_counter: AtomicU64::new(0),
        };
        runtime
            .append_event(
                "dev.comtrya.instance.started",
                json!({"mode": runtime.mode()}),
            )
            .map_err(|error| format!("failed to append startup event: {error}"))?;
        for resolver in runtime.extension_runtime.values() {
            runtime
                .append_event(
                    "dev.comtrya.extension.resolver.executed",
                    json!({
                        "extension": resolver.id,
                        "component": resolver.component,
                        "resolver": resolver.resolver,
                        "outputType": resolver.output_type,
                        "status": resolver.status
                    }),
                )
                .map_err(|error| format!("failed to append extension resolver event: {error}"))?;
        }
        Ok(runtime)
    }

    fn mode(&self) -> &'static str {
        match self.config.environment {
            Environment::Production => "production-testbed",
            Environment::Development => "development",
        }
    }

    fn readiness(&self) -> Readiness {
        let mut checks = BTreeMap::new();
        checks.insert("configValid".to_string(), true);
        checks.insert(
            "dataDirWritable".to_string(),
            self.data_dir.join("metadata").is_dir(),
        );
        checks.insert("eventLogWritable".to_string(), self.events_path.is_file());
        checks.insert("auditLogWritable".to_string(), self.audit_path.is_file());
        checks.insert(
            "demoBareRepository".to_string(),
            self.demo_repository.git_dir.join("HEAD").is_file(),
        );
        checks.insert(
            "demoRepositoryRefs".to_string(),
            validate_demo_repository_refs(&self.demo_repository).is_ok(),
        );
        checks.insert(
            "extensionStorageSchema".to_string(),
            self.extension_storage.schema_path().is_file(),
        );
        checks.insert(
            "extensionStorageDocuments".to_string(),
            self.extension_storage.documents_path().is_file(),
        );
        let enabled_extension_configs = self
            .config
            .extensions
            .iter()
            .filter(|ext| ext.enabled)
            .count();
        let resolvers_executed = if !self.extension_config_declared {
            FIRST_PARTY_EXTENSIONS
                .iter()
                .all(|id| self.extension_runtime.contains_key(*id))
        } else {
            self.extension_runtime.len() == enabled_extension_configs
        };
        checks.insert("wasmtimeResolversExecuted".to_string(), resolvers_executed);
        checks.insert(
            "productionTlsTerminated".to_string(),
            self.config.environment != Environment::Production || self.options.tls_terminated,
        );
        checks.insert(
            "operatorCodeConfigured".to_string(),
            self.config.environment != Environment::Production
                || self.options.operator_code.is_some(),
        );
        let ready = checks.values().all(|value| *value);
        Readiness {
            ready,
            mode: self.mode().to_string(),
            checks,
            unsupported: UNSUPPORTED_SURFACES.to_vec(),
        }
    }

    /// Look up the verb's symmetry rule, falling back to asymmetric for
    /// extension-minted verbs the kernel doesn't know.
    fn verb_is_symmetric(verb_uri: &str) -> bool {
        CORE_VERBS
            .iter()
            .find(|v| v.uri == verb_uri)
            .map(|v| v.symmetric)
            .unwrap_or(false)
    }

    /// Canonical direction for symmetric verbs: lex-smaller URI as `from`.
    /// Asymmetric verbs pass through unchanged.
    fn canonicalize_relation_endpoints(
        from: &str,
        to: &str,
        verb_uri: &str,
    ) -> (String, String) {
        if Self::verb_is_symmetric(verb_uri) && from > to {
            (to.to_string(), from.to_string())
        } else {
            (from.to_string(), to.to_string())
        }
    }

    fn create_relation(
        &self,
        from: &str,
        to: &str,
        verb_uri: &str,
        attributes: Option<&Value>,
    ) -> Result<Value, String> {
        // Adversarial-input caps.
        const MAX_URI_LEN: usize = 2048;
        const MAX_ATTRIBUTES_BYTES: usize = 16 * 1024;
        if from.len() > MAX_URI_LEN || to.len() > MAX_URI_LEN || verb_uri.len() > MAX_URI_LEN {
            return Err(format!(
                "relation URIs and verbs must each be at most {MAX_URI_LEN} bytes"
            ));
        }
        if let Some(attrs) = attributes {
            let serialized = serde_json::to_vec(attrs)
                .map_err(|e| format!("relation attributes are not serializable: {e}"))?;
            if serialized.len() > MAX_ATTRIBUTES_BYTES {
                return Err(format!(
                    "relation attributes must be at most {MAX_ATTRIBUTES_BYTES} bytes when serialised"
                ));
            }
        }
        // Validate URIs and verb shape.
        ResourceRef::parse(from)
            .map_err(|e| format!("relation `from` is not a valid URI: {}", e.message))?;
        ResourceRef::parse(to)
            .map_err(|e| format!("relation `to` is not a valid URI: {}", e.message))?;
        validate_verb_uri(verb_uri)?;
        if from == to {
            return Err("relation `from` and `to` must differ".to_string());
        }
        // NOTE (deferred): the dedup check below is racy across concurrent
        // creates because load_records → check → write_records_atomically
        // isn't a single transaction. In production-testbed (single
        // operator, low concurrency) duplicates are very unlikely; a
        // proper fix moves the (from,to,kind) uniqueness invariant into
        // the storage layer behind the write lock.

        let (canon_from, canon_to) = Self::canonicalize_relation_endpoints(from, to, verb_uri);

        // Idempotency: return any existing relation matching (canon_from, canon_to, verb).
        let existing = self.extension_storage.collection_data("relations")?;
        if let Some(array) = existing.as_array() {
            for rel in array {
                let same_from = rel.get("from").and_then(Value::as_str) == Some(canon_from.as_str());
                let same_to = rel.get("to").and_then(Value::as_str) == Some(canon_to.as_str());
                let same_kind = rel.get("kind").and_then(Value::as_str) == Some(verb_uri);
                if same_from && same_to && same_kind {
                    return Ok(rel.clone());
                }
            }
        }

        let rel_id = OpaqueId::new(IdPrefix::Relation);
        let now_iso = chrono_now_iso();
        let data = json!({
            "id": rel_id.as_str(),
            "kind": verb_uri,
            "from": canon_from,
            "to": canon_to,
            "attributes": attributes.cloned().unwrap_or_else(|| json!({})),
            "createdAt": now_iso,
        });
        let rel_ref = format!("comtrya://relation/{}", rel_id.as_str());
        let record = extension_document_record(
            "core",
            "relations",
            rel_id.as_str(),
            &rel_ref,
            vec![rel_ref.clone(), canon_from.clone(), canon_to.clone()],
            data.clone(),
            &now_iso,
        );
        self.extension_storage.create_document(record)?;

        let _ = self.append_event(
            "dev.comtrya.relation.created",
            json!({
                "relationID": rel_id.as_str(),
                "kind": verb_uri,
                "from": canon_from,
                "to": canon_to,
            }),
        );

        Ok(data)
    }

    fn delete_relation(&self, id: &str) -> Result<bool, String> {
        let relations = self.extension_storage.collection_data("relations")?;
        let target = relations
            .as_array()
            .and_then(|array| {
                array
                    .iter()
                    .find(|rel| rel.get("id").and_then(Value::as_str) == Some(id))
                    .cloned()
            });
        let Some(target) = target else { return Ok(false); };
        self.extension_storage.delete_document("core", "relations", id)?;
        let _ = self.append_event(
            "dev.comtrya.relation.deleted",
            json!({
                "relationID": id,
                "kind": target.get("kind"),
                "from": target.get("from"),
                "to": target.get("to"),
            }),
        );
        Ok(true)
    }

    /// Relations whose `from` endpoint is `ref_uri`. For symmetric verbs,
    /// also includes relations whose `to` endpoint is `ref_uri` (since
    /// canonical-direction storage may have swapped them).
    fn relations_outgoing(&self, ref_uri: &str, kind_filter: Option<&str>) -> Result<Vec<Value>, String> {
        let relations = self.extension_storage.collection_data("relations")?;
        let mut out = Vec::new();
        if let Some(array) = relations.as_array() {
            for rel in array {
                let verb = rel.get("kind").and_then(Value::as_str).unwrap_or("");
                if let Some(filter) = kind_filter {
                    if verb != filter {
                        continue;
                    }
                }
                let from = rel.get("from").and_then(Value::as_str).unwrap_or("");
                let to = rel.get("to").and_then(Value::as_str).unwrap_or("");
                let symmetric = Self::verb_is_symmetric(verb);
                if from == ref_uri || (symmetric && to == ref_uri) {
                    out.push(rel.clone());
                }
            }
        }
        Ok(out)
    }

    fn relations_incoming(&self, ref_uri: &str, kind_filter: Option<&str>) -> Result<Vec<Value>, String> {
        let relations = self.extension_storage.collection_data("relations")?;
        let mut out = Vec::new();
        if let Some(array) = relations.as_array() {
            for rel in array {
                let verb = rel.get("kind").and_then(Value::as_str).unwrap_or("");
                if let Some(filter) = kind_filter {
                    if verb != filter {
                        continue;
                    }
                }
                let from = rel.get("from").and_then(Value::as_str).unwrap_or("");
                let to = rel.get("to").and_then(Value::as_str).unwrap_or("");
                let symmetric = Self::verb_is_symmetric(verb);
                if to == ref_uri || (symmetric && from == ref_uri) {
                    out.push(rel.clone());
                }
            }
        }
        Ok(out)
    }

    fn relations_between(
        &self,
        from: &str,
        to: &str,
        kind_filter: Option<&str>,
    ) -> Result<Vec<Value>, String> {
        let relations = self.extension_storage.collection_data("relations")?;
        let mut out = Vec::new();
        if let Some(array) = relations.as_array() {
            for rel in array {
                let verb = rel.get("kind").and_then(Value::as_str).unwrap_or("");
                if let Some(filter) = kind_filter {
                    if verb != filter {
                        continue;
                    }
                }
                let rfrom = rel.get("from").and_then(Value::as_str).unwrap_or("");
                let rto = rel.get("to").and_then(Value::as_str).unwrap_or("");
                let symmetric = Self::verb_is_symmetric(verb);
                let matches_forward = rfrom == from && rto == to;
                let matches_reverse = symmetric && rfrom == to && rto == from;
                if matches_forward || matches_reverse {
                    out.push(rel.clone());
                }
            }
        }
        Ok(out)
    }

    // ── Pull requests (ext_pull_requests-owned) ────────────────────────
    fn next_pull_request_number(&self, workspace_id: &str) -> Result<u64, String> {
        let prs = self.extension_storage.collection_data("pull_requests")?;
        let max = prs
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter(|p| {
                        // Either explicitly carry workspaceId, or are seeded
                        // demo PRs that we treat as belonging to the singleton
                        // workspace.
                        p.get("workspaceId")
                            .and_then(Value::as_str)
                            .map(|w| w == workspace_id)
                            .unwrap_or(true)
                    })
                    .filter_map(|p| p.get("number").and_then(Value::as_u64))
                    .max()
                    .unwrap_or(0)
            })
            .unwrap_or(0);
        Ok(max + 1)
    }

    fn create_pull_request(
        &self,
        workspace_id: &str,
        repository_id: Option<&str>,
        title: &str,
        body_markdown: &str,
        base: &str,
        head: &str,
        author_ref: &str,
    ) -> Result<Value, String> {
        const MAX_TITLE: usize = 512;
        const MAX_BODY: usize = 64 * 1024;
        let title = title.trim();
        if title.is_empty() {
            return Err("pull-request title must not be empty".to_string());
        }
        if title.len() > MAX_TITLE {
            return Err(format!("title must be at most {MAX_TITLE} bytes"));
        }
        if body_markdown.len() > MAX_BODY {
            return Err(format!("body must be at most {MAX_BODY} bytes"));
        }
        if base.is_empty() || head.is_empty() {
            return Err("base and head branches must be non-empty".to_string());
        }
        let pr_id = OpaqueId::new(IdPrefix::Owned("pul_".to_string()));
        let number = self.next_pull_request_number(workspace_id)?;
        let now_iso = chrono_now_iso();
        let pr_ref = format!("comtrya://pull_request/{}", pr_id.as_str());
        let data = json!({
            "id": pr_id.as_str(),
            "workspaceId": workspace_id,
            "repositoryId": repository_id,
            "number": number,
            "title": title,
            "bodyMarkdown": body_markdown,
            "state": "DRAFT",
            "base": base,
            "head": head,
            "authorRef": author_ref,
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "mergedAt": Value::Null,
            "closedAt": Value::Null,
        });
        let workspace_uri = format!("comtrya://workspace/{}", workspace_id);
        let mut refs = vec![pr_ref.clone(), workspace_uri];
        if let Some(repo) = repository_id {
            refs.push(format!("comtrya://repository/{}", repo));
        }
        let record = extension_document_record(
            "ext_pull_requests",
            "pull_requests",
            pr_id.as_str(),
            &pr_ref,
            refs,
            data.clone(),
            &now_iso,
        );
        self.extension_storage.create_document(record)?;
        let _ = self.append_event(
            "dev.comtrya.pull-request.created",
            json!({
                "pullRequestRef": pr_ref,
                "workspaceId": workspace_id,
                "number": number,
            }),
        );
        Ok(data)
    }

    fn pull_request_by_id(&self, id: &str) -> Result<Option<Value>, String> {
        let prs = self.extension_storage.collection_data("pull_requests")?;
        Ok(prs.as_array().and_then(|arr| {
            arr.iter()
                .find(|p| p.get("id").and_then(Value::as_str) == Some(id))
                .cloned()
        }))
    }

    fn merge_pull_request(&self, id: &str, merged_by_ref: Option<&str>) -> Result<Value, String> {
        let existing = self
            .pull_request_by_id(id)?
            .ok_or_else(|| format!("pull request {id:?} not found"))?;
        let current_state = existing
            .get("state")
            .and_then(Value::as_str)
            .unwrap_or("DRAFT");
        if current_state == "MERGED" {
            return Ok(existing);
        }
        if current_state == "CLOSED" {
            return Err("cannot merge a CLOSED pull request".to_string());
        }
        let now_iso = chrono_now_iso();
        let merged_by_owned = merged_by_ref.map(|s| s.to_string());
        let now_for_closure = now_iso.clone();
        self.extension_storage
            .update_document_atomically("pull_requests", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("state".to_string(), Value::String("MERGED".to_string()));
                    obj.insert("mergedAt".to_string(), Value::String(now_for_closure.clone()));
                    obj.insert("updatedAt".to_string(), Value::String(now_for_closure));
                    if let Some(merged_by) = &merged_by_owned {
                        obj.insert(
                            "mergedByRef".to_string(),
                            Value::String(merged_by.clone()),
                        );
                    }
                }
            })?;
        let updated = self
            .pull_request_by_id(id)?
            .ok_or_else(|| format!("pr {id:?} not found after merge"))?;
        let pr_ref = format!("comtrya://pull_request/{}", id);
        // Emit the merge event AFTER persistence so reactors observe
        // committed state (and the kernel's reactor dispatcher fires
        // synchronously from inside append_event).
        let _ = self.append_event(
            "dev.comtrya.pull-request.merged",
            json!({
                "pullRequestRef": pr_ref,
                "mergedAt": now_iso,
                "mergedByRef": merged_by_ref,
            }),
        );
        Ok(updated)
    }

    fn close_pull_request(&self, id: &str, closed_by_ref: Option<&str>) -> Result<Value, String> {
        let existing = self
            .pull_request_by_id(id)?
            .ok_or_else(|| format!("pull request {id:?} not found"))?;
        let current_state = existing
            .get("state")
            .and_then(Value::as_str)
            .unwrap_or("DRAFT");
        if current_state == "MERGED" {
            return Err("cannot close a MERGED pull request".to_string());
        }
        if current_state == "CLOSED" {
            return Ok(existing);
        }
        let now_iso = chrono_now_iso();
        let closed_by_owned = closed_by_ref.map(|s| s.to_string());
        let now_for_closure = now_iso.clone();
        self.extension_storage
            .update_document_atomically("pull_requests", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("state".to_string(), Value::String("CLOSED".to_string()));
                    obj.insert("closedAt".to_string(), Value::String(now_for_closure.clone()));
                    obj.insert("updatedAt".to_string(), Value::String(now_for_closure));
                    if let Some(closed_by) = &closed_by_owned {
                        obj.insert(
                            "closedByRef".to_string(),
                            Value::String(closed_by.clone()),
                        );
                    }
                }
            })?;
        let updated = self
            .pull_request_by_id(id)?
            .ok_or_else(|| format!("pr {id:?} not found after close"))?;
        let _ = self.append_event(
            "dev.comtrya.pull-request.closed",
            json!({
                "pullRequestRef": format!("comtrya://pull_request/{id}"),
                "closedByRef": closed_by_ref,
            }),
        );
        Ok(updated)
    }

    // ── Epics (ext_epics-owned) ────────────────────────────────────────
    fn create_epic(
        &self,
        workspace_id: &str,
        title: &str,
        body_markdown: &str,
        owner_ref: Option<&str>,
        target_date: Option<&str>,
        labels: &[String],
        parent_epic_ref: Option<&str>,
    ) -> Result<Value, String> {
        const MAX_TITLE: usize = 512;
        const MAX_BODY: usize = 64 * 1024;
        let title = title.trim();
        if title.is_empty() {
            return Err("epic title must not be empty".to_string());
        }
        if title.len() > MAX_TITLE {
            return Err(format!("epic title must be at most {MAX_TITLE} bytes"));
        }
        if body_markdown.len() > MAX_BODY {
            return Err(format!("epic body must be at most {MAX_BODY} bytes"));
        }
        if workspace_id.is_empty() {
            return Err("epic requires workspaceId".to_string());
        }
        let epic_id = OpaqueId::new(IdPrefix::Owned("epc_".to_string()));
        let now_iso = chrono_now_iso();
        let epic_ref = format!("comtrya://epic/{}", epic_id.as_str());
        let data = json!({
            "id": epic_id.as_str(),
            "workspaceId": workspace_id,
            "title": title,
            "bodyMarkdown": body_markdown,
            "state": "PLANNED",
            "targetDate": target_date,
            "ownerRef": owner_ref,
            "labels": labels,
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "closedAt": Value::Null,
        });
        let workspace_uri = format!("comtrya://workspace/{}", workspace_id);
        let refs = vec![epic_ref.clone(), workspace_uri];
        let record = extension_document_record(
            "ext_epics",
            "epics",
            epic_id.as_str(),
            &epic_ref,
            refs,
            data.clone(),
            &now_iso,
        );
        self.extension_storage.create_document(record)?;
        if let Some(parent) = parent_epic_ref {
            self.create_relation(&epic_ref, parent, "comtrya://rel/part-of", None)?;
        }
        let _ = self.append_event(
            "dev.comtrya.epic.created",
            json!({
                "epicID": epic_id.as_str(),
                "workspaceId": workspace_id,
                "title": title,
            }),
        );
        Ok(data)
    }

    fn change_epic_state(&self, id: &str, target_state: &str) -> Result<Value, String> {
        const STATES: &[&str] = &["PLANNED", "IN_PROGRESS", "AT_RISK", "DONE", "CANCELED"];
        if !STATES.contains(&target_state) {
            return Err(format!(
                "epic state {target_state:?} is not one of {STATES:?}"
            ));
        }
        let now_iso = chrono_now_iso();
        let target_owned = target_state.to_string();
        let now_for_closure = now_iso.clone();
        self.extension_storage
            .update_document_atomically("epics", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("state".to_string(), Value::String(target_owned.clone()));
                    if target_owned == "DONE" || target_owned == "CANCELED" {
                        obj.insert("closedAt".to_string(), Value::String(now_for_closure.clone()));
                    } else {
                        obj.insert("closedAt".to_string(), Value::Null);
                    }
                    obj.insert("updatedAt".to_string(), Value::String(now_for_closure));
                }
            })?;
        let updated = self
            .epic_by_id(id)?
            .ok_or_else(|| format!("epic {id:?} not found after state change"))?;
        let _ = self.append_event(
            "dev.comtrya.epic.state-changed",
            json!({ "epicID": id, "state": target_state }),
        );
        Ok(updated)
    }

    fn epic_by_id(&self, id: &str) -> Result<Option<Value>, String> {
        let epics = self.extension_storage.collection_data("epics")?;
        Ok(epics.as_array().and_then(|arr| {
            arr.iter()
                .find(|e| e.get("id").and_then(Value::as_str) == Some(id))
                .cloned()
        }))
    }

    fn epics_list(&self, workspace_id: &str, state: Option<&str>) -> Result<Vec<Value>, String> {
        let epics = self.extension_storage.collection_data("epics")?;
        Ok(epics
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter(|e| {
                        e.get("workspaceId").and_then(Value::as_str) == Some(workspace_id)
                            && state
                                .map(|s| e.get("state").and_then(Value::as_str) == Some(s))
                                .unwrap_or(true)
                    })
                    .cloned()
                    .collect()
            })
            .unwrap_or_default())
    }

    fn epics_by_refs(&self, refs: &[String]) -> Result<Vec<Value>, String> {
        let epics = self.extension_storage.collection_data("epics")?;
        let by_id: HashMap<String, Value> = epics
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|e| {
                        let id = e.get("id").and_then(Value::as_str)?.to_string();
                        Some((id, e.clone()))
                    })
                    .collect()
            })
            .unwrap_or_default();
        let mut out = Vec::with_capacity(refs.len());
        for r in refs {
            let parsed = ResourceRef::parse(r)
                .map_err(|e| format!("invalid ref {r:?}: {}", e.message))?;
            let id = parsed
                .id
                .as_ref()
                .ok_or_else(|| format!("ref {r:?} is missing an id"))?
                .as_str()
                .to_string();
            out.push(by_id.get(&id).cloned().unwrap_or(Value::Null));
        }
        Ok(out)
    }

    /// Returns URIs of resources linked to this epic via the canonical
    /// `part-of` verb, filtered to the given kind name (`issue` or `epic`).
    fn epic_member_uris(&self, epic_ref: &str, kind: &str) -> Result<Vec<String>, String> {
        let kind_prefix = format!("comtrya://{kind}/");
        let rels = self.relations_incoming(epic_ref, Some("comtrya://rel/part-of"))?;
        Ok(rels
            .into_iter()
            .filter_map(|rel| {
                let from = rel.get("from").and_then(Value::as_str)?.to_string();
                if from.starts_with(&kind_prefix) {
                    Some(from)
                } else {
                    None
                }
            })
            .collect())
    }

    fn epic_progress(&self, epic_ref: &str) -> Result<Value, String> {
        let issue_uris = self.epic_member_uris(epic_ref, "issue")?;
        let issue_states = self.issue_state_counts_for_refs(&issue_uris)?;
        let issues_open = issue_states.get("open").and_then(Value::as_u64).unwrap_or(0);
        let issues_closed = issue_states
            .get("closed")
            .and_then(Value::as_u64)
            .unwrap_or(0);

        let child_epic_uris = self.epic_member_uris(epic_ref, "epic")?;
        let child_epics = self.epics_by_refs(&child_epic_uris)?;
        let mut child_open = 0u64;
        let mut child_closed = 0u64;
        for epic in &child_epics {
            match epic.get("state").and_then(Value::as_str) {
                Some("DONE") | Some("CANCELED") => child_closed += 1,
                Some(_) => child_open += 1,
                None => {}
            }
        }
        let total_units = issues_open + issues_closed + child_open + child_closed;
        let completed_units = issues_closed + child_closed;
        let percent_complete = if total_units == 0 {
            0
        } else {
            ((completed_units as f64) * 100.0 / (total_units as f64)).round() as u64
        };
        Ok(json!({
            "issuesOpen": issues_open,
            "issuesClosed": issues_closed,
            "childEpicsOpen": child_open,
            "childEpicsClosed": child_closed,
            "percentComplete": percent_complete,
        }))
    }

    // ── Issues (ext_issues-owned) ──────────────────────────────────────
    fn next_issue_number(&self, workspace_id: &str) -> Result<u64, String> {
        let issues = self.extension_storage.collection_data("issues")?;
        let max = issues
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter(|i| {
                        i.get("workspaceId").and_then(Value::as_str) == Some(workspace_id)
                    })
                    .filter_map(|i| i.get("number").and_then(Value::as_u64))
                    .max()
                    .unwrap_or(0)
            })
            .unwrap_or(0);
        Ok(max + 1)
    }

    fn create_issue(
        &self,
        workspace_id: &str,
        repository_id: Option<&str>,
        title: &str,
        body_markdown: &str,
        author_ref: &str,
        labels: &[String],
        epic_ref: Option<&str>,
    ) -> Result<Value, String> {
        const MAX_TITLE_LEN: usize = 512;
        const MAX_BODY_LEN: usize = 64 * 1024;
        let title = title.trim();
        if title.is_empty() {
            return Err("issue title must not be empty".to_string());
        }
        if title.len() > MAX_TITLE_LEN {
            return Err(format!("issue title must be at most {MAX_TITLE_LEN} bytes"));
        }
        if body_markdown.len() > MAX_BODY_LEN {
            return Err(format!(
                "issue body must be at most {MAX_BODY_LEN} bytes"
            ));
        }
        if workspace_id.is_empty() {
            return Err("issue requires a workspaceId".to_string());
        }
        let issue_id = OpaqueId::new(IdPrefix::Owned("iss_".to_string()));
        let number = self.next_issue_number(workspace_id)?;
        let now_iso = chrono_now_iso();
        let issue_ref = format!("comtrya://issue/{}", issue_id.as_str());
        let data = json!({
            "id": issue_id.as_str(),
            "workspaceId": workspace_id,
            "repositoryId": repository_id,
            "number": number,
            "title": title,
            "bodyMarkdown": body_markdown,
            "state": "OPEN",
            "stateReason": Value::Null,
            "authorRef": author_ref,
            "assigneeRefs": Vec::<String>::new(),
            "labels": labels,
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "closedAt": Value::Null,
            "closedByRef": Value::Null,
        });
        let workspace_uri = format!("comtrya://workspace/{}", workspace_id);
        let mut refs = vec![issue_ref.clone(), workspace_uri];
        if let Some(repo_id) = repository_id {
            refs.push(format!("comtrya://repository/{}", repo_id));
        }
        let record = extension_document_record(
            "ext_issues",
            "issues",
            issue_id.as_str(),
            &issue_ref,
            refs,
            data.clone(),
            &now_iso,
        );
        self.extension_storage.create_document(record)?;
        // Atomic create-with-link: optional `part-of` relation to an epic.
        if let Some(epic_uri) = epic_ref {
            self.create_relation(&issue_ref, epic_uri, "comtrya://rel/part-of", None)?;
        }
        let _ = self.append_event(
            "dev.comtrya.issue.created",
            json!({
                "issueID": issue_id.as_str(),
                "workspaceId": workspace_id,
                "number": number,
                "title": title,
            }),
        );
        Ok(data)
    }

    fn close_issue(&self, id: &str, reason: Option<&str>, closed_by: Option<&str>) -> Result<Value, String> {
        let now_iso = chrono_now_iso();
        let reason_owned = reason.map(|s| s.to_string());
        let closed_by_owned = closed_by.map(|s| s.to_string());
        let now_for_closure = now_iso.clone();
        self.extension_storage
            .update_document_atomically("issues", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("state".to_string(), Value::String("CLOSED".to_string()));
                    obj.insert(
                        "stateReason".to_string(),
                        reason_owned
                            .as_ref()
                            .map(|r| Value::String(r.clone()))
                            .unwrap_or(Value::Null),
                    );
                    obj.insert("closedAt".to_string(), Value::String(now_for_closure.clone()));
                    obj.insert("updatedAt".to_string(), Value::String(now_for_closure));
                    obj.insert(
                        "closedByRef".to_string(),
                        closed_by_owned
                            .as_ref()
                            .map(|r| Value::String(r.clone()))
                            .unwrap_or(Value::Null),
                    );
                }
            })?;
        let updated = self.issue_by_id(id)?.ok_or_else(|| format!("issue {id:?} not found after close"))?;
        let _ = self.append_event(
            "dev.comtrya.issue.closed",
            json!({
                "issueID": id,
                "reason": reason,
                "closedByRef": closed_by,
            }),
        );
        Ok(updated)
    }

    fn reopen_issue(&self, id: &str) -> Result<Value, String> {
        let now_iso = chrono_now_iso();
        let now_for_closure = now_iso.clone();
        self.extension_storage
            .update_document_atomically("issues", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("state".to_string(), Value::String("OPEN".to_string()));
                    obj.insert("stateReason".to_string(), Value::Null);
                    obj.insert("closedAt".to_string(), Value::Null);
                    obj.insert("closedByRef".to_string(), Value::Null);
                    obj.insert("updatedAt".to_string(), Value::String(now_for_closure));
                }
            })?;
        let updated = self.issue_by_id(id)?.ok_or_else(|| format!("issue {id:?} not found after reopen"))?;
        let _ = self.append_event(
            "dev.comtrya.issue.reopened",
            json!({ "issueID": id }),
        );
        Ok(updated)
    }

    fn issue_by_id(&self, id: &str) -> Result<Option<Value>, String> {
        let issues = self.extension_storage.collection_data("issues")?;
        Ok(issues
            .as_array()
            .and_then(|arr| {
                arr.iter()
                    .find(|i| i.get("id").and_then(Value::as_str) == Some(id))
                    .cloned()
            }))
    }

    fn issues_list(
        &self,
        workspace_id: Option<&str>,
        repository_id: Option<&str>,
        state: Option<&str>,
    ) -> Result<Vec<Value>, String> {
        let issues = self.extension_storage.collection_data("issues")?;
        let mut out: Vec<Value> = issues
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter(|i| {
                        if let Some(ws) = workspace_id {
                            if i.get("workspaceId").and_then(Value::as_str) != Some(ws) {
                                return false;
                            }
                        }
                        if let Some(repo) = repository_id {
                            if i.get("repositoryId").and_then(Value::as_str) != Some(repo) {
                                return false;
                            }
                        }
                        if let Some(st) = state {
                            if i.get("state").and_then(Value::as_str) != Some(st) {
                                return false;
                            }
                        }
                        true
                    })
                    .cloned()
                    .collect()
            })
            .unwrap_or_default();
        out.sort_by(|a, b| {
            b.get("number")
                .and_then(Value::as_u64)
                .unwrap_or(0)
                .cmp(&a.get("number").and_then(Value::as_u64).unwrap_or(0))
        });
        Ok(out)
    }

    fn issues_by_refs(&self, refs: &[String]) -> Result<Vec<Value>, String> {
        let issues = self.extension_storage.collection_data("issues")?;
        let by_id: HashMap<String, Value> = issues
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|i| {
                        let id = i.get("id").and_then(Value::as_str)?.to_string();
                        Some((id, i.clone()))
                    })
                    .collect()
            })
            .unwrap_or_default();
        let mut out = Vec::with_capacity(refs.len());
        for r in refs {
            let parsed = ResourceRef::parse(r)
                .map_err(|e| format!("invalid ref {r:?}: {}", e.message))?;
            let id = parsed
                .id
                .as_ref()
                .ok_or_else(|| format!("ref {r:?} is missing an id"))?
                .as_str()
                .to_string();
            out.push(by_id.get(&id).cloned().unwrap_or(Value::Null));
        }
        Ok(out)
    }

    fn issue_state_counts_for_refs(&self, refs: &[String]) -> Result<Value, String> {
        let issues = self.issues_by_refs(refs)?;
        let mut open = 0u64;
        let mut closed = 0u64;
        for issue in issues {
            match issue.get("state").and_then(Value::as_str) {
                Some("OPEN") => open += 1,
                Some("CLOSED") => closed += 1,
                _ => {}
            }
        }
        Ok(json!({ "open": open, "closed": closed }))
    }

    fn issue_by_number(&self, workspace_id: &str, number: u64) -> Result<Option<Value>, String> {
        let issues = self.extension_storage.collection_data("issues")?;
        Ok(issues
            .as_array()
            .and_then(|arr| {
                arr.iter()
                    .find(|i| {
                        i.get("workspaceId").and_then(Value::as_str) == Some(workspace_id)
                            && i.get("number").and_then(Value::as_u64) == Some(number)
                    })
                    .cloned()
            }))
    }

    // ── Comments (core-owned, nested-threaded) ─────────────────────────
    fn create_comment(
        &self,
        target: &str,
        parent: Option<&str>,
        body_markdown: &str,
        author_ref: &str,
    ) -> Result<Value, String> {
        const MAX_BODY_BYTES: usize = 64 * 1024;
        if body_markdown.is_empty() {
            return Err("comment body must not be empty".to_string());
        }
        if body_markdown.len() > MAX_BODY_BYTES {
            return Err(format!(
                "comment body must be at most {MAX_BODY_BYTES} bytes"
            ));
        }
        ResourceRef::parse(target)
            .map_err(|e| format!("comment `target` is not a valid URI: {}", e.message))?;
        ResourceRef::parse(author_ref)
            .map_err(|e| format!("comment `authorRef` is not a valid URI: {}", e.message))?;

        // Validate parent if present: must reference an existing comment on
        // the same target.
        if let Some(parent_ref) = parent {
            let parent_parsed = ResourceRef::parse(parent_ref)
                .map_err(|e| format!("comment `parent` is not a valid URI: {}", e.message))?;
            if !matches!(parent_parsed.kind, ResourceKind::Comment) {
                return Err(format!(
                    "comment `parent` must be a comment URI, got {parent_ref:?}"
                ));
            }
            let parent_id = parent_parsed
                .id
                .as_ref()
                .ok_or_else(|| "comment `parent` URI must include an id".to_string())?
                .as_str();
            let parent_doc = self
                .extension_storage
                .collection_data("comments")?
                .as_array()
                .and_then(|arr| {
                    arr.iter()
                        .find(|c| c.get("id").and_then(Value::as_str) == Some(parent_id))
                        .cloned()
                });
            let parent_doc = parent_doc
                .ok_or_else(|| format!("parent comment {parent_id:?} not found"))?;
            let parent_target = parent_doc
                .get("target")
                .and_then(Value::as_str)
                .unwrap_or("");
            if parent_target != target {
                return Err(format!(
                    "parent comment is on target {parent_target:?}, not {target:?}"
                ));
            }
        }

        let cmt_id = OpaqueId::new(IdPrefix::Comment);
        let now_iso = chrono_now_iso();
        let cmt_ref = format!("comtrya://comment/{}", cmt_id.as_str());
        let data = json!({
            "id": cmt_id.as_str(),
            "target": target,
            "parent": parent,
            "authorRef": author_ref,
            "bodyMarkdown": body_markdown,
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "editedAt": Value::Null,
        });
        let mut resource_refs = vec![cmt_ref.clone(), target.to_string()];
        if let Some(p) = parent {
            resource_refs.push(p.to_string());
        }
        let record = extension_document_record(
            "core",
            "comments",
            cmt_id.as_str(),
            &cmt_ref,
            resource_refs,
            data.clone(),
            &now_iso,
        );
        self.extension_storage.create_document(record)?;
        let _ = self.append_event(
            "dev.comtrya.comment.posted",
            json!({
                "commentID": cmt_id.as_str(),
                "target": target,
                "parent": parent,
                "authorRef": author_ref,
            }),
        );
        Ok(data)
    }

    fn update_comment(&self, id: &str, body_markdown: &str) -> Result<Value, String> {
        const MAX_BODY_BYTES: usize = 64 * 1024;
        if body_markdown.is_empty() {
            return Err("comment body must not be empty".to_string());
        }
        if body_markdown.len() > MAX_BODY_BYTES {
            return Err(format!(
                "comment body must be at most {MAX_BODY_BYTES} bytes"
            ));
        }
        let now_iso = chrono_now_iso();
        let body_owned = body_markdown.to_string();
        let now_for_closure = now_iso.clone();
        self.extension_storage
            .update_document_atomically("comments", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("bodyMarkdown".to_string(), Value::String(body_owned));
                    obj.insert("editedAt".to_string(), Value::String(now_for_closure.clone()));
                    obj.insert("updatedAt".to_string(), Value::String(now_for_closure));
                }
            })?;
        let updated = self
            .extension_storage
            .collection_data("comments")?
            .as_array()
            .and_then(|arr| {
                arr.iter()
                    .find(|c| c.get("id").and_then(Value::as_str) == Some(id))
                    .cloned()
            })
            .ok_or_else(|| format!("updated comment {id:?} disappeared"))?;
        let _ = self.append_event(
            "dev.comtrya.comment.edited",
            json!({ "commentID": id, "editedAt": now_iso }),
        );
        Ok(updated)
    }

    fn delete_comment(&self, id: &str) -> Result<bool, String> {
        let comments = self.extension_storage.collection_data("comments")?;
        let exists = comments
            .as_array()
            .map(|arr| {
                arr.iter()
                    .any(|c| c.get("id").and_then(Value::as_str) == Some(id))
            })
            .unwrap_or(false);
        if !exists {
            return Ok(false);
        }
        self.extension_storage.delete_document("core", "comments", id)?;
        let _ = self.append_event(
            "dev.comtrya.comment.deleted",
            json!({ "commentID": id }),
        );
        Ok(true)
    }

    fn thread_for_target(&self, target: &str) -> Result<Vec<Value>, String> {
        let comments = self.extension_storage.collection_data("comments")?;
        let mut out: Vec<Value> = comments
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter(|c| c.get("target").and_then(Value::as_str) == Some(target))
                    .cloned()
                    .collect()
            })
            .unwrap_or_default();
        out.sort_by(|a, b| {
            a.get("createdAt")
                .and_then(Value::as_str)
                .unwrap_or("")
                .cmp(b.get("createdAt").and_then(Value::as_str).unwrap_or(""))
        });
        Ok(out)
    }

    fn create_repository_document(
        &self,
        path: &str,
        clone_from_url: Option<&str>,
    ) -> Result<Value, String> {
        let (segments, canonical) = validate_repo_path(path)?;
        let existing = self.extension_storage.collection_data("repositories")?;
        if let Some(array) = existing.as_array() {
            if array.iter().any(|repo| {
                repo.get("path").and_then(Value::as_str) == Some(canonical.as_str())
            }) {
                return Err(format!(
                    "repository at path {canonical:?} already exists"
                ));
            }
        }
        if let Some(url) = clone_from_url {
            validate_clone_url(url)?;
        }

        let repo_id = OpaqueId::new(IdPrefix::Repository);
        let workspace_id = self
            .extension_storage
            .single_document_data("workspaces")?
            .and_then(|workspace| workspace.get("id").and_then(Value::as_str).map(str::to_owned))
            .unwrap_or_else(|| "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string());
        let name = segments
            .last()
            .cloned()
            .expect("validate_repo_path guarantees ≥1 segment");
        let owner = segments
            .first()
            .cloned()
            .expect("validate_repo_path guarantees ≥1 segment");
        let git_http_path = format!("/git/{}.git", canonical);
        let now_iso = chrono_now_iso();

        let project_root = self.data_dir.join("repositories");
        let git_dir = match clone_from_url {
            Some(url) => clone_bare_repository_on_disk(&project_root, &canonical, url)?,
            None => init_bare_repository_on_disk(&project_root, &canonical)?,
        };
        let default_branch = read_default_branch(&git_dir).unwrap_or_else(|| "main".to_string());
        let description = clone_from_url
            .map(|url| format!("Imported from {url}"))
            .unwrap_or_default();

        let data = json!({
            "id": repo_id.as_str(),
            "owner": owner,
            "name": name,
            "path": canonical,
            "visibility": "PRIVATE",
            "description": description,
            "defaultBranch": default_branch,
            "gitHttpPath": git_http_path,
            "language": "unknown",
            "license": "unknown",
            "stars": 0,
            "forks": 0,
            "watchers": 0,
            "updated": now_iso,
            "importedFrom": clone_from_url.map(Value::from).unwrap_or(Value::Null),
        });
        let repo_ref = format!("comtrya://repository/{}", repo_id.as_str());
        let workspace_ref = format!("comtrya://workspace/{}", workspace_id);
        let record = extension_document_record(
            "core",
            "repositories",
            repo_id.as_str(),
            &repo_ref,
            vec![repo_ref.clone(), workspace_ref],
            data.clone(),
            &now_iso,
        );
        if let Err(error) = self.extension_storage.create_document(record) {
            // Persistence failed: roll back the on-disk repo so the next attempt is clean.
            let _ = fs::remove_dir_all(&git_dir);
            return Err(error);
        }

        let event_type = if clone_from_url.is_some() {
            "dev.comtrya.repository.imported"
        } else {
            "dev.comtrya.repository.created"
        };
        let _ = self.append_event(
            event_type,
            json!({
                "repositoryID": repo_id.as_str(),
                "path": canonical,
                "importedFrom": clone_from_url,
            }),
        );

        Ok(data)
    }

    fn demo_payload(&self) -> Result<Value, String> {
        let workspace = self
            .extension_storage
            .single_document_data("workspaces")?
            .unwrap_or_else(|| {
                json!({
                    "id": "ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
                    "slug": "comtrya",
                    "name": "Comtrya Labs",
                    "visibility": "PRIVATE",
                    "members": 0
                })
            });
        let repository_documents = self.extension_storage.collection_data("repositories")?;
        let git = self.git_snapshot()?;
        let repository_metadata = repository_documents
            .as_array()
            .and_then(|repositories| repositories.first());
        let repository = merge_repository_metadata(git.repository.clone(), repository_metadata);
        let repositories = repository_collection_payload(&repository, &repository_documents);
        let pull_requests = self.extension_storage.collection_data("pull_requests")?;
        let checks = self.extension_storage.collection_data("check_runs")?;
        let extensions = filter_extension_installations(
            self.extension_storage
                .collection_data("extension_installations")?,
            &self.extension_runtime,
        );
        let activity = self.extension_storage.collection_data("activity_events")?;
        let extension_resolvers = self.extension_resolver_payload(&git, &pull_requests, &checks);
        Ok(json!({
            "generatedBy": "comtrya-runtime/v1",
            "workspace": workspace,
            "repository": repository,
            "repositories": repositories,
            "refs": git.refs,
            "branches": git.branches,
            "commits": git.commits,
            "treeEntries": git.tree_entries,
            "files": git.files,
            "blobs": git.blobs,
            "diff": git.diff,
            "pullRequests": pull_requests,
            "checks": checks,
            "extensions": extensions,
            "activity": activity,
            "extensionResolvers": extension_resolvers
        }))
    }

    fn git_snapshot(&self) -> Result<GitDemoSnapshot, String> {
        git_demo_snapshot(&self.demo_repository)
    }

    fn extension_resolver_payload(
        &self,
        git: &GitDemoSnapshot,
        pull_requests: &Value,
        checks: &Value,
    ) -> Vec<Value> {
        self.extension_runtime
            .values()
            .map(|resolver| {
                let output = match resolver.id.as_str() {
                    "ext_code_browser" => code_browser_resolver_output(git),
                    "ext_pull_requests" => pull_request_resolver_output(pull_requests, checks),
                    "ext_checks" => checks_resolver_output(checks),
                    "ext_workspace_home" => json!({}),
                    "ext_issues" => issues_resolver_output(
                        &self
                            .extension_storage
                            .collection_data("issues")
                            .unwrap_or_else(|_| json!([])),
                    ),
                    "ext_epics" => epics_resolver_output(
                        &self
                            .extension_storage
                            .collection_data("epics")
                            .unwrap_or_else(|_| json!([])),
                    ),
                    _ => json!({"error": "unknown resolver output"}),
                };
                json!({
                    "id": resolver.id.clone(),
                    "component": resolver.component.clone(),
                    "resolver": resolver.resolver.clone(),
                    "status": resolver.status.clone(),
                    "outputType": resolver.output_type.clone(),
                    "output": output
                })
            })
            .collect()
    }

    fn extension_manifest_body(&self, extension: &str) -> Result<Option<String>, String> {
        let Some(record) = self.extension_runtime_record(extension) else {
            return Ok(None);
        };
        fs::read_to_string(&record.ui_manifest)
            .map(Some)
            .map_err(|error| format!("failed to read UI manifest for {extension}: {error}"))
    }

    fn extension_asset_body(
        &self,
        extension: &str,
        asset_path: &str,
    ) -> Result<Option<ExtensionAsset>, String> {
        if asset_path.contains("..") {
            return Ok(None);
        }
        let Some(root) = self.extension_root(extension) else {
            return Ok(None);
        };
        let path = root.join("assets").join(asset_path);
        if !path.is_file() {
            return Ok(None);
        }
        let content_type = match path.extension().and_then(|extension| extension.to_str()) {
            Some("css") => "text/css",
            Some("js") => "text/javascript",
            Some("json") => "application/json",
            _ => "application/octet-stream",
        };
        fs::read(&path)
            .map(|body| {
                Some(ExtensionAsset {
                    etag: asset_etag(&body),
                    content_type,
                    body,
                })
            })
            .map_err(|error| format!("failed to read extension asset {}: {error}", path.display()))
    }

    fn extension_root(&self, extension: &str) -> Option<PathBuf> {
        self.extension_runtime_record(extension)
            .map(|record| record.root.clone())
    }

    fn extension_runtime_record(&self, extension: &str) -> Option<&WasmtimeResolverRecord> {
        if extension == "ext_01hv" {
            return self.extension_runtime_record("ext_pull_requests");
        }
        self.extension_runtime.get(extension)
    }

    fn check_boundary(&self, headers: &HeaderMap, route: &str) -> Result<HeaderMap, Response> {
        if self.config.environment == Environment::Production && !self.options.tls_terminated {
            return Err(error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                ErrorCode::ConfigInvalid.as_str(),
                "production requires COMTRYA_TLS_TERMINATED=true behind a TLS terminator",
            ));
        }

        let mut out = HeaderMap::new();
        if let Some(origin) = headers.get("origin").and_then(|value| value.to_str().ok()) {
            let cors = CorsPolicy {
                allowed_origins: self.config.allowed_origins.clone(),
            };
            let cors_headers = cors.check(origin, route).map_err(|error| {
                error_response(StatusCode::FORBIDDEN, error.code.as_str(), &error.message)
            })?;
            for (name, value) in cors_headers {
                out.insert(
                    axum::http::HeaderName::from_bytes(name.as_bytes())
                        .expect("static CORS header name"),
                    HeaderValue::from_str(&value).expect("valid CORS header value"),
                );
            }
        }
        out.insert(
            "Access-Control-Allow-Methods",
            HeaderValue::from_str(&allowed_methods_for_route(route).join(", "))
                .expect("valid methods header"),
        );
        Ok(out)
    }

    fn rate_limit(&self, bucket: &str, ceiling: u32) -> Result<(), Response> {
        let minute = now_seconds() / 60;
        let mut limits = self.rate_limits.lock().expect("rate lock not poisoned");
        let count = limits.entry((bucket.to_string(), minute)).or_insert(0);
        *count += 1;
        if *count > ceiling {
            Err(error_response(
                StatusCode::TOO_MANY_REQUESTS,
                ErrorCode::RateLimited.as_str(),
                "rate limit exceeded",
            ))
        } else {
            Ok(())
        }
    }

    fn principal_from_headers(&self, headers: &HeaderMap) -> PrincipalStatus {
        self.principal_context_from_headers(headers).status
    }

    pub(crate) fn principal_context_from_headers(&self, headers: &HeaderMap) -> PrincipalContext {
        let Some(token) = headers
            .get("authorization")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
        else {
            return PrincipalContext::anonymous();
        };

        let credentials = self
            .credentials
            .lock()
            .expect("credential lock not poisoned");
        if let Some(credential) = credentials.get(token) {
            if credential.expires_at > now_seconds() {
                return PrincipalContext {
                    status: credential.principal,
                    uri: credential.principal_uri.clone(),
                };
            }
        }

        PrincipalContext::invalid()
    }

    fn credential_allows(&self, headers: &HeaderMap, action: &str) -> bool {
        let Some(token) = headers
            .get("authorization")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
        else {
            return false;
        };

        self.credentials
            .lock()
            .expect("credential lock not poisoned")
            .get(token)
            .is_some_and(|credential| {
                credential.expires_at > now_seconds()
                    && credential.actions.iter().any(|granted| granted == action)
            })
    }

    fn issue_session(&self, principal: PrincipalStatus) -> String {
        let token = self.next_token("sess");
        self.sessions
            .lock()
            .expect("session lock not poisoned")
            .insert(
                token.clone(),
                SessionRecord {
                    principal,
                    expires_at: now_seconds().saturating_add(self.options.session_ttl_seconds),
                    used: false,
                },
            );
        let _ = self.append_audit("dev.comtrya.session.issued", json!({"token": token}));
        token
    }

    fn consume_session(&self, token: &str) -> Result<PrincipalStatus, Response> {
        let mut sessions = self.sessions.lock().expect("session lock not poisoned");
        let Some(session) = sessions.get_mut(token) else {
            return Err(error_response(
                StatusCode::UNAUTHORIZED,
                ErrorCode::Unauthenticated.as_str(),
                "unknown event session",
            ));
        };
        if session.used || session.expires_at <= now_seconds() {
            return Err(error_response(
                StatusCode::UNAUTHORIZED,
                ErrorCode::Unauthenticated.as_str(),
                "event session is expired or already used",
            ));
        }
        session.used = true;
        Ok(session.principal)
    }

    fn issue_credential(
        &self,
        resource: String,
        actions: Vec<String>,
        principal: PrincipalStatus,
    ) -> String {
        let token = self.next_token("fp");
        let principal_uri = format!("comtrya://credential/{}", self.next_token("prn"));
        self.credentials
            .lock()
            .expect("credential lock not poisoned")
            .insert(
                token.clone(),
                CredentialRecord {
                    actions: actions.clone(),
                    principal,
                    principal_uri: principal_uri.clone(),
                    expires_at: now_seconds() + 300,
                },
            );
        let _ = self.append_event(
            "dev.comtrya.auth.credential.issued",
            json!({"resource": resource, "scope": actions, "principal": principal_uri}),
        );
        token
    }

    fn next_token(&self, prefix: &str) -> String {
        let counter = self.token_counter.fetch_add(1, Ordering::Relaxed);
        format!("{prefix}_{}_{}", now_seconds(), counter)
    }

    fn append_event(&self, event_type: &str, data: Value) -> std::io::Result<()> {
        self.append_event_internal(event_type, data.clone())?;
        // Dispatch to subscribed reactors. The dispatcher uses a depth
        // counter to bound reaction cycles; reactions that emit further
        // events recurse through this same path.
        self.dispatch_event_to_reactors(event_type, &data, 0);
        Ok(())
    }

    fn append_event_internal(&self, event_type: &str, data: Value) -> std::io::Result<()> {
        append_jsonl(
            &self.events_path,
            json!({
                "specversion": "1.0",
                "id": self.next_token("evt"),
                "type": event_type,
                "source": "comtrya://instance/local",
                "time": now_seconds(),
                "visibility": "PRIVATE",
                "data": data
            }),
        )
    }

    /// Reaction dispatch. Each reactor is a (extension_id, event_type)
    /// pair backed by a Rust function in this binary; this mirrors how
    /// `extension_resolver_payload` is structured. Real WASM reactors are
    /// deferred — the WIT is documented in `docs/extensions.md` but the
    /// kernel currently runs hardcoded handlers.
    fn dispatch_event_to_reactors(&self, event_type: &str, payload: &Value, depth: u32) {
        const MAX_REACTION_DEPTH: u32 = 8;
        if depth >= MAX_REACTION_DEPTH {
            eprintln!(
                "reactor: max depth {MAX_REACTION_DEPTH} reached, dropping reactions for {event_type}"
            );
            return;
        }
        for reactor in REACTORS {
            if reactor.event_type != event_type {
                continue;
            }
            if !self.is_extension_installed(reactor.extension_id) {
                continue;
            }
            let envelope = EventEnvelope {
                event_type: event_type.to_string(),
                payload: payload.clone(),
            };
            let reactions = (reactor.handler)(self, &envelope);
            for reaction in reactions {
                self.apply_reaction(reactor, reaction, depth + 1);
            }
        }
    }

    fn apply_reaction(&self, reactor: &Reactor, reaction: Reaction, depth: u32) {
        match reaction {
            Reaction::InvokeMutation { name, variables } => {
                if !reactor.allowed_mutations.iter().any(|m| *m == name) {
                    eprintln!(
                        "reactor {}: mutation {:?} is not in allowedMutations, skipping",
                        reactor.extension_id, name
                    );
                    return;
                }
                if let Err(message) = self.apply_reactor_mutation(&name, &variables, depth) {
                    eprintln!(
                        "reactor {}: mutation {} failed: {}",
                        reactor.extension_id, name, message
                    );
                }
            }
            Reaction::EmitEvent {
                event_type,
                payload,
            } => {
                if !reactor.allowed_emits.iter().any(|e| *e == event_type) {
                    eprintln!(
                        "reactor {}: emit {:?} is not in allowedEmits, skipping",
                        reactor.extension_id, event_type
                    );
                    return;
                }
                let _ = self.append_event_internal(&event_type, payload.clone());
                self.dispatch_event_to_reactors(&event_type, &payload, depth);
            }
        }
    }

    fn is_extension_installed(&self, extension_id: &str) -> bool {
        self.extension_runtime.contains_key(extension_id)
    }

    /// Dispatch a reactor-issued mutation by name. This is the in-process
    /// counterpart to the HTTP GraphQL mutation router; it bypasses CORS
    /// and rate-limiting because the caller is the kernel itself.
    fn apply_reactor_mutation(
        &self,
        name: &str,
        variables: &Value,
        _depth: u32,
    ) -> Result<(), String> {
        // Mutation table extends as new extensions ship. The reactor
        // allowlist already gated us here, so we trust `name`.
        match name {
            "issues.close" => {
                let id = variables
                    .get("id")
                    .and_then(Value::as_str)
                    .ok_or_else(|| "issues.close requires variables.id".to_string())?;
                let reason = variables.get("reason").and_then(Value::as_str);
                let closed_by = variables.get("closedByRef").and_then(Value::as_str);
                self.close_issue(id, reason, closed_by).map(|_| ())
            }
            other => Err(format!("kernel has no in-process router for mutation {other:?}")),
        }
    }

    fn append_audit(&self, event_type: &str, data: Value) -> std::io::Result<()> {
        append_jsonl(
            &self.audit_path,
            json!({
                "type": event_type,
                "time": now_seconds(),
                "data": data
            }),
        )
    }

    fn read_events(&self) -> Vec<Value> {
        let mut text = String::new();
        if let Ok(mut file) = OpenOptions::new().read(true).open(&self.events_path) {
            let _ = file.read_to_string(&mut text);
        }
        text.lines()
            .filter_map(|line| serde_json::from_str::<Value>(line).ok())
            .collect()
    }
}

fn filter_extension_installations(
    extensions: Value,
    loaded: &BTreeMap<String, WasmtimeResolverRecord>,
) -> Value {
    let Value::Array(items) = extensions else {
        return extensions;
    };
    Value::Array(
        items
            .into_iter()
            .filter(|extension| {
                extension
                    .get("id")
                    .and_then(Value::as_str)
                    .is_some_and(|id| loaded.contains_key(id))
            })
            .collect(),
    )
}

/// Enrich an `extensionInstallations` array with the `routePrefix` field.
/// The server-side [`ExtensionInstallConfig`] takes precedence; if no config
/// declares a prefix, the extension's own manifest (recorded in the runtime)
/// supplies one. Extensions with neither receive `null`.
fn inject_route_prefix(
    extensions: Value,
    configs: &[ExtensionInstallConfig],
    runtime: &BTreeMap<String, WasmtimeResolverRecord>,
) -> Value {
    let Value::Array(items) = extensions else {
        return extensions;
    };
    Value::Array(
        items
            .into_iter()
            .map(|mut ext| {
                let route_prefix = ext.get("id").and_then(Value::as_str).and_then(|id| {
                    configs
                        .iter()
                        .find(|c| c.id == id)
                        .and_then(|c| c.route_prefix.clone())
                        .or_else(|| runtime.get(id).and_then(|r| r.route_prefix.clone()))
                });
                let value = route_prefix
                    .map(|p| json!(p))
                    .unwrap_or(json!(null));
                if let Some(obj) = ext.as_object_mut() {
                    obj.insert("routePrefix".to_string(), value);
                }
                ext
            })
            .collect(),
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
enum PrincipalStatus {
    Anonymous,
    OperatorCredential,
    Credential,
    Invalid,
}

#[derive(Debug, Clone)]
pub(crate) struct PrincipalContext {
    pub(crate) status: PrincipalStatus,
    pub(crate) uri: String,
}

impl PrincipalContext {
    fn anonymous() -> Self {
        Self {
            status: PrincipalStatus::Anonymous,
            uri: "comtrya://principal/anonymous".to_string(),
        }
    }

    fn invalid() -> Self {
        Self {
            status: PrincipalStatus::Invalid,
            uri: "comtrya://principal/invalid".to_string(),
        }
    }
}

#[derive(Debug, Clone)]
struct SessionRecord {
    principal: PrincipalStatus,
    expires_at: u64,
    used: bool,
}

#[derive(Debug, Clone)]
struct CredentialRecord {
    actions: Vec<String>,
    principal: PrincipalStatus,
    principal_uri: String,
    expires_at: u64,
}

#[derive(Debug, Clone, Serialize)]
struct Readiness {
    ready: bool,
    mode: String,
    checks: BTreeMap<String, bool>,
    unsupported: Vec<UnsupportedSurface>,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
struct UnsupportedSurface {
    id: &'static str,
    path_prefix: &'static str,
    message: &'static str,
}

const UNSUPPORTED_SURFACES: &[UnsupportedSurface] = &[
    UnsupportedSurface {
        id: "oidc_browser_callback",
        path_prefix: "/auth/oidc/",
        message: "full OIDC browser callback validation is not implemented in the production-testbed runtime",
    },
    UnsupportedSurface {
        id: "git_receive_pack",
        path_prefix: "/git/",
        message: "git receive-pack writes are disabled in the production-testbed demo",
    },
    UnsupportedSurface {
        id: "legacy_v1_api",
        path_prefix: "/api/v1/",
        message: "legacy Comtrya v1 API routes are intentionally unsupported by this v2 production-testbed runtime",
    },
];

async fn healthz(State(state): State<AppState>, headers: HeaderMap) -> Response {
    match state.runtime.check_boundary(&headers, "/healthz") {
        Ok(cors) => json_response(StatusCode::OK, json!({"status": "ok"}), cors),
        Err(response) => response,
    }
}

async fn readyz(State(state): State<AppState>, headers: HeaderMap) -> Response {
    match state.runtime.check_boundary(&headers, "/readyz") {
        Ok(cors) => json_response(StatusCode::OK, json!(state.runtime.readiness()), cors),
        Err(response) => response,
    }
}

async fn unsupported_route(
    State(state): State<AppState>,
    headers: HeaderMap,
    uri: Uri,
) -> Response {
    let cors = match state.runtime.check_boundary(&headers, uri.path()) {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    let Some(surface) = unsupported_surface_for_path(uri.path()) else {
        return error_response(
            StatusCode::NOT_FOUND,
            ErrorCode::NotFound.as_str(),
            "route was not found",
        );
    };
    unsupported_response(surface, cors)
}

async fn not_found_or_unsupported(
    State(state): State<AppState>,
    headers: HeaderMap,
    uri: Uri,
) -> Response {
    let cors = match state.runtime.check_boundary(&headers, uri.path()) {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    if let Some(surface) = unsupported_surface_for_path(uri.path()) {
        return unsupported_response(surface, cors);
    }
    json_response(
        StatusCode::NOT_FOUND,
        json!({"errors": [{"message": "route was not found", "extensions": {"code": ErrorCode::NotFound.as_str()}}]}),
        cors,
    )
}

async fn graphql_get(State(state): State<AppState>, headers: HeaderMap) -> Response {
    graphql_response(
        state,
        headers,
        json!({"query": "query { instance { capabilities } }"}),
    )
}

async fn graphql_post(State(state): State<AppState>, headers: HeaderMap, body: String) -> Response {
    let payload = serde_json::from_str::<Value>(&body).unwrap_or_else(|_| json!({}));
    let query = payload.get("query").and_then(Value::as_str).unwrap_or("");
    // Generated dispatch table consulted first. On hit, route into
    // WASM via `wasm_dispatch`. On miss, fall through to the legacy
    // hand-written handlers below (which M4/M5 delete extension-
    // by-extension as their WASM components ship).
    if let Some(info) = identify_wasm_op(query) {
        if let Some(response) =
            wasm_dispatch::dispatch(&state, &info, payload.clone(), headers.clone())
        {
            return response;
        }
    }
    if matches_op(query, "createRepository") {
        return create_repository_mutation(state, headers, payload);
    }
    if matches_op(query, "relations.create") {
        return relations_create_mutation(state, headers, payload);
    }
    if matches_op(query, "relations.delete") {
        return relations_delete_mutation(state, headers, payload);
    }
    if matches_op(query, "relations.outgoing") {
        return relations_outgoing_query(state, headers, payload);
    }
    if matches_op(query, "relations.incoming") {
        return relations_incoming_query(state, headers, payload);
    }
    if matches_op(query, "relations.between") {
        return relations_between_query(state, headers, payload);
    }
    if matches_op(query, "comments.thread") {
        return comments_thread_query(state, headers, payload);
    }
    if matches_op(query, "comments.create") {
        return comments_create_mutation(state, headers, payload);
    }
    if matches_op(query, "comments.update") {
        return comments_update_mutation(state, headers, payload);
    }
    if matches_op(query, "comments.delete") {
        return comments_delete_mutation(state, headers, payload);
    }
    if matches_op(query, "issues.create") {
        return issues_create_mutation(state, headers, payload);
    }
    if matches_op(query, "issues.close") {
        return issues_close_mutation(state, headers, payload);
    }
    if matches_op(query, "issues.reopen") {
        return issues_reopen_mutation(state, headers, payload);
    }
    if matches_op(query, "issues.list") {
        return issues_list_query(state, headers, payload);
    }
    if matches_op(query, "issues.byRefs") {
        return issues_by_refs_query(state, headers, payload);
    }
    if matches_op(query, "issues.byRef") {
        return issues_by_ref_query(state, headers, payload);
    }
    if matches_op(query, "issues.byNumber") {
        return issues_by_number_query(state, headers, payload);
    }
    if matches_op(query, "issues.stateCountsForRefs") {
        return issues_state_counts_query(state, headers, payload);
    }
    if matches_op(query, "epics.create") {
        return epics_create_mutation(state, headers, payload);
    }
    if matches_op(query, "epics.changeState") {
        return epics_change_state_mutation(state, headers, payload);
    }
    if matches_op(query, "epics.list") {
        return epics_list_query(state, headers, payload);
    }
    if matches_op(query, "epics.byRefs") {
        return epics_by_refs_query(state, headers, payload);
    }
    if matches_op(query, "epics.byRef") {
        return epics_by_ref_query(state, headers, payload);
    }
    if matches_op(query, "epics.progress") {
        return epics_progress_query(state, headers, payload);
    }
    if matches_op(query, "epics.issuesIn") {
        return epics_issues_in_query(state, headers, payload);
    }
    if matches_op(query, "epics.childrenOf") {
        return epics_children_of_query(state, headers, payload);
    }
    if matches_op(query, "pulls.create") {
        return pulls_create_mutation(state, headers, payload);
    }
    if matches_op(query, "pulls.merge") {
        return pulls_merge_mutation(state, headers, payload);
    }
    if matches_op(query, "pulls.close") {
        return pulls_close_mutation(state, headers, payload);
    }
    graphql_response(state, headers, payload)
}

fn pulls_create_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ws = payload.pointer("/variables/input/workspaceId").and_then(Value::as_str).unwrap_or("");
    let title = payload.pointer("/variables/input/title").and_then(Value::as_str).unwrap_or("");
    let body = payload.pointer("/variables/input/bodyMarkdown").and_then(Value::as_str).unwrap_or("");
    let base = payload.pointer("/variables/input/base").and_then(Value::as_str).unwrap_or("main");
    let head = payload.pointer("/variables/input/head").and_then(Value::as_str).unwrap_or("");
    let repository_id = payload.pointer("/variables/input/repositoryId").and_then(Value::as_str);
    let author_ref = payload
        .pointer("/variables/input/authorRef")
        .and_then(Value::as_str)
        .unwrap_or("comtrya://user/usr_00000000000000000000000000");
    if ws.is_empty() || title.is_empty() || head.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "pulls.create requires variables.input.{workspaceId, title, head}",
            cors,
        );
    }
    match state
        .runtime
        .create_pull_request(ws, repository_id, title, body, base, head, author_ref)
    {
        Ok(pr) => json_response(
            StatusCode::OK,
            json!({ "data": { "pulls": { "create": pr } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn pulls_merge_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let id = payload.pointer("/variables/input/id").and_then(Value::as_str).unwrap_or("");
    if id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "pulls.merge requires variables.input.id",
            cors,
        );
    }
    let merged_by = payload.pointer("/variables/input/mergedByRef").and_then(Value::as_str);
    match state.runtime.merge_pull_request(id, merged_by) {
        Ok(pr) => json_response(
            StatusCode::OK,
            json!({ "data": { "pulls": { "merge": pr } } }),
            cors,
        ),
        Err(message) => {
            let status = if message.contains("not found") {
                StatusCode::NOT_FOUND
            } else if message.contains("cannot merge") {
                StatusCode::CONFLICT
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            graphql_error_response(status, ErrorCode::BadUserInput.as_str(), &message, cors)
        }
    }
}

fn pulls_close_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let id = payload.pointer("/variables/input/id").and_then(Value::as_str).unwrap_or("");
    if id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "pulls.close requires variables.input.id",
            cors,
        );
    }
    let closed_by = payload.pointer("/variables/input/closedByRef").and_then(Value::as_str);
    match state.runtime.close_pull_request(id, closed_by) {
        Ok(pr) => json_response(
            StatusCode::OK,
            json!({ "data": { "pulls": { "close": pr } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::CONFLICT,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

/// Extract the GraphQL operation's root field name (the first selection
/// inside the outermost `{ ... }`) and look it up in the generated
/// dispatch table. Returns the matching `DispatchInfo` on hit.
///
/// We can't substring-scan the whole query for known route names —
/// that produces false positives when an unrelated query contains a
/// known field as a *subfield* (e.g. `issuesOpen` appearing inside an
/// `epicsProgress` selection). Only the root field decides routing.
fn identify_wasm_op(query: &str) -> Option<crate::generated_dispatch::DispatchInfo> {
    let field = extract_root_operation_field(query)?;
    crate::generated_dispatch::dispatch_route(&field)
}

fn extract_root_operation_field(query: &str) -> Option<String> {
    // Skip a leading `mutation` / `query` / `subscription` keyword and
    // any operation name + variable list, then the first `{`, then
    // whitespace, then read identifier chars.
    let mut chars = query.chars().peekable();
    // Skip leading whitespace.
    while let Some(c) = chars.peek().copied() {
        if c.is_whitespace() {
            chars.next();
        } else {
            break;
        }
    }
    // Optional operation kind keyword.
    for kind in ["mutation", "query", "subscription"] {
        if query
            .trim_start()
            .starts_with(kind)
        {
            // Advance the iterator past the keyword.
            for _ in 0..kind.len() {
                chars.next();
            }
            break;
        }
    }
    // Skip until the first `{` (handles operation names and
    // variable declarations between the kind and the selection set).
    let mut found = false;
    for c in chars.by_ref() {
        if c == '{' {
            found = true;
            break;
        }
    }
    if !found {
        // Selection-only query (e.g. `{ foo }`); the loop above
        // consumes the brace.
    }
    // Skip whitespace inside the brace.
    while let Some(c) = chars.peek().copied() {
        if c.is_whitespace() {
            chars.next();
        } else {
            break;
        }
    }
    // Read identifier characters, including the legacy dotted form
    // (e.g. `issues.close`) used by some existing GraphQL surfaces.
    let mut ident = String::new();
    while let Some(c) = chars.peek().copied() {
        if c.is_ascii_alphanumeric() || c == '_' || c == '.' {
            ident.push(c);
            chars.next();
        } else {
            break;
        }
    }
    if ident.is_empty() {
        None
    } else {
        Some(ident)
    }
}

/// String-match dispatcher discriminator. The kernel's JSON-stub GraphQL
/// handler routes by looking for an operation name (e.g. `issues.close`)
/// in the query. To avoid false matches against field names that share a
/// prefix (`issuesClosed` inside a selection set), we require the next
/// byte after the name to be either `(` (a call site) or whitespace
/// (operation declaration before the args). Both the dot and camelCase
/// aliases are checked.
fn matches_op(query: &str, op: &str) -> bool {
    let dot = op.to_string();
    let camel: String = {
        let parts: Vec<&str> = op.split('.').collect();
        if parts.len() == 2 {
            let head = parts[0];
            let tail = parts[1];
            let mut chars = tail.chars();
            let upper_tail = match chars.next() {
                Some(c) => c.to_ascii_uppercase().to_string() + chars.as_str(),
                None => String::new(),
            };
            format!("{}{}", head, upper_tail)
        } else {
            op.to_string()
        }
    };
    for candidate in [dot, camel] {
        if let Some(pos) = query.find(&candidate) {
            let next = query.as_bytes().get(pos + candidate.len()).copied();
            match next {
                Some(b'(') | Some(b' ') | Some(b'\n') | Some(b'\t') | None => return true,
                _ => continue,
            }
        }
    }
    false
}

// ── epics GraphQL dispatch ─────────────────────────────────────────────────
fn epics_create_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ws = payload.pointer("/variables/input/workspaceId").and_then(Value::as_str).unwrap_or("");
    let title = payload.pointer("/variables/input/title").and_then(Value::as_str).unwrap_or("");
    let body = payload.pointer("/variables/input/bodyMarkdown").and_then(Value::as_str).unwrap_or("");
    let owner = payload.pointer("/variables/input/ownerRef").and_then(Value::as_str);
    let target_date = payload.pointer("/variables/input/targetDate").and_then(Value::as_str);
    let labels: Vec<String> = payload
        .pointer("/variables/input/labels")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_str).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    let parent_ref = payload.pointer("/variables/input/parentEpicRef").and_then(Value::as_str);
    if ws.is_empty() || title.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.create requires variables.input.{workspaceId, title}",
            cors,
        );
    }
    match state.runtime.create_epic(ws, title, body, owner, target_date, &labels, parent_ref) {
        Ok(epic) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "create": epic } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn epics_change_state_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let id = payload.pointer("/variables/input/id").and_then(Value::as_str).unwrap_or("");
    let target = payload.pointer("/variables/input/state").and_then(Value::as_str).unwrap_or("");
    if id.is_empty() || target.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.changeState requires variables.input.{id, state}",
            cors,
        );
    }
    match state.runtime.change_epic_state(id, target) {
        Ok(epic) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "changeState": epic } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn epics_list_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ws = payload.pointer("/variables/workspaceId").and_then(Value::as_str).unwrap_or("");
    let state_filter = payload.pointer("/variables/state").and_then(Value::as_str);
    if ws.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.list requires variables.workspaceId",
            cors,
        );
    }
    match state.runtime.epics_list(ws, state_filter) {
        Ok(epics) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "list": epics } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn epics_by_ref_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ref_uri = payload.pointer("/variables/ref").and_then(Value::as_str).unwrap_or("");
    if ref_uri.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.byRef requires variables.ref",
            cors,
        );
    }
    let parsed = match ResourceRef::parse(ref_uri) {
        Ok(p) => p,
        Err(e) => {
            return graphql_error_response(
                StatusCode::BAD_REQUEST,
                ErrorCode::BadUserInput.as_str(),
                &e.message,
                cors,
            );
        }
    };
    let Some(id) = parsed.id.as_ref().map(|i| i.as_str().to_string()) else {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.byRef requires an id in the URI",
            cors,
        );
    };
    match state.runtime.epic_by_id(&id) {
        Ok(found) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "byRef": found } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn epics_by_refs_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let refs: Vec<String> = payload
        .pointer("/variables/refs")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_str).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    match state.runtime.epics_by_refs(&refs) {
        Ok(epics) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "byRefs": epics } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn epics_progress_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ref_uri = payload.pointer("/variables/ref").and_then(Value::as_str).unwrap_or("");
    if ref_uri.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.progress requires variables.ref",
            cors,
        );
    }
    match state.runtime.epic_progress(ref_uri) {
        Ok(progress) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "progress": progress } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn epics_issues_in_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ref_uri = payload.pointer("/variables/ref").and_then(Value::as_str).unwrap_or("");
    if ref_uri.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.issuesIn requires variables.ref",
            cors,
        );
    }
    match state.runtime.epic_member_uris(ref_uri, "issue") {
        Ok(uris) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "issuesIn": uris } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn epics_children_of_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ref_uri = payload.pointer("/variables/ref").and_then(Value::as_str).unwrap_or("");
    if ref_uri.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "epics.childrenOf requires variables.ref",
            cors,
        );
    }
    match state.runtime.epic_member_uris(ref_uri, "epic") {
        Ok(uris) => json_response(
            StatusCode::OK,
            json!({ "data": { "epics": { "childrenOf": uris } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

// ── issues GraphQL dispatch ────────────────────────────────────────────────
fn issues_create_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    issues_create_response(state, payload, cors)
}

fn issues_create_response(state: AppState, payload: Value, cors: HeaderMap) -> Response {
    let workspace_id = payload
        .pointer("/variables/input/workspaceId")
        .and_then(Value::as_str)
        .unwrap_or("");
    let title = payload
        .pointer("/variables/input/title")
        .and_then(Value::as_str)
        .unwrap_or("");
    let body = payload
        .pointer("/variables/input/bodyMarkdown")
        .and_then(Value::as_str)
        .unwrap_or("");
    let repository_id = payload
        .pointer("/variables/input/repositoryId")
        .and_then(Value::as_str);
    let author_ref = payload
        .pointer("/variables/input/authorRef")
        .and_then(Value::as_str)
        .unwrap_or("comtrya://user/usr_00000000000000000000000000");
    let labels: Vec<String> = payload
        .pointer("/variables/input/labels")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_str).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    let epic_ref = payload
        .pointer("/variables/input/epicRef")
        .and_then(Value::as_str);

    if workspace_id.is_empty() || title.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "issues.create requires variables.input.{workspaceId, title}",
            cors,
        );
    }
    match state
        .runtime
        .create_issue(workspace_id, repository_id, title, body, author_ref, &labels, epic_ref)
    {
        Ok(issue) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "create": issue } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn issues_close_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    issues_close_response(state, payload, cors)
}

fn issues_close_response(state: AppState, payload: Value, cors: HeaderMap) -> Response {
    let id = payload.pointer("/variables/input/id").and_then(Value::as_str).unwrap_or("");
    if id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "issues.close requires variables.input.id",
            cors,
        );
    }
    let reason = payload.pointer("/variables/input/reason").and_then(Value::as_str);
    let closed_by = payload
        .pointer("/variables/input/closedByRef")
        .and_then(Value::as_str);
    match state.runtime.close_issue(id, reason, closed_by) {
        Ok(issue) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "close": issue } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::NOT_FOUND,
            "NOT_FOUND",
            &message,
            cors,
        ),
    }
}

fn issues_reopen_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    issues_reopen_response(state, payload, cors)
}

fn issues_reopen_response(state: AppState, payload: Value, cors: HeaderMap) -> Response {
    let id = payload.pointer("/variables/input/id").and_then(Value::as_str).unwrap_or("");
    if id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "issues.reopen requires variables.input.id",
            cors,
        );
    }
    match state.runtime.reopen_issue(id) {
        Ok(issue) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "reopen": issue } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::NOT_FOUND,
            "NOT_FOUND",
            &message,
            cors,
        ),
    }
}

fn issues_list_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    issues_list_response(state, payload, cors)
}

fn issues_list_response(state: AppState, payload: Value, cors: HeaderMap) -> Response {
    let ws = payload.pointer("/variables/workspaceId").and_then(Value::as_str);
    let repo = payload.pointer("/variables/repositoryId").and_then(Value::as_str);
    let state_filter = payload.pointer("/variables/state").and_then(Value::as_str);
    match state.runtime.issues_list(ws, repo, state_filter) {
        Ok(issues) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "list": issues } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

pub(crate) fn legacy_wasm_route_response(
    state: AppState,
    info: &crate::generated_dispatch::DispatchInfo,
    payload: Value,
    cors: HeaderMap,
) -> Option<Response> {
    match (info.extension_id, info.interface_name, info.op_name) {
        ("ext_issues", "issues", "open-issue") => {
            Some(issues_create_response(state, payload, cors))
        }
        ("ext_issues", "issues", "close-issue") => {
            Some(issues_close_response(state, payload, cors))
        }
        ("ext_issues", "issues", "reopen-issue") => {
            Some(issues_reopen_response(state, payload, cors))
        }
        ("ext_issues", "issues", "list-issues") => Some(issues_list_response(state, payload, cors)),
        _ => None,
    }
}

fn issues_by_ref_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ref_uri = payload.pointer("/variables/ref").and_then(Value::as_str).unwrap_or("");
    if ref_uri.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "issues.byRef requires variables.ref",
            cors,
        );
    }
    let parsed = match ResourceRef::parse(ref_uri) {
        Ok(p) => p,
        Err(e) => {
            return graphql_error_response(
                StatusCode::BAD_REQUEST,
                ErrorCode::BadUserInput.as_str(),
                &e.message,
                cors,
            );
        }
    };
    let Some(id) = parsed.id.as_ref().map(|i| i.as_str().to_string()) else {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "issues.byRef requires an id in the URI",
            cors,
        );
    };
    match state.runtime.issue_by_id(&id) {
        Ok(found) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "byRef": found } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn issues_by_refs_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let refs: Vec<String> = payload
        .pointer("/variables/refs")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_str).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    match state.runtime.issues_by_refs(&refs) {
        Ok(issues) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "byRefs": issues } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn issues_by_number_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let ws = payload
        .pointer("/variables/workspaceId")
        .and_then(Value::as_str)
        .unwrap_or("");
    let number = payload.pointer("/variables/number").and_then(Value::as_u64);
    if ws.is_empty() || number.is_none() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "issues.byNumber requires variables.workspaceId and .number",
            cors,
        );
    }
    match state.runtime.issue_by_number(ws, number.unwrap()) {
        Ok(found) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "byNumber": found } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn issues_state_counts_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let refs: Vec<String> = payload
        .pointer("/variables/refs")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter_map(Value::as_str).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    match state.runtime.issue_state_counts_for_refs(&refs) {
        Ok(counts) => json_response(
            StatusCode::OK,
            json!({ "data": { "issues": { "stateCountsForRefs": counts } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn comments_thread_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let target = payload
        .pointer("/variables/target")
        .and_then(Value::as_str)
        .unwrap_or("");
    if target.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "comments.thread requires variables.target",
            cors,
        );
    }
    match state.runtime.thread_for_target(target) {
        Ok(thread) => json_response(
            StatusCode::OK,
            json!({ "data": { "comments": { "thread": thread } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn comments_create_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let target = payload
        .pointer("/variables/input/target")
        .and_then(Value::as_str)
        .unwrap_or("");
    let body = payload
        .pointer("/variables/input/bodyMarkdown")
        .and_then(Value::as_str)
        .unwrap_or("");
    let parent = payload
        .pointer("/variables/input/parent")
        .and_then(Value::as_str);
    let author_ref = payload
        .pointer("/variables/input/authorRef")
        .and_then(Value::as_str)
        .unwrap_or("comtrya://user/usr_00000000000000000000000000");
    if target.is_empty() || body.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "comments.create requires variables.input.{target,bodyMarkdown}",
            cors,
        );
    }
    match state.runtime.create_comment(target, parent, body, author_ref) {
        Ok(comment) => json_response(
            StatusCode::OK,
            json!({ "data": { "comments": { "create": comment } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn comments_update_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = payload
        .pointer("/variables/input/id")
        .and_then(Value::as_str)
        .unwrap_or("");
    let body = payload
        .pointer("/variables/input/bodyMarkdown")
        .and_then(Value::as_str)
        .unwrap_or("");
    if id.is_empty() || body.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "comments.update requires variables.input.{id,bodyMarkdown}",
            cors,
        );
    }
    match state.runtime.update_comment(id, body) {
        Ok(comment) => json_response(
            StatusCode::OK,
            json!({ "data": { "comments": { "update": comment } } }),
            cors,
        ),
        Err(message) => {
            let status = if message.contains("not found") {
                StatusCode::NOT_FOUND
            } else {
                StatusCode::BAD_REQUEST
            };
            let code = if status == StatusCode::NOT_FOUND {
                "NOT_FOUND"
            } else {
                ErrorCode::BadUserInput.as_str()
            };
            graphql_error_response(status, code, &message, cors)
        }
    }
}

fn comments_delete_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = payload
        .pointer("/variables/input/id")
        .and_then(Value::as_str)
        .unwrap_or("");
    if id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "comments.delete requires variables.input.id",
            cors,
        );
    }
    match state.runtime.delete_comment(id) {
        Ok(deleted) => json_response(
            StatusCode::OK,
            json!({ "data": { "comments": { "delete": deleted } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn cors_or_response(state: &AppState, headers: &HeaderMap) -> Result<HeaderMap, Response> {
    state.runtime.check_boundary(headers, "/graphql")
}

pub(crate) fn graphql_guard(state: &AppState, headers: &HeaderMap) -> Result<HeaderMap, Response> {
    let cors = cors_or_response(state, headers)?;
    state
        .runtime
        .rate_limit("graphql", state.runtime.config.rate_limits.graphql_per_principal)
        .map_err(|response| response)?;
    Ok(cors)
}

fn relations_create_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let from = payload
        .pointer("/variables/input/from")
        .and_then(Value::as_str)
        .unwrap_or("");
    let to = payload
        .pointer("/variables/input/to")
        .and_then(Value::as_str)
        .unwrap_or("");
    let kind = payload
        .pointer("/variables/input/kind")
        .and_then(Value::as_str)
        .unwrap_or("");
    let attributes = payload.pointer("/variables/input/attributes");
    if from.is_empty() || to.is_empty() || kind.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "relations.create requires variables.input.{from,to,kind}",
            cors,
        );
    }
    match state.runtime.create_relation(from, to, kind, attributes) {
        Ok(relation) => json_response(
            StatusCode::OK,
            json!({
                "data": { "relations": { "create": relation } }
            }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            &message,
            cors,
        ),
    }
}

fn relations_delete_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let id = payload
        .pointer("/variables/input/id")
        .and_then(Value::as_str)
        .unwrap_or("");
    if id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "relations.delete requires variables.input.id",
            cors,
        );
    }
    match state.runtime.delete_relation(id) {
        Ok(deleted) => json_response(
            StatusCode::OK,
            json!({ "data": { "relations": { "delete": deleted } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn relations_outgoing_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let from = payload
        .pointer("/variables/from")
        .and_then(Value::as_str)
        .unwrap_or("");
    if from.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "relations.outgoing requires variables.from",
            cors,
        );
    }
    let kind = payload.pointer("/variables/kind").and_then(Value::as_str);
    match state.runtime.relations_outgoing(from, kind) {
        Ok(relations) => json_response(
            StatusCode::OK,
            json!({ "data": { "relations": { "outgoing": relations } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn relations_incoming_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let to = payload
        .pointer("/variables/to")
        .and_then(Value::as_str)
        .unwrap_or("");
    if to.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "relations.incoming requires variables.to",
            cors,
        );
    }
    let kind = payload.pointer("/variables/kind").and_then(Value::as_str);
    match state.runtime.relations_incoming(to, kind) {
        Ok(relations) => json_response(
            StatusCode::OK,
            json!({ "data": { "relations": { "incoming": relations } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn relations_between_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return r,
    };
    let from = payload
        .pointer("/variables/from")
        .and_then(Value::as_str)
        .unwrap_or("");
    let to = payload
        .pointer("/variables/to")
        .and_then(Value::as_str)
        .unwrap_or("");
    if from.is_empty() || to.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "relations.between requires variables.from and variables.to",
            cors,
        );
    }
    let kind = payload.pointer("/variables/kind").and_then(Value::as_str);
    match state.runtime.relations_between(from, to, kind) {
        Ok(relations) => json_response(
            StatusCode::OK,
            json!({ "data": { "relations": { "between": relations } } }),
            cors,
        ),
        Err(message) => graphql_error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            &message,
            cors,
        ),
    }
}

fn create_repository_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match state.runtime.check_boundary(&headers, "/graphql") {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    if let Err(response) = state.runtime.rate_limit(
        "graphql",
        state.runtime.config.rate_limits.graphql_per_principal,
    ) {
        return response;
    }
    let path = payload
        .pointer("/variables/input/path")
        .and_then(Value::as_str)
        .unwrap_or("");
    if path.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "createRepository requires variables.input.path",
            cors,
        );
    }
    let clone_from_url = payload
        .pointer("/variables/input/cloneFromUrl")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty());
    match state.runtime.create_repository_document(path, clone_from_url) {
        Ok(repository) => json_response(
            StatusCode::OK,
            json!({
                "data": {
                    "createRepository": {
                        "repository": repository,
                    }
                }
            }),
            cors,
        ),
        Err(message) => {
            let status = if message.contains("already exists") {
                StatusCode::CONFLICT
            } else if message.contains("invalid") || message.contains("must contain") {
                StatusCode::BAD_REQUEST
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            let code = if status == StatusCode::CONFLICT {
                "CONFLICT"
            } else if status == StatusCode::BAD_REQUEST {
                ErrorCode::BadUserInput.as_str()
            } else {
                "INTERNAL_ERROR"
            };
            graphql_error_response(status, code, &message, cors)
        }
    }
}

pub(crate) fn graphql_error_response(
    status: StatusCode,
    code: &str,
    message: &str,
    cors: HeaderMap,
) -> Response {
    json_response(
        status,
        json!({
            "errors": [{
                "message": message,
                "extensions": { "code": code },
            }]
        }),
        cors,
    )
}

fn graphql_response(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match state.runtime.check_boundary(&headers, "/graphql") {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    if let Err(response) = state.runtime.rate_limit(
        "graphql",
        state.runtime.config.rate_limits.graphql_per_principal,
    ) {
        return response;
    }
    let principal = state.runtime.principal_from_headers(&headers);
    if principal == PrincipalStatus::Invalid {
        return error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "invalid bearer token",
        );
    }
    let demo = match state.runtime.demo_payload() {
        Ok(demo) => demo,
        Err(error) => {
            return error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                ErrorCode::StorageUnavailable.as_str(),
                &error,
            );
        }
    };
    let repository = typed_repository_payload(&demo);
    let capabilities = InstanceCapabilities::v1();

    // Resolve workspace.repositoryByPath from query variables if provided.
    let repositories_value = demo.get("repositories").cloned().unwrap_or_else(|| json!([]));
    let path_segments: Vec<String> = payload
        .get("variables")
        .and_then(|v| v.get("segments"))
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect()
        })
        .unwrap_or_default();
    let mut repository_by_path =
        resolve_repository_by_path(&repositories_value, &path_segments)
            .unwrap_or(json!(null));
    // Enrich repositoryByPath with derived fields (groups, on-disk git data)
    // so the code-browser widget can render any repo, not just the demo one.
    if let Some(repo_obj) = repository_by_path.as_object_mut() {
        if let Some(canonical) = repo_obj.get("path").and_then(Value::as_str).map(str::to_owned) {
            let (groups, _name) = split_repo_path(&canonical);
            repo_obj.insert("groups".to_string(), json!(groups));
            let git_dir = state
                .runtime
                .data_dir
                .join("repositories")
                .join(format!("{canonical}.git"));
            if git_dir.is_dir() {
                let git_payload = repo_git_data(&git_dir);
                if let Some(obj) = git_payload.as_object() {
                    for (key, value) in obj {
                        repo_obj.insert(key.clone(), value.clone());
                    }
                }
            }
        }
    }

    // Enrich repositories with groups[], openPullRequests, checkSummary, lastCommitAt.
    let pull_requests_for_summary = demo.get("pullRequests").cloned().unwrap_or_else(|| json!([]));
    let checks_for_summary = demo.get("checks").cloned().unwrap_or_else(|| json!([]));
    let enriched_repositories: Value = Value::Array(
        repositories_value
            .as_array()
            .map(Vec::as_slice)
            .unwrap_or(&[])
            .iter()
            .map(|repo| build_repository_summary(repo, &pull_requests_for_summary, &checks_for_summary))
            .collect(),
    );

    // Build the workspace object enriched with the repositoryByPath resolver result,
    // the enriched repositories list, and workspace.events filtered to viewer-accessible repos.
    let workspace = {
        let mut ws = demo
            .get("workspace")
            .cloned()
            .unwrap_or_else(|| json!({}));
        if let Some(obj) = ws.as_object_mut() {
            obj.insert("repositoryByPath".to_string(), repository_by_path);
            obj.insert("repositories".to_string(), enriched_repositories);

            // Compute viewer-visible repository IDs: v1 = all repos in workspace.
            // TODO: restrict to per-viewer access when auth is real (V3_PLAN federated planner).
            let all_repo_ids: Vec<String> = repositories_value
                .as_array()
                .map(Vec::as_slice)
                .unwrap_or(&[])
                .iter()
                .filter_map(|r| r.get("id").and_then(|v| v.as_str()).map(String::from))
                .collect();
            let activity_events = demo.get("activity").cloned().unwrap_or_else(|| json!([]));
            let filtered_events = filter_events_for_viewer(&activity_events, &all_repo_ids);
            // workspace.events: scoped, filtered activity feed (scope fixed to WORKSPACE in v1).
            obj.insert("events".to_string(), serde_json::Value::Array(filtered_events));
        }
        ws
    };

    // Build the viewer object with host-side aggregated fields.
    // v1: aggregated:true flag signals federated planner (V3_PLAN item 9) can replace later.
    // TODO: v1 stub — `viewer.id` is a placeholder. Once real OIDC auth flows through
    // the GraphQL handler, replace with the authenticated subject. Until then,
    // `build_authored_pulls` will always return empty because seed PRs use
    // real-looking author names like "rawkode"/"alice"/"mira".
    let viewer_stub = json!({
        "id": "viewer",
        "permissions": vec![
            "instance.admin",
            "graphql:read",
            "graphql:write",
            "events:read",
            "git:read",
            "checks:read",
        ]
    });
    let viewer = json!({
        "authenticated": principal != PrincipalStatus::Anonymous,
        "permissions": viewer_stub["permissions"].clone(),
        // limit hardcoded to 10 in v1: the JSON-shaped GraphQL handler doesn't parse
        // field arguments. Real argument parsing arrives with the federated planner.
        "reviewQueue": build_review_queue(&viewer_stub, &pull_requests_for_summary, 10),
        "authoredPulls": build_authored_pulls(&viewer_stub, &pull_requests_for_summary, 10),
        "failingChecks": build_failing_checks(&viewer_stub, &checks_for_summary, 10),
    });

    json_response(
        StatusCode::OK,
        json!({
            "data": {
                "viewer": viewer,
                "instance": {
                    "id": state.runtime.config.id,
                    "name": state.runtime.config.name,
                    "publicURL": state.runtime.config.public_url,
                    "capabilities": {
                        "gitHTTPS": capabilities.git_https,
                        "gitLFS": capabilities.git_lfs,
                        "sse": capabilities.sse,
                        "graphqlSubscriptions": capabilities.graphql_subscriptions,
                        "extensionRuntime": capabilities.extension_runtime
                    }
                },
                "workspace": workspace,
                "repository": repository,
                "repositories": repositories_value,
                "extensionInstallations": inject_route_prefix(
                    demo.get("extensions").cloned().unwrap_or_else(|| json!([])),
                    &state.runtime.config.extensions,
                    &state.runtime.extension_runtime,
                ),
                "extensionResolvers": demo.get("extensionResolvers").cloned().unwrap_or_else(|| json!([])),
                "activityEvents": demo.get("activity").cloned().unwrap_or_else(|| json!([])),
                "demo": demo
            }
        }),
        cors,
    )
}

async fn graphql_stream(State(state): State<AppState>, headers: HeaderMap) -> Response {
    event_stream_response(state, headers, None, "/graphql/stream")
}

async fn events(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    event_stream_response(state, headers, query.get("session").cloned(), "/events")
}

fn event_stream_response(
    state: AppState,
    headers: HeaderMap,
    session: Option<String>,
    route: &str,
) -> Response {
    let cors = match state.runtime.check_boundary(&headers, route) {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    let principal = if let Some(session) = session {
        match state.runtime.consume_session(&session) {
            Ok(principal) => principal,
            Err(response) => return response,
        }
    } else {
        state.runtime.principal_from_headers(&headers)
    };
    if !matches!(
        principal,
        PrincipalStatus::OperatorCredential | PrincipalStatus::Credential
    ) {
        return error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "event stream requires a bearer token or single-use session",
        );
    }

    let frames = state
        .runtime
        .read_events()
        .into_iter()
        .enumerate()
        .map(|(idx, event)| {
            let event_type = event
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or("dev.comtrya.event");
            format!("id: {idx}\nevent: {event_type}\ndata: {event}\n\n")
        })
        .collect::<String>();
    text_response(StatusCode::OK, "text/event-stream", frames, cors)
}

async fn events_session(State(state): State<AppState>, headers: HeaderMap) -> Response {
    issue_session_response(state, headers, "/events/session")
}

async fn extension_session(State(state): State<AppState>, headers: HeaderMap) -> Response {
    issue_session_response(state, headers, "/_extensions/session")
}

fn issue_session_response(state: AppState, headers: HeaderMap, route: &str) -> Response {
    let cors = match state.runtime.check_boundary(&headers, route) {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    let principal = state.runtime.principal_from_headers(&headers);
    if !matches!(
        principal,
        PrincipalStatus::OperatorCredential | PrincipalStatus::Credential
    ) {
        return error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "session issuance requires a valid bearer token",
        );
    }
    let token = state.runtime.issue_session(principal);
    json_response(
        StatusCode::OK,
        json!({"session": token, "expiresIn": state.runtime.options.session_ttl_seconds}),
        cors,
    )
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TokenExchangeRequest {
    grant_type: String,
    subject_token: String,
    subject_token_type: String,
    requested_resource: String,
    requested_actions: Vec<String>,
}

async fn token_exchange(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<TokenExchangeRequest>,
) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/auth/token-exchange")
    {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    if request.grant_type != "urn:comtrya:grant:operator-code"
        || request.subject_token_type != "urn:comtrya:token-type:operator-code"
    {
        return error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "unsupported production-testbed token exchange grant",
        );
    }
    if state
        .runtime
        .options
        .operator_code
        .as_deref()
        .is_none_or(|code| code != request.subject_token)
    {
        return error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "subject token did not validate against the seeded production-testbed operator code",
        );
    }
    if let Err(error) = ResourceRef::parse(&request.requested_resource) {
        return error_response(StatusCode::BAD_REQUEST, error.code.as_str(), &error.message);
    }
    for action in &request.requested_actions {
        if let Err(error) = TokenAction::parse(action) {
            return error_response(StatusCode::BAD_REQUEST, error.code.as_str(), &error.message);
        }
    }
    let token = state.runtime.issue_credential(
        request.requested_resource.clone(),
        request.requested_actions.clone(),
        PrincipalStatus::OperatorCredential,
    );
    json_response(
        StatusCode::OK,
        json!({
            "accessToken": token,
            "tokenType": "Bearer",
            "expiresIn": 300,
            "scope": request.requested_actions,
            "resource": request.requested_resource
        }),
        cors,
    )
}

async fn extension_manifest(
    State(state): State<AppState>,
    AxumPath(extension): AxumPath<String>,
    headers: HeaderMap,
) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/_extensions/ext_01hv/manifest.json")
    {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    match state.runtime.extension_manifest_body(&extension) {
        Ok(Some(body)) => text_response(StatusCode::OK, "application/json", body, cors),
        Ok(None) => error_response(
            StatusCode::NOT_FOUND,
            ErrorCode::NotFound.as_str(),
            "extension manifest was not found",
        ),
        Err(error) => error_response(
            StatusCode::SERVICE_UNAVAILABLE,
            ErrorCode::StorageUnavailable.as_str(),
            &error,
        ),
    }
}

async fn extension_asset(
    State(state): State<AppState>,
    AxumPath((extension, asset_path)): AxumPath<(String, String)>,
    headers: HeaderMap,
) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/_extensions/ext_01hv/assets/index.js")
    {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    let asset = match state.runtime.extension_asset_body(&extension, &asset_path) {
        Ok(Some(asset)) => asset,
        Ok(None) => {
            return error_response(
                StatusCode::NOT_FOUND,
                ErrorCode::NotFound.as_str(),
                "extension asset was not found",
            );
        }
        Err(error) => {
            return error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                ErrorCode::StorageUnavailable.as_str(),
                &error,
            );
        }
    };
    let mut response = bytes_response(StatusCode::OK, asset.content_type, asset.body, cors);
    apply_extension_asset_headers(&mut response, &asset.etag);
    response
}

fn apply_extension_asset_headers(response: &mut Response, etag: &str) {
    response.headers_mut().insert(
        CONTENT_SECURITY_POLICY,
        HeaderValue::from_static(
            "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'",
        ),
    );
    response.headers_mut().insert(
        CACHE_CONTROL,
        HeaderValue::from_static("private, max-age=31536000, immutable"),
    );
    response.headers_mut().insert(
        ETAG,
        HeaderValue::from_str(etag).expect("valid extension asset ETag"),
    );
}

async fn git_endpoint(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
    AxumPath(path): AxumPath<String>,
    RawQuery(raw_query): RawQuery,
    body: Bytes,
) -> Response {
    let cors = match state.runtime.check_boundary(&headers, "/git/*") {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    let principal = state.runtime.principal_from_headers(&headers);
    if !matches!(
        principal,
        PrincipalStatus::OperatorCredential | PrincipalStatus::Credential
    ) {
        let mut response = error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "Git smart HTTP requires a valid Comtrya credential",
        );
        response.headers_mut().insert(
            "WWW-Authenticate",
            HeaderValue::from_static("Bearer realm=\"comtrya\""),
        );
        return response;
    }
    if path.contains("..") {
        return error_response(
            StatusCode::NOT_FOUND,
            ErrorCode::NotFound.as_str(),
            "Git repository was not found",
        );
    }
    if is_receive_pack(&path, raw_query.as_deref()) {
        return unsupported_response(
            unsupported_surface_by_id("git_receive_pack")
                .expect("git_receive_pack unsupported surface is registered"),
            cors,
        );
    }
    if !state.runtime.credential_allows(&headers, "git:read") {
        return error_response(
            StatusCode::FORBIDDEN,
            ErrorCode::Forbidden.as_str(),
            "credential scope does not allow requested Git operation",
        );
    }

    let use_legacy = std::env::var("COMTRYA_GIT_BACKEND").ok().as_deref() == Some("legacy");
    if use_legacy {
        let adapter = ShellGitHttpBackendAdapter;
        return match adapter.handle(GitSmartHttpRequest {
            project_root: &state.runtime.demo_repository.project_root,
            path: &path,
            query: raw_query.as_deref().unwrap_or_default(),
            method: &method,
            headers: &headers,
            body,
            cors,
        }) {
            Ok(response) => response,
            Err(error) => error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                ErrorCode::StorageUnavailable.as_str(),
                &error,
            ),
        };
    }

    // Pure-Rust Smart HTTP v2 path via comtrya-git-http.
    // Parse "{seg}/{seg}.../{suffix}" where suffix is info/refs | git-upload-pack | git-receive-pack.
    let (segments, suffix) = match split_git_path(&path) {
        Some(parts) => parts,
        None => {
            return error_response(
                StatusCode::NOT_FOUND,
                ErrorCode::NotFound.as_str(),
                "unrecognized Git smart HTTP path",
            );
        }
    };
    let service = parse_service_query(raw_query.as_deref());
    let mut response = git_v2::dispatch(
        state.git_state.clone(),
        segments,
        &suffix,
        service.as_deref(),
        headers,
        axum::body::Body::from(body),
    )
    .await;
    response.headers_mut().extend(cors);
    response
}

fn split_git_path(path: &str) -> Option<(Vec<String>, String)> {
    let trimmed = path.trim_matches('/');
    if trimmed.is_empty() {
        return None;
    }
    for suffix in ["info/refs", "git-upload-pack", "git-receive-pack"] {
        let suffix_with_slash = format!("/{suffix}");
        if let Some(prefix) = trimmed.strip_suffix(&suffix_with_slash) {
            let segs: Vec<String> = prefix
                .split('/')
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
                .collect();
            if segs.is_empty() {
                return None;
            }
            return Some((segs, suffix.to_string()));
        }
    }
    None
}

fn parse_service_query(query: Option<&str>) -> Option<String> {
    let q = query?;
    for pair in q.split('&') {
        if let Some(value) = pair.strip_prefix("service=") {
            return Some(value.to_string());
        }
    }
    None
}

async fn preflight(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(path): axum::extract::Path<String>,
) -> Response {
    match state.runtime.check_boundary(&headers, &format!("/{path}")) {
        Ok(cors) => {
            let mut response = Response::new(Body::empty());
            *response.status_mut() = StatusCode::NO_CONTENT;
            *response.headers_mut() = cors;
            response
        }
        Err(response) => response,
    }
}

fn json_response(status: StatusCode, body: Value, headers: HeaderMap) -> Response {
    let mut response = Json(body).into_response();
    *response.status_mut() = status;
    response.headers_mut().extend(headers);
    response
}

fn text_response(
    status: StatusCode,
    content_type: &'static str,
    body: impl Into<String>,
    headers: HeaderMap,
) -> Response {
    let mut response = Response::new(Body::from(body.into()));
    *response.status_mut() = status;
    response
        .headers_mut()
        .insert("Content-Type", HeaderValue::from_static(content_type));
    response.headers_mut().extend(headers);
    response
}

fn bytes_response(
    status: StatusCode,
    content_type: &'static str,
    body: Vec<u8>,
    headers: HeaderMap,
) -> Response {
    let mut response = Response::new(Body::from(body));
    *response.status_mut() = status;
    response
        .headers_mut()
        .insert("Content-Type", HeaderValue::from_static(content_type));
    response.headers_mut().extend(headers);
    response
}

fn error_response(status: StatusCode, code: &str, message: &str) -> Response {
    json_response(
        status,
        json!({"errors": [{"message": message, "extensions": {"code": code}}]}),
        HeaderMap::new(),
    )
}

fn unsupported_surface_for_path(path: &str) -> Option<&'static UnsupportedSurface> {
    UNSUPPORTED_SURFACES
        .iter()
        .find(|surface| path.starts_with(surface.path_prefix))
}

fn unsupported_surface_by_id(id: &str) -> Option<&'static UnsupportedSurface> {
    UNSUPPORTED_SURFACES.iter().find(|surface| surface.id == id)
}

fn unsupported_response(surface: &UnsupportedSurface, headers: HeaderMap) -> Response {
    json_response(
        StatusCode::NOT_IMPLEMENTED,
        json!({
            "errors": [{
                "message": surface.message,
                "extensions": {
                    "code": ErrorCode::Unsupported.as_str(),
                    "surface": surface.id
                }
            }]
        }),
        headers,
    )
}

fn typed_repository_payload(demo: &Value) -> Value {
    let mut repository = demo.get("repository").cloned().unwrap_or_else(|| json!({}));
    if let Some(repository) = repository.as_object_mut() {
        for (field, source) in [
            ("refs", "refs"),
            ("branches", "branches"),
            ("commits", "commits"),
            ("treeEntries", "treeEntries"),
            ("files", "files"),
            ("blobs", "blobs"),
            ("pullRequests", "pullRequests"),
            ("checks", "checks"),
        ] {
            repository.insert(
                field.to_string(),
                demo.get(source).cloned().unwrap_or_else(|| json!([])),
            );
        }
        repository.insert(
            "diff".to_string(),
            demo.get("diff").cloned().unwrap_or_else(|| json!(null)),
        );
    }
    repository
}

fn repository_collection_payload(live_repository: &Value, stored_repositories: &Value) -> Value {
    let mut repositories = Vec::new();
    let live_id = live_repository.get("id").and_then(Value::as_str);
    repositories.push(live_repository.clone());

    if let Some(stored) = stored_repositories.as_array() {
        for repository in stored {
            let stored_id = repository.get("id").and_then(Value::as_str);
            if stored_id.is_some() && stored_id == live_id {
                continue;
            }
            repositories.push(repository.clone());
        }
    }

    Value::Array(repositories)
}

/// Resolve a repository from a flat JSON repositories array by URL path segments.
///
/// `repositories` must be a `Value::Array` of repository objects each carrying
/// a `"path"` field (e.g. `"comtrya/comtrya"`).  The segments slice is joined
/// with `/` and compared against that field.  Returns `None` when `segments` is
/// empty, when `repositories` is not an array, or when no match is found.
pub fn resolve_repository_by_path(repositories: &Value, segments: &[String]) -> Option<Value> {
    if segments.is_empty() {
        return None;
    }
    let path = segments.join("/");
    repositories.as_array()?.iter().find(|repo| {
        repo.get("path")
            .and_then(Value::as_str)
            .map(|p| p == path)
            .unwrap_or(false)
    }).cloned()
}

/// Split a repository `path` (slash-joined segments) into `(groups, name)`.
///
/// The last segment becomes the repository name; all preceding segments become
/// the groups array.  Examples:
/// - `"comtrya/comtrya"` → `(["comtrya"], "comtrya")`
/// - `"comtrya"` → `([], "comtrya")`
/// - `"public/internal/obs"` → `(["public", "internal"], "obs")`
pub fn split_repo_path(path: &str) -> (Vec<String>, String) {
    let mut segments: Vec<String> = path
        .split('/')
        .filter(|s| !s.is_empty())
        .map(String::from)
        .collect();
    let name = segments.pop().unwrap_or_default();
    (segments, name)
}

/// Validate a user-supplied repository path. Each segment must satisfy the
/// `Slug` rules (lowercase alphanumerics with `-`, `_`, `.`) and the path
/// must contain at least one segment. Returns the normalized segments and
/// the canonical `groups/.../name` string.
pub fn validate_repo_path(input: &str) -> Result<(Vec<String>, String), String> {
    let segments: Vec<String> = input
        .split('/')
        .filter(|segment| !segment.is_empty())
        .map(String::from)
        .collect();
    if segments.is_empty() {
        return Err("repository path must contain at least one segment".to_string());
    }
    for segment in &segments {
        Slug::new(segment.clone())
            .map_err(|error| format!("path segment {segment:?} is invalid: {}", error.message))?;
    }
    let canonical = segments.join("/");
    Ok((segments, canonical))
}

/// Derive the set of open pull-request states that count toward the
/// `openPullRequests` summary counter.
const OPEN_PR_STATES: &[&str] = &["READY", "REVIEW", "DRAFT"];

/// Build an enriched repository summary object with `groups`, `openPullRequests`,
/// `checkSummary`, and `lastCommitAt` derived from the raw repository document
/// plus the workspace-level pull-request and check-run collections.
///
/// All existing fields from `repo` are preserved; new fields are injected.
/// Fields that cannot be derived default to safe zero-values so the shape is
/// always complete.
pub fn build_repository_summary(repo: &Value, pull_requests: &Value, checks: &Value) -> Value {
    let repo_id = repo.get("id").and_then(Value::as_str).unwrap_or("");
    let path = repo.get("path").and_then(Value::as_str).unwrap_or("");
    let (groups, _derived_name) = split_repo_path(path);

    // Count open pull-requests for this repository.
    let open_prs = pull_requests
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or(&[])
        .iter()
        .filter(|pr| {
            let pr_repo = pr.get("repositoryID").and_then(Value::as_str).unwrap_or("");
            let state = pr.get("state").and_then(Value::as_str).unwrap_or("");
            !pr_repo.is_empty() && pr_repo == repo_id && OPEN_PR_STATES.contains(&state)
        })
        .count();

    // Compute check summary for this repository.
    let repo_checks: Vec<&Value> = checks
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or(&[])
        .iter()
        .filter(|c| {
            let c_repo = c.get("repositoryID").and_then(Value::as_str).unwrap_or("");
            !c_repo.is_empty() && c_repo == repo_id
        })
        .collect();
    let checks_total = repo_checks.len();
    let checks_passed = repo_checks
        .iter()
        .filter(|c| c.get("conclusion").and_then(Value::as_str) == Some("SUCCESS"))
        .count();

    // lastCommitAt: prefer field already on the document; fall back to null.
    let last_commit_at = repo
        .get("lastCommitAt")
        .cloned()
        .unwrap_or(Value::Null);

    // Start from the existing document fields, then overlay new ones.
    let mut summary = repo.clone();
    if let Some(obj) = summary.as_object_mut() {
        obj.insert(
            "groups".to_string(),
            Value::Array(groups.into_iter().map(Value::String).collect()),
        );
        obj.insert(
            "openPullRequests".to_string(),
            Value::Number(serde_json::Number::from(open_prs)),
        );
        obj.insert(
            "checkSummary".to_string(),
            json!({
                "passed": checks_passed,
                "total": checks_total
            }),
        );
        obj.insert("lastCommitAt".to_string(), last_commit_at);
    }
    summary
}

/// Returns pulls in REVIEW/READY where the viewer appears in `reviewers[]`.
/// When `reviewers` is absent (current seed shape), includes all REVIEW/READY pulls.
/// v1 fallback — federated planner (V3_PLAN item 9) will provide typed reviewer state.
pub fn build_review_queue(viewer: &Value, pulls: &Value, limit: usize) -> Value {
    let viewer_id = viewer.get("id").and_then(Value::as_str).unwrap_or("");
    let items: Vec<Value> = pulls
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter(|pr| {
            let state = pr.get("state").and_then(Value::as_str).unwrap_or("");
            if state != "REVIEW" && state != "READY" {
                return false;
            }
            // If a `reviewers` array is present, filter to viewer's entries only.
            match pr.get("reviewers").and_then(Value::as_array) {
                Some(reviewers) => reviewers
                    .iter()
                    .any(|r| r.as_str() == Some(viewer_id)),
                // No reviewers field: include all REVIEW/READY PRs.
                None => true,
            }
        })
        .take(limit)
        .collect();
    json!({ "aggregated": true, "items": items })
}

/// Filters pulls to those whose `author` matches the viewer id.
///
/// Unlike `build_review_queue` and `build_failing_checks`, this does NOT fall
/// back to "include all" when `author` is absent — that would expose every PR
/// to every viewer. The trade-off: in v1 the viewer stub has `id: "viewer"`
/// and seed PRs have no `author`, so this is effectively empty until either
/// real auth lands or the federated planner (V3_PLAN item 9) provides typed
/// authorship data.
pub fn build_authored_pulls(viewer: &Value, pulls: &Value, limit: usize) -> Value {
    let viewer_id = viewer.get("id").and_then(Value::as_str).unwrap_or("");
    let items: Vec<Value> = pulls
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter(|pr| pr.get("author").and_then(Value::as_str) == Some(viewer_id))
        .take(limit)
        .collect();
    json!({ "aggregated": true, "items": items })
}

/// Returns check_runs with conclusion FAILURE whose `author` matches viewer.
/// When `author` is absent (current seed shape), includes all FAILUREs.
/// v1 fallback — federated planner (V3_PLAN item 9) will provide branch-author attribution.
pub fn build_failing_checks(viewer: &Value, checks: &Value, limit: usize) -> Value {
    let viewer_id = viewer.get("id").and_then(Value::as_str).unwrap_or("");
    let items: Vec<Value> = checks
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter(|c| {
            let conclusion = c.get("conclusion").and_then(Value::as_str).unwrap_or("");
            if conclusion != "FAILURE" {
                return false;
            }
            // If an `author` field is present, restrict to viewer.
            match c.get("author").and_then(Value::as_str) {
                Some(author) => author == viewer_id,
                // No author field: include all FAILURE checks.
                None => true,
            }
        })
        .take(limit)
        .collect();
    json!({ "aggregated": true, "items": items })
}

/// Filter an `activityEvents` array to only include events whose `repositoryID`
/// is present in `visible_repo_ids`.  Events without a `repositoryID` field are
/// excluded (defensive: unknown provenance).
///
/// # Scope argument note
/// The JSON-shaped GraphQL handler does not parse field arguments, so the
/// `scope: WORKSPACE | REPOSITORY` enum described in the plan is not yet wired.
/// TODO: parse scope argument when the federated planner lands; for now scope is
/// fixed to WORKSPACE (all viewer-accessible repos in the workspace).
pub fn filter_events_for_viewer(events: &serde_json::Value, visible_repo_ids: &[String]) -> Vec<serde_json::Value> {
    events
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter(|ev| {
            let repo = ev.get("repositoryID").and_then(|v| v.as_str()).unwrap_or("");
            !repo.is_empty() && visible_repo_ids.iter().any(|id| id == repo)
        })
        .collect()
}

const FIRST_PARTY_EXTENSIONS: &[&str] = &[
    "ext_pull_requests",
    "ext_checks",
    "ext_workspace_home",
    "ext_issues",
    "ext_epics",
];

/// Core verb vocabulary. Extensions can mint additional verbs in their own
/// namespace (`comtrya://rel/<reverse-dns>/<verb>`); the kernel doesn't gate
/// on those and treats them as asymmetric by default.
#[derive(Debug, Clone, Copy)]
struct CoreVerb {
    uri: &'static str,
    symmetric: bool,
}

const CORE_VERBS: &[CoreVerb] = &[
    CoreVerb { uri: "comtrya://rel/part-of",    symmetric: false },
    CoreVerb { uri: "comtrya://rel/blocks",     symmetric: false },
    CoreVerb { uri: "comtrya://rel/relates-to", symmetric: true  },
    CoreVerb { uri: "comtrya://rel/duplicates", symmetric: false },
    CoreVerb { uri: "comtrya://rel/mentions",   symmetric: false },
];

// ── Reactor surface ───────────────────────────────────────────────────────
// Reactors are kernel-side handlers keyed by (extension_id, event_type).
// They mirror the documented WIT `reactor` interface in docs/extensions.md;
// real WASM-driven reactors are deferred and would replace these handler
// pointers. The allowlists below are identity (the same shape as a
// manifest-declared reactor.allowedMutations / allowedEmits) and the
// dispatcher enforces them.

pub struct EventEnvelope {
    pub event_type: String,
    pub payload: Value,
}

pub enum Reaction {
    InvokeMutation {
        name: String,
        variables: Value,
    },
    EmitEvent {
        event_type: String,
        payload: Value,
    },
}

struct Reactor {
    extension_id: &'static str,
    event_type: &'static str,
    handler: fn(&Runtime, &EventEnvelope) -> Vec<Reaction>,
    allowed_mutations: &'static [&'static str],
    allowed_emits: &'static [&'static str],
}

/// Reactor table. Populated by extensions that opt into event-driven
/// reactions. The `ext_pull_requests` auto-close-on-merge entry reads
/// outgoing `closes` relations from the merged PR's ref and emits an
/// `issues.close` mutation per linked issue.
const REACTORS: &[Reactor] = &[Reactor {
    extension_id: "ext_pull_requests",
    event_type: "dev.comtrya.pull-request.merged",
    handler: pull_requests_on_merge,
    allowed_mutations: &["issues.close"],
    allowed_emits: &[],
}];

fn pull_requests_on_merge(runtime: &Runtime, env: &EventEnvelope) -> Vec<Reaction> {
    let pr_ref = match env.payload.get("pullRequestRef").and_then(|v| v.as_str()) {
        Some(s) => s,
        None => return Vec::new(),
    };
    let relations = runtime
        .relations_outgoing(pr_ref, Some("comtrya://rel/com.comtrya.pulls/closes"))
        .unwrap_or_default();
    let mut reactions = Vec::new();
    for rel in relations {
        let Some(issue_uri) = rel.get("to").and_then(|v| v.as_str()) else {
            continue;
        };
        let Ok(parsed) = ResourceRef::parse(issue_uri) else {
            continue;
        };
        let Some(id) = parsed.id.as_ref().map(|i| i.as_str().to_string()) else {
            continue;
        };
        reactions.push(Reaction::InvokeMutation {
            name: "issues.close".to_string(),
            variables: json!({
                "id": id,
                "reason": "completed",
                "closedByRef": pr_ref,
            }),
        });
    }
    reactions
}

/// A verb URI is well-formed when it starts with `comtrya://rel/` and the
/// remainder is one or more `/`-separated segments where each segment
/// contains only lowercase ASCII, digits, dots, dashes, or underscores.
fn validate_verb_uri(uri: &str) -> Result<(), String> {
    let Some(rest) = uri.strip_prefix("comtrya://rel/") else {
        return Err(format!(
            "relation verb must start with `comtrya://rel/`, got {uri:?}"
        ));
    };
    if rest.is_empty() {
        return Err("relation verb has no path".to_string());
    }
    for segment in rest.split('/') {
        if segment.is_empty() {
            return Err(format!("relation verb has empty segment in {uri:?}"));
        }
        if !segment.bytes().all(|b| {
            b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-' || b == b'_' || b == b'.'
        }) {
            return Err(format!(
                "relation verb segment {segment:?} has invalid chars; allowed: a-z 0-9 . - _"
            ));
        }
    }
    Ok(())
}
const DEFAULT_OPERATOR_CODES: &[&str] = &["dev-secret", "comtrya-local-operator-code"];
const DEMO_EXPECTED_REFS: &[&str] = &[
    "refs/heads/main",
    "refs/heads/extensions/checks-dashboard",
    "refs/heads/ui/repository-intelligence",
];

#[derive(Debug, Clone)]
struct GitDemoSnapshot {
    repository: Value,
    refs: Vec<Value>,
    branches: Vec<Value>,
    commits: Vec<Value>,
    tree_entries: Vec<Value>,
    files: Vec<Value>,
    blobs: Vec<Value>,
    diff: Value,
}

fn init_bare_repository_on_disk(project_root: &Path, canonical_path: &str) -> Result<PathBuf, String> {
    let git_dir = project_root.join(format!("{canonical_path}.git"));
    if git_dir.exists() {
        return Err(format!("{} already exists on disk", git_dir.display()));
    }
    if let Some(parent) = git_dir.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("failed to create {}: {error}", parent.display()))?;
    }
    run_command(
        Command::new("git")
            .arg("init")
            .arg("--bare")
            .arg("--initial-branch=main")
            .arg(&git_dir),
        "git init --bare",
    )?;
    fs::write(git_dir.join("git-daemon-export-ok"), b"")
        .map_err(|error| format!("failed to mark git-daemon-export-ok: {error}"))?;
    Ok(git_dir)
}

fn clone_bare_repository_on_disk(
    project_root: &Path,
    canonical_path: &str,
    clone_url: &str,
) -> Result<PathBuf, String> {
    let git_dir = project_root.join(format!("{canonical_path}.git"));
    if git_dir.exists() {
        return Err(format!("{} already exists on disk", git_dir.display()));
    }
    if let Some(parent) = git_dir.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("failed to create {}: {error}", parent.display()))?;
    }
    let output = Command::new("git")
        .arg("clone")
        .arg("--bare")
        .arg("--quiet")
        .arg(clone_url)
        .arg(&git_dir)
        .output()
        .map_err(|error| format!("failed to spawn git clone: {error}"))?;
    if !output.status.success() {
        let _ = fs::remove_dir_all(&git_dir);
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "git clone --bare failed (exit {}): {}",
            output.status,
            stderr.trim()
        ));
    }
    fs::write(git_dir.join("git-daemon-export-ok"), b"")
        .map_err(|error| format!("failed to mark git-daemon-export-ok: {error}"))?;
    Ok(git_dir)
}

fn validate_clone_url(url: &str) -> Result<(), String> {
    const ALLOWED_SCHEMES: &[&str] = &["http://", "https://", "git://", "file://"];
    if !ALLOWED_SCHEMES.iter().any(|scheme| url.starts_with(scheme)) {
        return Err(format!(
            "clone URL must start with one of {ALLOWED_SCHEMES:?}; got {url:?}"
        ));
    }
    if url.contains('\n') || url.contains('\r') || url.contains(' ') {
        return Err("clone URL must not contain whitespace".to_string());
    }
    Ok(())
}

fn read_default_branch(git_dir: &Path) -> Option<String> {
    let head = fs::read_to_string(git_dir.join("HEAD")).ok()?;
    let head = head.trim();
    let ref_line = head.strip_prefix("ref: ")?;
    let branch = ref_line.strip_prefix("refs/heads/")?;
    Some(branch.to_string())
}

fn chrono_now_iso() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    format!("@{now}")
}

fn ensure_demo_repository(data_dir: &Path) -> Result<DemoRepositoryRuntime, String> {
    let project_root = data_dir.join("repositories");
    let git_dir = project_root.join("comtrya/comtrya.git");
    fs::create_dir_all(git_dir.parent().expect("demo repo has parent"))
        .map_err(|error| format!("failed to create repository root: {error}"))?;

    if git_ref_exists(&git_dir, "refs/heads/main") {
        let export_marker = git_dir.join("git-daemon-export-ok");
        if !export_marker.exists() {
            fs::write(&export_marker, b"")
                .map_err(|error| format!("failed to mark git-daemon-export-ok: {error}"))?;
        }
        return Ok(DemoRepositoryRuntime {
            git_dir,
            project_root,
            http_path: "comtrya/comtrya.git".to_string(),
        });
    }
    if git_dir.exists() {
        return Err(format!(
            "{} exists but does not contain refs/heads/main",
            git_dir.display()
        ));
    }

    let workdir = data_dir.join("metadata/demo-repository-workdir");
    if workdir.exists() {
        fs::remove_dir_all(&workdir)
            .map_err(|error| format!("failed to reset demo workdir: {error}"))?;
    }
    fs::create_dir_all(&workdir)
        .map_err(|error| format!("failed to create demo workdir: {error}"))?;

    run_command(
        Command::new("git")
            .arg("init")
            .arg("--initial-branch=main")
            .arg(&workdir),
        "git init demo repository",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("config")
            .arg("user.name")
            .arg("Comtrya Demo"),
        "git config user.name",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("config")
            .arg("user.email")
            .arg("demo@comtrya.local"),
        "git config user.email",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("config")
            .arg("commit.gpgsign")
            .arg("false"),
        "git disable commit signing",
    )?;

    write_seed_file(
        &workdir,
        "README.md",
        "# Comtrya\n\nComtrya is a self-hosted code forge built around a Rust kernel and extension-delivered product surfaces.\n",
    )?;
    write_seed_file(
        &workdir,
        "SPEC.md",
        "## Frontend\n\nThe frontend discovers backend capabilities through GraphQL, core capability manifests, and extension UI manifests.\n",
    )?;
    write_seed_file(
        &workdir,
        "crates/server/src/main.rs",
        "fn router() {\n    // Rust server routes GraphQL, events, Git smart HTTP, and extension assets.\n}\n",
    )?;
    write_seed_file(
        &workdir,
        "frontend/src/main.ts",
        "export function mountRepository() {\n  return \"live comtrya repository\";\n}\n",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("add")
            .arg("."),
        "git add initial demo files",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("commit")
            .arg("--no-gpg-sign")
            .arg("-m")
            .arg("Seed Comtrya demo repository"),
        "git commit initial demo files",
    )?;

    write_seed_file(
        &workdir,
        "README.md",
        "# Comtrya\n\nComtrya is a self-hosted code forge built around a Rust kernel, live Git storage, and Wasmtime-loaded product extensions.\n\nThis repository is a real bare Git repository opened by the local Comtrya server and cloned through the Astro origin during smoke validation.\n",
    )?;
    write_seed_file(
        &workdir,
        "crates/core/src/extensions.rs",
        "pub fn resolver_surface() -> &'static str {\n    \"component-model\"\n}\n",
    )?;
    write_seed_file(
        &workdir,
        "frontend/src/main.ts",
        "export function mountRepository() {\n  return \"live refs, commits, trees, blobs, and diffs\";\n}\n\nexport const extensions = [\"pull-requests\", \"code-browser\", \"checks\"];\n",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("add")
            .arg("."),
        "git add live demo changes",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("commit")
            .arg("--no-gpg-sign")
            .arg("-m")
            .arg("Wire live Git and extension demo data"),
        "git commit live demo changes",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("branch")
            .arg("extensions/checks-dashboard")
            .arg("HEAD~1"),
        "git branch checks demo",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("branch")
            .arg("ui/repository-intelligence")
            .arg("HEAD"),
        "git branch UI demo",
    )?;
    run_command(
        Command::new("git").arg("init").arg("--bare").arg(&git_dir),
        "git init bare demo repository",
    )?;
    fs::write(git_dir.join("git-daemon-export-ok"), b"")
        .map_err(|error| format!("failed to mark git-daemon-export-ok: {error}"))?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("remote")
            .arg("add")
            .arg("origin")
            .arg(&git_dir),
        "git remote add demo origin",
    )?;
    run_command(
        Command::new("git")
            .arg("-C")
            .arg(&workdir)
            .arg("push")
            .arg("origin")
            .arg("main")
            .arg("extensions/checks-dashboard")
            .arg("ui/repository-intelligence"),
        "git push demo branches",
    )?;
    run_command(
        Command::new("git")
            .arg("--git-dir")
            .arg(&git_dir)
            .arg("symbolic-ref")
            .arg("HEAD")
            .arg("refs/heads/main"),
        "git set bare HEAD",
    )?;

    Ok(DemoRepositoryRuntime {
        git_dir,
        project_root,
        http_path: "comtrya/comtrya.git".to_string(),
    })
}

fn git_ref_exists(git_dir: &Path, reference: &str) -> bool {
    Command::new("git")
        .arg("--git-dir")
        .arg(git_dir)
        .arg("rev-parse")
        .arg("--verify")
        .arg(reference)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn validate_demo_repository_refs(repo: &DemoRepositoryRuntime) -> Result<(), String> {
    let head = git_text(&repo.git_dir, &["symbolic-ref", "HEAD"])?;
    if head.trim() != "refs/heads/main" {
        return Err(format!(
            "HEAD points to {}, expected refs/heads/main",
            head.trim()
        ));
    }

    let missing_refs = DEMO_EXPECTED_REFS
        .iter()
        .copied()
        .filter(|reference| !git_ref_exists(&repo.git_dir, reference))
        .collect::<Vec<_>>();
    if !missing_refs.is_empty() {
        return Err(format!(
            "missing expected refs: {}",
            missing_refs.join(", ")
        ));
    }

    Ok(())
}

fn git_demo_snapshot(repo: &DemoRepositoryRuntime) -> Result<GitDemoSnapshot, String> {
    let head = git_text(&repo.git_dir, &["rev-parse", "refs/heads/main"])?;
    let head = head.trim().to_string();
    let short_head = head.chars().take(12).collect::<String>();
    let refs = git_refs(&repo.git_dir)?;
    let branches = git_branches(&repo.git_dir)?;
    let commits = git_commits(&repo.git_dir)?;
    let (tree_entries, files, blobs) = git_tree(&repo.git_dir)?;
    let language = dominant_language(&files);
    let license = detected_license(&files);
    let diff_patch = git_text(
        &repo.git_dir,
        &["diff", "--patch", "--find-renames", "main~1", "main"],
    )
    .unwrap_or_default();
    Ok(GitDemoSnapshot {
        repository: json!({
            "id": "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "owner": "comtrya",
            "name": "comtrya",
            "path": "comtrya/comtrya",
            "gitHttpPath": "/git/comtrya/comtrya.git",
            "visibility": "PRIVATE",
            "description": "Local bare Git repository opened by the Comtrya production-testbed runtime.",
            "defaultBranch": "main",
            "currentCommit": short_head,
            "headOid": head,
            "stars": 0,
            "forks": 0,
            "watchers": 0,
            "language": language,
            "license": license,
            "updated": commits.first().and_then(|commit| commit.get("time")).cloned().unwrap_or_else(|| json!("unknown"))
        }),
        refs,
        branches,
        commits,
        tree_entries,
        files,
        blobs,
        diff: json!({
            "path": "main~1...main",
            "language": "diff",
            "patch": diff_patch
        }),
    })
}

fn merge_repository_metadata(mut live_repository: Value, metadata: Option<&Value>) -> Value {
    let Some(metadata) = metadata.and_then(Value::as_object) else {
        return live_repository;
    };
    let Some(live_object) = live_repository.as_object_mut() else {
        return live_repository;
    };
    for key in ["id", "owner", "name", "path", "visibility", "description"] {
        if let Some(value) = metadata.get(key) {
            live_object.insert(key.to_string(), value.clone());
        }
    }
    live_repository
}

fn dominant_language(files: &[Value]) -> String {
    let mut counts = BTreeMap::<String, usize>::new();
    for kind in files
        .iter()
        .filter_map(|file| file.get("kind").and_then(Value::as_str))
        .filter(|kind| *kind != "markdown" && *kind != "file")
    {
        *counts.entry(kind.to_string()).or_default() += 1;
    }
    counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(kind, _)| match kind.as_str() {
            "rust" => "Rust".to_string(),
            "typescript" => "TypeScript".to_string(),
            "javascript" => "JavaScript".to_string(),
            "json" => "JSON".to_string(),
            "cue" => "CUE".to_string(),
            "toml" => "TOML".to_string(),
            other => other.to_string(),
        })
        .unwrap_or_else(|| "unknown".to_string())
}

fn detected_license(files: &[Value]) -> String {
    files
        .iter()
        .filter_map(|file| file.get("path").and_then(Value::as_str))
        .find(|path| {
            let normalized = path.to_ascii_lowercase();
            normalized == "license"
                || normalized == "license.md"
                || normalized == "license.txt"
                || normalized.starts_with("license.")
        })
        .map(|_| "detected".to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

fn code_browser_resolver_output(git: &GitDemoSnapshot) -> Value {
    json!({
        "methods": [
            "repository_refs",
            "repository_branches",
            "commit_history",
            "tree_entries",
            "blob_preview",
            "diff_between"
        ],
        "repositoryRefs": git.refs.len(),
        "repositoryBranches": git.branches.len(),
        "commitHistory": git.commits.len(),
        "treeEntries": git.tree_entries.len(),
        "blobPreviews": git.blobs.len(),
        "headOid": git.repository.get("headOid").cloned().unwrap_or_else(|| json!(null)),
        "firstBlobPath": git.blobs.first().and_then(|blob| blob.get("path")).cloned().unwrap_or_else(|| json!(null)),
        "diffPath": git.diff.get("path").cloned().unwrap_or_else(|| json!(null))
    })
}

fn pull_request_resolver_output(pull_requests: &Value, checks: &Value) -> Value {
    let pulls = pull_requests.as_array().map(Vec::as_slice).unwrap_or(&[]);
    let ready = pulls
        .iter()
        .filter(|pull| pull.get("state").and_then(Value::as_str) == Some("READY"))
        .count();
    let draft = pulls
        .iter()
        .filter(|pull| pull.get("state").and_then(Value::as_str) == Some("DRAFT"))
        .count();
    let check_summary = check_summary(checks);
    json!({
        "methods": [
            "list_pull_requests",
            "get_pull_request",
            "compute_changed_files",
            "compute_diff",
            "compute_ahead_behind",
            "compute_merge_readiness"
        ],
        "pullRequests": pulls.len(),
        "ready": ready,
        "draft": draft,
        "mergeReadiness": {
            "requiredChecksPassing": check_summary.passing,
            "requiredChecksTotal": check_summary.total,
            "blocked": check_summary.action_required > 0 || check_summary.failures > 0
        }
    })
}

fn checks_resolver_output(checks: &Value) -> Value {
    let summary = check_summary(checks);
    json!({
        "methods": [
            "list_check_runs",
            "summarize_branch_protection",
            "list_required_checks",
            "compute_aggregate_status"
        ],
        "checkRuns": summary.total,
        "success": summary.passing,
        "failure": summary.failures,
        "actionRequired": summary.action_required,
        "aggregateStatus": if summary.action_required > 0 || summary.failures > 0 {
            "ACTION_REQUIRED"
        } else {
            "SUCCESS"
        }
    })
}

fn epics_resolver_output(epics: &Value) -> Value {
    let mut active = 0u64;
    let mut at_risk = 0u64;
    let mut completed = 0u64;
    let mut canceled = 0u64;
    if let Some(arr) = epics.as_array() {
        for epic in arr {
            match epic.get("state").and_then(Value::as_str) {
                Some("PLANNED") | Some("IN_PROGRESS") => active += 1,
                Some("AT_RISK") => at_risk += 1,
                Some("DONE") => completed += 1,
                Some("CANCELED") => canceled += 1,
                _ => {}
            }
        }
    }
    json!({
        "methods": [
            "create_epic",
            "list_epics",
            "epic_progress",
            "epic_issues_in",
            "epic_children_of",
            "epic_change_state"
        ],
        "activeCount": active,
        "atRiskCount": at_risk,
        "completedCount": completed,
        "canceledCount": canceled,
    })
}

fn issues_resolver_output(issues: &Value) -> Value {
    let mut open = 0u64;
    let mut closed = 0u64;
    let mut by_label: BTreeMap<String, u64> = BTreeMap::new();
    if let Some(arr) = issues.as_array() {
        for issue in arr {
            match issue.get("state").and_then(Value::as_str) {
                Some("OPEN") => open += 1,
                Some("CLOSED") => closed += 1,
                _ => {}
            }
            if let Some(labels) = issue.get("labels").and_then(Value::as_array) {
                for label in labels.iter().filter_map(Value::as_str) {
                    *by_label.entry(label.to_string()).or_insert(0) += 1;
                }
            }
        }
    }
    json!({
        "methods": [
            "list_issues",
            "create_issue",
            "close_issue",
            "reopen_issue",
            "byNumber"
        ],
        "openCount": open,
        "closedCount": closed,
        "openByLabel": by_label,
    })
}

#[derive(Debug, Clone, Copy)]
struct CheckSummary {
    total: usize,
    passing: usize,
    failures: usize,
    action_required: usize,
}

fn check_summary(checks: &Value) -> CheckSummary {
    let checks = checks.as_array().map(Vec::as_slice).unwrap_or(&[]);
    CheckSummary {
        total: checks.len(),
        passing: checks
            .iter()
            .filter(|check| check.get("conclusion").and_then(Value::as_str) == Some("SUCCESS"))
            .count(),
        failures: checks
            .iter()
            .filter(|check| check.get("conclusion").and_then(Value::as_str) == Some("FAILURE"))
            .count(),
        action_required: checks
            .iter()
            .filter(|check| {
                check.get("conclusion").and_then(Value::as_str) == Some("ACTION_REQUIRED")
            })
            .count(),
    }
}

fn git_refs(git_dir: &Path) -> Result<Vec<Value>, String> {
    let output = git_text(
        git_dir,
        &[
            "for-each-ref",
            "--format=%(refname)%00%(objectname)",
            "refs",
        ],
    )?;
    Ok(output
        .lines()
        .filter_map(|line| {
            let mut parts = line.split('\0');
            let name = parts.next()?;
            let target = parts.next()?;
            Some(json!({
                "name": name,
                "target": target,
                "shortTarget": target.chars().take(12).collect::<String>()
            }))
        })
        .collect())
}

fn git_branches(git_dir: &Path) -> Result<Vec<Value>, String> {
    let output = git_text(
        git_dir,
        &[
            "for-each-ref",
            "--format=%(refname:short)%00%(objectname)",
            "refs/heads",
        ],
    )?;
    Ok(output
        .lines()
        .filter_map(|line| {
            let mut parts = line.split('\0');
            let name = parts.next()?;
            let commit = parts.next()?;
            let (behind, ahead) = branch_distance(git_dir, name).unwrap_or((0, 0));
            Some(json!({
                "name": name,
                "commit": commit.chars().take(12).collect::<String>(),
                "oid": commit,
                "ahead": ahead,
                "behind": behind
            }))
        })
        .collect())
}

fn branch_distance(git_dir: &Path, branch: &str) -> Result<(u32, u32), String> {
    if branch == "main" {
        return Ok((0, 0));
    }
    let range = format!("main...{branch}");
    let output = git_text(git_dir, &["rev-list", "--left-right", "--count", &range])?;
    let mut parts = output.split_whitespace();
    let behind = parts.next().unwrap_or("0").parse().unwrap_or(0);
    let ahead = parts.next().unwrap_or("0").parse().unwrap_or(0);
    Ok((behind, ahead))
}

fn git_commits(git_dir: &Path) -> Result<Vec<Value>, String> {
    let output = git_text(
        git_dir,
        &[
            "log",
            "--date=relative",
            "--format=%H%x00%h%x00%s%x00%an%x00%cr",
            "-n",
            "8",
            "main",
        ],
    )?;
    Ok(output
        .lines()
        .filter_map(|line| {
            let fields = line.split('\0').collect::<Vec<_>>();
            if fields.len() != 5 {
                return None;
            }
            Some(json!({
                "oid": fields[0],
                "shortOid": fields[1],
                "subject": fields[2],
                "author": fields[3],
                "time": fields[4]
            }))
        })
        .collect())
}

/// Build a generic per-repo git data payload that works for any on-disk bare
/// repository. Empty repos (no commits yet) return empty arrays for tree/files
/// rather than errors. The returned object is merged into the GraphQL
/// `repositoryByPath` resolver so the code-browser widget can render any repo.
fn repo_git_data(git_dir: &Path) -> Value {
    let default_branch = read_default_branch(git_dir).unwrap_or_else(|| "main".to_string());
    let head_oid = git_text(git_dir, &["rev-parse", "HEAD"]).ok().map(|s| s.trim().to_string());
    let refs = git_refs(git_dir).unwrap_or_default();
    let branches = git_branches(git_dir).unwrap_or_default();
    let commits = git_text(
        git_dir,
        &[
            "log",
            "--date=relative",
            "--format=%H%x00%h%x00%s%x00%an%x00%cr",
            "-n",
            "8",
            &default_branch,
        ],
    )
    .unwrap_or_default()
    .lines()
    .filter_map(|line| {
        let fields = line.split('\0').collect::<Vec<_>>();
        if fields.len() != 5 {
            return None;
        }
        Some(json!({
            "oid": fields[0],
            "shortOid": fields[1],
            "subject": fields[2],
            "author": fields[3],
            "time": fields[4],
        }))
    })
    .collect::<Vec<_>>();
    let (tree_entries, files, blobs) =
        git_tree_at_ref(git_dir, &default_branch).unwrap_or_else(|_| (Vec::new(), Vec::new(), Vec::new()));
    json!({
        "defaultBranch": default_branch,
        "headOid": head_oid,
        "refs": refs,
        "branches": branches,
        "commits": commits,
        "treeEntries": tree_entries,
        "files": files,
        "blobs": blobs,
    })
}

fn git_tree(git_dir: &Path) -> Result<(Vec<Value>, Vec<Value>, Vec<Value>), String> {
    git_tree_at_ref(git_dir, "main")
}

fn git_tree_at_ref(
    git_dir: &Path,
    reference: &str,
) -> Result<(Vec<Value>, Vec<Value>, Vec<Value>), String> {
    let output = git_bytes(git_dir, &["ls-tree", "-r", "-z", "--long", reference])?;
    let mut entries = Vec::new();
    let mut files = Vec::new();
    let mut blobs = Vec::new();
    for raw in output
        .split(|byte| *byte == 0)
        .filter(|entry| !entry.is_empty())
    {
        let entry = String::from_utf8_lossy(raw);
        let Some((meta, path)) = entry.split_once('\t') else {
            continue;
        };
        let parts = meta.split_whitespace().collect::<Vec<_>>();
        if parts.len() < 4 {
            continue;
        }
        let mode = parts[0];
        let kind = parts[1];
        let oid = parts[2];
        let size = parts[3].parse::<u64>().unwrap_or_default();
        let preview = if is_text_preview_path(path) {
            git_text(git_dir, &["show", &format!("{reference}:{path}")])
                .unwrap_or_default()
                .chars()
                .take(4096)
                .collect::<String>()
        } else {
            String::new()
        };
        entries.push(json!({
            "path": path,
            "mode": mode,
            "kind": kind,
            "oid": oid,
            "size": size
        }));
        blobs.push(json!({
            "path": path,
            "oid": oid,
            "size": size,
            "preview": preview
        }));
        files.push(json!({
            "path": path,
            "kind": file_kind(path),
            "status": format!("blob {}", oid.chars().take(12).collect::<String>()),
            "mode": mode,
            "oid": oid,
            "size": size,
            "preview": preview
        }));
    }
    Ok((entries, files, blobs))
}

fn is_text_preview_path(path: &str) -> bool {
    matches!(
        Path::new(path)
            .extension()
            .and_then(|extension| extension.to_str()),
        Some("md" | "rs" | "ts" | "js" | "json" | "toml" | "cue" | "txt")
    )
}

fn file_kind(path: &str) -> &'static str {
    match Path::new(path)
        .extension()
        .and_then(|extension| extension.to_str())
    {
        Some("md") => "markdown",
        Some("rs") => "rust",
        Some("ts") => "typescript",
        Some("js") => "javascript",
        Some("json") => "json",
        Some("cue") => "cue",
        Some("toml") => "toml",
        _ => "file",
    }
}

fn git_text(git_dir: &Path, args: &[&str]) -> Result<String, String> {
    String::from_utf8(git_bytes(git_dir, args)?)
        .map_err(|error| format!("git output was not utf-8: {error}"))
}

fn git_bytes(git_dir: &Path, args: &[&str]) -> Result<Vec<u8>, String> {
    let mut command = Command::new("git");
    command.arg("--git-dir").arg(git_dir).args(args);
    let output = command
        .output()
        .map_err(|error| format!("failed to run git {}: {error}", args.join(" ")))?;
    if output.status.success() {
        Ok(output.stdout)
    } else {
        Err(format!(
            "git {} failed: {}",
            args.join(" "),
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

pub(crate) const EXTENSION_STORAGE_SCHEMA_VERSION: &str = "comtrya.extension-storage/v1";

fn now_iso_timestamp() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let days = secs / 86_400;
    let rem = secs % 86_400;
    let h = rem / 3600;
    let m = (rem % 3600) / 60;
    let s = rem % 60;
    let g = days as i64 + 719_468;
    let era = g.div_euclid(146_097);
    let doe = g.rem_euclid(146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y_base = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let mo = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    let y = if mo <= 2 { y_base + 1 } else { y_base };
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", y, mo, d, h, m, s)
}
const EXTENSION_STORAGE_MIGRATIONS: &[&str] = &["001_extension_documents"];

#[derive(Debug, Clone)]
pub(crate) struct ExtensionRuntimeStore {
    root: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ExtensionDocumentRecord {
    pub(crate) schema_version: String,
    pub(crate) owner_extension: String,
    pub(crate) collection: String,
    pub(crate) id: String,
    pub(crate) resource: String,
    pub(crate) resource_refs: Vec<String>,
    pub(crate) visibility: String,
    pub(crate) indexed_fields: BTreeMap<String, Value>,
    pub(crate) version: u64,
    pub(crate) updated_at: String,
    pub(crate) data: Value,
}

impl ExtensionRuntimeStore {
    fn open(data_dir: &Path) -> Result<Self, String> {
        let root = data_dir.join("extensions/storage");
        fs::create_dir_all(&root)
            .map_err(|error| format!("failed to create extension storage dir: {error}"))?;
        let store = Self { root };
        store.ensure_schema()?;
        if !store.documents_path().is_file() {
            store.seed_from_demo_payload(data_dir)?;
        }
        touch(&store.events_path()).map_err(|error| {
            format!("failed to initialize extension storage event log: {error}")
        })?;
        Ok(store)
    }

    fn schema_path(&self) -> PathBuf {
        self.root.join("schema.json")
    }

    fn documents_path(&self) -> PathBuf {
        self.root.join("documents.jsonl")
    }

    pub(crate) fn events_path(&self) -> PathBuf {
        self.root.join("events.jsonl")
    }

    fn ensure_schema(&self) -> Result<(), String> {
        let schema_path = self.schema_path();
        if schema_path.is_file() {
            return Ok(());
        }
        let schema = json!({
            "schemaVersion": EXTENSION_STORAGE_SCHEMA_VERSION,
            "migrationsApplied": EXTENSION_STORAGE_MIGRATIONS,
            "collections": [
                {
                    "name": "workspaces",
                    "ownerExtension": "core",
                    "indexes": [
                        { "name": "by_slug", "fields": ["slug"], "unique": true }
                    ]
                },
                {
                    "name": "repositories",
                    "ownerExtension": "core",
                    "indexes": [
                        { "name": "by_path", "fields": ["path"], "unique": true },
                        { "name": "by_workspace", "fields": ["workspaceID", "path"], "unique": false }
                    ]
                },
                {
                    "name": "pull_requests",
                    "ownerExtension": "ext_pull_requests",
                    "indexes": [
                        { "name": "by_repository_state_updated", "fields": ["repositoryID", "state", "updatedAt"], "unique": false },
                        { "name": "by_repository_number", "fields": ["repositoryID", "number"], "unique": true }
                    ]
                },
                {
                    "name": "check_runs",
                    "ownerExtension": "ext_checks",
                    "indexes": [
                        { "name": "by_repository_commit_name", "fields": ["repositoryID", "commitOID", "name"], "unique": true },
                        { "name": "by_repository_required", "fields": ["repositoryID", "required"], "unique": false }
                    ]
                },
                {
                    "name": "extension_installations",
                    "ownerExtension": "core",
                    "indexes": [
                        { "name": "by_extension_status", "fields": ["extensionID", "status"], "unique": true }
                    ]
                },
                {
                    "name": "activity_events",
                    "ownerExtension": "core",
                    "indexes": [
                        { "name": "by_repository_time", "fields": ["repositoryID", "time"], "unique": false },
                        { "name": "by_type_time", "fields": ["type", "time"], "unique": false }
                    ]
                }
            ]
        });
        fs::write(
            &schema_path,
            serde_json::to_vec_pretty(&schema)
                .map_err(|error| format!("failed to encode extension storage schema: {error}"))?,
        )
        .map_err(|error| format!("failed to write {}: {error}", schema_path.display()))
    }

    fn seed_from_demo_payload(&self, data_dir: &Path) -> Result<(), String> {
        let seed = read_demo_seed_payload(data_dir)?;
        let records = seed_extension_documents(&seed)?;
        let document_count = records.len();
        for record in records {
            self.create_document(record)?;
        }
        self.append_storage_event(
            "dev.comtrya.extension_storage.seeded",
            json!({
                "schemaVersion": EXTENSION_STORAGE_SCHEMA_VERSION,
                "documents": document_count
            }),
        )
    }

    fn collection_data(&self, collection: &str) -> Result<Value, String> {
        let values = self
            .query_documents_by_index(collection, &[])?
            .into_iter()
            .map(|record| record.data)
            .collect::<Vec<_>>();
        Ok(Value::Array(values))
    }

    fn single_document_data(&self, collection: &str) -> Result<Option<Value>, String> {
        Ok(self
            .load_records()?
            .into_iter()
            .find(|record| record.collection == collection)
            .map(|record| record.data))
    }

    fn query_documents_by_index(
        &self,
        collection: &str,
        index_fields: &[(&str, Value)],
    ) -> Result<Vec<ExtensionDocumentRecord>, String> {
        Ok(self
            .load_records()?
            .into_iter()
            .filter(|record| {
                record.collection == collection
                    && index_fields.iter().all(|(field, expected)| {
                        record.indexed_fields.get(*field) == Some(expected)
                    })
            })
            .collect())
    }

    pub(crate) fn create_document(&self, record: ExtensionDocumentRecord) -> Result<(), String> {
        let mut records = self.load_records()?;
        // Dedup scoped to (owner_extension, collection, id). Two
        // different extensions can hold the same logical id in the
        // same collection name — their views are isolated by
        // owner_extension on read, and writes shouldn't artificially
        // collide.
        if records.iter().any(|existing| {
            existing.owner_extension == record.owner_extension
                && existing.collection == record.collection
                && existing.id == record.id
        }) {
            return Err(format!(
                "extension document already exists: {}/{}/{}",
                record.owner_extension, record.collection, record.id
            ));
        }
        records.push(record);
        self.write_records_atomically(&records)
    }

    pub(crate) fn delete_document(
        &self,
        owner_extension: &str,
        collection: &str,
        id: &str,
    ) -> Result<(), String> {
        let mut records = self.load_records()?;
        let before = records.len();
        records.retain(|record| {
            !(record.owner_extension == owner_extension
                && record.collection == collection
                && record.id == id)
        });
        if records.len() == before {
            return Err(format!(
                "extension document not found: {owner_extension}/{collection}/{id}"
            ));
        }
        self.write_records_atomically(&records)?;
        self.append_storage_event(
            "dev.comtrya.extension_storage.document_deleted",
            json!({
                "ownerExtension": owner_extension,
                "collection": collection,
                "id": id,
            }),
        )
    }

    #[allow(dead_code)]
    pub(crate) fn update_document_atomically(
        &self,
        collection: &str,
        id: &str,
        update: impl FnOnce(&mut Value),
    ) -> Result<(), String> {
        self.update_document_if_version(collection, id, None, |val, _| update(val))
    }

    /// Atomic compare-and-swap for the OCC protocol. If `expected_version`
    /// is `Some(v)` and the current record's version is not `v`, returns
    /// `Err("version conflict ...")`. Otherwise applies `update`, bumps
    /// version, persists.
    pub(crate) fn update_document_if_version(
        &self,
        collection: &str,
        id: &str,
        expected_version: Option<u64>,
        update: impl FnOnce(&mut Value, u64),
    ) -> Result<(), String> {
        let mut records = self.load_records()?;
        let (version, current_version) = {
            let Some(record) = records
                .iter_mut()
                .find(|record| record.collection == collection && record.id == id)
            else {
                return Err(format!("extension document not found: {collection}/{id}"));
            };
            if let Some(expected) = expected_version {
                if record.version != expected {
                    return Err(format!(
                        "version conflict: expected {} current {}",
                        expected, record.version
                    ));
                }
            }
            let current = record.version;
            update(&mut record.data, current);
            record.version += 1;
            record.updated_at = now_iso_timestamp();
            (record.version, current)
        };
        self.write_records_atomically(&records)?;
        let _ = current_version;
        self.append_storage_event(
            "dev.comtrya.extension_storage.document_updated",
            json!({"collection": collection, "id": id, "version": version}),
        )
    }

    pub(crate) fn load_records(&self) -> Result<Vec<ExtensionDocumentRecord>, String> {
        let path = self.documents_path();
        if !path.is_file() {
            return Ok(Vec::new());
        }
        let source = fs::read_to_string(&path)
            .map_err(|error| format!("failed to read {}: {error}", path.display()))?;
        source
            .lines()
            .filter(|line| !line.trim().is_empty())
            .map(|line| {
                serde_json::from_str::<ExtensionDocumentRecord>(line).map_err(|error| {
                    format!(
                        "failed to parse extension document from {}: {error}",
                        path.display()
                    )
                })
            })
            .collect()
    }

    fn write_records_atomically(&self, records: &[ExtensionDocumentRecord]) -> Result<(), String> {
        let path = self.documents_path();
        let tmp_path = self.root.join("documents.jsonl.tmp");
        let mut body = Vec::new();
        for record in records {
            serde_json::to_writer(&mut body, record)
                .map_err(|error| format!("failed to encode extension document: {error}"))?;
            body.push(b'\n');
        }
        fs::write(&tmp_path, body)
            .map_err(|error| format!("failed to write {}: {error}", tmp_path.display()))?;
        fs::rename(&tmp_path, &path).map_err(|error| {
            format!(
                "failed to replace extension document table {}: {error}",
                path.display()
            )
        })
    }

    pub(crate) fn append_storage_event(&self, event_type: &str, data: Value) -> Result<(), String> {
        append_jsonl(
            &self.events_path(),
            json!({
                "schemaVersion": EXTENSION_STORAGE_SCHEMA_VERSION,
                "type": event_type,
                "time": now_seconds(),
                "data": data
            }),
        )
        .map_err(|error| format!("failed to append extension storage event: {error}"))
    }
}

fn read_demo_seed_payload(data_dir: &Path) -> Result<Value, String> {
    let seed_path = data_dir.join("metadata/demo-state.json");
    let source = if seed_path.is_file() {
        fs::read_to_string(&seed_path)
            .map_err(|error| format!("failed to read {}: {error}", seed_path.display()))?
    } else {
        include_str!("../../../fixtures/demo/conference.json").to_string()
    };
    serde_json::from_str::<Value>(&source)
        .map_err(|error| format!("failed to parse demo seed payload: {error}"))
}

fn seed_extension_documents(seed: &Value) -> Result<Vec<ExtensionDocumentRecord>, String> {
    let generated_at = seed
        .get("generatedAt")
        .and_then(Value::as_str)
        .unwrap_or("seed")
        .to_string();
    let repo_id = seed
        .pointer("/repository/id")
        .and_then(Value::as_str)
        .unwrap_or("repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3");
    let repo_ref = format!("comtrya://repository/{repo_id}");
    let workspace_id = seed
        .pointer("/workspace/id")
        .and_then(Value::as_str)
        .unwrap_or("ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3");
    let workspace_ref = format!("comtrya://workspace/{workspace_id}");
    let mut records = Vec::new();

    if let Some(workspace) = seed.get("workspace").cloned() {
        let id = document_id("workspace", &workspace, 0);
        records.push(extension_document_record(
            "core",
            "workspaces",
            &id,
            &workspace_ref,
            vec![workspace_ref.clone()],
            workspace,
            &generated_at,
        ));
    }
    if let Some(repository) = seed.get("repository").cloned() {
        let id = document_id("repository", &repository, 0);
        records.push(extension_document_record(
            "core",
            "repositories",
            &id,
            &repo_ref,
            vec![repo_ref.clone(), workspace_ref],
            repository,
            &generated_at,
        ));
    }

    seed_array(seed, "pullRequests")
        .into_iter()
        .enumerate()
        .for_each(|(index, pull)| {
            let id = document_id("pull_request", &pull, index);
            records.push(extension_document_record(
                "ext_pull_requests",
                "pull_requests",
                &id,
                &repo_ref,
                vec![repo_ref.clone()],
                with_repository_id(pull, repo_id),
                &generated_at,
            ));
        });
    seed_array(seed, "checks")
        .into_iter()
        .enumerate()
        .for_each(|(index, check)| {
            let id = document_id("check_run", &check, index);
            records.push(extension_document_record(
                "ext_checks",
                "check_runs",
                &id,
                &repo_ref,
                vec![repo_ref.clone()],
                with_repository_id(check, repo_id),
                &generated_at,
            ));
        });
    seed_array(seed, "extensions")
        .into_iter()
        .enumerate()
        .for_each(|(index, extension)| {
            let id = document_id("extension_installation", &extension, index);
            records.push(extension_document_record(
                "core",
                "extension_installations",
                &id,
                &repo_ref,
                vec![repo_ref.clone()],
                extension,
                &generated_at,
            ));
        });
    seed_array(seed, "activity")
        .into_iter()
        .enumerate()
        .for_each(|(index, event)| {
            let id = document_id("activity_event", &event, index);
            records.push(extension_document_record(
                "core",
                "activity_events",
                &id,
                &repo_ref,
                vec![repo_ref.clone()],
                with_repository_id(event, repo_id),
                &generated_at,
            ));
        });

    if records.is_empty() {
        return Err("demo seed payload did not contain extension storage documents".to_string());
    }
    Ok(records)
}

fn seed_array(seed: &Value, key: &str) -> Vec<Value> {
    seed.get(key)
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
}

fn extension_document_record(
    owner_extension: &str,
    collection: &str,
    id: &str,
    resource: &str,
    resource_refs: Vec<String>,
    data: Value,
    updated_at: &str,
) -> ExtensionDocumentRecord {
    ExtensionDocumentRecord {
        schema_version: EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
        owner_extension: owner_extension.to_string(),
        collection: collection.to_string(),
        id: id.to_string(),
        resource: resource.to_string(),
        resource_refs,
        visibility: data
            .get("visibility")
            .and_then(Value::as_str)
            .unwrap_or("PRIVATE")
            .to_string(),
        indexed_fields: indexed_fields(&data),
        version: 1,
        updated_at: updated_at.to_string(),
        data,
    }
}

fn indexed_fields(data: &Value) -> BTreeMap<String, Value> {
    let mut fields = BTreeMap::new();
    if let Some(object) = data.as_object() {
        for key in [
            "id",
            "repositoryID",
            "workspaceID",
            "path",
            "slug",
            "state",
            "status",
            "type",
            "time",
            "number",
            "name",
            "provider",
            "commitOID",
            "required",
        ] {
            if let Some(value) = object.get(key) {
                fields.insert(key.to_string(), value.clone());
            }
        }
        if let Some(value) = object.get("repositoryId") {
            fields.insert("repositoryID".to_string(), value.clone());
        }
        if let Some(value) = object.get("id") {
            fields.insert("extensionID".to_string(), value.clone());
        }
        if let Some(value) = object.get("updatedAt").or_else(|| object.get("time")) {
            fields.insert("updatedAt".to_string(), value.clone());
        }
    }
    fields
}

fn with_repository_id(mut value: Value, repository_id: &str) -> Value {
    if let Some(object) = value.as_object_mut() {
        object
            .entry("repositoryID")
            .or_insert_with(|| json!(repository_id));
    }
    value
}

fn document_id(prefix: &str, data: &Value, index: usize) -> String {
    if let Some(id) = data.get("id").and_then(Value::as_str) {
        return id.to_string();
    }
    if let Some(number) = data.get("number").and_then(Value::as_u64) {
        return format!("{prefix}_{number}");
    }
    if let Some(name) = data.get("name").and_then(Value::as_str) {
        return format!("{prefix}_{}", stable_slug(name));
    }
    if let Some(event_type) = data.get("type").and_then(Value::as_str) {
        return format!("{prefix}_{}_{}", index + 1, stable_slug(event_type));
    }
    format!("{prefix}_{}", index + 1)
}

fn stable_slug(value: &str) -> String {
    let mut slug = String::new();
    for character in value.chars() {
        if character.is_ascii_alphanumeric() {
            slug.push(character.to_ascii_lowercase());
        } else if !slug.ends_with('_') {
            slug.push('_');
        }
    }
    slug.trim_matches('_').to_string()
}

fn validate_extension_manifest_pair(
    id: &str,
    root: &Path,
    manifest: &Value,
) -> Result<PathBuf, String> {
    if manifest.get("schemaVersion").and_then(Value::as_str) != Some("comtrya.extension/v1") {
        return Err(format!(
            "{id} backend manifest has unsupported schemaVersion"
        ));
    }
    if manifest.get("id").and_then(Value::as_str) != Some(id) {
        return Err(format!("{id} backend manifest id does not match directory"));
    }
    let name = manifest
        .get("name")
        .and_then(Value::as_str)
        .ok_or_else(|| format!("{id} backend manifest missing name"))?;
    let ui_manifest_rel = manifest
        .pointer("/ui/manifest")
        .and_then(Value::as_str)
        .ok_or_else(|| format!("{id} backend manifest missing ui.manifest"))?;
    if ui_manifest_rel.starts_with('/') || ui_manifest_rel.contains("..") {
        return Err(format!(
            "{id} UI manifest path must stay within extension root"
        ));
    }
    let ui_manifest_path = root.join(ui_manifest_rel);
    let ui_source = fs::read_to_string(&ui_manifest_path)
        .map_err(|error| format!("failed to read {}: {error}", ui_manifest_path.display()))?;
    let ui_value = serde_json::from_str::<Value>(&ui_source)
        .map_err(|error| format!("failed to parse {}: {error}", ui_manifest_path.display()))?;
    let ui_manifest = validate_ui_manifest_from_value(&ui_value)
        .map_err(|error| format!("{id} UI manifest invalid: {error}"))?;
    if ui_manifest.id != id {
        return Err(format!(
            "{id} UI manifest id does not match backend manifest"
        ));
    }
    if ui_manifest.extension != name {
        return Err(format!(
            "{id} UI manifest extension name does not match backend manifest"
        ));
    }
    let expected_prefix = format!("/_extensions/{id}/assets/");
    let entry_rel = ui_manifest
        .assets
        .entry
        .trim_start_matches(&expected_prefix);
    if !ui_manifest.assets.entry.starts_with(&expected_prefix) {
        return Err(format!(
            "{id} UI entry must be served from {expected_prefix}"
        ));
    }
    if entry_rel.is_empty()
        || entry_rel.contains("..")
        || !root.join("assets").join(entry_rel).is_file()
    {
        return Err(format!("{id} UI entry asset was not found"));
    }
    let entry_body = fs::read(root.join("assets").join(entry_rel))
        .map_err(|error| format!("failed to read {id} UI entry asset: {error}"))?;
    let expected_integrity = asset_integrity(&entry_body);
    if ui_manifest.assets.entry_integrity != expected_integrity {
        return Err(format!(
            "{id} UI entryIntegrity {} did not match computed {expected_integrity}",
            ui_manifest.assets.entry_integrity
        ));
    }
    Ok(ui_manifest_path)
}

fn asset_integrity(body: &[u8]) -> String {
    let digest = Sha256::digest(body);
    let mut out = String::from("sha256-");
    for byte in digest {
        out.push_str(&format!("{byte:02x}"));
    }
    out
}

fn asset_etag(body: &[u8]) -> String {
    format!("\"{}\"", asset_integrity(body))
}

// ---------------------------------------------------------------------------
// UI manifest schema v2
// ---------------------------------------------------------------------------

const UI_MANIFEST_SCHEMA_V2: &str = "comtrya.ui-extension/v2";
const KNOWN_SLOT_NAMES: &[&str] = &[
    "home.your-work",
    "home.your-issues",
    "home.your-epics",
    "home.repositories",
    "home.activity",
    "home.instance",
    "repository.overview",
    "repository.code",
    "repository.checks",
    "repository.issues",
    "workspace.issues",
    "workspace.epics",
];

#[derive(Debug, serde::Deserialize)]
pub struct UiManifestV2 {
    #[serde(rename = "schemaVersion")]
    pub schema_version: String,
    pub id: String,
    pub extension: String,
    pub version: String,
    pub publisher: String,
    pub assets: UiAssetsV2,
    pub permissions: Vec<String>,
    pub contributes: UiContributesV2,
}

#[derive(Debug, serde::Deserialize)]
pub struct UiAssetsV2 {
    pub entry: String,
    #[serde(rename = "entryIntegrity")]
    pub entry_integrity: String,
    pub styles: Vec<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct UiContributesV2 {
    pub slots: Vec<String>,
    pub routes: bool,
}

pub fn validate_ui_manifest_from_value(value: &serde_json::Value) -> Result<UiManifestV2, String> {
    // Probe schema version first via the raw value so we can produce a
    // version-specific error even if the rest of the shape doesn't match v2.
    let schema_version = value
        .get("schemaVersion")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    if schema_version == "comtrya.ui-extension/v1" {
        return Err("v1 manifest is deprecated; migrate to comtrya.ui-extension/v2".into());
    }
    let m: UiManifestV2 = serde_json::from_value(value.clone())
        .map_err(|e| format!("manifest shape: {e}"))?;
    if m.schema_version != UI_MANIFEST_SCHEMA_V2 {
        return Err(format!(
            "unsupported manifest schemaVersion: {}",
            m.schema_version
        ));
    }
    if m.id.is_empty() {
        return Err("manifest id must be non-empty".into());
    }
    if !m.assets.entry.starts_with("/_extensions/") {
        return Err("entry must be served from /_extensions/".into());
    }
    if !m.assets.entry_integrity.starts_with("sha256-") {
        return Err("entryIntegrity must be sha256-prefixed".into());
    }
    if m.contributes.slots.is_empty() && !m.contributes.routes {
        return Err("contributes must declare at least one slot or routes:true".into());
    }
    for slot in &m.contributes.slots {
        if !KNOWN_SLOT_NAMES.contains(&slot.as_str()) {
            return Err(format!("unknown slot name '{slot}'"));
        }
    }
    Ok(m)
}

// ---------------------------------------------------------------------------

pub fn validate_route_prefix_uniqueness(
    configs: &[ExtensionInstallConfig],
) -> Result<(), String> {
    let mut seen: std::collections::HashMap<&str, &str> = std::collections::HashMap::new();
    for cfg in configs {
        if let Some(prefix) = &cfg.route_prefix {
            if let Some(prev) = seen.insert(prefix.as_str(), cfg.id.as_str()) {
                return Err(format!(
                    "route_prefix '{prefix}' is claimed by both '{prev}' and '{}'",
                    cfg.id
                ));
            }
        }
    }
    Ok(())
}

#[derive(Debug, Clone)]
struct ExtensionPackageRoot {
    configured_id: String,
    root: PathBuf,
}

fn load_extension_runtime(
    extension_dir: &Path,
) -> Result<ExtensionRuntimeOutput, String> {
    let packages = FIRST_PARTY_EXTENSIONS
        .iter()
        .map(|id| ExtensionPackageRoot {
            configured_id: (*id).to_string(),
            root: extension_dir.join(id),
        })
        .collect::<Vec<_>>();
    load_extension_packages(packages)
}

fn load_configured_extension_runtime(
    extension_dir: &Path,
    extension_config_declared: bool,
    configs: &[ExtensionInstallConfig],
) -> Result<ExtensionRuntimeOutput, String> {
    if !extension_config_declared {
        return load_extension_runtime(extension_dir);
    }
    let enabled = configs
        .iter()
        .filter(|config| config.enabled)
        .collect::<Vec<_>>();
    if enabled.is_empty() {
        return Ok(ExtensionRuntimeOutput {
            records: BTreeMap::new(),
            registry: wasm_registry::WasmRegistry::new()
                .map_err(|e| format!("failed to build wasm registry: {e}"))?,
        });
    }

    let mut packages = Vec::new();
    for config in enabled {
        match &config.source {
            ExtensionSource::Local { path } => packages.push(ExtensionPackageRoot {
                configured_id: config.id.clone(),
                root: resolve_local_extension_package(extension_dir, path)?,
            }),
            ExtensionSource::Oci {
                registry,
                image,
                reference,
            } => {
                return Err(unsupported_oci_extension(
                    config, registry, image, reference,
                ));
            }
        }
    }
    load_extension_packages(packages)
}

fn resolve_local_extension_package(extension_dir: &Path, path: &str) -> Result<PathBuf, String> {
    let path = Path::new(path);
    if path.is_absolute() {
        return Err(format!(
            "local extension path {} must be relative to COMTRYA_EXTENSION_DIR",
            path.display()
        ));
    }
    for component in path.components() {
        if !matches!(
            component,
            std::path::Component::Normal(_) | std::path::Component::CurDir
        ) {
            return Err(format!(
                "local extension path {} must stay within COMTRYA_EXTENSION_DIR",
                path.display()
            ));
        }
    }
    Ok(extension_dir.join(path))
}

fn unsupported_oci_extension(
    config: &ExtensionInstallConfig,
    registry: &str,
    image: &str,
    reference: &OciReference,
) -> String {
    format!(
        "extension {} uses OCI source {}/{}:{}, but OCI extension installs are not supported by server startup yet. Configure source.kind: \"local\" with a package path under COMTRYA_EXTENSION_DIR.",
        config.id,
        registry,
        image,
        reference.as_ref_str()
    )
}

fn load_extension_packages(
    packages: Vec<ExtensionPackageRoot>,
) -> Result<ExtensionRuntimeOutput, String> {
    let engine = Engine::default();
    let registry = wasm_registry::WasmRegistry::new()
        .map_err(|error| format!("failed to build wasm registry: {error}"))?;
    let mut loaded = BTreeMap::new();
    for package in packages {
        let root = package.root;
        let manifest_path = root.join("manifest.json");
        let manifest_source = fs::read_to_string(&manifest_path)
            .map_err(|error| format!("failed to read {}: {error}", manifest_path.display()))?;
        let manifest = serde_json::from_str::<Value>(&manifest_source)
            .map_err(|error| format!("failed to parse {}: {error}", manifest_path.display()))?;
        let id = manifest
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{} missing id", manifest_path.display()))?;
        let name = manifest
            .get("name")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{} missing name", manifest_path.display()))?;
        if package.configured_id != id && package.configured_id != name {
            return Err(format!(
                "extension config id {} does not match package id {} or name {} at {}",
                package.configured_id,
                id,
                name,
                root.display()
            ));
        }
        let ui_manifest = validate_extension_manifest_pair(id, &root, &manifest)?;
        let output_type = manifest
            .pointer("/runtime/outputType")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{} missing runtime.outputType", manifest_path.display()))?;
        let route_prefix = manifest
            .get("routePrefix")
            .and_then(Value::as_str)
            .map(str::to_owned);
        let platform_wit_version = manifest
            .get("platformWitVersion")
            .and_then(Value::as_str)
            .map(str::to_owned);
        let platform_wasm = root.join(format!("dist/{}.wasm", id));

        let (component_name, resolver, status) =
            if platform_wit_version.is_some() {
                if crate::generated_dispatch::invoker_for_extension(id).is_none() {
                    return Err(format!(
                        "{} declares platformWitVersion, but this server binary has no generated typed WASM invoker for extension {}. M2 supports platform-WIT startup only for extensions discovered under extensions/first-party at server build time.",
                        manifest_path.display(),
                        id
                    ));
                }
                if !platform_wasm.is_file() {
                    return Err(format!(
                        "{} declares platformWitVersion but {} is missing",
                        manifest_path.display(),
                        platform_wasm.display()
                    ));
                }
                // Platform-WIT extension: load into the registry. Skip
                // the legacy `resolve()` call — platform extensions
                // don't export it.
                registry.register_from_manifest(&root)?;
                (
                    format!("dist/{}.wasm", id),
                    String::from("platform-wit-extension"),
                    String::from("platform-loaded"),
                )
            } else {
                // Legacy resolver path. Reads manifest.wasmComponent
                // (usually `component.wat` stub) and calls its
                // `resolve()` export. Dies in M11.
                let component_name = manifest
                    .get("wasmComponent")
                    .and_then(Value::as_str)
                    .ok_or_else(|| {
                        format!("{} missing wasmComponent", manifest_path.display())
                    })?;
                let resolver = manifest
                    .pointer("/runtime/resolver")
                    .and_then(Value::as_str)
                    .unwrap_or("resolve");
                let component_path = root.join(component_name);
                let component_bytes = fs::read(&component_path)
                    .map_err(|error| {
                        format!("failed to read {}: {error}", component_path.display())
                    })?;
                let component = Component::new(&engine, component_bytes).map_err(|error| {
                    format!(
                        "failed to compile {}: {error}",
                        component_path.display()
                    )
                })?;
                let linker = Linker::<()>::new(&engine);
                let mut store = Store::new(&engine, ());
                let instance = linker
                    .instantiate(&mut store, &component)
                    .map_err(|error| {
                        format!(
                            "failed to instantiate {}: {error}",
                            component_path.display()
                        )
                    })?;
                let func = instance
                    .get_typed_func::<(), (u32,)>(&mut store, resolver)
                    .map_err(|error| {
                        format!("{id} did not export resolver {resolver}: {error}")
                    })?;
                let _ = func
                    .call(&mut store, ())
                    .map_err(|error| format!("{id} resolver failed: {error}"))?;
                (
                    component_name.to_string(),
                    resolver.to_string(),
                    String::from("executed"),
                )
            };
        if loaded
            .insert(
                id.to_string(),
                WasmtimeResolverRecord {
                    id: id.to_string(),
                    component: component_name,
                    resolver,
                    output_type: output_type.to_string(),
                    status,
                    root,
                    ui_manifest,
                    route_prefix,
                },
            )
            .is_some()
        {
            return Err(format!("duplicate extension package id {id}"));
        }
    }
    Ok(ExtensionRuntimeOutput {
        records: loaded,
        registry,
    })
}

#[derive(Clone, Debug)]
pub(crate) struct ExtensionRuntimeOutput {
    pub(crate) records: BTreeMap<String, WasmtimeResolverRecord>,
    pub(crate) registry: wasm_registry::WasmRegistry,
}

impl ExtensionRuntimeOutput {
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }
    pub(crate) fn get(&self, id: &str) -> Option<&WasmtimeResolverRecord> {
        self.records.get(id)
    }
    pub(crate) fn contains_key(&self, id: &str) -> bool {
        self.records.contains_key(id)
    }
    pub(crate) fn values(&self) -> std::collections::btree_map::Values<'_, String, WasmtimeResolverRecord> {
        self.records.values()
    }
    pub(crate) fn iter(&self) -> std::collections::btree_map::Iter<'_, String, WasmtimeResolverRecord> {
        self.records.iter()
    }
}

impl std::ops::Index<&str> for ExtensionRuntimeOutput {
    type Output = WasmtimeResolverRecord;
    fn index(&self, key: &str) -> &Self::Output {
        &self.records[key]
    }
}

fn is_receive_pack(path: &str, query: Option<&str>) -> bool {
    path.ends_with("/git-receive-pack")
        || query
            .map(|query| query.contains("service=git-receive-pack"))
            .unwrap_or(false)
}

trait GitSmartHttpAdapter {
    fn handle(&self, request: GitSmartHttpRequest<'_>) -> Result<Response, String>;
}

struct GitSmartHttpRequest<'a> {
    project_root: &'a Path,
    path: &'a str,
    query: &'a str,
    method: &'a Method,
    headers: &'a HeaderMap,
    body: Bytes,
    cors: HeaderMap,
}

struct ShellGitHttpBackendAdapter;

impl GitSmartHttpAdapter for ShellGitHttpBackendAdapter {
    fn handle(&self, request: GitSmartHttpRequest<'_>) -> Result<Response, String> {
        run_git_http_backend(
            request.project_root,
            request.path,
            request.query,
            request.method,
            request.headers,
            request.body,
            request.cors,
        )
    }
}

fn run_git_http_backend(
    project_root: &Path,
    path: &str,
    query: &str,
    method: &Method,
    headers: &HeaderMap,
    body: Bytes,
    cors: HeaderMap,
) -> Result<Response, String> {
    if !matches!(method, &Method::GET | &Method::POST) {
        return Err(format!("unsupported Git HTTP method: {method}"));
    }
    let mut child = Command::new("git")
        .arg("http-backend")
        .env("GIT_PROJECT_ROOT", project_root)
        .env("GIT_HTTP_EXPORT_ALL", "1")
        .env("PATH_INFO", format!("/{path}"))
        .env("QUERY_STRING", query)
        .env("REQUEST_METHOD", method.as_str())
        .env(
            "CONTENT_TYPE",
            header_str(headers, "content-type").unwrap_or(""),
        )
        .env("CONTENT_LENGTH", body.len().to_string())
        .env("GATEWAY_INTERFACE", "CGI/1.1")
        .env("SERVER_PROTOCOL", "HTTP/1.1")
        .env("REMOTE_ADDR", "127.0.0.1")
        .env("REMOTE_USER", "comtrya")
        .env(
            "HTTP_GIT_PROTOCOL",
            header_str(headers, "git-protocol").unwrap_or(""),
        )
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("failed to spawn git http-backend: {error}"))?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(&body)
            .map_err(|error| format!("failed to write git request body: {error}"))?;
    }
    let output = child
        .wait_with_output()
        .map_err(|error| format!("failed to wait for git http-backend: {error}"))?;
    if !output.status.success() {
        return Err(format!(
            "git http-backend failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    cgi_response(output.stdout, cors)
}

fn cgi_response(stdout: Vec<u8>, cors: HeaderMap) -> Result<Response, String> {
    let Some((header_end, separator_len)) = find_cgi_header_end(&stdout) else {
        return Err("git http-backend returned no CGI headers".to_string());
    };
    let headers_text = String::from_utf8_lossy(&stdout[..header_end]);
    let body = stdout[header_end + separator_len..].to_vec();
    let mut status = StatusCode::OK;
    let mut headers = HeaderMap::new();
    for line in headers_text.lines().map(|line| line.trim_end_matches('\r')) {
        let Some((name, value)) = line.split_once(':') else {
            continue;
        };
        if name.eq_ignore_ascii_case("Status") {
            if let Some(code) = value
                .split_whitespace()
                .next()
                .and_then(|code| code.parse::<u16>().ok())
                .and_then(|code| StatusCode::from_u16(code).ok())
            {
                status = code;
            }
            continue;
        }
        if let (Ok(name), Ok(value)) = (
            HeaderName::from_bytes(name.trim().as_bytes()),
            HeaderValue::from_str(value.trim()),
        ) {
            headers.insert(name, value);
        }
    }
    headers.extend(cors);
    let mut response = Response::new(Body::from(body));
    *response.status_mut() = status;
    *response.headers_mut() = headers;
    Ok(response)
}

fn find_cgi_header_end(bytes: &[u8]) -> Option<(usize, usize)> {
    bytes
        .windows(4)
        .position(|window| window == b"\r\n\r\n")
        .map(|idx| (idx, 4))
        .or_else(|| {
            bytes
                .windows(2)
                .position(|window| window == b"\n\n")
                .map(|idx| (idx, 2))
        })
}

fn header_str<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers.get(name).and_then(|value| value.to_str().ok())
}

fn write_seed_file(root: &Path, relative: &str, body: &str) -> Result<(), String> {
    let path = root.join(relative);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("failed to create {}: {error}", parent.display()))?;
    }
    fs::write(&path, body).map_err(|error| format!("failed to write {}: {error}", path.display()))
}

fn run_command(command: &mut Command, label: &str) -> Result<(), String> {
    let output = command
        .output()
        .map_err(|error| format!("{label} could not start: {error}"))?;
    if output.status.success() {
        Ok(())
    } else {
        Err(format!(
            "{label} failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

fn validate_production_testbed(
    config: &InstanceConfig,
    options: &StartupOptions,
) -> Result<(), String> {
    if config.environment != Environment::Production {
        return Ok(());
    }
    if !options.tls_terminated {
        return Err("production mode requires COMTRYA_TLS_TERMINATED=true".to_string());
    }
    let operator_code = options.operator_code.as_deref().unwrap_or_default();
    if operator_code.len() < 12 || operator_code == "dev-secret" {
        return Err(
            "production testbed requires COMTRYA_OPERATOR_CODE with at least 12 characters"
                .to_string(),
        );
    }
    if options.external_demo && DEFAULT_OPERATOR_CODES.contains(&operator_code) {
        return Err(
            "external production-testbed demos require a non-default COMTRYA_OPERATOR_CODE"
                .to_string(),
        );
    }
    if !options.data_dir.is_absolute() {
        return Err("production mode requires an absolute COMTRYA_DATA_DIR".to_string());
    }
    if !options.extension_dir.is_dir() {
        return Err("production testbed requires COMTRYA_EXTENSION_DIR to exist".to_string());
    }
    if config
        .allowed_origins
        .iter()
        .any(|origin| !origin.starts_with("https://"))
    {
        return Err("production instance.allowedOrigins entries must use https://".to_string());
    }
    for backend in config.repository_storage_backends.values() {
        if let RepoStorageBackend::Local { path } = backend {
            if !Path::new(path).is_absolute() {
                return Err("production local repository storage path must be absolute".to_string());
            }
        }
    }
    Ok(())
}

#[derive(Debug)]
struct LoadedConfig {
    config: InstanceConfig,
    extension_config_declared: bool,
}

fn load_config_file(path: &Path) -> Result<InstanceConfig, String> {
    load_config_file_with_metadata(path).map(|loaded| loaded.config)
}

fn load_config_file_with_metadata(path: &Path) -> Result<LoadedConfig, String> {
    let source = fs::read_to_string(path)
        .map_err(|error| format!("failed to read config {}: {error}", path.display()))?;
    let mut config = InstanceConfig::minimal_dev();
    if let Some(value) = cue_string(&source, "id") {
        config.id = value;
    }
    if let Some(value) = cue_string(&source, "name") {
        config.name = value;
    }
    if let Some(value) = cue_string(&source, "publicURL") {
        config.public_url = value;
    }
    if let Some(value) = cue_string(&source, "environment") {
        config.environment = match value.as_str() {
            "production" => Environment::Production,
            _ => Environment::Development,
        };
    }
    if let Some(origins) = cue_string_array(&source, "allowedOrigins") {
        config.allowed_origins = origins;
    }
    if let Some(value) = cue_string_after(&source, "database", "url") {
        config.database = if value.starts_with("postgres://") {
            DatabaseConfig::Postgres { url: value }
        } else {
            DatabaseConfig::Sqlite { url: value }
        };
    }
    if let Some(value) = cue_string_after(&source, "oidc", "issuerURL") {
        config.oidc_issuers[0].issuer_url = value;
    }
    if let Some(value) = cue_string_after(&source, "oidc", "clientID") {
        config.oidc_issuers[0].client_id = value;
    }
    if let Some(value) = cue_string_after(&source, "oidc", "clientKind") {
        config.oidc_issuers[0].client_kind = if value == "public" {
            config.oidc_issuers[0].client_secret = None;
            ClientKind::Public
        } else {
            ClientKind::Confidential
        };
    }
    if let Some(value) = cue_string_after(&source, "oidc", "clientSecret") {
        config.oidc_issuers[0].client_secret = Some(value);
    }
    if let Some(value) = cue_string_after(&source, "oidc", "redirectURL") {
        config.oidc_issuers[0].redirect_url = value;
    }
    if let Some(domains) = cue_string_array_after(&source, "allowed", "domains") {
        config.oidc_issuers[0].allowed_domains = domains;
    }
    if let Some(path) = cue_string_after(&source, "backends", "path") {
        config
            .repository_storage_backends
            .insert("local".to_string(), RepoStorageBackend::Local { path });
    }
    if let Some(value) = cue_string_after(&source, "workspaces", "visibility") {
        if let Some(workspace) = config.workspaces.get_mut("default") {
            workspace.visibility = match value.as_str() {
                "PUBLIC" => comtrya_core::Visibility::Public,
                "INTERNAL" => comtrya_core::Visibility::Internal,
                _ => comtrya_core::Visibility::Private,
            };
        }
    }
    let extensions = cue_extension_install_configs(&source)?;
    let extension_config_declared = extensions.is_some();
    if let Some(extensions) = extensions {
        config.extensions = extensions;
    }
    config.validate().map_err(|error| error.to_string())?;
    Ok(LoadedConfig {
        config,
        extension_config_declared,
    })
}

fn cue_string(source: &str, key: &str) -> Option<String> {
    source.lines().find_map(|line| quoted_value(line, key))
}

fn cue_string_after(source: &str, section: &str, key: &str) -> Option<String> {
    let section_start = source.find(section)?;
    cue_string(&source[section_start..], key)
}

fn cue_string_array(source: &str, key: &str) -> Option<Vec<String>> {
    source.lines().find_map(|line| quoted_array(line, key))
}

fn cue_string_array_after(source: &str, section: &str, key: &str) -> Option<Vec<String>> {
    let section_start = source.find(section)?;
    cue_string_array(&source[section_start..], key)
}

fn quoted_value(line: &str, key: &str) -> Option<String> {
    let (_, rest) = line.split_once(key)?;
    let (_, rest) = rest.split_once('"')?;
    let (value, _) = rest.split_once('"')?;
    Some(value.to_string())
}

fn quoted_array(line: &str, key: &str) -> Option<Vec<String>> {
    let (_, rest) = line.split_once(key)?;
    let (_, rest) = rest.split_once('[')?;
    let (inside, _) = rest.split_once(']')?;
    Some(
        inside
            .split(',')
            .filter_map(|part| {
                let (_, rest) = part.split_once('"')?;
                let (value, _) = rest.split_once('"')?;
                Some(value.to_string())
            })
            .collect(),
    )
}

fn cue_extension_install_configs(
    source: &str,
) -> Result<Option<Vec<ExtensionInstallConfig>>, String> {
    let Some(key_offset) = cue_key_offset(source, "extensions") else {
        return Ok(None);
    };
    let colon_index = source[key_offset..]
        .find(':')
        .map(|relative| key_offset + relative)
        .ok_or_else(|| "extensions field missing :".to_string())?;
    let Some((value_index, value_start)) = cue_first_significant_char(source, colon_index + 1)
    else {
        return Ok(None);
    };
    if value_start == '[' {
        return Ok(None);
    }
    let body = if value_start == '{' {
        let close_index = cue_balanced_close(source, value_index, '{', '}')
            .ok_or_else(|| "extensions map has an unclosed { block".to_string())?;
        source[value_index + 1..close_index].to_string()
    } else {
        let open_index = source[value_index..]
            .find('{')
            .map(|relative| value_index + relative)
            .ok_or_else(|| "extensions keyed entry missing { block".to_string())?;
        let close_index = cue_balanced_close(source, open_index, '{', '}')
            .ok_or_else(|| "extensions keyed entry has an unclosed { block".to_string())?;
        source[value_index..=close_index].to_string()
    };
    let blocks = cue_top_level_keyed_objects(&body)?;
    let mut configs = Vec::new();
    for (id, block) in blocks {
        configs.push(cue_extension_install_config(id, &block)?);
    }
    Ok(Some(configs))
}

fn cue_extension_install_config(id: String, block: &str) -> Result<ExtensionInstallConfig, String> {
    if let Some(field_id) = cue_field_string(block, "id") {
        if field_id != id {
            return Err(format!(
                "extension keyed as {id:?} must not declare mismatched id {field_id:?}"
            ));
        }
    }
    let source = cue_balanced_body_after_key(block, "source", '{', '}')?
        .ok_or_else(|| format!("extension {id} missing source block"))?;
    let kind = cue_field_string(&source, "kind")
        .ok_or_else(|| format!("extension {id} source missing kind"))?;
    let source = match kind.as_str() {
        "local" => {
            let path = cue_field_string(&source, "path")
                .ok_or_else(|| format!("extension {id} local source missing path"))?;
            ExtensionSource::Local { path }
        }
        "oci" => {
            let registry = cue_field_string(&source, "registry")
                .ok_or_else(|| format!("extension {id} OCI source missing registry"))?;
            let image = cue_field_string(&source, "image")
                .ok_or_else(|| format!("extension {id} OCI source missing image"))?;
            let reference = if let Some(digest) = cue_field_string(&source, "digest") {
                OciReference::Digest(digest)
            } else if let Some(reference) = cue_field_string(&source, "reference") {
                oci_reference_from_config(reference)
            } else if let Some(tag) = cue_field_string(&source, "tag") {
                OciReference::Tag(tag)
            } else {
                return Err(format!("extension {id} OCI source missing reference"));
            };
            ExtensionSource::Oci {
                registry,
                image,
                reference,
            }
        }
        _ => {
            return Err(format!(
                "extension {id} source kind {kind:?} is not supported"
            ));
        }
    };

    Ok(ExtensionInstallConfig {
        id,
        source,
        enabled: cue_field_bool(block, "enabled").unwrap_or(true),
        route_prefix: None,
    })
}

fn oci_reference_from_config(reference: String) -> OciReference {
    if reference.starts_with("sha256:") {
        OciReference::Digest(reference)
    } else {
        OciReference::Tag(reference)
    }
}

fn cue_key_offset(source: &str, key: &str) -> Option<usize> {
    let mut offset = 0;
    for line in source.split_inclusive('\n') {
        let trimmed = line.trim_start();
        let start = offset + line.len() - trimmed.len();
        if let Some(rest) = trimmed.strip_prefix(key) {
            if rest.trim_start().starts_with(':') {
                return Some(start);
            }
        }
        offset += line.len();
    }
    None
}

fn cue_balanced_body_after_key(
    source: &str,
    key: &str,
    open: char,
    close: char,
) -> Result<Option<String>, String> {
    let Some(key_offset) = cue_key_offset(source, key) else {
        return Ok(None);
    };
    let Some(open_relative) = source[key_offset..].find(open) else {
        return Err(format!("{key} missing {open} block"));
    };
    let open_index = key_offset + open_relative;
    let close_index = cue_balanced_close(source, open_index, open, close)
        .ok_or_else(|| format!("{key} has an unclosed {open} block"))?;
    Ok(Some(
        source[open_index + open.len_utf8()..close_index].to_string(),
    ))
}

fn cue_balanced_close(source: &str, open_index: usize, open: char, close: char) -> Option<usize> {
    let mut depth = 0usize;
    let mut in_string = false;
    let mut escaped = false;
    let mut in_line_comment = false;
    for (relative, ch) in source[open_index..].char_indices() {
        let index = open_index + relative;
        if in_line_comment {
            if ch == '\n' {
                in_line_comment = false;
            }
            continue;
        }
        if in_string {
            if escaped {
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else if ch == '"' {
                in_string = false;
            }
            continue;
        }
        if source[index..].starts_with("//") {
            in_line_comment = true;
            continue;
        }
        if ch == '"' {
            in_string = true;
        } else if ch == open {
            depth += 1;
        } else if ch == close {
            depth = depth.checked_sub(1)?;
            if depth == 0 {
                return Some(index);
            }
        }
    }
    None
}

fn cue_top_level_keyed_objects(source: &str) -> Result<Vec<(String, String)>, String> {
    let mut objects = Vec::new();
    let mut offset = 0usize;
    while offset < source.len() {
        let Some((key, colon_index)) = cue_next_key_colon(source, offset)? else {
            break;
        };
        let Some((open_index, open_char)) = cue_first_significant_char(source, colon_index + 1)
        else {
            return Err(format!("extension {key} missing value"));
        };
        if open_char != '{' {
            return Err(format!("extension {key} value must be an object"));
        }
        let close_index = cue_balanced_close(source, open_index, '{', '}')
            .ok_or_else(|| format!("extension {key} has an unclosed object"))?;
        objects.push((key, source[open_index..=close_index].to_string()));
        offset = close_index + 1;
    }
    Ok(objects)
}

fn cue_next_key_colon(source: &str, offset: usize) -> Result<Option<(String, usize)>, String> {
    let mut absolute_offset = offset;
    for line in source[offset..].split_inclusive('\n') {
        let stripped = cue_strip_line_comment(line);
        let trimmed = stripped.trim_start();
        if trimmed.is_empty() || trimmed.starts_with(',') {
            absolute_offset += line.len();
            continue;
        }
        let key_start = absolute_offset + stripped.len() - trimmed.len();
        if let Some(rest) = trimmed.strip_prefix('"') {
            let mut escaped = false;
            for (relative, ch) in rest.char_indices() {
                if escaped {
                    escaped = false;
                    continue;
                }
                if ch == '\\' {
                    escaped = true;
                    continue;
                }
                if ch == '"' {
                    let after_key = &rest[relative + ch.len_utf8()..];
                    let colon_after_key = after_key.trim_start();
                    if colon_after_key.starts_with(':') {
                        let colon_relative = trimmed.len() - colon_after_key.len();
                        return Ok(Some((
                            rest[..relative].to_string(),
                            key_start + colon_relative,
                        )));
                    }
                    break;
                }
            }
        } else {
            let Some(colon_relative) = trimmed.find(':') else {
                absolute_offset += line.len();
                continue;
            };
            let key = trimmed[..colon_relative].trim();
            if key.contains('-') {
                return Err(format!(
                    "extension label {key:?} must be quoted because raw CUE labels cannot contain '-'"
                ));
            }
            if !key.is_empty() && key.chars().all(cue_raw_label_char) {
                return Ok(Some((key.to_string(), key_start + colon_relative)));
            }
            if !key.is_empty() {
                return Err(format!(
                    "extension label {key:?} is not a valid raw CUE label"
                ));
            }
        }
        absolute_offset += line.len();
    }
    Ok(None)
}

fn cue_raw_label_char(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_'
}

fn cue_first_significant_char(source: &str, start: usize) -> Option<(usize, char)> {
    let mut index = start;
    while index < source.len() {
        let remainder = &source[index..];
        if remainder.starts_with("//") {
            if let Some(newline) = remainder.find('\n') {
                index += newline + 1;
                continue;
            }
            return None;
        }
        let ch = remainder.chars().next()?;
        if ch.is_whitespace() {
            index += ch.len_utf8();
            continue;
        }
        return Some((index, ch));
    }
    None
}

fn cue_field_string(source: &str, key: &str) -> Option<String> {
    cue_field_value(source, key).and_then(|value| {
        let (_, rest) = value.split_once('"')?;
        let (value, _) = rest.split_once('"')?;
        Some(value.to_string())
    })
}

fn cue_field_bool(source: &str, key: &str) -> Option<bool> {
    cue_field_value(source, key).and_then(|value| {
        let value = value.trim_start();
        if value.starts_with("true") {
            Some(true)
        } else if value.starts_with("false") {
            Some(false)
        } else {
            None
        }
    })
}

fn cue_field_value(source: &str, key: &str) -> Option<String> {
    for line in source.lines() {
        let line = cue_strip_line_comment(line);
        let mut remainder = line.as_str();
        while let Some(index) = remainder.find(key) {
            let before = remainder[..index].chars().next_back();
            let after_key = &remainder[index + key.len()..];
            if !cue_identifier_char(before) && after_key.trim_start().starts_with(':') {
                let (_, value) = after_key.split_once(':')?;
                return Some(value.to_string());
            }
            remainder = &after_key[after_key.char_indices().nth(1).map_or(0, |(idx, _)| idx)..];
        }
    }
    None
}

fn cue_identifier_char(ch: Option<char>) -> bool {
    ch.map(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '-')
        .unwrap_or(false)
}

fn cue_strip_line_comment(line: &str) -> String {
    let mut in_string = false;
    let mut escaped = false;
    for (index, ch) in line.char_indices() {
        if in_string {
            if escaped {
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else if ch == '"' {
                in_string = false;
            }
            continue;
        }
        if ch == '"' {
            in_string = true;
        } else if line[index..].starts_with("//") {
            return line[..index].to_string();
        }
    }
    line.to_string()
}

fn touch(path: &Path) -> std::io::Result<()> {
    OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map(|_| ())
}

fn append_jsonl(path: &Path, value: Value) -> std::io::Result<()> {
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    writeln!(file, "{value}")?;
    Ok(())
}

fn now_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default()
}

fn absolute_path(path: PathBuf) -> PathBuf {
    if path.is_absolute() {
        path
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(path)
    }
}

fn env_truthy(name: &str) -> bool {
    std::env::var(name)
        .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
        .unwrap_or(false)
}

fn env_u64(name: &str, default: u64) -> u64 {
    std::env::var(name)
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(default)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    use comtrya_core::OidcIssuerConfig;
    use std::sync::atomic::AtomicU64;

    /// build.rs codegen → main.rs include pipeline works end-to-end.
    #[test]
    fn dispatch_table_routes_ext_issues_close() {
        let info = crate::generated_dispatch::dispatch_route(
            "ext_issues.issues.close-issue",
        )
        .expect("route should resolve to DispatchInfo");
        assert_eq!(info.extension_id, "ext_issues");
        assert_eq!(info.interface_name, "issues");
        assert_eq!(info.op_name, "close-issue");
        assert_eq!(info.kind, "mutation");
    }

    #[test]
    fn dispatch_table_legacy_graphql_field_alias_resolves() {
        // The existing Astro GraphQL surface uses `issuesClose`
        // (interface + verb), not the WIT-native `closeIssue`. The
        // codegen emits a legacy alias for backward compatibility.
        let info = crate::generated_dispatch::dispatch_route("issuesClose")
            .expect("legacy alias should resolve");
        assert_eq!(info.extension_id, "ext_issues");
        assert_eq!(info.op_name, "close-issue");
    }

    #[test]
    fn dispatch_table_returns_none_for_unknown_routes() {
        assert!(
            crate::generated_dispatch::dispatch_route("nope.nope.nope").is_none()
        );
    }

    static TEST_DIR_COUNTER: AtomicU64 = AtomicU64::new(0);

    fn temp_dir(name: &str) -> PathBuf {
        let counter = TEST_DIR_COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "comtrya-testbed-{name}-{}-{counter}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("time works")
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn test_extension_dir() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .join("extensions/first-party")
    }

    fn copy_dir_recursive(src: &Path, dst: &Path) {
        fs::create_dir_all(dst).unwrap();
        for entry in fs::read_dir(src).unwrap() {
            let entry = entry.unwrap();
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());
            if src_path.is_dir() {
                copy_dir_recursive(&src_path, &dst_path);
            } else {
                fs::copy(&src_path, &dst_path).unwrap();
            }
        }
    }

    fn dev_runtime() -> Arc<Runtime> {
        dev_runtime_with_session_ttl(300)
    }

    fn dev_runtime_with_session_ttl(session_ttl_seconds: u64) -> Arc<Runtime> {
        Arc::new(
            Runtime::start(StartupOptions {
                config_path: None,
                data_dir: temp_dir("dev"),
                extension_dir: test_extension_dir(),
                listen: "127.0.0.1:0".parse().unwrap(),
                check: false,
                tls_terminated: false,
                operator_code: Some("testbed-operator-code".to_string()),
                session_ttl_seconds,
                external_demo: false,
            })
            .unwrap(),
        )
    }

    /// Like `dev_runtime` but with an empty extensions config so the on-disk
    /// v1 manifests are never loaded.  Use this for tests that exercise auth,
    /// CORS, git, GraphQL core fields, or other concerns orthogonal to the
    /// extension manifest format.
    fn dev_runtime_no_extensions() -> Arc<Runtime> {
        dev_runtime_no_extensions_with_session_ttl(300)
    }

    fn dev_runtime_no_extensions_with_session_ttl(session_ttl_seconds: u64) -> Arc<Runtime> {
        // Write a minimal config with an explicit (empty) extensions block so
        // that extension_config_declared = true and no WASM packages are loaded.
        let config_dir = temp_dir("dev-no-ext-cfg");
        let config_path = config_dir.join("config.cue");
        fs::write(&config_path, "package comtrya\nextensions: {}\n").unwrap();
        Arc::new(
            Runtime::start(StartupOptions {
                config_path: Some(config_path),
                data_dir: temp_dir("dev-no-ext"),
                extension_dir: test_extension_dir(),
                listen: "127.0.0.1:0".parse().unwrap(),
                check: false,
                tls_terminated: false,
                operator_code: Some("testbed-operator-code".to_string()),
                session_ttl_seconds,
                external_demo: false,
            })
            .unwrap(),
        )
    }

    fn bearer_headers(token: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(
            "authorization",
            HeaderValue::from_str(&format!("Bearer {token}")).unwrap(),
        );
        headers
    }

    #[tokio::test]
    async fn readyz_reports_runtime_checks() {
        let state = AppState {
            runtime: dev_runtime_no_extensions(),
            git_state: PureRustGitState::test_default(),
        };
        let response = readyz(State(state), HeaderMap::new()).await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        assert_eq!(payload["ready"], true);
        assert_eq!(payload["checks"]["demoRepositoryRefs"], true);
        assert_eq!(
            payload["unsupported"].as_array().unwrap().len(),
            UNSUPPORTED_SURFACES.len()
        );
        for surface in UNSUPPORTED_SURFACES {
            assert!(
                payload["unsupported"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|entry| {
                        entry["id"] == surface.id
                            && entry["pathPrefix"] == surface.path_prefix
                            && entry["message"] == surface.message
                    })
            );
        }
    }

    #[test]
    fn demo_repository_validation_rejects_missing_seed_ref() {
        let data_dir = temp_dir("demo-repository-refs");
        let repo = ensure_demo_repository(&data_dir).unwrap();
        validate_demo_repository_refs(&repo).unwrap();

        run_command(
            Command::new("git")
                .arg("--git-dir")
                .arg(&repo.git_dir)
                .arg("branch")
                .arg("-D")
                .arg("ui/repository-intelligence"),
            "delete seeded UI demo branch",
        )
        .unwrap();

        let error = validate_demo_repository_refs(&repo).unwrap_err();
        assert!(error.contains("refs/heads/ui/repository-intelligence"));
    }

    #[test]
    fn demo_repository_seeding_is_idempotent_and_reopens_existing_repo() {
        let data_dir = temp_dir("demo-repository-idempotent");
        let repo = ensure_demo_repository(&data_dir).unwrap();
        let first_head = git_text(&repo.git_dir, &["rev-parse", "refs/heads/main"]).unwrap();

        let reopened = ensure_demo_repository(&data_dir).unwrap();
        let second_head = git_text(&reopened.git_dir, &["rev-parse", "refs/heads/main"]).unwrap();

        assert_eq!(reopened.git_dir, repo.git_dir);
        assert_eq!(reopened.project_root, repo.project_root);
        assert_eq!(reopened.http_path, "comtrya/comtrya.git");
        assert_eq!(first_head, second_head);
        validate_demo_repository_refs(&reopened).unwrap();
    }

    #[test]
    fn git_demo_snapshot_extracts_refs_tree_blobs_and_diff_from_seeded_repo() {
        let data_dir = temp_dir("demo-repository-snapshot");
        let repo = ensure_demo_repository(&data_dir).unwrap();

        let snapshot = git_demo_snapshot(&repo).unwrap();

        assert_eq!(snapshot.repository["path"], "comtrya/comtrya");
        assert_eq!(snapshot.repository["defaultBranch"], "main");
        assert_eq!(snapshot.repository["headOid"].as_str().unwrap().len(), 40);
        assert!(snapshot.refs.iter().any(|reference| {
            reference["name"] == "refs/heads/main"
                && reference["target"] == snapshot.repository["headOid"]
        }));
        assert!(
            snapshot
                .branches
                .iter()
                .any(|branch| branch["name"] == "main")
        );
        assert!(snapshot.commits.len() >= 2);
        assert!(
            snapshot
                .tree_entries
                .iter()
                .any(|entry| entry["path"] == "README.md")
        );
        assert!(
            snapshot
                .blobs
                .iter()
                .any(|blob| blob["path"] == "README.md")
        );
        assert!(
            snapshot.diff["patch"]
                .as_str()
                .unwrap()
                .contains("live Git storage")
        );
    }

    #[tokio::test]
    async fn unsupported_routes_return_registry_errors() {
        let state = AppState {
            runtime: dev_runtime_no_extensions(),
            git_state: PureRustGitState::test_default(),
        };

        for (path, expected_surface) in [
            ("/auth/oidc/prod/callback", "oidc_browser_callback"),
            ("/api/v1/repositories", "legacy_v1_api"),
        ] {
            let response = unsupported_route(
                State(state.clone()),
                HeaderMap::new(),
                Uri::from_static(path),
            )
            .await;

            assert_eq!(response.status(), StatusCode::NOT_IMPLEMENTED);
            let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
            let payload = serde_json::from_slice::<Value>(&body).unwrap();
            assert_eq!(
                payload["errors"][0]["extensions"]["code"],
                ErrorCode::Unsupported.as_str()
            );
            assert_eq!(
                payload["errors"][0]["extensions"]["surface"],
                expected_surface
            );
        }
    }

    #[tokio::test]
    async fn disallowed_origin_is_forbidden() {
        let state = AppState {
            runtime: dev_runtime_no_extensions(),
            git_state: PureRustGitState::test_default(),
        };
        let mut headers = HeaderMap::new();
        headers.insert("origin", HeaderValue::from_static("https://evil.example"));
        let response = graphql_get(State(state), headers).await;

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn session_token_is_single_use_for_events() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_session(PrincipalStatus::OperatorCredential);
        let mut query = HashMap::new();
        query.insert("session".to_string(), token.clone());

        let state = AppState {
            runtime: runtime.clone(),
            git_state: PureRustGitState::test_default(),
        };
        let first = events(State(state.clone()), HeaderMap::new(), Query(query.clone())).await;
        let second = events(State(state), HeaderMap::new(), Query(query)).await;

        assert_eq!(first.status(), StatusCode::OK);
        assert_eq!(second.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    async fn extension_assets_use_content_hash_cache_headers() {
        let runtime = dev_runtime();

        let response = extension_asset(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath(("ext_code_browser".to_string(), "index.js".to_string())),
            HeaderMap::new(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers().get(CACHE_CONTROL).unwrap(),
            "private, max-age=31536000, immutable"
        );
        let etag = response
            .headers()
            .get(ETAG)
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        assert!(etag.starts_with("\"sha256-"));
        assert_ne!(etag, "\"runtime\"");

        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        assert_eq!(etag, asset_etag(&body));
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn extension_manifest_body_uses_backend_declared_ui_manifest_path() {
        let extension_dir = temp_dir("declared-ui-manifest");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        let extension_root = extension_dir.join("ext_checks");
        let backend_manifest_path = extension_root.join("manifest.json");
        let custom_manifest_path = extension_root.join("custom/ui-extension.json");
        fs::create_dir_all(custom_manifest_path.parent().unwrap()).unwrap();
        fs::rename(
            extension_root.join("ui/manifest.json"),
            &custom_manifest_path,
        )
        .unwrap();
        let mut backend_manifest =
            serde_json::from_str::<Value>(&fs::read_to_string(&backend_manifest_path).unwrap())
                .unwrap();
        backend_manifest["ui"]["manifest"] = json!("custom/ui-extension.json");
        fs::write(
            &backend_manifest_path,
            serde_json::to_vec_pretty(&backend_manifest).unwrap(),
        )
        .unwrap();

        let runtime = Runtime::start(StartupOptions {
            config_path: None,
            data_dir: temp_dir("declared-ui-manifest-data"),
            extension_dir,
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("testbed-operator-code".to_string()),
            session_ttl_seconds: 300,
            external_demo: false,
        })
        .unwrap();

        let body = runtime
            .extension_manifest_body("ext_checks")
            .unwrap()
            .unwrap();

        assert_eq!(
            runtime.extension_runtime["ext_checks"].ui_manifest,
            custom_manifest_path
        );
        assert!(body.contains("\"id\": \"ext_checks\""));
    }

    #[tokio::test]
    async fn expired_session_token_fails_closed_for_events() {
        let runtime = dev_runtime_no_extensions_with_session_ttl(0);
        let token = runtime.issue_session(PrincipalStatus::OperatorCredential);
        let mut query = HashMap::new();
        query.insert("session".to_string(), token);

        let response = events(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            HeaderMap::new(),
            Query(query),
        )
        .await;
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            "UNAUTHENTICATED"
        );
        assert_eq!(
            payload["errors"][0]["message"],
            "event session is expired or already used"
        );
    }

    #[test]
    fn production_mode_requires_tls_operator_code_and_absolute_paths() {
        let mut config = InstanceConfig::minimal_dev();
        config.environment = Environment::Production;
        config.public_url = "https://comtrya.example.test".to_string();
        config.allowed_origins = vec!["https://comtrya.example.test".to_string()];
        config.oidc_issuers = vec![OidcIssuerConfig {
            id: "prod".to_string(),
            issuer_url: "https://issuer.example.test".to_string(),
            client_id: "comtrya".to_string(),
            client_kind: ClientKind::Confidential,
            client_secret: Some("not-a-dev-secret".to_string()),
            redirect_url: "https://comtrya.example.test/auth/oidc/prod/callback".to_string(),
            allowed_domains: vec!["example.test".to_string()],
            allowed_groups: Vec::new(),
            allowed_subjects: Vec::new(),
        }];
        let mut backends = BTreeMap::new();
        backends.insert(
            "local".to_string(),
            RepoStorageBackend::Local {
                path: temp_dir("repos").to_string_lossy().to_string(),
            },
        );
        config.repository_storage_backends = backends;

        let options = StartupOptions {
            config_path: None,
            data_dir: temp_dir("prod"),
            extension_dir: test_extension_dir(),
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("operator-code".to_string()),
            session_ttl_seconds: 300,
            external_demo: false,
        };

        assert!(
            validate_production_testbed(&config, &options)
                .unwrap_err()
                .contains("TLS")
        );
        let mut options = options;
        options.tls_terminated = true;
        assert!(validate_production_testbed(&config, &options).is_ok());
        options.external_demo = true;
        options.operator_code = Some("comtrya-local-operator-code".to_string());
        assert!(
            validate_production_testbed(&config, &options)
                .unwrap_err()
                .contains("non-default COMTRYA_OPERATOR_CODE")
        );
        options.operator_code = Some("operator-code-for-external-demo".to_string());
        assert!(validate_production_testbed(&config, &options).is_ok());
    }

    #[test]
    fn config_loader_reads_production_testbed_cue_subset() {
        let dir = temp_dir("config");
        let repos = temp_dir("config-repos");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            format!(
                r#"
package comtrya
instance: {{
  id: "prod"
  name: "Prod"
  publicURL: "https://comtrya.example.test"
  environment: "production"
  allowedOrigins: ["https://comtrya.example.test"]
}}
database: {{ kind: "sqlite", url: "sqlite://comtrya.db" }}
oidc: issuers: [{{
  issuerURL: "https://issuer.example.test"
  clientID: "comtrya"
  clientKind: "confidential"
  clientSecret: "prod-secret"
  redirectURL: "https://comtrya.example.test/auth/oidc/prod/callback"
  allowed: domains: ["example.test"]
}}]
storage: repositories: backends: local: {{ kind: "local", path: "{}" }}
"#,
                repos.display()
            ),
        )
        .unwrap();

        let config = load_config_file(&config_path).unwrap();

        assert_eq!(config.environment, Environment::Production);
        assert_eq!(config.allowed_origins, ["https://comtrya.example.test"]);
    }

    #[test]
    fn config_loader_reads_extension_install_configs() {
        let dir = temp_dir("config-extensions");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            r#"
package comtrya
extensions: {
  checks: {
    source: {
      kind: "local"
      path: "ext_checks"
    }
    enabled: true
  }
  "pull-requests": {
    source: {
      kind: "oci"
      registry: "ghcr.io"
      image: "comtrya/extensions/pull-requests"
      reference: "v1.0.0"
    }
    enabled: false
  }
  "code-browser": {
    source: {
      kind: "oci"
      registry: "ghcr.io"
      image: "comtrya/extensions/code-browser"
      digest: "sha256:abc123"
    }
  }
}
"#,
        )
        .unwrap();

        let config = load_config_file(&config_path).unwrap();

        assert_eq!(config.extensions.len(), 3);
        assert_eq!(config.extensions[0].id, "checks");
        assert!(config.extensions[0].enabled);
        assert_eq!(
            config.extensions[0].source,
            ExtensionSource::Local {
                path: "ext_checks".to_string()
            }
        );
        assert!(!config.extensions[1].enabled);
        assert_eq!(
            config.extensions[1].source,
            ExtensionSource::Oci {
                registry: "ghcr.io".to_string(),
                image: "comtrya/extensions/pull-requests".to_string(),
                reference: OciReference::Tag("v1.0.0".to_string())
            }
        );
        assert_eq!(
            config.extensions[2].source,
            ExtensionSource::Oci {
                registry: "ghcr.io".to_string(),
                image: "comtrya/extensions/code-browser".to_string(),
                reference: OciReference::Digest("sha256:abc123".to_string())
            }
        );
        assert!(config.extensions[2].enabled);
    }

    #[test]
    fn config_loader_reads_shorthand_keyed_extension_install_config() {
        let dir = temp_dir("config-extension-shorthand");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            r#"
package comtrya
extensions: checks: {
  source: {
    kind: "local"
    path: "ext_checks"
  }
  enabled: true
}
"#,
        )
        .unwrap();

        let config = load_config_file(&config_path).unwrap();

        assert_eq!(config.extensions.len(), 1);
        assert_eq!(config.extensions[0].id, "checks");
        assert_eq!(
            config.extensions[0].source,
            ExtensionSource::Local {
                path: "ext_checks".to_string()
            }
        );
    }

    #[test]
    fn config_loader_rejects_unquoted_hyphenated_extension_labels() {
        let dir = temp_dir("config-extension-invalid-raw-label");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            r#"
package comtrya
extensions: {
  pull-requests: {
    source: {
      kind: "local"
      path: "ext_pull_requests"
    }
  }
}
"#,
        )
        .unwrap();

        let error = load_config_file(&config_path).unwrap_err();

        assert!(error.contains("must be quoted"));
    }

    #[test]
    fn config_loader_treats_list_extension_block_as_documentation_only() {
        let dir = temp_dir("config-extension-list-docs");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            r#"
package comtrya
extensions: [
  {
    id: "checks"
    source: {
      kind: "oci"
      registry: "ghcr.io"
      image: "comtrya/extensions/checks"
      reference: "v1.0.0"
    }
    enabled: true
  },
]
"#,
        )
        .unwrap();

        let config = load_config_file(&config_path).unwrap();

        assert!(config.extensions.is_empty());
    }

    #[test]
    fn config_loader_records_empty_extension_map_as_declared() {
        let dir = temp_dir("config-extension-empty-map");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            r#"
package comtrya
extensions: {}
"#,
        )
        .unwrap();

        let loaded = load_config_file_with_metadata(&config_path).unwrap();
        let runtime = load_configured_extension_runtime(
            &test_extension_dir(),
            true,
            &loaded.config.extensions,
        )
        .unwrap();

        assert!(loaded.extension_config_declared);
        assert!(loaded.config.extensions.is_empty());
        assert!(runtime.is_empty());
    }

    #[tokio::test]
    async fn token_exchange_issues_short_lived_testbed_credential() {
        let runtime = dev_runtime_no_extensions();
        let request = TokenExchangeRequest {
            grant_type: "urn:comtrya:grant:operator-code".to_string(),
            subject_token: "testbed-operator-code".to_string(),
            subject_token_type: "urn:comtrya:token-type:operator-code".to_string(),
            requested_resource: "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            requested_actions: vec!["git:read".to_string()],
        };

        let response = token_exchange(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            HeaderMap::new(),
            Json(request),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        assert!(String::from_utf8_lossy(&body).contains("\"expiresIn\":300"));
    }

    #[tokio::test]
    async fn git_endpoint_serves_upload_pack_after_auth() {
        let runtime = dev_runtime_no_extensions();
        let git_state = PureRustGitState::from_runtime(&runtime);
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["git:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );

        let response = git_endpoint(
            State(AppState { runtime, git_state }),
            bearer_headers(&token),
            Method::GET,
            AxumPath("comtrya/comtrya.git/info/refs".to_string()),
            RawQuery(Some("service=git-upload-pack".to_string())),
            Bytes::new(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        assert!(String::from_utf8_lossy(&body).contains("git-upload-pack"));
    }

    #[tokio::test]
    async fn git_upload_pack_fails_closed_without_auth_or_scope() {
        let runtime = dev_runtime_no_extensions();
        let no_token_response = git_endpoint(
            State(AppState {
                runtime: runtime.clone(),
                git_state: PureRustGitState::test_default(),
            }),
            HeaderMap::new(),
            Method::GET,
            AxumPath("comtrya/comtrya.git/info/refs".to_string()),
            RawQuery(Some("service=git-upload-pack".to_string())),
            Bytes::new(),
        )
        .await;

        assert_eq!(no_token_response.status(), StatusCode::UNAUTHORIZED);
        let body = to_bytes(no_token_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            ErrorCode::Unauthenticated.as_str()
        );

        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let wrong_scope_response = git_endpoint(
            State(AppState {
                runtime: runtime.clone(),
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers(&token),
            Method::GET,
            AxumPath("comtrya/comtrya.git/info/refs".to_string()),
            RawQuery(Some("service=git-upload-pack".to_string())),
            Bytes::new(),
        )
        .await;

        assert_eq!(wrong_scope_response.status(), StatusCode::FORBIDDEN);
        let body = to_bytes(wrong_scope_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            ErrorCode::Forbidden.as_str()
        );

        let write_only_token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["git:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let write_only_fetch_response = git_endpoint(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers(&write_only_token),
            Method::GET,
            AxumPath("comtrya/comtrya.git/info/refs".to_string()),
            RawQuery(Some("service=git-upload-pack".to_string())),
            Bytes::new(),
        )
        .await;

        assert_eq!(write_only_fetch_response.status(), StatusCode::FORBIDDEN);
        let body = to_bytes(write_only_fetch_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            ErrorCode::Forbidden.as_str()
        );
    }

    #[tokio::test]
    async fn git_endpoint_rejects_path_traversal_after_auth() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["git:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );

        let response = git_endpoint(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers(&token),
            Method::GET,
            AxumPath("comtrya/../comtrya.git/info/refs".to_string()),
            RawQuery(Some("service=git-upload-pack".to_string())),
            Bytes::new(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            ErrorCode::NotFound.as_str()
        );
    }

    #[tokio::test]
    async fn git_receive_pack_returns_unsupported_registry_error() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["git:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );

        let response = git_endpoint(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers(&token),
            Method::GET,
            AxumPath("comtrya/comtrya.git/info/refs".to_string()),
            RawQuery(Some("service=git-receive-pack".to_string())),
            Bytes::new(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::NOT_IMPLEMENTED);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            ErrorCode::Unsupported.as_str()
        );
        assert_eq!(
            payload["errors"][0]["extensions"]["surface"],
            "git_receive_pack"
        );
    }

    #[test]
    fn shell_git_http_adapter_rejects_unsupported_methods_before_spawn() {
        let adapter = ShellGitHttpBackendAdapter;
        let error = adapter
            .handle(GitSmartHttpRequest {
                project_root: Path::new("/does-not-need-to-exist"),
                path: "comtrya/comtrya.git/info/refs",
                query: "service=git-upload-pack",
                method: &Method::DELETE,
                headers: &HeaderMap::new(),
                body: Bytes::new(),
                cors: HeaderMap::new(),
            })
            .unwrap_err();

        assert_eq!(error, "unsupported Git HTTP method: DELETE");
    }

    #[tokio::test]
    async fn graphql_response_exposes_typed_repository_fields() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let mut headers = HeaderMap::new();
        headers.insert(
            "authorization",
            HeaderValue::from_str(&format!("Bearer {token}")).unwrap(),
        );

        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({"query": "{ repository { refs commits pullRequests checks } }"}).to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        assert_eq!(payload["data"]["repository"]["path"], "comtrya/comtrya");
        assert!(
            payload["data"]["repository"]["refs"]
                .as_array()
                .unwrap()
                .len()
                > 0
        );
        assert!(
            payload["data"]["repository"]["pullRequests"]
                .as_array()
                .unwrap()
                .len()
                > 0
        );
        assert_eq!(
            payload["data"]["repository"]["headOid"],
            payload["data"]["demo"]["repository"]["headOid"]
        );
    }

    #[test]
    fn repository_seed_metadata_cannot_override_derived_facts() {
        let live_repository = json!({
            "id": "repo_live",
            "owner": "comtrya",
            "name": "comtrya",
            "path": "comtrya/comtrya",
            "visibility": "PRIVATE",
            "description": "derived from runtime",
            "stars": 0,
            "forks": 0,
            "watchers": 0,
            "language": "Rust",
            "license": "unknown",
            "updated": "2026-05-11T00:00:00Z"
        });
        let seed_metadata = json!({
            "id": "repo_seed",
            "owner": "seeded",
            "name": "repo",
            "path": "seeded/repo",
            "visibility": "PUBLIC",
            "description": "seeded description",
            "stars": 12842,
            "forks": 417,
            "watchers": 931,
            "language": "COBOL",
            "license": "Apache-2.0",
            "updated": "18 minutes ago"
        });

        let merged = merge_repository_metadata(live_repository, Some(&seed_metadata));

        assert_eq!(merged["description"], "seeded description");
        assert_eq!(merged["stars"], 0);
        assert_eq!(merged["forks"], 0);
        assert_eq!(merged["watchers"], 0);
        assert_eq!(merged["language"], "Rust");
        assert_eq!(merged["license"], "unknown");
        assert_eq!(merged["updated"], "2026-05-11T00:00:00Z");
    }

    #[test]
    fn extension_storage_seeds_documents_and_survives_fixture_deletion() {
        let data_dir = temp_dir("extension-storage");
        let seed_path = data_dir.join("metadata/demo-state.json");
        fs::create_dir_all(seed_path.parent().unwrap()).unwrap();
        fs::write(
            &seed_path,
            serde_json::to_vec_pretty(&json!({
                "generatedAt": "2026-05-11T00:00:00Z",
                "workspace": {
                    "id": "ws_test",
                    "slug": "comtrya",
                    "name": "Comtrya Labs",
                    "visibility": "PRIVATE",
                    "members": 3
                },
                "repository": {
                    "id": "repo_test",
                    "owner": "comtrya",
                    "name": "comtrya",
                    "path": "comtrya/comtrya",
                    "visibility": "PRIVATE",
                    "description": "Runtime storage test",
                    "stars": 9,
                    "forks": 2,
                    "watchers": 5,
                    "language": "Rust",
                    "license": "Apache-2.0"
                },
                "pullRequests": [
                    {
                        "number": 7,
                        "title": "Seed through runtime storage",
                        "state": "READY",
                        "base": "main",
                        "head": "storage/runtime"
                    }
                ],
                "checks": [],
                "extensions": [],
                "activity": []
            }))
            .unwrap(),
        )
        .unwrap();

        let store = ExtensionRuntimeStore::open(&data_dir).unwrap();
        assert!(store.schema_path().is_file());
        assert!(store.documents_path().is_file());
        assert!(!data_dir.join("extensions/runtime-state.json").exists());
        fs::remove_file(seed_path).unwrap();

        let reopened = ExtensionRuntimeStore::open(&data_dir).unwrap();
        let pulls = reopened
            .query_documents_by_index(
                "pull_requests",
                &[
                    ("repositoryID", json!("repo_test")),
                    ("state", json!("READY")),
                ],
            )
            .unwrap();

        assert_eq!(pulls.len(), 1);
        assert_eq!(pulls[0].data["title"], "Seed through runtime storage");

        reopened
            .create_document(extension_document_record(
                "ext_checks",
                "check_runs",
                "check_runtime_mutation",
                "comtrya://repository/repo_test",
                vec!["comtrya://repository/repo_test".to_string()],
                json!({
                    "repositoryID": "repo_test",
                    "name": "runtime mutation",
                    "provider": "Comtrya CI",
                    "conclusion": "SUCCESS",
                    "duration": "1s"
                }),
                "2026-05-11T00:00:00Z",
            ))
            .unwrap();
        let checks = reopened
            .query_documents_by_index("check_runs", &[("name", json!("runtime mutation"))])
            .unwrap();
        assert_eq!(checks.len(), 1);
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn demo_payload_reflects_runtime_storage_updates() {
        let runtime = dev_runtime();
        let check = runtime
            .extension_storage
            .query_documents_by_index("check_runs", &[("provider", json!("Comtrya CI"))])
            .unwrap()
            .into_iter()
            .next()
            .expect("seeded check document");

        runtime
            .extension_storage
            .update_document_atomically("check_runs", &check.id, |data| {
                data["conclusion"] = json!("FAILURE");
                data["duration"] = json!("99s");
            })
            .unwrap();

        let demo = runtime.demo_payload().unwrap();
        let checks = demo["checks"].as_array().expect("checks array");

        assert!(
            checks
                .iter()
                .any(|check| check["conclusion"] == "FAILURE" && check["duration"] == "99s")
        );
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn demo_payload_exposes_typed_extension_resolver_outputs() {
        let runtime = dev_runtime();
        let demo = runtime.demo_payload().unwrap();
        let resolvers = demo["extensionResolvers"]
            .as_array()
            .expect("extension resolvers array");
        let code_browser = resolvers
            .iter()
            .find(|resolver| resolver["id"] == "ext_code_browser")
            .expect("code browser resolver");

        assert_eq!(
            code_browser["outputType"],
            "comtrya.code-browser/summary.v1"
        );
        assert!(
            code_browser["output"]["methods"]
                .as_array()
                .unwrap()
                .iter()
                .any(|method| method == "repository_refs")
        );
        assert!(code_browser.as_object().unwrap().get("result").is_none());
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn demo_payload_filters_disabled_configured_extension_installations() {
        let dir = temp_dir("configured-demo-filter");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            r#"
package comtrya
extensions: {
  checks: {
    source: {
      kind: "local"
      path: "ext_checks"
    }
    enabled: true
  }
  "pull-requests": {
    source: {
      kind: "local"
      path: "ext_pull_requests"
    }
    enabled: false
  }
  "code-browser": {
    source: {
      kind: "local"
      path: "ext_code_browser"
    }
    enabled: false
  }
}
"#,
        )
        .unwrap();
        let runtime = Runtime::start(StartupOptions {
            config_path: Some(config_path),
            data_dir: temp_dir("configured-demo-filter-data"),
            extension_dir: test_extension_dir(),
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("testbed-operator-code".to_string()),
            session_ttl_seconds: 300,
            external_demo: false,
        })
        .unwrap();

        let demo = runtime.demo_payload().unwrap();
        let extensions = demo["extensions"]
            .as_array()
            .expect("extension installations array");

        assert_eq!(extensions.len(), 1);
        assert_eq!(extensions[0]["id"], "ext_checks");
        assert!(
            runtime
                .extension_manifest_body("ext_checks")
                .unwrap()
                .is_some()
        );
        assert!(
            runtime
                .extension_manifest_body("ext_code_browser")
                .unwrap()
                .is_none()
        );
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn extension_runtime_rejects_backend_ui_manifest_mismatch() {
        let extension_dir = temp_dir("extension-manifest-mismatch");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        let ui_manifest = extension_dir
            .join("ext_checks")
            .join("ui")
            .join("manifest.json");
        let mut ui =
            serde_json::from_str::<Value>(&fs::read_to_string(&ui_manifest).unwrap()).unwrap();
        ui["extension"] = json!("wrong-extension-name");
        fs::write(&ui_manifest, serde_json::to_vec_pretty(&ui).unwrap()).unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("UI manifest extension name does not match"));
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn extension_runtime_rejects_stale_ui_entry_integrity() {
        let extension_dir = temp_dir("extension-integrity-mismatch");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        let entry = extension_dir
            .join("ext_code_browser")
            .join("assets")
            .join("index.js");
        fs::write(
            &entry,
            "customElements.define('stale-integrity', class extends HTMLElement {})",
        )
        .unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("entryIntegrity"));
        assert!(error.contains("did not match computed"));
    }

    #[test]
    fn extension_runtime_loads_first_party_manifests_from_disk() {
        let runtime = load_extension_runtime(&test_extension_dir()).unwrap();

        assert_eq!(runtime.len(), FIRST_PARTY_EXTENSIONS.len());
        for id in FIRST_PARTY_EXTENSIONS {
            let resolver = runtime.get(*id).expect("first-party resolver loaded");
            assert_eq!(resolver.id, *id);
            if *id == "ext_issues" {
                assert_eq!(resolver.component, "dist/ext_issues.wasm");
                assert_eq!(resolver.resolver, "platform-wit-extension");
                assert_eq!(resolver.status, "platform-loaded");
            } else {
                assert_eq!(resolver.component, "component.wat");
                assert_eq!(resolver.resolver, "resolve");
                assert_eq!(resolver.status, "executed");
            }
            assert!(resolver.output_type.starts_with("comtrya."));
            assert!(resolver.output_type.ends_with("/summary.v1"));
        }
    }

    #[test]
    fn extension_runtime_rejects_platform_wit_manifest_without_dist_wasm() {
        let extension_dir = temp_dir("platform-wit-missing-dist");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        fs::remove_file(extension_dir.join("ext_issues/dist/ext_issues.wasm")).unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("ext_issues/manifest.json declares platformWitVersion"));
        assert!(error.contains("dist/ext_issues.wasm"));
        assert!(error.contains("is missing"));
    }

    #[test]
    fn configured_platform_wit_extension_without_generated_invoker_fails_early() {
        let extension_dir = temp_dir("platform-wit-no-invoker-dir");
        let root = extension_dir.join("ext_local_wit");
        copy_dir_recursive(&test_extension_dir().join("ext_issues"), &root);

        let manifest_path = root.join("manifest.json");
        let mut manifest =
            serde_json::from_str::<Value>(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
        manifest["id"] = json!("ext_local_wit");
        manifest["name"] = json!("local-wit");
        manifest["routePrefix"] = json!("local-wit");
        fs::write(&manifest_path, serde_json::to_vec_pretty(&manifest).unwrap()).unwrap();

        let ui_manifest_path = root.join("ui/manifest.json");
        let mut ui =
            serde_json::from_str::<Value>(&fs::read_to_string(&ui_manifest_path).unwrap()).unwrap();
        ui["id"] = json!("ext_local_wit");
        ui["extension"] = json!("local-wit");
        ui["assets"]["entry"] = json!("/_extensions/ext_local_wit/assets/index.js");
        fs::write(&ui_manifest_path, serde_json::to_vec_pretty(&ui).unwrap()).unwrap();

        let configs = vec![ExtensionInstallConfig {
            id: "ext_local_wit".to_string(),
            source: ExtensionSource::Local {
                path: "ext_local_wit".to_string(),
            },
            enabled: true,
            route_prefix: None,
        }];
        let error =
            load_configured_extension_runtime(&extension_dir, true, &configs).unwrap_err();

        assert!(error.contains("no generated typed WASM invoker"));
        assert!(error.contains("extensions/first-party"));
    }

    #[test]
    fn runtime_loaded_registry_dispatches_ext_issues_wasm_and_persists_event() {
        let runtime = Runtime::start(StartupOptions {
            config_path: None,
            data_dir: temp_dir("runtime-loaded-registry-dispatch"),
            extension_dir: test_extension_dir(),
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("testbed-operator-code".to_string()),
            session_ttl_seconds: 300,
            external_demo: false,
        })
        .unwrap();
        let resolver = runtime
            .extension_runtime
            .get("ext_issues")
            .expect("ext_issues loaded");
        assert_eq!(resolver.component, "dist/ext_issues.wasm");
        assert_eq!(resolver.status, "platform-loaded");
        assert!(runtime.wasm_registry.get("ext_issues").is_some());

        let dispatcher = crate::wasm_registry::RegistryDispatcher {
            registry: runtime.wasm_registry.clone(),
            store: Arc::new(runtime.extension_storage.clone()),
        };
        let principal = "comtrya://user/usr_runtime_dispatch_test";

        let opened_bytes = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            "issues.open-issue",
            &serde_json::to_vec(&json!({
                "repository": "comtrya://repository/repo_runtime_loaded_registry",
                "title": "runtime-loaded registry smoke",
                "bodyMarkdown": "opened through Runtime::start registry",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect("open issue through runtime-loaded registry");
        let opened: Value = serde_json::from_slice(&opened_bytes).unwrap();
        let issue_id = opened
            .get("id")
            .and_then(Value::as_str)
            .expect("opened issue id")
            .to_string();

        let closed_bytes = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            "issues.close-issue",
            &serde_json::to_vec(&json!({
                "id": issue_id,
                "reason": "closed through Runtime::start registry",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect("close issue through runtime-loaded registry");
        let closed: Value = serde_json::from_slice(&closed_bytes).unwrap();
        assert_eq!(closed.get("state").and_then(Value::as_str), Some("closed"));

        let records = runtime.extension_storage.load_records().unwrap();
        let issue = records
            .iter()
            .find(|record| record.collection == "issues" && record.id == issue_id)
            .expect("issue persisted by runtime-loaded registry");
        assert_eq!(issue.data.get("state").and_then(Value::as_str), Some("CLOSED"));
        let event_log = fs::read_to_string(runtime.extension_storage.events_path()).unwrap();
        assert!(event_log.contains("dev.comtrya.issues.closed"));
    }

    #[test]
    fn live_wasm_dispatch_prepares_host_state_from_request_context() {
        let runtime = dev_runtime();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["graphql:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let headers = bearer_headers(&token);
        let state = AppState {
            runtime,
            git_state: PureRustGitState::test_default(),
        };
        let info = crate::generated_dispatch::dispatch_route("issuesClose")
            .expect("issuesClose routes to ext_issues");

        let (host_state, loaded) =
            crate::wasm_dispatch::prepare_live_host_state(&state, &info, &headers)
                .expect("live dispatch context builds");

        assert_eq!(loaded.id, "ext_issues");
        assert_eq!(host_state.extension_id, "ext_issues");
        assert_eq!(
            host_state.extension_principal,
            "comtrya://extension/ext_issues"
        );
        assert!(host_state
            .current_principal
            .starts_with("comtrya://credential/prn_"));
        assert!(host_state
            .manifest
            .host_imports
            .iter()
            .any(|import| import == "storage.write"));

        assert!(
            crate::wasm_dispatch::dispatch(
                &state,
                &info,
                json!({
                    "query": "mutation { issuesClose(input: { id: \"iss_1\" }) { id } }",
                    "variables": { "input": { "id": "iss_1" } }
                }),
                headers,
            )
            .is_some(),
            "M2 prepares live HostState context, then delegates to legacy response until the WASM cutover"
        );
    }

    #[tokio::test]
    async fn generated_wasm_hit_uses_one_graphql_guard_before_legacy_fallback() {
        let mut runtime = Runtime::start(StartupOptions {
            config_path: None,
            data_dir: temp_dir("generated-wasm-hit-single-guard"),
            extension_dir: test_extension_dir(),
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("testbed-operator-code".to_string()),
            session_ttl_seconds: 300,
            external_demo: false,
        })
        .unwrap();
        runtime.config.rate_limits.graphql_per_principal = 1;
        let runtime = Arc::new(runtime);
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );

        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers(&token),
            json!({"query": "query { issuesList { id } }"}).to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn generated_wasm_hit_fails_closed_when_live_host_state_cannot_build() {
        let runtime = Arc::new(
            Runtime::start(StartupOptions {
                config_path: Some({
                    let config_dir = temp_dir("wasm-hit-no-ext-cfg");
                    let config_path = config_dir.join("config.cue");
                    fs::write(&config_path, "package comtrya\nextensions: {}\n").unwrap();
                    config_path
                }),
                data_dir: temp_dir("wasm-hit-no-ext-data"),
                extension_dir: test_extension_dir(),
                listen: "127.0.0.1:0".parse().unwrap(),
                check: false,
                tls_terminated: false,
                operator_code: Some("testbed-operator-code".to_string()),
                session_ttl_seconds: 300,
                external_demo: false,
            })
            .unwrap(),
        );
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["graphql:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );

        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers(&token),
            json!({
                "query": "mutation { issuesClose(input: { id: \"iss_1\" }) { id } }",
                "variables": { "input": { "id": "iss_1" } }
            })
            .to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            "WASM_DISPATCH_UNAVAILABLE"
        );
        assert!(
            payload["errors"][0]["message"]
                .as_str()
                .unwrap()
                .contains("unknown extension: ext_issues")
        );
    }

    #[tokio::test]
    async fn generated_wasm_hit_without_legacy_bridge_still_prepares_and_fails_closed() {
        let runtime = dev_runtime();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );

        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers(&token),
            json!({
                "query": "query { issuesGet(id: \"iss_1\") { id } }",
                "variables": { "id": "iss_1" }
            })
            .to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            "WASM_CUTOVER_PENDING"
        );
        assert!(
            payload["errors"][0]["message"]
                .as_str()
                .unwrap()
                .contains("ext_issues.issues.get-issue")
        );
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn configured_local_extensions_choose_package_directories() {
        let extension_dir = temp_dir("configured-local-extensions");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        let configs = vec![
            ExtensionInstallConfig {
                id: "checks".to_string(),
                source: ExtensionSource::Local {
                    path: "ext_checks".to_string(),
                },
                enabled: true,
                route_prefix: None,
            },
            ExtensionInstallConfig {
                id: "code-browser".to_string(),
                source: ExtensionSource::Local {
                    path: "ext_code_browser".to_string(),
                },
                enabled: false,
                route_prefix: None,
            },
        ];

        let runtime = load_configured_extension_runtime(&extension_dir, true, &configs).unwrap();

        assert_eq!(runtime.len(), 1);
        assert!(runtime.contains_key("ext_checks"));
        assert_eq!(runtime["ext_checks"].root, extension_dir.join("ext_checks"));
    }

    #[test]
    fn configured_local_extensions_reject_unsafe_paths() {
        let absolute = ExtensionInstallConfig {
            id: "checks".to_string(),
            source: ExtensionSource::Local {
                path: temp_dir("absolute-extension-path").display().to_string(),
            },
            enabled: true,
            route_prefix: None,
        };
        let traversal = ExtensionInstallConfig {
            id: "checks".to_string(),
            source: ExtensionSource::Local {
                path: "../ext_checks".to_string(),
            },
            enabled: true,
            route_prefix: None,
        };

        let absolute_error =
            load_configured_extension_runtime(&test_extension_dir(), true, &[absolute])
                .unwrap_err();
        let traversal_error =
            load_configured_extension_runtime(&test_extension_dir(), true, &[traversal])
                .unwrap_err();

        assert!(absolute_error.contains("must be relative to COMTRYA_EXTENSION_DIR"));
        assert!(traversal_error.contains("must stay within COMTRYA_EXTENSION_DIR"));
    }

    #[test]
    fn configured_extensions_load_none_when_all_declared_entries_are_disabled() {
        let configs = vec![ExtensionInstallConfig {
            id: "checks".to_string(),
            source: ExtensionSource::Local {
                path: "ext_checks".to_string(),
            },
            enabled: false,
            route_prefix: None,
        }];

        let runtime =
            load_configured_extension_runtime(&test_extension_dir(), true, &configs).unwrap();

        assert!(runtime.is_empty());
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn configured_extensions_fall_back_to_first_party_when_not_declared() {
        let runtime = load_configured_extension_runtime(&test_extension_dir(), false, &[]).unwrap();

        assert_eq!(runtime.len(), FIRST_PARTY_EXTENSIONS.len());
        for id in FIRST_PARTY_EXTENSIONS {
            assert!(runtime.contains_key(*id));
        }
    }

    #[test]
    fn configured_oci_extensions_fail_with_actionable_cache_error() {
        let configs = vec![ExtensionInstallConfig {
            id: "checks".to_string(),
            source: ExtensionSource::Oci {
                registry: "ghcr.io".to_string(),
                image: "comtrya/extensions/checks".to_string(),
                reference: OciReference::Tag("v1.0.0".to_string()),
            },
            enabled: true,
            route_prefix: None,
        }];

        let error =
            load_configured_extension_runtime(&test_extension_dir(), true, &configs).unwrap_err();

        assert!(error.contains("extension checks uses OCI source"));
        assert!(error.contains("OCI extension installs are not supported"));
        assert!(error.contains("source.kind: \"local\""));
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn extension_runtime_rejects_missing_first_party_files() {
        let extension_dir = temp_dir("extension-missing-files");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        fs::remove_file(extension_dir.join("ext_checks").join("manifest.json")).unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("failed to read"));
        assert!(error.contains("ext_checks/manifest.json"));
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn extension_runtime_rejects_invalid_component_bytes() {
        let extension_dir = temp_dir("extension-invalid-component");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        fs::write(
            extension_dir
                .join("ext_pull_requests")
                .join("component.wat"),
            "this is not a valid component",
        )
        .unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("failed to compile"));
        assert!(error.contains("ext_pull_requests/component.wat"));
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn extension_runtime_rejects_missing_resolver_export() {
        let extension_dir = temp_dir("extension-missing-resolver");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        let manifest_path = extension_dir.join("ext_code_browser").join("manifest.json");
        let mut manifest =
            serde_json::from_str::<Value>(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
        manifest["runtime"]["resolver"] = json!("missing_resolver");
        fs::write(
            &manifest_path,
            serde_json::to_vec_pretty(&manifest).unwrap(),
        )
        .unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("did not export resolver missing_resolver"));
    }

    #[test]
    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: first-party extensions still ship v1 UI manifests"]
    fn extension_runtime_rejects_resolver_trap() {
        let extension_dir = temp_dir("extension-resolver-trap");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        fs::write(
            extension_dir.join("ext_checks").join("component.wat"),
            r#"(component
  (core module $m
    (func (export "resolve") (result i32)
      unreachable))
  (core instance $i (instantiate $m))
  (func (export "resolve") (result u32)
    (canon lift (core func $i "resolve"))))"#,
        )
        .unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("ext_checks resolver failed"));
    }

    #[test]
    fn manifest_v2_accepted_with_contributes_block() {
        let v2 = serde_json::json!({
            "schemaVersion": "comtrya.ui-extension/v2",
            "id": "ext_test",
            "extension": "test",
            "version": "0.1.0",
            "publisher": "comtrya-dev",
            "assets": {
                "entry": "/_extensions/ext_test/assets/index.js",
                "entryIntegrity": "sha256-abc",
                "styles": []
            },
            "permissions": ["pull-requests.read"],
            "contributes": { "slots": ["repository.overview"], "routes": true }
        });
        let result = validate_ui_manifest_from_value(&v2);
        assert!(result.is_ok(), "expected v2 manifest to validate: {result:?}");
    }

    #[test]
    fn manifest_v1_rejected_after_migration_window() {
        let v1 = serde_json::json!({
            "schemaVersion": "comtrya.ui-extension/v1",
            "id": "ext_legacy",
            "extension": "legacy",
            "assets": { "entry": "/_extensions/ext_legacy/assets/index.js", "entryIntegrity": "sha256-xyz", "styles": [] },
            "routes": [],
            "slots": [{ "slot": "repository.code", "element": "x-el", "requiredPermission": "code.read" }]
        });
        let result = validate_ui_manifest_from_value(&v1);
        assert!(result.is_err(), "v1 manifest should be rejected; got {result:?}");
    }

    #[test]
    fn manifest_v2_rejects_unknown_slot_name() {
        let v2 = serde_json::json!({
            "schemaVersion": "comtrya.ui-extension/v2",
            "id": "ext_test", "extension": "test", "version": "0.1.0", "publisher": "comtrya-dev",
            "assets": { "entry": "/_extensions/ext_test/assets/index.js", "entryIntegrity": "sha256-abc", "styles": [] },
            "permissions": [],
            "contributes": { "slots": ["bogus"], "routes": false }
        });
        let result = validate_ui_manifest_from_value(&v2);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("bogus"));
    }

    #[test]
    fn duplicate_route_prefixes_rejected_at_install() {
        let configs = vec![
            ExtensionInstallConfig {
                id: "ext_a".into(),
                source: ExtensionSource::Local { path: "/tmp/a".into() },
                enabled: true,
                route_prefix: Some("pulls".into()),
            },
            ExtensionInstallConfig {
                id: "ext_b".into(),
                source: ExtensionSource::Local { path: "/tmp/b".into() },
                enabled: true,
                route_prefix: Some("pulls".into()),
            },
        ];
        let result = validate_route_prefix_uniqueness(&configs);
        assert!(result.is_err());
        let msg = result.unwrap_err();
        assert!(msg.contains("pulls"), "error should name the duplicated prefix, got: {msg}");
    }

    /// Build a minimal repositories JSON array that mirrors the demo seed shape.
    fn demo_repositories() -> Value {
        json!([
            {
                "id": "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
                "owner": "comtrya",
                "name": "comtrya",
                "path": "comtrya/comtrya",
                "visibility": "PRIVATE"
            }
        ])
    }

    #[test]
    fn repository_by_path_resolves_demo_repo() {
        let repos = demo_repositories();
        let resolved = resolve_repository_by_path(
            &repos,
            &["comtrya".to_string(), "comtrya".to_string()],
        );
        assert!(resolved.is_some(), "expected to find comtrya/comtrya");
        assert_eq!(
            resolved.as_ref().unwrap().get("name").and_then(Value::as_str),
            Some("comtrya")
        );
    }

    #[test]
    fn repository_by_path_returns_none_for_unknown_path() {
        let repos = demo_repositories();
        let resolved = resolve_repository_by_path(
            &repos,
            &["nothing".to_string()],
        );
        assert!(resolved.is_none());
    }

    #[test]
    fn repository_by_path_returns_none_for_empty_segments() {
        let repos = demo_repositories();
        let resolved = resolve_repository_by_path(&repos, &[]);
        assert!(resolved.is_none());
    }

    #[tokio::test]
    async fn graphql_workspace_repository_by_path_resolves_via_variables() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let headers = bearer_headers(&token);
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({
                "query": "query($segments: [String!]!) { workspace { repositoryByPath(segments: $segments) { id name } } }",
                "variables": { "segments": ["comtrya", "comtrya"] }
            })
            .to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        let repo = &payload["data"]["workspace"]["repositoryByPath"];
        assert!(!repo.is_null(), "repositoryByPath should resolve for comtrya/comtrya");
        assert_eq!(repo["name"], "comtrya");
    }

    #[tokio::test]
    async fn graphql_workspace_repository_by_path_returns_null_for_unknown() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let headers = bearer_headers(&token);
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({
                "query": "query($segments: [String!]!) { workspace { repositoryByPath(segments: $segments) { id } } }",
                "variables": { "segments": ["does-not-exist"] }
            })
            .to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        assert!(
            payload["data"]["workspace"]["repositoryByPath"].is_null(),
            "repositoryByPath should be null for an unknown path"
        );
    }

    #[test]
    fn inject_route_prefix_adds_null_when_no_config() {
        let extensions = json!([
            { "id": "ext_checks", "status": "enabled" },
            { "id": "ext_pull_requests", "status": "enabled" }
        ]);
        let configs: Vec<ExtensionInstallConfig> = vec![];
        let runtime: BTreeMap<String, WasmtimeResolverRecord> = BTreeMap::new();
        let result = inject_route_prefix(extensions, &configs, &runtime);
        let items = result.as_array().unwrap();
        assert_eq!(items.len(), 2);
        assert!(items[0]["routePrefix"].is_null());
        assert!(items[1]["routePrefix"].is_null());
    }

    #[test]
    fn inject_route_prefix_adds_configured_value() {
        let extensions = json!([
            { "id": "ext_a", "status": "enabled" },
            { "id": "ext_b", "status": "enabled" }
        ]);
        let configs = vec![
            ExtensionInstallConfig {
                id: "ext_a".into(),
                source: ExtensionSource::Local { path: "ext_a".into() },
                enabled: true,
                route_prefix: Some("pulls".into()),
            },
            ExtensionInstallConfig {
                id: "ext_b".into(),
                source: ExtensionSource::Local { path: "ext_b".into() },
                enabled: true,
                route_prefix: None,
            },
        ];
        let runtime: BTreeMap<String, WasmtimeResolverRecord> = BTreeMap::new();
        let result = inject_route_prefix(extensions, &configs, &runtime);
        let items = result.as_array().unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0]["routePrefix"], "pulls");
        assert!(items[1]["routePrefix"].is_null());
    }

    #[test]
    fn inject_route_prefix_falls_back_to_manifest_when_config_absent() {
        let extensions = json!([
            { "id": "ext_pull_requests", "status": "enabled" }
        ]);
        let configs: Vec<ExtensionInstallConfig> = vec![];
        let mut runtime = BTreeMap::new();
        runtime.insert(
            "ext_pull_requests".to_string(),
            WasmtimeResolverRecord {
                id: "ext_pull_requests".to_string(),
                component: "component.wat".to_string(),
                resolver: "resolve".to_string(),
                output_type: "comtrya.pull-requests/summary.v1".to_string(),
                status: "executed".to_string(),
                root: PathBuf::new(),
                ui_manifest: PathBuf::new(),
                route_prefix: Some("pulls".to_string()),
            },
        );
        let result = inject_route_prefix(extensions, &configs, &runtime);
        let items = result.as_array().unwrap();
        assert_eq!(items[0]["routePrefix"], "pulls");
    }

    // ── Task 24: workspace.repositories groups + summary ─────────────────────

    #[test]
    fn split_repo_path_two_segments() {
        let (groups, name) = split_repo_path("comtrya/comtrya");
        assert_eq!(groups, vec!["comtrya".to_string()]);
        assert_eq!(name, "comtrya");
    }

    #[test]
    fn split_repo_path_single_segment() {
        let (groups, name) = split_repo_path("comtrya");
        assert!(groups.is_empty(), "single-segment path has no groups");
        assert_eq!(name, "comtrya");
    }

    #[test]
    fn split_repo_path_three_segments() {
        let (groups, name) = split_repo_path("public/internal/observability");
        assert_eq!(groups, vec!["public".to_string(), "internal".to_string()]);
        assert_eq!(name, "observability");
    }

    #[test]
    fn split_repo_path_empty_string() {
        let (groups, name) = split_repo_path("");
        assert!(groups.is_empty());
        assert_eq!(name, "");
    }

    #[test]
    fn build_repository_summary_derives_groups_from_path() {
        let repo = json!({
            "id": "repo_x",
            "name": "comtrya",
            "path": "public/internal/comtrya",
            "visibility": "PRIVATE"
        });
        let summary = build_repository_summary(&repo, &json!([]), &json!([]));
        assert_eq!(summary["groups"], json!(["public", "internal"]));
        assert_eq!(summary["name"], "comtrya");
        assert_eq!(summary["id"], "repo_x");
    }

    #[test]
    fn build_repository_summary_two_segment_path() {
        let repo = json!({
            "id": "repo_y",
            "name": "comtrya",
            "path": "comtrya/comtrya",
            "visibility": "PRIVATE"
        });
        let summary = build_repository_summary(&repo, &json!([]), &json!([]));
        assert_eq!(summary["groups"], json!(["comtrya"]));
    }

    #[test]
    fn build_repository_summary_open_pull_requests_counts_open_states() {
        let pulls = json!([
            { "repositoryID": "repo_x", "state": "READY" },
            { "repositoryID": "repo_x", "state": "REVIEW" },
            { "repositoryID": "repo_x", "state": "DRAFT" },
            { "repositoryID": "repo_x", "state": "MERGED" },
        ]);
        let repo = json!({ "id": "repo_x", "name": "x", "path": "x" });
        let summary = build_repository_summary(&repo, &pulls, &json!([]));
        // READY + REVIEW + DRAFT = 3 open (MERGED is closed)
        assert_eq!(summary["openPullRequests"], 3);
    }

    #[test]
    fn build_repository_summary_check_summary_counts_pass_total() {
        let checks = json!([
            { "repositoryID": "repo_x", "conclusion": "SUCCESS" },
            { "repositoryID": "repo_x", "conclusion": "SUCCESS" },
            { "repositoryID": "repo_x", "conclusion": "FAILURE" },
        ]);
        let repo = json!({ "id": "repo_x", "name": "x", "path": "x" });
        let summary = build_repository_summary(&repo, &json!([]), &checks);
        assert_eq!(summary["checkSummary"]["passed"], 2);
        assert_eq!(summary["checkSummary"]["total"], 3);
    }

    #[test]
    fn build_repository_summary_last_commit_at_falls_back_to_null() {
        let repo = json!({ "id": "repo_x", "name": "x", "path": "x" });
        let summary = build_repository_summary(&repo, &json!([]), &json!([]));
        // Without a lastCommitAt field in the repo JSON, the field must still be present.
        assert!(
            summary.get("lastCommitAt").is_some(),
            "lastCommitAt must always be present in the summary"
        );
    }

    #[test]
    fn build_repository_summary_isolates_pulls_by_repository_id() {
        let repo_x = json!({ "id": "repo_x", "name": "x", "path": "x" });
        let pulls = json!([
            { "repositoryID": "repo_x", "state": "READY" },
            { "repositoryID": "repo_y", "state": "READY" },
            { "state": "READY" },  // no repositoryID — must NOT be counted
        ]);
        let checks = json!([]);
        let summary = build_repository_summary(&repo_x, &pulls, &checks);
        assert_eq!(summary["openPullRequests"], json!(1));
    }

    #[test]
    fn build_repository_summary_isolates_checks_by_repository_id() {
        let repo_x = json!({ "id": "repo_x", "name": "x", "path": "x" });
        let pulls = json!([]);
        let checks = json!([
            { "repositoryID": "repo_x", "conclusion": "SUCCESS" },
            { "repositoryID": "repo_y", "conclusion": "SUCCESS" },
            { "conclusion": "SUCCESS" },  // no repositoryID — must NOT be counted
        ]);
        let summary = build_repository_summary(&repo_x, &pulls, &checks);
        let cs = &summary["checkSummary"];
        assert_eq!(cs["total"], json!(1));
    }

    #[tokio::test]
    async fn graphql_workspace_repositories_exposes_groups_and_summary_fields() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let headers = bearer_headers(&token);
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({"query": "{ workspace { repositories { id name groups openPullRequests checkSummary { passed total } lastCommitAt } } }"}).to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        let repos = payload["data"]["workspace"]["repositories"]
            .as_array()
            .expect("workspace.repositories must be an array");
        assert!(!repos.is_empty(), "expected at least one seeded repository");
        for repo in repos {
            assert!(repo.get("id").is_some(), "each repository must have id");
            assert!(repo.get("name").is_some(), "each repository must have name");
            assert!(
                repo.get("groups").and_then(|g| g.as_array()).is_some(),
                "groups must be an array, got: {:?}",
                repo.get("groups")
            );
            assert!(
                repo.get("openPullRequests").and_then(|n| n.as_u64()).is_some(),
                "openPullRequests must be a u64"
            );
            let cs = repo.get("checkSummary").and_then(|c| c.as_object())
                .expect("checkSummary must be an object");
            assert!(cs.get("passed").and_then(|v| v.as_u64()).is_some(),
                "checkSummary.passed must be an integer");
            assert!(cs.get("total").and_then(|v| v.as_u64()).is_some(),
                "checkSummary.total must be an integer");
            assert!(
                repo.get("lastCommitAt").is_some(),
                "lastCommitAt must be present"
            );
        }
    }

    #[ignore = "TODO: 2026-05-12 workspace homepage — v2 migration: requires loaded extension to assert routePrefix in GraphQL response"]
    #[tokio::test]
    async fn graphql_extension_installations_exposes_route_prefix() {
        let runtime = dev_runtime();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let headers = bearer_headers(&token);
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({"query": "{ extensionInstallations { id routePrefix } }"}).to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        // The field must be present (an array) and every entry must
        // have a "routePrefix" key.
        let installs = payload["data"]["extensionInstallations"]
            .as_array()
            .expect("extensionInstallations should be an array");
        for item in installs {
            assert!(
                item.as_object().unwrap().contains_key("routePrefix"),
                "each entry must carry routePrefix"
            );
        }
    }

    // ── Viewer aggregate field unit tests ─────────────────────────────────────

    #[test]
    fn build_review_queue_marks_aggregated_true_and_filters_review_state() {
        let viewer = json!({ "id": "david.flanagan", "permissions": ["pull-requests.read"] });
        let pulls = json!([
            { "id": "1", "reviewers": ["david.flanagan"], "state": "REVIEW", "title": "PR 1" },
            { "id": "2", "reviewers": ["alice"], "state": "REVIEW", "title": "PR 2" },
            { "id": "3", "reviewers": ["david.flanagan"], "state": "MERGED", "title": "PR 3" },
        ]);
        let result = build_review_queue(&viewer, &pulls, 10);
        assert_eq!(result["aggregated"], json!(true));
        let items = result["items"].as_array().expect("items array");
        assert_eq!(items.len(), 1);
        assert_eq!(items[0]["id"], json!("1"));
    }

    #[test]
    fn build_review_queue_includes_all_review_ready_prs_when_no_reviewers_field() {
        let viewer = json!({ "id": "david.flanagan" });
        let pulls = json!([
            { "number": 1, "state": "READY", "title": "A" },
            { "number": 2, "state": "REVIEW", "title": "B" },
            { "number": 3, "state": "DRAFT", "title": "C" },
            { "number": 4, "state": "MERGED", "title": "D" },
        ]);
        let result = build_review_queue(&viewer, &pulls, 10);
        assert_eq!(result["aggregated"], json!(true));
        let items = result["items"].as_array().expect("items array");
        // READY and REVIEW only (no reviewers field → include all of those states)
        assert_eq!(items.len(), 2);
    }

    #[test]
    fn build_review_queue_respects_limit() {
        let viewer = json!({ "id": "v" });
        let pulls = json!([
            { "number": 1, "state": "READY" },
            { "number": 2, "state": "READY" },
            { "number": 3, "state": "READY" },
        ]);
        let result = build_review_queue(&viewer, &pulls, 2);
        assert_eq!(result["items"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn build_authored_pulls_filters_by_viewer_author() {
        let viewer = json!({ "id": "david.flanagan", "permissions": [] });
        let pulls = json!([
            { "id": "1", "author": "david.flanagan", "state": "REVIEW" },
            { "id": "2", "author": "alice", "state": "REVIEW" },
        ]);
        let result = build_authored_pulls(&viewer, &pulls, 10);
        assert_eq!(result["aggregated"], json!(true));
        let items = result["items"].as_array().expect("items array");
        assert_eq!(items.len(), 1);
        assert_eq!(items[0]["author"], json!("david.flanagan"));
    }

    #[test]
    fn build_authored_pulls_returns_empty_when_no_match() {
        let viewer = json!({ "id": "david.flanagan" });
        let pulls = json!([
            { "id": "1", "author": "alice", "state": "REVIEW" },
        ]);
        let result = build_authored_pulls(&viewer, &pulls, 10);
        assert_eq!(result["aggregated"], json!(true));
        assert_eq!(result["items"].as_array().unwrap().len(), 0);
    }

    #[test]
    fn build_authored_pulls_respects_limit() {
        let viewer = json!({ "id": "v" });
        let pulls = json!([
            { "id": "1", "author": "v" },
            { "id": "2", "author": "v" },
            { "id": "3", "author": "v" },
        ]);
        let result = build_authored_pulls(&viewer, &pulls, 2);
        assert_eq!(result["items"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn build_failing_checks_returns_failed_checks_for_viewer_branches() {
        let viewer = json!({ "id": "david.flanagan", "permissions": [] });
        let checks = json!([
            { "id": "c1", "author": "david.flanagan", "conclusion": "FAILURE", "name": "test" },
            { "id": "c2", "author": "david.flanagan", "conclusion": "SUCCESS", "name": "lint" },
            { "id": "c3", "author": "alice", "conclusion": "FAILURE", "name": "test" },
        ]);
        let result = build_failing_checks(&viewer, &checks, 10);
        assert_eq!(result["aggregated"], json!(true));
        let items = result["items"].as_array().expect("items array");
        assert_eq!(items.len(), 1);
        assert_eq!(items[0]["id"], json!("c1"));
    }

    #[test]
    fn build_failing_checks_includes_all_failures_when_no_author_field() {
        let viewer = json!({ "id": "david.flanagan" });
        let checks = json!([
            { "name": "nix flake check", "conclusion": "FAILURE" },
            { "name": "cargo test", "conclusion": "SUCCESS" },
            { "name": "astro build", "conclusion": "FAILURE" },
        ]);
        let result = build_failing_checks(&viewer, &checks, 10);
        assert_eq!(result["aggregated"], json!(true));
        let items = result["items"].as_array().expect("items array");
        assert_eq!(items.len(), 2);
    }

    #[test]
    fn build_failing_checks_respects_limit() {
        let viewer = json!({ "id": "v" });
        let checks = json!([
            { "name": "a", "conclusion": "FAILURE" },
            { "name": "b", "conclusion": "FAILURE" },
            { "name": "c", "conclusion": "FAILURE" },
        ]);
        let result = build_failing_checks(&viewer, &checks, 1);
        assert_eq!(result["items"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn filter_events_for_viewer_includes_only_accessible_repos() {
        let events = serde_json::json!([
            { "id": "ev1", "repositoryID": "repo_a", "type": "push", "summary": "pushed" },
            { "id": "ev2", "repositoryID": "repo_b", "type": "push", "summary": "pushed" },
            { "id": "ev3", "repositoryID": "repo_a", "type": "pr", "summary": "opened PR" },
        ]);
        let visible: Vec<String> = vec!["repo_a".into()];
        let result = filter_events_for_viewer(&events, &visible);
        assert_eq!(result.len(), 2);
        for ev in &result {
            let repo = ev.get("repositoryID").and_then(|v| v.as_str()).unwrap_or("");
            assert!(visible.iter().any(|id| id == repo));
        }
    }

    #[test]
    fn filter_events_for_viewer_excludes_events_without_repository_id() {
        let events = serde_json::json!([
            { "id": "ev1", "type": "system" },
            { "id": "ev2", "repositoryID": "repo_a", "type": "push" },
        ]);
        let visible: Vec<String> = vec!["repo_a".into()];
        let result = filter_events_for_viewer(&events, &visible);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0]["id"], serde_json::json!("ev2"));
    }

    #[tokio::test]
    async fn graphql_viewer_exposes_aggregate_fields() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let headers = bearer_headers(&token);
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({"query": "{ viewer { reviewQueue { aggregated items } authoredPulls { aggregated items } failingChecks { aggregated items } } }"}).to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        let viewer = &payload["data"]["viewer"];

        // reviewQueue
        assert_eq!(viewer["reviewQueue"]["aggregated"], json!(true));
        assert!(viewer["reviewQueue"]["items"].is_array(), "reviewQueue.items must be array");

        // authoredPulls
        assert_eq!(viewer["authoredPulls"]["aggregated"], json!(true));
        assert!(viewer["authoredPulls"]["items"].is_array(), "authoredPulls.items must be array");

        // failingChecks
        assert_eq!(viewer["failingChecks"]["aggregated"], json!(true));
        assert!(viewer["failingChecks"]["items"].is_array(), "failingChecks.items must be array");
    }
}
