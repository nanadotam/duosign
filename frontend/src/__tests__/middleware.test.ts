/**
 * Middleware tests — VULN-10
 *
 * Run: cd frontend && npx jest src/__tests__/middleware.test.ts
 */

import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

// Mock better-auth/cookies
jest.mock("better-auth/cookies", () => ({
  getSessionCookie: (req: NextRequest) => {
    return req.cookies.get("better-auth.session_token")?.value ?? null;
  },
}));

function makeRequest(pathname: string, withSession = false) {
  const req = new NextRequest(`http://localhost:3000${pathname}`);
  if (withSession) {
    req.cookies.set("better-auth.session_token", "fake-session-token");
  }
  return req;
}

describe("VULN-10 — middleware protects authenticated-only routes", () => {
  it("redirects unauthenticated user away from /history", () => {
    const res = middleware(makeRequest("/history", false));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toContain("/auth/login");
  });

  it("redirects unauthenticated user away from /settings", () => {
    const res = middleware(makeRequest("/settings", false));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toContain("/auth/login");
  });

  it("passes authenticated user through to /history", () => {
    const res = middleware(makeRequest("/history", true));
    // NextResponse.next() returns undefined or a pass-through with no redirect
    expect(res?.status ?? 200).toBe(200);
    expect(res?.headers.get("location")).toBeNull();
  });

  it("redirects authenticated user away from /auth/login", () => {
    const res = middleware(makeRequest("/auth/login", true));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toContain("/translate");
  });

  it("allows unauthenticated user to access /translate (guest access)", () => {
    const res = middleware(makeRequest("/translate", false));
    expect(res?.headers.get("location")).toBeNull();
  });
});
