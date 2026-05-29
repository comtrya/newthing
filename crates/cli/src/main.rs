use comtrya_core::{InstanceCapabilities, InstanceConfig};
use std::io::Write;
use std::path::{Path, PathBuf};

const MODULE_CUE: &str = "module: \"comtrya.gitops/config\"\nlanguage: version: \"v0.10.0\"\n";

const GLOBAL_CONFIG_CUE: &str = r#"package comtrya

// Global Comtrya instance configuration for remote GitOps sync.
// Commit this file to the repo/path configured by COMTRYA_CONFIG_REPO_URL and
// optional COMTRYA_CONFIG_REPO_PATH, then replace the placeholder values below.

instance: {
	id:             "comtrya"
	name:           "Comtrya"
	publicURL:      "https://comtrya.example.com"
	environment:    "production"
	allowedOrigins: ["https://comtrya.example.com"]
}

database: {
	kind: "sqlite"
	url:  "sqlite:///app/data/metadata/comtrya.db"
}

oidc: issuers: [{
	id:           "primary"
	issuerURL:    "https://idp.example.com"
	clientID:     "comtrya"
	clientKind:   "confidential"
	clientSecret: "replace-with-oidc-client-secret"
	redirectURL:  "https://comtrya.example.com/auth/oidc/primary/callback"
	allowed: domains: ["example.com"]
}]

storage: repositories: {
	default: "local"
	backends: local: {
		kind: "local"
		path: "/app/data/repositories"
	}
}

authz: kind: "spicedb"

workspaces: default: {
	name:       "Default"
	visibility: "PRIVATE"
}
"#;

#[derive(Debug)]
struct CliError {
    message: String,
    exit_code: i32,
}

impl CliError {
    fn new(message: impl Into<String>, exit_code: i32) -> Self {
        Self {
            message: message.into(),
            exit_code,
        }
    }
}

fn main() {
    if let Err(error) = run(std::env::args().skip(1), &mut std::io::stdout()) {
        eprintln!("{}", error.message);
        std::process::exit(error.exit_code);
    }
}

fn run(args: impl IntoIterator<Item = String>, stdout: &mut dyn Write) -> Result<(), CliError> {
    let args = args.into_iter().collect::<Vec<_>>();
    let command = args
        .first()
        .map(String::as_str)
        .unwrap_or("validate-config");

    match command {
        "validate-config" => match InstanceConfig::minimal_dev().validate() {
            Ok(()) => writeln!(stdout, "config valid")
                .map_err(|error| CliError::new(format!("failed to write stdout: {error}"), 1))?,
            Err(error) => {
                return Err(CliError::new(error.to_string(), 1));
            }
        },
        "capabilities" => {
            let capabilities = InstanceCapabilities::v1();
            writeln!(
                stdout,
                "gitHTTPS={} gitPush={} gitLFS={} sse={} graphqlSubscriptions={} extensionRuntime={}",
                capabilities.git_https,
                capabilities.git_push,
                capabilities.git_lfs,
                capabilities.sse,
                capabilities.graphql_subscriptions,
                capabilities.extension_runtime
            )
            .map_err(|error| CliError::new(format!("failed to write stdout: {error}"), 1))?;
        }
        "generate" => generate(&args[1..], stdout)?,
        "help" | "--help" | "-h" => print_help(stdout)?,
        _ => {
            return Err(CliError::new(
                format!("unknown command: {command}\n\n{}", help_text()),
                2,
            ));
        }
    }
    Ok(())
}

fn generate(args: &[String], stdout: &mut dyn Write) -> Result<(), CliError> {
    let mut rest = args;
    if matches!(rest.first().map(String::as_str), Some("config")) {
        rest = &rest[1..];
    }

    let mut dir = PathBuf::from(".");
    let mut force = false;
    let mut stdout_only = false;
    let mut dir_or_force_set = false;
    let mut i = 0;
    while i < rest.len() {
        match rest[i].as_str() {
            "--dir" | "-d" => {
                let Some(value) = rest.get(i + 1) else {
                    return Err(CliError::new("generate config --dir requires a value", 2));
                };
                if value.starts_with('-') {
                    return Err(CliError::new("generate config --dir requires a value", 2));
                }
                dir = PathBuf::from(value);
                dir_or_force_set = true;
                i += 2;
            }
            "--force" | "-f" => {
                force = true;
                dir_or_force_set = true;
                i += 1;
            }
            "--stdout" => {
                stdout_only = true;
                i += 1;
            }
            "--help" | "-h" => {
                print_generate_help(stdout)?;
                return Ok(());
            }
            other => {
                return Err(CliError::new(
                    format!("unknown generate config option: {other}"),
                    2,
                ));
            }
        }
    }

    if stdout_only {
        if dir_or_force_set {
            return Err(CliError::new(
                "generate config --stdout cannot be combined with --dir or --force",
                2,
            ));
        }
        write!(stdout, "{GLOBAL_CONFIG_CUE}")
            .map_err(|error| CliError::new(format!("failed to write stdout: {error}"), 1))?;
        return Ok(());
    }

    write_generated_config(&dir, force)?;
    writeln!(stdout, "generated {}", dir.join("comtrya.cue").display())
        .map_err(|error| CliError::new(format!("failed to write stdout: {error}"), 1))?;
    Ok(())
}

fn write_generated_config(dir: &Path, force: bool) -> Result<(), CliError> {
    let config_path = dir.join("comtrya.cue");
    let module_path = dir.join("cue.mod/module.cue");
    if !force {
        for path in [&config_path, &module_path] {
            if path.exists() {
                return Err(CliError::new(
                    format!(
                        "{} already exists; pass --force to overwrite",
                        path.display()
                    ),
                    1,
                ));
            }
        }
    }
    std::fs::create_dir_all(dir.join("cue.mod")).map_err(|error| {
        CliError::new(
            format!(
                "failed to create {}: {error}",
                dir.join("cue.mod").display()
            ),
            1,
        )
    })?;
    std::fs::write(&module_path, MODULE_CUE).map_err(|error| {
        CliError::new(
            format!("failed to write {}: {error}", module_path.display()),
            1,
        )
    })?;
    std::fs::write(&config_path, GLOBAL_CONFIG_CUE).map_err(|error| {
        CliError::new(
            format!("failed to write {}: {error}", config_path.display()),
            1,
        )
    })?;
    Ok(())
}

fn print_help(stdout: &mut dyn Write) -> Result<(), CliError> {
    write!(stdout, "{}", help_text())
        .map_err(|error| CliError::new(format!("failed to write stdout: {error}"), 1))
}

fn print_generate_help(stdout: &mut dyn Write) -> Result<(), CliError> {
    write!(
        stdout,
        "Usage: comtrya generate [config] [--dir <path>] [--force] [--stdout]\n\n\
         Generates a remote GitOps global config directory containing:\n\
           <path>/comtrya.cue\n\
           <path>/cue.mod/module.cue\n"
    )
    .map_err(|error| CliError::new(format!("failed to write stdout: {error}"), 1))
}

fn help_text() -> &'static str {
    "Usage: comtrya <command>\n\n\
Commands:\n\
  validate-config       Validate the built-in minimal dev config\n\
  generate [config]     Generate a remote GitOps comtrya.cue config\n\
  capabilities          Print kernel capability flags\n"
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_path(name: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("comtrya-cli-{name}-{}-{nanos}", std::process::id()))
    }

    #[test]
    fn generate_config_writes_valid_gitops_config_directory() {
        let dir = temp_path("config");
        write_generated_config(&dir, false).expect("generate config");
        let config =
            comtrya_core::evaluate_instance_config(&dir).expect("generated config evaluates");
        assert_eq!(config.id, "comtrya");
        assert_eq!(config.oidc_issuers[0].id, "primary");
        std::fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn generate_config_refuses_to_overwrite_without_force() {
        let dir = temp_path("overwrite");
        write_generated_config(&dir, false).expect("initial generate");
        let error = write_generated_config(&dir, false).expect_err("overwrite should fail");
        assert!(error.message.contains("--force"));
        write_generated_config(&dir, true).expect("force overwrite");
        std::fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn generate_stdout_prints_comtrya_cue_without_writing_files() {
        let mut output = Vec::new();
        run(
            ["generate".to_string(), "--stdout".to_string()],
            &mut output,
        )
        .expect("stdout generate");
        let output = String::from_utf8(output).unwrap();
        assert!(output.starts_with("package comtrya"));
    }

    #[test]
    fn generate_stdout_rejects_dir() {
        let error = run(
            [
                "generate".to_string(),
                "config".to_string(),
                "--dir".to_string(),
                "./out".to_string(),
                "--stdout".to_string(),
            ],
            &mut Vec::new(),
        )
        .expect_err("--dir with --stdout should be rejected");
        assert_eq!(error.exit_code, 2);
        assert!(error.message.contains("--stdout"));
    }

    #[test]
    fn generate_stdout_rejects_force() {
        let error = run(
            [
                "generate".to_string(),
                "--force".to_string(),
                "--stdout".to_string(),
            ],
            &mut Vec::new(),
        )
        .expect_err("--force with --stdout should be rejected");
        assert_eq!(error.exit_code, 2);
    }

    #[test]
    fn generate_dir_rejects_flag_shaped_value() {
        let error = run(
            [
                "generate".to_string(),
                "--dir".to_string(),
                "--force".to_string(),
            ],
            &mut Vec::new(),
        )
        .expect_err("--dir followed by a flag should be rejected");
        assert_eq!(error.exit_code, 2);
        assert!(error.message.contains("--dir requires a value"));
    }

    #[test]
    fn generate_rejects_undocumented_subcommand_aliases() {
        for alias in ["global-config", "comtrya.cue"] {
            let error = run(["generate".to_string(), alias.to_string()], &mut Vec::new())
                .expect_err("alias should be rejected as unknown option");
            assert_eq!(error.exit_code, 2);
        }
    }
}
