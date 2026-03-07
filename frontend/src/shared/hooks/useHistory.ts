"use client";

/**
 * useHistory — Translation history with localStorage persistence
 * ================================================================
 * Stores translation entries in localStorage with FIFO eviction at 100 entries.
 * Replaces hardcoded demo data across the app.
 */

import { useState, useCallback, useEffect } from "react";

export interface HistoryEntry {
  id: string;
  text: string;
  glossTokens: string[];
  type: "typed" | "voiced" | "api";
  date: string;       // e.g. "Today", "Yesterday", "Feb 23"
  time: string;       // e.g. "2:14 PM"
  timestamp: number;  // Date.now() for sorting
  exported?: boolean; // true once the user has exported this entry
}

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

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDay.getTime() === today.getTime()) return "Today";
  if (entryDay.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    setEntries(loadHistory());
    setHydrated(true);
  }, []);

  const addEntry = useCallback(
    (text: string, glossTokens: string[], type: "typed" | "voiced" | "api" = "typed") => {
      const now = new Date();
      const entry: HistoryEntry = {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        glossTokens,
        type,
        date: formatDate(now),
        time: formatTime(now),
        timestamp: Date.now(),
      };

      setEntries((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(next);
        return next;
      });

      return entry;
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    saveHistory([]);
  }, []);

  const markExported = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.map((e) => e.id === id ? { ...e, exported: true } : e);
      saveHistory(next);
      return next;
    });
  }, []);

  // Get recent entries (for translate page sidebar)
  const getRecent = useCallback(
    (count = 3) => entries.slice(0, count),
    [entries]
  );

  // Filter entries
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

  // Stats
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
    addEntry,
    deleteEntry,
    clearAll,
    markExported,
    getRecent,
    getFiltered,
    stats,
  };
}
