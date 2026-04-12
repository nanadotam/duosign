/**
 * Security tests for /api/guest-usage — VULN-11
 *
 * Run: cd frontend && npx jest src/__tests__/api/guest-security.test.ts
 */

jest.mock("@/lib/db", () => ({
  pool: { query: jest.fn() },
}));
jest.mock("@/shared/constants", () => ({ GUEST_TRANSLATION_LIMIT: 3 }));

import { GET } from "@/app/api/guest-usage/route";
import { pool } from "@/lib/db";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
const SHA256_REGEX = /^[0-9a-f]{64}$/;

describe("VULN-11 — guest cookie stores hash, not raw UUID", () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ translation_count: 0 }] });
  });

  it("sets a 64-char hex (SHA-256) cookie, NOT a UUID", async () => {
    const req = new Request("http://localhost:3000/api/guest-usage");
    const res = await GET(req);

    const setCookie = res.headers.get("set-cookie") ?? "";
    const match = setCookie.match(/duosign_guest_id=([^;]+)/);
    expect(match).not.toBeNull();

    const cookieValue = decodeURIComponent(match![1]);
    expect(cookieValue).toMatch(SHA256_REGEX);
    expect(cookieValue).not.toMatch(UUID_REGEX);
  });

  it("returns the same hash on subsequent requests with the hash cookie", async () => {
    // Simulate a returning visitor sending the hash as their cookie
    const hash = "a".repeat(64);
    const req = new Request("http://localhost:3000/api/guest-usage", {
      headers: { cookie: `duosign_guest_id=${hash}` },
    });
    const res = await GET(req);
    // No set-cookie should be present (isNew = false)
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
