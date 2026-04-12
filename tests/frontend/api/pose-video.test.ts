/** @jest-environment node */

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
}));

jest.mock("fs/promises", () => ({
  open: jest.fn(),
}));

import { existsSync, statSync } from "fs";
import { open } from "fs/promises";

const mockedExistsSync = jest.mocked(existsSync);
const mockedStatSync = jest.mocked(statSync);
const mockedOpen = jest.mocked(open);

describe("/api/pose-video/[gloss]", () => {
  beforeEach(() => {
    mockedExistsSync.mockReset();
    mockedStatSync.mockReset();
    mockedOpen.mockReset();
  });

  it("returns mp4 content for a known gloss", async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedStatSync.mockReturnValue({ size: 4 } as never);
    mockedOpen.mockResolvedValue({
      read: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as never);

    const { GET } = await import("@/app/api/pose-video/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose-video/HELLO") as never, {
      params: { gloss: "HELLO" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("video/mp4");
  });

  it("returns 404 for an unknown gloss", async () => {
    mockedExistsSync.mockReturnValue(false);

    const { GET } = await import("@/app/api/pose-video/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose-video/MISSING") as never, {
      params: { gloss: "MISSING" },
    });

    expect(response.status).toBe(404);
  });

  it("blocks traversal attempts from succeeding", async () => {
    mockedExistsSync.mockReturnValue(false);

    const { GET } = await import("@/app/api/pose-video/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose-video/../../etc/passwd") as never, {
      params: { gloss: "../../../../etc/passwd" },
    });

    expect([400, 404]).toContain(response.status);
  });
});
