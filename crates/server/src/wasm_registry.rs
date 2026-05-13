//! Live registry of platform-WIT-targeting extensions.
//!
//! For every extension that declares `platformWitVersion` AND ships a
//! built `<ext_root>/dist/<ext_id>.wasm`, the registry holds:
//!   * the compiled `wasmtime::component::Component`
//!   * a parsed `HostManifest` with the manifest's allowlists +
//!     contributed kinds
//!   * the extension's principal URI (synthesised from its id)
//!
//! Reads are `Arc`-shared so the kernel's `OpsDispatcher` impl can hand
//! out a new `HostState` per call without re-parsing manifests or
//! re-reading WASM bytes from disk.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

use serde_json::Value;
use wasmtime::Engine;
use wasmtime::component::{Component, Linker};

use crate::wasm_host::{
    AuthzLayer, Clock, DefaultAuthz, HostManifest, HostState, IdMinter, LogSink, OpsDispatcher,
    StderrLogSink, SystemClock, UlidMinter, host_state_for_op, make_platform_linker, wit_types,
};

/// One loaded extension. The `Component` is compiled once at kernel
/// boot; the kernel instantiates a fresh instance per op invocation
/// (per the platform WIT's no-cross-call-state contract).
pub struct LoadedExtension {
    pub id: String,
    pub principal: String,
    pub manifest: Arc<HostManifest>,
    pub component: Component,
    pub root: PathBuf,
}

#[derive(Clone)]
pub struct WasmRegistry {
    pub engine: Arc<Engine>,
    pub linker: Arc<Linker<HostState>>,
    pub extensions: Arc<RwLock<BTreeMap<String, Arc<LoadedExtension>>>>,
    pub authz: Arc<dyn AuthzLayer + Send + Sync>,
    pub clock: Arc<dyn Clock + Send + Sync>,
    pub log_sink: Arc<dyn LogSink + Send + Sync>,
    pub id_minter: Arc<dyn IdMinter + Send + Sync>,
    pub occ_tokens: Arc<RwLock<BTreeMap<(String, String, String), String>>>,
    pub minted_ids: Arc<RwLock<BTreeMap<String, std::collections::BTreeSet<String>>>>,
}

impl std::fmt::Debug for WasmRegistry {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("WasmRegistry")
            .field("extension_count", &self.ids().len())
            .field("loaded_ids", &self.ids())
            .finish()
    }
}

impl WasmRegistry {
    /// Construct a fresh registry with sensible default backings. The
    /// caller registers extensions via `register_from_manifest`.
    pub fn new() -> Result<Self, String> {
        let engine = Arc::new(Engine::default());
        let linker = make_platform_linker(&engine)
            .map_err(|e| format!("build platform linker: {e}"))?;
        // Pre-seed kernel-internal kinds. Per-extension kinds get added
        // when each manifest is registered.
        let id_minter: Arc<dyn IdMinter + Send + Sync> =
            Arc::new(UlidMinter::with_kernel_kinds(BTreeMap::new()));
        Ok(Self {
            engine,
            linker: Arc::new(linker),
            extensions: Arc::new(RwLock::new(BTreeMap::new())),
            authz: Arc::new(DefaultAuthz),
            clock: Arc::new(SystemClock),
            log_sink: Arc::new(StderrLogSink),
            id_minter,
            occ_tokens: Arc::new(RwLock::new(BTreeMap::new())),
            minted_ids: Arc::new(RwLock::new(BTreeMap::new())),
        })
    }

    /// Register one extension from its manifest + on-disk WASM at
    /// `<root>/dist/<id>.wasm`. Returns Ok if the extension was
    /// successfully loaded; Err if the manifest fails schema
    /// validation, or if the WASM was unreadable or didn't compile.
    /// Idempotent — re-registering the same id replaces the previous
    /// entry.
    pub fn register_from_manifest(&self, root: &Path) -> Result<String, String> {
        let manifest_path = root.join("manifest.json");
        let text = fs::read_to_string(&manifest_path)
            .map_err(|e| format!("read {}: {e}", manifest_path.display()))?;
        let json: Value = serde_json::from_str(&text)
            .map_err(|e| format!("parse {}: {e}", manifest_path.display()))?;
        validate_manifest_against_schema(&json, &manifest_path)?;
        let id = json
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| format!("{} missing id", manifest_path.display()))?
            .to_string();
        let wasm_path = root.join(format!("dist/{}.wasm", id));
        let bytes = fs::read(&wasm_path)
            .map_err(|e| format!("read {}: {e}", wasm_path.display()))?;
        let component = Component::new(&self.engine, &bytes)
            .map_err(|e| format!("compile {}: {e}", wasm_path.display()))?;

        let host_manifest = parse_host_manifest(&json)?;
        // Register the extension's declared kinds with the minter,
        // honouring the prefix declared in each `contributes.resourceKinds[]`
        // entry. (`parse_host_manifest` flattens to the kind name; for
        // prefix-aware registration we read directly from the JSON.)
        register_kinds_from_manifest_json(&self.id_minter, &json)?;

        let loaded = Arc::new(LoadedExtension {
            id: id.clone(),
            principal: format!("comtrya://extension/{}", id),
            manifest: Arc::new(host_manifest),
            component,
            root: root.to_path_buf(),
        });
        let mut exts = self
            .extensions
            .write()
            .map_err(|e| format!("registry write lock: {e}"))?;
        exts.insert(id.clone(), loaded);
        Ok(id)
    }

    pub fn get(&self, id: &str) -> Option<Arc<LoadedExtension>> {
        self.extensions.read().ok()?.get(id).cloned()
    }

    pub fn ids(&self) -> Vec<String> {
        self.extensions
            .read()
            .map(|m| m.keys().cloned().collect())
            .unwrap_or_default()
    }
}

/// Embedded copy of `docs/manifest.schema.json`. Compiled into the
/// binary so a kernel deployment doesn't need the source tree to
/// validate manifests.
const MANIFEST_SCHEMA_BYTES: &str =
    include_str!("../../../docs/manifest.schema.json");

/// Compile the manifest schema once per process. Used by every
/// `register_from_manifest` call; without the cache, a 50-extension
/// boot would re-parse + re-compile the same schema 50 times.
fn compiled_manifest_schema() -> Result<&'static jsonschema::JSONSchema, String> {
    static COMPILED: std::sync::OnceLock<jsonschema::JSONSchema> =
        std::sync::OnceLock::new();
    if let Some(c) = COMPILED.get() {
        return Ok(c);
    }
    let schema_value: Value = serde_json::from_str(MANIFEST_SCHEMA_BYTES)
        .map_err(|e| format!("embedded manifest schema is invalid JSON: {e}"))?;
    let compiled = jsonschema::JSONSchema::compile(&schema_value)
        .map_err(|e| format!("compile manifest schema: {e}"))?;
    // Race-safe: if another caller won the compile, our compiled
    // value is dropped harmlessly.
    let _ = COMPILED.set(compiled);
    Ok(COMPILED.get().expect("just set"))
}

fn validate_manifest_against_schema(
    manifest: &Value,
    manifest_path: &Path,
) -> Result<(), String> {
    let compiled = compiled_manifest_schema()?;
    let result = compiled.validate(manifest);
    match result {
        Ok(()) => Ok(()),
        Err(errors) => {
            let messages: Vec<String> = errors
                .map(|e| format!("- {} at {}", e, e.instance_path))
                .collect();
            Err(format!(
                "{} fails manifest schema validation:\n{}",
                manifest_path.display(),
                messages.join("\n")
            ))
        }
    }
}

fn parse_host_manifest(json: &Value) -> Result<HostManifest, String> {
    let strings_at = |ptr: &str| -> Vec<String> {
        json.pointer(ptr)
            .and_then(Value::as_array)
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default()
    };
    let contributes_resource_kinds = json
        .pointer("/contributes/resourceKinds")
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(|v| {
                    v.get("name")
                        .and_then(Value::as_str)
                        .map(str::to_string)
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    Ok(HostManifest {
        permissions: strings_at("/permissions"),
        allowed_emits: strings_at("/allowedEmits"),
        allowed_event_reads: strings_at("/allowedEventReads"),
        allowed_cross_calls: strings_at("/allowedCrossCalls"),
        reactor_allowed_mutations: strings_at("/reactor/allowedMutations"),
        reactor_allowed_emits: strings_at("/reactor/allowedEmits"),
        contributes_resource_kinds,
        host_imports: strings_at("/hostImports"),
    })
}

fn register_kinds_from_manifest_json(
    minter: &Arc<dyn IdMinter + Send + Sync>,
    manifest_json: &Value,
) -> Result<(), String> {
    let Some(kinds) = manifest_json
        .pointer("/contributes/resourceKinds")
        .and_then(Value::as_array)
    else {
        return Ok(());
    };
    for entry in kinds {
        let Some(name) = entry.get("name").and_then(Value::as_str) else {
            continue;
        };
        // The manifest schema requires `prefix` on every resourceKinds
        // entry. Fall back to a name-derived default only if absent
        // (defensive — the validated schema rejects entries without
        // `prefix` before we reach this code).
        let prefix = entry
            .get("prefix")
            .and_then(Value::as_str)
            .map(str::to_string)
            .unwrap_or_else(|| prefix_for_kind(name));
        minter.register_kind(name, &prefix);
    }
    Ok(())
}

fn prefix_for_kind(kind: &str) -> String {
    kind.chars()
        .filter(|c| c.is_ascii_alphabetic())
        .take(3)
        .map(|c| c.to_ascii_lowercase())
        .collect::<String>()
}

/// Build a fresh `HostState` for an op invocation on `extension_id`.
/// `current_principal` is the user/credential that triggered the
/// request (from auth). `dispatcher` propagates cross-call depth.
pub fn build_host_state(
    registry: &WasmRegistry,
    extension_id: &str,
    current_principal: &str,
    store: Arc<crate::ExtensionRuntimeStore>,
    dispatcher: Arc<dyn OpsDispatcher>,
    parent_depth: u32,
) -> Result<(HostState, Arc<LoadedExtension>), String> {
    let ext = registry
        .get(extension_id)
        .ok_or_else(|| format!("unknown extension: {extension_id}"))?;
    let mut state = host_state_for_op(
        ext.id.clone(),
        ext.principal.clone(),
        current_principal.to_string(),
        store,
        ext.manifest.clone(),
        registry.clock.clone(),
        registry.id_minter.clone(),
        registry.log_sink.clone(),
        registry.authz.clone(),
        dispatcher,
        registry.occ_tokens.clone(),
        registry.minted_ids.clone(),
    );
    state.ops_invoke_depth = parent_depth;
    Ok((state, ext))
}

// ---- the OpsDispatcher implementation that uses the registry ----

/// Kernel-side dispatcher that routes cross-extension `ops.invoke`
/// calls. Resolves the target extension via the registry, builds a
/// fresh `HostState` for that target with the inherited call depth,
/// instantiates the component, looks up the function by name, and
/// calls it.
///
/// The dispatch uses `wasmtime`'s lower-level Component-Model API
/// (`Func::call_raw`-style via untyped `Val`) because the kernel
/// doesn't know the target op's input/output record shape at compile
/// time. Per-extension typed bindings (M5+) replace this with
/// schema-aware encoding.
#[derive(Clone)]
pub struct RegistryDispatcher {
    pub registry: WasmRegistry,
    pub store: Arc<crate::ExtensionRuntimeStore>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registry_loads_ext_issues_from_manifest() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues");
        let wasm = root.join("dist/ext_issues.wasm");
        if !wasm.is_file() {
            eprintln!(
                "SKIP registry_loads_ext_issues_from_manifest: run \
                 `bash extensions/bundler/build-extension.sh \
                 extensions/first-party/ext_issues` first"
            );
            return;
        }
        let registry = WasmRegistry::new().expect("build registry");
        let id = registry
            .register_from_manifest(&root)
            .expect("register ext_issues");
        assert_eq!(id, "ext_issues");
        let ext = registry.get("ext_issues").expect("get ext_issues");
        assert_eq!(ext.principal, "comtrya://extension/ext_issues");
        assert!(ext.manifest.contributes_resource_kinds.contains(&"issue".to_string()));
        // Should have parsed allowedEmits from the manifest.
        assert!(
            ext.manifest
                .allowed_emits
                .iter()
                .any(|e| e == "dev.comtrya.issues.opened"),
            "allowed_emits should include dev.comtrya.issues.opened, got: {:?}",
            ext.manifest.allowed_emits
        );
    }

    #[test]
    fn registry_get_unknown_returns_none() {
        let registry = WasmRegistry::new().expect("build registry");
        assert!(registry.get("ext_nope").is_none());
    }

    #[test]
    fn manifest_schema_rejects_invalid_manifest() {
        let bad = serde_json::json!({
            // Missing required `id`, `name`, `version`, `publisher`,
            // `schemaVersion`.
            "displayName": "Bad"
        });
        let err = validate_manifest_against_schema(
            &bad,
            std::path::Path::new("test://bad-manifest.json"),
        )
        .expect_err("schema must reject missing-required-fields manifest");
        assert!(err.contains("schema validation"), "error: {}", err);
    }

    #[test]
    fn manifest_schema_rejects_malformed_id() {
        let bad = serde_json::json!({
            "schemaVersion": "comtrya.extension/v1",
            "id": "Bad-Id-With-Caps",
            "name": "x",
            "version": "0.1.0",
            "publisher": "x"
        });
        let err = validate_manifest_against_schema(
            &bad,
            std::path::Path::new("test://bad-id.json"),
        )
        .expect_err("schema must reject capitalised id");
        assert!(err.contains("schema validation"), "error: {}", err);
    }

    #[test]
    fn manifest_schema_accepts_real_ext_issues_manifest() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues/manifest.json");
        let text = std::fs::read_to_string(&path).expect("read manifest");
        let json: Value = serde_json::from_str(&text).expect("parse manifest");
        validate_manifest_against_schema(&json, &path)
            .expect("ext_issues manifest must validate against the schema");
    }

    #[test]
    fn parse_host_manifest_handles_missing_optional_fields() {
        let minimal = serde_json::json!({ "id": "ext_minimal" });
        let manifest = parse_host_manifest(&minimal).expect("parse");
        assert!(manifest.allowed_emits.is_empty());
        assert!(manifest.contributes_resource_kinds.is_empty());
        assert!(manifest.host_imports.is_empty());
    }
}

impl OpsDispatcher for RegistryDispatcher {
    fn dispatch(
        &self,
        target_extension: &str,
        op: &str,
        _payload: &[u8],
        depth: u32,
    ) -> Result<Vec<u8>, wit_types::Error> {
        // Validate the target exists. The actual call path
        // (instantiate + invoke) lands when per-extension typed
        // bindings are wired in M5+; for M2, return Unavailable so the
        // contract is honest about what's not yet implemented.
        let _ext = self.registry.get(target_extension).ok_or_else(|| {
            wit_types::Error {
                code: wit_types::ErrorCode::NotFound,
                message: format!("extension '{}' not registered", target_extension),
                path: None,
            }
        })?;
        let _ = (op, depth);
        Err(wit_types::Error {
            code: wit_types::ErrorCode::Unavailable,
            message: format!(
                "ops.invoke for {}/{} not yet wired — pending per-extension typed bindings (M5+)",
                target_extension, op
            ),
            path: None,
        })
    }
}
