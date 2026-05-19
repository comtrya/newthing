//! OIDC scaffolding for the comtrya kernel.
//!
//! Owns in-memory state, discovery cache, and code-exchange plumbing
//! for the OIDC flow at `/auth/oidc/:provider/{login,callback}`.
//!
//! Five types matter outside this module:
//!
//! * [`OidcLoginSession`] — single in-flight PKCE+nonce pair, indexed
//!   in the session store by the CSRF state token sent to the IdP.
//! * [`OidcSessionStore`] — bounded in-memory map of sessions with
//!   TTL eviction-on-insert and a 10,000-entry hard cap.
//! * [`OidcMetadataProvider`] — trait abstracting the discovery
//!   document fetch. Production: `ReqwestMetadataProvider` with
//!   `Policy::none()` (discovery must not redirect).
//! * [`OidcCodeExchanger`] — trait abstracting the authorization-code
//!   exchange + ID-token verification. Production:
//!   `ReqwestCodeExchanger` with the DEFAULT redirect policy (some
//!   IdPs 3xx their canonical token endpoint).
//! * [`OidcDiscoveryCache`] — holds both providers + memoizes
//!   `CoreProviderMetadata` per issuer for the process lifetime.

use comtrya_core::auth::OidcClaims;
use openidconnect::core::{CoreClient, CoreProviderMetadata};
use openidconnect::{
    AuthorizationCode, ClientId, ClientSecret, IssuerUrl, Nonce, PkceCodeVerifier, RedirectUrl,
};
use std::collections::HashMap;
use std::sync::{Mutex, RwLock};

/// Per-invocation PKCE + nonce material, indexed in the session store
/// by the CSRF state token sent to the IdP. Single-use:
/// [`OidcSessionStore::take`] removes the entry on retrieval so a
/// replay returns `None`.
#[derive(Debug)]
pub(crate) struct OidcLoginSession {
    pub provider_id: String,
    pub pkce_verifier: PkceCodeVerifier,
    pub nonce: Nonce,
    pub created_at_secs: u64,
}

/// 30 minutes — matches typical OIDC implementations and is generous
/// enough for users who pause at MFA prompts.
pub(crate) const OIDC_SESSION_TTL_SECS: u64 = 30 * 60;

/// Hard cap on the number of in-flight OIDC login sessions. When hit,
/// [`OidcSessionStore::insert`] returns `Err(())` and the caller should
/// respond 429. The cap exists to bound memory under attack — at ~200
/// bytes per entry, 10,000 entries ≈ 2 MB. Production hardening
/// (persistent store + edge rate limiting) is a follow-up.
pub(crate) const OIDC_SESSION_MAX_ENTRIES: usize = 10_000;

#[derive(Default, Debug)]
pub(crate) struct OidcSessionStore {
    inner: Mutex<HashMap<String, OidcLoginSession>>,
}

impl OidcSessionStore {
    pub fn new() -> Self {
        Self::default()
    }

    /// Insert a session, evicting expired entries first. Returns `Err(())`
    /// when the hard cap is hit so the caller can respond 429 without
    /// growing the map further.
    pub fn insert(
        &self,
        state: String,
        session: OidcLoginSession,
        now_secs: u64,
    ) -> Result<(), ()> {
        let mut guard = self.inner.lock().expect("oidc session lock not poisoned");
        let cutoff = now_secs.saturating_sub(OIDC_SESSION_TTL_SECS);
        guard.retain(|_, s| s.created_at_secs >= cutoff);
        if guard.len() >= OIDC_SESSION_MAX_ENTRIES {
            return Err(());
        }
        guard.insert(state, session);
        Ok(())
    }

    /// Single-use retrieval — removes the entry on return. Called from
    /// the production callback handler.
    pub fn take(&self, state: &str) -> Option<OidcLoginSession> {
        let mut guard = self.inner.lock().expect("oidc session lock not poisoned");
        guard.remove(state)
    }

    #[cfg(test)]
    pub fn len(&self) -> usize {
        self.inner
            .lock()
            .expect("oidc session lock not poisoned")
            .len()
    }
}

/// Source of OIDC provider metadata. Production wires
/// [`ReqwestMetadataProvider`]; tests inject a closure-backed mock so
/// no network call happens during unit tests.
#[async_trait::async_trait]
pub(crate) trait OidcMetadataProvider: Send + Sync {
    async fn fetch(&self, issuer_url: &str) -> Result<CoreProviderMetadata, String>;
}

/// Inputs to a single OIDC code-exchange call. Bundled into a record
/// so the trait method stays at one argument plus `&self`, and so
/// adding a new field (e.g. `groups_claim_path` later) doesn't churn
/// the signature.
#[derive(Debug)]
pub(crate) struct OidcCodeExchangeRequest {
    pub metadata: CoreProviderMetadata,
    pub client_id: String,
    pub client_secret: Option<String>,
    pub redirect_url: String,
    pub pkce_verifier: PkceCodeVerifier,
    pub nonce: Nonce,
    pub code: String,
}

/// Authorization-code → ID-token + verified claims. Production uses
/// `openidconnect` + reqwest; tests inject a closure that returns
/// pre-built [`OidcClaims`] without any HTTP traffic.
///
/// The trait owns both the network round-trip AND the cryptographic
/// verification so the kernel doesn't expose half a verifier to its
/// callers.
#[async_trait::async_trait]
pub(crate) trait OidcCodeExchanger: Send + Sync {
    async fn exchange(&self, request: OidcCodeExchangeRequest) -> Result<OidcClaims, String>;
}

/// Production [`OidcMetadataProvider`] backed by `reqwest`. Configured
/// with `redirect::Policy::none()` — discovery endpoints must not
/// redirect; if they do, surface that as an error rather than following.
pub(crate) struct ReqwestMetadataProvider {
    client: reqwest::Client,
}

impl ReqwestMetadataProvider {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("build OIDC discovery http client");
        Self { client }
    }
}

impl Default for ReqwestMetadataProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl OidcMetadataProvider for ReqwestMetadataProvider {
    async fn fetch(&self, issuer_url: &str) -> Result<CoreProviderMetadata, String> {
        let issuer = IssuerUrl::new(issuer_url.to_string())
            .map_err(|e| format!("invalid OIDC issuer URL {issuer_url}: {e}"))?;
        CoreProviderMetadata::discover_async(issuer, &self.client)
            .await
            .map_err(|e| format!("OIDC discovery failed for {issuer_url}: {e}"))
    }
}

/// Production [`OidcCodeExchanger`] backed by `reqwest`. Uses the
/// DEFAULT redirect policy (NOT `Policy::none()` like the discovery
/// client) because some IdPs (Google, Azure AD) return 3xx from their
/// canonical token endpoint and require following the redirect to the
/// actual server. Constructed as a separate `reqwest::Client` from
/// the discovery client.
pub(crate) struct ReqwestCodeExchanger {
    http: reqwest::Client,
}

impl ReqwestCodeExchanger {
    pub fn new() -> Self {
        let http = reqwest::Client::builder()
            .build()
            .expect("build OIDC token-exchange http client");
        Self { http }
    }
}

impl Default for ReqwestCodeExchanger {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl OidcCodeExchanger for ReqwestCodeExchanger {
    async fn exchange(&self, request: OidcCodeExchangeRequest) -> Result<OidcClaims, String> {
        let redirect = RedirectUrl::new(request.redirect_url)
            .map_err(|e| format!("invalid OIDC redirect_url: {e}"))?;
        let client = CoreClient::from_provider_metadata(
            request.metadata,
            ClientId::new(request.client_id),
            request.client_secret.map(ClientSecret::new),
        )
        .set_redirect_uri(redirect);

        let token_response = client
            .exchange_code(AuthorizationCode::new(request.code))
            .map_err(|e| format!("build token-exchange request: {e}"))?
            .set_pkce_verifier(request.pkce_verifier)
            .request_async(&self.http)
            .await
            .map_err(|e| format!("OIDC token exchange failed: {e}"))?;

        // `id_token()` returns `Option<&CoreIdToken>` borrowing from
        // `token_response`. Clone it so the lifetime tangle between
        // `token_response`, `client`, and the verifier in the next line
        // doesn't require us to hold every binding in one scope.
        let id_token = token_response
            .extra_fields()
            .id_token()
            .ok_or_else(|| "OIDC token response missing id_token".to_string())?
            .clone();
        // Library performs full standard verification: signature against
        // JWKS, audience, issuer match against metadata, nonce match,
        // expiry, etc.
        let claims = id_token
            .claims(&client.id_token_verifier(), &request.nonce)
            .map_err(|e| format!("OIDC id_token verification failed: {e}"))?;

        let issuer = claims.issuer().as_str().to_string();
        let subject = claims.subject().as_str().to_string();
        let email = claims.email().map(|e| e.as_str().to_string());
        let display_name = claims
            .name()
            .and_then(|n| n.get(None))
            .map(|n| n.as_str().to_string());
        // openidconnect's default Core claims don't expose `groups`.
        // OIDC `groups` is not a standard claim; the library ships only
        // the spec-defined claims unless we widen `CoreIdTokenClaims`
        // with a custom additional-claims type. Leaving empty for now;
        // group-based JIT provisioning is a follow-up.
        Ok(OidcClaims {
            issuer,
            subject,
            email,
            display_name,
            groups: Vec::new(),
        })
    }
}

/// Process-lifetime cache of [`CoreProviderMetadata`] keyed by provider
/// id, plus the code exchanger used by the callback handler. No TTL on
/// the metadata cache in v1 — refresh requires a process restart.
pub(crate) struct OidcDiscoveryCache {
    inner: RwLock<HashMap<String, CoreProviderMetadata>>,
    provider: Box<dyn OidcMetadataProvider>,
    pub exchanger: Box<dyn OidcCodeExchanger>,
}

impl std::fmt::Debug for OidcDiscoveryCache {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // dyn traits aren't Debug; surface only what is.
        f.debug_struct("OidcDiscoveryCache")
            .field("cached_issuers", &self.inner.read().ok().map(|g| g.len()))
            .finish_non_exhaustive()
    }
}

impl OidcDiscoveryCache {
    /// Construct from explicit metadata + exchanger implementations.
    /// Tests inject mocks via this entry point; production calls
    /// [`with_reqwest`] (which calls through here).
    pub fn with_components(
        provider: Box<dyn OidcMetadataProvider>,
        exchanger: Box<dyn OidcCodeExchanger>,
    ) -> Self {
        Self {
            inner: RwLock::new(HashMap::new()),
            provider,
            exchanger,
        }
    }

    /// Production constructor — uses `reqwest` for both halves.
    pub fn with_reqwest() -> Self {
        Self::with_components(
            Box::new(ReqwestMetadataProvider::new()),
            Box::new(ReqwestCodeExchanger::new()),
        )
    }

    pub async fn get_or_fetch(
        &self,
        issuer_id: &str,
        issuer_url: &str,
    ) -> Result<CoreProviderMetadata, String> {
        if let Some(cached) = self
            .inner
            .read()
            .expect("oidc discovery lock not poisoned")
            .get(issuer_id)
            .cloned()
        {
            return Ok(cached);
        }
        let fetched = self.provider.fetch(issuer_url).await?;
        self.inner
            .write()
            .expect("oidc discovery lock not poisoned")
            .insert(issuer_id.to_string(), fetched.clone());
        Ok(fetched)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use openidconnect::{Nonce, PkceCodeChallenge};

    fn fake_session(provider_id: &str, age_secs: u64, now_secs: u64) -> (String, OidcLoginSession) {
        let (_chal, verifier) = PkceCodeChallenge::new_random_sha256();
        let state = format!("state-{provider_id}-{age_secs}");
        let session = OidcLoginSession {
            provider_id: provider_id.to_string(),
            pkce_verifier: verifier,
            nonce: Nonce::new_random(),
            created_at_secs: now_secs - age_secs,
        };
        (state, session)
    }

    #[test]
    fn oidc_session_store_take_is_single_use() {
        let store = OidcSessionStore::new();
        let now = 1_000_000;
        let (state, session) = fake_session("dev", 0, now);
        store.insert(state.clone(), session, now).unwrap();

        assert!(store.take(&state).is_some(), "first take returns Some");
        assert!(store.take(&state).is_none(), "second take returns None");
    }

    #[test]
    fn oidc_session_store_evicts_expired_on_insert() {
        let store = OidcSessionStore::new();
        let now = 1_000_000;
        let (old_state, old_session) = fake_session("dev", OIDC_SESSION_TTL_SECS + 1, now);
        store
            .inner
            .lock()
            .unwrap()
            .insert(old_state.clone(), old_session);
        assert_eq!(store.len(), 1, "old session present before insert");

        let (new_state, new_session) = fake_session("dev", 0, now);
        store.insert(new_state, new_session, now).unwrap();

        assert!(
            store.take(&old_state).is_none(),
            "old session evicted on insert"
        );
    }

    #[test]
    fn oidc_session_store_returns_err_when_cap_hit() {
        let store = OidcSessionStore::new();
        let now = 1_000_000;

        for i in 0..OIDC_SESSION_MAX_ENTRIES {
            let (_chal, verifier) = PkceCodeChallenge::new_random_sha256();
            store.inner.lock().unwrap().insert(
                format!("state-{i}"),
                OidcLoginSession {
                    provider_id: "dev".to_string(),
                    pkce_verifier: verifier,
                    nonce: Nonce::new_random(),
                    created_at_secs: now,
                },
            );
        }
        assert_eq!(store.len(), OIDC_SESSION_MAX_ENTRIES);

        let (state, session) = fake_session("dev", 0, now);
        assert!(
            store.insert(state, session, now).is_err(),
            "insert at cap returns Err"
        );
    }
}
