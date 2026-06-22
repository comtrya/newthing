// ext_checks — WASM Component-Model implementation of `checks.wit`.

mod bindings;

use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_checks::checks::{
    CheckReadinessBoard, CheckReadinessBoardInput, CheckReadinessCard, CheckReadinessColumn,
    CheckRun, CheckState, ExpectedCheck, ExpectedCheckReadinessBoard,
    ExpectedCheckReadinessBoardInput, ExpectedCheckReadinessCard, ExpectedCheckReadinessColumn,
    Guest as ChecksGuest, RecordCheckInput,
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

enum ReadinessLane {
    RequiredAction,
    Missing,
    OptionalFailures,
    InProgress,
    Passing,
}

fn readiness_lane(check: &CheckRun) -> ReadinessLane {
    match check.state {
        CheckState::Pending | CheckState::Running => ReadinessLane::InProgress,
        CheckState::Failed if check.required => ReadinessLane::RequiredAction,
        CheckState::Failed => ReadinessLane::OptionalFailures,
        CheckState::Succeeded | CheckState::Skipped => ReadinessLane::Passing,
    }
}

fn readiness_column(
    key: &str,
    label: &str,
    cards: Vec<CheckReadinessCard>,
) -> CheckReadinessColumn {
    CheckReadinessColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn expected_readiness_column(
    key: &str,
    label: &str,
    cards: Vec<ExpectedCheckReadinessCard>,
) -> ExpectedCheckReadinessColumn {
    ExpectedCheckReadinessColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn readiness_columns(checks: Vec<CheckRun>) -> Vec<CheckReadinessColumn> {
    let mut required_action = Vec::new();
    let mut optional_failures = Vec::new();
    let mut in_progress = Vec::new();
    let mut passing = Vec::new();

    for check in checks {
        let lane = readiness_lane(&check);
        let card = CheckReadinessCard {
            blocking: matches!(lane, ReadinessLane::RequiredAction),
            check,
        };
        match lane {
            ReadinessLane::RequiredAction => required_action.push(card),
            ReadinessLane::Missing => unreachable!("recorded check cards are never missing"),
            ReadinessLane::OptionalFailures => optional_failures.push(card),
            ReadinessLane::InProgress => in_progress.push(card),
            ReadinessLane::Passing => passing.push(card),
        }
    }

    vec![
        readiness_column("required-action", "Required action", required_action),
        readiness_column("optional-failures", "Optional failures", optional_failures),
        readiness_column("in-progress", "In progress", in_progress),
        readiness_column("passing", "Passing", passing),
    ]
}

fn expected_lane(check: Option<&CheckRun>, required: bool) -> ReadinessLane {
    match check.map(|check| check.state) {
        None => ReadinessLane::Missing,
        Some(CheckState::Pending | CheckState::Running) => ReadinessLane::InProgress,
        Some(CheckState::Failed) if required => ReadinessLane::RequiredAction,
        Some(CheckState::Failed) => ReadinessLane::OptionalFailures,
        Some(CheckState::Succeeded | CheckState::Skipped) => ReadinessLane::Passing,
    }
}

fn expected_card(
    name: String,
    required: bool,
    check: Option<CheckRun>,
) -> ExpectedCheckReadinessCard {
    let lane = expected_lane(check.as_ref(), required);
    ExpectedCheckReadinessCard {
        name,
        required,
        check,
        blocking: required
            && matches!(
                lane,
                ReadinessLane::RequiredAction | ReadinessLane::Missing | ReadinessLane::InProgress
            ),
        missing: matches!(lane, ReadinessLane::Missing),
    }
}

fn expected_readiness_columns(
    expected: Vec<ExpectedCheck>,
    observed: Vec<CheckRun>,
) -> Vec<ExpectedCheckReadinessColumn> {
    let mut required_action = Vec::new();
    let mut missing = Vec::new();
    let mut in_progress = Vec::new();
    let mut optional_failures = Vec::new();
    let mut passing = Vec::new();
    let mut expected_names = Vec::new();

    for expected in expected {
        let name = expected.name.trim();
        if name.is_empty() || expected_names.iter().any(|existing| existing == name) {
            continue;
        }
        expected_names.push(name.to_string());
        let check = observed.iter().find(|check| check.name == name).cloned();
        let card = expected_card(name.to_string(), expected.required, check);
        match expected_lane(card.check.as_ref(), card.required) {
            ReadinessLane::RequiredAction => required_action.push(card),
            ReadinessLane::Missing => missing.push(card),
            ReadinessLane::InProgress => in_progress.push(card),
            ReadinessLane::OptionalFailures => optional_failures.push(card),
            ReadinessLane::Passing => passing.push(card),
        }
    }

    for check in observed {
        if expected_names
            .iter()
            .any(|expected_name| expected_name == &check.name)
        {
            continue;
        }
        let card = expected_card(check.name.clone(), check.required, Some(check));
        match expected_lane(card.check.as_ref(), card.required) {
            ReadinessLane::RequiredAction => required_action.push(card),
            ReadinessLane::Missing => missing.push(card),
            ReadinessLane::InProgress => in_progress.push(card),
            ReadinessLane::OptionalFailures => optional_failures.push(card),
            ReadinessLane::Passing => passing.push(card),
        }
    }

    vec![
        expected_readiness_column("required-action", "Required action", required_action),
        expected_readiness_column("missing", "Missing", missing),
        expected_readiness_column("in-progress", "In progress", in_progress),
        expected_readiness_column("optional-failures", "Optional failures", optional_failures),
        expected_readiness_column("passing", "Passing", passing),
    ]
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
    // Require BOTH workspace_id and repository_id, matching pulls/issues. A
    // repository-only scope (workspace_id=None) lets a check with no
    // workspace anchor through, which then matches any workspace-scoped
    // list-checks filter via the fall-through at the tail of
    // `repository_matches` — that was the TNQ-3 cross-tenant leak.
    let workspace_ok = scope
        .workspace_id
        .as_deref()
        .is_some_and(|id| !id.trim().is_empty());
    let repository_ok = scope
        .repository_id
        .as_deref()
        .is_some_and(|id| !id.trim().is_empty());
    if workspace_ok && repository_ok {
        return Ok(());
    }
    Err(err(
        ErrorCode::BadInput,
        "checks.record requires a workspace-scoped repository (comtrya://workspace/<ws>/repository/<repo>)",
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
        // A workspace-scoped filter must not match a check that has no
        // workspace anchor at all. Treating `stored.workspace_id == None`
        // as "compatible with any workspace" is the cross-tenant leak.
        match stored.workspace_id.as_deref() {
            Some(stored_workspace) if stored_workspace == workspace => {}
            _ => return false,
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

fn collect_checks(
    repository: &str,
    limit: u32,
    commit_oid: Option<&str>,
) -> Result<Vec<CheckRun>, Error> {
    let limit = limit.min(1024) as usize;
    if limit == 0 {
        return Ok(Vec::new());
    }
    let commit_oid = commit_oid
        .map(str::trim)
        .filter(|commit_oid| !commit_oid.is_empty());
    let mut out = Vec::new();
    scan_checks(|stored| {
        if !repository_matches(&stored, repository) {
            return Ok(false);
        }
        if let Some(commit_oid) = commit_oid {
            if stored.commit_oid != commit_oid {
                return Ok(false);
            }
        }
        out.push(stored.to_wit());
        Ok(out.len() >= limit)
    })?;
    Ok(out)
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
        collect_checks(&repository, limit, None)
    }

    fn readiness_board(input: CheckReadinessBoardInput) -> Result<CheckReadinessBoard, Error> {
        let checks = collect_checks(&input.repository, input.limit, input.commit_oid.as_deref())?;
        let total = checks.len() as u32;
        Ok(CheckReadinessBoard {
            repository: input.repository,
            commit_oid: input.commit_oid,
            total,
            columns: readiness_columns(checks),
        })
    }

    fn expected_readiness_board(
        input: ExpectedCheckReadinessBoardInput,
    ) -> Result<ExpectedCheckReadinessBoard, Error> {
        let commit_oid = input.commit_oid.trim();
        if commit_oid.is_empty() {
            return Err(err(
                ErrorCode::BadInput,
                "expected-readiness-board requires a commit OID",
            ));
        }
        let checks = collect_checks(&input.repository, input.limit, Some(commit_oid))?;
        let columns = expected_readiness_columns(input.expected, checks);
        let total = columns.iter().map(|column| column.count).sum();
        Ok(ExpectedCheckReadinessBoard {
            repository: input.repository,
            commit_oid: commit_oid.to_string(),
            total,
            columns,
        })
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

#[cfg(test)]
mod tests {
    use super::{
        expected_readiness_columns, readiness_columns, CheckRun, CheckState, ExpectedCheck,
    };

    fn check(id: &str, state: CheckState, required: bool) -> CheckRun {
        CheckRun {
            id: id.to_string(),
            repository: "comtrya://workspace/ws/repository/repo".to_string(),
            commit_oid: "abc123".to_string(),
            name: id.to_string(),
            state,
            conclusion: String::new(),
            required,
            created_at: "2026-06-20T00:00:00Z".to_string(),
            updated_at: "2026-06-20T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn readiness_columns_group_checks_by_merge_relevance() {
        let columns = readiness_columns(vec![
            check("required failure", CheckState::Failed, true),
            check("optional failure", CheckState::Failed, false),
            check("running", CheckState::Running, true),
            check("pending", CheckState::Pending, false),
            check("success", CheckState::Succeeded, true),
            check("skipped", CheckState::Skipped, true),
        ]);

        let required = columns
            .iter()
            .find(|column| column.key == "required-action")
            .expect("required action column");
        assert_eq!(required.count, 1);
        assert!(required.cards[0].blocking);
        assert_eq!(required.cards[0].check.name, "required failure");

        let optional = columns
            .iter()
            .find(|column| column.key == "optional-failures")
            .expect("optional failures column");
        assert_eq!(optional.count, 1);
        assert!(!optional.cards[0].blocking);

        let progress = columns
            .iter()
            .find(|column| column.key == "in-progress")
            .expect("in progress column");
        assert_eq!(progress.count, 2);

        let passing = columns
            .iter()
            .find(|column| column.key == "passing")
            .expect("passing column");
        assert_eq!(passing.count, 2);
    }

    #[test]
    fn expected_readiness_columns_surface_missing_required_checks() {
        let columns = expected_readiness_columns(
            vec![
                ExpectedCheck {
                    name: "cargo test".to_string(),
                    required: true,
                },
                ExpectedCheck {
                    name: "security audit".to_string(),
                    required: true,
                },
                ExpectedCheck {
                    name: "docs link check".to_string(),
                    required: false,
                },
                ExpectedCheck {
                    name: "deploy preview".to_string(),
                    required: false,
                },
                ExpectedCheck {
                    name: "cargo fmt".to_string(),
                    required: true,
                },
            ],
            vec![
                check("cargo test", CheckState::Failed, true),
                check("docs link check", CheckState::Failed, false),
                check("deploy preview", CheckState::Running, false),
                check("cargo fmt", CheckState::Succeeded, true),
            ],
        );

        let required = columns
            .iter()
            .find(|column| column.key == "required-action")
            .expect("required action column");
        assert_eq!(required.count, 1);
        assert_eq!(required.cards[0].name, "cargo test");
        assert!(required.cards[0].blocking);
        assert!(!required.cards[0].missing);

        let missing = columns
            .iter()
            .find(|column| column.key == "missing")
            .expect("missing column");
        assert_eq!(missing.count, 1);
        assert_eq!(missing.cards[0].name, "security audit");
        assert!(missing.cards[0].blocking);
        assert!(missing.cards[0].missing);
        assert!(missing.cards[0].check.is_none());

        let progress = columns
            .iter()
            .find(|column| column.key == "in-progress")
            .expect("in progress column");
        assert_eq!(progress.count, 1);
        assert!(!progress.cards[0].blocking);

        let optional = columns
            .iter()
            .find(|column| column.key == "optional-failures")
            .expect("optional failures column");
        assert_eq!(optional.count, 1);
        assert!(!optional.cards[0].blocking);

        let passing = columns
            .iter()
            .find(|column| column.key == "passing")
            .expect("passing column");
        assert_eq!(passing.count, 1);
    }
}
