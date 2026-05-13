// ext_checks — WASM Component-Model implementation of `checks.wit`.

#[allow(warnings)]
mod bindings;

use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_checks::checks::{
    CheckRun, CheckState, Guest as ChecksGuest, RecordCheckInput,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};

const COLLECTION: &str = "check_runs";

struct Component;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredCheck {
    id: String,
    repository: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    repository_id: Option<String>,
    #[serde(rename = "commitOID")]
    commit_oid: String,
    name: String,
    state: String,
    conclusion: String,
    required: bool,
    created_at: String,
    updated_at: String,
}

impl StoredCheck {
    fn to_wit(&self) -> CheckRun {
        CheckRun {
            id: self.id.clone(),
            repository: self.repository.clone(),
            commit_oid: self.commit_oid.clone(),
            name: self.name.clone(),
            state: state_from_str(&self.state),
            required: self.required,
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
        }
    }
}

fn err(code: ErrorCode, message: impl Into<String>) -> Error {
    Error {
        code,
        message: message.into(),
        path: None,
    }
}

fn state_to_str(state: CheckState) -> &'static str {
    match state {
        CheckState::Pending => "PENDING",
        CheckState::Running => "RUNNING",
        CheckState::Succeeded => "SUCCESS",
        CheckState::Failed => "FAILURE",
        CheckState::Skipped => "SKIPPED",
    }
}

fn state_from_str(state: &str) -> CheckState {
    match state {
        "RUNNING" | "running" => CheckState::Running,
        "SUCCESS" | "SUCCEEDED" | "succeeded" => CheckState::Succeeded,
        "FAILURE" | "FAILED" | "failed" => CheckState::Failed,
        "SKIPPED" | "skipped" => CheckState::Skipped,
        _ => CheckState::Pending,
    }
}

fn repository_id(repository: &str) -> Option<String> {
    repository
        .strip_prefix("comtrya://repository/")
        .map(str::to_string)
        .or_else(|| {
            repository
                .strip_prefix("comtrya://workspace/")
                .and_then(|rest| {
                    rest.split_once("/repository/")
                        .map(|(_, repo)| repo.to_string())
                })
        })
}

fn repository_matches(stored: &StoredCheck, repository: &str) -> bool {
    if repository == "comtrya://checks" {
        return true;
    }
    if stored.repository == repository {
        return true;
    }
    repository_id(repository)
        .as_deref()
        .is_some_and(|id| stored.repository_id.as_deref() == Some(id))
}

fn decode(id: &str, bytes: &[u8]) -> Result<StoredCheck, Error> {
    serde_json::from_slice(bytes)
        .map_err(|error| err(ErrorCode::Internal, format!("parse check {id}: {error}")))
}

fn scan_checks(mut visit: impl FnMut(StoredCheck) -> Result<bool, Error>) -> Result<(), Error> {
    let mut after = None;
    loop {
        let page = storage::list_all(COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            if visit(decode("<list>", &bytes)?)? {
                return Ok(());
            }
        }
        match page.next_page {
            Some(next) => after = Some(next),
            None => return Ok(()),
        }
    }
}

fn persist_new(stored: &StoredCheck) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise check: {error}")))?;
    let mut refs = vec![stored.repository.clone()];
    if let Some(repository_id) = &stored.repository_id {
        refs.push(format!("comtrya://repository/{repository_id}"));
    }
    storage::create(
        COLLECTION,
        &stored.id,
        &bytes,
        &storage::DocumentMetadata {
            resource_uri: format!("comtrya://check/{}", stored.id),
            resource_refs: refs,
        },
    )
}

impl ChecksGuest for Component {
    fn record_check(input: RecordCheckInput) -> Result<CheckRun, Error> {
        let repository = input.repository.trim();
        if repository.is_empty() {
            return Err(err(ErrorCode::BadInput, "check requires a repository"));
        }
        if input.commit_oid.trim().is_empty() {
            return Err(err(ErrorCode::BadInput, "check requires a commit OID"));
        }
        let name = input.name.trim();
        if name.is_empty() {
            return Err(err(ErrorCode::BadInput, "check requires a name"));
        }
        let id = ids::mint("check-run")?;
        let now = time::now_iso();
        let state = state_to_str(input.state).to_string();
        let stored = StoredCheck {
            id: id.clone(),
            repository: repository.to_string(),
            repository_id: repository_id(repository),
            commit_oid: input.commit_oid,
            name: name.to_string(),
            state: state.clone(),
            conclusion: state,
            required: input.required,
            created_at: now.clone(),
            updated_at: now,
        };
        persist_new(&stored)?;
        Ok(stored.to_wit())
    }

    fn list_checks(repository: String, limit: u32) -> Result<Vec<CheckRun>, Error> {
        let limit = limit.min(1024) as usize;
        let mut out = Vec::new();
        scan_checks(|stored| {
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
        Ok(Vec::new())
    }

    fn on_event(_triggering_event: Event) -> Result<Vec<Reaction>, Error> {
        Ok(Vec::new())
    }
}

bindings::export!(Component with_types_in bindings);
