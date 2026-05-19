use crate::auth::TokenAction;
use crate::config::{
    ConfigSnapshot, ConfigValidation, CueEvalBudget, CueFile, CueSchemaFile,
    validate_repository_cue_sources,
};
use crate::error::{CoreError, CoreResult, ErrorCode};
use crate::ids::OpaqueId;
use std::collections::BTreeMap;

pub const GIT_HTTP_ROUTES: &[(&str, &str)] = &[
    (
        "GET",
        "/git/<workspace>/<group-path>/<repo>.git/info/refs?service=git-upload-pack",
    ),
    (
        "POST",
        "/git/<workspace>/<group-path>/<repo>.git/git-upload-pack",
    ),
    (
        "GET",
        "/git/<workspace>/<group-path>/<repo>.git/info/refs?service=git-receive-pack",
    ),
    (
        "POST",
        "/git/<workspace>/<group-path>/<repo>.git/git-receive-pack",
    ),
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitOid(String);

impl GitOid {
    pub fn new(value: impl Into<String>) -> CoreResult<Self> {
        let value = value.into();
        if value.len() != 40 || !value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
            return Err(CoreError::bad_user_input(
                "v1 Git OIDs must be 40-character SHA-1 hex strings",
            ));
        }
        Ok(Self(value))
    }

    pub fn zero() -> Self {
        Self("0000000000000000000000000000000000000000".to_string())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for GitOid {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitRef {
    pub name: String,
    pub target: GitOid,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepoStorageRef {
    pub repository_id: OpaqueId,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RefUpdate {
    pub name: String,
    pub old_oid: Option<GitOid>,
    pub new_oid: GitOid,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AcceptedRefUpdate {
    pub name: String,
    pub old_oid: Option<GitOid>,
    pub new_oid: GitOid,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PackSummary {
    pub bytes: usize,
    pub object_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReceivePackResult {
    pub accepted_refs: Vec<GitRef>,
    pub snapshots: Vec<ConfigSnapshot>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StagingBudget {
    pub staging_max_bytes: usize,
    pub staging_max_concurrent: usize,
}

impl StagingBudget {
    pub fn for_pack_size(pack_size: usize) -> Self {
        Self {
            staging_max_bytes: 2 * pack_size,
            staging_max_concurrent: 4,
        }
    }
}

#[derive(Debug, Clone, Default)]
struct RepositoryState {
    refs: BTreeMap<String, GitOid>,
    objects: BTreeMap<String, Vec<u8>>,
}

#[derive(Debug, Clone, Default)]
pub struct InMemoryRepoStorage {
    repositories: BTreeMap<String, RepositoryState>,
    redirects: BTreeMap<String, PathRedirect>,
}

impl InMemoryRepoStorage {
    pub fn create_repository(&mut self, repo: RepoStorageRef) -> CoreResult<()> {
        if self
            .repositories
            .insert(repo.repository_id.to_string(), RepositoryState::default())
            .is_some()
        {
            return Err(CoreError::conflict("repository storage already exists"));
        }
        Ok(())
    }

    pub fn delete_repository(&mut self, repo: &RepoStorageRef) -> CoreResult<()> {
        self.repositories
            .remove(repo.repository_id.as_str())
            .map(|_| ())
            .ok_or_else(|| CoreError::new(ErrorCode::NotFound, "repository storage not found"))
    }

    pub fn read_ref(&self, repo: &RepoStorageRef, name: &str) -> CoreResult<Option<GitOid>> {
        Ok(self.repo(repo)?.refs.get(name).cloned())
    }

    pub fn list_refs(
        &self,
        repo: &RepoStorageRef,
        prefix: Option<&str>,
    ) -> CoreResult<Vec<GitRef>> {
        Ok(self
            .repo(repo)?
            .refs
            .iter()
            .filter(|(name, _)| prefix.is_none_or(|prefix| name.starts_with(prefix)))
            .map(|(name, target)| GitRef {
                name: name.clone(),
                target: target.clone(),
            })
            .collect())
    }

    pub fn begin_receive_pack(
        &self,
        repo: &RepoStorageRef,
        budget: StagingBudget,
        proposed: Vec<RefUpdate>,
        cue_files: Vec<CueFile>,
    ) -> CoreResult<InMemoryReceivePackTxn> {
        self.repo(repo)?;
        Ok(InMemoryReceivePackTxn {
            repo: repo.clone(),
            budget,
            proposed,
            cue_files,
            staged_pack: None,
            validation: None,
        })
    }

    pub fn commit_receive_pack(
        &mut self,
        txn: InMemoryReceivePackTxn,
        accepted: Vec<AcceptedRefUpdate>,
    ) -> CoreResult<ReceivePackResult> {
        if txn
            .validation
            .as_ref()
            .is_some_and(|validation| !validation.accepted)
        {
            return Err(CoreError::config_invalid(
                "cannot commit receive-pack with invalid repository config",
            ));
        }
        let repo = self.repo_mut(&txn.repo)?;
        for update in &accepted {
            let current = repo.refs.get(&update.name);
            if current != update.old_oid.as_ref() {
                return Err(CoreError::conflict(
                    "transactional ref compare-and-swap failed",
                ));
            }
        }
        for update in &accepted {
            repo.refs
                .insert(update.name.clone(), update.new_oid.clone());
        }
        if let Some(pack) = txn.staged_pack {
            repo.objects
                .insert(format!("pack-{}", repo.objects.len()), vec![0; pack.bytes]);
        }
        Ok(ReceivePackResult {
            accepted_refs: accepted
                .into_iter()
                .map(|update| GitRef {
                    name: update.name,
                    target: update.new_oid,
                })
                .collect(),
            snapshots: txn
                .validation
                .map(|validation| validation.snapshots)
                .unwrap_or_default(),
        })
    }

    pub fn record_rename(&mut self, old_path: &str, new_path: &str, now_days: u64) {
        self.redirects.insert(
            old_path.to_string(),
            PathRedirect {
                new_path: new_path.to_string(),
                expires_at_days: now_days + 30,
            },
        );
    }

    pub fn resolve_git_path(&self, path: &str, now_days: u64) -> GitPathResolution {
        if let Some(redirect) = self.redirects.get(path) {
            if now_days <= redirect.expires_at_days {
                return GitPathResolution::MovedPermanently(redirect.new_path.clone());
            }
            return GitPathResolution::NotFound;
        }
        GitPathResolution::Current(path.to_string())
    }

    fn repo(&self, repo: &RepoStorageRef) -> CoreResult<&RepositoryState> {
        self.repositories
            .get(repo.repository_id.as_str())
            .ok_or_else(|| CoreError::new(ErrorCode::NotFound, "repository storage not found"))
    }

    fn repo_mut(&mut self, repo: &RepoStorageRef) -> CoreResult<&mut RepositoryState> {
        self.repositories
            .get_mut(repo.repository_id.as_str())
            .ok_or_else(|| CoreError::new(ErrorCode::NotFound, "repository storage not found"))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InMemoryReceivePackTxn {
    repo: RepoStorageRef,
    budget: StagingBudget,
    proposed: Vec<RefUpdate>,
    cue_files: Vec<CueFile>,
    staged_pack: Option<PackSummary>,
    validation: Option<ConfigValidation>,
}

impl InMemoryReceivePackTxn {
    pub fn stage_pack(
        &mut self,
        pack_bytes: &[u8],
        object_count: usize,
    ) -> CoreResult<PackSummary> {
        if pack_bytes.len() > self.budget.staging_max_bytes {
            return Err(CoreError::storage_unavailable(
                "receive-pack staging exceeds configured budget",
            ));
        }
        let summary = PackSummary {
            bytes: pack_bytes.len(),
            object_count,
        };
        self.staged_pack = Some(summary.clone());
        Ok(summary)
    }

    pub fn proposed_ref_updates(&self) -> &[RefUpdate] {
        &self.proposed
    }

    pub fn validate_config_tree(
        &mut self,
        commit_oid: &GitOid,
        budget: &CueEvalBudget,
        extension_schemas: &[CueSchemaFile],
    ) -> CoreResult<ConfigValidation> {
        let validation = validate_repository_cue_sources(
            self.repo.repository_id.as_str(),
            commit_oid.as_str(),
            &self.cue_files,
            budget,
            extension_schemas,
        )?;
        self.validation = Some(validation.clone());
        Ok(validation)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct PathRedirect {
    new_path: String,
    expires_at_days: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GitPathResolution {
    Current(String),
    MovedPermanently(String),
    NotFound,
}

pub fn required_git_action(service: &str) -> CoreResult<TokenAction> {
    match service {
        "git-upload-pack" => Ok(TokenAction::GitRead),
        "git-receive-pack" => Ok(TokenAction::GitWrite),
        _ => Err(CoreError::bad_user_input(
            "unsupported Git smart HTTP service",
        )),
    }
}

pub fn s3_object_key(prefix: Option<&str>, repo_id: &str, oid: &GitOid) -> String {
    let base = prefix
        .map(|prefix| prefix.trim_matches('/').to_string())
        .filter(|prefix| !prefix.is_empty())
        .map(|prefix| format!("{prefix}/{repo_id}"))
        .unwrap_or_else(|| repo_id.to_string());
    format!(
        "{base}/objects/{}/{}",
        &oid.as_str()[0..2],
        &oid.as_str()[2..]
    )
}

pub fn s3_refs_manifest_key(prefix: Option<&str>, repo_id: &str) -> String {
    let base = prefix
        .map(|prefix| prefix.trim_matches('/').to_string())
        .filter(|prefix| !prefix.is_empty())
        .map(|prefix| format!("{prefix}/{repo_id}"))
        .unwrap_or_else(|| repo_id.to_string());
    format!("{base}/refs/manifest.json")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{IdPrefix, OpaqueId};

    fn repo() -> RepoStorageRef {
        RepoStorageRef {
            repository_id: OpaqueId::new(IdPrefix::Repository),
        }
    }

    fn oid(hex: char) -> GitOid {
        GitOid::new(hex.to_string().repeat(40)).unwrap()
    }

    #[test]
    fn git_http_services_map_to_closed_token_actions() {
        assert_eq!(
            required_git_action("git-upload-pack").unwrap(),
            TokenAction::GitRead
        );
        assert_eq!(
            required_git_action("git-receive-pack").unwrap(),
            TokenAction::GitWrite
        );
    }

    #[test]
    fn invalid_sha256_style_oid_is_rejected_in_v1() {
        assert_eq!(
            GitOid::new("a".repeat(64)).unwrap_err().code,
            ErrorCode::BadUserInput
        );
    }

    #[test]
    fn concurrent_ref_update_uses_compare_and_swap() {
        let mut storage = InMemoryRepoStorage::default();
        let repo = repo();
        storage.create_repository(repo.clone()).unwrap();
        let update_a = RefUpdate {
            name: "refs/heads/main".to_string(),
            old_oid: None,
            new_oid: oid('a'),
        };
        let update_b = RefUpdate {
            name: "refs/heads/main".to_string(),
            old_oid: None,
            new_oid: oid('b'),
        };
        let txn_a = storage
            .begin_receive_pack(
                &repo,
                StagingBudget::for_pack_size(10),
                vec![update_a.clone()],
                Vec::new(),
            )
            .unwrap();
        let txn_b = storage
            .begin_receive_pack(
                &repo,
                StagingBudget::for_pack_size(10),
                vec![update_b.clone()],
                Vec::new(),
            )
            .unwrap();

        storage
            .commit_receive_pack(
                txn_a,
                vec![AcceptedRefUpdate {
                    name: update_a.name,
                    old_oid: update_a.old_oid,
                    new_oid: update_a.new_oid,
                }],
            )
            .unwrap();
        let err = storage
            .commit_receive_pack(
                txn_b,
                vec![AcceptedRefUpdate {
                    name: update_b.name,
                    old_oid: update_b.old_oid,
                    new_oid: update_b.new_oid,
                }],
            )
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::Conflict);
    }

    #[test]
    fn invalid_cue_on_default_ref_rejects_receive_pack() {
        let storage = InMemoryRepoStorage::default();
        let repo = repo();
        let mut storage = storage;
        storage.create_repository(repo.clone()).unwrap();
        let mut txn = storage
            .begin_receive_pack(
                &repo,
                StagingBudget::for_pack_size(10),
                Vec::new(),
                vec![CueFile {
                    path: "comtrya.cue".to_string(),
                    // Real CUE type-conflict (under the cuengine-backed
                    // validator). Was `"invalid: true"` under the legacy
                    // string-match stub.
                    source: "package comtrya\nfoo: \"a\"\nfoo: 42".to_string(),
                }],
            )
            .unwrap();

        let validation = txn
            .validate_config_tree(&oid('a'), &CueEvalBudget::default(), &[])
            .unwrap();

        assert!(!validation.accepted);
        assert_eq!(
            storage
                .commit_receive_pack(txn, Vec::new())
                .unwrap_err()
                .code,
            ErrorCode::ConfigInvalid
        );
    }

    #[test]
    fn s3_receive_pack_staging_budget_returns_storage_unavailable() {
        let storage = InMemoryRepoStorage::default();
        let repo = repo();
        let mut storage = storage;
        storage.create_repository(repo.clone()).unwrap();
        let mut txn = storage
            .begin_receive_pack(
                &repo,
                StagingBudget {
                    staging_max_bytes: 4,
                    staging_max_concurrent: 4,
                },
                Vec::new(),
                Vec::new(),
            )
            .unwrap();

        assert_eq!(
            txn.stage_pack(&[0; 5], 1).unwrap_err().code,
            ErrorCode::StorageUnavailable
        );
    }

    #[test]
    fn repository_rename_retains_redirect_for_thirty_days() {
        let mut storage = InMemoryRepoStorage::default();
        storage.record_rename("/old/repo.git", "/new/repo.git", 10);

        assert_eq!(
            storage.resolve_git_path("/old/repo.git", 40),
            GitPathResolution::MovedPermanently("/new/repo.git".to_string())
        );
        assert_eq!(
            storage.resolve_git_path("/old/repo.git", 41),
            GitPathResolution::NotFound
        );
    }

    #[test]
    fn s3_layout_uses_manifest_for_refs_and_oid_fanout_for_objects() {
        let oid = GitOid::new("0123456789abcdef0123456789abcdef01234567").unwrap();

        assert_eq!(
            s3_object_key(Some("prefix"), "repo_abc", &oid),
            "prefix/repo_abc/objects/01/23456789abcdef0123456789abcdef01234567"
        );
        assert_eq!(
            s3_refs_manifest_key(Some("prefix"), "repo_abc"),
            "prefix/repo_abc/refs/manifest.json"
        );
    }
}
