//! OCI-distributed extension fetching and caching for Comtrya.
//!
//! Extensions are published as OCI artifacts (a manifest plus one or more
//! layers, one of which is the .wasm component). This crate fetches by
//! `registry/image:tag` or `@sha256:digest`, verifies checksums, and caches
//! resolved artifacts under a host-managed cache directory.

pub mod cache;
pub mod oci_fetcher;

pub use cache::{CacheMetadata, ExtensionCache, compute_sha256};
pub use oci_fetcher::OciExtensionFetcher;
