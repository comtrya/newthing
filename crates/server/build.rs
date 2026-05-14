//! Server crate build script.
//!
//! Discovers every first-party extension that declares
//! `platformWitVersion` in its manifest and runs `comtrya-wit-codegen`
//! against its per-extension WIT. Emits one `<OUT_DIR>/<ext_id>.handlers.rs`
//! per extension plus a `<OUT_DIR>/dispatch_table.rs` that composes the
//! per-extension `dispatch_route_<ext_id>` functions into a single
//! `dispatch_route(route) -> Option<DispatchInfo>`.
//!
//! `main.rs` / `wasm_host.rs` `include!` the generated `dispatch_table.rs`
//! to consult a freshly-built table on every kernel boot.

use std::collections::BTreeMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use comtrya_wit_codegen::{
    legacy_dotted_field, legacy_graphql_field, parse_extension_wit, render_rust_handlers,
};

fn main() {
    let out_dir = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR"));
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
    let repo_root = manifest_dir
        .parent()
        .and_then(Path::parent)
        .expect("repo root from crate manifest")
        .to_path_buf();

    println!("cargo:rerun-if-changed=build.rs");

    let extensions_root = repo_root.join("extensions/first-party");
    let installed = discover_extensions(&extensions_root);

    let mut per_extension_files: BTreeMap<String, PathBuf> = BTreeMap::new();
    let mut all_routes: Vec<(String, String)> = Vec::new(); // (ext_id, fn_name)
    let mut canonical_routes: Vec<CanonicalRoute> = Vec::new();
    let mut global_route_keys: BTreeMap<String, String> = BTreeMap::new();

    for ext in &installed {
        // Tell cargo to re-run if the WIT or manifest changes.
        println!("cargo:rerun-if-changed={}", ext.manifest_path.display());
        if ext.wit_dir.is_dir() {
            walk_for_rerun(&ext.wit_dir);
        }
        // Skip extensions that don't declare platformWitVersion — they
        // still use the legacy resolver path until their migration
        // milestone lands. Also skip extensions whose `component/`
        // crate hasn't been written yet: their manifest is forward-
        // looking but no real WASM exists to back it.
        if ext.platform_wit_version.is_none() {
            continue;
        }
        let component_crate = ext.root.join("component/Cargo.toml");
        if !component_crate.is_file() {
            println!(
                "cargo:warning=skipping codegen for {}: declares platformWitVersion but has no component/ crate yet",
                ext.id
            );
            continue;
        }
        // Ensure wit/deps/platform exists so wit-parser can resolve
        // `use comtrya:platform/...`. The bundler does this on first
        // build; we do it here too so a fresh clone + `cargo build`
        // succeeds without running the bundler first.
        ensure_deps_platform(&ext.wit_dir, &repo_root);
        let Some(wit_dir) = ext.wit_dir.canonicalize().ok() else {
            // Extension declares platformWitVersion but has no wit/ —
            // surface the problem at build time rather than runtime.
            panic!(
                "extension {} declares platformWitVersion but has no wit/ at {}",
                ext.id,
                ext.wit_dir.display()
            );
        };
        let ops = parse_extension_wit(&wit_dir, &ext.id, &[]).unwrap_or_else(|e| {
            panic!("wit-codegen failed for {}: {e}", ext.id);
        });
        for op in &ops {
            let descriptor = format!("{}.{}.{}", op.extension_id, op.interface_name, op.op_name);
            let mut keys = vec![op.route.clone()];
            if let Some(alias) = legacy_graphql_field(&op.interface_name, &op.op_name) {
                keys.push(alias);
            }
            if let Some(alias) = legacy_dotted_field(&op.interface_name, &op.op_name) {
                keys.push(alias);
            }
            for key in keys {
                if let Some(previous) = global_route_keys.get(&key) {
                    if previous != &descriptor {
                        panic!(
                            "duplicate generated GraphQL route key '{key}' maps to both {previous} and {descriptor}"
                        );
                    }
                } else {
                    global_route_keys.insert(key, descriptor.clone());
                }
            }
            canonical_routes.push(CanonicalRoute {
                extension_id: op.extension_id.clone(),
                interface_name: op.interface_name.clone(),
                op_name: op.op_name.clone(),
                kind: match op.kind {
                    comtrya_wit_codegen::OpKind::Query => "query",
                    comtrya_wit_codegen::OpKind::Mutation => "mutation",
                },
            });
        }
        let handlers = render_rust_handlers(&ops);
        let out_path = out_dir.join(format!("{}.handlers.rs", safe_ident(&ext.id)));
        fs::write(&out_path, handlers).unwrap_or_else(|e| {
            panic!("write {} failed: {e}", out_path.display());
        });
        let fn_name = format!("dispatch_route_{}", safe_ident(&ext.id));
        all_routes.push((ext.id.clone(), fn_name));
        per_extension_files.insert(ext.id.clone(), out_path);
    }

    // Compose dispatch_table.rs — defines DispatchInfo once at the
    // top, then pulls every per-extension file in via include!() (each
    // module's dispatch_route_<ext_id> references super::DispatchInfo).
    // Finally emits a top-level dispatch_route() that fans out across
    // the per-extension functions.
    let mut table = String::new();
    table.push_str("// AUTO-GENERATED by crates/server/build.rs — DO NOT EDIT.\n\n");
    table.push_str("#[derive(Debug, Clone)]\n");
    table.push_str("pub struct DispatchInfo {\n");
    table.push_str("    pub extension_id: &'static str,\n");
    table.push_str("    pub interface_name: &'static str,\n");
    table.push_str("    pub op_name: &'static str,\n");
    table.push_str("    pub kind: &'static str,\n");
    table.push_str("}\n\n");
    for (ext_id, path) in &per_extension_files {
        // Strip the OUT_DIR prefix so the include! path is portable.
        let rel = path.strip_prefix(&out_dir).unwrap_or(path);
        // include! requires absolute or relative-to-CARGO_MANIFEST_DIR
        // paths. We embed the OUT_DIR-relative form so the build is
        // reproducible across machines.
        let rel_str = rel.to_string_lossy().replace('\\', "/");
        table.push_str(&format!(
            "pub mod ext_{} {{ include!(concat!(env!(\"OUT_DIR\"), \"/{}\")); }}\n",
            safe_ident(ext_id),
            rel_str
        ));
    }
    table.push('\n');
    table.push_str("/// Top-level GraphQL → WASM op dispatcher. Returns `Some` if a\n");
    table.push_str("/// registered extension claims the route, `None` to fall back to the\n");
    table.push_str("/// legacy hand-written handlers in `main.rs`.\n");
    table.push_str("pub fn dispatch_route(route: &str) -> Option<DispatchInfo> {\n");
    for (ext_id, fn_name) in &all_routes {
        table.push_str(&format!(
            "    if let Some(info) = ext_{}::{}(route) {{ return Some(info); }}\n",
            safe_ident(ext_id),
            fn_name
        ));
    }
    table.push_str("    None\n}\n\n");

    table.push('\n');
    table.push_str("/// Canonical WIT route lookup for cross-extension ops.invoke.\n");
    table.push_str("/// Unlike dispatch_route(), this intentionally does not accept\n");
    table.push_str("/// legacy GraphQL aliases such as issuesClose or issues.close.\n");
    table.push_str(
        "pub fn dispatch_wit_route(target_extension: &str, op: &str) -> Option<DispatchInfo> {\n",
    );
    table.push_str("    match (target_extension, op) {\n");
    for route in &canonical_routes {
        let op_route = format!("{}.{}", route.interface_name, route.op_name);
        table.push_str(&format!(
            "        (\"{}\", \"{}\") => Some(DispatchInfo {{\n            extension_id: \"{}\",\n            interface_name: \"{}\",\n            op_name: \"{}\",\n            kind: \"{}\",\n        }}),\n",
            route.extension_id,
            op_route,
            route.extension_id,
            route.interface_name,
            route.op_name,
            route.kind,
        ));
    }
    table.push_str("        _ => None,\n    }\n}\n\n");

    table.push_str("/// Generated extension-id to typed WASM invoker table.\n");
    table.push_str("pub fn invoker_for_extension(extension_id: &str) -> Option<crate::wasm_invokers::ExtensionInvokerFn> {\n");
    table.push_str("    match extension_id {\n");
    for (ext_id, _) in &all_routes {
        if let Some(invoker_fn) = typed_invoker_fn(ext_id) {
            table.push_str(&format!(
                "        \"{}\" => Some(crate::wasm_invokers::{} as crate::wasm_invokers::ExtensionInvokerFn),\n",
                ext_id,
                invoker_fn,
            ));
        }
    }
    table.push_str("        _ => None,\n    }\n}\n");

    let table_path = out_dir.join("dispatch_table.rs");
    fs::write(&table_path, table).unwrap_or_else(|e| {
        panic!("write {} failed: {e}", table_path.display());
    });
}

struct InstalledExt {
    id: String,
    root: PathBuf,
    manifest_path: PathBuf,
    wit_dir: PathBuf,
    platform_wit_version: Option<String>,
}

struct CanonicalRoute {
    extension_id: String,
    interface_name: String,
    op_name: String,
    kind: &'static str,
}

fn ensure_deps_platform(wit_dir: &Path, repo_root: &Path) {
    let deps = wit_dir.join("deps");
    let target = deps.join("platform");
    if target.exists() {
        return;
    }
    let _ = fs::create_dir_all(&deps);
    let platform = repo_root.join("extensions/wit/comtrya/platform");
    #[cfg(unix)]
    {
        let _ = std::os::unix::fs::symlink(&platform, &target);
    }
}

fn discover_extensions(root: &Path) -> Vec<InstalledExt> {
    let mut out = Vec::new();
    let Ok(entries) = fs::read_dir(root) else {
        return out;
    };
    for entry in entries.flatten() {
        let ext_root = entry.path();
        if !ext_root.is_dir() {
            continue;
        }
        let manifest_path = ext_root.join("manifest.json");
        if !manifest_path.is_file() {
            continue;
        }
        let Ok(text) = fs::read_to_string(&manifest_path) else {
            continue;
        };
        let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) else {
            continue;
        };
        let id = json
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        if id.is_empty() {
            continue;
        }
        let platform_wit_version = json
            .get("platformWitVersion")
            .and_then(|v| v.as_str())
            .map(str::to_owned);
        let wit_dir = ext_root.join(
            json.get("perExtensionWit")
                .and_then(|v| v.as_str())
                .unwrap_or("wit"),
        );
        out.push(InstalledExt {
            id,
            root: ext_root,
            manifest_path,
            wit_dir,
            platform_wit_version,
        });
    }
    out
}

fn safe_ident(id: &str) -> String {
    id.chars()
        .map(|c| match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '_' => c,
            _ => '_',
        })
        .collect()
}

fn typed_invoker_fn(id: &str) -> Option<&'static str> {
    match id {
        // M2 canary. M5 moves the remaining first-party extensions
        // onto typed WASM invokers as their component crates land.
        "ext_issues" => Some("dispatch_ext_issues"),
        "ext_epics" => Some("dispatch_ext_epics"),
        "ext_pull_requests" => Some("dispatch_ext_pull_requests"),
        "ext_checks" => Some("dispatch_ext_checks"),
        "ext_workspace_home" => Some("dispatch_ext_workspace_home"),
        _ => None,
    }
}

fn walk_for_rerun(dir: &Path) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        // Skip the deps/ symlink — it points outside the extension
        // root and would trigger spurious rebuilds on every kernel
        // build.
        if path.file_name().and_then(|n| n.to_str()) == Some("deps") {
            continue;
        }
        if path.is_dir() {
            walk_for_rerun(&path);
        } else {
            println!("cargo:rerun-if-changed={}", path.display());
        }
    }
}
