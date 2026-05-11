use crate::error::{CoreError, CoreResult, ErrorCode};
use crate::graphql::CORE_SDL_BASELINE;
use crate::ids::{IdPrefix, OpaqueId};
use std::collections::{BTreeMap, BTreeSet};

/// Where an extension's `.wasm` component is fetched from.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExtensionSource {
    /// A filesystem path on the host, resolved relative to the host's
    /// extensions directory. Useful for development and first-party packages.
    Local { path: String },
    /// An OCI artifact referenced by registry + image + tag-or-digest.
    /// Resolved by `comtrya-extension-oci` with optional offline cache fallback.
    Oci {
        registry: String,
        image: String,
        reference: OciReference,
    },
}

/// Either a mutable tag or an immutable digest. Digests are recommended for
/// production; tags are convenient for development.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OciReference {
    Tag(String),
    Digest(String),
}

impl OciReference {
    pub fn as_ref_str(&self) -> &str {
        match self {
            OciReference::Tag(t) => t.as_str(),
            OciReference::Digest(d) => d.as_str(),
        }
    }
    pub fn is_digest(&self) -> bool {
        matches!(self, OciReference::Digest(_))
    }
}

/// A configured extension instance.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExtensionInstallConfig {
    pub id: String,
    pub source: ExtensionSource,
    pub enabled: bool,
}

impl ExtensionInstallConfig {
    pub fn validate(&self) -> CoreResult<()> {
        if self.id.trim().is_empty() {
            return Err(CoreError::config_invalid("extension id must be non-empty"));
        }
        match &self.source {
            ExtensionSource::Local { path } if path.trim().is_empty() => Err(
                CoreError::config_invalid("extension local path must be non-empty"),
            ),
            ExtensionSource::Oci {
                registry,
                image,
                reference,
            } => {
                if registry.trim().is_empty() || image.trim().is_empty() {
                    return Err(CoreError::config_invalid(
                        "extension OCI registry and image must be non-empty",
                    ));
                }
                if reference.as_ref_str().trim().is_empty() {
                    return Err(CoreError::config_invalid(
                        "extension OCI reference (tag or digest) must be non-empty",
                    ));
                }
                Ok(())
            }
            _ => Ok(()),
        }
    }
}

pub const WIT_SKETCH: &str = r#"
package comtrya:extension;
world extension {
  import host-log;
  import host-events;
  import host-storage;
  import host-git;
  import host-http;
  import host-secrets;
  import host-jobs;
  export extension-api;
}
"#;

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ExtensionCapabilities {
    pub graphql: bool,
    pub cue: bool,
    pub ui: bool,
    pub events: EventCapabilities,
    pub git: GitCapabilities,
    pub storage: StorageCapabilities,
    pub jobs: JobCapabilities,
    pub http: HttpCapabilities,
    pub secrets: SecretCapabilities,
    pub checks: CheckCapabilities,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct EventCapabilities {
    pub read: bool,
    pub write: bool,
    pub subscribe: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct GitCapabilities {
    pub read: bool,
    pub controlled_write: bool,
    pub hooks: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct StorageCapabilities {
    pub documents: bool,
    pub indexes: bool,
    pub blobs: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct JobCapabilities {
    pub schedule: bool,
    pub run: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct HttpCapabilities {
    pub enabled: bool,
    pub allow: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SecretCapabilities {
    pub read: Vec<String>,
    pub write: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CheckCapabilities {
    pub read: bool,
    pub write: bool,
}

impl ExtensionCapabilities {
    pub fn grants_all_requested(&self, requested: &Self) -> bool {
        (!requested.graphql || self.graphql)
            && (!requested.cue || self.cue)
            && (!requested.ui || self.ui)
            && (!requested.events.read || self.events.read)
            && (!requested.events.write || self.events.write)
            && (!requested.events.subscribe || self.events.subscribe)
            && (!requested.git.read || self.git.read)
            && (!requested.git.controlled_write || self.git.controlled_write)
            && (!requested.git.hooks || self.git.hooks)
            && (!requested.storage.documents || self.storage.documents)
            && (!requested.storage.indexes || self.storage.indexes)
            && (!requested.storage.blobs || self.storage.blobs)
            && (!requested.jobs.schedule || self.jobs.schedule)
            && (!requested.jobs.run || self.jobs.run)
            && (!requested.http.enabled || self.http.enabled)
            && requested
                .http
                .allow
                .iter()
                .all(|origin| self.http.allow.contains(origin))
            && requested
                .secrets
                .read
                .iter()
                .all(|secret| self.secrets.read.contains(secret))
            && requested
                .secrets
                .write
                .iter()
                .all(|secret| self.secrets.write.contains(secret))
            && (!requested.checks.read || self.checks.read)
            && (!requested.checks.write || self.checks.write)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PermissionDeclaration {
    pub name: String,
    pub resource_kinds: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExtensionManifest {
    pub schema_version: String,
    pub name: String,
    pub display_name: String,
    pub version: String,
    pub publisher: String,
    pub wasm_component: String,
    pub wit_world: String,
    pub graphql_sdl: Option<String>,
    pub cue_schemas: Vec<String>,
    pub ui_manifest: Option<String>,
    pub permissions: Vec<PermissionDeclaration>,
    pub subscribed_event_types: Vec<String>,
    pub capabilities: ExtensionCapabilities,
}

impl ExtensionManifest {
    pub fn validate(&self) -> CoreResult<()> {
        if self.schema_version != "comtrya.extension/v1" {
            return Err(CoreError::extension_activation_failed(
                "unsupported extension schemaVersion",
            ));
        }
        if self.name.trim().is_empty()
            || self.version.trim().is_empty()
            || self.wasm_component.trim().is_empty()
        {
            return Err(CoreError::extension_activation_failed(
                "extension manifest requires name, version, and wasm component",
            ));
        }
        Ok(())
    }

    pub fn reference_pull_requests() -> Self {
        let capabilities = ExtensionCapabilities {
            graphql: true,
            cue: true,
            ui: true,
            git: GitCapabilities {
                read: true,
                controlled_write: true,
                hooks: false,
            },
            events: EventCapabilities {
                read: true,
                write: true,
                subscribe: true,
            },
            storage: StorageCapabilities {
                documents: true,
                indexes: true,
                blobs: true,
            },
            jobs: JobCapabilities {
                schedule: true,
                run: true,
            },
            ..ExtensionCapabilities::default()
        };
        Self {
            schema_version: "comtrya.extension/v1".to_string(),
            name: "pull-requests".to_string(),
            display_name: "Pull Requests".to_string(),
            version: "0.1.0".to_string(),
            publisher: "comtrya-dev".to_string(),
            wasm_component: "extension.wasm".to_string(),
            wit_world: "comtrya:extension/extension".to_string(),
            graphql_sdl: Some(
                "extend type Repository { pullRequests: [PullRequest!]! }".to_string(),
            ),
            cue_schemas: vec!["schema.cue".to_string()],
            ui_manifest: Some("ui/manifest.json".to_string()),
            permissions: vec![
                PermissionDeclaration {
                    name: "read".to_string(),
                    resource_kinds: vec!["repository".to_string(), "project".to_string()],
                },
                PermissionDeclaration {
                    name: "write".to_string(),
                    resource_kinds: vec!["repository".to_string(), "project".to_string()],
                },
            ],
            subscribed_event_types: vec!["dev.comtrya.repository.ref.updated".to_string()],
            capabilities,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExtensionState {
    Discovered,
    Fetched,
    Verified,
    Validated,
    Migrating,
    Activating,
    Active,
    ActiveDegraded,
    Disabled,
    Failed,
}

impl ExtensionState {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Discovered => "discovered",
            Self::Fetched => "fetched",
            Self::Verified => "verified",
            Self::Validated => "validated",
            Self::Migrating => "migrating",
            Self::Activating => "activating",
            Self::Active => "active",
            Self::ActiveDegraded => "active-degraded",
            Self::Disabled => "disabled",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExtensionInstallation {
    pub id: OpaqueId,
    pub manifest: ExtensionManifest,
    pub grants: ExtensionCapabilities,
    pub state: ExtensionState,
    pub activation_error: Option<String>,
    pub migrations_applied: bool,
}

impl ExtensionInstallation {
    pub fn new(manifest: ExtensionManifest, grants: ExtensionCapabilities) -> Self {
        Self {
            id: OpaqueId::new(IdPrefix::Extension),
            manifest,
            grants,
            state: ExtensionState::Discovered,
            activation_error: None,
            migrations_applied: false,
        }
    }

    pub fn namespaced_permissions(&self) -> Vec<String> {
        self.manifest
            .permissions
            .iter()
            .map(|permission| format!("{}.{}", self.manifest.name, permission.name))
            .collect()
    }
}

#[derive(Debug, Clone, Default)]
pub struct ExtensionHost {
    installations: BTreeMap<String, ExtensionInstallation>,
    permission_registry: BTreeSet<String>,
    active_subscriptions: BTreeMap<String, OpaqueId>,
}

impl ExtensionHost {
    pub fn activate(
        &mut self,
        mut installation: ExtensionInstallation,
    ) -> CoreResult<ExtensionInstallation> {
        installation.state = ExtensionState::Fetched;
        installation.state = ExtensionState::Verified;
        installation.manifest.validate()?;
        if !installation
            .grants
            .grants_all_requested(&installation.manifest.capabilities)
        {
            installation.state = ExtensionState::Disabled;
            installation.activation_error = Some("missing required capability grant".to_string());
            return Err(CoreError::extension_activation_failed(
                "missing required capability grant",
            ));
        }
        if let Some(sdl) = installation.manifest.graphql_sdl.as_deref() {
            let mut fragments = self
                .installations
                .values()
                .filter(|existing| {
                    matches!(
                        existing.state,
                        ExtensionState::Active | ExtensionState::ActiveDegraded
                    )
                })
                .filter(|existing| existing.manifest.name != installation.manifest.name)
                .filter_map(|existing| {
                    existing
                        .manifest
                        .graphql_sdl
                        .as_deref()
                        .map(|sdl| (existing.manifest.name.as_str(), sdl))
                })
                .collect::<Vec<_>>();
            fragments.push((installation.manifest.name.as_str(), sdl));
            GraphqlComposer::default().compose_many(fragments)?;
        }
        installation.state = ExtensionState::Validated;
        installation.state = ExtensionState::Migrating;
        installation.migrations_applied = true;
        installation.state = ExtensionState::Activating;
        for permission in installation.namespaced_permissions() {
            self.permission_registry.insert(permission);
        }
        installation.state = ExtensionState::Active;
        self.installations
            .insert(installation.manifest.name.clone(), installation.clone());
        Ok(installation)
    }

    pub fn activate_with_failure_after_migration(
        &mut self,
        mut installation: ExtensionInstallation,
    ) -> ExtensionInstallation {
        installation.state = ExtensionState::Migrating;
        installation.migrations_applied = true;
        installation.state = ExtensionState::Disabled;
        installation.migrations_applied = false;
        installation.activation_error = Some("activation failed after migration".to_string());
        installation
    }

    pub fn subscribe(&mut self, extension_name: &str) -> OpaqueId {
        let id = OpaqueId::new(IdPrefix::Event);
        self.active_subscriptions
            .insert(extension_name.to_string(), id.clone());
        id
    }

    pub fn reload_schema_without_extension(
        &mut self,
        extension_name: &str,
    ) -> CoreResult<Vec<OpaqueId>> {
        self.installations.remove(extension_name);
        let closed = self
            .active_subscriptions
            .remove(extension_name)
            .into_iter()
            .collect::<Vec<_>>();
        if closed.is_empty() {
            Ok(closed)
        } else {
            Err(CoreError::new(
                ErrorCode::SchemaChanged,
                format!("extension {extension_name} removed from schema"),
            ))
        }
    }

    pub fn registered_permissions(&self) -> &BTreeSet<String> {
        &self.permission_registry
    }
}

#[derive(Debug, Clone)]
pub struct GraphqlComposer {
    core_sdl: String,
    extension_core_type_allowlist: BTreeSet<String>,
    reserved_core_fields: BTreeSet<String>,
    reserved_core_types: BTreeSet<String>,
}

const GRAPHQL_CORE_EXTENSION_ALLOWLIST: [&str; 4] =
    ["Query", "Mutation", "Subscription", "Repository"];
const GRAPHQL_ADDITIONAL_CORE_TYPES: [&str; 1] = ["Repository"];
const GRAPHQL_REPOSITORY_CORE_FIELDS: [&str; 14] = [
    "Repository.id",
    "Repository.slug",
    "Repository.path",
    "Repository.name",
    "Repository.visibility",
    "Repository.defaultBranch",
    "Repository.storageBackend",
    "Repository.projects",
    "Repository.refs",
    "Repository.checks",
    "Repository.effectiveConfig",
    "Repository.objectAt",
    "Repository.tree",
    "Repository.diff",
];
const GRAPHQL_BUILT_IN_DIRECTIVES: [&str; 5] =
    ["deprecated", "specifiedBy", "oneOf", "include", "skip"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ComposedGraphqlArtifact {
    pub sdl: String,
}

impl ComposedGraphqlArtifact {
    pub fn as_str(&self) -> &str {
        &self.sdl
    }
}

impl Default for GraphqlComposer {
    fn default() -> Self {
        let core_sdl = ParsedGraphqlSdl::parse("comtrya-core", CORE_SDL_BASELINE)
            .expect("core GraphQL SDL baseline must parse");
        let mut reserved_core_fields = core_sdl
            .fields
            .iter()
            .map(GraphqlFieldDefinition::path)
            .collect::<BTreeSet<_>>();
        reserved_core_fields.extend(GRAPHQL_REPOSITORY_CORE_FIELDS.into_iter().map(String::from));
        let mut reserved_core_types = core_sdl
            .type_definitions
            .iter()
            .map(|definition| definition.name.clone())
            .collect::<BTreeSet<_>>();
        reserved_core_types.extend(GRAPHQL_ADDITIONAL_CORE_TYPES.into_iter().map(String::from));

        Self {
            core_sdl: CORE_SDL_BASELINE.trim().to_string(),
            extension_core_type_allowlist: GRAPHQL_CORE_EXTENSION_ALLOWLIST
                .into_iter()
                .map(String::from)
                .collect(),
            reserved_core_fields,
            reserved_core_types,
        }
    }
}

impl GraphqlComposer {
    pub fn compose(&self, extension_name: &str, sdl: &str) -> CoreResult<()> {
        self.compose_artifact(extension_name, sdl).map(|_| ())
    }

    pub fn compose_artifact(
        &self,
        extension_name: &str,
        sdl: &str,
    ) -> CoreResult<ComposedGraphqlArtifact> {
        self.compose_artifact_many([(extension_name, sdl)])
    }

    pub fn compose_many<'a, I>(&self, fragments: I) -> CoreResult<()>
    where
        I: IntoIterator<Item = (&'a str, &'a str)>,
    {
        self.compose_artifact_many(fragments).map(|_| ())
    }

    pub fn compose_artifact_many<'a, I>(&self, fragments: I) -> CoreResult<ComposedGraphqlArtifact>
    where
        I: IntoIterator<Item = (&'a str, &'a str)>,
    {
        let mut fragments = fragments
            .into_iter()
            .map(|(extension_name, sdl)| {
                let extension_name = extension_name.trim();
                if extension_name.is_empty() {
                    return Err(CoreError::extension_activation_failed(
                        "extension name must be non-empty for GraphQL SDL composition",
                    ));
                }
                Ok(ParsedGraphqlFragment {
                    extension_name: extension_name.to_string(),
                    sdl,
                    parsed: ParsedGraphqlSdl::parse(extension_name, sdl)?,
                })
            })
            .collect::<CoreResult<Vec<_>>>()?;

        let mut extension_type_owners = BTreeMap::new();
        let mut extension_field_owners = BTreeMap::new();

        for fragment in &fragments {
            self.validate_directives(&fragment.extension_name, &fragment.parsed)?;
            self.validate_reserved_fields(&fragment.parsed)?;
        }

        for fragment in &fragments {
            self.register_type_ownership(
                &fragment.extension_name,
                &fragment.parsed,
                &mut extension_type_owners,
            )?;
        }

        for fragment in &fragments {
            self.validate_type_extensions(&fragment.parsed, &extension_type_owners)?;
            self.register_field_ownership(
                &fragment.extension_name,
                &fragment.parsed,
                &mut extension_field_owners,
            )?;
        }

        let mut artifact = self.core_sdl.clone();
        for fragment in fragments.drain(..) {
            let sdl = fragment.sdl.trim();
            if !sdl.is_empty() {
                artifact.push_str("\n\n# Extension SDL: ");
                artifact.push_str(&fragment.extension_name);
                artifact.push('\n');
                artifact.push_str(sdl);
            }
        }

        Ok(ComposedGraphqlArtifact { sdl: artifact })
    }

    fn validate_directives(
        &self,
        extension_name: &str,
        parsed: &ParsedGraphqlSdl,
    ) -> CoreResult<()> {
        let namespace = graphql_namespace(extension_name);
        for directive in &parsed.directive_definitions {
            if !directive.starts_with(&namespace) {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension directive @{directive} must be namespaced with @{namespace}"
                )));
            }
        }
        for directive in &parsed.directive_usages {
            if GRAPHQL_BUILT_IN_DIRECTIVES.contains(&directive.as_str()) {
                continue;
            }
            if !directive.starts_with(&namespace) {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension directive usage @{directive} must be namespaced with @{namespace}"
                )));
            }
        }
        Ok(())
    }

    fn validate_type_extensions(
        &self,
        parsed: &ParsedGraphqlSdl,
        extension_type_owners: &BTreeMap<String, String>,
    ) -> CoreResult<()> {
        for extension in &parsed.type_extensions {
            if self.reserved_core_types.contains(&extension.name) {
                if self.extension_core_type_allowlist.contains(&extension.name) {
                    continue;
                }

                return Err(CoreError::extension_activation_failed(format!(
                    "extension SDL must not extend core type {}",
                    extension.name
                )));
            }

            if !extension_type_owners.contains_key(&extension.name) {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension SDL must not extend unknown type {}",
                    extension.name
                )));
            }
        }
        Ok(())
    }

    fn register_type_ownership(
        &self,
        extension_name: &str,
        parsed: &ParsedGraphqlSdl,
        extension_type_owners: &mut BTreeMap<String, String>,
    ) -> CoreResult<()> {
        for definition in &parsed.type_definitions {
            if self.reserved_core_types.contains(&definition.name) {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension SDL must not redefine core type {}",
                    definition.name
                )));
            }

            if let Some(owner) =
                extension_type_owners.insert(definition.name.clone(), extension_name.to_string())
            {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension type {} already owned by extension {}",
                    definition.name, owner
                )));
            }
        }
        Ok(())
    }

    fn validate_reserved_fields(&self, parsed: &ParsedGraphqlSdl) -> CoreResult<()> {
        for field in &parsed.fields {
            if field.name.starts_with("_comtrya") {
                return Err(CoreError::extension_activation_failed(
                    "extension SDL must not define _comtrya fields",
                ));
            }

            let path = field.path();
            if self.reserved_core_fields.contains(&path) {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension SDL must not replace core field {path}"
                )));
            }
        }
        Ok(())
    }

    fn register_field_ownership(
        &self,
        extension_name: &str,
        parsed: &ParsedGraphqlSdl,
        extension_field_owners: &mut BTreeMap<String, String>,
    ) -> CoreResult<()> {
        for field in &parsed.fields {
            let path = field.path();
            if let Some(owner) =
                extension_field_owners.insert(path.clone(), extension_name.to_string())
            {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension field {path} already owned by extension {owner}"
                )));
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
struct ParsedGraphqlSdl {
    directive_definitions: Vec<String>,
    directive_usages: Vec<String>,
    type_definitions: Vec<GraphqlTypeDefinition>,
    type_extensions: Vec<GraphqlTypeExtension>,
    fields: Vec<GraphqlFieldDefinition>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ParsedGraphqlFragment<'a> {
    extension_name: String,
    sdl: &'a str,
    parsed: ParsedGraphqlSdl,
}

impl ParsedGraphqlSdl {
    fn parse(extension_name: &str, sdl: &str) -> CoreResult<Self> {
        let tokens = tokenize_graphql_sdl(extension_name, sdl)?;
        validate_balanced_delimiters(extension_name, &tokens)?;
        let mut parsed = Self {
            directive_usages: parse_directive_usages(extension_name, &tokens)?,
            ..Self::default()
        };
        let mut index = 0;

        while index < tokens.len() {
            if matches!(tokens.get(index), Some(GraphqlSdlToken::StringLiteral)) {
                if top_level_definition_start(&tokens, index + 1).is_some() {
                    index += 1;
                    continue;
                }
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported top-level syntax near {}",
                    token_label(tokens.get(index))
                )));
            }

            if schema_definition_start(&tokens, index) {
                return Err(CoreError::extension_activation_failed(
                    "extension SDL must not define schema",
                ));
            }

            if token_name_eq(tokens.get(index), "directive") {
                let (directive, next_index) =
                    parse_directive_definition(extension_name, &tokens, index)?;
                parsed.directive_definitions.push(directive);
                index = next_index;
                continue;
            }

            let Some((kind_index, is_extension)) = type_definition_start(&tokens, index) else {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported top-level syntax near {}",
                    token_label(tokens.get(index))
                )));
            };
            let (definition, extension, fields, next_index) =
                parse_type_definition(extension_name, &tokens, kind_index, is_extension)?;
            if let Some(definition) = definition {
                parsed.type_definitions.push(definition);
            }
            if let Some(extension) = extension {
                parsed.type_extensions.push(extension);
            }
            parsed.fields.extend(fields);
            index = next_index;
        }

        Ok(parsed)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct GraphqlTypeDefinition {
    name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct GraphqlTypeExtension {
    name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct GraphqlFieldDefinition {
    type_name: String,
    name: String,
}

impl GraphqlFieldDefinition {
    fn path(&self) -> String {
        format!("{}.{}", self.type_name, self.name)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum GraphqlSdlToken {
    Name(String),
    StringLiteral,
    NumberLiteral,
    At,
    LeftBrace,
    RightBrace,
    LeftBracket,
    RightBracket,
    LeftParen,
    RightParen,
    Bang,
    Ampersand,
    Colon,
    Equals,
    Pipe,
}

fn parse_directive_usages(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
) -> CoreResult<Vec<String>> {
    let mut usages = Vec::new();

    for (index, token) in tokens.iter().enumerate() {
        if !matches!(token, GraphqlSdlToken::At) {
            continue;
        }
        if index
            .checked_sub(1)
            .is_some_and(|previous| token_name_eq(tokens.get(previous), "directive"))
        {
            continue;
        }

        let Some(GraphqlSdlToken::Name(name)) = tokens.get(index + 1) else {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL directive usage must name a directive"
            )));
        };
        usages.push(name.clone());
    }

    Ok(usages)
}

fn schema_definition_start(tokens: &[GraphqlSdlToken], index: usize) -> bool {
    token_name_eq(tokens.get(index), "schema")
        && matches!(
            tokens.get(index + 1),
            Some(GraphqlSdlToken::At | GraphqlSdlToken::LeftBrace)
        )
}

fn parse_directive_definition(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    index: usize,
) -> CoreResult<(String, usize)> {
    if !matches!(tokens.get(index + 1), Some(GraphqlSdlToken::At)) {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL directive definition must name a directive"
        )));
    }
    let Some(GraphqlSdlToken::Name(name)) = tokens.get(index + 2) else {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL directive definition must name a directive"
        )));
    };

    let mut cursor = index + 3;
    if matches!(tokens.get(cursor), Some(GraphqlSdlToken::LeftParen)) {
        let close_paren = matching_paren(tokens, cursor, tokens.len())
            .map(|close_paren| close_paren + 1)
            .ok_or_else(|| {
                CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unbalanced parentheses"
                ))
            })?;
        validate_argument_definitions(extension_name, tokens, cursor, close_paren - 1)?;
        cursor = close_paren;
    }
    if token_name_eq(tokens.get(cursor), "repeatable") {
        cursor += 1;
    }
    if !token_name_eq(tokens.get(cursor), "on") {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL directive @{name} must declare locations"
        )));
    }
    cursor += 1;

    let next_definition = next_top_level_definition_index(tokens, cursor);
    let mut saw_location = false;
    let mut expect_location = true;
    while cursor < next_definition {
        match tokens.get(cursor) {
            Some(GraphqlSdlToken::Name(location))
                if expect_location && is_directive_location_name(location) =>
            {
                saw_location = true;
                expect_location = false;
                cursor += 1;
            }
            Some(GraphqlSdlToken::Pipe) if saw_location && !expect_location => {
                expect_location = true;
                cursor += 1;
            }
            token => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL directive @{name} contains unsupported syntax near {}",
                    token_label(token)
                )));
            }
        }
    }
    if !saw_location {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL directive @{name} must declare at least one location"
        )));
    }
    if expect_location {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL directive @{name} has a trailing location separator"
        )));
    }

    Ok((name.clone(), next_definition))
}

fn parse_type_definition(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    kind_index: usize,
    is_extension: bool,
) -> CoreResult<(
    Option<GraphqlTypeDefinition>,
    Option<GraphqlTypeExtension>,
    Vec<GraphqlFieldDefinition>,
    usize,
)> {
    let Some(GraphqlSdlToken::Name(kind)) = tokens.get(kind_index) else {
        return Ok((None, None, Vec::new(), kind_index + 1));
    };
    let Some(GraphqlSdlToken::Name(type_name)) = tokens.get(kind_index + 1) else {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL {kind} definition must name a type"
        )));
    };

    let mut fields = Vec::new();
    let next_index = match kind.as_str() {
        "type" | "input" | "interface" | "enum" => {
            let Some(open_brace) = find_definition_body(tokens, kind_index + 2) else {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL {kind} {type_name} must define a body"
                )));
            };
            validate_type_header_tokens(
                extension_name,
                tokens,
                kind,
                type_name,
                kind_index + 2,
                open_brace,
            )?;
            let close_brace = matching_brace(extension_name, tokens, open_brace)?;
            if is_field_container_kind(kind) {
                for field_name in
                    parse_field_names(extension_name, tokens, open_brace + 1, close_brace)?
                {
                    fields.push(GraphqlFieldDefinition {
                        type_name: type_name.clone(),
                        name: field_name,
                    });
                }
            } else {
                validate_enum_values(
                    extension_name,
                    tokens,
                    type_name,
                    open_brace + 1,
                    close_brace,
                )?;
            }
            close_brace + 1
        }
        "scalar" => {
            if find_definition_body(tokens, kind_index + 2).is_some() {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL scalar {type_name} must not define a body"
                )));
            }
            let next_definition = next_top_level_definition_index(tokens, kind_index + 2);
            validate_type_header_tokens(
                extension_name,
                tokens,
                kind,
                type_name,
                kind_index + 2,
                next_definition,
            )?;
            next_definition
        }
        "union" => {
            if find_definition_body(tokens, kind_index + 2).is_some() {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL union {type_name} must not define a body"
                )));
            }
            let next_definition = next_top_level_definition_index(tokens, kind_index + 2);
            validate_union_definition(
                extension_name,
                tokens,
                type_name,
                kind_index + 2,
                next_definition,
            )?;
            next_definition
        }
        _ => kind_index + 2,
    };

    let definition = if is_extension {
        None
    } else {
        Some(GraphqlTypeDefinition {
            name: type_name.clone(),
        })
    };
    let extension = if is_extension {
        Some(GraphqlTypeExtension {
            name: type_name.clone(),
        })
    } else {
        None
    };
    Ok((definition, extension, fields, next_index))
}

fn validate_type_header_tokens(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    kind: &str,
    type_name: &str,
    mut cursor: usize,
    body_index: usize,
) -> CoreResult<()> {
    while cursor < body_index {
        match tokens.get(cursor) {
            Some(GraphqlSdlToken::Name(name)) if name == "implements" => {
                if !matches!(kind, "type" | "interface") {
                    return Err(CoreError::extension_activation_failed(format!(
                        "extension {extension_name} SDL {kind} {type_name} cannot implement interfaces"
                    )));
                }
                cursor = parse_implements_clause(extension_name, tokens, cursor + 1, body_index)?;
            }
            Some(GraphqlSdlToken::At) => {
                cursor = skip_directive_usage_tokens(extension_name, tokens, cursor, body_index)?;
            }
            token => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL {kind} {type_name} contains unsupported header syntax near {}",
                    token_label(token)
                )));
            }
        }
    }
    Ok(())
}

fn parse_implements_clause(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    mut cursor: usize,
    body_index: usize,
) -> CoreResult<usize> {
    if matches!(tokens.get(cursor), Some(GraphqlSdlToken::Ampersand)) {
        cursor += 1;
    }

    let mut saw_interface = false;
    let mut expect_interface = true;
    while cursor < body_index {
        match tokens.get(cursor) {
            Some(GraphqlSdlToken::Name(_)) if expect_interface => {
                saw_interface = true;
                expect_interface = false;
                cursor += 1;
            }
            Some(GraphqlSdlToken::Ampersand) if saw_interface && !expect_interface => {
                expect_interface = true;
                cursor += 1;
            }
            Some(GraphqlSdlToken::At) if saw_interface && !expect_interface => return Ok(cursor),
            token => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL implements clause contains unsupported syntax near {}",
                    token_label(token)
                )));
            }
        }
    }

    if !saw_interface || expect_interface {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL implements clause must name interfaces"
        )));
    }
    Ok(cursor)
}

fn validate_union_definition(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    type_name: &str,
    mut cursor: usize,
    end: usize,
) -> CoreResult<()> {
    while matches!(tokens.get(cursor), Some(GraphqlSdlToken::At)) {
        cursor = skip_directive_usage_tokens(extension_name, tokens, cursor, end)?;
    }
    if !matches!(tokens.get(cursor), Some(GraphqlSdlToken::Equals)) {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL union {type_name} must declare member types"
        )));
    }
    cursor += 1;

    let mut saw_member = false;
    let mut expect_member = true;
    while cursor < end {
        match tokens.get(cursor) {
            Some(GraphqlSdlToken::Pipe) if !saw_member && expect_member => {
                cursor += 1;
            }
            Some(GraphqlSdlToken::Name(_)) if expect_member => {
                saw_member = true;
                expect_member = false;
                cursor += 1;
            }
            Some(GraphqlSdlToken::Pipe) if saw_member && !expect_member => {
                expect_member = true;
                cursor += 1;
            }
            token => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL union {type_name} contains unsupported syntax near {}",
                    token_label(token)
                )));
            }
        }
    }
    if !saw_member || expect_member {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL union {type_name} must declare member types"
        )));
    }
    Ok(())
}

fn validate_enum_values(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    type_name: &str,
    start: usize,
    end: usize,
) -> CoreResult<()> {
    let mut cursor = start;
    while cursor < end {
        if matches!(tokens.get(cursor), Some(GraphqlSdlToken::StringLiteral)) {
            cursor += 1;
            continue;
        }
        let Some(GraphqlSdlToken::Name(_)) = tokens.get(cursor) else {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL enum {type_name} contains unsupported syntax near {}",
                token_label(tokens.get(cursor))
            )));
        };
        cursor += 1;
        while matches!(tokens.get(cursor), Some(GraphqlSdlToken::At)) {
            cursor = skip_directive_usage_tokens(extension_name, tokens, cursor, end)?;
        }
    }
    Ok(())
}

fn type_definition_start(tokens: &[GraphqlSdlToken], index: usize) -> Option<(usize, bool)> {
    if token_name_eq(tokens.get(index), "extend")
        && matches!(
            tokens.get(index + 1),
            Some(GraphqlSdlToken::Name(kind)) if is_type_definition_kind(kind)
        )
    {
        return Some((index + 1, true));
    }

    match tokens.get(index) {
        Some(GraphqlSdlToken::Name(kind)) if is_type_definition_kind(kind) => Some((index, false)),
        _ => None,
    }
}

fn top_level_definition_start(tokens: &[GraphqlSdlToken], index: usize) -> Option<usize> {
    if schema_definition_start(tokens, index) || token_name_eq(tokens.get(index), "directive") {
        Some(index)
    } else {
        type_definition_start(tokens, index).map(|(kind_index, _)| kind_index)
    }
}

fn next_top_level_definition_index(tokens: &[GraphqlSdlToken], start: usize) -> usize {
    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;

    for index in start..tokens.len() {
        match tokens.get(index) {
            Some(GraphqlSdlToken::LeftBrace) => brace_depth += 1,
            Some(GraphqlSdlToken::RightBrace) => brace_depth = brace_depth.saturating_sub(1),
            Some(GraphqlSdlToken::LeftParen) => paren_depth += 1,
            Some(GraphqlSdlToken::RightParen) => paren_depth = paren_depth.saturating_sub(1),
            _ => {}
        }
        if brace_depth == 0
            && paren_depth == 0
            && top_level_definition_start(tokens, index).is_some()
        {
            return index;
        }
    }

    tokens.len()
}

fn find_definition_body(tokens: &[GraphqlSdlToken], start: usize) -> Option<usize> {
    let mut paren_depth = 0usize;
    for (offset, token) in tokens[start..].iter().enumerate() {
        match token {
            GraphqlSdlToken::LeftParen => paren_depth += 1,
            GraphqlSdlToken::RightParen => paren_depth = paren_depth.saturating_sub(1),
            GraphqlSdlToken::LeftBrace if paren_depth == 0 => return Some(start + offset),
            GraphqlSdlToken::Name(name)
                if paren_depth == 0 && is_top_level_definition_keyword(name) =>
            {
                return None;
            }
            _ => {}
        }
    }
    None
}

fn matching_brace(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    open_brace: usize,
) -> CoreResult<usize> {
    let mut depth = 0usize;
    for (index, token) in tokens.iter().enumerate().skip(open_brace) {
        match token {
            GraphqlSdlToken::LeftBrace => depth += 1,
            GraphqlSdlToken::RightBrace => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Ok(index);
                }
            }
            _ => {}
        }
    }

    Err(CoreError::extension_activation_failed(format!(
        "extension {extension_name} SDL contains an unclosed definition body"
    )))
}

fn parse_field_names(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    start: usize,
    end: usize,
) -> CoreResult<Vec<String>> {
    let mut fields = Vec::new();
    let mut index = start;
    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;

    while index < end {
        match tokens.get(index) {
            Some(GraphqlSdlToken::At) if brace_depth == 0 && paren_depth == 0 => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported field directive placement"
                )));
            }
            Some(GraphqlSdlToken::StringLiteral) if brace_depth == 0 && paren_depth == 0 => {
                if matches!(tokens.get(index + 1), Some(GraphqlSdlToken::Name(_))) {
                    index += 1;
                    continue;
                }
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported field syntax near {}",
                    token_label(tokens.get(index))
                )));
            }
            Some(
                GraphqlSdlToken::Bang
                | GraphqlSdlToken::Ampersand
                | GraphqlSdlToken::Colon
                | GraphqlSdlToken::Equals
                | GraphqlSdlToken::LeftBracket
                | GraphqlSdlToken::NumberLiteral
                | GraphqlSdlToken::Pipe
                | GraphqlSdlToken::RightBracket
                | GraphqlSdlToken::LeftParen
                | GraphqlSdlToken::RightParen,
            ) if brace_depth == 0 && paren_depth == 0 => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported field syntax"
                )));
            }
            Some(GraphqlSdlToken::LeftBrace) => brace_depth += 1,
            Some(GraphqlSdlToken::RightBrace) => brace_depth = brace_depth.saturating_sub(1),
            Some(GraphqlSdlToken::LeftParen) => paren_depth += 1,
            Some(GraphqlSdlToken::RightParen) => paren_depth = paren_depth.saturating_sub(1),
            Some(GraphqlSdlToken::Name(name)) if brace_depth == 0 && paren_depth == 0 => {
                if let Some(colon_index) =
                    field_type_colon_index(extension_name, tokens, index, end)?
                {
                    fields.push(name.clone());
                    index = consume_field_type_and_directives(
                        extension_name,
                        tokens,
                        colon_index + 1,
                        end,
                    )?;
                    continue;
                }
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported field syntax near {name}"
                )));
            }
            _ => {}
        }
        index += 1;
    }

    Ok(fields)
}

fn field_type_colon_index(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    index: usize,
    end: usize,
) -> CoreResult<Option<usize>> {
    match tokens.get(index + 1) {
        Some(GraphqlSdlToken::Colon) => Ok(Some(index + 1)),
        Some(GraphqlSdlToken::LeftParen) => {
            let close_paren = matching_paren(tokens, index + 1, end).ok_or_else(|| {
                CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unbalanced parentheses"
                ))
            })?;
            validate_argument_definitions(extension_name, tokens, index + 1, close_paren)?;
            if matches!(tokens.get(close_paren + 1), Some(GraphqlSdlToken::Colon)) {
                Ok(Some(close_paren + 1))
            } else {
                Ok(None)
            }
        }
        _ => Ok(None),
    }
}

fn validate_argument_definitions(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    open_paren: usize,
    close_paren: usize,
) -> CoreResult<()> {
    let mut cursor = open_paren + 1;
    while cursor < close_paren {
        if matches!(tokens.get(cursor), Some(GraphqlSdlToken::StringLiteral)) {
            cursor += 1;
            continue;
        }
        let Some(GraphqlSdlToken::Name(name)) = tokens.get(cursor) else {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL argument definition contains unsupported syntax near {}",
                token_label(tokens.get(cursor))
            )));
        };
        cursor += 1;
        if !matches!(tokens.get(cursor), Some(GraphqlSdlToken::Colon)) {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL argument {name} must declare a type"
            )));
        }
        cursor = parse_graphql_type(extension_name, tokens, cursor + 1, close_paren)?;
        if matches!(tokens.get(cursor), Some(GraphqlSdlToken::Equals)) {
            cursor = consume_const_value(extension_name, tokens, cursor + 1, close_paren)?;
        }
        while matches!(tokens.get(cursor), Some(GraphqlSdlToken::At)) {
            cursor = skip_directive_usage_tokens(extension_name, tokens, cursor, close_paren)?;
        }
    }
    Ok(())
}

fn validate_argument_values(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    open_paren: usize,
    close_paren: usize,
) -> CoreResult<()> {
    let mut cursor = open_paren + 1;
    while cursor < close_paren {
        let Some(GraphqlSdlToken::Name(name)) = tokens.get(cursor) else {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL directive argument contains unsupported syntax near {}",
                token_label(tokens.get(cursor))
            )));
        };
        cursor += 1;
        if !matches!(tokens.get(cursor), Some(GraphqlSdlToken::Colon)) {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL directive argument {name} must provide a value"
            )));
        }
        cursor = consume_const_value(extension_name, tokens, cursor + 1, close_paren)?;
    }
    Ok(())
}

fn consume_const_value(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    index: usize,
    end: usize,
) -> CoreResult<usize> {
    match tokens.get(index) {
        Some(
            GraphqlSdlToken::Name(_)
            | GraphqlSdlToken::NumberLiteral
            | GraphqlSdlToken::StringLiteral,
        ) => Ok(index + 1),
        Some(GraphqlSdlToken::LeftBracket) => {
            let mut cursor = index + 1;
            while cursor < end && !matches!(tokens.get(cursor), Some(GraphqlSdlToken::RightBracket))
            {
                cursor = consume_const_value(extension_name, tokens, cursor, end)?;
            }
            if matches!(tokens.get(cursor), Some(GraphqlSdlToken::RightBracket)) {
                Ok(cursor + 1)
            } else {
                Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains malformed list value"
                )))
            }
        }
        token => Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL constant value contains unsupported syntax near {}",
            token_label(token)
        ))),
    }
}

fn consume_field_type_and_directives(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    mut index: usize,
    end: usize,
) -> CoreResult<usize> {
    index = parse_graphql_type(extension_name, tokens, index, end)?;

    while index < end {
        match tokens.get(index) {
            Some(GraphqlSdlToken::Name(name)) => {
                if field_type_colon_index(extension_name, tokens, index, end)?.is_some() {
                    return Ok(index);
                }
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported field syntax near {name}"
                )));
            }
            Some(GraphqlSdlToken::At) => {
                index = skip_directive_usage_tokens(extension_name, tokens, index, end)?;
            }
            Some(
                GraphqlSdlToken::Bang
                | GraphqlSdlToken::Ampersand
                | GraphqlSdlToken::Colon
                | GraphqlSdlToken::Equals
                | GraphqlSdlToken::LeftBracket
                | GraphqlSdlToken::NumberLiteral
                | GraphqlSdlToken::StringLiteral
                | GraphqlSdlToken::Pipe
                | GraphqlSdlToken::RightBracket
                | GraphqlSdlToken::LeftBrace
                | GraphqlSdlToken::RightBrace
                | GraphqlSdlToken::LeftParen
                | GraphqlSdlToken::RightParen,
            ) => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains malformed field type"
                )));
            }
            None => break,
        }
    }

    Ok(index)
}

fn parse_graphql_type(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    index: usize,
    end: usize,
) -> CoreResult<usize> {
    let mut next = match tokens.get(index) {
        Some(GraphqlSdlToken::Name(_)) => index + 1,
        Some(GraphqlSdlToken::LeftBracket) => {
            let inner_end = parse_graphql_type(extension_name, tokens, index + 1, end)?;
            if !matches!(tokens.get(inner_end), Some(GraphqlSdlToken::RightBracket)) {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains malformed list type"
                )));
            }
            inner_end + 1
        }
        _ => {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL field is missing a type"
            )));
        }
    };

    if next < end && matches!(tokens.get(next), Some(GraphqlSdlToken::Bang)) {
        next += 1;
    }

    Ok(next)
}

fn skip_directive_usage_tokens(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
    index: usize,
    end: usize,
) -> CoreResult<usize> {
    let Some(GraphqlSdlToken::Name(_)) = tokens.get(index + 1) else {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL directive usage must name a directive"
        )));
    };

    let mut next = index + 2;
    if matches!(tokens.get(next), Some(GraphqlSdlToken::LeftParen)) {
        let close_paren = matching_paren(tokens, next, end).ok_or_else(|| {
            CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL contains unbalanced parentheses"
            ))
        })?;
        validate_argument_values(extension_name, tokens, next, close_paren)?;
        next = close_paren + 1;
    }
    Ok(next)
}

fn matching_paren(tokens: &[GraphqlSdlToken], open_paren: usize, end: usize) -> Option<usize> {
    let mut depth = 0usize;
    for (index, token) in tokens.iter().enumerate().take(end).skip(open_paren) {
        match token {
            GraphqlSdlToken::LeftParen => depth += 1,
            GraphqlSdlToken::RightParen => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
    }
    None
}

fn validate_balanced_delimiters(
    extension_name: &str,
    tokens: &[GraphqlSdlToken],
) -> CoreResult<()> {
    let mut stack = Vec::new();

    for token in tokens {
        match token {
            GraphqlSdlToken::LeftBrace => stack.push(GraphqlSdlToken::LeftBrace),
            GraphqlSdlToken::LeftBracket => stack.push(GraphqlSdlToken::LeftBracket),
            GraphqlSdlToken::LeftParen => stack.push(GraphqlSdlToken::LeftParen),
            GraphqlSdlToken::RightBrace => {
                if !matches!(stack.pop(), Some(GraphqlSdlToken::LeftBrace)) {
                    return Err(CoreError::extension_activation_failed(format!(
                        "extension {extension_name} SDL contains unbalanced braces"
                    )));
                }
            }
            GraphqlSdlToken::RightBracket => {
                if !matches!(stack.pop(), Some(GraphqlSdlToken::LeftBracket)) {
                    return Err(CoreError::extension_activation_failed(format!(
                        "extension {extension_name} SDL contains unbalanced brackets"
                    )));
                }
            }
            GraphqlSdlToken::RightParen => {
                if !matches!(stack.pop(), Some(GraphqlSdlToken::LeftParen)) {
                    return Err(CoreError::extension_activation_failed(format!(
                        "extension {extension_name} SDL contains unbalanced parentheses"
                    )));
                }
            }
            _ => {}
        }
    }

    if stack
        .iter()
        .any(|token| matches!(token, GraphqlSdlToken::LeftBrace))
    {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL contains unbalanced braces"
        )));
    }
    if stack
        .iter()
        .any(|token| matches!(token, GraphqlSdlToken::LeftBracket))
    {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL contains unbalanced brackets"
        )));
    }
    if stack
        .iter()
        .any(|token| matches!(token, GraphqlSdlToken::LeftParen))
    {
        return Err(CoreError::extension_activation_failed(format!(
            "extension {extension_name} SDL contains unbalanced parentheses"
        )));
    }

    Ok(())
}

fn tokenize_graphql_sdl(extension_name: &str, sdl: &str) -> CoreResult<Vec<GraphqlSdlToken>> {
    let chars = sdl.chars().collect::<Vec<_>>();
    let mut tokens = Vec::new();
    let mut index = 0;

    while index < chars.len() {
        match chars[index] {
            char if char.is_whitespace() || char == ',' => index += 1,
            '#' => {
                index += 1;
                while index < chars.len() && chars[index] != '\n' {
                    index += 1;
                }
            }
            '"' => {
                tokens.push(GraphqlSdlToken::StringLiteral);
                index = skip_string_literal(extension_name, &chars, index)?;
            }
            char if is_graphql_name_start(char) => {
                let start = index;
                index += 1;
                while index < chars.len() && is_graphql_name_continue(chars[index]) {
                    index += 1;
                }
                tokens.push(GraphqlSdlToken::Name(chars[start..index].iter().collect()));
            }
            '@' => {
                tokens.push(GraphqlSdlToken::At);
                index += 1;
            }
            '{' => {
                tokens.push(GraphqlSdlToken::LeftBrace);
                index += 1;
            }
            '}' => {
                tokens.push(GraphqlSdlToken::RightBrace);
                index += 1;
            }
            '[' => {
                tokens.push(GraphqlSdlToken::LeftBracket);
                index += 1;
            }
            ']' => {
                tokens.push(GraphqlSdlToken::RightBracket);
                index += 1;
            }
            '(' => {
                tokens.push(GraphqlSdlToken::LeftParen);
                index += 1;
            }
            ')' => {
                tokens.push(GraphqlSdlToken::RightParen);
                index += 1;
            }
            ':' => {
                tokens.push(GraphqlSdlToken::Colon);
                index += 1;
            }
            '&' => {
                tokens.push(GraphqlSdlToken::Ampersand);
                index += 1;
            }
            '=' => {
                tokens.push(GraphqlSdlToken::Equals);
                index += 1;
            }
            '|' => {
                tokens.push(GraphqlSdlToken::Pipe);
                index += 1;
            }
            '!' => {
                tokens.push(GraphqlSdlToken::Bang);
                index += 1;
            }
            '.' if chars.get(index + 1) == Some(&'.') && chars.get(index + 2) == Some(&'.') => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported token `...`"
                )));
            }
            '-' if chars
                .get(index + 1)
                .is_some_and(|char| char.is_ascii_digit()) =>
            {
                tokens.push(GraphqlSdlToken::NumberLiteral);
                index = parse_number_literal(extension_name, &chars, index)?;
            }
            char if char.is_ascii_digit() => {
                tokens.push(GraphqlSdlToken::NumberLiteral);
                index = parse_number_literal(extension_name, &chars, index)?;
            }
            char => {
                return Err(CoreError::extension_activation_failed(format!(
                    "extension {extension_name} SDL contains unsupported token `{char}`"
                )));
            }
        }
    }

    Ok(tokens)
}

fn parse_number_literal(extension_name: &str, chars: &[char], start: usize) -> CoreResult<usize> {
    let mut index = start;
    if chars.get(index) == Some(&'-') {
        index += 1;
    }
    while index < chars.len() && chars[index].is_ascii_digit() {
        index += 1;
    }
    if chars.get(index) == Some(&'.') {
        index += 1;
        let fraction_start = index;
        while index < chars.len() && chars[index].is_ascii_digit() {
            index += 1;
        }
        if index == fraction_start {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL contains malformed number literal"
            )));
        }
    }
    if chars
        .get(index)
        .is_some_and(|char| matches!(*char, 'e' | 'E'))
    {
        index += 1;
        if chars
            .get(index)
            .is_some_and(|char| matches!(*char, '+' | '-'))
        {
            index += 1;
        }
        let exponent_start = index;
        while index < chars.len() && chars[index].is_ascii_digit() {
            index += 1;
        }
        if index == exponent_start {
            return Err(CoreError::extension_activation_failed(format!(
                "extension {extension_name} SDL contains malformed number literal"
            )));
        }
    }
    Ok(index)
}

fn skip_string_literal(extension_name: &str, chars: &[char], start: usize) -> CoreResult<usize> {
    if chars.get(start + 1) == Some(&'"') && chars.get(start + 2) == Some(&'"') {
        let mut index = start + 3;
        while index + 2 < chars.len() {
            if chars[index] == '"' && chars[index + 1] == '"' && chars[index + 2] == '"' {
                return Ok(index + 3);
            }
            index += 1;
        }
    } else {
        let mut index = start + 1;
        while index < chars.len() {
            match chars[index] {
                '\\' => index += 2,
                '"' => return Ok(index + 1),
                _ => index += 1,
            }
        }
    }

    Err(CoreError::extension_activation_failed(format!(
        "extension {extension_name} SDL contains an unterminated string literal"
    )))
}

fn graphql_namespace(extension_name: &str) -> String {
    let mut namespace = String::new();
    let mut previous_was_separator = false;

    for char in extension_name.chars() {
        if char.is_ascii_alphanumeric() || char == '_' {
            namespace.push(char);
            previous_was_separator = false;
        } else if !previous_was_separator {
            namespace.push('_');
            previous_was_separator = true;
        }
    }

    while namespace.ends_with('_') {
        namespace.pop();
    }
    if namespace.is_empty() {
        namespace.push_str("extension");
    }
    if namespace
        .chars()
        .next()
        .map(|char| char.is_ascii_digit())
        .unwrap_or(false)
    {
        namespace.insert(0, '_');
    }
    namespace.push('_');
    namespace
}

fn is_type_definition_kind(kind: &str) -> bool {
    matches!(
        kind,
        "type" | "input" | "interface" | "enum" | "union" | "scalar"
    )
}

fn is_field_container_kind(kind: &str) -> bool {
    matches!(kind, "type" | "input" | "interface")
}

fn is_top_level_definition_keyword(name: &str) -> bool {
    matches!(
        name,
        "directive"
            | "extend"
            | "schema"
            | "type"
            | "input"
            | "interface"
            | "enum"
            | "union"
            | "scalar"
    )
}

fn token_name_eq(token: Option<&GraphqlSdlToken>, expected: &str) -> bool {
    matches!(token, Some(GraphqlSdlToken::Name(name)) if name == expected)
}

fn token_label(token: Option<&GraphqlSdlToken>) -> String {
    match token {
        Some(GraphqlSdlToken::Name(name)) => format!("`{name}`"),
        Some(GraphqlSdlToken::StringLiteral) => "string literal".to_string(),
        Some(GraphqlSdlToken::NumberLiteral) => "number literal".to_string(),
        Some(GraphqlSdlToken::At) => "`@`".to_string(),
        Some(GraphqlSdlToken::LeftBrace) => "`{`".to_string(),
        Some(GraphqlSdlToken::RightBrace) => "`}`".to_string(),
        Some(GraphqlSdlToken::LeftBracket) => "`[`".to_string(),
        Some(GraphqlSdlToken::RightBracket) => "`]`".to_string(),
        Some(GraphqlSdlToken::LeftParen) => "`(`".to_string(),
        Some(GraphqlSdlToken::RightParen) => "`)`".to_string(),
        Some(GraphqlSdlToken::Bang) => "`!`".to_string(),
        Some(GraphqlSdlToken::Ampersand) => "`&`".to_string(),
        Some(GraphqlSdlToken::Colon) => "`:`".to_string(),
        Some(GraphqlSdlToken::Equals) => "`=`".to_string(),
        Some(GraphqlSdlToken::Pipe) => "`|`".to_string(),
        None => "end of input".to_string(),
    }
}

fn is_directive_location_name(name: &str) -> bool {
    name.chars()
        .all(|char| char == '_' || char.is_ascii_uppercase() || char.is_ascii_digit())
}

fn is_graphql_name_start(char: char) -> bool {
    char == '_' || char.is_ascii_alphabetic()
}

fn is_graphql_name_continue(char: char) -> bool {
    is_graphql_name_start(char) || char.is_ascii_digit()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventOutcome {
    Handled,
    Ignored,
    Retry(u32),
    DeadLetter,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JobOutcome {
    Succeeded,
    Failed,
    Retry(u32),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResolverInvocation {
    Single(usize),
    Batch(usize),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ExtensionRuntime {
    pub supports_resolve_batch: bool,
}

impl ExtensionRuntime {
    pub fn resolve_list_field(&self, parent_count: usize) -> ResolverInvocation {
        if self.supports_resolve_batch {
            ResolverInvocation::Batch(parent_count)
        } else {
            ResolverInvocation::Single(parent_count)
        }
    }

    pub fn next_event_retry_ms(outcome: EventOutcome, backoff_cap_ms: u32) -> Option<u32> {
        match outcome {
            EventOutcome::Retry(ms) => Some(ms.min(backoff_cap_ms)),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn manifest_capability_shape_matches_grants() {
        let manifest = ExtensionManifest::reference_pull_requests();
        let grants = manifest.capabilities.clone();
        let mut host = ExtensionHost::default();

        let activated = host
            .activate(ExtensionInstallation::new(manifest, grants))
            .unwrap();

        assert_eq!(activated.state, ExtensionState::Active);
    }

    #[test]
    fn missing_required_capability_grant_disables_extension() {
        let manifest = ExtensionManifest::reference_pull_requests();
        let mut grants = manifest.capabilities.clone();
        grants.graphql = false;
        let mut host = ExtensionHost::default();

        let err = host
            .activate(ExtensionInstallation::new(manifest, grants))
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
    }

    #[test]
    fn duplicate_permission_short_names_are_registered_under_extension_namespace() {
        let mut host = ExtensionHost::default();
        let mut manifest_a = ExtensionManifest::reference_pull_requests();
        manifest_a.name = "pull-requests".to_string();
        let mut manifest_b = ExtensionManifest::reference_pull_requests();
        manifest_b.name = "reviews".to_string();
        manifest_b.graphql_sdl = Some(
            r#"
            extend type Query {
              reviews: [Review!]!
            }
            type Review {
              id: ID!
            }
            "#
            .to_string(),
        );

        host.activate(ExtensionInstallation::new(
            manifest_a.clone(),
            manifest_a.capabilities.clone(),
        ))
        .unwrap();
        host.activate(ExtensionInstallation::new(
            manifest_b.clone(),
            manifest_b.capabilities.clone(),
        ))
        .unwrap();

        assert!(host.registered_permissions().contains("pull-requests.read"));
        assert!(host.registered_permissions().contains("reviews.read"));
    }

    #[test]
    fn graphql_sdl_conflict_fails_closed() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("bad", "type Query { viewer: String }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("core field Query.viewer"));
    }

    #[test]
    fn graphql_composer_preserves_namespaced_extension_fragments() {
        let composer = GraphqlComposer::default();
        let artifact = composer
            .compose_artifact_many([
                (
                    "pull-requests",
                    r#"
                    directive @pull_requests_resolver on FIELD_DEFINITION
                    extend type Query {
                      pullRequests(first: Int = 25): [PullRequest!]! @pull_requests_resolver
                    }
                    type PullRequest {
                      id: ID!
                      title: String!
                    }
                    "#,
                ),
                (
                    "checks",
                    r#"
                    directive @checks_resolver on FIELD_DEFINITION
                    extend type Query {
                      checkSummaries: [CheckSummary!]! @checks_resolver
                    }
                    type CheckSummary {
                      id: ID!
                      conclusion: String!
                    }
                    "#,
                ),
            ])
            .unwrap();

        assert!(artifact.as_str().contains("type Query"));
        assert!(artifact.as_str().contains("# Extension SDL: pull-requests"));
        assert!(artifact.as_str().contains("@pull_requests_resolver"));
        assert!(artifact.as_str().contains("pullRequests(first: Int = 25)"));
        assert!(artifact.as_str().contains("# Extension SDL: checks"));
        assert!(artifact.as_str().contains("@checks_resolver"));
        assert!(artifact.as_str().contains("checkSummaries"));
    }

    #[test]
    fn graphql_composer_allows_repository_pull_request_extension() {
        let composer = GraphqlComposer::default();
        composer
            .compose(
                "pull-requests",
                "extend type Repository { pullRequests: [PullRequest!]! }",
            )
            .unwrap();
    }

    #[test]
    fn graphql_composer_rejects_repository_core_field_replacement() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("bad", "extend type Repository { refs: [String!]! }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("Repository.refs"));
    }

    #[test]
    fn graphql_composer_rejects_unnamespaced_directive_definitions() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose(
                "checks",
                "directive @resolver on FIELD_DEFINITION\nextend type Query { checkSummaries: [String!]! }",
            )
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("@resolver"));
        assert!(err.message.contains("@checks_"));
    }

    #[test]
    fn graphql_composer_rejects_malformed_directive_definitions() {
        let composer = GraphqlComposer::default();
        let missing_locations = composer
            .compose("checks", "directive @checks_resolver")
            .unwrap_err();
        let malformed_arguments = composer
            .compose(
                "checks",
                "directive @checks_resolver(arg: ) on FIELD_DEFINITION",
            )
            .unwrap_err();
        let trailing_junk = composer
            .compose(
                "checks",
                "directive @checks_resolver on FIELD_DEFINITION junk",
            )
            .unwrap_err();

        assert_eq!(missing_locations.code, ErrorCode::ExtensionActivationFailed);
        assert!(missing_locations.message.contains("must declare locations"));
        assert_eq!(
            malformed_arguments.code,
            ErrorCode::ExtensionActivationFailed
        );
        assert!(
            malformed_arguments
                .message
                .contains("field is missing a type")
        );
        assert_eq!(trailing_junk.code, ErrorCode::ExtensionActivationFailed);
        assert!(trailing_junk.message.contains("unsupported syntax"));
        assert!(trailing_junk.message.contains("junk"));
    }

    #[test]
    fn graphql_composer_rejects_malformed_directive_location_separator() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("checks", "directive @checks_resolver on FIELD_DEFINITION |")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("trailing location separator"));
    }

    #[test]
    fn graphql_composer_rejects_unnamespaced_directive_usages() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose(
                "checks",
                "extend type Query { checkSummaries: [String!]! @resolver }",
            )
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("@resolver"));
        assert!(err.message.contains("@checks_"));
    }

    #[test]
    fn graphql_composer_allows_builtin_directive_usages() {
        let composer = GraphqlComposer::default();
        composer
            .compose(
                "checks",
                r#"extend type Query {
                  oldChecks: [String!]! @deprecated(reason: "use checkSummaries")
                }"#,
            )
            .unwrap();
    }

    #[test]
    fn graphql_composer_rejects_duplicate_extension_field_ownership() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose_many([
                (
                    "pull-requests",
                    "extend type Query { activity: [String!]! }",
                ),
                ("checks", "extend type Query { activity: [String!]! }"),
            ])
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("Query.activity"));
        assert!(err.message.contains("pull-requests"));
    }

    #[test]
    fn graphql_composer_rejects_duplicate_extension_types() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose_many([
                ("pull-requests", "type ExtensionItem { id: ID! }"),
                ("checks", "type ExtensionItem { name: String! }"),
            ])
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("ExtensionItem"));
        assert!(err.message.contains("pull-requests"));
    }

    #[test]
    fn graphql_composer_rejects_reserved_comtrya_fields() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("audit", "extend type Query { _comtryaAudit: String }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("_comtrya"));
    }

    #[test]
    fn graphql_composer_rejects_forbidden_core_type_extensions() {
        let composer = GraphqlComposer::default();
        for sdl in [
            "extend type Viewer { profileLink: String }",
            "extend type InstanceCapabilities { extensionSearch: Boolean! }",
        ] {
            let err = composer.compose("bad", sdl).unwrap_err();

            assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
            assert!(err.message.contains("must not extend core type"));
        }
    }

    #[test]
    fn graphql_composer_rejects_schema_definitions() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("bad", "schema { query: Query }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("must not define schema"));
    }

    #[test]
    fn graphql_composer_rejects_missing_type_definition_bodies() {
        let composer = GraphqlComposer::default();
        for sdl in ["extend type Query", "extend type Repository"] {
            let err = composer.compose("bad", sdl).unwrap_err();

            assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
            assert!(err.message.contains("must define a body"));
        }
    }

    #[test]
    fn graphql_composer_rejects_malformed_sdl() {
        let composer = GraphqlComposer::default();
        let unsupported_token = composer
            .compose("bad", "extend type Query { broken-field: String }")
            .unwrap_err();
        let missing_colon = composer
            .compose("bad", "extend type Query { broken String }")
            .unwrap_err();
        let unbalanced = composer
            .compose("bad", "extend type Query { broken: String")
            .unwrap_err();

        assert_eq!(unsupported_token.code, ErrorCode::ExtensionActivationFailed);
        assert!(unsupported_token.message.contains("unsupported token"));
        assert_eq!(missing_colon.code, ErrorCode::ExtensionActivationFailed);
        assert!(missing_colon.message.contains("unsupported field syntax"));
        assert_eq!(unbalanced.code, ErrorCode::ExtensionActivationFailed);
        assert!(unbalanced.message.contains("unbalanced braces"));
    }

    #[test]
    fn graphql_composer_rejects_ellipsis_tokens() {
        let composer = GraphqlComposer::default();
        for sdl in [
            "... extend type Query { ok: String }",
            "extend type Query { ok: String ... }",
        ] {
            let err = composer.compose("bad", sdl).unwrap_err();

            assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
            assert!(err.message.contains("unsupported token `...`"));
        }
    }

    #[test]
    fn graphql_composer_rejects_malformed_field_type_shapes() {
        let composer = GraphqlComposer::default();
        let missing_bracket = composer
            .compose("bad", "extend type Query { ok: [String }")
            .unwrap_err();
        let double_non_null = composer
            .compose("bad", "extend type Query { ok: String!! }")
            .unwrap_err();

        assert_eq!(missing_bracket.code, ErrorCode::ExtensionActivationFailed);
        assert!(
            missing_bracket.message.contains("unbalanced")
                || missing_bracket.message.contains("malformed")
        );
        assert_eq!(double_non_null.code, ErrorCode::ExtensionActivationFailed);
        assert!(double_non_null.message.contains("malformed field type"));
    }

    #[test]
    fn graphql_composer_rejects_malformed_field_argument_lists() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose(
                "bad",
                "extend type Query { checks(first: Int = ): [String!]! }",
            )
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(
            err.message
                .contains("constant value contains unsupported syntax")
        );
    }

    #[test]
    fn graphql_composer_rejects_malformed_directive_usage_argument_lists() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose(
                "checks",
                "extend type Query { checks: [String!]! @checks_resolver(arg: ) }",
            )
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(
            err.message
                .contains("constant value contains unsupported syntax")
        );
    }

    #[test]
    fn graphql_composer_rejects_partial_valid_malformed_field_blocks() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("bad", "extend type Query { ok: String broken String }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("unsupported field syntax"));
        assert!(err.message.contains("broken"));
    }

    #[test]
    fn graphql_composer_rejects_top_level_junk() {
        let composer = GraphqlComposer::default();
        let leading = composer
            .compose("bad", "junk extend type Query { ok: String }")
            .unwrap_err();
        let trailing = composer
            .compose("bad", "extend type Query { ok: String } junk")
            .unwrap_err();

        assert_eq!(leading.code, ErrorCode::ExtensionActivationFailed);
        assert!(leading.message.contains("unsupported top-level syntax"));
        assert!(leading.message.contains("junk"));
        assert_eq!(trailing.code, ErrorCode::ExtensionActivationFailed);
        assert!(trailing.message.contains("unsupported top-level syntax"));
        assert!(trailing.message.contains("junk"));
    }

    #[test]
    fn graphql_composer_rejects_field_default_value_without_value() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("bad", "extend type Query { ok: String = }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("malformed field type"));
    }

    #[test]
    fn graphql_composer_rejects_type_header_junk() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("bad", "type ExtensionItem junk { id: ID! }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("unsupported header syntax"));
        assert!(err.message.contains("junk"));
    }

    #[test]
    fn graphql_composer_rejects_numeric_junk_as_description() {
        let composer = GraphqlComposer::default();
        let leading = composer
            .compose("bad", "123 extend type Query { ok: String }")
            .unwrap_err();
        let field = composer
            .compose("bad", "extend type Query { 123 ok: String }")
            .unwrap_err();

        assert_eq!(leading.code, ErrorCode::ExtensionActivationFailed);
        assert!(leading.message.contains("unsupported top-level syntax"));
        assert_eq!(field.code, ErrorCode::ExtensionActivationFailed);
        assert!(field.message.contains("unsupported field syntax"));
    }

    #[test]
    fn graphql_composer_rejects_nested_field_blocks() {
        let composer = GraphqlComposer::default();
        let err = composer
            .compose("bad", "extend type Query { ok: String { broken } }")
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("malformed field type"));
    }

    #[test]
    fn graphql_composer_rejects_malformed_enum_bodies() {
        let composer = GraphqlComposer::default();
        let err = composer.compose("bad", "enum Bad { OK = }").unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("enum Bad contains unsupported syntax"));
    }

    #[test]
    fn graphql_composer_validates_union_and_scalar_syntax() {
        let composer = GraphqlComposer::default();
        composer
            .compose(
                "search",
                "type SearchIssue { id: ID! }\n\
                 type SearchPullRequest { id: ID! }\n\
                 union SearchResult = SearchIssue | SearchPullRequest\n\
                 scalar SearchCursor",
            )
            .unwrap();

        let missing_union_members = composer.compose("bad", "union Bad =").unwrap_err();
        let scalar_body = composer
            .compose("bad", "scalar Bad { value: String }")
            .unwrap_err();

        assert_eq!(
            missing_union_members.code,
            ErrorCode::ExtensionActivationFailed
        );
        assert!(
            missing_union_members
                .message
                .contains("must declare member types")
        );
        assert_eq!(scalar_body.code, ErrorCode::ExtensionActivationFailed);
        assert!(scalar_body.message.contains("must not define a body"));
    }

    #[test]
    fn activation_rejects_graphql_conflicts_with_active_extensions() {
        let mut host = ExtensionHost::default();
        let mut manifest_a = ExtensionManifest::reference_pull_requests();
        manifest_a.name = "activity".to_string();
        manifest_a.graphql_sdl = Some("extend type Query { activity: [String!]! }".to_string());
        let mut manifest_b = ExtensionManifest::reference_pull_requests();
        manifest_b.name = "checks".to_string();
        manifest_b.graphql_sdl = Some("extend type Query { activity: [String!]! }".to_string());

        host.activate(ExtensionInstallation::new(
            manifest_a.clone(),
            manifest_a.capabilities.clone(),
        ))
        .unwrap();
        let err = host
            .activate(ExtensionInstallation::new(
                manifest_b.clone(),
                manifest_b.capabilities.clone(),
            ))
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("Query.activity"));
        assert!(err.message.contains("activity"));
    }

    #[test]
    fn activation_rejects_graphql_conflicts_with_active_degraded_extensions() {
        let mut host = ExtensionHost::default();
        let mut manifest_a = ExtensionManifest::reference_pull_requests();
        manifest_a.name = "activity".to_string();
        manifest_a.graphql_sdl = Some("extend type Query { activity: [String!]! }".to_string());
        let mut manifest_b = ExtensionManifest::reference_pull_requests();
        manifest_b.name = "checks".to_string();
        manifest_b.graphql_sdl = Some("extend type Query { activity: [String!]! }".to_string());

        host.activate(ExtensionInstallation::new(
            manifest_a.clone(),
            manifest_a.capabilities.clone(),
        ))
        .unwrap();
        host.installations.get_mut(&manifest_a.name).unwrap().state =
            ExtensionState::ActiveDegraded;

        let err = host
            .activate(ExtensionInstallation::new(
                manifest_b.clone(),
                manifest_b.capabilities.clone(),
            ))
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::ExtensionActivationFailed);
        assert!(err.message.contains("Query.activity"));
        assert!(err.message.contains("activity"));
    }

    #[test]
    fn handle_event_retry_uses_requested_delay_with_backoff_cap() {
        assert_eq!(
            ExtensionRuntime::next_event_retry_ms(EventOutcome::Retry(10_000), 5_000),
            Some(5_000)
        );
    }

    #[test]
    fn resolve_batch_invoked_for_list_typed_field_when_available() {
        let runtime = ExtensionRuntime {
            supports_resolve_batch: true,
        };

        assert_eq!(
            runtime.resolve_list_field(10),
            ResolverInvocation::Batch(10)
        );
    }

    #[test]
    fn schema_reload_closes_active_extension_subscription() {
        let mut host = ExtensionHost::default();
        let manifest = ExtensionManifest::reference_pull_requests();
        host.activate(ExtensionInstallation::new(
            manifest.clone(),
            manifest.capabilities.clone(),
        ))
        .unwrap();
        host.subscribe(&manifest.name);

        let err = host
            .reload_schema_without_extension(&manifest.name)
            .unwrap_err();

        assert_eq!(err.code, ErrorCode::SchemaChanged);
    }

    #[test]
    fn activation_failure_after_migration_rolls_storage_back() {
        let mut host = ExtensionHost::default();
        let manifest = ExtensionManifest::reference_pull_requests();

        let failed = host.activate_with_failure_after_migration(ExtensionInstallation::new(
            manifest.clone(),
            manifest.capabilities.clone(),
        ));

        assert_eq!(failed.state, ExtensionState::Disabled);
        assert!(!failed.migrations_applied);
    }

    #[test]
    fn wit_sketch_names_required_host_imports() {
        assert!(WIT_SKETCH.contains("host-git"));
        assert!(WIT_SKETCH.contains("host-secrets"));
        assert!(WIT_SKETCH.contains("host-jobs"));
    }
}
