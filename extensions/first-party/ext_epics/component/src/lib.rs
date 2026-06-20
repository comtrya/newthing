// ext_epics — WASM Component-Model implementation of `epics.wit`.

mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::ops;
use bindings::comtrya::platform::relations;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_epics::epics::{
    AssignProjectInput, ChangeStateEpicInput, CreateEpicInput, Epic, EpicOwnerBoard, EpicOwnerCard,
    EpicOwnerColumn, EpicProgress, EpicProjectBoard, EpicProjectCard, EpicProjectColumn,
    EpicRoadmapBoard, EpicRoadmapCard, EpicRoadmapColumn, EpicState, Guest as EpicsGuest,
    OwnerBoardInput, ProjectBoardInput, RoadmapBoardInput, UpdateEpicInput,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

const COLLECTION: &str = "epics";
const COUNTER_COLLECTION: &str = "ext_epics_meta";
const MAX_TITLE_LEN: usize = 512;
const MAX_BODY_LEN: usize = 64 * 1024;
const PART_OF: &str = "comtrya://rel/part-of";
const COUNTER_RETRY_LIMIT: u32 = 8;

struct Component;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredEpic {
    id: String,
    workspace: String,
    workspace_id: String,
    title: String,
    body_markdown: String,
    state: String,
    /// Per-workspace sequential number allocated at create time.
    /// `#[serde(default)]` lets pre-existing persisted records without
    /// this field deserialise without error (they will read as 0).
    #[serde(default)]
    number: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    target_date: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    owner_ref: Option<String>,
    #[serde(default)]
    labels: Vec<String>,
    created_at: String,
    updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    closed_at: Option<String>,
    /// Project this epic belongs to, stamped from the create input.
    /// `None` for unscoped epics (legacy or repo-wide).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    project_name: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceCounter {
    id: String,
    storage_id: String,
    next: u32,
}

impl StoredEpic {
    fn to_wit(&self) -> Epic {
        Epic {
            id: self.id.clone(),
            workspace: self.workspace.clone(),
            title: self.title.clone(),
            body_markdown: self.body_markdown.clone(),
            state: state_from_str(&self.state),
            number: self.number,
            target_date: self.target_date.clone(),
            owner_ref: self.owner_ref.clone(),
            labels: self.labels.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
            closed_at: self.closed_at.clone(),
            project_name: self.project_name.clone(),
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
                .map_err(|e| err(ErrorCode::Internal, format!("parse epic counter: {e}")))?;
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

/// Return the next sequential epic number for `workspace_id` and increment the
/// persisted counter atomically via storage's single-document version guard
/// (update-begin/update-commit), seeding the counter on first use.
///
/// The CAS loop retries up to `COUNTER_RETRY_LIMIT` times on `conflict`
/// (another epic-create raced us between begin and commit) and on the
/// first-use seed race (two creators hit `NotFound`, the second sees
/// `conflict` from `storage::create` and re-enters the update path).
fn next_epic_number(workspace_id: &str) -> Result<u32, Error> {
    let scope_key = format!("comtrya://workspace/{workspace_id}");
    let counter_id = format!("epic-number:{scope_key}");
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
                    .map_err(|e| err(ErrorCode::Internal, format!("parse epic counter: {e}")))?;
                if counter.id != counter_id {
                    return Err(err(
                        ErrorCode::Internal,
                        format!("counter document has wrong id {}", counter.id),
                    ));
                }
                let assigned = counter.next;
                counter.next = counter.next.saturating_add(1);
                let bytes = serde_json::to_vec(&counter).map_err(|e| {
                    err(ErrorCode::Internal, format!("serialise epic counter: {e}"))
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
                // First epic in this workspace — seed the counter at 2, return 1.
                let storage_id = ids::mint("epic-counter")?;
                let counter = WorkspaceCounter {
                    id: counter_id.clone(),
                    storage_id: storage_id.clone(),
                    next: 2,
                };
                let bytes = serde_json::to_vec(&counter).map_err(|e| {
                    err(ErrorCode::Internal, format!("serialise epic counter: {e}"))
                })?;
                match storage::create(
                    COUNTER_COLLECTION,
                    &storage_id,
                    &bytes,
                    &storage::DocumentMetadata {
                        resource_uri: format!("comtrya://epic-counter/{storage_id}"),
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
        format!("epic-number counter for {workspace_id} contended past retry limit"),
    ))
}

fn state_to_str(state: EpicState) -> &'static str {
    match state {
        EpicState::Planned => "PLANNED",
        EpicState::InProgress => "IN_PROGRESS",
        EpicState::AtRisk => "AT_RISK",
        EpicState::Done => "DONE",
        EpicState::Canceled => "CANCELED",
    }
}

fn state_from_str(state: &str) -> EpicState {
    match state {
        "IN_PROGRESS" => EpicState::InProgress,
        "AT_RISK" => EpicState::AtRisk,
        "DONE" => EpicState::Done,
        "CANCELED" => EpicState::Canceled,
        _ => EpicState::Planned,
    }
}

fn can_transition_epic_state(current: &str, next: &str) -> bool {
    if current == next {
        return true;
    }
    matches!(
        (current, next),
        ("PLANNED", "IN_PROGRESS")
            | ("PLANNED", "CANCELED")
            | ("IN_PROGRESS", "AT_RISK")
            | ("IN_PROGRESS", "DONE")
            | ("IN_PROGRESS", "CANCELED")
            | ("AT_RISK", "IN_PROGRESS")
            | ("AT_RISK", "DONE")
            | ("AT_RISK", "CANCELED")
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
        .ok_or_else(|| err(ErrorCode::BadInput, "epic requires a workspace"))?;
    Ok((id.clone(), format!("comtrya://workspace/{id}")))
}

fn decode(id: &str, bytes: &[u8]) -> Result<StoredEpic, Error> {
    serde_json::from_slice(bytes)
        .map_err(|error| err(ErrorCode::Internal, format!("parse epic {id}: {error}")))
}

fn read_stored(id: &str) -> Result<Option<StoredEpic>, Error> {
    let Some(snap) = storage::get(COLLECTION, id)? else {
        return Ok(None);
    };
    Ok(Some(decode(id, &snap.data)?))
}

fn scan_epics(mut visit: impl FnMut(StoredEpic) -> Result<bool, Error>) -> Result<(), Error> {
    let mut after = None;
    loop {
        let page = storage::list_all(COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            // Skip an undecodable record rather than aborting the whole scan,
            // matching ext_pull_requests / ext_checks. One corrupt or
            // schema-skewed doc must not break listing for the collection.
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

fn persist_new(stored: &StoredEpic) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise epic: {error}")))?;
    storage::create(
        COLLECTION,
        &stored.id,
        &bytes,
        &storage::DocumentMetadata {
            resource_uri: epic_uri(&stored.id),
            resource_refs: vec![epic_uri(&stored.id), stored.workspace.clone()],
        },
    )
}

fn commit_update(id: &str, stored: &StoredEpic, version: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise epic: {error}")))?;
    storage::update_commit(COLLECTION, id, version, &bytes)
}

fn epic_id_from_ref(ref_uri: &str) -> Result<String, Error> {
    ref_uri
        .trim()
        .strip_prefix("comtrya://epic/")
        .map(str::to_string)
        .filter(|id| !id.is_empty())
        .ok_or_else(|| err(ErrorCode::BadInput, "epic ref must be comtrya://epic/<id>"))
}

fn read_by_ref(ref_uri: &str) -> Result<Option<StoredEpic>, Error> {
    let id = epic_id_from_ref(ref_uri)?;
    read_stored(&id)
}

fn member_uris(epic_ref: &str, kind: &str, limit: u32) -> Result<Vec<String>, Error> {
    let prefix = format!("comtrya://{kind}/");
    // Server-side clamp per the per-extension list-op convention.
    let cap = limit.min(1024) as usize;
    // Paginate through ALL relation pages until the prefix-filtered
    // output reaches `cap` or there are no more pages. Previously the
    // function fetched a single 1024-entry page; since both
    // `comtrya://rel/part-of` issues and child epics share the same
    // relation kind, the first page might be all of the other kind and
    // return zero matching items — silently under-reporting. Fixes #223.
    let mut out: Vec<String> = Vec::with_capacity(cap.min(64));
    let mut after: Option<bindings::comtrya::platform::types::PageToken> = None;
    loop {
        let page = relations::incoming(epic_ref, Some(PART_OF), 1024, after.as_ref())?;
        let next = page.next_page;
        for relation in page.relations {
            if relation.source.starts_with(&prefix) {
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

fn issue_state_counts(refs: &[String]) -> Result<(u64, u64), Error> {
    if refs.is_empty() {
        return Ok((0, 0));
    }
    let payload = serde_json::to_vec(refs).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise issue refs: {error}"),
        )
    })?;
    let bytes = ops::invoke("ext_issues", "issues.state-counts-for-refs-issue", &payload)?;
    let value: serde_json::Value = serde_json::from_slice(&bytes)
        .map_err(|error| err(ErrorCode::Internal, format!("parse issue counts: {error}")))?;
    Ok((
        value
            .get("open")
            .and_then(serde_json::Value::as_u64)
            .unwrap_or(0),
        value
            .get("closed")
            .and_then(serde_json::Value::as_u64)
            .unwrap_or(0),
    ))
}

fn emit(event_type: &str, payload: &impl Serialize, source_uri: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(payload)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise event: {error}")))?;
    let _ = events::append(event_type, &bytes, Some(source_uri))?;
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EpicEventPayload<'a> {
    #[serde(rename = "epicID")]
    epic_id: &'a str,
    workspace_id: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    state: Option<&'a str>,
    /// Project scope, if the epic was created against one. Lets the
    /// SSE stream's project-scoped consumers filter without a
    /// `by-ref-epic` lookup.
    #[serde(skip_serializing_if = "Option::is_none")]
    project_name: Option<&'a str>,
}

/// Payload for `dev.comtrya.epic.project-changed`. Carries both
/// the previous and next project names so subscribers can adjust
/// per-Project counts in a single bucket-swap. Mirrors the
/// iter 67 `ProjectChangedPayload` shape on `ext_issues` so
/// workspace-wide consumers can use one parsing path.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EpicProjectChangedPayload<'a> {
    #[serde(rename = "epicID")]
    epic_id: &'a str,
    workspace_id: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    previous_project: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    project_name: Option<&'a str>,
}

fn epic_uri(id: &str) -> String {
    format!("comtrya://epic/{id}")
}

#[derive(Clone, Copy)]
enum RoadmapLane {
    Planned,
    InProgress,
    AtRisk,
    Done,
    Canceled,
}

fn roadmap_lane(state: EpicState) -> RoadmapLane {
    match state {
        EpicState::Planned => RoadmapLane::Planned,
        EpicState::InProgress => RoadmapLane::InProgress,
        EpicState::AtRisk => RoadmapLane::AtRisk,
        EpicState::Done => RoadmapLane::Done,
        EpicState::Canceled => RoadmapLane::Canceled,
    }
}

fn roadmap_column(key: &str, label: &str, cards: Vec<EpicRoadmapCard>) -> EpicRoadmapColumn {
    EpicRoadmapColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn roadmap_columns(cards: Vec<EpicRoadmapCard>) -> Vec<EpicRoadmapColumn> {
    let mut planned = Vec::new();
    let mut in_progress = Vec::new();
    let mut at_risk = Vec::new();
    let mut done = Vec::new();
    let mut canceled = Vec::new();

    for card in cards {
        match roadmap_lane(card.epic.state) {
            RoadmapLane::Planned => planned.push(card),
            RoadmapLane::InProgress => in_progress.push(card),
            RoadmapLane::AtRisk => at_risk.push(card),
            RoadmapLane::Done => done.push(card),
            RoadmapLane::Canceled => canceled.push(card),
        }
    }

    vec![
        roadmap_column("planned", "Planned", planned),
        roadmap_column("in-progress", "In progress", in_progress),
        roadmap_column("at-risk", "At risk", at_risk),
        roadmap_column("done", "Done", done),
        roadmap_column("canceled", "Canceled", canceled),
    ]
}

fn epic_owner_key(owner_ref: &str) -> String {
    let raw = owner_ref
        .trim()
        .strip_prefix("comtrya://")
        .unwrap_or(owner_ref);
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
        "owner".to_string()
    } else {
        format!("owner-{key}")
    }
}

fn owner_column(
    key: &str,
    label: &str,
    owner_ref: Option<String>,
    cards: Vec<EpicOwnerCard>,
) -> EpicOwnerColumn {
    EpicOwnerColumn {
        key: key.to_string(),
        label: label.to_string(),
        owner_ref,
        count: cards.len() as u32,
        cards,
    }
}

fn owner_columns(cards: Vec<EpicOwnerCard>) -> Vec<EpicOwnerColumn> {
    let mut unowned = Vec::new();
    let mut owned: BTreeMap<String, (String, Vec<EpicOwnerCard>)> = BTreeMap::new();

    for card in cards {
        let owner_ref = card
            .epic
            .owner_ref
            .as_deref()
            .map(str::trim)
            .filter(|owner_ref| !owner_ref.is_empty())
            .map(str::to_string);
        let Some(owner_ref) = owner_ref else {
            unowned.push(card);
            continue;
        };
        let key = epic_owner_key(&owner_ref);
        let entry = owned.entry(key).or_insert_with(|| (owner_ref, Vec::new()));
        entry.1.push(card);
    }

    let mut columns = vec![owner_column("unowned", "Unowned", None, unowned)];
    columns.extend(owned.into_iter().map(|(key, (owner_ref, cards))| {
        owner_column(&key, &owner_ref, Some(owner_ref.clone()), cards)
    }));
    columns
}

fn epic_project_key(project_name: &str) -> String {
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
    cards: Vec<EpicProjectCard>,
) -> EpicProjectColumn {
    EpicProjectColumn {
        key: key.to_string(),
        label: label.to_string(),
        project_name,
        count: cards.len() as u32,
        cards,
    }
}

fn project_columns(cards: Vec<EpicProjectCard>) -> Vec<EpicProjectColumn> {
    let mut unscoped = Vec::new();
    let mut scoped: BTreeMap<String, (String, Vec<EpicProjectCard>)> = BTreeMap::new();

    for card in cards {
        let project_name = card
            .epic
            .project_name
            .as_deref()
            .map(str::trim)
            .filter(|project_name| !project_name.is_empty())
            .map(str::to_string);
        let Some(project_name) = project_name else {
            unscoped.push(card);
            continue;
        };
        let key = epic_project_key(&project_name);
        let entry = scoped
            .entry(key)
            .or_insert_with(|| (project_name, Vec::new()));
        entry.1.push(card);
    }

    let mut columns = vec![project_column("unscoped", "Unscoped", None, unscoped)];
    columns.extend(scoped.into_iter().map(|(key, (project_name, cards))| {
        project_column(&key, &project_name, Some(project_name.clone()), cards)
    }));
    columns
}

impl EpicsGuest for Component {
    fn create_epic(input: CreateEpicInput) -> Result<Epic, Error> {
        let (workspace_id, workspace) = workspace_uri(input.workspace.trim())?;
        let title = input.title.trim();
        if title.is_empty() {
            return Err(err(ErrorCode::BadInput, "epic title must not be empty"));
        }
        if title.len() > MAX_TITLE_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("epic title must be at most {MAX_TITLE_LEN} bytes"),
            ));
        }
        if input.body_markdown.len() > MAX_BODY_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("epic body must be at most {MAX_BODY_LEN} bytes"),
            ));
        }
        let id = ids::mint("epic")?;
        let now = time::now_iso();
        let project_name = input
            .project_name
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        let number = next_epic_number(&workspace_id)?;
        let stored = StoredEpic {
            id: id.clone(),
            workspace,
            workspace_id,
            title: title.to_string(),
            body_markdown: input.body_markdown,
            state: state_to_str(EpicState::Planned).to_string(),
            number,
            target_date: input.target_date,
            owner_ref: input.owner_ref,
            labels: input.labels,
            created_at: now.clone(),
            updated_at: now,
            closed_at: None,
            project_name,
        };
        persist_new(&stored)?;
        let epic_ref = epic_uri(&stored.id);
        if let Some(parent) = input.parent_epic_ref.as_deref() {
            let _ = relations::create(&epic_ref, parent, PART_OF, None)?;
        }
        emit(
            "dev.comtrya.epic.created",
            &EpicEventPayload {
                epic_id: &stored.id,
                workspace_id: &stored.workspace_id,
                title: Some(&stored.title),
                state: None,
                project_name: stored.project_name.as_deref(),
            },
            &epic_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn change_state_epic(input: ChangeStateEpicInput) -> Result<Epic, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        let current = stored.state.clone();
        let state = state_to_str(input.state).to_string();
        if current == state {
            return Ok(stored.to_wit());
        }
        if !can_transition_epic_state(&current, &state) {
            return Err(err(
                ErrorCode::BadInput,
                format!("invalid epic state transition: {current} -> {state}"),
            ));
        }
        let now = time::now_iso();
        stored.state = state.clone();
        stored.updated_at = now.clone();
        stored.closed_at = if matches!(state.as_str(), "DONE" | "CANCELED") {
            Some(now)
        } else {
            None
        };
        commit_update(&input.id, &stored, &snap.version)?;
        emit(
            "dev.comtrya.epic.state-changed",
            &EpicEventPayload {
                epic_id: &stored.id,
                workspace_id: &stored.workspace_id,
                title: None,
                state: Some(&state),
                project_name: stored.project_name.as_deref(),
            },
            &epic_uri(&stored.id),
        )?;
        Ok(stored.to_wit())
    }

    /// 0.1.2 — retroactively assign (or clear) the Project this
    /// epic belongs to. Mirrors iter 67's `ext_issues.assign-project`:
    /// trim + normalise the incoming name so blank/whitespace
    /// collapses to `None`. No-op writes return the existing
    /// snapshot without emitting an event so SSE consumers don't
    /// see echoes on idempotent UI calls. Emits
    /// `dev.comtrya.epic.project-changed` carrying previous + next
    /// names for the iter-65 workspace count bucket-swap.
    fn assign_project(input: AssignProjectInput) -> Result<Epic, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        let previous = stored.project_name.clone();
        let normalised = input
            .project_name
            .as_deref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        if normalised == previous {
            return Ok(stored.to_wit());
        }
        stored.project_name = normalised.clone();
        stored.updated_at = time::now_iso();
        commit_update(&input.id, &stored, &snap.version)?;
        emit(
            "dev.comtrya.epic.project-changed",
            &EpicProjectChangedPayload {
                epic_id: &stored.id,
                workspace_id: &stored.workspace_id,
                previous_project: previous.as_deref(),
                project_name: normalised.as_deref(),
            },
            &epic_uri(&stored.id),
        )?;
        Ok(stored.to_wit())
    }

    /// 0.1.5 — partial update of mutable epic fields. Only `Some`
    /// fields are applied; `None` leaves the stored field unchanged.
    /// `labels: Some([])` clears the label set; `labels: None` keeps
    /// the existing labels. `title` is trimmed and validated the same
    /// way as at create time. `updated-at` is bumped on every
    /// successful write.
    fn update_epic(input: UpdateEpicInput) -> Result<Epic, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        if let Some(title) = input.title {
            let title = title.trim().to_string();
            if title.is_empty() {
                return Err(err(ErrorCode::BadInput, "epic title must not be empty"));
            }
            if title.len() > MAX_TITLE_LEN {
                return Err(err(
                    ErrorCode::BadInput,
                    format!("epic title must be at most {MAX_TITLE_LEN} bytes"),
                ));
            }
            stored.title = title;
        }
        if let Some(body) = input.body_markdown {
            if body.len() > MAX_BODY_LEN {
                return Err(err(
                    ErrorCode::BadInput,
                    format!("epic body must be at most {MAX_BODY_LEN} bytes"),
                ));
            }
            stored.body_markdown = body;
        }
        if let Some(owner_ref) = input.owner_ref {
            stored.owner_ref = if owner_ref.trim().is_empty() {
                None
            } else {
                Some(owner_ref)
            };
        }
        if let Some(target_date) = input.target_date {
            stored.target_date = if target_date.trim().is_empty() {
                None
            } else {
                Some(target_date)
            };
        }
        if let Some(labels) = input.labels {
            // Trim + deduplicate, same as create-epic.
            let mut seen = std::collections::BTreeSet::new();
            stored.labels = labels
                .iter()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .filter(|s| seen.insert(s.clone()))
                .collect();
        }
        stored.updated_at = time::now_iso();
        commit_update(&input.id, &stored, &snap.version)?;
        Ok(stored.to_wit())
    }

    fn get_epic(id: String) -> Result<Option<Epic>, Error> {
        Ok(read_stored(&id)?.map(|stored| stored.to_wit()))
    }

    fn list_epics(workspace: String, limit: u32) -> Result<Vec<Epic>, Error> {
        let workspace_id = workspace_id(&workspace)
            .ok_or_else(|| err(ErrorCode::BadInput, "epics.list requires a workspace"))?;
        let limit = limit.min(1024) as usize;
        if limit == 0 {
            return Ok(Vec::new());
        }
        let mut out = Vec::new();
        scan_epics(|stored| {
            if stored.workspace_id == workspace_id {
                out.push(stored.to_wit());
                if out.len() >= limit {
                    return Ok(true);
                }
            }
            Ok(false)
        })?;
        Ok(out)
    }

    fn by_ref_epic(ref_: String) -> Result<Option<Epic>, Error> {
        Ok(read_by_ref(&ref_)?.map(|stored| stored.to_wit()))
    }

    fn by_refs_epic(refs: Vec<String>) -> Result<Vec<Option<Epic>>, Error> {
        refs.iter()
            .map(|ref_uri| read_by_ref(ref_uri).map(|epic| epic.map(|stored| stored.to_wit())))
            .collect()
    }

    fn progress_epic(ref_: String) -> Result<EpicProgress, Error> {
        // Internal aggregation: use the maximum per-call cap so progress
        // for large epics reflects the most members the contract admits.
        let issue_uris = member_uris(&ref_, "issue", 1024)?;
        let (issues_open, issues_closed) = issue_state_counts(&issue_uris)?;
        let child_uris = member_uris(&ref_, "epic", 1024)?;
        let child_epics = Self::by_refs_epic(child_uris)?;
        let mut child_epics_open = 0;
        let mut child_epics_closed = 0;
        for epic in child_epics.into_iter().flatten() {
            match epic.state {
                EpicState::Done | EpicState::Canceled => child_epics_closed += 1,
                _ => child_epics_open += 1,
            }
        }
        let total = issues_open + issues_closed + child_epics_open + child_epics_closed;
        let completed = issues_closed + child_epics_closed;
        let percent_complete = if total == 0 {
            0
        } else {
            ((completed as f64) * 100.0 / (total as f64)).round() as u64
        };
        Ok(EpicProgress {
            issues_open,
            issues_closed,
            child_epics_open,
            child_epics_closed,
            percent_complete,
        })
    }

    fn roadmap_board(input: RoadmapBoardInput) -> Result<EpicRoadmapBoard, Error> {
        let (_, workspace) = workspace_uri(input.workspace.trim())?;
        let limit = input.limit.min(1024);
        let epics = if limit == 0 {
            Vec::new()
        } else {
            Self::list_epics(workspace.clone(), limit)?
        };
        let mut cards = Vec::with_capacity(epics.len());
        for epic in epics {
            let progress = Self::progress_epic(epic_uri(&epic.id))?;
            cards.push(EpicRoadmapCard { epic, progress });
        }
        let total = cards.len() as u32;
        Ok(EpicRoadmapBoard {
            workspace,
            total,
            columns: roadmap_columns(cards),
        })
    }

    fn owner_board(input: OwnerBoardInput) -> Result<EpicOwnerBoard, Error> {
        let (_, workspace) = workspace_uri(input.workspace.trim())?;
        let limit = input.limit.min(1024);
        let epics = if limit == 0 {
            Vec::new()
        } else {
            Self::list_epics(workspace.clone(), limit)?
        };
        let mut cards = Vec::with_capacity(epics.len());
        for epic in epics {
            let progress = Self::progress_epic(epic_uri(&epic.id))?;
            cards.push(EpicOwnerCard { epic, progress });
        }
        let total = cards.len() as u32;
        Ok(EpicOwnerBoard {
            workspace,
            total,
            columns: owner_columns(cards),
        })
    }

    fn project_board(input: ProjectBoardInput) -> Result<EpicProjectBoard, Error> {
        let (_, workspace) = workspace_uri(input.workspace.trim())?;
        let limit = input.limit.min(1024);
        let epics = if limit == 0 {
            Vec::new()
        } else {
            Self::list_epics(workspace.clone(), limit)?
        };
        let mut cards = Vec::with_capacity(epics.len());
        for epic in epics {
            let progress = Self::progress_epic(epic_uri(&epic.id))?;
            cards.push(EpicProjectCard { epic, progress });
        }
        let total = cards.len() as u32;
        Ok(EpicProjectBoard {
            workspace,
            total,
            columns: project_columns(cards),
        })
    }

    fn issues_in_epic(ref_: String, limit: u32) -> Result<Vec<String>, Error> {
        member_uris(&ref_, "issue", limit)
    }

    fn children_of_epic(ref_: String, limit: u32) -> Result<Vec<String>, Error> {
        member_uris(&ref_, "epic", limit)
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
    use super::*;

    fn epic(id: &str, state: EpicState) -> Epic {
        Epic {
            id: id.to_string(),
            workspace: "comtrya://workspace/ws_test".to_string(),
            title: id.to_string(),
            body_markdown: String::new(),
            state,
            number: 1,
            target_date: None,
            owner_ref: None,
            labels: Vec::new(),
            created_at: "2026-06-20T00:00:00Z".to_string(),
            updated_at: "2026-06-20T00:00:00Z".to_string(),
            closed_at: None,
            project_name: None,
        }
    }

    fn progress(percent_complete: u64) -> EpicProgress {
        EpicProgress {
            issues_open: 0,
            issues_closed: 0,
            child_epics_open: 0,
            child_epics_closed: 0,
            percent_complete,
        }
    }

    fn card(id: &str, state: EpicState, percent_complete: u64) -> EpicRoadmapCard {
        EpicRoadmapCard {
            epic: epic(id, state),
            progress: progress(percent_complete),
        }
    }

    fn owner_card(id: &str, owner_ref: Option<&str>) -> EpicOwnerCard {
        let mut epic = epic(id, EpicState::Planned);
        epic.owner_ref = owner_ref.map(str::to_string);
        EpicOwnerCard {
            epic,
            progress: progress(0),
        }
    }

    fn project_card(id: &str, project_name: Option<&str>) -> EpicProjectCard {
        let mut epic = epic(id, EpicState::Planned);
        epic.project_name = project_name.map(str::to_string);
        EpicProjectCard {
            epic,
            progress: progress(0),
        }
    }

    #[test]
    fn roadmap_columns_group_cards_by_epic_state() {
        let columns = roadmap_columns(vec![
            card("planned", EpicState::Planned, 0),
            card("risk", EpicState::AtRisk, 25),
            card("doing", EpicState::InProgress, 50),
            card("done", EpicState::Done, 100),
            card("canceled", EpicState::Canceled, 0),
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(
            keys,
            ["planned", "in-progress", "at-risk", "done", "canceled"]
        );
        assert_eq!(columns.iter().map(|column| column.count).sum::<u32>(), 5);
        assert_eq!(columns[0].cards[0].epic.id, "planned");
        assert_eq!(columns[1].cards[0].progress.percent_complete, 50);
        assert_eq!(columns[2].cards[0].epic.id, "risk");
        assert_eq!(columns[3].cards[0].epic.id, "done");
        assert_eq!(columns[4].cards[0].epic.id, "canceled");
    }

    #[test]
    fn owner_columns_group_unowned_and_owned_epics() {
        let columns = owner_columns(vec![
            owner_card("unowned", None),
            owner_card("rawkode", Some("comtrya://user/rawkode")),
            owner_card("team", Some("comtrya://team/platform-maintainers")),
            owner_card("rawkode-two", Some("comtrya://user/rawkode")),
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(
            keys,
            [
                "unowned",
                "owner-team-platform-maintainers",
                "owner-user-rawkode"
            ]
        );
        assert_eq!(columns[0].owner_ref, None);
        assert_eq!(columns[0].cards[0].epic.id, "unowned");
        assert_eq!(
            columns[1].owner_ref.as_deref(),
            Some("comtrya://team/platform-maintainers")
        );
        assert_eq!(columns[1].cards[0].epic.id, "team");
        assert_eq!(
            columns[2].owner_ref.as_deref(),
            Some("comtrya://user/rawkode")
        );
        assert_eq!(columns[2].count, 2);
        assert_eq!(
            columns[2]
                .cards
                .iter()
                .map(|card| card.epic.id.as_str())
                .collect::<Vec<_>>(),
            ["rawkode", "rawkode-two"]
        );
    }

    #[test]
    fn project_columns_group_unscoped_and_project_epics() {
        let columns = project_columns(vec![
            project_card("unscoped", None),
            project_card("kernel", Some("kernel")),
            project_card("product", Some("Product Design")),
            project_card("kernel-two", Some("kernel")),
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(
            keys,
            ["unscoped", "project-kernel", "project-product-design"]
        );
        assert_eq!(columns[0].project_name, None);
        assert_eq!(columns[0].cards[0].epic.id, "unscoped");
        assert_eq!(columns[1].project_name.as_deref(), Some("kernel"));
        assert_eq!(columns[1].count, 2);
        assert_eq!(
            columns[1]
                .cards
                .iter()
                .map(|card| card.epic.id.as_str())
                .collect::<Vec<_>>(),
            ["kernel", "kernel-two"]
        );
        assert_eq!(columns[2].project_name.as_deref(), Some("Product Design"));
        assert_eq!(columns[2].cards[0].epic.id, "product");
    }
}
