//! Git Smart HTTP (protocol v2) server scaffolding.
//!
//! This module will implement read-only Smart HTTP (upload-pack) end-to-end in Rust.
//! For now, handlers return 501 until filled in incrementally.

pub mod errors;
pub mod negotiation;
pub mod pack;
pub mod pkt;
pub mod repo;
pub mod state;
pub mod v2;

pub use repo::RepositoryProvider;
pub use state::GitHttpState;
