/**
 * DuoSign Extension — API Client
 * =================================
 * Communicates with the DuoSign backend API.
 * All calls are routed through the background.js service worker
 * to bypass CORS restrictions (extensions use chrome-extension:// origin).
 *
 * Supports:
 *  - /api/translate/fast     (instant, rule-based only)
 *  - /api/translate/stream   (SSE: rule-based then LLM upgrade)
 *  - /api/translate          (full pipeline)
 *  - /api/pose/{gloss}       (binary .pose data)
 *  - /api/video/{gloss}      (video for MediaPipe processing)
 *  - /api/vocabulary         (available glosses)
 *  - /api/health             (backend health check)
 */

const API_BASE_URL = "https://duosign.onrender.com";

// ── Translation ─────────────────────────────────────────────────────

/**
 * Translate text using the fast (rule-based only) endpoint.
 * @param {string} text
 * @returns {Promise<{input_text, gloss, tokens, method, confidence}>}
 */
async function translateText(text) {
  const res = await fetch(`${API_BASE_URL}/api/translate/fast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Translate error: ${res.status}`);
  return res.json();
}

/**
 * Translate text using the full pipeline (rule-based + LLM).
 * @param {string} text
 * @returns {Promise<{input_text, gloss, tokens, method, confidence}>}
 */
async function translateFull(text) {
  const res = await fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Translate error: ${res.status}`);
  return res.json();
}

/**
 * Translate text using SSE streaming (progressive: rule-based → LLM).
 * Yields SSE events as they arrive.
 * @param {string} text
 * @param {AbortSignal} [signal]
 * @yields {{ event: "rule_based"|"llm_quality"|"done", data: object }}
 */
async function* translateStream(text, signal) {
  const res = await fetch(`${API_BASE_URL}/api/translate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error(`Translate stream error: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (signal?.aborted) return;
        const event = parseSSE(part);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Flush remaining buffer
  if (!signal?.aborted && buffer.trim()) {
    const event = parseSSE(buffer);
    if (event) yield event;
  }
}

function parseSSE(raw) {
  let eventType = "";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event: ")) eventType = line.slice(7).trim();
    else if (line.startsWith("data: ")) data = line.slice(6).trim();
  }
  if (!eventType || !data) return null;
  try {
    return { event: eventType, data: JSON.parse(data) };
  } catch {
    return null;
  }
}

// ── Pose & Video Fetching ───────────────────────────────────────────

/**
 * Fetch binary .pose data for a gloss.
 * @param {string} gloss
 * @returns {Promise<ArrayBuffer|null>}
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
 * Check if a pose exists.
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

/**
 * Fetch video blob URL for a gloss (for video engine).
 * @param {string} gloss
 * @returns {Promise<string>} blob URL
 */
async function fetchVideoBlobUrl(gloss) {
  const res = await fetch(
    `${API_BASE_URL}/api/video/${encodeURIComponent(gloss)}`,
  );
  if (!res.ok) throw new Error(`Video error: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ── Vocabulary ──────────────────────────────────────────────────────

/**
 * Fetch the full vocabulary list.
 * @returns {Promise<{total, glosses, has_full_alphabet}>}
 */
async function fetchVocabulary() {
  const res = await fetch(`${API_BASE_URL}/api/vocabulary`);
  if (!res.ok) throw new Error(`Vocabulary error: ${res.status}`);
  return res.json();
}

// ── Health Check ────────────────────────────────────────────────────

/**
 * Check backend health.
 * @returns {Promise<{status, version, gloss_count}>}
 */
async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Health error: ${res.status}`);
  return res.json();
}

// ── Window globals ──────────────────────────────────────────────────

window.DuoSignAPI = {
  translateText,
  translateFull,
  translateStream,
  fetchPose,
  checkPoseExists,
  fetchVideoBlobUrl,
  fetchVocabulary,
  checkHealth,
  API_BASE_URL,
};
