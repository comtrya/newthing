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
use std::path::Path;
use std::sync::{Arc, RwLock};

use serde::Deserialize;
use serde_json::Value;
use wasmtime::Engine;
use wasmtime::component::{Component, Linker};

use crate::wasm_host::{
    AuthzLayer, Clock, HostManifest, HostState, HostStateForOp, IdMinter, LogSink, OpsDispatcher,
    SharedMintedIds, SharedOccTokens, SimpleAuthz, SystemClock, TracingLogSink, UlidMinter,
    host_state_for_op, make_platform_linker, wit_types,
};

const REACTOR_RECURSION_DEPTH_CAP: u32 = 8;
const REACTION_DEPTH_EXCEEDED_EVENT: &str = "comtrya.kernel.reaction-depth-exceeded";

/// One loaded extension. The `Component` is compiled once at kernel
/// boot; the kernel instantiates a fresh instance per op invocation
/// (per the platform WIT's no-cross-call-state contract).
pub struct LoadedExtension {
    pub id: String,
    pub principal: String,
    pub manifest: Arc<HostManifest>,
    pub route_table: Arc<crate::route_scope::RouteTable>,
    /// Extension points this extension exposes for others to invoke.
    pub provides: Arc<Vec<crate::extension_points::ProvidedPoint>>,
    /// Extension points this extension depends on from others.
    pub requires: Arc<Vec<crate::extension_points::RequiredPoint>>,
    pub component: Component,
}

/// Resolves a repository's per-repo extension opt-in set
/// (`repository.extensions`) for a `comtrya://` repository ref.
/// Installed onto the registry after the kernel runtime is assembled.
pub trait RepoEnablementResolver: Send + Sync {
    /// The set of extension ids the repository at `repository_ref` has
    /// opted into. The empty set means "strictly off" — no
    /// repository-scoped extension features are available.
    fn enabled_extensions_for_repo(
        &self,
        store: &crate::ExtensionRuntimeStore,
        repository_ref: &str,
    ) -> std::collections::BTreeSet<String>;
}

/// Whether `repository_ref` has opted into `extension_id`, read through an
/// optionally-installed resolver slot. Fails closed: a missing resolver or
/// an unknown repository yields `false`. Shared by `WasmRegistry` and the
/// relation write-path participation gate in `HostState`, which carries
/// the same resolver slot.
pub fn repo_enabled_via_resolver(
    resolver_slot: &Arc<RwLock<Option<Arc<dyn RepoEnablementResolver>>>>,
    store: &crate::ExtensionRuntimeStore,
    repository_ref: &str,
    extension_id: &str,
) -> bool {
    let Some(resolver) = resolver_slot.read().ok().and_then(|slot| slot.clone()) else {
        return false;
    };
    resolver
        .enabled_extensions_for_repo(store, repository_ref)
        .contains(extension_id)
}

/// Production resolver: maps a repository ref to its on-disk bare git
/// dir, evaluates the repo's `package comtrya` CUE through the shared
/// per-commit cache, and reads `repository.extensions`. Depends on
/// the data dir, the shared CUE evaluation cache, and the collected
/// extension CUE schemas.
pub struct CueRepoEnablement {
    data_dir: std::path::PathBuf,
    cue_cache: Arc<crate::cue_config::CueConfigCache>,
    schemas: Vec<crate::cue_config::ExtensionSchema>,
}

impl CueRepoEnablement {
    pub fn new(
        data_dir: std::path::PathBuf,
        cue_cache: Arc<crate::cue_config::CueConfigCache>,
        schemas: Vec<crate::cue_config::ExtensionSchema>,
    ) -> Self {
        Self {
            data_dir,
            cue_cache,
            schemas,
        }
    }

    /// The opt-in set for the repository at `path`. Resolves the bare git
    /// dir under `repositories/<path>.git`, evaluates the repo's
    /// `package comtrya` CUE through the shared cache, and reads
    /// `repository.extensions`. Absent or unreadable config yields
    /// the empty set (strictly off).
    fn enabled_extensions_for_path(&self, path: &str) -> std::collections::BTreeSet<String> {
        let git_dir = self
            .data_dir
            .join("repositories")
            .join(format!("{path}.git"));
        if !git_dir.is_dir() {
            return std::collections::BTreeSet::new();
        }
        let config =
            self.cue_cache
                .evaluate(&git_dir, &crate::repo_config_ref(&git_dir), &self.schemas);
        config
            .get("repository")
            .and_then(|repo| repo.get("extensions"))
            .and_then(Value::as_array)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| id.as_str().map(str::to_owned))
                    .collect()
            })
            .unwrap_or_default()
    }
}

impl RepoEnablementResolver for CueRepoEnablement {
    fn enabled_extensions_for_repo(
        &self,
        store: &crate::ExtensionRuntimeStore,
        repository_ref: &str,
    ) -> std::collections::BTreeSet<String> {
        let Some(repo_id) = repository_id_from_ref(repository_ref) else {
            return std::collections::BTreeSet::new();
        };
        let Some(path) = store.repository_path_for_id(repo_id) else {
            return std::collections::BTreeSet::new();
        };
        self.enabled_extensions_for_path(&path)
    }
}

/// Extract the opaque repository id from a `comtrya://` resource ref.
/// Accepts `comtrya://repository/<id>` and
/// `comtrya://workspace/<ws>/repository/<id>`. Returns `None` for any
/// other shape, including refs with an empty workspace or repository
/// segment — those are malformed and left for the extension's own input
/// validation rather than the per-repo gate.
pub fn repository_id_from_ref(repository_ref: &str) -> Option<&str> {
    let rest = repository_ref.strip_prefix("comtrya://")?;
    if let Some(rest) = rest.strip_prefix("workspace/") {
        let (workspace, id) = rest.split_once("/repository/")?;
        if workspace.is_empty() || id.is_empty() {
            return None;
        }
        return Some(id);
    }
    let id = rest.strip_prefix("repository/")?;
    if id.is_empty() { None } else { Some(id) }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WasmReaction {
    InvokeMutation {
        name: String,
        payload: Vec<u8>,
    },
    EmitEvent {
        event_type: String,
        payload: Vec<u8>,
    },
}

#[derive(Clone)]
pub struct WasmRegistry {
    pub engine: Arc<Engine>,
    pub linker: Arc<Linker<HostState>>,
    pub extensions: Arc<RwLock<BTreeMap<String, Arc<LoadedExtension>>>>,
    pub reactor_subscriptions: Arc<RwLock<BTreeMap<String, Vec<String>>>>,
    /// Resolved per-consumer synchronous cross-call authorisations, keyed
    /// by consumer extension id. Populated by
    /// `resolve_extension_point_bindings` after every extension is
    /// registered (a consumer's providers may load in any order). Empty
    /// until then — `HostState::invoke` reads a missing entry as "no
    /// cross-calls permitted", failing closed.
    pub extension_point_bindings:
        Arc<RwLock<BTreeMap<String, Arc<crate::extension_points::ConsumerBindings>>>>,
    pub authz: Arc<dyn AuthzLayer + Send + Sync>,
    pub clock: Arc<dyn Clock + Send + Sync>,
    pub log_sink: Arc<dyn LogSink + Send + Sync>,
    pub id_minter: Arc<dyn IdMinter + Send + Sync>,
    pub occ_tokens: SharedOccTokens,
    pub minted_ids: SharedMintedIds,
    /// Per-repo extension opt-in resolver. Installed after the kernel
    /// runtime is assembled (it needs the data dir, the shared CUE
    /// evaluation cache, and the collected extension CUE schemas, none
    /// of which exist when the registry itself is built). `None` until
    /// installed — gates treat a missing resolver as "cannot confirm
    /// enabled" and reject repository-scoped access, failing closed.
    pub repo_enablement: Arc<RwLock<Option<Arc<dyn RepoEnablementResolver>>>>,
    /// Kernel-global set of manifest-declared relationship shapes,
    /// aggregated across every loaded extension. Consulted on the relation
    /// write path so an edge's `(kind, source-kind, target-kind)` triple
    /// must match a declared `contributes.relationshipTypes` shape.
    /// Installed after every extension is registered (a shape's endpoint
    /// kinds may be owned by an extension that loads later). Empty until
    /// then — both write paths read an empty registry as "permit nothing",
    /// failing closed.
    pub relationship_types: Arc<RwLock<Arc<crate::relationship_types::RelationshipTypeRegistry>>>,
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
        let engine = Arc::new(crate::wasm_host::build_sandboxed_engine()?);
        let linker =
            make_platform_linker(&engine).map_err(|e| format!("build platform linker: {e}"))?;
        // Pre-seed kernel-internal kinds. Per-extension kinds get added
        // when each manifest is registered.
        let id_minter: Arc<dyn IdMinter + Send + Sync> =
            Arc::new(UlidMinter::with_kernel_kinds(BTreeMap::new()));
        Ok(Self {
            engine,
            linker: Arc::new(linker),
            extensions: Arc::new(RwLock::new(BTreeMap::new())),
            reactor_subscriptions: Arc::new(RwLock::new(BTreeMap::new())),
            extension_point_bindings: Arc::new(RwLock::new(BTreeMap::new())),
            authz: Arc::new(SimpleAuthz),
            clock: Arc::new(SystemClock),
            log_sink: Arc::new(TracingLogSink),
            id_minter,
            occ_tokens: Arc::new(RwLock::new(BTreeMap::new())),
            minted_ids: Arc::new(RwLock::new(BTreeMap::new())),
            repo_enablement: Arc::new(RwLock::new(None)),
            relationship_types: Arc::new(RwLock::new(Arc::new(
                crate::relationship_types::RelationshipTypeRegistry::default(),
            ))),
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
        let wire = parse_wire_manifest(&json, &manifest_path)?;
        let id = wire
            .id
            .clone()
            .ok_or_else(|| format!("{} missing id", manifest_path.display()))?;
        if crate::generated_dispatch::invoker_for_extension(&id).is_none() {
            return Err(format!(
                "extension {id} declares platformWitVersion but has no typed WASM invoker"
            ));
        }
        let wasm_path = root.join(format!("dist/{}.wasm", id));
        let bytes =
            fs::read(&wasm_path).map_err(|e| format!("read {}: {e}", wasm_path.display()))?;
        let component = Component::new(&self.engine, &bytes)
            .map_err(|e| format!("compile {}: {e}", wasm_path.display()))?;

        let host_manifest = host_manifest_from_wire(&wire);
        // Build the typed per-op dispatch route table from the manifest,
        // then verify every declared route matches a real WIT export so a
        // typo'd or stale `dispatchRoutes` entry fails at load, not at
        // dispatch.
        let route_table = route_table_from_wire(&id, &wire.dispatch_routes)?;
        // The descriptor is the canonical `<interface>.<op>` op route, which
        // is exactly what `dispatch_wit_route` keys on; a descriptor that
        // names no generated WIT export is a stale or typo'd manifest entry.
        for descriptor in route_table.op_descriptors() {
            if crate::generated_dispatch::dispatch_wit_route(&id, descriptor).is_none() {
                return Err(format!(
                    "{id} dispatchRoute '{descriptor}' does not match any WIT export"
                ));
            }
        }
        // Likewise cross-check that every op a `providesExtensionPoints`
        // entry exposes is a real WIT export of this provider, so a typo in
        // a point's `ops` fails the load rather than surfacing as a
        // NotFound when a consumer eventually invokes it.
        for point in &wire.provides_extension_points {
            for op in &point.ops {
                if crate::generated_dispatch::dispatch_wit_route(&id, op).is_none() {
                    return Err(format!(
                        "{id} extension point '{}' v{} exposes op '{op}' which is not a WIT export",
                        point.id, point.version
                    ));
                }
            }
        }
        // Register the extension's declared kinds with the minter,
        // honouring the prefix declared in each `contributes.resourceKinds[]`
        // entry. The `HostManifest` flattens to kind names; the minter
        // needs the prefix too, so it reads from the same typed `wire`.
        register_kinds_from_wire(&self.id_minter, &wire);

        let loaded = Arc::new(LoadedExtension {
            id: id.clone(),
            principal: format!("comtrya://extension/{}", id),
            manifest: Arc::new(host_manifest),
            route_table: Arc::new(route_table),
            provides: Arc::new(provided_points_from_wire(&wire)),
            requires: Arc::new(required_points_from_wire(&wire)),
            component,
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

    /// Install the per-repo extension opt-in resolver. Called once after
    /// the kernel runtime is assembled; until then the enforcement gates
    /// fail closed for repository-scoped access.
    pub fn install_repo_enablement(&self, resolver: Arc<dyn RepoEnablementResolver>) {
        if let Ok(mut slot) = self.repo_enablement.write() {
            *slot = Some(resolver);
        }
    }

    /// The repository at `repository_ref` has opted into the extension
    /// `extension_id` (its `repository.extensions` set contains
    /// the id). Resolves the repo's path from `store`, then reads the
    /// opt-in set through the installed resolver. Fails closed: a missing
    /// resolver, an unresolvable ref, or an unknown repository yields
    /// `false`.
    pub fn repo_has_extension_enabled(
        &self,
        store: &crate::ExtensionRuntimeStore,
        repository_ref: &str,
        extension_id: &str,
    ) -> bool {
        repo_enabled_via_resolver(&self.repo_enablement, store, repository_ref, extension_id)
    }

    /// Whether `extension_id`'s reactor subscription is gated per-repo.
    /// True when its manifest declares `reactor.scope: "repository"` (the
    /// default). An instance-scoped reactor receives every matching event
    /// regardless of any repo's opt-in.
    fn reactor_subscription_is_gated(&self, extension_id: &str) -> bool {
        self.get(extension_id)
            .map(|ext| ext.manifest.reactor_scope.is_repository())
            .unwrap_or(false)
    }

    /// Derive the source repository ref of an event from its `source_uri`
    /// by resolving the source resource document and reading its
    /// repository ref. `None` when the source is not a stored resource
    /// carrying a repository ref (e.g. an instance/kernel-origin event).
    fn event_source_repository(
        &self,
        store: &crate::ExtensionRuntimeStore,
        event: &wit_types::Event,
    ) -> Option<String> {
        store.repository_ref_for_resource(&event.source_uri)
    }

    /// Whether `extension_id` contributes a repository-scoped resource
    /// kind — i.e. whether its ops are subject to the per-repo opt-in
    /// gate. An extension whose contributions are all instance-scoped
    /// (or which is unknown) is never gated.
    fn extension_is_repository_scoped(&self, extension_id: &str) -> bool {
        self.get(extension_id)
            .map(|ext| ext.manifest.has_repository_scoped_kinds)
            .unwrap_or(false)
    }

    /// Gate entry for a repository-scoped op. Returns `Forbidden` unless
    /// the repository at `repository_ref` has opted into `extension_id`
    /// via `repository.extensions`. Ops on an extension with no
    /// repository-scoped contributions are never gated (returns `Ok`).
    pub fn ensure_extension_enabled_for_repo(
        &self,
        store: &crate::ExtensionRuntimeStore,
        repository_ref: &str,
        extension_id: &str,
    ) -> Result<(), wit_types::Error> {
        if !self.extension_is_repository_scoped(extension_id) {
            return Ok(());
        }
        if self.repo_has_extension_enabled(store, repository_ref, extension_id) {
            return Ok(());
        }
        Err(wit_types::Error {
            code: wit_types::ErrorCode::Forbidden,
            message: format!(
                "extension '{extension_id}' is not enabled for repository '{repository_ref}'; \
                 add it to the repository's comtrya CUE repository.extensions"
            ),
            path: None,
        })
    }

    pub fn ids(&self) -> Vec<String> {
        self.extensions
            .read()
            .map(|m| m.keys().cloned().collect())
            .unwrap_or_default()
    }

    /// Resolve every consumer's `requiresExtensionPoints` against the
    /// `providesExtensionPoints` of all registered extensions, building the
    /// immutable per-consumer cross-call binding table. Call once after all
    /// extensions are registered (providers may load in any order). Fails
    /// closed: any unresolved requirement, duplicate declaration, or
    /// requirement cycle aborts the load.
    pub fn resolve_extension_point_bindings(&self) -> Result<(), String> {
        let decls: Vec<crate::extension_points::ExtensionPointDecls> = self
            .extensions
            .read()
            .map_err(|e| format!("registry read lock: {e}"))?
            .values()
            .map(|ext| crate::extension_points::ExtensionPointDecls {
                id: ext.id.clone(),
                provides: (*ext.provides).clone(),
                requires: (*ext.requires).clone(),
            })
            .collect();
        let resolved = crate::extension_points::resolve_bindings(&decls)?;
        let mut slot = self
            .extension_point_bindings
            .write()
            .map_err(|e| format!("binding table write lock: {e}"))?;
        *slot = resolved
            .into_iter()
            .map(|(consumer, bindings)| (consumer, Arc::new(bindings)))
            .collect();
        Ok(())
    }

    /// The resolved synchronous cross-call bindings for `consumer`. A
    /// consumer with no resolved bindings (none declared, or resolution
    /// has not run) gets an empty set that permits no cross-calls.
    pub fn consumer_bindings(
        &self,
        consumer: &str,
    ) -> Arc<crate::extension_points::ConsumerBindings> {
        self.extension_point_bindings
            .read()
            .ok()
            .and_then(|slot| slot.get(consumer).cloned())
            .unwrap_or_default()
    }

    /// Install the aggregated relationship-shape registry. Called once
    /// after every extension is registered and its declared
    /// `contributes.relationshipTypes` have been collected, so a shape
    /// whose endpoint kinds span extensions resolves regardless of load
    /// order. Mirrors `install_repo_enablement`.
    pub fn install_relationship_types(
        &self,
        registry: crate::relationship_types::RelationshipTypeRegistry,
    ) {
        if let Ok(mut slot) = self.relationship_types.write() {
            *slot = Arc::new(registry);
        }
    }

    /// A cheap snapshot of the installed relationship-shape registry. An
    /// uninstalled registry is empty and permits no relation writes,
    /// failing closed.
    pub fn relationship_types(&self) -> Arc<crate::relationship_types::RelationshipTypeRegistry> {
        self.relationship_types
            .read()
            .ok()
            .map(|slot| slot.clone())
            .unwrap_or_default()
    }

    pub fn register_reactor_subscriptions(
        &self,
        store: Arc<crate::ExtensionRuntimeStore>,
    ) -> Result<(), String> {
        let extensions = self
            .extensions
            .read()
            .map_err(|e| format!("registry read lock: {e}"))?
            .values()
            .cloned()
            .collect::<Vec<_>>();
        let mut subscriptions = BTreeMap::new();
        for ext in extensions {
            let patterns = crate::wasm_invokers::reactor_subscriptions_for_extension(
                self,
                store.clone(),
                &ext.id,
            )
            .map_err(|error| {
                format!(
                    "reactor subscription registration for {} failed: {}",
                    ext.id, error.message
                )
            })?;
            for pattern in &patterns {
                validate_event_pattern(pattern)
                    .map_err(|error| format!("{} reactor pattern {pattern:?}: {error}", ext.id))?;
                if !ext
                    .manifest
                    .reactor_subscribes
                    .iter()
                    .any(|allowed| allowed == pattern)
                {
                    return Err(format!(
                        "{} reactor returned subscription pattern {pattern:?} not declared in manifest reactor.subscribes",
                        ext.id
                    ));
                }
            }
            if !patterns.is_empty() {
                subscriptions.insert(ext.id.clone(), patterns);
            }
        }
        *self
            .reactor_subscriptions
            .write()
            .map_err(|e| format!("reactor subscription write lock: {e}"))? = subscriptions;
        Ok(())
    }

    #[cfg(test)]
    pub fn reactor_subscriptions(&self) -> BTreeMap<String, Vec<String>> {
        self.reactor_subscriptions
            .read()
            .map(|subscriptions| subscriptions.clone())
            .unwrap_or_default()
    }

    pub fn subscribers_for_event(&self, event_type: &str) -> Vec<String> {
        self.reactor_subscriptions
            .read()
            .map(|subscriptions| {
                subscriptions
                    .iter()
                    .filter(|(_, patterns)| {
                        patterns
                            .iter()
                            .any(|pattern| event_pattern_matches(pattern, event_type))
                    })
                    .map(|(extension_id, _)| extension_id.clone())
                    .collect()
            })
            .unwrap_or_default()
    }

    pub fn dispatch_reactor_event(
        &self,
        store: Arc<crate::ExtensionRuntimeStore>,
        event: &wit_types::Event,
        depth: u32,
    ) -> usize {
        let subscribers = self.subscribers_for_event(&event.event_type);
        if subscribers.is_empty() {
            return 0;
        }
        if depth >= REACTOR_RECURSION_DEPTH_CAP {
            if let Err(error) = self.append_reaction_depth_exceeded_event(store, event, depth) {
                tracing::error!(
                    %error,
                    depth,
                    "reactor: failed to append reaction depth exceeded event"
                );
            }
            return 0;
        }
        // Resolve the event's source repository once. The reactor gate
        // skips a repository-scoped subscriber whose source repo has not
        // opted into it. Derived from the event's `source_uri` resource
        // document (its `resource_refs` carry the repository ref); `None`
        // for instance-origin events (e.g. a kernel principal source) or
        // sources with no stored repository ref.
        let source_repository = self.event_source_repository(&store, event);
        let mut count = 0usize;
        for extension_id in subscribers {
            if self.reactor_subscription_is_gated(&extension_id) {
                let dispatch_allowed = match source_repository.as_deref() {
                    Some(repo_ref) => {
                        self.repo_has_extension_enabled(&store, repo_ref, &extension_id)
                    }
                    // Repository-scoped subscriber but no derivable source
                    // repository: fail closed and skip.
                    None => false,
                };
                if !dispatch_allowed {
                    tracing::debug!(
                        reactor = %extension_id,
                        event_type = %event.event_type,
                        source = ?source_repository,
                        "reactor skipped: extension not enabled for event source repository"
                    );
                    continue;
                }
            }
            count += 1;
            match crate::wasm_invokers::reactor_on_event_for_extension(
                self,
                store.clone(),
                &extension_id,
                event,
                depth,
            ) {
                Ok(reactions) if reactions.is_empty() => {}
                Ok(reactions) => {
                    self.apply_reactor_reactions(store.clone(), &extension_id, reactions, depth);
                }
                Err(error) => {
                    tracing::warn!(
                        reactor = %extension_id,
                        event_type = %event.event_type,
                        message = %error.message,
                        "reactor on-event failed"
                    );
                }
            }
        }
        count
    }

    fn apply_reactor_reactions(
        &self,
        store: Arc<crate::ExtensionRuntimeStore>,
        reactor_extension_id: &str,
        reactions: Vec<WasmReaction>,
        depth: u32,
    ) {
        let Some(reactor_extension) = self.get(reactor_extension_id) else {
            tracing::warn!(
                reactor = %reactor_extension_id,
                "reactor extension disappeared during dispatch"
            );
            return;
        };
        for reaction in reactions {
            match reaction {
                WasmReaction::InvokeMutation { name, payload } => {
                    if !reactor_extension
                        .manifest
                        .reactor_allowed_mutations
                        .iter()
                        .any(|allowed| allowed == &name)
                    {
                        tracing::warn!(
                            reactor = %reactor_extension_id,
                            mutation = %name,
                            "mutation not in reactor.allowedMutations, skipping"
                        );
                        continue;
                    }
                    let (target_extension, op) =
                        match parse_reactor_mutation_name(reactor_extension_id, &name) {
                            Ok(route) => route,
                            Err(error) => {
                                tracing::warn!(
                                    reactor = %reactor_extension_id,
                                    mutation = %name,
                                    message = %error.message,
                                    "mutation name is invalid"
                                );
                                continue;
                            }
                        };
                    // Cross-extension mutations must hold a resolved
                    // `requiresExtensionPoints` binding to the target,
                    // mirroring the synchronous `HostState::invoke`
                    // gate (wasm_host.rs `permits(target, op)` →
                    // `Forbidden`). Without this re-check, a reactor
                    // could name `extB/iface.op` in `reactor.allowedMutations`
                    // and reach extB regardless of whether extA holds a
                    // binding to extB — the manifest list and the
                    // bindings table are two authorization surfaces
                    // that must agree. A reactor calling back into its
                    // OWN extension does not need a cross-extension
                    // binding.
                    if target_extension != reactor_extension_id
                        && !self
                            .consumer_bindings(reactor_extension_id)
                            .permits(&target_extension, &op)
                    {
                        tracing::warn!(
                            reactor = %reactor_extension_id,
                            target = %target_extension,
                            op = %op,
                            "reactor mutation targets another extension with no resolved \
                             extension-point binding; declare requiresExtensionPoints"
                        );
                        continue;
                    }
                    let dispatcher = RegistryDispatcher {
                        registry: self.clone(),
                        store: store.clone(),
                    };
                    if let Err(error) = OpsDispatcher::dispatch_with_reactor_depth(
                        &dispatcher,
                        &target_extension,
                        &op,
                        &payload,
                        &reactor_extension.principal,
                        0,
                        depth + 1,
                    ) {
                        tracing::warn!(
                            reactor = %reactor_extension_id,
                            mutation = %name,
                            message = %error.message,
                            "reactor mutation dispatch failed"
                        );
                    }
                }
                WasmReaction::EmitEvent {
                    event_type,
                    payload,
                } => {
                    if !reactor_extension
                        .manifest
                        .reactor_allowed_emits
                        .iter()
                        .any(|allowed| allowed == &event_type)
                    {
                        tracing::warn!(
                            reactor = %reactor_extension_id,
                            event_type = %event_type,
                            "emit not in reactor.allowedEmits, skipping"
                        );
                        continue;
                    }
                    let event = match self.append_reactor_emitted_event(
                        store.clone(),
                        &reactor_extension,
                        &event_type,
                        payload,
                    ) {
                        Ok(event) => event,
                        Err(error) => {
                            tracing::warn!(
                                reactor = %reactor_extension_id,
                                event_type = %event_type,
                                %error,
                                "reactor emit failed"
                            );
                            continue;
                        }
                    };
                    self.dispatch_reactor_event(store.clone(), &event, depth + 1);
                }
            }
        }
    }

    fn append_reactor_emitted_event(
        &self,
        store: Arc<crate::ExtensionRuntimeStore>,
        reactor_extension: &LoadedExtension,
        event_type: &str,
        payload: Vec<u8>,
    ) -> Result<wit_types::Event, String> {
        self.append_reactor_event(
            store,
            event_type,
            payload,
            reactor_extension.principal.clone(),
            reactor_extension.id.clone(),
        )
    }

    fn append_reaction_depth_exceeded_event(
        &self,
        store: Arc<crate::ExtensionRuntimeStore>,
        event: &wit_types::Event,
        depth: u32,
    ) -> Result<wit_types::Event, String> {
        let payload = serde_json::to_vec(&serde_json::json!({
            "eventId": event.id.as_str(),
            "eventType": event.event_type.as_str(),
            "depth": depth,
            "cap": REACTOR_RECURSION_DEPTH_CAP,
        }))
        .map_err(|error| format!("encode depth exceeded payload: {error}"))?;
        self.append_reactor_event(
            store,
            REACTION_DEPTH_EXCEEDED_EVENT,
            payload,
            "comtrya://kernel/reactor".to_string(),
            "kernel".to_string(),
        )
    }

    fn append_reactor_event(
        &self,
        store: Arc<crate::ExtensionRuntimeStore>,
        event_type: &str,
        payload: Vec<u8>,
        source_uri: String,
        emitter_extension: String,
    ) -> Result<wit_types::Event, String> {
        let id = self
            .id_minter
            .mint("event")
            .map_err(|error| format!("mint event id: {error:?}"))?;
        let timestamp_ms = self.clock.now_millis();
        let payload_b64 = crate::wasm_host::base64_encode(&payload);
        store.append_storage_event(
            event_type,
            serde_json::json!({
                "id": id,
                "eventType": event_type,
                "payloadB64": payload_b64,
                "timestampMs": timestamp_ms,
                "sourceUri": source_uri,
                "emitterExtension": emitter_extension,
            }),
        )?;
        Ok(wit_types::Event {
            id,
            event_type: event_type.to_string(),
            payload,
            timestamp_ms,
            source_uri,
            emitter_extension,
        })
    }
}

fn parse_reactor_mutation_name(
    reactor_extension_id: &str,
    name: &str,
) -> Result<(String, String), wit_types::Error> {
    if let Some((target_extension, op)) = name.split_once('/') {
        if target_extension.is_empty() || op.is_empty() || op.contains('/') {
            return Err(wit_types::Error {
                code: wit_types::ErrorCode::BadInput,
                message: format!(
                    "reactor mutation name must be '<extension-id>/<interface>.<op>', got '{name}'"
                ),
                path: Some("name".to_string()),
            });
        }
        return Ok((target_extension.to_string(), op.to_string()));
    }
    Ok((reactor_extension_id.to_string(), name.to_string()))
}

/// Embedded copy of `docs/manifest.schema.json`. Compiled into the
/// binary so a kernel deployment doesn't need the source tree to
/// validate manifests.
const MANIFEST_SCHEMA_BYTES: &str = include_str!("../../../docs/manifest.schema.json");

/// Compile the manifest schema once per process. Used by every
/// `register_from_manifest` call; without the cache, a 50-extension
/// boot would re-parse + re-compile the same schema 50 times.
fn compiled_manifest_schema() -> Result<&'static jsonschema::JSONSchema, String> {
    static COMPILED: std::sync::OnceLock<jsonschema::JSONSchema> = std::sync::OnceLock::new();
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

fn validate_manifest_against_schema(manifest: &Value, manifest_path: &Path) -> Result<(), String> {
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

/// Typed view of the extension manifest — only the host-enforced
/// fields. Deserialized once after schema validation so field names
/// live in one place and typos fail to compile rather than silently
/// reading `null`. The manifest schema is authoritative for required
/// fields; everything optional here defaults to empty.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireManifest {
    id: Option<String>,
    #[serde(default)]
    allowed_emits: Vec<String>,
    #[serde(default)]
    allowed_event_reads: Vec<String>,
    #[serde(default)]
    provides_extension_points: Vec<WireProvidedPoint>,
    #[serde(default)]
    requires_extension_points: Vec<WireRequiredPoint>,
    #[serde(default)]
    reactor: WireReactor,
    #[serde(default)]
    contributes: WireContributes,
    #[serde(default)]
    host_imports: Vec<String>,
    #[serde(default)]
    dispatch_routes: Vec<WireDispatchRoute>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireReactor {
    #[serde(default)]
    scope: WireScope,
    #[serde(default)]
    subscribes: Vec<String>,
    #[serde(default)]
    allowed_mutations: Vec<String>,
    #[serde(default)]
    allowed_emits: Vec<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireContributes {
    #[serde(default)]
    resource_kinds: Vec<WireResourceKind>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireResourceKind {
    name: String,
    prefix: Option<String>,
    #[serde(default)]
    scope: WireScope,
}

/// Contribution scope as it appears on the wire. Defaults to
/// `repository` (gated per-repo opt-in) to match the manifest schema.
#[derive(Debug, Clone, Copy, Default, Deserialize)]
#[serde(rename_all = "lowercase")]
enum WireScope {
    #[default]
    Repository,
    Instance,
}

impl From<WireScope> for crate::wasm_host::ContributionScope {
    fn from(scope: WireScope) -> Self {
        match scope {
            WireScope::Repository => crate::wasm_host::ContributionScope::Repository,
            WireScope::Instance => crate::wasm_host::ContributionScope::Instance,
        }
    }
}

/// A `providesExtensionPoints` entry on the wire: a named, versioned set
/// of ops the extension exposes for other extensions to synchronously
/// invoke.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireProvidedPoint {
    id: String,
    version: u32,
    ops: Vec<String>,
}

/// A `requiresExtensionPoints` entry on the wire: an exact provider point
/// + version this extension depends on.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireRequiredPoint {
    provider: String,
    point: String,
    version: u32,
}

/// A per-op dispatch-route declaration on the wire. `op` is the canonical
/// `"<interface>.<op>"` descriptor; `scope` is `"instance"` or
/// `"repository"`, and a repository-scoped route carries a typed
/// `derive` describing how the kernel finds the repository to gate.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WireDispatchRoute {
    op: String,
    #[serde(default)]
    scope: WireScope,
    #[serde(default)]
    derive: Option<WireRepoDerivation>,
}

/// Typed repository-derivation on the wire — a tagged object, never a
/// bare string. Today only `payloadField` is supported (the pre-invoke
/// gate phase); other strategies land with the post-invoke phase.
#[derive(Debug, Deserialize)]
#[serde(tag = "strategy", rename_all = "camelCase")]
enum WireRepoDerivation {
    #[serde(rename_all = "camelCase")]
    PayloadField { field: String },
}

/// Translate the wire dispatch-route declarations into a typed
/// [`RouteTable`]. Fails closed: a repository-scoped route without a
/// supported `derive` is a manifest error, surfaced at load.
fn route_table_from_wire(
    extension_id: &str,
    routes: &[WireDispatchRoute],
) -> Result<crate::route_scope::RouteTable, String> {
    use crate::route_scope::{DispatchRoute, DispatchScope, RepoDerivation};
    let mut entries = Vec::with_capacity(routes.len());
    for route in routes {
        let scope = match (route.scope, route.derive.as_ref()) {
            (WireScope::Instance, None) => DispatchScope::Instance,
            (WireScope::Instance, Some(_)) => {
                return Err(format!(
                    "{extension_id} dispatchRoute '{}' is instance-scoped but declares a repository derivation",
                    route.op
                ));
            }
            (WireScope::Repository, Some(WireRepoDerivation::PayloadField { field })) => {
                DispatchScope::Repository(RepoDerivation::PayloadField(field.clone()))
            }
            (WireScope::Repository, None) => {
                return Err(format!(
                    "{extension_id} dispatchRoute '{}' is repository-scoped but declares no derive",
                    route.op
                ));
            }
        };
        entries.push((route.op.clone(), DispatchRoute { scope }));
    }
    Ok(crate::route_scope::RouteTable::from_entries(entries))
}

fn parse_wire_manifest(json: &Value, manifest_path: &Path) -> Result<WireManifest, String> {
    serde_json::from_value(json.clone()).map_err(|e| {
        format!(
            "{} has unexpected manifest shape: {e}",
            manifest_path.display()
        )
    })
}

fn provided_points_from_wire(wire: &WireManifest) -> Vec<crate::extension_points::ProvidedPoint> {
    wire.provides_extension_points
        .iter()
        .map(|p| crate::extension_points::ProvidedPoint {
            id: p.id.clone(),
            version: p.version,
            ops: p.ops.clone(),
        })
        .collect()
}

fn required_points_from_wire(wire: &WireManifest) -> Vec<crate::extension_points::RequiredPoint> {
    wire.requires_extension_points
        .iter()
        .map(|r| crate::extension_points::RequiredPoint {
            provider: r.provider.clone(),
            point: r.point.clone(),
            version: r.version,
        })
        .collect()
}

fn host_manifest_from_wire(wire: &WireManifest) -> HostManifest {
    HostManifest {
        allowed_emits: wire.allowed_emits.clone(),
        allowed_event_reads: wire.allowed_event_reads.clone(),
        reactor_subscribes: wire.reactor.subscribes.clone(),
        reactor_allowed_mutations: wire.reactor.allowed_mutations.clone(),
        reactor_allowed_emits: wire.reactor.allowed_emits.clone(),
        reactor_scope: wire.reactor.scope.into(),
        contributes_resource_kinds: wire
            .contributes
            .resource_kinds
            .iter()
            .map(|k| k.name.clone())
            .collect(),
        has_repository_scoped_kinds: wire
            .contributes
            .resource_kinds
            .iter()
            .any(|k| crate::wasm_host::ContributionScope::from(k.scope).is_repository()),
        host_imports: wire.host_imports.clone(),
    }
}

fn register_kinds_from_wire(minter: &Arc<dyn IdMinter + Send + Sync>, wire: &WireManifest) {
    for kind in &wire.contributes.resource_kinds {
        // The manifest schema requires `prefix` on every resourceKinds
        // entry. Fall back to a name-derived default only if absent
        // (defensive — the validated schema rejects entries without
        // `prefix` before we reach this code).
        let prefix = kind
            .prefix
            .clone()
            .unwrap_or_else(|| prefix_for_kind(&kind.name));
        minter.register_kind(&kind.name, &prefix);
    }
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
    let mut state = host_state_for_op(HostStateForOp {
        extension_id: ext.id.clone(),
        extension_principal: ext.principal.clone(),
        current_principal: current_principal.to_string(),
        store,
        manifest: ext.manifest.clone(),
        extension_point_bindings: registry.consumer_bindings(&ext.id),
        clock: registry.clock.clone(),
        id_minter: registry.id_minter.clone(),
        log_sink: registry.log_sink.clone(),
        authz: registry.authz.clone(),
        ops_dispatcher: dispatcher,
        occ_tokens: registry.occ_tokens.clone(),
        minted_ids: registry.minted_ids.clone(),
        relationship_types: registry.relationship_types(),
        repo_enablement: registry.repo_enablement.clone(),
    });
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
/// The M2 canary dispatch is intentionally typed per extension: build.rs
/// emits the route table, and `wasm_invokers` owns the JSON ↔ WIT bridge for
/// extensions that have landed component crates.
#[derive(Clone)]
pub struct RegistryDispatcher {
    pub registry: WasmRegistry,
    pub store: Arc<crate::ExtensionRuntimeStore>,
}

impl OpsDispatcher for RegistryDispatcher {
    fn dispatch(
        &self,
        target_extension: &str,
        op: &str,
        payload: &[u8],
        current_principal: &str,
        depth: u32,
    ) -> Result<Vec<u8>, wit_types::Error> {
        self.dispatch_with_reactor_depth(target_extension, op, payload, current_principal, depth, 0)
    }

    fn dispatch_with_reactor_depth(
        &self,
        target_extension: &str,
        op: &str,
        payload: &[u8],
        current_principal: &str,
        depth: u32,
        reactor_depth: u32,
    ) -> Result<Vec<u8>, wit_types::Error> {
        let _ext = self
            .registry
            .get(target_extension)
            .ok_or_else(|| wit_types::Error {
                code: wit_types::ErrorCode::NotFound,
                message: format!("extension '{}' not registered", target_extension),
                path: None,
            })?;
        let info = resolve_cross_call_route(target_extension, op)?;
        let invoker = crate::generated_dispatch::invoker_for_extension(info.extension_id)
            .ok_or_else(|| wit_types::Error {
                code: wit_types::ErrorCode::Unavailable,
                message: format!(
                    "no typed WASM invoker registered for extension '{}'",
                    info.extension_id
                ),
                path: None,
            })?;
        invoker(
            &self.registry,
            self.store.clone(),
            current_principal,
            &info,
            payload,
            depth,
            reactor_depth,
        )
    }

    fn dispatch_event(&self, event: &wit_types::Event, depth: u32) -> usize {
        self.registry
            .dispatch_reactor_event(self.store.clone(), event, depth)
    }
}

fn resolve_cross_call_route(
    target_extension: &str,
    op: &str,
) -> Result<crate::generated_dispatch::DispatchInfo, wit_types::Error> {
    if !is_canonical_wit_op_route(op) {
        return Err(wit_types::Error {
            code: wit_types::ErrorCode::BadInput,
            message: format!("ops.invoke op must be canonical '<interface>.<op>', got '{op}'"),
            path: Some("op".to_string()),
        });
    }
    if let Some(info) = crate::generated_dispatch::dispatch_wit_route(target_extension, op) {
        return Ok(info);
    }
    Err(wit_types::Error {
        code: wit_types::ErrorCode::NotFound,
        message: format!("op '{op}' not found on extension '{target_extension}'"),
        path: None,
    })
}

fn is_canonical_wit_op_route(op: &str) -> bool {
    let Some((interface, operation)) = op.split_once('.') else {
        return false;
    };
    !interface.is_empty()
        && !operation.is_empty()
        && !interface.contains(['.', '/'])
        && !operation.contains(['.', '/'])
}

fn validate_event_pattern(pattern: &str) -> Result<(), String> {
    if pattern.is_empty() {
        return Err("pattern must not be empty".to_string());
    }
    for segment in pattern.split('.') {
        if segment == "*" {
            continue;
        }
        if !valid_event_segment(segment) {
            return Err(
                "segments must be '*' or lowercase kebab names starting with a letter".to_string(),
            );
        }
    }
    Ok(())
}

fn event_pattern_matches(pattern: &str, event_type: &str) -> bool {
    let pattern_segments = pattern.split('.').collect::<Vec<_>>();
    let event_segments = event_type.split('.').collect::<Vec<_>>();
    pattern_segments.len() == event_segments.len()
        && pattern_segments
            .iter()
            .zip(event_segments)
            .all(|(pattern, event)| *pattern == "*" || *pattern == event)
}

fn valid_event_segment(segment: &str) -> bool {
    let mut chars = segment.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    first.is_ascii_lowercase()
        && chars.all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-')
}

/// Test resolver that returns a fixed opt-in set keyed by repository
/// ref, bypassing the on-disk git/CUE path. Lets dispatch tests exercise
/// the gate without materialising a bare repo and comtrya CUE per case.
/// Shared by the in-module tests and the runtime-level tests in `main`.
#[cfg(test)]
pub(crate) struct StaticRepoEnablement {
    enabled: std::collections::BTreeMap<String, std::collections::BTreeSet<String>>,
}

#[cfg(test)]
impl StaticRepoEnablement {
    pub(crate) fn new(
        entries: impl IntoIterator<Item = (&'static str, Vec<&'static str>)>,
    ) -> std::sync::Arc<Self> {
        let enabled = entries
            .into_iter()
            .map(|(repo, ids)| {
                (
                    repo.to_string(),
                    ids.into_iter().map(str::to_string).collect(),
                )
            })
            .collect();
        std::sync::Arc::new(Self { enabled })
    }
}

#[cfg(test)]
impl RepoEnablementResolver for StaticRepoEnablement {
    fn enabled_extensions_for_repo(
        &self,
        _store: &crate::ExtensionRuntimeStore,
        repository_ref: &str,
    ) -> std::collections::BTreeSet<String> {
        self.enabled
            .get(repository_ref)
            .cloned()
            .unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn wire_route(json: serde_json::Value) -> WireDispatchRoute {
        serde_json::from_value(json).expect("parse WireDispatchRoute")
    }

    #[test]
    fn route_table_parses_repository_payload_field() {
        let routes = vec![wire_route(serde_json::json!({
            "op": "issues.open-issue",
            "scope": "repository",
            "derive": { "strategy": "payloadField", "field": "repository" }
        }))];
        let table = route_table_from_wire("ext_issues", &routes).expect("build table");
        let route = table.get("issues", "open-issue").expect("route present");
        assert_eq!(
            route.scope,
            crate::route_scope::DispatchScope::Repository(
                crate::route_scope::RepoDerivation::PayloadField("repository".to_string())
            )
        );
    }

    #[test]
    fn route_table_parses_instance_scope() {
        let routes = vec![wire_route(serde_json::json!({
            "op": "issues.by-refs-issue",
            "scope": "instance"
        }))];
        let table = route_table_from_wire("ext_issues", &routes).expect("build table");
        assert_eq!(
            table
                .get("issues", "by-refs-issue")
                .expect("route present")
                .scope,
            crate::route_scope::DispatchScope::Instance
        );
    }

    #[test]
    fn route_table_rejects_repository_route_without_derive() {
        let routes = vec![wire_route(serde_json::json!({
            "op": "issues.open-issue",
            "scope": "repository"
        }))];
        let err = route_table_from_wire("ext_issues", &routes).expect_err("must fail closed");
        assert!(err.contains("no derive"), "unexpected: {err}");
    }

    #[test]
    fn route_table_rejects_instance_route_with_derive() {
        let routes = vec![wire_route(serde_json::json!({
            "op": "issues.by-refs-issue",
            "scope": "instance",
            "derive": { "strategy": "payloadField", "field": "repository" }
        }))];
        let err = route_table_from_wire("ext_issues", &routes).expect_err("must fail closed");
        assert!(err.contains("instance-scoped"), "unexpected: {err}");
    }

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
        assert!(
            ext.manifest
                .contributes_resource_kinds
                .contains(&"issue".to_string())
        );
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
        let err =
            validate_manifest_against_schema(&bad, std::path::Path::new("test://bad-id.json"))
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
    fn manifest_schema_rejects_payload_field_derive_without_field() {
        // The schema and the Rust `WireRepoDerivation::PayloadField { field }`
        // must agree: a payloadField derive without `field` is invalid. If
        // the schema accepted it, it would pass validation and then fail
        // deserialization — the gap this guards.
        let bad = serde_json::json!({
            "schemaVersion": "comtrya.extension/v1",
            "id": "ext_issues",
            "name": "x",
            "version": "0.1.0",
            "publisher": "x",
            "dispatchRoutes": [
                { "op": "issues.open-issue", "scope": "repository",
                  "derive": { "strategy": "payloadField" } }
            ]
        });
        let err =
            validate_manifest_against_schema(&bad, std::path::Path::new("test://no-field.json"))
                .expect_err("schema must reject a payloadField derive with no field");
        assert!(err.contains("schema validation"), "error: {err}");
    }

    #[test]
    fn manifest_schema_accepts_well_formed_dispatch_route() {
        let ok = serde_json::json!({
            "schemaVersion": "comtrya.extension/v1",
            "id": "ext_issues",
            "name": "x",
            "version": "0.1.0",
            "publisher": "x",
            "dispatchRoutes": [
                { "op": "issues.open-issue", "scope": "repository",
                  "derive": { "strategy": "payloadField", "field": "repository" } },
                { "op": "issues.by-refs-issue", "scope": "instance" }
            ]
        });
        validate_manifest_against_schema(&ok, std::path::Path::new("test://ok.json"))
            .expect("well-formed dispatchRoutes must validate");
    }

    #[test]
    fn manifest_schema_rejects_symmetric_relationship_participation() {
        // The schema mirrors the loader: requiresParticipation gates on the
        // source endpoint and is ill-defined for a symmetric type, so the
        // combination must fail schema validation.
        let bad = serde_json::json!({
            "schemaVersion": "comtrya.extension/v1",
            "id": "ext_issues",
            "name": "x",
            "version": "0.1.0",
            "publisher": "x",
            "contributes": {
                "relationshipTypes": [{
                    "id": "ext_issues.sym-gated",
                    "kind": "comtrya://rel/relates-to",
                    "sourceKinds": ["issue"],
                    "targetKinds": ["epic"],
                    "outgoingLabel": "relates to",
                    "incomingLabel": "relates to",
                    "symmetric": true,
                    "requiresParticipation": "ext_issues"
                }]
            }
        });
        let err =
            validate_manifest_against_schema(&bad, std::path::Path::new("test://sym-gated.json"))
                .expect_err("schema must reject symmetric + requiresParticipation");
        assert!(err.contains("schema validation"), "error: {err}");
    }

    #[test]
    fn manifest_schema_accepts_real_ext_epics_manifest() {
        // ext_epics ships an asymmetric participation-gated relationship type
        // (issue -> epic part-of, requiresParticipation: ext_epics).
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_epics/manifest.json");
        let text = std::fs::read_to_string(&path).expect("read manifest");
        let json: Value = serde_json::from_str(&text).expect("parse manifest");
        validate_manifest_against_schema(&json, &path)
            .expect("ext_epics manifest must validate against the schema");
    }

    #[test]
    fn reactor_allowed_mutations_accept_bare_same_extension_op() {
        // Regression for #80: the WIT contract allows a reactor mutation to
        // name one of the extension's OWN ops with no `<target>/` prefix.
        // The manifest schema must accept that bare form as well as the
        // fully-qualified `<extension-id>/<op>` form.
        let manifest = serde_json::json!({
            "schemaVersion": "comtrya.extension/v1",
            "id": "ext_issues",
            "name": "x",
            "version": "0.1.0",
            "publisher": "x",
            "reactor": {
                "allowedMutations": ["issues.close-issue", "ext_epics/epics.close-epic"]
            }
        });
        validate_manifest_against_schema(
            &manifest,
            std::path::Path::new("test://bare-mutation.json"),
        )
        .expect("bare same-extension and qualified mutations must validate");
    }

    #[test]
    fn reactor_allowed_mutations_reject_malformed_op() {
        // A dangling slash (no op after the target) is still invalid.
        let manifest = serde_json::json!({
            "schemaVersion": "comtrya.extension/v1",
            "id": "ext_issues",
            "name": "x",
            "version": "0.1.0",
            "publisher": "x",
            "reactor": {
                "allowedMutations": ["ext_epics/"]
            }
        });
        let err = validate_manifest_against_schema(
            &manifest,
            std::path::Path::new("test://bad-mutation.json"),
        )
        .expect_err("a dangling-slash mutation must be rejected");
        assert!(err.contains("schema validation"), "error: {}", err);
    }

    #[test]
    fn parse_host_manifest_handles_missing_optional_fields() {
        let minimal = serde_json::json!({ "id": "ext_minimal" });
        let wire = parse_wire_manifest(&minimal, std::path::Path::new("test-manifest.json"))
            .expect("parse");
        assert_eq!(wire.id.as_deref(), Some("ext_minimal"));
        let manifest = host_manifest_from_wire(&wire);
        assert!(manifest.allowed_emits.is_empty());
        assert!(manifest.reactor_subscribes.is_empty());
        assert!(manifest.contributes_resource_kinds.is_empty());
        assert!(manifest.host_imports.is_empty());
    }

    #[test]
    fn cross_call_route_resolution_requires_canonical_wit_route() {
        let manifest_style = resolve_cross_call_route("ext_issues", "issues.close-issue")
            .expect("canonical route resolves");
        assert_eq!(manifest_style.extension_id, "ext_issues");
        assert_eq!(manifest_style.interface_name, "issues");
        assert_eq!(manifest_style.op_name, "close-issue");

        let slash_style = resolve_cross_call_route("ext_issues", "issues/close-issue")
            .expect_err("slash-style route is not canonical");
        assert!(matches!(slash_style.code, wit_types::ErrorCode::BadInput));

        let plain = resolve_cross_call_route("ext_issues", "close-issue")
            .expect_err("plain op name is ambiguous and not canonical");
        assert!(matches!(plain.code, wit_types::ErrorCode::BadInput));
    }

    #[test]
    fn registry_dispatcher_invokes_ext_issues_wasm_and_emits_events() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues");
        let wasm = root.join("dist/ext_issues.wasm");
        assert!(
            wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_issues` before this test",
            wasm.display()
        );

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_issues");
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            "comtrya://workspace/ws_dispatcher/repository/repo_dispatcher",
            vec!["ext_issues"],
        )]));
        let tmp = tempdir_for_test("comtrya-registry-dispatch");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let dispatcher = RegistryDispatcher {
            registry,
            store: store.clone(),
        };
        let principal = "comtrya://user/usr_dispatcher_test";

        let opened_bytes = dispatcher
            .dispatch(
                "ext_issues",
                "issues.open-issue",
                &serde_json::to_vec(&serde_json::json!({
                    "repository": "comtrya://workspace/ws_dispatcher/repository/repo_dispatcher",
                    "title": "dispatcher smoke",
                    "bodyMarkdown": "opened through ops.invoke",
                }))
                .expect("encode open payload"),
                principal,
                0,
            )
            .expect("open issue through dispatcher");
        let opened: Value = serde_json::from_slice(&opened_bytes).expect("parse opened issue");
        assert_eq!(opened.get("state").and_then(Value::as_str), Some("open"));
        assert_eq!(
            opened.get("authorRef").and_then(Value::as_str),
            Some(principal)
        );
        let issue_id = opened
            .get("id")
            .and_then(Value::as_str)
            .expect("opened issue id")
            .to_string();

        let closed_bytes = dispatcher
            .dispatch(
                "ext_issues",
                "issues.close-issue",
                &serde_json::to_vec(&serde_json::json!({
                    "id": issue_id,
                    "reason": "done by dispatcher",
                }))
                .expect("encode close payload"),
                principal,
                0,
            )
            .expect("close issue through dispatcher");
        let closed: Value = serde_json::from_slice(&closed_bytes).expect("parse closed issue");
        assert_eq!(closed.get("state").and_then(Value::as_str), Some("closed"));
        assert_eq!(
            closed.get("stateReason").and_then(Value::as_str),
            Some("done by dispatcher")
        );

        let records = store.load_records().expect("load records");
        let issue_rec = records
            .iter()
            .find(|r| r.collection == "issues" && r.id == issue_id)
            .expect("issue persisted");
        assert_eq!(
            issue_rec.data.get("state").and_then(Value::as_str),
            Some("closed")
        );
        assert_eq!(
            issue_rec.data.get("stateReason").and_then(Value::as_str),
            Some("done by dispatcher")
        );

        let event_log = std::fs::read_to_string(store.events_path()).expect("read events");
        assert!(
            event_log.contains("dev.comtrya.issues.opened"),
            "open event missing from {event_log}"
        );
        assert!(
            event_log.contains("dev.comtrya.issues.closed"),
            "closed event missing from {event_log}"
        );
    }

    #[test]
    fn registry_registers_and_routes_wasm_reactor_subscriptions() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_pull_requests");
        let wasm = root.join("dist/ext_pull_requests.wasm");
        assert!(
            wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_pull_requests` before this test",
            wasm.display()
        );

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_pull_requests");
        let tmp = tempdir_for_test("comtrya-reactor-subscriptions");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        registry
            .register_reactor_subscriptions(store.clone())
            .expect("register reactor subscriptions");

        // Seed the pull document the merged event points at, carrying the
        // source repository ref, and enable ext_pull_requests for that
        // repo so the repository-scoped reactor gate admits the dispatch.
        let source_repository = "comtrya://workspace/ws_reactor/repository/repo_reactor";
        store
            .create_document(crate::ExtensionDocumentRecord {
                schema_version: crate::EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
                owner_extension: "ext_pull_requests".to_string(),
                collection: "pull_requests".to_string(),
                id: "pul_reactor_test".to_string(),
                resource: "comtrya://pull-request/pul_reactor_test".to_string(),
                resource_refs: vec![
                    "comtrya://pull-request/pul_reactor_test".to_string(),
                    source_repository.to_string(),
                ],
                visibility: "PRIVATE".to_string(),
                indexed_fields: std::collections::BTreeMap::new(),
                version: 1,
                updated_at: "1970-01-01T00:00:00Z".to_string(),
                data: serde_json::json!({ "id": "pul_reactor_test" }),
            })
            .expect("seed pull document");
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            source_repository,
            vec!["ext_pull_requests"],
        )]));

        let subscriptions = registry.reactor_subscriptions();
        assert_eq!(
            subscriptions.get("ext_pull_requests"),
            Some(&vec!["dev.comtrya.pull-request.merged".to_string()])
        );
        assert_eq!(
            registry.subscribers_for_event("dev.comtrya.pull-request.merged"),
            vec!["ext_pull_requests".to_string()]
        );
        assert!(
            registry
                .subscribers_for_event("dev.comtrya.pull-request.closed")
                .is_empty()
        );

        let dispatcher = RegistryDispatcher {
            registry: registry.clone(),
            store,
        };
        let event = wit_types::Event {
            id: "evt_reactor_test".to_string(),
            event_type: "dev.comtrya.pull-request.merged".to_string(),
            payload: serde_json::to_vec(&serde_json::json!({
                "pullRequestRef": "comtrya://pull-request/pul_reactor_test"
            }))
            .expect("encode event payload"),
            timestamp_ms: 1,
            source_uri: "comtrya://pull-request/pul_reactor_test".to_string(),
            emitter_extension: "ext_pull_requests".to_string(),
        };
        assert_eq!(OpsDispatcher::dispatch_event(&dispatcher, &event, 0), 1);
    }

    // ---- Phase 2 per-repo extension opt-in enforcement (#137) ----

    #[test]
    fn repository_id_from_ref_parses_known_shapes_and_rejects_malformed() {
        assert_eq!(
            repository_id_from_ref("comtrya://repository/repo_a"),
            Some("repo_a")
        );
        assert_eq!(
            repository_id_from_ref("comtrya://workspace/ws_a/repository/repo_b"),
            Some("repo_b")
        );
        // Malformed: empty segments and non-repository refs return None so
        // they fall through to the extension's own input validation.
        assert_eq!(
            repository_id_from_ref("comtrya://workspace//repository/repo_c"),
            None
        );
        assert_eq!(
            repository_id_from_ref("comtrya://workspace/ws_a/repository/"),
            None
        );
        assert_eq!(repository_id_from_ref("comtrya://repository/"), None);
        assert_eq!(repository_id_from_ref("comtrya://workspace/ws_a"), None);
        assert_eq!(repository_id_from_ref("comtrya://pull-request/pul_a"), None);
        assert_eq!(repository_id_from_ref("not-a-uri"), None);
    }

    /// End-to-end production resolver: a bare repo whose comtrya CUE
    /// declares `repository.extensions`, reached through a
    /// repository document (id -> path), surfaces that opt-in set.
    #[test]
    fn cue_repo_enablement_reads_enabled_extensions_from_repo_cue() {
        let tmp = tempdir_for_test("comtrya-cue-enablement");
        let data_dir = tmp.join("data");
        let repositories = data_dir.join("repositories");
        std::fs::create_dir_all(&repositories).expect("create repositories dir");

        // Author the repo in a workdir, then mirror-clone it bare into the
        // repositories root at `<path>.git`, matching the production layout.
        let work = tmp.join("work");
        std::fs::create_dir_all(&work).expect("create work dir");
        for args in [
            ["init", "-q", "-b", "main"].as_slice(),
            ["config", "user.email", "cue-enable@comtrya"].as_slice(),
            ["config", "user.name", "cue-enable"].as_slice(),
            ["config", "commit.gpgsign", "false"].as_slice(),
        ] {
            assert!(
                std::process::Command::new("git")
                    .current_dir(&work)
                    .args(args)
                    .status()
                    .expect("run git")
                    .success()
            );
        }
        std::fs::write(
            work.join("comtrya.cue"),
            concat!(
                "package comtrya\n",
                "import \"github.com/comtrya/comtrya/schema\"\n",
                "repository: schema.#Repository & { extensions: [\"ext_issues\"] }\n",
            ),
        )
        .expect("write comtrya.cue");
        for args in [
            ["add", "comtrya.cue"].as_slice(),
            ["commit", "-q", "-m", "seed"].as_slice(),
        ] {
            assert!(
                std::process::Command::new("git")
                    .current_dir(&work)
                    .args(args)
                    .status()
                    .expect("run git")
                    .success()
            );
        }
        let git_dir = repositories.join("acme/widget.git");
        std::fs::create_dir_all(git_dir.parent().unwrap()).expect("create owner dir");
        assert!(
            std::process::Command::new("git")
                .args(["clone", "--bare", "-q"])
                .arg(&work)
                .arg(&git_dir)
                .status()
                .expect("run git clone --bare")
                .success()
        );

        // Repository document maps the opaque id to the on-disk path.
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&data_dir).expect("open store"));
        store
            .create_document(crate::ExtensionDocumentRecord {
                schema_version: crate::EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
                owner_extension: "core".to_string(),
                collection: "repositories".to_string(),
                id: "repo_widget".to_string(),
                resource: "comtrya://repository/repo_widget".to_string(),
                resource_refs: vec!["comtrya://repository/repo_widget".to_string()],
                visibility: "PRIVATE".to_string(),
                indexed_fields: std::collections::BTreeMap::new(),
                version: 1,
                updated_at: "1970-01-01T00:00:00Z".to_string(),
                data: serde_json::json!({ "id": "repo_widget", "path": "acme/widget" }),
            })
            .expect("seed repository document");

        let resolver = CueRepoEnablement::new(
            data_dir.clone(),
            Arc::new(crate::cue_config::CueConfigCache::new()),
            Vec::new(),
        );
        let enabled =
            resolver.enabled_extensions_for_repo(&store, "comtrya://repository/repo_widget");
        assert!(
            enabled.contains("ext_issues"),
            "expected ext_issues in opt-in set, got {enabled:?}"
        );
        let workspace_scoped = resolver.enabled_extensions_for_repo(
            &store,
            "comtrya://workspace/ws_default/repository/repo_widget",
        );
        assert_eq!(
            workspace_scoped, enabled,
            "workspace-scoped repository refs must resolve through the same opt-in set",
        );
        assert!(
            !enabled.contains("ext_checks"),
            "ext_checks not declared; must be absent, got {enabled:?}"
        );
    }

    fn ext_issues_root() -> std::path::PathBuf {
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues")
    }

    /// A `dispatchRoutes` entry naming an op that is not a real WIT export
    /// fails the load — the manifest's route table is cross-checked
    /// against the generated WIT routes at registration.
    #[test]
    fn register_rejects_dispatch_route_for_unknown_wit_op() {
        let src = ext_issues_root();
        if !src.join("dist/ext_issues.wasm").is_file() {
            eprintln!("SKIP register_rejects_dispatch_route_for_unknown_wit_op: build ext_issues");
            return;
        }
        // Copy the real extension into a tempdir, then inject a bogus
        // dispatch route into the manifest.
        let tmp = tempdir_for_test("comtrya-bogus-route");
        let dst = tmp.join("ext_issues");
        copy_dir_recursive(&src, &dst).expect("copy ext_issues");
        let manifest_path = dst.join("manifest.json");
        let mut manifest: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&manifest_path).expect("read manifest"))
                .expect("parse manifest");
        manifest["dispatchRoutes"] = serde_json::json!([
            { "op": "issues.no-such-op", "scope": "instance" }
        ]);
        std::fs::write(
            &manifest_path,
            serde_json::to_string_pretty(&manifest).expect("encode manifest"),
        )
        .expect("write manifest");

        let registry = WasmRegistry::new().expect("build registry");
        let err = registry
            .register_from_manifest(&dst)
            .expect_err("registration must fail for an unknown WIT op");
        assert!(
            err.contains("does not match any WIT export"),
            "unexpected error: {err}"
        );
    }

    fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
        std::fs::create_dir_all(dst)?;
        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let file_type = entry.file_type()?;
            // Skip symlinks (e.g. wit/deps/platform); registration only
            // needs the manifest and the dist/ wasm, both regular files.
            if file_type.is_symlink() {
                continue;
            }
            let from = entry.path();
            let to = dst.join(entry.file_name());
            if file_type.is_dir() {
                copy_dir_recursive(&from, &to)?;
            } else {
                std::fs::copy(&from, &to)?;
            }
        }
        Ok(())
    }

    fn first_party_root(id: &str) -> std::path::PathBuf {
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party")
            .join(id)
    }

    /// The real first-party manifests resolve into the expected cross-call
    /// bindings: ext_epics→ext_issues (issue-membership) and
    /// ext_pull_requests→ext_issues (issue-linkage). Exercises the full
    /// load + two-pass resolution path against the shipped wasm + manifests.
    #[test]
    fn first_party_extension_points_resolve_expected_bindings() {
        let registry = WasmRegistry::new().expect("build registry");
        for id in ["ext_issues", "ext_epics", "ext_pull_requests"] {
            let root = first_party_root(id);
            if !root.join(format!("dist/{id}.wasm")).is_file() {
                eprintln!(
                    "SKIP first_party_extension_points_resolve_expected_bindings: build {id}"
                );
                return;
            }
            registry
                .register_from_manifest(&root)
                .unwrap_or_else(|e| panic!("register {id}: {e}"));
        }
        registry
            .resolve_extension_point_bindings()
            .expect("first-party requirements must resolve");

        let epics = registry.consumer_bindings("ext_epics");
        assert!(
            epics.permits("ext_issues", "issues.state-counts-for-refs-issue"),
            "ext_epics must reach the issue-membership op"
        );
        assert!(
            !epics.permits("ext_issues", "issues.close-issue"),
            "ext_epics must NOT reach an op outside its required point"
        );

        let pulls = registry.consumer_bindings("ext_pull_requests");
        assert!(pulls.permits("ext_issues", "issues.close-issue"));
        assert!(pulls.permits("ext_issues", "issues.by-ref-issue"));

        // A provider that requires nothing has no binding entry, and so
        // permits no cross-calls at all.
        assert!(
            !registry
                .consumer_bindings("ext_issues")
                .permits("ext_epics", "epics.get-epic")
        );
    }

    /// An unresolved `requiresExtensionPoints` aborts the load (fail
    /// closed) rather than silently leaving the consumer unable to call.
    #[test]
    fn resolve_extension_point_bindings_fails_closed_on_unknown_provider() {
        let src = first_party_root("ext_epics");
        if !src.join("dist/ext_epics.wasm").is_file() {
            eprintln!("SKIP resolve_extension_point_bindings_fails_closed: build ext_epics");
            return;
        }
        // Copy ext_epics and point its requirement at a provider we do not
        // load, so resolution cannot satisfy it.
        let tmp = tempdir_for_test("comtrya-unresolved");
        let dst = tmp.join("ext_epics");
        copy_dir_recursive(&src, &dst).expect("copy ext_epics");
        let manifest_path = dst.join("manifest.json");
        let mut manifest: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&manifest_path).expect("read manifest"))
                .expect("parse manifest");
        manifest["requiresExtensionPoints"] = serde_json::json!([
            { "provider": "ext_absent", "point": "nope", "version": 1 }
        ]);
        std::fs::write(
            &manifest_path,
            serde_json::to_string_pretty(&manifest).expect("encode manifest"),
        )
        .expect("write manifest");

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&dst)
            .expect("register (load succeeds; resolution is the gate)");
        let err = registry
            .resolve_extension_point_bindings()
            .expect_err("unresolved requirement must fail the resolution pass");
        assert!(
            err.contains("no loaded extension provides"),
            "unexpected error: {err}"
        );
    }

    /// A repository-scoped op against a repo that has NOT opted into the
    /// extension is rejected with Forbidden, before any work is done.
    #[test]
    fn op_rejected_when_repo_has_not_enabled_extension() {
        let root = ext_issues_root();
        if !root.join("dist/ext_issues.wasm").is_file() {
            eprintln!("SKIP op_rejected_when_repo_has_not_enabled_extension: build ext_issues");
            return;
        }
        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_issues");
        // Resolver installed, but this repo's opt-in set does NOT include
        // ext_issues (it enables a different extension).
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            "comtrya://repository/repo_gated_off",
            vec!["ext_pull_requests"],
        )]));
        let tmp = tempdir_for_test("comtrya-gate-off");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let dispatcher = RegistryDispatcher { registry, store };

        let err = dispatcher
            .dispatch(
                "ext_issues",
                "issues.open-issue",
                &serde_json::to_vec(&serde_json::json!({
                    "repository": "comtrya://repository/repo_gated_off",
                    "title": "should be blocked",
                    "bodyMarkdown": "blocked by per-repo gate",
                }))
                .expect("encode payload"),
                "comtrya://user/usr_gate_test",
                0,
            )
            .expect_err("op must be Forbidden when extension is not enabled for the repo");
        assert!(matches!(err.code, wit_types::ErrorCode::Forbidden));
        assert!(
            err.message.contains("not enabled for repository"),
            "unexpected message: {}",
            err.message
        );
    }

    /// The same op against a repo that HAS opted into the extension
    /// succeeds.
    #[test]
    fn op_allowed_when_repo_has_enabled_extension() {
        let root = ext_issues_root();
        if !root.join("dist/ext_issues.wasm").is_file() {
            eprintln!("SKIP op_allowed_when_repo_has_enabled_extension: build ext_issues");
            return;
        }
        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_issues");
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            "comtrya://workspace/ws_gated_on/repository/repo_gated_on",
            vec!["ext_issues"],
        )]));
        let tmp = tempdir_for_test("comtrya-gate-on");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let dispatcher = RegistryDispatcher { registry, store };

        let opened = dispatcher
            .dispatch(
                "ext_issues",
                "issues.open-issue",
                &serde_json::to_vec(&serde_json::json!({
                    "repository": "comtrya://workspace/ws_gated_on/repository/repo_gated_on",
                    "title": "allowed",
                    "bodyMarkdown": "admitted by per-repo gate",
                }))
                .expect("encode payload"),
                "comtrya://user/usr_gate_test",
                0,
            )
            .expect("op must succeed when extension is enabled for the repo");
        let value: Value = serde_json::from_slice(&opened).expect("parse opened issue");
        assert_eq!(value.get("state").and_then(Value::as_str), Some("open"));
    }

    /// An extension with no repository-scoped contributions is never
    /// gated: the gate helper returns Ok even with no opt-in installed.
    #[test]
    fn instance_scoped_extension_is_never_gated() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_workspace_home");
        if !root.join("dist/ext_workspace_home.wasm").is_file() {
            eprintln!("SKIP instance_scoped_extension_is_never_gated: build ext_workspace_home");
            return;
        }
        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_workspace_home");
        // No resolver installed at all. A repository-scoped extension
        // would fail closed here; an instance-scoped one must not.
        let tmp = tempdir_for_test("comtrya-gate-instance");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        assert!(
            !registry.extension_is_repository_scoped("ext_workspace_home"),
            "ext_workspace_home has no repository-scoped contributions"
        );
        registry
            .ensure_extension_enabled_for_repo(
                &store,
                "comtrya://repository/repo_anything",
                "ext_workspace_home",
            )
            .expect("instance-scoped extension must never be gated");
    }

    /// A repository-scoped reactor subscriber is skipped when the event's
    /// source repository has not opted into it (dispatch count is 0).
    #[test]
    fn reactor_skipped_for_non_enabled_repo() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_pull_requests");
        if !root.join("dist/ext_pull_requests.wasm").is_file() {
            eprintln!("SKIP reactor_skipped_for_non_enabled_repo: build ext_pull_requests");
            return;
        }
        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_pull_requests");
        let tmp = tempdir_for_test("comtrya-reactor-gate-off");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        registry
            .register_reactor_subscriptions(store.clone())
            .expect("register reactor subscriptions");

        // Seed the source pull document carrying a repository ref, but do
        // NOT enable ext_pull_requests for that repo.
        let source_repository = "comtrya://workspace/ws_skip/repository/repo_skip";
        store
            .create_document(crate::ExtensionDocumentRecord {
                schema_version: crate::EXTENSION_STORAGE_SCHEMA_VERSION.to_string(),
                owner_extension: "ext_pull_requests".to_string(),
                collection: "pull_requests".to_string(),
                id: "pul_skip".to_string(),
                resource: "comtrya://pull-request/pul_skip".to_string(),
                resource_refs: vec![
                    "comtrya://pull-request/pul_skip".to_string(),
                    source_repository.to_string(),
                ],
                visibility: "PRIVATE".to_string(),
                indexed_fields: std::collections::BTreeMap::new(),
                version: 1,
                updated_at: "1970-01-01T00:00:00Z".to_string(),
                data: serde_json::json!({ "id": "pul_skip" }),
            })
            .expect("seed pull document");
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            source_repository,
            // A different extension is enabled, not ext_pull_requests.
            vec!["ext_issues"],
        )]));

        let dispatcher = RegistryDispatcher {
            registry: registry.clone(),
            store,
        };
        let event = wit_types::Event {
            id: "evt_skip".to_string(),
            event_type: "dev.comtrya.pull-request.merged".to_string(),
            payload: serde_json::to_vec(&serde_json::json!({
                "pullRequestRef": "comtrya://pull-request/pul_skip"
            }))
            .expect("encode event payload"),
            timestamp_ms: 1,
            source_uri: "comtrya://pull-request/pul_skip".to_string(),
            emitter_extension: "ext_pull_requests".to_string(),
        };
        assert_eq!(
            OpsDispatcher::dispatch_event(&dispatcher, &event, 0),
            0,
            "reactor must be skipped for a repo that has not enabled the extension"
        );
    }

    #[test]
    fn registry_rejects_reactor_subscriptions_not_declared_in_manifest() {
        let source_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_pull_requests");
        let source_wasm = source_root.join("dist/ext_pull_requests.wasm");
        assert!(
            source_wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_pull_requests` before this test",
            source_wasm.display()
        );

        let tmp = tempdir_for_test("comtrya-reactor-subscription-manifest-gate");
        let ext_root = tmp.join("ext_pull_requests");
        std::fs::create_dir_all(ext_root.join("dist")).expect("mkdir fixture extension");
        let mut manifest: Value = serde_json::from_str(
            &std::fs::read_to_string(source_root.join("manifest.json")).expect("read manifest"),
        )
        .expect("parse manifest");
        manifest["reactor"]["subscribes"] = serde_json::json!([]);
        std::fs::write(
            ext_root.join("manifest.json"),
            serde_json::to_vec_pretty(&manifest).expect("encode manifest"),
        )
        .expect("write manifest");
        std::fs::copy(source_wasm, ext_root.join("dist/ext_pull_requests.wasm"))
            .expect("copy wasm fixture");

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&ext_root)
            .expect("register ext_pull_requests fixture");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let err = registry
            .register_reactor_subscriptions(store)
            .expect_err("component subscriptions must be declared in manifest");
        assert!(
            err.contains("not declared in manifest reactor.subscribes"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn registry_drops_reactor_dispatch_at_depth_cap_and_appends_observability_event() {
        let registry = WasmRegistry::new().expect("build registry");
        registry
            .reactor_subscriptions
            .write()
            .expect("reactor subscription write lock")
            .insert(
                "ext_pull_requests".to_string(),
                vec!["dev.test.loop".to_string()],
            );
        let tmp = tempdir_for_test("comtrya-reactor-depth-cap");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let event = wit_types::Event {
            id: "evt_depth_cap_test".to_string(),
            event_type: "dev.test.loop".to_string(),
            payload: Vec::new(),
            timestamp_ms: 1,
            source_uri: "comtrya://extension/ext_test".to_string(),
            emitter_extension: "ext_test".to_string(),
        };

        assert_eq!(
            registry.dispatch_reactor_event(store.clone(), &event, REACTOR_RECURSION_DEPTH_CAP),
            0
        );

        let event_log = std::fs::read_to_string(store.events_path()).expect("read events");
        assert!(
            event_log.contains(REACTION_DEPTH_EXCEEDED_EVENT),
            "depth exceeded event missing from {event_log}"
        );
    }

    #[test]
    fn registry_emit_event_reaction_recurses_with_depth_cap() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_pull_requests");
        let wasm = root.join("dist/ext_pull_requests.wasm");
        assert!(
            wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_pull_requests` before this test",
            wasm.display()
        );

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_pull_requests");
        let original = registry
            .get("ext_pull_requests")
            .expect("get ext_pull_requests");
        let mut manifest = (*original.manifest).clone();
        manifest.reactor_allowed_emits = vec!["dev.test.loop".to_string()];
        let loaded = Arc::new(LoadedExtension {
            id: original.id.clone(),
            principal: original.principal.clone(),
            manifest: Arc::new(manifest),
            route_table: original.route_table.clone(),
            provides: original.provides.clone(),
            requires: original.requires.clone(),
            component: original.component.clone(),
        });
        registry
            .extensions
            .write()
            .expect("extension write lock")
            .insert("ext_pull_requests".to_string(), loaded);
        registry
            .reactor_subscriptions
            .write()
            .expect("reactor subscription write lock")
            .insert(
                "ext_pull_requests".to_string(),
                vec!["dev.test.loop".to_string()],
            );
        let tmp = tempdir_for_test("comtrya-reactor-emit-depth-cap");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));

        registry.apply_reactor_reactions(
            store.clone(),
            "ext_pull_requests",
            vec![WasmReaction::EmitEvent {
                event_type: "dev.test.loop".to_string(),
                payload: b"{}".to_vec(),
            }],
            REACTOR_RECURSION_DEPTH_CAP - 1,
        );

        let event_log = std::fs::read_to_string(store.events_path()).expect("read events");
        assert!(
            event_log.contains("dev.test.loop"),
            "emitted event missing from {event_log}"
        );
        assert!(
            event_log.contains(REACTION_DEPTH_EXCEEDED_EVENT),
            "depth exceeded event missing from {event_log}"
        );
    }

    #[test]
    fn reactor_cross_extension_mutation_requires_extension_point_binding() {
        // Regression for the TNQ-3 P1 reactor binding bypass: a reactor
        // listing `extB/iface.op` in `reactor.allowedMutations` must
        // ALSO hold a resolved `requiresExtensionPoints` binding to
        // extB, mirroring the synchronous `HostState::invoke` gate.
        //
        // The test installs `ext_pull_requests` with no bindings,
        // marks `ext_nonexistent/foo.bar` as an allowed mutation, and
        // fires an `InvokeMutation` reaction. Before the fix the
        // registry would call `OpsDispatcher::dispatch_with_reactor_depth`
        // and log a "reactor mutation dispatch failed" warning (the
        // target doesn't exist). With the fix the gate skips the
        // dispatch entirely; the event log records nothing.
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_pull_requests");
        let wasm = root.join("dist/ext_pull_requests.wasm");
        assert!(
            wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_pull_requests` before this test",
            wasm.display()
        );

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_pull_requests");
        let original = registry
            .get("ext_pull_requests")
            .expect("get ext_pull_requests");
        let mut manifest = (*original.manifest).clone();
        manifest.reactor_allowed_mutations = vec!["ext_nonexistent/foo.bar".to_string()];
        let loaded = Arc::new(LoadedExtension {
            id: original.id.clone(),
            principal: original.principal.clone(),
            manifest: Arc::new(manifest),
            route_table: original.route_table.clone(),
            provides: original.provides.clone(),
            requires: original.requires.clone(),
            component: original.component.clone(),
        });
        registry
            .extensions
            .write()
            .expect("extension write lock")
            .insert("ext_pull_requests".to_string(), loaded);
        // Bindings table is empty for ext_pull_requests — the gate
        // must refuse the cross-extension call on that ground alone.
        let tmp = tempdir_for_test("comtrya-reactor-cross-ext-binding");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));

        registry.apply_reactor_reactions(
            store.clone(),
            "ext_pull_requests",
            vec![WasmReaction::InvokeMutation {
                name: "ext_nonexistent/foo.bar".to_string(),
                payload: b"{}".to_vec(),
            }],
            0,
        );

        // No dispatch attempt → no event of any kind in the log.
        let events_path = store.events_path();
        let event_log = std::fs::read_to_string(&events_path).unwrap_or_default();
        assert!(
            event_log.is_empty(),
            "reactor gate must skip the cross-extension dispatch when no extension-point \
             binding resolves it; event log was: {event_log}"
        );
    }

    #[test]
    fn reactor_mutation_names_support_cross_extension_and_local_forms() {
        let cross =
            parse_reactor_mutation_name("ext_pull_requests", "ext_issues/issues.close-issue")
                .expect("cross-extension mutation name");
        assert_eq!(
            cross,
            ("ext_issues".to_string(), "issues.close-issue".to_string())
        );

        let local = parse_reactor_mutation_name("ext_pull_requests", "pulls.close-pull")
            .expect("local mutation name");
        assert_eq!(
            local,
            (
                "ext_pull_requests".to_string(),
                "pulls.close-pull".to_string()
            )
        );

        let err = parse_reactor_mutation_name("ext_pull_requests", "ext_issues/issues.close/issue")
            .expect_err("multiple slash separators are invalid");
        assert!(matches!(err.code, wit_types::ErrorCode::BadInput));
    }

    #[test]
    fn registry_rejects_wasm_extension_without_typed_invoker() {
        let source_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues");
        let source_wasm = source_root.join("dist/ext_issues.wasm");
        assert!(
            source_wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_issues` before this test",
            source_wasm.display()
        );

        let tmp = tempdir_for_test("comtrya-no-invoker-extension");
        let ext_root = tmp.join("ext_no_invoker");
        std::fs::create_dir_all(ext_root.join("dist")).expect("mkdir fixture extension");
        let mut manifest: Value = serde_json::from_str(
            &std::fs::read_to_string(source_root.join("manifest.json")).expect("read manifest"),
        )
        .expect("parse manifest");
        manifest["id"] = Value::String("ext_no_invoker".to_string());
        manifest["name"] = Value::String("no-invoker".to_string());
        manifest["displayName"] = Value::String("No Invoker".to_string());
        std::fs::write(
            ext_root.join("manifest.json"),
            serde_json::to_vec_pretty(&manifest).expect("encode manifest"),
        )
        .expect("write manifest");
        std::fs::copy(source_wasm, ext_root.join("dist/ext_no_invoker.wasm"))
            .expect("copy wasm fixture");

        let registry = WasmRegistry::new().expect("build registry");
        let err = registry
            .register_from_manifest(&ext_root)
            .expect_err("extension with no generated invoker must fail to load");
        assert!(
            err.contains("no typed WASM invoker"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn registry_dispatcher_rejects_missing_required_record_fields() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues");
        let wasm = root.join("dist/ext_issues.wasm");
        assert!(
            wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_issues` before this test",
            wasm.display()
        );

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_issues");
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            "comtrya://repository/repo_dispatcher",
            vec!["ext_issues"],
        )]));
        let tmp = tempdir_for_test("comtrya-registry-dispatch-bad-payload");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let dispatcher = RegistryDispatcher { registry, store };

        let err = dispatcher
            .dispatch(
                "ext_issues",
                "issues.open-issue",
                &serde_json::to_vec(&serde_json::json!({
                    "repository": "comtrya://repository/repo_dispatcher",
                    "title": "missing body",
                }))
                .expect("encode payload"),
                "comtrya://user/usr_dispatcher_test",
                0,
            )
            .expect_err("missing bodyMarkdown must be rejected");
        assert!(matches!(err.code, wit_types::ErrorCode::BadInput));
    }

    #[test]
    fn registry_dispatcher_rejects_missing_required_multi_param_fields() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues");
        let wasm = root.join("dist/ext_issues.wasm");
        assert!(
            wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_issues` before this test",
            wasm.display()
        );

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_issues");
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            "comtrya://repository/repo_dispatcher",
            vec!["ext_issues"],
        )]));
        let tmp = tempdir_for_test("comtrya-registry-dispatch-missing-limit");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let dispatcher = RegistryDispatcher { registry, store };

        let err = dispatcher
            .dispatch(
                "ext_issues",
                "issues.list-issues",
                &serde_json::to_vec(&serde_json::json!({
                    "repository": "comtrya://repository/repo_dispatcher",
                }))
                .expect("encode payload"),
                "comtrya://user/usr_dispatcher_test",
                0,
            )
            .expect_err("missing limit must be rejected");
        assert!(matches!(err.code, wit_types::ErrorCode::BadInput));

        let err = dispatcher
            .dispatch(
                "ext_issues",
                "issues.list-issues",
                &serde_json::to_vec(&serde_json::json!({
                    "repository": "comtrya://repository/repo_dispatcher",
                    "limit": u64::from(u32::MAX) + 1,
                }))
                .expect("encode payload"),
                "comtrya://user/usr_dispatcher_test",
                0,
            )
            .expect_err("out-of-range limit must be rejected");
        assert!(matches!(err.code, wit_types::ErrorCode::BadInput));
    }

    #[test]
    fn host_state_invoke_uses_real_registry_dispatcher() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../extensions/first-party/ext_issues");
        let wasm = root.join("dist/ext_issues.wasm");
        assert!(
            wasm.is_file(),
            "{} missing; run `bash extensions/bundler/build-extension.sh \
             extensions/first-party/ext_issues` before this test",
            wasm.display()
        );

        let registry = WasmRegistry::new().expect("build registry");
        registry
            .register_from_manifest(&root)
            .expect("register ext_issues");
        registry.install_repo_enablement(StaticRepoEnablement::new([(
            "comtrya://workspace/ws_host_invoke/repository/repo_host_invoke",
            vec!["ext_issues"],
        )]));
        let tmp = tempdir_for_test("comtrya-host-invoke-real-dispatch");
        let store =
            Arc::new(crate::ExtensionRuntimeStore::open_for_tests(&tmp).expect("open ext store"));
        let dispatcher: Arc<dyn OpsDispatcher> = Arc::new(RegistryDispatcher {
            registry: registry.clone(),
            store: store.clone(),
        });
        let mut caller = host_state_for_op(HostStateForOp {
            extension_id: "ext_pull_requests".to_string(),
            extension_principal: "comtrya://extension/ext_pull_requests".to_string(),
            current_principal: "comtrya://user/usr_real_invoke_test".to_string(),
            store: store.clone(),
            manifest: Arc::new(HostManifest {
                host_imports: vec!["ops".to_string()],
                ..HostManifest::default()
            }),
            extension_point_bindings: Arc::new(
                crate::extension_points::ConsumerBindings::from_pairs([
                    ("ext_issues", "issues.open-issue"),
                    ("ext_issues", "issues.close-issue"),
                ]),
            ),
            clock: registry.clock.clone(),
            id_minter: registry.id_minter.clone(),
            log_sink: registry.log_sink.clone(),
            authz: registry.authz.clone(),
            ops_dispatcher: dispatcher,
            occ_tokens: registry.occ_tokens.clone(),
            minted_ids: registry.minted_ids.clone(),
            relationship_types: Arc::new(
                crate::relationship_types::RelationshipTypeRegistry::default(),
            ),
            repo_enablement: Arc::new(RwLock::new(None)),
        });

        let opened_bytes = <HostState as crate::wasm_host::wit_ops::Host>::invoke(
            &mut caller,
            "ext_issues".to_string(),
            "issues.open-issue".to_string(),
            serde_json::to_vec(&serde_json::json!({
                    "repository": "comtrya://workspace/ws_host_invoke/repository/repo_host_invoke",
                "title": "host invoke smoke",
                "bodyMarkdown": "opened through real ops.invoke",
            }))
            .expect("encode open payload"),
        )
        .expect("open through HostState::invoke");
        let opened: Value = serde_json::from_slice(&opened_bytes).expect("parse opened issue");
        let issue_id = opened
            .get("id")
            .and_then(Value::as_str)
            .expect("opened issue id")
            .to_string();

        let closed_bytes = <HostState as crate::wasm_host::wit_ops::Host>::invoke(
            &mut caller,
            "ext_issues".to_string(),
            "issues.close-issue".to_string(),
            serde_json::to_vec(&serde_json::json!({
                "id": issue_id,
                "reason": "closed through real ops.invoke",
            }))
            .expect("encode close payload"),
        )
        .expect("close through HostState::invoke");
        let closed: Value = serde_json::from_slice(&closed_bytes).expect("parse closed issue");
        assert_eq!(closed.get("state").and_then(Value::as_str), Some("closed"));
        assert_eq!(
            closed.get("stateReason").and_then(Value::as_str),
            Some("closed through real ops.invoke")
        );

        let records = store.load_records().expect("load records");
        let issue_rec = records
            .iter()
            .find(|r| r.collection == "issues" && r.id == issue_id)
            .expect("issue persisted");
        assert_eq!(
            issue_rec.data.get("state").and_then(Value::as_str),
            Some("closed")
        );
        let event_log = std::fs::read_to_string(store.events_path()).expect("read events");
        assert!(event_log.contains("dev.comtrya.issues.closed"));
    }

    fn tempdir_for_test(prefix: &str) -> std::path::PathBuf {
        let base = std::env::temp_dir();
        let pid = std::process::id();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let path = base.join(format!("{prefix}-{pid}-{now}"));
        std::fs::create_dir_all(&path).expect("mkdir tempdir");
        path
    }
}
