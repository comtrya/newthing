#!/usr/bin/env bash
# Comtrya extension bundler — Phase 5 entrypoint.
#
# Builds a single extension into its distributable artifact set:
#   * <ext_id>.wasm        — Component-Model WASM, built by cargo-component.
#   * <ext_id>.handlers.rs — Rust dispatch arms (kernel-side include).
#   * <ext_id>.client.ts   — Typed TS client (frontend SDK include).
#   * manifest.json        — Identity + capability declaration (untouched).
#
# Usage: build-extension.sh <extension_root>
#   Expects: <extension_root>/Cargo.toml + wit/ + manifest.json
#   Writes:  <extension_root>/dist/{ext_id}.wasm,
#            <extension_root>/dist/{ext_id}.handlers.rs,
#            <extension_root>/dist/{ext_id}.client.ts

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <extension_root>" >&2
  exit 1
fi

root="$1"
if [[ ! -d "$root" ]]; then
  echo "extension root '$root' does not exist" >&2
  exit 1
fi

manifest="$root/manifest.json"
if [[ ! -f "$manifest" ]]; then
  echo "missing $manifest" >&2
  exit 1
fi

ext_id="$(jq -r '.id' "$manifest")"
if [[ -z "$ext_id" || "$ext_id" == "null" ]]; then
  echo "manifest.id is missing in $manifest" >&2
  exit 1
fi

wit_dir="$root/wit"
out_dir="$root/dist"
mkdir -p "$out_dir"

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"

# 1) Build the WASM component (if Cargo.toml + cargo-component present).
if [[ -f "$root/Cargo.toml" ]]; then
  echo "==> cargo-component build $ext_id"
  (cd "$root" && cargo component build --release --quiet || {
    echo "cargo-component build failed for $ext_id (continuing without WASM)" >&2
  })
  found_wasm="$(find "$root/target" -maxdepth 4 -name '*.wasm' -path '*release*' 2>/dev/null | head -n 1 || true)"
  if [[ -n "$found_wasm" ]]; then
    cp "$found_wasm" "$out_dir/$ext_id.wasm"
    echo "    wrote $out_dir/$ext_id.wasm"
  fi
fi

# 2) Generate handlers + client from the WIT.
if [[ -d "$wit_dir" ]]; then
  echo "==> wit-codegen $ext_id $wit_dir → $out_dir"
  (cd "$repo_root" && cargo run --quiet -p comtrya-wit-codegen -- "$ext_id" "$wit_dir" "$out_dir")
fi

# 3) Build the UI bundle (if a package.json exists).
if [[ -f "$root/ui/package.json" ]]; then
  echo "==> ui build $ext_id"
  (cd "$root/ui" && bun install --silent && bun run build) || {
    echo "ui build failed for $ext_id (continuing)" >&2
  }
fi

echo "==> built $ext_id in $out_dir"
