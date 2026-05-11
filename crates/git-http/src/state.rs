use std::sync::Arc;

use anyhow::Result;
use tokio::sync::Semaphore;

use crate::repo::RepositoryProvider;

/// Abstraction over the state required by Git HTTP handlers.
pub trait GitHttpState: Clone + Send + Sync + 'static {
    type Storage: RepositoryProvider + Send + Sync;

    fn storage(&self) -> &Self::Storage;
    fn git_semaphore(&self) -> &Arc<Semaphore>;
    fn git_max_body(&self) -> usize;
    fn git_timeout_ms(&self) -> u64;
    fn validate_slug(&self, slug: &str) -> Result<()>;
}
