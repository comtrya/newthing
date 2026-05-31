//! OCI registry client for fetching WASM extensions
//!
//! This module provides functionality to fetch WASM extensions from OCI-compliant
//! registries with authentication, caching, and content-digest verification.

use crate::cache::{CacheMetadata, ExtensionCache, compute_sha256};
use anyhow::{Context, Result};
use comtrya_core::extensions::OciReference;
use futures_util::StreamExt;
use oci_distribution::Reference;
use oci_distribution::client::{Client, ClientConfig, ClientProtocol};
use oci_distribution::manifest::WASM_LAYER_MEDIA_TYPE;
use oci_distribution::secrets::RegistryAuth;
use std::path::PathBuf;
use std::time::SystemTime;

/// Bytes fetched and verified from a registry, plus the digest they were
/// verified against. The digest always carries the `sha256:` algorithm prefix.
struct VerifiedArtifact {
    wasm: Vec<u8>,
    content_digest: String,
}

/// OCI extension fetcher with caching support
pub struct OciExtensionFetcher {
    client: Client,
    cache: ExtensionCache,
    offline_mode: bool,
    verify_checksums: bool,
}

impl OciExtensionFetcher {
    /// Default timeout for OCI operations (60 seconds)
    const DEFAULT_TIMEOUT_SECS: u64 = 60;

    /// Maximum number of retry attempts for transient failures
    const MAX_RETRIES: u32 = 3;

    /// Base delay for exponential backoff (milliseconds)
    const RETRY_BASE_DELAY_MS: u64 = 1000;

    /// Maximum size (bytes) accepted for a pulled WASM layer. A hostile or
    /// compromised registry can advertise an arbitrarily large layer and OOM
    /// the host while `pull` reads it fully into memory; the manifest
    /// descriptor `size` is checked against this cap BEFORE any layer bytes are
    /// downloaded. 256 MiB is far above any real extension component while
    /// keeping peak memory bounded.
    const MAX_WASM_LAYER_BYTES: u64 = 256 * 1024 * 1024;

    /// Create a new OCI extension fetcher
    pub fn new(cache_dir: PathBuf, offline_mode: bool, verify_checksums: bool) -> Result<Self> {
        let config = ClientConfig {
            protocol: ClientProtocol::Https,
            ..Default::default()
        };

        let client = Client::new(config);
        let cache = ExtensionCache::new(cache_dir)?;

        Ok(Self {
            client,
            cache,
            offline_mode,
            verify_checksums,
        })
    }

    /// Fetch an extension from OCI registry or cache.
    ///
    /// The reference distinguishes a mutable tag from an immutable digest. When a
    /// digest is supplied it is treated as a trust anchor: the resolved content
    /// must hash to that digest or the fetch fails.
    ///
    /// Returns the path to the cached WASM file.
    pub async fn fetch_extension(
        &self,
        registry: &str,
        image: &str,
        reference: &OciReference,
        auth: Option<&RegistryAuth>,
    ) -> Result<PathBuf> {
        let reference_str = reference.as_ref_str();
        let cache_key = ExtensionCache::compute_cache_key(registry, image, reference_str);

        // Check cache first
        if self.cache.is_cached(&cache_key) {
            tracing::info!("Cache hit for {}/{}:{}", registry, image, reference_str);

            // Verify checksum if enabled
            if self.verify_checksums {
                match self.cache.verify_checksum(&cache_key) {
                    Ok(true) => {
                        tracing::debug!("Checksum verification passed for {}", cache_key);
                        return Ok(self.cache.wasm_path(&cache_key));
                    }
                    Ok(false) => {
                        tracing::warn!(
                            "Checksum verification failed for {}, re-fetching",
                            cache_key
                        );
                        // Continue to fetch from registry
                    }
                    Err(e) => {
                        tracing::warn!(
                            "Failed to verify checksum for {}: {}, re-fetching",
                            cache_key,
                            e
                        );
                        // Continue to fetch from registry
                    }
                }
            } else {
                return Ok(self.cache.wasm_path(&cache_key));
            }
        }

        // If in offline mode and not cached, fail
        if self.offline_mode {
            anyhow::bail!(
                "Extension {}/{}:{} not in cache and offline mode is enabled",
                registry,
                image,
                reference_str
            );
        }

        // Fetch from registry with timeout and retry logic
        tracing::info!(
            "Fetching {}/{}:{} from OCI registry",
            registry,
            image,
            reference_str
        );
        let artifact = self
            .fetch_with_retry(registry, image, reference, auth)
            .await?;

        // Validate WASM
        self.validate_wasm(&artifact.wasm)?;

        // Store in cache
        let metadata = CacheMetadata {
            registry: registry.to_string(),
            image: image.to_string(),
            reference: reference_str.to_string(),
            content_digest: Some(artifact.content_digest),
            fetched_at: SystemTime::now(),
            size_bytes: artifact.wasm.len() as u64,
            sha256: compute_sha256(&artifact.wasm),
        };

        self.cache.store(&cache_key, &artifact.wasm, metadata)?;

        Ok(self.cache.wasm_path(&cache_key))
    }

    /// Fetch with exponential backoff retry for transient failures
    async fn fetch_with_retry(
        &self,
        registry: &str,
        image: &str,
        reference: &OciReference,
        auth: Option<&RegistryAuth>,
    ) -> Result<VerifiedArtifact> {
        let reference_str = reference.as_ref_str();
        let mut last_error = None;

        for attempt in 0..Self::MAX_RETRIES {
            if attempt > 0 {
                // Exponential backoff: 1s, 2s, 4s
                let delay_ms = Self::RETRY_BASE_DELAY_MS * (1 << (attempt - 1));
                let delay = std::time::Duration::from_millis(delay_ms);
                tracing::info!(
                    "Retrying fetch for {}/{}:{} (attempt {}/{}) after {}ms",
                    registry,
                    image,
                    reference_str,
                    attempt + 1,
                    Self::MAX_RETRIES,
                    delay_ms
                );
                tokio::time::sleep(delay).await;
            }

            // Try to fetch with timeout
            let timeout = std::time::Duration::from_secs(Self::DEFAULT_TIMEOUT_SECS);
            let result = tokio::time::timeout(
                timeout,
                self.pull_from_registry(registry, image, reference, auth),
            )
            .await;

            match result {
                Ok(Ok(data)) => return Ok(data),
                Ok(Err(e)) => {
                    tracing::warn!(
                        "Attempt {}/{} failed for {}/{}:{}: {}",
                        attempt + 1,
                        Self::MAX_RETRIES,
                        registry,
                        image,
                        reference_str,
                        e
                    );
                    last_error = Some(e);
                }
                Err(_) => {
                    let timeout_error = anyhow::anyhow!(
                        "OCI fetch timed out after {}s",
                        Self::DEFAULT_TIMEOUT_SECS
                    );
                    tracing::warn!(
                        "Attempt {}/{} timed out for {}/{}:{}",
                        attempt + 1,
                        Self::MAX_RETRIES,
                        registry,
                        image,
                        reference_str
                    );
                    last_error = Some(timeout_error);
                }
            }
        }

        // All retries exhausted
        Err(last_error.unwrap_or_else(|| {
            anyhow::anyhow!(
                "Failed to fetch OCI extension after {} attempts",
                Self::MAX_RETRIES
            )
        }))
    }

    /// Build a typed OCI [`Reference`] from a registry/image and a tag-or-digest.
    ///
    /// Tags are joined with `:` and digests with `@`, matching the OCI grammar.
    /// A digest joined with `:` would parse as a tag and silently bypass digest
    /// enforcement, so the distinction must be made here at the boundary.
    fn build_reference(registry: &str, image: &str, reference: &OciReference) -> Reference {
        let repository = format!("{registry}/{image}");
        match reference {
            OciReference::Tag(tag) => {
                Reference::with_tag(registry.to_string(), repository, tag.clone())
            }
            OciReference::Digest(digest) => {
                Reference::with_digest(registry.to_string(), repository, digest.clone())
            }
        }
    }

    /// Pull a WASM component from an OCI registry and verify it against the
    /// manifest (and, for a pinned digest, against the requested digest).
    async fn pull_from_registry(
        &self,
        registry: &str,
        image: &str,
        reference: &OciReference,
        auth: Option<&RegistryAuth>,
    ) -> Result<VerifiedArtifact> {
        let oci_reference = Self::build_reference(registry, image, reference);
        let image_ref = oci_reference.whole();

        let auth = auth.cloned().unwrap_or(RegistryAuth::Anonymous);

        // Pull the manifest BEFORE any layer bytes so we can reject an
        // oversized WASM layer up front. This bounds peak memory: `pull` reads
        // each layer fully into a Vec, so a registry advertising a giant layer
        // would otherwise OOM the host before any digest check runs.
        let (raw_manifest, _header_digest) = self
            .client
            .pull_manifest_raw(
                &oci_reference,
                &auth,
                &[
                    oci_distribution::manifest::OCI_IMAGE_MEDIA_TYPE,
                    oci_distribution::manifest::IMAGE_MANIFEST_MEDIA_TYPE,
                ],
            )
            .await
            .with_context(|| format!("Failed to pull manifest for {image_ref}"))?;

        // When the caller pinned a digest, anchor trust to the manifest bytes WE
        // hash — not the registry-supplied Docker-Content-Digest header, which a
        // hostile registry can forge to echo whatever digest was requested.
        // Recompute its sha256 and require it to equal the pin before trusting
        // any descriptor inside it.
        if let OciReference::Digest(requested) = reference {
            let actual = format!("sha256:{}", compute_sha256(&raw_manifest));
            if actual != requested.as_str() {
                anyhow::bail!(
                    "Digest mismatch for {image_ref}: requested {requested}, manifest bytes hash to {actual}"
                );
            }
        }

        let manifest: oci_distribution::manifest::OciImageManifest =
            serde_json::from_slice(&raw_manifest).with_context(|| {
                format!("Manifest for {image_ref} is not a valid OCI image manifest")
            })?;

        // Reject an oversized WASM layer before downloading it. The descriptor
        // size is advertised by the (digest-anchored, for a pinned ref)
        // manifest, so this runs before the layer bytes hit memory.
        Self::check_wasm_layer_size(&manifest, &image_ref)?;

        // Select the single WASM layer descriptor from the digest-anchored
        // manifest. The pull then streams ONLY that descriptor, bounded by
        // the cap — never invoking the unbounded `Client::pull` path that
        // would otherwise read the full layer into a Vec with no cap.
        let wasm_descriptor = Self::select_wasm_descriptor(&manifest, &image_ref)?;

        let (wasm, content_digest) =
            Self::stream_layer_with_cap(&self.client, &oci_reference, wasm_descriptor, &image_ref)
                .await?;

        tracing::debug!(
            "Pulled and verified {} bytes from {} (digest: {})",
            wasm.len(),
            image_ref,
            content_digest
        );

        Ok(VerifiedArtifact {
            wasm,
            content_digest,
        })
    }

    /// Stream a single WASM layer with a hard per-layer byte cap. Bails as
    /// soon as the cumulative streamed length exceeds `MAX_WASM_LAYER_BYTES`
    /// so a hostile registry cannot OOM the host by streaming more bytes
    /// than the descriptor advertised. Verifies the streamed bytes hash
    /// equals the descriptor digest before returning.
    async fn stream_layer_with_cap(
        client: &Client,
        oci_reference: &Reference,
        descriptor: &oci_distribution::manifest::OciDescriptor,
        image_ref: &str,
    ) -> Result<(Vec<u8>, String)> {
        let mut stream = client
            .pull_blob_stream(oci_reference, descriptor)
            .await
            .with_context(|| {
                format!(
                    "Failed to open layer stream for {image_ref} ({})",
                    descriptor.digest
                )
            })?;
        // Pre-allocate up to the advertised descriptor size (capped) so a
        // truthful registry causes one allocation and a hostile one cannot
        // trick us into reserving more than the cap.
        let initial = (descriptor.size as u64).min(Self::MAX_WASM_LAYER_BYTES) as usize;
        let mut buf: Vec<u8> = Vec::with_capacity(initial);
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.with_context(|| {
                format!(
                    "OCI layer stream failed for {image_ref} ({})",
                    descriptor.digest
                )
            })?;
            if buf.len() as u64 + chunk.len() as u64 > Self::MAX_WASM_LAYER_BYTES {
                anyhow::bail!(
                    "OCI image {image_ref} streamed more than the {}-byte cap (layer {})",
                    Self::MAX_WASM_LAYER_BYTES,
                    descriptor.digest
                );
            }
            buf.extend_from_slice(&chunk);
        }
        let actual = format!("sha256:{}", compute_sha256(&buf));
        if actual != descriptor.digest {
            anyhow::bail!(
                "OCI image {image_ref} layer bytes hash to {actual} but descriptor declares {}",
                descriptor.digest
            );
        }
        Ok((buf, actual))
    }

    fn select_wasm_descriptor<'a>(
        manifest: &'a oci_distribution::manifest::OciImageManifest,
        image_ref: &str,
    ) -> Result<&'a oci_distribution::manifest::OciDescriptor> {
        let wasm_descriptors: Vec<&oci_distribution::manifest::OciDescriptor> = manifest
            .layers
            .iter()
            .filter(|descriptor| descriptor.media_type == WASM_LAYER_MEDIA_TYPE)
            .collect();
        match wasm_descriptors.len() {
            0 => anyhow::bail!(
                "OCI image {image_ref} has no layer with media type {WASM_LAYER_MEDIA_TYPE}"
            ),
            1 => Ok(wasm_descriptors[0]),
            n => anyhow::bail!("OCI image {image_ref} has {n} WASM layers; expected exactly one"),
        }
    }

    /// Select the single WASM layer by media type and verify its bytes against
    /// the manifest layer descriptor digest.
    ///
    /// The registry controls layer ordering and `pull` collects layers
    /// concurrently, so layers are matched to descriptors by their content
    /// digest rather than by index. The chosen layer's recomputed sha256 must
    /// equal a manifest descriptor digest of the WASM media type; otherwise the
    /// bytes do not match what the manifest advertised and are rejected.
    /// Reject any WASM layer whose advertised descriptor size exceeds the cap.
    /// Run against the manifest before pulling layer bytes so a hostile
    /// registry cannot OOM the host with an oversized layer.
    fn check_wasm_layer_size(
        manifest: &oci_distribution::manifest::OciImageManifest,
        image_ref: &str,
    ) -> Result<()> {
        for descriptor in &manifest.layers {
            if descriptor.media_type == WASM_LAYER_MEDIA_TYPE
                && descriptor.size as u64 > Self::MAX_WASM_LAYER_BYTES
            {
                anyhow::bail!(
                    "WASM layer for {image_ref} is {} bytes, exceeding the {}-byte cap",
                    descriptor.size,
                    Self::MAX_WASM_LAYER_BYTES
                );
            }
        }
        Ok(())
    }

    /// Validate that data is a WASM core module or component binary.
    ///
    /// The 8-byte header is `\0asm` followed by a little-endian 32-bit field
    /// whose low 16 bits are the version and high 16 bits are the layer:
    /// a core module is version 1 / layer 0, a component is version 0x0d /
    /// layer 1. Both are accepted here; anything else is rejected at the edge.
    fn validate_wasm(&self, data: &[u8]) -> Result<()> {
        if data.len() < 4 {
            anyhow::bail!("Data too small to be a WASM module (< 4 bytes)");
        }
        if &data[0..4] != b"\0asm" {
            anyhow::bail!("Invalid WASM magic number");
        }
        if data.len() < 8 {
            anyhow::bail!("WASM module truncated (no version)");
        }

        let version = u16::from_le_bytes([data[4], data[5]]);
        let layer = u16::from_le_bytes([data[6], data[7]]);

        match (version, layer) {
            // Core module.
            (1, 0) => tracing::debug!("WASM core module validation passed ({} bytes)", data.len()),
            // Component (binary format version 0x0d, layer 0x01).
            (0x0d, 1) => {
                tracing::debug!("WASM component validation passed ({} bytes)", data.len())
            }
            _ => anyhow::bail!(
                "Unsupported WASM binary version {version:#x} (layer {layer:#x}); \
                 expected core module (1/0) or component (0x0d/1)"
            ),
        }

        Ok(())
    }

    /// Get reference to the cache
    pub fn cache(&self) -> &ExtensionCache {
        &self.cache
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use oci_distribution::manifest::{OciDescriptor, OciImageManifest};
    use tempfile::TempDir;

    fn fetcher() -> (TempDir, OciExtensionFetcher) {
        let temp_dir = TempDir::new().unwrap();
        let fetcher = OciExtensionFetcher::new(temp_dir.path().join("cache"), false, true).unwrap();
        (temp_dir, fetcher)
    }

    /// Minimal valid WASM core module header.
    const CORE_MODULE: &[u8] = b"\0asm\x01\x00\x00\x00";
    /// Minimal valid WASM component header (version 0x0d, layer 0x01).
    const COMPONENT: &[u8] = b"\0asm\x0d\x00\x01\x00";

    fn manifest_with_wasm_layer_size(size: i64) -> OciImageManifest {
        OciImageManifest {
            layers: vec![OciDescriptor {
                media_type: WASM_LAYER_MEDIA_TYPE.to_string(),
                digest: format!("sha256:{}", "a".repeat(64)),
                size,
                ..OciDescriptor::default()
            }],
            ..OciImageManifest::default()
        }
    }

    #[test]
    fn check_wasm_layer_size_rejects_oversized_layer() {
        let oversized = OciExtensionFetcher::MAX_WASM_LAYER_BYTES as i64 + 1;
        let manifest = manifest_with_wasm_layer_size(oversized);
        let result = OciExtensionFetcher::check_wasm_layer_size(&manifest, "ghcr.io/x:v1");
        let err = result.expect_err("oversized layer must be rejected");
        assert!(err.to_string().contains("exceeding"), "{err}");
    }

    #[test]
    fn check_wasm_layer_size_accepts_within_cap() {
        let manifest = manifest_with_wasm_layer_size(1024);
        OciExtensionFetcher::check_wasm_layer_size(&manifest, "ghcr.io/x:v1")
            .expect("within-cap layer must pass");
    }

    #[test]
    fn test_validate_wasm_core_module() {
        let (_dir, fetcher) = fetcher();
        assert!(fetcher.validate_wasm(CORE_MODULE).is_ok());
    }

    #[test]
    fn test_validate_wasm_component() {
        let (_dir, fetcher) = fetcher();
        assert!(fetcher.validate_wasm(COMPONENT).is_ok());
    }

    #[test]
    fn test_validate_wasm_unknown_version_rejected() {
        let (_dir, fetcher) = fetcher();
        // Version 2 is neither a core module nor a known component encoding.
        let unknown = b"\0asm\x02\x00\x00\x00";
        assert!(fetcher.validate_wasm(unknown).is_err());
    }

    #[test]
    fn test_validate_wasm_invalid_magic() {
        let (_dir, fetcher) = fetcher();
        let invalid_wasm = b"notw\x01\x00\x00\x00";
        assert!(fetcher.validate_wasm(invalid_wasm).is_err());
    }

    #[test]
    fn test_validate_wasm_too_small() {
        let (_dir, fetcher) = fetcher();
        let too_small = b"\0as";
        assert!(fetcher.validate_wasm(too_small).is_err());
    }

    #[test]
    fn test_build_reference_tag_uses_colon() {
        let reference = OciExtensionFetcher::build_reference(
            "ghcr.io",
            "comtrya/ext",
            &OciReference::Tag("v1.0.0".to_string()),
        );
        assert_eq!(reference.tag(), Some("v1.0.0"));
        assert_eq!(reference.digest(), None);
        assert!(reference.whole().ends_with(":v1.0.0"));
    }

    #[test]
    fn test_build_reference_digest_uses_at() {
        let digest = format!("sha256:{}", "a".repeat(64));
        let reference = OciExtensionFetcher::build_reference(
            "ghcr.io",
            "comtrya/ext",
            &OciReference::Digest(digest.clone()),
        );
        assert_eq!(reference.digest(), Some(digest.as_str()));
        assert_eq!(reference.tag(), None);
        assert!(reference.whole().contains(&format!("@{digest}")));
    }

    #[test]
    fn select_wasm_descriptor_picks_the_one_wasm_layer() {
        let wasm_digest = format!("sha256:{}", "a".repeat(64));
        let manifest = OciImageManifest {
            layers: vec![OciDescriptor {
                media_type: WASM_LAYER_MEDIA_TYPE.to_string(),
                digest: wasm_digest.clone(),
                size: 1024,
                ..OciDescriptor::default()
            }],
            ..OciImageManifest::default()
        };
        let descriptor =
            OciExtensionFetcher::select_wasm_descriptor(&manifest, "ghcr.io/x:v1").unwrap();
        assert_eq!(descriptor.digest, wasm_digest);
    }

    #[test]
    fn select_wasm_descriptor_rejects_missing_wasm_layer() {
        let manifest = OciImageManifest::default();
        let result = OciExtensionFetcher::select_wasm_descriptor(&manifest, "ghcr.io/x:v1");
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("no layer with media type")
        );
    }

    #[test]
    fn select_wasm_descriptor_rejects_multiple_wasm_layers() {
        let descriptor = || OciDescriptor {
            media_type: WASM_LAYER_MEDIA_TYPE.to_string(),
            digest: format!("sha256:{}", "a".repeat(64)),
            ..OciDescriptor::default()
        };
        let manifest = OciImageManifest {
            layers: vec![descriptor(), descriptor()],
            ..OciImageManifest::default()
        };
        let result = OciExtensionFetcher::select_wasm_descriptor(&manifest, "ghcr.io/x:v1");
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("expected exactly one")
        );
    }

    #[tokio::test]
    async fn test_offline_mode_with_cache() {
        let temp_dir = TempDir::new().unwrap();
        let cache_dir = temp_dir.path().join("cache");

        // Create fetcher and pre-populate cache
        let fetcher = OciExtensionFetcher::new(
            cache_dir.clone(),
            false, // Start in online mode
            true,
        )
        .unwrap();

        let cache_key = ExtensionCache::compute_cache_key("ghcr.io", "test/extension", "v1.0.0");

        let wasm_data = CORE_MODULE;
        let metadata = CacheMetadata {
            registry: "ghcr.io".to_string(),
            image: "test/extension".to_string(),
            reference: "v1.0.0".to_string(),
            content_digest: Some("sha256:test789".to_string()),
            fetched_at: SystemTime::now(),
            size_bytes: wasm_data.len() as u64,
            sha256: compute_sha256(wasm_data),
        };

        fetcher
            .cache()
            .store(&cache_key, wasm_data, metadata)
            .unwrap();

        // Now create offline fetcher
        let offline_fetcher = OciExtensionFetcher::new(
            cache_dir, true, // Offline mode
            true,
        )
        .unwrap();

        // Should succeed because extension is cached
        let result = offline_fetcher
            .fetch_extension(
                "ghcr.io",
                "test/extension",
                &OciReference::Tag("v1.0.0".to_string()),
                None,
            )
            .await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_offline_mode_without_cache() {
        let temp_dir = TempDir::new().unwrap();
        let fetcher = OciExtensionFetcher::new(
            temp_dir.path().join("cache"),
            true, // Offline mode
            true,
        )
        .unwrap();

        // Should fail because not cached and offline
        let result = fetcher
            .fetch_extension(
                "ghcr.io",
                "test/extension",
                &OciReference::Tag("v1.0.0".to_string()),
                None,
            )
            .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("offline mode"));
    }
}
