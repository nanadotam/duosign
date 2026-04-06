/** @jest-environment node */

jest.mock("@/lib/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from "@/lib/db";

const mockedQuery = jest.mocked(pool.query);

function makeRequest(method: string, cookie?: string) {
  return new Request("http://localhost/api/guest-usage", {
    method,
    headers: cookie ? { cookie } : undefined,
  });
}

describe("/api/guest-usage", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it("GET first visit sets a hashed cookie and returns counters", async () => {
    mockedQuery.mockResolvedValue({ rows: [{ translation_count: 0 }] } as never);

    const { GET } = await import("@/app/api/guest-usage/route");
    const response = await GET(makeRequest("GET"));
    const body = await response.json();
    const cookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({ count: 0, remaining: 3, limit: 3 }));
    expect(cookie).toMatch(/duosign_guest_id=([0-9a-f]{64})/);
    expect(mockedQuery.mock.calls[0]?.[1]?.[0]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("GET returning visit does not set a new cookie", async () => {
    mockedQuery.mockResolvedValue({ rows: [{ translation_count: 1 }] } as never);
    const hashed = "a".repeat(64);

    const { GET } = await import("@/app/api/guest-usage/route");
    const response = await GET(makeRequest("GET", `duosign_guest_id=${hashed}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(mockedQuery.mock.calls[0]?.[1]?.[0]).toBe(hashed);
  });

  it("POST increments the count by one", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ translation_count: 1 }] } as never);

    const { POST } = await import("@/app/api/guest-usage/route");
    const response = await POST(makeRequest("POST"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({ count: 1, remaining: 2, limit: 3 }));
  });

  it("POST returns 403 when usage is already at the limit", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rowCount: 0, rows: [] } as never)
      .mockResolvedValueOnce({ rows: [{ translation_count: 3 }] } as never);

    const { POST } = await import("@/app/api/guest-usage/route");
    const response = await POST(makeRequest("POST", `duosign_guest_id=${"b".repeat(64)}`));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual(expect.objectContaining({ count: 3, remaining: 0, limit: 3 }));
  });

  it("POST uses the hashed cookie value as the DB key", async () => {
    const hashed = "c".repeat(64);
    mockedQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ translation_count: 1 }] } as never);

    const { POST } = await import("@/app/api/guest-usage/route");
    await POST(makeRequest("POST", `duosign_guest_id=${hashed}`));

    expect(mockedQuery.mock.calls[0]?.[1]?.[0]).toBe(hashed);
    expect(mockedQuery.mock.calls[1]?.[1]?.[0]).toBe(hashed);
  });
});
