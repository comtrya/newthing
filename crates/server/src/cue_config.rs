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
//!    into `_comtrya/` inside the workdir.
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

use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use cuengine::{ModuleEvalOptions, evaluate_module};
use serde_json::{Value, json};

/// Kernel-defined CUE base schema. Every repo evaluated by the forge
/// sees this in scope. `#Project` is the canonical kernel concept;
/// extensions add their own per-Project constraints. Keep this minimal —
/// the temptation to bake doc/build/agent concepts into the kernel is
/// the same anti-pattern the user warned about, so resist.
const KERNEL_CUE_BASE: &str = r#"package comtrya

// `#Project` is the kernel's first-class unit of work inside a repo.
// By default a repo is one Project. Monorepos declare more by
// populating the `projects` map below.
#Project: {
    // Project name, unique within the repo.
    name: string

    // Path inside the repo this Project owns. The repo root is "".
    // Per-Project doc / build / etc. paths declared by extension
    // schemas are resolved relative to this.
    root: string | *""

    // Free-form labels for grouping and filtering.
    labels?: [...string]

    // Other fields are added by extension-registered schemas
    // (`docs`, `builds`, `agents`, `owners`, etc.).
    ...
}

// Projects in this repo, keyed by name. Empty map means "use the
// implicit single Project covering the whole repo".
projects: [Name=string]: #Project & { name: Name }
"#;

/// One CUE snippet registered by an extension. The kernel writes each
/// snippet to its own file inside the materialised workdir so cuengine
/// unifies them with the repo's `package comtrya` declarations.
#[derive(Clone, Debug)]
pub struct ExtensionSchema {
    pub extension_id: String,
    pub schema_id: String,
    pub snippet: String,
}

/// Walk the repo at `ref_name`, unify it with the kernel base schema
/// and every extension-registered snippet, and return the discovered
/// Projects plus the raw per-directory instances. See module docs for
/// the envelope shape.
pub fn evaluate_repo_config(
    git_dir: &Path,
    ref_name: &str,
    extension_schemas: &[ExtensionSchema],
) -> Value {
    let workdir = match materialise_worktree(git_dir, ref_name) {
        Ok(path) => path,
        Err(message) => {
            return json!({
                "projects": [implicit_default_project()],
                "instances": [],
                "error": message,
            });
        }
    };

    if let Err(message) = install_schemas(&workdir, extension_schemas) {
        let _ = std::fs::remove_dir_all(&workdir);
        return json!({
            "projects": [implicit_default_project()],
            "instances": [],
            "error": message,
        });
    }

    let result = run_cuengine(&workdir);
    let _ = std::fs::remove_dir_all(&workdir);
    result
}

fn materialise_worktree(git_dir: &Path, ref_name: &str) -> Result<PathBuf, String> {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    let base = std::env::temp_dir().join(format!(
        "comtrya-cue-{}-{nanos}",
        std::process::id()
    ));
    std::fs::create_dir_all(&base)
        .map_err(|e| format!("mkdir {} failed: {e}", base.display()))?;

    let archive = Command::new("git")
        .arg("--git-dir")
        .arg(git_dir)
        .arg("archive")
        .arg("--format=tar")
        .arg(ref_name)
        .stdout(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("git archive spawn failed: {e}"))?;

    let archive_out = archive.stdout.ok_or_else(|| "git archive stdout missing".to_string())?;
    let status = Command::new("tar")
        .arg("-x")
        .arg("-C")
        .arg(&base)
        .stdin(archive_out)
        .status()
        .map_err(|e| format!("tar spawn failed: {e}"))?;
    if !status.success() {
        return Err(format!("git archive | tar -x exited {status:?}"));
    }
    Ok(base)
}

fn install_schemas(workdir: &Path, extension_schemas: &[ExtensionSchema]) -> Result<(), String> {
    // Ensure a CUE module exists. If the repo doesn't declare one,
    // synthesise a default — without it cuengine can't evaluate.
    let module_path = workdir.join("cue.mod").join("module.cue");
    if !module_path.is_file() {
        if let Some(parent) = module_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("mkdir cue.mod failed: {e}"))?;
        }
        std::fs::write(
            &module_path,
            "module: \"comtrya.synthesised/repo\"\nlanguage: version: \"v0.10.0\"\n",
        )
        .map_err(|e| format!("write synthetic module.cue failed: {e}"))?;
    }

    let injected_dir = workdir.join("_comtrya");
    std::fs::create_dir_all(&injected_dir)
        .map_err(|e| format!("mkdir _comtrya failed: {e}"))?;

    std::fs::write(injected_dir.join("00-kernel.cue"), KERNEL_CUE_BASE)
        .map_err(|e| format!("write kernel base schema failed: {e}"))?;

    for schema in extension_schemas {
        let safe_id = schema.schema_id.replace(['/', ' '], "-");
        let path = injected_dir.join(format!("ext-{}-{}.cue", schema.extension_id, safe_id));
        std::fs::write(&path, &schema.snippet)
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

            json!({
                "projects": projects,
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
            let benign = message.contains("matched no packages")
                || message.contains("no CUE files");
            json!({
                "projects": [implicit_default_project()],
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
        let Some(map) = value.and_then(|v| v.get("projects")).and_then(Value::as_object) else {
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

fn implicit_default_project() -> Value {
    json!({
        "name": "repo",
        "root": "",
        "implicit": true,
        "declaredAt": "",
    })
}
