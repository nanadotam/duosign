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

  const SUPABASE_STORAGE = "https://yqhuvnbgtrbjrfmykznk.supabase.co/storage/v1/object/public";

  window.DUOSIGN_CONFIG = {
    IS_DEV,
    API_BASE_URL: IS_DEV
      ? "http://localhost:8000"         // FastAPI dev server
      : "https://duosign.onrender.com", // FastAPI on Render (prod)
    WEB_APP_URL: IS_DEV
      ? "http://localhost:3000"
      : "https://duosign.vercel.app",
    // Supabase storage buckets — used directly by the extension for all asset fetches
    POSES_URL:   `${SUPABASE_STORAGE}/duosign-poses`,
    AVATARS_URL: `${SUPABASE_STORAGE}/duosign-avatars`,
    VIDEOS_URL:  `${SUPABASE_STORAGE}/duosign-videos`,
  };

  // Convenience aliases
  window.DUOSIGN_API_URL     = window.DUOSIGN_CONFIG.API_BASE_URL;
  window.DUOSIGN_AVATARS_URL = window.DUOSIGN_CONFIG.AVATARS_URL;
  window.DUOSIGN_VIDEOS_URL  = window.DUOSIGN_CONFIG.VIDEOS_URL;

  // Pose URL builder — dev routes through the local backend (which reads from
  // bucket/poses_v3/); prod fetches the file directly from Supabase storage.
  window.DUOSIGN_POSE_URL = IS_DEV
    ? (gloss) => `${window.DUOSIGN_CONFIG.API_BASE_URL}/api/pose/${encodeURIComponent(gloss)}`
    : (gloss) => `${window.DUOSIGN_CONFIG.POSES_URL}/${gloss}.pose`;
})();
