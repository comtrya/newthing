use forgepoint_core::{
    CorsPolicy, InstanceCapabilities, InstanceConfig, allowed_methods_for_route,
};

fn main() {
    let config = InstanceConfig::minimal_dev();
    if let Err(error) = config.validate() {
        eprintln!("forgepoint-server refused to start: {error}");
        std::process::exit(1);
    }

    let capabilities = InstanceCapabilities::v1();
    let cors = CorsPolicy {
        allowed_origins: config.allowed_origins.clone(),
    };
    let graphql_methods = allowed_methods_for_route("/graphql").join(",");
    let cors_status = cors
        .check("http://localhost:4321", "/graphql")
        .map(|_| "ready")
        .unwrap_or("blocked");

    println!(
        "forgepoint-server contract stub ready: graphql_methods={} cors={} gitLFS={}",
        graphql_methods, cors_status, capabilities.git_lfs
    );
}
