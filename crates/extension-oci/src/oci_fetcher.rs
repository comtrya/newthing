//! OCI registry client for fetching WASM extensions
//!
//! This module provides functionality to fetch WASM extensions from OCI-compliant
//! registries with authentication, caching, and checksum verification.

use crate::cache::{CacheMetadata, ExtensionCache, compute_sha256};
use anyhow::{Context, Result};
use oci_distribution::Reference;
use oci_distribution::client::{Client, ClientConfig, ClientProtocol};
use oci_distribution::secrets::RegistryAuth;
use std::path::PathBuf;
use std::time::SystemTime;

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

    /// Fetch an extension from OCI registry or cache
    /// Returns the path to the cached WASM file
    pub async fn fetch_extension(
        &self,
        registry: &str,
        image: &str,
        reference: &str,
        auth: Option<&RegistryAuth>,
    ) -> Result<PathBuf> {
        let cache_key = ExtensionCache::compute_cache_key(registry, image, reference);

        // Check cache first
        if self.cache.is_cached(&cache_key) {
            tracing::info!("Cache hit for {}/{}:{}", registry, image, reference);

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
                reference
            );
        }

        // Fetch from registry with timeout and retry logic
        tracing::info!(
            "Fetching {}/{}:{} from OCI registry",
            registry,
            image,
            reference
        );
        let (wasm_data, content_digest) = self
            .fetch_with_retry(registry, image, reference, auth)
            .await?;

        // Validate WASM
        self.validate_wasm(&wasm_data)?;

        // Store in cache
        let metadata = CacheMetadata {
            registry: registry.to_string(),
            image: image.to_string(),
            reference: reference.to_string(),
            content_digest: Some(content_digest),
            fetched_at: SystemTime::now(),
            size_bytes: wasm_data.len() as u64,
            sha256: compute_sha256(&wasm_data),
        };

        self.cache.store(&cache_key, &wasm_data, metadata)?;

        Ok(self.cache.wasm_path(&cache_key))
    }

    /// Fetch with exponential backoff retry for transient failures
    async fn fetch_with_retry(
        &self,
        registry: &str,
        image: &str,
        reference: &str,
        auth: Option<&RegistryAuth>,
    ) -> Result<(Vec<u8>, String)> {
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
                    reference,
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
                        reference,
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
                        reference
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

    /// Pull WASM module from OCI registry
    /// Returns (wasm_data, content_digest)
    async fn pull_from_registry(
        &self,
        registry: &str,
        image: &str,
        reference_str: &str,
        auth: Option<&RegistryAuth>,
    ) -> Result<(Vec<u8>, String)> {
        // Build OCI reference
        let full_reference = format!("{}/{}:{}", registry, image, reference_str);
        let reference: Reference = full_reference
            .parse()
            .with_context(|| format!("Invalid OCI reference: {}", full_reference))?;

        // Pull image manifest and layers
        let auth = auth.cloned().unwrap_or(RegistryAuth::Anonymous);

        let image_data = self
            .client
            .pull(
                &reference,
                &auth,
                vec!["application/vnd.wasm.module.v1+wasm"],
            )
            .await
            .with_context(|| format!("Failed to pull OCI image: {}", full_reference))?;

        // Extract WASM data from layers
        // For WASM modules, we expect a single layer containing the .wasm file
        if image_data.layers.is_empty() {
            anyhow::bail!("OCI image has no layers: {}", full_reference);
        }

        // Get the first layer (WASM module)
        let wasm_layer = &image_data.layers[0];

        // Extract content digest from the manifest
        let content_digest = image_data
            .digest
            .as_ref()
            .map(|d| d.to_string())
            .unwrap_or_else(|| format!("sha256:{}", compute_sha256(&wasm_layer.data)));

        tracing::debug!(
            "Pulled {} bytes from {} (digest: {})",
            wasm_layer.data.len(),
            full_reference,
            content_digest
        );

        Ok((wasm_layer.data.clone(), content_digest))
    }

    /// Validate that data is a valid WASM module
    fn validate_wasm(&self, data: &[u8]) -> Result<()> {
        // Check WASM magic number: \0asm
        if data.len() < 4 {
            anyhow::bail!("Data too small to be a WASM module (< 4 bytes)");
        }

        if &data[0..4] != b"\0asm" {
            anyhow::bail!("Invalid WASM magic number");
        }

        // Check version (should be 1)
        if data.len() < 8 {
            anyhow::bail!("WASM module truncated (no version)");
        }

        let version = u32::from_le_bytes([data[4], data[5], data[6], data[7]]);
        if version != 1 {
            tracing::warn!("Unexpected WASM version: {}, expected 1", version);
        }

        tracing::debug!("WASM validation passed ({} bytes)", data.len());
        Ok(())
    }

    /// Get reference to the cache
    #[allow(dead_code)]
    pub fn cache(&self) -> &ExtensionCache {
        &self.cache
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_validate_wasm_valid() {
        let temp_dir = TempDir::new().unwrap();
        let fetcher = OciExtensionFetcher::new(temp_dir.path().join("cache"), false, true).unwrap();

        // Valid WASM module
        let valid_wasm = b"\0asm\x01\x00\x00\x00";
        assert!(fetcher.validate_wasm(valid_wasm).is_ok());
    }

    #[test]
    fn test_validate_wasm_invalid_magic() {
        let temp_dir = TempDir::new().unwrap();
        let fetcher = OciExtensionFetcher::new(temp_dir.path().join("cache"), false, true).unwrap();

        // Invalid magic number
        let invalid_wasm = b"notw\x01\x00\x00\x00";
        assert!(fetcher.validate_wasm(invalid_wasm).is_err());
    }

    #[test]
    fn test_validate_wasm_too_small() {
        let temp_dir = TempDir::new().unwrap();
        let fetcher = OciExtensionFetcher::new(temp_dir.path().join("cache"), false, true).unwrap();

        // Too small
        let too_small = b"\0as";
        assert!(fetcher.validate_wasm(too_small).is_err());
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

        let wasm_data = b"\0asm\x01\x00\x00\x00";
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
            .fetch_extension("ghcr.io", "test/extension", "v1.0.0", None)
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
            .fetch_extension("ghcr.io", "test/extension", "v1.0.0", None)
            .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("offline mode"));
    }
}
