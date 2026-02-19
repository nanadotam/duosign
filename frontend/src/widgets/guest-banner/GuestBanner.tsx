"use client";

// Constants available: import { GUEST_TRANSLATION_LIMIT } from "@/shared/constants";

interface GuestBannerProps {
  remaining?: number;
}

export default function GuestBanner({ remaining = 3 }: GuestBannerProps) {
  return (
    <div className="hidden md:flex items-center justify-center gap-2 px-6 py-2 border-b transition-all duration-250"
      style={{
        background: "var(--banner-bg)",
        borderColor: "var(--banner-border)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent flex-shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="text-[12.5px] text-text-2">
        You have <b className="text-accent font-semibold">{remaining} translation{remaining !== 1 ? "s" : ""}</b> remaining as a guest —{" "}
        <a href="/auth/register" className="text-teal font-semibold underline underline-offset-2 cursor-pointer hover:brightness-110 transition-all">
          create a free account to continue →
        </a>
      </span>
    </div>
  );
}
