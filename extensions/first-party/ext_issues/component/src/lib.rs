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
    CloseIssueInput, Guest as IssuesGuest, Issue, IssueState, OpenIssueInput,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};

const COLLECTION: &str = "issues";

struct Component;

// ---- record shape persisted to storage ----

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredIssue {
    id: String,
    repository: String,
    title: String,
    body_markdown: String,
    /// Uppercase ("OPEN" / "CLOSED" / "REOPENED") to match the legacy
    /// GraphQL surface the Astro frontend reads. The WIT-side
    /// `issue-state` enum is lowercase; conversion happens in
    /// `state_to_str` / `state_from_str`.
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
}

impl StoredIssue {
    fn to_wit(&self) -> Issue {
        Issue {
            id: self.id.clone(),
            repository: self.repository.clone(),
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
        }
    }
}

fn state_to_str(state: IssueState) -> &'static str {
    // Uppercase to match the legacy GraphQL surface.
    match state {
        IssueState::Open => "OPEN",
        IssueState::Closed => "CLOSED",
        IssueState::Reopened => "REOPENED",
    }
}

fn state_from_str(s: &str) -> IssueState {
    // Accept either case so reads work on data written by either path
    // during the M3→M4 cutover.
    match s {
        "CLOSED" | "closed" => IssueState::Closed,
        "REOPENED" | "reopened" => IssueState::Reopened,
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

/// Return the next sequential issue number for `repository` and
/// increment the persisted counter atomically. Uses the OCC two-step
/// update on a `_meta`-collection counter document keyed by the
/// repository URI so two concurrent `open-issue` calls cannot collide
/// on a number, and there's no O(N) scan or 1024-row cap.
fn next_issue_number(repository: &str) -> Result<u64, Error> {
    let counter_id = format!("issue-number:{}", repository);
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
        Err(Error { code: ErrorCode::NotFound, .. }) => {
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
                    resource_refs: vec![repository.to_string()],
                },
            )?;
            Ok(1)
        }
        Err(other) => Err(other),
    }
}

fn persist_new(stored: &StoredIssue) -> Result<(), Error> {
    let data = serde_json::to_vec(stored).map_err(|e| {
        err(ErrorCode::Internal, format!("serialise issue: {e}"))
    })?;
    storage::create(
        COLLECTION,
        &stored.id,
        &data,
        &storage::DocumentMetadata {
            resource_uri: format!("comtrya://issue/{}", stored.id),
            resource_refs: vec![stored.repository.clone()],
        },
    )
}

fn read_stored(id: &str) -> Result<Option<StoredIssue>, Error> {
    let Some(snap) = storage::get(COLLECTION, id)? else {
        return Ok(None);
    };
    let stored: StoredIssue = serde_json::from_slice(&snap.data).map_err(|e| {
        err(ErrorCode::Internal, format!("parse issue {}: {e}", id))
    })?;
    Ok(Some(stored))
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
        if input.title.trim().is_empty() {
            return Err(err(ErrorCode::BadInput, "title is required"));
        }
        let id = ids::mint("issue")?;
        let now = time::now_iso();
        let author = identity::current_principal()?;
        let number = next_issue_number(&input.repository)?;
        let stored = StoredIssue {
            id: id.clone(),
            repository: input.repository.clone(),
            title: input.title.clone(),
            body_markdown: input.body_markdown,
            state: state_to_str(IssueState::Open).to_string(),
            number,
            author_ref: author,
            created_at: now.clone(),
            updated_at: now,
            closed_at: None,
            closed_by_ref: None,
            state_reason: None,
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
        let mut stored: StoredIssue = serde_json::from_slice(&snap.data)
            .map_err(|e| err(ErrorCode::Internal, format!("parse issue: {e}")))?;
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
        let mut stored: StoredIssue = serde_json::from_slice(&snap.data)
            .map_err(|e| err(ErrorCode::Internal, format!("parse issue: {e}")))?;
        let now = time::now_iso();
        // The legacy GraphQL surface returns state=OPEN on reopen (not
        // a separate REOPENED). Match that so frontend filters keep
        // working.
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

    fn get_issue(id: String) -> Result<Option<Issue>, Error> {
        Ok(read_stored(&id)?.map(|s| s.to_wit()))
    }

    fn list_issues(repository: String, limit: u32) -> Result<Vec<Issue>, Error> {
        // TODO(M2): once `storage.query` supports indexed lookup by
        // repository, replace this list-and-filter scan with an indexed
        // query. Today's host-side `storage.query` returns all docs in
        // the collection up to `limit` without filtering, so the
        // in-component filter is the only option. Cap at 1024 matches
        // the kernel's `storage.list_all` cap; the caller-supplied
        // limit is honoured beneath that. When `limit` is too low to
        // hold all of `repository`'s issues, the result is silently
        // truncated — Issue tracker rendering must handle pagination
        // when the new query lands.
        let limit = limit.min(1024);
        let page = storage::list_all(COLLECTION, limit, None)?;
        let mut out = Vec::new();
        for bytes in page.docs {
            if let Ok(stored) = serde_json::from_slice::<StoredIssue>(&bytes) {
                if stored.repository == repository {
                    out.push(stored.to_wit());
                }
            }
        }
        Ok(out)
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct IssueEventPayload<'a> {
    id: &'a str,
    repository: &'a str,
    number: u64,
    state: &'a str,
}

fn issue_event_payload(issue: &Issue) -> IssueEventPayload<'_> {
    IssueEventPayload {
        id: &issue.id,
        repository: &issue.repository,
        number: issue.number,
        state: state_to_str(issue.state),
    }
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
