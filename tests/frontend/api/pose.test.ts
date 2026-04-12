/** @jest-environment node */

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

import { existsSync } from "fs";
import { readFile } from "fs/promises";

const mockedExistsSync = jest.mocked(existsSync);
const mockedReadFile = jest.mocked(readFile);

describe("/api/pose/[gloss]", () => {
  beforeEach(() => {
    mockedExistsSync.mockReset();
    mockedReadFile.mockReset();
  });

  it("serves a pose file from poses_v3 when present", async () => {
    mockedExistsSync.mockImplementation((filePath) => String(filePath).includes("poses_v3/HELLO.pose"));
    mockedReadFile.mockResolvedValue(Buffer.from("pose-data") as never);

    const { GET } = await import("@/app/api/pose/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose/HELLO") as never, {
      params: { gloss: "HELLO" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
    expect(response.headers.get("cache-control")).toBe("public, max-age=86400, immutable");
    expect(response.headers.get("content-disposition")).toContain('HELLO.pose');
  });

  it("falls back to poses when poses_v3 is absent", async () => {
    mockedExistsSync.mockImplementation((filePath) => String(filePath).includes("poses/HELLO.pose"));
    mockedReadFile.mockResolvedValue(Buffer.from("pose-data") as never);

    const { GET } = await import("@/app/api/pose/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose/HELLO") as never, {
      params: { gloss: "HELLO" },
    });

    expect(response.status).toBe(200);
  });

  it("returns 404 when no candidate pose file exists", async () => {
    mockedExistsSync.mockReturnValue(false);

    const { GET } = await import("@/app/api/pose/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose/MISSING") as never, {
      params: { gloss: "MISSING" },
    });

    expect(response.status).toBe(404);
  });

  it("rejects plain path traversal input", async () => {
    const { GET } = await import("@/app/api/pose/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose/../../etc/passwd") as never, {
      params: { gloss: "../../../../etc/passwd" },
    });

    expect([400, 404]).toContain(response.status);
    expect(mockedReadFile).not.toHaveBeenCalled();
  });

  it("rejects encoded path traversal input", async () => {
    const { GET } = await import("@/app/api/pose/[gloss]/route");
    const response = await GET(new Request("http://localhost/api/pose/..%2F..%2Fetc%2Fpasswd") as never, {
      params: { gloss: "..%2F..%2Fetc%2Fpasswd" },
    });

    expect([400, 404]).toContain(response.status);
    expect(mockedReadFile).not.toHaveBeenCalled();
  });
});
