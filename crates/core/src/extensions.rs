use crate::error::{CoreError, CoreResult};
use crate::ids::{IdPrefix, OpaqueId};

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
    /// Optional URL route prefix under `/x/<prefix>/` for this extension's UI.
    /// Must match `[a-z][a-z0-9-]*` and must not be a reserved host prefix.
    pub route_prefix: Option<String>,
}

/// Names the host owns at the top of the URL space — `/r/`, `/x/`, `/_extensions/`, etc.
/// An extension's `route_prefix` cannot equal any of these.
///
/// Note: `_extensions` is unreachable via `validate_route_prefix` today because the slug
/// constraint rejects any prefix starting with `_`. The entry remains in this list so the
/// canonical set is documented in one place — if the slug constraint is ever relaxed, the
/// reserved check still applies. Tests pin the character-constraint path; this entry
/// is defensive only.
pub const RESERVED_ROUTE_PREFIXES: &[&str] = &[
    "r",
    "x",
    "_extensions",
    "api",
    "auth",
    "git",
    "graphql",
    "events",
    "readyz",
    "healthz",
    "instance",
];

fn validate_route_prefix(prefix: &str) -> Result<(), String> {
    let mut chars = prefix.chars();
    let first = chars
        .next()
        .ok_or_else(|| "route_prefix must not be empty".to_string())?;
    if !first.is_ascii_lowercase() {
        return Err(format!("route_prefix must start with a-z, got '{first}'"));
    }
    for c in chars {
        if !(c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
            return Err(format!(
                "route_prefix must match [a-z][a-z0-9-]*, found '{c}'"
            ));
        }
    }
    if RESERVED_ROUTE_PREFIXES.contains(&prefix) {
        return Err(format!("route_prefix '{prefix}' is reserved by the host"));
    }
    Ok(())
}

impl ExtensionInstallConfig {
    pub fn validate(&self) -> CoreResult<()> {
        if self.id.trim().is_empty() {
            return Err(CoreError::config_invalid("extension id must be non-empty"));
        }
        match &self.source {
            ExtensionSource::Local { path } if path.trim().is_empty() => {
                return Err(CoreError::config_invalid(
                    "extension local path must be non-empty",
                ));
            }
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
            }
            _ => {}
        }
        if let Some(prefix) = &self.route_prefix {
            validate_route_prefix(prefix).map_err(CoreError::config_invalid)?;
        }
        Ok(())
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


#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventOutcome {
    Handled,
    Ignored,
    Retry(u32),
    DeadLetter,
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
    use crate::ErrorCode;

    /// Test-support fixture: a concrete extension manifest used to exercise the
    /// generic manifest/capability model. Lives in the test module so that
    /// generic core ships no first-party-extension knowledge in its public API.
    fn reference_pull_requests() -> ExtensionManifest {
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
        ExtensionManifest {
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

    #[test]
    fn reference_manifest_validates_and_declares_capabilities() {
        let manifest = reference_pull_requests();
        manifest.validate().unwrap();
        assert!(manifest.capabilities.graphql);
        assert!(manifest.capabilities.grants_all_requested(&manifest.capabilities));
    }

    #[test]
    fn manifest_with_unsupported_schema_version_fails_validation() {
        let mut manifest = reference_pull_requests();
        manifest.schema_version = "comtrya.extension/v0".to_string();
        assert_eq!(
            manifest.validate().unwrap_err().code,
            ErrorCode::ExtensionActivationFailed
        );
    }

    #[test]
    fn installation_namespaces_permission_short_names() {
        let manifest = reference_pull_requests();
        let grants = manifest.capabilities.clone();
        let installation = ExtensionInstallation::new(manifest, grants);
        assert!(
            installation
                .namespaced_permissions()
                .contains(&"pull-requests.read".to_string())
        );
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
    fn wit_sketch_names_required_host_imports() {
        assert!(WIT_SKETCH.contains("host-git"));
        assert!(WIT_SKETCH.contains("host-secrets"));
        assert!(WIT_SKETCH.contains("host-jobs"));
    }

    #[test]
    fn route_prefix_accepts_valid_slug() {
        let cfg = ExtensionInstallConfig {
            id: "ext_x".into(),
            source: ExtensionSource::Local {
                path: "/tmp/x".into(),
            },
            enabled: true,
            route_prefix: Some("pulls".into()),
        };
        assert!(cfg.validate().is_ok());
    }

    #[test]
    fn route_prefix_rejects_reserved_name() {
        let cfg = ExtensionInstallConfig {
            id: "ext_x".into(),
            source: ExtensionSource::Local {
                path: "/tmp/x".into(),
            },
            enabled: true,
            route_prefix: Some("r".into()),
        };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn route_prefix_rejects_invalid_chars() {
        let cfg = ExtensionInstallConfig {
            id: "ext_x".into(),
            source: ExtensionSource::Local {
                path: "/tmp/x".into(),
            },
            enabled: true,
            route_prefix: Some("With/Slash".into()),
        };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn route_prefix_rejects_starting_with_digit() {
        let cfg = ExtensionInstallConfig {
            id: "ext_x".into(),
            source: ExtensionSource::Local {
                path: "/tmp/x".into(),
            },
            enabled: true,
            route_prefix: Some("9abc".into()),
        };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn route_prefix_allows_none() {
        let cfg = ExtensionInstallConfig {
            id: "ext_x".into(),
            source: ExtensionSource::Local {
                path: "/tmp/x".into(),
            },
            enabled: true,
            route_prefix: None,
        };
        assert!(cfg.validate().is_ok());
    }

    #[test]
    fn route_prefix_rejects_empty_string() {
        let cfg = ExtensionInstallConfig {
            id: "ext_x".into(),
            source: ExtensionSource::Local {
                path: "/tmp/x".into(),
            },
            enabled: true,
            route_prefix: Some("".into()),
        };
        let err = cfg.validate().unwrap_err();
        let msg = format!("{err}");
        assert!(msg.contains("must not be empty"), "got: {msg}");
    }
}
