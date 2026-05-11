use axum::body::{Body, Bytes};
use axum::extract::{Path as AxumPath, Query, RawQuery, State};
use axum::http::header::{CACHE_CONTROL, CONTENT_SECURITY_POLICY, ETAG};
use axum::http::{HeaderMap, HeaderName, HeaderValue, Method, StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use axum::routing::{any, get, options, post};
use axum::{Json, Router};
use comtrya_core::{
    ClientKind, CorsPolicy, DatabaseConfig, Environment, ErrorCode, ExtensionInstallConfig,
    ExtensionSource, InstanceCapabilities, InstanceConfig, OciReference, RepoStorageBackend,
    ResourceRef, TokenAction, allowed_methods_for_route,
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
        let extension_runtime = load_configured_extension_runtime(
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
        let repository = self
            .extension_storage
            .single_document_data("repositories")?;
        let git = self.git_snapshot()?;
        let repository = merge_repository_metadata(git.repository.clone(), repository.as_ref());
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
        let Some(token) = headers
            .get("authorization")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
        else {
            return PrincipalStatus::Anonymous;
        };

        let credentials = self
            .credentials
            .lock()
            .expect("credential lock not poisoned");
        if let Some(credential) = credentials.get(token) {
            if credential.expires_at > now_seconds() {
                return credential.principal;
            }
        }

        PrincipalStatus::Invalid
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
        self.credentials
            .lock()
            .expect("credential lock not poisoned")
            .insert(
                token.clone(),
                CredentialRecord {
                    actions: actions.clone(),
                    principal,
                    expires_at: now_seconds() + 300,
                },
            );
        let _ = self.append_event(
            "dev.comtrya.auth.credential.issued",
            json!({"resource": resource, "scope": actions}),
        );
        token
    }

    fn next_token(&self, prefix: &str) -> String {
        let counter = self.token_counter.fetch_add(1, Ordering::Relaxed);
        format!("{prefix}_{}_{}", now_seconds(), counter)
    }

    fn append_event(&self, event_type: &str, data: Value) -> std::io::Result<()> {
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
enum PrincipalStatus {
    Anonymous,
    OperatorCredential,
    Credential,
    Invalid,
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
    graphql_response(state, headers, payload)
}

fn graphql_response(state: AppState, headers: HeaderMap, _payload: Value) -> Response {
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
    json_response(
        StatusCode::OK,
        json!({
            "data": {
                "viewer": {
                    "authenticated": principal != PrincipalStatus::Anonymous,
                    "permissions": if principal == PrincipalStatus::OperatorCredential {
                        vec![
                            "instance.admin",
                            "graphql:read",
                            "graphql:write",
                            "events:read",
                            "git:read",
                            "checks:read",
                        ]
                    } else {
                        Vec::<&str>::new()
                    }
                },
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
                "workspace": demo.get("workspace").cloned().unwrap_or_else(|| json!(null)),
                "repository": repository,
                "extensionInstallations": demo.get("extensions").cloned().unwrap_or_else(|| json!([])),
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
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/_extensions/ext_01hv/manifest.json")
    {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    if let Err(response) = extension_asset_principal(&state, &headers, query.get("session")) {
        return response;
    }
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
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/_extensions/ext_01hv/assets/index.js")
    {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    if let Err(response) = extension_asset_principal(&state, &headers, query.get("session")) {
        return response;
    }
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
    if path.contains("..") || !path.starts_with(&state.runtime.demo_repository.http_path) {
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

fn extension_asset_principal(
    state: &AppState,
    headers: &HeaderMap,
    session: Option<&String>,
) -> Result<PrincipalStatus, Response> {
    let principal = if let Some(session) = session {
        state.runtime.consume_session(session)?
    } else {
        state.runtime.principal_from_headers(headers)
    };
    if matches!(
        principal,
        PrincipalStatus::OperatorCredential | PrincipalStatus::Credential
    ) {
        Ok(principal)
    } else {
        Err(error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "extension assets require a bearer token or single-use asset session",
        ))
    }
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

const FIRST_PARTY_EXTENSIONS: &[&str] = &["ext_pull_requests", "ext_code_browser", "ext_checks"];
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

fn git_tree(git_dir: &Path) -> Result<(Vec<Value>, Vec<Value>, Vec<Value>), String> {
    let output = git_bytes(git_dir, &["ls-tree", "-r", "-z", "--long", "main"])?;
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
            git_text(git_dir, &["show", &format!("main:{path}")])
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

const EXTENSION_STORAGE_SCHEMA_VERSION: &str = "comtrya.extension-storage/v1";
const EXTENSION_STORAGE_MIGRATIONS: &[&str] = &["001_extension_documents"];

#[derive(Debug, Clone)]
struct ExtensionRuntimeStore {
    root: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExtensionDocumentRecord {
    schema_version: String,
    owner_extension: String,
    collection: String,
    id: String,
    resource: String,
    resource_refs: Vec<String>,
    visibility: String,
    indexed_fields: BTreeMap<String, Value>,
    version: u64,
    updated_at: String,
    data: Value,
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

    fn events_path(&self) -> PathBuf {
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

    fn create_document(&self, record: ExtensionDocumentRecord) -> Result<(), String> {
        let mut records = self.load_records()?;
        if records
            .iter()
            .any(|existing| existing.collection == record.collection && existing.id == record.id)
        {
            return Err(format!(
                "extension document already exists: {}/{}",
                record.collection, record.id
            ));
        }
        records.push(record);
        self.write_records_atomically(&records)
    }

    #[allow(dead_code)]
    fn update_document_atomically(
        &self,
        collection: &str,
        id: &str,
        update: impl FnOnce(&mut Value),
    ) -> Result<(), String> {
        let mut records = self.load_records()?;
        let version = {
            let Some(record) = records
                .iter_mut()
                .find(|record| record.collection == collection && record.id == id)
            else {
                return Err(format!("extension document not found: {collection}/{id}"));
            };
            update(&mut record.data);
            record.version += 1;
            record.updated_at = now_seconds().to_string();
            record.version
        };
        self.write_records_atomically(&records)?;
        self.append_storage_event(
            "dev.comtrya.extension_storage.document_updated",
            json!({"collection": collection, "id": id, "version": version}),
        )
    }

    fn load_records(&self) -> Result<Vec<ExtensionDocumentRecord>, String> {
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

    fn append_storage_event(&self, event_type: &str, data: Value) -> Result<(), String> {
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
    let ui_manifest = serde_json::from_str::<Value>(&ui_source)
        .map_err(|error| format!("failed to parse {}: {error}", ui_manifest_path.display()))?;
    if ui_manifest.get("schemaVersion").and_then(Value::as_str) != Some("comtrya.ui-extension/v1") {
        return Err(format!("{id} UI manifest has unsupported schemaVersion"));
    }
    if ui_manifest.get("id").and_then(Value::as_str) != Some(id) {
        return Err(format!(
            "{id} UI manifest id does not match backend manifest"
        ));
    }
    if ui_manifest.get("extension").and_then(Value::as_str) != Some(name) {
        return Err(format!(
            "{id} UI manifest extension name does not match backend manifest"
        ));
    }
    let entry = ui_manifest
        .pointer("/assets/entry")
        .and_then(Value::as_str)
        .ok_or_else(|| format!("{id} UI manifest missing assets.entry"))?;
    let expected_prefix = format!("/_extensions/{id}/assets/");
    if !entry.starts_with(&expected_prefix) {
        return Err(format!(
            "{id} UI entry must be served from {expected_prefix}"
        ));
    }
    let entry_rel = entry.trim_start_matches(&expected_prefix);
    if entry_rel.is_empty()
        || entry_rel.contains("..")
        || !root.join("assets").join(entry_rel).is_file()
    {
        return Err(format!("{id} UI entry asset was not found"));
    }
    let entry_integrity = ui_manifest
        .pointer("/assets/entryIntegrity")
        .and_then(Value::as_str)
        .ok_or_else(|| format!("{id} UI manifest missing assets.entryIntegrity"))?;
    let entry_body = fs::read(root.join("assets").join(entry_rel))
        .map_err(|error| format!("failed to read {id} UI entry asset: {error}"))?;
    let expected_integrity = asset_integrity(&entry_body);
    if entry_integrity != expected_integrity {
        return Err(format!(
            "{id} UI entryIntegrity {entry_integrity} did not match computed {expected_integrity}"
        ));
    }
    if ui_manifest
        .get("routes")
        .and_then(Value::as_array)
        .is_none_or(Vec::is_empty)
    {
        return Err(format!("{id} UI manifest must declare at least one route"));
    }
    if ui_manifest
        .get("slots")
        .and_then(Value::as_array)
        .is_none_or(Vec::is_empty)
    {
        return Err(format!("{id} UI manifest must declare at least one slot"));
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

#[derive(Debug, Clone)]
struct ExtensionPackageRoot {
    configured_id: String,
    root: PathBuf,
}

fn load_extension_runtime(
    extension_dir: &Path,
) -> Result<BTreeMap<String, WasmtimeResolverRecord>, String> {
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
) -> Result<BTreeMap<String, WasmtimeResolverRecord>, String> {
    if !extension_config_declared {
        return load_extension_runtime(extension_dir);
    }
    let enabled = configs
        .iter()
        .filter(|config| config.enabled)
        .collect::<Vec<_>>();
    if enabled.is_empty() {
        return Ok(BTreeMap::new());
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
) -> Result<BTreeMap<String, WasmtimeResolverRecord>, String> {
    let engine = Engine::default();
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
        let component_name = manifest
            .get("wasmComponent")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{} missing wasmComponent", manifest_path.display()))?;
        let resolver = manifest
            .pointer("/runtime/resolver")
            .and_then(Value::as_str)
            .unwrap_or("resolve");
        let output_type = manifest
            .pointer("/runtime/outputType")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{} missing runtime.outputType", manifest_path.display()))?;
        let component_path = root.join(component_name);
        let component_bytes = fs::read(&component_path)
            .map_err(|error| format!("failed to read {}: {error}", component_path.display()))?;
        let component = Component::new(&engine, component_bytes)
            .map_err(|error| format!("failed to compile {}: {error}", component_path.display()))?;
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
            .map_err(|error| format!("{id} did not export resolver {resolver}: {error}"))?;
        let _ = func
            .call(&mut store, ())
            .map_err(|error| format!("{id} resolver failed: {error}"))?;
        if loaded
            .insert(
                id.to_string(),
                WasmtimeResolverRecord {
                    id: id.to_string(),
                    component: component_name.to_string(),
                    resolver: resolver.to_string(),
                    output_type: output_type.to_string(),
                    status: "executed".to_string(),
                    root,
                    ui_manifest,
                },
            )
            .is_some()
        {
            return Err(format!("duplicate extension package id {id}"));
        }
    }
    Ok(loaded)
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
        let Some((key, colon_index)) = cue_next_key_colon(source, offset) else {
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

fn cue_next_key_colon(source: &str, offset: usize) -> Option<(String, usize)> {
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
                        return Some((rest[..relative].to_string(), key_start + colon_relative));
                    }
                    break;
                }
            }
        } else {
            let colon_relative = trimmed.find(':')?;
            let key = trimmed[..colon_relative].trim();
            if !key.is_empty() && key.chars().all(|ch| cue_identifier_char(Some(ch))) {
                return Some((key.to_string(), key_start + colon_relative));
            }
        }
        absolute_offset += line.len();
    }
    None
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
            runtime: dev_runtime(),
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
            runtime: dev_runtime(),
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
            runtime: dev_runtime(),
            git_state: PureRustGitState::test_default(),
        };
        let mut headers = HeaderMap::new();
        headers.insert("origin", HeaderValue::from_static("https://evil.example"));
        let response = graphql_get(State(state), headers).await;

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn session_token_is_single_use_for_events() {
        let runtime = dev_runtime();
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
    async fn extension_assets_use_content_hash_cache_headers() {
        let runtime = dev_runtime();
        let session = runtime.issue_session(PrincipalStatus::OperatorCredential);
        let mut query = HashMap::new();
        query.insert("session".to_string(), session);

        let response = extension_asset(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath(("ext_code_browser".to_string(), "index.js".to_string())),
            HeaderMap::new(),
            Query(query),
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
        let runtime = dev_runtime_with_session_ttl(0);
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
        let runtime = dev_runtime();
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
        let runtime = dev_runtime();
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
        let runtime = dev_runtime();
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
        let runtime = dev_runtime();
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
        let runtime = dev_runtime();
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
        let runtime = dev_runtime();
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
            assert_eq!(resolver.component, "component.wat");
            assert_eq!(resolver.resolver, "resolve");
            assert_eq!(resolver.status, "executed");
            assert!(resolver.output_type.starts_with("comtrya."));
            assert!(resolver.output_type.ends_with("/summary.v1"));
        }
    }

    #[test]
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
            },
            ExtensionInstallConfig {
                id: "code-browser".to_string(),
                source: ExtensionSource::Local {
                    path: "ext_code_browser".to_string(),
                },
                enabled: false,
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
        };
        let traversal = ExtensionInstallConfig {
            id: "checks".to_string(),
            source: ExtensionSource::Local {
                path: "../ext_checks".to_string(),
            },
            enabled: true,
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
        }];

        let runtime =
            load_configured_extension_runtime(&test_extension_dir(), true, &configs).unwrap();

        assert!(runtime.is_empty());
    }

    #[test]
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
        }];

        let error =
            load_configured_extension_runtime(&test_extension_dir(), true, &configs).unwrap_err();

        assert!(error.contains("extension checks uses OCI source"));
        assert!(error.contains("OCI extension installs are not supported"));
        assert!(error.contains("source.kind: \"local\""));
    }

    #[test]
    fn extension_runtime_rejects_missing_first_party_files() {
        let extension_dir = temp_dir("extension-missing-files");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        fs::remove_file(extension_dir.join("ext_checks").join("manifest.json")).unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("failed to read"));
        assert!(error.contains("ext_checks/manifest.json"));
    }

    #[test]
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
}
