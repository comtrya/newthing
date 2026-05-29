use crate::config::ConfigSnapshot;
use crate::domain::{Group, Project, Repository, Team, User, Workspace};
use crate::error::{CoreError, CoreResult};
use crate::{EventOutbox, JobQueue};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MetadataBackend {
    Sqlite,
    Postgres,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MigrationState {
    pub applied_version: u32,
    pub required_version: u32,
    pub compatible: bool,
}

impl MigrationState {
    pub fn assert_startup_allowed(&self) -> CoreResult<()> {
        if !self.compatible {
            return Err(CoreError::config_invalid(
                "metadata migrations are incompatible with this server",
            ));
        }
        if self.applied_version < self.required_version {
            return Err(CoreError::config_invalid(
                "pending metadata migrations block startup",
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct MetadataStore {
    pub backend: MetadataBackend,
    pub migrations: MigrationState,
    pub users: BTreeMap<String, User>,
    pub teams: BTreeMap<String, Team>,
    pub workspaces: BTreeMap<String, Workspace>,
    pub groups: BTreeMap<String, Group>,
    pub repositories: BTreeMap<String, Repository>,
    pub projects: BTreeMap<String, Project>,
    pub config_snapshots: Vec<ConfigSnapshot>,
    pub events: EventOutbox,
    pub jobs: JobQueue,
    pub audit_events: Vec<String>,
    pub secrets_metadata: BTreeMap<String, String>,
}

impl MetadataStore {
    pub fn new(backend: MetadataBackend) -> Self {
        Self {
            backend,
            migrations: MigrationState {
                applied_version: 1,
                required_version: 1,
                compatible: true,
            },
            users: BTreeMap::new(),
            teams: BTreeMap::new(),
            workspaces: BTreeMap::new(),
            groups: BTreeMap::new(),
            repositories: BTreeMap::new(),
            projects: BTreeMap::new(),
            config_snapshots: Vec::new(),
            events: EventOutbox::default(),
            jobs: JobQueue::default(),
            audit_events: Vec::new(),
            secrets_metadata: BTreeMap::new(),
        }
    }

    pub fn start(&self) -> CoreResult<()> {
        self.migrations.assert_startup_allowed()
    }

    pub fn insert_repository(&mut self, repository: Repository) -> CoreResult<()> {
        if self.repositories.contains_key(repository.id.as_str()) {
            return Err(CoreError::conflict("repository already exists"));
        }
        self.repositories
            .insert(repository.id.to_string(), repository);
        Ok(())
    }

    pub fn append_config_snapshots(&mut self, snapshots: Vec<ConfigSnapshot>) {
        self.config_snapshots.extend(snapshots);
    }

    pub fn parity_fingerprint(&self) -> String {
        format!(
            "users:{};teams:{};workspaces:{};groups:{};repos:{};projects:{};events:{};jobs:{}",
            self.users.len(),
            self.teams.len(),
            self.workspaces.len(),
            self.groups.len(),
            self.repositories.len(),
            self.projects.len(),
            self.events.all().len(),
            self.jobs_count(),
        )
    }

    fn jobs_count(&self) -> usize {
        self.jobs.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pending_migrations_block_startup() {
        let mut store = MetadataStore::new(MetadataBackend::Sqlite);
        store.migrations.applied_version = 1;
        store.migrations.required_version = 2;

        assert_eq!(
            store.start().unwrap_err().code,
            crate::ErrorCode::ConfigInvalid
        );
    }

    #[test]
    fn incompatible_migrations_block_startup() {
        let mut store = MetadataStore::new(MetadataBackend::Postgres);
        store.migrations.compatible = false;

        assert_eq!(
            store.start().unwrap_err().code,
            crate::ErrorCode::ConfigInvalid
        );
    }

    #[test]
    fn sqlite_and_postgres_stores_expose_same_empty_semantics() {
        let sqlite = MetadataStore::new(MetadataBackend::Sqlite);
        let postgres = MetadataStore::new(MetadataBackend::Postgres);

        assert_eq!(sqlite.parity_fingerprint(), postgres.parity_fingerprint());
    }

    #[test]
    fn parity_fingerprint_reflects_true_job_count() {
        // Regression for #79: the fingerprint must distinguish stores with
        // different job counts; a constant `jobs:0` would hide divergence.
        let empty = MetadataStore::new(MetadataBackend::Sqlite);
        let mut with_jobs = MetadataStore::new(MetadataBackend::Sqlite);
        with_jobs.jobs.enqueue("kind", "default", "{}", 0, 0);
        with_jobs.jobs.enqueue("kind", "default", "{}", 0, 0);

        assert!(empty.parity_fingerprint().contains("jobs:0"));
        assert!(with_jobs.parity_fingerprint().contains("jobs:2"));
        assert_ne!(
            empty.parity_fingerprint(),
            with_jobs.parity_fingerprint(),
            "fingerprint must diverge when job counts differ"
        );
    }
}
