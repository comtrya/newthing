use crate::error::{CoreError, CoreResult};
use crate::ids::{IdPrefix, OpaqueId, Slug};
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Visibility {
    Public,
    Internal,
    Private,
}

impl Visibility {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Public => "PUBLIC",
            Self::Internal => "INTERNAL",
            Self::Private => "PRIVATE",
        }
    }

    pub const fn rank(self) -> u8 {
        match self {
            Self::Public => 0,
            Self::Internal => 1,
            Self::Private => 2,
        }
    }

    pub fn validate_child_visibility(
        parent: Self,
        child: Self,
        allow_public_descendants: bool,
    ) -> CoreResult<()> {
        if child.rank() >= parent.rank() || allow_public_descendants {
            Ok(())
        } else {
            Err(CoreError::config_invalid(format!(
                "child visibility {} is broader than parent visibility {}",
                child, parent
            )))
        }
    }
}

impl Display for Visibility {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Closed set of *core* resource kinds, plus an `Owned` open variant for
/// extension-owned kinds (e.g. `issue`, `epic`). The kernel never bakes in
/// extension-owned kinds; URIs like `comtrya://issue/iss_X` parse into
/// `Owned("issue")` regardless of whether `ext_issues` is installed. A
/// later refactor should also move `Check` out of the closed enum once
/// `ext_checks` is treated as a true extension-owned kind.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ResourceKind {
    User,
    Team,
    Workspace,
    Group,
    Repository,
    Project,
    Extension,
    Check,
    Job,
    Event,
    Secret,
    Relation,
    Comment,
    /// Extension-owned kind, named by the kind segment of the URI (e.g.
    /// `Owned("issue")` for `comtrya://issue/iss_X`).
    Owned(String),
}

impl ResourceKind {
    pub fn as_str(&self) -> &str {
        match self {
            Self::User => "user",
            Self::Team => "team",
            Self::Workspace => "workspace",
            Self::Group => "group",
            Self::Repository => "repository",
            Self::Project => "project",
            Self::Extension => "extension",
            Self::Check => "check",
            Self::Job => "job",
            Self::Event => "event",
            Self::Secret => "secret",
            Self::Relation => "relation",
            Self::Comment => "comment",
            Self::Owned(value) => value.as_str(),
        }
    }

    /// Reverse of `as_str` but lossy for `Owned`: returns `None` if the
    /// supplied id prefix is an `Owned` extension prefix (because the
    /// kernel doesn't know the human-facing kind name for the prefix
    /// without an extension-supplied mapping).
    pub fn from_id_prefix(prefix: &IdPrefix) -> Option<Self> {
        Some(match prefix {
            IdPrefix::User => Self::User,
            IdPrefix::Team => Self::Team,
            IdPrefix::Workspace => Self::Workspace,
            IdPrefix::Group => Self::Group,
            IdPrefix::Repository => Self::Repository,
            IdPrefix::Project => Self::Project,
            IdPrefix::Extension => Self::Extension,
            IdPrefix::Check => Self::Check,
            IdPrefix::Job => Self::Job,
            IdPrefix::Event => Self::Event,
            IdPrefix::Secret => Self::Secret,
            IdPrefix::Relation => Self::Relation,
            IdPrefix::Comment => Self::Comment,
            IdPrefix::Owned(_) => return None,
        })
    }

    pub fn parse(value: &str) -> Option<Self> {
        Some(match value {
            "user" => Self::User,
            "team" => Self::Team,
            "workspace" => Self::Workspace,
            "group" => Self::Group,
            "repository" => Self::Repository,
            "project" => Self::Project,
            "extension" => Self::Extension,
            "check" => Self::Check,
            "job" => Self::Job,
            "event" => Self::Event,
            "secret" => Self::Secret,
            "relation" => Self::Relation,
            "comment" => Self::Comment,
            // Anything else is treated as an extension-owned kind. The
            // kernel validates URI shape but doesn't gate on kind names —
            // unknown kinds parse successfully and become `Owned`. Use of
            // such a ref is gated by whether an extension is installed
            // that knows the kind.
            other => {
                if other.is_empty() || !other.bytes().all(is_kind_byte) {
                    return None;
                }
                Self::Owned(other.to_string())
            }
        })
    }

    pub fn is_singleton(&self) -> bool {
        matches!(self, Self::Workspace)
    }

    pub fn is_owned(&self) -> bool {
        matches!(self, Self::Owned(_))
    }
}

fn is_kind_byte(byte: u8) -> bool {
    byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-' || byte == b'_'
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ResourceRef {
    pub kind: ResourceKind,
    pub id: Option<OpaqueId>,
}

impl ResourceRef {
    pub fn new(kind: ResourceKind, id: OpaqueId) -> CoreResult<Self> {
        // Owned kinds and owned id-prefixes bypass cross-validation: the
        // kernel doesn't know the extension's intended prefix↔kind
        // mapping. Core kinds still enforce that the id prefix matches.
        let id_prefix = id.prefix();
        if !kind.is_owned() && !matches!(id_prefix, IdPrefix::Owned(_)) {
            let id_kind = ResourceKind::from_id_prefix(&id_prefix)
                .expect("non-owned id prefix maps to a core kind");
            if id_kind != kind {
                return Err(CoreError::bad_user_input(format!(
                    "resource kind {} does not match ID prefix kind {}",
                    kind.as_str(),
                    id_kind.as_str()
                )));
            }
        }
        Ok(Self { kind, id: Some(id) })
    }

    pub fn singleton(kind: ResourceKind) -> CoreResult<Self> {
        if !kind.is_singleton() {
            return Err(CoreError::bad_user_input(format!(
                "resource kind {} requires an ID",
                kind.as_str()
            )));
        }
        Ok(Self { kind, id: None })
    }

    pub fn parse(value: &str) -> CoreResult<Self> {
        let rest = value
            .strip_prefix("comtrya://")
            .ok_or_else(|| CoreError::bad_user_input("resource reference must use comtrya://"))?;
        match rest.split_once('/') {
            Some((kind, id)) => {
                let kind = ResourceKind::parse(kind).ok_or_else(|| {
                    CoreError::bad_user_input("resource reference has unknown kind")
                })?;
                Self::new(kind, OpaqueId::parse(id)?)
            }
            None => {
                let kind = ResourceKind::parse(rest).ok_or_else(|| {
                    CoreError::bad_user_input("resource reference has unknown kind")
                })?;
                Self::singleton(kind)
            }
        }
    }

    pub fn canonical(&self) -> String {
        match &self.id {
            Some(id) => format!("comtrya://{}/{}", self.kind.as_str(), id),
            None => format!("comtrya://{}", self.kind.as_str()),
        }
    }
}

impl Display for ResourceRef {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.canonical())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Principal {
    Anonymous,
    User(OpaqueId),
    Team(OpaqueId),
    Workload { issuer: String, subject: String },
    Extension(OpaqueId),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: OpaqueId,
    pub issuer: String,
    pub subject: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Team {
    pub id: OpaqueId,
    pub slug: Slug,
    pub name: String,
    pub members: Vec<Principal>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Workspace {
    pub id: OpaqueId,
    pub slug: Slug,
    pub name: String,
    pub visibility: Visibility,
    pub allow_public_descendants: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Group {
    pub id: OpaqueId,
    pub workspace_id: OpaqueId,
    pub parent_group_id: Option<OpaqueId>,
    pub slug: Slug,
    pub path: String,
    pub name: String,
    pub visibility: Visibility,
    pub allow_public_descendants: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Repository {
    pub id: OpaqueId,
    pub group_id: OpaqueId,
    pub slug: Slug,
    pub path: String,
    pub name: String,
    pub visibility: Visibility,
    pub default_branch: Option<String>,
    pub storage_backend: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Project {
    pub id: OpaqueId,
    pub repository_id: OpaqueId,
    pub slug: Slug,
    pub path: String,
    pub root_path: String,
    pub visibility: Visibility,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VersionedRecord {
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resource_refs_use_canonical_opaque_form() {
        let reference =
            ResourceRef::parse("comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();

        assert_eq!(reference.kind, ResourceKind::Repository);
        assert_eq!(
            reference.canonical(),
            "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3"
        );
    }

    #[test]
    fn resource_ref_rejects_kind_id_mismatch() {
        let err =
            ResourceRef::parse("comtrya://repository/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap_err();
        assert_eq!(err.code, crate::ErrorCode::BadUserInput);
    }

    #[test]
    fn resource_ref_accepts_singleton_workspace_form() {
        let reference = ResourceRef::parse("comtrya://workspace").unwrap();
        assert_eq!(reference.kind, ResourceKind::Workspace);
        assert!(reference.id.is_none());
        assert_eq!(reference.canonical(), "comtrya://workspace");
    }

    #[test]
    fn resource_ref_rejects_singleton_form_for_non_singleton_kind() {
        let err = ResourceRef::parse("comtrya://repository").unwrap_err();
        assert_eq!(err.code, crate::ErrorCode::BadUserInput);
    }

    #[test]
    fn resource_ref_parses_owned_kind_with_owned_prefix() {
        let reference =
            ResourceRef::parse("comtrya://issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        assert_eq!(reference.kind, ResourceKind::Owned("issue".to_string()));
        assert!(reference.kind.is_owned());
        assert_eq!(
            reference.canonical(),
            "comtrya://issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1A3"
        );
    }

    #[test]
    fn resource_ref_accepts_owned_kind_regardless_of_prefix() {
        // Owned kinds don't enforce prefix↔kind agreement because the
        // kernel doesn't know the extension's intended mapping.
        let reference =
            ResourceRef::parse("comtrya://epic/iss_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        assert_eq!(reference.kind, ResourceKind::Owned("epic".to_string()));
    }

    #[test]
    fn resource_ref_rejects_owned_kind_with_invalid_kind_chars() {
        // Kind segments are constrained to lowercase/digits/dash/underscore;
        // upper-case is a malformed URI.
        let err = ResourceRef::parse("comtrya://Issue/iss_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap_err();
        assert_eq!(err.code, crate::ErrorCode::BadUserInput);
    }

    #[test]
    fn visibility_children_cannot_be_broader_without_explicit_knob() {
        assert!(
            Visibility::validate_child_visibility(Visibility::Private, Visibility::Public, false)
                .is_err()
        );
        assert!(
            Visibility::validate_child_visibility(Visibility::Private, Visibility::Public, true)
                .is_ok()
        );
        assert!(
            Visibility::validate_child_visibility(Visibility::Internal, Visibility::Private, false)
                .is_ok()
        );
    }
}
