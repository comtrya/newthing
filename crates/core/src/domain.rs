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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
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
}

impl ResourceKind {
    pub const fn as_str(self) -> &'static str {
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
        }
    }

    pub fn from_id_prefix(prefix: IdPrefix) -> Self {
        match prefix {
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
        }
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
            _ => return None,
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ResourceRef {
    pub kind: ResourceKind,
    pub id: OpaqueId,
}

impl ResourceRef {
    pub fn new(kind: ResourceKind, id: OpaqueId) -> CoreResult<Self> {
        let id_kind = ResourceKind::from_id_prefix(id.prefix());
        if id_kind != kind {
            return Err(CoreError::bad_user_input(format!(
                "resource kind {} does not match ID prefix kind {}",
                kind.as_str(),
                id_kind.as_str()
            )));
        }
        Ok(Self { kind, id })
    }

    pub fn parse(value: &str) -> CoreResult<Self> {
        let rest = value.strip_prefix("comtrya://").ok_or_else(|| {
            CoreError::bad_user_input("resource reference must use comtrya://")
        })?;
        let (kind, id) = rest.split_once('/').ok_or_else(|| {
            CoreError::bad_user_input("resource reference must include kind and ID")
        })?;
        let kind = ResourceKind::parse(kind)
            .ok_or_else(|| CoreError::bad_user_input("resource reference has unknown kind"))?;
        Self::new(kind, OpaqueId::from_str(id)?)
    }

    pub fn canonical(&self) -> String {
        format!("comtrya://{}/{}", self.kind.as_str(), self.id)
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
        let err = ResourceRef::parse("comtrya://repository/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3")
            .unwrap_err();
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
