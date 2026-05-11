use forgepoint_core::InstanceConfig;

fn main() {
    let command = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "validate-config".to_string());

    match command.as_str() {
        "validate-config" => match InstanceConfig::minimal_dev().validate() {
            Ok(()) => println!("config valid"),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        },
        "backup" | "restore" => {
            println!(
                "{command} is wired in the contract layer and implemented in core backup flows"
            );
        }
        _ => {
            eprintln!("unknown command: {command}");
            std::process::exit(2);
        }
    }
}
