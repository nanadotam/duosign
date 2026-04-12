/** @jest-environment node */

jest.mock("@/lib/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from "@/lib/db";

const mockedQuery = jest.mocked(pool.query);

function makeRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/testing/* routes", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("participants POST creates participant and session", async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ id: "participant-1" }] } as never)
      .mockResolvedValueOnce({ rows: [{ id: "session-1" }] } as never);

    const { POST } = await import("@/app/api/testing/participants/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/participants", "POST", {
        participant_code: "P001",
        participant_type: "guest",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ participant_id: "participant-1", session_id: "session-1" });
  });

  it("participants POST rejects missing required fields", async () => {
    const { POST } = await import("@/app/api/testing/participants/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/participants", "POST", {})
    );

    expect(response.status).toBe(400);
  });

  it("participants POST returns 500 on DB conflict", async () => {
    mockedQuery.mockRejectedValueOnce(new Error("duplicate"));

    const { POST } = await import("@/app/api/testing/participants/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/participants", "POST", {
        participant_code: "P001",
        participant_type: "guest",
      })
    );

    expect(response.status).toBe(500);
  });

  it("sessions PATCH accepts valid updates", async () => {
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    const { PATCH } = await import("@/app/api/testing/sessions/route");
    const response = await PATCH(
      makeRequest("http://localhost/api/testing/sessions", "PATCH", {
        session_id: "session-1",
        increment_translations: true,
      })
    );

    expect(response.status).toBe(200);
  });

  it("sessions PATCH rejects missing session_id", async () => {
    const { PATCH } = await import("@/app/api/testing/sessions/route");
    const response = await PATCH(
      makeRequest("http://localhost/api/testing/sessions", "PATCH", {})
    );

    expect(response.status).toBe(400);
  });

  it("events POST inserts a valid event batch", async () => {
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    const { POST } = await import("@/app/api/testing/events/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/events", "POST", {
        events: [
          {
            session_id: "session-1",
            participant_id: "participant-1",
            event_name: "translate_clicked",
            timestamp: "2026-04-06T12:00:00.000Z",
          },
        ],
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ inserted: 1 });
  });

  it("events POST rejects an empty body", async () => {
    const { POST } = await import("@/app/api/testing/events/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/events", "POST", { events: [] })
    );

    expect(response.status).toBe(400);
  });

  it("feedback POST accepts valid input", async () => {
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    const { POST } = await import("@/app/api/testing/feedback/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/feedback", "POST", {
        session_id: "session-1",
        participant_id: "participant-1",
      })
    );

    expect(response.status).toBe(200);
  });

  it("feedback POST rejects missing fields", async () => {
    const { POST } = await import("@/app/api/testing/feedback/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/feedback", "POST", {})
    );

    expect(response.status).toBe(400);
  });

  it("survey POST accepts a valid SUS body", async () => {
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    const { POST } = await import("@/app/api/testing/survey/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/survey", "POST", {
        session_id: "session-1",
        participant_id: "participant-1",
        sus_01: 5,
        sus_02: 1,
        sus_03: 5,
        sus_04: 1,
        sus_05: 5,
        sus_06: 1,
        sus_07: 5,
        sus_08: 1,
        sus_09: 5,
        sus_10: 1,
      })
    );

    expect(response.status).toBe(200);
  });

  it("survey POST rejects missing session identifiers", async () => {
    const { POST } = await import("@/app/api/testing/survey/route");
    const response = await POST(
      makeRequest("http://localhost/api/testing/survey", "POST", {})
    );

    expect(response.status).toBe(400);
  });
});
