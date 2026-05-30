//! Kernel-side enforcement of manifest-declared relationship types on the
//! relation **write** path.
//!
//! Every relationship an extension intends to exist is declared in its
//! manifest's `contributes.relationshipTypes` as a `(kind, sourceKinds,
//! targetKinds)` shape (e.g. `comtrya://rel/part-of` from `issue` to
//! `epic`). Those declarations drive the UI picker, but until now nothing
//! consulted them when a relation was actually created: both write paths
//! (`Runtime::create_relation` for the GraphQL/UI mutation and
//! `wit_relations::Host::create` for extension-initiated writes) validated
//! only URI shape. Any authenticated principal could therefore write an
//! arbitrary `(from, to, kind)` edge — including kinds no extension
//! declares and endpoint kinds no relationship type admits.
//!
//! This module closes that seam generically. The kernel aggregates every
//! loaded extension's declared shapes into one immutable
//! [`RelationshipTypeRegistry`] and both write paths ask
//! [`RelationshipTypeRegistry::permits`] whether the edge's
//! `(kind, source-kind, target-kind)` triple matches a declared shape.
//!
//! Enforcement is **fail closed**: an empty registry permits nothing, and
//! an undeclared triple is rejected. The check is purely structural — the
//! kernel learns no extension-specific meaning, only "is this edge shape
//! declared by some loaded extension". Extension-specific *business* rules
//! (e.g. a repository's opt-in to an instance-scoped extension) are a
//! separate, opt-in owner-authorisation concern layered on top of this
//! shape gate.

use std::collections::BTreeSet;

/// One declared relationship shape: a verb `kind` plus the resource kinds
/// it may connect. `symmetric` types admit either endpoint orientation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RelationshipShape {
    pub kind: String,
    pub source_kinds: BTreeSet<String>,
    pub target_kinds: BTreeSet<String>,
    pub symmetric: bool,
}

impl RelationshipShape {
    /// Whether this shape admits an edge of `kind` from `source_kind` to
    /// `target_kind`. A symmetric shape also admits the swapped
    /// orientation, since canonicalisation may reorder its endpoints.
    fn admits(&self, kind: &str, source_kind: &str, target_kind: &str) -> bool {
        if self.kind != kind {
            return false;
        }
        let forward =
            self.source_kinds.contains(source_kind) && self.target_kinds.contains(target_kind);
        if forward {
            return true;
        }
        self.symmetric
            && self.source_kinds.contains(target_kind)
            && self.target_kinds.contains(source_kind)
    }
}

/// The immutable, kernel-global set of declared relationship shapes,
/// aggregated across every loaded extension. Empty permits nothing.
#[derive(Debug, Clone, Default)]
pub struct RelationshipTypeRegistry {
    shapes: Vec<RelationshipShape>,
}

impl RelationshipTypeRegistry {
    pub fn new(shapes: Vec<RelationshipShape>) -> Self {
        Self { shapes }
    }

    /// Whether any declared shape admits an edge of `kind` connecting a
    /// `source_kind` resource to a `target_kind` resource. Fail closed:
    /// no matching shape means not permitted.
    pub fn permits(&self, kind: &str, source_kind: &str, target_kind: &str) -> bool {
        self.shapes
            .iter()
            .any(|shape| shape.admits(kind, source_kind, target_kind))
    }
}

/// Extract the resource-kind segment from a `comtrya://<kind>/<id>` (or
/// singleton `comtrya://<kind>`) reference. Returns `None` for any string
/// that is not a `comtrya://` reference. Mirrors the UI's
/// `comtrya://<kind>/` parse so the kernel keys on the same kind names the
/// manifest's `sourceKinds`/`targetKinds` use (`issue`, `epic`, …) rather
/// than going through `ResourceKind::parse`, which rejects
/// extension-owned kinds.
pub fn relation_kind_segment(reference: &str) -> Option<&str> {
    let rest = reference.strip_prefix("comtrya://")?;
    let segment = match rest.split_once('/') {
        Some((kind, _)) => kind,
        None => rest,
    };
    if segment.is_empty() {
        None
    } else {
        Some(segment)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn shape(kind: &str, src: &[&str], tgt: &[&str], symmetric: bool) -> RelationshipShape {
        RelationshipShape {
            kind: kind.to_string(),
            source_kinds: src.iter().map(|s| s.to_string()).collect(),
            target_kinds: tgt.iter().map(|s| s.to_string()).collect(),
            symmetric,
        }
    }

    fn first_party_registry() -> RelationshipTypeRegistry {
        // Mirrors the ext_issues + ext_epics manifests.
        RelationshipTypeRegistry::new(vec![
            shape("comtrya://rel/blocks", &["issue"], &["issue"], false),
            shape("comtrya://rel/part-of", &["issue"], &["issue"], false),
            shape("comtrya://rel/relates-to", &["issue"], &["issue"], true),
            shape("comtrya://rel/duplicates", &["issue"], &["issue"], false),
            shape("comtrya://rel/part-of", &["issue"], &["epic"], false),
            shape("comtrya://rel/part-of", &["epic"], &["epic"], false),
        ])
    }

    #[test]
    fn admits_declared_issue_epic_part_of() {
        let registry = first_party_registry();
        assert!(registry.permits("comtrya://rel/part-of", "issue", "epic"));
        assert!(registry.permits("comtrya://rel/part-of", "epic", "epic"));
        assert!(registry.permits("comtrya://rel/part-of", "issue", "issue"));
    }

    #[test]
    fn rejects_undeclared_orientation() {
        let registry = first_party_registry();
        // No declared shape links epic -> issue for part-of.
        assert!(!registry.permits("comtrya://rel/part-of", "epic", "issue"));
        // blocks is issue -> issue only.
        assert!(!registry.permits("comtrya://rel/blocks", "issue", "epic"));
    }

    #[test]
    fn rejects_undeclared_kind() {
        let registry = first_party_registry();
        assert!(!registry.permits("comtrya://rel/mentions", "issue", "issue"));
    }

    #[test]
    fn symmetric_admits_both_orientations() {
        let registry = RelationshipTypeRegistry::new(vec![shape(
            "comtrya://rel/relates-to",
            &["issue"],
            &["epic"],
            true,
        )]);
        assert!(registry.permits("comtrya://rel/relates-to", "issue", "epic"));
        assert!(registry.permits("comtrya://rel/relates-to", "epic", "issue"));
    }

    #[test]
    fn empty_registry_permits_nothing() {
        let registry = RelationshipTypeRegistry::default();
        assert!(!registry.permits("comtrya://rel/part-of", "issue", "epic"));
    }

    #[test]
    fn kind_segment_extraction() {
        assert_eq!(
            relation_kind_segment("comtrya://issue/iss_01ABC"),
            Some("issue")
        );
        assert_eq!(
            relation_kind_segment("comtrya://epic/epc_01ABC"),
            Some("epic")
        );
        assert_eq!(
            relation_kind_segment("comtrya://workspace"),
            Some("workspace")
        );
        assert_eq!(relation_kind_segment("not-a-ref"), None);
        assert_eq!(relation_kind_segment("comtrya://"), None);
    }
}
