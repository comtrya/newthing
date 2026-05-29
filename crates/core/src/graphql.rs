/// Kernel-owned GraphQL capabilities advertised to clients. Extension GraphQL
/// SDL is composed by the server's WIT-driven schema path, not here.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InstanceCapabilities {
    pub git_https: bool,
    pub git_lfs: bool,
    pub sse: bool,
    pub graphql_subscriptions: bool,
    pub extension_runtime: bool,
}

impl InstanceCapabilities {
    pub fn v1() -> Self {
        Self {
            git_https: true,
            git_lfs: false,
            sse: true,
            graphql_subscriptions: true,
            extension_runtime: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn instance_capabilities_keep_lfs_false_for_v1() {
        let caps = InstanceCapabilities::v1();
        assert!(!caps.git_lfs);
        assert!(caps.git_https);
        assert!(caps.graphql_subscriptions);
    }
}
