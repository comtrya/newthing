use axum::body::Body;
use axum::extract::{Query, State};
use axum::http::{HeaderMap, HeaderValue, Method, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, options, post};
use axum::{Json, Router};
use forgepoint_core::{
    ClientKind, CorsPolicy, DatabaseConfig, Environment, ErrorCode, InstanceCapabilities,
    InstanceConfig, RepoStorageBackend, ResourceRef, TokenAction, allowed_methods_for_route,
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::{BTreeMap, HashMap};
use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

#[tokio::main]
async fn main() {
    let options = StartupOptions::from_env_and_args(std::env::args().skip(1));
    let runtime = match Runtime::start(options) {
        Ok(runtime) => Arc::new(runtime),
        Err(error) => {
            eprintln!("forgepoint-server refused to start: {error}");
            std::process::exit(1);
        }
    };

    if runtime.options.check {
        let ready = runtime.readiness();
        println!(
            "forgepoint-server ready={} mode={} dataDir={}",
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
    let app = router(AppState { runtime });
    let listener = tokio::net::TcpListener::bind(listen)
        .await
        .unwrap_or_else(|error| {
            eprintln!("failed to bind: {error}");
            std::process::exit(1);
        });
    println!(
        "forgepoint-server listening on http://{}",
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
        .route("/_extensions/session", post(extension_session))
        .route(
            "/_extensions/:extension/manifest.json",
            get(extension_manifest),
        )
        .route("/_extensions/:extension/assets/*path", get(extension_asset))
        .route("/git/*path", get(git_endpoint).post(git_endpoint))
        .route("/*path", options(preflight))
        .with_state(state)
}

#[derive(Clone)]
struct AppState {
    runtime: Arc<Runtime>,
}

#[derive(Debug, Clone)]
struct StartupOptions {
    config_path: Option<PathBuf>,
    data_dir: PathBuf,
    listen: SocketAddr,
    check: bool,
    tls_terminated: bool,
    operator_token: Option<String>,
}

impl StartupOptions {
    fn from_env_and_args(args: impl Iterator<Item = String>) -> Self {
        let mut config_path = std::env::var_os("FORGEPOINT_CONFIG").map(PathBuf::from);
        let mut data_dir = std::env::var_os("FORGEPOINT_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("./data"));
        let mut listen = std::env::var("FORGEPOINT_LISTEN")
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
            listen,
            check,
            tls_terminated: env_truthy("FORGEPOINT_TLS_TERMINATED"),
            operator_token: std::env::var("FORGEPOINT_OPERATOR_TOKEN").ok(),
        }
    }
}

#[derive(Debug)]
struct Runtime {
    options: StartupOptions,
    config: InstanceConfig,
    data_dir: PathBuf,
    events_path: PathBuf,
    audit_path: PathBuf,
    sessions: Mutex<HashMap<String, SessionRecord>>,
    credentials: Mutex<HashMap<String, CredentialRecord>>,
    rate_limits: Mutex<HashMap<(String, u64), u32>>,
    token_counter: AtomicU64,
}

impl Runtime {
    fn start(options: StartupOptions) -> Result<Self, String> {
        let config = if let Some(path) = &options.config_path {
            load_config_file(path)?
        } else {
            InstanceConfig::minimal_dev()
        };
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
        touch(&events_path).map_err(|error| format!("failed to initialize event log: {error}"))?;
        touch(&audit_path).map_err(|error| format!("failed to initialize audit log: {error}"))?;

        let runtime = Self {
            data_dir: options.data_dir.clone(),
            options,
            config,
            events_path,
            audit_path,
            sessions: Mutex::new(HashMap::new()),
            credentials: Mutex::new(HashMap::new()),
            rate_limits: Mutex::new(HashMap::new()),
            token_counter: AtomicU64::new(0),
        };
        runtime
            .append_event(
                "dev.forgepoint.instance.started",
                json!({"mode": runtime.mode()}),
            )
            .map_err(|error| format!("failed to append startup event: {error}"))?;
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
            "productionTlsTerminated".to_string(),
            self.config.environment != Environment::Production || self.options.tls_terminated,
        );
        checks.insert(
            "operatorTokenConfigured".to_string(),
            self.config.environment != Environment::Production
                || self.options.operator_token.is_some(),
        );
        let ready = checks.values().all(|value| *value);
        Readiness {
            ready,
            mode: self.mode().to_string(),
            checks,
            unsupported: vec![
                "full OIDC browser callback validation".to_string(),
                "native gix smart-HTTP pack execution".to_string(),
                "Wasmtime component execution".to_string(),
            ],
        }
    }

    fn check_boundary(&self, headers: &HeaderMap, route: &str) -> Result<HeaderMap, Response> {
        if self.config.environment == Environment::Production && !self.options.tls_terminated {
            return Err(error_response(
                StatusCode::SERVICE_UNAVAILABLE,
                ErrorCode::ConfigInvalid.as_str(),
                "production requires FORGEPOINT_TLS_TERMINATED=true behind a TLS terminator",
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

        if self
            .options
            .operator_token
            .as_deref()
            .is_some_and(|operator| operator == token)
        {
            return PrincipalStatus::Operator;
        }

        let credentials = self
            .credentials
            .lock()
            .expect("credential lock not poisoned");
        if credentials
            .get(token)
            .is_some_and(|credential| credential.expires_at > now_seconds())
        {
            return PrincipalStatus::Credential;
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
                    && credential.resource.starts_with("forgepoint://repository/")
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
                    expires_at: now_seconds() + 300,
                    used: false,
                },
            );
        let _ = self.append_audit("dev.forgepoint.session.issued", json!({"token": token}));
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

    fn issue_credential(&self, resource: String, actions: Vec<String>) -> String {
        let token = self.next_token("fp");
        self.credentials
            .lock()
            .expect("credential lock not poisoned")
            .insert(
                token.clone(),
                CredentialRecord {
                    resource: resource.clone(),
                    actions: actions.clone(),
                    expires_at: now_seconds() + 300,
                },
            );
        let _ = self.append_event(
            "dev.forgepoint.auth.credential.issued",
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
                "source": "forgepoint://instance/local",
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
enum PrincipalStatus {
    Anonymous,
    Operator,
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
    resource: String,
    actions: Vec<String>,
    expires_at: u64,
}

#[derive(Debug, Clone, Serialize)]
struct Readiness {
    ready: bool,
    mode: String,
    checks: BTreeMap<String, bool>,
    unsupported: Vec<String>,
}

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
    let capabilities = InstanceCapabilities::v1();
    json_response(
        StatusCode::OK,
        json!({
            "data": {
                "viewer": {
                    "authenticated": principal != PrincipalStatus::Anonymous,
                    "permissions": if principal == PrincipalStatus::Operator {
                        vec!["instance.admin", "graphql:read", "graphql:write", "events:read"]
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
                }
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
        PrincipalStatus::Operator | PrincipalStatus::Credential
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
                .unwrap_or("dev.forgepoint.event");
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
        PrincipalStatus::Operator | PrincipalStatus::Credential
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
        json!({"session": token, "expiresIn": 300}),
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
    if request.grant_type != "urn:forgepoint:grant:oidc-token-exchange"
        || request.subject_token_type != "urn:ietf:params:oauth:token-type:jwt"
    {
        return error_response(
            StatusCode::BAD_REQUEST,
            ErrorCode::BadUserInput.as_str(),
            "unsupported token exchange grant",
        );
    }
    if state
        .runtime
        .options
        .operator_token
        .as_deref()
        .is_none_or(|token| token != request.subject_token)
    {
        return error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "subject token did not validate against the production testbed operator token",
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

async fn extension_manifest(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/_extensions/ext_01hv/manifest.json")
    {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    text_response(
        StatusCode::OK,
        "application/json",
        include_str!("../../../extensions/examples/pull-requests/ui/manifest.json"),
        cors,
    )
}

async fn extension_asset(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let cors = match state
        .runtime
        .check_boundary(&headers, "/_extensions/ext_01hv/assets/index.js")
    {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    let mut response = text_response(
        StatusCode::OK,
        "text/javascript",
        include_str!("../../../extensions/examples/pull-requests/assets/index.js"),
        cors,
    );
    response.headers_mut().insert(
        "Content-Security-Policy",
        HeaderValue::from_static(
            "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'",
        ),
    );
    response
        .headers_mut()
        .insert("ETag", HeaderValue::from_static("\"development\""));
    response
}

async fn git_endpoint(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
) -> Response {
    let cors = match state.runtime.check_boundary(&headers, "/git/*") {
        Ok(cors) => cors,
        Err(response) => return response,
    };
    let principal = state.runtime.principal_from_headers(&headers);
    if !matches!(
        principal,
        PrincipalStatus::Operator | PrincipalStatus::Credential
    ) {
        let mut response = error_response(
            StatusCode::UNAUTHORIZED,
            ErrorCode::Unauthenticated.as_str(),
            "Git smart HTTP requires a valid Forgepoint credential",
        );
        response.headers_mut().insert(
            "WWW-Authenticate",
            HeaderValue::from_static("Bearer realm=\"forgepoint\""),
        );
        return response;
    }
    let required_action = if method == Method::GET {
        "git:read"
    } else {
        "git:write"
    };
    if principal == PrincipalStatus::Credential
        && !state.runtime.credential_allows(&headers, required_action)
    {
        return error_response(
            StatusCode::FORBIDDEN,
            ErrorCode::Forbidden.as_str(),
            "credential scope does not allow requested Git operation",
        );
    }
    let status = if method == Method::GET {
        StatusCode::NOT_IMPLEMENTED
    } else {
        StatusCode::NOT_IMPLEMENTED
    };
    json_response(
        status,
        json!({
            "errors": [{
                "message": "native gix smart-HTTP pack execution is not enabled in the production testbed runtime",
                "extensions": {"code": "STORAGE_UNAVAILABLE"}
            }]
        }),
        cors,
    )
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

fn error_response(status: StatusCode, code: &str, message: &str) -> Response {
    json_response(
        status,
        json!({"errors": [{"message": message, "extensions": {"code": code}}]}),
        HeaderMap::new(),
    )
}

fn validate_production_testbed(
    config: &InstanceConfig,
    options: &StartupOptions,
) -> Result<(), String> {
    if config.environment != Environment::Production {
        return Ok(());
    }
    if !options.tls_terminated {
        return Err("production mode requires FORGEPOINT_TLS_TERMINATED=true".to_string());
    }
    if options
        .operator_token
        .as_deref()
        .is_none_or(|token| token.len() < 32 || token == "dev-secret")
    {
        return Err(
            "production testbed requires FORGEPOINT_OPERATOR_TOKEN with at least 32 characters"
                .to_string(),
        );
    }
    if !options.data_dir.is_absolute() {
        return Err("production mode requires an absolute FORGEPOINT_DATA_DIR".to_string());
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

fn load_config_file(path: &Path) -> Result<InstanceConfig, String> {
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
                "PUBLIC" => forgepoint_core::Visibility::Public,
                "INTERNAL" => forgepoint_core::Visibility::Internal,
                _ => forgepoint_core::Visibility::Private,
            };
        }
    }
    config.validate().map_err(|error| error.to_string())?;
    Ok(config)
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

fn env_truthy(name: &str) -> bool {
    std::env::var(name)
        .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    use forgepoint_core::OidcIssuerConfig;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "forgepoint-testbed-{name}-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("time works")
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn dev_runtime() -> Arc<Runtime> {
        Arc::new(
            Runtime::start(StartupOptions {
                config_path: None,
                data_dir: temp_dir("dev"),
                listen: "127.0.0.1:0".parse().unwrap(),
                check: false,
                tls_terminated: false,
                operator_token: Some("testbed-operator-token-000000000000".to_string()),
            })
            .unwrap(),
        )
    }

    #[tokio::test]
    async fn readyz_reports_runtime_checks() {
        let state = AppState {
            runtime: dev_runtime(),
        };
        let response = readyz(State(state), HeaderMap::new()).await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        assert!(String::from_utf8_lossy(&body).contains("\"ready\":true"));
    }

    #[tokio::test]
    async fn disallowed_origin_is_forbidden() {
        let state = AppState {
            runtime: dev_runtime(),
        };
        let mut headers = HeaderMap::new();
        headers.insert("origin", HeaderValue::from_static("https://evil.example"));
        let response = graphql_get(State(state), headers).await;

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn session_token_is_single_use_for_events() {
        let runtime = dev_runtime();
        let token = runtime.issue_session(PrincipalStatus::Operator);
        let mut query = HashMap::new();
        query.insert("session".to_string(), token.clone());

        let state = AppState {
            runtime: runtime.clone(),
        };
        let first = events(State(state.clone()), HeaderMap::new(), Query(query.clone())).await;
        let second = events(State(state), HeaderMap::new(), Query(query)).await;

        assert_eq!(first.status(), StatusCode::OK);
        assert_eq!(second.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn production_mode_requires_tls_operator_token_and_absolute_paths() {
        let mut config = InstanceConfig::minimal_dev();
        config.environment = Environment::Production;
        config.public_url = "https://forgepoint.example.test".to_string();
        config.allowed_origins = vec!["https://forgepoint.example.test".to_string()];
        config.oidc_issuers = vec![OidcIssuerConfig {
            id: "prod".to_string(),
            issuer_url: "https://issuer.example.test".to_string(),
            client_id: "forgepoint".to_string(),
            client_kind: ClientKind::Confidential,
            client_secret: Some("not-a-dev-secret".to_string()),
            redirect_url: "https://forgepoint.example.test/auth/oidc/prod/callback".to_string(),
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
            listen: "127.0.0.1:0".parse().unwrap(),
            check: false,
            tls_terminated: false,
            operator_token: Some("operator-token-with-enough-length".to_string()),
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

    #[test]
    fn config_loader_reads_production_testbed_cue_subset() {
        let dir = temp_dir("config");
        let repos = temp_dir("config-repos");
        let config_path = dir.join("config.cue");
        fs::write(
            &config_path,
            format!(
                r#"
package forgepoint
instance: {{
  id: "prod"
  name: "Prod"
  publicURL: "https://forgepoint.example.test"
  environment: "production"
  allowedOrigins: ["https://forgepoint.example.test"]
}}
database: {{ kind: "sqlite", url: "sqlite://forgepoint.db" }}
oidc: issuers: [{{
  issuerURL: "https://issuer.example.test"
  clientID: "forgepoint"
  clientKind: "confidential"
  clientSecret: "prod-secret"
  redirectURL: "https://forgepoint.example.test/auth/oidc/prod/callback"
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
        assert_eq!(config.allowed_origins, ["https://forgepoint.example.test"]);
    }

    #[tokio::test]
    async fn token_exchange_issues_short_lived_testbed_credential() {
        let runtime = dev_runtime();
        let request = TokenExchangeRequest {
            grant_type: "urn:forgepoint:grant:oidc-token-exchange".to_string(),
            subject_token: "testbed-operator-token-000000000000".to_string(),
            subject_token_type: "urn:ietf:params:oauth:token-type:jwt".to_string(),
            requested_resource: "forgepoint://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3"
                .to_string(),
            requested_actions: vec!["git:read".to_string()],
        };

        let response =
            token_exchange(State(AppState { runtime }), HeaderMap::new(), Json(request)).await;

        assert_eq!(response.status(), StatusCode::OK);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        assert!(String::from_utf8_lossy(&body).contains("\"expiresIn\":300"));
    }

    #[tokio::test]
    async fn git_endpoint_fails_closed_after_auth_until_native_pack_execution_exists() {
        let runtime = dev_runtime();
        let mut headers = HeaderMap::new();
        headers.insert(
            "authorization",
            HeaderValue::from_static("Bearer testbed-operator-token-000000000000"),
        );

        let response = git_endpoint(State(AppState { runtime }), headers, Method::GET).await;

        assert_eq!(response.status(), StatusCode::NOT_IMPLEMENTED);
    }
}
