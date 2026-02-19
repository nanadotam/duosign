/**
 * Gloss Translation API
 * =====================
 * Communicates with the backend translate endpoints.
 * Supports SSE streaming for progressive rule-based → LLM updates.
 */

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
  const res = await fetch("/api/translate/stream", {
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

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const parts = buffer.split("\n\n");
    // Keep last (potentially incomplete) chunk in buffer
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseSSE(part);
      if (event) yield event;
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
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
  const res = await fetch("/api/translate/fast", {
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
