//! Code generation from the per-extension WIT into a TypeScript client
//! (consumed by the frontend SDK).
//!
//! The kernel-side WIT package `comtrya:platform` provides the host
//! interfaces; each extension supplies its own per-extension WIT that
//! depends on it and exports one or more `ops` interfaces. This crate
//! walks the parsed per-extension WIT, identifies exported op interfaces,
//! and produces one [`OpSpec`] per exported op.
//!
//! [`render_ts_client`] turns those specs into a TypeScript module whose
//! methods route inputs through `@comtrya/sdk-core`'s `invokeOp`,
//! which delegates to the loaded WASM component. Currently the inputs and
//! outputs are typed as `unknown` — a phase-2 upgrade (#103) will walk the
//! WIT type definitions and emit per-op TS interfaces instead.
//! The Rust dispatch table is generated separately by
//! `crates/server/build.rs`, not here.

use std::collections::BTreeMap;
use std::path::Path;

use anyhow::{Context, Result};
use wit_parser::{Resolve, WorldKey};

/// One op the kernel knows how to dispatch. Lives in an interface
/// declared inside the extension's per-extension WIT.
#[derive(Debug, Clone)]
pub struct OpSpec {
    /// `<extension-id>.<interface-name>.<op-name>` — the dotted route
    /// the kernel's match table uses.
    pub route: String,
    /// `<extension-id>` — kernel uses this to find the loaded WASM.
    pub extension_id: String,
    /// `<interface-name>` — used for client namespace grouping.
    pub interface_name: String,
    /// `<op-name>` — kebab-case WIT name (e.g. `close-record`).
    pub op_name: String,
}

pub fn kebab_to_camel(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut upper = false;
    for ch in s.chars() {
        if ch == '-' || ch == '_' {
            upper = true;
        } else if upper {
            out.extend(ch.to_uppercase());
            upper = false;
        } else {
            out.push(ch);
        }
    }
    out
}

/// Walk a per-extension WIT package and produce one `OpSpec` per
/// exported op found in any `ops`-shaped interface. The `extension_id`
/// is the manifest's id; it's used to build the dispatch route.
///
/// `dep_paths` lists additional WIT package directories the resolver
/// must know about — at minimum, the `comtrya:platform` package the
/// per-extension WIT depends on via `use` and `include`.
pub fn parse_extension_wit(
    wit_path: &Path,
    extension_id: &str,
    dep_paths: &[&Path],
) -> Result<Vec<OpSpec>> {
    let mut resolve = Resolve::default();
    // Push dependencies first so the main package can resolve `use`
    // references to them.
    for dep in dep_paths {
        resolve
            .push_dir(dep)
            .with_context(|| format!("failed to parse dep WIT at {}", dep.display()))?;
    }
    let (package_id, _) = resolve
        .push_dir(wit_path)
        .with_context(|| format!("failed to parse WIT at {}", wit_path.display()))?;
    let package = &resolve.packages[package_id];

    let mut ops = Vec::new();
    let main_package_name = package.name.clone();
    for (_world_name, world_id) in &package.worlds {
        let world = &resolve.worlds[*world_id];
        for (key, item) in &world.exports {
            let iface_id = match item {
                wit_parser::WorldItem::Interface { id, .. } => id,
                _ => continue,
            };
            let iface = &resolve.interfaces[*iface_id];
            // Skip exports that come from a different package than the
            // per-extension package — these are kernel-callable exports
            // (e.g. `reactor` from `comtrya:platform`) that the kernel
            // invokes directly via `on-event` / `subscribed-event-types`,
            // not via the extension op dispatch table.
            if let Some(pkg_id) = iface.package
                && resolve.packages[pkg_id].name != main_package_name
            {
                continue;
            }
            let iface_name = match key {
                WorldKey::Name(n) => n.clone(),
                WorldKey::Interface(id) => resolve.interfaces[*id]
                    .name
                    .clone()
                    .unwrap_or_else(|| format!("iface{}", id.index())),
            };
            for fn_name in iface.functions.keys() {
                let route = format!("{}.{}.{}", extension_id, iface_name, fn_name);
                ops.push(OpSpec {
                    route,
                    extension_id: extension_id.to_string(),
                    interface_name: iface_name.clone(),
                    op_name: fn_name.clone(),
                });
            }
        }
    }
    Ok(ops)
}

/// Render an OpSpec list as a TypeScript module exporting one method per op.
///
/// **Current state (phase 1 — routing only):** every method is emitted as
/// `(input?: unknown): Promise<OpResult<unknown>>`. The WIT record/variant
/// types carried by each op's params and results are NOT yet propagated into
/// the generated TypeScript — type safety at the call site depends on the
/// caller's own cast. This is a known gap tracked in issue #103.
///
/// **Planned (phase 2 — typed inputs/outputs):** walk the WIT `Function`
/// params and results, emit a TS `interface` per WIT record and a TS
/// discriminated-union per WIT variant, then specialise each method signature
/// as `(input: OpenIssueInput): Promise<OpResult<Issue>>`. Requires extending
/// `OpSpec` to carry the resolved `wit_parser::TypeDefKind` for each param
/// and result position.
pub fn render_ts_client(ops: &[OpSpec]) -> String {
    let mut out = String::new();
    out.push_str("// AUTO-GENERATED by comtrya-wit-codegen — DO NOT EDIT.\n");
    out.push_str(
        "// Re-run `cargo run -p comtrya-wit-codegen -- <ext_id> <wit_dir> <out_dir>` to refresh.\n",
    );
    out.push_str("// Requires the @comtrya/sdk-core runtime (`invokeOp`, `OpResult`).\n\n");
    out.push_str("import { invokeOp, type OpResult } from \"@comtrya/sdk-core\";\n\n");

    // Group ops by interface name to produce one namespace per interface.
    let mut by_iface: BTreeMap<String, Vec<&OpSpec>> = BTreeMap::new();
    for op in ops {
        by_iface
            .entry(format!("{}::{}", op.extension_id, op.interface_name))
            .or_default()
            .push(op);
    }
    for (group, group_ops) in &by_iface {
        // Group key is "<ext-id>::<iface>" — using "::" (not valid in
        // WIT identifiers) guarantees no collision with extension ids
        // that happen to contain underscores.
        let safe_name = kebab_to_camel(&group.replace("::", "_x_"));
        out.push_str(&format!("export const {} = {{\n", safe_name));
        for op in group_ops {
            out.push_str(&format!("  /** {} */\n", op.route));
            out.push_str(&format!(
                "  {}: async (input?: unknown): Promise<OpResult<unknown>> =>\n",
                kebab_to_camel(&op.op_name)
            ));
            out.push_str(&format!(
                "    invokeOp(\"{}\", \"{}\", \"{}\", input),\n",
                op.extension_id, op.interface_name, op.op_name
            ));
        }
        out.push_str("};\n\n");
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kebab_case_conversions() {
        assert_eq!(kebab_to_camel("close-record"), "closeRecord");
        assert_eq!(kebab_to_camel("a-b-c"), "aBC");
    }

    #[test]
    fn render_ts_client_groups_by_interface() {
        let ops = vec![
            OpSpec {
                route: "ext_sample.records.close-record".to_string(),
                extension_id: "ext_sample".to_string(),
                interface_name: "records".to_string(),
                op_name: "close-record".to_string(),
            },
            OpSpec {
                route: "ext_sample.records.get-record".to_string(),
                extension_id: "ext_sample".to_string(),
                interface_name: "records".to_string(),
                op_name: "get-record".to_string(),
            },
        ];
        let out = render_ts_client(&ops);
        assert!(
            out.contains("export const extSampleXRecords = {"),
            "{}",
            out
        );
        assert!(out.contains("closeRecord: async"));
        assert!(out.contains("getRecord: async"));
    }
}
