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
        "RUNNING" | "running" => CheckState::Running,
        "SUCCESS" | "SUCCEEDED" | "succeeded" => CheckState::Succeeded,
        "FAILURE" | "FAILED" | "failed" => CheckState::Failed,
        "ACTION_REQUIRED" | "action-required" | "action_required" => CheckState::Failed,
        "SKIPPED" | "skipped" => CheckState::Skipped,
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
    let mut value: serde_json::Value = serde_json::from_slice(bytes)
        .map_err(|error| err(ErrorCode::Internal, format!("parse check {id}: {error}")))?;
    normalize_legacy_check_value(id, &mut value)?;
    serde_json::from_value(value)
        .map_err(|error| err(ErrorCode::Internal, format!("parse check {id}: {error}")))
}

fn normalize_legacy_check_value(id: &str, value: &mut serde_json::Value) -> Result<(), Error> {
    let Some(obj) = value.as_object_mut() else {
        return Err(err(
            ErrorCode::Internal,
            format!("check {id} is not an object"),
        ));
    };
    if !obj.contains_key("id") {
        let suffix = obj
            .get("name")
            .and_then(serde_json::Value::as_str)
            .map(stable_suffix)
            .filter(|suffix| !suffix.is_empty())
            .unwrap_or_else(|| "legacy".to_string());
        obj.insert(
            "id".to_string(),
            serde_json::Value::String(format!("chk_legacy_{suffix}")),
        );
    }
    if !obj.contains_key("repositoryId") {
        if let Some(repository_id) = obj.get("repositoryID").cloned() {
            obj.insert("repositoryId".to_string(), repository_id);
        }
    }
    if !obj.contains_key("workspaceId") {
        if let Some(workspace_id) = obj.get("workspaceID").cloned() {
            obj.insert("workspaceId".to_string(), workspace_id);
        }
    }
    if !obj.contains_key("repository") {
        let workspace_id = obj.get("workspaceId").and_then(serde_json::Value::as_str);
        let repository_id = obj.get("repositoryId").and_then(serde_json::Value::as_str);
        obj.insert(
            "repository".to_string(),
            serde_json::Value::String(repository_uri_from_scope(workspace_id, repository_id)),
        );
    }
    obj.entry("commitOID".to_string())
        .or_insert_with(|| serde_json::Value::String("unknown".to_string()));
    obj.entry("name".to_string())
        .or_insert_with(|| serde_json::Value::String("check run".to_string()));
    if !obj.contains_key("conclusion") {
        let conclusion = obj
            .get("state")
            .and_then(serde_json::Value::as_str)
            .map(str::to_ascii_uppercase)
            .unwrap_or_else(|| "PENDING".to_string());
        obj.insert(
            "conclusion".to_string(),
            serde_json::Value::String(conclusion),
        );
    }
    if !obj.contains_key("state") {
        let state = obj
            .get("conclusion")
            .and_then(serde_json::Value::as_str)
            .map(str::to_ascii_uppercase)
            .unwrap_or_else(|| "PENDING".to_string());
        obj.insert("state".to_string(), serde_json::Value::String(state));
    }
    obj.entry("required".to_string())
        .or_insert(serde_json::Value::Bool(false));
    obj.entry("createdAt".to_string())
        .or_insert_with(|| serde_json::Value::String("1970-01-01T00:00:00Z".to_string()));
    obj.entry("updatedAt".to_string())
        .or_insert_with(|| serde_json::Value::String("1970-01-01T00:00:00Z".to_string()));
    Ok(())
}

fn stable_suffix(value: &str) -> String {
    value
        .bytes()
        .filter_map(|byte| {
            if byte.is_ascii_alphanumeric() {
                Some((byte as char).to_ascii_lowercase())
            } else if byte == b'-' || byte == b'_' || byte == b' ' {
                Some('_')
            } else {
                None
            }
        })
        .collect::<String>()
        .trim_matches('_')
        .to_string()
}

fn repository_uri_from_scope(workspace_id: Option<&str>, repository_id: Option<&str>) -> String {
    match (workspace_id, repository_id) {
        (Some(workspace), Some(repository)) => {
            format!("comtrya://workspace/{workspace}/repository/{repository}")
        }
        (Some(workspace), None) => format!("comtrya://workspace/{workspace}"),
        (None, Some(repository)) => format!("comtrya://repository/{repository}"),
        (None, None) => "comtrya://checks".to_string(),
    }
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
