use comtrya_core::*;

/// Exercises the surviving kernel contract surface end to end: config
/// validation, OIDC login with real clock + workspace attribution, kernel
/// event emission via the auth-service outbox + the typed event envelope,
/// capability advertisement, and the extension asset response policy.
///
/// The former in-crate `MetadataStore` / `BackupService` / `SecretsService`
/// shadow surfaces have been deleted (TNQ-3 P1) — the server has its own
/// `crates/server/src/persistence.rs::PersistentStore`, no production
/// caller ever drove the kernel-side metadata-store API, and the test
/// fixtures held the only references. This test no longer asserts that
/// surface.
#[test]
fn kernel_mvp_flow_is_exercised_through_contract_layer() {
    let config = InstanceConfig::minimal_dev();
    config.validate().unwrap();

    let mut auth = AuthService::new(&config);
    let login = auth
        .login(
            "dev",
            OidcClaims {
                issuer: "https://issuer.example.test".to_string(),
                subject: "rawkode".to_string(),
                email: Some("rawkode@example.test".to_string()),
                display_name: Some("Rawkode".to_string()),
                groups: Vec::new(),
            },
            1_700_000_000_000,
        )
        .unwrap();
    assert!(login.created);
    let auth_events = auth.take_outbox();
    assert!(
        auth_events
            .iter()
            .any(|event| event.event_type == CoreEventType::AuthLoginSucceeded.as_str())
    );
    let created_event = auth_events
        .iter()
        .find(|event| event.event_type == CoreEventType::UserCreated.as_str())
        .expect("user-created event is emitted on first login");
    assert_eq!(created_event.source.canonical(), "comtrya://workspace");
    assert_eq!(created_event.time, "2023-11-14T22:13:20.000Z");

    let mut outbox = EventOutbox::default();
    let repo_resource = ResourceRef::new(
        ResourceKind::Repository,
        OpaqueId::new(IdPrefix::Repository),
    )
    .unwrap();
    outbox.append(EventEnvelope::core(
        CoreEvent {
            event_type: CoreEventType::RepositoryRefUpdated,
            source: repo_resource.clone(),
            subject: Some("refs/heads/main".to_string()),
            actor: EventActor {
                kind: "user".to_string(),
                uri: format!("comtrya://user/{}", login.user.id),
                display_name: Some("Rawkode".to_string()),
            },
            visibility: Visibility::Private,
            resources: vec![repo_resource],
            data_json: "{}".to_string(),
        },
        1_700_000_000_500,
    ));
    assert_eq!(outbox.all().len(), 1);
    assert_eq!(outbox.all()[0].time, "2023-11-14T22:13:20.500Z");

    assert!(InstanceCapabilities::v1().graphql_subscriptions);

    let asset = extension_asset_response(
        "http://localhost:4321",
        &["http://localhost:4321".to_string()],
        "/_extensions/ext_pull_requests/assets/index.abc123.js",
        b"customElements.define('x-test', class extends HTMLElement {})",
        "text/javascript",
        true,
    )
    .unwrap();
    assert_eq!(asset.status, 200);
    assert!(asset.headers.contains_key("Content-Security-Policy"));
}
