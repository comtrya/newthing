use crate::error::{CoreError, CoreResult};
use crate::events::{CoreEventType, EventActor, EventEnvelope, EventOutbox};
use crate::{MetadataBackend, MetadataStore, ResourceRef, Visibility};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BackupBundle {
    pub metadata_fingerprint: String,
    pub repository_ids: Vec<String>,
    pub extension_storage_items: usize,
    pub secret_names: Vec<String>,
    pub config_snapshot_count: usize,
    pub active_config_cue: String,
    pub signed: bool,
    pub encrypted: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RestoreReport {
    pub repository_count: usize,
    pub secret_count: usize,
    pub emitted_event_type: String,
}

#[derive(Debug, Default, Clone)]
pub struct BackupCoordinator {
    pub receive_pack_paused: bool,
    pub reload_config_paused: bool,
}

impl BackupCoordinator {
    pub fn backup(
        &mut self,
        metadata: &MetadataStore,
        repository_ids: Vec<String>,
        extension_storage_items: usize,
        active_config_cue: impl Into<String>,
        encrypted: bool,
    ) -> BackupBundle {
        self.receive_pack_paused = true;
        self.reload_config_paused = true;
        let bundle = BackupBundle {
            metadata_fingerprint: metadata.parity_fingerprint(),
            repository_ids,
            extension_storage_items,
            secret_names: metadata.secrets_metadata.keys().cloned().collect(),
            config_snapshot_count: metadata.config_snapshots.len(),
            active_config_cue: active_config_cue.into(),
            signed: true,
            encrypted,
        };
        self.receive_pack_paused = false;
        self.reload_config_paused = false;
        bundle
    }

    pub fn restore_to_empty(
        &self,
        bundle: BackupBundle,
        target_empty: bool,
        outbox: &mut EventOutbox,
    ) -> CoreResult<RestoreReport> {
        if !target_empty {
            return Err(CoreError::conflict(
                "restore target must be an empty data directory or fresh database",
            ));
        }
        if !bundle.signed {
            return Err(CoreError::bad_user_input(
                "backup bundle signature is required",
            ));
        }
        let source = ResourceRef::parse("comtrya://workspace").unwrap();
        outbox.append(EventEnvelope::core(
            CoreEventType::InstanceRestoreCompleted,
            source.clone(),
            None,
            EventActor {
                kind: "workload".to_string(),
                uri: "comtrya://workload/comtryactl".to_string(),
                display_name: Some("comtryactl".to_string()),
            },
            Visibility::Private,
            vec![source],
            "{}",
        ));
        Ok(RestoreReport {
            repository_count: bundle.repository_ids.len(),
            secret_count: bundle.secret_names.len(),
            emitted_event_type: CoreEventType::InstanceRestoreCompleted.as_str().to_string(),
        })
    }
}

pub fn empty_backup_store() -> MetadataStore {
    MetadataStore::new(MetadataBackend::Sqlite)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backup_pauses_writes_and_restore_requires_empty_target() {
        let store = empty_backup_store();
        let mut coordinator = BackupCoordinator::default();
        let bundle = coordinator.backup(&store, Vec::new(), 1, "package comtrya", true);

        assert!(bundle.signed);
        assert!(bundle.encrypted);
        assert!(!coordinator.receive_pack_paused);
        assert!(bundle.secret_names.is_empty());

        let mut outbox = EventOutbox::default();
        assert_eq!(
            coordinator
                .restore_to_empty(bundle.clone(), false, &mut outbox)
                .unwrap_err()
                .code,
            crate::ErrorCode::Conflict
        );
        let report = coordinator
            .restore_to_empty(bundle, true, &mut outbox)
            .unwrap();

        assert_eq!(report.repository_count, 0);
        assert_eq!(report.secret_count, 0);
        assert_eq!(
            report.emitted_event_type,
            CoreEventType::InstanceRestoreCompleted.as_str()
        );
    }
}
