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

    /// The configured config-repo URL.
    pub(crate) fn url(&self) -> &str {
        &self.sync.repo
    }

    /// Clone the repo if absent, fast-forward to the latest commit, evaluate
    /// the checked-out CUE module into a validated `InstanceConfig`, and return
    /// it together with the synced commit oid.
    pub(crate) fn bootstrap_and_load(&self) -> Result<(InstanceConfig, String), String> {
        self.sync
            .bootstrap()
            .map_err(|err| format!("config repo bootstrap failed: {err}"))?;
        let outcome = self
            .sync
            .sync()
            .map_err(|err| format!("config repo sync failed: {err}"))?;
        tracing::info!(commit = %outcome.current, changed = outcome.changed, "synced config repo");
        Ok((self.load()?, outcome.current.to_string()))
    }

    /// Fast-forward the existing checkout and, when it changed, re-evaluate the
    /// config so the reconciler can apply it (and validation errors surface).
    pub(crate) fn poll(&self) -> Result<SyncPoll, String> {
        let outcome = self
            .sync
            .sync()
            .map_err(|err| format!("config repo sync failed: {err}"))?;
        let commit = outcome.current.to_string();
        if outcome.changed {
            Ok(SyncPoll::Changed {
                commit,
                config: Box::new(self.load()?),
            })
        } else {
            Ok(SyncPoll::Unchanged { commit })
        }
    }

    fn load(&self) -> Result<InstanceConfig, String> {
        comtrya_core::evaluate_instance_config(&self.checkout_dir).map_err(|err| err.to_string())
    }
}

/// The result of one background poll of the config repo.
pub(crate) enum SyncPoll {
    Unchanged {
        commit: String,
    },
    Changed {
        commit: String,
        config: Box<InstanceConfig>,
    },
}

/// Observable state of config-repo syncing, surfaced in admin telemetry.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SyncStatus {
    pub configured: bool,
    pub repo_url: Option<String>,
    pub last_commit: Option<String>,
    pub last_synced_unix: Option<u64>,
    pub last_error: Option<String>,
    pub interval_seconds: u64,
}

impl SyncStatus {
    pub(crate) fn unconfigured(interval_seconds: u64) -> Self {
        Self {
            configured: false,
            repo_url: None,
            last_commit: None,
            last_synced_unix: None,
            last_error: None,
            interval_seconds,
        }
    }

    pub(crate) fn synced(
        repo_url: String,
        commit: String,
        now_unix: u64,
        interval_seconds: u64,
    ) -> Self {
        Self {
            configured: true,
            repo_url: Some(repo_url),
            last_commit: Some(commit),
            last_synced_unix: Some(now_unix),
            last_error: None,
            interval_seconds,
        }
    }

    pub(crate) fn record_synced(&mut self, commit: String, now_unix: u64) {
        self.last_commit = Some(commit);
        self.last_synced_unix = Some(now_unix);
        self.last_error = None;
    }

    pub(crate) fn record_error(&mut self, error: String, now_unix: u64) {
        self.last_error = Some(error);
        self.last_synced_unix = Some(now_unix);
    }
}

/// Background sync cadence. `COMTRYA_CONFIG_SYNC_INTERVAL_SECONDS` overrides the
/// 15-minute default; non-positive or unparseable values fall back to it.
pub(crate) fn sync_interval_seconds_from_env() -> u64 {
    non_empty_env("COMTRYA_CONFIG_SYNC_INTERVAL_SECONDS")
        .and_then(|value| value.parse::<u64>().ok())
        .filter(|seconds| *seconds > 0)
        .unwrap_or(900)
}

fn non_empty_env(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .filter(|value| !value.trim().is_empty())
}

#[cfg(test)]
impl ConfigRepo {
    /// Build a repo pointing at `url` (e.g. a `file://` source) cloning into
    /// `checkout_dir`, with no auth and the remote default branch.
    fn for_test(url: String, checkout_dir: std::path::PathBuf) -> Self {
        Self {
            sync: GitSync {
                repo: url,
                dir: checkout_dir.clone(),
                ..GitSync::default()
            },
            checkout_dir,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    fn git(dir: &Path, args: &[&str]) {
        let status = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(args)
            .env("GIT_AUTHOR_NAME", "t")
            .env("GIT_AUTHOR_EMAIL", "t@example.test")
            .env("GIT_COMMITTER_NAME", "t")
            .env("GIT_COMMITTER_EMAIL", "t@example.test")
            .status()
            .expect("run git");
        assert!(status.success(), "git {args:?} failed");
    }

    const CONFIG: &str = r#"package comtrya
instance: {
    id: "t"
    name: "T"
    publicURL: "http://localhost:8080"
    environment: "development"
    allowedOrigins: ["http://localhost:4321"]
}
database: { kind: "sqlite", url: "sqlite://comtrya.db" }
oidc: issuers: [{
    id: "dev"
    issuerURL: "https://issuer.example.test"
    clientID: "c"
    clientKind: "confidential"
    clientSecret: "s"
    redirectURL: "http://localhost:8080/auth/oidc/dev/callback"
    allowed: domains: ["example.test"]
}]
storage: repositories: { default: "local", backends: local: { kind: "local", path: "./data/repos" } }
authz: kind: "spicedb"
workspaces: default: { name: "Default", visibility: "PRIVATE" }
"#;

    /// End-to-end GitOps path: clone a `file://` source repo via gitsync and
    /// evaluate the checked-out CUE module into a typed config.
    #[test]
    fn clones_file_url_and_evaluates() {
        let tmp = tempfile::tempdir().unwrap();
        let source = tmp.path().join("source");
        let module = source.join("cue.mod");
        std::fs::create_dir_all(&module).unwrap();
        std::fs::write(
            module.join("module.cue"),
            "module: \"comtrya.test/config\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();
        std::fs::write(source.join("config.cue"), CONFIG).unwrap();
        git(&source, &["init", "-q", "-b", "main"]);
        git(&source, &["add", "-A"]);
        git(&source, &["commit", "-q", "-m", "config"]);

        let url = format!("file://{}", source.display());
        let repo = ConfigRepo::for_test(url, tmp.path().join("checkout"));
        let (config, commit) = repo.bootstrap_and_load().expect("bootstrap + evaluate");
        assert_eq!(config.id, "t");
        assert_eq!(config.oidc_issuers.len(), 1);
        assert_eq!(commit.len(), 40, "full sha-1 commit oid");
    }

    /// The bundled config fixture that start.sh materialises must evaluate and
    /// validate as a real instance config.
    #[test]
    fn bundled_fixture_config_evaluates() {
        let fixture = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/config-repo");
        let config = comtrya_core::evaluate_instance_config(&fixture).expect("fixture evaluates");
        assert_eq!(config.environment, comtrya_core::Environment::Production);
        assert_eq!(config.oidc_issuers.len(), 1);
        assert_eq!(config.workspaces.len(), 1);
    }
}
