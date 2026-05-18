//! OIDC scaffolding for the comtrya kernel.
//!
//! This module owns the in-memory state and discovery cache for the OIDC
//! login redirect flow at `/auth/oidc/:provider/login`. It deliberately
//! does NOT implement the callback verification path (`/auth/oidc/:provider/callback`
//! returns 501 from a sibling handler in `main.rs`) — that work lands in a
//! follow-up iteration of issue #16.
//!
//! Three types matter outside this module:
//!
//! * [`OidcLoginSession`] — a single in-flight PKCE+nonce pair, indexed by
//!   the CSRF state token sent to the IdP.
//! * [`OidcSessionStore`] — bounded in-memory map of sessions with TTL
//!   eviction-on-insert and a 10,000-entry hard cap (insert returns Err
//!   when the cap is hit so the caller can respond 429 cleanly).
//! * [`OidcDiscoveryCache`] — memoizes `CoreProviderMetadata` per issuer
//!   for the process lifetime. Operator note: if an IdP's discovery
//!   document changes, recovery requires a process restart. Refresh-on-
//!   rotation is a follow-up.
//!
//! The cache is generic over [`OidcMetadataProvider`] so tests can inject
//! a mock that returns a pre-built metadata value without making any
//! network requests.

use openidconnect::core::CoreProviderMetadata;
use openidconnect::{IssuerUrl, Nonce, PkceCodeVerifier};
use std::collections::HashMap;
use std::sync::{Mutex, RwLock};

/// Per-invocation PKCE + nonce material, indexed in the session store
/// by the CSRF state token sent to the IdP. Single-use: [`OidcSessionStore::take`]
/// removes the entry on retrieval so a replay returns `None`. Fields are
/// read by the callback handler in the follow-up iteration of #16;
/// allowed-dead here because the scaffolding ships before the consumer.
#[derive(Debug)]
#[allow(dead_code)]
pub(crate) struct OidcLoginSession {
    pub provider_id: String,
    pub pkce_verifier: PkceCodeVerifier,
    pub nonce: Nonce,
    pub created_at_secs: u64,
}

/// 30 minutes — matches typical OIDC implementations and is generous
/// enough for users who pause at MFA prompts. Earlier draft used 10 min;
/// adversarial review flagged that as too aggressive for real-world
/// authorization-code flows.
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

    /// Single-use retrieval — removes the entry on return. The callback
    /// handler in the follow-up iteration of issue #16 will use this in
    /// production; for now, gated on `cfg(test)` so it ships with the
    /// scaffolding without triggering the dead-code lint. The next PR
    /// removes the `cfg` gate.
    #[cfg(test)]
    pub fn take(&self, state: &str) -> Option<OidcLoginSession> {
        let mut guard = self.inner.lock().expect("oidc session lock not poisoned");
        guard.remove(state)
    }

    /// Drop all entries older than the cutoff. Useful only for tests
    /// today; production code calls eviction implicitly via [`insert`].
    /// `cfg(test)` for the same reason as [`take`].
    #[cfg(test)]
    pub fn evict_older_than(&self, cutoff_secs: u64) {
        let mut guard = self.inner.lock().expect("oidc session lock not poisoned");
        guard.retain(|_, s| s.created_at_secs >= cutoff_secs);
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

/// Process-lifetime cache of [`CoreProviderMetadata`] keyed by provider
/// id. No TTL in v1 — refresh requires a process restart, which is fine
/// for the production-testbed posture. Refresh-on-rotation is a
/// follow-up.
pub(crate) struct OidcDiscoveryCache {
    inner: RwLock<HashMap<String, CoreProviderMetadata>>,
    provider: Box<dyn OidcMetadataProvider>,
}

impl std::fmt::Debug for OidcDiscoveryCache {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // `dyn OidcMetadataProvider` is not Debug; surface only what is.
        f.debug_struct("OidcDiscoveryCache")
            .field("cached_issuers", &self.inner.read().ok().map(|g| g.len()))
            .finish_non_exhaustive()
    }
}

impl OidcDiscoveryCache {
    pub fn new(provider: Box<dyn OidcMetadataProvider>) -> Self {
        Self {
            inner: RwLock::new(HashMap::new()),
            provider,
        }
    }

    /// Production constructor — uses `reqwest` under the hood.
    pub fn with_reqwest() -> Self {
        Self::new(Box::new(ReqwestMetadataProvider::new()))
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

        // Fill to cap with fresh entries (eviction won't help).
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
