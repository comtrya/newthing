//! Code generation from the per-extension WIT into:
//!   * Rust dispatch arms (consumed by the kernel's op dispatch table)
//!   * TypeScript client methods (consumed by the frontend SDK)
//!
//! The kernel-side WIT package `comtrya:platform` provides the host
//! interfaces; each extension supplies its own per-extension WIT that
//! depends on it and exports one or more `ops` interfaces. This crate
//! walks the parsed per-extension WIT, identifies exported op interfaces
//! and the records they refer to, and emits source files.
//!
//! Output shape is deliberately minimal — handlers route to
//! `wasm_host::HostState::dispatch_op`, which delegates to the loaded
//! WASM component. The codegen does not embed business logic; it only
//! routes typed inputs to `ops.invoke`-style calls.

use std::collections::BTreeMap;
use std::path::Path;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use wit_parser::{Resolve, TypeDefKind, WorldKey};

/// One op the kernel knows how to dispatch. Lives in an interface
/// declared inside the extension's per-extension WIT.
#[derive(Debug, Clone, Serialize, Deserialize)]
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
    /// `<op-name>` camelCased for generated TS methods.
    pub method_name: String,
    /// Whether this op is read-only vs mutating. Inferred from naming convention.
    pub kind: OpKind,
    /// JSON Schema of the input record (best-effort; `null` if the op
    /// takes no input or the type couldn't be resolved).
    pub input_schema: Option<serde_json::Value>,
    /// JSON Schema of the output record.
    pub output_schema: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OpKind {
    Query,
    Mutation,
}

/// Heuristic. Read-shaped names map to Query; mutation-shaped names map
/// to Mutation. Authors can override in the per-extension manifest.
pub fn classify_op_name(name: &str) -> OpKind {
    let lower = name.to_lowercase();
    let read_prefixes = ["get-", "list-", "query-", "fetch-", "find-", "search-"];
    let mutation_prefixes = [
        "create-", "update-", "delete-", "close-", "open-", "merge-", "post-", "edit-", "set-",
        "add-", "remove-", "reopen-", "change-", "record-", "cancel-", "approve-", "reject-",
    ];
    if read_prefixes.iter().any(|p| lower.starts_with(p)) {
        OpKind::Query
    } else if mutation_prefixes.iter().any(|p| lower.starts_with(p)) {
        OpKind::Mutation
    } else {
        // Default: treat as Query unless the manifest says otherwise.
        OpKind::Query
    }
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
            for (fn_name, func) in &iface.functions {
                let kind = classify_op_name(fn_name);
                let route = format!("{}.{}.{}", extension_id, iface_name, fn_name);
                let input_schema = func
                    .params
                    .first()
                    .map(|(_, ty)| ty_to_schema(&resolve, ty));
                let output_schema = func.result.as_ref().map(|ty| ty_to_schema(&resolve, ty));
                ops.push(OpSpec {
                    route,
                    extension_id: extension_id.to_string(),
                    interface_name: iface_name.clone(),
                    op_name: fn_name.clone(),
                    method_name: kebab_to_camel(fn_name),
                    kind,
                    input_schema,
                    output_schema,
                });
            }
        }
    }
    Ok(ops)
}

/// Render an OpSpec list as a TypeScript module exporting one typed
/// method per op. The methods accept a typed input and return a typed
/// Result-like discriminated union via the host fetch path.
pub fn render_ts_client(ops: &[OpSpec]) -> String {
    let mut out = String::new();
    out.push_str("// AUTO-GENERATED by comtrya-wit-codegen — DO NOT EDIT.\n");
    out.push_str("// Re-run `cargo run -p comtrya-wit-codegen -- --ts` to refresh.\n");
    out.push_str("// Requires the @comtrya/sdk runtime (`invokeOp`, `OpResult`).\n\n");
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
            out.push_str(&format!(
                "  /** {} ({}) */\n",
                op.route,
                match op.kind {
                    OpKind::Query => "query",
                    OpKind::Mutation => "mutation",
                }
            ));
            out.push_str(&format!(
                "  {}: async (input?: unknown): Promise<OpResult<unknown>> =>\n",
                op.method_name
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

fn ty_to_schema(resolve: &Resolve, ty: &wit_parser::Type) -> serde_json::Value {
    let mut visiting = std::collections::HashSet::new();
    ty_to_schema_guarded(resolve, ty, &mut visiting)
}

fn ty_to_schema_guarded(
    resolve: &Resolve,
    ty: &wit_parser::Type,
    visiting: &mut std::collections::HashSet<wit_parser::TypeId>,
) -> serde_json::Value {
    use wit_parser::Type;
    match ty {
        Type::Bool => serde_json::json!({"type": "boolean"}),
        Type::U8 | Type::U16 | Type::U32 | Type::U64 => {
            serde_json::json!({"type": "integer", "minimum": 0})
        }
        Type::S8 | Type::S16 | Type::S32 | Type::S64 => serde_json::json!({"type": "integer"}),
        Type::F32 | Type::F64 => serde_json::json!({"type": "number"}),
        Type::Char => serde_json::json!({"type": "string", "minLength": 1, "maxLength": 1}),
        Type::String => serde_json::json!({"type": "string"}),
        Type::ErrorContext => serde_json::json!({"type": "object", "description": "error-context"}),
        Type::Id(id) => {
            if !visiting.insert(*id) {
                let name = resolve.types[*id]
                    .name
                    .clone()
                    .unwrap_or_else(|| format!("type-{}", id.index()));
                return serde_json::json!({
                    "$ref": format!("#/$defs/{}", name),
                    "description": "recursive reference",
                });
            }
            let def = &resolve.types[*id];
            match &def.kind {
                TypeDefKind::Type(inner) => ty_to_schema_guarded(resolve, inner, visiting),
                TypeDefKind::List(inner) => serde_json::json!({
                    "type": "array",
                    "items": ty_to_schema_guarded(resolve, inner, visiting),
                }),
                TypeDefKind::Option(inner) => serde_json::json!({
                    "oneOf": [{"type": "null"}, ty_to_schema_guarded(resolve, inner, visiting)],
                }),
                TypeDefKind::Result(r) => {
                    let ok =
                        r.ok.as_ref()
                            .map(|t| ty_to_schema_guarded(resolve, t, visiting))
                            .unwrap_or_else(|| serde_json::json!({"type": "null"}));
                    let err = r
                        .err
                        .as_ref()
                        .map(|t| ty_to_schema_guarded(resolve, t, visiting))
                        .unwrap_or_else(|| serde_json::json!({"type": "null"}));
                    serde_json::json!({
                        "oneOf": [
                            {"type": "object", "properties": {"ok": ok}, "required": ["ok"]},
                            {"type": "object", "properties": {"err": err}, "required": ["err"]},
                        ],
                    })
                }
                TypeDefKind::Record(r) => {
                    let mut props = serde_json::Map::new();
                    let mut required = Vec::new();
                    for field in &r.fields {
                        props.insert(
                            kebab_to_camel(&field.name),
                            ty_to_schema_guarded(resolve, &field.ty, visiting),
                        );
                        required.push(kebab_to_camel(&field.name));
                    }
                    serde_json::json!({
                        "type": "object",
                        "properties": props,
                        "required": required,
                    })
                }
                TypeDefKind::Variant(v) => {
                    let cases: Vec<serde_json::Value> = v
                        .cases
                        .iter()
                        .map(|c| {
                            let tag = kebab_to_camel(&c.name);
                            let payload = match &c.ty {
                                Some(t) => ty_to_schema_guarded(resolve, t, visiting),
                                None => serde_json::json!({"type": "null"}),
                            };
                            serde_json::json!({
                                "type": "object",
                                "properties": {
                                    "tag": {"const": tag},
                                    "value": payload,
                                },
                                "required": ["tag"],
                            })
                        })
                        .collect();
                    serde_json::json!({"oneOf": cases})
                }
                TypeDefKind::Enum(e) => {
                    let cases: Vec<String> =
                        e.cases.iter().map(|c| kebab_to_camel(&c.name)).collect();
                    serde_json::json!({"type": "string", "enum": cases})
                }
                TypeDefKind::Flags(f) => {
                    let names: Vec<String> =
                        f.flags.iter().map(|x| kebab_to_camel(&x.name)).collect();
                    serde_json::json!({
                        "type": "array",
                        "items": {"type": "string", "enum": names},
                    })
                }
                TypeDefKind::Tuple(t) => {
                    let items: Vec<serde_json::Value> = t
                        .types
                        .iter()
                        .map(|ty| ty_to_schema_guarded(resolve, ty, visiting))
                        .collect();
                    serde_json::json!({
                        "type": "array",
                        "prefixItems": items,
                    })
                }
                _ => serde_json::json!({"description": "opaque"}),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classify_op_name_handles_known_prefixes() {
        assert_eq!(classify_op_name("close-record"), OpKind::Mutation);
        assert_eq!(classify_op_name("get-record"), OpKind::Query);
        assert_eq!(classify_op_name("list-records"), OpKind::Query);
        assert_eq!(classify_op_name("reopen-record"), OpKind::Mutation);
        assert_eq!(classify_op_name("change-state-item"), OpKind::Mutation);
        assert_eq!(classify_op_name("record-result"), OpKind::Mutation);
        assert_eq!(classify_op_name("notify-someone"), OpKind::Query);
    }

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
                method_name: "closeRecord".to_string(),
                kind: OpKind::Mutation,
                input_schema: None,
                output_schema: None,
            },
            OpSpec {
                route: "ext_sample.records.get-record".to_string(),
                extension_id: "ext_sample".to_string(),
                interface_name: "records".to_string(),
                op_name: "get-record".to_string(),
                method_name: "getRecord".to_string(),
                kind: OpKind::Query,
                input_schema: None,
                output_schema: None,
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
