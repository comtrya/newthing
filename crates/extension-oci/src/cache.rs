//! Extension cache management
//!
//! This module handles caching of OCI-fetched extensions using content-addressable
//! storage with metadata tracking for provenance and validation.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

/// Metadata stored alongside cached extensions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMetadata {
    /// OCI registry hostname
    pub registry: String,

    /// Image path within registry
    pub image: String,

    /// Reference used (tag or digest)
    pub reference: String,

    /// Actual content digest from OCI manifest (immutable)
    /// This is the real digest even when using a tag reference
    pub content_digest: Option<String>,

    /// When the extension was fetched
    pub fetched_at: SystemTime,

    /// Size of the WASM module in bytes
    pub size_bytes: u64,

    /// SHA256 checksum of the WASM module
    pub sha256: String,
}

/// Extension cache manager
pub struct ExtensionCache {
    cache_dir: PathBuf,
}

impl ExtensionCache {
    /// Create a new cache manager
    pub fn new<P: Into<PathBuf>>(cache_dir: P) -> Result<Self> {
        let cache_dir = cache_dir.into();

        // Ensure cache directory exists
        if !cache_dir.exists() {
            std::fs::create_dir_all(&cache_dir).with_context(|| {
                format!("Failed to create cache directory: {}", cache_dir.display())
            })?;
        }

        Ok(Self { cache_dir })
    }

    /// Compute cache key for an extension
    pub fn compute_cache_key(registry: &str, image: &str, reference: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(registry.as_bytes());
        hasher.update(b":");
        hasher.update(image.as_bytes());
        hasher.update(b"@");
        hasher.update(reference.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Get the path for a cached WASM file
    pub fn wasm_path(&self, cache_key: &str) -> PathBuf {
        self.cache_dir.join(format!("{}.wasm", cache_key))
    }

    /// Get the path for cache metadata
    pub fn metadata_path(&self, cache_key: &str) -> PathBuf {
        self.cache_dir.join(format!("{}.metadata.json", cache_key))
    }

    /// Check if an extension is cached
    pub fn is_cached(&self, cache_key: &str) -> bool {
        let wasm_path = self.wasm_path(cache_key);
        let metadata_path = self.metadata_path(cache_key);
        wasm_path.exists() && metadata_path.exists()
    }

    /// Get cached extension WASM data
    pub fn get_wasm(&self, cache_key: &str) -> Result<Vec<u8>> {
        let wasm_path = self.wasm_path(cache_key);
        std::fs::read(&wasm_path)
            .with_context(|| format!("Failed to read cached WASM: {}", wasm_path.display()))
    }

    /// Get cached extension metadata
    pub fn get_metadata(&self, cache_key: &str) -> Result<CacheMetadata> {
        let metadata_path = self.metadata_path(cache_key);
        let content = std::fs::read_to_string(&metadata_path).with_context(|| {
            format!("Failed to read cache metadata: {}", metadata_path.display())
        })?;

        serde_json::from_str(&content).with_context(|| {
            format!(
                "Failed to parse cache metadata: {}",
                metadata_path.display()
            )
        })
    }

    /// Store extension in cache with metadata
    pub fn store(&self, cache_key: &str, wasm_data: &[u8], metadata: CacheMetadata) -> Result<()> {
        // Write WASM file
        let wasm_path = self.wasm_path(cache_key);
        std::fs::write(&wasm_path, wasm_data)
            .with_context(|| format!("Failed to write cached WASM: {}", wasm_path.display()))?;

        // Write metadata
        let metadata_path = self.metadata_path(cache_key);
        let metadata_json =
            serde_json::to_string_pretty(&metadata).context("Failed to serialize metadata")?;
        std::fs::write(&metadata_path, metadata_json).with_context(|| {
            format!(
                "Failed to write cache metadata: {}",
                metadata_path.display()
            )
        })?;

        tracing::debug!("Cached extension {} ({} bytes)", cache_key, wasm_data.len());

        Ok(())
    }

    /// Verify checksum of cached WASM module
    pub fn verify_checksum(&self, cache_key: &str) -> Result<bool> {
        let wasm_data = self.get_wasm(cache_key)?;
        let metadata = self.get_metadata(cache_key)?;

        let computed_hash = compute_sha256(&wasm_data);
        Ok(computed_hash == metadata.sha256)
    }

    /// List all cached extensions
    #[allow(dead_code)]
    pub fn list_cached(&self) -> Result<Vec<String>> {
        let mut cache_keys = Vec::new();

        if !self.cache_dir.exists() {
            return Ok(cache_keys);
        }

        for entry in std::fs::read_dir(&self.cache_dir)? {
            let entry = entry?;
            let path = entry.path();

            if let Some(ext) = path.extension()
                && ext == "wasm"
                && let Some(file_stem) = path.file_stem()
                && let Some(cache_key) = file_stem.to_str()
            {
                cache_keys.push(cache_key.to_string());
            }
        }

        Ok(cache_keys)
    }

    /// Get cache directory path
    #[allow(dead_code)]
    pub fn cache_dir(&self) -> &Path {
        &self.cache_dir
    }
}

/// Compute SHA256 hash of data
pub fn compute_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_compute_cache_key() {
        let key1 = ExtensionCache::compute_cache_key("ghcr.io", "forgepoint/ext1", "v1.0.0");
        let key2 = ExtensionCache::compute_cache_key("ghcr.io", "forgepoint/ext1", "v1.0.0");
        let key3 = ExtensionCache::compute_cache_key("ghcr.io", "forgepoint/ext1", "v2.0.0");

        // Same inputs produce same key
        assert_eq!(key1, key2);

        // Different reference produces different key
        assert_ne!(key1, key3);

        // Keys are 64 character hex strings (SHA256)
        assert_eq!(key1.len(), 64);
    }

    #[test]
    fn test_cache_creation() {
        let temp_dir = TempDir::new().unwrap();
        let cache = ExtensionCache::new(temp_dir.path().join("cache")).unwrap();

        assert!(cache.cache_dir().exists());
    }

    #[test]
    fn test_store_and_retrieve() {
        let temp_dir = TempDir::new().unwrap();
        let cache = ExtensionCache::new(temp_dir.path().join("cache")).unwrap();

        let cache_key = "test_key_123";
        let wasm_data = b"\0asm\x01\x00\x00\x00"; // Minimal WASM header
        let metadata = CacheMetadata {
            registry: "ghcr.io".to_string(),
            image: "test/extension".to_string(),
            reference: "v1.0.0".to_string(),
            content_digest: Some("sha256:abc123".to_string()),
            fetched_at: SystemTime::now(),
            size_bytes: wasm_data.len() as u64,
            sha256: compute_sha256(wasm_data),
        };

        // Store extension
        cache.store(cache_key, wasm_data, metadata.clone()).unwrap();

        // Verify it's cached
        assert!(cache.is_cached(cache_key));

        // Retrieve WASM
        let retrieved_wasm = cache.get_wasm(cache_key).unwrap();
        assert_eq!(retrieved_wasm, wasm_data);

        // Retrieve metadata
        let retrieved_metadata = cache.get_metadata(cache_key).unwrap();
        assert_eq!(retrieved_metadata.registry, metadata.registry);
        assert_eq!(retrieved_metadata.image, metadata.image);
        assert_eq!(retrieved_metadata.sha256, metadata.sha256);
    }

    #[test]
    fn test_verify_checksum() {
        let temp_dir = TempDir::new().unwrap();
        let cache = ExtensionCache::new(temp_dir.path().join("cache")).unwrap();

        let cache_key = "checksum_test";
        let wasm_data = b"\0asm\x01\x00\x00\x00";
        let metadata = CacheMetadata {
            registry: "ghcr.io".to_string(),
            image: "test/extension".to_string(),
            reference: "v1.0.0".to_string(),
            content_digest: Some("sha256:def456".to_string()),
            fetched_at: SystemTime::now(),
            size_bytes: wasm_data.len() as u64,
            sha256: compute_sha256(wasm_data),
        };

        cache.store(cache_key, wasm_data, metadata).unwrap();

        // Verify checksum matches
        assert!(cache.verify_checksum(cache_key).unwrap());
    }

    #[test]
    fn test_compute_sha256() {
        let data = b"hello world";
        let hash = compute_sha256(data);

        // SHA256 of "hello world"
        assert_eq!(
            hash,
            "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
        );
    }

    #[test]
    fn test_list_cached() {
        let temp_dir = TempDir::new().unwrap();
        let cache = ExtensionCache::new(temp_dir.path().join("cache")).unwrap();

        // Initially empty
        assert_eq!(cache.list_cached().unwrap().len(), 0);

        // Add some extensions
        let wasm_data = b"\0asm\x01\x00\x00\x00";
        let metadata = CacheMetadata {
            registry: "ghcr.io".to_string(),
            image: "test/ext".to_string(),
            reference: "v1.0.0".to_string(),
            content_digest: Some("sha256:test123".to_string()),
            fetched_at: SystemTime::now(),
            size_bytes: wasm_data.len() as u64,
            sha256: compute_sha256(wasm_data),
        };

        cache.store("key1", wasm_data, metadata.clone()).unwrap();
        cache.store("key2", wasm_data, metadata).unwrap();

        let cached = cache.list_cached().unwrap();
        assert_eq!(cached.len(), 2);
        assert!(cached.contains(&"key1".to_string()));
        assert!(cached.contains(&"key2".to_string()));
    }

    #[test]
    fn test_is_cached_false_for_missing() {
        let temp_dir = TempDir::new().unwrap();
        let cache = ExtensionCache::new(temp_dir.path().join("cache")).unwrap();

        assert!(!cache.is_cached("nonexistent"));
    }
}
