use crate::domain::{Principal, ResourceRef, Visibility};
use crate::error::{CoreError, CoreResult};
use crate::ids::{IdPrefix, OpaqueId};
use std::collections::BTreeSet;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CoreEventType {
    InstanceConfigReloadStarted,
    InstanceConfigReloadSucceeded,
    InstanceConfigReloadFailed,
    InstanceBackupStarted,
    InstanceBackupSucceeded,
    InstanceBackupFailed,
    InstanceRestoreStarted,
    InstanceRestoreCompleted,
    InstanceRestoreFailed,
    AuthLoginSucceeded,
    AuthLoginFailed,
    AuthCredentialIssued,
    UserCreated,
    UserDeactivated,
    TeamCreated,
    TeamDeleted,
    TeamMemberAdded,
    TeamMemberRemoved,
    WorkspaceCreated,
    WorkspaceUpdated,
    WorkspaceDeleted,
    GroupCreated,
    GroupUpdated,
    GroupMoved,
    GroupDeleted,
    RepositoryCreated,
    RepositoryUpdated,
    RepositoryRenamed,
    RepositoryVisibilityChanged,
    RepositoryDeleted,
    RepositoryRefUpdated,
    RepositoryPushRejected,
    RepositoryConfigValidated,
    RepositoryConfigRejected,
    ProjectCreated,
    ProjectUpdated,
    ProjectDeleted,
    CheckCreated,
    CheckUpdated,
    JobQueued,
    JobStarted,
    JobSucceeded,
    JobFailed,
    JobDead,
    ExtensionInstalled,
    ExtensionActivated,
    ExtensionDisabled,
    ExtensionFailed,
    SecretAccessed,
    PublisherDeliverySucceeded,
    PublisherDeliveryFailed,
}

impl CoreEventType {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::InstanceConfigReloadStarted => "dev.forgepoint.instance.config.reload.started",
            Self::InstanceConfigReloadSucceeded => {
                "dev.forgepoint.instance.config.reload.succeeded"
            }
            Self::InstanceConfigReloadFailed => "dev.forgepoint.instance.config.reload.failed",
            Self::InstanceBackupStarted => "dev.forgepoint.instance.backup.started",
            Self::InstanceBackupSucceeded => "dev.forgepoint.instance.backup.succeeded",
            Self::InstanceBackupFailed => "dev.forgepoint.instance.backup.failed",
            Self::InstanceRestoreStarted => "dev.forgepoint.instance.restore.started",
            Self::InstanceRestoreCompleted => "dev.forgepoint.instance.restore.completed",
            Self::InstanceRestoreFailed => "dev.forgepoint.instance.restore.failed",
            Self::AuthLoginSucceeded => "dev.forgepoint.auth.login.succeeded",
            Self::AuthLoginFailed => "dev.forgepoint.auth.login.failed",
            Self::AuthCredentialIssued => "dev.forgepoint.auth.credential.issued",
            Self::UserCreated => "dev.forgepoint.user.created",
            Self::UserDeactivated => "dev.forgepoint.user.deactivated",
            Self::TeamCreated => "dev.forgepoint.team.created",
            Self::TeamDeleted => "dev.forgepoint.team.deleted",
            Self::TeamMemberAdded => "dev.forgepoint.team.member.added",
            Self::TeamMemberRemoved => "dev.forgepoint.team.member.removed",
            Self::WorkspaceCreated => "dev.forgepoint.workspace.created",
            Self::WorkspaceUpdated => "dev.forgepoint.workspace.updated",
            Self::WorkspaceDeleted => "dev.forgepoint.workspace.deleted",
            Self::GroupCreated => "dev.forgepoint.group.created",
            Self::GroupUpdated => "dev.forgepoint.group.updated",
            Self::GroupMoved => "dev.forgepoint.group.moved",
            Self::GroupDeleted => "dev.forgepoint.group.deleted",
            Self::RepositoryCreated => "dev.forgepoint.repository.created",
            Self::RepositoryUpdated => "dev.forgepoint.repository.updated",
            Self::RepositoryRenamed => "dev.forgepoint.repository.renamed",
            Self::RepositoryVisibilityChanged => "dev.forgepoint.repository.visibility.changed",
            Self::RepositoryDeleted => "dev.forgepoint.repository.deleted",
            Self::RepositoryRefUpdated => "dev.forgepoint.repository.ref.updated",
            Self::RepositoryPushRejected => "dev.forgepoint.repository.push.rejected",
            Self::RepositoryConfigValidated => "dev.forgepoint.repository.config.validated",
            Self::RepositoryConfigRejected => "dev.forgepoint.repository.config.rejected",
            Self::ProjectCreated => "dev.forgepoint.project.created",
            Self::ProjectUpdated => "dev.forgepoint.project.updated",
            Self::ProjectDeleted => "dev.forgepoint.project.deleted",
            Self::CheckCreated => "dev.forgepoint.check.created",
            Self::CheckUpdated => "dev.forgepoint.check.updated",
            Self::JobQueued => "dev.forgepoint.job.queued",
            Self::JobStarted => "dev.forgepoint.job.started",
            Self::JobSucceeded => "dev.forgepoint.job.succeeded",
            Self::JobFailed => "dev.forgepoint.job.failed",
            Self::JobDead => "dev.forgepoint.job.dead",
            Self::ExtensionInstalled => "dev.forgepoint.extension.installed",
            Self::ExtensionActivated => "dev.forgepoint.extension.activated",
            Self::ExtensionDisabled => "dev.forgepoint.extension.disabled",
            Self::ExtensionFailed => "dev.forgepoint.extension.failed",
            Self::SecretAccessed => "dev.forgepoint.secret.accessed",
            Self::PublisherDeliverySucceeded => "dev.forgepoint.publisher.delivery.succeeded",
            Self::PublisherDeliveryFailed => "dev.forgepoint.publisher.delivery.failed",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EventActor {
    pub kind: String,
    pub uri: String,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EventEnvelope {
    pub specversion: String,
    pub id: OpaqueId,
    pub event_type: String,
    pub source: ResourceRef,
    pub subject: Option<String>,
    pub time: String,
    pub datacontenttype: String,
    pub dataschema: Option<String>,
    pub actor: EventActor,
    pub visibility: Visibility,
    pub resources: Vec<ResourceRef>,
    pub correlation_id: OpaqueId,
    pub causation_id: OpaqueId,
    pub data_json: String,
}

impl EventEnvelope {
    pub fn core(
        event_type: CoreEventType,
        source: ResourceRef,
        subject: Option<String>,
        actor: EventActor,
        visibility: Visibility,
        resources: Vec<ResourceRef>,
        data_json: impl Into<String>,
    ) -> Self {
        let id = OpaqueId::new(IdPrefix::Event);
        Self {
            specversion: "1.0".to_string(),
            correlation_id: id.clone(),
            causation_id: id.clone(),
            id,
            event_type: event_type.as_str().to_string(),
            source,
            subject,
            time: "1970-01-01T00:00:00Z".to_string(),
            datacontenttype: "application/json".to_string(),
            dataschema: None,
            actor,
            visibility,
            resources,
            data_json: data_json.into(),
        }
    }

    pub fn visible_to(&self, principal: &Principal, allowed_resources: &BTreeSet<String>) -> bool {
        match self.visibility {
            Visibility::Public => true,
            Visibility::Internal => !matches!(principal, Principal::Anonymous),
            Visibility::Private => self
                .resources
                .iter()
                .any(|resource| allowed_resources.contains(&resource.canonical())),
        }
    }

    pub fn to_sse_frame(&self, cursor: &StreamCursor) -> String {
        format!(
            "id: {}\nevent: {}\ndata: {}\n\n",
            cursor.encode(),
            self.event_type,
            self.to_json()
        )
    }

    pub fn to_json(&self) -> String {
        let resources = self
            .resources
            .iter()
            .map(|resource| format!("\"{}\"", resource.canonical()))
            .collect::<Vec<_>>()
            .join(",");
        format!(
            "{{\"specversion\":\"{}\",\"id\":\"{}\",\"type\":\"{}\",\"source\":\"{}\",\"time\":\"{}\",\"datacontenttype\":\"{}\",\"actor\":{{\"kind\":\"{}\",\"id\":\"{}\"}},\"visibility\":\"{}\",\"resources\":[{}],\"correlationid\":\"{}\",\"causationid\":\"{}\",\"data\":{}}}",
            self.specversion,
            self.id,
            self.event_type,
            self.source,
            self.time,
            self.datacontenttype,
            self.actor.kind,
            self.actor.uri,
            self.visibility,
            resources,
            self.correlation_id,
            self.causation_id,
            self.data_json
        )
    }

    pub fn strict_cloudevents_projection(&self) -> String {
        let resources = self
            .resources
            .iter()
            .map(|resource| format!("\"{}\"", resource.canonical()))
            .collect::<Vec<_>>()
            .join(",");
        format!(
            "{{\"specversion\":\"{}\",\"id\":\"{}\",\"type\":\"{}\",\"source\":\"{}\",\"time\":\"{}\",\"datacontenttype\":\"{}\",\"actor\":\"{}\",\"visibility\":\"{}\",\"correlationid\":\"{}\",\"causationid\":\"{}\",\"data\":{{\"resources\":[{}],\"payload\":{}}}}}",
            self.specversion,
            self.id,
            self.event_type,
            self.source,
            self.time,
            self.datacontenttype,
            self.actor.uri,
            self.visibility,
            self.correlation_id,
            self.causation_id,
            resources,
            self.data_json
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EventFilter {
    pub resource: Option<String>,
    pub types: Vec<String>,
    pub visibility: Vec<Visibility>,
}

impl EventFilter {
    pub fn matches(&self, event: &EventEnvelope) -> bool {
        if self
            .resource
            .as_deref()
            .is_some_and(|resource| !event.resources.iter().any(|r| r.canonical() == resource))
        {
            return false;
        }
        if !self.types.is_empty() && !self.types.iter().any(|kind| kind == &event.event_type) {
            return false;
        }
        if !self.visibility.is_empty() && !self.visibility.contains(&event.visibility) {
            return false;
        }
        true
    }
}

#[derive(Debug, Default, Clone)]
pub struct EventOutbox {
    events: Vec<EventEnvelope>,
}

impl EventOutbox {
    pub fn append(&mut self, event: EventEnvelope) -> usize {
        self.events.push(event);
        self.events.len() - 1
    }

    pub fn all(&self) -> &[EventEnvelope] {
        &self.events
    }

    pub fn visible_events(
        &self,
        principal: &Principal,
        allowed_resources: &BTreeSet<String>,
        filter: &EventFilter,
    ) -> Vec<&EventEnvelope> {
        self.events
            .iter()
            .filter(|event| filter.matches(event))
            .filter(|event| event.visible_to(principal, allowed_resources))
            .collect()
    }

    pub fn resume(
        &self,
        cursor: Option<&str>,
        principal: &Principal,
        allowed_resources: &BTreeSet<String>,
        now_unix: u64,
        filter: &EventFilter,
    ) -> StreamResume<'_> {
        let Some(cursor) = cursor else {
            return StreamResume {
                rejected: None,
                events: self
                    .events
                    .iter()
                    .enumerate()
                    .filter(|(_, event)| filter.matches(event))
                    .filter(|(_, event)| event.visible_to(principal, allowed_resources))
                    .collect(),
            };
        };

        let principal_key = principal_key(principal);
        let parsed = StreamCursor::decode(cursor);
        let Ok(parsed) = parsed else {
            return StreamResume::rejected("invalid", Vec::new());
        };
        if parsed.principal_key != principal_key
            || now_unix.saturating_sub(parsed.issued_at) > 86_400
        {
            return StreamResume::rejected("stale_or_wrong_principal", Vec::new());
        }

        StreamResume {
            rejected: None,
            events: self
                .events
                .iter()
                .enumerate()
                .skip(parsed.position + 1)
                .filter(|(_, event)| filter.matches(event))
                .filter(|(_, event)| event.visible_to(principal, allowed_resources))
                .collect(),
        }
    }
}

pub struct StreamResume<'a> {
    pub rejected: Option<String>,
    pub events: Vec<(usize, &'a EventEnvelope)>,
}

impl<'a> StreamResume<'a> {
    fn rejected(reason: impl Into<String>, events: Vec<(usize, &'a EventEnvelope)>) -> Self {
        Self {
            rejected: Some(reason.into()),
            events,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StreamCursor {
    pub position: usize,
    pub principal_key: String,
    pub issued_at: u64,
}

impl StreamCursor {
    pub fn new(position: usize, principal: &Principal, issued_at: u64) -> Self {
        Self {
            position,
            principal_key: principal_key(principal),
            issued_at,
        }
    }

    pub fn encode(&self) -> String {
        format!(
            "v1.{}.{}.{}",
            self.position, self.issued_at, self.principal_key
        )
    }

    pub fn decode(value: &str) -> CoreResult<Self> {
        let mut parts = value.splitn(4, '.');
        if parts.next() != Some("v1") {
            return Err(CoreError::bad_user_input("unsupported cursor version"));
        }
        let position = parts
            .next()
            .and_then(|value| value.parse::<usize>().ok())
            .ok_or_else(|| CoreError::bad_user_input("cursor position is invalid"))?;
        let issued_at = parts
            .next()
            .and_then(|value| value.parse::<u64>().ok())
            .ok_or_else(|| CoreError::bad_user_input("cursor issued_at is invalid"))?;
        let principal_key = parts
            .next()
            .filter(|value| !value.is_empty())
            .ok_or_else(|| CoreError::bad_user_input("cursor principal is invalid"))?
            .to_string();

        Ok(Self {
            position,
            principal_key,
            issued_at,
        })
    }
}

pub fn principal_key(principal: &Principal) -> String {
    match principal {
        Principal::Anonymous => "anonymous".to_string(),
        Principal::User(id) => format!("user:{id}"),
        Principal::Team(id) => format!("team:{id}"),
        Principal::Workload { issuer, subject } => format!("workload:{issuer}:{subject}"),
        Principal::Extension(id) => format!("extension:{id}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{ResourceKind, ResourceRef};

    fn repo_ref() -> ResourceRef {
        ResourceRef::parse("forgepoint://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap()
    }

    fn actor() -> EventActor {
        EventActor {
            kind: "user".to_string(),
            uri: "forgepoint://user/usr_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            display_name: Some("Rawkode".to_string()),
        }
    }

    #[test]
    fn core_event_type_names_match_spec() {
        assert_eq!(
            CoreEventType::RepositoryRefUpdated.as_str(),
            "dev.forgepoint.repository.ref.updated"
        );
        assert_eq!(
            CoreEventType::InstanceRestoreCompleted.as_str(),
            "dev.forgepoint.instance.restore.completed"
        );
        assert_eq!(
            CoreEventType::PublisherDeliveryFailed.as_str(),
            "dev.forgepoint.publisher.delivery.failed"
        );
    }

    #[test]
    fn private_event_is_not_delivered_to_public_stream() {
        let event = EventEnvelope::core(
            CoreEventType::RepositoryRefUpdated,
            repo_ref(),
            Some("refs/heads/main".to_string()),
            actor(),
            Visibility::Private,
            vec![repo_ref()],
            "{}",
        );
        let mut outbox = EventOutbox::default();
        outbox.append(event);

        let visible = outbox.visible_events(
            &Principal::Anonymous,
            &BTreeSet::new(),
            &EventFilter {
                resource: None,
                types: Vec::new(),
                visibility: Vec::new(),
            },
        );

        assert!(visible.is_empty());
    }

    #[test]
    fn cursor_resume_reapplies_visibility_after_access_loss() {
        let principal = Principal::User(OpaqueId::new(IdPrefix::User));
        let repo = repo_ref();
        let mut allowed = BTreeSet::from([repo.canonical()]);
        let mut outbox = EventOutbox::default();
        outbox.append(EventEnvelope::core(
            CoreEventType::RepositoryRefUpdated,
            repo.clone(),
            Some("refs/heads/main".to_string()),
            actor(),
            Visibility::Private,
            vec![repo.clone()],
            "{}",
        ));
        let cursor = StreamCursor::new(0, &principal, 100).encode();
        outbox.append(EventEnvelope::core(
            CoreEventType::RepositoryRefUpdated,
            repo.clone(),
            Some("refs/heads/main".to_string()),
            actor(),
            Visibility::Private,
            vec![repo.clone()],
            "{}",
        ));

        allowed.clear();
        let resumed = outbox.resume(
            Some(&cursor),
            &principal,
            &allowed,
            120,
            &EventFilter {
                resource: Some(repo.canonical()),
                types: Vec::new(),
                visibility: Vec::new(),
            },
        );

        assert!(resumed.rejected.is_none());
        assert!(resumed.events.is_empty());
    }

    #[test]
    fn stale_last_event_id_is_rejected() {
        let principal = Principal::Anonymous;
        let outbox = EventOutbox::default();
        let cursor = StreamCursor::new(0, &principal, 1).encode();

        let resumed = outbox.resume(
            Some(&cursor),
            &principal,
            &BTreeSet::new(),
            90_000,
            &EventFilter {
                resource: None,
                types: Vec::new(),
                visibility: Vec::new(),
            },
        );

        assert_eq!(
            resumed.rejected.as_deref(),
            Some("stale_or_wrong_principal")
        );
    }

    #[test]
    fn strict_projection_moves_resources_into_data_and_actor_to_uri() {
        let event = EventEnvelope::core(
            CoreEventType::RepositoryRefUpdated,
            repo_ref(),
            Some("refs/heads/main".to_string()),
            actor(),
            Visibility::Internal,
            vec![repo_ref()],
            "{\"ok\":true}",
        );

        let json = event.strict_cloudevents_projection();
        assert!(json.contains("\"actor\":\"forgepoint://user/usr_"));
        assert!(json.contains("\"resources\":[\"forgepoint://repository/repo_"));
        assert!(!json.contains("\"actor\":{\""));
    }

    #[test]
    fn resource_kind_import_remains_used_for_event_contracts() {
        assert_eq!(ResourceKind::Repository.as_str(), "repository");
    }
}
