/**
 * DuoSign Extension — Shared Config
 * ====================================
 * Single source of truth for runtime URLs.
 * Loaded first in every extension HTML page.
 *
 * Dev detection: unpacked extensions don't have an `update_url` in their
 * manifest, so we use that as the dev/prod signal — same logic as background.js.
 */

(function () {
  const IS_DEV = !("update_url" in chrome.runtime.getManifest());

  window.DUOSIGN_CONFIG = {
    IS_DEV,
    API_BASE_URL: IS_DEV
      ? "http://localhost:8000"         // FastAPI dev server
      : "https://duosign.onrender.com", // FastAPI on Render (prod)
    WEB_APP_URL: IS_DEV
      ? "http://localhost:3000"
      : "https://duosign.vercel.app",
  };

  // Convenience alias used by legacy lib files
  window.DUOSIGN_API_URL = window.DUOSIGN_CONFIG.API_BASE_URL;
})();
