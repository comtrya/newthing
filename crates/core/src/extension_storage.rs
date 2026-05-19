use crate::domain::Visibility;
use crate::error::{CoreError, CoreResult};
use crate::events::{EventEnvelope, EventOutbox};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CollectionDeclaration {
    pub name: String,
    pub resource_scoped: bool,
    pub visibility_field: Option<String>,
    pub indexes: Vec<IndexDeclaration>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IndexDeclaration {
    pub name: String,
    pub fields: Vec<String>,
    pub unique: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum QueryOp {
    Eq(String),
    Neq(String),
    Lt(String),
    Lte(String),
    Gt(String),
    Gte(String),
    In(Vec<String>),
    NotIn(Vec<String>),
    Prefix(String),
}

impl QueryOp {
    fn is_equality_like(&self) -> bool {
        matches!(self, Self::Eq(_) | Self::In(_))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QueryPredicate {
    pub field: String,
    pub op: QueryOp,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StorageQuery {
    pub collection: String,
    pub index: String,
    pub predicates: Vec<QueryPredicate>,
    pub first: usize,
    pub after: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExtensionDocument {
    pub id: String,
    pub json: String,
    pub resource_refs: Vec<String>,
    pub visibility: Option<Visibility>,
    pub version: u64,
}

#[derive(Debug, Default, Clone)]
pub struct ExtensionStorage {
    collections: BTreeMap<String, CollectionDeclaration>,
    documents: BTreeMap<(String, String), ExtensionDocument>,
}

impl ExtensionStorage {
    pub fn declare_collection(&mut self, declaration: CollectionDeclaration) -> CoreResult<()> {
        if declaration.name.trim().is_empty() || declaration.indexes.is_empty() {
            return Err(CoreError::bad_user_input(
                "collections require a name and at least one index",
            ));
        }
        self.collections
            .insert(declaration.name.clone(), declaration);
        Ok(())
    }

    pub fn validate_query(&self, query: &StorageQuery) -> CoreResult<()> {
        let collection = self
            .collections
            .get(&query.collection)
            .ok_or_else(|| CoreError::bad_user_input("unknown extension collection"))?;
        let index = collection
            .indexes
            .iter()
            .find(|index| index.name == query.index)
            .ok_or_else(|| CoreError::bad_user_input("unknown extension storage index"))?;

        for predicate in &query.predicates {
            let Some(position) = index
                .fields
                .iter()
                .position(|field| field == &predicate.field)
            else {
                return Err(CoreError::bad_user_input(format!(
                    "query predicate field {} is not covered by index {}",
                    predicate.field, index.name
                )));
            };
            if !predicate.op.is_equality_like() && position + 1 != index.fields.len() {
                return Err(CoreError::bad_user_input(
                    "range and prefix operators must target the trailing indexed field",
                ));
            }
        }
        Ok(())
    }

    pub fn transact(&mut self, tx: StorageTransaction, outbox: &mut EventOutbox) -> CoreResult<()> {
        for (_, document) in &tx.documents {
            if document.id.trim().is_empty() || !document.json.trim_start().starts_with('{') {
                return Err(CoreError::bad_user_input(
                    "extension documents must be JSON objects with stable IDs",
                ));
            }
        }
        for (collection, document) in tx.documents {
            self.documents
                .insert((collection, document.id.clone()), document);
        }
        for event in tx.events {
            outbox.append(event);
        }
        Ok(())
    }

    pub fn document(&self, collection: &str, id: &str) -> Option<&ExtensionDocument> {
        self.documents
            .get(&(collection.to_string(), id.to_string()))
    }
}

#[derive(Debug, Default, Clone)]
pub struct StorageTransaction {
    pub documents: Vec<(String, ExtensionDocument)>,
    pub events: Vec<EventEnvelope>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{CoreEventType, EventActor, ResourceRef};

    fn storage() -> ExtensionStorage {
        let mut storage = ExtensionStorage::default();
        storage
            .declare_collection(CollectionDeclaration {
                name: "pull_requests".to_string(),
                resource_scoped: true,
                visibility_field: Some("visibility".to_string()),
                indexes: vec![IndexDeclaration {
                    name: "by_repository_state_updated".to_string(),
                    fields: vec![
                        "repositoryID".to_string(),
                        "state".to_string(),
                        "updatedAt".to_string(),
                    ],
                    unique: false,
                }],
            })
            .unwrap();
        storage
    }

    #[test]
    fn query_operator_must_be_covered_by_chosen_index() {
        let storage = storage();
        let query = StorageQuery {
            collection: "pull_requests".to_string(),
            index: "by_repository_state_updated".to_string(),
            predicates: vec![QueryPredicate {
                field: "authorID".to_string(),
                op: QueryOp::Eq("usr_123".to_string()),
            }],
            first: 50,
            after: None,
        };

        assert_eq!(
            storage.validate_query(&query).unwrap_err().code,
            crate::ErrorCode::BadUserInput
        );
    }

    #[test]
    fn range_operator_must_target_trailing_index_field() {
        let storage = storage();
        let query = StorageQuery {
            collection: "pull_requests".to_string(),
            index: "by_repository_state_updated".to_string(),
            predicates: vec![QueryPredicate {
                field: "state".to_string(),
                op: QueryOp::Gt("OPEN".to_string()),
            }],
            first: 50,
            after: None,
        };

        assert_eq!(
            storage.validate_query(&query).unwrap_err().code,
            crate::ErrorCode::BadUserInput
        );
    }

    #[test]
    fn document_and_event_commit_atomically() {
        let mut storage = storage();
        let mut outbox = EventOutbox::default();
        let repo =
            ResourceRef::parse("comtrya://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap();
        let event = crate::EventEnvelope::core(
            CoreEventType::RepositoryUpdated,
            repo.clone(),
            None,
            EventActor {
                kind: "extension".to_string(),
                uri: "comtrya://extension/ext_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
                display_name: None,
            },
            Visibility::Private,
            vec![repo],
            "{}",
        );

        storage
            .transact(
                StorageTransaction {
                    documents: vec![(
                        "pull_requests".to_string(),
                        ExtensionDocument {
                            id: "pr_1".to_string(),
                            json: "{\"id\":\"pr_1\"}".to_string(),
                            resource_refs: Vec::new(),
                            visibility: Some(Visibility::Private),
                            version: 1,
                        },
                    )],
                    events: vec![event],
                },
                &mut outbox,
            )
            .unwrap();

        assert!(storage.document("pull_requests", "pr_1").is_some());
        assert_eq!(outbox.all().len(), 1);
    }
}
