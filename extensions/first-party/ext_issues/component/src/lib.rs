// ext_issues — WASM Component-Model implementation of `issues.wit`.
//
// Backed by host imports declared in `comtrya:platform@0.1.0`:
//   * `ids.mint("issue")` for opaque IDs
//   * `storage.{create,get,update-begin,update-commit,query}` for state
//   * `events.append` for `dev.comtrya.issues.{opened,closed,reopened}`
//   * `time.now-iso` for timestamps
//   * `identity.current-principal` for the actor
//
// All state lives in the per-extension `issues` storage collection. The
// kernel re-instantiates this component per op invocation; no in-memory
// state survives across calls (relied upon by the platform's per-call
// model).

#[allow(warnings)]
mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::identity;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_issues::issues::{
    AssignProjectInput, CloseIssueInput, Guest as IssuesGuest, Issue, IssueState,
    IssueStateCounts, OpenIssueInput,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};

const COLLECTION: &str = "issues";
const MAX_TITLE_LEN: usize = 512;
const MAX_BODY_LEN: usize = 64 * 1024;

struct Component;

// ---- record shape persisted to storage ----

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredIssue {
    id: String,
    #[serde(default)]
    repository: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    workspace_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    repository_id: Option<String>,
    title: String,
    body_markdown: String,
    state: String,
    number: u64,
    author_ref: String,
    created_at: String,
    updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    closed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    closed_by_ref: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    state_reason: Option<String>,
    /// Project the issue belongs to, derived from the repo's
    /// `package comtrya` CUE config at open time. Stamped by the UI
    /// when opening from a Project page; `None` for unscoped issues.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    project_name: Option<String>,
    /// Free-form labels applied at open time. Pre-filled from the
    /// Project's `issues.defaultLabels` CUE config when the issue is
    /// opened from a Project page.
    #[serde(default)]
    labels: Vec<String>,
    /// Opt-out for the PR merge reactor. Stamped at open time from
    /// the Project's `issues.closeOnMerge` CUE config; the reactor
    /// reads it via `by-ref-issue` before deciding to call
    /// `close-issue`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    close_on_merge: Option<bool>,
    /// Typed `comtrya://` URN assignees. Pre-filled from the
    /// Project's `owners[]` CUE config at open time so a kernel
    /// issue routes to platform-maintainers + rawkode by default.
    /// The contributor can override before submit.
    #[serde(default)]
    assignees: Vec<String>,
}

impl StoredIssue {
    fn repository_uri(&self) -> String {
        if !self.repository.is_empty() {
            return self.repository.clone();
        }
        match (self.workspace_id.as_deref(), self.repository_id.as_deref()) {
            (Some(workspace), Some(repository)) => {
                format!("comtrya://workspace/{workspace}/repository/{repository}")
            }
            (Some(workspace), None) => format!("comtrya://workspace/{workspace}"),
            (None, Some(repository)) => format!("comtrya://repository/{repository}"),
            (None, None) => String::new(),
        }
    }

    fn to_wit(&self) -> Issue {
        Issue {
            id: self.id.clone(),
            repository: self.repository_uri(),
            title: self.title.clone(),
            body_markdown: self.body_markdown.clone(),
            state: state_from_str(&self.state),
            number: self.number,
            author_ref: self.author_ref.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
            closed_at: self.closed_at.clone(),
            closed_by_ref: self.closed_by_ref.clone(),
            state_reason: self.state_reason.clone(),
            project_name: self.project_name.clone(),
            labels: self.labels.clone(),
            close_on_merge: self.close_on_merge,
            assignees: self.assignees.clone(),
        }
    }
}

fn state_to_str(state: IssueState) -> &'static str {
    match state {
        IssueState::Open => "open",
        IssueState::Closed => "closed",
        IssueState::Reopened => "reopened",
    }
}

fn state_from_str(s: &str) -> IssueState {
    match s {
        "closed" => IssueState::Closed,
        "reopened" => IssueState::Reopened,
        _ => IssueState::Open,
    }
}

// ---- helpers ----

fn err(code: ErrorCode, message: impl Into<String>) -> Error {
    Error {
        code,
        message: message.into(),
        path: None,
    }
}

const COUNTER_COLLECTION: &str = "_meta";

#[derive(Serialize, Deserialize)]
struct RepoCounter {
    next: u64,
}

struct IssueScope {
    workspace_id: Option<String>,
    repository_id: Option<String>,
}

fn issue_scope(repository: &str) -> IssueScope {
    let Some(rest) = repository.strip_prefix("comtrya://") else {
        return IssueScope {
            workspace_id: None,
            repository_id: None,
        };
    };
    if let Some(rest) = rest.strip_prefix("workspace/") {
        if let Some((workspace, repository)) = rest.split_once("/repository/") {
            return IssueScope {
                workspace_id: Some(workspace.to_string()),
                repository_id: Some(repository.to_string()),
            };
        }
        return IssueScope {
            workspace_id: Some(rest.to_string()),
            repository_id: None,
        };
    }
    if let Some(repository) = rest.strip_prefix("repository/") {
        return IssueScope {
            workspace_id: None,
            repository_id: Some(repository.to_string()),
        };
    }
    IssueScope {
        workspace_id: None,
        repository_id: None,
    }
}

fn issue_counter_key(repository: &str, scope: &IssueScope) -> String {
    scope
        .workspace_id
        .as_ref()
        .map(|workspace| format!("comtrya://workspace/{workspace}"))
        .unwrap_or_else(|| repository.to_string())
}

fn repository_filter_matches(stored: &StoredIssue, filter: &str) -> bool {
    if filter == "comtrya://issues" {
        return true;
    }
    let filter_scope = issue_scope(filter);
    if let Some(workspace) = filter_scope.workspace_id.as_deref() {
        if stored.workspace_id.as_deref() != Some(workspace) {
            return false;
        }
    }
    if let Some(repository) = filter_scope.repository_id.as_deref() {
        if stored.repository_id.as_deref() != Some(repository) {
            return false;
        }
    }
    filter_scope.workspace_id.is_some()
        || filter_scope.repository_id.is_some()
        || stored.repository == filter
}

/// Return the next sequential issue number for `scope_key` and increment the
/// persisted counter atomically. Workspace-scoped repositories share a
/// workspace counter; repository-only callers fall back to the repository URI.
fn next_issue_number(scope_key: &str) -> Result<u64, Error> {
    let counter_id = format!("issue-number:{}", scope_key);
    match storage::update_begin(COUNTER_COLLECTION, &counter_id) {
        Ok(snap) => {
            let mut counter: RepoCounter = serde_json::from_slice(&snap.data)
                .map_err(|e| err(ErrorCode::Internal, format!("parse counter: {e}")))?;
            let assigned = counter.next;
            counter.next = counter.next.saturating_add(1);
            let bytes = serde_json::to_vec(&counter)
                .map_err(|e| err(ErrorCode::Internal, format!("serialise counter: {e}")))?;
            storage::update_commit(COUNTER_COLLECTION, &counter_id, &snap.version, &bytes)?;
            Ok(assigned)
        }
        Err(Error {
            code: ErrorCode::NotFound,
            ..
        }) => {
            // First issue in this repo — seed the counter at 2, return 1.
            let counter = RepoCounter { next: 2 };
            let bytes = serde_json::to_vec(&counter)
                .map_err(|e| err(ErrorCode::Internal, format!("serialise counter: {e}")))?;
            storage::create(
                COUNTER_COLLECTION,
                &counter_id,
                &bytes,
                &storage::DocumentMetadata {
                    resource_uri: format!("comtrya://_meta/{}", counter_id),
                    resource_refs: vec![scope_key.to_string()],
                },
            )?;
            Ok(1)
        }
        Err(other) => Err(other),
    }
}

fn persist_new(stored: &StoredIssue) -> Result<(), Error> {
    let data = serde_json::to_vec(stored)
        .map_err(|e| err(ErrorCode::Internal, format!("serialise issue: {e}")))?;
    let mut resource_refs = vec![stored.repository.clone()];
    if let Some(workspace_id) = &stored.workspace_id {
        resource_refs.push(format!("comtrya://workspace/{workspace_id}"));
    }
    if let Some(repository_id) = &stored.repository_id {
        resource_refs.push(format!("comtrya://repository/{repository_id}"));
    }
    storage::create(
        COLLECTION,
        &stored.id,
        &data,
        &storage::DocumentMetadata {
            resource_uri: format!("comtrya://issue/{}", stored.id),
            resource_refs,
        },
    )
}

fn validated_open_issue(input: &OpenIssueInput) -> Result<(String, String), Error> {
    let repository = input.repository.trim();
    if repository.is_empty() {
        return Err(err(ErrorCode::BadInput, "issue requires a repository"));
    }
    let scope = issue_scope(repository);
    if scope
        .workspace_id
        .as_deref()
        .map(str::is_empty)
        .unwrap_or(true)
    {
        return Err(err(ErrorCode::BadInput, "issue requires a workspace"));
    }
    let title = input.title.trim();
    if title.is_empty() {
        return Err(err(ErrorCode::BadInput, "issue title must not be empty"));
    }
    if title.len() > MAX_TITLE_LEN {
        return Err(err(
            ErrorCode::BadInput,
            format!("issue title must be at most {MAX_TITLE_LEN} bytes"),
        ));
    }
    if input.body_markdown.len() > MAX_BODY_LEN {
        return Err(err(
            ErrorCode::BadInput,
            format!("issue body must be at most {MAX_BODY_LEN} bytes"),
        ));
    }
    Ok((repository.to_string(), title.to_string()))
}

fn decode_stored_issue(id: &str, bytes: &[u8]) -> Result<StoredIssue, Error> {
    let mut stored: StoredIssue = serde_json::from_slice(bytes)
        .map_err(|e| err(ErrorCode::Internal, format!("parse issue {}: {e}", id)))?;
    if stored.repository.is_empty() {
        stored.repository = stored.repository_uri();
    }
    Ok(stored)
}

fn read_stored(id: &str) -> Result<Option<StoredIssue>, Error> {
    let Some(snap) = storage::get(COLLECTION, id)? else {
        return Ok(None);
    };
    Ok(Some(decode_stored_issue(id, &snap.data)?))
}

fn issue_id_from_ref(ref_uri: &str) -> Result<String, Error> {
    let ref_uri = ref_uri.trim();
    if ref_uri.is_empty() {
        return Err(err(ErrorCode::BadInput, "by-ref-issue requires a ref"));
    }
    let rest = ref_uri.strip_prefix("comtrya://").ok_or_else(|| {
        err(
            ErrorCode::BadInput,
            "resource reference must use comtrya://",
        )
    })?;
    let Some((kind, id)) = rest.split_once('/') else {
        return Err(err(
            ErrorCode::BadInput,
            "by-ref-issue requires an id in the URI",
        ));
    };
    if !valid_resource_kind(kind) {
        return Err(err(
            ErrorCode::BadInput,
            "resource reference has unknown kind",
        ));
    }
    if id.trim().is_empty() {
        return Err(err(
            ErrorCode::BadInput,
            "by-ref-issue requires an id in the URI",
        ));
    }
    let prefix_len = validate_opaque_id(id)?;
    validate_resource_kind_matches_id(kind, id, prefix_len)?;
    Ok(id.to_string())
}

fn valid_resource_kind(kind: &str) -> bool {
    !kind.is_empty()
        && kind.bytes().all(|byte| {
            byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-' || byte == b'_'
        })
}

fn validate_opaque_id(id: &str) -> Result<usize, Error> {
    let prefix_len = opaque_id_prefix_len(id)
        .ok_or_else(|| err(ErrorCode::BadInput, "opaque ID has an unknown prefix"))?;
    let body = &id[prefix_len..];
    if body.len() != 26 {
        return Err(err(
            ErrorCode::BadInput,
            "opaque ID body must be 26 Crockford-base32 characters",
        ));
    }
    if !body.bytes().all(is_crockford_base32) {
        return Err(err(
            ErrorCode::BadInput,
            "opaque ID body contains non-Crockford-base32 characters",
        ));
    }
    Ok(prefix_len)
}

fn validate_resource_kind_matches_id(kind: &str, id: &str, prefix_len: usize) -> Result<(), Error> {
    let Some(kind_from_prefix) = core_kind_for_prefix(&id[..prefix_len]) else {
        return Ok(());
    };
    if is_core_kind(kind) && kind != kind_from_prefix {
        return Err(err(
            ErrorCode::BadInput,
            format!("resource kind {kind} does not match ID prefix kind {kind_from_prefix}"),
        ));
    }
    Ok(())
}

fn opaque_id_prefix_len(id: &str) -> Option<usize> {
    const CORE_PREFIXES: &[&str] = &[
        "repo_", "ws_", "ext_", "proj_", "rel_", "cmt_", "grp_", "team_", "sec_", "chk_", "evt_",
        "usr_", "job_",
    ];
    if let Some(prefix) = CORE_PREFIXES.iter().find(|prefix| id.starts_with(**prefix)) {
        return Some(prefix.len());
    }
    let underscore = id.find('_')?;
    if !(2..=8).contains(&underscore) {
        return None;
    }
    if !id[..underscore]
        .bytes()
        .all(|byte| byte.is_ascii_lowercase())
    {
        return None;
    }
    Some(underscore + 1)
}

fn is_core_kind(kind: &str) -> bool {
    matches!(
        kind,
        "user"
            | "team"
            | "workspace"
            | "group"
            | "repository"
            | "project"
            | "extension"
            | "check"
            | "job"
            | "event"
            | "secret"
            | "relation"
            | "comment"
    )
}

fn core_kind_for_prefix(prefix: &str) -> Option<&'static str> {
    Some(match prefix {
        "usr_" => "user",
        "team_" => "team",
        "ws_" => "workspace",
        "grp_" => "group",
        "repo_" => "repository",
        "proj_" => "project",
        "ext_" => "extension",
        "chk_" => "check",
        "job_" => "job",
        "evt_" => "event",
        "sec_" => "secret",
        "rel_" => "relation",
        "cmt_" => "comment",
        _ => return None,
    })
}

fn is_crockford_base32(byte: u8) -> bool {
    matches!(
        byte,
        b'0'..=b'9'
            | b'A'
            | b'B'
            | b'C'
            | b'D'
            | b'E'
            | b'F'
            | b'G'
            | b'H'
            | b'J'
            | b'K'
            | b'M'
            | b'N'
            | b'P'
            | b'Q'
            | b'R'
            | b'S'
            | b'T'
            | b'V'
            | b'W'
            | b'X'
            | b'Y'
            | b'Z'
    )
}

fn read_by_ref(ref_uri: &str) -> Result<Option<StoredIssue>, Error> {
    let id = issue_id_from_ref(ref_uri)?;
    read_stored(&id)
}

fn read_by_refs(refs: &[String]) -> Result<Vec<Option<StoredIssue>>, Error> {
    refs.iter().map(|ref_uri| read_by_ref(ref_uri)).collect()
}

fn scan_stored_issues(
    mut visit: impl FnMut(StoredIssue) -> Result<bool, Error>,
) -> Result<(), Error> {
    let mut after = None;
    loop {
        let page = storage::list_all(COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let stored = decode_stored_issue("<list>", &bytes)?;
            if visit(stored)? {
                return Ok(());
            }
        }
        match page.next_page {
            Some(next) => after = Some(next),
            None => return Ok(()),
        }
    }
}

fn read_by_number(workspace_id: &str, number: u64) -> Result<Option<StoredIssue>, Error> {
    if workspace_id.trim().is_empty() {
        return Err(err(
            ErrorCode::BadInput,
            "issues.byNumber requires a workspaceId",
        ));
    }
    let mut found = None;
    scan_stored_issues(|stored| {
        if stored.workspace_id.as_deref() == Some(workspace_id) && stored.number == number {
            found = Some(stored);
            Ok(true)
        } else {
            Ok(false)
        }
    })?;
    Ok(found)
}

fn state_counts_for_refs(refs: &[String]) -> Result<IssueStateCounts, Error> {
    let issues = read_by_refs(refs)?;
    let mut open = 0u64;
    let mut closed = 0u64;
    for issue in issues.into_iter().flatten() {
        match issue.state.as_str() {
            "open" => open += 1,
            "closed" => closed += 1,
            _ => {}
        }
    }
    Ok(IssueStateCounts { open, closed })
}

fn emit(event_type: &str, payload: &impl Serialize, source_uri: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(payload)
        .map_err(|e| err(ErrorCode::Internal, format!("serialise event payload: {e}")))?;
    let _ = events::append(event_type, &bytes, Some(source_uri))?;
    Ok(())
}

// ---- issues exports ----

impl IssuesGuest for Component {
    fn open_issue(input: OpenIssueInput) -> Result<Issue, Error> {
        let (repository, title) = validated_open_issue(&input)?;
        let id = ids::mint("issue")?;
        let now = time::now_iso();
        let author = identity::current_principal()?;
        let scope = issue_scope(&repository);
        let number = next_issue_number(&issue_counter_key(&repository, &scope))?;
        let project_name = input
            .project_name
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        let labels: Vec<String> = {
            let mut seen = std::collections::BTreeSet::new();
            input
                .labels
                .iter()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .filter(|s| seen.insert(s.clone()))
                .collect()
        };
        // Deduplicate assignees by URN. Each entry should look like
        // `comtrya://{user,agent,bot,credential,team}/<slug>` (the
        // kernel's `#Ref` shape from iteration 26). We don't reject
        // malformed values — the UI is the gatekeeper — but we do
        // trim + drop empties.
        let assignees: Vec<String> = {
            let mut seen = std::collections::BTreeSet::new();
            input
                .assignees
                .iter()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .filter(|s| seen.insert(s.clone()))
                .collect()
        };
        let stored = StoredIssue {
            id: id.clone(),
            repository,
            workspace_id: scope.workspace_id,
            repository_id: scope.repository_id,
            title,
            body_markdown: input.body_markdown,
            state: state_to_str(IssueState::Open).to_string(),
            number,
            author_ref: author,
            created_at: now.clone(),
            updated_at: now,
            closed_at: None,
            closed_by_ref: None,
            state_reason: None,
            project_name,
            labels,
            close_on_merge: input.close_on_merge,
            assignees,
        };
        persist_new(&stored)?;
        let issue = stored.to_wit();
        emit(
            "dev.comtrya.issues.opened",
            &issue_event_payload(&issue),
            &issue_uri(&id),
        )?;
        Ok(issue)
    }

    fn close_issue(input: CloseIssueInput) -> Result<Issue, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode_stored_issue(&input.id, &snap.data)?;
        let now = time::now_iso();
        // Caller can override the recorded actor via input.closed-by-ref;
        // otherwise the request principal is used.
        let actor = match &input.closed_by_ref {
            Some(uri) => uri.clone(),
            None => identity::current_principal()?,
        };
        stored.state = state_to_str(IssueState::Closed).to_string();
        stored.updated_at = now.clone();
        stored.closed_at = Some(now);
        stored.closed_by_ref = Some(actor);
        stored.state_reason = input.reason.clone();
        let bytes = serde_json::to_vec(&stored)
            .map_err(|e| err(ErrorCode::Internal, format!("serialise issue: {e}")))?;
        storage::update_commit(COLLECTION, &input.id, &snap.version, &bytes)?;
        let issue = stored.to_wit();
        emit(
            "dev.comtrya.issues.closed",
            &issue_event_payload(&issue),
            &issue_uri(&issue.id),
        )?;
        Ok(issue)
    }

    fn reopen_issue(id: String) -> Result<Issue, Error> {
        let snap = storage::update_begin(COLLECTION, &id)?;
        let mut stored = decode_stored_issue(&id, &snap.data)?;
        let now = time::now_iso();
        stored.state = state_to_str(IssueState::Open).to_string();
        stored.updated_at = now;
        stored.closed_at = None;
        stored.closed_by_ref = None;
        stored.state_reason = None;
        let bytes = serde_json::to_vec(&stored)
            .map_err(|e| err(ErrorCode::Internal, format!("serialise issue: {e}")))?;
        storage::update_commit(COLLECTION, &id, &snap.version, &bytes)?;
        let issue = stored.to_wit();
        emit(
            "dev.comtrya.issues.reopened",
            &issue_event_payload(&issue),
            &issue_uri(&issue.id),
        )?;
        Ok(issue)
    }

    /// 0.1.7 — retroactively assign (or clear) the Project this
    /// issue belongs to. Trim + normalise the incoming name so a
    /// blank/whitespace value reads as "unscoped"; collapsing
    /// `Some("")` to `None` keeps the storage shape consistent
    /// with `open-issue` (where `None` means unscoped). Emits
    /// `dev.comtrya.issues.project-changed` carrying both the
    /// previous and next project names so consumers (workspace
    /// per-Project counts iter 65, palette, future inbox) can
    /// shift their tallies without scanning.
    fn assign_project(input: AssignProjectInput) -> Result<Issue, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode_stored_issue(&input.id, &snap.data)?;
        let previous = stored.project_name.clone();
        let normalised = input
            .project_name
            .as_deref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        if normalised == previous {
            // No-op write would still produce an event burst.
            // Bail with the current snapshot instead.
            return Ok(stored.to_wit());
        }
        stored.project_name = normalised.clone();
        stored.updated_at = time::now_iso();
        let bytes = serde_json::to_vec(&stored)
            .map_err(|e| err(ErrorCode::Internal, format!("serialise issue: {e}")))?;
        storage::update_commit(COLLECTION, &input.id, &snap.version, &bytes)?;
        let issue = stored.to_wit();
        emit(
            "dev.comtrya.issues.project-changed",
            &ProjectChangedPayload {
                id: &issue.id,
                repository: &issue.repository,
                number: issue.number,
                previous_project: previous.as_deref(),
                project_name: normalised.as_deref(),
            },
            &issue_uri(&issue.id),
        )?;
        Ok(issue)
    }

    fn get_issue(id: String) -> Result<Option<Issue>, Error> {
        Ok(read_stored(&id)?.map(|s| s.to_wit()))
    }

    fn list_issues(repository: String, limit: u32) -> Result<Vec<Issue>, Error> {
        let limit = limit.min(1024);
        let mut matches = Vec::new();
        scan_stored_issues(|stored| {
            if repository_filter_matches(&stored, &repository) {
                matches.push(stored);
            }
            Ok(false)
        })?;
        matches.sort_by(|a, b| {
            b.created_at
                .cmp(&a.created_at)
                .then_with(|| b.number.cmp(&a.number))
                .then_with(|| b.id.cmp(&a.id))
        });
        Ok(matches
            .into_iter()
            .take(limit as usize)
            .map(|issue| issue.to_wit())
            .collect())
    }

    fn by_ref_issue(ref_: String) -> Result<Option<Issue>, Error> {
        Ok(read_by_ref(&ref_)?.map(|issue| issue.to_wit()))
    }

    fn by_refs_issue(refs: Vec<String>) -> Result<Vec<Option<Issue>>, Error> {
        read_by_refs(&refs).map(|issues| {
            issues
                .into_iter()
                .map(|issue| issue.map(|issue| issue.to_wit()))
                .collect()
        })
    }

    fn by_number_issue(workspace_id: String, number: u64) -> Result<Option<Issue>, Error> {
        Ok(read_by_number(&workspace_id, number)?.map(|issue| issue.to_wit()))
    }

    fn state_counts_for_refs_issue(refs: Vec<String>) -> Result<IssueStateCounts, Error> {
        state_counts_for_refs(&refs)
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IssueEventPayload<'a> {
    id: &'a str,
    repository: &'a str,
    number: u64,
    state: &'a str,
    /// Project scope, if the issue was opened against one. Surfaced
    /// on the event so consumers can filter the SSE stream by
    /// project without needing a follow-up `by-ref-issue` lookup
    /// (the Project home's activity stream is the canonical case).
    #[serde(skip_serializing_if = "Option::is_none")]
    project_name: Option<&'a str>,
}

fn issue_event_payload(issue: &Issue) -> IssueEventPayload<'_> {
    IssueEventPayload {
        id: &issue.id,
        repository: &issue.repository,
        number: issue.number,
        state: state_to_str(issue.state),
        project_name: issue.project_name.as_deref(),
    }
}

/// Payload for `dev.comtrya.issues.project-changed`. Carries both
/// the previous and next project names so subscribers can adjust
/// per-Project counts in a single pass without a follow-up
/// lookup.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectChangedPayload<'a> {
    id: &'a str,
    repository: &'a str,
    number: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    previous_project: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    project_name: Option<&'a str>,
}

fn issue_uri(id: &str) -> String {
    format!("comtrya://issue/{}", id)
}

// ---- reactor export (no-op for ext_issues) ----

impl ReactorGuest for Component {
    fn subscribed_event_types() -> Result<Vec<String>, Error> {
        Ok(Vec::new())
    }

    fn on_event(_triggering_event: Event) -> Result<Vec<Reaction>, Error> {
        Ok(Vec::new())
    }
}

bindings::export!(Component with_types_in bindings);
