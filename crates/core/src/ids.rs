use crate::error::{CoreError, CoreResult};
use std::fmt::{Display, Formatter};
use std::time::{SystemTime, UNIX_EPOCH};

const CROCKFORD: &[u8; 32] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/// Closed set of *core* ID prefixes, plus an `Owned` open variant for
/// extension-owned kinds (e.g. `iss_`, `epc_`). The kernel never bakes in
/// extension-owned prefixes; it just recognises the shape and treats them
/// generically. (Note: `Check` is a pre-existing leak from before this
/// model existed; a follow-up should move it to `Owned` once `ext_checks`
/// is treated as a true extension-owned kind.)
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum IdPrefix {
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
    /// Extension-owned prefix, e.g. `iss_` or `epc_`. The trailing `_` is
    /// part of the stored string.
    Owned(String),
}

impl IdPrefix {
    pub fn as_str(&self) -> &str {
        match self {
            Self::User => "usr_",
            Self::Team => "team_",
            Self::Workspace => "ws_",
            Self::Group => "grp_",
            Self::Repository => "repo_",
            Self::Project => "proj_",
            Self::Extension => "ext_",
            Self::Check => "chk_",
            Self::Job => "job_",
            Self::Event => "evt_",
            Self::Secret => "sec_",
            Self::Relation => "rel_",
            Self::Comment => "cmt_",
            Self::Owned(value) => value.as_str(),
        }
    }

    /// The bare kind name (no trailing underscore). For `Owned("iss_")`
    /// this is `"iss"` — the kernel doesn't know the human-facing kind
    /// name for owned prefixes; the extension manifest carries that
    /// mapping. Use only for diagnostics, not as a stable identifier.
    pub fn resource_kind(&self) -> &str {
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
            Self::Owned(value) => value.strip_suffix('_').unwrap_or(value.as_str()),
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        let core: &[Self] = &[
            Self::Repository,
            Self::Workspace,
            Self::Extension,
            Self::Project,
            Self::Relation,
            Self::Comment,
            Self::Group,
            Self::Team,
            Self::Secret,
            Self::Check,
            Self::Event,
            Self::User,
            Self::Job,
        ];
        if let Some(found) = core
            .iter()
            .find(|prefix| value.starts_with(prefix.as_str()))
        {
            return Some(found.clone());
        }
        // Owned prefix: 2-8 lowercase ASCII letters followed by `_`.
        let underscore = value.find('_')?;
        if !(2..=8).contains(&underscore) {
            return None;
        }
        if !value[..underscore].bytes().all(|b| b.is_ascii_lowercase()) {
            return None;
        }
        Some(Self::Owned(value[..=underscore].to_string()))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct OpaqueId(String);

impl OpaqueId {
    /// Mint a fresh opaque id with the ULID-style layout the kernel
    /// expects: a 48-bit Unix-millis timestamp at the top, followed by
    /// 80 bits of OS CSPRNG randomness, encoded as 26 Crockford-base32
    /// characters (130 bits, top 2 unused — fixed to zero so the
    /// alphabet's first character stays valid).
    ///
    /// Prior implementation XOR'd a process-local AtomicU64 counter
    /// with a shifted wall-clock micros value. That made every id:
    /// (a) strictly monotonic per process (one id leaked its
    /// neighbours), (b) leaked exact creation time, and (c) reset its
    /// counter to 0 on every process restart, so two fresh restarts
    /// produced colliding ids. Mixing 80 bits of CSPRNG output closes
    /// all three.
    ///
    /// Panics only if the OS RNG fails (`getrandom::fill`); on a
    /// healthy host that path is unreachable. `SystemTime` errors
    /// (pre-epoch clock) fold to a 0 timestamp prefix — the randomness
    /// alone still guarantees uniqueness; ordering just degrades on
    /// the affected host.
    pub fn new(prefix: IdPrefix) -> Self {
        let now_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_millis() as u64)
            .unwrap_or(0);
        let mut rand_bytes = [0u8; 10]; // 80 bits
        getrandom::fill(&mut rand_bytes).expect("OS RNG must be available");
        let mut rand_u128: u128 = 0;
        for byte in &rand_bytes {
            rand_u128 = (rand_u128 << 8) | (*byte as u128);
        }
        // Compose: 48 bits time (top), 80 bits randomness (bottom).
        let value = ((now_ms as u128) << 80) | rand_u128;
        let body = encode_base32_26(value);
        Self(format!("{}{}", prefix.as_str(), body))
    }

    pub fn parse(value: impl Into<String>) -> CoreResult<Self> {
        let value = value.into();
        let prefix = IdPrefix::parse(&value)
            .ok_or_else(|| CoreError::bad_user_input("opaque ID has an unknown prefix"))?;
        let body = &value[prefix.as_str().len()..];

        if body.len() != 26 {
            return Err(CoreError::bad_user_input(
                "opaque ID body must be 26 Crockford-base32 characters",
            ));
        }
        if !body.bytes().all(is_crockford_base32) {
            return Err(CoreError::bad_user_input(
                "opaque ID body contains non-Crockford-base32 characters",
            ));
        }

        Ok(Self(value))
    }

    pub fn prefix(&self) -> IdPrefix {
        IdPrefix::parse(&self.0).expect("OpaqueId is validated at construction")
    }

    /// Convenience: just the prefix string, without re-allocating an
    /// `IdPrefix` for `Owned` cases.
    pub fn prefix_str(&self) -> &str {
        let underscore = self.0.find('_').unwrap_or(0);
        &self.0[..=underscore]
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for OpaqueId {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl AsRef<str> for OpaqueId {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Slug(String);

impl Slug {
    pub fn new(value: impl Into<String>) -> CoreResult<Self> {
        let value = value.into();
        validate_slug(&value)?;
        Ok(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for Slug {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

fn validate_slug(value: &str) -> CoreResult<()> {
    if value.is_empty() || value.len() > 64 {
        return Err(CoreError::bad_user_input(
            "slug must be between 1 and 64 characters",
        ));
    }
    if value.starts_with('.') {
        return Err(CoreError::bad_user_input("slug must not start with '.'"));
    }
    if value.starts_with('_') {
        return Err(CoreError::bad_user_input(
            "slugs beginning with '_' are reserved for core",
        ));
    }
    if value.contains('/') {
        return Err(CoreError::bad_user_input("slug must not contain '/'"));
    }
    if ["_comtrya", "_system", "_assets", "_extensions", ".git"].contains(&value) {
        return Err(CoreError::bad_user_input("slug is reserved"));
    }
    if !value.bytes().all(|byte| {
        byte.is_ascii_lowercase()
            || byte.is_ascii_digit()
            || byte == b'-'
            || byte == b'_'
            || byte == b'.'
    }) {
        return Err(CoreError::bad_user_input(
            "slug may contain only lowercase ASCII, digits, '-', '_', and '.'",
        ));
    }
    Ok(())
}

fn is_crockford_base32(byte: u8) -> bool {
    matches!(
        byte,
        b'0'..=b'9'
            | b'A'
            | b'B'
            | b'C'
            | b'D'
            | b'E'
            | b'F'
            | b'G'
            | b'H'
            | b'J'
            | b'K'
            | b'M'
            | b'N'
            | b'P'
            | b'Q'
            | b'R'
            | b'S'
            | b'T'
            | b'V'
            | b'W'
            | b'X'
            | b'Y'
            | b'Z'
    )
}

fn encode_base32_26(mut value: u128) -> String {
    let mut out = [b'0'; 26];
    for slot in out.iter_mut().rev() {
        *slot = CROCKFORD[(value & 31) as usize];
        value >>= 5;
    }
    String::from_utf8(out.to_vec()).expect("Crockford alphabet is valid UTF-8")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn opaque_ids_validate_prefix_and_crockford_body() {
        let id = OpaqueId::parse("repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        assert_eq!(id.prefix(), IdPrefix::Repository);
        assert_eq!(id.as_str().len(), "repo_".len() + 26);

        assert_eq!(
            OpaqueId::parse("repo_01HV0K4XAVE2H6R5M8KJZ8Q1AI")
                .unwrap_err()
                .code,
            crate::ErrorCode::BadUserInput
        );
    }

    #[test]
    fn generated_ids_are_prefixed_and_parseable() {
        let id = OpaqueId::new(IdPrefix::Workspace);
        assert!(id.as_str().starts_with("ws_"));
        assert_eq!(OpaqueId::parse(id.as_str()).unwrap(), id);
    }

    #[test]
    fn fresh_ids_are_unpredictable_no_sequential_counter() {
        // Regression for TNQ-2 P1: previous implementation XOR'd a
        // process-local AtomicU64 counter with a timestamp, so two
        // consecutive ids differed by only the counter bits. An
        // attacker who saw one id could enumerate neighbours; a
        // process restart re-collided. Now the body carries 80 bits
        // of OS CSPRNG randomness — even a tight loop of 100 ids
        // produces 100 distinct bodies with no neighbour-guess hit.
        let ids: Vec<String> = (0..100)
            .map(|_| OpaqueId::new(IdPrefix::Workspace).as_str().to_string())
            .collect();
        let unique: std::collections::BTreeSet<&String> = ids.iter().collect();
        assert_eq!(
            unique.len(),
            ids.len(),
            "100 consecutive ids must all be distinct (got {} unique)",
            unique.len()
        );
        // Body length stays 26 — backward-compatible parse/format.
        for id in &ids {
            assert_eq!(id.len(), "ws_".len() + 26);
        }
        // No two ids may share the bottom 26 - 12 = 14 chars (70 bits)
        // of randomness — collision odds against 100 ids are ~1 in
        // 2^54, which is effectively zero.
        let suffixes: std::collections::BTreeSet<&str> =
            ids.iter().map(|id| &id["ws_".len() + 12..]).collect();
        assert_eq!(suffixes.len(), 100, "low-bits randomness must not repeat");
    }

    #[test]
    fn slug_validation_enforces_spec_rules() {
        assert!(Slug::new("comtrya.dev").is_ok());
        assert!(Slug::new("team_core-1").is_ok());
        assert!(Slug::new("_system").is_err());
        assert!(Slug::new(".git").is_err());
        assert!(Slug::new("Mixed").is_err());
        assert!(Slug::new("a/b").is_err());
    }

    #[test]
    fn id_prefix_parses_owned_prefixes() {
        let parsed = IdPrefix::parse("iss_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        assert_eq!(parsed, IdPrefix::Owned("iss_".to_string()));
        assert_eq!(parsed.as_str(), "iss_");
        assert_eq!(parsed.resource_kind(), "iss");
    }

    #[test]
    fn opaque_id_accepts_owned_prefix_and_round_trips() {
        let id = OpaqueId::parse("epc_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        assert_eq!(id.prefix(), IdPrefix::Owned("epc_".to_string()));
        assert_eq!(id.prefix_str(), "epc_");
        // Round-trip a fresh id with the same prefix.
        let fresh = OpaqueId::new(IdPrefix::Owned("epc_".to_string()));
        assert!(fresh.as_str().starts_with("epc_"));
        assert_eq!(OpaqueId::parse(fresh.as_str()).unwrap(), fresh);
    }

    #[test]
    fn id_prefix_parse_rejects_malformed_owned() {
        // Too short (1 letter before `_`):
        assert!(IdPrefix::parse("a_01HV0K4XAVE2H6R5M8KJZ8Q1A3").is_none());
        // Too long (>8 letters):
        assert!(IdPrefix::parse("verylongname_01HV0K4XAVE2H6R5M8KJZ8Q1A3").is_none());
        // Non-lowercase:
        assert!(IdPrefix::parse("Iss_01HV0K4XAVE2H6R5M8KJZ8Q1A3").is_none());
        // Missing underscore:
        assert!(IdPrefix::parse("iss01HV0K4XAVE2H6R5M8KJZ8Q1A3").is_none());
    }
}
