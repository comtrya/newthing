use crate::auth::{AuthService, ScopedCredential, TokenAction, TokenExchangeRequest};
use crate::authz::{CorePermission, InMemoryAuthorizer};
use crate::domain::{Principal, ResourceRef, Visibility};
use crate::error::{CoreError, CoreResult};
use crate::extensions::ExtensionInstallation;
use crate::ids::{IdPrefix, OpaqueId, Slug};

pub const CORE_SDL_BASELINE: &str = r#"
scalar DateTime
scalar JSON
scalar ResourceURN
enum Visibility { PUBLIC INTERNAL PRIVATE }
enum CheckState { QUEUED IN_PROGRESS COMPLETED }
enum CheckConclusion { SUCCESS FAILURE CANCELLED SKIPPED NEUTRAL TIMED_OUT ACTION_REQUIRED }
enum TokenAction { GIT_READ GIT_WRITE GRAPHQL_READ GRAPHQL_WRITE EVENTS_READ CHECKS_READ CHECKS_WRITE }
type Query {
  viewer: Viewer!
  instance: Instance!
  workspace(id: ID, slug: String): Workspace
  repository(id: ID, path: String): Repository
  project(id: ID, path: String): Project
  event(id: ID!): Event
  events(first: Int = 50, after: String, filter: EventFilter): EventConnection!
  extension(id: ID, name: String): ExtensionInstallation
  extensions: [ExtensionInstallation!]!
}
type Mutation {
  reloadInstanceConfig(input: ReloadInstanceConfigInput!): ReloadInstanceConfigPayload!
  createRepository(input: CreateRepositoryInput!): CreateRepositoryPayload!
  issueGitCredential(input: IssueGitCredentialInput!): IssueGitCredentialPayload!
}
type Subscription {
  events(filter: EventFilter): Event!
  checkUpdated(repositoryID: ID, commit: String): CheckRun!
  extensionEvent(extensionID: ID!): Event!
}
type Viewer { user: User authenticated: Boolean! permissions(resource: ResourceURN!): [String!]! }
type Instance { id: ID! name: String! publicURL: String! capabilities: InstanceCapabilities! }
type InstanceCapabilities { gitHTTPS: Boolean! gitLFS: Boolean! sse: Boolean! graphqlSubscriptions: Boolean! extensionRuntime: Boolean! }
"#;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InstanceCapabilities {
    pub git_https: bool,
    pub git_lfs: bool,
    pub sse: bool,
    pub graphql_subscriptions: bool,
    pub extension_runtime: bool,
}

impl InstanceCapabilities {
    pub fn v1() -> Self {
        Self {
            git_https: true,
            git_lfs: false,
            sse: true,
            graphql_subscriptions: true,
            extension_runtime: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CreateRepositoryInput {
    pub group_id: OpaqueId,
    pub slug: String,
    pub name: Option<String>,
    pub visibility: Visibility,
    pub storage_backend: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepositoryProjection {
    pub id: OpaqueId,
    pub slug: Slug,
    pub name: String,
    pub visibility: Visibility,
    pub storage_backend: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepositoryBackendPolicy {
    pub default_backend: String,
    pub allowed_storage_backends: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct GraphqlGateway {
    pub authorizer: InMemoryAuthorizer,
    pub backend_policy: RepositoryBackendPolicy,
}

impl GraphqlGateway {
    pub fn viewer_permissions(&self, viewer: &Principal, resource_urn: &str) -> Vec<String> {
        let Ok(resource) = ResourceRef::parse(resource_urn) else {
            return Vec::new();
        };
        self.authorizer.permissions(viewer, &resource)
    }

    pub fn create_repository(
        &self,
        viewer: &Principal,
        input: CreateRepositoryInput,
    ) -> CoreResult<RepositoryProjection> {
        let backend = input
            .storage_backend
            .clone()
            .unwrap_or_else(|| self.backend_policy.default_backend.clone());
        if !self
            .backend_policy
            .allowed_storage_backends
            .iter()
            .any(|allowed| allowed == &backend)
        {
            return Err(CoreError::forbidden(
                "repository storage backend is outside allowedStorageBackends",
                format!("comtrya://group/{}", input.group_id),
                CorePermission::RepositoryWrite.as_str(),
            ));
        }
        if matches!(viewer, Principal::Anonymous) {
            return Err(CoreError::new(
                crate::ErrorCode::Unauthenticated,
                "createRepository requires authentication",
            ));
        }
        let slug = Slug::new(input.slug)?;
        Ok(RepositoryProjection {
            id: OpaqueId::new(IdPrefix::Repository),
            name: input.name.unwrap_or_else(|| slug.as_str().to_string()),
            slug,
            visibility: input.visibility,
            storage_backend: backend,
        })
    }

    pub fn extension_manifest_admin(
        &self,
        viewer: &Principal,
        instance: &ResourceRef,
        extension: &ExtensionInstallation,
    ) -> Option<String> {
        self.authorizer
            .check(viewer, instance, CorePermission::InstanceAdmin)
            .then(|| {
                format!(
                    "{{\"name\":\"{}\",\"version\":\"{}\"}}",
                    extension.manifest.name, extension.manifest.version
                )
            })
    }

    pub fn issue_git_credential(
        &self,
        auth: &mut AuthService,
        request: TokenExchangeRequest,
        principal: Principal,
        now_ms: u64,
    ) -> CoreResult<ScopedCredential> {
        auth.exchange_token(
            request,
            principal,
            now_ms,
            &[TokenAction::GitRead, TokenAction::GitWrite],
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{ExtensionHost, ExtensionManifest};

    fn gateway() -> GraphqlGateway {
        GraphqlGateway {
            authorizer: InMemoryAuthorizer::default(),
            backend_policy: RepositoryBackendPolicy {
                default_backend: "local".to_string(),
                allowed_storage_backends: vec!["local".to_string()],
            },
        }
    }

    #[test]
    fn core_sdl_contains_required_roots_and_capability_field() {
        assert!(CORE_SDL_BASELINE.contains("type Query"));
        assert!(CORE_SDL_BASELINE.contains("type Mutation"));
        assert!(CORE_SDL_BASELINE.contains("type Subscription"));
        assert!(CORE_SDL_BASELINE.contains("gitLFS"));
    }

    #[test]
    fn instance_capabilities_keep_lfs_false_for_v1() {
        assert!(!InstanceCapabilities::v1().git_lfs);
    }

    #[test]
    fn viewer_permissions_for_unknown_resource_returns_empty_list() {
        assert!(
            gateway()
                .viewer_permissions(&Principal::Anonymous, "comtrya://repository/repo_missing")
                .is_empty()
        );
    }

    #[test]
    fn create_repository_backend_outside_ceiling_returns_forbidden() {
        let err = gateway()
            .create_repository(
                &Principal::User(OpaqueId::new(IdPrefix::User)),
                CreateRepositoryInput {
                    group_id: OpaqueId::new(IdPrefix::Group),
                    slug: "repo".to_string(),
                    name: None,
                    visibility: Visibility::Private,
                    storage_backend: Some("s3-prod".to_string()),
                },
            )
            .unwrap_err();

        assert_eq!(err.code, crate::ErrorCode::Forbidden);
    }

    #[test]
    fn manifest_admin_is_null_for_non_admin_viewer() {
        let mut host = ExtensionHost::default();
        let manifest = ExtensionManifest::reference_pull_requests();
        let extension = host
            .activate(crate::ExtensionInstallation::new(
                manifest.clone(),
                manifest.capabilities.clone(),
            ))
            .unwrap();
        let instance =
            ResourceRef::parse("comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();

        assert!(
            gateway()
                .extension_manifest_admin(&Principal::Anonymous, &instance, &extension)
                .is_none()
        );
    }
}
