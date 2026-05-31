use crate::config::{InstanceConfig, OidcIssuerConfig};
use crate::domain::{ResourceKind, ResourceRef, User};
use crate::error::{CoreError, CoreResult, ErrorCode};
use crate::events::{CoreEvent, CoreEventType, EventActor, EventEnvelope, EventOutbox};
use crate::ids::{IdPrefix, OpaqueId};
use std::collections::BTreeMap;

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

#[derive(Debug, Clone)]
pub struct AuthService {
    issuers: BTreeMap<String, OidcIssuerConfig>,
    users_by_issuer_subject: BTreeMap<(String, String), User>,
    /// Resource the kernel attributes auth/identity events to. This is the
    /// instance's singleton workspace, derived from `InstanceConfig`, not a
    /// fabricated identifier.
    instance_resource: ResourceRef,
    /// Audit/identity events buffered during the most recent mutating call
    /// (currently only `login`). The caller MUST drain via `take_outbox`
    /// after every such call and forward to the runtime's audit/event
    /// sinks — events left in this buffer never reach disk and the
    /// `dev.comtrya.auth.login.*` / `dev.comtrya.user.created` audit
    /// trail goes missing. Private so callers cannot read without
    /// draining (TNQ-3 P1: previously `pub`, no consumer drained it).
    outbox: EventOutbox,
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
            instance_resource: ResourceRef::singleton(ResourceKind::Workspace)
                .expect("workspace is a singleton resource kind"),
            outbox: EventOutbox::default(),
        }
    }

    pub fn users_len(&self) -> usize {
        self.users_by_issuer_subject.len()
    }

    /// Drain the outbox. Callers must invoke this after every mutating
    /// AuthService call (today only `login`) so the audit/identity
    /// events the call buffered reach disk via the runtime's sinks.
    /// Returns the events in append order; the internal buffer is
    /// emptied.
    pub fn take_outbox(&mut self) -> Vec<EventEnvelope> {
        self.outbox.take_all()
    }

    /// Replace the configured OIDC issuers, keeping already-provisioned users.
    /// Used by the GitOps reconciler to apply issuer changes without a restart.
    pub fn set_issuers(&mut self, issuers: &[OidcIssuerConfig]) {
        self.issuers = issuers
            .iter()
            .map(|issuer| (issuer.id.clone(), issuer.clone()))
            .collect();
    }

    pub fn login(
        &mut self,
        issuer_id: &str,
        claims: OidcClaims,
        now_ms: u64,
    ) -> CoreResult<LoginResult> {
        // Clone the matched issuer so the immutable borrow of `self.issuers` is
        // released before `audit_login` (which needs `&mut self`). An unknown
        // issuer id must be audited like the other failed-login paths so a
        // caller probing for valid issuer ids does not slip through unaudited.
        let issuer = match self.issuers.get(issuer_id).cloned() {
            Some(issuer) => issuer,
            None => {
                self.audit_login(false, None, now_ms);
                return Err(CoreError::new(
                    ErrorCode::Unauthenticated,
                    "unknown OIDC issuer",
                ));
            }
        };
        if issuer.issuer_url != claims.issuer {
            self.audit_login(false, None, now_ms);
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
            self.audit_login(false, None, now_ms);
            return Err(CoreError::forbidden(
                "OIDC JIT provisioning denied by issuer rules",
                "comtrya://instance/local",
                "auth:login",
            ));
        }

        let key = (claims.issuer.clone(), claims.subject.clone());
        let created = !self.users_by_issuer_subject.contains_key(&key);
        let user = match self.users_by_issuer_subject.get_mut(&key) {
            Some(existing) => {
                // Returning login: refresh mutable claims from the IdP so the
                // stored email/display name do not drift from the source of
                // truth.
                existing.email = claims.email.clone();
                existing.display_name = claims.display_name.clone();
                existing.clone()
            }
            None => {
                let user = User {
                    id: OpaqueId::new(IdPrefix::User),
                    issuer: claims.issuer.clone(),
                    subject: claims.subject.clone(),
                    email: claims.email.clone(),
                    display_name: claims.display_name.clone(),
                };
                self.users_by_issuer_subject.insert(key, user.clone());
                user
            }
        };
        self.audit_login(true, Some(&user), now_ms);
        if created {
            self.emit_user_created(&user, now_ms);
        }
        Ok(LoginResult { user, created })
    }

    fn audit_login(&mut self, succeeded: bool, user: Option<&User>, now_ms: u64) {
        let source = self.instance_resource.clone();
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
            CoreEvent {
                event_type,
                source: source.clone(),
                subject: None,
                actor,
                visibility: crate::Visibility::Private,
                resources: vec![source],
                data_json: "{}".to_string(),
            },
            now_ms,
        ));
    }

    fn emit_user_created(&mut self, user: &User, now_ms: u64) {
        let source = self.instance_resource.clone();
        let data_json = serde_json::json!({ "userID": user.id.to_string() }).to_string();
        self.outbox.append(EventEnvelope::core(
            CoreEvent {
                event_type: CoreEventType::UserCreated,
                source: source.clone(),
                subject: Some(user.subject.clone()),
                actor: EventActor {
                    kind: "user".to_string(),
                    uri: format!("comtrya://user/{}", user.id),
                    display_name: user.display_name.clone(),
                },
                visibility: crate::Visibility::Private,
                resources: vec![source],
                data_json,
            },
            now_ms,
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

        let result = auth.login("dev", claims(), 1_700_000_000_000).unwrap();

        assert!(result.created);
        assert_eq!(auth.users_len(), 1);
        let drained = auth.take_outbox();
        assert!(
            drained
                .iter()
                .any(|event| event.event_type == CoreEventType::UserCreated.as_str())
        );
        // Auth events are attributed to the singleton workspace, not a
        // fabricated identifier, and stamped with the caller's clock.
        let created = drained
            .iter()
            .find(|event| event.event_type == CoreEventType::UserCreated.as_str())
            .unwrap();
        assert_eq!(created.source.canonical(), "comtrya://workspace");
        assert_eq!(created.time, "2023-11-14T22:13:20.000Z");
        // Outbox is empty after draining — caller owns the events
        // and the buffer must not grow across calls.
        assert!(auth.take_outbox().is_empty());
    }

    #[test]
    fn returning_login_refreshes_mutable_claims() {
        let config = InstanceConfig::minimal_dev();
        let mut auth = AuthService::new(&config);

        let first = auth.login("dev", claims(), 1_000).unwrap();
        assert!(first.created);

        let mut updated = claims();
        updated.email = Some("new-address@example.test".to_string());
        updated.display_name = Some("New Name".to_string());
        let second = auth.login("dev", updated, 2_000).unwrap();

        assert!(!second.created);
        assert_eq!(auth.users_len(), 1);
        assert_eq!(second.user.id, first.user.id);
        assert_eq!(
            second.user.email.as_deref(),
            Some("new-address@example.test")
        );
        assert_eq!(second.user.display_name.as_deref(), Some("New Name"));
    }

    #[test]
    fn disallowed_issuer_group_rejects_without_user_record() {
        let mut config = InstanceConfig::minimal_dev();
        config.oidc_issuers[0].allowed_domains = vec!["other.test".to_string()];
        let mut auth = AuthService::new(&config);

        let err = auth.login("dev", claims(), 0).unwrap_err();

        assert_eq!(err.code, ErrorCode::Forbidden);
        assert_eq!(auth.users_len(), 0);
    }

    #[test]
    fn unknown_issuer_login_is_audited_as_failed() {
        let config = InstanceConfig::minimal_dev();
        let mut auth = AuthService::new(&config);

        let err = auth.login("no-such-issuer", claims(), 42).unwrap_err();
        assert_eq!(err.code, ErrorCode::Unauthenticated);

        // The unknown-issuer path must emit a failed-login audit event, just
        // like the issuer-mismatch and provisioning-denied paths do.
        let failed: Vec<_> = auth
            .take_outbox()
            .into_iter()
            .filter(|event| event.event_type == CoreEventType::AuthLoginFailed.as_str())
            .collect();
        assert_eq!(
            failed.len(),
            1,
            "unknown issuer must produce one failure audit"
        );
        assert_eq!(failed[0].time, "1970-01-01T00:00:00.042Z");
        assert_eq!(auth.users_len(), 0);
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
