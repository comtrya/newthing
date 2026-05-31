//! Git Smart HTTP receive-pack (push) handler.
//!
//! This implements the server side of `git push` over the v2 smart-HTTP
//! transport: it parses the client's ref-update command list, ingests the
//! trailing packfile into the repository object store, validates object
//! connectivity, enforces per-ref preconditions (create / compare-and-swap /
//! fast-forward / delete), applies all accepted updates atomically through a
//! single `gix` reference transaction, and replies with `report-status`
//! (or `report-status-v2`).

use std::path::Path;
use std::sync::atomic::AtomicBool;

use axum::{
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
};

use crate::pkt::{PKT_FLUSH, encode_pkt_line};
use crate::repo::resolve_repo_dir;
use crate::{GitHttpState, ZERO_OID};

/// The 40-character all-zero object id used to signal "no object" in
/// receive-pack ref-update commands (creates use it as the old oid, deletes as
/// the new oid).
pub(crate) const RECEIVE_ZERO_OID: &str = ZERO_OID;

/// A single parsed ref-update command from a receive-pack request.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ReceivePackCommand {
    pub(crate) old_oid: String,
    pub(crate) new_oid: String,
    pub(crate) ref_name: String,
    /// Whether the client sent a force (`+`) flag on this command.
    /// When true, non-fast-forward updates are allowed (closes #125).
    pub(crate) force: bool,
}

/// The full set of ref-update commands plus the negotiated capabilities and
/// the byte length of the trailing packfile section.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ReceivePackCommandSet {
    pub(crate) commands: Vec<ReceivePackCommand>,
    pub(crate) capabilities: ReceivePackCapabilities,
    pub(crate) pack_bytes: usize,
}

/// Capabilities advertised by the client on the first command line.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct ReceivePackCapabilities {
    pub(crate) report_status: bool,
    pub(crate) report_status_v2: bool,
    pub(crate) object_format: Option<String>,
    pub(crate) agent: Option<String>,
}

/// Parse the pkt-line command list of a receive-pack request.
///
/// Parsing stops at the first flush packet (`0000`); the trailing raw packfile
/// is not consumed, only measured (`pack_bytes`).
pub(crate) fn parse_receive_pack_command_set(
    bytes: &[u8],
) -> anyhow::Result<ReceivePackCommandSet> {
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

fn parse_receive_pack_command(data: &[u8]) -> anyhow::Result<ReceivePackCommand> {
    let line = std::str::from_utf8(data)?.trim_end_matches('\n');
    let mut parts = line.split(' ');
    let old_oid = parts.next().unwrap_or_default();
    let new_oid = parts.next().unwrap_or_default();
    let ref_raw = parts.next().unwrap_or_default();
    // A leading `+` on the ref name is the per-command force flag (closes #125).
    // git-push emits `old new +refs/heads/main` for `git push --force-with-lease`
    // and `git push -f`. Strip the flag before validation and ref storage.
    let (force, ref_name) = if let Some(stripped) = ref_raw.strip_prefix('+') {
        (true, stripped)
    } else {
        (false, ref_raw)
    };
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
        force,
    })
}

pub(crate) fn receive_pack_is_sha1_hex(value: &str) -> bool {
    value.len() == 40 && value.bytes().all(|b| b.is_ascii_hexdigit())
}

pub(crate) fn validate_receive_pack_ref(ref_name: &str) -> anyhow::Result<()> {
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

/// The classification of a single ref-update command independent of any
/// repository state.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CommandKind {
    Create,
    Delete,
    Update,
}

/// Classify a command by its old/new oids.
pub(crate) fn classify_command(command: &ReceivePackCommand) -> CommandKind {
    let old_zero = command.old_oid == RECEIVE_ZERO_OID;
    let new_zero = command.new_oid == RECEIVE_ZERO_OID;
    match (old_zero, new_zero) {
        (true, _) => CommandKind::Create,
        (false, true) => CommandKind::Delete,
        (false, false) => CommandKind::Update,
    }
}

/// The observed state of a ref in the repository at the time the precondition
/// is evaluated.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum RefState {
    /// The ref does not currently exist.
    Absent,
    /// The ref currently points at this oid (hex).
    Present(String),
}

/// The decision for a single command after evaluating its precondition against
/// the observed ref state and (for updates) the fast-forward relationship.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum CommandDecision {
    /// The update is accepted and should be staged into the ref transaction.
    Accept,
    /// The update is rejected; carries the `report-status` reason string.
    Reject(String),
}

/// Pure precondition decision for a single command.
///
/// `is_fast_forward` is only consulted for non-forced updates; pass whatever is
/// convenient (e.g. `false`) for creates and deletes. `force` reserves the
/// fast-forward override that a future `+`-prefixed / per-command force flag
/// will wire in; today no force flag is parsed, so callers pass `false`.
pub(crate) fn decide_command(
    command: &ReceivePackCommand,
    state: &RefState,
    is_fast_forward: bool,
    force: bool,
) -> CommandDecision {
    match classify_command(command) {
        CommandKind::Create => match state {
            RefState::Absent => CommandDecision::Accept,
            RefState::Present(_) => CommandDecision::Reject("reference already exists".to_string()),
        },
        CommandKind::Delete => match state {
            RefState::Absent => CommandDecision::Reject("deletion of non-existent ref".to_string()),
            RefState::Present(current) if *current == command.old_oid => CommandDecision::Accept,
            RefState::Present(_) => CommandDecision::Reject(
                "stale info: ref does not match expected old value".to_string(),
            ),
        },
        CommandKind::Update => match state {
            RefState::Absent => CommandDecision::Reject("ref does not exist".to_string()),
            RefState::Present(current) if *current != command.old_oid => CommandDecision::Reject(
                "stale info: ref does not match expected old value".to_string(),
            ),
            RefState::Present(_) => {
                if force || is_fast_forward {
                    CommandDecision::Accept
                } else {
                    CommandDecision::Reject("non-fast-forward".to_string())
                }
            }
        },
    }
}

/// A command paired with its decision, used to build both the ref transaction
/// and the report-status reply.
struct EvaluatedCommand {
    command: ReceivePackCommand,
    decision: CommandDecision,
}

/// POST /.../git-receive-pack — accept a push and apply ref updates.
pub(crate) async fn handle_receive_pack<S>(
    state: S,
    mut segments: Vec<String>,
    _headers: HeaderMap,
    body: axum::body::Body,
) -> Response
where
    S: GitHttpState,
{
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

    let _permit = state.git_semaphore().clone().acquire_owned().await.ok();

    let max = state.git_max_body();
    let bytes = match axum::body::to_bytes(body, max).await {
        Ok(b) => b,
        Err(_) => {
            return (StatusCode::PAYLOAD_TOO_LARGE, "request body too large").into_response();
        }
    };

    let repo_dir = match resolve_repo_dir(state.storage(), &segments) {
        Ok(p) => p,
        Err(_) => return (StatusCode::NOT_FOUND, "repo not found").into_response(),
    };

    match receive_pack(&repo_dir, &bytes) {
        Ok((body, applied)) => {
            // Emit ref-update events after the response is fully built so
            // the push client doesn't wait for event fan-out (#125).
            if !applied.is_empty() {
                state.on_push_complete(&segments, &applied);
            }
            Response::builder()
                .status(StatusCode::OK)
                .header(
                    header::CONTENT_TYPE,
                    "application/x-git-receive-pack-result",
                )
                .header(header::CACHE_CONTROL, "no-cache")
                .body(axum::body::Body::from(body))
                .expect("response build")
        }
        Err(ReceiveError::Protocol(status, msg)) => (status, msg).into_response(),
    }
}

/// Protocol-level failure that maps to an HTTP error (as opposed to a
/// per-ref rejection, which is reported in-band).
#[derive(Debug)]
enum ReceiveError {
    Protocol(StatusCode, String),
}

fn protocol(status: StatusCode, msg: impl Into<String>) -> ReceiveError {
    ReceiveError::Protocol(status, msg.into())
}

/// Core push handling: parse, ingest, validate, apply, report. Returns the raw
/// `report-status` body and the list of applied ref updates on success, or a
/// protocol error for HTTP-level failures. Per-ref rejections are encoded in
/// the returned body; `applied` only contains successfully updated refs.
fn receive_pack(
    repo_dir: &Path,
    bytes: &[u8],
) -> Result<(Vec<u8>, Vec<crate::state::AppliedRefUpdate>), ReceiveError> {
    let command_section = command_section_len(bytes)
        .ok_or_else(|| protocol(StatusCode::BAD_REQUEST, "missing pkt-line flush"))?;
    let pack = &bytes[command_section..];

    let parsed = parse_receive_pack_command_set(&bytes[..command_section])
        .map_err(|e| protocol(StatusCode::BAD_REQUEST, format!("bad receive-pack: {e}")))?;

    if let Some(fmt) = &parsed.capabilities.object_format
        && fmt != "sha1"
    {
        return Err(protocol(
            StatusCode::BAD_REQUEST,
            format!("unsupported object-format {fmt}"),
        ));
    }
    if parsed.commands.is_empty() {
        return Err(protocol(StatusCode::BAD_REQUEST, "no ref update commands"));
    }

    let report_v2 = parsed.capabilities.report_status_v2;

    // A pack is required whenever any command introduces a new object id.
    let needs_pack = parsed
        .commands
        .iter()
        .any(|c| !matches!(classify_command(c), CommandKind::Delete));

    if needs_pack && !pack_present(pack) {
        return Ok((
            report_status(
                ReportOutcome::UnpackError("missing packfile".to_string()),
                &parsed.commands,
                report_v2,
            ),
            vec![],
        ));
    }

    // Ingest the pack (if any) before opening the fresh repo so new objects
    // are visible for connectivity and ref-target validation.
    let keep_path = if needs_pack {
        match ingest_pack(repo_dir, pack) {
            Ok(keep) => keep,
            Err(e) => {
                return Ok((
                    report_status(
                        ReportOutcome::UnpackError(format!("index-pack failed: {e}")),
                        &parsed.commands,
                        report_v2,
                    ),
                    vec![],
                ));
            }
        }
    } else {
        None
    };

    // Open a fresh repository so the just-written pack is visible.
    let repo = match gix::open(repo_dir) {
        Ok(r) => r,
        Err(e) => {
            cleanup_keep(keep_path.as_deref());
            return Err(protocol(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("failed to open repository: {e}"),
            ));
        }
    };

    // Connectivity check for every non-null new oid. Share a single
    // visited-set across all commands in this push so each object is
    // validated at most once even when commands push overlapping
    // histories (issue: connectivity check re-walks full history and
    // re-validates every tree on every push — DoS surface).
    let mut visited: std::collections::HashSet<gix::hash::ObjectId> =
        std::collections::HashSet::new();
    for command in &parsed.commands {
        if command.new_oid == RECEIVE_ZERO_OID {
            continue;
        }
        let oid = match gix::hash::ObjectId::from_hex(command.new_oid.as_bytes()) {
            Ok(o) => o,
            Err(_) => {
                cleanup_keep(keep_path.as_deref());
                return Ok((
                    report_status(
                        ReportOutcome::UnpackError("invalid object id".to_string()),
                        &parsed.commands,
                        report_v2,
                    ),
                    vec![],
                ));
            }
        };
        if let Err(e) = verify_connectivity(&repo, oid, &mut visited) {
            cleanup_keep(keep_path.as_deref());
            return Ok((
                report_status(
                    ReportOutcome::UnpackError(format!("missing necessary objects: {e}")),
                    &parsed.commands,
                    report_v2,
                ),
                vec![],
            ));
        }
    }

    // Evaluate every command's precondition.
    let evaluated: Vec<EvaluatedCommand> = parsed
        .commands
        .into_iter()
        .map(|command| {
            let decision = evaluate_against_repo(&repo, &command);
            EvaluatedCommand { command, decision }
        })
        .collect();

    // Apply accepted updates atomically.
    let txn_failed = apply_ref_updates(&repo, &evaluated);

    cleanup_keep(keep_path.as_deref());

    let mut per_ref = Vec::with_capacity(evaluated.len());
    let mut applied: Vec<crate::state::AppliedRefUpdate> = Vec::new();
    for ev in &evaluated {
        let status = match (&ev.decision, txn_failed) {
            (CommandDecision::Accept, false) => {
                applied.push(crate::state::AppliedRefUpdate {
                    ref_name: ev.command.ref_name.clone(),
                    old_oid: ev.command.old_oid.clone(),
                    new_oid: ev.command.new_oid.clone(),
                });
                RefStatus::Ok
            }
            (CommandDecision::Accept, true) => {
                RefStatus::Ng("atomic transaction failed".to_string())
            }
            (CommandDecision::Reject(reason), _) => RefStatus::Ng(reason.clone()),
        };
        per_ref.push((ev.command.ref_name.clone(), status));
    }

    Ok((
        report_status_lines(ReportOutcome::Ok, &per_ref, report_v2),
        applied,
    ))
}

/// Evaluate a command against the live repository, reading the current ref
/// state and computing the fast-forward relationship for updates.
fn evaluate_against_repo(repo: &gix::Repository, command: &ReceivePackCommand) -> CommandDecision {
    let state = match repo.find_reference(command.ref_name.as_str()) {
        Ok(reference) => match reference.try_id() {
            Some(id) => RefState::Present(id.detach().to_string()),
            None => RefState::Present(String::new()),
        },
        Err(_) => RefState::Absent,
    };

    let is_ff = if matches!(classify_command(command), CommandKind::Update) {
        is_fast_forward(repo, &command.old_oid, &command.new_oid)
    } else {
        false
    };

    // Pass the per-command force flag to decide_command so non-fast-forward
    // updates are allowed when the client sent `+refs/heads/branch`.
    decide_command(command, &state, is_ff, command.force)
}

/// Returns true if `old` is an ancestor of `new` (i.e. updating `old -> new` is
/// a fast-forward).
fn is_fast_forward(repo: &gix::Repository, old: &str, new: &str) -> bool {
    let (old_oid, new_oid) = match (
        gix::hash::ObjectId::from_hex(old.as_bytes()),
        gix::hash::ObjectId::from_hex(new.as_bytes()),
    ) {
        (Ok(o), Ok(n)) => (o, n),
        _ => return false,
    };
    match repo.merge_base(old_oid, new_oid) {
        Ok(base) => base.detach() == old_oid,
        Err(_) => false,
    }
}

/// Apply the accepted ref updates in a single atomic transaction.
/// Returns `true` if the transaction failed (so all accepted refs are reported
/// as `ng`).
fn apply_ref_updates(repo: &gix::Repository, evaluated: &[EvaluatedCommand]) -> bool {
    use gix::refs::transaction::{Change, LogChange, PreviousValue, RefEdit, RefLog};
    use gix::refs::{FullName, Target};

    let mut edits = Vec::new();
    for ev in evaluated {
        if !matches!(ev.decision, CommandDecision::Accept) {
            continue;
        }
        let name: FullName = match ev.command.ref_name.as_str().try_into() {
            Ok(n) => n,
            Err(_) => return true,
        };
        let change = match classify_command(&ev.command) {
            CommandKind::Create => {
                let new = match gix::hash::ObjectId::from_hex(ev.command.new_oid.as_bytes()) {
                    Ok(o) => o,
                    Err(_) => return true,
                };
                Change::Update {
                    log: LogChange {
                        mode: RefLog::AndReference,
                        force_create_reflog: false,
                        message: "push: create".into(),
                    },
                    expected: PreviousValue::MustNotExist,
                    new: Target::Object(new),
                }
            }
            CommandKind::Update => {
                let old = match gix::hash::ObjectId::from_hex(ev.command.old_oid.as_bytes()) {
                    Ok(o) => o,
                    Err(_) => return true,
                };
                let new = match gix::hash::ObjectId::from_hex(ev.command.new_oid.as_bytes()) {
                    Ok(o) => o,
                    Err(_) => return true,
                };
                Change::Update {
                    log: LogChange {
                        mode: RefLog::AndReference,
                        force_create_reflog: false,
                        message: "push: update".into(),
                    },
                    expected: PreviousValue::MustExistAndMatch(Target::Object(old)),
                    new: Target::Object(new),
                }
            }
            CommandKind::Delete => {
                let old = match gix::hash::ObjectId::from_hex(ev.command.old_oid.as_bytes()) {
                    Ok(o) => o,
                    Err(_) => return true,
                };
                Change::Delete {
                    expected: PreviousValue::MustExistAndMatch(Target::Object(old)),
                    log: RefLog::AndReference,
                }
            }
        };
        edits.push(RefEdit {
            change,
            name,
            deref: false,
        });
    }

    if edits.is_empty() {
        // No accepted updates to apply; not a failure.
        return false;
    }

    // Use a synthetic committer so the reflog can be written even when the bare
    // repository has no user identity configured.
    let committer = gix::actor::SignatureRef {
        name: "comtrya".into(),
        email: "git@comtrya".into(),
        time: "0 +0000",
    };
    repo.edit_references_as(edits, Some(committer)).is_err()
}

/// Verify that every object reachable from `tip` (commits, their trees, and the
/// blobs/subtrees within) is present in the object database. `visited` is
/// threaded across all commands in a single push so each object is checked
/// at most once — without it, `verify_tree` re-recursed every tree of every
/// reachable commit on every push, an O(commits × trees) DoS surface where
/// a malicious push of a long-history repo could pin the server.
fn verify_connectivity(
    repo: &gix::Repository,
    tip: gix::hash::ObjectId,
    visited: &mut std::collections::HashSet<gix::hash::ObjectId>,
) -> anyhow::Result<()> {
    if !visited.insert(tip) {
        return Ok(());
    }
    if !repo.has_object(tip) {
        anyhow::bail!("tip object {tip} is missing");
    }
    let walk = repo.rev_walk([tip]).all()?;
    for info in walk {
        let info = info?;
        if !visited.insert(info.id) {
            // Commit already validated by an earlier command's walk —
            // its ancestors and tree are by induction already known-good.
            continue;
        }
        let commit = repo.find_object(info.id)?.try_into_commit()?;
        let tree_id = commit.tree_id()?;
        verify_tree(repo, tree_id.detach(), visited)?;
    }
    Ok(())
}

/// Recursively verify that a tree and all objects it references exist.
/// Records every visited tree/blob oid in `visited` so a tree referenced
/// from multiple commits (the common case — most files don't change
/// between commits) is descended exactly once across the whole push.
fn verify_tree(
    repo: &gix::Repository,
    tree_id: gix::hash::ObjectId,
    visited: &mut std::collections::HashSet<gix::hash::ObjectId>,
) -> anyhow::Result<()> {
    if !visited.insert(tree_id) {
        return Ok(());
    }
    if !repo.has_object(tree_id) {
        anyhow::bail!("tree object {tree_id} is missing");
    }
    let tree = repo.find_object(tree_id)?.try_into_tree()?;
    for entry in tree.iter() {
        let entry = entry?;
        let oid = entry.oid().to_owned();
        if entry.mode().is_tree() {
            verify_tree(repo, oid, visited)?;
        } else if visited.insert(oid) && !repo.has_object(oid) {
            anyhow::bail!("object {oid} is missing");
        }
    }
    Ok(())
}

/// Ingest a packfile into the repository's `objects/pack` directory. Returns
/// the `.keep` path that pins the new pack against garbage collection; the
/// caller must remove it once the ref transaction has committed.
fn ingest_pack(repo_dir: &Path, pack: &[u8]) -> anyhow::Result<Option<std::path::PathBuf>> {
    let pack_dir = repo_dir.join("objects").join("pack");
    std::fs::create_dir_all(&pack_dir)?;

    let repo = gix::open(repo_dir)?;
    let mut reader = std::io::BufReader::new(pack);
    let should_interrupt = AtomicBool::new(false);
    let mut progress = gix::progress::Discard;

    let options = gix::odb::pack::bundle::write::Options {
        thread_limit: None,
        iteration_mode: gix::odb::pack::data::input::Mode::Verify,
        index_version: Default::default(),
        object_hash: gix::hash::Kind::Sha1,
    };

    let outcome = gix::odb::pack::Bundle::write_to_directory(
        &mut reader,
        Some(pack_dir.as_path()),
        &mut progress,
        &should_interrupt,
        Some(repo.objects.clone()),
        options,
    )?;

    Ok(outcome.keep_path)
}

/// Remove the `.keep` file written by pack ingest, if present.
fn cleanup_keep(keep_path: Option<&Path>) {
    if let Some(path) = keep_path {
        let _ = std::fs::remove_file(path);
    }
}

/// Find the byte offset just past the first flush packet (`0000`) in the
/// command section. Returns `None` if no flush is found.
fn command_section_len(bytes: &[u8]) -> Option<usize> {
    let mut offset = 0usize;
    loop {
        if offset + 4 > bytes.len() {
            return None;
        }
        let len = usize::from_str_radix(std::str::from_utf8(&bytes[offset..offset + 4]).ok()?, 16)
            .ok()?;
        offset += 4;
        if len == 0 {
            return Some(offset);
        }
        if len <= 4 {
            return None;
        }
        let data_len = len - 4;
        if offset + data_len > bytes.len() {
            return None;
        }
        offset += data_len;
    }
}

/// Whether the trailing bytes contain an actual packfile (`PACK` signature).
fn pack_present(pack: &[u8]) -> bool {
    pack.len() >= 4 && &pack[..4] == b"PACK"
}

/// The unpack-phase outcome reported on the first report-status line.
enum ReportOutcome {
    Ok,
    UnpackError(String),
}

/// Per-ref status in a report-status reply.
enum RefStatus {
    Ok,
    Ng(String),
}

/// Build a `report-status` body where every command shares the same status,
/// used for whole-request failures (e.g. unpack error).
fn report_status(outcome: ReportOutcome, commands: &[ReceivePackCommand], v2: bool) -> Vec<u8> {
    let reason = match &outcome {
        ReportOutcome::Ok => None,
        ReportOutcome::UnpackError(_) => Some("unpacker error"),
    };
    let per_ref: Vec<(String, RefStatus)> = commands
        .iter()
        .map(|c| {
            let status = match reason {
                Some(r) => RefStatus::Ng(r.to_string()),
                None => RefStatus::Ok,
            };
            (c.ref_name.clone(), status)
        })
        .collect();
    report_status_lines(outcome, &per_ref, v2)
}

/// Build a `report-status` (or `report-status-v2`) body from an explicit list
/// of per-ref statuses.
fn report_status_lines(
    outcome: ReportOutcome,
    per_ref: &[(String, RefStatus)],
    _v2: bool,
) -> Vec<u8> {
    let mut body = Vec::with_capacity(64 + per_ref.len() * 64);

    let unpack_line = match &outcome {
        ReportOutcome::Ok => "unpack ok\n".to_string(),
        ReportOutcome::UnpackError(msg) => format!("unpack {msg}\n"),
    };
    body.extend_from_slice(&encode_pkt_line(unpack_line.as_bytes()));

    for (ref_name, status) in per_ref {
        let line = match status {
            RefStatus::Ok => format!("ok {ref_name}\n"),
            RefStatus::Ng(reason) => format!("ng {ref_name} {reason}\n"),
        };
        body.extend_from_slice(&encode_pkt_line(line.as_bytes()));
    }

    body.extend_from_slice(PKT_FLUSH);
    body
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cmd(old: &str, new: &str, name: &str) -> ReceivePackCommand {
        ReceivePackCommand {
            old_oid: old.to_string(),
            new_oid: new.to_string(),
            ref_name: name.to_string(),
            force: false,
        }
    }

    fn force_cmd(old: &str, new: &str, name: &str) -> ReceivePackCommand {
        ReceivePackCommand {
            old_oid: old.to_string(),
            new_oid: new.to_string(),
            ref_name: name.to_string(),
            force: true,
        }
    }

    const A: &str = "1111111111111111111111111111111111111111";
    const B: &str = "2222222222222222222222222222222222222222";

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

    #[test]
    fn classify_create_delete_update() {
        assert_eq!(
            classify_command(&cmd(RECEIVE_ZERO_OID, A, "refs/heads/x")),
            CommandKind::Create
        );
        assert_eq!(
            classify_command(&cmd(A, RECEIVE_ZERO_OID, "refs/heads/x")),
            CommandKind::Delete
        );
        assert_eq!(
            classify_command(&cmd(A, B, "refs/heads/x")),
            CommandKind::Update
        );
    }

    #[test]
    fn create_rejected_when_ref_exists() {
        let c = cmd(RECEIVE_ZERO_OID, A, "refs/heads/x");
        assert_eq!(
            decide_command(&c, &RefState::Absent, false, false),
            CommandDecision::Accept
        );
        assert!(matches!(
            decide_command(&c, &RefState::Present(B.to_string()), false, false),
            CommandDecision::Reject(_)
        ));
    }

    #[test]
    fn update_requires_matching_old_and_fast_forward() {
        let c = cmd(A, B, "refs/heads/x");
        // CAS mismatch: current is not A.
        assert!(matches!(
            decide_command(&c, &RefState::Present(B.to_string()), true, false),
            CommandDecision::Reject(_)
        ));
        // CAS ok but non-fast-forward.
        assert!(matches!(
            decide_command(&c, &RefState::Present(A.to_string()), false, false),
            CommandDecision::Reject(_)
        ));
        // CAS ok and fast-forward.
        assert_eq!(
            decide_command(&c, &RefState::Present(A.to_string()), true, false),
            CommandDecision::Accept
        );
        // Force overrides non-fast-forward.
        assert_eq!(
            decide_command(&c, &RefState::Present(A.to_string()), false, true),
            CommandDecision::Accept
        );
        // Absent ref cannot be updated.
        assert!(matches!(
            decide_command(&c, &RefState::Absent, true, false),
            CommandDecision::Reject(_)
        ));
    }

    #[test]
    fn delete_requires_matching_old() {
        let c = cmd(A, RECEIVE_ZERO_OID, "refs/heads/x");
        assert_eq!(
            decide_command(&c, &RefState::Present(A.to_string()), false, false),
            CommandDecision::Accept
        );
        assert!(matches!(
            decide_command(&c, &RefState::Present(B.to_string()), false, false),
            CommandDecision::Reject(_)
        ));
        assert!(matches!(
            decide_command(&c, &RefState::Absent, false, false),
            CommandDecision::Reject(_)
        ));
    }

    #[test]
    fn command_section_len_splits_at_flush() {
        let mut body = Vec::new();
        body.extend_from_slice(&encode_pkt_line(
            format!("{RECEIVE_ZERO_OID} {A} refs/heads/main\0report-status\n").as_bytes(),
        ));
        body.extend_from_slice(PKT_FLUSH);
        let tail = b"PACKDATA";
        body.extend_from_slice(tail);
        let split = command_section_len(&body).unwrap();
        assert_eq!(&body[split..], tail);
        assert!(pack_present(b"PACK0000"));
        assert!(!pack_present(b"NOPE"));
    }

    #[test]
    fn report_status_formats_ok_and_ng() {
        let per_ref = vec![
            ("refs/heads/main".to_string(), RefStatus::Ok),
            (
                "refs/heads/dev".to_string(),
                RefStatus::Ng("non-fast-forward".to_string()),
            ),
        ];
        let body = report_status_lines(ReportOutcome::Ok, &per_ref, false);
        let text = String::from_utf8(body).unwrap();
        assert!(text.contains("unpack ok\n"));
        assert!(text.contains("ok refs/heads/main\n"));
        assert!(text.contains("ng refs/heads/dev non-fast-forward\n"));
        assert!(text.ends_with("0000"));
    }

    #[test]
    fn report_status_unpack_error_marks_all_refs_ng() {
        let commands = vec![cmd(RECEIVE_ZERO_OID, A, "refs/heads/main")];
        let body = report_status(
            ReportOutcome::UnpackError("missing packfile".to_string()),
            &commands,
            false,
        );
        let text = String::from_utf8(body).unwrap();
        assert!(text.contains("unpack missing packfile\n"));
        assert!(text.contains("ng refs/heads/main unpacker error\n"));
    }

    // ----- End-to-end push tests driving a real packfile -----

    use std::path::Path;
    use std::process::Command;
    use tempfile::TempDir;

    fn git(args: &[&str], cwd: &Path) -> std::process::Output {
        Command::new("git")
            .current_dir(cwd)
            .args(args)
            .output()
            .expect("run git")
    }

    /// A work tree backed by a bare repo, used to author commits and build
    /// receive-pack bodies.
    struct Fixture {
        _tmp: TempDir,
        bare: std::path::PathBuf,
        work: std::path::PathBuf,
    }

    fn init_fixture() -> Fixture {
        let tmp = TempDir::new().unwrap();
        let bare = tmp.path().join("repo.git");
        let work = tmp.path().join("work");
        std::fs::create_dir_all(&bare).unwrap();
        std::fs::create_dir_all(&work).unwrap();
        git(&["init", "--bare"], &bare);
        git(&["init"], &work);
        git(&["config", "user.email", "t@e"], &work);
        git(&["config", "user.name", "t"], &work);
        git(&["config", "commit.gpgsign", "false"], &work);
        Fixture {
            _tmp: tmp,
            bare,
            work,
        }
    }

    /// Commit a file change in the work tree and return the new HEAD oid.
    fn commit(work: &Path, file: &str, contents: &str, message: &str) -> String {
        std::fs::write(work.join(file), contents).unwrap();
        git(&["add", file], work);
        git(&["commit", "--no-gpg-sign", "-m", message], work);
        let out = git(&["rev-parse", "HEAD"], work);
        assert!(out.status.success());
        String::from_utf8(out.stdout).unwrap().trim().to_string()
    }

    /// Build a packfile containing every object reachable from `tip` but not
    /// from any of `excludes`, mirroring what a client sends on push.
    fn build_pack(work: &Path, tip: &str, excludes: &[&str]) -> Vec<u8> {
        let mut child = Command::new("git")
            .current_dir(work)
            .args(["pack-objects", "--stdout", "--revs", "--thin"])
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .expect("spawn pack-objects");
        {
            use std::io::Write;
            let stdin = child.stdin.as_mut().unwrap();
            // `--revs` reads rev-list style args from stdin: exclusions first,
            // then the tip to include.
            let mut input = String::new();
            for e in excludes {
                input.push_str(&format!("^{e}\n"));
            }
            input.push_str(tip);
            input.push('\n');
            stdin.write_all(input.as_bytes()).unwrap();
        }
        let out = child.wait_with_output().unwrap();
        assert!(
            out.status.success(),
            "pack-objects failed: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        out.stdout
    }

    /// Assemble a receive-pack request body: one command line carrying
    /// capabilities, a flush, then the packfile bytes.
    fn build_request(commands: &[(String, String, String)], pack: &[u8]) -> Vec<u8> {
        let mut body = Vec::new();
        for (i, (old, new, name)) in commands.iter().enumerate() {
            let line = if i == 0 {
                format!(
                    "{old} {new} {name}\0report-status report-status-v2 object-format=sha1 agent=test\n"
                )
            } else {
                format!("{old} {new} {name}\n")
            };
            body.extend_from_slice(&encode_pkt_line(line.as_bytes()));
        }
        body.extend_from_slice(PKT_FLUSH);
        body.extend_from_slice(pack);
        body
    }

    fn current_ref(bare: &Path, name: &str) -> Option<String> {
        let repo = gix::open(bare).unwrap();
        repo.find_reference(name)
            .ok()
            .and_then(|r| r.try_id().map(|id| id.detach().to_string()))
    }

    #[test]
    fn push_fast_forward_update_succeeds() {
        let fx = init_fixture();
        let c1 = commit(&fx.work, "a.txt", "1\n", "c1");
        git(&["branch", "-M", "main"], &fx.work);
        git(
            &["remote", "add", "origin", &fx.bare.to_string_lossy()],
            &fx.work,
        );
        git(&["push", "origin", "main"], &fx.work);
        assert_eq!(
            current_ref(&fx.bare, "refs/heads/main").as_deref(),
            Some(c1.as_str())
        );

        let c2 = commit(&fx.work, "a.txt", "2\n", "c2");
        let pack = build_pack(&fx.work, &c2, &[&c1]);
        let body = build_request(
            &[(c1.clone(), c2.clone(), "refs/heads/main".to_string())],
            &pack,
        );

        let (out, _applied) = receive_pack(&fx.bare, &body).expect("protocol ok");
        let text = String::from_utf8(out).unwrap();
        assert!(text.contains("unpack ok\n"), "report: {text}");
        assert!(text.contains("ok refs/heads/main\n"), "report: {text}");
        assert_eq!(
            current_ref(&fx.bare, "refs/heads/main").as_deref(),
            Some(c2.as_str())
        );
    }

    #[test]
    fn push_create_branch_succeeds() {
        let fx = init_fixture();
        let c1 = commit(&fx.work, "a.txt", "1\n", "c1");
        git(&["branch", "-M", "main"], &fx.work);
        git(
            &["remote", "add", "origin", &fx.bare.to_string_lossy()],
            &fx.work,
        );
        git(&["push", "origin", "main"], &fx.work);

        let pack = build_pack(&fx.work, &c1, &[]);
        let body = build_request(
            &[(
                RECEIVE_ZERO_OID.to_string(),
                c1.clone(),
                "refs/heads/feature".to_string(),
            )],
            &pack,
        );
        let (out, _applied) = receive_pack(&fx.bare, &body).expect("protocol ok");
        let text = String::from_utf8(out).unwrap();
        assert!(text.contains("unpack ok\n"), "report: {text}");
        assert!(text.contains("ok refs/heads/feature\n"), "report: {text}");
        assert_eq!(
            current_ref(&fx.bare, "refs/heads/feature").as_deref(),
            Some(c1.as_str())
        );
    }

    #[test]
    fn push_non_fast_forward_rejected() {
        let fx = init_fixture();
        let c1 = commit(&fx.work, "a.txt", "1\n", "c1");
        git(&["branch", "-M", "main"], &fx.work);
        git(
            &["remote", "add", "origin", &fx.bare.to_string_lossy()],
            &fx.work,
        );
        git(&["push", "origin", "main"], &fx.work);

        // Create a divergent history that does not contain c1.
        git(&["checkout", "--orphan", "alt"], &fx.work);
        git(&["rm", "-rf", "."], &fx.work);
        let alt = commit(&fx.work, "b.txt", "x\n", "alt");

        let pack = build_pack(&fx.work, &alt, &[]);
        // Claim the current main (c1) and try to overwrite with the unrelated commit.
        let body = build_request(
            &[(c1.clone(), alt.clone(), "refs/heads/main".to_string())],
            &pack,
        );
        let (out, _applied) = receive_pack(&fx.bare, &body).expect("protocol ok");
        let text = String::from_utf8(out).unwrap();
        assert!(text.contains("unpack ok\n"), "report: {text}");
        assert!(
            text.contains("ng refs/heads/main non-fast-forward\n"),
            "report: {text}"
        );
        // Ref unchanged.
        assert_eq!(
            current_ref(&fx.bare, "refs/heads/main").as_deref(),
            Some(c1.as_str())
        );
    }

    #[test]
    fn push_force_flag_allows_non_fast_forward() {
        // Verify that a `+refs/heads/main`-prefixed command allows a non-fast-
        // forward update that would otherwise be rejected (closes #125).
        let fx = init_fixture();
        let c1 = commit(&fx.work, "a.txt", "1\n", "c1");
        git(&["branch", "-M", "main"], &fx.work);
        git(
            &["remote", "add", "origin", &fx.bare.to_string_lossy()],
            &fx.work,
        );
        git(&["push", "origin", "main"], &fx.work);

        // Create a divergent (orphan) commit.
        git(&["checkout", "--orphan", "alt"], &fx.work);
        git(&["rm", "-rf", "."], &fx.work);
        let alt = commit(&fx.work, "b.txt", "x\n", "alt");

        let pack = build_pack(&fx.work, &alt, &[]);
        // Use `+refs/heads/main` to signal force-push.
        let body = build_request(
            &[(c1.clone(), alt.clone(), "+refs/heads/main".to_string())],
            &pack,
        );
        let (out, applied) = receive_pack(&fx.bare, &body).expect("protocol ok");
        let text = String::from_utf8(out).unwrap();
        assert!(text.contains("unpack ok\n"), "report: {text}");
        assert!(
            text.contains("ok refs/heads/main\n"),
            "force push should succeed; report: {text}"
        );
        // Applied updates must include the forced ref.
        assert_eq!(applied.len(), 1, "one update expected");
        assert_eq!(applied[0].ref_name, "refs/heads/main");
        assert_eq!(applied[0].old_oid, c1);
        assert_eq!(applied[0].new_oid, alt);
        // Ref updated to the forced commit.
        assert_eq!(
            current_ref(&fx.bare, "refs/heads/main").as_deref(),
            Some(alt.as_str())
        );
    }

    #[test]
    fn push_cas_mismatch_rejected() {
        let fx = init_fixture();
        let c1 = commit(&fx.work, "a.txt", "1\n", "c1");
        git(&["branch", "-M", "main"], &fx.work);
        git(
            &["remote", "add", "origin", &fx.bare.to_string_lossy()],
            &fx.work,
        );
        git(&["push", "origin", "main"], &fx.work);

        let c2 = commit(&fx.work, "a.txt", "2\n", "c2");
        let pack = build_pack(&fx.work, &c2, &[&c1]);
        // Send a stale old oid (not the current main).
        let stale = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef".to_string();
        let body = build_request(&[(stale, c2.clone(), "refs/heads/main".to_string())], &pack);
        let (out, _applied) = receive_pack(&fx.bare, &body).expect("protocol ok");
        let text = String::from_utf8(out).unwrap();
        assert!(text.contains("unpack ok\n"), "report: {text}");
        assert!(
            text.contains("ng refs/heads/main stale info"),
            "report: {text}"
        );
        assert_eq!(
            current_ref(&fx.bare, "refs/heads/main").as_deref(),
            Some(c1.as_str())
        );
    }

    #[test]
    fn push_delete_branch_succeeds() {
        let fx = init_fixture();
        let c1 = commit(&fx.work, "a.txt", "1\n", "c1");
        git(&["branch", "-M", "main"], &fx.work);
        git(&["branch", "doomed"], &fx.work);
        git(
            &["remote", "add", "origin", &fx.bare.to_string_lossy()],
            &fx.work,
        );
        git(&["push", "origin", "main"], &fx.work);
        git(&["push", "origin", "doomed"], &fx.work);
        assert_eq!(
            current_ref(&fx.bare, "refs/heads/doomed").as_deref(),
            Some(c1.as_str())
        );

        // Deletes carry no pack.
        let body = build_request(
            &[(
                c1.clone(),
                RECEIVE_ZERO_OID.to_string(),
                "refs/heads/doomed".to_string(),
            )],
            &[],
        );
        let (out, _applied) = receive_pack(&fx.bare, &body).expect("protocol ok");
        let text = String::from_utf8(out).unwrap();
        assert!(text.contains("unpack ok\n"), "report: {text}");
        assert!(text.contains("ok refs/heads/doomed\n"), "report: {text}");
        assert!(current_ref(&fx.bare, "refs/heads/doomed").is_none());
    }
}
