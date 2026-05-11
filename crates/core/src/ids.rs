use crate::error::{CoreError, CoreResult};
use std::fmt::{Display, Formatter};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

const CROCKFORD: &[u8; 32] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";

static COUNTER: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
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
}

impl IdPrefix {
    pub const fn as_str(self) -> &'static str {
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
        }
    }

    pub const fn resource_kind(self) -> &'static str {
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

    pub fn parse(value: &str) -> Option<Self> {
        let prefixes = [
            Self::Repository,
            Self::Workspace,
            Self::Extension,
            Self::Project,
            Self::Group,
            Self::Team,
            Self::Secret,
            Self::Check,
            Self::Event,
            Self::User,
            Self::Job,
        ];
        prefixes
            .into_iter()
            .find(|prefix| value.starts_with(prefix.as_str()))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct OpaqueId(String);

impl OpaqueId {
    pub fn new(prefix: IdPrefix) -> Self {
        let now_micros = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_micros())
            .unwrap_or_default();
        let sequence = COUNTER.fetch_add(1, Ordering::Relaxed) as u128;
        let body = encode_base32_26((now_micros << 24) ^ sequence);
        Self(format!("{}{}", prefix.as_str(), body))
    }

    pub fn from_str(value: impl Into<String>) -> CoreResult<Self> {
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
        let id = OpaqueId::from_str("repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        assert_eq!(id.prefix(), IdPrefix::Repository);
        assert_eq!(id.as_str().len(), "repo_".len() + 26);

        assert_eq!(
            OpaqueId::from_str("repo_01HV0K4XAVE2H6R5M8KJZ8Q1AI")
                .unwrap_err()
                .code,
            crate::ErrorCode::BadUserInput
        );
    }

    #[test]
    fn generated_ids_are_prefixed_and_parseable() {
        let id = OpaqueId::new(IdPrefix::Workspace);
        assert!(id.as_str().starts_with("ws_"));
        assert_eq!(OpaqueId::from_str(id.as_str()).unwrap(), id);
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
}
