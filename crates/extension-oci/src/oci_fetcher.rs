//! OCI registry client for fetching WASM extensions
//!
//! This module provides functionality to fetch WASM extensions from OCI-compliant
//! registries with authentication, caching, and content-digest verification.

use crate::cache::{CacheMetadata, ExtensionCache, compute_sha256};
use anyhow::{Context, Result};
use comtrya_core::extensions::OciReference;
use oci_distribution::Reference;
use oci_distribution::client::{Client, ClientConfig, ClientProtocol, ImageData};
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

        let image_data = self
            .client
            .pull(&oci_reference, &auth, vec![WASM_LAYER_MEDIA_TYPE])
            .await
            .with_context(|| format!("Failed to pull OCI image: {image_ref}"))?;

        // When the caller pinned a digest, the manifest digest the registry
        // resolved must match it exactly. This anchors trust to the requested
        // immutable hash rather than to whatever a tag currently points at.
        if let OciReference::Digest(requested) = reference {
            let resolved = image_data.digest.as_deref().with_context(|| {
                format!("Registry did not return a manifest digest for {image_ref}")
            })?;
            if resolved != requested.as_str() {
                anyhow::bail!(
                    "Digest mismatch for {image_ref}: requested {requested}, registry resolved {resolved}"
                );
            }
        }

        let (wasm, content_digest) = Self::select_verified_layer(&image_data, &image_ref)?;

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

    /// Select the single WASM layer by media type and verify its bytes against
    /// the manifest layer descriptor digest.
    ///
    /// The registry controls layer ordering and `pull` collects layers
    /// concurrently, so layers are matched to descriptors by their content
    /// digest rather than by index. The chosen layer's recomputed sha256 must
    /// equal a manifest descriptor digest of the WASM media type; otherwise the
    /// bytes do not match what the manifest advertised and are rejected.
    fn select_verified_layer(image_data: &ImageData, image_ref: &str) -> Result<(Vec<u8>, String)> {
        let manifest = image_data
            .manifest
            .as_ref()
            .with_context(|| format!("OCI image has no manifest: {image_ref}"))?;

        // Digests of layer descriptors that carry the expected WASM media type.
        let wasm_descriptor_digests: Vec<&str> = manifest
            .layers
            .iter()
            .filter(|descriptor| descriptor.media_type == WASM_LAYER_MEDIA_TYPE)
            .map(|descriptor| descriptor.digest.as_str())
            .collect();

        if wasm_descriptor_digests.is_empty() {
            anyhow::bail!(
                "OCI image {image_ref} has no layer with media type {WASM_LAYER_MEDIA_TYPE}"
            );
        }
        if wasm_descriptor_digests.len() > 1 {
            anyhow::bail!(
                "OCI image {image_ref} has {} WASM layers; expected exactly one",
                wasm_descriptor_digests.len()
            );
        }
        let expected_digest = wasm_descriptor_digests[0];

        // Find the downloaded layer whose bytes hash to the expected descriptor
        // digest. This is the integrity check: it proves the bytes match the
        // manifest, defending against a registry that streams tampered content.
        let wasm_layer = image_data
            .layers
            .iter()
            .find(|layer| {
                layer.media_type == WASM_LAYER_MEDIA_TYPE
                    && layer.sha256_digest() == expected_digest
            })
            .with_context(|| {
                format!(
                    "OCI image {image_ref} layer bytes do not match manifest descriptor digest {expected_digest}"
                )
            })?;

        Ok((wasm_layer.data.clone(), expected_digest.to_string()))
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
    use oci_distribution::client::{Config, ImageLayer};
    use oci_distribution::manifest::{OciDescriptor, OciImageManifest};
    use tempfile::TempDir;

    fn fetcher() -> (TempDir, OciExtensionFetcher) {
        let temp_dir = TempDir::new().unwrap();
        let fetcher =
            OciExtensionFetcher::new(temp_dir.path().join("cache"), false, true).unwrap();
        (temp_dir, fetcher)
    }

    /// Minimal valid WASM core module header.
    const CORE_MODULE: &[u8] = b"\0asm\x01\x00\x00\x00";
    /// Minimal valid WASM component header (version 0x0d, layer 0x01).
    const COMPONENT: &[u8] = b"\0asm\x0d\x00\x01\x00";

    fn image_with_wasm(bytes: &[u8], descriptor_digest: String) -> ImageData {
        let layer = ImageLayer::new(bytes.to_vec(), WASM_LAYER_MEDIA_TYPE.to_string(), None);
        let manifest = OciImageManifest {
            layers: vec![OciDescriptor {
                media_type: WASM_LAYER_MEDIA_TYPE.to_string(),
                digest: descriptor_digest,
                ..OciDescriptor::default()
            }],
            ..OciImageManifest::default()
        };
        ImageData {
            layers: vec![layer],
            digest: Some("sha256:manifestdigest".to_string()),
            config: Config::new(Vec::new(), String::new(), None),
            manifest: Some(manifest),
        }
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
    fn test_select_verified_layer_accepts_matching_digest() {
        let descriptor_digest = ImageLayer::new(
            CORE_MODULE.to_vec(),
            WASM_LAYER_MEDIA_TYPE.to_string(),
            None,
        )
        .sha256_digest();
        let image = image_with_wasm(CORE_MODULE, descriptor_digest.clone());

        let (bytes, digest) =
            OciExtensionFetcher::select_verified_layer(&image, "ghcr.io/x:v1").unwrap();
        assert_eq!(bytes, CORE_MODULE);
        assert_eq!(digest, descriptor_digest);
    }

    #[test]
    fn test_select_verified_layer_rejects_digest_mismatch() {
        // Manifest advertises a digest that does NOT match the layer bytes,
        // simulating a registry serving tampered content under a valid manifest.
        let bogus_digest = format!("sha256:{}", "b".repeat(64));
        let image = image_with_wasm(CORE_MODULE, bogus_digest);

        let result = OciExtensionFetcher::select_verified_layer(&image, "ghcr.io/x:v1");
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("do not match manifest descriptor digest")
        );
    }

    #[test]
    fn test_select_verified_layer_rejects_missing_wasm_layer() {
        let image = ImageData {
            layers: Vec::new(),
            digest: Some("sha256:manifestdigest".to_string()),
            config: Config::new(Vec::new(), String::new(), None),
            manifest: Some(OciImageManifest::default()),
        };
        let result = OciExtensionFetcher::select_verified_layer(&image, "ghcr.io/x:v1");
        assert!(result.is_err());
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
