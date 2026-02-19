"use client";

import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  // Always default to dark on server; ThemeScript sets the actual data-theme before hydration
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync with actual DOM attribute set by ThemeScript
    const current = document.documentElement.getAttribute("data-theme");
    setIsDark(current !== "light");
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      localStorage.setItem("duosign-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle, mounted };
}
