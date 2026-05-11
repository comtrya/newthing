use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
};
use metrics::{counter, histogram};
use serde::Deserialize;
use std::time::Instant;
use tokio::io::AsyncWriteExt;
use tokio_util::io::ReaderStream;

use crate::pkt::{PKT_FLUSH, Pkt, decode_pkt_lines, encode_pkt_line};
use crate::repo::{is_public_repo, resolve_repo_dir};
use crate::{GitHttpState, pack};

#[derive(Debug, Deserialize)]
pub struct ServiceQuery {
    pub service: Option<String>,
}

enum AdvertiseMode {
    Git,
    Rust,
}

/// Dispatch a parsed Smart HTTP request to the appropriate handler.
/// Suffix is the trailing portion of the request path, one of:
///   "info/refs", "git-upload-pack", "git-receive-pack"
/// Segments are the repository path components (e.g. ["forge", "demo"]).
pub async fn dispatch<S>(
    state: S,
    segments: Vec<String>,
    suffix: &str,
    query_service: Option<&str>,
    headers: HeaderMap,
    body: axum::body::Body,
) -> Response
where
    S: GitHttpState,
{
    match suffix {
        "info/refs" => {
            if query_service != Some("git-upload-pack") {
                return (StatusCode::BAD_REQUEST, "unsupported service").into_response();
            }
            let repo_dir = match resolve_repo_dir(state.storage(), &segments) {
                Ok(p) => p,
                Err(_) => return (StatusCode::NOT_FOUND, "repo not found").into_response(),
            };
            if !is_public_repo(&repo_dir) {
                return (StatusCode::NOT_FOUND, "repo not found").into_response();
            }
            match select_advertise_mode() {
                AdvertiseMode::Rust => advertise_v2_rust(&state, &segments, &headers).await,
                AdvertiseMode::Git => advertise_v2_via_git(&state, &segments, &headers).await,
            }
        }
        "git-upload-pack" => handle_upload_pack(state, segments, headers, body).await,
        "git-receive-pack" => receive_pack_blocked().await.into_response(),
        _ => (StatusCode::NOT_FOUND, "git endpoint not found").into_response(),
    }
}

fn select_advertise_mode() -> AdvertiseMode {
    match std::env::var("COMTRYA_GIT_SMART_V2_ADVERTISE")
        .ok()
        .as_deref()
    {
        Some("rust") => AdvertiseMode::Rust,
        Some("git") => AdvertiseMode::Git,
        _ => AdvertiseMode::Rust,
    }
}

// GET /:repo(.git)?/info/refs?service=git-upload-pack
pub async fn info_refs_root<S>(
    State(state): State<S>,
    Path(repo): Path<String>,
    Query(q): Query<ServiceQuery>,
) -> Response
where
    S: GitHttpState,
{
    let start = Instant::now();
    if q.service.as_deref() != Some("git-upload-pack") {
        return (StatusCode::BAD_REQUEST, "unsupported service").into_response();
    }
    // Gating: repo must be public
    let segments = vec![repo];
    let repo_dir = match resolve_repo_dir(state.storage(), &segments) {
        Ok(p) => p,
        Err(e) => {
            tracing::debug!("resolve_repo_dir failed: {}", e);
            return (StatusCode::NOT_FOUND, "repo not found").into_response();
        }
    };
    if !is_public_repo(&repo_dir) {
        tracing::debug!("repo not public: {}", repo_dir.display());
        return (StatusCode::NOT_FOUND, "repo not found").into_response();
    }

    let resp = match select_advertise_mode() {
        AdvertiseMode::Rust => advertise_v2_rust(&state, &segments, &HeaderMap::new()).await,
        AdvertiseMode::Git => advertise_v2_via_git(&state, &segments, &HeaderMap::new()).await,
    };
    counter!("git_http.info_refs", "scope" => "root").increment(1);
    histogram!("git_http.info_refs_ms").record(start.elapsed().as_millis() as f64);
    resp
}

// GET /:group/:repo(.git)?/info/refs?service=git-upload-pack
pub async fn info_refs_group<S>(
    State(state): State<S>,
    Path((group, repo)): Path<(String, String)>,
    Query(q): Query<ServiceQuery>,
) -> Response
where
    S: GitHttpState,
{
    let start = Instant::now();
    if q.service.as_deref() != Some("git-upload-pack") {
        return (StatusCode::BAD_REQUEST, "unsupported service").into_response();
    }
    let segments = vec![group, repo];
    let repo_dir = match resolve_repo_dir(state.storage(), &segments) {
        Ok(p) => p,
        Err(e) => {
            tracing::debug!("resolve_repo_dir failed: {}", e);
            return (StatusCode::NOT_FOUND, "repo not found").into_response();
        }
    };
    if !is_public_repo(&repo_dir) {
        tracing::debug!("repo not public: {}", repo_dir.display());
        return (StatusCode::NOT_FOUND, "repo not found").into_response();
    }

    let resp = match select_advertise_mode() {
        AdvertiseMode::Rust => advertise_v2_rust(&state, &segments, &HeaderMap::new()).await,
        AdvertiseMode::Git => advertise_v2_via_git(&state, &segments, &HeaderMap::new()).await,
    };
    counter!("git_http.info_refs", "scope" => "group").increment(1);
    histogram!("git_http.info_refs_ms").record(start.elapsed().as_millis() as f64);
    resp
}

// POST /:repo(.git)?/git-upload-pack
pub async fn upload_pack_root<S>(
    State(state): State<S>,
    Path(repo): Path<String>,
    headers: HeaderMap,
    body: axum::body::Body,
) -> Response
where
    S: GitHttpState,
{
    handle_upload_pack(state, vec![repo], headers, body).await
}

// POST /:group/:repo(.git)?/git-upload-pack
pub async fn upload_pack_group<S>(
    State(state): State<S>,
    Path((group, repo)): Path<(String, String)>,
    headers: HeaderMap,
    body: axum::body::Body,
) -> Response
where
    S: GitHttpState,
{
    handle_upload_pack(state, vec![group, repo], headers, body).await
}

// POST /.../git-receive-pack (explicitly blocked)
pub async fn receive_pack_blocked() -> impl IntoResponse {
    // Receive-pack is intentionally not wired to public dispatch until write auth,
    // object connectivity validation, pack safety, and ref transactions are reviewed.
    (StatusCode::FORBIDDEN, "push over HTTP is disabled")
}

#[allow(dead_code)]
const RECEIVE_ZERO_OID: &str = "0000000000000000000000000000000000000000";

#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct ReceivePackCommandSet {
    commands: Vec<ReceivePackCommand>,
    capabilities: ReceivePackCapabilities,
    pack_bytes: usize,
}

#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct ReceivePackCommand {
    old_oid: String,
    new_oid: String,
    ref_name: String,
}

#[allow(dead_code)]
#[derive(Debug, Default, Clone, PartialEq, Eq)]
struct ReceivePackCapabilities {
    report_status: bool,
    report_status_v2: bool,
    object_format: Option<String>,
    agent: Option<String>,
}

#[allow(dead_code)]
fn parse_receive_pack_command_set(bytes: &[u8]) -> anyhow::Result<ReceivePackCommandSet> {
    let mut offset = 0usize;
    let mut commands = Vec::new();
    let mut capabilities = ReceivePackCapabilities::default();

    loop {
        if offset + 4 > bytes.len() {
            anyhow::bail!("truncated pkt-line length");
        }
        let len = usize::from_str_radix(std::str::from_utf8(&bytes[offset..offset + 4])?, 16)?;
        offset += 4;
        if len == 0 {
            break;
        }
        if len <= 4 {
            anyhow::bail!("unsupported receive-pack control packet");
        }
        let data_len = len - 4;
        if offset + data_len > bytes.len() {
            anyhow::bail!("truncated pkt-line data");
        }
        let data = &bytes[offset..offset + data_len];
        offset += data_len;

        let command_data = if commands.is_empty() {
            if let Some(nul) = data.iter().position(|b| *b == 0) {
                parse_receive_pack_capabilities(&data[nul + 1..], &mut capabilities)?;
                &data[..nul]
            } else {
                data
            }
        } else {
            data
        };
        commands.push(parse_receive_pack_command(command_data)?);
    }

    if commands.is_empty() {
        anyhow::bail!("no ref update commands");
    }

    Ok(ReceivePackCommandSet {
        commands,
        capabilities,
        pack_bytes: bytes.len().saturating_sub(offset),
    })
}

#[allow(dead_code)]
fn parse_receive_pack_capabilities(
    bytes: &[u8],
    capabilities: &mut ReceivePackCapabilities,
) -> anyhow::Result<()> {
    let text = std::str::from_utf8(bytes)?.trim_end_matches('\n');
    for capability in text.split_whitespace() {
        match capability {
            "report-status" => capabilities.report_status = true,
            "report-status-v2" => capabilities.report_status_v2 = true,
            capability if capability.starts_with("agent=") => {
                capabilities.agent = Some(capability["agent=".len()..].to_string());
            }
            capability if capability.starts_with("object-format=") => {
                let object_format = &capability["object-format=".len()..];
                if object_format != "sha1" {
                    anyhow::bail!("unsupported object-format {object_format}");
                }
                capabilities.object_format = Some(object_format.to_string());
            }
            _ => {}
        }
    }
    Ok(())
}

#[allow(dead_code)]
fn parse_receive_pack_command(data: &[u8]) -> anyhow::Result<ReceivePackCommand> {
    let line = std::str::from_utf8(data)?.trim_end_matches('\n');
    let mut parts = line.split(' ');
    let old_oid = parts.next().unwrap_or_default();
    let new_oid = parts.next().unwrap_or_default();
    let ref_name = parts.next().unwrap_or_default();
    if parts.next().is_some()
        || !receive_pack_is_sha1_hex(old_oid)
        || !receive_pack_is_sha1_hex(new_oid)
    {
        anyhow::bail!("malformed ref update command");
    }
    validate_receive_pack_ref(ref_name)?;
    Ok(ReceivePackCommand {
        old_oid: old_oid.to_string(),
        new_oid: new_oid.to_string(),
        ref_name: ref_name.to_string(),
    })
}

#[allow(dead_code)]
fn receive_pack_is_sha1_hex(value: &str) -> bool {
    value.len() == 40 && value.bytes().all(|b| b.is_ascii_hexdigit())
}

#[allow(dead_code)]
fn validate_receive_pack_ref(ref_name: &str) -> anyhow::Result<()> {
    if !(ref_name.starts_with("refs/heads/") || ref_name.starts_with("refs/tags/")) {
        anyhow::bail!("unsupported ref namespace");
    }
    if ref_name.ends_with('/')
        || ref_name.contains("//")
        || ref_name.contains("..")
        || ref_name.contains("@{")
        || ref_name
            .bytes()
            .any(|b| b <= 0x20 || matches!(b, b'~' | b'^' | b':' | b'?' | b'*' | b'[' | b'\\'))
    {
        anyhow::bail!("invalid ref name");
    }
    if ref_name.split('/').any(|part| {
        part.is_empty()
            || part == "."
            || part.ends_with(".lock")
            || part.starts_with('.')
            || part.ends_with('.')
    }) {
        anyhow::bail!("invalid ref name");
    }
    Ok(())
}

async fn advertise_v2_rust<S>(state: &S, segments: &[String], _headers: &HeaderMap) -> Response
where
    S: GitHttpState,
{
    // Validate repo exists and is exported
    let repo_dir = match resolve_repo_dir(state.storage(), segments) {
        Ok(p) => p,
        Err(_) => return (StatusCode::NOT_FOUND, "repo not found").into_response(),
    };
    if !is_public_repo(&repo_dir) {
        return (StatusCode::NOT_FOUND, "repo not found").into_response();
    }

    // Compose a protocol v2 advertisement matching git http-backend semantics closely.
    let mut body = Vec::with_capacity(256);
    // Smart HTTP service banner (always present in info/refs over HTTP).
    body.extend_from_slice(&encode_pkt_line(b"# service=git-upload-pack\n"));
    body.extend_from_slice(PKT_FLUSH);
    // version banner
    body.extend_from_slice(&encode_pkt_line(b"version 2\n"));
    // Capability and command advertisement. Ordering chosen to mirror common git output.
    // agent (value masked in our trace normalizer)
    body.extend_from_slice(&encode_pkt_line(
        format!("agent=comtrya/{}\n", env!("CARGO_PKG_VERSION")).as_bytes(),
    ));
    // session-id (random-ish; masked by normalizer)
    let sid = format!("{:016x}", rand::random::<u64>());
    body.extend_from_slice(&encode_pkt_line(format!("session-id={}\n", sid).as_bytes()));
    // object format: we currently only support sha1 repositories
    body.extend_from_slice(&encode_pkt_line(b"object-format=sha1\n"));
    // allow server options passthrough
    body.extend_from_slice(&encode_pkt_line(b"server-option\n"));
    // commands
    body.extend_from_slice(&encode_pkt_line(b"ls-refs\n"));
    // fetch features we implement or parse today
    body.extend_from_slice(&encode_pkt_line(b"fetch=shallow\n"));
    body.extend_from_slice(&encode_pkt_line(b"fetch=filter\n"));
    body.extend_from_slice(&encode_pkt_line(b"fetch=ref-in-want\n"));
    body.extend_from_slice(&encode_pkt_line(b"fetch=deepen-since\n"));
    body.extend_from_slice(&encode_pkt_line(b"fetch=deepen-not\n"));
    body.extend_from_slice(PKT_FLUSH);

    Response::builder()
        .status(StatusCode::OK)
        .header(
            header::CONTENT_TYPE,
            "application/x-git-upload-pack-advertisement",
        )
        .header(header::CACHE_CONTROL, "no-cache")
        .body(axum::body::Body::from(body))
        .expect("response build")
}

async fn advertise_v2_via_git<S>(state: &S, segments: &[String], headers: &HeaderMap) -> Response
where
    S: GitHttpState,
{
    let repo_dir = match resolve_repo_dir(state.storage(), segments) {
        Ok(p) => p,
        Err(_) => return (StatusCode::NOT_FOUND, "repo not found").into_response(),
    };
    if !is_public_repo(&repo_dir) {
        return (StatusCode::NOT_FOUND, "repo not found").into_response();
    }
    let mut cmd = tokio::process::Command::new("git");
    cmd.arg("upload-pack")
        .arg("--stateless-rpc")
        .arg("--advertise-refs")
        .arg(repo_dir);
    cmd.stdout(std::process::Stdio::piped());
    if let Some(v) = headers.get("Git-Protocol").and_then(|v| v.to_str().ok()) {
        cmd.env("GIT_PROTOCOL", v);
    } else {
        cmd.env("GIT_PROTOCOL", "version=2");
    }
    match cmd.output().await {
        Ok(output) if output.status.success() => {
            let mut body = output.stdout;
            let mut cursor = 0usize;
            let mut patched = false;
            while cursor + 4 <= body.len() {
                let len_bytes = &body[cursor..cursor + 4];
                let len =
                    match usize::from_str_radix(std::str::from_utf8(len_bytes).unwrap_or(""), 16) {
                        Ok(v) => v,
                        Err(_) => break,
                    };
                cursor += 4;
                if len == 0 {
                    break;
                }
                if len == 1 {
                    continue;
                }
                if cursor + (len - 4) > body.len() {
                    break;
                }
                let data_end = cursor + (len - 4);
                let data = &body[cursor..data_end];
                if data.starts_with(b"fetch=")
                    && !data.windows(b"filter".len()).any(|w| w == b"filter")
                {
                    let mut line = data.to_vec();
                    if line.ends_with(b"\n") {
                        line.pop();
                        line.extend_from_slice(b" filter\n");
                    } else {
                        line.extend_from_slice(b" filter");
                    }
                    let mut patched_body = Vec::with_capacity(body.len() + 8);
                    patched_body.extend_from_slice(&body[..cursor - 4]);
                    patched_body.extend_from_slice(&encode_pkt_line(&line));
                    patched_body.extend_from_slice(&body[data_end..]);
                    body = patched_body;
                    patched = true;
                    break;
                }
                cursor = data_end;
            }
            if !patched && body.len() >= 4 && &body[body.len() - 4..] == PKT_FLUSH {
                let mut patched_body = Vec::with_capacity(body.len() + 8);
                patched_body.extend_from_slice(&body[..body.len() - 4]);
                patched_body.extend_from_slice(&encode_pkt_line(b"fetch=filter\n"));
                patched_body.extend_from_slice(PKT_FLUSH);
                body = patched_body;
            }
            return Response::builder()
                .status(StatusCode::OK)
                .header(
                    header::CONTENT_TYPE,
                    "application/x-git-upload-pack-advertisement",
                )
                .header(header::CACHE_CONTROL, "no-cache")
                .body(axum::body::Body::from(body))
                .expect("response build");
        }
        Ok(output) => (
            StatusCode::BAD_GATEWAY,
            format!("git upload-pack advertise failed: {}", output.status),
        )
            .into_response(),
        Err(e) => (StatusCode::BAD_GATEWAY, format!("failed to spawn git: {e}")).into_response(),
    }
}

pub async fn handle_upload_pack<S>(
    state: S,
    mut segments: Vec<String>,
    headers: HeaderMap,
    body: axum::body::Body,
) -> Response
where
    S: GitHttpState,
{
    // normalize and validate segments
    for s in &mut segments {
        if let Some(stripped) = s.strip_suffix(".git") {
            *s = stripped.to_string();
        }
    }
    for s in &segments {
        if let Err(e) = state.validate_slug(s) {
            return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
        }
    }

    // Concurrency limit per request
    let _permit = state.git_semaphore().clone().acquire_owned().await.ok();

    let max = state.git_max_body();
    let bytes = match axum::body::to_bytes(body, max).await {
        Ok(b) => b,
        Err(_) => return (StatusCode::BAD_REQUEST, "invalid request body").into_response(),
    };

    let pkts = match decode_pkt_lines(&bytes) {
        Ok(p) => p,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("pkt parse error: {e}")).into_response();
        }
    };

    // Extract command and ls-refs options
    let mut command: Option<String> = None;
    let mut ls = LsRefsOptions::default();
    for pkt in pkts.iter() {
        if let Pkt::Data(line) = pkt {
            if let Some(rest) = line.strip_prefix(b"command=") {
                command = Some(
                    String::from_utf8_lossy(rest)
                        .trim_end_matches('\n')
                        .to_string(),
                );
                continue;
            }
            if let Some(rest) = line.strip_prefix(b"ref-prefix ") {
                ls.ref_prefix.push(
                    String::from_utf8_lossy(rest)
                        .trim_end_matches('\n')
                        .to_string(),
                );
                continue;
            }
            if line == b"peel\n" {
                ls.peel = true;
                continue;
            }
            if line == b"symrefs\n" {
                ls.symrefs = true;
                continue;
            }
        }
    }

    // Resolve repository directory for subsequent operations
    let repo_dir = match resolve_repo_dir(state.storage(), &segments) {
        Ok(p) => p,
        Err(_) => return (StatusCode::NOT_FOUND, "repo not found").into_response(),
    };
    if !is_public_repo(&repo_dir) {
        return (StatusCode::NOT_FOUND, "repo not found").into_response();
    }

    // Select backend and apply timeout per request
    match (
        std::env::var("COMTRYA_GIT_SMART_V2_BACKEND")
            .ok()
            .as_deref()
            .unwrap_or("rust"),
        command.as_deref(),
    ) {
        ("git", _) => {
            let start = Instant::now();
            let fut = proxy_to_git_upload_pack(&state, &segments, &bytes, &headers);
            let resp = match tokio::time::timeout(
                std::time::Duration::from_millis(state.git_timeout_ms()),
                fut,
            )
            .await
            {
                Ok(r) => r,
                Err(_) => {
                    return (StatusCode::REQUEST_TIMEOUT, "git upload-pack timed out")
                        .into_response();
                }
            };
            counter!("git_http.upload_pack", "backend" => "git").increment(1);
            histogram!("git_http.upload_pack_ms", "backend" => "git")
                .record(start.elapsed().as_millis() as f64);
            resp
        }
        ("rust", Some("ls-refs")) => {
            let start = Instant::now();
            let resp = respond_ls_refs(&state, &segments, &ls).await;
            counter!("git_http.ls_refs", "backend" => "rust").increment(1);
            histogram!("git_http.ls_refs_ms", "backend" => "rust")
                .record(start.elapsed().as_millis() as f64);
            resp
        }
        ("rust", Some("fetch")) => match parse_fetch(&pkts) {
            Ok(req) => {
                tracing::info!(
                    wants = %req.wants().len(),
                    sideband_64k = %req.side_band_64k(),
                    thin_pack = %req.thin_pack(),
                    no_progress = %req.no_progress(),
                    ofs_delta = %req.ofs_delta(),
                    "handling fetch (rust backend)"
                );
                let start = Instant::now();
                let fut = pack::serve_fetch(&repo_dir, &req, &headers, max);
                let resp = match tokio::time::timeout(
                    std::time::Duration::from_millis(state.git_timeout_ms()),
                    fut,
                )
                .await
                {
                    Ok(r) => r,
                    Err(_) => {
                        return (StatusCode::REQUEST_TIMEOUT, "fetch timed out").into_response();
                    }
                };
                counter!("git_http.upload_pack", "backend" => "rust").increment(1);
                histogram!("git_http.upload_pack_ms", "backend" => "rust")
                    .record(start.elapsed().as_millis() as f64);
                resp
            }
            Err(e) => (StatusCode::BAD_REQUEST, format!("bad fetch: {e}")).into_response(),
        },
        _ => (StatusCode::BAD_REQUEST, "unknown command").into_response(),
    }
}

#[derive(Debug, Default, Clone)]
struct LsRefsOptions {
    ref_prefix: Vec<String>,
    peel: bool,
    symrefs: bool,
}

async fn respond_ls_refs<S>(state: &S, segments: &[String], opts: &LsRefsOptions) -> Response
where
    S: GitHttpState,
{
    let repo_dir = match resolve_repo_dir(state.storage(), segments) {
        Ok(p) => p,
        Err(_) => return (StatusCode::NOT_FOUND, "repo not found").into_response(),
    };
    if !is_public_repo(&repo_dir) {
        return (StatusCode::NOT_FOUND, "repo not found").into_response();
    }
    let repo = match gix::open(&repo_dir) {
        Ok(r) => r,
        Err(_) => return (StatusCode::NOT_FOUND, "invalid repository").into_response(),
    };

    let mut body = Vec::with_capacity(2048);

    let mut push_ref_line = |oid: gix::hash::ObjectId,
                             name: &str,
                             symref_target: Option<&str>,
                             peeled: Option<gix::hash::ObjectId>| {
        // <oid> SP <refname> NUL [ "symref-target:" <target> NUL ] [ "peeled:" <oid> NUL ] LF
        let mut line = Vec::with_capacity(64 + name.len());
        line.extend_from_slice(oid.to_string().as_bytes());
        line.push(b' ');
        line.extend_from_slice(name.as_bytes());
        line.push(0); // NUL
        if let Some(t) = symref_target {
            line.extend_from_slice(b"symref-target:");
            line.extend_from_slice(t.as_bytes());
            line.push(0);
        }
        if let Some(p) = peeled {
            line.extend_from_slice(b"peeled:");
            line.extend_from_slice(p.to_string().as_bytes());
            line.push(0);
        }
        line.push(b'\n');
        body.extend_from_slice(&encode_pkt_line(&line));
    };

    // HEAD handling (clients usually ask for ref-prefix HEAD)
    if let Ok(head) = repo.find_reference("HEAD") {
        // Determine the resolved object id for HEAD
        let mut symref_target: Option<String> = None;
        if opts.symrefs {
            if let gix::refs::TargetRef::Symbolic(sym) = head.target() {
                use gix::bstr::ByteSlice;
                if let Ok(name) = std::str::from_utf8(sym.as_bstr().as_bytes()) {
                    symref_target = Some(name.to_string());
                }
            }
        }
        let resolved_id = match head.try_id() {
            Some(idref) => Some(idref.detach()),
            None => head.clone().peel_to_commit().ok().map(|c| c.id().detach()),
        };
        if let Some(oid) = resolved_id {
            let mut include = opts.ref_prefix.is_empty();
            if !include {
                include = opts.ref_prefix.iter().any(|p| "HEAD".starts_with(p));
            }
            if include {
                push_ref_line(oid, "HEAD", symref_target.as_deref(), None);
            }
        }
    }

    if let Ok(iter) = repo.references() {
        if let Ok(mut all) = iter.all() {
            while let Some(Ok(reference)) = all.next() {
                // name as &str
                let name = {
                    use gix::bstr::ByteSlice;
                    let b = reference.name().as_bstr().as_bytes();
                    std::str::from_utf8(b).unwrap_or("")
                };
                if name.is_empty() {
                    continue;
                }

                // filter by ref-prefix if provided
                if !opts.ref_prefix.is_empty()
                    && !opts.ref_prefix.iter().any(|p| name.starts_with(p))
                {
                    continue;
                }

                // Resolve object id and attributes
                let mut symref_target: Option<String> = None;
                let mut peeled_attr: Option<gix::hash::ObjectId> = None;

                // symref: if symbolic and requested, add target
                if opts.symrefs {
                    if let gix::refs::TargetRef::Symbolic(sym) = reference.target() {
                        use gix::bstr::ByteSlice;
                        if let Ok(t) = std::str::from_utf8(sym.as_bstr().as_bytes()) {
                            symref_target = Some(t.to_string());
                        }
                    }
                }

                // obtain object id to advertise: prefer direct target id if available;
                // otherwise, peel symbolic to a commit id for display
                let oid = if let Some(idref) = reference.try_id() {
                    idref.detach()
                } else if let Ok(commit) = reference.clone().peel_to_commit() {
                    commit.id().detach()
                } else {
                    continue;
                };

                // peeled: for annotated tags, include peeled-to target id
                if opts.peel && name.starts_with("refs/tags/") {
                    if let Ok(obj) = repo.find_object(oid) {
                        if obj.kind == gix::objs::Kind::Tag {
                            if let Ok(tag) = gix::objs::TagRef::from_bytes(obj.data.as_ref()) {
                                peeled_attr = Some(tag.target());
                            }
                        }
                    }
                }

                push_ref_line(oid, name, symref_target.as_deref(), peeled_attr);
            }
        }
    }

    body.extend_from_slice(PKT_FLUSH);
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/x-git-upload-pack-result")
        .header(header::CACHE_CONTROL, "no-cache")
        .body(axum::body::Body::from(body))
        .expect("response build")
}

fn respond_fetch_error(msg: &str) -> Response {
    let mut body = Vec::with_capacity(64 + msg.len());
    let err_line = format!("ERR {msg}\n");
    body.extend_from_slice(&encode_pkt_line(err_line.as_bytes()));
    body.extend_from_slice(PKT_FLUSH);
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/x-git-upload-pack-result")
        .header(header::CACHE_CONTROL, "no-cache")
        .body(axum::body::Body::from(body))
        .expect("response build")
}

#[derive(Debug, Default, Clone)]
pub struct FetchRequest {
    object_format: Option<String>,
    wants: Vec<String>,
    want_refs: Vec<String>,
    haves: Vec<String>,
    client_shallows: Vec<String>,
    thin_pack: bool,
    ofs_delta: bool,
    side_band_64k: bool,
    no_progress: bool,
    done: bool,
    deepen: Option<u32>,
    deepen_since: Option<i64>,
    deepen_not: Vec<String>,
    filter: Option<String>,
    server_options: Vec<String>,
}

impl FetchRequest {
    pub fn wants(&self) -> &[String] {
        &self.wants
    }
    pub fn push_want(&mut self, oid: String) {
        self.wants.push(oid);
    }
    pub fn extend_wants<I: IntoIterator<Item = String>>(&mut self, iter: I) {
        self.wants.extend(iter);
    }
    pub fn side_band_64k(&self) -> bool {
        self.side_band_64k
    }
    pub fn has_haves(&self) -> bool {
        !self.haves.is_empty()
    }
    pub fn shallow_requested(&self) -> bool {
        self.deepen.is_some() || self.deepen_since.is_some() || !self.deepen_not.is_empty()
    }
    pub fn filter_requested(&self) -> bool {
        self.filter.is_some()
    }
    pub fn haves(&self) -> &[String] {
        &self.haves
    }
    pub fn no_progress(&self) -> bool {
        self.no_progress
    }
    pub fn thin_pack(&self) -> bool {
        self.thin_pack
    }
    pub fn ofs_delta(&self) -> bool {
        self.ofs_delta
    }
    pub fn want_refs(&self) -> &[String] {
        &self.want_refs
    }
    pub fn client_shallows(&self) -> &[String] {
        &self.client_shallows
    }
    pub fn done(&self) -> bool {
        self.done
    }
    pub fn deepen(&self) -> Option<u32> {
        self.deepen
    }
    pub fn deepen_since(&self) -> Option<i64> {
        self.deepen_since
    }
    pub fn deepen_not(&self) -> &[String] {
        &self.deepen_not
    }
    pub fn filter_blob_none(&self) -> bool {
        match self.filter.as_deref() {
            Some(s) => s.trim() == "blob:none",
            None => false,
        }
    }
    pub fn filter_tree_depth(&self) -> Option<u32> {
        match self.filter.as_deref() {
            Some(s) if s.starts_with("tree:") => s[5..].parse::<u32>().ok(),
            _ => None,
        }
    }
    pub fn filter_blob_limit(&self) -> Option<usize> {
        match self.filter.as_deref() {
            Some(s) if s.starts_with("blob:limit=") => {
                let v = &s[11..];
                // support suffixes k,m
                if let Some(rest) = v.strip_suffix('k') {
                    rest.parse::<usize>().ok().map(|n| n * 1024)
                } else if let Some(rest) = v.strip_suffix('m') {
                    rest.parse::<usize>().ok().map(|n| n * 1024 * 1024)
                } else {
                    v.parse::<usize>().ok()
                }
            }
            _ => None,
        }
    }
}

fn parse_fetch(pkts: &[Pkt]) -> anyhow::Result<FetchRequest> {
    use anyhow::Context;
    let mut req = FetchRequest::default();
    for pkt in pkts {
        let Pkt::Data(line) = pkt else { continue };
        let s = std::str::from_utf8(line)
            .context("utf8")?
            .trim_end_matches('\n');
        if let Some(v) = s.strip_prefix("object-format=") {
            req.object_format = Some(v.to_string());
            continue;
        }
        if let Some(rest) = s.strip_prefix("want ") {
            req.wants.push(rest.to_string());
            continue;
        }
        if let Some(rest) = s.strip_prefix("want-ref ") {
            req.want_refs.push(rest.to_string());
            continue;
        }
        if let Some(rest) = s.strip_prefix("want-refs ") {
            for r in rest.split(' ') {
                if !r.is_empty() {
                    req.want_refs.push(r.to_string());
                }
            }
            continue;
        }
        if let Some(rest) = s.strip_prefix("have ") {
            req.haves.push(rest.to_string());
            continue;
        }
        if let Some(rest) = s.strip_prefix("shallow ") {
            req.client_shallows.push(rest.to_string());
            continue;
        }
        if s == "thin-pack" {
            req.thin_pack = true;
            continue;
        }
        if s == "ofs-delta" {
            req.ofs_delta = true;
            continue;
        }
        if s == "side-band-64k" {
            req.side_band_64k = true;
            continue;
        }
        if s == "no-progress" {
            req.no_progress = true;
            continue;
        }
        if let Some(n) = s.strip_prefix("deepen ") {
            req.deepen = n.parse().ok();
            continue;
        }
        if let Some(ts) = s.strip_prefix("deepen-since ") {
            req.deepen_since = ts.parse().ok();
            continue;
        }
        if let Some(ns) = s.strip_prefix("deepen-not ") {
            req.deepen_not.push(ns.to_string());
            continue;
        }
        if let Some(f) = s.strip_prefix("filter ") {
            req.filter = Some(f.to_string());
            continue;
        }
        if let Some(opt) = s.strip_prefix("server-option ") {
            req.server_options.push(opt.to_string());
            continue;
        }
        if s == "done" {
            req.done = true;
            continue;
        }
    }
    if let Some(fmt) = &req.object_format {
        if fmt != "sha1" {
            anyhow::bail!("unsupported object-format {fmt}");
        }
    }
    if req.wants.is_empty() {
        anyhow::bail!("no wants provided");
    }
    Ok(req)
}

fn respond_fetch_not_implemented(_req: &FetchRequest) -> Response {
    respond_fetch_error("fetch not implemented yet")
}

async fn proxy_to_git_upload_pack<S>(
    state: &S,
    segments: &[String],
    request_body: &[u8],
    headers: &HeaderMap,
) -> Response
where
    S: GitHttpState,
{
    let repo_dir = match resolve_repo_dir(state.storage(), segments) {
        Ok(p) => p,
        Err(_) => return (StatusCode::NOT_FOUND, "repo not found").into_response(),
    };
    if !is_public_repo(&repo_dir) {
        return (StatusCode::NOT_FOUND, "repo not found").into_response();
    }
    let mut cmd = tokio::process::Command::new("git");
    cmd.arg("upload-pack").arg("--stateless-rpc").arg(repo_dir);
    cmd.stdin(std::process::Stdio::piped());
    cmd.stdout(std::process::Stdio::piped());
    // Propagate protocol version to git
    if let Some(v) = headers.get("Git-Protocol").and_then(|v| v.to_str().ok()) {
        cmd.env("GIT_PROTOCOL", v);
    } else {
        cmd.env("GIT_PROTOCOL", "version=2");
    }
    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::BAD_GATEWAY, format!("failed to spawn git: {e}")).into_response();
        }
    };

    if let Some(mut stdin) = child.stdin.take() {
        if let Err(e) = stdin.write_all(request_body).await {
            return (
                StatusCode::BAD_GATEWAY,
                format!("failed to write to git: {e}"),
            )
                .into_response();
        }
    }
    let stdout = match child.stdout.take() {
        Some(o) => o,
        None => return (StatusCode::BAD_GATEWAY, "missing git stdout").into_response(),
    };
    let stream = ReaderStream::new(stdout);
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/x-git-upload-pack-result")
        .body(axum::body::Body::from_stream(stream))
        .expect("response build")
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result as AnyResult;
    use axum::extract::{Path as AxPath, Query as AxQuery, State as AxState};
    use axum::http::HeaderMap as AxHeaderMap;
    use std::path::{Path, PathBuf};
    use std::sync::Arc;
    use tempfile::TempDir;
    use tokio::sync::Semaphore;

    use crate::pkt::encode_pkt_line;
    use crate::repo::RepositoryProvider;

    #[derive(Clone)]
    struct TestStorage {
        root: PathBuf,
    }

    impl RepositoryProvider for TestStorage {
        fn ensure_local_repository(&self, segments: &[String]) -> anyhow::Result<PathBuf> {
            let mut path = self.root.clone();
            for segment in segments {
                path.push(segment);
            }
            if path.is_dir() {
                Ok(path)
            } else {
                Err(anyhow::anyhow!("repository directory not found"))
            }
        }
    }

    #[derive(Clone)]
    struct TestState {
        storage: TestStorage,
        max_body: usize,
        timeout_ms: u64,
        semaphore: Arc<Semaphore>,
    }

    impl GitHttpState for TestState {
        type Storage = TestStorage;

        fn storage(&self) -> &Self::Storage {
            &self.storage
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
            validate_slug(slug)
        }
    }

    fn validate_slug(slug: &str) -> anyhow::Result<()> {
        let is_valid = !slug.is_empty()
            && !slug.starts_with('-')
            && !slug.ends_with('-')
            && !slug.contains("--")
            && slug
                .chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');

        if is_valid {
            Ok(())
        } else {
            Err(anyhow::anyhow!("slug must be lowercase kebab-case"))
        }
    }

    async fn mk_app_state() -> AnyResult<(TestState, TempDir)> {
        let local_dir = TempDir::new()?;
        let state = TestState {
            storage: TestStorage {
                root: local_dir.path().to_path_buf(),
            },
            max_body: 64 * 1024 * 1024,
            timeout_ms: 60_000,
            semaphore: Arc::new(Semaphore::new(64)),
        };
        Ok((state, local_dir))
    }

    async fn init_bare_repo(path: &Path) {
        std::fs::create_dir_all(path).ok();
        let _ = std::process::Command::new("git")
            .arg("init")
            .arg("--bare")
            .arg(path)
            .status();
    }

    async fn seed_main_branch(bare: &Path) {
        let tmp = TempDir::new().unwrap();
        let work = tmp.path();
        let _ = std::process::Command::new("git")
            .current_dir(work)
            .arg("init")
            .status();
        std::fs::write(work.join("README.md"), b"hello\n").ok();
        let _ = std::process::Command::new("git")
            .current_dir(work)
            .args(["add", "README.md"])
            .status();
        let _ = std::process::Command::new("git")
            .current_dir(work)
            .args([
                "-c",
                "user.email=t@e",
                "-c",
                "user.name=t",
                "-c",
                "commit.gpgsign=false",
                "-c",
                "tag.gpgsign=false",
                "commit",
                "--no-gpg-sign",
                "-m",
                "init",
            ])
            .status();
        let _ = std::process::Command::new("git")
            .current_dir(work)
            .args(["branch", "-M", "main"])
            .status();
        let _ = std::process::Command::new("git")
            .current_dir(work)
            .args(["remote", "add", "origin", &bare.to_string_lossy()])
            .status();
        let _ = std::process::Command::new("git")
            .current_dir(work)
            .args(["push", "origin", "main"])
            .status();
    }

    #[test]
    fn parse_minimal_fetch() {
        let mut buf = Vec::new();
        buf.extend_from_slice(&encode_pkt_line(b"command=fetch\n"));
        buf.extend_from_slice(&encode_pkt_line(b"object-format=sha1\n"));
        buf.extend_from_slice(&encode_pkt_line(
            b"want 0123456789abcdef0123456789abcdef01234567\n",
        ));
        buf.extend_from_slice(PKT_FLUSH);
        let pkts = decode_pkt_lines(&buf).unwrap();
        let req = parse_fetch(&pkts).unwrap();
        assert_eq!(req.wants.len(), 1);
        assert_eq!(req.object_format.as_deref(), Some("sha1"));
    }

    #[test]
    fn parse_rejects_non_sha1() {
        let mut buf = Vec::new();
        buf.extend_from_slice(&encode_pkt_line(b"command=fetch\n"));
        buf.extend_from_slice(&encode_pkt_line(b"object-format=sha256\n"));
        buf.extend_from_slice(&encode_pkt_line(
            b"want 0123456789abcdef0123456789abcdef01234567\n",
        ));
        buf.extend_from_slice(PKT_FLUSH);
        let pkts = decode_pkt_lines(&buf).unwrap();
        assert!(parse_fetch(&pkts).is_err());
    }

    #[test]
    fn parse_fetch_extras() {
        let mut buf = Vec::new();
        buf.extend_from_slice(&encode_pkt_line(b"command=fetch\n"));
        buf.extend_from_slice(&encode_pkt_line(b"object-format=sha1\n"));
        buf.extend_from_slice(&encode_pkt_line(b"thin-pack\n"));
        buf.extend_from_slice(&encode_pkt_line(b"ofs-delta\n"));
        buf.extend_from_slice(&encode_pkt_line(b"side-band-64k\n"));
        buf.extend_from_slice(&encode_pkt_line(b"no-progress\n"));
        buf.extend_from_slice(&encode_pkt_line(
            b"want 0123456789abcdef0123456789abcdef01234567\n",
        ));
        buf.extend_from_slice(&encode_pkt_line(b"want-ref refs/heads/main\n"));
        buf.extend_from_slice(&encode_pkt_line(b"want-refs refs/tags/v1 refs/tags/v2\n"));
        buf.extend_from_slice(&encode_pkt_line(
            b"have 89abcdef0123456789abcdef0123456789abcdef\n",
        ));
        buf.extend_from_slice(&encode_pkt_line(b"server-option foo=bar\n"));
        buf.extend_from_slice(&encode_pkt_line(b"done\n"));
        buf.extend_from_slice(PKT_FLUSH);
        let pkts = decode_pkt_lines(&buf).unwrap();
        let req = parse_fetch(&pkts).unwrap();
        assert!(req.thin_pack);
        assert!(req.ofs_delta);
        assert!(req.side_band_64k);
        assert!(req.no_progress);
        assert_eq!(req.wants.len(), 1);
        assert_eq!(req.want_refs.len(), 3);
        assert_eq!(req.haves.len(), 1);
        assert!(req.done);
        assert_eq!(req.server_options.len(), 1);
    }

    #[test]
    fn advertise_v2_shape() {
        let mut body = Vec::new();
        body.extend_from_slice(&encode_pkt_line(b"version 2\n"));
        let adv = vec![
            encode_pkt_line(b"agent=comtrya/x.y.z\n"),
            encode_pkt_line(b"session-id=abc\n"),
            encode_pkt_line(b"object-format=sha1\n"),
            encode_pkt_line(b"server-option\n"),
            encode_pkt_line(b"ls-refs\n"),
            encode_pkt_line(b"fetch=shallow\n"),
            encode_pkt_line(b"fetch=filter\n"),
            encode_pkt_line(b"fetch=ref-in-want\n"),
            encode_pkt_line(b"fetch=deepen-since\n"),
            encode_pkt_line(b"fetch=deepen-not\n"),
        ];
        for a in adv {
            body.extend_from_slice(&a);
        }
        body.extend_from_slice(PKT_FLUSH);
        let pkts = decode_pkt_lines(&body).unwrap();
        let mut s = String::new();
        for p in pkts {
            if let Pkt::Data(d) = p {
                s.push_str(std::str::from_utf8(&d).unwrap());
            }
        }
        assert!(s.contains("version 2") || s.contains("ls-refs"));
        assert!(s.contains("object-format=sha1"));
        assert!(s.contains("fetch=filter"));
    }

    #[tokio::test]
    async fn info_refs_requires_service_param() {
        let (state, _local_dir) = mk_app_state().await.unwrap();
        let resp = info_refs_root(
            AxState(state),
            AxPath("alpha".to_string()),
            AxQuery(ServiceQuery {
                service: Some("not-upload-pack".to_string()),
            }),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn info_refs_gated_and_content_type() {
        unsafe {
            std::env::set_var("COMTRYA_GIT_SMART_V2_ADVERTISE", "rust");
        }
        let (state, local_dir) = mk_app_state().await.unwrap();
        let repo = local_dir.path().join("alpha.git");
        init_bare_repo(&repo).await;
        let resp_404 = info_refs_root(
            AxState(state.clone()),
            AxPath("alpha".to_string()),
            AxQuery(ServiceQuery {
                service: Some("git-upload-pack".to_string()),
            }),
        )
        .await;
        assert_eq!(resp_404.status(), StatusCode::NOT_FOUND);
        std::fs::write(repo.join("git-daemon-export-ok"), b"").unwrap();
        let resp = info_refs_root(
            AxState(state),
            AxPath("alpha".to_string()),
            AxQuery(ServiceQuery {
                service: Some("git-upload-pack".to_string()),
            }),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::OK);
        assert_eq!(
            resp.headers().get(header::CONTENT_TYPE).unwrap(),
            "application/x-git-upload-pack-advertisement"
        );
        let bytes = axum::body::to_bytes(resp.into_body(), 16 << 20)
            .await
            .unwrap();
        assert!(std::str::from_utf8(&bytes).unwrap().contains("version 2"));
    }

    #[tokio::test]
    async fn receive_pack_is_forbidden() {
        let resp = receive_pack_blocked().await.into_response();
        assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn dispatch_keeps_receive_pack_disabled() {
        let (state, _local_dir) = mk_app_state().await.unwrap();
        let resp = dispatch(
            state,
            vec!["alpha".to_string()],
            "git-receive-pack",
            None,
            AxHeaderMap::new(),
            axum::body::Body::empty(),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn dispatch_does_not_advertise_receive_pack() {
        let (state, _local_dir) = mk_app_state().await.unwrap();
        let resp = dispatch(
            state,
            vec!["alpha".to_string()],
            "info/refs",
            Some("git-receive-pack"),
            AxHeaderMap::new(),
            axum::body::Body::empty(),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn parse_receive_pack_command_set_groundwork() {
        let new_oid = "1111111111111111111111111111111111111111";
        let mut req = Vec::new();
        req.extend_from_slice(&encode_pkt_line(
            format!(
                "{RECEIVE_ZERO_OID} {new_oid} refs/heads/main\0report-status report-status-v2 object-format=sha1 agent=git/2.53.0\n"
            )
            .as_bytes(),
        ));
        req.extend_from_slice(PKT_FLUSH);
        req.extend_from_slice(b"PACK...");

        let parsed = parse_receive_pack_command_set(&req).unwrap();
        assert_eq!(parsed.commands.len(), 1);
        assert_eq!(parsed.commands[0].old_oid, RECEIVE_ZERO_OID);
        assert_eq!(parsed.commands[0].new_oid, new_oid);
        assert_eq!(parsed.commands[0].ref_name, "refs/heads/main");
        assert!(parsed.capabilities.report_status);
        assert!(parsed.capabilities.report_status_v2);
        assert_eq!(parsed.capabilities.object_format.as_deref(), Some("sha1"));
        assert_eq!(parsed.capabilities.agent.as_deref(), Some("git/2.53.0"));
        assert_eq!(parsed.pack_bytes, b"PACK...".len());
    }

    #[test]
    fn parse_receive_pack_rejects_unsupported_object_format() {
        let mut req = Vec::new();
        req.extend_from_slice(&encode_pkt_line(
            format!(
                "{RECEIVE_ZERO_OID} 1111111111111111111111111111111111111111 refs/heads/main\0report-status object-format=sha256\n"
            )
            .as_bytes(),
        ));
        req.extend_from_slice(PKT_FLUSH);
        assert!(parse_receive_pack_command_set(&req).is_err());
    }

    #[test]
    fn parse_receive_pack_rejects_invalid_ref_names() {
        let mut req = Vec::new();
        req.extend_from_slice(&encode_pkt_line(
            format!(
                "{RECEIVE_ZERO_OID} 1111111111111111111111111111111111111111 refs/heads/../main\0report-status\n"
            )
            .as_bytes(),
        ));
        req.extend_from_slice(PKT_FLUSH);
        assert!(parse_receive_pack_command_set(&req).is_err());
    }

    #[tokio::test]
    async fn ls_refs_supports_ref_prefix_peel_and_symrefs() {
        unsafe {
            std::env::set_var("COMTRYA_GIT_SMART_V2_BACKEND", "rust");
        }
        let (state, local_dir) = mk_app_state().await.unwrap();
        let repo = local_dir.path().join("alpha.git");
        init_bare_repo(&repo).await;
        std::fs::write(repo.join("git-daemon-export-ok"), b"").unwrap();
        seed_main_branch(&repo).await;

        let mut req = Vec::new();
        req.extend_from_slice(&encode_pkt_line(b"command=ls-refs\n"));
        req.extend_from_slice(&encode_pkt_line(b"ref-prefix refs/heads\n"));
        req.extend_from_slice(&encode_pkt_line(b"peel\n"));
        req.extend_from_slice(&encode_pkt_line(b"symrefs\n"));
        req.extend_from_slice(PKT_FLUSH);

        let headers = AxHeaderMap::new();
        let resp = upload_pack_root(
            AxState(state),
            AxPath("alpha".to_string()),
            headers,
            axum::body::Body::from(req),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::OK);
        assert_eq!(
            resp.headers().get(header::CONTENT_TYPE).unwrap(),
            "application/x-git-upload-pack-result"
        );
        let bytes = axum::body::to_bytes(resp.into_body(), 16 << 20)
            .await
            .unwrap();
        let s = std::str::from_utf8(&bytes).unwrap();
        assert!(s.contains("refs/heads/main"));
    }

    #[tokio::test]
    async fn upload_pack_unknown_command_400() {
        unsafe {
            std::env::set_var("COMTRYA_GIT_SMART_V2_BACKEND", "rust");
        }
        let (state, local_dir) = mk_app_state().await.unwrap();
        let repo = local_dir.path().join("alpha.git");
        init_bare_repo(&repo).await;
        std::fs::write(repo.join("git-daemon-export-ok"), b"").unwrap();

        let mut req = Vec::new();
        req.extend_from_slice(&encode_pkt_line(b"command=unknown\n"));
        req.extend_from_slice(PKT_FLUSH);
        let headers = AxHeaderMap::new();
        let resp = upload_pack_root(
            AxState(state),
            AxPath("alpha".to_string()),
            headers,
            axum::body::Body::from(req),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn fetch_with_bad_object_format_is_400() {
        unsafe {
            std::env::set_var("COMTRYA_GIT_SMART_V2_BACKEND", "rust");
        }
        let (state, local_dir) = mk_app_state().await.unwrap();
        let repo = local_dir.path().join("alpha.git");
        init_bare_repo(&repo).await;
        std::fs::write(repo.join("git-daemon-export-ok"), b"").unwrap();

        let mut req = Vec::new();
        req.extend_from_slice(&encode_pkt_line(b"command=fetch\n"));
        req.extend_from_slice(&encode_pkt_line(b"object-format=sha256\n"));
        req.extend_from_slice(&encode_pkt_line(
            b"want 0123456789abcdef0123456789abcdef01234567\n",
        ));
        req.extend_from_slice(PKT_FLUSH);
        let headers = AxHeaderMap::new();
        let resp = upload_pack_root(
            AxState(state),
            AxPath("alpha".to_string()),
            headers,
            axum::body::Body::from(req),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }
}
