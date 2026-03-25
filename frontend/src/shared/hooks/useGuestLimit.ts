"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { GUEST_TRANSLATION_LIMIT } from "@/shared/constants";

interface GuestUsageResponse {
  count: number;
  remaining: number;
  limit: number;
  message?: string;
}

export function useGuestLimit() {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const { data: session, isPending } = useSession();

  const isAuthenticated = Boolean(session?.user);

  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      setCount(0);
      setHydrated(true);
      return {
        count: 0,
        remaining: GUEST_TRANSLATION_LIMIT,
        limit: GUEST_TRANSLATION_LIMIT,
      };
    }

    const response = await fetch("/api/guest-usage", {
      method: "GET",
      cache: "no-store",
    });
    const data = (await response.json()) as GuestUsageResponse;
    setCount(data.count);
    setHydrated(true);
    return data;
  }, [isAuthenticated]);

  useEffect(() => {
    if (isPending) return;

    void refresh().catch(() => {
      setCount(0);
      setHydrated(true);
    });
  }, [isPending, refresh]);

  const consume = useCallback(async () => {
    if (isAuthenticated) {
      return {
        allowed: true,
        count: 0,
        remaining: GUEST_TRANSLATION_LIMIT,
        limit: GUEST_TRANSLATION_LIMIT,
      };
    }

    const response = await fetch("/api/guest-usage", {
      method: "POST",
    });
    const data = (await response.json()) as GuestUsageResponse;
    setCount(data.count);

    return {
      allowed: response.ok,
      ...data,
    };
  }, [isAuthenticated]);

  return {
    count,
    hydrated,
    isAuthenticated,
    remaining: Math.max(0, GUEST_TRANSLATION_LIMIT - count),
    hasReachedLimit: hydrated && count >= GUEST_TRANSLATION_LIMIT,
    refresh,
    consume,
  };
}
