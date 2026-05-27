use comtrya_core::{
    BackupCoordinator, EventOutbox, InstanceCapabilities, InstanceConfig, empty_backup_store,
};

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
        "capabilities" => {
            let capabilities = InstanceCapabilities::v1();
            println!(
                "gitHTTPS={} gitLFS={} sse={} graphqlSubscriptions={} extensionRuntime={}",
                capabilities.git_https,
                capabilities.git_lfs,
                capabilities.sse,
                capabilities.graphql_subscriptions,
                capabilities.extension_runtime
            );
        }
        "backup" => {
            let store = empty_backup_store();
            let mut coordinator = BackupCoordinator::default();
            let bundle = coordinator.backup(&store, Vec::new(), 0, "package comtrya", false);
            println!(
                "backup signed={} repositories={} secrets={}",
                bundle.signed,
                bundle.repository_ids.len(),
                bundle.secret_names.len()
            );
        }
        "restore" => {
            let store = empty_backup_store();
            let mut coordinator = BackupCoordinator::default();
            let bundle = coordinator.backup(&store, Vec::new(), 0, "package comtrya", false);
            let mut outbox = EventOutbox::default();
            match coordinator.restore_to_empty(bundle, true, &mut outbox) {
                Ok(report) => println!(
                    "restore repositories={} secrets={} event={}",
                    report.repository_count, report.secret_count, report.emitted_event_type
                ),
                Err(error) => {
                    eprintln!("{error}");
                    std::process::exit(1);
                }
            }
        }
        _ => {
            eprintln!("unknown command: {command}");
            std::process::exit(2);
        }
    }
}
