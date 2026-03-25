/**
 * Gloss Translation API
 * =====================
 * Communicates with the backend translate endpoints.
 * Supports SSE streaming for progressive rule-based → LLM updates.
 */

import { API_BASE_URL } from "@/shared/constants";

// ── Types ───────────────────────────────────────────────────────────

export interface TranslateApiResponse {
  input_text: string;
  gloss: string;
  gloss_internal: string;
  tokens: string[];
  method: "rule_based" | "llm" | "llm_quality";
  confidence: number;
}

export interface SSEEvent {
  event: "rule_based" | "llm_quality" | "done";
  data: TranslateApiResponse | Record<string, never>;
}

// ── SSE Stream ──────────────────────────────────────────────────────

/**
 * Call POST /api/translate/stream and yield SSE events as they arrive.
 *
 * EventSource doesn't support POST, so we use fetch + ReadableStream.
 */
export async function* translateStream(
  text: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${API_BASE_URL}/api/translate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Translate API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  // Eagerly cancel the reader the moment the signal fires so buffered SSE
  // bytes from a previous request don't slip through between reads.
  const onAbort = () => reader.cancel();
  signal?.addEventListener("abort", onAbort, { once: true });

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      // Check before every read — prevents processing buffered stale data
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const parts = buffer.split("\n\n");
      // Keep last (potentially incomplete) chunk in buffer
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        // Check between events too in case a chunk contains multiple events
        if (signal?.aborted) return;
        const event = parseSSE(part);
        if (event) yield event;
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }

  // Flush remaining buffer (only if not aborted)
  if (!signal?.aborted && buffer.trim()) {
    const event = parseSSE(buffer);
    if (event) yield event;
  }
}

function parseSSE(raw: string): SSEEvent | null {
  let eventType = "";
  let data = "";

  for (const line of raw.split("\n")) {
    if (line.startsWith("event: ")) {
      eventType = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      data = line.slice(6).trim();
    }
  }

  if (!eventType || !data) return null;

  try {
    return {
      event: eventType as SSEEvent["event"],
      data: JSON.parse(data),
    };
  } catch {
    return null;
  }
}

// ── Non-streaming fallback ──────────────────────────────────────────

export async function translateFast(
  text: string,
  signal?: AbortSignal
): Promise<TranslateApiResponse> {
  const res = await fetch(`${API_BASE_URL}/api/translate/fast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Translate API error: ${res.status}`);
  }

  return res.json();
}
