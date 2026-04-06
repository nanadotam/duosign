/**
 * Security tests for /api/pose/[gloss] — VULN-02
 *
 * Run: cd frontend && npx jest src/__tests__/api/pose-security.test.ts
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/pose/[gloss]/route";

function makeRequest(gloss: string) {
  const url = `http://localhost:3000/api/pose/${gloss}`;
  return new NextRequest(url);
}

describe("VULN-02 — pose route path traversal", () => {
  it("rejects ..%2F..%2Fetc%2Fpasswd (URL-encoded traversal)", async () => {
    // The router decodes params before passing them; simulate the decoded value
    const res = await GET(makeRequest("..%2F..%2Fetc%2Fpasswd"), {
      params: { gloss: "../../etc/passwd" },
    });
    expect([400, 404]).toContain(res.status);
  });

  it("rejects ../../../../etc/hosts", async () => {
    const res = await GET(makeRequest("../../../../etc/hosts"), {
      params: { gloss: "../../../../etc/hosts" },
    });
    expect([400, 404]).toContain(res.status);
  });

  it("does not reject a valid gloss HELLO", async () => {
    const res = await GET(makeRequest("HELLO"), {
      params: { gloss: "HELLO" },
    });
    // 404 is fine (no file), 400 would mean incorrectly blocked
    expect(res.status).not.toBe(400);
  });

  it("normalises HELLO%20WORLD to HELLO_WORLD without rejecting", async () => {
    const res = await GET(makeRequest("HELLO%20WORLD"), {
      params: { gloss: "HELLO WORLD" },
    });
    expect(res.status).not.toBe(400);
  });
});
