//! Read-only Git Smart HTTP (protocol v2) server, implemented in pure Rust.
//!
//! Implements the upload-pack side of Smart HTTP v2 end-to-end: the
//! `info/refs` capability advertisement, the `ls-refs` command, and
//! `fetch`/packfile streaming. Push (`receive-pack`) is intentionally
//! rejected; this surface is read-only.

pub mod errors;
pub mod pack;
pub mod pkt;
pub mod repo;
pub mod state;
pub mod v2;

pub use repo::RepositoryProvider;
pub use state::GitHttpState;
