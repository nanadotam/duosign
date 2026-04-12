import { act, renderHook, waitFor } from "@testing-library/react";

import { useSession } from "@/lib/auth-client";
import { useGuestLimit } from "@/shared/hooks/useGuestLimit";

jest.mock("@/lib/auth-client", () => ({
  useSession: jest.fn(),
}));

const mockedUseSession = jest.mocked(useSession);

describe("useGuestLimit", () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as any);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts below the limit for a fresh guest user", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 0, remaining: 3, limit: 3 }),
    });

    const { result } = renderHook(() => useGuestLimit());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.hasReachedLimit).toBe(false);
  });

  it("reports the limit as reached once the configured limit is hit", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 3, remaining: 0, limit: 3 }),
    });

    const { result } = renderHook(() => useGuestLimit());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.hasReachedLimit).toBe(true);
  });

  it("never reports the guest limit for an authenticated user", async () => {
    mockedUseSession.mockReturnValue({ data: { user: { id: "1" } }, isPending: false } as any);

    const { result } = renderHook(() => useGuestLimit());

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.hasReachedLimit).toBe(false);
  });

  it("updates count when consume is called", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, remaining: 3, limit: 3 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 1, remaining: 2, limit: 3 }),
      });

    const { result } = renderHook(() => useGuestLimit());

    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.consume();
    });

    expect(result.current.count).toBe(1);
  });
});
