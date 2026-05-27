//! GitOps config sync — clone/fast-forward the external CUE config repo and
//! evaluate it into the typed [`InstanceConfig`].
//!
//! The engine is the pure-Rust (gix) `gitsync` crate. The config repo is the
//! GitOps source of truth (see the onboarding plan): its location comes purely
//! from the environment, never from the UI. When `COMTRYA_CONFIG_REPO_URL` is
//! unset, [`ConfigRepo::from_env`] returns `None` and the caller falls back to
//! its local config path.

use std::path::{Path, PathBuf};

use comtrya_core::InstanceConfig;
use gitsync::GitSync;

/// The external config repo, configured entirely from the environment.
pub(crate) struct ConfigRepo {
    sync: GitSync,
    checkout_dir: PathBuf,
}

impl ConfigRepo {
    /// Build from the environment. Returns `None` when no config repo URL is
    /// set, signalling the caller to use the local/unconfigured path.
    ///
    /// Auth: HTTPS token via `COMTRYA_CONFIG_REPO_TOKEN` (+ optional
    /// `COMTRYA_CONFIG_REPO_USERNAME`), or an SSH key path via
    /// `COMTRYA_CONFIG_REPO_SSH_KEY` (+ optional
    /// `COMTRYA_CONFIG_REPO_SSH_PASSPHRASE`). `COMTRYA_CONFIG_REPO_REF` pins the
    /// branch (default: the remote's default branch).
    pub(crate) fn from_env(data_dir: &Path) -> Option<Self> {
        let url = non_empty_env("COMTRYA_CONFIG_REPO_URL")?;
        let checkout_dir = data_dir.join("config-repo");
        let sync = GitSync {
            repo: url,
            dir: checkout_dir.clone(),
            branch: non_empty_env("COMTRYA_CONFIG_REPO_REF"),
            username: non_empty_env("COMTRYA_CONFIG_REPO_USERNAME"),
            token: non_empty_env("COMTRYA_CONFIG_REPO_TOKEN"),
            private_key: non_empty_env("COMTRYA_CONFIG_REPO_SSH_KEY"),
            passphrase: non_empty_env("COMTRYA_CONFIG_REPO_SSH_PASSPHRASE"),
            ..GitSync::default()
        };
        Some(Self { sync, checkout_dir })
    }

    /// Clone the repo if absent, fast-forward to the latest commit, and
    /// evaluate the checked-out CUE module into a validated `InstanceConfig`.
    pub(crate) fn bootstrap_and_load(&self) -> Result<InstanceConfig, String> {
        self.sync
            .bootstrap()
            .map_err(|err| format!("config repo bootstrap failed: {err}"))?;
        let outcome = self
            .sync
            .sync()
            .map_err(|err| format!("config repo sync failed: {err}"))?;
        tracing::info!(
            commit = %outcome.current,
            changed = outcome.changed,
            "synced config repo"
        );
        comtrya_core::evaluate_instance_config(&self.checkout_dir).map_err(|err| err.to_string())
    }
}

fn non_empty_env(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .filter(|value| !value.trim().is_empty())
}
