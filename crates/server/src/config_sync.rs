//! GitOps config sync — clone/fast-forward the external CUE config repo and
//! evaluate it into the typed [`InstanceConfig`].
//!
//! The engine is the pure-Rust (gix) `gitsync` crate. The config repo is the
//! GitOps source of truth (see the onboarding plan): its location comes purely
//! from the environment, never from the UI. When `COMTRYA_CONFIG_REPO_URL` is
//! unset, [`ConfigRepo::from_env`] returns `None` and the caller falls back to
//! its local config path.

use std::path::{Component, Path, PathBuf};

use comtrya_core::InstanceConfig;
use gitsync::GitSync;

/// The external config repo, configured entirely from the environment.
pub(crate) struct ConfigRepo {
    sync: GitSync,
    checkout_dir: PathBuf,
    config_repo_path: Option<String>,
}

impl ConfigRepo {
    /// Build from the environment. Returns `None` when no config repo URL is
    /// set, signalling the caller to use the local/unconfigured path.
    ///
    /// Auth: HTTPS token via `COMTRYA_CONFIG_REPO_TOKEN` (+ optional
    /// `COMTRYA_CONFIG_REPO_USERNAME`), or an SSH key path via
    /// `COMTRYA_CONFIG_REPO_SSH_KEY` (+ optional
    /// `COMTRYA_CONFIG_REPO_SSH_PASSPHRASE`). `COMTRYA_CONFIG_REPO_REF` pins the
    /// branch (default: the remote's default branch). `COMTRYA_CONFIG_REPO_PATH`
    /// optionally evaluates a subdirectory inside the cloned repo.
    pub(crate) fn from_env(data_dir: &Path) -> Option<Self> {
        let url = non_empty_env("COMTRYA_CONFIG_REPO_URL")?;
        let checkout_dir = data_dir.join("config-repo");
        let config_repo_path = non_empty_env("COMTRYA_CONFIG_REPO_PATH");
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
        Some(Self {
            sync,
            checkout_dir,
            config_repo_path,
        })
    }

    /// The configured config-repo URL.
    pub(crate) fn url(&self) -> &str {
        &self.sync.repo
    }

    /// Clone the repo if absent, fast-forward to the latest commit, evaluate
    /// the checked-out CUE module into a validated `InstanceConfig`, and return
    /// it together with the synced commit oid.
    ///
    /// A checkout that lives on a durable volume can become unusable between
    /// boots: an interrupted fetch leaves ref locks, the worktree drifts, the
    /// remote branch is force-pushed, or the configured repo URL changes and no
    /// longer matches the checkout's `origin`. `gix` reports these as hard
    /// errors, and because the bad state persists the server would refuse to
    /// start on every restart. The remote is the GitOps source of truth, so on
    /// any such failure we discard the checkout and clone it again rather than
    /// wedge startup.
    pub(crate) fn bootstrap_and_load(&self) -> Result<(InstanceConfig, String), String> {
        let outcome = match self.bootstrap_then_sync() {
            Ok(outcome) => outcome,
            Err(err) => {
                tracing::warn!(
                    %err,
                    checkout = %self.checkout_dir.display(),
                    "config repo bootstrap/sync failed; discarding checkout and re-cloning"
                );
                self.discard_checkout()?;
                self.bootstrap_then_sync()
                    .map_err(|err| format!("config repo sync failed after re-clone: {err}"))?
            }
        };
        tracing::info!(commit = %outcome.current, changed = outcome.changed, "synced config repo");
        Ok((self.load()?, outcome.current.to_string()))
    }

    /// Clone the repo if absent (or adopt an existing checkout) and fast-forward
    /// it to the remote tip. The two halves are bundled so a single failure of
    /// either — a wrong-remote checkout, a stale ref lock, a dirty worktree — is
    /// recovered the same way: by discarding and re-cloning.
    fn bootstrap_then_sync(&self) -> Result<gitsync::SyncOutcome, gitsync::errors::GitSyncError> {
        self.sync.bootstrap()?;
        self.sync.sync()
    }

    /// Remove the local checkout so the next bootstrap clones it fresh. Recovers
    /// from a checkout the sync engine can no longer reconcile.
    fn discard_checkout(&self) -> Result<(), String> {
        if self.checkout_dir.exists() {
            std::fs::remove_dir_all(&self.checkout_dir).map_err(|err| {
                format!(
                    "failed to clear config repo checkout {}: {err}",
                    self.checkout_dir.display()
                )
            })?;
        }
        Ok(())
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
        let config_dir = config_dir(&self.checkout_dir, self.config_repo_path.as_deref())?;
        comtrya_core::evaluate_instance_config(&config_dir).map_err(|err| err.to_string())
    }
}

fn config_dir(checkout_dir: &Path, config_repo_path: Option<&str>) -> Result<PathBuf, String> {
    let Some(config_repo_path) = config_repo_path else {
        return Ok(checkout_dir.to_path_buf());
    };
    let relative_path = parse_config_repo_path(config_repo_path)?;
    let config_dir = checkout_dir.join(&relative_path);
    if !config_dir.is_dir() {
        return Err(format!(
            "COMTRYA_CONFIG_REPO_PATH {:?} does not exist or is not a directory in the config repo",
            config_repo_path
        ));
    }
    Ok(config_dir)
}

fn parse_config_repo_path(value: &str) -> Result<PathBuf, String> {
    let path = Path::new(value);
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::Normal(segment) => normalized.push(segment),
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(format!(
                    "COMTRYA_CONFIG_REPO_PATH {:?} must be a relative path inside the config repo",
                    value
                ));
            }
        }
    }
    if normalized.as_os_str().is_empty() {
        return Ok(PathBuf::from("."));
    }
    Ok(normalized)
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
    /// True when the synced config's enabled-extension set differs from the set
    /// loaded at process start. OIDC/admins/repos/labels apply live; the
    /// extension component set requires a restart to load/unload safely.
    pub pending_extension_reload: bool,
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
            pending_extension_reload: false,
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
            pending_extension_reload: false,
        }
    }

    pub(crate) fn set_pending_extension_reload(&mut self, pending: bool) {
        self.pending_extension_reload = pending;
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
            config_repo_path: None,
        }
    }

    fn for_test_with_config_path(
        url: String,
        checkout_dir: std::path::PathBuf,
        config_repo_path: &str,
    ) -> Self {
        Self {
            config_repo_path: Some(config_repo_path.to_string()),
            ..Self::for_test(url, checkout_dir)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    fn git(dir: &Path, args: &[&str]) {
        let status = Command::new("git")
            .arg("-c")
            .arg("commit.gpgsign=false")
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

    /// Initialise a `file://`-able source repo with a CUE module containing the
    /// given config, committed on `main`.
    fn make_source(parent: &Path, name: &str, config: &str) -> PathBuf {
        let source = parent.join(name);
        let module = source.join("cue.mod");
        std::fs::create_dir_all(&module).unwrap();
        std::fs::write(
            module.join("module.cue"),
            "module: \"comtrya.test/config\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();
        std::fs::write(source.join("config.cue"), config).unwrap();
        git(&source, &["init", "-q", "-b", "main"]);
        git(&source, &["add", "-A"]);
        git(&source, &["commit", "-q", "-m", "config"]);
        source
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

    /// A persisted checkout that can no longer be synced (here a drifted
    /// worktree standing in for the ref-lock / force-push corruption seen in
    /// production) must not wedge startup: `bootstrap_and_load` discards the
    /// checkout and re-clones from the remote.
    #[test]
    fn bootstrap_recovers_from_unsyncable_checkout() {
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
        let checkout = tmp.path().join("checkout");
        let repo = ConfigRepo::for_test(url, checkout.clone());

        // First boot clones cleanly.
        repo.bootstrap_and_load().expect("initial clone + evaluate");

        // Corrupt the checkout so `sync` can no longer reconcile it.
        std::fs::write(checkout.join("config.cue"), "package comtrya\n// drifted\n").unwrap();
        assert!(
            repo.sync.sync().is_err(),
            "precondition: the drifted checkout is unsyncable"
        );

        // Next boot self-heals by re-cloning instead of propagating the error.
        let (config, commit) = repo
            .bootstrap_and_load()
            .expect("bootstrap recovers by re-cloning");
        assert_eq!(config.id, "t");
        assert_eq!(commit.len(), 40, "full sha-1 commit oid");
    }

    /// Repointing the config repo at a new URL must not wedge startup on the
    /// stale checkout. `gitsync::bootstrap` rejects an existing checkout whose
    /// `origin` differs from the configured URL; `bootstrap_and_load` recovers
    /// by discarding it and cloning the new remote.
    #[test]
    fn bootstrap_recovers_when_config_repo_url_changes() {
        let tmp = tempfile::tempdir().unwrap();
        let checkout = tmp.path().join("checkout");

        let source_a = make_source(tmp.path(), "source-a", CONFIG);
        let repo_a =
            ConfigRepo::for_test(format!("file://{}", source_a.display()), checkout.clone());
        let (config_a, _) = repo_a.bootstrap_and_load().expect("clone source A");
        assert_eq!(config_a.id, "t");

        // A different remote with a different config, reusing the same checkout
        // dir — the persisted checkout still points at source A's origin.
        let config_b = CONFIG.replace("id: \"t\"", "id: \"b\"");
        assert_ne!(config_b, CONFIG, "config_b must differ from CONFIG");
        let source_b = make_source(tmp.path(), "source-b", &config_b);
        let repo_b =
            ConfigRepo::for_test(format!("file://{}", source_b.display()), checkout.clone());
        let (config, commit) = repo_b
            .bootstrap_and_load()
            .expect("self-heal adopts the new remote");
        assert_eq!(config.id, "b", "checkout re-cloned from the new URL");
        assert_eq!(commit.len(), 40, "full sha-1 commit oid");
    }

    #[test]
    fn clones_file_url_and_evaluates_config_subdirectory() {
        let tmp = tempfile::tempdir().unwrap();
        let source = tmp.path().join("source");
        let config_dir = source.join("projects/instance/config");
        let module = config_dir.join("cue.mod");
        std::fs::create_dir_all(&module).unwrap();
        std::fs::write(
            module.join("module.cue"),
            "module: \"comtrya.test/config\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();
        std::fs::write(config_dir.join("config.cue"), CONFIG).unwrap();
        git(&source, &["init", "-q", "-b", "main"]);
        git(&source, &["add", "-A"]);
        git(&source, &["commit", "-q", "-m", "config"]);

        let url = format!("file://{}", source.display());
        let repo = ConfigRepo::for_test_with_config_path(
            url,
            tmp.path().join("checkout"),
            "projects/instance/config",
        );
        let (config, commit) = repo.bootstrap_and_load().expect("bootstrap + evaluate");
        assert_eq!(config.id, "t");
        assert_eq!(commit.len(), 40, "full sha-1 commit oid");
    }

    #[test]
    fn config_subdirectory_must_exist() {
        let tmp = tempfile::tempdir().unwrap();
        let err = config_dir(tmp.path(), Some("missing/config")).expect_err("missing path errors");
        assert!(
            err.contains("does not exist or is not a directory"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn config_subdirectory_rejects_traversal() {
        for value in ["../config", "config/../../other", "/config"] {
            let err = parse_config_repo_path(value).expect_err("invalid path errors");
            assert!(
                err.contains("must be a relative path inside the config repo"),
                "unexpected error for {value:?}: {err}"
            );
        }
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
