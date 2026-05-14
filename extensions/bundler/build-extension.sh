#!/usr/bin/env bash
# Comtrya extension bundler — Phase 5 entrypoint.
#
# Builds a single extension into its distributable artifact set:
#   * <ext_id>.wasm        — Component-Model WASM, built by cargo-component.
#   * <ext_id>.client.ts   — Typed TS client (frontend SDK include).
#   * manifest.json        — Identity + capability declaration (untouched).
#
# Usage: build-extension.sh <extension_root>
#   Expects: <extension_root>/Cargo.toml + wit/ + manifest.json
#   Writes:  <extension_root>/dist/{ext_id}.wasm,
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

# 1) Build the WASM component. Components live under
#    <extension_root>/component/ and are standalone cargo packages
#    (not workspace members — different target, different toolchain
#    features).
component_dir="$root/component"
if [[ -f "$component_dir/Cargo.toml" ]]; then
  # The .cargo/config.toml locks the build target to
  # wasm32-unknown-unknown. Without it cargo-component picks
  # wasm32-wasip1 by default, which drags wasi:* imports into the
  # component — nothing on the kernel side provides those.
  if [[ ! -f "$component_dir/.cargo/config.toml" ]]; then
    echo "FATAL: $component_dir/.cargo/config.toml missing." >&2
    echo "  Add: [build]\\n  target = \"wasm32-unknown-unknown\"" >&2
    echo "  Otherwise wasm32-wasip1 leaks WASI imports the kernel can't satisfy." >&2
    exit 1
  fi
  echo "==> cargo-component build $ext_id"
  if ! (cd "$component_dir" && cargo component build --release --quiet); then
    echo "cargo-component build failed for $ext_id" >&2
    exit 1
  fi
  found_wasm="$(find "$component_dir/target/wasm32-unknown-unknown/release" -maxdepth 1 -name '*.wasm' 2>/dev/null | head -n 1 || true)"
  if [[ -z "$found_wasm" ]]; then
    echo "no .wasm artifact found under $component_dir/target/ after build" >&2
    exit 1
  fi
  cp "$found_wasm" "$out_dir/$ext_id.wasm"
  echo "    wrote $out_dir/$ext_id.wasm"
else
  echo "no $component_dir/Cargo.toml — skipping WASM build for $ext_id"
fi

# 2) Generate handlers + client from the WIT.
#    The per-extension WIT depends on `comtrya:platform`. We make that
#    visible to wit-parser via the `deps/` convention — a symlink at
#    <wit_dir>/deps/platform pointing at the platform WIT package.
#    Created idempotently here so first-time builds work out of the box.
if [[ -d "$wit_dir" ]]; then
  mkdir -p "$wit_dir/deps"
  platform_wit="$repo_root/extensions/wit/comtrya/platform"
  if [[ ! -e "$wit_dir/deps/platform" ]]; then
    # Compute relative path from wit_dir/deps to platform_wit.
    rel_platform="$(python3 -c "import os.path; print(os.path.relpath('$platform_wit', '$wit_dir/deps'))" 2>/dev/null || echo "$platform_wit")"
    ln -s "$rel_platform" "$wit_dir/deps/platform"
  fi
  echo "==> wit-codegen $ext_id $wit_dir → $out_dir"
  (cd "$repo_root" && cargo run --quiet -p comtrya-wit-codegen -- \
    "$ext_id" "$wit_dir" "$out_dir")
fi

# 3) Build the UI bundle (if a package.json exists).
if [[ -f "$root/ui/package.json" ]]; then
  echo "==> ui build $ext_id"
  (cd "$root/ui" && bun run build) || {
    echo "ui build failed for $ext_id" >&2
    exit 1
  }

  ui_manifest="$root/ui/manifest.json"
  if [[ -f "$ui_manifest" ]]; then
    entry="$(jq -r '.assets.entry' "$ui_manifest")"
    expected_prefix="/_extensions/$ext_id/assets/"
    if [[ "$entry" == "$expected_prefix"* ]]; then
      entry_rel="${entry#"$expected_prefix"}"
      entry_path="$root/assets/$entry_rel"
      if [[ -f "$entry_path" ]]; then
        integrity="sha256-$(shasum -a 256 "$entry_path" | awk '{print $1}')"
        tmp_manifest="$(mktemp)"
        jq --arg integrity "$integrity" \
          '.assets.entryIntegrity = $integrity' \
          "$ui_manifest" > "$tmp_manifest"
        mv "$tmp_manifest" "$ui_manifest"
        echo "    updated $ui_manifest entryIntegrity"
      fi
    fi
  fi
fi

echo "==> built $ext_id in $out_dir"
