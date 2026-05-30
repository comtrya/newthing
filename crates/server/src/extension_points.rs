//! Declarative cross-extension integration points (`provides` / `requires`).
//!
//! Replaces the flat `allowedCrossCalls` string allowlist for *synchronous*
//! `ops.invoke` authorisation. A provider declares named, versioned
//! [`ProvidedPoint`]s — each a committed set of ops other extensions may
//! call. A consumer declares [`RequiredPoint`]s naming an exact
//! `(provider, point, version)`. At load the kernel resolves every
//! requirement into an immutable per-consumer [`ConsumerBindings`]; a
//! synchronous cross-call is authorised only when the binding permits the
//! exact `(provider, op)` pair.
//!
//! Resolution is **fail closed**: an unresolved requirement (unknown
//! provider, missing point, or version mismatch) is an error that aborts
//! the load rather than silently yielding an empty binding a later check
//! might read as "allowed". A consumer with no resolved bindings permits
//! no cross-calls at all.
//!
//! Reactor mutations are a separate, asynchronous path gated by
//! `reactor.allowedMutations`; they are intentionally not modelled here.

use std::collections::{BTreeMap, BTreeSet};

/// A named, versioned set of ops a provider exposes for other extensions
/// to call. `ops` are canonical `"<interface>.<op>"` descriptors.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProvidedPoint {
    pub id: String,
    pub version: u32,
    pub ops: Vec<String>,
}

/// A consumer's requirement for an exact provider point + version.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequiredPoint {
    pub provider: String,
    pub point: String,
    pub version: u32,
}

/// One extension's extension-point declarations, as parsed from its
/// manifest. The unit of input to [`resolve_bindings`].
#[derive(Debug, Clone, Default)]
pub struct ExtensionPointDecls {
    pub id: String,
    pub provides: Vec<ProvidedPoint>,
    pub requires: Vec<RequiredPoint>,
}

/// The immutable set of `(provider, op)` pairs one consumer may invoke,
/// resolved from its requirements against providers' declared points. An
/// empty set permits nothing.
#[derive(Debug, Clone, Default)]
pub struct ConsumerBindings {
    allowed: BTreeSet<(String, String)>,
}

impl ConsumerBindings {
    /// Whether this consumer may synchronously invoke `op` on
    /// `provider`. The op must belong to a resolved binding whose
    /// provider is exactly `provider` — a different extension declaring a
    /// point with the same id cannot widen this consumer's reach, because
    /// resolution recorded the provider the requirement named.
    pub fn permits(&self, provider: &str, op: &str) -> bool {
        self.allowed
            .contains(&(provider.to_string(), op.to_string()))
    }

    #[cfg(test)]
    pub fn from_pairs<'a>(pairs: impl IntoIterator<Item = (&'a str, &'a str)>) -> Self {
        ConsumerBindings {
            allowed: pairs
                .into_iter()
                .map(|(p, o)| (p.to_string(), o.to_string()))
                .collect(),
        }
    }
}

/// Resolve every consumer's requirements against the set of provided
/// points across all loaded extensions. Returns one [`ConsumerBindings`]
/// per consumer that declares requirements.
///
/// Fails closed on: a duplicate `(provider, point, version)` declaration,
/// a duplicate `(provider, point)` requirement, an unknown provider, a
/// missing point, a version mismatch, or a cycle in the consumer→provider
/// graph (which, combined with the runtime depth cap, would otherwise
/// allow accidental mutual recursion between extensions).
pub fn resolve_bindings(
    decls: &[ExtensionPointDecls],
) -> Result<BTreeMap<String, ConsumerBindings>, String> {
    // Index providers: (provider_id, point_id, version) -> ops. Reject
    // duplicate declarations so a point's op set is unambiguous.
    let mut provided: BTreeMap<(String, String, u32), Vec<String>> = BTreeMap::new();
    for decl in decls {
        for point in &decl.provides {
            let key = (decl.id.clone(), point.id.clone(), point.version);
            if provided.insert(key, point.ops.clone()).is_some() {
                return Err(format!(
                    "{} declares extension point '{}' v{} more than once",
                    decl.id, point.id, point.version
                ));
            }
        }
    }

    // Resolve each consumer's requirements. Build consumer→provider edges
    // for cycle detection as we go.
    let mut bindings: BTreeMap<String, ConsumerBindings> = BTreeMap::new();
    let mut edges: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for decl in decls {
        if decl.requires.is_empty() {
            continue;
        }
        let mut seen: BTreeSet<(String, String)> = BTreeSet::new();
        let mut allowed: BTreeSet<(String, String)> = BTreeSet::new();
        for req in &decl.requires {
            if !seen.insert((req.provider.clone(), req.point.clone())) {
                return Err(format!(
                    "{} requires extension point '{}/{}' more than once",
                    decl.id, req.provider, req.point
                ));
            }
            let ops = provided
                .get(&(req.provider.clone(), req.point.clone(), req.version))
                .ok_or_else(|| {
                    format!(
                        "{} requires extension point '{}/{}' v{} but no loaded extension provides it",
                        decl.id, req.provider, req.point, req.version
                    )
                })?;
            for op in ops {
                allowed.insert((req.provider.clone(), op.clone()));
            }
            edges
                .entry(decl.id.clone())
                .or_default()
                .insert(req.provider.clone());
        }
        bindings.insert(decl.id.clone(), ConsumerBindings { allowed });
    }

    detect_cycle(&edges)?;
    Ok(bindings)
}

/// Detect a cycle in the consumer→provider requirement graph via DFS.
fn detect_cycle(edges: &BTreeMap<String, BTreeSet<String>>) -> Result<(), String> {
    #[derive(Clone, Copy, PartialEq)]
    enum Mark {
        InProgress,
        Done,
    }
    fn visit(
        node: &str,
        edges: &BTreeMap<String, BTreeSet<String>>,
        marks: &mut BTreeMap<String, Mark>,
    ) -> Result<(), String> {
        match marks.get(node) {
            Some(Mark::Done) => return Ok(()),
            Some(Mark::InProgress) => {
                return Err(format!(
                    "extension point requirements form a cycle through '{node}'"
                ));
            }
            None => {}
        }
        marks.insert(node.to_string(), Mark::InProgress);
        if let Some(neighbours) = edges.get(node) {
            for next in neighbours {
                visit(next, edges, marks)?;
            }
        }
        marks.insert(node.to_string(), Mark::Done);
        Ok(())
    }
    let mut marks: BTreeMap<String, Mark> = BTreeMap::new();
    for node in edges.keys() {
        visit(node, edges, &mut marks)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn provider(id: &str, point: &str, version: u32, ops: &[&str]) -> ExtensionPointDecls {
        ExtensionPointDecls {
            id: id.to_string(),
            provides: vec![ProvidedPoint {
                id: point.to_string(),
                version,
                ops: ops.iter().map(|s| s.to_string()).collect(),
            }],
            requires: vec![],
        }
    }

    fn consumer(id: &str, provider: &str, point: &str, version: u32) -> ExtensionPointDecls {
        ExtensionPointDecls {
            id: id.to_string(),
            provides: vec![],
            requires: vec![RequiredPoint {
                provider: provider.to_string(),
                point: point.to_string(),
                version,
            }],
        }
    }

    #[test]
    fn resolves_consumer_to_provider_ops() {
        let decls = vec![
            provider(
                "ext_issues",
                "issue-membership",
                1,
                &["issues.state-counts-for-refs-issue"],
            ),
            consumer("ext_epics", "ext_issues", "issue-membership", 1),
        ];
        let bindings = resolve_bindings(&decls).expect("resolve");
        let epics = bindings.get("ext_epics").expect("epics bindings");
        assert!(epics.permits("ext_issues", "issues.state-counts-for-refs-issue"));
        // Not the provider declared → denied.
        assert!(!epics.permits("ext_checks", "issues.state-counts-for-refs-issue"));
        // Op not in the point → denied.
        assert!(!epics.permits("ext_issues", "issues.close-issue"));
        // A non-consumer has no bindings entry at all.
        assert!(!bindings.contains_key("ext_issues"));
    }

    #[test]
    fn unresolved_requirement_fails_closed() {
        let decls = vec![consumer("ext_epics", "ext_issues", "issue-membership", 1)];
        let err = resolve_bindings(&decls).expect_err("must fail: no provider");
        assert!(err.contains("no loaded extension provides"), "got: {err}");
    }

    #[test]
    fn version_mismatch_fails_closed() {
        let decls = vec![
            provider(
                "ext_issues",
                "issue-membership",
                2,
                &["issues.state-counts-for-refs-issue"],
            ),
            consumer("ext_epics", "ext_issues", "issue-membership", 1),
        ];
        let err = resolve_bindings(&decls).expect_err("must fail: v1 != v2");
        assert!(err.contains("v1"), "got: {err}");
    }

    #[test]
    fn op_spoofing_superset_point_does_not_widen_other_consumer() {
        // A second extension declares a point with the SAME id but extra
        // ops. ext_epics required ext_issues' point; the superset from
        // ext_evil must not leak into ext_epics' bindings.
        let decls = vec![
            provider(
                "ext_issues",
                "issue-membership",
                1,
                &["issues.state-counts-for-refs-issue"],
            ),
            provider(
                "ext_evil",
                "issue-membership",
                1,
                &["issues.state-counts-for-refs-issue", "issues.close-issue"],
            ),
            consumer("ext_epics", "ext_issues", "issue-membership", 1),
        ];
        let bindings = resolve_bindings(&decls).expect("resolve");
        let epics = bindings.get("ext_epics").expect("epics bindings");
        assert!(epics.permits("ext_issues", "issues.state-counts-for-refs-issue"));
        // The op only ext_evil offered is NOT reachable on either provider.
        assert!(!epics.permits("ext_issues", "issues.close-issue"));
        assert!(!epics.permits("ext_evil", "issues.close-issue"));
    }

    #[test]
    fn duplicate_provided_point_fails() {
        let decls = vec![ExtensionPointDecls {
            id: "ext_issues".to_string(),
            provides: vec![
                ProvidedPoint {
                    id: "p".to_string(),
                    version: 1,
                    ops: vec!["i.a".to_string()],
                },
                ProvidedPoint {
                    id: "p".to_string(),
                    version: 1,
                    ops: vec!["i.b".to_string()],
                },
            ],
            requires: vec![],
        }];
        let err = resolve_bindings(&decls).expect_err("duplicate provide");
        assert!(err.contains("more than once"), "got: {err}");
    }

    #[test]
    fn duplicate_requirement_fails() {
        let decls = vec![
            provider("ext_issues", "p", 1, &["i.a"]),
            ExtensionPointDecls {
                id: "ext_epics".to_string(),
                provides: vec![],
                requires: vec![
                    RequiredPoint {
                        provider: "ext_issues".into(),
                        point: "p".into(),
                        version: 1,
                    },
                    RequiredPoint {
                        provider: "ext_issues".into(),
                        point: "p".into(),
                        version: 1,
                    },
                ],
            },
        ];
        let err = resolve_bindings(&decls).expect_err("duplicate require");
        assert!(err.contains("more than once"), "got: {err}");
    }

    #[test]
    fn cycle_in_requirements_fails() {
        // a requires b's point, b requires a's point → cycle.
        let decls = vec![
            ExtensionPointDecls {
                id: "ext_a".to_string(),
                provides: vec![ProvidedPoint {
                    id: "pa".into(),
                    version: 1,
                    ops: vec!["a.op".into()],
                }],
                requires: vec![RequiredPoint {
                    provider: "ext_b".into(),
                    point: "pb".into(),
                    version: 1,
                }],
            },
            ExtensionPointDecls {
                id: "ext_b".to_string(),
                provides: vec![ProvidedPoint {
                    id: "pb".into(),
                    version: 1,
                    ops: vec!["b.op".into()],
                }],
                requires: vec![RequiredPoint {
                    provider: "ext_a".into(),
                    point: "pa".into(),
                    version: 1,
                }],
            },
        ];
        let err = resolve_bindings(&decls).expect_err("cycle");
        assert!(err.contains("cycle"), "got: {err}");
    }

    #[test]
    fn no_declarations_resolves_empty() {
        let bindings = resolve_bindings(&[]).expect("resolve empty");
        assert!(bindings.is_empty());
    }
}
