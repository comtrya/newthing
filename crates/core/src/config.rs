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
        // The domain part of an email is case-insensitive per RFC 5321, so an
        // IdP that emits `user@Example.test` must still match an allowlisted
        // `example.test`. Subjects and groups stay case-sensitive (subjects are
        // case-sensitive per the OIDC spec).
        if email
            .and_then(|value| value.rsplit_once('@').map(|(_, domain)| domain))
            .is_some_and(|domain| {
                self.allowed_domains
                    .iter()
                    .any(|allowed| allowed.eq_ignore_ascii_case(domain))
            })
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

/// An admin identity matched against a logged-in OIDC user's claims.
///
/// Admins are pure OIDC-claim matches — there is no local auth (see
/// `feedback_auth_oidc_only`). A user is an admin when, within the optional
/// `issuer` constraint, ANY populated matcher equals the corresponding claim.
/// At least one of `subject`/`email`/`handle` must be set (enforced by
/// [`InstanceConfig::validate`]).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AdminConfig {
    pub issuer: Option<String>,
    pub subject: Option<String>,
    pub email: Option<String>,
    pub handle: Option<String>,
}

impl AdminConfig {
    /// True when this entry grants admin to the given OIDC claims. An empty
    /// `issuer` matches any issuer; a populated one must equal `issuer_id`.
    /// Among the populated matchers, any single equal claim is sufficient.
    pub fn matches(
        &self,
        issuer_id: &str,
        subject: &str,
        email: Option<&str>,
        handle: Option<&str>,
    ) -> bool {
        if let Some(want) = &self.issuer
            && want != issuer_id
        {
            return false;
        }
        if self.subject.as_deref() == Some(subject) {
            return true;
        }
        if let Some(want) = &self.email
            && email == Some(want.as_str())
        {
            return true;
        }
        if let Some(want) = &self.handle
            && handle == Some(want.as_str())
        {
            return true;
        }
        false
    }

    fn has_matcher(&self) -> bool {
        self.subject.is_some() || self.email.is_some() || self.handle.is_some()
    }
}

/// A repository the instance declares in its config. The GitOps reconciler
/// treats the declared set as authoritative (create/update/delete).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepositoryConfig {
    /// Slash-separated path under the instance root, e.g. `platform/api`.
    /// Each segment must be a valid [`Slug`].
    pub path: String,
    pub visibility: Visibility,
    pub description: Option<String>,
    /// Storage backend name; falls back to `repository_storage_default`.
    pub storage_backend: Option<String>,
    pub default_branch: Option<String>,
}

/// A label definition. Global (instance) labels are inheritable; per-repo CUE
/// can add scoped labels. `scope` is `None` for a global inheritable label.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LabelConfig {
    pub name: String,
    /// `#rrggbb` hex color.
    pub color: String,
    pub description: Option<String>,
    pub scope: Option<String>,
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
    pub admins: Vec<AdminConfig>,
    pub repositories: Vec<RepositoryConfig>,
    pub labels: Vec<LabelConfig>,
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
        self.validate_admins()?;
        self.validate_repositories()?;
        self.validate_labels()?;
        Ok(())
    }

    fn validate_admins(&self) -> CoreResult<()> {
        for admin in &self.admins {
            if !admin.has_matcher() {
                return Err(CoreError::config_invalid(
                    "each admin entry must set at least one of subject/email/handle",
                ));
            }
        }
        Ok(())
    }

    fn validate_repositories(&self) -> CoreResult<()> {
        let mut seen = BTreeMap::new();
        for repo in &self.repositories {
            if repo.path.trim().is_empty() {
                return Err(CoreError::config_invalid(
                    "repository.path must be non-empty",
                ));
            }
            for segment in repo.path.split('/') {
                Slug::new(segment.to_string()).map_err(|err| {
                    CoreError::config_invalid(format!(
                        "repository path {:?} segment {segment:?}: {}",
                        repo.path, err.message
                    ))
                })?;
            }
            if seen.insert(repo.path.clone(), ()).is_some() {
                return Err(CoreError::config_invalid(format!(
                    "duplicate repository path {:?} in config",
                    repo.path
                )));
            }
            if !self
                .ceilings
                .repository
                .allowed_visibility
                .contains(&repo.visibility)
            {
                return Err(CoreError::config_invalid(format!(
                    "repository {:?} visibility {} is outside allowedVisibility",
                    repo.path, repo.visibility
                )));
            }
            if let Some(backend) = &repo.storage_backend
                && !self.repository_storage_backends.contains_key(backend)
            {
                return Err(CoreError::config_invalid(format!(
                    "repository {:?} storageBackend {backend:?} is not a configured backend",
                    repo.path
                )));
            }
        }
        Ok(())
    }

    fn validate_labels(&self) -> CoreResult<()> {
        for label in &self.labels {
            if label.name.trim().is_empty() {
                return Err(CoreError::config_invalid("label.name must be non-empty"));
            }
            if !is_hex_color(&label.color) {
                return Err(CoreError::config_invalid(format!(
                    "label {:?} color {:?} must be a #rrggbb hex string",
                    label.name, label.color
                )));
            }
            if let Some(scope) = &label.scope
                && scope.trim().is_empty()
            {
                return Err(CoreError::config_invalid(format!(
                    "label {:?} scope must be non-empty when present",
                    label.name
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
            admins: Vec::new(),
            repositories: Vec::new(),
            labels: Vec::new(),
        }
    }
}

/// `#rrggbb` (exactly six hex digits after a leading `#`).
fn is_hex_color(value: &str) -> bool {
    let Some(hex) = value.strip_prefix('#') else {
        return false;
    };
    hex.len() == 6 && hex.bytes().all(|b| b.is_ascii_hexdigit())
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Ceilings {
    pub repository: RepositoryCeilings,
    pub workspace: WorkspaceCeilings,
    pub group: GroupCeilings,
    pub publishers: PublisherCeilings,
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

/// Caps applied to user-supplied CUE files before invoking the
/// cuengine evaluator. `wall_time_ms` and `memory_bytes` used to live
/// on this struct but were never enforced; deleted to satisfy the
/// no-dead-code rule. Wiring a real time/memory cap around the
/// cuengine FFI call is tracked as a separate follow-up — until that
/// lands, the only protections against pathological CUE inputs are
/// `max_files` / `max_depth` / `max_bytes` and whatever process-level
/// quotas the OS imposes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CueEvalBudget {
    pub max_files: usize,
    pub max_depth: usize,
    pub max_bytes: usize,
}

impl Default for CueEvalBudget {
    fn default() -> Self {
        Self {
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

/// A schema snippet injected into the receive-pack CUE validator's
/// workdir alongside the kernel base schema. One per extension that
/// registers a `cueSchemas` entry. Constructed via `new()` which
/// enforces a strict id allowlist — sanitisation happens once at
/// the type boundary, write paths trust the value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CueSchemaFile {
    id: String,
    contents: String,
}

impl CueSchemaFile {
    /// `id` must match `^[a-z][a-z0-9-]*$`. Excludes path separators,
    /// `..`, NUL, control chars, uppercase, and leading digits. The
    /// final on-disk path will be `01-comtrya-ext-{id}.cue`; the
    /// allowlist rules out every shape that could escape the workdir
    /// or collide with the kernel slot.
    pub fn new(id: impl Into<String>, contents: impl Into<String>) -> CoreResult<Self> {
        let id = id.into();
        let mut chars = id.chars();
        let valid = matches!(chars.next(), Some(c) if c.is_ascii_lowercase())
            && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
        if !valid {
            return Err(CoreError::bad_user_input(
                "CueSchemaFile.id must match ^[a-z][a-z0-9-]*$",
            ));
        }
        Ok(Self {
            id,
            contents: contents.into(),
        })
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn contents(&self) -> &str {
        &self.contents
    }
}

/// The published Comtrya configuration schema (`package schema`),
/// authored at `./schema/schema.cue` and imported by repos as
/// `github.com/comtrya/comtrya/schema`. Defines `#Ref`,
/// `#PrincipalRef`, `#OwnerRef`, `#Repository`, the `#Label` family
/// and the open `#Project`. The kernel is the source of truth, so the
/// forge embeds it and vendors the package into eval workdirs for
/// repos that don't ship it in-module.
pub const SCHEMA_CUE: &str = include_str!("../../../schema/schema.cue");

/// Thin `package comtrya` bridge the forge injects at the eval workdir
/// root as `00-comtrya-kernel.cue`. It imports the published schema and
/// re-exposes every kernel definition as a local `package comtrya`
/// alias, preserving the kernel contract that the full vocabulary is
/// available *unqualified* in `package comtrya`. Extension-contributed
/// schemas and repo configs reference these names directly (e.g.
/// ext_docs uses `#PrincipalRef`, every extension reopens `#Project`),
/// so the bridge must alias all of them — not just `#Project`. It also
/// constrains the top-level config shape the forge projects to its JSON
/// API. Extension-specific concepts live in extension-registered
/// schemas, not here.
pub const KERNEL_BRIDGE_CUE: &str = concat!(
    "package comtrya\n\n",
    "import \"github.com/comtrya/comtrya/schema\"\n\n",
    "#Ref: schema.#Ref\n",
    "#PrincipalRef: schema.#PrincipalRef\n",
    "#OwnerRef: schema.#OwnerRef\n",
    "#Bookmark: schema.#Bookmark\n",
    "#PlainLabel: schema.#PlainLabel\n",
    "#ScopedLabel: schema.#ScopedLabel\n",
    "#ExclusiveLabel: schema.#ExclusiveLabel\n",
    "#Label: schema.#Label\n",
    "#Repository: schema.#Repository\n",
    "#Project: schema.#Project\n",
    "projects: [Name=string]: #Project & {name: Name}\n",
    "repository?: #Repository\n",
);

/// Workdir-relative directory the published schema package is vendored
/// into so a cross-module `import "github.com/comtrya/comtrya/schema"`
/// resolves. Matches the module path of [`SCHEMA_CUE`].
const SCHEMA_VENDOR_REL: &str = "cue.mod/pkg/github.com/comtrya/comtrya/schema";

/// The module path under which [`SCHEMA_CUE`] ships in-module. Only the
/// repo whose CUE module IS this path provides the schema package
/// natively; every other repo needs the package vendored.
const KERNEL_MODULE_PATH: &str = "github.com/comtrya/comtrya";

/// Install the kernel schema into a cuengine eval `workdir`: write the
/// `package comtrya` bridge as `00-comtrya-kernel.cue`, and vendor the
/// published schema package unless the workdir already ships it
/// in-module. The only in-module case is `github.com/comtrya/comtrya`
/// itself — it declares that module path in `cue.mod/module.cue` and
/// ships the package at a top-level `schema/` directory, so vendoring a
/// copy under the same import path would collide. There the vendor step
/// is skipped and the bridge's import resolves against the in-tree
/// package.
///
/// A `schema/` directory alone is NOT sufficient to skip vendoring: an
/// imported repo can ship an unrelated top-level `schema/` while its
/// module is synthesised (`comtrya.synthesised/repo`) or some third-party
/// path. In that case the bridge's `import
/// "github.com/comtrya/comtrya/schema"` has nothing to resolve against
/// unless the package is vendored, so the gate is the module path, not
/// the directory.
///
/// Shared by the receive-pack validator ([`evaluate_cue_files_with_cuengine`])
/// and the server's per-repo browser (`cue_config::install_schemas`) so
/// both evaluate against an identical workdir layout.
pub fn install_kernel_schema(workdir: &std::path::Path) -> std::io::Result<()> {
    std::fs::write(workdir.join("00-comtrya-kernel.cue"), KERNEL_BRIDGE_CUE)?;
    if workdir.join("schema").is_dir() && workdir_module_is_kernel(workdir) {
        return Ok(());
    }
    let pkg_dir = workdir.join(SCHEMA_VENDOR_REL);
    std::fs::create_dir_all(&pkg_dir)?;
    std::fs::write(pkg_dir.join("schema.cue"), SCHEMA_CUE)?;
    Ok(())
}

/// Whether the workdir's `cue.mod/module.cue` declares the kernel module
/// path [`KERNEL_MODULE_PATH`] — i.e. this workdir IS
/// `github.com/comtrya/comtrya` and provides the schema package
/// in-module. Any major-version suffix (`@v0`) on the module path is
/// stripped before comparison. A missing or unparseable module file
/// reads as "not the kernel module", which errs toward vendoring.
fn workdir_module_is_kernel(workdir: &std::path::Path) -> bool {
    let Ok(source) = std::fs::read_to_string(workdir.join("cue.mod").join("module.cue")) else {
        return false;
    };
    module_path_of(&source).is_some_and(|path| path == KERNEL_MODULE_PATH)
}

/// Extract the `module:` path declared in a `cue.mod/module.cue` source,
/// with any `@<major>` version suffix stripped. Returns `None` when no
/// `module:` field is present. Tolerates leading whitespace and both
/// `module: "x"` and `module:"x"` spacing.
fn module_path_of(module_cue: &str) -> Option<String> {
    for line in module_cue.lines() {
        let trimmed = line.trim_start();
        let Some(rest) = trimmed.strip_prefix("module:") else {
            continue;
        };
        let value = rest.trim();
        let unquoted = value.strip_prefix('"')?.split('"').next()?;
        let path = unquoted.split('@').next().unwrap_or(unquoted);
        return Some(path.to_string());
    }
    None
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
    extension_schemas: &[CueSchemaFile],
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
    for file in &comtrya_files {
        if !balanced_braces(&file.source) {
            diagnostics.push(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: "CUE braces are not balanced".to_string(),
            });
        }
        if let Some(parent) = parent_path_for_cue(&file.path) {
            paths.insert(parent);
        }
    }

    // `balanced_braces` tracks only `{`/`}` (NOT `[`, `(`, quotes), so it
    // only catches a narrow class of obvious curly-brace mismatches with a
    // friendlier message. Everything else falls through to cuengine — the
    // real CUE evaluator — which catches type conflicts, constraint
    // violations, and full parse errors.
    let mut evaluated = serde_json::Value::Object(serde_json::Map::new());
    if diagnostics.is_empty() {
        match evaluate_cue_files_with_cuengine(&comtrya_files, extension_schemas) {
            Ok(value) => evaluated = value,
            Err(diagnostic) => diagnostics.push(diagnostic),
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
            let effective_json =
                effective_config_json(repository_id, commit_oid, &path, &evaluated);
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

/// Typed projection persisted as a config snapshot's `effective_config_json`.
/// Serialized via serde so escaping is correct and the field actually carries
/// the cuengine-evaluated config rather than a hand-built stub.
#[derive(Debug, serde::Serialize)]
struct EffectiveConfig<'a> {
    #[serde(rename = "repositoryID")]
    repository_id: &'a str,
    commit: &'a str,
    path: &'a str,
    evaluated: &'a serde_json::Value,
}

fn effective_config_json(
    repository_id: &str,
    commit_oid: &str,
    path: &str,
    evaluated: &serde_json::Value,
) -> String {
    serde_json::to_string(&EffectiveConfig {
        repository_id,
        commit: commit_oid,
        path,
        evaluated,
    })
    .expect("EffectiveConfig serializes")
}

/// Run cuengine over the user's `package comtrya` files in an ephemeral
/// workdir and return `Ok(())` on success, `Err(diagnostic)` on a real
/// CUE evaluation failure.
///
/// Path sanitization happens FIRST, before any filesystem touch — any
/// `CueFile::path` that is absolute or contains a `..` component is
/// rejected with no tempdir created. Without this, a crafted push could
/// write to arbitrary host paths via `tempdir.join("../../etc/...")`.
///
/// On cuengine error, the diagnostic message has the tempdir path
/// stripped (cuengine emits the absolute workdir; leaking it to a
/// GraphQL client is information disclosure).
///
/// Writes the `package comtrya` bridge as `00-comtrya-kernel.cue`,
/// vendors the published schema package (via [`install_kernel_schema`]),
/// and writes each `extension_schemas[i]` as `01-comtrya-ext-<id>.cue`
/// into the workdir before running cuengine. This matches the server's
/// `cue_config::install_schemas` layout so the receive-pack validator
/// and the per-repo browser stay aligned.
fn evaluate_cue_files_with_cuengine(
    files: &[&CueFile],
    extension_schemas: &[CueSchemaFile],
) -> Result<serde_json::Value, ConfigDiagnostic> {
    use std::path::{Component, Path};

    // 1. Sanitize EVERY path before touching the filesystem.
    //    Rejects:
    //    a. absolute paths and `..` components — would write outside the
    //       tempdir entirely;
    //    b. anything under `cue.mod/` — would overwrite the synthetic
    //       `cue.mod/module.cue` the helper writes in step 3, letting a
    //       crafted push replace the module declaration cuengine
    //       evaluates against and silently corrupt the validation result.
    for file in files {
        let p = Path::new(&file.path);
        if p.is_absolute() || p.components().any(|c| matches!(c, Component::ParentDir)) {
            return Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: "CUE file path escapes the repository workdir".to_string(),
            });
        }
        if file.path == "cue.mod/module.cue" || file.path.starts_with("cue.mod/") {
            return Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: "CUE file path must not write into cue.mod/ — that directory is reserved for the synthetic module declaration".to_string(),
            });
        }
        // Reject paths that would silently overwrite an injected
        // kernel or extension schema in step 3 below (and let an
        // attacker bypass kernel-required-field validation).
        // Compare case-insensitively because the workdir tempdir
        // lives on macOS HFS+ / APFS by default, both case-insensitive
        // — `01-COMTRYA-ext-foo.cue` would otherwise pass this guard
        // and silently collide at write time.
        let lower = file.path.to_ascii_lowercase();
        if lower == "00-comtrya-kernel.cue" || lower.starts_with("01-comtrya-ext-") {
            return Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: "CUE file path collides with kernel-injected schema slot".to_string(),
            });
        }
    }

    // 2. Tempdir scoped to this validation call. Use a non-dot prefix —
    //    CUE's package loader walks `./...` and skips directories whose
    //    *name* starts with `.` (the Go convention). `tempfile::TempDir`
    //    defaults to a `.tmpXXXX` name, which would make cuengine
    //    silently match zero packages even though the workdir contents
    //    are correct. Explicit `comtrya-cue-` prefix avoids that.
    let dir = match tempfile::Builder::new().prefix("comtrya-cue-").tempdir() {
        Ok(d) => d,
        Err(e) => {
            return Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: None,
                message: format!("create cuengine workdir: {e}"),
            });
        }
    };
    let workdir = dir.path();

    // 3. Synthetic cue.mod/module.cue — matches the server's
    //    install_schemas synthetic exactly so the two paths stay aligned.
    let module_dir = workdir.join("cue.mod");
    if let Err(e) = std::fs::create_dir_all(&module_dir) {
        return Err(ConfigDiagnostic {
            severity: "error".to_string(),
            path: None,
            message: format!("write cuengine cue.mod: {e}"),
        });
    }
    if let Err(e) = std::fs::write(
        module_dir.join("module.cue"),
        // Match the server's `install_schemas` synthetic exactly — same
        // module name, same language version, same CUE shorthand syntax
        // — so the receive-pack validator and the per-repo browser stay
        // semantically aligned.
        "module: \"comtrya.synthesised/repo\"\nlanguage: version: \"v0.10.0\"\n",
    ) {
        return Err(ConfigDiagnostic {
            severity: "error".to_string(),
            path: None,
            message: format!("write cuengine module.cue: {e}"),
        });
    }

    // 3a. Inject the kernel bridge + vendor the published schema
    //     package, then write each extension schema at the workdir
    //     root. File names use the same `01-comtrya-ext-{id}.cue`
    //     pattern as the server's install_schemas so both validators
    //     stay aligned. CueSchemaFile.id is allowlist-validated at
    //     construction; the write site trusts the type.
    if let Err(e) = install_kernel_schema(workdir) {
        return Err(ConfigDiagnostic {
            severity: "error".to_string(),
            path: None,
            message: format!("install kernel schema: {e}"),
        });
    }
    for schema in extension_schemas {
        let path = workdir.join(format!("01-comtrya-ext-{}.cue", schema.id()));
        if let Err(e) = std::fs::write(&path, schema.contents()) {
            return Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: None,
                message: format!("write extension schema {}: {e}", schema.id()),
            });
        }
    }

    // 4. Write each user file to its sanitized relative path.
    for file in files {
        let dest = workdir.join(&file.path);
        if let Some(parent) = dest.parent()
            && let Err(e) = std::fs::create_dir_all(parent)
        {
            return Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: format!("write cuengine workdir dir: {e}"),
            });
        }
        if let Err(e) = std::fs::write(&dest, &file.source) {
            return Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: Some(file.path.clone()),
                message: format!("write cuengine workdir file: {e}"),
            });
        }
    }

    // 5. Evaluate recursively across the whole workdir tree (matches the
    //    server's `run_cuengine` shape). Third arg is
    //    `Option<&ModuleEvalOptions>` so wrap in `Some`.
    let options = cuengine::ModuleEvalOptions {
        with_meta: false,
        with_references: false,
        recursive: true,
        package_name: Some("comtrya".to_string()),
        target_dir: None,
    };
    match cuengine::evaluate_module(workdir, "comtrya", Some(&options)) {
        Ok(result) => {
            // Surface the cuengine-evaluated instances (relative path ->
            // evaluated JSON) so the config snapshot carries the real
            // effective config rather than a stub.
            Ok(serde_json::to_value(&result.instances).unwrap_or(serde_json::Value::Null))
        }
        Err(error) => {
            let raw = format!("{error}");
            // Match the server's `run_cuengine` benign-error policy: when
            // cuengine reports "matched no packages" or "no CUE files",
            // it means there was nothing for it to evaluate as a coherent
            // package (e.g., subdirectories that contain no CUE files
            // matching the package filter). The server treats this as
            // success and the validator must too, or legitimate
            // nested-CUE pushes are wrongly rejected.
            if raw.contains("matched no packages") || raw.contains("no CUE files") {
                return Ok(serde_json::Value::Object(serde_json::Map::new()));
            }
            // Strip the absolute workdir path AND its canonicalized form
            // — on macOS `/var/folders/...` is a symlink to
            // `/private/var/folders/...` and cuengine may emit either
            // form depending on its internal resolution. Scrubbing only
            // one would leak the other.
            let workdir_str = workdir.to_str().unwrap_or("");
            let canonical = std::fs::canonicalize(workdir).ok();
            let canonical_str = canonical.as_deref().and_then(|p| p.to_str()).unwrap_or("");
            let mut message = raw;
            if !workdir_str.is_empty() {
                message = message.replace(workdir_str, "<workdir>");
            }
            if !canonical_str.is_empty() && canonical_str != workdir_str {
                message = message.replace(canonical_str, "<workdir>");
            }
            Err(ConfigDiagnostic {
                severity: "error".to_string(),
                path: None,
                message,
            })
        }
    }
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

    // Issuers are keyed by `id` downstream (AuthService::set_issuers collects
    // into a map), so duplicate ids would silently collapse and drop a
    // configured login provider. Reject duplicates here, mirroring the
    // extension/repository uniqueness checks in `validate()`.
    let mut seen_ids = BTreeSet::new();
    for issuer in issuers {
        if issuer.id.trim().is_empty() {
            return Err(CoreError::config_invalid(
                "oidc issuer id must be non-empty",
            ));
        }
        if !seen_ids.insert(issuer.id.trim().to_string()) {
            return Err(CoreError::config_invalid(format!(
                "duplicate oidc issuer id {:?} in config",
                issuer.id.trim()
            )));
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
            CoreError::config_invalid(format!(
                "repository storage backend {name:?}: {}",
                err.message
            ))
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
    fn oidc_allows_matches_email_domain_case_insensitively() {
        let issuer = OidcIssuerConfig {
            id: "primary".to_string(),
            issuer_url: "https://idp.test".to_string(),
            client_id: "cid".to_string(),
            client_kind: ClientKind::Confidential,
            client_secret: Some("dev-secret".to_string()),
            redirect_url: "http://localhost:8080/auth/oidc/primary/callback".to_string(),
            allowed_domains: vec!["example.test".to_string()],
            allowed_groups: vec![],
            allowed_subjects: vec![],
        };
        // Mixed-case domain from the IdP must still match the lowercase allowlist.
        assert!(issuer.allows("sub", Some("user@Example.TEST"), &[]));
        assert!(issuer.allows("sub", Some("user@example.test"), &[]));
        // A genuinely different domain is still denied.
        assert!(!issuer.allows("sub", Some("user@other.test"), &[]));
    }

    #[test]
    fn module_path_of_parses_declared_path() {
        assert_eq!(
            module_path_of(
                "module: \"github.com/comtrya/comtrya\"\nlanguage: version: \"v0.10.0\"\n"
            ),
            Some("github.com/comtrya/comtrya".to_string())
        );
        // No space after the colon.
        assert_eq!(
            module_path_of("module:\"example.com/x\"\n"),
            Some("example.com/x".to_string())
        );
        // Major-version suffix is stripped.
        assert_eq!(
            module_path_of("module: \"github.com/comtrya/comtrya@v0\"\n"),
            Some("github.com/comtrya/comtrya".to_string())
        );
        // No module field.
        assert_eq!(module_path_of("language: version: \"v0.10.0\"\n"), None);
    }

    /// Regression: a repo that ships an unrelated top-level `schema/`
    /// directory but is NOT `github.com/comtrya/comtrya` must still get
    /// the published schema package vendored, or the kernel bridge's
    /// `import "github.com/comtrya/comtrya/schema"` fails to resolve and
    /// cuengine reports "cannot find package …/schema".
    #[test]
    fn install_kernel_schema_vendors_when_schema_dir_is_not_kernel_module() {
        let dir = tempfile::tempdir().expect("tempdir");
        let workdir = dir.path();
        std::fs::create_dir_all(workdir.join("cue.mod")).unwrap();
        std::fs::write(
            workdir.join("cue.mod").join("module.cue"),
            "module: \"comtrya.synthesised/repo\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();
        // Repo coincidentally ships a top-level `schema/` directory.
        std::fs::create_dir_all(workdir.join("schema")).unwrap();
        std::fs::write(
            workdir.join("schema").join("unrelated.cue"),
            "package schema\n",
        )
        .unwrap();

        install_kernel_schema(workdir).expect("install");

        assert!(
            workdir.join(SCHEMA_VENDOR_REL).join("schema.cue").is_file(),
            "schema package must be vendored when the module is not the kernel module"
        );
    }

    /// The in-module case: the workdir IS `github.com/comtrya/comtrya`
    /// and provides the package at `schema/`. Vendoring would collide,
    /// so it is skipped.
    #[test]
    fn install_kernel_schema_skips_vendor_for_kernel_module() {
        let dir = tempfile::tempdir().expect("tempdir");
        let workdir = dir.path();
        std::fs::create_dir_all(workdir.join("cue.mod")).unwrap();
        std::fs::write(
            workdir.join("cue.mod").join("module.cue"),
            "module: \"github.com/comtrya/comtrya\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();
        std::fs::create_dir_all(workdir.join("schema")).unwrap();

        install_kernel_schema(workdir).expect("install");

        assert!(
            !workdir.join(SCHEMA_VENDOR_REL).exists(),
            "must not vendor over the in-module schema package"
        );
    }

    /// No `schema/` directory at all (the common imported-repo case):
    /// the package must be vendored regardless of module path.
    #[test]
    fn install_kernel_schema_vendors_when_no_schema_dir() {
        let dir = tempfile::tempdir().expect("tempdir");
        let workdir = dir.path();
        std::fs::create_dir_all(workdir.join("cue.mod")).unwrap();
        std::fs::write(
            workdir.join("cue.mod").join("module.cue"),
            "module: \"comtrya.synthesised/repo\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .unwrap();

        install_kernel_schema(workdir).expect("install");

        assert!(
            workdir.join(SCHEMA_VENDOR_REL).join("schema.cue").is_file(),
            "schema package must be vendored when there is no in-tree schema/"
        );
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
            route_prefix: None,
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
                route_prefix: None,
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
            route_prefix: None,
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
    fn duplicate_oidc_issuer_ids_are_rejected() {
        // Two issuers sharing an id would silently collapse downstream and
        // drop one login provider; validation must reject the config.
        let mut config = InstanceConfig::minimal_dev();
        let mut clone = config.oidc_issuers[0].clone();
        clone.issuer_url = "https://second.example.test".to_string();
        // Same id (modulo surrounding whitespace) must still collide.
        clone.id = format!("  {}  ", config.oidc_issuers[0].id);
        config.oidc_issuers.push(clone);

        let err = config.validate().unwrap_err();
        assert_eq!(err.code, ErrorCode::ConfigInvalid);
        assert!(err.message.contains("duplicate oidc issuer id"));
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
            &[],
        )
        .unwrap();

        assert!(result.accepted);
        assert_eq!(result.snapshots[0].path, "/");
    }

    #[test]
    fn repository_cue_conflicting_values_rejected() {
        // `foo: "a"` then `foo: 42` unifies to a type conflict — a real CUE
        // failure mode the legacy `"invalid: true"` string-match stub never
        // caught.
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\nfoo: \"a\"\nfoo: 42".to_string(),
            }],
            &CueEvalBudget::default(),
            &[],
        )
        .unwrap();

        assert!(!result.accepted);
        assert_eq!(result.diagnostics[0].severity, "error");
    }

    #[test]
    fn repository_cue_constraint_violation_rejected() {
        // `count: int & <3` then `count: 5` — CUE constraint solver rejects.
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\ncount: int & <3\ncount: 5".to_string(),
            }],
            &CueEvalBudget::default(),
            &[],
        )
        .unwrap();

        assert!(!result.accepted);
        assert_eq!(result.diagnostics[0].severity, "error");
    }

    #[test]
    fn repository_cue_invalid_syntax_rejected() {
        // Unclosed `[` — `balanced_braces` only tracks `{`/`}`, so this
        // falls through to cuengine, which catches it as a parse error.
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\nfoo: [".to_string(),
            }],
            &CueEvalBudget::default(),
            &[],
        )
        .unwrap();

        assert!(!result.accepted);
        assert_eq!(result.diagnostics[0].severity, "error");
    }

    #[test]
    fn repository_cue_unbalanced_braces_caught_by_smoke_check() {
        // Unbalanced `{` — caught by the fast-fail `balanced_braces` walker
        // before cuengine is invoked, yielding the friendlier message.
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\nfoo: {".to_string(),
            }],
            &CueEvalBudget::default(),
            &[],
        )
        .unwrap();

        assert!(!result.accepted);
        assert!(
            result
                .diagnostics
                .iter()
                .any(|d| d.message.contains("braces are not balanced")),
            "expected the friendlier brace-check message; got: {:?}",
            result.diagnostics,
        );
    }

    #[test]
    fn repository_cue_path_traversal_rejected() {
        // A push that names a file path escaping the repository workdir
        // (absolute path or `..` components) must be refused before any
        // filesystem write happens — defense against arbitrary-file-write.
        for path in ["../../etc/passwd", "/etc/passwd", "a/../../etc/passwd"] {
            let result = validate_repository_cue_sources(
                "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
                "0123456789abcdef0123456789abcdef01234567",
                &[CueFile {
                    path: path.to_string(),
                    source: "package comtrya".to_string(),
                }],
                &CueEvalBudget::default(),
                &[],
            )
            .unwrap();
            assert!(
                !result.accepted,
                "path `{path}` must be rejected as escaping the workdir",
            );
            assert!(
                result
                    .diagnostics
                    .iter()
                    .any(|d| d.message.contains("escapes")),
                "expected an escape diagnostic for `{path}`; got: {:?}",
                result.diagnostics,
            );
        }
    }

    #[test]
    fn repository_cue_rejects_writes_into_cue_mod() {
        // A push that tries to write into `cue.mod/` would overwrite the
        // synthetic module declaration the validator installs, letting a
        // crafted source steer cuengine's evaluation environment. Must be
        // refused before any filesystem write.
        for path in ["cue.mod/module.cue", "cue.mod/pkg/foo.cue"] {
            let result = validate_repository_cue_sources(
                "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
                "0123456789abcdef0123456789abcdef01234567",
                &[CueFile {
                    path: path.to_string(),
                    source: "package comtrya".to_string(),
                }],
                &CueEvalBudget::default(),
                &[],
            )
            .unwrap();
            assert!(
                !result.accepted,
                "path `{path}` must be rejected as writing into cue.mod/",
            );
            assert!(
                result
                    .diagnostics
                    .iter()
                    .any(|d| d.message.contains("cue.mod/")),
                "expected a cue.mod diagnostic for `{path}`; got: {:?}",
                result.diagnostics,
            );
        }
    }

    #[test]
    fn repository_cue_diagnostic_scrubs_workdir_path() {
        // cuengine emits absolute tempdir paths in its error messages. The
        // helper must scrub them — leaking host paths to GraphQL clients
        // is an information disclosure.
        let result = validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &[CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\nfoo: \"a\"\nfoo: 42".to_string(),
            }],
            &CueEvalBudget::default(),
            &[],
        )
        .unwrap();

        assert!(!result.accepted);
        let tempdir_root = std::env::temp_dir();
        let tempdir_str = tempdir_root.to_str().unwrap_or("");
        let joined = result
            .diagnostics
            .iter()
            .map(|d| d.message.as_str())
            .collect::<Vec<_>>()
            .join("\n");
        assert!(
            !joined.contains(tempdir_str),
            "diagnostic leaked tempdir path `{tempdir_str}`: {joined}",
        );
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
            &[],
        )
        .unwrap_err();

        assert_eq!(err.code, ErrorCode::ConfigInvalid);
        assert!(err.message.contains("evaluation_budget"));
    }

    // -------- #18: kernel + extension CUE schemas in validator --------

    fn validate_with(files: Vec<CueFile>, extension_schemas: &[CueSchemaFile]) -> ConfigValidation {
        validate_repository_cue_sources(
            "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3",
            "0123456789abcdef0123456789abcdef01234567",
            &files,
            &CueEvalBudget::default(),
            extension_schemas,
        )
        .unwrap()
    }

    #[test]
    fn cuengine_validator_rejects_kernel_enum_violation() {
        // The published schema defines #PrincipalRef as #Ref with kind
        // restricted to "user" | "agent" | "bot" | "credential". A value
        // of "team" is allowed by #Ref but rejected by #PrincipalRef.
        //
        // Note: cuengine's evaluate_module accepts incomplete-but-not-
        // conflicting structs silently, so we test the "wrong value"
        // shape of the issue's acceptance ("mistypes a kernel-declared
        // field") rather than "omits a kernel-required field." The
        // proof that the schema is loaded is identical: cuengine could
        // only catch this if the vendored `github.com/comtrya/comtrya/schema`
        // package is in scope.
        let result = validate_with(
            vec![CueFile {
                path: "comtrya.cue".to_string(),
                source: concat!(
                    "package comtrya\n",
                    "import \"github.com/comtrya/comtrya/schema\"\n",
                    "owner: schema.#PrincipalRef & { slug: \"rawkode\", kind: \"team\" }\n",
                )
                .to_string(),
            }],
            &[],
        );
        assert!(!result.accepted, "kernel enum violation must reject");
        assert!(
            result.diagnostics.iter().any(|d| d.severity == "error"),
            "must surface an error diagnostic; got: {:?}",
            result.diagnostics
        );
    }

    #[test]
    fn cuengine_validator_rejects_kernel_type_violation() {
        // Kernel #Project requires `root: string | *""`. An integer
        // value forces a unification failure on the projects map.
        let result = validate_with(
            vec![CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\nprojects: bad: { root: 42 }".to_string(),
            }],
            &[],
        );
        assert!(
            !result.accepted,
            "type violation on kernel field must reject"
        );
        assert!(
            result.diagnostics.iter().any(|d| d.severity == "error"),
            "must surface an error diagnostic; got: {:?}",
            result.diagnostics
        );
    }

    #[test]
    fn cuengine_validator_rejects_extension_type_violation() {
        // Extension schema constrains a new field on #Project to string.
        // User config that types it as an integer must fail.
        // (Same "wrong-type" shape as the kernel test — proves the
        // extension schema is loaded and applied.)
        let extension = CueSchemaFile::new(
            "test-required",
            "package comtrya\n#Project: { reviewer: string }",
        )
        .expect("valid CueSchemaFile id");
        let result = validate_with(
            vec![CueFile {
                path: "comtrya.cue".to_string(),
                source: concat!(
                    "package comtrya\n",
                    "projects: must_review: { root: \"p\", reviewer: 42 }\n",
                )
                .to_string(),
            }],
            &[extension],
        );
        assert!(!result.accepted, "extension type violation must reject");
        assert!(
            result.diagnostics.iter().any(|d| d.severity == "error"),
            "must surface an error diagnostic; got: {:?}",
            result.diagnostics
        );
    }

    #[test]
    fn cuengine_validator_accepts_extension_schema_referencing_kernel_ref() {
        // Regression: ext_docs' schema references `#PrincipalRef`
        // UNQUALIFIED (it is `package comtrya`). The injected bridge must
        // re-expose the full kernel vocabulary as unqualified aliases, not
        // just `#Project`, or extension schemas fail with
        // `reference "#PrincipalRef" not found`.
        let extension = CueSchemaFile::new(
            "docs",
            concat!(
                "package comtrya\n",
                "#DocPropertyType: string | #PrincipalRef\n",
                "#Project: { docs?: [string]: { slug: string, properties?: [string]: #DocPropertyType } }\n",
            ),
        )
        .expect("valid CueSchemaFile id");
        let result = validate_with(
            vec![CueFile {
                path: "comtrya.cue".to_string(),
                source: concat!(
                    "package comtrya\n",
                    "projects: kernel: { root: \".\", docs: adr: { slug: \"docs/adrs\", properties: author: #PrincipalRef & {kind: \"user\", slug: \"rawkode\"} } }\n",
                )
                .to_string(),
            }],
            &[extension],
        );
        assert!(
            result.accepted,
            "extension schema using a kernel #PrincipalRef must evaluate; got: {:?}",
            result.diagnostics
        );
    }

    #[test]
    fn cuengine_validator_rejects_path_collision_with_kernel_schema() {
        // A crafted push containing a file whose path matches the
        // kernel-injected slot would otherwise overwrite the kernel
        // schema and bypass kernel-required-field validation.
        let result = validate_with(
            vec![CueFile {
                path: "00-comtrya-kernel.cue".to_string(),
                source: "package comtrya\n#Project: { name: string | *\"hacked\" }".to_string(),
            }],
            &[],
        );
        assert!(!result.accepted, "must refuse to write over kernel slot");
        assert!(
            result
                .diagnostics
                .iter()
                .any(|d| d.message.contains("collides")),
            "expected collision diagnostic; got: {:?}",
            result.diagnostics
        );
    }

    #[test]
    fn cue_schema_file_rejects_path_traversal_ids() {
        for bad in [
            "../etc/passwd",
            "foo/bar",
            "foo bar",
            "Foo",
            "1leading-digit",
            "",
            "with\0nul",
        ] {
            assert!(
                CueSchemaFile::new(bad, "package comtrya").is_err(),
                "{bad:?} should be rejected by CueSchemaFile::new"
            );
        }
        assert!(CueSchemaFile::new("ok-id", "package comtrya").is_ok());
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
            &[],
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

        // effective_config_json is serde-serialized typed JSON that carries the
        // cuengine-evaluated config under "evaluated", not a hand-built stub.
        let root = result
            .snapshots
            .iter()
            .find(|snapshot| snapshot.path == "/")
            .unwrap();
        let parsed: serde_json::Value =
            serde_json::from_str(&root.effective_config_json).expect("effective config is JSON");
        assert_eq!(parsed["repositoryID"], "repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3");
        assert_eq!(parsed["path"], "/");
        assert!(parsed.get("evaluated").is_some());
    }

    #[test]
    fn effective_config_json_escapes_untrusted_path_segments() {
        // A path containing a double-quote must not break the JSON; serde
        // serialization handles escaping (the old hand-built format! could not).
        let json = effective_config_json(
            "repo_x",
            "deadbeef",
            "a\"b/comtrya.cue",
            &serde_json::json!({ "k": "v\"q" }),
        );
        let parsed: serde_json::Value =
            serde_json::from_str(&json).expect("hand-untrusted input still yields valid JSON");
        assert_eq!(parsed["path"], "a\"b/comtrya.cue");
        assert_eq!(parsed["evaluated"]["k"], "v\"q");
    }
}
