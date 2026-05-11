use crate::error::{CoreError, CoreResult};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CorsPolicy {
    pub allowed_origins: Vec<String>,
}

impl CorsPolicy {
    pub fn check(&self, origin: &str, route: &str) -> CoreResult<BTreeMap<String, String>> {
        if !self.allowed_origins.iter().any(|allowed| allowed == origin) {
            return Err(CoreError::forbidden(
                "origin is not allowed",
                route,
                "cors:access",
            ));
        }
        let mut headers = BTreeMap::new();
        headers.insert(
            "Access-Control-Allow-Origin".to_string(),
            origin.to_string(),
        );
        headers.insert(
            "Access-Control-Allow-Credentials".to_string(),
            "true".to_string(),
        );
        headers.insert(
            "Access-Control-Allow-Methods".to_string(),
            allowed_methods_for_route(route).join(", "),
        );
        Ok(headers)
    }
}

pub fn allowed_methods_for_route(route: &str) -> Vec<&'static str> {
    match route {
        "/graphql" => vec!["GET", "POST", "OPTIONS"],
        "/graphql/stream" | "/events" => vec!["GET", "OPTIONS"],
        "/events/session" | "/auth/token-exchange" | "/_extensions/session" => {
            vec!["POST", "OPTIONS"]
        }
        route if route.starts_with("/auth/") => vec!["GET", "POST", "OPTIONS"],
        route if route.starts_with("/_extensions/") => vec!["GET", "OPTIONS"],
        route if route.starts_with("/git/") => vec!["GET", "POST", "OPTIONS"],
        _ => vec!["OPTIONS"],
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SessionToken {
    token: String,
    principal_key: String,
    expires_at_ms: u64,
    used: bool,
}

#[derive(Debug, Default, Clone)]
pub struct SessionTokenIssuer {
    sessions: BTreeMap<String, SessionToken>,
}

impl SessionTokenIssuer {
    pub fn issue(&mut self, principal_key: impl Into<String>, now_ms: u64) -> String {
        let principal_key = principal_key.into();
        let token = format!("sess_{}_{}", now_ms, self.sessions.len());
        self.sessions.insert(
            token.clone(),
            SessionToken {
                token: token.clone(),
                principal_key,
                expires_at_ms: now_ms + 300_000,
                used: false,
            },
        );
        token
    }

    pub fn consume(&mut self, token: &str, principal_key: &str, now_ms: u64) -> CoreResult<()> {
        let session = self
            .sessions
            .get_mut(token)
            .ok_or_else(|| CoreError::bad_user_input("unknown session token"))?;
        if session.used || session.principal_key != principal_key || now_ms >= session.expires_at_ms
        {
            return Err(CoreError::bad_user_input(
                "session token is expired, reused, or bound to another principal",
            ));
        }
        session.used = true;
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RateLimit {
    pub ceiling_per_minute: u32,
    hits: BTreeMap<(String, u64), u32>,
}

impl RateLimit {
    pub fn new(ceiling_per_minute: u32) -> Self {
        Self {
            ceiling_per_minute,
            hits: BTreeMap::new(),
        }
    }

    pub fn check(&mut self, bucket: &str, now_ms: u64) -> CoreResult<()> {
        let minute = now_ms / 60_000;
        let count = self.hits.entry((bucket.to_string(), minute)).or_default();
        *count += 1;
        if *count > self.ceiling_per_minute {
            return Err(CoreError::rate_limited("rate limit exceeded"));
        }
        Ok(())
    }
}

#[derive(Debug, Default, Clone)]
pub struct ActiveStreamRegistry {
    active: BTreeMap<String, BTreeSet<String>>,
    max_concurrent: usize,
}

impl ActiveStreamRegistry {
    pub fn new(max_concurrent: usize) -> Self {
        Self {
            active: BTreeMap::new(),
            max_concurrent,
        }
    }

    pub fn open(&mut self, principal_key: &str, stream_id: impl Into<String>) -> CoreResult<()> {
        let streams = self.active.entry(principal_key.to_string()).or_default();
        if streams.len() >= self.max_concurrent {
            return Err(CoreError::rate_limited(
                "too many concurrent stream connections",
            ));
        }
        streams.insert(stream_id.into());
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disallowed_cross_origin_graphql_fetch_is_rejected() {
        let policy = CorsPolicy {
            allowed_origins: vec!["http://localhost:4321".to_string()],
        };

        assert_eq!(
            policy
                .check("https://evil.example", "/graphql")
                .unwrap_err()
                .code,
            crate::ErrorCode::Forbidden
        );
    }

    #[test]
    fn allowed_origin_reflects_credentials_headers() {
        let policy = CorsPolicy {
            allowed_origins: vec!["http://localhost:4321".to_string()],
        };
        let headers = policy.check("http://localhost:4321", "/events").unwrap();

        assert_eq!(
            headers
                .get("Access-Control-Allow-Credentials")
                .map(String::as_str),
            Some("true")
        );
        assert_eq!(
            headers
                .get("Access-Control-Allow-Origin")
                .map(String::as_str),
            Some("http://localhost:4321")
        );
    }

    #[test]
    fn browser_sse_session_token_is_single_use() {
        let mut issuer = SessionTokenIssuer::default();
        let token = issuer.issue("user:1", 0);

        issuer.consume(&token, "user:1", 1_000).unwrap();
        assert_eq!(
            issuer.consume(&token, "user:1", 2_000).unwrap_err().code,
            crate::ErrorCode::BadUserInput
        );
    }

    #[test]
    fn token_exchange_rate_limit_raises_rate_limited() {
        let mut limiter = RateLimit::new(1);

        limiter.check("principal", 0).unwrap();
        assert_eq!(
            limiter.check("principal", 1_000).unwrap_err().code,
            crate::ErrorCode::RateLimited
        );
    }
}
