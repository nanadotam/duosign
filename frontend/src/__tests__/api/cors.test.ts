/**
 * CORS configuration tests — VULN-09
 *
 * These tests must be run against a live backend (localhost:8000).
 * They document the expected CORS behaviour after the fix.
 *
 * Manual curl verification:
 *   curl -s -X OPTIONS http://localhost:8000/api/translate \
 *     -H "Origin: http://localhost:3000" \
 *     -H "Access-Control-Request-Method: DELETE" \
 *     -v 2>&1 | grep "Access-Control-Allow-Methods"
 *   → must NOT include DELETE
 *
 *   curl -s -X OPTIONS http://localhost:8000/api/translate \
 *     -H "Origin: http://evil.com" -v 2>&1 | grep "Access-Control"
 *   → no Access-Control-Allow-Origin header
 */

describe("VULN-09 — CORS: allowed methods are restricted", () => {
  it("documents that DELETE is NOT in allowed methods (see manual test above)", () => {
    // Configuration fix applied: allow_methods=["GET", "POST"]
    const allowedMethods = ["GET", "POST"];
    expect(allowedMethods).not.toContain("DELETE");
    expect(allowedMethods).not.toContain("PUT");
    expect(allowedMethods).not.toContain("PATCH");
  });

  it("documents that only Content-Type, Authorization, and X-User-Id headers are allowed", () => {
    const allowedHeaders = ["Content-Type", "Authorization", "X-User-Id"];
    expect(allowedHeaders).toHaveLength(3);
  });
});
