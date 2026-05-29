//! Repo CUE configuration — kernel side.
//!
//! Comtrya is "Project-aware". By default a repo is one Project; a
//! monorepo declares multiple Projects in its `package comtrya` CUE
//! configuration. The kernel ships a base CUE schema with a `#Project`
//! definition; extensions register additional schema snippets that
//! constrain or extend per-Project shape (e.g. `ext_docs` adds `docs?`
//! to `#Project`, `ext_builds` adds `builds?`). The kernel itself
//! remains agnostic of those slices — extensions own their semantics.
//!
//! Discovery flow:
//!
//! 1. Materialise the repo's working tree from the bare Git directory.
//! 2. Drop the kernel base schema and every extension-registered snippet
//!    at the workdir root as name-prefixed files (`00-comtrya-kernel.cue`,
//!    `01-comtrya-ext-<id>.cue`) — NOT into `_comtrya/`, because
//!    CUE's loader silently skips `_`-prefixed directories during recursive
//!    `./...` evaluation (see ADR 0002 for the full reasoning).
//! 3. Run `cuengine::evaluate_module(recursive: true,
//!    package_name: "comtrya")` — the repo's `package comtrya` files
//!    unify with the injected schemas.
//! 4. Walk the resulting instances for any `projects: [name]: #Project`
//!    declarations and emit them.
//! 5. If no Projects were declared, synthesise the implicit default
//!    Project covering the whole repo.
//!
//! The returned envelope is stable for the UI:
//!
//! ```json
//! {
//!   "projects": [
//!     { "name": "platform", "root": "platform", "value": { ... } }
//!   ],
//!   "instances": [ { "path": "...", "value": {...} } ],
//!   "error":  null | "...",
//!   "note":   optional human-readable explanation
//! }
//! ```

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;

use std::sync::{Condvar, Mutex};

use tempfile::TempDir;

use cuengine::{ModuleEvalOptions, evaluate_module};
use serde_json::{Value, json};

/// Sync counting semaphore. Blocks the OS thread on acquire; works in
/// any runtime context (sync code, tokio multi-thread, tokio
/// current-thread tests) — unlike `tokio::sync::Semaphore +
/// block_in_place`, which panics under current-thread runtimes.
///
/// Within a tokio multi-thread runtime this blocks the worker thread
/// without signalling the scheduler — acceptable here because the
/// alternative (unbounded `git archive | tar` spawns) is FD
/// exhaustion. Full async refactor is the long-term fix; tracked as
/// a follow-up sub-PR.
struct SyncSemaphore {
    available: Mutex<usize>,
    notify: Condvar,
}

struct SyncPermit<'a>(&'a SyncSemaphore);

impl SyncSemaphore {
    const fn new(permits: usize) -> Self {
        Self {
            available: Mutex::new(permits),
            notify: Condvar::new(),
        }
    }

    fn acquire(&self) -> SyncPermit<'_> {
        let mut available = self.available.lock().expect("poisoned");
        while *available == 0 {
            available = self.notify.wait(available).expect("poisoned");
        }
        *available -= 1;
        SyncPermit(self)
    }
}

impl Drop for SyncPermit<'_> {
    fn drop(&mut self) {
        let mut available = self.0.available.lock().expect("poisoned");
        *available += 1;
        self.0.notify.notify_one();
    }
}

/// Bound concurrent `git archive | tar -x` materialisations to prevent
/// FD exhaustion under burst load. Process-global because FDs are a
/// process-global resource; per-repo semaphores would still need a
/// global floor. 8 × 2 pipes × 2 processes = 64 FDs reserved at peak.
static MATERIALISE_SEMAPHORE: SyncSemaphore = SyncSemaphore::new(8);

/// Kernel schema installer. Single source of truth lives in
/// `comtrya_core::config::install_kernel_schema` (it writes the
/// `package comtrya` bridge and vendors the published schema package)
/// so both the receive-pack validator and this per-repo browser stay
/// aligned. See #18.
use comtrya_core::config::install_kernel_schema;

/// One CUE snippet registered by an extension. The kernel writes each
/// snippet to its own file inside the materialised workdir so cuengine
/// unifies them with the repo's `package comtrya` declarations.
#[derive(Clone, Debug)]
pub struct ExtensionSchema {
    pub extension_id: String,
    pub schema_id: String,
    pub snippet: String,
}

impl ExtensionSchema {
    /// Adapter into the receive-pack validator's strict shape. Both
    /// `extension_id` and `schema_id` are canonicalised to the
    /// `^[a-z][a-z0-9-]*$` allowlist by lowercasing alphanumerics and
    /// replacing every other byte with `-`. The two halves are joined
    /// with `-` and validated by `CueSchemaFile::new`. After this both
    /// the server-side `install_schemas` and the core-side validator
    /// emit identical `01-comtrya-ext-{id}.cue` filenames.
    pub fn into_cue_schema_file(self) -> comtrya_core::error::CoreResult<CueSchemaFile> {
        let canon = |s: &str| -> String {
            s.chars()
                .map(|c| {
                    if c.is_ascii_alphanumeric() {
                        c.to_ascii_lowercase()
                    } else {
                        '-'
                    }
                })
                .collect()
        };
        let id = format!("{}-{}", canon(&self.extension_id), canon(&self.schema_id));
        CueSchemaFile::new(id, self.snippet)
    }
}

use comtrya_core::config::CueSchemaFile;

/// Walk the repo at `ref_name`, unify it with the kernel base schema
/// and every extension-registered snippet, and return the discovered
/// Projects plus the raw per-directory instances. See module docs for
/// the envelope shape.
pub fn evaluate_repo_config(
    git_dir: &Path,
    ref_name: &str,
    extension_schemas: &[ExtensionSchema],
) -> Value {
    // Hold the TempDir for the whole evaluation: RAII drop removes the
    // unique tree on every exit path (early-return, panic, normal), so no
    // manual remove_dir_all is needed and no peer's tree is ever wiped.
    let worktree = match materialise_worktree(git_dir, ref_name) {
        Ok(dir) => dir,
        Err(message) => {
            return json!({
                "projects": [implicit_default_project()],
                "repository": Value::Null,
                "instances": [],
                "error": message,
            });
        }
    };
    let workdir = worktree.path();

    if let Err(message) = install_schemas(workdir, extension_schemas) {
        return json!({
            "projects": [implicit_default_project()],
            "instances": [],
            "error": message,
        });
    }

    run_cuengine(workdir)
}

fn materialise_worktree(git_dir: &Path, ref_name: &str) -> Result<TempDir, String> {
    // Bound concurrent materialisations. Permit drops at end of scope
    // (including `?` early-return paths), releasing capacity.
    let _permit = MATERIALISE_SEMAPHORE.acquire();

    // A guaranteed-unique directory (Builder picks a random name and creates
    // it exclusively), so concurrent or rapid sequential evaluations never
    // collide and never extract into a shared tree. The `comtrya-cue-`
    // prefix avoids the default `.tmp` dot-prefix: the CUE module walker
    // skips hidden directories, so a dot-prefixed workdir yields zero
    // instances.
    let worktree = tempfile::Builder::new()
        .prefix("comtrya-cue-")
        .tempdir_in(std::env::temp_dir())
        .map_err(|e| format!("create temp worktree failed: {e}"))?;
    let base = worktree.path();

    let archive = Command::new("git")
        .arg("--git-dir")
        .arg(git_dir)
        .arg("archive")
        .arg("--format=tar")
        .arg(ref_name)
        .stdout(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("git archive spawn failed: {e}"))?;

    let archive_out = archive
        .stdout
        .ok_or_else(|| "git archive stdout missing".to_string())?;
    let status = Command::new("tar")
        .arg("-x")
        .arg("-C")
        .arg(base)
        .stdin(archive_out)
        .status()
        .map_err(|e| format!("tar spawn failed: {e}"))?;
    if !status.success() {
        return Err(format!("git archive | tar -x exited {status:?}"));
    }
    Ok(worktree)
}

fn install_schemas(workdir: &Path, extension_schemas: &[ExtensionSchema]) -> Result<(), String> {
    // Ensure a CUE module exists. If the repo doesn't declare one,
    // synthesise a default — without it cuengine can't evaluate.
    let module_path = workdir.join("cue.mod").join("module.cue");
    if !module_path.is_file() {
        if let Some(parent) = module_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("mkdir cue.mod failed: {e}"))?;
        }
        std::fs::write(
            &module_path,
            "module: \"comtrya.synthesised/repo\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .map_err(|e| format!("write synthetic module.cue failed: {e}"))?;
    }

    // Inject the kernel bridge + extension schemas at the workdir
    // ROOT, not into a `_`-prefixed subdirectory. CUE excludes
    // `_`-prefixed directories from `./...` evaluation (the Go-module
    // convention), so anything under `_comtrya/` is invisible to the
    // per-Project CUE files in subdirectories and the definitions
    // can't unify with their declarations — derived fields like
    // `ref: "comtrya://\(kind)/\(slug)"` won't compute. Inject at
    // the root so the bridge lands in the same package instance as
    // the user's root-level CUE (if any) and cuengine's recursive
    // walk reaches them.
    //
    // `install_kernel_schema` writes the `package comtrya` bridge as
    // `00-comtrya-kernel.cue` and vendors the published schema package
    // (skipping the vendor step when the repo IS
    // `github.com/comtrya/comtrya` and already ships `schema/`
    // in-module). Extension schemas are name-prefixed
    // (`01-comtrya-ext-<id>.cue`) so they don't collide with any
    // user-authored CUE at the workdir root and to keep ordering stable
    // in `cue export` output.
    install_kernel_schema(workdir).map_err(|e| format!("install kernel schema failed: {e}"))?;

    // The canonicalisation is lossy (every non-alphanumeric byte becomes `-`),
    // so two distinct (extension_id, schema_id) pairs can collapse to one
    // filename and the second `std::fs::write` would silently truncate the
    // first. Track produced ids and fail loudly on a collision rather than
    // dropping a schema snippet from the unified evaluation.
    let mut seen_ids: HashSet<String> = HashSet::new();
    for schema in extension_schemas {
        // Route through the same canonicalisation the receive-pack
        // validator uses so both writers produce identical
        // `01-comtrya-ext-{id}.cue` filenames. Without this the two
        // validators drift and the "stay aligned" invariant lies.
        let canonical = schema
            .clone()
            .into_cue_schema_file()
            .map_err(|e| format!("invalid extension schema id: {e}"))?;
        let id = canonical.id().to_string();
        if !seen_ids.insert(id.clone()) {
            return Err(format!(
                "extension schema id collision: canonical id `{id}` is produced by more than one \
                 (extension, schema) pair (lossy canonicalisation); rename one schema"
            ));
        }
        let path = workdir.join(format!("01-comtrya-ext-{id}.cue"));
        std::fs::write(&path, canonical.contents())
            .map_err(|e| format!("write {} failed: {e}", path.display()))?;
    }
    Ok(())
}

fn run_cuengine(workdir: &Path) -> Value {
    let options = ModuleEvalOptions {
        with_meta: false,
        with_references: false,
        recursive: true,
        package_name: Some("comtrya".to_string()),
        target_dir: None,
    };
    match evaluate_module(workdir, "comtrya", Some(&options)) {
        Ok(result) => {
            let mut instances: Vec<Value> = result
                .instances
                .iter()
                .map(|(path, value)| {
                    json!({
                        "path": stable_path(path),
                        "value": value,
                    })
                })
                .collect();
            instances.sort_by(|a, b| {
                let pa = a.get("path").and_then(Value::as_str).unwrap_or("");
                let pb = b.get("path").and_then(Value::as_str).unwrap_or("");
                pa.cmp(pb)
            });

            let mut projects = discover_projects(&instances);
            if projects.is_empty() {
                projects.push(implicit_default_project());
            }
            let repository = discover_repository(&instances);

            json!({
                "projects": projects,
                "repository": repository,
                "instances": instances,
                "error": null,
            })
        }
        Err(error) => {
            let message = format!("{error}");
            // "no CUE files declared" isn't a configuration error — it's
            // the documented fallthrough that produces an implicit
            // single project. cuengine reports it as either `matched no
            // packages` (no instances at all) or `no Go files in ...`
            // (when a side-directory has files but the package doesn't
            // match). In both cases the user sees the same outcome we
            // produce on a successful empty evaluation: one implicit
            // Project. Don't surface the noisy library text.
            let benign =
                message.contains("matched no packages") || message.contains("no CUE files");
            json!({
                "projects": [implicit_default_project()],
                "repository": Value::Null,
                "instances": [],
                "error": if benign { Value::Null } else { Value::String(message) },
            })
        }
    }
}

fn stable_path(p: &str) -> &str {
    if p == "." { "" } else { p }
}

/// Walk every evaluated instance for `projects: { name: { ... } }`
/// declarations and emit one entry per name. Project roots declared
/// relative inside a non-root instance are resolved against that
/// instance's directory so a sub-project file `services/api/comtrya.cue`
/// declaring `root: "."` lands on `services/api/`.
fn discover_projects(instances: &[Value]) -> Vec<Value> {
    let mut projects: Vec<Value> = Vec::new();
    for instance in instances {
        let instance_path = instance
            .get("path")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        let value = instance.get("value");
        let Some(map) = value
            .and_then(|v| v.get("projects"))
            .and_then(Value::as_object)
        else {
            continue;
        };
        for (name, def) in map.iter() {
            let raw_root = def.get("root").and_then(Value::as_str).unwrap_or("");
            let resolved_root = join_repo_path(&instance_path, raw_root);
            let mut project = def.clone();
            if let Some(obj) = project.as_object_mut() {
                obj.insert("name".to_string(), Value::String(name.clone()));
                obj.insert("root".to_string(), Value::String(resolved_root));
                obj.insert(
                    "declaredAt".to_string(),
                    Value::String(instance_path.clone()),
                );
            }
            projects.push(project);
        }
    }
    projects.sort_by(|a, b| {
        let na = a.get("name").and_then(Value::as_str).unwrap_or("");
        let nb = b.get("name").and_then(Value::as_str).unwrap_or("");
        na.cmp(nb)
    });
    projects
}

fn join_repo_path(instance: &str, relative: &str) -> String {
    // Normalise self-references — `.`, `./`, `` — to "stay here".
    let normalised = relative.trim_start_matches("./").trim_matches('/');
    let rel = if normalised == "." { "" } else { normalised };
    match (instance.is_empty(), rel.is_empty()) {
        (true, true) => String::new(),
        (true, false) => rel.to_string(),
        (false, true) => instance.to_string(),
        (false, false) => format!("{instance}/{rel}"),
    }
}

/// Walk the per-directory instances looking for the kernel-level
/// `repository: {...}` block. The block is conceptually unique per
/// repo; if more than one instance declares it (e.g. the user dropped
/// `repository:` in two subdirectories) prefer the root-path instance,
/// otherwise pick the lexicographically first declaration. Returns
/// `Value::Null` when no instance declares the block.
fn discover_repository(instances: &[Value]) -> Value {
    let mut root_repo: Option<Value> = None;
    let mut other_repo: Option<(String, Value)> = None;
    for instance in instances {
        let path = instance
            .get("path")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        let Some(repo) = instance.get("value").and_then(|v| v.get("repository")) else {
            continue;
        };
        if !repo.is_object() {
            continue;
        }
        if path.is_empty() {
            root_repo = Some(repo.clone());
        } else if other_repo.as_ref().map(|(p, _)| path < *p).unwrap_or(true) {
            other_repo = Some((path, repo.clone()));
        }
    }
    root_repo
        .or_else(|| other_repo.map(|(_, v)| v))
        .unwrap_or(Value::Null)
}

fn implicit_default_project() -> Value {
    json!({
        "name": "repo",
        "root": "",
        "implicit": true,
        "declaredAt": "",
    })
}

/// Repo-wide per-commit CUE evaluation cache.
///
/// `evaluate_repo_config` is expensive (materialise tree → write schemas
/// → run cuengine → tear down) and was being invoked on every read of a
/// repository through `/graphql` and `/api/ops/*`. The result is a pure
/// function of `(git_dir, commit_oid, extension_schemas)`: the commit is
/// immutable and the kernel + extension schemas only change at
/// process-restart boundaries, so a `(git_dir, commit_oid) -> Arc<Value>`
/// cache eliminates every duplicate evaluation.
///
/// The cache is unbounded by design. Each entry is the evaluated JSON
/// envelope (a few KB) and lives only as long as the commit is reachable
/// by some ref the workload reads — typical repos churn through tens to
/// hundreds of commits across their lifetime, so memory is bounded by the
/// commit graph, not by request rate. If a workload demands stricter
/// bounds, swap the inner map for an LRU; the public surface doesn't
/// change.
#[derive(Debug, Default)]
pub struct CueConfigCache {
    inner: Mutex<HashMap<(PathBuf, String), Arc<Value>>>,
}

impl CueConfigCache {
    pub fn new() -> Self {
        Self::default()
    }

    /// Resolve `ref_name` to a commit OID, then either return the cached
    /// evaluation for `(git_dir, oid)` or run a fresh evaluation, cache
    /// it, and return it. If OID resolution fails (missing ref, corrupt
    /// repo, etc.) the call falls back to `evaluate_repo_config` directly
    /// — error envelopes never reach the cache.
    pub fn evaluate(
        &self,
        git_dir: &Path,
        ref_name: &str,
        extension_schemas: &[ExtensionSchema],
    ) -> Arc<Value> {
        let Some(oid) = resolve_ref_oid(git_dir, ref_name) else {
            // Unresolvable ref: don't cache the error envelope.
            return Arc::new(evaluate_repo_config(git_dir, ref_name, extension_schemas));
        };
        let key = (git_dir.to_path_buf(), oid);
        if let Some(cached) = self.inner.lock().expect("poisoned").get(&key) {
            return cached.clone();
        }
        // Evaluate OUTSIDE the lock — cuengine spawns subprocesses and
        // can take hundreds of milliseconds. Two concurrent misses on
        // the same key will both evaluate, but the second insert is a
        // no-op for correctness (results are equal). Acceptable trade
        // against holding a global mutex across CUE evaluation.
        let value = Arc::new(evaluate_repo_config(git_dir, ref_name, extension_schemas));
        self.inner
            .lock()
            .expect("poisoned")
            .insert(key, value.clone());
        value
    }
}

/// `git --git-dir=... rev-parse <ref>^{commit}` → 40-char hex, or
/// `None` if git fails. Cheap (single fork; reads packed-refs or
/// loose ref). Kept private — callers should go through
/// `CueConfigCache::evaluate`.
fn resolve_ref_oid(git_dir: &Path, ref_name: &str) -> Option<String> {
    let output = Command::new("git")
        .arg("--git-dir")
        .arg(git_dir)
        .arg("rev-parse")
        .arg(format!("{ref_name}^{{commit}}"))
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let oid = String::from_utf8(output.stdout).ok()?.trim().to_string();
    if oid.len() == 40 && oid.chars().all(|c| c.is_ascii_hexdigit()) {
        Some(oid)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::MATERIALISE_SEMAPHORE;
    use std::sync::Arc;
    use std::sync::Barrier;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::thread;
    use std::time::{Duration, Instant};

    /// Concurrent acquires can't exceed the semaphore's 8-permit cap.
    /// Deterministic via a Barrier(8) inside the critical section.
    /// Plain sync threads — works in any runtime context (no tokio
    /// required because the semaphore is std-primitive).
    #[test]
    fn semaphore_caps_concurrency() {
        const CAP: usize = 8;
        const N: usize = 24;
        let observed_peak = Arc::new(AtomicUsize::new(0));
        let live = Arc::new(AtomicUsize::new(0));
        // Barrier(CAP) — exactly CAP threads must be in the critical
        // section simultaneously to advance. If the semaphore let
        // more through, the test deadlocks (caught by deadline).
        let barrier = Arc::new(Barrier::new(CAP));
        let deadline = Instant::now() + Duration::from_secs(5);

        let mut handles = Vec::with_capacity(N);
        for _ in 0..N {
            let observed_peak = Arc::clone(&observed_peak);
            let live = Arc::clone(&live);
            let barrier = Arc::clone(&barrier);
            handles.push(thread::spawn(move || {
                let _permit = MATERIALISE_SEMAPHORE.acquire();
                let now_live = live.fetch_add(1, Ordering::SeqCst) + 1;
                observed_peak.fetch_max(now_live, Ordering::SeqCst);
                barrier.wait();
                live.fetch_sub(1, Ordering::SeqCst);
            }));
        }

        for h in handles {
            assert!(
                Instant::now() < deadline,
                "threads did not finish within 5s — concurrency cap likely violated (deadlock on Barrier({CAP}))"
            );
            h.join().unwrap();
        }
        assert!(
            observed_peak.load(Ordering::SeqCst) <= CAP,
            "observed peak {} exceeded cap {CAP}",
            observed_peak.load(Ordering::SeqCst)
        );
    }

    /// Two schemas that canonicalise to the same filename must error rather
    /// than silently overwriting each other.
    #[test]
    fn install_schemas_rejects_canonical_id_collision() {
        use super::{ExtensionSchema, install_schemas};
        let workdir = tempfile::tempdir().expect("tempdir");
        // extension `foo` + schema `a.b` and `foo` + `a-b` both canonicalise to
        // `foo-a-b`.
        let schemas = vec![
            ExtensionSchema {
                extension_id: "foo".to_string(),
                schema_id: "a.b".to_string(),
                snippet: "#A: {}\n".to_string(),
            },
            ExtensionSchema {
                extension_id: "foo".to_string(),
                schema_id: "a-b".to_string(),
                snippet: "#B: {}\n".to_string(),
            },
        ];
        let result = install_schemas(workdir.path(), &schemas);
        let message = result.expect_err("colliding schema ids must error");
        assert!(
            message.contains("collision"),
            "error should mention the collision: {message}"
        );
    }

    /// Distinct, non-colliding schemas install without error.
    #[test]
    fn install_schemas_accepts_distinct_ids() {
        use super::{ExtensionSchema, install_schemas};
        let workdir = tempfile::tempdir().expect("tempdir");
        let schemas = vec![
            ExtensionSchema {
                extension_id: "foo".to_string(),
                schema_id: "a".to_string(),
                snippet: "#A: {}\n".to_string(),
            },
            ExtensionSchema {
                extension_id: "bar".to_string(),
                schema_id: "b".to_string(),
                snippet: "#B: {}\n".to_string(),
            },
        ];
        install_schemas(workdir.path(), &schemas).expect("distinct ids install");
    }

    /// A thread that acquires a permit and panics must release the
    /// permit on unwind, leaving the semaphore usable.
    #[test]
    fn semaphore_releases_on_panic() {
        let panicking = thread::spawn(|| {
            let _permit = MATERIALISE_SEMAPHORE.acquire();
            panic!("intentional panic with permit held");
        });
        panicking.join().expect_err("thread should have panicked");

        // After the panic, the semaphore should still have capacity.
        // Acquire + drop in a fresh thread; bound by deadline so a
        // missing release shows up as test failure not hang.
        let acquire = thread::spawn(|| {
            let _permit = MATERIALISE_SEMAPHORE.acquire();
        });
        let deadline = Instant::now() + Duration::from_secs(1);
        while !acquire.is_finished() {
            assert!(
                Instant::now() < deadline,
                "semaphore deadlocked after panic — permit not released on unwind"
            );
            thread::sleep(Duration::from_millis(10));
        }
        acquire.join().unwrap();
    }

    use super::{CueConfigCache, materialise_worktree, resolve_ref_oid};
    use std::path::PathBuf;
    use std::process::Command;
    use tempfile::TempDir;

    #[test]
    fn materialise_worktree_yields_distinct_isolated_trees() {
        // Regression for #77: two materialisations of the same repo/ref must
        // land in distinct directories with their own extracted contents, so
        // a peer's tree is never shared or wiped mid-evaluation.
        let (_tmp, git_dir, _oid) = seeded_repo("package comtrya\n");

        let first = materialise_worktree(&git_dir, "main").expect("first materialise");
        let second = materialise_worktree(&git_dir, "main").expect("second materialise");

        assert_ne!(
            first.path(),
            second.path(),
            "concurrent materialisations must not share a directory"
        );
        for tree in [&first, &second] {
            assert!(
                tree.path().join("comtrya.cue").is_file(),
                "each tree must hold its own extracted contents"
            );
        }

        // Dropping one TempDir removes only its own tree; the peer survives.
        let surviving = second.path().to_path_buf();
        drop(first);
        assert!(
            surviving.join("comtrya.cue").is_file(),
            "dropping one worktree must not wipe a peer"
        );
    }

    /// Build a bare-ish git repo with a single commit on `main` carrying
    /// a minimal `package comtrya` file. Returns `(tempdir, git_dir,
    /// initial_oid)`. The tempdir must outlive the test.
    fn seeded_repo(initial_body: &str) -> (TempDir, PathBuf, String) {
        let tmp = tempfile::Builder::new()
            .prefix("comtrya-cue-cache-")
            .tempdir()
            .unwrap();
        let work = tmp.path().to_path_buf();
        for args in [
            ["init", "-q", "-b", "main"].as_slice(),
            ["config", "user.email", "cache-test@comtrya"].as_slice(),
            ["config", "user.name", "cache-test"].as_slice(),
            ["config", "commit.gpgsign", "false"].as_slice(),
        ] {
            let status = Command::new("git")
                .current_dir(&work)
                .args(args)
                .status()
                .unwrap();
            assert!(status.success(), "git {args:?} failed");
        }
        std::fs::write(work.join("comtrya.cue"), initial_body).unwrap();
        for args in [
            ["add", "comtrya.cue"].as_slice(),
            ["commit", "-q", "-m", "seed"].as_slice(),
        ] {
            let status = Command::new("git")
                .current_dir(&work)
                .args(args)
                .status()
                .unwrap();
            assert!(status.success(), "git {args:?} failed");
        }
        let git_dir = work.join(".git");
        let oid = resolve_ref_oid(&git_dir, "main").unwrap();
        (tmp, git_dir, oid)
    }

    /// Commit a new state on `main`, returning the new oid. Same repo as
    /// `seeded_repo`.
    fn commit_change(repo_workdir: &std::path::Path, new_body: &str) -> String {
        std::fs::write(repo_workdir.join("comtrya.cue"), new_body).unwrap();
        for args in [
            ["add", "comtrya.cue"].as_slice(),
            ["commit", "-q", "-m", "update"].as_slice(),
        ] {
            let status = Command::new("git")
                .current_dir(repo_workdir)
                .args(args)
                .status()
                .unwrap();
            assert!(status.success(), "git {args:?} failed");
        }
        resolve_ref_oid(&repo_workdir.join(".git"), "main").unwrap()
    }

    #[test]
    fn cue_cache_returns_same_arc_on_repeat_call() {
        let (_tmp, git_dir, _oid) = seeded_repo("package comtrya\n");
        let cache = CueConfigCache::new();
        let first = cache.evaluate(&git_dir, "main", &[]);
        let second = cache.evaluate(&git_dir, "main", &[]);
        assert!(
            Arc::ptr_eq(&first, &second),
            "second call must return the cached Arc, not a fresh evaluation",
        );
    }

    #[test]
    fn cue_cache_misses_after_new_commit() {
        let (tmp, git_dir, _oid1) = seeded_repo("package comtrya\n");
        let cache = CueConfigCache::new();
        let first = cache.evaluate(&git_dir, "main", &[]);
        // Move `main` forward — new commit, new oid, new cache key.
        commit_change(tmp.path(), "package comtrya\n// updated\n");
        let second = cache.evaluate(&git_dir, "main", &[]);
        assert!(
            !Arc::ptr_eq(&first, &second),
            "new commit must invalidate the cache key and trigger re-evaluation",
        );
    }

    #[test]
    fn cue_cache_keys_independently_per_repo() {
        let (_tmp1, git_dir1, _oid1) = seeded_repo("package comtrya\n");
        let (_tmp2, git_dir2, _oid2) = seeded_repo("package comtrya\n");
        let cache = CueConfigCache::new();
        let a = cache.evaluate(&git_dir1, "main", &[]);
        let b = cache.evaluate(&git_dir2, "main", &[]);
        // Two different repos: even if the evaluated content is byte-equal,
        // the cache must keep them separate so an invalidation in one
        // doesn't affect the other.
        assert!(
            !Arc::ptr_eq(&a, &b),
            "cache keys must scope by git_dir, not collapse on equal evaluations",
        );
        let a_again = cache.evaluate(&git_dir1, "main", &[]);
        assert!(
            Arc::ptr_eq(&a, &a_again),
            "repo1 must still hit cache after a different repo's evaluation",
        );
    }

    use super::evaluate_repo_config;

    /// Regression: importing a repo that ships an unrelated top-level
    /// `schema/` directory and NO comtrya config must evaluate cleanly.
    /// Previously the kernel installer skipped vendoring the published
    /// schema package whenever any `schema/` directory existed, so the
    /// injected bridge's `import "github.com/comtrya/comtrya/schema"`
    /// failed with "cannot find package …/schema" and the repo home
    /// surfaced a scary CUE error instead of an implicit default project.
    #[test]
    fn repo_without_comtrya_config_but_with_schema_dir_evaluates_cleanly() {
        let tmp = tempfile::Builder::new()
            .prefix("comtrya-cue-noschema-")
            .tempdir()
            .unwrap();
        let work = tmp.path();
        for args in [
            ["init", "-q", "-b", "main"].as_slice(),
            ["config", "user.email", "noconfig-test@comtrya"].as_slice(),
            ["config", "user.name", "noconfig-test"].as_slice(),
            ["config", "commit.gpgsign", "false"].as_slice(),
        ] {
            assert!(
                Command::new("git")
                    .current_dir(work)
                    .args(args)
                    .status()
                    .unwrap()
                    .success(),
                "git {args:?} failed"
            );
        }
        // A top-level `schema/` directory unrelated to comtrya, plus a
        // plain README. No `package comtrya` file, no `cue.mod` — the
        // module is synthesised at eval time.
        std::fs::create_dir_all(work.join("schema")).unwrap();
        std::fs::write(work.join("schema").join("openapi.cue"), "package schema\n").unwrap();
        std::fs::write(work.join("README.md"), "# rawkode\n").unwrap();
        for args in [
            ["add", "-A"].as_slice(),
            ["commit", "-q", "-m", "seed"].as_slice(),
        ] {
            assert!(
                Command::new("git")
                    .current_dir(work)
                    .args(args)
                    .status()
                    .unwrap()
                    .success(),
                "git {args:?} failed"
            );
        }

        let result = evaluate_repo_config(&work.join(".git"), "main", &[]);
        assert_eq!(
            result.get("error"),
            Some(&serde_json::Value::Null),
            "no-config repo with a schema/ dir must evaluate without error; got: {result}"
        );
        let projects = result.get("projects").and_then(|v| v.as_array());
        assert!(
            projects.is_some_and(|p| !p.is_empty()),
            "expected an implicit default project; got: {result}"
        );
    }

    #[test]
    fn cue_cache_does_not_cache_unresolvable_refs() {
        let (_tmp, git_dir, _oid) = seeded_repo("package comtrya\n");
        let cache = CueConfigCache::new();
        // `nope` does not exist — evaluate falls through to direct
        // evaluation, no cache entry written. Two calls must NOT
        // Arc-equal because each constructs a fresh error envelope.
        let first = cache.evaluate(&git_dir, "nope", &[]);
        let second = cache.evaluate(&git_dir, "nope", &[]);
        assert!(
            !Arc::ptr_eq(&first, &second),
            "unresolvable refs must not be cached (each call returns a fresh error envelope)",
        );
        // And a valid ref on the same repo must still cache normally
        // — the failed evaluation didn't pollute the cache.
        let good_a = cache.evaluate(&git_dir, "main", &[]);
        let good_b = cache.evaluate(&git_dir, "main", &[]);
        assert!(
            Arc::ptr_eq(&good_a, &good_b),
            "good ref must still cache after a failed sibling call",
        );
    }
}
