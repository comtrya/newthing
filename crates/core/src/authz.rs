use crate::domain::{Principal, ResourceKind, ResourceRef, Visibility};
use crate::events::principal_key;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CorePermission {
    InstanceAdmin,
    RepositoryRead,
    RepositoryWrite,
}

impl CorePermission {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::InstanceAdmin => "instance.admin",
            Self::RepositoryRead => "repo.read",
            Self::RepositoryWrite => "repo.write",
        }
    }

    /// The read permission that gates a private resource of the given kind.
    /// Returns `None` for kinds that have no kernel-owned read permission;
    /// such private resources are never readable through this authorizer
    /// without an explicit grant model wired for that kind.
    const fn read_for_kind(kind: &ResourceKind) -> Option<Self> {
        match kind {
            ResourceKind::Repository => Some(Self::RepositoryRead),
            _ => None,
        }
    }
}

#[derive(Debug, Default, Clone)]
pub struct InMemoryAuthorizer {
    grants: BTreeMap<String, BTreeMap<String, BTreeSet<String>>>,
    pub last_invalidation_ms: Option<u64>,
}

impl InMemoryAuthorizer {
    pub fn grant(
        &mut self,
        principal: &Principal,
        resource: &ResourceRef,
        permission: CorePermission,
    ) {
        self.grants
            .entry(resource.canonical())
            .or_default()
            .entry(principal_key(principal))
            .or_default()
            .insert(permission.as_str().to_string());
    }

    pub fn revoke_principal(&mut self, principal: &Principal, now_ms: u64) {
        let key = principal_key(principal);
        for grants in self.grants.values_mut() {
            grants.remove(&key);
        }
        self.last_invalidation_ms = Some(now_ms);
    }

    pub fn permissions(&self, principal: &Principal, resource: &ResourceRef) -> Vec<String> {
        self.grants
            .get(&resource.canonical())
            .and_then(|by_principal| by_principal.get(&principal_key(principal)))
            .map(|permissions| permissions.iter().cloned().collect())
            .unwrap_or_default()
    }

    pub fn check(
        &self,
        principal: &Principal,
        resource: &ResourceRef,
        permission: CorePermission,
    ) -> bool {
        self.permissions(principal, resource)
            .iter()
            .any(|granted| granted == permission.as_str())
    }

    pub fn can_read_visibility(
        &self,
        principal: &Principal,
        resource: &ResourceRef,
        visibility: Visibility,
    ) -> bool {
        match visibility {
            Visibility::Public => true,
            Visibility::Internal => !matches!(principal, Principal::Anonymous),
            Visibility::Private => match CorePermission::read_for_kind(&resource.kind) {
                Some(permission) => self.check(principal, resource, permission),
                None => false,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{IdPrefix, OpaqueId, ResourceRef};

    fn repo() -> ResourceRef {
        ResourceRef::parse("comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap()
    }

    #[test]
    fn unknown_resource_permissions_return_empty_list() {
        let authz = InMemoryAuthorizer::default();
        let user = Principal::User(OpaqueId::new(IdPrefix::User));

        assert!(authz.permissions(&user, &repo()).is_empty());
    }

    #[test]
    fn anonymous_can_only_read_public_resources() {
        let authz = InMemoryAuthorizer::default();

        assert!(authz.can_read_visibility(&Principal::Anonymous, &repo(), Visibility::Public));
        assert!(!authz.can_read_visibility(&Principal::Anonymous, &repo(), Visibility::Internal));
        assert!(!authz.can_read_visibility(&Principal::Anonymous, &repo(), Visibility::Private));
    }

    #[test]
    fn revoked_membership_invalidates_permissions_within_five_seconds_contract() {
        let mut authz = InMemoryAuthorizer::default();
        let user = Principal::User(OpaqueId::new(IdPrefix::User));
        authz.grant(&user, &repo(), CorePermission::RepositoryRead);

        assert!(authz.can_read_visibility(&user, &repo(), Visibility::Private));
        authz.revoke_principal(&user, 1_000);

        assert_eq!(authz.last_invalidation_ms, Some(1_000));
        assert!(!authz.can_read_visibility(&user, &repo(), Visibility::Private));
    }

    #[test]
    fn private_non_repository_resource_is_not_readable_via_repository_grant() {
        let mut authz = InMemoryAuthorizer::default();
        let user = Principal::User(OpaqueId::new(IdPrefix::User));
        let project =
            ResourceRef::parse("comtrya://project/prj_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        // A repo.read grant on a project must not unlock the private project,
        // because read permission is selected by the resource kind.
        authz.grant(&user, &project, CorePermission::RepositoryRead);

        assert!(!authz.can_read_visibility(&user, &project, Visibility::Private));
    }
}
