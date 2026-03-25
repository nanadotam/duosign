"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import SegmentedControl from "@/shared/ui/SegmentedControl";
import Button from "@/shared/ui/Button";
import { useSession } from "@/lib/auth-client";

const NAV_ITEMS = [
  { label: "Translate", href: "/translate" },
  { label: "History", href: "/history" },
  { label: "Settings", href: "/settings" },
];

export default function NavigationBar() {
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const activeTab = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "Translate";

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
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden w-[34px] h-[34px] rounded-btn border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
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
