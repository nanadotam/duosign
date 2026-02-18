"use client";

import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("duosign-theme");
    if (stored) {
      const dark = stored === "dark";
      setIsDark(dark);
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    }
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      localStorage.setItem("duosign-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle };
}
