use anyhow::Result;
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
struct HostCredentials {
    pub host_url: String, // e.g. "http://localhost:3000"
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at_secs: u64,
}

#[derive(serde::Deserialize)]
#[allow(dead_code)]
struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    verification_uri_complete: String,
    expires_in: u64,
    interval: u64,
}

#[derive(serde::Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: String,
    expires_in: u64,
}

#[derive(serde::Deserialize)]
struct ErrorResponse {
    error: String,
    error_description: Option<String>,
}

struct CliArgs {
    command: String, // "auth-login", "auth-status", "auth-logout", "auth-setup-git", "git-credential"
    sub_action: Option<String>,
    host: Option<String>,
    all: bool,
}

fn get_home_dir() -> Option<PathBuf> {
    std::env::var("HOME")
        .ok()
        .map(PathBuf::from)
        .or_else(|| std::env::var("USERPROFILE").ok().map(PathBuf::from))
}

fn warn_plaintext_fallback() {
    if std::env::var("CRY_ALLOW_PLAINTEXT_TOKEN_STORE").is_err() {
        eprintln!(
            "\x1b[1;33mWARNING: OS Keychain (keyring) is unavailable. Falling back to plaintext JSON file storage at ~/.config/comtrya/cry.json.\x1b[0m"
        );
        eprintln!(
            "\x1b[1;33mTo silence this warning, set CRY_ALLOW_PLAINTEXT_TOKEN_STORE=1 in your environment.\x1b[0m"
        );
    }
}

fn get_keyring_entry(host: &str) -> Result<keyring::Entry, keyring::Error> {
    keyring::Entry::new("comtrya-cry", host)
}

fn read_credentials(host: &str) -> Option<HostCredentials> {
    // 1. Try keyring
    if let Some(creds) = get_keyring_entry(host)
        .ok()
        .and_then(|entry| entry.get_password().ok())
        .and_then(|password| serde_json::from_str::<HostCredentials>(&password).ok())
    {
        return Some(creds);
    }

    // 2. Fallback to file
    let home = get_home_dir()?;
    let path = home.join(".config/comtrya/cry.json");
    if let Some(creds) = std::fs::read_to_string(&path)
        .ok()
        .and_then(|content| serde_json::from_str::<HashMap<String, HostCredentials>>(&content).ok())
        .and_then(|map| map.get(host).cloned())
    {
        warn_plaintext_fallback();
        return Some(creds);
    }
    None
}

fn write_secure_file(path: &Path, content: &str) -> Result<()> {
    #[cfg(unix)]
    use std::os::unix::fs::OpenOptionsExt;

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(parent, std::fs::Permissions::from_mode(0o700));
        }
    }

    let temp_path = path.with_extension("tmp");
    let mut options = OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    options.mode(0o600);

    let mut file = options.open(&temp_path)?;
    file.write_all(content.as_bytes())?;
    file.sync_all()?;
    drop(file);

    // Atomically rename
    #[cfg(windows)]
    if path.exists() {
        let _ = std::fs::remove_file(path);
    }
    std::fs::rename(temp_path, path)?;
    Ok(())
}

fn write_credentials(host: &str, creds: &HostCredentials) -> Result<()> {
    let serialized = serde_json::to_string(creds)?;

    // 1. Try keyring
    let mut keyring_success = false;
    if let Ok(entry) = get_keyring_entry(host) {
        keyring_success = entry.set_password(&serialized).is_ok();
    }

    // Always mirror to file or fallback if keyring fails
    if !keyring_success {
        warn_plaintext_fallback();
        let home =
            get_home_dir().ok_or_else(|| anyhow::anyhow!("could not find home directory"))?;
        let path = home.join(".config/comtrya/cry.json");

        let mut map = if path.exists() {
            std::fs::read_to_string(&path)
                .ok()
                .and_then(|content| {
                    serde_json::from_str::<HashMap<String, HostCredentials>>(&content).ok()
                })
                .unwrap_or_default()
        } else {
            HashMap::new()
        };

        map.insert(host.to_string(), creds.clone());
        let map_serialized = serde_json::to_string_pretty(&map)?;
        write_secure_file(&path, &map_serialized)?;
    }

    Ok(())
}

fn delete_credentials(host: &str) -> Result<()> {
    if let Ok(entry) = get_keyring_entry(host) {
        let _ = entry.delete_credential();
    }

    let home = get_home_dir().ok_or_else(|| anyhow::anyhow!("could not find home directory"))?;
    let path = home.join(".config/comtrya/cry.json");

    let mut map_opt = std::fs::read_to_string(&path).ok().and_then(|content| {
        serde_json::from_str::<HashMap<String, HostCredentials>>(&content).ok()
    });

    if let Some(map) = map_opt.as_mut().filter(|m| m.contains_key(host)) {
        map.remove(host);
        if map.is_empty() {
            let _ = std::fs::remove_file(&path);
        } else {
            let map_serialized = serde_json::to_string_pretty(&map)?;
            write_secure_file(&path, &map_serialized)?;
        }
    }

    Ok(())
}

fn delete_all_credentials() -> Result<()> {
    // Collect all hosts from the file map to delete them from keyring too
    let home = get_home_dir().ok_or_else(|| anyhow::anyhow!("could not find home directory"))?;
    let path = home.join(".config/comtrya/cry.json");
    if path.exists() {
        if let Some(map) = std::fs::read_to_string(&path).ok().and_then(|content| {
            serde_json::from_str::<HashMap<String, HostCredentials>>(&content).ok()
        }) {
            for host in map.keys() {
                if let Ok(entry) = get_keyring_entry(host) {
                    let _ = entry.delete_credential();
                }
            }
        }
        let _ = std::fs::remove_file(&path);
    }
    Ok(())
}

fn parse_and_normalize_host(input: &str) -> Result<(String, String)> {
    let mut url_str = input.to_string();
    if !url_str.starts_with("http://") && !url_str.starts_with("https://") {
        if url_str.starts_with("localhost") || url_str.starts_with("127.0.0.1") {
            url_str = format!("http://{}", url_str);
        } else {
            url_str = format!("https://{}", url_str);
        }
    }

    let parsed = reqwest::Url::parse(&url_str)?;
    let host_part = parsed
        .host_str()
        .ok_or_else(|| anyhow::anyhow!("invalid host"))?
        .to_string();
    let port = parsed.port();

    let normalized_host = match port {
        Some(p) => format!("{}:{}", host_part, p),
        None => host_part,
    };

    let base_url = format!("{}://{}", parsed.scheme(), normalized_host);
    Ok((normalized_host, base_url))
}

struct SingleFlightLock {
    path: PathBuf,
}

impl SingleFlightLock {
    fn new() -> Option<Self> {
        let home = get_home_dir()?;
        let path = home.join(".config/comtrya/cry.lock.active");
        Some(Self { path })
    }

    fn acquire(&self, host: &str, timeout_secs: u64) -> Option<HostCredentials> {
        let start = Instant::now();
        let parent = self.path.parent().unwrap();
        let _ = std::fs::create_dir_all(parent);

        loop {
            if let Some(creds) = read_credentials(host) {
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                if creds.expires_at_secs > now + 30 {
                    return Some(creds);
                }
            }

            match OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&self.path)
            {
                Ok(_) => {
                    return None;
                }
                Err(ref e) if e.kind() == io::ErrorKind::AlreadyExists => {
                    if start.elapsed().as_secs() >= timeout_secs {
                        let _ = std::fs::remove_file(&self.path);
                        continue;
                    }
                    std::thread::sleep(Duration::from_millis(100));
                }
                Err(_) => {
                    return None;
                }
            }
        }
    }

    fn release(&self) {
        let _ = std::fs::remove_file(&self.path);
    }
}

fn open_browser(url: &str) {
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(url).status();
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(url).status();
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd")
        .args(["/c", "start", url])
        .status();
}

fn parse_args() -> Result<CliArgs, String> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        return Err("Usage: cry <command> [options]".to_string());
    }

    let mut command = String::new();
    let mut sub_action = None;
    let mut host = None;
    let mut all = false;

    let mut i = 1;
    while i < args.len() {
        let arg = &args[i];
        if arg == "--host" || arg == "-H" {
            if i + 1 < args.len() {
                host = Some(args[i + 1].clone());
                i += 2;
            } else {
                return Err("Error: --host requires an argument".to_string());
            }
        } else if arg == "--all" {
            all = true;
            i += 1;
        } else if command.is_empty() {
            command = arg.clone();
            i += 1;
        } else if (command == "auth" || command == "git-credential") && sub_action.is_none() {
            sub_action = Some(arg.clone());
            i += 1;
        } else {
            i += 1;
        }
    }

    let mapped_cmd = match command.as_str() {
        "auth" => {
            let sub = sub_action.as_deref().unwrap_or("help");
            match sub {
                "login" => "auth-login".to_string(),
                "status" => "auth-status".to_string(),
                "logout" => "auth-logout".to_string(),
                "setup-git" => "auth-setup-git".to_string(),
                _ => return Err(format!("Unknown auth subcommand: {}", sub)),
            }
        }
        "git-credential" => {
            let sub = sub_action.as_deref().unwrap_or("help");
            match sub {
                "get" | "store" | "erase" => {
                    sub_action = Some(sub.to_string());
                    "git-credential".to_string()
                }
                _ => return Err(format!("Unknown git-credential command: {}", sub)),
            }
        }
        "help" | "--help" | "-h" => "help".to_string(),
        _ => return Err(format!("Unknown command: {}", command)),
    };

    Ok(CliArgs {
        command: mapped_cmd,
        sub_action,
        host,
        all,
    })
}

fn print_help() {
    eprintln!("Comtrya Developer CLI (cry)");
    eprintln!("Usage: cry <command> [options]");
    eprintln!();
    eprintln!("Commands:");
    eprintln!("  auth login [--host <host>]        Authenticate with a Comtrya server");
    eprintln!("  auth status [--host <host>]       Show current authentication status");
    eprintln!("  auth logout [--host <host>]       Clear local credentials for a host");
    eprintln!("  auth logout --all                 Clear all local credentials");
    eprintln!(
        "  auth setup-git [--host <host>]    Configure git to use cry as a credential helper"
    );
    eprintln!("  git-credential <get|store|erase>  Git credential helper protocol endpoint");
}

#[tokio::main]
async fn main() {
    let args = match parse_args() {
        Ok(a) => a,
        Err(err) => {
            eprintln!("{}", err);
            print_help();
            std::process::exit(1);
        }
    };

    if args.command == "help" {
        print_help();
        std::process::exit(0);
    }

    let default_host = "http://localhost:3000".to_string();

    match args.command.as_str() {
        "auth-login" => {
            let host_input = args.host.unwrap_or(default_host);
            if let Err(e) = handle_auth_login(&host_input).await {
                eprintln!("Error during login: {}", e);
                std::process::exit(1);
            }
        }
        "auth-status" => {
            let host_input = args.host.unwrap_or(default_host);
            if let Err(e) = handle_auth_status(&host_input) {
                eprintln!("Error checking status: {}", e);
                std::process::exit(1);
            }
        }
        "auth-logout" => {
            if args.all {
                if let Err(e) = delete_all_credentials() {
                    eprintln!("Error clearing all credentials: {}", e);
                    std::process::exit(1);
                }
                eprintln!("Successfully logged out of all Comtrya hosts.");
            } else {
                let host_input = args.host.unwrap_or(default_host);
                if let Err(e) = handle_auth_logout(&host_input).await {
                    eprintln!("Error during logout: {}", e);
                    std::process::exit(1);
                }
            }
        }
        "auth-setup-git" => {
            let host_input = args.host.unwrap_or(default_host);
            if let Err(e) = handle_setup_git(&host_input) {
                eprintln!("Error setting up Git: {}", e);
                std::process::exit(1);
            }
        }
        "git-credential" => {
            let action = args.sub_action.unwrap_or_default();
            if let Err(e) = handle_git_credential(&action).await {
                eprintln!("Git credential helper failed: {}", e);
                std::process::exit(1);
            }
        }
        _ => {
            print_help();
            std::process::exit(1);
        }
    }
}

async fn handle_auth_login(host_input: &str) -> Result<()> {
    let (normalized_host, base_url) = parse_and_normalize_host(host_input)?;
    eprintln!("Initiating authentication flow with {} ...", base_url);

    let client = reqwest::Client::new();
    let code_url = format!("{}/auth/device/code", base_url);

    let resp = client
        .post(&code_url)
        .form(&[("client_id", "cry")])
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let err_text = resp.text().await.unwrap_or_default();
        anyhow::bail!(
            "Failed to get device code from server (HTTP {}): {}",
            status,
            err_text
        );
    }

    let code_resp: DeviceCodeResponse = resp.json().await?;

    eprintln!();
    eprintln!("------------------------------------------------------------");
    eprintln!(
        "  Verification Code: \x1b[1;32m{}\x1b[0m",
        code_resp.user_code
    );
    eprintln!("------------------------------------------------------------");
    eprintln!();
    eprintln!("Opening your browser to approve authorization...");

    open_browser(&code_resp.verification_uri_complete);

    eprintln!("If the browser did not open, navigate to:");
    eprintln!("  {}", code_resp.verification_uri_complete);
    eprintln!();
    eprintln!("Waiting for authorization to complete...");

    let token_url = format!("{}/auth/device/token", base_url);
    let mut interval = code_resp.interval;
    if interval == 0 {
        interval = 5;
    }
    let start_time = Instant::now();
    let expires_in = code_resp.expires_in;

    loop {
        if start_time.elapsed().as_secs() >= expires_in {
            anyhow::bail!("Verification code expired. Please run 'cry auth login' again.");
        }

        tokio::time::sleep(Duration::from_secs(interval)).await;

        let poll_resp = client
            .post(&token_url)
            .form(&[
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
                ("client_id", "cry"),
                ("device_code", &code_resp.device_code),
            ])
            .send()
            .await?;

        if poll_resp.status().is_success() {
            let token_data: TokenResponse = poll_resp.json().await?;
            let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
            let creds = HostCredentials {
                host_url: base_url.clone(),
                access_token: token_data.access_token,
                refresh_token: token_data.refresh_token,
                expires_at_secs: now + token_data.expires_in,
            };

            write_credentials(&normalized_host, &creds)?;
            eprintln!(
                "\x1b[1;32mSuccess! You are successfully authenticated with {}.\x1b[0m",
                base_url
            );
            return Ok(());
        }

        if poll_resp.status() == reqwest::StatusCode::BAD_REQUEST {
            if let Ok(err_data) = poll_resp.json::<ErrorResponse>().await {
                match err_data.error.as_str() {
                    "authorization_pending" => {
                        // Keep waiting
                    }
                    "slow_down" => {
                        interval = interval.saturating_add(5);
                    }
                    "access_denied" => {
                        anyhow::bail!("Authorization request was denied by the user.");
                    }
                    "expired_token" => {
                        anyhow::bail!(
                            "Verification code has expired. Please run 'cry auth login' again."
                        );
                    }
                    other => {
                        anyhow::bail!(
                            "OAuth2 error from server: {} ({:?})",
                            other,
                            err_data.error_description
                        );
                    }
                }
            } else {
                anyhow::bail!("Server returned unparseable Bad Request during token polling.");
            }
        } else {
            anyhow::bail!(
                "Server returned unexpected HTTP status during token polling: {}",
                poll_resp.status()
            );
        }
    }
}

fn handle_auth_status(host_input: &str) -> Result<()> {
    let (normalized_host, _) = parse_and_normalize_host(host_input)?;
    if let Some(creds) = read_credentials(&normalized_host) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
        if creds.expires_at_secs > now {
            let remaining = creds.expires_at_secs - now;
            println!("Authenticated with: {}", creds.host_url);
            println!("Status: Active (token expires in {} seconds)", remaining);
        } else {
            println!("Authenticated with: {}", creds.host_url);
            println!("Status: Expired (will attempt auto-refresh on next Git operation)");
        }
    } else {
        println!("Not authenticated with: {}", host_input);
    }
    Ok(())
}

async fn handle_auth_logout(host_input: &str) -> Result<()> {
    let (normalized_host, base_url) = parse_and_normalize_host(host_input)?;
    if let Some(creds) = read_credentials(&normalized_host) {
        // Attempt server-side revocation
        let client = reqwest::Client::new();
        let revoke_url = format!("{}/auth/token/revoke", base_url);
        let _ = client
            .post(&revoke_url)
            .form(&[("token", &creds.refresh_token)])
            .send()
            .await;
    }

    delete_credentials(&normalized_host)?;
    eprintln!("Successfully logged out of {}.", base_url);
    Ok(())
}

fn handle_setup_git(host_input: &str) -> Result<()> {
    let (_, base_url) = parse_and_normalize_host(host_input)?;

    // git config --global credential.<url>.helper "!cry git-credential"
    let key = format!("credential.{}.helper", base_url);
    let output = std::process::Command::new("git")
        .args(["config", "--global", &key, "!cry git-credential"])
        .output()?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Failed to run git config: {}", err);
    }

    eprintln!(
        "\x1b[1;32mSuccess! Git has been configured to use 'cry git-credential' for {}.\x1b[0m",
        base_url
    );
    Ok(())
}

async fn handle_git_credential(action: &str) -> Result<()> {
    // Read stdin for protocol, host, path, etc.
    let mut input = String::new();
    io::stdin().read_to_string(&mut input)?;

    let mut params = HashMap::new();
    for line in input.lines() {
        let line = line.trim();
        if line.is_empty() {
            break;
        }
        if let Some((k, v)) = line.split_once('=') {
            params.insert(k.to_string(), v.to_string());
        }
    }

    let Some(host) = params.get("host") else {
        // Git protocol expectation: if no host is supplied, do nothing
        return Ok(());
    };

    match action {
        "get" => {
            // Anti-exfiltration: verify we have credentials stored for this host!
            let Some(creds) = read_credentials(host) else {
                // If not logged in, return nothing (git will fallback)
                return Ok(());
            };

            let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
            let mut final_creds = creds.clone();

            // Check if access token is expired or expiring soon (within 30 seconds skew)
            if creds.expires_at_secs <= now + 30 {
                // Acquire single-flight lock
                if let Some(lock) = SingleFlightLock::new() {
                    if let Some(already_refreshed_creds) = lock.acquire(host, 10) {
                        final_creds = already_refreshed_creds;
                    } else {
                        // We hold the lock. We do the refresh!
                        match perform_token_refresh(&creds.host_url, &creds.refresh_token).await {
                            Ok(new_creds) => {
                                let _ = write_credentials(host, &new_creds);
                                final_creds = new_creds;
                            }
                            Err(e) => {
                                lock.release();
                                // Clean up local credentials on auth failure to prevent infinite lock loops
                                let _ = delete_credentials(host);
                                anyhow::bail!("Token refresh failed: {}", e);
                            }
                        }
                        lock.release();
                    }
                }
            }

            // Print the git protocol response strictly to stdout
            println!("username=cry");
            println!("password={}", final_creds.access_token);
            println!(); // Blank line terminates protocol response
        }
        "store" => {
            // Lifetime managed internally, no-op
        }
        "erase" => {
            // Standard git logout
            if let Some(creds) = read_credentials(host) {
                let client = reqwest::Client::new();
                let revoke_url = format!("{}/auth/token/revoke", creds.host_url);
                let _ = client
                    .post(&revoke_url)
                    .form(&[("token", &creds.refresh_token)])
                    .send()
                    .await;
            }
            let _ = delete_credentials(host);
        }
        _ => {
            anyhow::bail!("Unknown git-credential action: {}", action);
        }
    }

    Ok(())
}

async fn perform_token_refresh(host_url: &str, refresh_token: &str) -> Result<HostCredentials> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()?;

    let url = format!("{}/auth/device/token", host_url);
    let params = [
        ("grant_type", "refresh_token"),
        ("client_id", "cry"),
        ("refresh_token", refresh_token),
    ];

    let resp = client.post(&url).form(&params).send().await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let err_text = resp.text().await.unwrap_or_default();
        anyhow::bail!(
            "Server returned HTTP {} on token refresh: {}",
            status,
            err_text
        );
    }

    let token_resp: TokenResponse = resp.json().await?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();

    Ok(HostCredentials {
        host_url: host_url.to_string(),
        access_token: token_resp.access_token,
        refresh_token: token_resp.refresh_token,
        expires_at_secs: now + token_resp.expires_in,
    })
}
