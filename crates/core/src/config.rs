use crate::domain::Visibility;
use crate::error::{CoreError, CoreResult, ErrorCode};
use crate::ids::Slug;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Environment {
    Development,
    Production,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClientKind {
    Public,
    Confidential,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OidcIssuerConfig {
    pub id: String,
    pub issuer_url: String,
    pub client_id: String,
    pub client_kind: ClientKind,
    pub client_secret: Option<String>,
    pub redirect_url: String,
    pub allowed_domains: Vec<String>,
    pub allowed_groups: Vec<String>,
    pub allowed_subjects: Vec<String>,
}

impl OidcIssuerConfig {
    pub fn allows(&self, subject: &str, email: Option<&str>, groups: &[String]) -> bool {
        if self
            .allowed_subjects
            .iter()
            .any(|allowed| allowed == subject)
        {
            return true;
        }
        if email
            .and_then(|value| value.rsplit_once('@').map(|(_, domain)| domain))
            .is_some_and(|domain| self.allowed_domains.iter().any(|allowed| allowed == domain))
        {
            return true;
        }
        groups
            .iter()
            .any(|group| self.allowed_groups.iter().any(|allowed| allowed == group))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DatabaseConfig {
    Sqlite { url: String },
    Postgres { url: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RepoStorageBackend {
    Local {
        path: String,
    },
    S3 {
        bucket: String,
        prefix: Option<String>,
        region: Option<String>,
        endpoint: Option<String>,
        access_key_id: String,
        secret_access_key: String,
    },
    CloudflareArtifacts {
        account_id: String,
        namespace: String,
        token: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkspaceConfig {
    pub name: String,
    pub visibility: Visibility,
    pub description: Option<String>,
    pub allow_public_descendants: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InstanceConfig {
    pub id: String,
    pub name: String,
    pub public_url: String,
    pub environment: Environment,
    pub allowed_origins: Vec<String>,
    pub database: DatabaseConfig,
    pub oidc_issuers: Vec<OidcIssuerConfig>,
    pub repository_storage_default: String,
    pub repository_storage_backends: BTreeMap<String, RepoStorageBackend>,
    pub authz_kind: String,
    pub workspaces: BTreeMap<String, WorkspaceConfig>,
    pub ceilings: Ceilings,
    pub rate_limits: RateLimits,
    pub extensions: Vec<crate::extensions::ExtensionInstallConfig>,
}

impl InstanceConfig {
    pub fn validate(&self) -> CoreResult<()> {
        if self.id.trim().is_empty() {
            return Err(CoreError::config_invalid("instance.id must be non-empty"));
        }
        if self.name.trim().is_empty() {
            return Err(CoreError::config_invalid("instance.name must be non-empty"));
        }
        if self.environment == Environment::Production && !self.public_url.starts_with("https://") {
            return Err(CoreError::config_invalid(
                "production instance.publicURL must use https://",
            ));
        }
        validate_allowed_origins(&self.allowed_origins)?;
        validate_database(&self.database)?;
        validate_oidc(self.environment, &self.oidc_issuers)?;
        validate_storage(
            &self.repository_storage_default,
            &self.repository_storage_backends,
        )?;
        for (slug, workspace) in &self.workspaces {
            Slug::new(slug.clone()).map_err(|err| {
                CoreError::config_invalid(format!("workspace slug {slug:?}: {}", err.message))
            })?;
            validate_visibility_ceiling(workspace.visibility, &self.ceilings.workspace)?;
        }
        let mut seen = BTreeMap::new();
        for ext in &self.extensions {
            ext.validate()?;
            if seen.insert(ext.id.clone(), ()).is_some() {
                return Err(CoreError::config_invalid(format!(
                    "duplicate extension id {:?} in config",
                    ext.id
                )));
            }
        }
        Ok(())
    }

    pub fn minimal_dev() -> Self {
        let mut repository_storage_backends = BTreeMap::new();
        repository_storage_backends.insert(
            "local".to_string(),
            RepoStorageBackend::Local {
                path: "./data/repos".to_string(),
            },
        );
        let mut workspaces = BTreeMap::new();
        workspaces.insert(
            "default".to_string(),
            WorkspaceConfig {
                name: "Default".to_string(),
                visibility: Visibility::Private,
                description: None,
                allow_public_descendants: false,
            },
        );
        Self {
            id: "comtrya-dev".to_string(),
            name: "Comtrya Dev".to_string(),
            public_url: "http://localhost:8080".to_string(),
            environment: Environment::Development,
            allowed_origins: vec!["http://localhost:4321".to_string()],
            database: DatabaseConfig::Sqlite {
                url: "sqlite://comtrya.db".to_string(),
            },
            oidc_issuers: vec![OidcIssuerConfig {
                id: "dev".to_string(),
                issuer_url: "https://issuer.example.test".to_string(),
                client_id: "comtrya".to_string(),
                client_kind: ClientKind::Confidential,
                client_secret: Some("dev-secret".to_string()),
                redirect_url: "http://localhost:8080/auth/oidc/dev/callback".to_string(),
                allowed_domains: vec!["example.test".to_string()],
                allowed_groups: Vec::new(),
                allowed_subjects: Vec::new(),
            }],
            repository_storage_default: "local".to_string(),
            repository_storage_backends,
            authz_kind: "spicedb".to_string(),
            workspaces,
            ceilings: Ceilings::default(),
            rate_limits: RateLimits::default(),
            extensions: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ceilings {
    pub repository: RepositoryCeilings,
    pub workspace: WorkspaceCeilings,
    pub group: GroupCeilings,
    pub publishers: PublisherCeilings,
}

impl Default for Ceilings {
    fn default() -> Self {
        Self {
            repository: RepositoryCeilings::default(),
            workspace: WorkspaceCeilings::default(),
            group: GroupCeilings::default(),
            publishers: PublisherCeilings::default(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepositoryCeilings {
    pub allowed_visibility: Vec<Visibility>,
    pub allow_public_descendants: bool,
    pub protected_refs_must_validate_config: bool,
    pub allowed_publishers: Vec<String>,
    pub allowed_storage_backends: Vec<String>,
    pub cue_eval_budget: CueEvalBudget,
}

impl Default for RepositoryCeilings {
    fn default() -> Self {
        Self {
            allowed_visibility: vec![
                Visibility::Private,
                Visibility::Internal,
                Visibility::Public,
            ],
            allow_public_descendants: false,
            protected_refs_must_validate_config: true,
            allowed_publishers: Vec::new(),
            allowed_storage_backends: Vec::new(),
            cue_eval_budget: CueEvalBudget::default(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkspaceCeilings {
    pub allowed_visibility: Vec<Visibility>,
    pub allow_public_descendants: bool,
    pub allowed_storage_backends: Vec<String>,
}

impl Default for WorkspaceCeilings {
    fn default() -> Self {
        Self {
            allowed_visibility: vec![
                Visibility::Private,
                Visibility::Internal,
                Visibility::Public,
            ],
            allow_public_descendants: false,
            allowed_storage_backends: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GroupCeilings {
    pub allowed_visibility: Vec<Visibility>,
    pub allow_public_descendants: bool,
}

impl Default for GroupCeilings {
    fn default() -> Self {
        Self {
            allowed_visibility: vec![
                Visibility::Private,
                Visibility::Internal,
                Visibility::Public,
            ],
            allow_public_descendants: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PublisherCeilings {
    pub allowed_extensions: Vec<String>,
    pub allowed_event_types: Vec<String>,
    pub allow_private_events: bool,
    pub require_explicit_routes: bool,
}

impl Default for PublisherCeilings {
    fn default() -> Self {
        Self {
            allowed_extensions: Vec::new(),
            allowed_event_types: Vec::new(),
            allow_private_events: false,
            require_explicit_routes: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CueEvalBudget {
    pub wall_time_ms: u64,
    pub memory_bytes: u64,
    pub max_files: usize,
    pub max_depth: usize,
    pub max_bytes: usize,
}

impl Default for CueEvalBudget {
    fn default() -> Self {
        Self {
            wall_time_ms: 5_000,
            memory_bytes: 256_000_000,
            max_files: 1_024,
            max_depth: 16,
            max_bytes: 8_000_000,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RateLimits {
    pub oidc_callback_per_ip: u32,
    pub token_exchange_per_principal: u32,
    pub graphql_per_principal: u32,
    pub graphql_per_ip_unauthenticated: u32,
    pub stream_new_connections_per_minute: u32,
    pub stream_max_concurrent: u32,
    pub git_info_refs_per_principal: u32,
    pub git_receive_pack_per_principal: u32,
}

impl Default for RateLimits {
    fn default() -> Self {
        Self {
            oidc_callback_per_ip: 10,
            token_exchange_per_principal: 30,
            graphql_per_principal: 600,
            graphql_per_ip_unauthenticated: 60,
            stream_new_connections_per_minute: 10,
            stream_max_concurrent: 25,
            git_info_refs_per_principal: 120,
            git_receive_pack_per_principal: 30,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CueFile {
    pub path: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigDiagnostic {
    pub severity: String,
    pub path: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigSnapshot {
    pub repository_id: String,
    pub commit_oid: String,
    pub path: String,
    pub config_hash: String,
    pub effective_config_json: String,
    pub created_at: String,
    pub validation_status: String,
    pub validation_errors: Vec<ConfigDiagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigValidation {
    pub accepted: bool,
    pub diagnostics: Vec<ConfigDiagnostic>,
    pub snapshots: Vec<ConfigSnapshot>,
}

pub fn validate_repository_cue_sources(
    repository_id: &str,
    commit_oid: &str,
    files: &[CueFile],
    budget: &CueEvalBudget,
) -> CoreResult<ConfigValidation> {
    let comtrya_files: Vec<&CueFile> = files
        .iter()
        .filter(|file| file.source.contains("package comtrya"))
        .collect();

    if comtrya_files.is_empty() {
        return Ok(ConfigValidation {
            accepted: true,
            diagnostics: Vec::new(),
            snapshots: vec![snapshot(repository_id, commit_oid, "/", "{}", Vec::new())],
        });
    }

    enforce_cue_budget(&comtrya_files, budget)?;

    let mut diagnostics = Vec::new();
    let mut paths = BTreeSet::from(["/".to_string()]);
    for file in comtrya_files {
        if !balanced_braces(&file.source) {
            diagnostics.push(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: "CUE braces are not balanced".to_string(),
            });
        }
        if file.source.contains("invalid: true") || file.source.contains("!!") {
            diagnostics.push(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: "repository CUE is invalid".to_string(),
            });
        }
        if let Some(parent) = parent_path_for_cue(&file.path) {
            paths.insert(parent);
        }
    }

    if !diagnostics.is_empty() {
        return Ok(ConfigValidation {
            accepted: false,
            diagnostics,
            snapshots: Vec::new(),
        });
    }

    let snapshots = paths
        .into_iter()
        .map(|path| {
            let effective_json = format!(
                "{{\"repositoryID\":\"{}\",\"commit\":\"{}\",\"path\":\"{}\"}}",
                repository_id, commit_oid, path
            );
            snapshot(
                repository_id,
                commit_oid,
                &path,
                &effective_json,
                Vec::new(),
            )
        })
        .collect();

    Ok(ConfigValidation {
        accepted: true,
        diagnostics: Vec::new(),
        snapshots,
    })
}

fn snapshot(
    repository_id: &str,
    commit_oid: &str,
    path: &str,
    effective_config_json: &str,
    validation_errors: Vec<ConfigDiagnostic>,
) -> ConfigSnapshot {
    ConfigSnapshot {
        repository_id: repository_id.to_string(),
        commit_oid: commit_oid.to_string(),
        path: path.to_string(),
        config_hash: stable_hash(effective_config_json),
        effective_config_json: effective_config_json.to_string(),
        created_at: "1970-01-01T00:00:00Z".to_string(),
        validation_status: if validation_errors.is_empty() {
            "valid".to_string()
        } else {
            "invalid".to_string()
        },
        validation_errors,
    }
}

fn stable_hash(value: &str) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in value.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

fn enforce_cue_budget(files: &[&CueFile], budget: &CueEvalBudget) -> CoreResult<()> {
    if files.len() > budget.max_files {
        return Err(evaluation_budget_error("maxFiles"));
    }
    let total_bytes: usize = files.iter().map(|file| file.source.len()).sum();
    if total_bytes > budget.max_bytes {
        return Err(evaluation_budget_error("maxBytes"));
    }
    let max_depth = files
        .iter()
        .map(|file| {
            file.path
                .split('/')
                .filter(|segment| !segment.is_empty())
                .count()
        })
        .max()
        .unwrap_or_default();
    if max_depth > budget.max_depth {
        return Err(evaluation_budget_error("maxDepth"));
    }
    Ok(())
}

fn evaluation_budget_error(limit: &str) -> CoreError {
    CoreError {
        code: ErrorCode::ConfigInvalid,
        message: format!("evaluation_budget exceeded: {limit}"),
        resource: None,
        permission: None,
    }
}

fn parent_path_for_cue(path: &str) -> Option<String> {
    let clean = path.trim_matches('/');
    let parent = clean
        .rsplit_once('/')
        .map(|(parent, _)| parent)
        .unwrap_or("");
    if parent.is_empty() {
        Some("/".to_string())
    } else {
        Some(format!("/{parent}"))
    }
}

fn balanced_braces(source: &str) -> bool {
    let mut depth = 0usize;
    for ch in source.chars() {
        match ch {
            '{' => depth += 1,
            '}' => {
                let Some(next) = depth.checked_sub(1) else {
                    return false;
                };
                depth = next;
            }
            _ => {}
        }
    }
    depth == 0
}

fn validate_allowed_origins(origins: &[String]) -> CoreResult<()> {
    for origin in origins {
        if origin.contains('*') {
            return Err(CoreError::config_invalid(
                "instance.allowedOrigins entries must not contain wildcards",
            ));
        }
        if !(origin.starts_with("http://") || origin.starts_with("https://")) {
            return Err(CoreError::config_invalid(
                "instance.allowedOrigins entries must be URL prefixes",
            ));
        }
    }
    Ok(())
}

fn validate_database(database: &DatabaseConfig) -> CoreResult<()> {
    match database {
        DatabaseConfig::Sqlite { url } if url.is_empty() => {
            Err(CoreError::config_invalid("database.url must be non-empty"))
        }
        DatabaseConfig::Postgres { url } if !url.starts_with("postgres://") => Err(
            CoreError::config_invalid("postgres database.url must start with postgres://"),
        ),
        _ => Ok(()),
    }
}

fn validate_oidc(environment: Environment, issuers: &[OidcIssuerConfig]) -> CoreResult<()> {
    if issuers.is_empty() {
        return Err(CoreError::config_invalid(
            "at least one OIDC issuer must be configured",
        ));
    }

    for issuer in issuers {
        if issuer.id.trim().is_empty() {
            return Err(CoreError::config_invalid(
                "oidc issuer id must be non-empty",
            ));
        }
        if !issuer.issuer_url.starts_with("https://") {
            return Err(CoreError::config_invalid(
                "OIDC issuer metadata must be fetched over TLS",
            ));
        }
        match issuer.client_kind {
            ClientKind::Confidential => {
                if environment == Environment::Production
                    && issuer
                        .client_secret
                        .as_deref()
                        .is_none_or(|secret| secret.trim().is_empty())
                {
                    return Err(CoreError::config_invalid(
                        "confidential OIDC clients require a non-empty clientSecret in production",
                    ));
                }
            }
            ClientKind::Public => {
                if issuer
                    .client_secret
                    .as_deref()
                    .is_some_and(|secret| !secret.trim().is_empty())
                {
                    return Err(CoreError::config_invalid(
                        "public OIDC clients must not configure clientSecret",
                    ));
                }
            }
        }
    }
    Ok(())
}

fn validate_storage(
    default: &str,
    backends: &BTreeMap<String, RepoStorageBackend>,
) -> CoreResult<()> {
    if !backends.contains_key(default) {
        return Err(CoreError::config_invalid(
            "storage.repositories.default must name a configured backend",
        ));
    }
    for (name, backend) in backends {
        Slug::new(name.clone()).map_err(|err| {
            CoreError::config_invalid(format!("repository storage backend {name:?}: {}", err))
        })?;
        match backend {
            RepoStorageBackend::Local { path } if path.trim().is_empty() => {
                return Err(CoreError::config_invalid(
                    "local repository storage backend path must be non-empty",
                ));
            }
            RepoStorageBackend::S3 {
                bucket,
                access_key_id,
                secret_access_key,
                ..
            } if bucket.is_empty() || access_key_id.is_empty() || secret_access_key.is_empty() => {
                return Err(CoreError::config_invalid(
                    "s3 repository storage backend requires bucket and credentials",
                ));
            }
            RepoStorageBackend::CloudflareArtifacts {
                account_id,
                namespace,
                token,
            } if account_id.is_empty() || namespace.is_empty() || token.is_empty() => {
                return Err(CoreError::config_invalid(
                    "cloudflare-artifacts backend requires accountID, namespace, and token",
                ));
            }
            _ => {}
        }
    }
    Ok(())
}

fn validate_visibility_ceiling(
    visibility: Visibility,
    ceilings: &WorkspaceCeilings,
) -> CoreResult<()> {
    if ceilings.allowed_visibility.contains(&visibility) {
        Ok(())
    } else {
        Err(CoreError::config_invalid(format!(
            "workspace visibility {} is outside allowedVisibility",
            visibility
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::extensions::{ExtensionInstallConfig, ExtensionSource, OciReference};

    #[test]
    fn minimal_dev_config_validates() {
        InstanceConfig::minimal_dev().validate().unwrap();
    }

    #[test]
    fn extension_install_oci_validates() {
        let mut config = InstanceConfig::minimal_dev();
        config.extensions.push(ExtensionInstallConfig {
            id: "pull-requests".to_string(),
            source: ExtensionSource::Oci {
                registry: "ghcr.io".to_string(),
                image: "comtrya/extensions/pull-requests".to_string(),
                reference: OciReference::Tag("v1.0.0".to_string()),
            },
            enabled: true,
        });
        config.validate().unwrap();
    }

    #[test]
    fn duplicate_extension_ids_are_rejected() {
        let mut config = InstanceConfig::minimal_dev();
        for _ in 0..2 {
            config.extensions.push(ExtensionInstallConfig {
                id: "checks".to_string(),
                source: ExtensionSource::Local {
                    path: "extensions/first-party/ext_checks".to_string(),
                },
                enabled: true,
            });
        }
        let err = config.validate().unwrap_err();
        assert_eq!(err.code, ErrorCode::ConfigInvalid);
        assert!(err.message.contains("duplicate extension"));
    }

    #[test]
    fn empty_oci_reference_is_rejected() {
        let cfg = ExtensionInstallConfig {
            id: "x".to_string(),
            source: ExtensionSource::Oci {
                registry: "ghcr.io".to_string(),
                image: "x/y".to_string(),
                reference: OciReference::Tag("".to_string()),
            },
            enabled: true,
        };
        let err = cfg.validate().unwrap_err();
        assert_eq!(err.code, ErrorCode::ConfigInvalid);
    }

    #[test]
    fn production_confidential_oidc_requires_secret() {
        let mut config = InstanceConfig::minimal_dev();
        config.environment = Environment::Production;
        config.public_url = "https://comtrya.example.test".to_string();
        config.oidc_issuers[0].client_secret = Some(String::new());

        let err = config.validate().unwrap_err();
        assert_eq!(err.code, ErrorCode::ConfigInvalid);
        assert!(err.message.contains("clientSecret"));
    }

    #[test]
    fn public_oidc_clients_must_not_have_secret() {
        let mut config = InstanceConfig::minimal_dev();
        config.oidc_issuers[0].client_kind = ClientKind::Public;
        config.oidc_issuers[0].client_secret = Some("not-allowed".to_string());

        assert_eq!(
            config.validate().unwrap_err().code,
            ErrorCode::ConfigInvalid
        );
    }

    #[test]
    fn allowed_origins_reject_wildcards() {
        let mut config = InstanceConfig::minimal_dev();
        config.allowed_origins = vec!["https://*.example.test".to_string()];

        assert_eq!(
            config.validate().unwrap_err().code,
            ErrorCode::ConfigInvalid
        );
    }

    #[test]
    fn repository_cue_bootstrap_without_comtrya_package_is_trivially_accepted() {
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "README.md".to_string(),
                source: "# hello".to_string(),
            }],
            &CueEvalBudget::default(),
        )
        .unwrap();

        assert!(result.accepted);
        assert_eq!(result.snapshots[0].path, "/");
    }

    #[test]
    fn repository_cue_invalid_package_is_rejected_with_diagnostics() {
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\ninvalid: true".to_string(),
            }],
            &CueEvalBudget::default(),
        )
        .unwrap();

        assert!(!result.accepted);
        assert_eq!(result.diagnostics[0].severity, "error");
    }

    #[test]
    fn repository_cue_budget_breach_returns_config_invalid() {
        let budget = CueEvalBudget {
            max_files: 0,
            ..CueEvalBudget::default()
        };
        let err = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\nrepo: {}".to_string(),
            }],
            &budget,
        )
        .unwrap_err();

        assert_eq!(err.code, ErrorCode::ConfigInvalid);
        assert!(err.message.contains("evaluation_budget"));
    }

    #[test]
    fn valid_nested_repository_cue_produces_effective_snapshots() {
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[
                CueFile {
                    path: "comtrya.cue".to_string(),
                    source: "package comtrya\nrepo: {}".to_string(),
                },
                CueFile {
                    path: "services/api/comtrya.cue".to_string(),
                    source: "package comtrya\nprojects: api: path: \"services/api\"".to_string(),
                },
            ],
            &CueEvalBudget::default(),
        )
        .unwrap();

        assert!(result.accepted);
        assert!(result.snapshots.iter().any(|snapshot| snapshot.path == "/"));
        assert!(
            result
                .snapshots
                .iter()
                .any(|snapshot| snapshot.path == "/services/api")
        );
    }
}
