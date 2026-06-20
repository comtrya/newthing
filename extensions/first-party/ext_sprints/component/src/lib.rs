// ext_sprints — WASM Component-Model implementation of `sprints.wit`.

mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::ops;
use bindings::comtrya::platform::relations;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_sprints::sprints::{
    AssignIssueInput, ChangeStateInput, CreateSprintInput, Guest as SprintsGuest, KanbanBoard,
    KanbanCard, KanbanCardState, KanbanColumn, KanbanInput, KanbanSwimlane, ListSprintsInput,
    MembersInput, ProjectKanbanBoard, Sprint, SprintBoard, SprintBoardColumn, SprintBoardIssue,
    SprintBoardIssueState, SprintState,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

const COLLECTION: &str = "sprints";
const COUNTER_COLLECTION: &str = "ext_sprints_meta";
const MAX_TITLE_LEN: usize = 512;
const MAX_BOARD_ISSUES: usize = 1024;
const PART_OF: &str = "comtrya://rel/part-of";
const COUNTER_RETRY_LIMIT: u32 = 8;

struct Component;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredSprint {
    id: String,
    workspace: String,
    workspace_id: String,
    title: String,
    state: String,
    /// Per-workspace sequential number allocated at create time.
    /// `#[serde(default)]` lets pre-existing persisted records without
    /// this field deserialise without error (they will read as 0).
    #[serde(default)]
    number: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    goal: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    start_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    end_date: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceCounter {
    id: String,
    storage_id: String,
    next: u32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct IssueLookup {
    id: String,
    title: String,
    state: String,
    number: u64,
    #[serde(default)]
    project_name: Option<String>,
}

impl StoredSprint {
    fn to_wit(&self) -> Sprint {
        Sprint {
            id: self.id.clone(),
            workspace: self.workspace.clone(),
            title: self.title.clone(),
            state: state_from_str(&self.state),
            number: self.number,
            goal: self.goal.clone(),
            start_date: self.start_date.clone(),
            end_date: self.end_date.clone(),
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

fn read_workspace_counter(counter_id: &str) -> Result<Option<WorkspaceCounter>, Error> {
    let mut after = None;
    let mut found = None;
    loop {
        let page = storage::list_all(COUNTER_COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let counter: WorkspaceCounter = serde_json::from_slice(&bytes)
                .map_err(|e| err(ErrorCode::Internal, format!("parse sprint counter: {e}")))?;
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

/// Return the next sequential sprint number for `workspace_id` and increment the
/// persisted counter atomically via storage's single-document version guard
/// (update-begin/update-commit), seeding the counter on first use.
///
/// The CAS loop retries up to `COUNTER_RETRY_LIMIT` times on `conflict`
/// (another sprint-create raced us between begin and commit) and on the
/// first-use seed race (two creators hit `NotFound`, the second sees
/// `conflict` from `storage::create` and re-enters the update path).
fn next_sprint_number(workspace_id: &str) -> Result<u32, Error> {
    let scope_key = format!("comtrya://workspace/{workspace_id}");
    let counter_id = format!("sprint-number:{scope_key}");
    for _ in 0..COUNTER_RETRY_LIMIT {
        match read_workspace_counter(&counter_id)? {
            Some(counter) => {
                let snap = match storage::update_begin(COUNTER_COLLECTION, &counter.storage_id) {
                    Ok(snap) => snap,
                    Err(Error {
                        code: ErrorCode::NotFound,
                        ..
                    }) => continue,
                    Err(other) => return Err(other),
                };
                let mut counter: WorkspaceCounter = serde_json::from_slice(&snap.data)
                    .map_err(|e| err(ErrorCode::Internal, format!("parse sprint counter: {e}")))?;
                if counter.id != counter_id {
                    return Err(err(
                        ErrorCode::Internal,
                        format!("counter document has wrong id {}", counter.id),
                    ));
                }
                let assigned = counter.next;
                counter.next = counter.next.saturating_add(1);
                let bytes = serde_json::to_vec(&counter).map_err(|e| {
                    err(
                        ErrorCode::Internal,
                        format!("serialise sprint counter: {e}"),
                    )
                })?;
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
                // First sprint in this workspace — seed the counter at 2, return 1.
                let storage_id = ids::mint("sprint-counter")?;
                let counter = WorkspaceCounter {
                    id: counter_id.clone(),
                    storage_id: storage_id.clone(),
                    next: 2,
                };
                let bytes = serde_json::to_vec(&counter).map_err(|e| {
                    err(
                        ErrorCode::Internal,
                        format!("serialise sprint counter: {e}"),
                    )
                })?;
                match storage::create(
                    COUNTER_COLLECTION,
                    &storage_id,
                    &bytes,
                    &storage::DocumentMetadata {
                        resource_uri: format!("comtrya://sprint-counter/{storage_id}"),
                        resource_refs: vec![scope_key.clone(), counter_id.clone()],
                    },
                ) {
                    Ok(()) => return Ok(1),
                    // Another writer seeded the counter between our
                    // read and our create. Fall through to the next
                    // iteration which will hit the Some branch.
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
        format!("sprint-number counter for {workspace_id} contended past retry limit"),
    ))
}

fn state_to_str(state: SprintState) -> &'static str {
    match state {
        SprintState::Planned => "PLANNED",
        SprintState::Active => "ACTIVE",
        SprintState::Completed => "COMPLETED",
        SprintState::Canceled => "CANCELED",
    }
}

fn state_from_str(state: &str) -> SprintState {
    match state {
        "ACTIVE" => SprintState::Active,
        "COMPLETED" => SprintState::Completed,
        "CANCELED" => SprintState::Canceled,
        _ => SprintState::Planned,
    }
}

fn can_transition_sprint_state(current: &str, next: &str) -> bool {
    if current == next {
        return true;
    }
    matches!(
        (current, next),
        ("PLANNED", "ACTIVE")
            | ("PLANNED", "CANCELED")
            | ("ACTIVE", "COMPLETED")
            | ("ACTIVE", "CANCELED")
    )
}

fn workspace_id(workspace: &str) -> Option<String> {
    workspace
        .strip_prefix("comtrya://workspace/")
        .map(str::to_string)
        .or_else(|| {
            if workspace.starts_with("ws_") {
                Some(workspace.to_string())
            } else {
                None
            }
        })
}

fn workspace_uri(workspace: &str) -> Result<(String, String), Error> {
    let id = workspace_id(workspace)
        .ok_or_else(|| err(ErrorCode::BadInput, "sprint requires a workspace"))?;
    Ok((id.clone(), format!("comtrya://workspace/{id}")))
}

fn decode(id: &str, bytes: &[u8]) -> Result<StoredSprint, Error> {
    serde_json::from_slice(bytes)
        .map_err(|error| err(ErrorCode::Internal, format!("parse sprint {id}: {error}")))
}

fn read_stored(id: &str) -> Result<Option<StoredSprint>, Error> {
    let Some(snap) = storage::get(COLLECTION, id)? else {
        return Ok(None);
    };
    Ok(Some(decode(id, &snap.data)?))
}

fn scan_sprints(mut visit: impl FnMut(StoredSprint) -> Result<bool, Error>) -> Result<(), Error> {
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

fn persist_new(stored: &StoredSprint) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise sprint: {error}")))?;
    storage::create(
        COLLECTION,
        &stored.id,
        &bytes,
        &storage::DocumentMetadata {
            resource_uri: sprint_uri(&stored.id),
            resource_refs: vec![sprint_uri(&stored.id), stored.workspace.clone()],
        },
    )
}

fn commit_update(id: &str, stored: &StoredSprint, version: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise sprint: {error}")))?;
    storage::update_commit(COLLECTION, id, version, &bytes)
}

fn sprint_id_from_ref(ref_uri: &str) -> Result<String, Error> {
    ref_uri
        .trim()
        .strip_prefix("comtrya://sprint/")
        .map(str::to_string)
        .filter(|id| !id.is_empty())
        .ok_or_else(|| {
            err(
                ErrorCode::BadInput,
                "sprint ref must be comtrya://sprint/<id>",
            )
        })
}

fn read_by_ref(ref_uri: &str) -> Result<Option<StoredSprint>, Error> {
    let id = sprint_id_from_ref(ref_uri)?;
    read_stored(&id)
}

fn issue_uris_in_sprint(sprint_ref: &str, limit: u32) -> Result<Vec<String>, Error> {
    let prefix = "comtrya://issue/";
    let cap = limit.min(1024) as usize;
    let mut out: Vec<String> = Vec::with_capacity(cap.min(64));
    let mut after: Option<bindings::comtrya::platform::types::PageToken> = None;
    loop {
        let page = relations::incoming(sprint_ref, Some(PART_OF), 1024, after.as_ref())?;
        let next = page.next_page;
        for relation in page.relations {
            if relation.source.starts_with(prefix) {
                out.push(relation.source);
                if out.len() >= cap {
                    return Ok(out);
                }
            }
        }
        match next {
            Some(cursor) => after = Some(cursor),
            None => break,
        }
    }
    Ok(out)
}

fn issue_lookups(refs: &[String]) -> Result<Vec<Option<IssueLookup>>, Error> {
    if refs.is_empty() {
        return Ok(Vec::new());
    }
    let payload = serde_json::to_vec(refs).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise issue refs: {error}"),
        )
    })?;
    let bytes = ops::invoke("ext_issues", "issues.by-refs-issue", &payload)?;
    serde_json::from_slice(&bytes)
        .map_err(|error| err(ErrorCode::Internal, format!("parse issue refs: {error}")))
}

fn board_issue_state(state: &str) -> SprintBoardIssueState {
    match state {
        "closed" => SprintBoardIssueState::Closed,
        "reopened" => SprintBoardIssueState::Reopened,
        _ => SprintBoardIssueState::Open,
    }
}

fn board_column(
    key: impl Into<String>,
    label: impl Into<String>,
    issues: Vec<SprintBoardIssue>,
) -> SprintBoardColumn {
    SprintBoardColumn {
        key: key.into(),
        label: label.into(),
        count: issues.len() as u32,
        issues,
    }
}

fn kanban_card_state(state: &str) -> KanbanCardState {
    match state {
        "closed" => KanbanCardState::Closed,
        "reopened" => KanbanCardState::Reopened,
        _ => KanbanCardState::Open,
    }
}

fn kanban_column(
    key: impl Into<String>,
    label: impl Into<String>,
    cards: Vec<KanbanCard>,
) -> KanbanColumn {
    KanbanColumn {
        key: key.into(),
        label: label.into(),
        count: cards.len() as u32,
        cards,
    }
}

fn kanban_card(issue_ref: &str, issue: &IssueLookup) -> KanbanCard {
    KanbanCard {
        issue_ref: issue_ref.to_string(),
        id: Some(issue.id.clone()),
        number: Some(issue.number),
        title: issue.title.clone(),
        state: kanban_card_state(&issue.state),
        project_name: issue
            .project_name
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty()),
    }
}

fn missing_kanban_card(issue_ref: &str) -> KanbanCard {
    KanbanCard {
        issue_ref: issue_ref.to_string(),
        id: None,
        number: None,
        title: issue_ref.to_string(),
        state: KanbanCardState::Missing,
        project_name: None,
    }
}

fn push_kanban_card(
    todo: &mut Vec<KanbanCard>,
    done: &mut Vec<KanbanCard>,
    missing: &mut Vec<KanbanCard>,
    card: KanbanCard,
) {
    match card.state {
        KanbanCardState::Closed => done.push(card),
        KanbanCardState::Missing => missing.push(card),
        KanbanCardState::Open | KanbanCardState::Reopened => todo.push(card),
    }
}

fn kanban_columns(
    todo: Vec<KanbanCard>,
    done: Vec<KanbanCard>,
    missing: Vec<KanbanCard>,
) -> Vec<KanbanColumn> {
    let mut columns = vec![
        kanban_column("todo", "Todo", todo),
        kanban_column("done", "Done", done),
    ];
    if !missing.is_empty() {
        columns.push(kanban_column("missing", "Missing", missing));
    }
    columns
}

#[derive(Default)]
struct KanbanLaneCards {
    label: String,
    project_name: Option<String>,
    todo: Vec<KanbanCard>,
    done: Vec<KanbanCard>,
    missing: Vec<KanbanCard>,
}

fn normalized_lane_key(project_name: Option<&str>) -> String {
    let Some(project_name) = project_name
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return "unscoped".to_string();
    };
    let mut key = String::with_capacity(project_name.len());
    let mut last_dash = false;
    for ch in project_name.chars().flat_map(char::to_lowercase) {
        if ch.is_ascii_alphanumeric() {
            key.push(ch);
            last_dash = false;
        } else if !last_dash {
            key.push('-');
            last_dash = true;
        }
    }
    let key = key.trim_matches('-');
    if key.is_empty() {
        "project-other".to_string()
    } else {
        format!("project-{key}")
    }
}

fn new_lane(project_name: Option<String>) -> KanbanLaneCards {
    match project_name {
        Some(project_name) => KanbanLaneCards {
            label: project_name.clone(),
            project_name: Some(project_name),
            ..KanbanLaneCards::default()
        },
        None => KanbanLaneCards {
            label: "Unscoped".to_string(),
            project_name: None,
            ..KanbanLaneCards::default()
        },
    }
}

fn kanban_project_swimlanes(
    issue_refs: &[String],
    lookups: &[Option<IssueLookup>],
) -> Vec<KanbanSwimlane> {
    let mut lanes: BTreeMap<String, KanbanLaneCards> = BTreeMap::new();
    lanes.insert("unscoped".to_string(), new_lane(None));

    for (index, issue_ref) in issue_refs.iter().enumerate() {
        let card = match lookups.get(index).and_then(Option::as_ref) {
            Some(issue) => kanban_card(issue_ref, issue),
            None => missing_kanban_card(issue_ref),
        };
        let project_name = card
            .project_name
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let lane_key = normalized_lane_key(project_name.as_deref());
        let lane = lanes
            .entry(lane_key)
            .or_insert_with(|| new_lane(project_name.clone()));
        push_kanban_card(&mut lane.todo, &mut lane.done, &mut lane.missing, card);
    }

    let mut swimlanes: Vec<KanbanSwimlane> = lanes
        .into_iter()
        .filter_map(|(key, lane)| {
            let total = lane.todo.len() + lane.done.len() + lane.missing.len();
            if total == 0 {
                return None;
            }
            Some(KanbanSwimlane {
                key,
                label: lane.label,
                project_name: lane.project_name,
                total: total as u32,
                columns: kanban_columns(lane.todo, lane.done, lane.missing),
            })
        })
        .collect();
    swimlanes.sort_by(
        |left, right| match (left.key.as_str(), right.key.as_str()) {
            ("unscoped", "unscoped") => std::cmp::Ordering::Equal,
            ("unscoped", _) => std::cmp::Ordering::Less,
            (_, "unscoped") => std::cmp::Ordering::Greater,
            _ => left
                .label
                .cmp(&right.label)
                .then_with(|| left.key.cmp(&right.key)),
        },
    );
    swimlanes
}

fn normalize_issue_refs(issue_refs: Vec<String>, limit: u32) -> Result<Vec<String>, Error> {
    let cap = limit.min(MAX_BOARD_ISSUES as u32) as usize;
    if cap == 0 {
        return Ok(Vec::new());
    }

    let mut refs = Vec::with_capacity(cap.min(issue_refs.len()));
    for issue_ref in issue_refs.into_iter().take(cap) {
        let trimmed = issue_ref.trim();
        if !trimmed.starts_with("comtrya://issue/") {
            return Err(err(
                ErrorCode::BadInput,
                "kanban issue refs must be comtrya://issue/<id>",
            ));
        }
        refs.push(trimmed.to_string());
    }
    Ok(refs)
}

fn sprint_uri(id: &str) -> String {
    format!("comtrya://sprint/{id}")
}

fn emit(event_type: &str, payload: &impl Serialize, source_uri: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(payload)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise event: {error}")))?;
    let _ = events::append(event_type, &bytes, Some(source_uri))?;
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SprintEventPayload<'a> {
    #[serde(rename = "sprintID")]
    sprint_id: &'a str,
    workspace_id: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    state: Option<&'a str>,
}

impl SprintsGuest for Component {
    fn create_sprint(input: CreateSprintInput) -> Result<Sprint, Error> {
        let (workspace_id, workspace) = workspace_uri(input.workspace.trim())?;
        let title = input.title.trim();
        if title.is_empty() {
            return Err(err(ErrorCode::BadInput, "sprint title must not be empty"));
        }
        if title.len() > MAX_TITLE_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("sprint title must be at most {MAX_TITLE_LEN} bytes"),
            ));
        }
        let id = ids::mint("sprint")?;
        let now = time::now_iso();
        let number = next_sprint_number(&workspace_id)?;
        let stored = StoredSprint {
            id: id.clone(),
            workspace,
            workspace_id,
            title: title.to_string(),
            state: state_to_str(SprintState::Planned).to_string(),
            number,
            goal: input
                .goal
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty()),
            start_date: input.start_date,
            end_date: input.end_date,
            created_at: now.clone(),
            updated_at: now,
        };
        persist_new(&stored)?;
        let sprint_ref = sprint_uri(&stored.id);
        emit(
            "dev.comtrya.sprint.created",
            &SprintEventPayload {
                sprint_id: &stored.id,
                workspace_id: &stored.workspace_id,
                title: Some(&stored.title),
                state: None,
            },
            &sprint_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn get_sprint(id: String) -> Result<Option<Sprint>, Error> {
        Ok(read_stored(&id)?.map(|stored| stored.to_wit()))
    }

    fn list_sprints(input: ListSprintsInput) -> Result<Vec<Sprint>, Error> {
        let ws_id = workspace_id(&input.workspace)
            .ok_or_else(|| err(ErrorCode::BadInput, "sprints.list requires a workspace"))?;
        let limit = input.limit.min(1024) as usize;
        let mut out = Vec::new();
        scan_sprints(|stored| {
            if stored.workspace_id == ws_id {
                out.push(stored.to_wit());
                if out.len() >= limit {
                    return Ok(true);
                }
            }
            Ok(false)
        })?;
        Ok(out)
    }

    fn by_ref_sprint(ref_: String) -> Result<Option<Sprint>, Error> {
        Ok(read_by_ref(&ref_)?.map(|stored| stored.to_wit()))
    }

    fn change_state_sprint(input: ChangeStateInput) -> Result<Sprint, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        let current = stored.state.clone();
        let state = state_to_str(input.state).to_string();
        if current == state {
            return Ok(stored.to_wit());
        }
        if !can_transition_sprint_state(&current, &state) {
            return Err(err(
                ErrorCode::BadInput,
                format!("invalid sprint state transition: {current} -> {state}"),
            ));
        }
        let now = time::now_iso();
        stored.state = state.clone();
        stored.updated_at = now;
        commit_update(&input.id, &stored, &snap.version)?;
        emit(
            "dev.comtrya.sprint.state-changed",
            &SprintEventPayload {
                sprint_id: &stored.id,
                workspace_id: &stored.workspace_id,
                title: None,
                state: Some(&state),
            },
            &sprint_uri(&stored.id),
        )?;
        Ok(stored.to_wit())
    }

    fn assign_issue(input: AssignIssueInput) -> Result<bool, Error> {
        if read_by_ref(&input.sprint_ref)?.is_none() {
            return Err(err(
                ErrorCode::NotFound,
                format!("sprint not found: {}", input.sprint_ref),
            ));
        }
        let _ = relations::create(&input.issue_ref, &input.sprint_ref, PART_OF, None)?;
        Ok(true)
    }

    fn issues_in_sprint(input: MembersInput) -> Result<Vec<String>, Error> {
        issue_uris_in_sprint(&input.ref_, input.limit)
    }

    fn board_for_sprint(input: MembersInput) -> Result<SprintBoard, Error> {
        if read_by_ref(&input.ref_)?.is_none() {
            return Err(err(
                ErrorCode::NotFound,
                format!("sprint not found: {}", input.ref_),
            ));
        }

        let issue_refs = issue_uris_in_sprint(&input.ref_, input.limit)?;
        let lookups = issue_lookups(&issue_refs)?;
        let mut open = Vec::new();
        let mut closed = Vec::new();
        let mut missing = Vec::new();

        for (index, issue_ref) in issue_refs.iter().enumerate() {
            let Some(issue) = lookups.get(index).and_then(Option::as_ref) else {
                missing.push(SprintBoardIssue {
                    issue_ref: issue_ref.clone(),
                    id: None,
                    number: None,
                    title: issue_ref.clone(),
                    state: SprintBoardIssueState::Missing,
                });
                continue;
            };

            let board_issue = SprintBoardIssue {
                issue_ref: issue_ref.clone(),
                id: Some(issue.id.clone()),
                number: Some(issue.number),
                title: issue.title.clone(),
                state: board_issue_state(&issue.state),
            };
            if issue.state == "closed" {
                closed.push(board_issue);
            } else {
                open.push(board_issue);
            }
        }

        let mut columns = vec![
            board_column("open", "Open", open),
            board_column("closed", "Done", closed),
        ];
        if !missing.is_empty() {
            columns.push(board_column("missing", "Missing", missing));
        }

        Ok(SprintBoard {
            sprint_ref: input.ref_,
            total: issue_refs.len() as u32,
            columns,
        })
    }

    fn kanban_for_issues(input: KanbanInput) -> Result<KanbanBoard, Error> {
        let (_, workspace) = workspace_uri(input.workspace.trim())?;
        let issue_refs = normalize_issue_refs(input.issue_refs, input.limit)?;
        let lookups = issue_lookups(&issue_refs)?;
        let mut todo = Vec::new();
        let mut done = Vec::new();
        let mut missing = Vec::new();

        for (index, issue_ref) in issue_refs.iter().enumerate() {
            let card = match lookups.get(index).and_then(Option::as_ref) {
                Some(issue) => kanban_card(issue_ref, issue),
                None => missing_kanban_card(issue_ref),
            };
            push_kanban_card(&mut todo, &mut done, &mut missing, card);
        }

        Ok(KanbanBoard {
            workspace,
            total: issue_refs.len() as u32,
            columns: kanban_columns(todo, done, missing),
        })
    }

    fn kanban_project_board(input: KanbanInput) -> Result<ProjectKanbanBoard, Error> {
        let (_, workspace) = workspace_uri(input.workspace.trim())?;
        let issue_refs = normalize_issue_refs(input.issue_refs, input.limit)?;
        let lookups = issue_lookups(&issue_refs)?;

        Ok(ProjectKanbanBoard {
            workspace,
            total: issue_refs.len() as u32,
            swimlanes: kanban_project_swimlanes(&issue_refs, &lookups),
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

#[cfg(test)]
mod tests {
    use super::*;

    fn issue(
        id: &str,
        title: &str,
        state: &str,
        number: u64,
        project_name: Option<&str>,
    ) -> IssueLookup {
        IssueLookup {
            id: id.to_string(),
            title: title.to_string(),
            state: state.to_string(),
            number,
            project_name: project_name.map(str::to_string),
        }
    }

    #[test]
    fn kanban_project_swimlanes_group_unscoped_projects_and_missing_refs() {
        let issue_refs = vec![
            "comtrya://issue/iss_missing".to_string(),
            "comtrya://issue/iss_kernel_open".to_string(),
            "comtrya://issue/iss_product_open".to_string(),
            "comtrya://issue/iss_kernel_done".to_string(),
        ];
        let lookups = vec![
            None,
            Some(issue(
                "iss_kernel_open",
                "kernel work",
                "open",
                1,
                Some("kernel"),
            )),
            Some(issue(
                "iss_product_open",
                "product work",
                "open",
                2,
                Some("product"),
            )),
            Some(issue(
                "iss_kernel_done",
                "kernel done",
                "closed",
                3,
                Some("kernel"),
            )),
        ];

        let swimlanes = kanban_project_swimlanes(&issue_refs, &lookups);

        assert_eq!(swimlanes.len(), 3);
        assert_eq!(swimlanes[0].key, "unscoped");
        assert_eq!(swimlanes[0].project_name, None);
        assert_eq!(swimlanes[0].total, 1);
        assert_eq!(
            swimlanes[0]
                .columns
                .iter()
                .find(|column| column.key == "missing")
                .expect("missing column")
                .cards[0]
                .issue_ref,
            "comtrya://issue/iss_missing"
        );

        assert_eq!(swimlanes[1].key, "project-kernel");
        assert_eq!(swimlanes[1].project_name.as_deref(), Some("kernel"));
        assert_eq!(swimlanes[1].total, 2);
        assert_eq!(
            swimlanes[1]
                .columns
                .iter()
                .find(|column| column.key == "todo")
                .expect("todo column")
                .cards[0]
                .id
                .as_deref(),
            Some("iss_kernel_open")
        );
        assert_eq!(
            swimlanes[1]
                .columns
                .iter()
                .find(|column| column.key == "done")
                .expect("done column")
                .cards[0]
                .id
                .as_deref(),
            Some("iss_kernel_done")
        );

        assert_eq!(swimlanes[2].key, "project-product");
        assert_eq!(swimlanes[2].project_name.as_deref(), Some("product"));
        assert_eq!(swimlanes[2].total, 1);
    }
}

bindings::export!(Component with_types_in bindings);
