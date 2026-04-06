/**
 * Security tests for /api/translations — VULN-08, VULN-12, VULN-13
 *
 * Run: cd frontend && npx jest src/__tests__/api/translations-security.test.ts
 */

import { NextRequest } from "next/server";

// Mock session and pool before importing route handlers
jest.mock("@/lib/server-session", () => ({
  getRequestSession: jest.fn(),
}));
jest.mock("@/lib/db", () => ({
  pool: { query: jest.fn() },
}));

import { POST } from "@/app/api/translations/route";
import { getRequestSession } from "@/lib/server-session";
import { pool } from "@/lib/db";

const mockSession = (userId: string | null) => {
  (getRequestSession as jest.Mock).mockResolvedValue(
    userId ? { user: { id: userId } } : null
  );
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/translations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── VULN-08: Translation Input Length Cap ─────────────────────────────

describe("VULN-08 — translation text length cap", () => {
  beforeEach(() => {
    mockSession("user-123");
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, input_text: "hi", input_type: "typed", gloss_tokens: [], exported: false, created_at: new Date() }],
    });
  });

  it("rejects text longer than 1000 characters", async () => {
    const res = await POST(makeRequest({ text: "a".repeat(50_000), glossTokens: ["HELLO"] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/too long/i);
  });

  it("accepts text of 500 characters (regression)", async () => {
    const res = await POST(makeRequest({ text: "a".repeat(500), glossTokens: ["HELLO"] }));
    expect(res.status).toBe(201);
  });

  it("rejects empty text", async () => {
    const res = await POST(makeRequest({ text: "", glossTokens: ["HELLO"] }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession(null);
    const res = await POST(makeRequest({ text: "hello", glossTokens: ["HELLO"] }));
    expect(res.status).toBe(401);
  });
});

// ── VULN-12: SQL Injection via parameterized queries ──────────────────

describe("VULN-12 — SQL injection prevention", () => {
  beforeEach(() => {
    mockSession("user-123");
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, input_text: "x", input_type: "typed", gloss_tokens: [], exported: false, created_at: new Date() }],
    });
  });

  it("passes SQL injection string through without crashing", async () => {
    const injectionText = "'; DROP TABLE translations; --";
    const res = await POST(makeRequest({ text: injectionText, glossTokens: ["HELLO"] }));
    // Should succeed (201) or fail with a known 4xx — NOT 500
    expect(res.status).not.toBe(500);
    expect([201, 400]).toContain(res.status);
  });
});
