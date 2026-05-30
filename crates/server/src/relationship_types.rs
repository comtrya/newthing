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
//! [`RelationshipTypeRegistry::evaluate`] for the edge's
//! `(kind, source-kind, target-kind)` triple — yielding a [`RelationVerdict`]
//! of `Undeclared` (reject), `Allowed`, or `RequiresParticipation`.
//!
//! Enforcement is **fail closed**: an empty registry permits nothing, and
//! an undeclared triple is rejected. The shape check is purely structural —
//! the kernel learns no extension-specific meaning, only "is this edge
//! shape declared by some loaded extension". A shape may additionally carry
//! a declarative `requiresParticipation`: the source resource's repository
//! must have opted into the named extension. That rule — which restores the
//! participation gate the removed `epics.link-issue` op enforced — is
//! evaluated by the kernel from its own repo-opt-in state, not by the
//! owning extension, since the owner cannot see another resource's
//! repository.

use std::collections::BTreeSet;

/// One declared relationship shape: a verb `kind` plus the resource kinds
/// it may connect. `symmetric` types admit either endpoint orientation.
/// `requires_participation`, when set, names an extension whose per-repo
/// opt-in the *source* resource's repository must hold for an edge of this
/// shape to be created.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RelationshipShape {
    pub kind: String,
    pub source_kinds: BTreeSet<String>,
    pub target_kinds: BTreeSet<String>,
    pub symmetric: bool,
    pub requires_participation: Option<String>,
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

/// The verdict for a proposed relation edge: whether it matches a declared
/// shape and, if so, whether that shape additionally requires the source
/// repository to participate in a named extension.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RelationVerdict {
    /// No declared shape admits this edge — reject (fail closed).
    Undeclared,
    /// A declared shape admits the edge with no further requirement.
    Allowed,
    /// A declared shape admits the edge, but the source resource's
    /// repository must have opted into the named extension.
    RequiresParticipation(String),
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

    /// Evaluate a proposed edge against the declared shapes. Returns the
    /// first admitting shape's verdict, carrying any participation
    /// requirement so the write path can enforce it after the shape check.
    pub fn evaluate(&self, kind: &str, source_kind: &str, target_kind: &str) -> RelationVerdict {
        let Some(shape) = self
            .shapes
            .iter()
            .find(|shape| shape.admits(kind, source_kind, target_kind))
        else {
            return RelationVerdict::Undeclared;
        };
        match &shape.requires_participation {
            Some(ext) => RelationVerdict::RequiresParticipation(ext.clone()),
            None => RelationVerdict::Allowed,
        }
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
            requires_participation: None,
        }
    }

    /// Shape-level admission, ignoring participation — the edge matches some
    /// declared shape.
    fn permits(reg: &RelationshipTypeRegistry, kind: &str, src: &str, tgt: &str) -> bool {
        !matches!(reg.evaluate(kind, src, tgt), RelationVerdict::Undeclared)
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
        assert!(permits(&registry, "comtrya://rel/part-of", "issue", "epic"));
        assert!(permits(&registry, "comtrya://rel/part-of", "epic", "epic"));
        assert!(permits(
            &registry,
            "comtrya://rel/part-of",
            "issue",
            "issue"
        ));
    }

    #[test]
    fn rejects_undeclared_orientation() {
        let registry = first_party_registry();
        // No declared shape links epic -> issue for part-of.
        assert!(!permits(
            &registry,
            "comtrya://rel/part-of",
            "epic",
            "issue"
        ));
        // blocks is issue -> issue only.
        assert!(!permits(&registry, "comtrya://rel/blocks", "issue", "epic"));
    }

    #[test]
    fn rejects_undeclared_kind() {
        let registry = first_party_registry();
        assert!(!permits(
            &registry,
            "comtrya://rel/mentions",
            "issue",
            "issue"
        ));
    }

    #[test]
    fn symmetric_admits_both_orientations() {
        let registry = RelationshipTypeRegistry::new(vec![shape(
            "comtrya://rel/relates-to",
            &["issue"],
            &["epic"],
            true,
        )]);
        assert!(permits(
            &registry,
            "comtrya://rel/relates-to",
            "issue",
            "epic"
        ));
        assert!(permits(
            &registry,
            "comtrya://rel/relates-to",
            "epic",
            "issue"
        ));
    }

    #[test]
    fn empty_registry_permits_nothing() {
        let registry = RelationshipTypeRegistry::default();
        assert!(!permits(
            &registry,
            "comtrya://rel/part-of",
            "issue",
            "epic"
        ));
        assert_eq!(
            registry.evaluate("comtrya://rel/part-of", "issue", "epic"),
            RelationVerdict::Undeclared
        );
    }

    #[test]
    fn evaluate_surfaces_participation_requirement() {
        let registry = RelationshipTypeRegistry::new(vec![
            RelationshipShape {
                kind: "comtrya://rel/part-of".to_string(),
                source_kinds: ["issue".to_string()].into_iter().collect(),
                target_kinds: ["epic".to_string()].into_iter().collect(),
                symmetric: false,
                requires_participation: Some("ext_epics".to_string()),
            },
            shape("comtrya://rel/part-of", &["epic"], &["epic"], false),
        ]);
        assert_eq!(
            registry.evaluate("comtrya://rel/part-of", "issue", "epic"),
            RelationVerdict::RequiresParticipation("ext_epics".to_string())
        );
        // epic -> epic is declared without a participation requirement.
        assert_eq!(
            registry.evaluate("comtrya://rel/part-of", "epic", "epic"),
            RelationVerdict::Allowed
        );
        // Both are still "permitted" at the shape level.
        assert!(permits(&registry, "comtrya://rel/part-of", "issue", "epic"));
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
