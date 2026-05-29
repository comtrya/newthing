//! Git Smart HTTP (protocol v2) server scaffolding.
//!
//! This module will implement read-only Smart HTTP (upload-pack) end-to-end in Rust.
//! For now, handlers return 501 until filled in incrementally.

pub mod negotiation;
pub mod pack;
pub mod pkt;
pub mod receive;
pub mod repo;
pub mod state;
pub mod v2;

pub use repo::RepositoryProvider;
pub use state::GitHttpState;

/// The 40-character all-zero object id used as a sentinel in the Git wire
/// protocol to mean "no object" (e.g. the old oid of a ref creation, or the
/// new oid of a ref deletion).
pub const ZERO_OID: &str = "0000000000000000000000000000000000000000";
