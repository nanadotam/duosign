"use client";

/**
 * useHistory — Translation history
 * ================================
 * Guests use localStorage. Authenticated users sync against the database API.
 */

import { useState, useCallback, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import {
  formatHistoryDate,
  formatHistoryTime,
  type HistoryEntry,
} from "@/shared/lib/history";

export type { HistoryEntry } from "@/shared/lib/history";

const STORAGE_KEY = "duosign:history";
const MAX_ENTRIES = 100;

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    console.warn("Failed to save history to localStorage");
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (isPending) return;

    let cancelled = false;

    const hydrate = async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          setEntries(loadHistory());
          setHydrated(true);
        }
        return;
      }

      try {
        const response = await fetch("/api/translations", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`);
        }

        const data = (await response.json()) as HistoryEntry[];
        if (!cancelled) {
          setEntries(data);
          setHydrated(true);
        }
      } catch {
        if (!cancelled) {
          setEntries([]);
          setHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPending]);

  const addEntry = useCallback(
    (text: string, glossTokens: string[], type: "typed" | "voiced" | "api" = "typed") => {
      const now = new Date();
      const entry: HistoryEntry = {
        id: isAuthenticated
          ? `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          : `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        glossTokens,
        type,
        date: formatHistoryDate(now),
        time: formatHistoryTime(now),
        timestamp: Date.now(),
      };

      if (!isAuthenticated) {
        setEntries((prev) => {
          const next = [entry, ...prev].slice(0, MAX_ENTRIES);
          saveHistory(next);
          return next;
        });
        return entry;
      }

      setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));

      if (type === "api") {
        return entry;
      }

      void fetch("/api/translations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, glossTokens, type }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to create translation: ${response.status}`);
          }
          const savedEntry = (await response.json()) as HistoryEntry;

          let shouldPersistExport = false;
          setEntries((prev) => prev.map((item) => {
            if (item.id !== entry.id) return item;
            shouldPersistExport = Boolean(item.exported);
            return shouldPersistExport
              ? { ...savedEntry, exported: true }
              : savedEntry;
          }));

          if (shouldPersistExport) {
            void fetch(`/api/translations/${savedEntry.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ exported: true }),
            }).catch(() => {});
          }
        })
        .catch(() => {
          setEntries((prev) => prev.filter((item) => item.id !== entry.id));
        });

      return entry;
    },
    [isAuthenticated]
  );

  const deleteEntry = useCallback((id: string) => {
    if (!isAuthenticated || id.startsWith("h-")) {
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        saveHistory(next);
        return next;
      });
      return;
    }

    if (id.startsWith("temp-")) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return;
    }

    setEntries((prev) => prev.filter((e) => e.id !== id));
    void fetch(`/api/translations/${id}`, { method: "DELETE" }).catch(() => {});
  }, [isAuthenticated]);

  const clearAll = useCallback(() => {
    setEntries([]);

    if (!isAuthenticated) {
      saveHistory([]);
      return;
    }

    void fetch("/api/translations", { method: "DELETE" }).catch(() => {});
  }, [isAuthenticated]);

  const markExported = useCallback((id: string) => {
    if (!isAuthenticated || id.startsWith("h-")) {
      setEntries((prev) => {
        const next = prev.map((e) => e.id === id ? { ...e, exported: true } : e);
        saveHistory(next);
        return next;
      });
      return;
    }

    if (id.startsWith("temp-")) {
      setEntries((prev) => prev.map((e) => e.id === id ? { ...e, exported: true } : e));
      return;
    }

    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, exported: true } : e));
    void fetch(`/api/translations/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ exported: true }),
    }).catch(() => {});
  }, [isAuthenticated]);

  const getRecent = useCallback(
    (count = 3) => entries.slice(0, count),
    [entries]
  );

  const getFiltered = useCallback(
    (filters?: {
      types?: Set<string>;
      search?: string;
      dateRange?: string;
    }) => {
      if (!filters) return entries;

      return entries.filter((e) => {
        if (filters.types && !filters.types.has(e.type)) return false;
        if (filters.search && !e.text.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.dateRange && filters.dateRange !== "All Time") {
          const now = new Date();
          const entryDate = new Date(e.timestamp);
          if (filters.dateRange === "Today" && e.date !== "Today") return false;
          if (filters.dateRange === "This Week") {
            const weekAgo = new Date(now.getTime() - 7 * 86400000);
            if (entryDate < weekAgo) return false;
          }
          if (filters.dateRange === "This Month") {
            const monthAgo = new Date(now.getTime() - 30 * 86400000);
            if (entryDate < monthAgo) return false;
          }
        }
        return true;
      });
    },
    [entries]
  );

  const stats = {
    total: entries.length,
    today: entries.filter((e) => e.date === "Today").length,
    totalSigns: entries.reduce((sum, e) => sum + e.glossTokens.length, 0),
    types: {
      typed: entries.filter((e) => e.type === "typed").length,
      voiced: entries.filter((e) => e.type === "voiced").length,
      api: entries.filter((e) => e.type === "api").length,
    },
  };

  return {
    entries,
    hydrated,
    isAuthenticated,
    addEntry,
    deleteEntry,
    clearAll,
    markExported,
    getRecent,
    getFiltered,
    stats,
  };
}
