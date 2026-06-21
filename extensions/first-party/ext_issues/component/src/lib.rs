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

mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::identity;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_issues::issues::{
    AssignProjectInput, CloseIssueInput, Guest as IssuesGuest, Issue, IssueAssigneeBoard,
    IssueAssigneeBoardInput, IssueAssigneeCard, IssueAssigneeColumn, IssueLabelBoard,
    IssueLabelBoardInput, IssueLabelCard, IssueLabelColumn, IssuePriorityBoard,
    IssuePriorityBoardInput, IssuePriorityCard, IssuePriorityColumn, IssueProjectBoard,
    IssueProjectBoardInput, IssueProjectCard, IssueProjectColumn, IssueState, IssueStateCounts,
    IssueTriageBoard, IssueTriageBoardInput, IssueTriageCard, IssueTriageColumn, OpenIssueInput,
    UpdateIssueInput,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

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

// Renamed from "_meta" (was shared with ext_pull_requests, causing a
// collection_owners BTreeMap last-write-wins collision — see #153).
const COUNTER_COLLECTION: &str = "ext_issues_meta";

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RepoCounter {
    id: String,
    storage_id: String,
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

/// Maximum number of CAS retries on a counter update before giving up.
/// `update-commit` returns `conflict` if another writer raced ahead since
/// our `update-begin`; we re-read and retry up to this bound. Eight
/// attempts cover any practical issue-create burst without unbounded looping.
const COUNTER_RETRY_LIMIT: u32 = 8;

fn read_counter(counter_id: &str) -> Result<Option<RepoCounter>, Error> {
    let mut after = None;
    let mut found = None;
    loop {
        let page = storage::list_all(COUNTER_COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let counter: RepoCounter = serde_json::from_slice(&bytes)
                .map_err(|e| err(ErrorCode::Internal, format!("parse counter: {e}")))?;
            if counter.id == counter_id {
                if found.is_some() {
                    return Err(err(
                        ErrorCode::Internal,
                        format!("counter collection contains duplicate rows for {counter_id}"),
                    ));
                }
                found = Some(counter);
            }
        }
        match page.next_page {
            Some(next) => after = Some(next),
            None => return Ok(found),
        }
    }
}

/// Return the next sequential issue number for `scope_key` and increment the
/// persisted counter atomically via storage's single-document version guard
/// (update-begin/update-commit), seeding the counter on first use.
/// Workspace-scoped repositories share a workspace counter; repository-only
/// callers fall back to the repository URI.
///
/// The CAS loop retries up to `COUNTER_RETRY_LIMIT` times on `conflict`
/// (another issue-create raced us between begin and commit) and on the
/// first-use seed race (two creators hit `NotFound`, the second sees
/// `conflict` from `storage::create` and re-enters the update path).
fn next_issue_number(scope_key: &str) -> Result<u64, Error> {
    let counter_id = format!("issue-number:{}", scope_key);
    for _ in 0..COUNTER_RETRY_LIMIT {
        match read_counter(&counter_id)? {
            Some(counter) => {
                let snap = match storage::update_begin(COUNTER_COLLECTION, &counter.storage_id) {
                    Ok(snap) => snap,
                    Err(Error {
                        code: ErrorCode::NotFound,
                        ..
                    }) => continue,
                    Err(other) => return Err(other),
                };
                let mut counter: RepoCounter = serde_json::from_slice(&snap.data)
                    .map_err(|e| err(ErrorCode::Internal, format!("parse counter: {e}")))?;
                if counter.id != counter_id {
                    return Err(err(
                        ErrorCode::Internal,
                        format!("counter document has wrong id {}", counter.id),
                    ));
                }
                let assigned = counter.next;
                counter.next = counter.next.saturating_add(1);
                let bytes = serde_json::to_vec(&counter)
                    .map_err(|e| err(ErrorCode::Internal, format!("serialise counter: {e}")))?;
                match storage::update_commit(
                    COUNTER_COLLECTION,
                    &counter.storage_id,
                    &snap.version,
                    &bytes,
                ) {
                    Ok(()) => return Ok(assigned),
                    Err(Error {
                        code: ErrorCode::Conflict,
                        ..
                    }) => continue,
                    Err(other) => return Err(other),
                }
            }
            None => {
                // First issue in this scope — seed the counter at 2, return 1.
                let storage_id = ids::mint("issue-counter")?;
                let counter = RepoCounter {
                    id: counter_id.clone(),
                    storage_id: storage_id.clone(),
                    next: 2,
                };
                let bytes = serde_json::to_vec(&counter)
                    .map_err(|e| err(ErrorCode::Internal, format!("serialise counter: {e}")))?;
                match storage::create(
                    COUNTER_COLLECTION,
                    &storage_id,
                    &bytes,
                    &storage::DocumentMetadata {
                        resource_uri: format!("comtrya://issue-counter/{storage_id}"),
                        resource_refs: vec![scope_key.to_string(), counter_id.clone()],
                    },
                ) {
                    Ok(()) => return Ok(1),
                    // Another writer seeded the counter between our
                    // update-begin NotFound and our create. Fall through
                    // to the next iteration which will hit the Ok branch.
                    Err(Error {
                        code: ErrorCode::Conflict,
                        ..
                    }) => continue,
                    Err(other) => return Err(other),
                }
            }
        }
    }
    Err(err(
        ErrorCode::Unavailable,
        format!("issue-number counter for {scope_key} contended past retry limit"),
    ))
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
            // Skip an undecodable record rather than aborting the whole scan,
            // matching ext_pull_requests / ext_checks. One corrupt or
            // schema-skewed doc must not break listing/lookup for the
            // collection.
            let Ok(stored) = decode_stored_issue("<list>", &bytes) else {
                continue;
            };
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

#[derive(Clone, Copy)]
enum TriageLane {
    NeedsOwner,
    Assigned,
    ManualClose,
    Closed,
}

fn triage_lane(issue: &Issue) -> TriageLane {
    match issue.state {
        IssueState::Closed => TriageLane::Closed,
        _ if issue.close_on_merge == Some(false) => TriageLane::ManualClose,
        _ if issue.assignees.is_empty() => TriageLane::NeedsOwner,
        _ => TriageLane::Assigned,
    }
}

fn triage_column(key: &str, label: &str, cards: Vec<IssueTriageCard>) -> IssueTriageColumn {
    IssueTriageColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn triage_columns(cards: Vec<IssueTriageCard>) -> Vec<IssueTriageColumn> {
    let mut needs_owner = Vec::new();
    let mut assigned = Vec::new();
    let mut manual_close = Vec::new();
    let mut closed = Vec::new();

    for card in cards {
        match triage_lane(&card.issue) {
            TriageLane::NeedsOwner => needs_owner.push(card),
            TriageLane::Assigned => assigned.push(card),
            TriageLane::ManualClose => manual_close.push(card),
            TriageLane::Closed => closed.push(card),
        }
    }

    vec![
        triage_column("needs-owner", "Needs owner", needs_owner),
        triage_column("assigned", "Assigned", assigned),
        triage_column("manual-close", "Manual close", manual_close),
        triage_column("closed", "Closed", closed),
    ]
}

fn issue_label_key(label: &str) -> String {
    let mut key = String::new();
    let mut last_dash = false;
    for byte in label.trim().bytes() {
        if byte.is_ascii_alphanumeric() {
            key.push(byte.to_ascii_lowercase() as char);
            last_dash = false;
        } else if !last_dash {
            key.push('-');
            last_dash = true;
        }
    }
    let key = key.trim_matches('-');
    if key.is_empty() {
        "label".to_string()
    } else {
        format!("label-{key}")
    }
}

fn label_column(key: &str, label: &str, cards: Vec<IssueLabelCard>) -> IssueLabelColumn {
    IssueLabelColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn label_board_columns(issues: Vec<Issue>) -> Vec<IssueLabelColumn> {
    let mut unlabeled = Vec::new();
    let mut labeled: BTreeMap<String, (String, Vec<IssueLabelCard>)> = BTreeMap::new();

    for issue in issues {
        let labels: Vec<String> = issue
            .labels
            .iter()
            .map(|label| label.trim())
            .filter(|label| !label.is_empty())
            .map(str::to_string)
            .collect();
        if labels.is_empty() {
            unlabeled.push(IssueLabelCard { issue });
            continue;
        }
        for label in labels {
            let key = issue_label_key(&label);
            let entry = labeled.entry(key).or_insert_with(|| (label, Vec::new()));
            entry.1.push(IssueLabelCard {
                issue: issue.clone(),
            });
        }
    }

    let mut columns = vec![label_column("unlabeled", "Unlabeled", unlabeled)];
    columns.extend(
        labeled
            .into_iter()
            .map(|(key, (label, cards))| label_column(&key, &label, cards)),
    );
    columns
}

fn issue_assignee_key(assignee: &str) -> String {
    let raw = assignee
        .trim()
        .strip_prefix("comtrya://")
        .unwrap_or(assignee);
    let mut key = String::new();
    let mut last_dash = false;
    for byte in raw.bytes() {
        if byte.is_ascii_alphanumeric() {
            key.push(byte.to_ascii_lowercase() as char);
            last_dash = false;
        } else if !last_dash {
            key.push('-');
            last_dash = true;
        }
    }
    let key = key.trim_matches('-');
    if key.is_empty() {
        "assignee".to_string()
    } else {
        format!("assignee-{key}")
    }
}

fn assignee_column(
    key: &str,
    label: &str,
    assignee: Option<String>,
    cards: Vec<IssueAssigneeCard>,
) -> IssueAssigneeColumn {
    IssueAssigneeColumn {
        key: key.to_string(),
        label: label.to_string(),
        assignee,
        count: cards.len() as u32,
        cards,
    }
}

fn assignee_board_columns(issues: Vec<Issue>) -> Vec<IssueAssigneeColumn> {
    let mut unassigned = Vec::new();
    let mut assigned: BTreeMap<String, (String, Vec<IssueAssigneeCard>)> = BTreeMap::new();

    for issue in issues {
        let assignees: Vec<String> = issue
            .assignees
            .iter()
            .map(|assignee| assignee.trim())
            .filter(|assignee| !assignee.is_empty())
            .map(str::to_string)
            .collect();
        if assignees.is_empty() {
            unassigned.push(IssueAssigneeCard { issue });
            continue;
        }
        for assignee in assignees {
            let key = issue_assignee_key(&assignee);
            let entry = assigned
                .entry(key)
                .or_insert_with(|| (assignee, Vec::new()));
            entry.1.push(IssueAssigneeCard {
                issue: issue.clone(),
            });
        }
    }

    let mut columns = vec![assignee_column(
        "unassigned",
        "Unassigned",
        None,
        unassigned,
    )];
    columns.extend(assigned.into_iter().map(|(key, (assignee, cards))| {
        assignee_column(&key, &assignee, Some(assignee.clone()), cards)
    }));
    columns
}

fn issue_project_key(project_name: &str) -> String {
    let mut key = String::new();
    let mut last_dash = false;
    for byte in project_name.trim().bytes() {
        if byte.is_ascii_alphanumeric() {
            key.push(byte.to_ascii_lowercase() as char);
            last_dash = false;
        } else if !last_dash {
            key.push('-');
            last_dash = true;
        }
    }
    let key = key.trim_matches('-');
    if key.is_empty() {
        "project".to_string()
    } else {
        format!("project-{key}")
    }
}

fn project_column(
    key: &str,
    label: &str,
    project_name: Option<String>,
    cards: Vec<IssueProjectCard>,
) -> IssueProjectColumn {
    IssueProjectColumn {
        key: key.to_string(),
        label: label.to_string(),
        project_name,
        count: cards.len() as u32,
        cards,
    }
}

fn project_board_columns(issues: Vec<Issue>) -> Vec<IssueProjectColumn> {
    let mut unscoped = Vec::new();
    let mut scoped: BTreeMap<String, (String, Vec<IssueProjectCard>)> = BTreeMap::new();

    for issue in issues {
        let project_name = issue
            .project_name
            .as_deref()
            .map(str::trim)
            .filter(|project_name| !project_name.is_empty())
            .map(str::to_string);
        let Some(project_name) = project_name else {
            unscoped.push(IssueProjectCard { issue });
            continue;
        };
        let key = issue_project_key(&project_name);
        let entry = scoped
            .entry(key)
            .or_insert_with(|| (project_name, Vec::new()));
        entry.1.push(IssueProjectCard { issue });
    }

    let mut columns = vec![project_column("unscoped", "Unscoped", None, unscoped)];
    columns.extend(scoped.into_iter().map(|(key, (project_name, cards))| {
        project_column(&key, &project_name, Some(project_name.clone()), cards)
    }));
    columns
}

fn priority_column(
    key: &str,
    label: &str,
    priority: Option<&str>,
    cards: Vec<IssuePriorityCard>,
) -> IssuePriorityColumn {
    IssuePriorityColumn {
        key: key.to_string(),
        label: label.to_string(),
        priority: priority.map(str::to_string),
        count: cards.len() as u32,
        cards,
    }
}

fn priority_board_columns(issues: Vec<Issue>) -> Vec<IssuePriorityColumn> {
    let mut p0 = Vec::new();
    let mut p1 = Vec::new();
    let mut p2 = Vec::new();
    let mut p3 = Vec::new();
    let mut unprioritized = Vec::new();
    let mut closed = Vec::new();

    for issue in issues {
        let priority = issue_priority(&issue);
        let card = IssuePriorityCard {
            issue,
            priority: priority.as_ref().map(|priority| priority.key.to_string()),
            priority_label: priority
                .as_ref()
                .map(|priority| priority.source_label.clone()),
        };
        if matches!(card.issue.state, IssueState::Closed) {
            closed.push(card);
            continue;
        }
        match priority.map(|priority| priority.key) {
            Some("p0") => p0.push(card),
            Some("p1") => p1.push(card),
            Some("p2") => p2.push(card),
            Some("p3") => p3.push(card),
            _ => unprioritized.push(card),
        }
    }

    vec![
        priority_column("p0", "P0 critical", Some("p0"), p0),
        priority_column("p1", "P1 high", Some("p1"), p1),
        priority_column("p2", "P2 medium", Some("p2"), p2),
        priority_column("p3", "P3 low", Some("p3"), p3),
        priority_column("unprioritized", "No priority", None, unprioritized),
        priority_column("closed", "Closed", None, closed),
    ]
}

struct IssuePriority {
    key: &'static str,
    rank: u8,
    source_label: String,
}

fn issue_priority(issue: &Issue) -> Option<IssuePriority> {
    issue
        .labels
        .iter()
        .filter_map(|label| priority_from_label(label))
        .min_by_key(|priority| priority.rank)
}

fn priority_from_label(label: &str) -> Option<IssuePriority> {
    let normalized = normalize_priority_label(label);
    let key = match normalized.as_str() {
        "p0" | "0" | "critical" | "urgent" | "blocker" => "p0",
        "p1" | "1" | "high" => "p1",
        "p2" | "2" | "medium" | "normal" => "p2",
        "p3" | "3" | "low" | "minor" => "p3",
        _ => return None,
    };
    Some(IssuePriority {
        key,
        rank: priority_rank(key),
        source_label: label.trim().to_string(),
    })
}

fn normalize_priority_label(label: &str) -> String {
    let trimmed = label.trim().to_ascii_lowercase();
    let value = ["priority", "prio"]
        .into_iter()
        .find_map(|prefix| trimmed.strip_prefix(prefix))
        .unwrap_or(trimmed.as_str())
        .trim_start_matches(|ch| matches!(ch, ':' | '/' | '-'));
    value
        .trim_matches(|ch: char| !ch.is_ascii_alphanumeric())
        .to_string()
}

fn priority_rank(key: &str) -> u8 {
    match key {
        "p0" => 0,
        "p1" => 1,
        "p2" => 2,
        "p3" => 3,
        _ => u8::MAX,
    }
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
        // Idempotent on already-closed. Duplicate calls (admin
        // re-merge of a CLOSES_RELATION PR, reactor replay, double-
        // click) would otherwise overwrite closed_at/closed_by_ref/
        // state_reason and emit another `issues.closed` event,
        // bursting SSE consumers and double-counting downstream.
        // Matches the close_pull / merge_pull short-circuit in
        // ext_pull_requests.
        if stored.state == state_to_str(IssueState::Closed) {
            return Ok(stored.to_wit());
        }
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
        // Idempotent on already-open (either state="open" from
        // never-closed or state="reopened" from a prior reopen).
        // Without this guard, a no-op reopen would re-emit
        // `issues.reopened` and burst consumers.
        if stored.state != state_to_str(IssueState::Closed) {
            return Ok(stored.to_wit());
        }
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

    /// 0.1.8 — partial update of mutable issue fields. Only `Some`
    /// fields are applied; `None` leaves the stored field unchanged.
    /// `labels: Some([])` clears the label set; `labels: None` keeps
    /// the existing labels. `title` is trimmed and validated the same
    /// way as at open time. `updated-at` is bumped on every successful
    /// write.
    fn update_issue(input: UpdateIssueInput) -> Result<Issue, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode_stored_issue(&input.id, &snap.data)?;
        if let Some(title) = input.title {
            let title = title.trim().to_string();
            if title.is_empty() {
                return Err(err(ErrorCode::BadInput, "issue title must not be empty"));
            }
            if title.len() > MAX_TITLE_LEN {
                return Err(err(
                    ErrorCode::BadInput,
                    format!("issue title must be at most {MAX_TITLE_LEN} bytes"),
                ));
            }
            stored.title = title;
        }
        if let Some(body) = input.body_markdown {
            if body.len() > MAX_BODY_LEN {
                return Err(err(
                    ErrorCode::BadInput,
                    format!("issue body must be at most {MAX_BODY_LEN} bytes"),
                ));
            }
            stored.body_markdown = body;
        }
        if let Some(labels) = input.labels {
            // Trim + deduplicate, same as open-issue.
            let mut seen = std::collections::BTreeSet::new();
            stored.labels = labels
                .iter()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .filter(|s| seen.insert(s.clone()))
                .collect();
        }
        stored.updated_at = time::now_iso();
        let bytes = serde_json::to_vec(&stored)
            .map_err(|e| err(ErrorCode::Internal, format!("serialise issue: {e}")))?;
        storage::update_commit(COLLECTION, &input.id, &snap.version, &bytes)?;
        Ok(stored.to_wit())
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

    fn triage_board(input: IssueTriageBoardInput) -> Result<IssueTriageBoard, Error> {
        let issues = Self::list_issues(input.repository.clone(), input.limit)?;
        let mut cards = Vec::with_capacity(issues.len());
        for issue in issues {
            cards.push(IssueTriageCard { issue });
        }
        let total = cards.len() as u32;
        Ok(IssueTriageBoard {
            repository: input.repository,
            total,
            columns: triage_columns(cards),
        })
    }

    fn label_board(input: IssueLabelBoardInput) -> Result<IssueLabelBoard, Error> {
        let issues = Self::list_issues(input.repository.clone(), input.limit)?;
        let total = issues.len() as u32;
        Ok(IssueLabelBoard {
            repository: input.repository,
            total,
            columns: label_board_columns(issues),
        })
    }

    fn assignee_board(input: IssueAssigneeBoardInput) -> Result<IssueAssigneeBoard, Error> {
        let issues = Self::list_issues(input.repository.clone(), input.limit)?;
        let total = issues.len() as u32;
        Ok(IssueAssigneeBoard {
            repository: input.repository,
            total,
            columns: assignee_board_columns(issues),
        })
    }

    fn project_board(input: IssueProjectBoardInput) -> Result<IssueProjectBoard, Error> {
        let issues = Self::list_issues(input.repository.clone(), input.limit)?;
        let total = issues.len() as u32;
        Ok(IssueProjectBoard {
            repository: input.repository,
            total,
            columns: project_board_columns(issues),
        })
    }

    fn priority_board(input: IssuePriorityBoardInput) -> Result<IssuePriorityBoard, Error> {
        let issues = Self::list_issues(input.repository.clone(), input.limit)?;
        let total = issues.len() as u32;
        Ok(IssuePriorityBoard {
            repository: input.repository,
            total,
            columns: priority_board_columns(issues),
        })
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

#[cfg(test)]
mod tests {
    use super::*;

    fn issue(id: &str, state: IssueState) -> Issue {
        Issue {
            id: id.to_string(),
            repository: "comtrya://workspace/ws_test/repository/repo_test".to_string(),
            title: id.to_string(),
            body_markdown: String::new(),
            state,
            number: 1,
            author_ref: "comtrya://user/rawkode".to_string(),
            created_at: "2026-06-20T00:00:00Z".to_string(),
            updated_at: "2026-06-20T00:00:00Z".to_string(),
            closed_at: None,
            closed_by_ref: None,
            state_reason: None,
            project_name: None,
            labels: Vec::new(),
            close_on_merge: None,
            assignees: Vec::new(),
        }
    }

    fn card(issue: Issue) -> IssueTriageCard {
        IssueTriageCard { issue }
    }

    #[test]
    fn triage_columns_group_by_owner_policy_and_terminal_state() {
        let mut assigned = issue("assigned", IssueState::Open);
        assigned.assignees = vec!["comtrya://user/rawkode".to_string()];
        let mut manual = issue("manual", IssueState::Open);
        manual.close_on_merge = Some(false);
        manual.assignees = vec!["comtrya://user/rawkode".to_string()];

        let columns = triage_columns(vec![
            card(issue("needs-owner", IssueState::Open)),
            card(assigned),
            card(manual),
            card(issue("closed", IssueState::Closed)),
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(keys, ["needs-owner", "assigned", "manual-close", "closed"]);
        assert_eq!(columns.iter().map(|column| column.count).sum::<u32>(), 4);
        assert_eq!(columns[0].cards[0].issue.id, "needs-owner");
        assert_eq!(columns[1].cards[0].issue.id, "assigned");
        assert_eq!(columns[2].cards[0].issue.id, "manual");
        assert_eq!(columns[3].cards[0].issue.id, "closed");
    }

    #[test]
    fn label_board_columns_group_unlabeled_and_labeled_work() {
        let unlabeled = issue("unlabeled", IssueState::Open);
        let mut bug = issue("bug", IssueState::Open);
        bug.labels = vec!["kind::bug".to_string(), "priority::p1".to_string()];
        let mut ux = issue("ux", IssueState::Open);
        ux.labels = vec!["kind::ux".to_string()];

        let columns = label_board_columns(vec![unlabeled, bug, ux]);
        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();

        assert_eq!(
            keys,
            [
                "unlabeled",
                "label-kind-bug",
                "label-kind-ux",
                "label-priority-p1"
            ]
        );
        assert_eq!(columns[0].count, 1);
        assert_eq!(columns[0].cards[0].issue.id, "unlabeled");
        assert_eq!(columns[1].cards[0].issue.id, "bug");
        assert_eq!(columns[2].cards[0].issue.id, "ux");
        assert_eq!(columns[3].cards[0].issue.id, "bug");
    }

    #[test]
    fn assignee_board_columns_group_unassigned_and_multi_assigned_work() {
        let unassigned = issue("unassigned", IssueState::Open);
        let mut rawkode = issue("rawkode", IssueState::Open);
        rawkode.assignees = vec!["comtrya://user/rawkode".to_string()];
        let mut paired = issue("paired", IssueState::Open);
        paired.assignees = vec![
            "comtrya://team/platform-maintainers".to_string(),
            "comtrya://user/rawkode".to_string(),
        ];

        let columns = assignee_board_columns(vec![unassigned, rawkode, paired]);
        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();

        assert_eq!(
            keys,
            [
                "unassigned",
                "assignee-team-platform-maintainers",
                "assignee-user-rawkode",
            ]
        );
        assert_eq!(columns[0].assignee, None);
        assert_eq!(columns[0].cards[0].issue.id, "unassigned");
        assert_eq!(
            columns[1].assignee.as_deref(),
            Some("comtrya://team/platform-maintainers")
        );
        assert_eq!(columns[1].cards[0].issue.id, "paired");
        assert_eq!(columns[2].count, 2);
        assert_eq!(
            columns[2]
                .cards
                .iter()
                .map(|card| card.issue.id.as_str())
                .collect::<Vec<_>>(),
            ["rawkode", "paired"]
        );
    }

    #[test]
    fn project_board_columns_group_unscoped_and_project_work() {
        let unscoped = issue("unscoped", IssueState::Open);
        let mut kernel = issue("kernel", IssueState::Open);
        kernel.project_name = Some("kernel".to_string());
        let mut product = issue("product", IssueState::Open);
        product.project_name = Some("Product Design".to_string());
        let mut another_kernel = issue("another-kernel", IssueState::Open);
        another_kernel.project_name = Some("kernel".to_string());

        let columns = project_board_columns(vec![unscoped, kernel, product, another_kernel]);
        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();

        assert_eq!(
            keys,
            ["unscoped", "project-kernel", "project-product-design"]
        );
        assert_eq!(columns[0].project_name, None);
        assert_eq!(columns[0].cards[0].issue.id, "unscoped");
        assert_eq!(columns[1].project_name.as_deref(), Some("kernel"));
        assert_eq!(columns[1].count, 2);
        assert_eq!(columns[1].cards[0].issue.id, "kernel");
        assert_eq!(columns[1].cards[1].issue.id, "another-kernel");
        assert_eq!(columns[2].project_name.as_deref(), Some("Product Design"));
        assert_eq!(columns[2].cards[0].issue.id, "product");
    }

    #[test]
    fn priority_board_columns_group_active_work_by_highest_priority_label() {
        let unprioritized = issue("unprioritized", IssueState::Open);
        let mut p0 = issue("p0", IssueState::Open);
        p0.labels = vec!["priority::p0".to_string()];
        let mut p1 = issue("p1", IssueState::Open);
        p1.labels = vec!["kind::bug".to_string(), "high".to_string()];
        let mut p2 = issue("p2", IssueState::Open);
        p2.labels = vec!["priority:medium".to_string()];
        let mut p3 = issue("p3", IssueState::Open);
        p3.labels = vec!["prio/low".to_string()];
        let mut highest = issue("highest", IssueState::Open);
        highest.labels = vec!["priority::p3".to_string(), "priority::p1".to_string()];
        let mut closed = issue("closed", IssueState::Closed);
        closed.labels = vec!["priority::p0".to_string()];

        let columns = priority_board_columns(vec![unprioritized, p0, p1, p2, p3, highest, closed]);
        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();

        assert_eq!(keys, ["p0", "p1", "p2", "p3", "unprioritized", "closed"]);
        assert_eq!(columns[0].cards[0].issue.id, "p0");
        assert_eq!(columns[0].cards[0].priority.as_deref(), Some("p0"));
        assert_eq!(
            columns[0].cards[0].priority_label.as_deref(),
            Some("priority::p0")
        );
        assert_eq!(
            columns[1]
                .cards
                .iter()
                .map(|card| card.issue.id.as_str())
                .collect::<Vec<_>>(),
            ["p1", "highest"]
        );
        assert_eq!(
            columns[1].cards[1].priority_label.as_deref(),
            Some("priority::p1")
        );
        assert_eq!(columns[2].cards[0].issue.id, "p2");
        assert_eq!(columns[3].cards[0].issue.id, "p3");
        assert_eq!(columns[4].cards[0].issue.id, "unprioritized");
        assert_eq!(columns[4].cards[0].priority, None);
        assert_eq!(columns[5].cards[0].issue.id, "closed");
        assert_eq!(columns[5].cards[0].priority.as_deref(), Some("p0"));
    }
}
