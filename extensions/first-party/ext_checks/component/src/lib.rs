// ext_checks — WASM Component-Model implementation of `checks.wit`.

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
    workspace_id: Option<String>,
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
            conclusion: self.conclusion.clone(),
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
        "RUNNING" => CheckState::Running,
        "SUCCESS" => CheckState::Succeeded,
        "FAILURE" => CheckState::Failed,
        "SKIPPED" => CheckState::Skipped,
        _ => CheckState::Pending,
    }
}

struct RepositoryScope {
    workspace_id: Option<String>,
    repository_id: Option<String>,
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

fn validate_record_repository_scope(scope: &RepositoryScope) -> Result<(), Error> {
    if scope
        .repository_id
        .as_deref()
        .is_some_and(|repository_id| !repository_id.trim().is_empty())
    {
        return Ok(());
    }
    Err(err(
        ErrorCode::BadInput,
        "checks.record requires a repository-scoped check run",
    ))
}

fn repository_matches(stored: &StoredCheck, repository: &str) -> bool {
    if repository == "comtrya://checks" {
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
    if let Some(repository) = scope.repository_id.as_deref() {
        return stored.repository_id.as_deref() == Some(repository);
    }
    scope.workspace_id.is_some()
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

fn persist_new(stored: &StoredCheck) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise check: {error}")))?;
    let mut refs = vec![stored.repository.clone()];
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
        let scope = repository_scope(repository);
        validate_record_repository_scope(&scope)?;
        let id = ids::mint("check-run")?;
        let now = time::now_iso();
        let state = state_to_str(input.state).to_string();
        let conclusion = input
            .conclusion
            .as_deref()
            .map(str::trim)
            .filter(|conclusion| !conclusion.is_empty())
            .map(str::to_ascii_uppercase)
            .unwrap_or_else(|| state.clone());
        let stored = StoredCheck {
            id: id.clone(),
            repository: repository.to_string(),
            workspace_id: scope.workspace_id,
            repository_id: scope.repository_id,
            commit_oid: input.commit_oid,
            name: name.to_string(),
            state: state.clone(),
            conclusion,
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
