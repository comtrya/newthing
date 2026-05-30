//! Per-op dispatch scope and repository-derivation route table.
//!
//! Replaces the scattered, hand-written `if op == "..."` pre-invoke gate
//! checks in each `dispatch_ext_*` (which hardcode the extension-id as a
//! literal string) with a typed table built once from the extension
//! manifest at load. The kernel consults the table in a single generic
//! gate wrapper (`wasm_invokers::gate_route_pre_invoke`).
//!
//! Scope of this table (slice 1): the **pre-invoke** gate phase — ops
//! whose target repository is carried inline on the op payload, so the
//! kernel can authorise before the component is instantiated. Ops that
//! must load a resource to learn its repository are gated in a separate
//! post-invoke phase and are not represented here yet.

use std::collections::BTreeMap;

/// How the kernel derives the repository ref a repository-scoped op gates
/// against. A typed enum, never a bare string on the dispatch path.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RepoDerivation {
    /// The repository URI is a named field on the op payload. Known
    /// before invoke, so the gate runs pre-invoke. This is the only
    /// derivation a repository-scoped *mutation* or *collection read* may
    /// use, because both must be authorised before the component runs.
    PayloadField(String),
}

/// Whether an op is gated by the per-repository opt-in and, if so, how the
/// repository is derived.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DispatchScope {
    /// Always available; no per-repo opt-in gate. Instance-scoped
    /// resources span repositories (e.g. epics), as do batch reads whose
    /// refs span repositories.
    Instance,
    /// Gated by the target repository's `repository.extensions` opt-in,
    /// with the repository derived as described.
    Repository(RepoDerivation),
}

/// A single op's dispatch route, keyed in the [`RouteTable`] by its
/// canonical `"<interface>.<op>"` descriptor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DispatchRoute {
    pub scope: DispatchScope,
}

/// Per-extension map of canonical `"<interface>.<op>"` → [`DispatchRoute`].
/// Built from the manifest's `dispatchRoutes` at load and stored on the
/// loaded extension; consulted by the generic pre-invoke gate wrapper. An
/// op with no entry is not gated by this table (it is either instance
/// behaviour or gated in the post-invoke phase).
#[derive(Debug, Clone, Default)]
pub struct RouteTable {
    routes: BTreeMap<String, DispatchRoute>,
}

impl RouteTable {
    pub fn from_entries(entries: impl IntoIterator<Item = (String, DispatchRoute)>) -> Self {
        RouteTable {
            routes: entries.into_iter().collect(),
        }
    }

    /// The route for an op identified by interface + op name, joined as
    /// the canonical `"<interface>.<op>"` descriptor.
    pub fn get(&self, interface_name: &str, op_name: &str) -> Option<&DispatchRoute> {
        self.routes.get(&format!("{interface_name}.{op_name}"))
    }

    /// Canonical op descriptors declared in the table, for load-time
    /// cross-checking against the generated WIT route table.
    pub fn op_descriptors(&self) -> impl Iterator<Item = &str> {
        self.routes.keys().map(String::as_str)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lookup_joins_interface_and_op() {
        let table = RouteTable::from_entries([(
            "issues.open-issue".to_string(),
            DispatchRoute {
                scope: DispatchScope::Repository(RepoDerivation::PayloadField("repository".into())),
            },
        )]);
        assert!(table.get("issues", "open-issue").is_some());
        assert!(table.get("issues", "missing").is_none());
    }

    #[test]
    fn empty_table_has_no_routes() {
        let table = RouteTable::default();
        assert!(table.get("issues", "open-issue").is_none());
        assert_eq!(table.op_descriptors().count(), 0);
    }

    #[test]
    fn op_descriptors_lists_canonical_keys() {
        let table = RouteTable::from_entries([
            (
                "issues.open-issue".to_string(),
                DispatchRoute {
                    scope: DispatchScope::Repository(RepoDerivation::PayloadField(
                        "repository".into(),
                    )),
                },
            ),
            (
                "issues.by-refs-issue".to_string(),
                DispatchRoute {
                    scope: DispatchScope::Instance,
                },
            ),
        ]);
        let mut descriptors: Vec<&str> = table.op_descriptors().collect();
        descriptors.sort_unstable();
        assert_eq!(descriptors, vec!["issues.by-refs-issue", "issues.open-issue"]);
    }
}
