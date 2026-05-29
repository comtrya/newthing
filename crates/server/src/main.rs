// comtrya-server uses `tokio::signal::unix` for SIGTERM handling and
// transitively depends on cuengine's cgo bridge — neither is supported
// on Windows. Fail fast rather than silently assume a Unix dev host.
#[cfg(not(unix))]
compile_error!("comtrya-server requires a Unix target (uses tokio::signal::unix and cuengine cgo)");

use axum::body::{Body, Bytes};
use axum::extract::{Path as AxumPath, Query, RawQuery, State};
use axum::http::header::{CACHE_CONTROL, CONTENT_SECURITY_POLICY, ETAG};
use axum::http::{HeaderMap, HeaderValue, Method, StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use axum::routing::{any, get, options, post};
use axum::{Json, Router};
use comtrya_core::{
    ClientKind, CorsPolicy, Environment, ErrorCode, ExtensionInstallConfig, ExtensionSource,
    IdPrefix, InstanceCapabilities, InstanceConfig, OciReference, OpaqueId, RepoStorageBackend,
    ResourceKind, ResourceRef, Slug, TokenAction, allowed_methods_for_route,
};
use comtrya_git_http::{GitHttpState, RepositoryProvider, v2 as git_v2};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fs::{self, OpenOptions};
use std::future::IntoFuture;
use std::io::{Read, Write};
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use subtle::ConstantTimeEq;
use tokio::sync::Semaphore;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::set_header::SetResponseHeaderLayer;

mod config_sync;
mod cue_config;
mod oidc;
mod persistence;
mod reconcile;
mod wasm_host;
mod wasm_invokers;
mod wasm_registry;

/// Build-script-generated extension dispatch table. Maps the
/// `<extension-id>.<interface>.<op>` WIT routes to `DispatchInfo`
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
            project_root: runtime.repository_root(),
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

/// Initialize the process-wide tracing subscriber. Respects `RUST_LOG`
/// (default `info`); switches to JSON-Lines output to stderr when
/// `COMTRYA_LOG_FORMAT=json`, otherwise compact human-readable. Must
/// be called exactly once, before any `tracing::*!` macro fires.
fn init_tracing() {
    use tracing_subscriber::{EnvFilter, fmt, prelude::*};

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let json_format = std::env::var("COMTRYA_LOG_FORMAT")
        .map(|v| v == "json")
        .unwrap_or(false);
    let registry = tracing_subscriber::registry().with(filter);
    let result = if json_format {
        registry
            .with(fmt::layer().json().with_writer(std::io::stderr))
            .try_init()
    } else {
        registry
            .with(fmt::layer().compact().with_writer(std::io::stderr))
            .try_init()
    };
    result.expect("install tracing subscriber");
}

/// Upper bound on how long the server waits for in-flight requests to
/// drain after SIGTERM/SIGINT before tearing down the listener. Matches
/// Kubernetes' default `terminationGracePeriodSeconds=30` so the
/// orchestrator's SIGKILL doesn't pre-empt our own drain.
const SHUTDOWN_DRAIN_TIMEOUT: Duration = Duration::from_secs(30);

#[tokio::main]
async fn main() {
    init_tracing();

    let options = StartupOptions::from_env_and_args(std::env::args().skip(1));

    // Install the SIGTERM listener BEFORE the long synchronous
    // Runtime::start (Wasmtime compile + extension load). The kernel-
    // level sigaction is registered here; signals arriving while
    // Runtime::start is still running buffer in the signal self-pipe
    // and are dequeued on the first poll of shutdown_signal().
    //
    // Requires the tokio runtime to exist (provided by #[tokio::main]).
    let sigterm = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        .expect("install SIGTERM handler");

    let runtime = match Runtime::start(options) {
        Ok(runtime) => Arc::new(runtime),
        Err(error) => {
            tracing::error!(%error, "comtrya-server refused to start");
            std::process::exit(1);
        }
    };

    if runtime.options.check {
        let ready = runtime.readiness();
        tracing::info!(
            ready = ready.ready,
            mode = %ready.mode,
            data_dir = %runtime.data_dir.display(),
            "readiness check complete"
        );
        if !ready.ready {
            std::process::exit(1);
        }
        return;
    }

    // Clone the JSONL paths off Runtime before the Arc moves into AppState
    // so the post-shutdown fsync can reach them.
    let events_path = runtime.events_path.clone();
    let audit_path = runtime.audit_path.clone();

    let listen = runtime.options.listen;
    let git_state = PureRustGitState::from_runtime(&runtime);

    // Background sweep of expired sessions / credentials / stale
    // rate-limit rows. Runs every 30s; cheap because the indexes on
    // expires_at make each scan O(log n + matched). Lazy lookup
    // already ignores stale rows, so this is a memory-bounding sweep
    // rather than a correctness gate.
    let eviction_runtime = Arc::clone(&runtime);
    let eviction_handle = tokio::spawn(async move {
        let mut tick = tokio::time::interval(std::time::Duration::from_secs(30));
        tick.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        loop {
            tick.tick().await;
            // 120s keep window for rate-limit rows — we only care
            // about the current and previous minute slot.
            match eviction_runtime.store.evict_expired(now_seconds(), 120) {
                Ok((s, c, r)) if s + c + r > 0 => {
                    tracing::debug!(
                        sessions = s,
                        credentials = c,
                        rate_limits = r,
                        "evicted expired rows"
                    );
                }
                Ok(_) => {}
                Err(error) => tracing::warn!(%error, "auth-store eviction failed"),
            }
        }
    });

    // Background GitOps config sync. Fast-forwards the config repo on an
    // interval (default 15m); on change it re-evaluates so validation errors
    // surface in the sync status. Applying the new config live is the
    // reconciler's job (later phase). Unconfigured instances no-op.
    let sync_runtime = Arc::clone(&runtime);
    let sync_handle = tokio::spawn(async move {
        let interval_seconds = sync_runtime
            .config_sync_status
            .lock()
            .expect("config sync status lock")
            .interval_seconds;
        let mut tick = tokio::time::interval(std::time::Duration::from_secs(interval_seconds));
        tick.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        // The first tick fires immediately; startup already synced, so drop it.
        tick.tick().await;
        loop {
            tick.tick().await;
            let data_dir = sync_runtime.data_dir.clone();
            let result = tokio::task::spawn_blocking(move || {
                config_sync::ConfigRepo::from_env(&data_dir)
                    .map(|repo| repo.poll())
                    .transpose()
            })
            .await;
            match result {
                Ok(Ok(Some(config_sync::SyncPoll::Changed { commit, config }))) => {
                    reconcile::reconcile_live(&sync_runtime, &config);
                    sync_runtime
                        .config_sync_status
                        .lock()
                        .expect("config sync status lock")
                        .record_synced(commit.clone(), now_seconds());
                    tracing::info!(commit = %commit, "config repo changed; reconciled live");
                }
                Ok(Ok(Some(config_sync::SyncPoll::Unchanged { commit }))) => {
                    sync_runtime
                        .config_sync_status
                        .lock()
                        .expect("config sync status lock")
                        .record_synced(commit, now_seconds());
                }
                Ok(Ok(None)) => {}
                Ok(Err(error)) => {
                    sync_runtime
                        .config_sync_status
                        .lock()
                        .expect("config sync status lock")
                        .record_error(error.clone(), now_seconds());
                    tracing::warn!(%error, "config repo sync failed");
                }
                Err(join) => tracing::warn!(%join, "config sync task panicked"),
            }
        }
    });

    let app = router(AppState { runtime, git_state });
    let listener = tokio::net::TcpListener::bind(listen)
        .await
        .unwrap_or_else(|error| {
            tracing::error!(?error, %listen, "failed to bind listener");
            std::process::exit(1);
        });
    tracing::info!(
        address = %listener.local_addr().expect("listener has local addr"),
        "server listening"
    );

    // Bounded drain: once shutdown_signal resolves, axum stops accepting and
    // lets in-flight handlers finish. The 30s cap applies ONLY to that drain —
    // it must NOT wrap the whole serve future, or the server would self-
    // terminate 30s after startup. The timer starts when the signal fires (via
    // the Notify) so a stuck/slow client cannot block exit indefinitely. 30s
    // matches the k8s default `terminationGracePeriodSeconds`.
    let drain_started = Arc::new(tokio::sync::Notify::new());
    let signal_notify = Arc::clone(&drain_started);
    let serve = axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            shutdown_signal(sigterm).await;
            signal_notify.notify_one();
        })
        .into_future();
    tokio::pin!(serve);
    tokio::select! {
        result = &mut serve => {
            if let Err(error) = result {
                tracing::error!(%error, "graceful shutdown: serve error");
            }
        }
        _ = async {
            drain_started.notified().await;
            tokio::time::sleep(SHUTDOWN_DRAIN_TIMEOUT).await;
        } => {
            tracing::warn!(
                timeout_seconds = SHUTDOWN_DRAIN_TIMEOUT.as_secs(),
                "graceful shutdown: drain timeout exceeded; aborting in-flight"
            );
        }
    }

    eviction_handle.abort();
    sync_handle.abort();
    tracing::info!("graceful shutdown: draining complete; flushing logs");
    if let Err(error) = fsync_jsonl_path(&events_path) {
        tracing::error!(%error, path = ?events_path, "graceful shutdown: events.jsonl fsync failed");
    }
    if let Err(error) = fsync_jsonl_path(&audit_path) {
        tracing::error!(%error, path = ?audit_path, "graceful shutdown: audit.jsonl fsync failed");
    }
}

/// Resolves on the first of SIGINT or SIGTERM. axum's
/// `with_graceful_shutdown` requires `Future<Output = ()>`, so both
/// `select!` arms discard their values and the function falls through
/// to the unit return.
async fn shutdown_signal(mut sigterm: tokio::signal::unix::Signal) {
    tokio::select! {
        ctrlc = tokio::signal::ctrl_c() => {
            if let Err(error) = ctrlc {
                tracing::error!(%error, "graceful shutdown: ctrl_c handler failed");
            }
            tracing::info!("graceful shutdown: SIGINT received");
        }
        _ = sigterm.recv() => {
            tracing::info!("graceful shutdown: SIGTERM received");
        }
    }
}

// Per-route request body size caps. Applied via tower-http's
// `RequestBodyLimitLayer`, which rejects with HTTP 413 at the network
// layer — before any handler runs and regardless of whether the
// handler extracts a body. The limits below match each route's
// realistic ceiling, narrowing axum's implicit 2 MiB default to the
// smallest cap that still admits legitimate traffic (#4 P1-6).
const GRAPHQL_BODY_LIMIT: usize = 256 * 1024;
const OPS_BODY_LIMIT: usize = 1024 * 1024;
const SESSION_BODY_LIMIT: usize = 4 * 1024;
const GIT_BODY_LIMIT: usize = 16 * 1024 * 1024;
const ACCOUNT_TOKEN_BODY_LIMIT: usize = 16 * 1024;
const COMTRYA_SESSION_COOKIE: &str = "comtrya_session";
const OIDC_BROWSER_ACTIONS: [&str; 6] = [
    "graphql:read",
    "graphql:write",
    "events:read",
    "git:read",
    "git:write",
    "checks:read",
];

fn router(state: AppState) -> Router {
    let tls_terminated = state.runtime.options.tls_terminated;
    let app = Router::new()
        .route("/healthz", get(healthz))
        .route("/readyz", get(readyz))
        .route(
            "/graphql",
            get(graphql_get)
                .post(graphql_post)
                .layer(RequestBodyLimitLayer::new(GRAPHQL_BODY_LIMIT)),
        )
        .route("/graphql/stream", get(graphql_stream))
        .route("/events", get(events))
        .route(
            "/events/session",
            post(events_session).layer(RequestBodyLimitLayer::new(SESSION_BODY_LIMIT)),
        )
        .route(
            "/auth/token-exchange",
            post(token_exchange).layer(RequestBodyLimitLayer::new(SESSION_BODY_LIMIT)),
        )
        .route("/auth/oidc/providers", get(oidc_providers))
        .route("/auth/oidc/:provider/login", get(oidc_login))
        .route("/auth/oidc/:provider/callback", get(oidc_callback))
        .route(
            "/api/account/git-tokens",
            get(list_git_tokens)
                .post(create_git_token)
                .layer(RequestBodyLimitLayer::new(ACCOUNT_TOKEN_BODY_LIMIT)),
        )
        .route(
            "/api/account/git-tokens/:id",
            axum::routing::delete(revoke_git_token),
        )
        // No `/auth/oidc/*path` catchall — axum 0.7's matchit
        // rejects a wildcard that overlaps the specific
        // `/:provider/{login,callback}` routes above (router
        // construction panics at server startup). Unknown OIDC
        // sub-paths fall through to `.fallback(...)` below, which
        // is `not_found_or_unsupported`. Discovered while smoke-
        // testing the new Dockerfile (#12).
        .route(
            "/_extensions/session",
            post(extension_session).layer(RequestBodyLimitLayer::new(SESSION_BODY_LIMIT)),
        )
        .route(
            "/_extensions/:extension/manifest.json",
            get(extension_manifest),
        )
        .route("/_extensions/:extension/assets/*path", get(extension_asset))
        .route(
            "/git/*path",
            get(git_endpoint)
                .post(git_endpoint)
                .layer(RequestBodyLimitLayer::new(GIT_BODY_LIMIT)),
        )
        .route(
            "/api/ops/:extension/:interface/:op",
            post(api_op).layer(RequestBodyLimitLayer::new(OPS_BODY_LIMIT)),
        )
        .route("/*path", options(preflight))
        .fallback(any(not_found_or_unsupported))
        .with_state(state);
    apply_security_headers(app, tls_terminated)
}

// Baseline security-response headers per #4 P2-6.
//   * `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`
//     are set unconditionally; no handler today emits either.
//   * `Content-Security-Policy: frame-ancestors 'none'` is set with
//     `if_not_present` so the per-asset CSP installed by
//     `apply_extension_asset_headers` (which uses
//     `frame-ancestors 'self'` so extension UIs can frame their own
//     assets) wins on the `/_extensions/.../assets/*` route. Every
//     other route inherits the strict default.
//   * `Strict-Transport-Security` is only applied when TLS terminates
//     at the server (`tls_terminated == true`). Plain-HTTP development
//     omits it — pinning a `localhost` dev origin to HTTPS is a
//     well-known papercut.
fn apply_security_headers(app: Router, tls_terminated: bool) -> Router {
    use axum::http::header::{HeaderName, REFERRER_POLICY, STRICT_TRANSPORT_SECURITY};
    const X_CONTENT_TYPE_OPTIONS: HeaderName = HeaderName::from_static("x-content-type-options");
    let with_baseline = app
        .layer(SetResponseHeaderLayer::overriding(
            X_CONTENT_TYPE_OPTIONS,
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            REFERRER_POLICY,
            HeaderValue::from_static("no-referrer"),
        ))
        .layer(SetResponseHeaderLayer::if_not_present(
            CONTENT_SECURITY_POLICY,
            HeaderValue::from_static("frame-ancestors 'none'"),
        ));
    if tls_terminated {
        with_baseline.layer(SetResponseHeaderLayer::overriding(
            STRICT_TRANSPORT_SECURITY,
            HeaderValue::from_static("max-age=63072000; includeSubDomains"),
        ))
    } else {
        with_baseline
    }
}

#[derive(Clone)]
struct AppState {
    runtime: Arc<Runtime>,
    git_state: PureRustGitState,
}

#[derive(Debug, Clone)]
struct StartupOptions {
    data_dir: PathBuf,
    extension_dir: PathBuf,
    listen: SocketAddr,
    check: bool,
    tls_terminated: bool,
    operator_code: Option<String>,
    session_ttl_seconds: u64,
}

impl StartupOptions {
    fn from_env_and_args(args: impl Iterator<Item = String>) -> Self {
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
            data_dir,
            extension_dir: absolute_path(extension_dir),
            listen,
            check,
            tls_terminated: env_truthy("COMTRYA_TLS_TERMINATED"),
            operator_code: std::env::var("COMTRYA_OPERATOR_CODE").ok(),
            session_ttl_seconds: env_u64("COMTRYA_SESSION_TTL_SECONDS", 300),
        }
    }
}

#[derive(Debug)]
struct Runtime {
    options: StartupOptions,
    config: InstanceConfig,
    data_dir: PathBuf,
    extension_storage: ExtensionRuntimeStore,
    extension_runtime: BTreeMap<String, ExtensionRuntimeRecord>,
    wasm_registry: wasm_registry::WasmRegistry,
    events_path: PathBuf,
    audit_path: PathBuf,
    started_at_seconds: u64,
    /// Durable session / credential / rate-limit storage (#9, #12).
    /// Replaces the three `Mutex<HashMap>` fields the in-process
    /// kernel previously kept here. The store is opened in
    /// `Runtime::start` against `data_dir/comtrya.db` and applies
    /// every `migrations/sqlite/NNNN_*.sql` on open.
    store: persistence::PersistentStore,
    token_counter: AtomicU64,
    oidc_sessions: oidc::OidcSessionStore,
    oidc_discovery: oidc::OidcDiscoveryCache,
    /// OIDC user upsert + audit. `&mut self` on `login`, so we wrap in
    /// `Mutex`. **Never** hold this guard across an `.await` — see
    /// `oidc_callback` for the discipline.
    auth_service: Mutex<comtrya_core::auth::AuthService>,
    /// Per-commit CUE evaluation cache. Read paths (`/graphql`,
    /// `/api/ops/*`) go through this so a repository's CUE config is
    /// evaluated at most once per `(repo, commit_oid)` per process
    /// lifetime. Replaces the previous "evaluate on every request"
    /// behaviour at `evaluate_repo_config` call sites.
    cue_config_cache: Arc<cue_config::CueConfigCache>,
    /// Observable state of GitOps config-repo syncing. Updated at startup and
    /// by the background sync loop; surfaced in admin telemetry.
    config_sync_status: Mutex<config_sync::SyncStatus>,
    /// Live admin allow-list (OIDC-claim matchers). Seeded from config at
    /// startup and replaced by the reconciler on each config sync, so admin
    /// changes take effect without a restart.
    admins: std::sync::RwLock<Vec<comtrya_core::AdminConfig>>,
}

type ResponseResult<T> = Result<T, Box<Response>>;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExtensionRuntimeRecord {
    id: String,
    component: String,
    output_type: String,
    status: String,
    relationship_types: Vec<RelationshipTypeDeclaration>,
    #[serde(skip)]
    storage_collections: Vec<StorageCollectionDeclaration>,
    #[serde(skip)]
    root: PathBuf,
    #[serde(skip)]
    ui_manifest: PathBuf,
    #[serde(skip)]
    route_prefix: Option<String>,
    /// CUE snippets this extension registers to participate in the repo's
    /// `package comtrya` config. The kernel is agnostic of what `docs`,
    /// `builds`, `agents`, etc. mean — extensions declare the shape via
    /// these snippets and the kernel unifies them into the repo's config
    /// before evaluation.
    #[serde(skip)]
    cue_schemas: Vec<CueSchemaDeclaration>,
}

#[derive(Clone, Debug, serde::Deserialize)]
pub(crate) struct CueSchemaDeclaration {
    pub(crate) id: String,
    pub(crate) snippet: String,
}

#[derive(Debug)]
struct ExtensionAsset {
    content_type: &'static str,
    body: Vec<u8>,
    etag: String,
}

/// Typed outcome of repository creation, so the HTTP boundary can map failures
/// to the right status/code instead of substring-matching a flat string.
#[derive(Debug)]
pub(crate) enum CreateRepoError {
    /// Caller-correctable input (bad path or clone URL). Maps to 400.
    BadInput(String),
    /// A repository already exists at the requested path. Maps to 409.
    Conflict(String),
    /// Server-side failure (persistence, git on disk, missing workspace). 500.
    Internal(String),
}

impl CreateRepoError {
    fn message(&self) -> &str {
        match self {
            Self::BadInput(m) | Self::Conflict(m) | Self::Internal(m) => m,
        }
    }
}

impl std::fmt::Display for CreateRepoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.message())
    }
}

impl Runtime {
    fn start(options: StartupOptions) -> Result<Self, String> {
        // The config repo clones into data_dir/config-repo, so the data dir
        // must exist before we resolve the config source.
        fs::create_dir_all(&options.data_dir)
            .map_err(|error| format!("failed to create data dir: {error}"))?;

        // Pure GitOps: the external CUE config repo is the only config source.
        // When its URL is unset the instance runs an unconfigured dev default.
        let interval = config_sync::sync_interval_seconds_from_env();
        let (config, extension_config_declared, sync_status) =
            match config_sync::ConfigRepo::from_env(&options.data_dir) {
                Some(repo) => {
                    let (config, commit) = repo.bootstrap_and_load()?;
                    // A declared (non-empty) extension set is authoritative; an
                    // omitted/empty one falls back to first-party discovery.
                    let declared = !config.extensions.is_empty();
                    let status = config_sync::SyncStatus::synced(
                        repo.url().to_string(),
                        commit,
                        now_seconds(),
                        interval,
                    );
                    (config, declared, status)
                }
                None => (
                    InstanceConfig::minimal_dev(),
                    false,
                    config_sync::SyncStatus::unconfigured(interval),
                ),
            };
        let runtime = Self::start_with_config(options, config, extension_config_declared)?;
        *runtime
            .config_sync_status
            .lock()
            .expect("config sync status lock") = sync_status;
        Ok(runtime)
    }

    /// Assemble a runtime from an already-resolved config. Separated from
    /// [`Runtime::start`] so tests can inject a config directly — pure GitOps
    /// keeps env/file config sources out of the test path.
    fn start_with_config(
        options: StartupOptions,
        config: InstanceConfig,
        extension_config_declared: bool,
    ) -> Result<Self, String> {
        config.validate().map_err(|error| error.to_string())?;
        validate_production_testbed(&config, &options)?;
        fs::create_dir_all(&options.data_dir)
            .map_err(|error| format!("failed to create data dir: {error}"))?;
        for dirname in ["metadata", "repositories", "extensions", "secrets"] {
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
        let storage_collections = storage_schema_collections(&extension_runtime);
        let extension_storage =
            ExtensionRuntimeStore::open(&options.data_dir, &storage_collections)
                .map_err(|error| format!("failed to open extension runtime storage: {error}"))?;
        extension_storage
            .ensure_core_bootstrap(&config, &extension_runtime)
            .map_err(|error| format!("failed to initialize runtime storage: {error}"))?;
        touch(&events_path).map_err(|error| format!("failed to initialize event log: {error}"))?;
        touch(&audit_path).map_err(|error| format!("failed to initialize audit log: {error}"))?;

        // Capture config before move so AuthService can be built from it.
        let auth_service = comtrya_core::auth::AuthService::new(&config);
        let admins_seed = config.admins.clone();

        // Open the durable auth store. Migrations are applied here;
        // a fresh data_dir gets a brand-new comtrya.db with both
        // 0001_core.sql and 0002_auth.sql in `schema_migrations`.
        let migrations_dir = locate_sqlite_migrations()?;
        let store =
            persistence::PersistentStore::open(&options.data_dir.join("metadata"), &migrations_dir)
                .map_err(|error| format!("failed to open persistent store: {error}"))?;

        let runtime = Self {
            data_dir: options.data_dir.clone(),
            options,
            config,
            extension_storage,
            extension_runtime,
            wasm_registry,
            events_path,
            audit_path,
            started_at_seconds: now_seconds(),
            store,
            token_counter: AtomicU64::new(0),
            oidc_sessions: oidc::OidcSessionStore::new(),
            oidc_discovery: oidc::OidcDiscoveryCache::with_reqwest(),
            auth_service: Mutex::new(auth_service),
            cue_config_cache: Arc::new(cue_config::CueConfigCache::new()),
            config_sync_status: Mutex::new(config_sync::SyncStatus::unconfigured(
                config_sync::sync_interval_seconds_from_env(),
            )),
            admins: std::sync::RwLock::new(admins_seed),
        };
        // Install the per-repo extension opt-in resolver. It needs the
        // data dir, the shared CUE evaluation cache, and the collected
        // extension CUE schemas — all available only now that the runtime
        // is assembled. Until this point the registry's enforcement gates
        // fail closed for repository-scoped access.
        runtime.wasm_registry.install_repo_enablement(Arc::new(
            wasm_registry::RepoEnablement::new(
                runtime.data_dir.clone(),
                runtime.cue_config_cache.clone(),
                runtime.collected_cue_schemas(),
            ),
        ));
        runtime
            .wasm_registry
            .register_reactor_subscriptions(Arc::new(runtime.extension_storage.clone()))
            .map_err(|error| format!("failed to register WASM reactor subscriptions: {error}"))?;
        runtime
            .append_event(
                "dev.comtrya.instance.started",
                json!({"mode": runtime.mode()}),
            )
            .map_err(|error| format!("failed to append startup event: {error}"))?;
        for resolver in runtime.extension_runtime.values() {
            runtime
                .append_event(
                    "dev.comtrya.extension.loaded",
                    json!({
                        "extension": resolver.id,
                        "component": resolver.component,
                        "outputType": resolver.output_type,
                        "status": resolver.status
                    }),
                )
                .map_err(|error| format!("failed to append extension loaded event: {error}"))?;
        }
        Ok(runtime)
    }

    fn mode(&self) -> &'static str {
        match self.config.environment {
            Environment::Production => "production-testbed",
            Environment::Development => "development",
        }
    }

    fn repository_root(&self) -> PathBuf {
        self.data_dir.join("repositories")
    }

    fn readiness(&self) -> Readiness {
        let mut readiness_map = BTreeMap::new();
        readiness_map.insert("configValid".to_string(), true);
        readiness_map.insert(
            "dataDirWritable".to_string(),
            self.data_dir.join("metadata").is_dir(),
        );
        readiness_map.insert("eventLogWritable".to_string(), self.events_path.is_file());
        readiness_map.insert("auditLogWritable".to_string(), self.audit_path.is_file());
        readiness_map.insert(
            "repositoryRoot".to_string(),
            self.repository_root().is_dir(),
        );
        readiness_map.insert(
            "extensionStorageSchema".to_string(),
            self.extension_storage.schema_path().is_file(),
        );
        readiness_map.insert(
            "extensionStorageDocuments".to_string(),
            self.extension_storage.documents_path().is_file(),
        );
        readiness_map.insert(
            "productionTlsTerminated".to_string(),
            self.config.environment != Environment::Production || self.options.tls_terminated,
        );
        readiness_map.insert(
            "operatorCodeConfigured".to_string(),
            self.config.environment != Environment::Production
                || self.options.operator_code.is_some(),
        );
        let ready = readiness_map.values().all(|value| *value);
        Readiness {
            ready,
            mode: self.mode().to_string(),
            checks: readiness_map,
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
    fn canonicalize_relation_endpoints(from: &str, to: &str, verb_uri: &str) -> (String, String) {
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
                let same_from =
                    rel.get("from").and_then(Value::as_str) == Some(canon_from.as_str());
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
            "source": canon_from,
            "target": canon_to,
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
        let target = relations.as_array().and_then(|array| {
            array
                .iter()
                .find(|rel| rel.get("id").and_then(Value::as_str) == Some(id))
                .cloned()
        });
        let Some(target) = target else {
            return Ok(false);
        };
        self.extension_storage
            .delete_document("core", "relations", id)?;
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
    fn relations_outgoing(
        &self,
        ref_uri: &str,
        kind_filter: Option<&str>,
    ) -> Result<Vec<Value>, String> {
        let relations = self.extension_storage.collection_data("relations")?;
        let mut out = Vec::new();
        if let Some(array) = relations.as_array() {
            for rel in array {
                let verb = rel.get("kind").and_then(Value::as_str).unwrap_or("");
                if let Some(filter) = kind_filter
                    && verb != filter
                {
                    continue;
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

    fn relations_incoming(
        &self,
        ref_uri: &str,
        kind_filter: Option<&str>,
    ) -> Result<Vec<Value>, String> {
        let relations = self.extension_storage.collection_data("relations")?;
        let mut out = Vec::new();
        if let Some(array) = relations.as_array() {
            for rel in array {
                let verb = rel.get("kind").and_then(Value::as_str).unwrap_or("");
                if let Some(filter) = kind_filter
                    && verb != filter
                {
                    continue;
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
                if let Some(filter) = kind_filter
                    && verb != filter
                {
                    continue;
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
            let parent_doc =
                parent_doc.ok_or_else(|| format!("parent comment {parent_id:?} not found"))?;
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
        // Include a short body preview so ActivityStream can show
        // "commented · <preview>" without having to round-trip back
        // to the comment store. Cap at 200 chars so the event
        // payload doesn't bloat for novella-sized comments — the
        // stream UI truncates to ~80 anyway.
        let body_preview: String = body_markdown.chars().take(200).collect();
        let _ = self.append_event(
            "dev.comtrya.comment.posted",
            json!({
                "commentID": cmt_id.as_str(),
                "target": target,
                "parent": parent,
                "authorRef": author_ref,
                "body": body_preview,
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
            .update_document_atomically("core", "comments", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("bodyMarkdown".to_string(), Value::String(body_owned));
                    obj.insert(
                        "editedAt".to_string(),
                        Value::String(now_for_closure.clone()),
                    );
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
        self.extension_storage
            .delete_document("core", "comments", id)?;
        let _ = self.append_event("dev.comtrya.comment.deleted", json!({ "commentID": id }));
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

    // ── User layout (core-owned, per-(principal, repository)) ──────────
    //
    // Documents in the `user_layouts` collection persist the per-user
    // widget→slot override map. Resolution is hybrid: extensions publish
    // widgets with a defaultSlot; entries here move, reprioritize, or
    // hide them. Shape per entry:
    //
    //   { "<widget-id>": { "slot": "...", "priority": N, "hidden": bool } }
    //
    // The id used for storage is `<principal-fingerprint>:<repo-id>` so
    // the layout is scoped to the authenticated principal. Anonymous
    // principals receive an empty layout and writes are rejected.

    fn user_layout_document_id(principal_uri: &str, repository_id: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(principal_uri.as_bytes());
        let digest = format!("{:x}", hasher.finalize());
        format!("{}:{repository_id}", &digest[..16])
    }

    fn user_layout_resource(principal_uri: &str, repository_id: &str) -> String {
        format!("comtrya://user-layout/{principal_uri}/{repository_id}")
    }

    fn get_user_layout(&self, principal_uri: &str, repository_id: &str) -> Result<Value, String> {
        let doc_id = Self::user_layout_document_id(principal_uri, repository_id);
        let collection = self.extension_storage.collection_data("user_layouts")?;
        let entries = collection
            .as_array()
            .and_then(|arr| {
                arr.iter()
                    .find(|doc| doc.get("id").and_then(Value::as_str) == Some(doc_id.as_str()))
                    .and_then(|doc| doc.get("entries"))
                    .cloned()
            })
            .unwrap_or_else(|| json!({}));
        Ok(json!({
            "repositoryId": repository_id,
            "entries": entries,
        }))
    }

    fn set_user_layout(
        &self,
        principal_uri: &str,
        repository_id: &str,
        entries: Value,
    ) -> Result<Value, String> {
        if !entries.is_object() {
            return Err("layout.entries must be a JSON object".into());
        }
        let doc_id = Self::user_layout_document_id(principal_uri, repository_id);
        let resource = Self::user_layout_resource(principal_uri, repository_id);
        let now_iso = chrono_now_iso();
        let data = json!({
            "id": doc_id,
            "principal": principal_uri,
            "repositoryId": repository_id,
            "entries": entries,
            "updatedAt": now_iso,
        });
        // Upsert: try update first; on "not found" fall through to create.
        let update_result = self.extension_storage.update_document_atomically(
            "core",
            "user_layouts",
            &doc_id,
            |document| {
                if let Some(object) = document.as_object_mut() {
                    object.insert("entries".to_string(), entries.clone());
                    object.insert("updatedAt".to_string(), json!(now_iso));
                }
            },
        );
        if let Err(message) = update_result {
            if !message.contains("not found") {
                return Err(message);
            }
            let record = extension_document_record(
                "core",
                "user_layouts",
                &doc_id,
                &resource,
                vec![resource.clone()],
                data.clone(),
                &now_iso,
            );
            self.extension_storage.create_document(record)?;
        }
        Ok(json!({
            "repositoryId": repository_id,
            "entries": entries,
        }))
    }

    fn create_repository_document(
        &self,
        path: &str,
        clone_from_url: Option<&str>,
    ) -> Result<Value, CreateRepoError> {
        let (segments, canonical) = validate_repo_path(path).map_err(CreateRepoError::BadInput)?;
        let existing = self
            .extension_storage
            .collection_data("repositories")
            .map_err(CreateRepoError::Internal)?;
        if let Some(array) = existing.as_array()
            && array
                .iter()
                .any(|repo| repo.get("path").and_then(Value::as_str) == Some(canonical.as_str()))
        {
            return Err(CreateRepoError::Conflict(format!(
                "repository at path {canonical:?} already exists"
            )));
        }
        if let Some(url) = clone_from_url {
            validate_clone_url(url).map_err(CreateRepoError::BadInput)?;
        }

        let repo_id = OpaqueId::new(IdPrefix::Repository);
        let workspace_id = self
            .extension_storage
            .single_document_data("workspaces")
            .map_err(CreateRepoError::Internal)?
            .and_then(|workspace| {
                workspace
                    .get("id")
                    .and_then(Value::as_str)
                    .map(str::to_owned)
            })
            .ok_or_else(|| {
                CreateRepoError::Internal(
                    "repository creation requires an initialized workspace".to_string(),
                )
            })?;
        // validate_repo_path() above errors on empty input, so segments is
        // non-empty. Explicit destructuring (rather than .expect()) survives
        // future refactors that might detach this code from validate_repo_path
        // — and the PANIC_AUDIT.md tracks the intent.
        let (Some(name), Some(owner)) = (segments.last().cloned(), segments.first().cloned())
        else {
            return Err(CreateRepoError::Internal(
                "internal invariant violated: validate_repo_path produced empty segments"
                    .to_string(),
            ));
        };
        let git_http_path = format!("/git/{}.git", canonical);
        let now_iso = chrono_now_iso();

        let project_root = self.repository_root();
        let git_dir = match clone_from_url {
            Some(url) => clone_bare_repository_on_disk(&project_root, &canonical, url)
                .map_err(CreateRepoError::Internal)?,
            None => init_bare_repository_on_disk(&project_root, &canonical)
                .map_err(CreateRepoError::Internal)?,
        };
        let default_branch = read_default_branch(&git_dir).unwrap_or_else(|| "main".to_string());
        let description = clone_from_url
            .map(|url| format!("Imported from {url}"))
            .unwrap_or_default();

        let data = json!({
            "id": repo_id.as_str(),
            "workspaceID": workspace_id.clone(),
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
            return Err(CreateRepoError::Internal(error));
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

    /// `(canonical path, document id)` for every stored repository. Used by the
    /// reconciler to diff declared vs actual.
    fn repository_docs(&self) -> Vec<(String, String)> {
        self.extension_storage
            .collection_data("repositories")
            .ok()
            .and_then(|value| value.as_array().cloned())
            .unwrap_or_default()
            .iter()
            .filter_map(|doc| {
                let path = doc.get("path").and_then(Value::as_str)?.to_string();
                let id = doc.get("id").and_then(Value::as_str)?.to_string();
                Some((path, id))
            })
            .collect()
    }

    /// Create a repository declared in config, then stamp its declared
    /// visibility and description onto the document.
    fn create_declared_repository(
        &self,
        repo: &comtrya_core::RepositoryConfig,
    ) -> Result<(), String> {
        let created = self
            .create_repository_document(&repo.path, None)
            .map_err(|error| error.to_string())?;
        let id = created
            .get("id")
            .and_then(Value::as_str)
            .ok_or("created repository document missing id")?
            .to_string();
        let visibility = visibility_label(repo.visibility);
        let description = repo.description.clone().unwrap_or_default();
        self.extension_storage
            .update_document_atomically("core", "repositories", &id, |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert(
                        "visibility".to_string(),
                        Value::String(visibility.to_string()),
                    );
                    obj.insert("description".to_string(), Value::String(description));
                }
            })
    }

    /// Delete a repository: remove its document and its on-disk bare repo.
    /// Strict GitOps — this destroys git history for repos absent from config.
    fn delete_repository(&self, path: &str, id: &str) -> Result<(), String> {
        self.extension_storage
            .delete_document("core", "repositories", id)?;
        let git_dir = self.repository_root().join(format!("{path}.git"));
        if git_dir.exists() {
            fs::remove_dir_all(&git_dir)
                .map_err(|error| format!("failed to remove {}: {error}", git_dir.display()))?;
        }
        let _ = self.append_event(
            "dev.comtrya.repository.deleted",
            json!({ "path": path, "id": id }),
        );
        Ok(())
    }

    /// `(scope, name, color, description, id)` for every stored label. `scope`
    /// is `None` for a global (inheritable) label.
    fn label_docs(&self) -> Vec<(Option<String>, String, String, String, String)> {
        self.extension_storage
            .collection_data("labels")
            .ok()
            .and_then(|value| value.as_array().cloned())
            .unwrap_or_default()
            .iter()
            .filter_map(|doc| {
                let name = doc.get("name").and_then(Value::as_str)?.to_string();
                let id = doc.get("id").and_then(Value::as_str)?.to_string();
                let color = doc
                    .get("color")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string();
                let description = doc
                    .get("description")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string();
                let scope = doc.get("scope").and_then(Value::as_str).map(str::to_owned);
                Some((scope, name, color, description, id))
            })
            .collect()
    }

    fn create_label(&self, label: &comtrya_core::LabelConfig) -> Result<(), String> {
        let id = OpaqueId::new(IdPrefix::Owned("lbl_".to_string()));
        let now_iso = chrono_now_iso();
        let data = json!({
            "id": id.as_str(),
            "name": label.name,
            "color": label.color,
            "description": label.description.clone().unwrap_or_default(),
            "scope": label.scope.clone().map(Value::from).unwrap_or(Value::Null),
            "visibility": "PUBLIC",
        });
        let label_ref = format!("comtrya://label/{}", id.as_str());
        let record = extension_document_record(
            "core",
            "labels",
            id.as_str(),
            &label_ref,
            vec![label_ref.clone()],
            data,
            &now_iso,
        );
        self.extension_storage.create_document(record)
    }

    fn update_label(&self, id: &str, color: &str, description: &str) -> Result<(), String> {
        let color = color.to_string();
        let description = description.to_string();
        self.extension_storage
            .update_document_atomically("core", "labels", id, move |data| {
                if let Some(obj) = data.as_object_mut() {
                    obj.insert("color".to_string(), Value::String(color));
                    obj.insert("description".to_string(), Value::String(description));
                }
            })
    }

    fn delete_label(&self, id: &str) -> Result<(), String> {
        self.extension_storage.delete_document("core", "labels", id)
    }

    fn runtime_payload(&self) -> Result<Value, String> {
        let workspace = self
            .extension_storage
            .single_document_data("workspaces")?
            .ok_or_else(|| "runtime storage did not contain a workspace".to_string())?;
        let repository_documents = self.extension_storage.collection_data("repositories")?;
        let pull_requests = self.extension_storage.collection_data("pull_requests")?;
        let checks = self.extension_storage.collection_data("check_runs")?;
        let extensions = filter_extension_installations(
            self.extension_storage
                .collection_data("extension_installations")?,
            &self.extension_runtime,
        );
        let activity = self.extension_storage.collection_data("activity_events")?;
        Ok(json!({
            "generatedBy": "comtrya-runtime/v1",
            "workspace": workspace,
            "repository": Value::Null,
            "repositories": repository_documents,
            "refs": [],
            "branches": [],
            "commits": [],
            "treeEntries": [],
            "files": [],
            "blobs": [],
            "diff": Value::Null,
            "comtryaConfig": Value::Null,
            "pullRequests": pull_requests,
            "checks": checks,
            "extensions": extensions,
            "activity": activity
        }))
    }

    fn admin_telemetry(&self) -> Value {
        let now = now_seconds();
        let readiness = self.readiness();
        let repositories = self
            .extension_storage
            .collection_data("repositories")
            .unwrap_or_else(|_| json!([]));
        let repository_count = repositories.as_array().map(Vec::len).unwrap_or(0);
        let extension_count = self.extension_runtime.len();
        let (active_sessions, active_credentials, rate_limit_rows) =
            self.store.telemetry_counts(now).unwrap_or((0, 0, 0));
        let repository_root = self.repository_root();
        let extension_storage_root = self.extension_storage.root.clone();
        let metadata_root = self.data_dir.join("metadata");
        let recent_events = self
            .read_events()
            .into_iter()
            .rev()
            .take(12)
            .collect::<Vec<_>>();
        let config_sync = self
            .config_sync_status
            .lock()
            .ok()
            .and_then(|status| serde_json::to_value(&*status).ok())
            .unwrap_or(Value::Null);

        json!({
            "configSync": config_sync,
            "instance": {
                "id": self.config.id,
                "name": self.config.name,
                "mode": self.mode(),
                "version": env!("CARGO_PKG_VERSION"),
                "publicURL": self.config.public_url,
                "uptimeSeconds": now.saturating_sub(self.started_at_seconds),
                "startedAt": self.started_at_seconds,
                "now": now,
                "processID": std::process::id(),
            },
            "services": [
                {
                    "name": "server",
                    "status": "ok",
                    "detail": format!("listening on {}", self.options.listen),
                },
                {
                    "name": "graphql",
                    "status": if readiness.ready { "ok" } else { "degraded" },
                    "detail": format!("{} readiness checks", readiness.checks.len()),
                },
                {
                    "name": "git-http",
                    "status": if repository_root.is_dir() { "ok" } else { "degraded" },
                    "detail": repository_root.display().to_string(),
                },
                {
                    "name": "extension-runtime",
                    "status": "ok",
                    "detail": format!("{extension_count} loaded"),
                },
                {
                    "name": "event-stream",
                    "status": if self.events_path.is_file() { "ok" } else { "degraded" },
                    "detail": self.events_path.display().to_string(),
                },
                {
                    "name": "persistence",
                    "status": "ok",
                    "detail": "sqlite metadata store",
                }
            ],
            "readiness": readiness,
            "access": {
                "activeSessions": active_sessions,
                "activeCredentials": active_credentials,
                "rateLimitRows": rate_limit_rows,
                "oidcIssuers": self.config.oidc_issuers.iter().map(|issuer| {
                    json!({
                        "id": issuer.id,
                        "issuerURL": issuer.issuer_url,
                        "clientID": issuer.client_id,
                        "clientKind": match issuer.client_kind {
                            ClientKind::Public => "public",
                            ClientKind::Confidential => "confidential",
                        },
                        "redirectURL": issuer.redirect_url,
                        "allowedDomains": issuer.allowed_domains,
                        "allowedGroups": issuer.allowed_groups,
                        "allowedSubjects": issuer.allowed_subjects,
                        "hasClientSecret": issuer.client_secret.is_some(),
                    })
                }).collect::<Vec<_>>(),
            },
            "storage": {
                "dataDir": path_telemetry(&self.data_dir),
                "metadata": path_telemetry(&metadata_root),
                "repositories": {
                    "count": repository_count,
                    "root": path_telemetry(&repository_root),
                    "backends": self.config.repository_storage_backends.iter().map(|(name, backend)| {
                        json!({
                            "name": name,
                            "kind": match backend {
                                RepoStorageBackend::Local { .. } => "local",
                                RepoStorageBackend::S3 { .. } => "s3",
                                RepoStorageBackend::CloudflareArtifacts { .. } => "cloudflare-artifacts",
                            },
                            "configuredPath": match backend {
                                RepoStorageBackend::Local { path } => Value::String(path.clone()),
                                _ => Value::Null,
                            }
                        })
                    }).collect::<Vec<_>>(),
                },
                "extensionStorage": path_telemetry(&extension_storage_root),
                "events": file_telemetry(&self.events_path),
                "audit": file_telemetry(&self.audit_path),
            },
            "extensions": self.extension_runtime.values().map(|record| {
                json!({
                    "id": record.id,
                    "status": record.status,
                    "component": record.component,
                    "outputType": record.output_type,
                    "routePrefix": record.route_prefix,
                    "relationshipTypes": record.relationship_types,
                })
            }).collect::<Vec<_>>(),
            "recentEvents": recent_events,
        })
    }

    /// Walk every loaded extension and emit one `ExtensionSchema` per
    /// registered CUE snippet. Used by `cue_config` to unify these with
    /// the repo's `package comtrya` declarations before evaluation.
    fn collected_cue_schemas(&self) -> Vec<cue_config::ExtensionSchema> {
        let mut out = Vec::new();
        for record in self.extension_runtime.values() {
            for schema in &record.cue_schemas {
                out.push(cue_config::ExtensionSchema {
                    extension_id: record.id.clone(),
                    schema_id: schema.id.clone(),
                    snippet: schema.snippet.clone(),
                });
            }
        }
        out
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

    fn extension_runtime_record(&self, extension: &str) -> Option<&ExtensionRuntimeRecord> {
        self.extension_runtime.get(extension)
    }

    fn check_boundary(&self, headers: &HeaderMap, route: &str) -> ResponseResult<HeaderMap> {
        if self.config.environment == Environment::Production && !self.options.tls_terminated {
            return Err(Box::new(error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                ErrorCode::ConfigInvalid.as_str(),
                "production requires COMTRYA_TLS_TERMINATED=true behind a TLS terminator",
            )));
        }

        let mut out = HeaderMap::new();
        if let Some(origin) = headers.get("origin").and_then(|value| value.to_str().ok()) {
            let cors = CorsPolicy {
                allowed_origins: self.config.allowed_origins.clone(),
            };
            let cors_headers = cors.check(origin, route).map_err(|error| {
                Box::new(error_response(
                    StatusCode::FORBIDDEN,
                    error.code.as_str(),
                    &error.message,
                ))
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

    fn rate_limit(&self, bucket: &str, ceiling: u32) -> ResponseResult<()> {
        let minute = now_seconds() / 60;
        let count = self.store.tally_rate(bucket, minute).map_err(|error| {
            tracing::error!(%error, %bucket, "rate-limit tally failed");
            Box::new(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorCode::InternalServerError.as_str(),
                "rate-limit storage failed",
            ))
        })?;
        if count > ceiling {
            Err(Box::new(error_response(
                StatusCode::TOO_MANY_REQUESTS,
                ErrorCode::RateLimited.as_str(),
                "rate limit exceeded",
            )))
        } else {
            Ok(())
        }
    }

    fn principal_from_headers(&self, headers: &HeaderMap) -> PrincipalStatus {
        self.principal_context_from_headers(headers).status
    }

    pub(crate) fn principal_context_from_headers(&self, headers: &HeaderMap) -> PrincipalContext {
        let Some(token) = auth_token_from_headers(headers) else {
            return PrincipalContext::anonymous();
        };

        match self.store.lookup_credential(token, now_seconds()) {
            Ok(Some(credential)) => PrincipalContext {
                status: stored_to_principal(credential.principal),
                uri: credential.principal_uri,
            },
            Ok(None) => PrincipalContext::invalid(),
            Err(error) => {
                tracing::error!(%error, "credential lookup failed");
                PrincipalContext::unavailable()
            }
        }
    }

    fn credential_allows(&self, headers: &HeaderMap, action: &str) -> bool {
        let Some(token) = auth_token_from_headers(headers) else {
            return false;
        };

        match self.store.lookup_credential(token, now_seconds()) {
            Ok(Some(credential)) => credential.actions.iter().any(|granted| granted == action),
            Ok(None) => false,
            Err(error) => {
                // Fail closed on a storage outage: deny the action. The status
                // path (above) is responsible for surfacing the 503; this
                // boolean gate only decides allow/deny.
                tracing::error!(%error, "credential action lookup failed");
                false
            }
        }
    }

    fn issue_session(&self, principal: PrincipalStatus) -> String {
        let token = self.next_secure_token("sess");
        let now = now_seconds();
        if let Err(error) = self.store.insert_session(
            &token,
            principal_to_stored(principal),
            now.saturating_add(self.options.session_ttl_seconds),
            now,
        ) {
            tracing::error!(%error, "session persistence failed");
        }
        let _ = self.append_audit(
            "dev.comtrya.session.issued",
            json!({"token_sha256_prefix": token_audit_id(&token)}),
        );
        token
    }

    fn consume_session(&self, token: &str) -> ResponseResult<PrincipalStatus> {
        match self.store.take_session(token, now_seconds()) {
            Ok(Some(stored)) => Ok(stored_to_principal(stored)),
            Ok(None) => Err(Box::new(error_response(
                StatusCode::UNAUTHORIZED,
                ErrorCode::Unauthenticated.as_str(),
                "event session is expired, already used, or unknown",
            ))),
            Err(error) => {
                tracing::error!(%error, "session take failed");
                Err(Box::new(error_response(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    ErrorCode::InternalServerError.as_str(),
                    "session storage failed",
                )))
            }
        }
    }

    /// True when the OIDC claims match a configured admin (live allow-list).
    /// `handle` carries `preferred_username` when available; today it is `None`.
    fn is_admin_claims(&self, issuer: &str, subject: &str, email: Option<&str>) -> bool {
        self.admins
            .read()
            .map(|admins| {
                admins
                    .iter()
                    .any(|admin| admin.matches(issuer, subject, email, None))
            })
            .unwrap_or(false)
    }

    /// Replace the live admin allow-list. The reconciler calls this on each
    /// config sync so admin changes apply without a restart.
    fn set_admins(&self, admins: Vec<comtrya_core::AdminConfig>) {
        if let Ok(mut guard) = self.admins.write() {
            *guard = admins;
        }
    }

    fn issue_credential(
        &self,
        resource: String,
        actions: Vec<String>,
        principal: PrincipalStatus,
    ) -> String {
        let token = self.next_secure_token("fp");
        let principal_uri = format!("comtrya://credential/{}", self.next_id("prn"));
        let now = now_seconds();
        if let Err(error) = self.store.insert_credential(
            &token,
            principal_to_stored(principal),
            &principal_uri,
            &actions,
            now.saturating_add(300),
            now,
        ) {
            tracing::error!(%error, "credential persistence failed");
        }
        let _ = self.append_event(
            "dev.comtrya.auth.credential.issued",
            json!({"resource": resource, "scope": actions, "principal": principal_uri}),
        );
        token
    }

    /// Mint a Git personal access token for `owner_principal_uri`. Returns
    /// the one-time plaintext secret (shown to the user exactly once) and
    /// the stored record (sans secret). The secret is argon2id-hashed
    /// before storage; only the hash is persisted.
    fn create_git_personal_access_token(
        &self,
        owner_principal_uri: &str,
        name: &str,
        scopes: Vec<String>,
        expires_in_days: Option<u64>,
    ) -> Result<(String, persistence::StoredGitPersonalAccessToken), String> {
        let id = self.next_id("pat");
        let secret = self.next_secure_token("cpat");
        let token = format_git_pat_token(&id, &secret);
        let token_hash = git_pat_hash(&token)?;
        let now = now_seconds();
        let expires_at = expires_in_days.map(|days| now.saturating_add(days * 24 * 60 * 60));
        let record = persistence::StoredGitPersonalAccessToken {
            id,
            owner_principal_uri: owner_principal_uri.to_string(),
            name: name.to_string(),
            token_prefix: token.chars().take(12).collect(),
            scopes,
            expires_at,
            created_at: now,
            last_used_at: None,
            revoked_at: None,
        };
        self.store
            .insert_git_personal_access_token(&record, &token_hash)?;
        let _ = self.append_audit(
            "dev.comtrya.git_token.created",
            json!({
                "token_id": record.id,
                "owner": owner_principal_uri,
                "scopes": record.scopes,
                "expires_at": record.expires_at,
            }),
        );
        Ok((token, record))
    }

    fn list_git_personal_access_tokens(
        &self,
        owner_principal_uri: &str,
    ) -> Result<Vec<persistence::StoredGitPersonalAccessToken>, String> {
        self.store
            .list_git_personal_access_tokens(owner_principal_uri, now_seconds())
    }

    fn revoke_git_personal_access_token(
        &self,
        owner_principal_uri: &str,
        id: &str,
    ) -> Result<bool, String> {
        let revoked =
            self.store
                .revoke_git_personal_access_token(owner_principal_uri, id, now_seconds())?;
        if revoked {
            let _ = self.append_audit(
                "dev.comtrya.git_token.revoked",
                json!({"token_id": id, "owner": owner_principal_uri}),
            );
        }
        Ok(revoked)
    }

    /// Verify a presented Git PAT and report whether its scopes include
    /// `action` (`git:read` / `git:write`). The id embedded in the token
    /// addresses the row; the secret is argon2id-verified against the stored
    /// hash. On success, stamps `last_used_at`. Any malformed token,
    /// missing/revoked/expired row, or hash mismatch yields `false`.
    fn git_personal_access_token_allows(&self, token: &str, action: &str) -> bool {
        let Some((id, _secret)) = parse_git_pat_token(token) else {
            return false;
        };
        let now = now_seconds();
        let lookup = match self.store.lookup_git_personal_access_token_by_id(id, now) {
            Ok(Some(found)) => found,
            Ok(None) => return false,
            Err(error) => {
                tracing::error!(%error, "git personal access token lookup failed");
                return false;
            }
        };
        let (record, token_hash) = lookup;
        if !git_pat_verify(token, &token_hash) {
            return false;
        }
        if let Err(error) = self.store.touch_git_personal_access_token(&record.id, now) {
            tracing::error!(%error, "git personal access token touch failed");
        }
        record.scopes.iter().any(|scope| scope == action)
    }

    /// Monotonic, sortable identifier for non-secret use (event IDs,
    /// principal URI fragments). Format: `{prefix}_{unix_seconds}_{counter}`.
    /// **Never** use for anything that must be unguessable — see
    /// [`next_secure_token`].
    fn next_id(&self, prefix: &str) -> String {
        let counter = self.token_counter.fetch_add(1, Ordering::Relaxed);
        format!("{prefix}_{}_{}", now_seconds(), counter)
    }

    /// Bearer token with 128 bits of entropy sampled from the OS RNG.
    /// Format: `{prefix}_{32-hex-chars}`. The prefix is for human
    /// readability; the unguessable randomness is the 16-byte tail.
    fn next_secure_token(&self, prefix: &str) -> String {
        let mut bytes = [0u8; 16];
        getrandom::fill(&mut bytes).expect("os rng unavailable");
        let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
        format!("{prefix}_{hex}")
    }

    fn append_event(&self, event_type: &str, data: Value) -> std::io::Result<()> {
        self.append_event_internal(event_type, data)
    }

    fn append_event_internal(&self, event_type: &str, data: Value) -> std::io::Result<()> {
        append_jsonl(
            &self.events_path,
            json!({
                "specversion": "1.0",
                "id": self.next_id("evt"),
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

    /// Opt-in archive scan. Reads `metadata/archive/events.*.jsonl`
    /// in chronological order (string-sort = numeric-sort because the
    /// nanosecond timestamp is fixed-width through year ~2554), then
    /// concatenates the active file. Used by tooling that needs the
    /// full event history; production hot paths stay on `read_events`.
    /// `#[cfg(test)]`-gated until a real caller emerges — the
    /// alternative `#[allow(dead_code)]` violates CLAUDE.md.
    #[cfg(test)]
    fn read_events_including_archive(&self) -> Vec<Value> {
        let mut entries = Vec::new();
        if let Some(parent) = self.events_path.parent() {
            let archive_dir = parent.join("archive");
            if let Ok(read_dir) = std::fs::read_dir(&archive_dir) {
                let mut archive_paths: Vec<_> = read_dir
                    .filter_map(|e| e.ok())
                    .map(|e| e.path())
                    .filter(|p| {
                        p.file_name()
                            .and_then(|n| n.to_str())
                            .is_some_and(|n| n.starts_with("events.") && n.ends_with(".jsonl"))
                    })
                    .collect();
                archive_paths.sort();
                for path in archive_paths {
                    let mut text = String::new();
                    if let Ok(mut file) = OpenOptions::new().read(true).open(&path) {
                        let _ = file.read_to_string(&mut text);
                    }
                    entries.extend(
                        text.lines()
                            .filter_map(|line| serde_json::from_str::<Value>(line).ok()),
                    );
                }
            }
        }
        entries.extend(self.read_events());
        entries
    }

    #[cfg(test)]
    fn read_audit(&self) -> Vec<Value> {
        let mut text = String::new();
        if let Ok(mut file) = OpenOptions::new().read(true).open(&self.audit_path) {
            let _ = file.read_to_string(&mut text);
        }
        text.lines()
            .filter_map(|line| serde_json::from_str::<Value>(line).ok())
            .collect()
    }
}

/// Stable, non-reversible audit ID for a bearer token. 16 hex chars =
/// 64 bits of preimage resistance (32-bit birthday bound). Acceptable
/// for a non-secret audit-log cross-reference handle; full 256-bit
/// SHA would just bloat lines.
fn token_audit_id(token: &str) -> String {
    let digest = sha2::Sha256::digest(token.as_bytes());
    digest.iter().take(8).map(|b| format!("{b:02x}")).collect()
}

/// Best-effort caller IP for anonymous rate-limit bucketing. The server
/// runs behind a proxy, so the only client-stable signal is the
/// `X-Forwarded-For` / `X-Real-IP` header. Returns the first forwarded
/// hop, hashed (non-reversible audit id), or `None` when absent.
fn forwarded_addr_fingerprint(headers: &HeaderMap) -> Option<String> {
    let raw = headers
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|hop| !hop.is_empty())
        .or_else(|| {
            headers
                .get("x-real-ip")
                .and_then(|value| value.to_str().ok())
                .map(str::trim)
                .filter(|hop| !hop.is_empty())
        })?;
    Some(token_audit_id(raw))
}

/// Stable per-principal fingerprint for rate-limit bucket keys. Keyed off
/// the bearer/session token (hashed) when authenticated, falling back to a
/// hashed forwarded client address for anonymous callers, and finally a
/// shared `anon` bucket when neither signal is present.
fn principal_fingerprint(headers: &HeaderMap) -> String {
    if let Some(token) = auth_token_from_headers(headers) {
        return format!("tok:{}", token_audit_id(token));
    }
    if let Some(addr) = forwarded_addr_fingerprint(headers) {
        return format!("ip:{addr}");
    }
    "anon".to_string()
}

/// Git PAT wire format: `cpat.<id>.<secret>`. `<id>` is the (non-secret)
/// primary key of the row — it carries no `.` so the secret can be split
/// off with `rsplit_once('.')`. The `<secret>` tail is the unguessable
/// material; only its argon2id hash is persisted.
const GIT_PAT_TOKEN_PREFIX: &str = "cpat.";

fn format_git_pat_token(id: &str, secret: &str) -> String {
    format!("{GIT_PAT_TOKEN_PREFIX}{id}.{secret}")
}

/// Split a presented PAT into `(id, secret)`. Returns `None` for any token
/// that isn't a well-formed `cpat.<id>.<secret>`.
fn parse_git_pat_token(token: &str) -> Option<(&str, &str)> {
    let body = token.strip_prefix(GIT_PAT_TOKEN_PREFIX)?;
    let (id, secret) = body.rsplit_once('.')?;
    if id.is_empty() || secret.is_empty() {
        return None;
    }
    Some((id, secret))
}

/// Hash a PAT secret with argon2id (salted, PHC-encoded). The returned
/// string embeds the salt and parameters and is what we persist.
fn git_pat_hash(token: &str) -> Result<String, String> {
    use argon2::password_hash::{PasswordHasher, SaltString, rand_core::OsRng};
    let salt = SaltString::generate(&mut OsRng);
    argon2::Argon2::default()
        .hash_password(token.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| format!("argon2 hash failed: {e}"))
}

/// Constant-time verify a presented PAT against its stored argon2id hash.
fn git_pat_verify(token: &str, stored_hash: &str) -> bool {
    use argon2::password_hash::{PasswordHash, PasswordVerifier};
    let Ok(parsed) = PasswordHash::new(stored_hash) else {
        return false;
    };
    argon2::Argon2::default()
        .verify_password(token.as_bytes(), &parsed)
        .is_ok()
}

fn filter_extension_installations(
    extensions: Value,
    loaded: &BTreeMap<String, ExtensionRuntimeRecord>,
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

/// Enrich an `extensionInstallations` array with runtime-derived fields.
/// The server-side [`ExtensionInstallConfig`] takes precedence; if no config
/// declares a prefix, the extension's own manifest (recorded in the runtime)
/// supplies one. Extensions with neither receive `null`.
fn inject_route_prefix(
    extensions: Value,
    configs: &[ExtensionInstallConfig],
    runtime: &BTreeMap<String, ExtensionRuntimeRecord>,
) -> Value {
    let Value::Array(items) = extensions else {
        return extensions;
    };
    Value::Array(
        items
            .into_iter()
            .map(|mut ext| {
                let extension_id = ext.get("id").and_then(Value::as_str);
                let route_prefix = extension_id.and_then(|id| {
                    configs
                        .iter()
                        .find(|c| c.id == id)
                        .and_then(|c| c.route_prefix.clone())
                        .or_else(|| runtime.get(id).and_then(|r| r.route_prefix.clone()))
                });
                let relationship_types = extension_id
                    .and_then(|id| runtime.get(id))
                    .map(|record| json!(record.relationship_types))
                    .unwrap_or_else(|| json!([]));
                let value = route_prefix.map(|p| json!(p)).unwrap_or(json!(null));
                if let Some(obj) = ext.as_object_mut() {
                    obj.insert("routePrefix".to_string(), value);
                    obj.insert("relationshipTypes".to_string(), relationship_types);
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
    /// OIDC-authenticated bearer whose claims matched a configured admin.
    AdminCredential,
    Credential,
    Invalid,
    /// The credential store could not be consulted (transient I/O / SQLite
    /// outage). Distinct from `Invalid` so a storage hiccup surfaces as a
    /// 503 rather than masquerading as an invalid token (401). Fails closed:
    /// treated as unauthenticated for every authorization decision.
    Unavailable,
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

    fn unavailable() -> Self {
        Self {
            status: PrincipalStatus::Unavailable,
            uri: "comtrya://principal/unavailable".to_string(),
        }
    }
}

/// Translate the runtime's `PrincipalStatus` to the persistence
/// layer's mirror. The two enums are kept separate so a future
/// refactor that moves `PrincipalStatus` doesn't drag the
/// `persistence` module along; the conversions are the contract.
fn principal_to_stored(p: PrincipalStatus) -> persistence::StoredPrincipal {
    match p {
        PrincipalStatus::OperatorCredential => persistence::StoredPrincipal::OperatorCredential,
        PrincipalStatus::AdminCredential => persistence::StoredPrincipal::AdminCredential,
        PrincipalStatus::Credential => persistence::StoredPrincipal::Credential,
        PrincipalStatus::Anonymous => persistence::StoredPrincipal::Anonymous,
        // `Unavailable` is a transient runtime status produced when the
        // credential store can't be read; it is never persisted. Map it to the
        // persisted `Invalid` so the conversion stays total without inventing a
        // stored variant for a non-stored state.
        PrincipalStatus::Invalid | PrincipalStatus::Unavailable => {
            persistence::StoredPrincipal::Invalid
        }
    }
}

fn stored_to_principal(p: persistence::StoredPrincipal) -> PrincipalStatus {
    match p {
        persistence::StoredPrincipal::OperatorCredential => PrincipalStatus::OperatorCredential,
        persistence::StoredPrincipal::AdminCredential => PrincipalStatus::AdminCredential,
        persistence::StoredPrincipal::Credential => PrincipalStatus::Credential,
        persistence::StoredPrincipal::Anonymous => PrincipalStatus::Anonymous,
        persistence::StoredPrincipal::Invalid => PrincipalStatus::Invalid,
    }
}

fn auth_token_from_headers(headers: &HeaderMap) -> Option<&str> {
    bearer_token_from_headers(headers).or_else(|| session_cookie_from_headers(headers))
}

fn bearer_token_from_headers(headers: &HeaderMap) -> Option<&str> {
    headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
}

/// Extract the password from an HTTP Basic `Authorization` header. Git
/// clients send the PAT as the password (the username is ignored). Returns
/// `None` if the header is absent, not Basic, malformed, or empty-password.
fn basic_password_from_headers(headers: &HeaderMap) -> Option<String> {
    use base64::Engine as _;
    let encoded = headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Basic "))?;
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(encoded.as_bytes())
        .ok()?;
    let decoded = String::from_utf8(decoded).ok()?;
    let (_username, password) = decoded.split_once(':')?;
    (!password.is_empty()).then(|| password.to_string())
}

fn session_cookie_from_headers(headers: &HeaderMap) -> Option<&str> {
    headers
        .get(axum::http::header::COOKIE)
        .and_then(|value| value.to_str().ok())
        .and_then(|cookie| {
            cookie.split(';').find_map(|part| {
                let (name, value) = part.trim().split_once('=')?;
                (name == COMTRYA_SESSION_COOKIE && !value.is_empty()).then_some(value)
            })
        })
}

/// Discover the `migrations/sqlite/` directory at runtime. Walks up
/// from `CARGO_MANIFEST_DIR` (the server crate) to find the repo
/// root. Cached at process start by `Runtime::start`; no per-request
/// cost. Honours `$COMTRYA_MIGRATIONS_DIR` for deployments where the
/// migrations live outside the source tree (containerised builds).
fn locate_sqlite_migrations() -> Result<PathBuf, String> {
    if let Ok(dir) = std::env::var("COMTRYA_MIGRATIONS_DIR") {
        let path = PathBuf::from(dir).join("sqlite");
        if path.is_dir() {
            return Ok(path);
        }
        return Err(format!(
            "COMTRYA_MIGRATIONS_DIR is set but {}/sqlite/ is not a directory",
            path.parent()
                .map(|p| p.display().to_string())
                .unwrap_or_default()
        ));
    }
    let mut dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    for _ in 0..4 {
        let candidate = dir.join("migrations/sqlite");
        if candidate.is_dir() {
            return Ok(candidate);
        }
        if !dir.pop() {
            break;
        }
    }
    Err(format!(
        "could not locate migrations/sqlite/ above {}",
        env!("CARGO_MANIFEST_DIR")
    ))
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
    // OIDC login redirect now ships as a real handler at
    // `/auth/oidc/:provider/login`. The callback at
    // `/auth/oidc/:provider/callback` returns 501 directly from its
    // own handler, so no `UNSUPPORTED_SURFACES` entry is needed for
    // OIDC. Unknown OIDC sub-paths fall through to the global
    // `.fallback(not_found_or_unsupported)`.
];

async fn healthz(State(state): State<AppState>, headers: HeaderMap) -> Response {
    match state.runtime.check_boundary(&headers, "/healthz") {
        Ok(cors) => json_response(StatusCode::OK, json!({"status": "ok"}), cors),
        Err(response) => *response,
    }
}

async fn readyz(State(state): State<AppState>, headers: HeaderMap) -> Response {
    match state.runtime.check_boundary(&headers, "/readyz") {
        Ok(cors) => json_response(StatusCode::OK, json!(state.runtime.readiness()), cors),
        Err(response) => *response,
    }
}

async fn not_found_or_unsupported(
    State(state): State<AppState>,
    headers: HeaderMap,
    uri: Uri,
) -> Response {
    let cors = match state.runtime.check_boundary(&headers, uri.path()) {
        Ok(cors) => cors,
        Err(response) => return *response,
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
    // A POST with no body is the well-formed "empty query" case the
    // GET handler also serves; a body that is present but not valid JSON
    // is a client bug and must be rejected at the edge rather than
    // coerced into an empty object that returns 200.
    let payload = if body.trim().is_empty() {
        json!({})
    } else {
        match serde_json::from_str::<Value>(&body) {
            Ok(value) => value,
            Err(err) => {
                let cors = match graphql_read_guard(&state, &headers) {
                    Ok(c) => c,
                    Err(r) => return *r,
                };
                return graphql_error_response(
                    StatusCode::BAD_REQUEST,
                    ErrorCode::BadUserInput.as_str(),
                    &format!("request body is not valid JSON: {err}"),
                    cors,
                );
            }
        }
    };
    let query = payload.get("query").and_then(Value::as_str).unwrap_or("");
    match extract_root_operation_field(query).as_deref() {
        Some("createRepository") => return create_repository_mutation(state, headers, payload),
        Some("syncConfig") => return sync_config_mutation(state, headers, payload),
        Some("relations.create") => {
            return relations_create_mutation(state, headers, payload);
        }
        Some("relations.delete") => {
            return relations_delete_mutation(state, headers, payload);
        }
        Some("relations.outgoing") => {
            return relations_outgoing_query(state, headers, payload);
        }
        Some("relations.incoming") => {
            return relations_incoming_query(state, headers, payload);
        }
        Some("relations.between") => {
            return relations_between_query(state, headers, payload);
        }
        Some("comments.thread") => {
            return comments_thread_query(state, headers, payload);
        }
        Some("comments.create") => {
            return comments_create_mutation(state, headers, payload);
        }
        Some("comments.update") => {
            return comments_update_mutation(state, headers, payload);
        }
        Some("comments.delete") => {
            return comments_delete_mutation(state, headers, payload);
        }
        Some("userLayout") => {
            return user_layout_query(state, headers, payload);
        }
        Some("setUserLayout") => {
            return user_layout_mutation(state, headers, payload);
        }
        _ => {}
    }
    graphql_response(state, headers, payload)
}

fn user_layout_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return *r,
    };
    let principal = state.runtime.principal_context_from_headers(&headers);
    let repository_id = payload
        .pointer("/variables/repositoryId")
        .and_then(Value::as_str)
        .unwrap_or("");
    if repository_id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "userLayout requires variables.repositoryId",
            cors,
        );
    }
    match state.runtime.get_user_layout(&principal.uri, repository_id) {
        Ok(layout) => json_response(
            StatusCode::OK,
            json!({ "data": { "userLayout": layout } }),
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

fn user_layout_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return *r,
    };
    let principal = state.runtime.principal_context_from_headers(&headers);
    let repository_id = payload
        .pointer("/variables/repositoryId")
        .and_then(Value::as_str)
        .unwrap_or("");
    if repository_id.is_empty() {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "setUserLayout requires variables.repositoryId",
            cors,
        );
    }
    let entries = payload
        .pointer("/variables/layout/entries")
        .cloned()
        .unwrap_or(json!({}));
    match state
        .runtime
        .set_user_layout(&principal.uri, repository_id, entries)
    {
        Ok(layout) => json_response(
            StatusCode::OK,
            json!({ "data": { "setUserLayout": layout } }),
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

async fn api_op(
    State(state): State<AppState>,
    headers: HeaderMap,
    AxumPath((extension, interface, op)): AxumPath<(String, String, String)>,
    body: Bytes,
) -> Response {
    let route = format!("/api/ops/{extension}/{interface}/{op}");
    let cors = match state.runtime.check_boundary(&headers, &route) {
        Ok(cors) => cors,
        Err(response) => return *response,
    };
    if state
        .runtime
        .rate_limit(
            &format!("api_ops:{}", principal_fingerprint(&headers)),
            state.runtime.config.rate_limits.graphql_per_principal,
        )
        .is_err()
    {
        return api_op_json_error(
            StatusCode::TOO_MANY_REQUESTS,
            "unavailable",
            "rate limit exceeded",
            None,
            cors,
        );
    }
    let principal = state.runtime.principal_context_from_headers(&headers);
    if matches!(principal.status, PrincipalStatus::Unavailable) {
        return api_op_json_error(
            StatusCode::SERVICE_UNAVAILABLE,
            ErrorCode::StorageUnavailable.as_str(),
            "credential store is temporarily unavailable",
            None,
            cors,
        );
    }
    if matches!(
        principal.status,
        PrincipalStatus::Anonymous | PrincipalStatus::Invalid
    ) {
        return api_op_json_error(
            StatusCode::UNAUTHORIZED,
            "unauthenticated",
            "authentication required",
            None,
            cors,
        );
    }

    let op_route = format!("{interface}.{op}");
    let payload = if body.is_empty() {
        b"null".to_vec()
    } else {
        body.to_vec()
    };
    let dispatcher = crate::wasm_registry::RegistryDispatcher {
        registry: state.runtime.wasm_registry.clone(),
        store: Arc::new(state.runtime.extension_storage.clone()),
    };
    let result = match crate::wasm_host::OpsDispatcher::dispatch(
        &dispatcher,
        &extension,
        &op_route,
        &payload,
        &principal.uri,
        0,
    ) {
        Ok(bytes) => bytes,
        Err(error) => return api_op_wit_error(error, cors),
    };
    let value = match serde_json::from_slice::<Value>(&result) {
        Ok(value) => value,
        Err(error) => {
            return api_op_json_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal",
                &format!("WASM result was not JSON: {error}"),
                None,
                cors,
            );
        }
    };
    json_response(StatusCode::OK, value, cors)
}

fn api_op_wit_error(error: crate::wasm_host::wit_types::Error, cors: HeaderMap) -> Response {
    let (status, code) = match error.code {
        crate::wasm_host::wit_types::ErrorCode::NotFound => (StatusCode::NOT_FOUND, "not-found"),
        crate::wasm_host::wit_types::ErrorCode::Conflict => (StatusCode::CONFLICT, "conflict"),
        crate::wasm_host::wit_types::ErrorCode::Forbidden => (StatusCode::FORBIDDEN, "forbidden"),
        crate::wasm_host::wit_types::ErrorCode::Unauthenticated => {
            (StatusCode::UNAUTHORIZED, "unauthenticated")
        }
        crate::wasm_host::wit_types::ErrorCode::BadInput => (StatusCode::BAD_REQUEST, "bad-input"),
        crate::wasm_host::wit_types::ErrorCode::Internal => {
            (StatusCode::INTERNAL_SERVER_ERROR, "internal")
        }
        crate::wasm_host::wit_types::ErrorCode::Unavailable => {
            (StatusCode::SERVICE_UNAVAILABLE, "unavailable")
        }
    };
    api_op_json_error(status, code, &error.message, error.path.as_deref(), cors)
}

fn api_op_json_error(
    status: StatusCode,
    code: &str,
    message: &str,
    path: Option<&str>,
    headers: HeaderMap,
) -> Response {
    let mut body = json!({
        "code": code,
        "message": message,
    });
    if let Some(path) = path
        && let Some(object) = body.as_object_mut()
    {
        object.insert("path".to_string(), json!(path));
    }
    json_response(status, body, headers)
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
        if query.trim_start().starts_with(kind) {
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
    // Read identifier characters, including dotted kernel fields.
    let mut ident = String::new();
    while let Some(c) = chars.peek().copied() {
        if c.is_ascii_alphanumeric() || c == '_' || c == '.' {
            ident.push(c);
            chars.next();
        } else {
            break;
        }
    }
    // GraphQL aliases are shaped `alias: field(...)`. The dispatch
    // decision belongs to the actual field, not the alias token.
    while let Some(c) = chars.peek().copied() {
        if c.is_whitespace() {
            chars.next();
        } else {
            break;
        }
    }
    if matches!(chars.peek(), Some(':')) {
        chars.next();
        while let Some(c) = chars.peek().copied() {
            if c.is_whitespace() {
                chars.next();
            } else {
                break;
            }
        }
        let mut aliased_ident = String::new();
        while let Some(c) = chars.peek().copied() {
            if c.is_ascii_alphanumeric() || c == '_' || c == '.' {
                aliased_ident.push(c);
                chars.next();
            } else {
                break;
            }
        }
        if !aliased_ident.is_empty() {
            ident = aliased_ident;
        }
    }
    if ident.is_empty() { None } else { Some(ident) }
}

fn comments_thread_query(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return *r,
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
        Err(r) => return *r,
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
    match state
        .runtime
        .create_comment(target, parent, body, author_ref)
    {
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
        Err(r) => return *r,
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
        Err(r) => return *r,
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

fn cors_or_response(state: &AppState, headers: &HeaderMap) -> ResponseResult<HeaderMap> {
    state.runtime.check_boundary(headers, "/graphql")
}

/// CORS + rate-limit + authentication. Every GraphQL request that reaches
/// a handler has flowed through this guard, so handlers do not need to
/// re-check the principal. Returns the CORS HeaderMap to attach to the
/// downstream response, or an `Err` response (401/429/etc.) with CORS
/// headers already on it.
pub(crate) fn graphql_guard(state: &AppState, headers: &HeaderMap) -> ResponseResult<HeaderMap> {
    let cors = cors_or_response(state, headers)?;
    state.runtime.rate_limit(
        &format!("graphql:{}", principal_fingerprint(headers)),
        state.runtime.config.rate_limits.graphql_per_principal,
    )?;
    let principal = state.runtime.principal_from_headers(headers);
    require_authenticated_principal(principal, cors)
}

/// Guard for read-only GraphQL: permits anonymous callers (zero-auth public
/// read access) but still rejects an `Invalid` (malformed/expired) credential.
/// The caller visibility-filters results by principal — anonymous sees PUBLIC
/// repositories only; authenticated principals see all.
pub(crate) fn graphql_read_guard(
    state: &AppState,
    headers: &HeaderMap,
) -> ResponseResult<HeaderMap> {
    let cors = cors_or_response(state, headers)?;
    state.runtime.rate_limit(
        &format!("graphql:{}", principal_fingerprint(headers)),
        state.runtime.config.rate_limits.graphql_per_principal,
    )?;
    let principal = state.runtime.principal_from_headers(headers);
    if matches!(principal, PrincipalStatus::Unavailable) {
        return Err(Box::new(graphql_error_response(
            StatusCode::SERVICE_UNAVAILABLE,
            ErrorCode::StorageUnavailable.as_str(),
            "credential store is temporarily unavailable",
            cors,
        )));
    }
    if matches!(principal, PrincipalStatus::Invalid) {
        return Err(Box::new(graphql_error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "invalid credential",
            cors,
        )));
    }
    Ok(cors)
}

/// Reject `Anonymous` and `Invalid` principals. Preserves `cors` headers on
/// the error response so cross-origin browsers receive a real 401 instead
/// of an opaque CORS failure. Centralised so the GraphQL guard and the
/// `/api/ops/*` handler share the exact same predicate.
pub(crate) fn require_authenticated_principal(
    principal: PrincipalStatus,
    cors: HeaderMap,
) -> ResponseResult<HeaderMap> {
    if matches!(principal, PrincipalStatus::Unavailable) {
        return Err(Box::new(graphql_error_response(
            StatusCode::SERVICE_UNAVAILABLE,
            ErrorCode::StorageUnavailable.as_str(),
            "credential store is temporarily unavailable",
            cors,
        )));
    }
    if matches!(
        principal,
        PrincipalStatus::Anonymous | PrincipalStatus::Invalid
    ) {
        return Err(Box::new(graphql_error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "authentication required",
            cors,
        )));
    }
    Ok(cors)
}

fn relations_create_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return *r,
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
        Err(r) => return *r,
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
        Err(r) => return *r,
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
        Err(r) => return *r,
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
        Err(r) => return *r,
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

/// Admin-only manual config sync (the /admin "Sync now" button). Fast-forwards
/// the config repo, reconciles live on change, and returns the sync status.
fn sync_config_mutation(state: AppState, headers: HeaderMap, _payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return *r,
    };
    if !matches!(
        state.runtime.principal_from_headers(&headers),
        PrincipalStatus::AdminCredential | PrincipalStatus::OperatorCredential
    ) {
        return graphql_error_response(
            StatusCode::FORBIDDEN,
            ErrorCode::Forbidden.as_str(),
            "syncConfig requires an admin session",
            cors,
        );
    }
    let Some(repo) = config_sync::ConfigRepo::from_env(&state.runtime.data_dir) else {
        return graphql_error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "instance has no configured config repo (COMTRYA_CONFIG_REPO_URL is unset)",
            cors,
        );
    };
    // poll() does blocking git I/O; consistent with the other sync mutation
    // handlers, and manual sync is rare. Never hold the status lock across
    // reconcile_live — the reconciler locks it internally.
    match repo.poll() {
        Ok(config_sync::SyncPoll::Changed { commit, config }) => {
            reconcile::reconcile_live(&state.runtime, &config);
            if let Ok(mut status) = state.runtime.config_sync_status.lock() {
                status.record_synced(commit, now_seconds());
            }
        }
        Ok(config_sync::SyncPoll::Unchanged { commit }) => {
            if let Ok(mut status) = state.runtime.config_sync_status.lock() {
                status.record_synced(commit, now_seconds());
            }
        }
        Err(error) => {
            if let Ok(mut status) = state.runtime.config_sync_status.lock() {
                status.record_error(error.clone(), now_seconds());
            }
            return graphql_error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                &error,
                cors,
            );
        }
    }
    let snapshot = state
        .runtime
        .config_sync_status
        .lock()
        .ok()
        .and_then(|status| serde_json::to_value(&*status).ok())
        .unwrap_or(Value::Null);
    json_response(
        StatusCode::OK,
        json!({ "data": { "syncConfig": snapshot } }),
        cors,
    )
}

fn create_repository_mutation(state: AppState, headers: HeaderMap, payload: Value) -> Response {
    let cors = match graphql_guard(&state, &headers) {
        Ok(c) => c,
        Err(r) => return *r,
    };
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
    match state
        .runtime
        .create_repository_document(path, clone_from_url)
    {
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
        Err(error) => {
            let (status, code) = match &error {
                CreateRepoError::Conflict(_) => (StatusCode::CONFLICT, "CONFLICT"),
                CreateRepoError::BadInput(_) => {
                    (StatusCode::BAD_REQUEST, ErrorCode::BadUserInput.as_str())
                }
                CreateRepoError::Internal(_) => {
                    (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR")
                }
            };
            graphql_error_response(status, code, error.message(), cors)
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
    // Reads are zero-auth: anonymous callers are allowed (and PUBLIC-filtered
    // below); only Invalid credentials are rejected. Writes (mutations) keep
    // the stricter `graphql_guard`.
    let cors = match graphql_read_guard(&state, &headers) {
        Ok(cors) => cors,
        Err(response) => return *response,
    };
    let principal = state.runtime.principal_from_headers(&headers);
    let runtime_data = match state.runtime.runtime_payload() {
        Ok(payload) => payload,
        Err(error) => {
            return error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                ErrorCode::StorageUnavailable.as_str(),
                &error,
            );
        }
    };
    let repository = Value::Null;
    let capabilities = InstanceCapabilities::v1();

    // Resolve workspace.repositoryByPath from query variables if provided.
    let repositories_value = runtime_data
        .get("repositories")
        .cloned()
        .unwrap_or_else(|| json!([]));
    // Zero-auth read access is PUBLIC-only: anonymous callers see only public
    // repositories; authenticated principals (OIDC admin / operator) see all.
    // Visibility is resolved from each repo's `comtrya.cue` (the source of
    // truth, memoised in the CUE cache) rather than the stored document field,
    // so flipping `repository.visibility` to "public" in CUE takes effect on
    // the next read after a push with no stored copy to reconcile. Every
    // downstream read field (repositoryByPath, repositories, repository)
    // derives from this list, so filtering here covers the whole read surface.
    let repositories_value = if matches!(principal, PrincipalStatus::Anonymous) {
        let repositories_root = state.runtime.data_dir.join("repositories");
        let schemas = state.runtime.collected_cue_schemas();
        Value::Array(
            repositories_value
                .as_array()
                .map(|repos| {
                    repos
                        .iter()
                        .filter(|repo| {
                            effective_repository_visibility(
                                repo,
                                &repositories_root,
                                &state.runtime.cue_config_cache,
                                &schemas,
                            ) == "PUBLIC"
                        })
                        .cloned()
                        .collect()
                })
                .unwrap_or_default(),
        )
    } else {
        repositories_value
    };
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
        resolve_repository_by_path(&repositories_value, &path_segments).unwrap_or(json!(null));
    // Enrich repositoryByPath with derived fields (groups, on-disk git data)
    // so the code-browser widget can render any imported or created repo.
    if let Some(repo_obj) = repository_by_path.as_object_mut()
        && let Some(canonical) = repo_obj
            .get("path")
            .and_then(Value::as_str)
            .map(str::to_owned)
    {
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
            // Evaluate this repo's `package comtrya` CUE config so the
            // Projects panel and ext_docs work for any path-resolved
            // repository.
            let schemas = state.runtime.collected_cue_schemas();
            let comtrya_config = state.runtime.cue_config_cache.evaluate(
                &git_dir,
                &repo_config_ref(&git_dir),
                &schemas,
            );
            apply_repository_cue_overrides(repo_obj, &comtrya_config);
            annotate_bookmarks_with_resolution(repo_obj, &git_dir);
            repo_obj.insert("comtryaConfig".to_string(), (*comtrya_config).clone());

            // CommitDetail.vue asks for `commitDiff(oid: $oid)` on
            // repositoryByPath. The JSON-shim shaper builds responses
            // by checking the query for field names; populate the
            // field only when the query asks for it AND the caller
            // supplied an oid variable.
            let query_str = payload.get("query").and_then(Value::as_str).unwrap_or("");
            let oid_var = payload
                .get("variables")
                .and_then(|v| v.get("oid"))
                .and_then(Value::as_str);
            if query_str.contains("commitDiff")
                && let Some(oid) = oid_var
            {
                repo_obj.insert("commitDiff".to_string(), commit_diff_payload(&git_dir, oid));
            }
        }
    }

    // Enrich repositories with groups[], openPullRequests, checkSummary, lastCommitAt.
    let pull_requests_for_summary = runtime_data
        .get("pullRequests")
        .cloned()
        .unwrap_or_else(|| json!([]));
    let checks_for_summary = runtime_data
        .get("checks")
        .cloned()
        .unwrap_or_else(|| json!([]));
    let schemas_for_overlay = state.runtime.collected_cue_schemas();
    let repositories_root = state.runtime.data_dir.join("repositories");
    let enriched_repositories: Value = Value::Array(
        repositories_value
            .as_array()
            .map(Vec::as_slice)
            .unwrap_or(&[])
            .iter()
            .map(|repo| {
                let mut summary =
                    build_repository_summary(repo, &pull_requests_for_summary, &checks_for_summary);
                // Apply per-repo CUE overrides on the summary so the
                // workspace list reflects the same `visibility`,
                // `defaultBranch`, `vcs`, `description` that the path
                // resolver surfaces on RepoHome. Each repo is its own
                // bare git dir under the repositories root.
                if let Some(obj) = summary.as_object_mut()
                    && let Some(path) = obj.get("path").and_then(Value::as_str)
                {
                    let git_dir = repositories_root.join(format!("{path}.git"));
                    if git_dir.is_dir() {
                        let comtrya_config = state.runtime.cue_config_cache.evaluate(
                            &git_dir,
                            &repo_config_ref(&git_dir),
                            &schemas_for_overlay,
                        );
                        apply_repository_cue_overrides(obj, &comtrya_config);
                        annotate_bookmarks_with_resolution(obj, &git_dir);
                    }
                }
                summary
            })
            .collect(),
    );

    // Build the workspace object enriched with the repositoryByPath resolver result,
    // the enriched repositories list, and workspace.events filtered to viewer-accessible repos.
    let workspace = {
        let mut ws = runtime_data
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
            let activity_events = runtime_data
                .get("activity")
                .cloned()
                .unwrap_or_else(|| json!([]));
            let filtered_events = filter_events_for_viewer(&activity_events, &all_repo_ids);
            // workspace.events: scoped, filtered activity feed (scope fixed to WORKSPACE in v1).
            obj.insert(
                "events".to_string(),
                serde_json::Value::Array(filtered_events),
            );
        }
        ws
    };

    // Build the viewer object with host-side aggregated fields.
    // v1: aggregated:true flag signals federated planner (V3_PLAN item 9) can replace later.
    // TODO: v1 stub — `viewer.id` is a placeholder. Once real OIDC auth flows through
    // the GraphQL handler, replace with the authenticated subject. Until then,
    // `build_authored_pulls` will always return empty because seed PRs use
    // real-looking author names like "rawkode"/"alice"/"mira".
    let viewer_permissions = viewer_permissions_for(principal);
    let viewer_stub = json!({
        "id": "viewer",
        "permissions": viewer_permissions.clone(),
    });
    let viewer = json!({
        "authenticated": principal != PrincipalStatus::Anonymous,
        "permissions": viewer_permissions,
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
                        "gitPush": capabilities.git_push,
                        "gitLFS": capabilities.git_lfs,
                        "sse": capabilities.sse,
                        "graphqlSubscriptions": capabilities.graphql_subscriptions,
                        "extensionRuntime": capabilities.extension_runtime
                    }
                },
                // Admin-only: non-admins see null and the shell hides /admin.
                "adminTelemetry": if matches!(
                    principal,
                    PrincipalStatus::AdminCredential | PrincipalStatus::OperatorCredential
                ) {
                    state.runtime.admin_telemetry()
                } else {
                    Value::Null
                },
                "workspace": workspace,
                "repository": repository,
                "repositories": repositories_value,
                "labels": state
                    .runtime
                    .extension_storage
                    .collection_data("labels")
                    .unwrap_or_else(|_| json!([])),
                "extensionInstallations": inject_route_prefix(
                    runtime_data.get("extensions").cloned().unwrap_or_else(|| json!([])),
                    &state.runtime.config.extensions,
                    &state.runtime.extension_runtime,
                )
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
        Err(response) => return *response,
    };
    let principal = if let Some(session) = session {
        match state.runtime.consume_session(&session) {
            Ok(principal) => principal,
            Err(response) => return *response,
        }
    } else {
        state.runtime.principal_from_headers(&headers)
    };
    if !matches!(
        principal,
        PrincipalStatus::OperatorCredential
            | PrincipalStatus::AdminCredential
            | PrincipalStatus::Credential
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
        Err(response) => return *response,
    };
    let principal = state.runtime.principal_from_headers(&headers);
    if !matches!(
        principal,
        PrincipalStatus::OperatorCredential
            | PrincipalStatus::AdminCredential
            | PrincipalStatus::Credential
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
        Err(response) => return *response,
    };
    // Throttle operator-code guesses before the comparison: the operator
    // code is the bootstrap admin secret, so an unauthenticated caller must
    // not get unlimited online brute-force attempts. Anonymous callers key
    // on forwarded address (or a shared `anon` bucket as a last resort).
    if let Err(response) = state.runtime.rate_limit(
        &format!("token_exchange:{}", principal_fingerprint(&headers)),
        state
            .runtime
            .config
            .rate_limits
            .token_exchange_per_principal,
    ) {
        let mut response = *response;
        response.headers_mut().extend(cors);
        return response;
    }
    if request.grant_type != "urn:comtrya:grant:operator-code"
        || request.subject_token_type != "urn:comtrya:token-type:operator-code"
    {
        return error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "unsupported production-testbed token exchange grant",
        );
    }
    // Compare the configured operator code with the attacker-supplied subject
    // token in constant time. Hashing both to a fixed-size digest first means
    // neither the byte-by-byte content nor the length of the secret leaks
    // through a timing side channel.
    let operator_code_matches =
        state
            .runtime
            .options
            .operator_code
            .as_deref()
            .is_some_and(|code| {
                let expected = Sha256::digest(code.as_bytes());
                let presented = Sha256::digest(request.subject_token.as_bytes());
                expected.ct_eq(presented.as_slice()).into()
            });
    if !operator_code_matches {
        return error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "subject token did not validate against the configured operator code",
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateGitTokenRequest {
    name: String,
    scopes: Vec<String>,
    expires_in_days: Option<u64>,
}

/// Resolve the authenticated principal for an account-token API route,
/// returning the CORS headers and principal context. Anonymous/invalid
/// callers are rejected with 401 (with CORS headers attached).
fn account_api_principal(
    state: &AppState,
    headers: &HeaderMap,
    route: &str,
) -> Result<(HeaderMap, PrincipalContext), Box<Response>> {
    let cors = state.runtime.check_boundary(headers, route)?;
    let principal = state.runtime.principal_context_from_headers(headers);
    if matches!(
        principal.status,
        PrincipalStatus::Anonymous | PrincipalStatus::Invalid
    ) {
        let mut response = error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "account Git tokens require an authenticated session",
        );
        response.headers_mut().extend(cors);
        return Err(Box::new(response));
    }
    Ok((cors, principal))
}

async fn list_git_tokens(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (cors, principal) = match account_api_principal(&state, &headers, "/api/account/git-tokens")
    {
        Ok(result) => result,
        Err(response) => return *response,
    };
    match state
        .runtime
        .list_git_personal_access_tokens(&principal.uri)
    {
        Ok(tokens) => json_response(
            StatusCode::OK,
            json!({ "personalAccessTokens": tokens }),
            cors,
        ),
        Err(error) => {
            tracing::error!(%error, "list Git personal access tokens failed");
            let mut response = error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorCode::InternalServerError.as_str(),
                "Git token storage failed",
            );
            response.headers_mut().extend(cors);
            response
        }
    }
}

async fn create_git_token(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateGitTokenRequest>,
) -> Response {
    let (cors, principal) = match account_api_principal(&state, &headers, "/api/account/git-tokens")
    {
        Ok(result) => result,
        Err(response) => return *response,
    };
    let name = request.name.trim();
    if name.is_empty() || name.len() > 80 {
        let mut response = error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "Git token name must be 1-80 characters",
        );
        response.headers_mut().extend(cors);
        return response;
    }
    if request.scopes.is_empty()
        || request
            .scopes
            .iter()
            .any(|scope| !matches!(scope.as_str(), "git:read" | "git:write"))
    {
        let mut response = error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "Git token scopes must include only git:read and git:write",
        );
        response.headers_mut().extend(cors);
        return response;
    }
    let mut scopes = request.scopes;
    scopes.sort();
    scopes.dedup();
    // Minting a token can only grant scopes the session itself already holds.
    if scopes
        .iter()
        .any(|scope| !state.runtime.credential_allows(&headers, scope))
    {
        let mut response = error_response(
            StatusCode::FORBIDDEN,
            ErrorCode::Forbidden.as_str(),
            "authenticated session cannot mint the requested Git token scopes",
        );
        response.headers_mut().extend(cors);
        return response;
    }
    let expires_in_days = request.expires_in_days.or(Some(90));
    if expires_in_days.is_some_and(|days| days == 0 || days > 365) {
        let mut response = error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "Git token expiry must be between 1 and 365 days",
        );
        response.headers_mut().extend(cors);
        return response;
    }

    match state.runtime.create_git_personal_access_token(
        &principal.uri,
        name,
        scopes,
        expires_in_days,
    ) {
        Ok((token, record)) => json_response(
            StatusCode::CREATED,
            json!({
                "token": token,
                "personalAccessToken": record,
            }),
            cors,
        ),
        Err(error) => {
            tracing::error!(%error, "create Git personal access token failed");
            let mut response = error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorCode::InternalServerError.as_str(),
                "Git token storage failed",
            );
            response.headers_mut().extend(cors);
            response
        }
    }
}

async fn revoke_git_token(
    State(state): State<AppState>,
    headers: HeaderMap,
    AxumPath(id): AxumPath<String>,
) -> Response {
    let (cors, principal) =
        match account_api_principal(&state, &headers, "/api/account/git-tokens/:id") {
            Ok(result) => result,
            Err(response) => return *response,
        };
    match state
        .runtime
        .revoke_git_personal_access_token(&principal.uri, &id)
    {
        Ok(true) => json_response(StatusCode::OK, json!({ "revoked": true }), cors),
        Ok(false) => {
            let mut response = error_response(
                StatusCode::NOT_FOUND,
                ErrorCode::NotFound.as_str(),
                "Git token was not found",
            );
            response.headers_mut().extend(cors);
            response
        }
        Err(error) => {
            tracing::error!(%error, "revoke Git personal access token failed");
            let mut response = error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorCode::InternalServerError.as_str(),
                "Git token storage failed",
            );
            response.headers_mut().extend(cors);
            response
        }
    }
}

async fn oidc_providers(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/auth/oidc/providers")
    {
        Ok(c) => c,
        Err(r) => return *r,
    };
    let providers = state
        .runtime
        .config
        .oidc_issuers
        .iter()
        .map(|issuer| {
            json!({
                "id": issuer.id.clone(),
                "loginUrl": format!("/auth/oidc/{}/login", issuer.id),
            })
        })
        .collect::<Vec<_>>();
    json_response(StatusCode::OK, json!({ "providers": providers }), cors)
}

async fn oidc_login(
    State(state): State<AppState>,
    AxumPath(provider): AxumPath<String>,
    headers: HeaderMap,
) -> Response {
    let route = format!("/auth/oidc/{provider}/login");
    let cors = match state.runtime.check_boundary(&headers, &route) {
        Ok(c) => c,
        Err(r) => return *r,
    };

    // Every error return AFTER `cors` is obtained must pass `cors` through,
    // else cross-origin browsers see an opaque CORS failure instead of the
    // 4xx/5xx body.
    let err = |status: StatusCode, code: &str, msg: &str| -> Response {
        json_response(
            status,
            json!({"errors": [{"message": msg, "extensions": {"code": code}}]}),
            cors.clone(),
        )
    };

    let issuer = match state
        .runtime
        .config
        .oidc_issuers
        .iter()
        .find(|i| i.id == provider)
    {
        Some(i) => i.clone(),
        None => {
            return err(
                StatusCode::NOT_FOUND,
                ErrorCode::NotFound.as_str(),
                &format!("unknown OIDC provider: {provider}"),
            );
        }
    };

    // Parse redirect URL eagerly — config validation doesn't call
    // RedirectUrl::new, so a malformed URL would blow up inside the
    // builder chain.
    let redirect_uri = match openidconnect::RedirectUrl::new(issuer.redirect_url.clone()) {
        Ok(u) => u,
        Err(e) => {
            return err(
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorCode::ConfigInvalid.as_str(),
                &format!("invalid OIDC redirect_url in config: {e}"),
            );
        }
    };

    let metadata = match state
        .runtime
        .oidc_discovery
        .get_or_fetch(&issuer.id, &issuer.issuer_url)
        .await
    {
        Ok(m) => m,
        Err(e) => {
            // Discovery endpoint unreachable / returned non-JSON / etc.
            // `StorageUnavailable` is the closest existing `ErrorCode` —
            // semantically "an upstream we depend on isn't responding."
            return err(
                StatusCode::BAD_GATEWAY,
                ErrorCode::StorageUnavailable.as_str(),
                &format!("OIDC discovery failed: {e}"),
            );
        }
    };

    let client = openidconnect::core::CoreClient::from_provider_metadata(
        metadata,
        openidconnect::ClientId::new(issuer.client_id.clone()),
        issuer
            .client_secret
            .clone()
            .map(openidconnect::ClientSecret::new),
    )
    .set_redirect_uri(redirect_uri);

    let (challenge, verifier) = openidconnect::PkceCodeChallenge::new_random_sha256();
    let (auth_url, csrf_token, nonce) = client
        .authorize_url(
            openidconnect::AuthenticationFlow::<openidconnect::core::CoreResponseType>::AuthorizationCode,
            openidconnect::CsrfToken::new_random,
            openidconnect::Nonce::new_random,
        )
        .add_scope(openidconnect::Scope::new("email".to_string()))
        .add_scope(openidconnect::Scope::new("profile".to_string()))
        .set_pkce_challenge(challenge)
        .url();

    // Capture `now` once so the session's created_at matches the
    // eviction cutoff exactly — guards against the (very unlikely)
    // case of the system clock advancing between two adjacent
    // `now_seconds()` calls.
    let now = now_seconds();
    if state
        .runtime
        .oidc_sessions
        .insert(
            csrf_token.secret().clone(),
            oidc::OidcLoginSession {
                provider_id: issuer.id.clone(),
                pkce_verifier: verifier,
                nonce,
                created_at_secs: now,
            },
            now,
        )
        .is_err()
    {
        return err(
            StatusCode::TOO_MANY_REQUESTS,
            ErrorCode::RateLimited.as_str(),
            "too many in-flight OIDC logins; try again",
        );
    }

    // `auth_url` is built from the IdP's discovered authorization
    // endpoint — operator-trust-boundary input, not entirely under our
    // control. Avoid panicking on a non-ASCII char in the URL: an
    // operator who misconfigures `issuer_url` to a path with extended
    // characters would otherwise crash the async task.
    let location = match HeaderValue::from_str(auth_url.as_str()) {
        Ok(v) => v,
        Err(_) => {
            return err(
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorCode::ConfigInvalid.as_str(),
                "OIDC authorization endpoint URL is not a valid HTTP header value",
            );
        }
    };
    let mut response = Response::new(axum::body::Body::empty());
    *response.status_mut() = StatusCode::FOUND;
    response
        .headers_mut()
        .insert(axum::http::header::LOCATION, location);
    response.headers_mut().extend(cors);
    response
}

/// Build the `Set-Cookie` header value for a freshly issued session.
/// `Secure` is set only when `tls_terminated == true` — operators
/// behind a TLS-terminating proxy must opt-in via that flag.
/// `X-Forwarded-Proto` is intentionally NOT consulted here
/// (header-trust questions are out of scope for #16's callback PR).
fn session_cookie_value(token: &str, ttl_secs: u64, secure: bool) -> String {
    let secure_attr = if secure { "; Secure" } else { "" };
    format!(
        "{COMTRYA_SESSION_COOKIE}={token}; HttpOnly{secure_attr}; SameSite=Lax; Path=/; Max-Age={ttl_secs}"
    )
}

#[derive(Debug, Deserialize)]
struct OidcCallbackQuery {
    state: Option<String>,
    code: Option<String>,
}

/// OIDC callback handler. Completes the authorization-code flow
/// started by [`oidc_login`]:
/// 1. Pull `state` + `code` from the query string.
/// 2. Single-use `take` the matching session from the in-flight store.
/// 3. Look up the provider's config + cached metadata.
/// 4. Hand off to `OidcCodeExchanger::exchange` for the token round-trip
///    + ID-token signature/audience/issuer/nonce verification.
/// 5. Upsert the user via `AuthService::login` (Mutex acquired AFTER
///    the async exchange; guard dropped at the statement end — never
///    held across an `.await`).
/// 6. Issue a browser credential and set a `comtrya_session` cookie.
/// 7. 302 redirect to `/`.
///
/// Logging discipline: NO tracing event or audit log entry emitted by
/// this handler contains `code`, `state`, `pkce_verifier`, `nonce`,
/// `client_secret`, or the issued session token. Future
/// `#[instrument]` additions must `skip(...)` every credential
/// parameter.
async fn oidc_callback(
    State(state): State<AppState>,
    AxumPath(provider): AxumPath<String>,
    Query(query): Query<OidcCallbackQuery>,
    headers: HeaderMap,
) -> Response {
    let route = format!("/auth/oidc/{provider}/callback");
    let cors = match state.runtime.check_boundary(&headers, &route) {
        Ok(c) => c,
        Err(r) => return *r,
    };

    let err = |status: StatusCode, code: &str, msg: &str| -> Response {
        json_response(
            status,
            json!({"errors": [{"message": msg, "extensions": {"code": code}}]}),
            cors.clone(),
        )
    };

    // 1. Required query params.
    let (Some(callback_state), Some(code)) = (query.state, query.code) else {
        return err(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "OIDC callback requires both `state` and `code` query parameters",
        );
    };

    // 2. Single-use session lookup. `take` removes the entry; replays
    //    or unknown state values yield 401.
    let login_session = match state.runtime.oidc_sessions.take(&callback_state) {
        Some(s) => s,
        None => {
            return err(
                StatusCode::UNAUTHORIZED,
                ErrorCode::Unauthenticated.as_str(),
                "OIDC callback state is unknown, expired, or already consumed",
            );
        }
    };

    // 2b. Path provider must match the provider this session was issued
    //     for, otherwise a state from provider A could be replayed at
    //     provider B's callback.
    if login_session.provider_id != provider {
        return err(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "OIDC callback provider does not match the in-flight session",
        );
    }

    // 3. Provider config from instance config.
    let issuer = match state
        .runtime
        .config
        .oidc_issuers
        .iter()
        .find(|i| i.id == provider)
    {
        Some(i) => i.clone(),
        None => {
            return err(
                StatusCode::NOT_FOUND,
                ErrorCode::NotFound.as_str(),
                &format!("unknown OIDC provider: {provider}"),
            );
        }
    };

    // 3b. Cached metadata. Login already fetched this; cache hit
    //     expected.
    let metadata = match state
        .runtime
        .oidc_discovery
        .get_or_fetch(&issuer.id, &issuer.issuer_url)
        .await
    {
        Ok(m) => m,
        Err(_e) => {
            return err(
                StatusCode::BAD_GATEWAY,
                ErrorCode::StorageUnavailable.as_str(),
                "OIDC discovery unavailable",
            );
        }
    };

    // 4. Exchange + verify. Error message is scrubbed — don't leak
    //    upstream verification internals.
    let claims = match state
        .runtime
        .oidc_discovery
        .exchanger
        .exchange(oidc::OidcCodeExchangeRequest {
            metadata,
            client_id: issuer.client_id.clone(),
            client_secret: issuer.client_secret.clone(),
            redirect_url: issuer.redirect_url.clone(),
            pkce_verifier: login_session.pkce_verifier,
            nonce: login_session.nonce,
            code,
        })
        .await
    {
        Ok(c) => c,
        Err(error) => {
            // The user-facing message stays scrubbed, but operators need the
            // real reason (issuer/audience/nonce/signature mismatch, token
            // endpoint rejection). The error string carries no code, nonce,
            // verifier, or secret — only the verification/transport detail.
            tracing::warn!(
                provider = %provider,
                error = %error,
                "OIDC callback: code exchange or ID-token verification failed"
            );
            return err(
                StatusCode::UNAUTHORIZED,
                ErrorCode::Unauthenticated.as_str(),
                "OIDC code exchange or ID-token verification failed",
            );
        }
    };

    // 5. Upsert user. Mutex lock comes AFTER the async exchange and
    //    drops at this statement's semicolon — never held across an
    //    `.await`.
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_millis() as u64)
        .unwrap_or(0);
    let login_result = state
        .runtime
        .auth_service
        .lock()
        .expect("auth_service lock not poisoned")
        .login(&issuer.id, claims, now_ms);
    let login = match login_result {
        Ok(l) => l,
        Err(core_err) => {
            use comtrya_core::error::ErrorCode as CoreErr;
            let (status, code) = match core_err.code {
                CoreErr::Forbidden => (StatusCode::FORBIDDEN, ErrorCode::Forbidden.as_str()),
                _ => (
                    StatusCode::UNAUTHORIZED,
                    ErrorCode::Unauthenticated.as_str(),
                ),
            };
            return err(status, code, &core_err.message);
        }
    };

    // 6. Issue a browser credential. Claims matching a configured admin mint an
    //    AdminCredential (gates /admin surfaces); everyone else gets a plain
    //    OIDC-authenticated Credential. The HttpOnly cookie carries a credential
    //    token, not a single-use event session, so normal browser fetches can
    //    authenticate via `credentials: "include"`.
    let principal = if state.runtime.is_admin_claims(
        &login.user.issuer,
        &login.user.subject,
        login.user.email.as_deref(),
    ) {
        PrincipalStatus::AdminCredential
    } else {
        PrincipalStatus::Credential
    };
    let token = state.runtime.issue_credential(
        "comtrya://workspace".to_string(),
        OIDC_BROWSER_ACTIONS
            .iter()
            .map(|action| action.to_string())
            .collect(),
        principal,
    );
    let cookie = session_cookie_value(
        &token,
        state.runtime.options.session_ttl_seconds,
        state.runtime.options.tls_terminated,
    );
    let cookie_value = match HeaderValue::from_str(&cookie) {
        Ok(v) => v,
        Err(_) => {
            return err(
                StatusCode::INTERNAL_SERVER_ERROR,
                ErrorCode::InternalServerError.as_str(),
                "session cookie value not valid as HTTP header",
            );
        }
    };

    // 7. 302 to root. Frontend wiring (return_to support, post-login
    //    UX) lands separately.
    let mut response = Response::new(axum::body::Body::empty());
    *response.status_mut() = StatusCode::FOUND;
    response
        .headers_mut()
        .insert(axum::http::header::LOCATION, HeaderValue::from_static("/"));
    response
        .headers_mut()
        .insert(axum::http::header::SET_COOKIE, cookie_value);
    response.headers_mut().extend(cors);
    // login.user.id is not a secret; safe to log.
    let _ = state.runtime.append_audit(
        "dev.comtrya.oidc.login.completed",
        json!({
            "user_id": login.user.id.as_str(),
            "created": login.created,
            "provider": provider,
        }),
    );
    response
}

async fn extension_manifest(
    State(state): State<AppState>,
    AxumPath(extension): AxumPath<String>,
    headers: HeaderMap,
) -> Response {
    let cors_route = format!("/_extensions/{extension}/manifest.json");
    let cors = match state.runtime.check_boundary(&headers, &cors_route) {
        Ok(cors) => cors,
        Err(response) => return *response,
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
    let cors_route = format!("/_extensions/{extension}/assets/{asset_path}");
    let cors = match state.runtime.check_boundary(&headers, &cors_route) {
        Ok(cors) => cors,
        Err(response) => return *response,
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
    // ETag is a cache optimization, not a correctness contract. If
    // for some reason the computed etag isn't a valid HeaderValue
    // (would require a non-visible-ASCII byte in the SHA-256 hex —
    // impossible today, but the defensive fallback survives a future
    // etag-format change), serve the asset without the header rather
    // than panicking the handler.
    if let Ok(value) = HeaderValue::from_str(etag) {
        response.headers_mut().insert(ETAG, value);
    } else {
        // Matches the eprintln!-based diagnostics pattern in
        // wasm_registry.rs; PR #28's tracing sweep will convert
        // both to `tracing::warn!`.
        eprintln!("skip malformed ETag {etag:?} — extension asset served without cache header");
    }
}

async fn git_endpoint(
    State(state): State<AppState>,
    headers: HeaderMap,
    _method: Method,
    AxumPath(path): AxumPath<String>,
    RawQuery(raw_query): RawQuery,
    body: Bytes,
) -> Response {
    let cors = match state.runtime.check_boundary(&headers, "/git/*") {
        Ok(cors) => cors,
        Err(response) => return *response,
    };
    // Git clients authenticate either with a Comtrya browser/operator
    // credential (bearer/cookie) or with an HTTP Basic personal access token
    // (the PAT is the Basic password; the username is ignored). A Basic header
    // bypasses the credential-principal gate because the PAT is verified
    // against its scope below.
    let basic_password = basic_password_from_headers(&headers);
    let principal = state.runtime.principal_from_headers(&headers);
    if basic_password.is_none()
        && !matches!(
            principal,
            PrincipalStatus::OperatorCredential
                | PrincipalStatus::AdminCredential
                | PrincipalStatus::Credential
        )
    {
        let mut response = error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "Git smart HTTP requires a valid Comtrya credential or personal access token",
        );
        response.headers_mut().insert(
            "WWW-Authenticate",
            HeaderValue::from_static("Basic realm=\"comtrya\", Bearer realm=\"comtrya\""),
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
    // Per-principal rate limit. Pushes (receive-pack) and reads (info/refs,
    // upload-pack) have separate ceilings since a clone fan-out and a push are
    // very different load profiles. Each request spawns git plumbing under a
    // small semaphore, so an unbounded client is a resource-exhaustion vector.
    let receive_pack = is_receive_pack(&path, raw_query.as_deref());
    let (rate_bucket, rate_ceiling) = if receive_pack {
        (
            "git_receive_pack",
            state
                .runtime
                .config
                .rate_limits
                .git_receive_pack_per_principal,
        )
    } else {
        (
            "git_info_refs",
            state.runtime.config.rate_limits.git_info_refs_per_principal,
        )
    };
    if state
        .runtime
        .rate_limit(
            &format!("{rate_bucket}:{}", principal_fingerprint(&headers)),
            rate_ceiling,
        )
        .is_err()
    {
        return error_response(
            StatusCode::TOO_MANY_REQUESTS,
            ErrorCode::RateLimited.as_str(),
            "git rate limit exceeded",
        );
    }

    // Push (receive-pack) requires the git:write scope; reads (info/refs,
    // upload-pack) require git:read. The pure-Rust receive-pack responder in
    // comtrya-git-http applies per-ref CAS + connectivity checks once
    // dispatched.
    //
    // Writes (receive-pack) are PAT-only: a push must present a Basic-auth
    // personal access token carrying git:write. Bearer/cookie sessions cannot
    // push, so a CSRF'd browser cookie can never mutate a repository. Reads
    // accept either a credential with git:read or a Basic PAT with git:read.
    if receive_pack {
        let Some(password) = basic_password.as_deref() else {
            let mut response = error_response(
                StatusCode::UNAUTHORIZED,
                ErrorCode::Unauthenticated.as_str(),
                "Git push requires HTTP Basic authentication with a personal access token",
            );
            response.headers_mut().insert(
                "WWW-Authenticate",
                HeaderValue::from_static("Basic realm=\"comtrya\""),
            );
            return response;
        };
        if !state
            .runtime
            .git_personal_access_token_allows(password, "git:write")
        {
            return error_response(
                StatusCode::FORBIDDEN,
                ErrorCode::Forbidden.as_str(),
                "personal access token scope does not allow Git push",
            );
        }
    } else {
        let credential_reads = state.runtime.credential_allows(&headers, "git:read");
        let pat_reads = basic_password.as_deref().is_some_and(|password| {
            state
                .runtime
                .git_personal_access_token_allows(password, "git:read")
        });
        if !credential_reads && !pat_reads {
            let mut response = error_response(
                StatusCode::FORBIDDEN,
                ErrorCode::Forbidden.as_str(),
                "credential scope does not allow requested Git operation",
            );
            response.headers_mut().insert(
                "WWW-Authenticate",
                HeaderValue::from_static("Basic realm=\"comtrya\", Bearer realm=\"comtrya\""),
            );
            return response;
        }
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
        Err(response) => *response,
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
    repositories
        .as_array()?
        .iter()
        .find(|repo| {
            repo.get("path")
                .and_then(Value::as_str)
                .map(|p| p == path)
                .unwrap_or(false)
        })
        .cloned()
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
    let repo_check_items: Vec<&Value> = checks
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or(&[])
        .iter()
        .filter(|c| {
            let c_repo = c.get("repositoryID").and_then(Value::as_str).unwrap_or("");
            !c_repo.is_empty() && c_repo == repo_id
        })
        .collect();
    let check_total = repo_check_items.len();
    let check_passed = repo_check_items
        .iter()
        .filter(|c| c.get("conclusion").and_then(Value::as_str) == Some("SUCCESS"))
        .count();

    // lastCommitAt: prefer field already on the document; fall back to null.
    let last_commit_at = repo.get("lastCommitAt").cloned().unwrap_or(Value::Null);

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
                "passed": check_passed,
                "total": check_total
            }),
        );
        obj.insert("lastCommitAt".to_string(), last_commit_at);
    }
    summary
}

/// Returns pulls in REVIEW/READY where the viewer appears in `reviewers[]`.
/// When `reviewers` is absent (current seed shape), includes all REVIEW/READY pulls.
/// v1 fallback — federated planner (V3_PLAN item 9) will provide typed reviewer state.
/// Derive the `viewer.permissions` set reported at the GraphQL read
/// surface from the real authenticated principal. Anonymous callers get
/// an empty set (they hold no granted scopes); authenticated credentials
/// get the read/write scopes the kernel enforces; only admin/operator
/// principals carry `instance.admin`. This is the public-boundary view of
/// authorization — server-side enforcement (adminTelemetry, sync_config)
/// is separate — so it must not over-report scopes a caller does not hold.
fn viewer_permissions_for(principal: PrincipalStatus) -> Vec<&'static str> {
    match principal {
        PrincipalStatus::Anonymous | PrincipalStatus::Invalid | PrincipalStatus::Unavailable => {
            Vec::new()
        }
        PrincipalStatus::Credential => vec![
            "graphql:read",
            "graphql:write",
            "events:read",
            "git:read",
            "checks:read",
        ],
        PrincipalStatus::AdminCredential | PrincipalStatus::OperatorCredential => vec![
            "instance.admin",
            "graphql:read",
            "graphql:write",
            "events:read",
            "git:read",
            "checks:read",
        ],
    }
}

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
                Some(reviewers) => reviewers.iter().any(|r| r.as_str() == Some(viewer_id)),
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
                // No author field: include every FAILURE check.
                None => true,
            }
        })
        .take(limit)
        .collect();
    json!({ "aggregated": true, "items": items })
}

/// Filter an event array to only include events whose `repositoryID`
/// is present in `visible_repo_ids`.  Events without a `repositoryID` field are
/// excluded (defensive: unknown provenance).
///
/// # Scope argument note
/// The JSON-shaped GraphQL handler does not parse field arguments, so the
/// `scope: WORKSPACE | REPOSITORY` enum described in the plan is not yet wired.
/// TODO: parse scope argument when the federated planner lands; for now scope is
/// fixed to WORKSPACE (all viewer-accessible repos in the workspace).
pub fn filter_events_for_viewer(
    events: &serde_json::Value,
    visible_repo_ids: &[String],
) -> Vec<serde_json::Value> {
    events
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter(|ev| {
            let repo = ev
                .get("repositoryID")
                .and_then(|v| v.as_str())
                .unwrap_or("");
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
    "ext_docs",
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
    CoreVerb {
        uri: "comtrya://rel/part-of",
        symmetric: false,
    },
    CoreVerb {
        uri: "comtrya://rel/blocks",
        symmetric: false,
    },
    CoreVerb {
        uri: "comtrya://rel/relates-to",
        symmetric: true,
    },
    CoreVerb {
        uri: "comtrya://rel/duplicates",
        symmetric: false,
    },
    CoreVerb {
        uri: "comtrya://rel/mentions",
        symmetric: false,
    },
];

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
fn visibility_label(visibility: comtrya_core::Visibility) -> &'static str {
    match visibility {
        comtrya_core::Visibility::Public => "PUBLIC",
        comtrya_core::Visibility::Internal => "INTERNAL",
        comtrya_core::Visibility::Private => "PRIVATE",
    }
}

fn init_bare_repository_on_disk(
    project_root: &Path,
    canonical_path: &str,
) -> Result<PathBuf, String> {
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

/// The git ref to evaluate a repo's `package comtrya` config against:
/// its on-disk default branch (HEAD), falling back to `main` when HEAD
/// can't be read. A repo's CUE config — including its authoritative
/// visibility — lives on this branch, so every config read resolves it
/// the same way (filter, RepoHome, the workspace list).
pub(crate) fn repo_config_ref(git_dir: &Path) -> String {
    read_default_branch(git_dir).unwrap_or_else(|| "main".to_string())
}

/// A repository's effective visibility, with the per-repo `comtrya.cue`
/// `repository.visibility` block as the source of truth and the stored
/// document value as the fallback. Resolved through the shared
/// `CueConfigCache`, so the result is memoised per commit and only
/// re-derived after a push moves the default branch (or on restart) —
/// there is no separately persisted copy to reconcile.
///
/// Returns the uppercase API-contract form (`PUBLIC` / `INTERNAL` /
/// `PRIVATE`), matching `apply_repository_cue_overrides`.
fn effective_repository_visibility(
    repo: &Value,
    repositories_root: &Path,
    cache: &cue_config::CueConfigCache,
    schemas: &[cue_config::ExtensionSchema],
) -> String {
    let stored = repo
        .get("visibility")
        .and_then(Value::as_str)
        .unwrap_or("PRIVATE")
        .to_ascii_uppercase();
    let Some(path) = repo.get("path").and_then(Value::as_str) else {
        return stored;
    };
    let git_dir = repositories_root.join(format!("{path}.git"));
    if !git_dir.is_dir() {
        return stored;
    }
    let config = cache.evaluate(&git_dir, &repo_config_ref(&git_dir), schemas);
    config
        .get("repository")
        .and_then(Value::as_object)
        .and_then(|repo_block| repo_block.get("visibility"))
        .and_then(Value::as_str)
        .map(str::to_ascii_uppercase)
        .unwrap_or(stored)
}

/// Overlay the repo's CUE `repository` block onto a repo JSON object.
/// CUE is the source of truth where present; falls through to the
/// stored / git-derived defaults otherwise. CUE visibility is
/// lowercase; the JSON API contract is uppercase, so we uppercase
/// here at the I/O boundary.
fn apply_repository_cue_overrides(
    repo_obj: &mut serde_json::Map<String, Value>,
    comtrya_config: &Value,
) {
    let Some(repo_block) = comtrya_config.get("repository").and_then(Value::as_object) else {
        // No `repository:` block at all still means a fully-resolved repo:
        // strictly-off opt-in is the default, so stamp an explicit empty
        // set rather than leaving the field absent. Keeps the query payload
        // shape stable for the frontend and the phase-2 kernel boundary.
        repo_obj.insert("enabledExtensions".to_string(), Value::Array(Vec::new()));
        return;
    };
    if let Some(visibility) = repo_block.get("visibility").and_then(Value::as_str) {
        repo_obj.insert(
            "visibility".to_string(),
            json!(visibility.to_ascii_uppercase()),
        );
    }
    if let Some(branch) = repo_block.get("defaultBranch").and_then(Value::as_str) {
        repo_obj.insert("defaultBranch".to_string(), json!(branch));
    }
    if let Some(vcs) = repo_block.get("vcs").and_then(Value::as_str) {
        repo_obj.insert("vcs".to_string(), json!(vcs));
    }
    if let Some(description) = repo_block.get("description").and_then(Value::as_str) {
        repo_obj.insert("description".to_string(), json!(description));
    }
    if let Some(bookmarks) = repo_block.get("bookmarks").and_then(Value::as_array) {
        repo_obj.insert("bookmarks".to_string(), Value::Array(bookmarks.clone()));
    }
    // The per-repo opt-in set. CUE is the source of truth; absent =>
    // strictly off (empty set). Projected as `enabledExtensions` so the
    // frontend and the kernel boundary (phase 2) read the same field the
    // commit-keyed CUE cache re-derives on every push to the default
    // branch. Defaulted to `[]` here so a repo whose CUE omits the field
    // still carries an explicit empty set on the query payload.
    let enabled_extensions = repo_block
        .get("enabledExtensions")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    repo_obj.insert(
        "enabledExtensions".to_string(),
        Value::Array(enabled_extensions),
    );
    if let Some(labels) = repo_block.get("labels").and_then(Value::as_array) {
        // Surface the catalog twice: once as the structured array
        // (consumers that want the CUE shape) and once as a flat
        // map of wire-form names → metadata so a label string
        // (e.g. `kind::defect`) resolves to its presentation hints
        // with a single lookup.
        let mut catalog = serde_json::Map::new();
        for entry in labels {
            let Some(obj) = entry.as_object() else {
                continue;
            };
            let display = label_display_name(obj);
            if display.is_empty() {
                continue;
            }
            catalog.insert(display, Value::Object(obj.clone()));
        }
        repo_obj.insert("labels".to_string(), Value::Array(labels.clone()));
        repo_obj.insert("labelCatalog".to_string(), Value::Object(catalog));
    }
}

/// Compute the wire / display name of a label catalog entry. Plain
/// labels use `name`; both scoped and exclusive labels use the same
/// `type::value` wire form — exclusivity is a property of the
/// catalog entry, not the wire string. Consumers that need to know
/// whether a label is exclusive read the catalog by wire name.
fn label_display_name(obj: &serde_json::Map<String, Value>) -> String {
    let kind = obj.get("kind").and_then(Value::as_str).unwrap_or("");
    if kind == "plain"
        && let Some(name) = obj.get("name").and_then(Value::as_str)
        && !name.is_empty()
    {
        return name.to_string();
    }
    let Some(type_name) = obj.get("type").and_then(Value::as_str) else {
        return String::new();
    };
    let Some(value) = obj.get("value").and_then(Value::as_str) else {
        return String::new();
    };
    format!("{type_name}::{value}")
}

/// Walk the projected `bookmarks` array (if any) and annotate each
/// entry with `resolved` (bool) and, when resolved, `commit` (12-char
/// short OID) plus `oid` (full). The forge treats CUE bookmarks as
/// declarations of intent — unresolved is not an error, just a
/// signal to the user that the declared ref has drifted from the
/// backing repo.
fn annotate_bookmarks_with_resolution(
    repo_obj: &mut serde_json::Map<String, Value>,
    git_dir: &Path,
) {
    let Some(bookmarks) = repo_obj.get_mut("bookmarks").and_then(Value::as_array_mut) else {
        return;
    };
    for bookmark in bookmarks.iter_mut() {
        let Some(obj) = bookmark.as_object_mut() else {
            continue;
        };
        let Some(name) = obj.get("name").and_then(Value::as_str).map(str::to_owned) else {
            continue;
        };
        match resolve_bookmark_oid(git_dir, &name) {
            Some(oid) => {
                obj.insert("resolved".to_string(), json!(true));
                obj.insert(
                    "commit".to_string(),
                    json!(oid.chars().take(12).collect::<String>()),
                );
                obj.insert("oid".to_string(), json!(oid));
            }
            None => {
                obj.insert("resolved".to_string(), json!(false));
            }
        }
    }
}

/// Resolve a bookmark name against the backing git repo. Looks for a
/// branch first, then a tag — common bookmark intents in both git and
/// jj-on-git. Constraining to explicit ref paths avoids `rev-parse`
/// interpreting the name as a revspec (e.g. `HEAD@{1}`, `name..other`)
/// since CUE-declared names are untrusted input.
fn resolve_bookmark_oid(git_dir: &Path, name: &str) -> Option<String> {
    for ref_path in [format!("refs/heads/{name}"), format!("refs/tags/{name}")] {
        if let Ok(out) = git_text(git_dir, &["rev-parse", "--verify", "--quiet", &ref_path]) {
            let trimmed = out.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
    }
    None
}

fn chrono_now_iso() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    format!("@{now}")
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

/// Metadata + unified patch for a single commit. Used by the
/// `repositoryByPath.commitDiff(oid)` field on the GraphQL surface
/// (CommitDetail.vue parses the patch client-side via the same
/// `frontend/src/diff.ts` the PR DiffView uses).
///
/// Returns an envelope shape that always includes `oid` so the
/// client can correlate against the request even when the lookup
/// failed; failures land in `error` instead of bubbling as a
/// GraphQL-level error so a typo'd OID renders an empty "missing"
/// page rather than blowing up the surrounding workspace query.
fn commit_diff_payload(git_dir: &Path, oid: &str) -> Value {
    // Reject anything that isn't a 4-40 char hex OID before shelling
    // out to git. Belt-and-braces against an argument-injection class
    // bug — `git_text` already uses `Command` with separate args so
    // shell metacharacters can't escape, but the caller-provided
    // path-segment `oid` may still confuse `git show` if it parses
    // as a ref/option. Keeps the surface narrow.
    if !is_valid_oid(oid) {
        return json!({
            "oid": oid,
            "error": "oid must be 4-40 hex characters",
        });
    }
    // `git show --no-color --format=…` emits the metadata header in
    // our SOH-delimited shape (same trick `git_commits` uses) and
    // appends the unified patch after a blank line.
    let format =
        "%H%x01%h%x01%s%x01%b%x01%an%x01%ae%x01%cr%x01%P%x01%(trailers:key=Change-Id,valueonly)";
    let combined = match git_text(
        git_dir,
        &[
            "show",
            "--no-color",
            "--find-renames",
            &format!("--format={format}"),
            "--patch",
            oid,
        ],
    ) {
        Ok(text) => text,
        Err(error) => {
            return json!({
                "oid": oid,
                "error": error,
            });
        }
    };
    // Patch starts after the first blank line. Header is the
    // SOH-delimited block before that.
    let (header_chunk, patch) = match combined.find("\n\n") {
        Some(idx) => (&combined[..idx], combined[idx + 2..].to_string()),
        None => (combined.as_str(), String::new()),
    };
    let fields: Vec<&str> = header_chunk.split('\u{1}').collect();
    if fields.len() < 7 {
        return json!({
            "oid": oid,
            "error": "git show output was malformed (header parse failed)",
        });
    }
    let parents: Vec<String> = fields
        .get(7)
        .copied()
        .unwrap_or("")
        .split_whitespace()
        .filter(|s| !s.is_empty())
        .map(str::to_owned)
        .collect();
    let change_id = fields.get(8).copied().unwrap_or("").trim();
    let body = fields.get(3).copied().unwrap_or("").trim_end();
    let author_email = fields.get(5).copied().unwrap_or("");
    json!({
        "oid": fields[0],
        "shortOid": fields[1],
        "subject": fields[2],
        "body": if body.is_empty() { Value::Null } else { Value::String(body.to_string()) },
        "author": fields[4],
        "authorEmail": if author_email.is_empty() { Value::Null } else { Value::String(author_email.to_string()) },
        "time": fields[6],
        "parents": parents,
        "changeId": if change_id.is_empty() { Value::Null } else { Value::String(change_id.to_string()) },
        "patch": patch,
        "error": Value::Null,
    })
}

fn is_valid_oid(oid: &str) -> bool {
    !oid.is_empty()
        && oid.len() <= 40
        && oid.len() >= 4
        && oid.chars().all(|c| c.is_ascii_hexdigit())
}

fn git_commits(git_dir: &Path) -> Result<Vec<Value>, String> {
    let branch = read_default_branch(git_dir).unwrap_or_else(|| "main".to_string());
    // The 6th field uses git's built-in trailer extraction so the
    // change-id (jj-on-git's identity invariant) lands in the JSON
    // payload without any in-process parsing. Commits without a
    // `Change-Id:` trailer leave the field empty — the UI emits the
    // change-id chip only when it's non-empty.
    //
    // `-z` is required because the trailer format prints a literal
    // newline whether or not the trailer exists, so without it the
    // per-commit record bleeds into the next line. With `-z`, git
    // separates commits with a NUL byte and our split-then-split
    // pipeline reads cleanly.
    let output = git_text(
        git_dir,
        &[
            "log",
            "--date=relative",
            "-z",
            "--format=%H%x01%h%x01%s%x01%an%x01%cr%x01%(trailers:key=Change-Id,valueonly)",
            "-n",
            "8",
            &branch,
        ],
    )?;
    Ok(output
        .split('\0')
        .filter(|chunk| !chunk.trim().is_empty())
        .filter_map(|chunk| {
            let fields = chunk.split('\u{1}').collect::<Vec<_>>();
            if fields.len() < 5 {
                return None;
            }
            let change_id = fields.get(5).copied().unwrap_or("").trim();
            Some(json!({
                "oid": fields[0],
                "shortOid": fields[1],
                "subject": fields[2],
                "author": fields[3],
                "time": fields[4],
                "changeId": if change_id.is_empty() { Value::Null } else { Value::String(change_id.to_string()) }
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
    let head_oid = git_text(git_dir, &["rev-parse", "HEAD"])
        .ok()
        .map(|s| s.trim().to_string());
    let refs = git_refs(git_dir).unwrap_or_default();
    let branches = git_branches(git_dir).unwrap_or_default();
    // Reuse `git_commits` so the change-id trailer extraction (iter 63)
    // and any future commit-shape additions stay in one place. The
    // inline duplicate previously here was the reason iter 63's first
    // attempt silently dropped `changeId`.
    let commits = git_commits(git_dir).unwrap_or_default();
    let (tree_entries, files, blobs) = git_tree_at_ref(git_dir, &default_branch)
        .unwrap_or_else(|_| (Vec::new(), Vec::new(), Vec::new()));
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

type GitTreePayload = (Vec<Value>, Vec<Value>, Vec<Value>);

fn git_tree_at_ref(git_dir: &Path, reference: &str) -> Result<GitTreePayload, String> {
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
        Some(
            "md" | "mdx"
                | "rs"
                | "ts"
                | "tsx"
                | "js"
                | "jsx"
                | "vue"
                | "json"
                | "toml"
                | "cue"
                | "yaml"
                | "yml"
                | "txt"
        )
    )
}

fn file_kind(path: &str) -> &'static str {
    match Path::new(path)
        .extension()
        .and_then(|extension| extension.to_str())
    {
        Some("md") => "markdown",
        Some("mdx") => "mdx",
        Some("rs") => "rust",
        Some("ts" | "tsx") => "typescript",
        Some("js" | "jsx") => "javascript",
        Some("vue") => "vue",
        Some("json") => "json",
        Some("cue") => "cue",
        Some("toml") => "toml",
        Some("yaml" | "yml") => "yaml",
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
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExtensionStorageSchema {
    schema_version: String,
    collections: Vec<StorageCollectionDeclaration>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct StorageCollectionDeclaration {
    name: String,
    owner_extension: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    indexes: Vec<StorageIndexDeclaration>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct RelationshipTypeDeclaration {
    id: String,
    kind: String,
    source_kinds: Vec<String>,
    target_kinds: Vec<String>,
    outgoing_label: String,
    incoming_label: String,
    #[serde(default)]
    symmetric: bool,
    #[serde(default)]
    order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct StorageIndexDeclaration {
    name: String,
    fields: Vec<String>,
    unique: bool,
}

fn storage_schema_collections(
    extension_runtime: &BTreeMap<String, ExtensionRuntimeRecord>,
) -> Vec<StorageCollectionDeclaration> {
    let mut collections = core_storage_collections();
    collections.extend(
        extension_runtime
            .values()
            .flat_map(|record| record.storage_collections.clone()),
    );
    collections
}

fn core_storage_collections() -> Vec<StorageCollectionDeclaration> {
    vec![
        storage_collection(
            "core",
            "workspaces",
            vec![storage_index("by_slug", &["slug"], true)],
        ),
        storage_collection(
            "core",
            "repositories",
            vec![
                storage_index("by_path", &["path"], true),
                storage_index("by_workspace", &["workspaceID", "path"], false),
            ],
        ),
        storage_collection(
            "core",
            "relations",
            vec![
                storage_index("by_from", &["from"], false),
                storage_index("by_to", &["to"], false),
                storage_index("by_pair_verb", &["from", "to", "verb"], true),
            ],
        ),
        storage_collection(
            "core",
            "comments",
            vec![
                storage_index("by_target", &["target"], false),
                storage_index("by_parent", &["parent"], false),
            ],
        ),
        storage_collection(
            "core",
            "extension_installations",
            vec![storage_index(
                "by_extension_status",
                &["extensionID", "status"],
                true,
            )],
        ),
        storage_collection(
            "core",
            "activity_events",
            vec![
                storage_index("by_repository_time", &["repositoryID", "time"], false),
                storage_index("by_type_time", &["type", "time"], false),
            ],
        ),
        storage_collection(
            "core",
            "labels",
            vec![storage_index("by_scope_name", &["scope", "name"], false)],
        ),
    ]
}

fn storage_collection(
    owner_extension: &str,
    name: &str,
    indexes: Vec<StorageIndexDeclaration>,
) -> StorageCollectionDeclaration {
    StorageCollectionDeclaration {
        name: name.to_string(),
        owner_extension: owner_extension.to_string(),
        indexes,
    }
}

fn storage_index(name: &str, fields: &[&str], unique: bool) -> StorageIndexDeclaration {
    StorageIndexDeclaration {
        name: name.to_string(),
        fields: fields.iter().map(|field| (*field).to_string()).collect(),
        unique,
    }
}

fn validate_storage_collections(
    storage_collections: &[StorageCollectionDeclaration],
) -> Result<(), String> {
    let mut seen = BTreeSet::new();
    for collection in storage_collections {
        if collection.name.is_empty() {
            return Err("storage collection name must not be empty".to_string());
        }
        if collection.owner_extension.is_empty() {
            return Err(format!(
                "storage collection {} ownerExtension must not be empty",
                collection.name
            ));
        }
        if !seen.insert((collection.owner_extension.clone(), collection.name.clone())) {
            return Err(format!(
                "duplicate storage collection declaration: {}/{}",
                collection.owner_extension, collection.name
            ));
        }
    }
    Ok(())
}

#[derive(Debug, Clone)]
pub(crate) struct ExtensionRuntimeStore {
    root: PathBuf,
    /// In-memory parse cache of `documents.jsonl`, refreshed on every
    /// write through this store. Without it, every `load_records` call
    /// re-reads and re-`serde_json`-parses the entire document table —
    /// O(total_documents) per host call, and a single OCC update parses
    /// the whole file three+ times. The cache makes reads serve the
    /// already-parsed records and confines the full read+parse to the
    /// first read after construction. Every mutation routes through
    /// `write_records_atomically`, which replaces the cache with the
    /// just-written records, so a stale cache cannot outlive a write made
    /// via this store. Wrapped in `Arc` so cloned handles (the reactor
    /// subscription registration clones the store) share one cache and a
    /// write through any handle is visible to reads through the others.
    records_cache: Arc<Mutex<Option<Vec<ExtensionDocumentRecord>>>>,
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
    fn open(
        data_dir: &Path,
        storage_collections: &[StorageCollectionDeclaration],
    ) -> Result<Self, String> {
        let root = data_dir.join("extensions/storage");
        fs::create_dir_all(&root)
            .map_err(|error| format!("failed to create extension storage dir: {error}"))?;
        let store = Self {
            root,
            records_cache: Arc::new(Mutex::new(None)),
        };
        store.ensure_schema(storage_collections)?;
        touch(&store.documents_path()).map_err(|error| {
            format!("failed to initialize extension storage documents: {error}")
        })?;
        touch(&store.events_path()).map_err(|error| {
            format!("failed to initialize extension storage event log: {error}")
        })?;
        Ok(store)
    }

    #[cfg(test)]
    pub(crate) fn open_for_tests(data_dir: &Path) -> Result<Self, String> {
        let collections = core_storage_collections();
        Self::open(data_dir, &collections)
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

    fn ensure_schema(
        &self,
        storage_collections: &[StorageCollectionDeclaration],
    ) -> Result<(), String> {
        let schema_path = self.schema_path();
        validate_storage_collections(storage_collections)?;
        let schema = ExtensionStorageSchema {
            schema_version: EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
            collections: storage_collections.to_vec(),
        };
        fs::write(
            &schema_path,
            serde_json::to_vec_pretty(&schema)
                .map_err(|error| format!("failed to encode extension storage schema: {error}"))?,
        )
        .map_err(|error| format!("failed to write {}: {error}", schema_path.display()))
    }

    fn ensure_core_bootstrap(
        &self,
        config: &InstanceConfig,
        runtime: &BTreeMap<String, ExtensionRuntimeRecord>,
    ) -> Result<(), String> {
        let existing = self.load_records()?;
        let now = now_iso_timestamp();

        for (slug, workspace) in &config.workspaces {
            let already_exists = existing.iter().any(|record| {
                record.collection == "workspaces"
                    && record.data.get("slug").and_then(Value::as_str) == Some(slug.as_str())
            });
            if already_exists {
                continue;
            }
            let id = OpaqueId::new(IdPrefix::Workspace);
            let resource = format!("comtrya://workspace/{id}");
            self.create_document(extension_document_record(
                "core",
                "workspaces",
                id.as_str(),
                &resource,
                vec![resource.clone()],
                json!({
                    "id": id.as_str(),
                    "slug": slug,
                    "name": workspace.name.clone(),
                    "visibility": workspace.visibility.as_str(),
                    "description": workspace.description.clone(),
                    "allowPublicDescendants": workspace.allow_public_descendants,
                    "members": 0
                }),
                &now,
            ))?;
        }

        let existing = self.load_records()?;
        for record in runtime.values() {
            let already_exists = existing.iter().any(|stored| {
                stored.collection == "extension_installations"
                    && stored.data.get("id").and_then(Value::as_str) == Some(record.id.as_str())
            });
            if already_exists {
                continue;
            }
            let resource = format!("comtrya://extension/{}", record.id);
            self.create_document(extension_document_record(
                "core",
                "extension_installations",
                &format!("extension_installation_{}", stable_slug(&record.id)),
                &resource,
                vec![resource.clone()],
                json!({
                    "id": record.id.clone(),
                    "extensionID": record.id.clone(),
                    "name": record.id.clone(),
                    "status": record.status.clone(),
                    "component": record.component.clone(),
                    "outputType": record.output_type.clone(),
                    "manifest": format!("/_extensions/{}/manifest.json", record.id),
                }),
                &now,
            ))?;
        }

        Ok(())
    }

    fn collection_data(&self, collection: &str) -> Result<Value, String> {
        let values = self
            .query_documents_by_index(collection, &[])?
            .into_iter()
            .map(|record| record.data)
            .collect::<Vec<_>>();
        Ok(Value::Array(values))
    }

    /// Resolve a stored repository's canonical `path` from its opaque id
    /// (the `repo_…` portion of a `comtrya://repository/<id>` ref). Used
    /// by the per-repo extension opt-in gate to locate the bare git dir
    /// under `repositories/<path>.git` whose CUE declares
    /// `repository.enabledExtensions`. Returns `None` if no stored
    /// repository carries that id.
    pub(crate) fn repository_path_for_id(&self, repository_id: &str) -> Option<String> {
        self.collection_data("repositories")
            .ok()?
            .as_array()?
            .iter()
            .find(|repo| repo.get("id").and_then(Value::as_str) == Some(repository_id))
            .and_then(|repo| repo.get("path").and_then(Value::as_str))
            .map(str::to_owned)
    }

    /// Find the repository ref of the stored document whose `resource`
    /// uri matches `resource_uri`, by scanning its `resource_refs` for a
    /// `comtrya://…/repository/<id>` entry. Used by the reactor gate to
    /// derive an event's source repository from the event's `source_uri`
    /// (which points at a resource document, e.g. a pull request) without
    /// the kernel knowing any extension's storage layout. Returns `None`
    /// if no such document exists or it carries no repository ref.
    pub(crate) fn repository_ref_for_resource(&self, resource_uri: &str) -> Option<String> {
        self.load_records()
            .ok()?
            .into_iter()
            .find(|record| record.resource == resource_uri)
            .and_then(|record| {
                record
                    .resource_refs
                    .into_iter()
                    .find(|r| crate::wasm_registry::repository_id_from_ref(r).is_some())
            })
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

    pub(crate) fn update_document_atomically(
        &self,
        owner_extension: &str,
        collection: &str,
        id: &str,
        update: impl FnOnce(&mut Value),
    ) -> Result<(), String> {
        self.update_document_if_version(owner_extension, collection, id, None, |val, _| update(val))
    }

    /// Atomic compare-and-swap for the OCC protocol. If `expected_version`
    /// is `Some(v)` and the current record's version is not `v`, returns
    /// `Err("version conflict ...")`. Otherwise applies `update`, bumps
    /// version, persists.
    pub(crate) fn update_document_if_version(
        &self,
        owner_extension: &str,
        collection: &str,
        id: &str,
        expected_version: Option<u64>,
        update: impl FnOnce(&mut Value, u64),
    ) -> Result<(), String> {
        let mut records = self.load_records()?;
        let (version, current_version) = {
            // Scope the compare-and-swap to the owning extension. Two
            // extensions may legitimately hold the same (collection, id)
            // (see `create_document`), so a write must only ever touch the
            // caller's own record — never another owner's.
            let Some(record) = records.iter_mut().find(|record| {
                record.owner_extension == owner_extension
                    && record.collection == collection
                    && record.id == id
            }) else {
                return Err(format!(
                    "extension document not found: {owner_extension}/{collection}/{id}"
                ));
            };
            if let Some(expected) = expected_version
                && record.version != expected
            {
                return Err(format!(
                    "version conflict: expected {} current {}",
                    expected, record.version
                ));
            }
            let current = record.version;
            update(&mut record.data, current);
            record.indexed_fields = indexed_fields(&record.data);
            record.version += 1;
            record.updated_at = now_iso_timestamp();
            (record.version, current)
        };
        self.write_records_atomically(&records)?;
        let _ = current_version;
        self.append_storage_event(
            "dev.comtrya.extension_storage.document_updated",
            json!({"ownerExtension": owner_extension, "collection": collection, "id": id, "version": version}),
        )
    }

    pub(crate) fn load_records(&self) -> Result<Vec<ExtensionDocumentRecord>, String> {
        let mut cache = self
            .records_cache
            .lock()
            .map_err(|error| format!("extension store cache lock poisoned: {error}"))?;
        if let Some(cached) = cache.as_ref() {
            return Ok(cached.clone());
        }
        let records = self.read_records_from_disk()?;
        *cache = Some(records.clone());
        Ok(records)
    }

    fn read_records_from_disk(&self) -> Result<Vec<ExtensionDocumentRecord>, String> {
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
        })?;
        // Refresh the cache with the just-written records so the next read
        // is served from memory without re-reading the file. This is the
        // single write chokepoint for the document table (create, delete,
        // and OCC update all route through here), so it is also where the
        // cache invariant is maintained. A poisoned lock leaves the cache
        // untouched; the next `load_records` will surface the poison.
        if let Ok(mut cache) = self.records_cache.lock() {
            *cache = Some(records.to_vec());
        }
        Ok(())
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

/// The single source of truth for a document's `indexed_fields`, used by
/// BOTH the create path (`extension_document_record`, and the WASM
/// `storage.create` host import) and the update path
/// (`update_document_if_version`). Indexing every top-level scalar keeps
/// the index shape stable across a document's lifetime: a field indexed
/// at create time stays indexed after the first update, instead of
/// silently vanishing because it was not on a hardcoded allow-list.
/// On top of the generic scalars we add a few derived keys that callers
/// query by but that are spelled differently in the stored data
/// (`repositoryID` <- `repositoryId`, `extensionID` <- `id`, `updatedAt`
/// <- `updatedAt`/`time`).
pub(crate) fn indexed_fields(data: &Value) -> BTreeMap<String, Value> {
    let mut fields = BTreeMap::new();
    if let Some(object) = data.as_object() {
        for (key, value) in object {
            if value.is_string() || value.is_number() || value.is_boolean() || value.is_null() {
                fields.insert(key.clone(), value.clone());
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

fn storage_collections_from_manifest(
    id: &str,
    manifest: &Value,
) -> Result<Vec<StorageCollectionDeclaration>, String> {
    let Some(collections) = manifest
        .pointer("/contributes/collections")
        .and_then(Value::as_array)
    else {
        return Ok(Vec::new());
    };
    let mut parsed = Vec::new();
    for collection in collections {
        if collection.get("demoSeed").is_some() {
            return Err(format!(
                "{id} contributes.collections entry uses removed demoSeed bootstrap contract"
            ));
        }
        let declaration =
            serde_json::from_value::<StorageCollectionDeclaration>(collection.clone())
                .map_err(|error| format!("{id} contributes.collections entry invalid: {error}"))?;
        if declaration.owner_extension != id {
            return Err(format!(
                "{id} contributes.collections '{}' ownerExtension must be {id}, got {}",
                declaration.name, declaration.owner_extension
            ));
        }
        parsed.push(declaration);
    }
    Ok(parsed)
}

fn cue_schemas_from_manifest(
    id: &str,
    manifest: &Value,
) -> Result<Vec<CueSchemaDeclaration>, String> {
    let Some(schemas) = manifest
        .pointer("/contributes/cueSchemas")
        .and_then(Value::as_array)
    else {
        return Ok(Vec::new());
    };
    let mut parsed = Vec::new();
    for entry in schemas {
        let declaration = serde_json::from_value::<CueSchemaDeclaration>(entry.clone())
            .map_err(|error| format!("{id} contributes.cueSchemas entry invalid: {error}"))?;
        if declaration.id.is_empty() {
            return Err(format!("{id} contributes.cueSchemas entry has empty id"));
        }
        if declaration.snippet.is_empty() {
            return Err(format!(
                "{id} contributes.cueSchemas entry '{}' has empty snippet",
                declaration.id
            ));
        }
        parsed.push(declaration);
    }
    Ok(parsed)
}

fn relationship_types_from_manifest(
    id: &str,
    manifest: &Value,
) -> Result<Vec<RelationshipTypeDeclaration>, String> {
    let Some(types) = manifest
        .pointer("/contributes/relationshipTypes")
        .and_then(Value::as_array)
    else {
        return Ok(Vec::new());
    };
    let mut seen = BTreeSet::new();
    let mut parsed = Vec::new();
    let expected_prefix = format!("{id}.");
    for entry in types {
        let declaration = serde_json::from_value::<RelationshipTypeDeclaration>(entry.clone())
            .map_err(|error| {
                format!("{id} contributes.relationshipTypes entry invalid: {error}")
            })?;
        if !declaration.id.starts_with(&expected_prefix) {
            return Err(format!(
                "{id} contributes.relationshipTypes id '{}' must start with '{expected_prefix}'",
                declaration.id
            ));
        }
        if !seen.insert(declaration.id.clone()) {
            return Err(format!(
                "{id} contributes.relationshipTypes declares duplicate id '{}'",
                declaration.id
            ));
        }
        validate_verb_uri(&declaration.kind).map_err(|error| {
            format!(
                "{id} contributes.relationshipTypes '{}' has invalid kind: {error}",
                declaration.id
            )
        })?;
        if declaration.source_kinds.is_empty() || declaration.target_kinds.is_empty() {
            return Err(format!(
                "{id} contributes.relationshipTypes '{}' must declare sourceKinds and targetKinds",
                declaration.id
            ));
        }
        if declaration.outgoing_label.trim().is_empty()
            || declaration.incoming_label.trim().is_empty()
        {
            return Err(format!(
                "{id} contributes.relationshipTypes '{}' must declare non-empty labels",
                declaration.id
            ));
        }
        parsed.push(declaration);
    }
    parsed.sort_by(|left, right| {
        left.order
            .cmp(&right.order)
            .then_with(|| left.id.cmp(&right.id))
    });
    Ok(parsed)
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
}

#[derive(Debug, serde::Deserialize)]
pub struct UiAssetsV2 {
    pub entry: String,
    #[serde(rename = "entryIntegrity")]
    pub entry_integrity: String,
    pub styles: Vec<String>,
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
    let m: UiManifestV2 =
        serde_json::from_value(value.clone()).map_err(|e| format!("manifest shape: {e}"))?;
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
    // Slot, route, and card declarations are runtime, not manifest. The host
    // gates registration through permissions and the backend `routePrefix`
    // identity field, not declarative contributes arrays.
    Ok(m)
}

// ---------------------------------------------------------------------------

pub fn validate_route_prefix_uniqueness(configs: &[ExtensionInstallConfig]) -> Result<(), String> {
    let mut seen: std::collections::HashMap<&str, &str> = std::collections::HashMap::new();
    for cfg in configs {
        if let Some(prefix) = &cfg.route_prefix
            && let Some(prev) = seen.insert(prefix.as_str(), cfg.id.as_str())
        {
            return Err(format!(
                "route_prefix '{prefix}' is claimed by both '{prev}' and '{}'",
                cfg.id
            ));
        }
    }
    Ok(())
}

#[derive(Debug, Clone)]
struct ExtensionPackageRoot {
    configured_id: String,
    root: PathBuf,
}

fn load_extension_runtime(extension_dir: &Path) -> Result<ExtensionRuntimeOutput, String> {
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
        if platform_wit_version.is_none() {
            return Err(format!(
                "{} missing platformWitVersion; first-party extensions must declare platformWitVersion",
                manifest_path.display()
            ));
        }
        if crate::generated_dispatch::invoker_for_extension(id).is_none() {
            return Err(format!(
                "{} declares platformWitVersion, but this server binary has no generated typed WASM invoker for extension {}",
                manifest_path.display(),
                id
            ));
        }
        let component_name = manifest
            .get("wasmComponent")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{} missing wasmComponent", manifest_path.display()))?;
        let expected_component = format!("dist/{id}.wasm");
        if component_name != expected_component {
            return Err(format!(
                "{} wasmComponent must be {expected_component}, got {component_name}",
                manifest_path.display()
            ));
        }
        let platform_wasm = root.join(component_name);
        if !platform_wasm.is_file() {
            return Err(format!(
                "{} declares platformWitVersion but {} is missing",
                manifest_path.display(),
                platform_wasm.display()
            ));
        }
        let storage_collections = storage_collections_from_manifest(id, &manifest)?;
        let relationship_types = relationship_types_from_manifest(id, &manifest)?;
        let cue_schemas = cue_schemas_from_manifest(id, &manifest)?;
        registry.register_from_manifest(&root)?;
        if loaded
            .insert(
                id.to_string(),
                ExtensionRuntimeRecord {
                    id: id.to_string(),
                    component: component_name.to_string(),
                    output_type: output_type.to_string(),
                    status: String::from("platform-loaded"),
                    relationship_types,
                    storage_collections,
                    root,
                    ui_manifest,
                    route_prefix,
                    cue_schemas,
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
    pub(crate) records: BTreeMap<String, ExtensionRuntimeRecord>,
    pub(crate) registry: wasm_registry::WasmRegistry,
}

fn is_receive_pack(path: &str, query: Option<&str>) -> bool {
    path.ends_with("/git-receive-pack")
        || query
            .map(|query| query.contains("service=git-receive-pack"))
            .unwrap_or(false)
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
        if let RepoStorageBackend::Local { path } = backend
            && !Path::new(path).is_absolute()
        {
            return Err("production local repository storage path must be absolute".to_string());
        }
    }
    Ok(())
}

fn touch(path: &Path) -> std::io::Result<()> {
    OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map(|_| ())
}

fn path_telemetry(path: &Path) -> Value {
    let (bytes, files) = directory_usage(path);
    json!({
        "path": path.display().to_string(),
        "exists": path.exists(),
        "isDirectory": path.is_dir(),
        "bytes": bytes,
        "files": files,
    })
}

fn file_telemetry(path: &Path) -> Value {
    let metadata = fs::metadata(path).ok();
    json!({
        "path": path.display().to_string(),
        "exists": metadata.is_some(),
        "bytes": metadata.as_ref().map(|m| m.len()).unwrap_or(0),
    })
}

fn directory_usage(path: &Path) -> (u64, u64) {
    let mut bytes = 0;
    let mut files = 0;
    let mut stack = vec![path.to_path_buf()];
    while let Some(current) = stack.pop() {
        let Ok(metadata) = fs::symlink_metadata(&current) else {
            continue;
        };
        if metadata.is_file() {
            bytes += metadata.len();
            files += 1;
            continue;
        }
        if !metadata.is_dir() {
            continue;
        }
        let Ok(entries) = fs::read_dir(&current) else {
            continue;
        };
        for entry in entries.flatten() {
            stack.push(entry.path());
        }
    }
    (bytes, files)
}

/// Size threshold (64 MiB) at which `append_jsonl` rotates the active
/// JSONL file into `<parent>/archive/<stem>.<unix_nanos>.jsonl` before
/// the next write. Matches #11 P2-3's "rotate by size (e.g., 64 MB)".
const JSONL_ROTATION_THRESHOLD_BYTES: u64 = 64 * 1024 * 1024;

fn append_jsonl(path: &Path, value: Value) -> std::io::Result<()> {
    append_jsonl_with_rotation(path, value, JSONL_ROTATION_THRESHOLD_BYTES)
}

fn append_jsonl_with_rotation(
    path: &Path,
    value: Value,
    threshold_bytes: u64,
) -> std::io::Result<()> {
    let line = format!("{value}\n");
    if let Ok(meta) = std::fs::metadata(path)
        && meta.len().saturating_add(line.len() as u64) > threshold_bytes
    {
        rotate_jsonl(path)?;
    }
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    file.write_all(line.as_bytes())?;
    Ok(())
}

/// Move the active JSONL file into `<parent>/archive/<stem>.<nanos>.jsonl`.
/// Nanosecond timestamp prevents collisions when two rotations land in
/// the same second (would otherwise silently overwrite the prior
/// archive — that's data loss, not just misrouting).
fn rotate_jsonl(path: &Path) -> std::io::Result<()> {
    let parent = path.parent().ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "rotation requires a parent directory",
        )
    })?;
    if parent.as_os_str().is_empty() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "rotation requires a non-empty parent directory",
        ));
    }
    let archive_dir = parent.join("archive");
    std::fs::create_dir_all(&archive_dir)?;
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("log");
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let target = archive_dir.join(format!("{stem}.{now}.jsonl"));
    std::fs::rename(path, &target)?;
    Ok(())
}

/// Flush dirty pages for `path` to durable storage.
///
/// `fsync(2)` takes a file descriptor, but the Linux page cache is
/// keyed by inode — fsyncing any open fd flushes dirty pages left by
/// previously-closed fds to the same path. That's why this helper can
/// safely re-open in read-only mode and still durably persist the
/// writes that `append_jsonl` left in the page cache from its own,
/// already-closed fds.
fn fsync_jsonl_path(path: &Path) -> std::io::Result<()> {
    let file = std::fs::File::open(path)?;
    file.sync_all()
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

    fn issue_route(op: &str) -> String {
        format!("issues.{op}")
    }

    #[test]
    fn cue_overrides_project_enabled_extensions_from_repository_block() {
        // A repo whose CUE `repository:` block opts into extensions must
        // surface them on the projected repo object so the frontend (and
        // phase-2 kernel boundary) read the set the CUE cache derived.
        let mut repo_obj = serde_json::Map::new();
        let config = json!({
            "repository": { "enabledExtensions": ["ext_issues", "ext_pulls"] }
        });
        apply_repository_cue_overrides(&mut repo_obj, &config);
        assert_eq!(
            repo_obj.get("enabledExtensions"),
            Some(&json!(["ext_issues", "ext_pulls"])),
        );
    }

    #[test]
    fn cue_overrides_default_enabled_extensions_to_empty_when_absent() {
        // A repo with a `repository:` block that omits `enabledExtensions`
        // gets the strictly-off default: an explicit empty set.
        let mut with_block = serde_json::Map::new();
        apply_repository_cue_overrides(
            &mut with_block,
            &json!({ "repository": { "visibility": "public" } }),
        );
        assert_eq!(with_block.get("enabledExtensions"), Some(&json!([])));

        // A repo with no `repository:` block at all is also strictly off.
        let mut no_block = serde_json::Map::new();
        apply_repository_cue_overrides(&mut no_block, &json!({ "projects": [] }));
        assert_eq!(no_block.get("enabledExtensions"), Some(&json!([])));
    }

    fn issue_event(action: &str) -> String {
        format!("dev.comtrya.issues.{action}")
    }

    /// build.rs codegen → main.rs include pipeline works end-to-end.
    #[test]
    fn dispatch_table_routes_ext_issues_close_wit_route() {
        let info = crate::generated_dispatch::dispatch_wit_route(
            "ext_issues",
            &issue_route("close-issue"),
        )
        .expect("route should resolve to DispatchInfo");
        assert_eq!(info.extension_id, "ext_issues");
        assert_eq!(info.interface_name, "issues");
        assert_eq!(info.op_name, "close-issue");
    }

    #[test]
    fn dispatch_table_returns_none_for_unknown_wit_routes() {
        assert!(crate::generated_dispatch::dispatch_wit_route("ext_issues", "nope.nope").is_none());
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

    fn write_test_file(path: &Path, contents: &str) {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, contents).unwrap();
    }

    fn test_source_repository(name: &str) -> PathBuf {
        let repo = temp_dir(name);
        run_command(
            Command::new("git").arg("-C").arg(&repo).arg("init"),
            "git init",
        )
        .unwrap();
        run_command(
            Command::new("git")
                .arg("-C")
                .arg(&repo)
                .args(["checkout", "-B", "main"]),
            "git checkout main",
        )
        .unwrap();
        run_command(
            Command::new("git")
                .arg("-C")
                .arg(&repo)
                .args(["config", "user.name", "Comtrya Test"]),
            "git config user.name",
        )
        .unwrap();
        run_command(
            Command::new("git").arg("-C").arg(&repo).args([
                "config",
                "user.email",
                "test@comtrya.local",
            ]),
            "git config user.email",
        )
        .unwrap();
        run_command(
            Command::new("git")
                .arg("-C")
                .arg(&repo)
                .args(["config", "commit.gpgsign", "false"]),
            "git config commit.gpgsign",
        )
        .unwrap();

        write_test_file(&repo.join("README.md"), "# Runtime repository\n");
        write_test_file(
            &repo.join("comtrya.cue"),
            "package comtrya\n\nprojects: kernel: { root: \".\" }\n",
        );
        run_command(
            Command::new("git").arg("-C").arg(&repo).arg("add").arg("."),
            "git add",
        )
        .unwrap();
        run_command(
            Command::new("git").arg("-C").arg(&repo).args([
                "commit",
                "-m",
                "initial runtime repository",
            ]),
            "git commit",
        )
        .unwrap();

        run_command(
            Command::new("git").arg("-C").arg(&repo).args([
                "checkout",
                "-b",
                "ui/repository-intelligence",
            ]),
            "git checkout branch",
        )
        .unwrap();
        write_test_file(
            &repo.join("frontend/src/panel.ts"),
            "export const panel = true;\n",
        );
        run_command(
            Command::new("git").arg("-C").arg(&repo).arg("add").arg("."),
            "git add",
        )
        .unwrap();
        run_command(
            Command::new("git")
                .arg("-C")
                .arg(&repo)
                .args(["commit", "-m", "add UI branch"]),
            "git commit branch",
        )
        .unwrap();
        run_command(
            Command::new("git")
                .arg("-C")
                .arg(&repo)
                .args(["checkout", "main"]),
            "git checkout main",
        )
        .unwrap();
        repo
    }

    fn import_test_repository(runtime: &Runtime, path: &str) -> Value {
        let source = test_source_repository("source-repository");
        let url = format!("file://{}", source.display());
        runtime
            .create_repository_document(path, Some(&url))
            .unwrap()
    }

    fn dev_runtime() -> Arc<Runtime> {
        dev_runtime_with_session_ttl(300)
    }

    fn dev_runtime_with_session_ttl(session_ttl_seconds: u64) -> Arc<Runtime> {
        Arc::new(
            Runtime::start(StartupOptions {
                data_dir: temp_dir("dev"),
                extension_dir: test_extension_dir(),
                listen: "127.0.0.1:0".parse().unwrap(),
                check: false,
                tls_terminated: false,
                operator_code: Some("testbed-operator-code".to_string()),
                session_ttl_seconds,
            })
            .unwrap(),
        )
    }

    /// Like `dev_runtime` but with an explicit (empty) extension set so the
    /// on-disk v1 manifests are never loaded. Use this for tests that exercise
    /// auth, CORS, git, GraphQL core fields, or other concerns orthogonal to
    /// the extension manifest format.
    fn dev_runtime_no_extensions() -> Arc<Runtime> {
        dev_runtime_no_extensions_with_session_ttl(300)
    }

    fn dev_runtime_no_extensions_with_session_ttl(session_ttl_seconds: u64) -> Arc<Runtime> {
        // Inject an unconfigured dev config and mark the extension set as
        // declared (= true) so no WASM packages are discovered or loaded.
        Arc::new(
            Runtime::start_with_config(
                StartupOptions {
                    data_dir: temp_dir("dev-no-ext"),
                    extension_dir: test_extension_dir(),
                    listen: "127.0.0.1:0".parse().unwrap(),
                    check: false,
                    tls_terminated: false,
                    operator_code: Some("testbed-operator-code".to_string()),
                    session_ttl_seconds,
                },
                InstanceConfig::minimal_dev(),
                true,
            )
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

    fn basic_headers(username: &str, password: &str) -> HeaderMap {
        use base64::Engine as _;
        let mut headers = HeaderMap::new();
        let encoded =
            base64::engine::general_purpose::STANDARD.encode(format!("{username}:{password}"));
        headers.insert(
            "authorization",
            HeaderValue::from_str(&format!("Basic {encoded}")).unwrap(),
        );
        headers
    }

    fn runtime_with_admins(admins: Vec<comtrya_core::AdminConfig>) -> Arc<Runtime> {
        let mut config = InstanceConfig::minimal_dev();
        config.admins = admins;
        Arc::new(
            Runtime::start_with_config(
                StartupOptions {
                    data_dir: temp_dir("admins"),
                    extension_dir: test_extension_dir(),
                    listen: "127.0.0.1:0".parse().unwrap(),
                    check: false,
                    tls_terminated: false,
                    operator_code: Some("testbed-operator-code".to_string()),
                    session_ttl_seconds: 300,
                },
                config,
                true,
            )
            .unwrap(),
        )
    }

    #[test]
    fn admin_identity_matches_oidc_claims() {
        let runtime = runtime_with_admins(vec![comtrya_core::AdminConfig {
            issuer: Some("dev".to_string()),
            subject: None,
            email: Some("boss@example.test".to_string()),
            handle: None,
        }]);
        assert!(runtime.is_admin_claims("dev", "sub", Some("boss@example.test")));
        // Wrong issuer or wrong email is not an admin.
        assert!(!runtime.is_admin_claims("other", "sub", Some("boss@example.test")));
        assert!(!runtime.is_admin_claims("dev", "sub", Some("nobody@example.test")));
    }

    #[test]
    fn reconcile_applies_admin_list_live() {
        let runtime = runtime_with_admins(vec![comtrya_core::AdminConfig {
            issuer: None,
            subject: None,
            email: Some("boss@example.test".to_string()),
            handle: None,
        }]);
        assert!(runtime.is_admin_claims("dev", "sub", Some("boss@example.test")));

        let mut next = InstanceConfig::minimal_dev();
        next.admins = vec![comtrya_core::AdminConfig {
            issuer: None,
            subject: Some("sub-2".to_string()),
            email: None,
            handle: None,
        }];
        reconcile::reconcile_live(&runtime, &next);

        // Old admin no longer matches; the new subject-based admin does.
        assert!(!runtime.is_admin_claims("dev", "sub", Some("boss@example.test")));
        assert!(runtime.is_admin_claims("any-issuer", "sub-2", None));
    }

    #[test]
    fn reconcile_repositories_creates_declared_and_deletes_extras() {
        let runtime = runtime_with_admins(vec![]);
        // An ad-hoc repo the config does not declare — strict GitOps removes it.
        runtime
            .create_repository_document("legacy/old", None)
            .expect("seed legacy repo");

        let mut config = InstanceConfig::minimal_dev();
        config.repositories = vec![comtrya_core::RepositoryConfig {
            path: "platform/api".to_string(),
            visibility: comtrya_core::Visibility::Internal,
            description: Some("API".to_string()),
            storage_backend: None,
            default_branch: None,
        }];
        reconcile::reconcile_repositories(&runtime, &config);

        let paths: Vec<String> = runtime
            .repository_docs()
            .into_iter()
            .map(|(path, _)| path)
            .collect();
        assert!(
            paths.iter().any(|p| p == "platform/api"),
            "declared repo created: {paths:?}"
        );
        assert!(
            !paths.iter().any(|p| p == "legacy/old"),
            "undeclared repo deleted (strict GitOps): {paths:?}"
        );
    }

    #[test]
    fn reconcile_labels_creates_updates_and_deletes() {
        let runtime = runtime_with_admins(vec![]);
        let mut config = InstanceConfig::minimal_dev();
        config.labels = vec![
            comtrya_core::LabelConfig {
                name: "bug".to_string(),
                color: "#ff0000".to_string(),
                description: Some("defect".to_string()),
                scope: None,
            },
            comtrya_core::LabelConfig {
                name: "scoped".to_string(),
                color: "#00ff00".to_string(),
                description: None,
                scope: Some("platform".to_string()),
            },
        ];
        reconcile::reconcile_labels(&runtime, &config);
        assert_eq!(runtime.label_docs().len(), 2);

        // Recolor bug, drop scoped, add feature.
        let mut next = InstanceConfig::minimal_dev();
        next.labels = vec![
            comtrya_core::LabelConfig {
                name: "bug".to_string(),
                color: "#0000ff".to_string(),
                description: Some("defect".to_string()),
                scope: None,
            },
            comtrya_core::LabelConfig {
                name: "feature".to_string(),
                color: "#abcdef".to_string(),
                description: None,
                scope: None,
            },
        ];
        reconcile::reconcile_labels(&runtime, &next);

        let docs = runtime.label_docs();
        let names: Vec<&str> = docs.iter().map(|(_, name, ..)| name.as_str()).collect();
        assert!(names.contains(&"bug") && names.contains(&"feature"));
        assert!(
            !names.contains(&"scoped"),
            "scoped label deleted: {names:?}"
        );
        let bug = docs.iter().find(|(_, name, ..)| name == "bug").unwrap();
        assert_eq!(bug.2, "#0000ff", "bug color updated live");
    }

    #[test]
    fn reconcile_extensions_flags_enabled_set_drift() {
        let runtime = runtime_with_admins(vec![]);
        // Same (empty) set as loaded → no reload pending.
        reconcile::reconcile_extensions(&runtime, &InstanceConfig::minimal_dev());
        assert!(
            !runtime
                .config_sync_status
                .lock()
                .unwrap()
                .pending_extension_reload
        );

        // Declaring an extension absent from the loaded set flags a reload.
        let mut config = InstanceConfig::minimal_dev();
        config.extensions = vec![ExtensionInstallConfig {
            id: "ext_checks".to_string(),
            source: ExtensionSource::Local {
                path: "ext_checks".to_string(),
            },
            enabled: true,
            route_prefix: None,
        }];
        reconcile::reconcile_extensions(&runtime, &config);
        assert!(
            runtime
                .config_sync_status
                .lock()
                .unwrap()
                .pending_extension_reload
        );
    }

    /// Headers carrying the default test `Origin` so `check_boundary` populates
    /// `Access-Control-Allow-Origin` on the response. Required by any test that
    /// asserts CORS-header presence on 4xx responses.
    fn origin_headers() -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert("origin", HeaderValue::from_static("http://localhost:4321"));
        headers
    }

    fn bearer_headers_with_origin(token: &str) -> HeaderMap {
        let mut headers = bearer_headers(token);
        headers.insert("origin", HeaderValue::from_static("http://localhost:4321"));
        headers
    }

    async fn call_api_op(
        state: AppState,
        headers: HeaderMap,
        extension: &str,
        interface: &str,
        op: &str,
        payload: Value,
    ) -> (StatusCode, Value) {
        let response = api_op(
            State(state),
            headers,
            AxumPath((extension.to_string(), interface.to_string(), op.to_string())),
            Bytes::from(serde_json::to_vec(&payload).unwrap()),
        )
        .await;
        let status = response.status();
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        (status, payload)
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
        assert_eq!(payload["checks"]["repositoryRoot"], true);
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
    fn repo_git_data_extracts_refs_tree_and_blobs_from_imported_repo() {
        let runtime = dev_runtime_no_extensions();
        let repository = import_test_repository(&runtime, "comtrya/comtrya");
        let git_dir = runtime.repository_root().join("comtrya/comtrya.git");

        let data = repo_git_data(&git_dir);

        assert_eq!(repository["path"], "comtrya/comtrya");
        assert_eq!(data["defaultBranch"], "main");
        assert_eq!(data["headOid"].as_str().unwrap().len(), 40);
        assert!(data["refs"].as_array().unwrap().iter().any(|reference| {
            reference["name"] == "refs/heads/main" && reference["target"] == data["headOid"]
        }));
        assert!(
            data["branches"]
                .as_array()
                .unwrap()
                .iter()
                .any(|branch| branch["name"] == "main")
        );
        assert!(!data["commits"].as_array().unwrap().is_empty());
        assert!(
            data["treeEntries"]
                .as_array()
                .unwrap()
                .iter()
                .any(|entry| entry["path"] == "README.md")
        );
        assert!(
            data["blobs"]
                .as_array()
                .unwrap()
                .iter()
                .any(|blob| blob["path"] == "README.md")
        );
    }

    // Deleted: `unsupported_routes_return_registry_errors` (in #23) and
    // its successor `oidc_callback_handler_returns_501_not_implemented`
    // (also in #23). The callback is now a real handler — full coverage
    // lives in the four `oidc_callback_*` tests further down this
    // module.

    // ---- OIDC scaffolding handler tests (#16) ----

    /// Mock that returns a pre-built `CoreProviderMetadata` instead of
    /// fetching one over HTTP. Lets handler tests run without network.
    struct MockOidcMetadataProvider {
        metadata: openidconnect::core::CoreProviderMetadata,
    }

    #[async_trait::async_trait]
    impl oidc::OidcMetadataProvider for MockOidcMetadataProvider {
        async fn fetch(
            &self,
            _issuer_url: &str,
        ) -> Result<openidconnect::core::CoreProviderMetadata, String> {
            Ok(self.metadata.clone())
        }
    }

    fn mock_provider_metadata() -> openidconnect::core::CoreProviderMetadata {
        use openidconnect::core::{
            CoreJwsSigningAlgorithm, CoreProviderMetadata, CoreResponseType,
            CoreSubjectIdentifierType,
        };
        use openidconnect::{
            AuthUrl, EmptyAdditionalProviderMetadata, IssuerUrl, JsonWebKeySetUrl, ResponseTypes,
        };
        CoreProviderMetadata::new(
            IssuerUrl::new("https://issuer.example.test".to_string()).unwrap(),
            AuthUrl::new("https://issuer.example.test/authorize".to_string()).unwrap(),
            JsonWebKeySetUrl::new("https://issuer.example.test/jwks".to_string()).unwrap(),
            vec![ResponseTypes::new(vec![CoreResponseType::Code])],
            vec![CoreSubjectIdentifierType::Public],
            vec![CoreJwsSigningAlgorithm::RsaSsaPkcs1V15Sha256],
            EmptyAdditionalProviderMetadata {},
        )
    }

    fn dev_runtime_with_oidc_mock() -> Arc<Runtime> {
        let mut runtime = dev_runtime_no_extensions();
        let inner = Arc::get_mut(&mut runtime).expect("unique Arc on fresh runtime");
        inner.oidc_discovery = oidc::OidcDiscoveryCache::with_components(
            Box::new(MockOidcMetadataProvider {
                metadata: mock_provider_metadata(),
            }),
            Box::new(oidc::ReqwestCodeExchanger::new()),
        );
        runtime
    }

    fn origin_header_map() -> HeaderMap {
        let mut h = HeaderMap::new();
        h.insert("origin", HeaderValue::from_static("http://localhost:4321"));
        h
    }

    fn cookie_header_map(cookie: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        let cookie_value = cookie.split(';').next().expect("cookie pair");
        headers.insert(
            axum::http::header::COOKIE,
            HeaderValue::from_str(cookie_value).expect("valid cookie header"),
        );
        headers
    }

    #[tokio::test]
    async fn oidc_providers_lists_configured_login_urls() {
        let runtime = dev_runtime_with_oidc_mock();
        let response = oidc_providers(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            origin_header_map(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(
            payload["providers"][0],
            json!({"id": "dev", "loginUrl": "/auth/oidc/dev/login"})
        );
    }

    #[tokio::test]
    async fn oidc_login_unknown_provider_returns_404() {
        let runtime = dev_runtime_with_oidc_mock();
        let response = oidc_login(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath("nonexistent".to_string()),
            origin_header_map(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        assert!(
            response
                .headers()
                .contains_key("access-control-allow-origin"),
            "404 must preserve CORS so browser can read error body, not see opaque CORS failure",
        );
    }

    #[tokio::test]
    async fn oidc_login_known_provider_redirects_to_idp() {
        let runtime = dev_runtime_with_oidc_mock();
        // `minimal_dev()` config has one issuer with id "dev".
        let provider = runtime.config.oidc_issuers[0].id.clone();
        let response = oidc_login(
            State(AppState {
                runtime: runtime.clone(),
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath(provider),
            origin_header_map(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::FOUND);
        let location = response
            .headers()
            .get(axum::http::header::LOCATION)
            .expect("Location header set")
            .to_str()
            .unwrap()
            .to_string();
        // Mock metadata sets the auth endpoint to issuer.example.test/authorize.
        assert!(
            location.starts_with("https://issuer.example.test/authorize?"),
            "Location must redirect to IdP authorization endpoint: {location}",
        );
        // The redirect URL must carry the required OIDC query params.
        for expected in [
            "client_id=",
            "redirect_uri=",
            "response_type=code",
            "scope=openid",
            "state=",
            "nonce=",
            "code_challenge=",
            "code_challenge_method=S256",
        ] {
            assert!(
                location.contains(expected),
                "missing {expected} in {location}",
            );
        }
        assert!(
            response
                .headers()
                .contains_key("access-control-allow-origin"),
            "302 must preserve CORS",
        );

        // Verify state was inserted into the session store.
        let state_value = location
            .split('?')
            .nth(1)
            .unwrap()
            .split('&')
            .find(|kv| kv.starts_with("state="))
            .unwrap()
            .trim_start_matches("state=");
        // The state in the URL is URL-encoded; decode minimally for the lookup.
        let decoded_state = percent_decode_in_test(state_value);
        assert_eq!(
            runtime.oidc_sessions.len(),
            1,
            "exactly one in-flight session after login",
        );
        assert!(
            runtime.oidc_sessions.take(&decoded_state).is_some(),
            "session keyed on the state token from the redirect",
        );
    }

    /// Minimal URL-decoder for the test's purposes (state token is base64
    /// URL-safe so often unchanged, but `%2B` etc may appear). Tests
    /// shouldn't pull a whole urlencoding crate in just for this.
    fn percent_decode_in_test(s: &str) -> String {
        let mut out = String::with_capacity(s.len());
        let bytes = s.as_bytes();
        let mut i = 0;
        while i < bytes.len() {
            if bytes[i] == b'%' && i + 2 < bytes.len() {
                let hi = (bytes[i + 1] as char).to_digit(16);
                let lo = (bytes[i + 2] as char).to_digit(16);
                if let (Some(h), Some(l)) = (hi, lo) {
                    out.push(((h * 16 + l) as u8) as char);
                    i += 3;
                    continue;
                }
            }
            out.push(bytes[i] as char);
            i += 1;
        }
        out
    }

    // ---- OIDC callback handler tests (#16 callback sub-item) ----

    /// Mock that returns a pre-built `OidcClaims` without any HTTP
    /// round-trip or signature verification. Tests inject this via
    /// `dev_runtime_with_oidc_mocks` so they can drive the callback
    /// flow without a real IdP.
    struct MockOidcCodeExchanger {
        claims: comtrya_core::auth::OidcClaims,
    }

    #[async_trait::async_trait]
    impl oidc::OidcCodeExchanger for MockOidcCodeExchanger {
        async fn exchange(
            &self,
            _request: oidc::OidcCodeExchangeRequest,
        ) -> Result<comtrya_core::auth::OidcClaims, String> {
            Ok(self.claims.clone())
        }
    }

    fn dev_runtime_with_oidc_mocks(claims: comtrya_core::auth::OidcClaims) -> Arc<Runtime> {
        let mut runtime = dev_runtime_no_extensions();
        let inner = Arc::get_mut(&mut runtime).expect("unique Arc on fresh runtime");
        inner.oidc_discovery = oidc::OidcDiscoveryCache::with_components(
            Box::new(MockOidcMetadataProvider {
                metadata: mock_provider_metadata(),
            }),
            Box::new(MockOidcCodeExchanger { claims }),
        );
        runtime
    }

    fn insert_login_session(runtime: &Runtime, provider_id: &str) -> String {
        use openidconnect::{Nonce, PkceCodeChallenge};
        let state_token = format!("state-{provider_id}-test");
        let (_chal, verifier) = PkceCodeChallenge::new_random_sha256();
        let now = now_seconds();
        runtime
            .oidc_sessions
            .insert(
                state_token.clone(),
                oidc::OidcLoginSession {
                    provider_id: provider_id.to_string(),
                    pkce_verifier: verifier,
                    nonce: Nonce::new_random(),
                    created_at_secs: now,
                },
                now,
            )
            .expect("insert ok");
        state_token
    }

    #[tokio::test]
    async fn oidc_callback_with_unknown_state_returns_401() {
        let runtime = dev_runtime_with_oidc_mock();
        let response = oidc_callback(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath("dev".to_string()),
            Query(OidcCallbackQuery {
                state: Some("bogus".to_string()),
                code: Some("any".to_string()),
            }),
            origin_header_map(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert!(
            response
                .headers()
                .contains_key("access-control-allow-origin"),
            "401 must preserve CORS",
        );
    }

    #[tokio::test]
    async fn oidc_callback_with_mismatched_provider_returns_401() {
        let runtime = dev_runtime_with_oidc_mock();
        let state_token = insert_login_session(&runtime, "dev");
        let response = oidc_callback(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            // session was issued for "dev"; call comes in on "other"
            AxumPath("other".to_string()),
            Query(OidcCallbackQuery {
                state: Some(state_token),
                code: Some("any".to_string()),
            }),
            origin_header_map(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn oidc_callback_happy_path_issues_browser_credential_cookie() {
        let claims = comtrya_core::auth::OidcClaims {
            issuer: "https://issuer.example.test".to_string(),
            subject: "user-rawkode".to_string(),
            email: Some("rawkode@example.test".to_string()),
            display_name: Some("Rawkode".to_string()),
            groups: Vec::new(),
        };
        let runtime = dev_runtime_with_oidc_mocks(claims);
        let provider = runtime.config.oidc_issuers[0].id.clone();
        let users_before = runtime
            .auth_service
            .lock()
            .expect("auth_service lock")
            .users_len();
        let state_token = insert_login_session(&runtime, &provider);

        let response = oidc_callback(
            State(AppState {
                runtime: runtime.clone(),
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath(provider),
            Query(OidcCallbackQuery {
                state: Some(state_token),
                code: Some("auth-code-from-idp".to_string()),
            }),
            origin_header_map(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::FOUND);
        assert_eq!(
            response
                .headers()
                .get(axum::http::header::LOCATION)
                .map(|v| v.to_str().unwrap()),
            Some("/"),
        );
        let cookie = response
            .headers()
            .get(axum::http::header::SET_COOKIE)
            .expect("Set-Cookie set")
            .to_str()
            .unwrap()
            .to_string();
        assert!(cookie.starts_with("comtrya_session="), "got: {cookie}");
        assert!(cookie.contains("HttpOnly"), "got: {cookie}");
        assert!(cookie.contains("SameSite=Lax"), "got: {cookie}");
        assert!(cookie.contains("Path=/"), "got: {cookie}");
        assert!(cookie.contains("Max-Age="), "got: {cookie}");
        // dev_runtime defaults tls_terminated=false → no Secure
        assert!(!cookie.contains("Secure"), "got: {cookie}");

        // User upserted in the AuthService.
        let users_after = runtime
            .auth_service
            .lock()
            .expect("auth_service lock")
            .users_len();
        assert_eq!(users_after, users_before + 1, "user must be upserted");

        // The cookie authenticates subsequent browser requests without a
        // bearer header, and carries the same scoped credential actions as the
        // production-testbed operator flow.
        let cookie_headers = cookie_header_map(&cookie);
        let principal = runtime.principal_from_headers(&cookie_headers);
        assert!(matches!(principal, PrincipalStatus::Credential));
        assert!(runtime.credential_allows(&cookie_headers, "graphql:read"));
        assert!(runtime.credential_allows(&cookie_headers, "git:read"));
    }

    #[tokio::test]
    async fn oidc_callback_jit_denied_returns_403() {
        // Issuer's allowed_domains is ["example.test"]; the mock claims
        // an email outside that domain → AuthService::login returns Forbidden.
        let claims = comtrya_core::auth::OidcClaims {
            issuer: "https://issuer.example.test".to_string(),
            subject: "outsider".to_string(),
            email: Some("outsider@other.com".to_string()),
            display_name: None,
            groups: Vec::new(),
        };
        let runtime = dev_runtime_with_oidc_mocks(claims);
        let provider = runtime.config.oidc_issuers[0].id.clone();
        let users_before = runtime
            .auth_service
            .lock()
            .expect("auth_service lock")
            .users_len();
        let state_token = insert_login_session(&runtime, &provider);

        let response = oidc_callback(
            State(AppState {
                runtime: runtime.clone(),
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath(provider),
            Query(OidcCallbackQuery {
                state: Some(state_token),
                code: Some("auth-code".to_string()),
            }),
            origin_header_map(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        let users_after = runtime
            .auth_service
            .lock()
            .expect("auth_service lock")
            .users_len();
        assert_eq!(users_after, users_before, "denied login must not upsert");
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
    async fn extension_assets_use_content_hash_cache_headers() {
        let runtime = dev_runtime();

        let response = extension_asset(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            AxumPath(("ext_issues".to_string(), "index.js".to_string())),
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
            data_dir: temp_dir("declared-ui-manifest-data"),
            extension_dir,
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("testbed-operator-code".to_string()),
            session_ttl_seconds: 300,
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
            "event session is expired, already used, or unknown"
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
            data_dir: temp_dir("prod"),
            extension_dir: test_extension_dir(),
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("operator-code".to_string()),
            session_ttl_seconds: 300,
        };

        assert!(
            validate_production_testbed(&config, &options)
                .unwrap_err()
                .contains("TLS")
        );
        let mut options = options;
        options.tls_terminated = true;
        assert!(validate_production_testbed(&config, &options).is_ok());
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
        import_test_repository(&runtime, "comtrya/comtrya");
        let git_state = PureRustGitState::from_runtime(&runtime);
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
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
    async fn git_endpoint_rate_limits_info_refs_per_principal() {
        // Build a runtime whose git info-refs ceiling is tiny so we can drive
        // it over the limit without thousands of requests.
        let mut config = InstanceConfig::minimal_dev();
        config.rate_limits.git_info_refs_per_principal = 2;
        let runtime = Arc::new(
            Runtime::start_with_config(
                StartupOptions {
                    data_dir: temp_dir("git-rate-limit"),
                    extension_dir: test_extension_dir(),
                    listen: "127.0.0.1:0".parse().unwrap(),
                    check: false,
                    tls_terminated: false,
                    operator_code: Some("testbed-operator-code".to_string()),
                    session_ttl_seconds: 300,
                },
                config,
                true,
            )
            .unwrap(),
        );
        import_test_repository(&runtime, "comtrya/comtrya");
        let git_state = PureRustGitState::from_runtime(&runtime);
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["git:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );

        let request = || {
            git_endpoint(
                State(AppState {
                    runtime: runtime.clone(),
                    git_state: git_state.clone(),
                }),
                bearer_headers(&token),
                Method::GET,
                AxumPath("comtrya/comtrya.git/info/refs".to_string()),
                RawQuery(Some("service=git-upload-pack".to_string())),
                Bytes::new(),
            )
        };

        // The ceiling is 2: the first two requests pass, the third trips it.
        assert_eq!(request().await.status(), StatusCode::OK);
        assert_eq!(request().await.status(), StatusCode::OK);
        let limited = request().await;
        assert_eq!(limited.status(), StatusCode::TOO_MANY_REQUESTS);
        let body = to_bytes(limited.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            ErrorCode::RateLimited.as_str()
        );
    }

    #[test]
    fn credential_store_outage_reports_unavailable_not_invalid() {
        // A storage outage during credential lookup must surface as a distinct
        // `Unavailable` status (→ 503), never as `Invalid` (→ 401), so a SQLite
        // hiccup is not mistaken for a bad token.
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let headers = bearer_headers(&token);

        // Sanity: a healthy store resolves the credential.
        assert!(matches!(
            runtime.principal_from_headers(&headers),
            PrincipalStatus::OperatorCredential
        ));

        // Now break the store and confirm the status flips to Unavailable.
        runtime
            .store
            .drop_credentials_table_for_tests()
            .expect("drop credentials table");
        assert!(matches!(
            runtime.principal_from_headers(&headers),
            PrincipalStatus::Unavailable
        ));
        // The action gate fails closed on the same outage.
        assert!(!runtime.credential_allows(&headers, "graphql:read"));
        // require_authenticated_principal surfaces a 503, not a 401.
        let response =
            require_authenticated_principal(PrincipalStatus::Unavailable, HeaderMap::new());
        assert_eq!(
            response.unwrap_err().status(),
            StatusCode::SERVICE_UNAVAILABLE
        );
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
    async fn git_receive_pack_rejects_bearer_credentials() {
        // Push (receive-pack) is PAT-only: even a bearer credential carrying
        // git:write must be refused, since browser cookies/bearers cannot push.
        // The client is challenged for HTTP Basic.
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["git:write".to_string()],
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

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(
            response
                .headers()
                .get("WWW-Authenticate")
                .and_then(|v| v.to_str().ok()),
            Some("Basic realm=\"comtrya\""),
        );
    }

    #[test]
    fn git_pat_hash_round_trips_and_rejects_wrong_secret() {
        let token = "cpat.pat_1_2.0123456789abcdef0123456789abcdef";
        let hash = git_pat_hash(token).expect("hash");
        assert!(hash.starts_with("$argon2id$"), "got: {hash}");
        assert!(git_pat_verify(token, &hash));
        assert!(!git_pat_verify(
            "cpat.pat_1_2.deadbeefdeadbeefdeadbeefdeadbeef",
            &hash
        ));
        assert!(!git_pat_verify(token, "not-a-phc-string"));
    }

    #[test]
    fn parse_git_pat_token_splits_id_and_secret() {
        assert_eq!(
            parse_git_pat_token("cpat.pat_1700000000_7.cpat_0011223344556677"),
            Some(("pat_1700000000_7", "cpat_0011223344556677")),
        );
        assert_eq!(parse_git_pat_token("Bearer sess_abc"), None);
        assert_eq!(parse_git_pat_token("cpat.onlyid"), None);
        assert_eq!(parse_git_pat_token("cpat..secret"), None);
        assert_eq!(parse_git_pat_token("cpat.id."), None);
    }

    #[test]
    fn git_pat_scope_maps_to_git_action_and_rejects_revoked_or_expired() {
        let runtime = dev_runtime_no_extensions();

        // Write-scoped token grants git:write and git:read; a read-only token
        // does not grant git:write.
        let (write_token, _) = runtime
            .create_git_personal_access_token(
                "comtrya://user/test",
                "push",
                vec!["git:read".to_string(), "git:write".to_string()],
                Some(90),
            )
            .unwrap();
        assert!(runtime.git_personal_access_token_allows(&write_token, "git:write"));
        assert!(runtime.git_personal_access_token_allows(&write_token, "git:read"));

        let (read_token, read_record) = runtime
            .create_git_personal_access_token(
                "comtrya://user/test",
                "read",
                vec!["git:read".to_string()],
                Some(90),
            )
            .unwrap();
        assert!(runtime.git_personal_access_token_allows(&read_token, "git:read"));
        assert!(!runtime.git_personal_access_token_allows(&read_token, "git:write"));

        // A revoked token grants nothing.
        assert!(
            runtime
                .revoke_git_personal_access_token("comtrya://user/test", &read_record.id)
                .unwrap()
        );
        assert!(!runtime.git_personal_access_token_allows(&read_token, "git:read"));

        // An already-expired token grants nothing.
        let (expired_token, expired_record) = runtime
            .create_git_personal_access_token(
                "comtrya://user/test",
                "expired",
                vec!["git:read".to_string(), "git:write".to_string()],
                Some(1),
            )
            .unwrap();
        runtime
            .store
            .force_expire_git_personal_access_token(&expired_record.id, now_seconds() - 1)
            .unwrap();
        assert!(!runtime.git_personal_access_token_allows(&expired_token, "git:write"));
    }

    #[tokio::test]
    async fn account_git_token_api_creates_lists_and_revokes_tokens() {
        let runtime = dev_runtime_no_extensions();
        let bearer = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["git:read".to_string(), "git:write".to_string()],
            PrincipalStatus::Credential,
        );
        let state = AppState {
            runtime: runtime.clone(),
            git_state: PureRustGitState::test_default(),
        };

        let create_response = create_git_token(
            State(state.clone()),
            bearer_headers(&bearer),
            Json(CreateGitTokenRequest {
                name: "Workstation".to_string(),
                scopes: vec!["git:read".to_string(), "git:write".to_string()],
                expires_in_days: Some(30),
            }),
        )
        .await;
        assert_eq!(create_response.status(), StatusCode::CREATED);
        let body = to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        let secret = payload["token"].as_str().unwrap();
        assert!(secret.starts_with("cpat."));
        let token_id = payload["personalAccessToken"]["id"].as_str().unwrap();

        let list_response = list_git_tokens(State(state.clone()), bearer_headers(&bearer)).await;
        assert_eq!(list_response.status(), StatusCode::OK);
        let body = to_bytes(list_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(payload["personalAccessTokens"][0]["id"], token_id);
        assert!(runtime.git_personal_access_token_allows(secret, "git:write"));

        let revoke_response = revoke_git_token(
            State(state),
            bearer_headers(&bearer),
            AxumPath(token_id.to_string()),
        )
        .await;
        assert_eq!(revoke_response.status(), StatusCode::OK);
        assert!(!runtime.git_personal_access_token_allows(secret, "git:write"));
    }

    #[tokio::test]
    async fn account_git_token_api_rejects_scopes_the_session_does_not_have() {
        let runtime = dev_runtime_no_extensions();
        let bearer = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["git:read".to_string()],
            PrincipalStatus::Credential,
        );
        let state = AppState {
            runtime,
            git_state: PureRustGitState::test_default(),
        };

        let create_response = create_git_token(
            State(state),
            bearer_headers(&bearer),
            Json(CreateGitTokenRequest {
                name: "Write token".to_string(),
                scopes: vec!["git:write".to_string()],
                expires_in_days: Some(30),
            }),
        )
        .await;

        assert_eq!(create_response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn git_receive_pack_requires_basic_pat_with_write_scope() {
        let runtime = dev_runtime_no_extensions();
        import_test_repository(&runtime, "comtrya/comtrya");
        let git_state = PureRustGitState::from_runtime(&runtime);

        // A read-only Basic PAT is refused for push.
        let (read_only_pat, _) = runtime
            .create_git_personal_access_token(
                "comtrya://user/test",
                "read only",
                vec!["git:read".to_string()],
                Some(90),
            )
            .unwrap();
        let read_only_response = git_endpoint(
            State(AppState {
                runtime: runtime.clone(),
                git_state: git_state.clone(),
            }),
            basic_headers("rawkode", &read_only_pat),
            Method::GET,
            AxumPath("comtrya/comtrya.git/info/refs".to_string()),
            RawQuery(Some("service=git-receive-pack".to_string())),
            Bytes::new(),
        )
        .await;
        assert_eq!(read_only_response.status(), StatusCode::FORBIDDEN);

        // A write-scoped Basic PAT clears the auth gate and reaches the
        // pure-Rust receive-pack responder, which processes the push and
        // returns a report-status (200). Push uses POST .../git-receive-pack;
        // info/refs intentionally does not advertise receive-pack here.
        let (write_pat, _) = runtime
            .create_git_personal_access_token(
                "comtrya://user/test",
                "push",
                vec!["git:read".to_string(), "git:write".to_string()],
                Some(90),
            )
            .unwrap();
        let mut push_body = Vec::new();
        // A no-op command line (old == new == zero-oid for a fresh ref) plus a
        // flush is enough to drive the responder past the auth gate and into a
        // report-status reply.
        let command = "0000000000000000000000000000000000000000 \
             0000000000000000000000000000000000000000 \
             refs/heads/__pat_test__\0report-status\n";
        let pkt_len = format!("{:04x}", command.len() + 4);
        push_body.extend_from_slice(pkt_len.as_bytes());
        push_body.extend_from_slice(command.as_bytes());
        push_body.extend_from_slice(b"0000");
        let response = git_endpoint(
            State(AppState { runtime, git_state }),
            basic_headers("rawkode", &write_pat),
            Method::POST,
            AxumPath("comtrya/comtrya.git/git-receive-pack".to_string()),
            RawQuery(None),
            Bytes::from(push_body),
        )
        .await;

        // The auth gate granted the write PAT: the response is from the
        // transport, never a 401/403 from the credential boundary.
        assert_ne!(response.status(), StatusCode::UNAUTHORIZED);
        assert_ne!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn graphql_response_starts_with_empty_workspace_and_nullable_root_repository() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
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
            json!({"query": "{ workspace { name repositories { id path } } repository extensionInstallations adminTelemetry }"}).to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();

        assert_eq!(payload["data"]["workspace"]["name"], "Default");
        assert!(
            payload["data"]["workspace"]["repositories"]
                .as_array()
                .unwrap()
                .is_empty()
        );
        assert!(payload["data"]["repository"].is_null());
        assert_eq!(
            payload["data"]["adminTelemetry"]["storage"]["repositories"]["count"],
            0
        );
        assert!(payload["data"].get("demo").is_none());
    }

    #[test]
    fn extension_storage_bootstraps_configured_workspace_and_extensions_without_fixture() {
        let runtime = dev_runtime();

        assert!(runtime.extension_storage.schema_path().is_file());
        assert!(runtime.extension_storage.documents_path().is_file());
        assert!(
            runtime
                .extension_storage
                .collection_data("repositories")
                .unwrap()
                .as_array()
                .unwrap()
                .is_empty()
        );
        assert_eq!(
            runtime
                .extension_storage
                .single_document_data("workspaces")
                .unwrap()
                .unwrap()["name"],
            "Default"
        );
        assert_eq!(
            runtime
                .extension_storage
                .collection_data("extension_installations")
                .unwrap()
                .as_array()
                .unwrap()
                .len(),
            runtime.extension_runtime.len()
        );

        runtime
            .extension_storage
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
        let check_docs = runtime
            .extension_storage
            .query_documents_by_index("check_runs", &[("name", json!("runtime mutation"))])
            .unwrap();
        assert_eq!(check_docs.len(), 1);
    }

    #[test]
    fn runtime_payload_reflects_runtime_storage_updates() {
        let runtime = dev_runtime();
        runtime
            .extension_storage
            .create_document(extension_document_record(
                "ext_checks",
                "check_runs",
                "check_runtime_payload",
                "comtrya://repository/repo_test",
                vec!["comtrya://repository/repo_test".to_string()],
                json!({
                    "repositoryID": "repo_test",
                    "name": "runtime payload",
                    "provider": "Comtrya CI",
                    "conclusion": "FAILURE",
                    "duration": "99s"
                }),
                "2026-05-11T00:00:00Z",
            ))
            .unwrap();

        let payload = runtime.runtime_payload().unwrap();
        let checks = payload["checks"].as_array().expect("checks array");

        assert!(
            checks
                .iter()
                .any(|check| check["conclusion"] == "FAILURE" && check["duration"] == "99s")
        );
    }

    #[test]
    fn runtime_payload_filters_disabled_configured_extension_installations() {
        // Declare two local extensions, one disabled — the disabled one must
        // be filtered out of the loaded runtime.
        let mut config = InstanceConfig::minimal_dev();
        config.extensions = vec![
            ExtensionInstallConfig {
                id: "checks".to_string(),
                source: ExtensionSource::Local {
                    path: "ext_checks".to_string(),
                },
                enabled: true,
                route_prefix: None,
            },
            ExtensionInstallConfig {
                id: "pull-requests".to_string(),
                source: ExtensionSource::Local {
                    path: "ext_pull_requests".to_string(),
                },
                enabled: false,
                route_prefix: None,
            },
        ];
        let runtime = Runtime::start_with_config(
            StartupOptions {
                data_dir: temp_dir("configured-runtime-filter-data"),
                extension_dir: test_extension_dir(),
                listen: "127.0.0.1:0".parse().unwrap(),
                check: false,
                tls_terminated: false,
                operator_code: Some("testbed-operator-code".to_string()),
                session_ttl_seconds: 300,
            },
            config,
            true,
        )
        .unwrap();

        let payload = runtime.runtime_payload().unwrap();
        let extensions = payload["extensions"]
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
            .join("ext_checks")
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

        assert_eq!(runtime.records.len(), FIRST_PARTY_EXTENSIONS.len());
        for id in FIRST_PARTY_EXTENSIONS {
            let resolver = runtime
                .records
                .get(*id)
                .expect("first-party extension loaded");
            assert_eq!(resolver.id, *id);
            assert_eq!(resolver.component, format!("dist/{id}.wasm"));
            assert_eq!(resolver.status, "platform-loaded");
            assert!(resolver.output_type.starts_with("comtrya."));
            assert!(resolver.output_type.ends_with("/summary.v1"));
        }
        let issue_relationships = &runtime.records["ext_issues"].relationship_types;
        assert!(
            issue_relationships
                .iter()
                .any(|rel| rel.id == "ext_issues.blocks" && rel.kind == "comtrya://rel/blocks"),
            "ext_issues should declare issue relationship types"
        );
        let epic_relationships = &runtime.records["ext_epics"].relationship_types;
        assert!(
            epic_relationships
                .iter()
                .any(|rel| rel.id == "ext_epics.issue-part-of-epic"
                    && rel.target_kinds == vec!["epic".to_string()]),
            "ext_epics should contribute issue-to-epic relationship types"
        );
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
        fs::write(
            &manifest_path,
            serde_json::to_vec_pretty(&manifest).unwrap(),
        )
        .unwrap();

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
        let error = load_configured_extension_runtime(&extension_dir, true, &configs).unwrap_err();

        assert!(error.contains("no generated typed WASM invoker"));
        assert!(error.contains("ext_local_wit"));
    }

    #[test]
    fn runtime_loaded_registry_dispatches_ext_issues_wasm_and_persists_event() {
        let runtime = Runtime::start(StartupOptions {
            data_dir: temp_dir("runtime-loaded-registry-dispatch"),
            extension_dir: test_extension_dir(),
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("testbed-operator-code".to_string()),
            session_ttl_seconds: 300,
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
        let open_issue_route = issue_route("open-issue");
        let close_issue_route = issue_route("close-issue");

        let opened_bytes = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "comtrya://workspace/ws_runtime_loaded_registry/repository/repo_runtime_loaded_registry",
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
            &close_issue_route,
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
        assert_eq!(
            issue.data.get("state").and_then(Value::as_str),
            Some("closed")
        );
        let event_log = fs::read_to_string(runtime.extension_storage.events_path()).unwrap();
        assert!(event_log.contains(&issue_event("opened")));
        assert!(event_log.contains(&issue_event("closed")));
    }

    #[test]
    fn runtime_loaded_registry_enforces_ext_issues_create_validation() {
        let runtime = Runtime::start(StartupOptions {
            data_dir: temp_dir("runtime-loaded-registry-issue-validation"),
            extension_dir: test_extension_dir(),
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_code: Some("testbed-operator-code".to_string()),
            session_ttl_seconds: 300,
        })
        .unwrap();
        let dispatcher = crate::wasm_registry::RegistryDispatcher {
            registry: runtime.wasm_registry.clone(),
            store: Arc::new(runtime.extension_storage.clone()),
        };
        let principal = "comtrya://user/usr_runtime_validation_test";
        let open_issue_route = issue_route("open-issue");

        let opened_bytes = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "  comtrya://workspace/ws_runtime_validation/repository/repo_runtime_validation  ",
                "title": "  trimmed title  ",
                "bodyMarkdown": "body",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect("valid open issue should pass");
        let opened: Value = serde_json::from_slice(&opened_bytes).unwrap();
        assert_eq!(
            opened.get("repository").and_then(Value::as_str),
            Some("comtrya://workspace/ws_runtime_validation/repository/repo_runtime_validation")
        );
        assert_eq!(
            opened.get("title").and_then(Value::as_str),
            Some("trimmed title")
        );
        let event_log = fs::read_to_string(runtime.extension_storage.events_path()).unwrap();
        assert!(event_log.contains(&issue_event("opened")));

        let blank_repository = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "  ",
                "title": "valid",
                "bodyMarkdown": "",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect_err("blank repository should fail");
        assert!(matches!(
            blank_repository.code,
            crate::wasm_host::wit_types::ErrorCode::BadInput
        ));
        assert!(blank_repository.message.contains("requires a repository"));

        let empty_workspace_segment = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "comtrya://workspace//repository/repo_runtime_validation",
                "title": "valid",
                "bodyMarkdown": "",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect_err("empty workspace segment should fail");
        assert!(matches!(
            empty_workspace_segment.code,
            crate::wasm_host::wit_types::ErrorCode::BadInput
        ));
        assert!(
            empty_workspace_segment
                .message
                .contains("requires a workspace")
        );

        let missing_workspace = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "comtrya://repository/repo_runtime_validation",
                "title": "valid",
                "bodyMarkdown": "",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect_err("repository-only issue should fail");
        assert!(matches!(
            missing_workspace.code,
            crate::wasm_host::wit_types::ErrorCode::BadInput
        ));
        assert!(missing_workspace.message.contains("requires a workspace"));

        let blank_title = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "comtrya://workspace/ws_runtime_validation/repository/repo_runtime_validation",
                "title": "  ",
                "bodyMarkdown": "",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect_err("blank title should fail");
        assert!(matches!(
            blank_title.code,
            crate::wasm_host::wit_types::ErrorCode::BadInput
        ));
        assert!(blank_title.message.contains("title must not be empty"));

        let long_title = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "comtrya://workspace/ws_runtime_validation/repository/repo_runtime_validation",
                "title": "x".repeat(513),
                "bodyMarkdown": "",
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect_err("long title should fail");
        assert!(matches!(
            long_title.code,
            crate::wasm_host::wit_types::ErrorCode::BadInput
        ));
        assert!(long_title.message.contains("at most 512 bytes"));

        let long_body = crate::wasm_host::OpsDispatcher::dispatch(
            &dispatcher,
            "ext_issues",
            &open_issue_route,
            &serde_json::to_vec(&json!({
                "repository": "comtrya://workspace/ws_runtime_validation/repository/repo_runtime_validation",
                "title": "valid",
                "bodyMarkdown": "x".repeat(64 * 1024 + 1),
            }))
            .unwrap(),
            principal,
            0,
        )
        .expect_err("long body should fail");
        assert!(matches!(
            long_body.code,
            crate::wasm_host::wit_types::ErrorCode::BadInput
        ));
        assert!(long_body.message.contains("at most 65536 bytes"));
    }

    #[tokio::test]
    async fn api_ops_route_ext_issues_without_graphql_aliases() {
        let runtime = dev_runtime();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["api:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let state = AppState {
            runtime: runtime.clone(),
            git_state: PureRustGitState::test_default(),
        };
        let headers = bearer_headers(&token);
        let repository = "comtrya://workspace/ws_api_ops/repository/repo_api_ops";

        let (status, created) = call_api_op(
            state.clone(),
            headers.clone(),
            "ext_issues",
            "issues",
            "open-issue",
            json!({
                "repository": repository,
                "title": "created through canonical API ops",
                "bodyMarkdown": "then closed through canonical API ops",
            }),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{created}");
        assert!(created["id"].as_str().unwrap().starts_with("iss_"));
        assert_eq!(created["repository"], repository);
        assert_eq!(created["number"], 1);
        assert_eq!(created["state"], "open");
        assert!(
            created["authorRef"]
                .as_str()
                .unwrap()
                .starts_with("comtrya://credential/prn_")
        );
        let issue_id = created["id"].as_str().unwrap().to_string();
        let issue_ref = format!("comtrya://issue/{issue_id}");

        let (status, by_ref) = call_api_op(
            state.clone(),
            headers.clone(),
            "ext_issues",
            "issues",
            "by-ref-issue",
            json!(issue_ref),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{by_ref}");
        assert_eq!(by_ref["id"], issue_id);
        assert_eq!(by_ref["state"], "open");

        let (status, listed) = call_api_op(
            state.clone(),
            headers.clone(),
            "ext_issues",
            "issues",
            "list-issues",
            json!({ "repository": repository, "limit": 100 }),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{listed}");
        assert_eq!(listed.as_array().unwrap()[0]["id"], issue_id);

        let (status, by_number) = call_api_op(
            state.clone(),
            headers.clone(),
            "ext_issues",
            "issues",
            "by-number-issue",
            json!({ "workspaceId": "ws_api_ops", "number": 1 }),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{by_number}");
        assert_eq!(by_number["id"], issue_id);

        let (status, counts) = call_api_op(
            state.clone(),
            headers.clone(),
            "ext_issues",
            "issues",
            "state-counts-for-refs-issue",
            json!([issue_ref.clone()]),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{counts}");
        assert_eq!(counts["open"], 1);
        assert_eq!(counts["closed"], 0);

        let (status, closed) = call_api_op(
            state.clone(),
            headers.clone(),
            "ext_issues",
            "issues",
            "close-issue",
            json!({
                "id": issue_id,
                "reason": "covered by canonical API ops",
            }),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{closed}");
        assert_eq!(closed["state"], "closed");
        assert_eq!(closed["stateReason"], "covered by canonical API ops");
        assert!(closed["closedAt"].as_str().is_some());
        assert!(
            closed["closedByRef"]
                .as_str()
                .unwrap()
                .starts_with("comtrya://credential/prn_")
        );
        let closed_issue_id = closed["id"].as_str().unwrap().to_string();

        let (status, closed_counts) = call_api_op(
            state,
            headers,
            "ext_issues",
            "issues",
            "state-counts-for-refs-issue",
            json!([issue_ref]),
        )
        .await;
        assert_eq!(status, StatusCode::OK, "{closed_counts}");
        assert_eq!(closed_counts["open"], 0);
        assert_eq!(closed_counts["closed"], 1);

        let records = runtime.extension_storage.load_records().unwrap();
        let stored = records
            .iter()
            .find(|record| record.collection == "issues" && record.id == closed_issue_id)
            .expect("WASM-created issue persisted");
        assert_eq!(stored.owner_extension, "ext_issues");
        assert_eq!(stored.data["state"], "closed");
        assert_eq!(stored.data["repository"], repository);
        let event_log = fs::read_to_string(runtime.extension_storage.events_path()).unwrap();
        assert!(event_log.contains(&issue_event("opened")));
        assert!(event_log.contains(&issue_event("closed")));
    }

    #[tokio::test]
    async fn api_ops_reject_unknown_extension_without_graphql_bridge() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["api:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let state = AppState {
            runtime,
            git_state: PureRustGitState::test_default(),
        };
        let (status, payload) = call_api_op(
            state,
            bearer_headers(&token),
            "ext_issues",
            "issues",
            "close-issue",
            json!({ "id": "iss_1" }),
        )
        .await;

        assert_eq!(status, StatusCode::NOT_FOUND, "{payload}");
        assert_eq!(payload["code"], "not-found");
        assert!(
            payload["message"]
                .as_str()
                .unwrap()
                .contains("extension 'ext_issues' not registered")
        );
    }

    #[tokio::test]
    async fn api_ops_reject_bad_issue_input() {
        let runtime = dev_runtime();
        let token = runtime.issue_credential(
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            vec!["api:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let state = AppState {
            runtime,
            git_state: PureRustGitState::test_default(),
        };

        let (status, payload) = call_api_op(
            state,
            bearer_headers(&token),
            "ext_issues",
            "issues",
            "open-issue",
            json!({
                "repository": "comtrya://workspace/ws_api_ops/repository/repo_api_ops",
                "title": "  ",
                "bodyMarkdown": "",
            }),
        )
        .await;

        assert_eq!(status, StatusCode::BAD_REQUEST, "{payload}");
        assert_eq!(payload["code"], "bad-input");
        assert!(payload["message"].as_str().unwrap().contains("title"));
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
                route_prefix: None,
            },
            ExtensionInstallConfig {
                id: "issues".to_string(),
                source: ExtensionSource::Local {
                    path: "ext_issues".to_string(),
                },
                enabled: false,
                route_prefix: None,
            },
        ];

        let runtime = load_configured_extension_runtime(&extension_dir, true, &configs).unwrap();

        assert_eq!(runtime.records.len(), 1);
        assert!(runtime.records.contains_key("ext_checks"));
        assert_eq!(
            runtime.records["ext_checks"].root,
            extension_dir.join("ext_checks")
        );
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

        assert!(runtime.records.is_empty());
    }

    #[test]
    fn configured_extensions_fall_back_to_first_party_when_not_declared() {
        let runtime = load_configured_extension_runtime(&test_extension_dir(), false, &[]).unwrap();

        assert_eq!(runtime.records.len(), FIRST_PARTY_EXTENSIONS.len());
        for id in FIRST_PARTY_EXTENSIONS {
            assert!(runtime.records.contains_key(*id));
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
                .join("dist")
                .join("ext_pull_requests.wasm"),
            "this is not a valid component",
        )
        .unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("compile"));
        assert!(error.contains("ext_pull_requests/dist/ext_pull_requests.wasm"));
    }

    #[test]
    fn extension_runtime_rejects_missing_platform_wit_version() {
        let extension_dir = temp_dir("extension-missing-platform-wit");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        let manifest_path = extension_dir.join("ext_checks").join("manifest.json");
        let mut manifest =
            serde_json::from_str::<Value>(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
        manifest
            .as_object_mut()
            .unwrap()
            .remove("platformWitVersion");
        fs::write(
            &manifest_path,
            serde_json::to_vec_pretty(&manifest).unwrap(),
        )
        .unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("missing platformWitVersion"));
        assert!(error.contains("first-party extensions must declare platformWitVersion"));
    }

    #[test]
    fn extension_runtime_rejects_non_dist_wasm_component_path() {
        let extension_dir = temp_dir("extension-invalid-wasm-path");
        copy_dir_recursive(&test_extension_dir(), &extension_dir);
        let manifest_path = extension_dir.join("ext_checks").join("manifest.json");
        let mut manifest =
            serde_json::from_str::<Value>(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
        manifest["wasmComponent"] = json!("somewhere-else.wasm");
        fs::write(
            &manifest_path,
            serde_json::to_vec_pretty(&manifest).unwrap(),
        )
        .unwrap();

        let error = load_extension_runtime(&extension_dir).unwrap_err();

        assert!(error.contains("wasmComponent must be dist/ext_checks.wasm"));
    }

    #[test]
    fn manifest_v2_accepted_with_identity_only() {
        let extension_dir = temp_dir("manifest-v2-accepted");
        fs::create_dir_all(extension_dir.join("assets")).unwrap();
        fs::create_dir_all(extension_dir.join("ui")).unwrap();
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
            "permissions": ["pull-requests.read"]
        });
        let result = validate_ui_manifest_from_value(&v2);
        assert!(
            result.is_ok(),
            "expected v2 manifest to validate: {result:?}"
        );
    }

    #[test]
    fn manifest_v1_rejected_after_migration_window() {
        let v1 = serde_json::json!({
            "schemaVersion": "comtrya.ui-extension/v1",
            "id": "ext_sample",
            "extension": "sample",
            "assets": { "entry": "/_extensions/ext_sample/assets/index.js", "entryIntegrity": "sha256-xyz", "styles": [] },
            "routes": [],
            "slots": [{ "slot": "repository.code", "element": "x-el", "requiredPermission": "code.read" }]
        });
        let result = validate_ui_manifest_from_value(&v1);
        assert!(
            result.is_err(),
            "v1 manifest should be rejected; got {result:?}"
        );
    }

    #[test]
    fn manifest_v2_ignores_legacy_contributes_block() {
        // A manifest that still includes the old declarative contributes
        // arrays must validate cleanly — those fields are ignored, since
        // slot/route/card registration is runtime, not manifest.
        let v2 = serde_json::json!({
            "schemaVersion": "comtrya.ui-extension/v2",
            "id": "ext_test", "extension": "test", "version": "0.1.0", "publisher": "comtrya-dev",
            "assets": { "entry": "/_extensions/ext_test/assets/index.js", "entryIntegrity": "sha256-abc", "styles": [] },
            "permissions": [],
            "contributes": { "slots": ["bogus"], "routes": false }
        });
        let result = validate_ui_manifest_from_value(&v2);
        assert!(
            result.is_ok(),
            "legacy contributes block must not fail validation: {result:?}"
        );
    }

    #[test]
    fn duplicate_route_prefixes_rejected_at_install() {
        let configs = vec![
            ExtensionInstallConfig {
                id: "ext_a".into(),
                source: ExtensionSource::Local {
                    path: "/tmp/a".into(),
                },
                enabled: true,
                route_prefix: Some("pulls".into()),
            },
            ExtensionInstallConfig {
                id: "ext_b".into(),
                source: ExtensionSource::Local {
                    path: "/tmp/b".into(),
                },
                enabled: true,
                route_prefix: Some("pulls".into()),
            },
        ];
        let result = validate_route_prefix_uniqueness(&configs);
        assert!(result.is_err());
        let msg = result.unwrap_err();
        assert!(
            msg.contains("pulls"),
            "error should name the duplicated prefix, got: {msg}"
        );
    }

    /// Build a minimal repositories JSON array for path resolver unit tests.
    fn repository_rows() -> Value {
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
    fn repository_by_path_resolves_repo() {
        let repos = repository_rows();
        let resolved =
            resolve_repository_by_path(&repos, &["comtrya".to_string(), "comtrya".to_string()]);
        assert!(resolved.is_some(), "expected to find comtrya/comtrya");
        assert_eq!(
            resolved
                .as_ref()
                .unwrap()
                .get("name")
                .and_then(Value::as_str),
            Some("comtrya")
        );
    }

    #[test]
    fn repository_by_path_returns_none_for_unknown_path() {
        let repos = repository_rows();
        let resolved = resolve_repository_by_path(&repos, &["nothing".to_string()]);
        assert!(resolved.is_none());
    }

    #[test]
    fn repository_by_path_returns_none_for_empty_segments() {
        let repos = repository_rows();
        let resolved = resolve_repository_by_path(&repos, &[]);
        assert!(resolved.is_none());
    }

    #[tokio::test]
    async fn user_layout_returns_empty_for_unknown_principal_repo() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:read".to_string()],
            PrincipalStatus::Credential,
        );
        let headers = bearer_headers(&token);
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({
                "query": "query($repositoryId: ID!) { userLayout(repositoryId: $repositoryId) { repositoryId entries } }",
                "variables": { "repositoryId": "repo_unknown" }
            })
            .to_string(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        let layout = &payload["data"]["userLayout"];
        assert_eq!(layout["repositoryId"], "repo_unknown");
        assert_eq!(layout["entries"], json!({}));
    }

    #[tokio::test]
    async fn set_user_layout_round_trips() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://user/test".to_string(),
            vec!["graphql:write".to_string()],
            PrincipalStatus::Credential,
        );
        let headers = bearer_headers(&token);
        let entries = json!({
            "issues-list": { "slot": "repository.sidebar", "priority": 50 },
            "checks-board": { "hidden": true }
        });
        let mutation = graphql_post(
            State(AppState {
                runtime: runtime.clone(),
                git_state: PureRustGitState::test_default(),
            }),
            headers.clone(),
            json!({
                "query": "mutation($repositoryId: ID!, $layout: UserLayoutInput!) { setUserLayout(repositoryId: $repositoryId, layout: $layout) { entries } }",
                "variables": {
                    "repositoryId": "repo_test",
                    "layout": { "entries": entries }
                }
            })
            .to_string(),
        )
        .await;
        assert_eq!(mutation.status(), StatusCode::OK);
        let mutation_body = to_bytes(mutation.into_body(), usize::MAX).await.unwrap();
        let mutation_payload = serde_json::from_slice::<Value>(&mutation_body).unwrap();
        assert_eq!(
            mutation_payload["data"]["setUserLayout"]["entries"],
            entries
        );

        let query = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            json!({
                "query": "query($repositoryId: ID!) { userLayout(repositoryId: $repositoryId) { entries } }",
                "variables": { "repositoryId": "repo_test" }
            })
            .to_string(),
        )
        .await;
        assert_eq!(query.status(), StatusCode::OK);
        let body = to_bytes(query.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(payload["data"]["userLayout"]["entries"], entries);
    }

    #[tokio::test]
    async fn set_user_layout_overwrites_previous_entries() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://user/test".to_string(),
            vec!["graphql:write".to_string()],
            PrincipalStatus::Credential,
        );
        let headers = bearer_headers(&token);
        let state = AppState {
            runtime: runtime.clone(),
            git_state: PureRustGitState::test_default(),
        };
        let first = graphql_post(
            State(state.clone()),
            headers.clone(),
            json!({
                "query": "mutation($repositoryId: ID!, $layout: UserLayoutInput!) { setUserLayout(repositoryId: $repositoryId, layout: $layout) { entries } }",
                "variables": {
                    "repositoryId": "repo_test",
                    "layout": { "entries": { "issues-list": { "slot": "repository.sidebar" } } }
                }
            })
            .to_string(),
        )
        .await;
        assert_eq!(first.status(), StatusCode::OK);
        let second = graphql_post(
            State(state.clone()),
            headers.clone(),
            json!({
                "query": "mutation($repositoryId: ID!, $layout: UserLayoutInput!) { setUserLayout(repositoryId: $repositoryId, layout: $layout) { entries } }",
                "variables": {
                    "repositoryId": "repo_test",
                    "layout": { "entries": { "checks-board": { "priority": 999 } } }
                }
            })
            .to_string(),
        )
        .await;
        assert_eq!(second.status(), StatusCode::OK);
        let body = to_bytes(second.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["data"]["setUserLayout"]["entries"],
            json!({ "checks-board": { "priority": 999 } }),
            "second mutation should replace entries map, not merge",
        );
    }

    #[tokio::test]
    async fn set_user_layout_rejects_anonymous_principal() {
        // Uses the shared helper so the assertion set (401, CORS header,
        // typed `unauthenticated` error code) is identical across every
        // mutation-rejection test in this file.
        assert_mutation_rejects_anonymous(
            "mutation { setUserLayout(repositoryId: \"r\", layout: { entries: {} }) { repositoryId } }",
            json!({ "repositoryId": "r", "layout": { "entries": {} } }),
        )
        .await;
    }

    // ---- P0-1a: anonymous-rejection on GraphQL mutation handlers (issue #4) ----

    async fn assert_mutation_rejects_anonymous(query: &str, variables: Value) {
        let runtime = dev_runtime_no_extensions();
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            origin_headers(),
            json!({ "query": query, "variables": variables }).to_string(),
        )
        .await;
        assert_eq!(
            response.status(),
            StatusCode::UNAUTHORIZED,
            "anonymous request to mutation `{query}` must be 401"
        );
        assert!(
            response
                .headers()
                .contains_key("access-control-allow-origin"),
            "401 must preserve CORS so the browser reads the body, not surface a CORS error",
        );
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert_eq!(
            payload["errors"][0]["extensions"]["code"],
            ErrorCode::Unauthenticated.as_str(),
            "error envelope must use the typed Unauthenticated code",
        );
    }

    #[tokio::test]
    async fn graphql_create_repository_rejects_anonymous() {
        assert_mutation_rejects_anonymous(
            "mutation($input: CreateRepositoryInput!) { createRepository(input: $input) { repository { path } } }",
            json!({ "input": { "path": "x/anonymous-poke" } }),
        )
        .await;
    }

    // The dispatch table uses dotted-field GraphQL identifiers
    // (`relations.create`, `comments.create`, …); the SDK and frontend send
    // queries in the same shape. Mirror that exactly in tests so they
    // actually reach the targeted handler.

    #[tokio::test]
    async fn graphql_relations_create_rejects_anonymous() {
        assert_mutation_rejects_anonymous(
            "mutation($input: RelationCreateInput!) { relations.create(input: $input) { id } }",
            json!({ "input": { "from": "a", "to": "b", "kind": "k" } }),
        )
        .await;
    }

    #[tokio::test]
    async fn graphql_relations_delete_rejects_anonymous() {
        assert_mutation_rejects_anonymous(
            "mutation($input: RelationDeleteInput!) { relations.delete(input: $input) }",
            json!({ "input": { "id": "r_anything" } }),
        )
        .await;
    }

    #[tokio::test]
    async fn graphql_comments_create_rejects_anonymous() {
        assert_mutation_rejects_anonymous(
            "mutation($input: CommentCreateInput!) { comments.create(input: $input) { id } }",
            json!({ "input": { "target": "issue:1", "body": "hi" } }),
        )
        .await;
    }

    #[tokio::test]
    async fn graphql_comments_update_rejects_anonymous() {
        assert_mutation_rejects_anonymous(
            "mutation($input: CommentUpdateInput!) { comments.update(input: $input) { id } }",
            json!({ "input": { "id": "c_1", "body": "edited" } }),
        )
        .await;
    }

    #[tokio::test]
    async fn graphql_comments_delete_rejects_anonymous() {
        assert_mutation_rejects_anonymous(
            "mutation($input: CommentDeleteInput!) { comments.delete(input: $input) }",
            json!({ "input": { "id": "c_1" } }),
        )
        .await;
    }

    #[tokio::test]
    async fn graphql_create_repository_rejects_invalid_token() {
        let runtime = dev_runtime_no_extensions();
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers_with_origin("not-a-real-token"),
            json!({
                "query": "mutation($input: CreateRepositoryInput!) { createRepository(input: $input) { repository { path } } }",
                "variables": { "input": { "path": "x/invalid-poke" } }
            })
            .to_string(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert!(
            response
                .headers()
                .contains_key("access-control-allow-origin"),
            "401 on Invalid bearer must preserve CORS too",
        );
    }

    #[tokio::test]
    async fn graphql_create_repository_succeeds_with_operator_credential() {
        // TEST-COUPLING CAVEAT: this happy-path test uses the operator-code credential,
        // which is slated for removal in #16 (OIDC epic). When that lands, replace the
        // `issue_credential(... OperatorCredential)` call with whatever stub the OIDC
        // verifier exposes for tests.
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            bearer_headers_with_origin(&token),
            json!({
                "query": "mutation($input: CreateRepositoryInput!) { createRepository(input: $input) { repository { path } } }",
                "variables": { "input": { "path": "x/authenticated-poke" } }
            })
            .to_string(),
        )
        .await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "authenticated mutation must not be false-positive-401'd by the new gate"
        );
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        assert!(
            payload["data"]["createRepository"]["repository"]["path"].is_string(),
            "happy-path response must carry a real repository payload, not just OK with an error envelope: {payload:?}"
        );
    }

    /// #16 lockdown: anonymous reads are now rejected. The GraphQL read path
    /// (every query, every mutation) flows through `graphql_guard`, which calls
    /// `require_authenticated_principal`. The frontend SDK auto-exchanges
    /// `PUBLIC_COMTRYA_OPERATOR_CODE` on bootstrap so real browser loads still
    /// succeed; this test pins the server contract.
    #[tokio::test]
    async fn graphql_comments_thread_rejects_anonymous() {
        let runtime = dev_runtime_no_extensions();
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            origin_headers(),
            json!({
                "query": "query($target: ID!) { comments.thread(target: $target) { id } }",
                "variables": { "target": "issue:1" }
            })
            .to_string(),
        )
        .await;
        assert_eq!(
            response.status(),
            StatusCode::UNAUTHORIZED,
            "anonymous GraphQL reads must be rejected under #16 lockdown",
        );
    }

    /// Zero-auth read access: the `workspace { ... }` query the shell sends on
    /// boot is served to anonymous callers (read-only). Repositories are
    /// PUBLIC-filtered for anonymous; mutations and admin surfaces stay gated.
    #[tokio::test]
    async fn graphql_query_workspace_allows_anonymous_read() {
        let runtime = dev_runtime_no_extensions();
        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            origin_headers(),
            json!({
                "query": "query { workspace { id name } }"
            })
            .to_string(),
        )
        .await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "anonymous workspace read is allowed under zero-auth read-only access",
        );
    }

    /// Zero-auth reads are PUBLIC-only: an anonymous workspace query returns
    /// public repositories but never private ones.
    #[tokio::test]
    async fn anonymous_workspace_read_is_public_only() {
        let runtime = dev_runtime_no_extensions();
        runtime
            .create_declared_repository(&comtrya_core::RepositoryConfig {
                path: "open/public-repo".to_string(),
                visibility: comtrya_core::Visibility::Public,
                description: None,
                storage_backend: None,
                default_branch: None,
            })
            .expect("create public repo");
        // create_repository_document defaults to PRIVATE visibility.
        runtime
            .create_repository_document("secret/private-repo", None)
            .expect("create private repo");

        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            origin_headers(),
            json!({ "query": "query { workspace { repositories { path visibility } } }" })
                .to_string(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        let paths: Vec<String> = payload["data"]["workspace"]["repositories"]
            .as_array()
            .cloned()
            .unwrap_or_default()
            .iter()
            .filter_map(|repo| repo["path"].as_str().map(str::to_owned))
            .collect();
        assert!(
            paths.iter().any(|p| p == "open/public-repo"),
            "public repo visible to anonymous: {paths:?}"
        );
        assert!(
            !paths.iter().any(|p| p == "secret/private-repo"),
            "private repo hidden from anonymous: {paths:?}"
        );
    }

    /// #16 lockdown: `/api/ops/:extension/:interface/:op` requires a session.
    /// Previously rejected only `Invalid` (malformed token); now rejects
    /// `Anonymous` as well so unauthenticated cross-origin probes can't reach
    /// extension dispatch.
    #[tokio::test]
    async fn api_op_rejects_anonymous() {
        let runtime = dev_runtime_no_extensions();
        let response = api_op(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            origin_headers(),
            AxumPath((
                "ext_issues".to_string(),
                "issues".to_string(),
                "list-issues".to_string(),
            )),
            Bytes::from_static(b"null"),
        )
        .await;
        assert_eq!(
            response.status(),
            StatusCode::UNAUTHORIZED,
            "anonymous /api/ops/* must be rejected under #16 lockdown",
        );
    }

    #[tokio::test]
    async fn graphql_commit_diff_returns_metadata_and_patch_for_head() {
        let runtime = dev_runtime_no_extensions();
        import_test_repository(&runtime, "comtrya/comtrya");
        let git_dir = runtime.repository_root().join("comtrya/comtrya.git");
        let head_oid = git_text(&git_dir, &["rev-parse", "refs/heads/main"])
            .unwrap()
            .trim()
            .to_string();
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
                "query": "query($segments:[String!]!,$oid:ID!){ workspace { repositoryByPath(segments:$segments) { id commitDiff(oid:$oid){ oid shortOid subject author patch error } } } }",
                "variables": { "segments": ["comtrya", "comtrya"], "oid": head_oid }
            })
            .to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        let cd = &payload["data"]["workspace"]["repositoryByPath"]["commitDiff"];
        assert_eq!(cd["oid"].as_str().unwrap(), head_oid);
        assert!(cd["shortOid"].as_str().unwrap().len() >= 4);
        assert!(
            cd["error"].is_null(),
            "commitDiff envelope must not carry an error for HEAD; got {cd:?}"
        );
        let patch = cd["patch"].as_str().unwrap_or("");
        assert!(
            patch.contains("diff --git") || patch.is_empty(),
            "commitDiff.patch should be a unified diff or empty; got {patch:?}"
        );
    }

    #[tokio::test]
    async fn graphql_commit_diff_returns_error_envelope_for_malformed_oid() {
        let runtime = dev_runtime_no_extensions();
        import_test_repository(&runtime, "comtrya/comtrya");
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
                "query": "query($segments:[String!]!,$oid:ID!){ workspace { repositoryByPath(segments:$segments) { commitDiff(oid:$oid){ oid error } } } }",
                "variables": { "segments": ["comtrya", "comtrya"], "oid": "not-a-hex-oid" }
            })
            .to_string(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        let err = &payload["data"]["workspace"]["repositoryByPath"]["commitDiff"]["error"];
        assert!(
            err.as_str().unwrap_or("").contains("hex"),
            "malformed oid must surface a validation error; got {err:?}"
        );
    }

    #[tokio::test]
    async fn graphql_workspace_repository_by_path_resolves_via_variables() {
        let runtime = dev_runtime_no_extensions();
        import_test_repository(&runtime, "comtrya/comtrya");
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
        assert!(
            !repo.is_null(),
            "repositoryByPath should resolve for comtrya/comtrya"
        );
        assert_eq!(repo["name"], "comtrya");
    }

    #[tokio::test]
    async fn graphql_workspace_repository_by_path_resolves_rawkode_smoke_repo() {
        let runtime = dev_runtime_no_extensions();
        let created = import_test_repository(&runtime, "rawkode/rawkode");
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
                "query": "query($segments: [String!]!) { workspace { repositoryByPath(segments: $segments) { id name path groups } } }",
                "variables": { "segments": ["rawkode", "rawkode"] }
            })
            .to_string(),
        )
        .await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let payload = serde_json::from_slice::<Value>(&body).unwrap();
        let repo = &payload["data"]["workspace"]["repositoryByPath"];

        assert!(
            !repo.is_null(),
            "repositoryByPath should resolve for rawkode/rawkode"
        );
        assert_eq!(repo["id"], created["id"]);
        assert_eq!(repo["name"], "rawkode");
        assert_eq!(repo["path"], "rawkode/rawkode");
        assert_eq!(repo["groups"], json!(["rawkode"]));
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
        let runtime: BTreeMap<String, ExtensionRuntimeRecord> = BTreeMap::new();
        let result = inject_route_prefix(extensions, &configs, &runtime);
        let items = result.as_array().unwrap();
        assert_eq!(items.len(), 2);
        assert!(items[0]["routePrefix"].is_null());
        assert_eq!(items[0]["relationshipTypes"], json!([]));
        assert!(items[1]["routePrefix"].is_null());
        assert_eq!(items[1]["relationshipTypes"], json!([]));
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
                source: ExtensionSource::Local {
                    path: "ext_a".into(),
                },
                enabled: true,
                route_prefix: Some("pulls".into()),
            },
            ExtensionInstallConfig {
                id: "ext_b".into(),
                source: ExtensionSource::Local {
                    path: "ext_b".into(),
                },
                enabled: true,
                route_prefix: None,
            },
        ];
        let runtime: BTreeMap<String, ExtensionRuntimeRecord> = BTreeMap::new();
        let result = inject_route_prefix(extensions, &configs, &runtime);
        let items = result.as_array().unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0]["routePrefix"], "pulls");
        assert_eq!(items[0]["relationshipTypes"], json!([]));
        assert!(items[1]["routePrefix"].is_null());
        assert_eq!(items[1]["relationshipTypes"], json!([]));
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
            ExtensionRuntimeRecord {
                id: "ext_pull_requests".to_string(),
                component: "dist/ext_pull_requests.wasm".to_string(),
                output_type: "comtrya.pull-requests/summary.v1".to_string(),
                status: "platform-loaded".to_string(),
                relationship_types: Vec::new(),
                storage_collections: Vec::new(),
                root: PathBuf::new(),
                ui_manifest: PathBuf::new(),
                route_prefix: Some("pulls".to_string()),
                cue_schemas: Vec::new(),
            },
        );
        let result = inject_route_prefix(extensions, &configs, &runtime);
        let items = result.as_array().unwrap();
        assert_eq!(items[0]["routePrefix"], "pulls");
        assert_eq!(items[0]["relationshipTypes"], json!([]));
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

    /// A repo whose `comtrya.cue` declares `visibility: "public"` resolves
    /// to PUBLIC even when the stored document still says PRIVATE — CUE is
    /// the source of truth for the anonymous read filter. A repo with no
    /// git dir on disk falls back to its stored value.
    #[test]
    fn effective_visibility_prefers_cue_over_stored() {
        use std::process::Command;

        fn git(args: &[&str], cwd: &std::path::Path) {
            let status = Command::new("git")
                .current_dir(cwd)
                .args(args)
                .status()
                .unwrap();
            assert!(status.success(), "git {args:?} failed");
        }

        let root = tempfile::Builder::new()
            .prefix("comtrya-effective-vis-")
            .tempdir()
            .unwrap();
        let repositories_root = root.path().join("repositories");

        // Seed a working repo whose comtrya.cue marks the repo public, then
        // clone it bare into the repositories root at owner/name.git — the
        // on-disk layout effective_repository_visibility expects.
        let work = root.path().join("work");
        std::fs::create_dir_all(&work).unwrap();
        git(&["init", "-q", "-b", "main"], &work);
        git(&["config", "user.email", "vis-test@comtrya"], &work);
        git(&["config", "user.name", "vis-test"], &work);
        git(&["config", "commit.gpgsign", "false"], &work);
        std::fs::write(
            work.join("comtrya.cue"),
            "package comtrya\n\nrepository: {\n\tvisibility: \"public\"\n}\n",
        )
        .unwrap();
        git(&["add", "comtrya.cue"], &work);
        git(&["commit", "-q", "-m", "seed"], &work);

        let public_git_dir = repositories_root.join("acme/public-repo.git");
        std::fs::create_dir_all(public_git_dir.parent().unwrap()).unwrap();
        git(
            &[
                "clone",
                "--bare",
                "--quiet",
                work.to_str().unwrap(),
                public_git_dir.to_str().unwrap(),
            ],
            root.path(),
        );

        let cache = cue_config::CueConfigCache::new();

        // Stored doc says PRIVATE; CUE says public → effective is PUBLIC.
        let stored_private = json!({ "path": "acme/public-repo", "visibility": "PRIVATE" });
        assert_eq!(
            effective_repository_visibility(&stored_private, &repositories_root, &cache, &[]),
            "PUBLIC",
            "CUE visibility must override the stored document value",
        );

        // A repo with no git dir on disk falls back to its stored value.
        let missing = json!({ "path": "acme/ghost", "visibility": "INTERNAL" });
        assert_eq!(
            effective_repository_visibility(&missing, &repositories_root, &cache, &[]),
            "INTERNAL",
            "missing git dir must fall back to the stored visibility",
        );
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
        import_test_repository(&runtime, "comtrya/comtrya");
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
        assert!(!repos.is_empty(), "expected imported repository");
        for repo in repos {
            assert!(repo.get("id").is_some(), "each repository must have id");
            assert!(repo.get("name").is_some(), "each repository must have name");
            assert!(
                repo.get("groups").and_then(|g| g.as_array()).is_some(),
                "groups must be an array, got: {:?}",
                repo.get("groups")
            );
            assert!(
                repo.get("openPullRequests")
                    .and_then(|n| n.as_u64())
                    .is_some(),
                "openPullRequests must be a u64"
            );
            let cs = repo
                .get("checkSummary")
                .and_then(|c| c.as_object())
                .expect("checkSummary must be an object");
            assert!(
                cs.get("passed").and_then(|v| v.as_u64()).is_some(),
                "checkSummary.passed must be an integer"
            );
            assert!(
                cs.get("total").and_then(|v| v.as_u64()).is_some(),
                "checkSummary.total must be an integer"
            );
            assert!(
                repo.get("lastCommitAt").is_some(),
                "lastCommitAt must be present"
            );
        }
    }

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
            assert!(
                item.as_object().unwrap().contains_key("relationshipTypes"),
                "each entry must carry relationshipTypes"
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
            { "name": "frontend build", "conclusion": "FAILURE" },
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
    fn viewer_permissions_reflect_real_principal() {
        // Anonymous (and Invalid) callers hold no granted scopes: the
        // public read surface must not report admin or write permissions.
        assert!(viewer_permissions_for(PrincipalStatus::Anonymous).is_empty());
        assert!(viewer_permissions_for(PrincipalStatus::Invalid).is_empty());

        // Authenticated credentials get read/write scopes but NOT admin.
        let credential = viewer_permissions_for(PrincipalStatus::Credential);
        assert!(credential.contains(&"graphql:read"));
        assert!(credential.contains(&"graphql:write"));
        assert!(
            !credential.contains(&"instance.admin"),
            "non-admin principals must never carry instance.admin"
        );

        // Only admin/operator principals carry instance.admin.
        assert!(
            viewer_permissions_for(PrincipalStatus::AdminCredential).contains(&"instance.admin")
        );
        assert!(
            viewer_permissions_for(PrincipalStatus::OperatorCredential).contains(&"instance.admin")
        );
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
            let repo = ev
                .get("repositoryID")
                .and_then(|v| v.as_str())
                .unwrap_or("");
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
        assert!(
            viewer["reviewQueue"]["items"].is_array(),
            "reviewQueue.items must be array"
        );

        // authoredPulls
        assert_eq!(viewer["authoredPulls"]["aggregated"], json!(true));
        assert!(
            viewer["authoredPulls"]["items"].is_array(),
            "authoredPulls.items must be array"
        );

        // failingChecks
        assert_eq!(viewer["failingChecks"]["aggregated"], json!(true));
        assert!(
            viewer["failingChecks"]["items"].is_array(),
            "failing check items must be array"
        );
    }

    // ---- #14 P3-4 regression: handlers must not panic on bad input ----

    /// `createRepository` with a path-traversal segment must reject
    /// cleanly (not panic). Guards against future refactors that
    /// might bypass `validate_repo_path` and reach the
    /// `segments.last()` / `segments.first()` invariant at the
    /// repository-create site.
    #[tokio::test]
    async fn create_repository_handler_rejects_traversal_path_without_panic() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_credential(
            "comtrya://workspace".to_string(),
            vec!["graphql:write".to_string()],
            PrincipalStatus::OperatorCredential,
        );
        let mut headers = HeaderMap::new();
        headers.insert("origin", HeaderValue::from_static("http://localhost:4321"));
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
            json!({
                "query": "mutation($input: CreateRepositoryInput!) { createRepository(input: $input) { repository { id } } }",
                "variables": { "input": { "path": "../etc/passwd" } }
            })
            .to_string(),
        )
        .await;

        // Must not panic. Any 4xx status is acceptable — the contract
        // is "graceful rejection, not crash."
        let status = response.status();
        assert!(
            status.is_client_error(),
            "expected 4xx for traversal path, got {status}; panic-free is the real assertion",
        );
    }

    /// Malformed JSON to /graphql must yield a graceful response,
    /// not panic. `graphql_post` already coerces parse failure to
    /// `json!({})`; this test pins the contract so future refactors
    /// don't reintroduce a panic.
    #[tokio::test]
    async fn graphql_endpoint_handles_malformed_json_without_panic() {
        let runtime = dev_runtime_no_extensions();
        let mut headers = HeaderMap::new();
        headers.insert("origin", HeaderValue::from_static("http://localhost:4321"));

        let response = graphql_post(
            State(AppState {
                runtime,
                git_state: PureRustGitState::test_default(),
            }),
            headers,
            "{not valid json".to_string(),
        )
        .await;

        // Must not panic. Status may be 200 (empty-payload fall-through)
        // or 4xx — the contract is "no crash, terminal response."
        let status = response.status();
        assert!(
            status.is_success() || status.is_client_error(),
            "expected 2xx or 4xx for malformed JSON, got {status}; panic-free is the real assertion",
        );
    }

    // P1-3 of #9 — graceful shutdown.

    #[test]
    fn fsync_round_trips_a_well_formed_log() {
        let dir = temp_dir("fsync-roundtrip");
        let path = dir.join("events.jsonl");
        append_jsonl(&path, serde_json::json!({"event": "one"})).unwrap();
        append_jsonl(&path, serde_json::json!({"event": "two"})).unwrap();

        fsync_jsonl_path(&path).expect("fsync on well-formed log");

        let body = fs::read_to_string(&path).unwrap();
        let lines: Vec<&str> = body.lines().collect();
        assert_eq!(lines.len(), 2);
        for line in lines {
            let parsed: Value = serde_json::from_str(line).expect("each line is JSON");
            assert!(parsed.get("event").is_some());
        }
    }

    #[test]
    fn fsync_safe_on_empty_log() {
        let dir = temp_dir("fsync-empty");
        let path = dir.join("audit.jsonl");
        // touch is the post-startup state — file exists, zero bytes.
        touch(&path).unwrap();
        fsync_jsonl_path(&path).expect("fsync on empty file");
        assert_eq!(fs::metadata(&path).unwrap().len(), 0);
    }

    #[test]
    fn fsync_errors_on_missing_file() {
        let dir = temp_dir("fsync-missing");
        let path = dir.join("does-not-exist.jsonl");
        let err = fsync_jsonl_path(&path).expect_err("missing path must Err, not panic");
        assert_eq!(err.kind(), std::io::ErrorKind::NotFound);
    }

    // -------- #11 P2-3: size-based log rotation --------

    #[test]
    fn append_jsonl_no_rotation_below_threshold() {
        let dir = temp_dir("rotate-below");
        let path = dir.join("events.jsonl");
        // Threshold 10_000 bytes, small writes — never rotates.
        for i in 0..3 {
            append_jsonl_with_rotation(&path, json!({"i": i}), 10_000).unwrap();
        }
        assert!(
            !dir.join("archive").exists(),
            "no archive dir when under threshold"
        );
        let body = fs::read_to_string(&path).unwrap();
        assert_eq!(body.lines().count(), 3);
    }

    #[test]
    fn append_jsonl_rotates_when_threshold_exceeded() {
        let dir = temp_dir("rotate-exceeded");
        let path = dir.join("events.jsonl");
        // Each line is ~30+ bytes; threshold 200 → rotates after a few.
        for i in 0..20 {
            append_jsonl_with_rotation(&path, json!({"i": i, "padding": "xxxxxxxxxx"}), 200)
                .unwrap();
        }
        let archive_dir = dir.join("archive");
        assert!(
            archive_dir.is_dir(),
            "archive dir must be created on rotation"
        );
        let archived: Vec<_> = fs::read_dir(&archive_dir)
            .unwrap()
            .filter_map(|e| e.ok().map(|e| e.file_name().into_string().unwrap()))
            .filter(|n| n.starts_with("events.") && n.ends_with(".jsonl"))
            .collect();
        assert!(!archived.is_empty(), "at least one archive file must exist");
        // Active file must still be present and contain the most recent
        // write only (the one that triggered the most recent rotation).
        assert!(path.is_file(), "active file recreated post-rotation");
    }

    #[test]
    fn rotation_uses_nanosecond_timestamp_so_back_to_back_rotates_dont_collide() {
        let dir = temp_dir("rotate-collide");
        let path = dir.join("events.jsonl");
        // Force two rotations within the same wall-clock second using
        // tiny threshold + back-to-back writes.
        append_jsonl_with_rotation(&path, json!({"first": true}), 5).unwrap();
        append_jsonl_with_rotation(&path, json!({"second": true}), 5).unwrap();
        append_jsonl_with_rotation(&path, json!({"third": true}), 5).unwrap();

        let archive_dir = dir.join("archive");
        let archived: Vec<_> = fs::read_dir(&archive_dir)
            .unwrap()
            .filter_map(|e| e.ok().map(|e| e.file_name().into_string().unwrap()))
            .filter(|n| n.starts_with("events.") && n.ends_with(".jsonl"))
            .collect();
        // Both prior writes should be in archive — distinct files,
        // not overwritten (regression guard for the second-granularity
        // collision bug).
        assert!(
            archived.len() >= 2,
            "expected at least 2 distinct archive files, got {archived:?}"
        );
    }

    #[test]
    fn read_events_returns_only_active_file_by_default() {
        let runtime = dev_runtime_no_extensions();
        // Drive 30 writes through the actual Runtime.append_event with a
        // tiny threshold injected via append_jsonl_with_rotation directly
        // (the Runtime method uses the 64 MiB constant which is impractical
        // for tests). After multiple rotations the active file is small.
        for i in 0..30 {
            append_jsonl_with_rotation(
                &runtime.events_path,
                json!({"i": i, "type": "test", "pad": "xxxxxxxxxx"}),
                100,
            )
            .unwrap();
        }
        let active = runtime.read_events();
        let all = runtime.read_events_including_archive();
        assert!(
            active.len() < all.len(),
            "active read must be a strict subset of including-archive after rotations: active={}, all={}",
            active.len(),
            all.len()
        );
        // Archive walk catches every event we wrote (plus any startup
        // events the Runtime emitted).
        let test_only: Vec<_> = all
            .iter()
            .filter(|v| v.get("type").and_then(Value::as_str) == Some("test"))
            .collect();
        assert_eq!(
            test_only.len(),
            30,
            "all 30 test events must be in include-archive view"
        );
    }

    #[test]
    fn read_events_including_archive_concatenates_chronologically() {
        let runtime = dev_runtime_no_extensions();
        let path = &runtime.events_path;
        // Three forced rotations; each rotation lands a single event in
        // an archive file, plus a final event in the active file.
        for marker in ["a", "b", "c", "d"] {
            append_jsonl_with_rotation(path, json!({"marker": marker, "type": "ord"}), 5).unwrap();
        }
        let all = runtime.read_events_including_archive();
        let ordered: Vec<&str> = all
            .iter()
            .filter(|v| v.get("type").and_then(Value::as_str) == Some("ord"))
            .filter_map(|v| v.get("marker").and_then(Value::as_str))
            .collect();
        assert_eq!(
            ordered,
            vec!["a", "b", "c", "d"],
            "archive walk must emit events in write order (lex-sort = numeric-sort of nanos)"
        );
    }

    #[test]
    fn rotate_jsonl_errors_when_path_has_no_parent() {
        // Verify rotate_jsonl returns Err (not panic) on an empty
        // path — no parent dir to create archive in.
        let result = rotate_jsonl(Path::new(""));
        assert!(
            result.is_err(),
            "rotate of empty path must err, got {result:?}"
        );
    }

    // -------- #4 P0-3: secure bearer tokens + audit-log redaction ----------

    #[test]
    fn next_secure_token_returns_unique_tokens() {
        use std::collections::HashSet;

        let runtime = dev_runtime_no_extensions();
        let mut tokens = HashSet::new();
        for _ in 0..1000 {
            tokens.insert(runtime.next_secure_token("sess"));
        }
        assert_eq!(
            tokens.len(),
            1000,
            "1000 OS-RNG tokens must all be unique; collision means the RNG is stuck"
        );
        // Format sanity: prefix + underscore + 32 hex chars.
        let sample: &String = tokens.iter().next().unwrap();
        assert!(sample.starts_with("sess_"));
        assert_eq!(sample.len(), "sess_".len() + 32);
        assert!(sample[5..].chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn issue_session_does_not_log_raw_token_to_audit() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_session(PrincipalStatus::OperatorCredential);
        let audit_lines = runtime.read_audit();
        assert!(
            !audit_lines.is_empty(),
            "session issuance must record an audit line"
        );
        let raw = serde_json::to_string(&audit_lines).unwrap();
        assert!(
            !raw.contains(&token),
            "raw bearer token must not appear in audit log; got: {raw}"
        );
        assert!(
            raw.contains("token_sha256_prefix"),
            "audit log must include the redacted token reference; got: {raw}"
        );
    }

    #[test]
    fn consume_session_works_with_secure_tokens() {
        let runtime = dev_runtime_no_extensions();
        let token = runtime.issue_session(PrincipalStatus::OperatorCredential);
        let principal = runtime
            .consume_session(&token)
            .expect("freshly issued session must consume cleanly");
        assert!(matches!(principal, PrincipalStatus::OperatorCredential));
    }

    // ----- #4 P1-6: per-route body size limits -----

    async fn spawn_test_server(runtime: Arc<Runtime>) -> std::net::SocketAddr {
        let app = router(AppState {
            runtime,
            git_state: PureRustGitState::test_default(),
        });
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });
        addr
    }

    #[tokio::test]
    async fn graphql_post_rejects_payload_exceeding_limit() {
        let addr = spawn_test_server(dev_runtime_no_extensions()).await;
        let oversized = "a".repeat(GRAPHQL_BODY_LIMIT + 1);
        let response = reqwest::Client::new()
            .post(format!("http://{addr}/graphql"))
            .header("content-type", "application/json")
            .body(oversized)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[tokio::test]
    async fn api_op_rejects_payload_exceeding_limit() {
        let addr = spawn_test_server(dev_runtime_no_extensions()).await;
        let oversized = "a".repeat(OPS_BODY_LIMIT + 1);
        let response = reqwest::Client::new()
            .post(format!(
                "http://{addr}/api/ops/ext_issues/issues/list-issues"
            ))
            .header("content-type", "application/json")
            .body(oversized)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[tokio::test]
    async fn token_exchange_rejects_payload_exceeding_limit() {
        let addr = spawn_test_server(dev_runtime_no_extensions()).await;
        let oversized = "a".repeat(SESSION_BODY_LIMIT + 1);
        let response = reqwest::Client::new()
            .post(format!("http://{addr}/auth/token-exchange"))
            .header("content-type", "application/json")
            .body(oversized)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[tokio::test]
    async fn token_exchange_brute_force_is_rate_limited() {
        // The operator code is the bootstrap admin secret; wrong-code guesses
        // from one caller must be throttled rather than allowed unbounded.
        let runtime = dev_runtime_no_extensions();
        let ceiling = runtime.config.rate_limits.token_exchange_per_principal;
        let addr = spawn_test_server(runtime).await;
        let client = reqwest::Client::new();
        let body = serde_json::json!({
            "grantType": "urn:comtrya:grant:operator-code",
            "subjectTokenType": "urn:comtrya:token-type:operator-code",
            "subjectToken": "wrong-code",
            "requestedResource": "comtrya://repository/comtrya/comtrya",
            "requestedActions": ["repository.read"],
        })
        .to_string();
        // All requests share the anonymous bucket (no auth, no forwarded
        // address), so the same key tallies across the loop. The ceiling is
        // inclusive; the (ceiling + 1)-th request must trip the limiter.
        let mut saw_rate_limit = false;
        for _ in 0..=ceiling {
            let response = client
                .post(format!("http://{addr}/auth/token-exchange"))
                .header("content-type", "application/json")
                .body(body.clone())
                .send()
                .await
                .unwrap();
            if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                saw_rate_limit = true;
                break;
            }
            // Until the limiter trips, a wrong code is rejected as 401, never 200.
            assert_eq!(response.status(), reqwest::StatusCode::UNAUTHORIZED);
        }
        assert!(
            saw_rate_limit,
            "token-exchange must 429 once the per-principal ceiling is exceeded"
        );
    }

    #[tokio::test]
    async fn extension_session_rejects_payload_exceeding_limit() {
        let addr = spawn_test_server(dev_runtime_no_extensions()).await;
        let oversized = "a".repeat(SESSION_BODY_LIMIT + 1);
        let response = reqwest::Client::new()
            .post(format!("http://{addr}/_extensions/session"))
            .header("content-type", "application/json")
            .body(oversized)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[tokio::test]
    async fn events_session_rejects_payload_exceeding_limit() {
        let addr = spawn_test_server(dev_runtime_no_extensions()).await;
        let oversized = "a".repeat(SESSION_BODY_LIMIT + 1);
        let response = reqwest::Client::new()
            .post(format!("http://{addr}/events/session"))
            .header("content-type", "application/json")
            .body(oversized)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[tokio::test]
    async fn git_endpoint_rejects_payload_exceeding_limit() {
        let addr = spawn_test_server(dev_runtime_no_extensions()).await;
        let oversized = vec![0u8; GIT_BODY_LIMIT + 1];
        let response = reqwest::Client::new()
            .post(format!(
                "http://{addr}/git/comtrya/comtrya.git/git-upload-pack"
            ))
            .header("content-type", "application/x-git-upload-pack-request")
            .body(oversized)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[tokio::test]
    async fn graphql_post_accepts_payload_under_limit() {
        // Regression guard: the limit must reject only when exceeded.
        // A request just under the cap should pass extraction (and reach
        // the GraphQL parser, which will produce a 4xx/5xx — not 413).
        let addr = spawn_test_server(dev_runtime_no_extensions()).await;
        let body = format!(
            "{{\"query\": \"query Q {{ {} }}\"}}",
            "a".repeat(GRAPHQL_BODY_LIMIT - 64)
        );
        let response = reqwest::Client::new()
            .post(format!("http://{addr}/graphql"))
            .header("content-type", "application/json")
            .body(body)
            .send()
            .await
            .unwrap();
        assert_ne!(
            response.status(),
            reqwest::StatusCode::PAYLOAD_TOO_LARGE,
            "request under GRAPHQL_BODY_LIMIT must not 413"
        );
    }

    // ----- #4 P2-6: security response headers -----

    async fn spawn_security_test_server(runtime: Arc<Runtime>) -> std::net::SocketAddr {
        let app = router(AppState {
            runtime,
            git_state: PureRustGitState::test_default(),
        });
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });
        addr
    }

    fn dev_runtime_with_tls_terminated(tls_terminated: bool) -> Arc<Runtime> {
        Arc::new(
            Runtime::start_with_config(
                StartupOptions {
                    data_dir: temp_dir("sec-tls"),
                    extension_dir: test_extension_dir(),
                    listen: "127.0.0.1:0".parse().unwrap(),
                    check: false,
                    tls_terminated,
                    operator_code: Some("testbed-operator-code".to_string()),
                    session_ttl_seconds: 300,
                },
                InstanceConfig::minimal_dev(),
                true,
            )
            .unwrap(),
        )
    }

    #[tokio::test]
    async fn baseline_security_headers_applied_to_every_response() {
        let addr = spawn_security_test_server(dev_runtime_no_extensions()).await;
        // /healthz is the simplest 200 path with no auth requirements.
        let response = reqwest::Client::new()
            .get(format!("http://{addr}/healthz"))
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::OK);
        let headers = response.headers();
        assert_eq!(
            headers
                .get("x-content-type-options")
                .and_then(|v| v.to_str().ok()),
            Some("nosniff"),
        );
        assert_eq!(
            headers.get("referrer-policy").and_then(|v| v.to_str().ok()),
            Some("no-referrer"),
        );
        assert_eq!(
            headers
                .get("content-security-policy")
                .and_then(|v| v.to_str().ok()),
            Some("frame-ancestors 'none'"),
        );
        // tls_terminated defaults to false in dev_runtime → no HSTS.
        assert!(
            headers.get("strict-transport-security").is_none(),
            "HSTS must be absent without tls_terminated; got {:?}",
            headers.get("strict-transport-security"),
        );
    }

    #[tokio::test]
    async fn security_headers_applied_to_error_responses() {
        // 404 responses also carry the baseline; otherwise an attacker
        // probing for routes could MIME-sniff a 404 payload.
        let addr = spawn_security_test_server(dev_runtime_no_extensions()).await;
        let response = reqwest::Client::new()
            .get(format!("http://{addr}/does-not-exist"))
            .send()
            .await
            .unwrap();
        let headers = response.headers();
        assert_eq!(
            headers
                .get("x-content-type-options")
                .and_then(|v| v.to_str().ok()),
            Some("nosniff"),
        );
        assert_eq!(
            headers.get("referrer-policy").and_then(|v| v.to_str().ok()),
            Some("no-referrer"),
        );
    }

    #[tokio::test]
    async fn hsts_applied_when_tls_terminated() {
        let addr = spawn_security_test_server(dev_runtime_with_tls_terminated(true)).await;
        let response = reqwest::Client::new()
            .get(format!("http://{addr}/healthz"))
            .send()
            .await
            .unwrap();
        assert_eq!(
            response
                .headers()
                .get("strict-transport-security")
                .and_then(|v| v.to_str().ok()),
            Some("max-age=63072000; includeSubDomains"),
        );
    }

    #[tokio::test]
    async fn extension_asset_csp_not_overridden_by_global_layer() {
        // /_extensions/.../assets/* installs its own per-route CSP
        // (`frame-ancestors 'self'`) via `apply_extension_asset_headers`.
        // The global layer uses `if_not_present` so the asset CSP must
        // survive. Hitting a missing asset still goes through the
        // handler and exercises the same code path.
        let addr = spawn_security_test_server(dev_runtime_no_extensions()).await;
        let response = reqwest::Client::new()
            .get(format!(
                "http://{addr}/_extensions/ext_issues/assets/index.js"
            ))
            .send()
            .await
            .unwrap();
        let csp = response
            .headers()
            .get("content-security-policy")
            .and_then(|v| v.to_str().ok())
            .map(String::from);
        // If the asset existed we'd see the per-route CSP. If not,
        // we'd see the global `frame-ancestors 'none'`. Either way,
        // we should NEVER see both layered, and the value must contain
        // `frame-ancestors`.
        let csp = csp.unwrap_or_default();
        assert!(
            csp.contains("frame-ancestors"),
            "asset response must carry a CSP with frame-ancestors; got {csp:?}",
        );
    }

    #[test]
    fn update_document_if_version_is_scoped_to_owning_extension() {
        // Regression: two extensions may legitimately hold the same
        // (collection, id). A versioned commit must only ever mutate the
        // caller's own record, never another owner's.
        let dir = temp_dir("storage-owner-scope");
        let store = ExtensionRuntimeStore::open_for_tests(&dir).expect("open store");

        let record = |owner: &str, marker: &str| {
            extension_document_record(
                owner,
                "repositories",
                "shared-id",
                "comtrya://repository/shared-id",
                vec![],
                json!({ "marker": marker }),
                "2026-05-11T00:00:00Z",
            )
        };
        store
            .create_document(record("ext_a", "a-original"))
            .unwrap();
        store
            .create_document(record("ext_b", "b-original"))
            .unwrap();

        // ext_b commits at version 1 — must touch ONLY ext_b's record.
        store
            .update_document_if_version("ext_b", "repositories", "shared-id", Some(1), |val, _| {
                if let Some(obj) = val.as_object_mut() {
                    obj.insert("marker".to_string(), json!("b-updated"));
                }
            })
            .expect("ext_b update succeeds");

        let records = store.load_records().unwrap();
        let find = |owner: &str| {
            records
                .iter()
                .find(|r| {
                    r.owner_extension == owner
                        && r.collection == "repositories"
                        && r.id == "shared-id"
                })
                .expect("record present")
        };
        let a = find("ext_a");
        assert_eq!(
            a.data["marker"],
            json!("a-original"),
            "other owner untouched"
        );
        assert_eq!(a.version, 1, "other owner version unchanged");
        let b = find("ext_b");
        assert_eq!(b.data["marker"], json!("b-updated"));
        assert_eq!(b.version, 2, "caller version bumped");

        // A commit for an owner with no such record must not fall through to
        // another owner's record.
        let missing =
            store.update_document_if_version("ext_c", "repositories", "shared-id", None, |_, _| {});
        assert!(
            missing.is_err_and(|e| e.contains("not found")),
            "commit for non-owner must report not-found, not corrupt another owner"
        );
    }
}
