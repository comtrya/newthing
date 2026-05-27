//! Apply a freshly-evaluated [`InstanceConfig`] to the running [`Runtime`].
//!
//! The config repo is the source of truth; on each sync the reconciler brings
//! the live runtime in line with it. This phase applies the security-relevant,
//! cheaply-swappable surfaces live — the admin allow-list and the OIDC issuer
//! set — without a restart. Repositories, labels, and the extension set are
//! reconciled in later phases.

use std::collections::{BTreeMap, BTreeSet};

use comtrya_core::{InstanceConfig, RepositoryConfig};

use crate::Runtime;

/// Apply the live-updatable parts of `config` to `runtime`.
pub(crate) fn reconcile_live(runtime: &Runtime, config: &InstanceConfig) {
    runtime.set_admins(config.admins.clone());
    if let Ok(mut auth) = runtime.auth_service.lock() {
        auth.set_issuers(&config.oidc_issuers);
    }
    reconcile_repositories(runtime, config);
}

/// Strict GitOps repository reconcile: create repositories declared in config
/// that don't exist, and delete repositories that exist but are absent from
/// config (this destroys their git history — the config repo is authoritative).
pub(crate) fn reconcile_repositories(runtime: &Runtime, config: &InstanceConfig) {
    // Desired set keyed by canonical path. Invalid declared paths are skipped
    // with a warning rather than aborting the whole reconcile.
    let mut desired: BTreeMap<String, &RepositoryConfig> = BTreeMap::new();
    for repo in &config.repositories {
        match crate::validate_repo_path(&repo.path) {
            Ok((_, canonical)) => {
                desired.insert(canonical, repo);
            }
            Err(error) => {
                tracing::warn!(path = %repo.path, %error, "reconcile: invalid declared repository path");
            }
        }
    }

    let actual = runtime.repository_docs();
    let actual_paths: BTreeSet<&String> = actual.iter().map(|(path, _)| path).collect();

    for (path, repo) in &desired {
        if !actual_paths.contains(path) {
            match runtime.create_declared_repository(repo) {
                Ok(()) => tracing::info!(%path, "reconcile: created declared repository"),
                Err(error) => {
                    tracing::warn!(%path, %error, "reconcile: failed to create declared repository")
                }
            }
        }
    }

    for (path, id) in &actual {
        if !desired.contains_key(path) {
            match runtime.delete_repository(path, id) {
                Ok(()) => tracing::warn!(
                    %path,
                    "reconcile: deleted repository absent from config (strict GitOps)"
                ),
                Err(error) => {
                    tracing::warn!(%path, %error, "reconcile: failed to delete repository")
                }
            }
        }
    }
}
