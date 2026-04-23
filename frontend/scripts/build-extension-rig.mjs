/**
 * build-extension-rig.mjs
 * =======================
 * Bundles the VRM rigging module for use in the Chrome extension.
 *
 * Usage:
 *   node scripts/build-extension-rig.mjs
 *
 * Output:
 *   ../extension/lib/vendor/duosign-rig.module.js   (ESM, ~40 KB)
 *
 * Externals (loaded separately by the extension):
 *   - three              → ./vendor/three.module.js
 *   - @pixiv/three-vrm   → ./vendor/three-vrm.module.js
 *
 * Stubs:
 *   - ../ui/AvatarDebugOverlay → no-op export (React UI, not needed in extension)
 */

import * as esbuild from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const EXTENSION_VENDOR = resolve(__dirname, "../../extension/lib/vendor");

/** Plugin: stub out the React AvatarDebugOverlay */
const stubDebugOverlay = {
  name: "stub-debug-overlay",
  setup(build) {
    build.onResolve({ filter: /AvatarDebugOverlay/ }, (args) => ({
      path: args.path,
      namespace: "stub",
    }));
    build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: "export function syncAvatarDebugOverlay() {}",
      loader: "js",
    }));
  },
};

/**
 * Plugin: rewrite bare specifiers to relative paths in the output.
 *
 * Chrome extensions block inline <script type="importmap"> via CSP, so we
 * cannot use an import map to resolve "three" / "@pixiv/three-vrm".
 * Instead we mark these as external with a custom path — esbuild then emits
 * `import ... from "./three.module.js"` directly in the bundle, which the
 * browser resolves relative to the bundle file's location in lib/vendor/.
 */
const rewriteExternals = {
  name: "rewrite-externals",
  setup(build) {
    build.onResolve({ filter: /^three$/ }, () => ({
      path: "./three.module.js",
      external: true,
    }));
    build.onResolve({ filter: /^@pixiv\/three-vrm$/ }, () => ({
      path: "./three-vrm.module.js",
      external: true,
    }));
  },
};

const result = await esbuild.build({
  entryPoints: [resolve(ROOT, "src/features/animate-avatar/lib/index.extension.ts")],
  bundle: true,
  format: "esm",
  outfile: resolve(EXTENSION_VENDOR, "duosign-rig.module.js"),
  // No top-level `external` array — rewriteExternals plugin handles this
  plugins: [stubDebugOverlay, rewriteExternals],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  minify: false,     // keep readable for debugging; flip to true for prod
  sourcemap: false,
  target: ["chrome89"],
  logLevel: "info",
});

if (result.errors.length > 0) {
  process.exit(1);
}
