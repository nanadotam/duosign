import { act, renderHook, waitFor } from "@testing-library/react";

import { useSession } from "@/lib/auth-client";
import { useHistory } from "@/shared/hooks/useHistory";

jest.mock("@/lib/auth-client", () => ({
  useSession: jest.fn(),
}));

const mockedUseSession = jest.mocked(useSession);

describe("useHistory", () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as any);
    localStorage.clear();
    jest.useFakeTimers().setSystemTime(new Date("2026-04-06T12:00:00Z").getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("adds entries and exposes them through entries", async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.addEntry("hello", ["HELLO"]);
    });

    expect(result.current.entries[0]?.text).toBe("hello");
  });

  it("keeps only the latest 100 guest entries", async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      for (let index = 0; index < 101; index += 1) {
        result.current.addEntry(`text-${index}`, ["HELLO"]);
      }
    });

    expect(result.current.entries).toHaveLength(100);
    expect(result.current.entries.some((entry) => entry.text === "text-0")).toBe(false);
  });

  it("clears all guest history", async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.addEntry("hello", ["HELLO"]);
      result.current.clearAll();
    });

    expect(result.current.entries).toEqual([]);
  });

  it("persists history across hook remounts", async () => {
    const first = renderHook(() => useHistory());
    await waitFor(() => expect(first.result.current.hydrated).toBe(true));

    act(() => {
      first.result.current.addEntry("hello", ["HELLO"]);
    });
    first.unmount();

    const second = renderHook(() => useHistory());
    await waitFor(() => expect(second.result.current.hydrated).toBe(true));

    expect(second.result.current.entries[0]?.text).toBe("hello");
  });

  it("deletes the matching entry by id", async () => {
    const { result } = renderHook(() => useHistory());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let id = "";
    act(() => {
      id = result.current.addEntry("hello", ["HELLO"]).id;
      result.current.addEntry("world", ["WORLD"]);
    });

    act(() => {
      result.current.deleteEntry(id);
    });

    expect(result.current.entries.some((entry) => entry.id === id)).toBe(false);
  });

  it("falls back to an empty history when localStorage is corrupted", async () => {
    localStorage.setItem("duosign:history", "{bad-json");

    const { result } = renderHook(() => useHistory());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.entries).toEqual([]);
  });
});
