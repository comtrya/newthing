use crate::domain::{Principal, ResourceRef, Visibility};
use crate::ids::{IdPrefix, OpaqueId};

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
            Self::InstanceConfigReloadStarted => "dev.comtrya.instance.config.reload.started",
            Self::InstanceConfigReloadSucceeded => "dev.comtrya.instance.config.reload.succeeded",
            Self::InstanceConfigReloadFailed => "dev.comtrya.instance.config.reload.failed",
            Self::InstanceBackupStarted => "dev.comtrya.instance.backup.started",
            Self::InstanceBackupSucceeded => "dev.comtrya.instance.backup.succeeded",
            Self::InstanceBackupFailed => "dev.comtrya.instance.backup.failed",
            Self::InstanceRestoreStarted => "dev.comtrya.instance.restore.started",
            Self::InstanceRestoreCompleted => "dev.comtrya.instance.restore.completed",
            Self::InstanceRestoreFailed => "dev.comtrya.instance.restore.failed",
            Self::AuthLoginSucceeded => "dev.comtrya.auth.login.succeeded",
            Self::AuthLoginFailed => "dev.comtrya.auth.login.failed",
            Self::AuthCredentialIssued => "dev.comtrya.auth.credential.issued",
            Self::UserCreated => "dev.comtrya.user.created",
            Self::UserDeactivated => "dev.comtrya.user.deactivated",
            Self::TeamCreated => "dev.comtrya.team.created",
            Self::TeamDeleted => "dev.comtrya.team.deleted",
            Self::TeamMemberAdded => "dev.comtrya.team.member.added",
            Self::TeamMemberRemoved => "dev.comtrya.team.member.removed",
            Self::WorkspaceCreated => "dev.comtrya.workspace.created",
            Self::WorkspaceUpdated => "dev.comtrya.workspace.updated",
            Self::WorkspaceDeleted => "dev.comtrya.workspace.deleted",
            Self::GroupCreated => "dev.comtrya.group.created",
            Self::GroupUpdated => "dev.comtrya.group.updated",
            Self::GroupMoved => "dev.comtrya.group.moved",
            Self::GroupDeleted => "dev.comtrya.group.deleted",
            Self::RepositoryCreated => "dev.comtrya.repository.created",
            Self::RepositoryUpdated => "dev.comtrya.repository.updated",
            Self::RepositoryRenamed => "dev.comtrya.repository.renamed",
            Self::RepositoryVisibilityChanged => "dev.comtrya.repository.visibility.changed",
            Self::RepositoryDeleted => "dev.comtrya.repository.deleted",
            Self::RepositoryRefUpdated => "dev.comtrya.repository.ref.updated",
            Self::RepositoryPushRejected => "dev.comtrya.repository.push.rejected",
            Self::RepositoryConfigValidated => "dev.comtrya.repository.config.validated",
            Self::RepositoryConfigRejected => "dev.comtrya.repository.config.rejected",
            Self::ProjectCreated => "dev.comtrya.project.created",
            Self::ProjectUpdated => "dev.comtrya.project.updated",
            Self::ProjectDeleted => "dev.comtrya.project.deleted",
            Self::CheckCreated => "dev.comtrya.check.created",
            Self::CheckUpdated => "dev.comtrya.check.updated",
            Self::ExtensionInstalled => "dev.comtrya.extension.installed",
            Self::ExtensionActivated => "dev.comtrya.extension.activated",
            Self::ExtensionDisabled => "dev.comtrya.extension.disabled",
            Self::ExtensionFailed => "dev.comtrya.extension.failed",
            Self::SecretAccessed => "dev.comtrya.secret.accessed",
            Self::PublisherDeliverySucceeded => "dev.comtrya.publisher.delivery.succeeded",
            Self::PublisherDeliveryFailed => "dev.comtrya.publisher.delivery.failed",
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

/// Inputs for constructing a kernel [`EventEnvelope`]. Grouping the addressing,
/// authorship, and payload fields keeps the constructor a single typed
/// boundary instead of a long positional argument list.
#[derive(Debug, Clone)]
pub struct CoreEvent {
    pub event_type: CoreEventType,
    pub source: ResourceRef,
    pub subject: Option<String>,
    pub actor: EventActor,
    pub visibility: Visibility,
    pub resources: Vec<ResourceRef>,
    pub data_json: String,
}

impl EventEnvelope {
    /// Build a kernel-emitted CloudEvent, stamping `now_ms` (Unix-epoch
    /// milliseconds, supplied by the caller's clock) as the event time.
    pub fn core(event: CoreEvent, now_ms: u64) -> Self {
        let id = OpaqueId::new(IdPrefix::Event);
        Self {
            specversion: "1.0".to_string(),
            correlation_id: id.clone(),
            causation_id: id.clone(),
            id,
            event_type: event.event_type.as_str().to_string(),
            source: event.source,
            subject: event.subject,
            time: crate::clock::millis_to_rfc3339(now_ms),
            datacontenttype: "application/json".to_string(),
            dataschema: None,
            actor: event.actor,
            visibility: event.visibility,
            resources: event.resources,
            data_json: event.data_json,
        }
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

    /// Move every buffered event out of the outbox. Used by callers that
    /// own the events' downstream sink (audit log / event stream) and
    /// must guarantee the buffer doesn't grow unbounded across calls.
    pub fn take_all(&mut self) -> Vec<EventEnvelope> {
        std::mem::take(&mut self.events)
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
        ResourceRef::parse("comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap()
    }

    fn actor() -> EventActor {
        EventActor {
            kind: "user".to_string(),
            uri: "comtrya://user/usr_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            display_name: Some("Rawkode".to_string()),
        }
    }

    #[test]
    fn core_event_type_names_match_spec() {
        assert_eq!(
            CoreEventType::RepositoryRefUpdated.as_str(),
            "dev.comtrya.repository.ref.updated"
        );
        assert_eq!(
            CoreEventType::InstanceRestoreCompleted.as_str(),
            "dev.comtrya.instance.restore.completed"
        );
        assert_eq!(
            CoreEventType::PublisherDeliveryFailed.as_str(),
            "dev.comtrya.publisher.delivery.failed"
        );
    }

    #[test]
    fn core_stamps_caller_supplied_time() {
        let event = EventEnvelope::core(
            CoreEvent {
                event_type: CoreEventType::RepositoryRefUpdated,
                source: repo_ref(),
                subject: Some("refs/heads/main".to_string()),
                actor: actor(),
                visibility: Visibility::Private,
                resources: vec![repo_ref()],
                data_json: "{}".to_string(),
            },
            1_609_459_200_000,
        );

        assert_eq!(event.time, "2021-01-01T00:00:00.000Z");
        assert_eq!(event.event_type, "dev.comtrya.repository.ref.updated");
    }

    #[test]
    fn outbox_appends_in_order() {
        let mut outbox = EventOutbox::default();
        let first = outbox.append(EventEnvelope::core(
            CoreEvent {
                event_type: CoreEventType::RepositoryRefUpdated,
                source: repo_ref(),
                subject: None,
                actor: actor(),
                visibility: Visibility::Internal,
                resources: vec![repo_ref()],
                data_json: "{}".to_string(),
            },
            10,
        ));
        let second = outbox.append(EventEnvelope::core(
            CoreEvent {
                event_type: CoreEventType::RepositoryRefUpdated,
                source: repo_ref(),
                subject: None,
                actor: actor(),
                visibility: Visibility::Internal,
                resources: vec![repo_ref()],
                data_json: "{}".to_string(),
            },
            20,
        ));

        assert_eq!(first, 0);
        assert_eq!(second, 1);
        assert_eq!(outbox.all().len(), 2);
        assert_eq!(outbox.all()[0].time, "1970-01-01T00:00:00.010Z");
    }

    #[test]
    fn resource_kind_import_remains_used_for_event_contracts() {
        assert_eq!(ResourceKind::Repository.as_str(), "repository");
    }
}
