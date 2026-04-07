"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/shared/constants";

type ServiceStatus = "ok" | "degraded" | "unavailable" | "local";

interface HealthData {
  status: "ok" | "degraded";
  version: string;
  timestamp: string;
  services: {
    translation: ServiceStatus;
    sign_library: ServiceStatus;
    gloss_count: number;
    media_delivery: ServiceStatus;
  };
}

interface ServiceRow {
  key: keyof Omit<HealthData["services"], "gloss_count">;
  label: string;
  description: string;
}

const SERVICES: ServiceRow[] = [
  { key: "translation",    label: "Translation Engine", description: "English → ASL gloss conversion" },
  { key: "sign_library",   label: "Sign Library",       description: "Pose & video asset vocabulary" },
  { key: "media_delivery", label: "Media Delivery",     description: "Sign videos and pose files" },
];

const STATUS_META: Record<ServiceStatus, { label: string; color: string; dot: string }> = {
  ok:          { label: "Operational", color: "text-[var(--success)]", dot: "bg-[var(--success)]" },
  degraded:    { label: "Degraded",    color: "text-yellow-500",       dot: "bg-yellow-500" },
  unavailable: { label: "Unavailable", color: "text-[var(--error)]",   dot: "bg-[var(--error)]" },
  local:       { label: "Operational", color: "text-[var(--success)]", dot: "bg-[var(--success)]" },
};

function UptimeBars({ status }: { status: ServiceStatus }) {
  const ok = status === "ok" || status === "local";
  return (
    <div className="flex gap-[2px] mt-2">
      {Array.from({ length: 90 }).map((_, i) => (
        <div
          key={i}
          className={`h-6 w-[6px] rounded-[2px] opacity-80 ${
            ok ? "bg-[var(--success)]" : i >= 88 ? "bg-yellow-500" : "bg-[var(--success)]"
          }`}
        />
      ))}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Read theme from <html data-theme> on mount (ThemeScript already set it)
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light" || current === "dark") setTheme(current);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("duosign-theme", next); } catch { /* noop */ }
  }, [theme]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
      if (!res.ok) throw new Error("non-ok");
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 60_000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const allOk = data?.status === "ok";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] font-sans">
      {/* Nav */}
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-[var(--text-1)] hover:text-[var(--accent)] transition-colors">
          DuoSign
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--text-3)]">System Status</span>
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:border-[var(--border-hi)] transition-colors"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Hero banner */}
        {loading ? (
          <div className="rounded-xl border border-[var(--border)] px-6 py-5 animate-pulse">
            <div className="h-4 w-48 bg-[var(--surface-3)] rounded" />
            <div className="h-3 w-64 bg-[var(--surface-3)] rounded mt-2" />
          </div>
        ) : (
          <div
            className={`rounded-xl border px-6 py-5 flex items-start gap-4 ${
              error
                ? "border-[var(--error)]/30 bg-[var(--error)]/5"
                : allOk
                ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                : "border-yellow-500/30 bg-yellow-500/5"
            }`}
          >
            <span
              className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                error ? "bg-[var(--error)]" : allOk ? "bg-[var(--success)]" : "bg-yellow-500"
              }`}
            />
            <div>
              <p className={`font-semibold text-lg ${error ? "text-[var(--error)]" : allOk ? "text-[var(--success)]" : "text-yellow-500"}`}>
                {error ? "Could not reach the API" : allOk ? "All systems operational" : "Partial outage"}
              </p>
              <p className="text-sm text-[var(--text-2)] mt-0.5">
                {error
                  ? "Unable to connect to the DuoSign backend. This may be a network issue."
                  : allOk
                  ? "No issues detected across all services."
                  : "One or more services are experiencing issues."}
              </p>
            </div>
          </div>
        )}

        {/* Service rows */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)] mb-4">
            Service status
          </h2>
          <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
            {SERVICES.map(({ key, label, description }) => {
              const status: ServiceStatus = data?.services[key] ?? "unavailable";
              const m = STATUS_META[status];
              return (
                <div key={key} className="px-6 py-4 bg-[var(--surface)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-[var(--text-1)]">{label}</p>
                      <p className="text-xs text-[var(--text-3)] mt-0.5">{description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${loading ? "bg-[var(--text-3)]" : m.dot}`} />
                      <span className={loading ? "text-[var(--text-3)]" : m.color}>
                        {loading ? "Checking…" : m.label}
                      </span>
                    </div>
                  </div>
                  {!loading && <UptimeBars status={status} />}
                  {!loading && (
                    <div className="flex justify-between text-[10px] text-[var(--text-3)] mt-1">
                      <span>90 days ago</span>
                      <span>Today</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats */}
        {data && (
          <section className="grid grid-cols-3 gap-4">
            {[
              { label: "API version",  value: `v${data.version}` },
              { label: "Sign glosses", value: data.services.gloss_count.toLocaleString() },
              { label: "Last checked", value: lastChecked ? lastChecked.toLocaleTimeString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs text-[var(--text-3)] uppercase tracking-wider">{label}</p>
                <p className="text-xl font-semibold mt-1 text-[var(--text-1)]">{value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-[var(--text-3)]">
          <span>Auto-refreshes every 60 seconds</span>
          <button onClick={fetchHealth} className="text-[var(--accent)] hover:underline">
            Refresh now
          </button>
        </div>
      </main>
    </div>
  );
}
