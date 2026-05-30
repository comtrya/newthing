//! Git Smart HTTP (protocol v2) server.
//!
//! Implements a pure-Rust read/write Smart HTTP v2 surface on top of `gix`:
//! the `info/refs` capability advertisement, the `ls-refs` and `fetch`
//! upload-pack commands (including `ref-in-want`, shallow/deepen, and a
//! limited set of object filters), and a `receive-pack` push handler that
//! ingests the client packfile, verifies object connectivity, and applies
//! ref updates atomically through a single `gix` reference transaction.
//!
//! All HTTP entry points dispatch through [`v2::dispatch`]; the per-suffix
//! routes (`info/refs`, `git-upload-pack`, `git-receive-pack`) are
//! distinguished there. The crate exposes no per-route axum handlers — the
//! embedding server is expected to call [`v2::dispatch`] from its own
//! catch-all route.

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
