/**
 * DuoSign API Client
 * ==================
 * Communicates with the DuoSign backend for gloss translation and pose fetching.
 */

const API_BASE_URL = "https://duosign.onrender.com";

/**
 * Translate English text to ASL gloss sequence.
 * Uses the fast (rule-based only) endpoint for low latency.
 * @param {string} text — English text to translate
 * @returns {Promise<{input_text: string, gloss: string, tokens: string[], method: string, confidence: number}>}
 */
async function translateText(text) {
  const res = await fetch(`${API_BASE_URL}/api/translate/fast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Translation API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch a binary .pose file for a single gloss.
 * @param {string} gloss — ASL gloss token (e.g. "HELLO")
 * @returns {Promise<ArrayBuffer|null>} — Raw binary pose data, or null if not found
 */
async function fetchPose(gloss) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/pose/${encodeURIComponent(gloss)}`,
    );
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Check if a pose file exists for a gloss.
 * @param {string} gloss
 * @returns {Promise<boolean>}
 */
async function checkPoseExists(gloss) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/pose/${encodeURIComponent(gloss)}`,
      { method: "HEAD" },
    );
    return res.ok;
  } catch {
    return false;
  }
}
