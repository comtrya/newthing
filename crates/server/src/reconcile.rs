//! Apply a freshly-evaluated [`InstanceConfig`] to the running [`Runtime`].
//!
//! The config repo is the source of truth; on each sync the reconciler brings
//! the live runtime in line with it. This phase applies the security-relevant,
//! cheaply-swappable surfaces live — the admin allow-list and the OIDC issuer
//! set — without a restart. Repositories, labels, and the extension set are
//! reconciled in later phases.

use std::collections::{BTreeMap, BTreeSet};

use comtrya_core::{InstanceConfig, LabelConfig, RepositoryConfig};

use crate::Runtime;

/// Apply the live-updatable parts of `config` to `runtime`.
pub(crate) fn reconcile_live(runtime: &Runtime, config: &InstanceConfig) {
    runtime.set_admins(config.admins.clone());
    if let Ok(mut auth) = runtime.auth_service.lock() {
        auth.set_issuers(&config.oidc_issuers);
    }
    reconcile_repositories(runtime, config);
    reconcile_labels(runtime, config);
    reconcile_extensions(runtime, config);
}

/// Detect whether the synced config's enabled-extension set differs from the
/// set loaded at process start and record a "reload pending" signal.
///
/// OIDC, admins, repositories, and labels apply live. The extension component
/// set does not yet hot-swap in-process: a consistent swap means atomically
/// replacing both the compiled-component registry and the served record map
/// (UI manifests, dispatch metadata) while no request is mid-flight. Until that
/// lands, an extension-set change is surfaced here and applied on next restart,
/// rather than leaving the registry and records inconsistent.
pub(crate) fn reconcile_extensions(runtime: &Runtime, config: &InstanceConfig) {
    let loaded = enabled_extension_ids(&runtime.config);
    let desired = enabled_extension_ids(config);
    let pending = loaded != desired;
    if let Ok(mut status) = runtime.config_sync_status.lock() {
        status.set_pending_extension_reload(pending);
    }
    if pending {
        tracing::warn!(
            ?loaded,
            ?desired,
            "reconcile: enabled extension set changed; restart required to apply"
        );
    }
}

fn enabled_extension_ids(config: &InstanceConfig) -> Vec<String> {
    let mut ids: Vec<String> = config
        .extensions
        .iter()
        .filter(|ext| ext.enabled)
        .map(|ext| ext.id.clone())
        .collect();
    ids.sort();
    ids
}

/// Reconcile the instance-declared label set (the config repo is authoritative):
/// create labels that don't exist, update color/description, and delete labels
/// absent from config. Keyed by `(scope, name)` so a global label (`scope =
/// None`) and a scoped one with the same name are distinct.
pub(crate) fn reconcile_labels(runtime: &Runtime, config: &InstanceConfig) {
    let mut desired: BTreeMap<(Option<String>, String), &LabelConfig> = BTreeMap::new();
    for label in &config.labels {
        desired.insert((label.scope.clone(), label.name.clone()), label);
    }

    let actual = runtime.label_docs();
    let mut seen: BTreeSet<(Option<String>, String)> = BTreeSet::new();
    for (scope, name, color, description, id) in &actual {
        let key = (scope.clone(), name.clone());
        seen.insert(key.clone());
        match desired.get(&key) {
            Some(label) => {
                let want_description = label.description.clone().unwrap_or_default();
                if (&label.color != color || want_description != *description)
                    && let Err(error) = runtime.update_label(id, &label.color, &want_description)
                {
                    tracing::warn!(%name, %error, "reconcile: failed to update label");
                }
            }
            None => {
                if let Err(error) = runtime.delete_label(id) {
                    tracing::warn!(%name, %error, "reconcile: failed to delete label");
                }
            }
        }
    }

    for (key, label) in &desired {
        if !seen.contains(key)
            && let Err(error) = runtime.create_label(label)
        {
            tracing::warn!(name = %label.name, %error, "reconcile: failed to create label");
        }
    }
}

/// Strict GitOps repository reconcile: create repositories declared in config
/// that don't exist, and delete repositories that exist but are absent from
/// config (this destroys their git history — the config repo is authoritative).
///
/// **Fail-closed on invalid declared paths.** Previously, an entry whose
/// `validate_repo_path` failed was warned-and-skipped, which meant that
/// entry was never added to the desired set — and the second pass would
/// then delete any matching on-disk repo because the path was "absent
/// from config." An operator typo (e.g. `org/proj` → `org//proj`) silently
/// destroyed git history. Now any per-entry validation failure aborts
/// the reconcile before any delete runs; the operator sees the error in
/// the sync log and the on-disk state is left untouched until the typo
/// is fixed.
pub(crate) fn reconcile_repositories(runtime: &Runtime, config: &InstanceConfig) {
    let mut desired: BTreeMap<String, &RepositoryConfig> = BTreeMap::new();
    let mut validation_errors: Vec<(String, String)> = Vec::new();
    for repo in &config.repositories {
        match crate::validate_repo_path(&repo.path) {
            Ok((_, canonical)) => {
                desired.insert(canonical, repo);
            }
            Err(error) => {
                validation_errors.push((repo.path.clone(), error));
            }
        }
    }
    if !validation_errors.is_empty() {
        for (path, error) in &validation_errors {
            tracing::error!(
                %path,
                %error,
                "reconcile: invalid declared repository path; aborting reconcile to avoid destructive delete of matching on-disk repo"
            );
        }
        // Hard abort — no creates, NO DELETES. A malformed entry must
        // not turn into a silent `git rm -rf` against the on-disk repo
        // whose canonical path the typo'd entry was meant to declare.
        return;
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
