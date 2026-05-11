use forgepoint_core::InstanceConfig;

fn main() {
    let config = InstanceConfig::minimal_dev();
    if let Err(error) = config.validate() {
        eprintln!("forgepoint-server refused to start: {error}");
        std::process::exit(1);
    }

    println!("forgepoint-server contract stub ready");
}
