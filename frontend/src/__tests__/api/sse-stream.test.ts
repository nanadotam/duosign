/**
 * SSE stream security tests — VULN-14
 *
 * Verifies the stream does not leak env vars, stack traces, or internal paths.
 * Run against the live backend: POST http://localhost:8000/api/translate/stream
 *
 * These are integration tests — skip in unit test runs.
 */

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

describe("VULN-14 — SSE stream does not leak sensitive data", () => {
  // Skip unless BACKEND_URL env is set (integration mode)
  const itIntegration = process.env.BACKEND_URL ? it : it.skip;

  itIntegration("stream response includes Cache-Control: no-cache header", async () => {
    const res = await fetch(`${BACKEND}/api/translate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello world" }),
    });
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });

  itIntegration("stream response includes X-Accel-Buffering: no header", async () => {
    const res = await fetch(`${BACKEND}/api/translate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello world" }),
    });
    expect(res.headers.get("x-accel-buffering")).toBe("no");
  });

  itIntegration("stream does not contain stack traces or env var values", async () => {
    const res = await fetch(`${BACKEND}/api/translate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "password=abc123" }),
    });
    const body = await res.text();
    // Must not contain Traceback or internal Python paths
    expect(body).not.toMatch(/Traceback/);
    expect(body).not.toMatch(/\/home\/|\/Users\//);
    // Must not echo env var values (check for a known env var pattern)
    expect(body).not.toMatch(/GROQ_API_KEY/);
  });
});
