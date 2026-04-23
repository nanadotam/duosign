#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# DuoSign Extension — Vendor Dependency Downloader
# ──────────────────────────────────────────────────────────────────────────────
# Downloads Three.js, @pixiv/three-vrm, and Kalidokit as local ES module files.
# Must be run once before loading the extension in Chrome.
#
# Usage:
#   cd extension/scripts
#   bash download-vendors.sh
#
# Output: extension/lib/vendor/*.js (committed to repo)
# ──────────────────────────────────────────────────────────────────────────────

set -e

VENDOR_DIR="$(cd "$(dirname "$0")/.." && pwd)/lib/vendor"
mkdir -p "$VENDOR_DIR"

echo "Downloading vendors to: $VENDOR_DIR"

# ── Three.js r137 (ES module build) ──────────────────────────────────────────
echo "  three.module.js ..."
curl -fsSL "https://cdn.jsdelivr.net/npm/three@0.137.4/build/three.module.js" \
  -o "$VENDOR_DIR/three.module.js"

# ── Three.js GLTFLoader (needed by VRM loader) ───────────────────────────────
echo "  GLTFLoader.js ..."
# Rewrite the internal Three.js import so it points to our local copy
curl -fsSL "https://cdn.jsdelivr.net/npm/three@0.137.4/examples/jsm/loaders/GLTFLoader.js" \
  | sed "s|'three'|'./three.module.js'|g; s|\"three\"|'./three.module.js'|g" \
  > "$VENDOR_DIR/GLTFLoader.js"

# ── @pixiv/three-vrm 0.6.11 (ES module build) ────────────────────────────────
echo "  three-vrm.module.js ..."
# Rewrite the Three.js peer-dep import so it uses our local copy
curl -fsSL "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@0.6.11/lib/three-vrm.module.js" \
  | sed "s|from 'three'|from './three.module.js'|g; s|from \"three\"|from './three.module.js'|g" \
  > "$VENDOR_DIR/three-vrm.module.js"

# ── Kalidokit 1.1.5 (ES module build via esm.sh bundled output) ──────────────
echo "  kalidokit.module.js ..."
# Kalidokit has no official ESM dist; use the pre-bundled output from esm.sh
curl -fsSL "https://esm.sh/kalidokit@1.1.5/es2022/kalidokit.bundle.mjs" \
  -o "$VENDOR_DIR/kalidokit.module.js"

echo ""
echo "Done. Vendor files written to lib/vendor/:"
ls -lh "$VENDOR_DIR"
echo ""
echo "Now reload the extension in chrome://extensions → DuoSign → refresh icon."
