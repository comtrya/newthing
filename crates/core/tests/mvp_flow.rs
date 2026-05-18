use comtrya_core::*;

#[test]
fn kernel_mvp_flow_is_exercised_through_contract_layer() {
    let config = InstanceConfig::minimal_dev();
    config.validate().unwrap();

    let store = MetadataStore::new(MetadataBackend::Sqlite);
    store.start().unwrap();

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
        )
        .unwrap();
    assert!(login.created);

    let gateway = GraphqlGateway {
        authorizer: InMemoryAuthorizer::default(),
        backend_policy: RepositoryBackendPolicy {
            default_backend: "local".to_string(),
            allowed_storage_backends: vec!["local".to_string()],
        },
    };
    let repository = gateway
        .create_repository(
            &Principal::User(login.user.id.clone()),
            CreateRepositoryInput {
                group_id: OpaqueId::new(IdPrefix::Group),
                slug: "example".to_string(),
                name: Some("Example".to_string()),
                visibility: Visibility::Private,
                storage_backend: None,
            },
        )
        .unwrap();

    let credential = gateway
        .issue_git_credential(
            &mut auth,
            TokenExchangeRequest {
                grant_type: "urn:comtrya:grant:oidc-token-exchange".to_string(),
                subject_token: "jwt".to_string(),
                subject_token_type: "urn:ietf:params:oauth:token-type:jwt".to_string(),
                requested_resource: format!("comtrya://repository/{}", repository.id),
                requested_actions: vec!["git:read".to_string(), "git:write".to_string()],
            },
            Principal::User(login.user.id),
            0,
        )
        .unwrap();
    assert_eq!(credential.scope, ["git:read", "git:write"]);

    let repo_ref = RepoStorageRef {
        repository_id: repository.id.clone(),
    };
    let mut storage = InMemoryRepoStorage::default();
    storage.create_repository(repo_ref.clone()).unwrap();

    let mut invalid_txn = storage
        .begin_receive_pack(
            &repo_ref,
            StagingBudget::for_pack_size(64),
            Vec::new(),
            vec![CueFile {
                path: "comtrya.cue".to_string(),
                // Real CUE error under the cuengine-backed validator
                // (replaces the legacy magic-string trigger).
                source: "package comtrya\nfoo: \"a\"\nfoo: 42".to_string(),
            }],
        )
        .unwrap();
    let invalid = invalid_txn
        .validate_config_tree(
            &GitOid::new("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").unwrap(),
            &CueEvalBudget::default(),
        )
        .unwrap();
    assert!(!invalid.accepted);

    let new_oid = GitOid::new("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb").unwrap();
    let update = RefUpdate {
        name: "refs/heads/main".to_string(),
        old_oid: None,
        new_oid: new_oid.clone(),
    };
    let mut valid_txn = storage
        .begin_receive_pack(
            &repo_ref,
            StagingBudget::for_pack_size(64),
            vec![update.clone()],
            vec![CueFile {
                path: "comtrya.cue".to_string(),
                source: "package comtrya\nrepo: {}".to_string(),
            }],
        )
        .unwrap();
    valid_txn.stage_pack(&[0; 32], 1).unwrap();
    let valid = valid_txn
        .validate_config_tree(&new_oid, &CueEvalBudget::default())
        .unwrap();
    assert!(valid.accepted);
    let result = storage
        .commit_receive_pack(
            valid_txn,
            vec![AcceptedRefUpdate {
                name: update.name,
                old_oid: update.old_oid,
                new_oid,
            }],
        )
        .unwrap();
    assert!(!result.snapshots.is_empty());

    let mut outbox = EventOutbox::default();
    let repo_resource = ResourceRef::new(ResourceKind::Repository, repository.id).unwrap();
    outbox.append(EventEnvelope::core(
        CoreEventType::RepositoryRefUpdated,
        repo_resource.clone(),
        Some("refs/heads/main".to_string()),
        EventActor {
            kind: "user".to_string(),
            uri: "comtrya://user/usr_01HV0K4XAVE2H6R5M8KJZ8Q1A3".to_string(),
            display_name: Some("Rawkode".to_string()),
        },
        Visibility::Private,
        vec![repo_resource],
        "{}",
    ));
    assert_eq!(outbox.all().len(), 1);
    assert!(InstanceCapabilities::v1().graphql_subscriptions);

    let manifest = ExtensionManifest::reference_pull_requests();
    let mut host = ExtensionHost::default();
    let extension = host
        .activate(ExtensionInstallation::new(
            manifest.clone(),
            manifest.capabilities.clone(),
        ))
        .unwrap();
    assert_eq!(extension.state, ExtensionState::Active);

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
    assert!(
        auth.outbox
            .all()
            .iter()
            .any(|event| event.event_type == CoreEventType::AuthLoginSucceeded.as_str())
    );
}
