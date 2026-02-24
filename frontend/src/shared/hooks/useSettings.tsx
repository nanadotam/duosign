"use client";

/**
 * useSettings — Centralized app settings with localStorage persistence
 * =====================================================================
 * Provides typed settings that auto-persist to localStorage.
 * Used via SettingsProvider context so any component can read/write settings.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

// ── Settings Shape ──────────────────────────────────────────────────

export interface AppSettings {
  // Avatar
  skinTone: number;
  accentColorIndex: number;
  avatarStyle: "Realistic" | "Stylized" | "Minimal";
  avatarModelId: string;
  avatarBackground: "Transparent" | "Grid (Dark)" | "Grid (Light)" | "Gradient Blue";

  // Translation
  translationEngine: "Hybrid (Rule + LLM)" | "Rule-based only" | "LLM only";
  animationSpeed: number; // 50-200, divided by 100 for multiplier
  showGloss: boolean;
  autoPaste: boolean;
  loop: boolean;
  fingerspell: boolean;

  // Voice
  defaultMic: string;
  recognitionLanguage: string;
  noiseSuppression: boolean;
  autoSend: boolean;

  // Accessibility
  captionSize: "Small" | "Medium" | "Large" | "Extra Large";
  highContrast: boolean;
  reduceMotion: boolean;
  keyboardShortcuts: boolean;

  // Notifications
  glossUpdates: boolean;
  apiAlerts: boolean;
  productUpdates: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  skinTone: 0,
  accentColorIndex: 0,
  avatarStyle: "Stylized",
  avatarModelId: "ds-proto",
  avatarBackground: "Transparent",

  translationEngine: "Hybrid (Rule + LLM)",
  animationSpeed: 100,
  showGloss: true,
  autoPaste: true,
  loop: false,
  fingerspell: true,

  defaultMic: "System Default",
  recognitionLanguage: "English (US)",
  noiseSuppression: true,
  autoSend: false,

  captionSize: "Medium",
  highContrast: false,
  reduceMotion: false,
  keyboardShortcuts: true,

  glossUpdates: true,
  apiAlerts: true,
  productUpdates: false,
};

const STORAGE_KEY = "duosign:settings";

// ── Context ─────────────────────────────────────────────────────────

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isDirty: boolean;
  save: () => void;
  discard: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within <SettingsProvider>");
  }
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────

function loadFromStorage(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveToStorage(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn("Failed to save settings to localStorage");
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    setSettings(stored);
    setSavedSnapshot(stored);
    setHydrated(true);
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      setIsDirty(true);
      return next;
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      setIsDirty(true);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    saveToStorage(settings);
    setSavedSnapshot(settings);
    setIsDirty(false);
  }, [settings]);

  const discard = useCallback(() => {
    setSettings(savedSnapshot);
    setIsDirty(false);
  }, [savedSnapshot]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveToStorage(DEFAULT_SETTINGS);
    setSavedSnapshot(DEFAULT_SETTINGS);
    setIsDirty(false);
  }, []);

  // Don't render until hydrated to avoid flicker
  if (!hydrated) return null;

  return (
    <SettingsContext.Provider
      value={{ settings, updateSetting, updateSettings, resetSettings, isDirty, save, discard }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
