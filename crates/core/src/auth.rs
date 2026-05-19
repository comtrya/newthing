use crate::config::{InstanceConfig, OidcIssuerConfig};
use crate::domain::{Principal, ResourceRef, User};
use crate::error::{CoreError, CoreResult, ErrorCode};
use crate::events::{CoreEventType, EventActor, EventEnvelope, EventOutbox};
use crate::ids::{IdPrefix, OpaqueId};
use std::collections::BTreeMap;

/// Bearer token for a `ScopedCredential` with 128 bits of entropy from
/// the OS RNG. Format: `fp_{32-hex-chars}`. The `fp` prefix matches
/// the server's `issue_credential` so on-the-wire shapes line up
/// across the two issuance paths.
fn secure_access_token() -> String {
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).expect("os rng unavailable");
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    format!("fp_{hex}")
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenAction {
    GitRead,
    GitWrite,
    GraphqlRead,
    GraphqlWrite,
    EventsRead,
    ChecksRead,
    ChecksWrite,
}

impl TokenAction {
    pub const fn as_scope(self) -> &'static str {
        match self {
            Self::GitRead => "git:read",
            Self::GitWrite => "git:write",
            Self::GraphqlRead => "graphql:read",
            Self::GraphqlWrite => "graphql:write",
            Self::EventsRead => "events:read",
            Self::ChecksRead => "checks:read",
            Self::ChecksWrite => "checks:write",
        }
    }

    pub fn parse(value: &str) -> CoreResult<Self> {
        Ok(match value {
            "git:read" => Self::GitRead,
            "git:write" => Self::GitWrite,
            "graphql:read" => Self::GraphqlRead,
            "graphql:write" => Self::GraphqlWrite,
            "events:read" => Self::EventsRead,
            "checks:read" => Self::ChecksRead,
            "checks:write" => Self::ChecksWrite,
            _ => {
                return Err(CoreError {
                    code: ErrorCode::BadUserInput,
                    message: "unknown token action".to_string(),
                    resource: None,
                    permission: None,
                });
            }
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OidcClaims {
    pub issuer: String,
    pub subject: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub groups: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LoginResult {
    pub user: User,
    pub created: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TokenExchangeRequest {
    pub grant_type: String,
    pub subject_token: String,
    pub subject_token_type: String,
    pub requested_resource: String,
    pub requested_actions: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScopedCredential {
    pub access_token: String,
    pub token_type: String,
    pub expires_at_ms: u64,
    pub scope: Vec<String>,
    pub resource: ResourceRef,
    pub principal: Principal,
}

impl ScopedCredential {
    pub fn expired(&self, now_ms: u64) -> bool {
        now_ms >= self.expires_at_ms
    }
}

#[derive(Debug, Clone)]
pub struct AuthService {
    issuers: BTreeMap<String, OidcIssuerConfig>,
    users_by_issuer_subject: BTreeMap<(String, String), User>,
    pub outbox: EventOutbox,
}

impl AuthService {
    pub fn new(config: &InstanceConfig) -> Self {
        Self {
            issuers: config
                .oidc_issuers
                .iter()
                .map(|issuer| (issuer.id.clone(), issuer.clone()))
                .collect(),
            users_by_issuer_subject: BTreeMap::new(),
            outbox: EventOutbox::default(),
        }
    }

    pub fn users_len(&self) -> usize {
        self.users_by_issuer_subject.len()
    }

    pub fn login(&mut self, issuer_id: &str, claims: OidcClaims) -> CoreResult<LoginResult> {
        let issuer = self
            .issuers
            .get(issuer_id)
            .ok_or_else(|| CoreError::new(ErrorCode::Unauthenticated, "unknown OIDC issuer"))?;
        if issuer.issuer_url != claims.issuer {
            self.audit_login(false, None);
            return Err(CoreError::new(
                ErrorCode::Unauthenticated,
                "OIDC issuer mismatch",
            ));
        }
        if !issuer.allows(
            &claims.subject,
            claims.email.as_deref(),
            claims.groups.as_slice(),
        ) {
            self.audit_login(false, None);
            return Err(CoreError::forbidden(
                "OIDC JIT provisioning denied by issuer rules",
                "comtrya://instance/local",
                "auth:login",
            ));
        }

        let key = (claims.issuer.clone(), claims.subject.clone());
        let created = !self.users_by_issuer_subject.contains_key(&key);
        let user = self
            .users_by_issuer_subject
            .entry(key)
            .or_insert_with(|| User {
                id: OpaqueId::new(IdPrefix::User),
                issuer: claims.issuer.clone(),
                subject: claims.subject.clone(),
                email: claims.email.clone(),
                display_name: claims.display_name.clone(),
            })
            .clone();
        self.audit_login(true, Some(&user));
        if created {
            self.emit_user_created(&user);
        }
        Ok(LoginResult { user, created })
    }

    pub fn exchange_token(
        &mut self,
        request: TokenExchangeRequest,
        principal: Principal,
        now_ms: u64,
        allowed_actions: &[TokenAction],
    ) -> CoreResult<ScopedCredential> {
        if request.grant_type != "urn:comtrya:grant:oidc-token-exchange" {
            return Err(CoreError::bad_user_input("unsupported grantType"));
        }
        if request.subject_token_type != "urn:ietf:params:oauth:token-type:jwt" {
            return Err(CoreError::bad_user_input("unsupported subjectTokenType"));
        }
        if request.subject_token.trim().is_empty() {
            return Err(CoreError::new(
                ErrorCode::Unauthenticated,
                "subjectToken is required",
            ));
        }
        let resource = ResourceRef::parse(&request.requested_resource)?;
        let requested_actions = request
            .requested_actions
            .iter()
            .map(|action| TokenAction::parse(action))
            .collect::<CoreResult<Vec<_>>>()?;
        for action in &requested_actions {
            if !allowed_actions.contains(action) {
                return Err(CoreError::forbidden(
                    "requested action is not authorized",
                    resource.canonical(),
                    action.as_scope(),
                ));
            }
        }
        let scope = requested_actions
            .iter()
            .map(|action| action.as_scope().to_string())
            .collect::<Vec<_>>();
        let credential = ScopedCredential {
            access_token: secure_access_token(),
            token_type: "Bearer".to_string(),
            expires_at_ms: now_ms + 300_000,
            scope,
            resource: resource.clone(),
            principal,
        };
        self.emit_credential_issued(&resource);
        Ok(credential)
    }

    fn audit_login(&mut self, succeeded: bool, user: Option<&User>) {
        let source =
            ResourceRef::parse("comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        let event_type = if succeeded {
            CoreEventType::AuthLoginSucceeded
        } else {
            CoreEventType::AuthLoginFailed
        };
        let actor = EventActor {
            kind: "user".to_string(),
            uri: user
                .map(|user| format!("comtrya://user/{}", user.id))
                .unwrap_or_else(|| "comtrya://user/unknown".to_string()),
            display_name: user.and_then(|user| user.display_name.clone()),
        };
        self.outbox.append(EventEnvelope::core(
            event_type,
            source.clone(),
            None,
            actor,
            crate::Visibility::Private,
            vec![source],
            "{}",
        ));
    }

    fn emit_user_created(&mut self, user: &User) {
        let source =
            ResourceRef::parse("comtrya://workspace/ws_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        self.outbox.append(EventEnvelope::core(
            CoreEventType::UserCreated,
            source.clone(),
            Some(user.subject.clone()),
            EventActor {
                kind: "user".to_string(),
                uri: format!("comtrya://user/{}", user.id),
                display_name: user.display_name.clone(),
            },
            crate::Visibility::Private,
            vec![source],
            format!("{{\"userID\":\"{}\"}}", user.id),
        ));
    }

    fn emit_credential_issued(&mut self, resource: &ResourceRef) {
        self.outbox.append(EventEnvelope::core(
            CoreEventType::AuthCredentialIssued,
            resource.clone(),
            None,
            EventActor {
                kind: "workload".to_string(),
                uri: "comtrya://workload/token-exchange".to_string(),
                display_name: None,
            },
            crate::Visibility::Private,
            vec![resource.clone()],
            "{}",
        ));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{ClientKind, Environment, InstanceConfig};

    fn claims() -> OidcClaims {
        OidcClaims {
            issuer: "https://issuer.example.test".to_string(),
            subject: "rawkode".to_string(),
            email: Some("rawkode@example.test".to_string()),
            display_name: Some("Rawkode".to_string()),
            groups: Vec::new(),
        }
    }

    #[test]
    fn allowed_user_first_login_creates_user_and_audit_events() {
        let config = InstanceConfig::minimal_dev();
        let mut auth = AuthService::new(&config);

        let result = auth.login("dev", claims()).unwrap();

        assert!(result.created);
        assert_eq!(auth.users_len(), 1);
        assert!(
            auth.outbox
                .all()
                .iter()
                .any(|event| event.event_type == CoreEventType::UserCreated.as_str())
        );
    }

    #[test]
    fn disallowed_issuer_group_rejects_without_user_record() {
        let mut config = InstanceConfig::minimal_dev();
        config.oidc_issuers[0].allowed_domains = vec!["other.test".to_string()];
        let mut auth = AuthService::new(&config);

        let err = auth.login("dev", claims()).unwrap_err();

        assert_eq!(err.code, ErrorCode::Forbidden);
        assert_eq!(auth.users_len(), 0);
    }

    #[test]
    fn workload_token_exchange_returns_short_lived_scoped_credential() {
        let config = InstanceConfig::minimal_dev();
        let mut auth = AuthService::new(&config);
        let credential = auth
            .exchange_token(
                TokenExchangeRequest {
                    grant_type: "urn:comtrya:grant:oidc-token-exchange".to_string(),
                    subject_token: "jwt".to_string(),
                    subject_token_type: "urn:ietf:params:oauth:token-type:jwt".to_string(),
                    requested_resource: "comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3"
                        .to_string(),
                    requested_actions: vec!["git:read".to_string(), "git:write".to_string()],
                },
                Principal::Workload {
                    issuer: "github-actions".to_string(),
                    subject: "repo:example".to_string(),
                },
                1_000,
                &[TokenAction::GitRead, TokenAction::GitWrite],
            )
            .unwrap();

        assert_eq!(credential.token_type, "Bearer");
        assert_eq!(credential.expires_at_ms, 301_000);
        assert!(!credential.expired(300_999));
        assert!(credential.expired(301_000));
        assert_eq!(credential.scope, ["git:read", "git:write"]);
    }

    #[test]
    fn unknown_token_actions_are_bad_user_input() {
        assert_eq!(
            TokenAction::parse("repo:admin").unwrap_err().code,
            ErrorCode::BadUserInput
        );
    }

    #[test]
    fn production_confidential_secret_rule_is_in_config_layer() {
        let mut config = InstanceConfig::minimal_dev();
        config.environment = Environment::Production;
        config.public_url = "https://comtrya.example.test".to_string();
        config.oidc_issuers[0].client_kind = ClientKind::Confidential;
        config.oidc_issuers[0].client_secret = None;

        assert_eq!(
            config.validate().unwrap_err().code,
            ErrorCode::ConfigInvalid
        );
    }
}
