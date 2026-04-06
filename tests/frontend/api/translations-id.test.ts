/** @jest-environment node */

jest.mock("@/lib/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock("@/lib/server-session", () => ({
  getRequestSession: jest.fn(),
}));

import { pool } from "@/lib/db";
import { getRequestSession } from "@/lib/server-session";

const mockedQuery = jest.mocked(pool.query);
const mockedGetRequestSession = jest.mocked(getRequestSession);

function makeRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/translations/tr_1", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/translations/[id]", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
    mockedGetRequestSession.mockReset();
  });

  it("PATCH updates exported=true", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: "tr_1",
          input_text: "hello",
          input_type: "typed",
          gloss_tokens: ["HELLO"],
          exported: true,
          created_at: "2026-04-06T12:00:00.000Z",
        },
      ],
    } as never);

    const { PATCH } = await import("@/app/api/translations/[id]/route");
    const response = await PATCH(makeRequest("PATCH", { exported: true }), { params: { id: "tr_1" } });

    expect(response.status).toBe(200);
  });

  it("PATCH updates exported=false", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          id: "tr_1",
          input_text: "hello",
          input_type: "typed",
          gloss_tokens: ["HELLO"],
          exported: false,
          created_at: "2026-04-06T12:00:00.000Z",
        },
      ],
    } as never);

    const { PATCH } = await import("@/app/api/translations/[id]/route");
    const response = await PATCH(makeRequest("PATCH", { exported: false }), { params: { id: "tr_1" } });

    expect(response.status).toBe(200);
  });

  it("PATCH rejects non-boolean exported", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    const { PATCH } = await import("@/app/api/translations/[id]/route");
    const response = await PATCH(makeRequest("PATCH", { exported: "yes" }), { params: { id: "tr_1" } });

    expect(response.status).toBe(400);
  });

  it("PATCH returns 404 when no row matches the current user", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({ rowCount: 0, rows: [] } as never);

    const { PATCH } = await import("@/app/api/translations/[id]/route");
    const response = await PATCH(makeRequest("PATCH", { exported: true }), { params: { id: "tr_1" } });

    expect(response.status).toBe(404);
  });

  it("PATCH returns 401 without a session", async () => {
    mockedGetRequestSession.mockResolvedValue(null as never);

    const { PATCH } = await import("@/app/api/translations/[id]/route");
    const response = await PATCH(makeRequest("PATCH", { exported: true }), { params: { id: "tr_1" } });

    expect(response.status).toBe(401);
  });

  it("DELETE enforces ownership with both id and user_id", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    const { DELETE } = await import("@/app/api/translations/[id]/route");
    const response = await DELETE(makeRequest("DELETE"), { params: { id: "tr_1" } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM translations WHERE id = $1 AND user_id = $2"),
      ["tr_1", "user-1"]
    );
  });

  it("DELETE returns 401 without a session", async () => {
    mockedGetRequestSession.mockResolvedValue(null as never);

    const { DELETE } = await import("@/app/api/translations/[id]/route");
    const response = await DELETE(makeRequest("DELETE"), { params: { id: "tr_1" } });

    expect(response.status).toBe(401);
  });
});
