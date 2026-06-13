// ext_sprints — WASM Component-Model implementation of `sprints.wit`.

mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::relations;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_sprints::sprints::{
    AssignIssueInput, ChangeStateInput, CreateSprintInput, Guest as SprintsGuest, ListSprintsInput,
    MembersInput, Sprint, SprintState,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};

const COLLECTION: &str = "sprints";
const COUNTER_COLLECTION: &str = "ext_sprints_meta";
const MAX_TITLE_LEN: usize = 512;
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
        let now = time::now_iso();
        let state = state_to_str(input.state).to_string();
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
        // Validate sprint ref is well-formed.
        let _ = sprint_id_from_ref(&input.sprint_ref)?;
        let _ = relations::create(&input.issue_ref, &input.sprint_ref, PART_OF, None)?;
        Ok(true)
    }

    fn issues_in_sprint(input: MembersInput) -> Result<Vec<String>, Error> {
        let prefix = "comtrya://issue/";
        let cap = input.limit.min(1024) as usize;
        let mut out: Vec<String> = Vec::with_capacity(cap.min(64));
        let mut after: Option<bindings::comtrya::platform::types::PageToken> = None;
        loop {
            let page = relations::incoming(&input.ref_, Some(PART_OF), 1024, after.as_ref())?;
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
