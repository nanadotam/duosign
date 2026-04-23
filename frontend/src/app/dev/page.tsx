"use client";

/**
 * /dev — DuoSign Developer Console
 * ===================================
 * Live view of all system connections:
 *   - Auth session state (Better Auth)
 *   - Backend health (FastAPI)
 *   - SSE stream tester
 *   - Next.js API proxy status
 *   - Extension connection status
 *   - API endpoint reference
 *
 * Only accessible in development unless NEXT_PUBLIC_DEV_PANEL=true
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────

interface HealthData {
  status: string;
  version: string;
  gloss_count: number;
}

type CheckStatus = "idle" | "checking" | "ok" | "error";

interface CheckState {
  status: CheckStatus;
  data?: unknown;
  error?: string;
  latency?: number;
}

interface SSEEvent {
  event: string;
  data: unknown;
  ts: number;
}

// ── Sub-components ─────────────────────────────────────────────────────

function StatusDot({ status }: { status: CheckStatus }) {
  const colors: Record<CheckStatus, string> = {
    idle: "bg-text-3",
    checking: "bg-yellow-400 animate-pulse",
    ok: "bg-green-400",
    error: "bg-red-400",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status]}`} />
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-panel p-5 ${className}`}>
      <h2 className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function JsonView({ data }: { data: unknown }) {
  return (
    <pre className="text-xs bg-base border border-border rounded p-3 overflow-auto max-h-48 text-text-2 leading-relaxed">
      {JSON.stringify(data, null, 2) as string}
    </pre>
  );
}

function CheckButton({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-3 py-1.5 text-xs font-medium rounded-btn border border-border bg-surface-2 text-text-2 hover:text-text-1 hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Checking…" : children}
    </button>
  );
}

// ── Sections ───────────────────────────────────────────────────────────

function AuthSection() {
  const { data: session, isPending } = useSession();

  return (
    <Card title="Auth — Better Auth Session">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={isPending ? "checking" : session ? "ok" : "idle"} />
          <span className="text-sm font-medium text-text-1">
            {isPending ? "Loading…" : session ? `Signed in` : "Not signed in"}
          </span>
        </div>
        {session && (
          <Link
            href="/api/auth/extension-session"
            target="_blank"
            className="text-xs text-accent hover:underline"
          >
            View token →
          </Link>
        )}
      </div>

      {session ? (
        <JsonView
          data={{
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
            sessionExpires: session.session.expiresAt,
          }}
        />
      ) : (
        <div className="text-xs text-text-3 space-y-1">
          <p>Sign in to test authenticated endpoints.</p>
          <div className="flex gap-2 mt-2">
            <Link
              href="/auth/sign-in"
              className="text-accent hover:underline"
            >
              Sign in →
            </Link>
            <span className="text-text-3">·</span>
            <Link
              href={`/auth/sign-in?source=extension&ext_id=dev`}
              className="text-text-2 hover:underline"
            >
              Extension flow (mock) →
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

function BackendHealthSection() {
  const [state, setState] = useState<CheckState>({ status: "idle" });

  const check = useCallback(async () => {
    setState({ status: "checking" });
    const t0 = performance.now();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/health`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data: HealthData = await res.json();
      setState({ status: res.ok ? "ok" : "error", data, latency: performance.now() - t0 });
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err.message : "unreachable", latency: performance.now() - t0 });
    }
  }, []);

  return (
    <Card title="Backend — FastAPI Health">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={state.status} />
          <span className="text-sm font-medium text-text-1">
            {state.status === "idle" && "Not checked"}
            {state.status === "checking" && "Checking…"}
            {state.status === "ok" && `Online · ${state.latency?.toFixed(0)}ms`}
            {state.status === "error" && `Offline · ${state.error ?? "error"}`}
          </span>
        </div>
        <CheckButton onClick={check} loading={state.status === "checking"}>
          Ping
        </CheckButton>
      </div>
      {Boolean(state.data) && <JsonView data={state.data} />}
    </Card>
  );
}

function NextjsProxySection() {
  const [states, setStates] = useState<Record<string, CheckState>>({});

  const checkEndpoint = useCallback(async (key: string, url: string, method: string, body?: unknown) => {
    setStates((s) => ({ ...s, [key]: { status: "checking" } }));
    const t0 = performance.now();
    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => ({ status: res.status }));
      setStates((s) => ({
        ...s,
        [key]: { status: res.ok ? "ok" : "error", data, latency: performance.now() - t0 },
      }));
    } catch (err) {
      setStates((s) => ({
        ...s,
        [key]: { status: "error", error: err instanceof Error ? err.message : "failed", latency: performance.now() - t0 },
      }));
    }
  }, []);

  type Endpoint = {
    key: string;
    label: string;
    method: string;
    url: string;
    body?: unknown;
  };

  const endpoints: Endpoint[] = [
    { key: "ext-session", label: "GET /api/auth/extension-session", method: "GET", url: "/api/auth/extension-session" },
    { key: "translate-fast", label: "POST /api/translate/fast", method: "POST", url: "/api/translate/fast", body: { text: "hello world" } },
    { key: "guest-usage", label: "GET /api/guest-usage", method: "GET", url: "/api/guest-usage" },
    { key: "translations", label: "GET /api/translations", method: "GET", url: "/api/translations" },
  ];

  return (
    <Card title="Next.js API Proxy — Endpoints">
      <div className="space-y-2">
        {endpoints.map(({ key, label, method, url, body }) => {
          const s = states[key] ?? { status: "idle" as CheckStatus };
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={s.status} />
                  <span className="text-xs font-mono text-text-2">{label}</span>
                  {s.latency !== undefined && (
                    <span className="text-xs text-text-3">{s.latency.toFixed(0)}ms</span>
                  )}
                </div>
                <CheckButton
                  onClick={() => checkEndpoint(key, url, method, body)}
                  loading={s.status === "checking"}
                >
                  Test
                </CheckButton>
              </div>
              {Boolean(s.data) && (
                <div className="pl-4">
                  <JsonView data={s.data} />
                </div>
              )}
              {s.error && (
                <p className="pl-4 text-xs text-red-400">{s.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SSEStreamSection() {
  const [text, setText] = useState("The doctor is very busy today");
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runStream = useCallback(async () => {
    if (streaming) {
      abortRef.current?.abort();
      return;
    }

    setEvents([]);
    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/translate/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setEvents([{ event: "error", data: { status: res.status }, ts: Date.now() }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          let ev = "";
          let da = "";
          for (const l of lines) {
            if (l.startsWith("event: ")) ev = l.slice(7);
            if (l.startsWith("data: ")) da = l.slice(6);
          }
          if (ev && da) {
            try {
              setEvents((prev) => [
                ...prev,
                { event: ev, data: JSON.parse(da), ts: Date.now() },
              ]);
            } catch {
              setEvents((prev) => [...prev, { event: ev, data: da, ts: Date.now() }]);
            }
          }
        }
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        setEvents((prev) => [
          ...prev,
          { event: "error", data: { message: err instanceof Error ? err.message : "unknown" }, ts: Date.now() },
        ]);
      }
    } finally {
      setStreaming(false);
    }
  }, [text, streaming]);

  return (
    <Card title="SSE Stream Tester — POST /api/translate/stream">
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 text-sm bg-base border border-border rounded px-3 py-1.5 text-text-1 placeholder:text-text-3 focus:outline-none focus:border-accent"
          placeholder="English text to translate…"
        />
        <button
          onClick={runStream}
          className={`px-4 py-1.5 text-xs font-medium rounded-btn border transition-colors ${
            streaming
              ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
          }`}
        >
          {streaming ? "Stop" : "Stream"}
        </button>
      </div>

      <div className="space-y-2 min-h-[80px]">
        {events.length === 0 && !streaming && (
          <p className="text-xs text-text-3">No events yet. Click Stream to start.</p>
        )}
        {streaming && events.length === 0 && (
          <p className="text-xs text-yellow-400 animate-pulse">Waiting for events…</p>
        )}
        {events.map((ev, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span
              className={`font-mono font-semibold shrink-0 ${
                ev.event === "rule_based"
                  ? "text-blue-400"
                  : ev.event === "llm_quality"
                  ? "text-green-400"
                  : ev.event === "done"
                  ? "text-text-3"
                  : "text-red-400"
              }`}
            >
              {ev.event}
            </span>
            <span className="text-text-2 font-mono">
              {typeof ev.data === "object" && ev.data !== null && "gloss" in (ev.data as object)
                ? (ev.data as { gloss: string }).gloss
                : JSON.stringify(ev.data)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ExtensionSection() {
  const [extState, setExtState] = useState<"unknown" | "connected" | "no-session" | "unavailable">("unknown");
  const [session, setSession] = useState<unknown>(null);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome?.runtime?.sendMessage) {
      setExtState("unavailable");
      return;
    }
    setExtState("no-session");
  }, []);

  const checkExtension = useCallback(() => {
    if (typeof chrome === "undefined" || !chrome?.runtime?.sendMessage) {
      setExtState("unavailable");
      return;
    }
    chrome.runtime.sendMessage(
      chrome.runtime.id ?? "",
      { type: "GET_AUTH_SESSION" },
      (res: { ok: boolean; session?: unknown }) => {
        if (chrome?.runtime?.lastError) {
          setExtState("unavailable");
          return;
        }
        if (res?.session) {
          setSession(res.session);
          setExtState("connected");
        } else {
          setExtState("no-session");
        }
      }
    );
  }, []);

  const signInUrl = `/auth/sign-in?source=extension&ext_id=dev`;

  return (
    <Card title="Extension — Connection Status">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot
            status={
              extState === "connected"
                ? "ok"
                : extState === "unavailable"
                ? "error"
                : extState === "no-session"
                ? "idle"
                : "checking"
            }
          />
          <span className="text-sm font-medium text-text-1">
            {extState === "unknown" && "Checking…"}
            {extState === "connected" && "Extension authenticated"}
            {extState === "no-session" && "Extension present, not signed in"}
            {extState === "unavailable" && "Extension not installed / not running"}
          </span>
        </div>
        <CheckButton onClick={checkExtension} loading={extState === "unknown"}>
          Refresh
        </CheckButton>
      </div>

      {extState === "connected" && Boolean(session) && <JsonView data={session} />}

      {extState === "no-session" && (
        <Link href={signInUrl} className="text-xs text-accent hover:underline">
          Open extension sign-in flow →
        </Link>
      )}

      {extState === "unavailable" && (
        <p className="text-xs text-text-3">
          Load the extension in Chrome via{" "}
          <code className="font-mono">chrome://extensions</code> → Load unpacked →{" "}
          <code className="font-mono">extension/</code>
        </p>
      )}
    </Card>
  );
}

function ApiReferenceSection() {
  const endpoints = [
    { method: "POST", path: "/api/translate/fast", desc: "Rule-based only, <50ms, offline-ready" },
    { method: "POST", path: "/api/translate/stream", desc: "SSE: rule-based → LLM upgrade" },
    { method: "GET", path: "/api/auth/extension-session", desc: "Returns session token for extension (auth required)" },
    { method: "GET", path: "/api/translations", desc: "User translation history (auth required)" },
    { method: "POST", path: "/api/translations", desc: "Save a translation (auth required)" },
    { method: "GET", path: "/api/guest-usage", desc: "Remaining guest translations (cookie)" },
    { method: "GET", path: "/api/pose/[gloss]", desc: "Binary .pose file for skeleton animation" },
    { method: "GET", path: "/api/pose-video/[gloss]", desc: "Sign language video file" },
  ] as const;

  const backendEndpoints = [
    { method: "GET", path: "/api/health", desc: "Backend status + gloss count" },
    { method: "GET", path: "/api/vocabulary", desc: "All available glosses" },
    { method: "POST", path: "/api/translate/audio", desc: "Speech → ASL gloss (Groq Whisper)" },
  ] as const;

  const methodColors: Record<string, string> = {
    GET: "text-blue-400",
    POST: "text-green-400",
    DELETE: "text-red-400",
    PATCH: "text-yellow-400",
  };

  return (
    <Card title="API Reference" className="col-span-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-text-2 mb-3">Next.js (frontend) — <code className="font-mono">localhost:3000</code></p>
          <div className="space-y-2">
            {endpoints.map(({ method, path, desc }) => (
              <div key={path} className="flex gap-3 items-start text-xs">
                <span className={`font-mono font-semibold w-10 shrink-0 ${methodColors[method] ?? "text-text-2"}`}>
                  {method}
                </span>
                <span className="font-mono text-text-1 shrink-0">{path}</span>
                <span className="text-text-3">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-2 mb-3">FastAPI backend — <code className="font-mono">localhost:8000</code></p>
          <div className="space-y-2">
            {backendEndpoints.map(({ method, path, desc }) => (
              <div key={path} className="flex gap-3 items-start text-xs">
                <span className={`font-mono font-semibold w-10 shrink-0 ${methodColors[method] ?? "text-text-2"}`}>
                  {method}
                </span>
                <span className="font-mono text-text-1 shrink-0">{path}</span>
                <span className="text-text-3">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────

export default function DevPage() {
  const isDev = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEV_PANEL === "true";

  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <p className="text-text-2 text-sm">Not available in production.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-text-1">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logos/DuoSign_logo.svg" alt="DuoSign" width={100} height={24} className="logo-adaptive" />
          <span className="text-xs font-mono bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">
            DEV
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-3">
          <Link href="/translate" className="hover:text-text-1">App →</Link>
          <Link href="/auth/sign-in" className="hover:text-text-1">Sign In →</Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-text-1"
          >
            FastAPI Docs →
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <AuthSection />
        <BackendHealthSection />
        <NextjsProxySection />
        <ExtensionSection />
        <SSEStreamSection />
        <ApiReferenceSection />
      </main>
    </div>
  );
}
