use crate::error::{CoreError, CoreResult};

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

/// Names the host owns at the top of the URL space — `/r/`, `/x/`, etc.
/// An extension's `route_prefix` cannot equal any of these.
///
/// `_extensions` was removed from this list because `validate_route_prefix`
/// already rejects any prefix starting with `_` — the entry was permanently
/// unreachable and only existed as defensive documentation (#122 P3).
pub const RESERVED_ROUTE_PREFIXES: &[&str] = &[
    "r", "x", "api", "auth", "git", "graphql", "events", "readyz", "healthz", "instance",
];

fn validate_route_prefix(prefix: &str) -> CoreResult<()> {
    let mut chars = prefix.chars();
    let first = chars
        .next()
        .ok_or_else(|| CoreError::config_invalid("route_prefix must not be empty"))?;
    if !first.is_ascii_lowercase() {
        return Err(CoreError::config_invalid(format!(
            "route_prefix must start with a-z, got '{first}'"
        )));
    }
    for c in chars {
        if !(c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
            return Err(CoreError::config_invalid(format!(
                "route_prefix must match [a-z][a-z0-9-]*, found '{c}'"
            )));
        }
    }
    if RESERVED_ROUTE_PREFIXES.contains(&prefix) {
        return Err(CoreError::config_invalid(format!(
            "route_prefix '{prefix}' is reserved by the host"
        )));
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
            validate_route_prefix(prefix)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
