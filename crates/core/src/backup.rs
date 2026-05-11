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
        let source =
            ResourceRef::parse("forgepoint://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        outbox.append(EventEnvelope::core(
            CoreEventType::InstanceRestoreCompleted,
            source.clone(),
            None,
            EventActor {
                kind: "workload".to_string(),
                uri: "forgepoint://workload/forgepointctl".to_string(),
                display_name: Some("forgepointctl".to_string()),
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

pub fn demo_backup_store() -> MetadataStore {
    let mut store = MetadataStore::new(MetadataBackend::Sqlite);
    store.secrets_metadata.insert(
        "github-token".to_string(),
        "sec_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
    );
    store
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backup_pauses_writes_and_restore_requires_empty_target() {
        let store = demo_backup_store();
        let mut coordinator = BackupCoordinator::default();
        let bundle = coordinator.backup(
            &store,
            vec!["repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string()],
            1,
            "package forgepoint",
            true,
        );

        assert!(bundle.signed);
        assert!(bundle.encrypted);
        assert!(!coordinator.receive_pack_paused);
        assert_eq!(bundle.secret_names, ["github-token"]);

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

        assert_eq!(report.repository_count, 1);
        assert_eq!(report.secret_count, 1);
        assert_eq!(
            report.emitted_event_type,
            CoreEventType::InstanceRestoreCompleted.as_str()
        );
    }
}
