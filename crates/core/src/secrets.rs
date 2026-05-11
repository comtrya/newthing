use crate::error::{CoreError, CoreResult};
use crate::events::{CoreEventType, EventActor, EventEnvelope, EventOutbox};
use crate::{ResourceRef, Visibility};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SecretGrant {
    pub read: Vec<String>,
    pub write: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SecretMetadata {
    pub name: String,
    pub key_material_id: String,
    pub ciphertext: String,
}

#[derive(Debug, Default, Clone)]
pub struct SecretStore {
    secrets: BTreeMap<String, SecretMetadata>,
}

impl SecretStore {
    pub fn write(
        &mut self,
        grant: &SecretGrant,
        name: impl Into<String>,
        ciphertext: impl Into<String>,
    ) -> CoreResult<()> {
        let name = name.into();
        if !grant.write.iter().any(|allowed| allowed == &name) {
            return Err(CoreError::forbidden(
                "extension cannot write secret",
                format!("comtrya://secret/{name}"),
                "secrets:write",
            ));
        }
        self.secrets.insert(
            name.clone(),
            SecretMetadata {
                name,
                key_material_id: "operator-managed".to_string(),
                ciphertext: ciphertext.into(),
            },
        );
        Ok(())
    }

    pub fn read(
        &self,
        grant: &SecretGrant,
        name: &str,
        outbox: &mut EventOutbox,
    ) -> CoreResult<String> {
        if !grant.read.iter().any(|allowed| allowed == name) {
            return Err(CoreError::forbidden(
                "extension cannot read secret",
                format!("comtrya://secret/{name}"),
                "secrets:read",
            ));
        }
        let secret = self
            .secrets
            .get(name)
            .ok_or_else(|| CoreError::bad_user_input("unknown secret"))?;
        let source =
            ResourceRef::parse("comtrya://secret/sec_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        outbox.append(EventEnvelope::core(
            CoreEventType::SecretAccessed,
            source.clone(),
            Some(name.to_string()),
            EventActor {
                kind: "extension".to_string(),
                uri: "comtrya://extension/ext_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
                display_name: None,
            },
            Visibility::Private,
            vec![source],
            "{}",
        ));
        Ok(secret.ciphertext.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn secret_store_enforces_read_write_grants_and_audits_access() {
        let grant = SecretGrant {
            read: vec!["github-token".to_string()],
            write: vec!["github-token".to_string()],
        };
        let mut store = SecretStore::default();
        let mut outbox = EventOutbox::default();

        store
            .write(&grant, "github-token", "ciphertext")
            .expect("write grant is present");
        assert_eq!(
            store.read(&grant, "github-token", &mut outbox).unwrap(),
            "ciphertext"
        );
        assert_eq!(
            outbox.all()[0].event_type,
            CoreEventType::SecretAccessed.as_str()
        );
    }

    #[test]
    fn secret_store_denies_missing_grant() {
        let grant = SecretGrant {
            read: Vec::new(),
            write: Vec::new(),
        };

        assert_eq!(
            SecretStore::default()
                .write(&grant, "github-token", "ciphertext")
                .unwrap_err()
                .code,
            crate::ErrorCode::Forbidden
        );
    }
}
