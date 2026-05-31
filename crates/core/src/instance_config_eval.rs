//! Evaluate an instance's configuration from a CUE source directory.
//!
//! This is the GitOps source-of-truth path: the synced config repo (a real
//! CUE module) is evaluated with `cuengine`, then the unified root value is
//! parsed into the typed [`InstanceConfig`] and validated once. Untyped JSON
//! lives only inside this module — everything downstream sees typed values
//! (see the project's type/data-boundary rule).
//!
//! The directory is evaluated read-only; we never write into it, so syncing a
//! gitsync checkout here does not dirty its worktree.

use std::collections::BTreeMap;
use std::path::Path;

use cuengine::{ModuleEvalOptions, evaluate_module};
use serde::Deserialize;

use crate::config::{
    AdminConfig, ClientKind, DatabaseConfig, Environment, InstanceConfig, LabelConfig,
    OidcIssuerConfig, RepoStorageBackend, RepositoryConfig, WorkspaceConfig,
};
use crate::domain::Visibility;
use crate::error::{CoreError, CoreResult};
use crate::extensions::{ExtensionInstallConfig, ExtensionSource, OciReference};

/// Evaluate the `package comtrya` CUE module rooted at `config_dir` into a
/// validated [`InstanceConfig`]. Errors carry human-facing CUE diagnostics or
/// a shape/validation message.
pub fn evaluate_instance_config(config_dir: &Path) -> CoreResult<InstanceConfig> {
    let value = evaluate_root_value(config_dir)?;
    let wire: WireConfig = serde_json::from_value(value)
        .map_err(|err| CoreError::config_invalid(format!("instance config shape: {err}")))?;
    let config = wire.into_instance_config()?;
    config.validate()?;
    Ok(config)
}

/// Run cuengine non-recursively over `config_dir` and return the unified root
/// instance value (`.`), falling back to the only instance if the root is not
/// keyed as `.`.
fn evaluate_root_value(config_dir: &Path) -> CoreResult<serde_json::Value> {
    let options = ModuleEvalOptions {
        with_meta: false,
        with_references: false,
        recursive: false,
        package_name: Some("comtrya".to_string()),
        target_dir: None,
    };
    let result = evaluate_module(config_dir, "comtrya", Some(&options))
        .map_err(|err| CoreError::config_invalid(format!("evaluate instance config: {err}")))?;
    result
        .instances
        .get(".")
        .or_else(|| result.instances.values().next())
        .cloned()
        .ok_or_else(|| {
            CoreError::config_invalid("no `package comtrya` CUE instance found in config repo")
        })
}

// ---- Wire structs: the CUE/JSON shape, parsed once at this boundary. ----

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireConfig {
    instance: WireInstance,
    database: WireDatabase,
    oidc: WireOidc,
    storage: WireStorage,
    #[serde(default)]
    authz: Option<WireAuthz>,
    #[serde(default)]
    workspaces: BTreeMap<String, WireWorkspace>,
    #[serde(default)]
    admins: Vec<WireAdmin>,
    #[serde(default)]
    repositories: Vec<WireRepository>,
    #[serde(default)]
    labels: Vec<WireLabel>,
    #[serde(default)]
    extensions: Vec<WireExtension>,
    #[serde(rename = "rateLimits", default)]
    rate_limits: Option<WireRateLimits>,
}

/// Operator-overridable rate-limit ceilings. Every field is optional;
/// a missing value falls back to the `RateLimits::default()` shipped
/// with the kernel binary. Names match the camelCase wire convention
/// across the rest of the WireConfig schema.
#[derive(Debug, Default, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireRateLimits {
    #[serde(rename = "oidcCallbackPerIp", default)]
    oidc_callback_per_ip: Option<u32>,
    #[serde(rename = "tokenExchangePerPrincipal", default)]
    token_exchange_per_principal: Option<u32>,
    #[serde(rename = "graphqlPerPrincipal", default)]
    graphql_per_principal: Option<u32>,
    #[serde(rename = "graphqlPerIpUnauthenticated", default)]
    graphql_per_ip_unauthenticated: Option<u32>,
    #[serde(rename = "streamNewConnectionsPerMinute", default)]
    stream_new_connections_per_minute: Option<u32>,
    #[serde(rename = "streamMaxConcurrent", default)]
    stream_max_concurrent: Option<u32>,
    #[serde(rename = "gitInfoRefsPerPrincipal", default)]
    git_info_refs_per_principal: Option<u32>,
    #[serde(rename = "gitReceivePackPerPrincipal", default)]
    git_receive_pack_per_principal: Option<u32>,
}

impl WireRateLimits {
    fn into_domain(self) -> crate::config::RateLimits {
        let defaults = crate::config::RateLimits::default();
        crate::config::RateLimits {
            oidc_callback_per_ip: self
                .oidc_callback_per_ip
                .unwrap_or(defaults.oidc_callback_per_ip),
            token_exchange_per_principal: self
                .token_exchange_per_principal
                .unwrap_or(defaults.token_exchange_per_principal),
            graphql_per_principal: self
                .graphql_per_principal
                .unwrap_or(defaults.graphql_per_principal),
            graphql_per_ip_unauthenticated: self
                .graphql_per_ip_unauthenticated
                .unwrap_or(defaults.graphql_per_ip_unauthenticated),
            stream_new_connections_per_minute: self
                .stream_new_connections_per_minute
                .unwrap_or(defaults.stream_new_connections_per_minute),
            stream_max_concurrent: self
                .stream_max_concurrent
                .unwrap_or(defaults.stream_max_concurrent),
            git_info_refs_per_principal: self
                .git_info_refs_per_principal
                .unwrap_or(defaults.git_info_refs_per_principal),
            git_receive_pack_per_principal: self
                .git_receive_pack_per_principal
                .unwrap_or(defaults.git_receive_pack_per_principal),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireInstance {
    id: String,
    name: String,
    #[serde(rename = "publicURL")]
    public_url: String,
    #[serde(default)]
    environment: Option<String>,
    #[serde(rename = "allowedOrigins", default)]
    allowed_origins: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireDatabase {
    kind: String,
    url: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireOidc {
    #[serde(default)]
    issuers: Vec<WireOidcIssuer>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireOidcIssuer {
    id: String,
    #[serde(rename = "issuerURL")]
    issuer_url: String,
    #[serde(rename = "clientID")]
    client_id: String,
    #[serde(rename = "clientKind")]
    client_kind: String,
    #[serde(rename = "clientSecret", default)]
    client_secret: Option<String>,
    #[serde(rename = "redirectURL")]
    redirect_url: String,
    #[serde(default)]
    allowed: WireOidcAllowed,
}

#[derive(Debug, Default, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireOidcAllowed {
    #[serde(default)]
    domains: Vec<String>,
    #[serde(default)]
    groups: Vec<String>,
    #[serde(default)]
    subjects: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireStorage {
    repositories: WireRepoStorage,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireRepoStorage {
    default: String,
    #[serde(default)]
    backends: BTreeMap<String, WireBackend>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireBackend {
    kind: String,
    #[serde(default)]
    path: Option<String>,
    #[serde(default)]
    bucket: Option<String>,
    #[serde(default)]
    prefix: Option<String>,
    #[serde(default)]
    region: Option<String>,
    #[serde(default)]
    endpoint: Option<String>,
    #[serde(rename = "accessKeyID", default)]
    access_key_id: Option<String>,
    #[serde(rename = "secretAccessKey", default)]
    secret_access_key: Option<String>,
    #[serde(rename = "accountID", default)]
    account_id: Option<String>,
    #[serde(default)]
    namespace: Option<String>,
    #[serde(default)]
    token: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireAuthz {
    kind: String,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireWorkspace {
    name: String,
    #[serde(default)]
    visibility: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(rename = "allowPublicDescendants", default)]
    allow_public_descendants: bool,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireAdmin {
    #[serde(default)]
    issuer: Option<String>,
    #[serde(default)]
    subject: Option<String>,
    #[serde(default)]
    email: Option<String>,
    #[serde(default)]
    handle: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireRepository {
    path: String,
    #[serde(default)]
    visibility: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(rename = "storageBackend", default)]
    storage_backend: Option<String>,
    #[serde(rename = "defaultBranch", default)]
    default_branch: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireLabel {
    name: String,
    color: String,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    scope: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireExtension {
    id: String,
    source: WireExtensionSource,
    #[serde(default = "default_true")]
    enabled: bool,
    #[serde(rename = "routePrefix", default)]
    route_prefix: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireExtensionSource {
    kind: String,
    #[serde(default)]
    path: Option<String>,
    #[serde(default)]
    registry: Option<String>,
    #[serde(default)]
    image: Option<String>,
    #[serde(default)]
    reference: Option<String>,
    #[serde(default)]
    tag: Option<String>,
    #[serde(default)]
    digest: Option<String>,
}

fn default_true() -> bool {
    true
}

// ---- Wire → domain conversion. ----

impl WireConfig {
    fn into_instance_config(self) -> CoreResult<InstanceConfig> {
        let database = match self.database.kind.as_str() {
            "sqlite" => DatabaseConfig::Sqlite {
                url: self.database.url,
            },
            "postgres" => DatabaseConfig::Postgres {
                url: self.database.url,
            },
            other => {
                return Err(CoreError::config_invalid(format!(
                    "database.kind {other:?} is not supported"
                )));
            }
        };

        let oidc_issuers = self
            .oidc
            .issuers
            .into_iter()
            .map(WireOidcIssuer::into_domain)
            .collect::<CoreResult<Vec<_>>>()?;

        let repository_storage_backends = self
            .storage
            .repositories
            .backends
            .into_iter()
            .map(|(name, backend)| backend.into_domain(&name).map(|b| (name, b)))
            .collect::<CoreResult<BTreeMap<_, _>>>()?;

        let workspaces = self
            .workspaces
            .into_iter()
            .map(|(slug, ws)| ws.into_domain().map(|ws| (slug, ws)))
            .collect::<CoreResult<BTreeMap<_, _>>>()?;

        let extensions = self
            .extensions
            .into_iter()
            .map(WireExtension::into_domain)
            .collect::<CoreResult<Vec<_>>>()?;

        Ok(InstanceConfig {
            id: self.instance.id,
            name: self.instance.name,
            public_url: self.instance.public_url,
            environment: parse_environment(self.instance.environment.as_deref())?,
            allowed_origins: self.instance.allowed_origins,
            database,
            oidc_issuers,
            repository_storage_default: self.storage.repositories.default,
            repository_storage_backends,
            authz_kind: self
                .authz
                .map(|a| a.kind)
                .unwrap_or_else(|| "spicedb".to_string()),
            workspaces,
            rate_limits: self
                .rate_limits
                .map(WireRateLimits::into_domain)
                .unwrap_or_default(),
            extensions,
            admins: self
                .admins
                .into_iter()
                .map(WireAdmin::into_domain)
                .collect(),
            repositories: self
                .repositories
                .into_iter()
                .map(WireRepository::into_domain)
                .collect::<CoreResult<Vec<_>>>()?,
            labels: self
                .labels
                .into_iter()
                .map(WireLabel::into_domain)
                .collect(),
        })
    }
}

impl WireOidcIssuer {
    fn into_domain(self) -> CoreResult<OidcIssuerConfig> {
        let client_kind = match self.client_kind.as_str() {
            "public" => ClientKind::Public,
            "confidential" => ClientKind::Confidential,
            other => {
                return Err(CoreError::config_invalid(format!(
                    "oidc issuer {:?} clientKind {other:?} must be public or confidential",
                    self.id
                )));
            }
        };
        Ok(OidcIssuerConfig {
            id: self.id,
            issuer_url: self.issuer_url,
            client_id: self.client_id,
            client_kind,
            client_secret: self.client_secret,
            redirect_url: self.redirect_url,
            allowed_domains: self.allowed.domains,
            allowed_groups: self.allowed.groups,
            allowed_subjects: self.allowed.subjects,
        })
    }
}

impl WireBackend {
    fn into_domain(self, name: &str) -> CoreResult<RepoStorageBackend> {
        let missing = |field: &str| {
            CoreError::config_invalid(format!(
                "storage backend {name:?} ({}) is missing {field}",
                self.kind
            ))
        };
        match self.kind.as_str() {
            "local" => Ok(RepoStorageBackend::Local {
                path: self.path.ok_or_else(|| missing("path"))?,
            }),
            "s3" => Ok(RepoStorageBackend::S3 {
                bucket: self.bucket.ok_or_else(|| missing("bucket"))?,
                prefix: self.prefix,
                region: self.region,
                endpoint: self.endpoint,
                access_key_id: self.access_key_id.ok_or_else(|| missing("accessKeyID"))?,
                secret_access_key: self
                    .secret_access_key
                    .ok_or_else(|| missing("secretAccessKey"))?,
            }),
            "cloudflare-artifacts" => Ok(RepoStorageBackend::CloudflareArtifacts {
                account_id: self.account_id.ok_or_else(|| missing("accountID"))?,
                namespace: self.namespace.ok_or_else(|| missing("namespace"))?,
                token: self.token.ok_or_else(|| missing("token"))?,
            }),
            other => Err(CoreError::config_invalid(format!(
                "storage backend {name:?} kind {other:?} is not supported"
            ))),
        }
    }
}

impl WireWorkspace {
    fn into_domain(self) -> CoreResult<WorkspaceConfig> {
        Ok(WorkspaceConfig {
            visibility: parse_visibility(self.visibility.as_deref())?,
            name: self.name,
            description: self.description,
            allow_public_descendants: self.allow_public_descendants,
        })
    }
}

impl WireAdmin {
    fn into_domain(self) -> AdminConfig {
        AdminConfig {
            issuer: self.issuer,
            subject: self.subject,
            email: self.email,
            handle: self.handle,
        }
    }
}

impl WireRepository {
    fn into_domain(self) -> CoreResult<RepositoryConfig> {
        Ok(RepositoryConfig {
            visibility: parse_visibility(self.visibility.as_deref())?,
            path: self.path,
            description: self.description,
            storage_backend: self.storage_backend,
            default_branch: self.default_branch,
        })
    }
}

impl WireLabel {
    fn into_domain(self) -> LabelConfig {
        LabelConfig {
            name: self.name,
            color: self.color,
            description: self.description,
            scope: self.scope,
        }
    }
}

impl WireExtension {
    fn into_domain(self) -> CoreResult<ExtensionInstallConfig> {
        let id = self.id;
        let src = self.source;
        let source = match src.kind.as_str() {
            "local" => ExtensionSource::Local {
                path: src.path.ok_or_else(|| {
                    CoreError::config_invalid(format!("extension {id:?} local source missing path"))
                })?,
            },
            "oci" => {
                let reference = if let Some(digest) = src.digest {
                    OciReference::Digest(digest)
                } else if let Some(reference) = src.reference {
                    if reference.starts_with("sha256:") {
                        OciReference::Digest(reference)
                    } else {
                        OciReference::Tag(reference)
                    }
                } else if let Some(tag) = src.tag {
                    OciReference::Tag(tag)
                } else {
                    return Err(CoreError::config_invalid(format!(
                        "extension {id:?} OCI source missing reference/tag/digest"
                    )));
                };
                ExtensionSource::Oci {
                    registry: src.registry.ok_or_else(|| {
                        CoreError::config_invalid(format!(
                            "extension {id:?} OCI source missing registry"
                        ))
                    })?,
                    image: src.image.ok_or_else(|| {
                        CoreError::config_invalid(format!(
                            "extension {id:?} OCI source missing image"
                        ))
                    })?,
                    reference,
                }
            }
            other => {
                return Err(CoreError::config_invalid(format!(
                    "extension {id:?} source kind {other:?} is not supported"
                )));
            }
        };
        Ok(ExtensionInstallConfig {
            id,
            source,
            enabled: self.enabled,
            route_prefix: self.route_prefix,
        })
    }
}

fn parse_environment(value: Option<&str>) -> CoreResult<Environment> {
    // Closed parse: a genuinely-absent value defaults to Development, but an
    // unrecognized (e.g. miscased or misspelled) value is rejected rather than
    // silently downgraded — a silent downgrade would disable production
    // hardening for a config that meant to opt into it.
    match value {
        None | Some("development") => Ok(Environment::Development),
        Some("production") => Ok(Environment::Production),
        Some(other) => Err(CoreError::config_invalid(format!(
            "instance environment must be \"development\" or \"production\", got {other:?}"
        ))),
    }
}

fn parse_visibility(value: Option<&str>) -> CoreResult<Visibility> {
    // Closed parse: an absent value defaults to Private (the safe default), but
    // an unrecognized value is rejected rather than silently treated as
    // Private — a silent fallback could mask a typo intended to make a resource
    // public or internal.
    match value {
        None | Some("PRIVATE") => Ok(Visibility::Private),
        Some("PUBLIC") => Ok(Visibility::Public),
        Some("INTERNAL") => Ok(Visibility::Internal),
        Some(other) => Err(CoreError::config_invalid(format!(
            "visibility must be \"PUBLIC\", \"INTERNAL\", or \"PRIVATE\", got {other:?}"
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    /// Write a `package comtrya` CUE module to `dir` and evaluate it.
    fn eval(dir: &Path, body: &str) -> CoreResult<InstanceConfig> {
        let module_dir = dir.join("cue.mod");
        std::fs::create_dir_all(&module_dir).unwrap();
        std::fs::write(
            module_dir.join("module.cue"),
            "module: \"comtrya.test/config\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();
        std::fs::write(dir.join("config.cue"), body).unwrap();
        evaluate_instance_config(dir)
    }

    const MINIMAL: &str = r#"package comtrya

instance: {
    id:          "comtrya-dev"
    name:        "Comtrya Dev"
    publicURL:   "http://localhost:8080"
    environment: "development"
    allowedOrigins: ["http://localhost:4321"]
}
database: { kind: "sqlite", url: "sqlite://comtrya.db" }
oidc: issuers: [{
    id:          "dev"
    issuerURL:   "https://issuer.example.test"
    clientID:    "comtrya"
    clientKind:  "confidential"
    clientSecret: "dev-secret"
    redirectURL: "http://localhost:8080/auth/oidc/dev/callback"
    allowed: domains: ["example.test"]
}]
storage: repositories: {
    default: "local"
    backends: local: { kind: "local", path: "./data/repos" }
}
authz: kind: "spicedb"
workspaces: default: { name: "Default", visibility: "PRIVATE" }
"#;

    #[test]
    fn evaluates_minimal_config() {
        let dir = tempfile::tempdir().unwrap();
        let config = eval(dir.path(), MINIMAL).unwrap();
        assert_eq!(config.id, "comtrya-dev");
        assert_eq!(config.environment, Environment::Development);
        assert_eq!(config.oidc_issuers.len(), 1);
        assert_eq!(config.oidc_issuers[0].allowed_domains, vec!["example.test"]);
        assert_eq!(config.repository_storage_default, "local");
        assert!(config.admins.is_empty());
        assert!(config.repositories.is_empty());
        assert!(config.labels.is_empty());
    }

    #[test]
    fn parses_admins_repositories_and_labels() {
        let dir = tempfile::tempdir().unwrap();
        let body = format!(
            "{MINIMAL}\nadmins: [{{ email: \"a@example.test\" }}, {{ subject: \"sub-1\", issuer: \"dev\" }}]\n\
             repositories: [{{ path: \"platform/api\", visibility: \"INTERNAL\", defaultBranch: \"main\" }}]\n\
             labels: [{{ name: \"bug\", color: \"#ff0000\", description: \"defect\" }}, {{ name: \"scoped\", color: \"#00ff00\", scope: \"platform\" }}]\n"
        );
        let config = eval(dir.path(), &body).unwrap();
        assert_eq!(config.admins.len(), 2);
        assert_eq!(config.repositories.len(), 1);
        assert_eq!(config.repositories[0].path, "platform/api");
        assert_eq!(config.repositories[0].visibility, Visibility::Internal);
        assert_eq!(config.labels.len(), 2);
        assert_eq!(config.labels[1].scope.as_deref(), Some("platform"));
    }

    #[test]
    fn admin_matches_claims() {
        let dir = tempfile::tempdir().unwrap();
        let body =
            format!("{MINIMAL}\nadmins: [{{ email: \"a@example.test\", issuer: \"dev\" }}]\n");
        let config = eval(dir.path(), &body).unwrap();
        let admin = &config.admins[0];
        assert!(admin.matches("dev", "sub", Some("a@example.test"), None));
        assert!(!admin.matches("other", "sub", Some("a@example.test"), None));
        assert!(!admin.matches("dev", "sub", Some("b@example.test"), None));
    }

    #[test]
    fn rejects_bad_label_color() {
        let dir = tempfile::tempdir().unwrap();
        let body = format!("{MINIMAL}\nlabels: [{{ name: \"bug\", color: \"red\" }}]\n");
        let err = eval(dir.path(), &body).unwrap_err();
        assert!(err.message.contains("hex"), "got: {}", err.message);
    }

    #[test]
    fn rejects_admin_without_matcher() {
        let dir = tempfile::tempdir().unwrap();
        let body = format!("{MINIMAL}\nadmins: [{{ issuer: \"dev\" }}]\n");
        let err = eval(dir.path(), &body).unwrap_err();
        assert!(
            err.message.contains("subject/email/handle"),
            "got: {}",
            err.message
        );
    }

    #[test]
    fn rejects_missing_package() {
        let dir = tempfile::tempdir().unwrap();
        let module_dir = dir.path().join("cue.mod");
        std::fs::create_dir_all(&module_dir).unwrap();
        std::fs::write(
            module_dir.join("module.cue"),
            "module: \"comtrya.test/config\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();
        std::fs::write(dir.path().join("readme.md"), "# not cue").unwrap();
        assert!(evaluate_instance_config(dir.path()).is_err());
    }

    #[test]
    fn unknown_top_level_key_is_rejected() {
        let dir = tempfile::tempdir().unwrap();
        let body = format!("{MINIMAL}\nenvironmnet: \"production\"\n");
        let err = eval(dir.path(), &body).unwrap_err();
        assert!(
            err.message.contains("unknown field") || err.message.contains("environmnet"),
            "got: {}",
            err.message
        );
    }

    #[test]
    fn rate_limits_default_when_block_absent() {
        // Regression for TNQ-3 P1: previously `WireConfig` had no
        // `rateLimits` field at all, and `into_instance_config` set
        // `RateLimits::default()` unconditionally — operators had no
        // way to tune the per-principal / per-IP ceilings the server
        // actually enforces. Now: missing block falls back to defaults,
        // every present field overrides.
        let dir = tempfile::tempdir().unwrap();
        let config = eval(dir.path(), MINIMAL).unwrap();
        let defaults = crate::config::RateLimits::default();
        assert_eq!(config.rate_limits, defaults);
    }

    #[test]
    fn rate_limits_wire_field_reaches_instance_config() {
        let dir = tempfile::tempdir().unwrap();
        // Override two fields; leave the rest to defaults.
        let body = format!(
            "{MINIMAL}\nrateLimits: {{ graphqlPerPrincipal: 1200, gitReceivePackPerPrincipal: 5 }}\n"
        );
        let config = eval(dir.path(), &body).unwrap();
        assert_eq!(config.rate_limits.graphql_per_principal, 1200);
        assert_eq!(config.rate_limits.git_receive_pack_per_principal, 5);
        // Unset fields keep their defaults.
        let defaults = crate::config::RateLimits::default();
        assert_eq!(
            config.rate_limits.oidc_callback_per_ip,
            defaults.oidc_callback_per_ip
        );
        assert_eq!(
            config.rate_limits.stream_max_concurrent,
            defaults.stream_max_concurrent
        );
    }

    #[test]
    fn unknown_visibility_value_is_rejected() {
        let dir = tempfile::tempdir().unwrap();
        let body =
            format!("{MINIMAL}\nrepositories: [{{ path: \"a/b\", visibility: \"public\" }}]\n");
        let err = eval(dir.path(), &body).unwrap_err();
        assert!(err.message.contains("visibility"), "got: {}", err.message);
    }

    #[test]
    fn parse_visibility_is_a_closed_parse() {
        assert!(matches!(parse_visibility(None), Ok(Visibility::Private)));
        assert!(matches!(
            parse_visibility(Some("PUBLIC")),
            Ok(Visibility::Public)
        ));
        assert!(matches!(
            parse_visibility(Some("INTERNAL")),
            Ok(Visibility::Internal)
        ));
        assert!(matches!(
            parse_visibility(Some("PRIVATE")),
            Ok(Visibility::Private)
        ));
        assert!(parse_visibility(Some("public")).is_err());
        assert!(parse_visibility(Some("")).is_err());
    }

    #[test]
    fn parse_environment_is_a_closed_parse() {
        assert!(matches!(
            parse_environment(None),
            Ok(Environment::Development)
        ));
        assert!(matches!(
            parse_environment(Some("development")),
            Ok(Environment::Development)
        ));
        assert!(matches!(
            parse_environment(Some("production")),
            Ok(Environment::Production)
        ));
        // Miscased / misspelled values must be rejected, never silently
        // downgraded to Development (which would disable prod hardening).
        assert!(parse_environment(Some("Production")).is_err());
        assert!(parse_environment(Some("prod")).is_err());
        assert!(parse_environment(Some("")).is_err());
    }
}
