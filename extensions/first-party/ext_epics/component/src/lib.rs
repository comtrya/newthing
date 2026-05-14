// ext_epics — WASM Component-Model implementation of `epics.wit`.

#[allow(warnings)]
mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::ops;
use bindings::comtrya::platform::relations;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_epics::epics::{
    ChangeStateEpicInput, CreateEpicInput, Epic, EpicProgress, EpicState, Guest as EpicsGuest,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

use serde::{Deserialize, Serialize};

const COLLECTION: &str = "epics";
const MAX_TITLE_LEN: usize = 512;
const MAX_BODY_LEN: usize = 64 * 1024;
const PART_OF: &str = "comtrya://rel/part-of";

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

impl StoredEpic {
    fn to_wit(&self) -> Epic {
        Epic {
            id: self.id.clone(),
            workspace: self.workspace.clone(),
            title: self.title.clone(),
            body_markdown: self.body_markdown.clone(),
            state: state_from_str(&self.state),
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

fn member_uris(epic_ref: &str, kind: &str) -> Result<Vec<String>, Error> {
    let prefix = format!("comtrya://{kind}/");
    let page = relations::incoming(epic_ref, Some(PART_OF), 1024, None)?;
    Ok(page
        .relations
        .into_iter()
        .filter_map(|relation| {
            if relation.source.starts_with(&prefix) {
                Some(relation.source)
            } else {
                None
            }
        })
        .collect())
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
}

fn epic_uri(id: &str) -> String {
    format!("comtrya://epic/{id}")
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
        let stored = StoredEpic {
            id: id.clone(),
            workspace,
            workspace_id,
            title: title.to_string(),
            body_markdown: input.body_markdown,
            state: state_to_str(EpicState::Planned).to_string(),
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
            },
            &epic_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn change_state_epic(input: ChangeStateEpicInput) -> Result<Epic, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        let now = time::now_iso();
        let state = state_to_str(input.state).to_string();
        stored.state = state.clone();
        stored.updated_at = now.clone();
        stored.closed_at = if matches!(input.state, EpicState::Done | EpicState::Canceled) {
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
            },
            &epic_uri(&stored.id),
        )?;
        Ok(stored.to_wit())
    }

    fn get_epic(id: String) -> Result<Option<Epic>, Error> {
        Ok(read_stored(&id)?.map(|stored| stored.to_wit()))
    }

    fn list_epics(workspace: String, limit: u32) -> Result<Vec<Epic>, Error> {
        let workspace_id = workspace_id(&workspace)
            .ok_or_else(|| err(ErrorCode::BadInput, "epics.list requires a workspace"))?;
        let limit = limit.min(1024) as usize;
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
        let issue_uris = member_uris(&ref_, "issue")?;
        let (issues_open, issues_closed) = issue_state_counts(&issue_uris)?;
        let child_uris = member_uris(&ref_, "epic")?;
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

    fn issues_in_epic(ref_: String) -> Result<Vec<String>, Error> {
        member_uris(&ref_, "issue")
    }

    fn children_of_epic(ref_: String) -> Result<Vec<String>, Error> {
        member_uris(&ref_, "epic")
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
