import type { TestingEvent } from "./types";

interface BufferedEvent extends TestingEvent {
  session_id: string;
  participant_id: string;
  timestamp: string;
}

let buffer: BufferedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(flushBuffer, 5000);

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", flushBuffer);
  }
}

export function stopFlushTimer() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("beforeunload", flushBuffer);
  }
}

export async function flushBuffer() {
  if (buffer.length === 0) return;
  const batch = [...buffer];
  buffer = [];

  try {
    await fetch("/api/testing/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true, // survive page unload
    });
  } catch {
    // Re-queue failed events
    buffer.unshift(...batch);
  }
}

export function queueEvent(
  sessionId: string,
  participantId: string,
  eventName: string,
  metadata?: Record<string, unknown>
) {
  buffer.push({
    session_id: sessionId,
    participant_id: participantId,
    event_name: eventName as TestingEvent["event_name"],
    metadata,
    timestamp: new Date().toISOString(),
  });
  startFlushTimer();
}
