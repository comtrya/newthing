// ext_pull_requests — WASM Component-Model implementation of `pull-requests.wit`.

mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::identity;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::ops;
use bindings::comtrya::platform::relations;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_pull_requests::pulls::{
    ClosePullInput, CreatePullInput, Guest as PullsGuest, MergePullInput, PrState, PullRequest,
};
use bindings::exports::comtrya::platform::reactor::{
    Guest as ReactorGuest, MutationCall, Reaction,
};

use serde::{Deserialize, Serialize};

const COLLECTION: &str = "pull_requests";
const PULL_MERGED_EVENT: &str = "dev.comtrya.pull-request.merged";
const CLOSES_RELATION: &str = "comtrya://rel/com.comtrya.pulls/closes";
const ISSUE_REF_PREFIX: &str = "comtrya://issue/";
const CLOSE_ISSUE_MUTATION: &str = "ext_issues/issues.close-issue";
const BY_REF_ISSUE_OP: &str = "issues.by-ref-issue";
const MAX_TITLE_LEN: usize = 512;
const MAX_BODY_LEN: usize = 64 * 1024;

/// Minimal projection of the issue record we need from
/// `ext_issues/issues.by-ref-issue` to decide whether the reactor
/// should skip auto-close. We deliberately don't deserialise the
/// full issue — extra fields are tolerated, missing ones default to
/// `None`.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct IssueClosePolicySnapshot {
    #[serde(default)]
    close_on_merge: Option<bool>,
}

struct Component;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredPullRequest {
    id: String,
    repository: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    workspace_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    repository_id: Option<String>,
    number: u64,
    title: String,
    body_markdown: String,
    state: String,
    base: String,
    head: String,
    author_ref: String,
    created_at: String,
    updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    merged_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    merged_by_ref: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    closed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    closed_by_ref: Option<String>,
}

impl StoredPullRequest {
    fn workspace_uri(&self) -> Option<String> {
        self.workspace_id
            .as_ref()
            .map(|workspace| format!("comtrya://workspace/{workspace}"))
    }

    fn to_wit(&self) -> PullRequest {
        PullRequest {
            id: self.id.clone(),
            repository: self.repository.clone(),
            workspace: self.workspace_uri(),
            number: self.number,
            title: self.title.clone(),
            body_markdown: self.body_markdown.clone(),
            state: state_from_str(&self.state),
            author_ref: self.author_ref.clone(),
            head_ref: self.head.clone(),
            base_ref: self.base.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
            merged_at: self.merged_at.clone(),
            merged_by_ref: self.merged_by_ref.clone(),
            closed_at: self.closed_at.clone(),
            closed_by_ref: self.closed_by_ref.clone(),
        }
    }
}

struct RepositoryScope {
    workspace_id: Option<String>,
    repository_id: Option<String>,
}

fn err(code: ErrorCode, message: impl Into<String>) -> Error {
    Error {
        code,
        message: message.into(),
        path: None,
    }
}

fn state_to_str(state: PrState) -> &'static str {
    match state {
        PrState::Draft => "DRAFT",
        PrState::Ready => "READY",
        PrState::Merged => "MERGED",
        PrState::Closed => "CLOSED",
    }
}

fn state_from_str(state: &str) -> PrState {
    match state {
        "READY" => PrState::Ready,
        "MERGED" => PrState::Merged,
        "CLOSED" => PrState::Closed,
        _ => PrState::Draft,
    }
}

fn repository_scope(repository: &str) -> RepositoryScope {
    let Some(rest) = repository.strip_prefix("comtrya://") else {
        return RepositoryScope {
            workspace_id: None,
            repository_id: None,
        };
    };
    if let Some(rest) = rest.strip_prefix("workspace/") {
        if let Some((workspace, repository)) = rest.split_once("/repository/") {
            return RepositoryScope {
                workspace_id: Some(workspace.to_string()),
                repository_id: Some(repository.to_string()),
            };
        }
        return RepositoryScope {
            workspace_id: Some(rest.to_string()),
            repository_id: None,
        };
    }
    RepositoryScope {
        workspace_id: None,
        repository_id: rest.strip_prefix("repository/").map(str::to_string),
    }
}

fn validate_create_repository_scope(
    repository: &str,
    scope: &RepositoryScope,
) -> Result<(), Error> {
    let Some(workspace_id) = scope.workspace_id.as_deref() else {
        return Err(err(
            ErrorCode::BadInput,
            "pulls.create requires a workspace-scoped repository",
        ));
    };
    if workspace_id.trim().is_empty() {
        return Err(err(
            ErrorCode::BadInput,
            "pulls.create requires a workspace-scoped repository",
        ));
    }
    if repository.starts_with("comtrya://workspace/")
        && repository.contains("/repository/")
        && scope
            .repository_id
            .as_deref()
            .is_none_or(|repository_id| repository_id.trim().is_empty())
    {
        return Err(err(
            ErrorCode::BadInput,
            "pulls.create repository id must not be empty",
        ));
    }
    Ok(())
}

fn repository_matches(stored: &StoredPullRequest, repository: &str) -> bool {
    if repository == "comtrya://pulls" {
        return true;
    }
    if stored.repository == repository {
        return true;
    }
    let scope = repository_scope(repository);
    if let Some(workspace) = scope.workspace_id.as_deref() {
        if stored
            .workspace_id
            .as_deref()
            .map(|stored_workspace| stored_workspace != workspace)
            .unwrap_or(false)
        {
            return false;
        }
    }
    if let Some(repository_id) = scope.repository_id.as_deref() {
        if stored.repository_id.as_deref() != Some(repository_id) {
            return false;
        }
    }
    scope.workspace_id.is_some() || scope.repository_id.is_some()
}

fn decode(id: &str, bytes: &[u8]) -> Result<StoredPullRequest, Error> {
    serde_json::from_slice(bytes).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("parse pull request {id}: {error}"),
        )
    })
}

fn read_stored(id: &str) -> Result<Option<StoredPullRequest>, Error> {
    let Some(snap) = storage::get(COLLECTION, id)? else {
        return Ok(None);
    };
    Ok(Some(decode(id, &snap.data)?))
}

fn scan_pull_requests(
    mut visit: impl FnMut(StoredPullRequest) -> Result<bool, Error>,
) -> Result<(), Error> {
    let mut after = None;
    loop {
        let page = storage::list_all(COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let Ok(stored) = decode("<list>", &bytes) else {
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

fn next_number(scope: &RepositoryScope) -> Result<u64, Error> {
    let mut max = 0;
    scan_pull_requests(|stored| {
        let workspace_matches = scope
            .workspace_id
            .as_deref()
            .map(|workspace| {
                stored
                    .workspace_id
                    .as_deref()
                    .map(|stored_workspace| stored_workspace == workspace)
                    .unwrap_or(true)
            })
            .unwrap_or(true);
        if workspace_matches {
            max = max.max(stored.number);
        }
        Ok(false)
    })?;
    Ok(max + 1)
}

fn persist_new(stored: &StoredPullRequest) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise pull request: {error}"),
        )
    })?;
    let pr_ref = pull_request_uri(&stored.id);
    let mut refs = vec![pr_ref.clone(), stored.repository.clone()];
    if let Some(workspace_id) = &stored.workspace_id {
        refs.push(format!("comtrya://workspace/{workspace_id}"));
    }
    if let Some(repository_id) = &stored.repository_id {
        refs.push(format!("comtrya://repository/{repository_id}"));
    }
    storage::create(
        COLLECTION,
        &stored.id,
        &bytes,
        &storage::DocumentMetadata {
            resource_uri: pr_ref,
            resource_refs: refs,
        },
    )
}

fn commit_update(id: &str, stored: &StoredPullRequest, version: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise pull request: {error}"),
        )
    })?;
    storage::update_commit(COLLECTION, id, version, &bytes)
}

fn emit(event_type: &str, payload: &impl Serialize, source_uri: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(payload)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise event: {error}")))?;
    let _ = events::append(event_type, &bytes, Some(source_uri))?;
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PullEventPayload<'a> {
    pull_request_ref: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    workspace_id: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    number: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    merged_at: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    merged_by_ref: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    closed_by_ref: Option<&'a str>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PullMergedEventPayload {
    pull_request_ref: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CloseIssueReactionPayload<'a> {
    id: &'a str,
    reason: &'a str,
    closed_by_ref: &'a str,
}

fn pull_request_uri(id: &str) -> String {
    format!("comtrya://pull_request/{id}")
}

impl PullsGuest for Component {
    fn create_pull(input: CreatePullInput) -> Result<PullRequest, Error> {
        let repository = input.repository.trim();
        if repository.is_empty() {
            return Err(err(
                ErrorCode::BadInput,
                "pulls.create requires a repository",
            ));
        }
        let title = input.title.trim();
        if title.is_empty() {
            return Err(err(
                ErrorCode::BadInput,
                "pull-request title must not be empty",
            ));
        }
        if title.len() > MAX_TITLE_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("title must be at most {MAX_TITLE_LEN} bytes"),
            ));
        }
        if input.body_markdown.len() > MAX_BODY_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("body must be at most {MAX_BODY_LEN} bytes"),
            ));
        }
        if input.base_ref.is_empty() || input.head_ref.is_empty() {
            return Err(err(
                ErrorCode::BadInput,
                "base and head branches must be non-empty",
            ));
        }
        let id = ids::mint("pull-request")?;
        let now = time::now_iso();
        let scope = repository_scope(repository);
        validate_create_repository_scope(repository, &scope)?;
        let number = next_number(&scope)?;
        let author = match input.author_ref {
            Some(author) => author,
            None => identity::current_principal()?,
        };
        let stored = StoredPullRequest {
            id: id.clone(),
            repository: repository.to_string(),
            workspace_id: scope.workspace_id,
            repository_id: scope.repository_id,
            number,
            title: title.to_string(),
            body_markdown: input.body_markdown,
            state: state_to_str(PrState::Draft).to_string(),
            base: input.base_ref,
            head: input.head_ref,
            author_ref: author,
            created_at: now.clone(),
            updated_at: now,
            merged_at: None,
            merged_by_ref: None,
            closed_at: None,
            closed_by_ref: None,
        };
        persist_new(&stored)?;
        let pr_ref = pull_request_uri(&stored.id);
        emit(
            "dev.comtrya.pull-request.created",
            &PullEventPayload {
                pull_request_ref: &pr_ref,
                workspace_id: stored.workspace_id.as_deref(),
                number: Some(stored.number),
                merged_at: None,
                merged_by_ref: None,
                closed_by_ref: None,
            },
            &pr_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn merge_pull(input: MergePullInput) -> Result<PullRequest, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        match stored.state.as_str() {
            "MERGED" => return Ok(stored.to_wit()),
            "CLOSED" => {
                return Err(err(
                    ErrorCode::Conflict,
                    "cannot merge a CLOSED pull request",
                ));
            }
            _ => {}
        }
        let now = time::now_iso();
        stored.state = state_to_str(PrState::Merged).to_string();
        stored.updated_at = now.clone();
        stored.merged_at = Some(now.clone());
        stored.merged_by_ref = input.merged_by_ref.clone();
        commit_update(&input.id, &stored, &snap.version)?;
        let pr_ref = pull_request_uri(&input.id);
        emit(
            PULL_MERGED_EVENT,
            &PullEventPayload {
                pull_request_ref: &pr_ref,
                workspace_id: stored.workspace_id.as_deref(),
                number: Some(stored.number),
                merged_at: stored.merged_at.as_deref(),
                merged_by_ref: input.merged_by_ref.as_deref(),
                closed_by_ref: None,
            },
            &pr_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn close_pull(input: ClosePullInput) -> Result<PullRequest, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        match stored.state.as_str() {
            "MERGED" => {
                return Err(err(
                    ErrorCode::Conflict,
                    "cannot close a MERGED pull request",
                ));
            }
            "CLOSED" => return Ok(stored.to_wit()),
            _ => {}
        }
        let now = time::now_iso();
        stored.state = state_to_str(PrState::Closed).to_string();
        stored.updated_at = now;
        stored.closed_at = Some(stored.updated_at.clone());
        stored.closed_by_ref = input.closed_by_ref.clone();
        commit_update(&input.id, &stored, &snap.version)?;
        let pr_ref = pull_request_uri(&input.id);
        emit(
            "dev.comtrya.pull-request.closed",
            &PullEventPayload {
                pull_request_ref: &pr_ref,
                workspace_id: stored.workspace_id.as_deref(),
                number: Some(stored.number),
                merged_at: None,
                merged_by_ref: None,
                closed_by_ref: input.closed_by_ref.as_deref(),
            },
            &pr_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn get_pull(id: String) -> Result<Option<PullRequest>, Error> {
        Ok(read_stored(&id)?.map(|stored| stored.to_wit()))
    }

    fn list_pulls(repository: String, limit: u32) -> Result<Vec<PullRequest>, Error> {
        let limit = limit.min(1024) as usize;
        let mut out = Vec::new();
        scan_pull_requests(|stored| {
            if repository_matches(&stored, &repository) {
                out.push(stored.to_wit());
                if out.len() >= limit {
                    return Ok(true);
                }
            }
            Ok(false)
        })?;
        Ok(out)
    }
}

impl ReactorGuest for Component {
    fn subscribed_event_types() -> Result<Vec<String>, Error> {
        Ok(vec![PULL_MERGED_EVENT.to_string()])
    }

    fn on_event(triggering_event: Event) -> Result<Vec<Reaction>, Error> {
        if triggering_event.event_type != PULL_MERGED_EVENT {
            return Ok(Vec::new());
        }
        let payload: PullMergedEventPayload = serde_json::from_slice(&triggering_event.payload)
            .map_err(|error| {
                err(
                    ErrorCode::BadInput,
                    format!("parse pull request merged event: {error}"),
                )
            })?;
        if payload.pull_request_ref.trim().is_empty() {
            return Ok(Vec::new());
        }
        let page =
            relations::outgoing(&payload.pull_request_ref, Some(CLOSES_RELATION), 1024, None)?;
        let mut reactions = Vec::new();
        for relation in page.relations {
            let Some(issue_id) = relation.target.strip_prefix(ISSUE_REF_PREFIX) else {
                continue;
            };
            if issue_id.trim().is_empty() {
                continue;
            }
            // CUE-driven policy: ask ext_issues for the issue, and if
            // `close-on-merge` was stamped `false` at open time, skip
            // the close. `None` keeps the historical behaviour
            // (always close).
            if let Some(false) = issue_close_on_merge(&relation.target) {
                continue;
            }
            let reaction_payload = serde_json::to_vec(&CloseIssueReactionPayload {
                id: issue_id,
                reason: "completed",
                closed_by_ref: &payload.pull_request_ref,
            })
            .map_err(|error| {
                err(
                    ErrorCode::Internal,
                    format!("serialise close issue reaction: {error}"),
                )
            })?;
            reactions.push(Reaction::InvokeMutation(MutationCall {
                name: CLOSE_ISSUE_MUTATION.to_string(),
                payload: reaction_payload,
            }));
        }
        Ok(reactions)
    }
}

/// Look up an issue's `close-on-merge` policy via the kernel's
/// cross-extension op broker. Returns `None` when the field is unset
/// (legacy / unscoped issue) or any error happens — the caller then
/// applies the historical default.
fn issue_close_on_merge(issue_ref: &str) -> Option<bool> {
    let payload = serde_json::to_vec(issue_ref).ok()?;
    let response = ops::invoke("ext_issues", BY_REF_ISSUE_OP, &payload).ok()?;
    let snapshot: IssueClosePolicySnapshot = serde_json::from_slice(&response).ok()?;
    snapshot.close_on_merge
}

bindings::export!(Component with_types_in bindings);
