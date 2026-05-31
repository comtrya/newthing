use std::sync::Arc;

use anyhow::Result;
use tokio::sync::Semaphore;

use crate::repo::RepositoryProvider;

/// A successfully applied ref update from a push. Passed to
/// `GitHttpState::on_push_complete` so the server can emit
/// `dev.comtrya.ref.updated` events and fan out to the reactor.
#[derive(Debug, Clone)]
pub struct AppliedRefUpdate {
    /// Fully-qualified ref name, e.g. `refs/heads/main`.
    pub ref_name: String,
    /// Previous OID (all zeros for a create).
    pub old_oid: String,
    /// New OID (all zeros for a delete).
    pub new_oid: String,
}

impl AppliedRefUpdate {
    pub fn is_create(&self) -> bool {
        self.old_oid.chars().all(|c| c == '0')
    }
    pub fn is_delete(&self) -> bool {
        self.new_oid.chars().all(|c| c == '0')
    }
    pub fn is_update(&self) -> bool {
        !self.is_create() && !self.is_delete()
    }
}

/// Abstraction over the state required by Git HTTP handlers.
pub trait GitHttpState: Clone + Send + Sync + 'static {
    type Storage: RepositoryProvider + Send + Sync;

    fn storage(&self) -> &Self::Storage;
    fn git_semaphore(&self) -> &Arc<Semaphore>;
    fn git_max_body(&self) -> usize;
    fn git_timeout_ms(&self) -> u64;
    fn validate_slug(&self, slug: &str) -> Result<()>;

    /// Called after a successful push once all ref updates have been applied
    /// atomically. `segments` is the repository path (e.g. `["owner", "repo"]`),
    /// `updates` is the list of applied ref changes.
    ///
    /// The default is a no-op so existing `GitHttpState` implementors are
    /// not forced to implement it — only the server wires up event emission.
    fn on_push_complete(&self, _segments: &[String], _updates: &[AppliedRefUpdate]) {}
}
