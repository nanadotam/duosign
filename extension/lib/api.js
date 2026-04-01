/**
 * DuoSign Extension — API Client
 * =================================
 * Wrapped in an IIFE so internal consts don't collide with other
 * classic scripts loaded in the same page (e.g. pose-player.js also
 * declares API_BASE_URL in global scope).
 *
 * Exposes everything via window.DuoSignAPI.
 */

(function () {
  // URL set by lib/config.js (loaded first). Falls back to prod if missing.
  const API_BASE_URL = window.DUOSIGN_API_URL ?? "https://duosign.onrender.com";

  // ── Translation ───────────────────────────────────────────────────

  async function translateText(text) {
    const res = await fetch(`${API_BASE_URL}/api/translate/fast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Translate error: ${res.status}`);
    return res.json();
  }

  async function translateFull(text) {
    const res = await fetch(`${API_BASE_URL}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Translate error: ${res.status}`);
    return res.json();
  }

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

  // ── Pose & Video ──────────────────────────────────────────────────

  async function fetchPose(gloss) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/pose/${encodeURIComponent(gloss)}`
      );
      if (!res.ok) return null;
      return res.arrayBuffer();
    } catch {
      return null;
    }
  }

  async function checkPoseExists(gloss) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/pose/${encodeURIComponent(gloss)}`,
        { method: "HEAD" }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async function fetchVideoBlobUrl(gloss) {
    const res = await fetch(
      `${API_BASE_URL}/api/video/${encodeURIComponent(gloss)}`
    );
    if (!res.ok) throw new Error(`Video error: ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  // ── Vocabulary ────────────────────────────────────────────────────

  async function fetchVocabulary() {
    const res = await fetch(`${API_BASE_URL}/api/vocabulary`);
    if (!res.ok) throw new Error(`Vocabulary error: ${res.status}`);
    return res.json();
  }

  // ── Health ────────────────────────────────────────────────────────

  async function checkHealth() {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Health error: ${res.status}`);
    return res.json();
  }

  // ── Export ────────────────────────────────────────────────────────

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
})();
