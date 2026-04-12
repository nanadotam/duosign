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
  return new Request("http://localhost/api/translations", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/translations", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
    mockedGetRequestSession.mockReset();
  });

  it("GET returns translations for an authenticated user", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({
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

    const { GET } = await import("@/app/api/translations/route");
    const response = await GET(makeRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([
      expect.objectContaining({
        id: "tr_1",
        text: "hello",
        glossTokens: ["HELLO"],
      }),
    ]);
  });

  it("GET returns 401 without a session", async () => {
    mockedGetRequestSession.mockResolvedValue(null as never);

    const { GET } = await import("@/app/api/translations/route");
    const response = await GET(makeRequest("GET"));

    expect(response.status).toBe(401);
  });

  it("POST creates a translation for a valid session", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({
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

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { text: "hello", glossTokens: ["HELLO"], type: "typed" })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(expect.objectContaining({ text: "hello", glossTokens: ["HELLO"], type: "typed" }));
  });

  it("POST returns 401 without a session", async () => {
    mockedGetRequestSession.mockResolvedValue(null as never);

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { text: "hello", glossTokens: ["HELLO"], type: "typed" })
    );

    expect(response.status).toBe(401);
  });

  it("POST rejects missing text", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { glossTokens: ["HELLO"], type: "typed" })
    );

    expect(response.status).toBe(400);
  });

  it("POST rejects empty gloss tokens", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { text: "hello", glossTokens: [], type: "typed" })
    );

    expect(response.status).toBe(400);
  });

  it("POST rejects text longer than the maximum allowed length", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { text: "a".repeat(1001), glossTokens: ["HELLO"], type: "typed" })
    );

    expect(response.status).toBe(400);
  });

  it("POST accepts voiced type", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({
      rows: [
        {
          id: "tr_2",
          input_text: "hello",
          input_type: "voice",
          gloss_tokens: ["HELLO"],
          exported: false,
          created_at: "2026-04-06T12:00:00.000Z",
        },
      ],
    } as never);

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { text: "hello", glossTokens: ["HELLO"], type: "voiced" })
    );

    expect(response.status).toBe(201);
    expect(mockedQuery).toHaveBeenCalledWith(expect.any(String), [
      "user-1",
      "hello",
      "voice",
      JSON.stringify(["HELLO"]),
    ]);
  });

  it("POST defaults invalid type to typed", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({
      rows: [
        {
          id: "tr_3",
          input_text: "hello",
          input_type: "typed",
          gloss_tokens: ["HELLO"],
          exported: false,
          created_at: "2026-04-06T12:00:00.000Z",
        },
      ],
    } as never);

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { text: "hello", glossTokens: ["HELLO"], type: "invalid" })
    );

    expect(response.status).toBe(201);
    expect(mockedQuery).toHaveBeenCalledWith(expect.any(String), [
      "user-1",
      "hello",
      "typed",
      JSON.stringify(["HELLO"]),
    ]);
  });

  it("POST treats non-string text as empty and rejects it", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);

    const { POST } = await import("@/app/api/translations/route");
    const response = await POST(
      makeRequest("POST", { text: 123, glossTokens: ["HELLO"], type: "typed" })
    );

    expect(response.status).toBe(400);
  });

  it("DELETE removes translations for the current user", async () => {
    mockedGetRequestSession.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    const { DELETE } = await import("@/app/api/translations/route");
    const response = await DELETE(makeRequest("DELETE"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mockedQuery).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM translations"), ["user-1"]);
  });

  it("DELETE returns 401 without a session", async () => {
    mockedGetRequestSession.mockResolvedValue(null as never);

    const { DELETE } = await import("@/app/api/translations/route");
    const response = await DELETE(makeRequest("DELETE"));

    expect(response.status).toBe(401);
  });
});
