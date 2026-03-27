"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import SegmentedControl from "@/shared/ui/SegmentedControl";
import Button from "@/shared/ui/Button";
import { useSession } from "@/lib/auth-client";
import { useTestingMode } from "@/features/testing-mode";

const NAV_ITEMS = [
  { label: "Translate", href: "/translate" },
  { label: "History", href: "/history" },
  { label: "Settings", href: "/settings" },
];

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = useSession();
  const {
    isTestingMode,
    session: testingSession,
    trackEvent,
    openSurvey,
    endSession,
  } = useTestingMode();
  const isAuthenticated = Boolean(session?.user);
  const isTranslateTestingPage =
    pathname === "/translate" && isTestingMode && Boolean(testingSession);

  const activeTab = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "Translate";
  const displayName = session?.user?.name?.trim() || "DuoSign Member";
  const email = session?.user?.email?.trim() || "";
  const initials = useMemo(() => {
    const source = displayName || email || "D";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [displayName, email]);
  const memberSince = useMemo(() => {
    const createdAt =
      session?.user && "createdAt" in session.user && typeof session.user.createdAt === "string"
        ? session.user.createdAt
        : null;
    const date = createdAt ? new Date(createdAt) : null;
    if (!date || Number.isNaN(date.getTime())) return "Member since recently";
    return `Member since ${date.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  }, [session?.user]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  const handleFeedbackSurveyClick = useCallback(() => {
    if (testingSession && !testingSession.surveyCompleted) {
      trackEvent("sus_survey_opened");
      openSurvey();
      return;
    }
    void endSession();
  }, [testingSession, trackEvent, openSurvey, endSession]);

  return (
    <>
      <nav className="h-[54px] flex items-center justify-between px-5 bg-[var(--nav-bg)] border-b border-border shadow-[0_1px_0_rgba(255,255,255,0.04),0_2px_10px_rgba(0,0,0,0.12)] sticky top-0 z-[100] backdrop-blur-[12px] transition-all duration-250 relative">
        {/* Logo */}
        <Link href="/translate" className="flex items-center gap-[6px] select-none no-underline">
          <Image src="/logos/DuoSign_logomark.svg" alt="DuoSign" width={24} height={24} className="logo-adaptive transition-all duration-250" />
          <Image src="/logos/DuoSign_textmark.svg" alt="DuoSign" width={80} height={18} className="logo-adaptive transition-all duration-250 hidden sm:block" />
        </Link>

        {/* Desktop nav tabs — absolutely centered */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <SegmentedControl
            options={NAV_ITEMS.map((i) => i.label)}
            value={activeTab}
            onChange={(val) => {
              const item = NAV_ITEMS.find((i) => i.label === val);
              if (item) window.location.href = item.href;
            }}
          />
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          {isTranslateTestingPage && (
            <button
              onClick={handleFeedbackSurveyClick}
              className="h-[34px] px-3 rounded-[999px] border border-border-hi bg-surface-2 text-text-2 flex items-center gap-2 cursor-pointer shadow-raised-sm transition-all duration-150 hover:text-text-1 hover:border-border-hi active:shadow-inset-press active:translate-y-px"
              title="Take feedback survey"
            >
              <span className="text-xs">🔬</span>
              <span className="text-[12px] font-medium">Take Feedback Survey</span>
            </button>
          )}
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-[34px] h-[34px] rounded-btn border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:border-border-hi active:shadow-inset-press active:translate-y-px"
            title="Toggle theme"
            suppressHydrationWarning
          >
            {/* Moon icon (dark mode) */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: isDark ? "block" : "none" }} suppressHydrationWarning>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            {/* Sun icon (light mode) */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: isDark ? "none" : "block" }} suppressHydrationWarning>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </button>
          {!isPending && isAuthenticated && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="h-[34px] pl-1.5 pr-2 rounded-[999px] border border-border-hi bg-surface-2 text-text-1 flex items-center gap-2 cursor-pointer shadow-raised-sm transition-all duration-150 hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border-hi))] hover:-translate-y-[1px] active:translate-y-0"
                title="Open profile"
                aria-haspopup="dialog"
                aria-expanded={profileOpen}
              >
                <span
                  className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold tracking-[0.08em] text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--accent) 88%, white 12%) 0%, color-mix(in srgb, var(--teal) 66%, var(--accent) 34%) 100%)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 10px color-mix(in srgb, var(--accent) 18%, transparent)",
                  }}
                >
                  {initials}
                </span>
                <span className="max-w-[92px] truncate text-[12px] font-semibold text-text-1">
                  {displayName}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-text-3 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-[304px] rounded-[22px] border border-border-hi bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] shadow-[0_22px_44px_rgba(0,0,0,0.22),0_1px_0_rgba(255,255,255,0.08)_inset] backdrop-blur-[20px] overflow-hidden animate-[toast-in_0.18s_ease]">
                  <div className="px-4 pt-4 pb-3 border-b border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_8%,var(--surface-2))_0%,color-mix(in_srgb,var(--teal)_4%,var(--surface))_100%)]">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[15px] font-bold tracking-[0.08em] text-white flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 86%, white 14%) 0%, color-mix(in srgb, var(--teal) 60%, var(--accent) 40%) 100%)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 24px color-mix(in srgb, var(--accent) 22%, transparent)",
                        }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold text-text-1 truncate">
                          {displayName}
                        </div>
                        <div className="text-[12px] text-text-2 truncate mt-0.5">
                          {email}
                        </div>
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center rounded-pill px-[10px] py-[4px] text-[10px] font-bold tracking-[0.08em] uppercase text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 86%, white 14%) 0%, color-mix(in srgb, var(--teal) 72%, var(--accent) 28%) 100%)",
                              boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 18px color-mix(in srgb, var(--accent) 16%, transparent)",
                            }}
                          >
                            #AccessForAll
                          </span>
                          <span className="text-[11px] text-text-3">
                            {memberSince}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-3">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/settings?section=profile");
                      }}
                      className="w-full flex items-center justify-between rounded-[16px] border border-border-hi bg-surface-2 px-3 py-3 text-left transition-all duration-150 hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border-hi))] hover:bg-surface-3"
                    >
                      <div>
                        <div className="text-[12px] font-semibold text-text-1">
                          Open Settings
                        </div>
                        <div className="text-[11px] text-text-3 mt-0.5">
                          Profile, preferences, avatar, and accessibility
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3 flex-shrink-0">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isPending && !isAuthenticated && (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="md">Log In</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="md">Sign Up Free</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {isTranslateTestingPage && (
            <button
              onClick={handleFeedbackSurveyClick}
              className="h-[34px] px-2.5 rounded-[999px] border border-border-hi bg-surface-2 text-text-2 flex items-center gap-1.5 cursor-pointer shadow-raised-sm transition-all duration-150"
              title="Take feedback survey"
            >
              <span className="text-xs">🔬</span>
              <span className="text-[11px] font-medium">Feedback Survey</span>
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-[34px] h-[34px] rounded-btn border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 w-[280px] h-full bg-surface border-l border-border shadow-raised flex flex-col p-5 gap-4 animate-[toast-in_0.2s_ease]">
            <div className="flex justify-between items-center mb-4">
              <Image src="/logos/DuoSign_logo.svg" alt="DuoSign" width={120} height={28} className="logo-adaptive" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-btn border border-border bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={[
                  "px-4 py-2.5 rounded-btn text-sm font-medium transition-all no-underline",
                  pathname.startsWith(item.href)
                    ? "bg-surface-2 border border-border-hi text-text-1 shadow-raised-sm"
                    : "text-text-2 hover:text-text-1 hover:bg-surface-2",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border" />
            <button
              onClick={() => { toggle(); setDrawerOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-btn text-sm text-text-2 hover:text-text-1 hover:bg-surface-2 transition-all cursor-pointer"
            >
              {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            {!isPending && !isAuthenticated && (
              <div className="mt-auto flex flex-col gap-2">
                <Link href="/auth/login" onClick={() => setDrawerOpen(false)}>
                  <Button variant="ghost" size="lg" className="w-full">Log In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setDrawerOpen(false)}>
                  <Button variant="primary" size="lg" className="w-full">Sign Up Free</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
