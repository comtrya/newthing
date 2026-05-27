//! Apply a freshly-evaluated [`InstanceConfig`] to the running [`Runtime`].
//!
//! The config repo is the source of truth; on each sync the reconciler brings
//! the live runtime in line with it. This phase applies the security-relevant,
//! cheaply-swappable surfaces live — the admin allow-list and the OIDC issuer
//! set — without a restart. Repositories, labels, and the extension set are
//! reconciled in later phases.

use comtrya_core::InstanceConfig;

use crate::Runtime;

/// Apply the live-updatable parts of `config` to `runtime`.
pub(crate) fn reconcile_live(runtime: &Runtime, config: &InstanceConfig) {
    runtime.set_admins(config.admins.clone());
    if let Ok(mut auth) = runtime.auth_service.lock() {
        auth.set_issuers(&config.oidc_issuers);
    }
}
