use std::path::{Path, PathBuf};

/// Trait representing repository storage that can resolve repository paths.
pub trait RepositoryProvider {
    fn ensure_local_repository(&self, segments: &[String]) -> anyhow::Result<PathBuf>;
}

pub fn resolve_repo_dir<P>(storage: &P, segments: &[String]) -> anyhow::Result<PathBuf>
where
    P: RepositoryProvider,
{
    // Accept repo or repo.git directory structure. Try exact first, then with .git suffix.
    match storage.ensure_local_repository(segments) {
        Ok(p) => Ok(p),
        Err(_) => {
            if let Some((last, head)) = segments.split_last() {
                let mut alt = head.to_vec();
                alt.push(format!("{last}.git"));
                storage.ensure_local_repository(&alt)
            } else {
                anyhow::bail!("invalid repository path")
            }
        }
    }
}

pub fn is_public_repo(dir: &Path) -> bool {
    // Allow-all override (use cautiously in prod)
    if std::env::var("COMTRYA_GIT_HTTP_EXPORT_ALL").ok().as_deref() == Some("true") {
        return true;
    }
    // Honor git-daemon-export-ok convention
    let marker = dir.join("git-daemon-export-ok");
    marker.exists()
}
