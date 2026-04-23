"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "duosign:tips-v1";

const TIPS = [
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Welcome to DuoSign",
    body: "Sign language translation, right in your browser. A 3D avatar signs your words in American Sign Language.",
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    title: "How to use",
    body: 'Type any sentence in English and press Translate — the avatar will sign it. Try "Hello, how are you?" to get started.',
  },
] as const;

export function WelcomeTips() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable — skip tips
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  }

  if (!visible) return null;

  return (
    <div className="hidden md:flex items-start gap-3 px-5 py-3 border-b transition-all duration-200"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      {TIPS.map((tip) => (
        <div
          key={tip.title}
          className="flex items-start gap-2.5 flex-1 px-3.5 py-2.5 rounded-[10px] border"
          style={{ background: "var(--surface)", borderColor: "var(--border-hi)" }}
        >
          <span className="mt-[1px] flex-shrink-0" style={{ color: "var(--accent)" }}>
            {tip.icon}
          </span>
          <div>
            <div className="text-[11.5px] font-semibold tracking-[0.01em]" style={{ color: "var(--text-1)" }}>
              {tip.title}
            </div>
            <div className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--text-2)" }}>
              {tip.body}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={dismiss}
        aria-label="Dismiss tips"
        className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-btn border flex items-center justify-center transition-all cursor-pointer"
        style={{
          background: "var(--surface-3)",
          borderColor: "var(--border)",
          color: "var(--text-3)",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
