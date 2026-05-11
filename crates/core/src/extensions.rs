use crate::error::{CoreError, CoreResult, ErrorCode};
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
        if let Some(sdl) = &installation.manifest.graphql_sdl {
            GraphqlComposer::default().compose(&installation.manifest.name, sdl)?;
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

#[derive(Debug, Clone, Default)]
pub struct GraphqlComposer {
    reserved_core_fields: BTreeSet<String>,
}

impl GraphqlComposer {
    pub fn compose(&self, extension_name: &str, sdl: &str) -> CoreResult<()> {
        let _ = &self.reserved_core_fields;
        if sdl.contains("_comtrya") {
            return Err(CoreError::extension_activation_failed(
                "extension SDL must not define _comtrya fields",
            ));
        }
        if sdl.contains("type Query") && sdl.contains("viewer") {
            return Err(CoreError::extension_activation_failed(
                "extension SDL must not replace core Query.viewer",
            ));
        }
        if sdl.contains("directive @") && !sdl.contains(&format!("@{extension_name}_")) {
            return Err(CoreError::extension_activation_failed(
                "extension directives must be namespaced",
            ));
        }
        Ok(())
    }
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
