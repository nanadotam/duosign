"use client";

import { useState } from "react";
import Link from "next/link";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";

/* ── Sidebar ─────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    group: "Getting Started",
    items: [
      { id: "overview",   label: "Overview" },
      { id: "base-url",   label: "Base URL & Auth" },
      { id: "errors",     label: "Error Responses" },
    ],
  },
  {
    group: "Translation",
    items: [
      { id: "translate",        label: "POST /translate" },
      { id: "translate-fast",   label: "POST /translate/fast" },
      { id: "translate-stream", label: "POST /translate/stream" },
      { id: "translate-audio",  label: "POST /translate/audio" },
    ],
  },
  {
    group: "Vocabulary",
    items: [
      { id: "vocabulary",        label: "GET /vocabulary" },
      { id: "vocabulary-search", label: "GET /vocabulary/search" },
    ],
  },
  {
    group: "Media",
    items: [
      { id: "pose",  label: "GET /pose/:gloss" },
      { id: "video", label: "GET /video/:gloss" },
    ],
  },
  {
    group: "Utility",
    items: [
      { id: "health", label: "GET /health" },
    ],
  },
];

/* ── Re-usable components ────────────────────────────────────────── */
function Heading1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-serif text-[28px] lg:text-[32px] text-text-1 tracking-tight mb-3">
      {children}
    </h1>
  );
}

function Heading2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-serif text-[20px] text-text-1 tracking-tight mt-10 mb-3 scroll-mt-20">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-text-2 leading-[1.75] mb-4">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-[5px] bg-surface-3 border border-border font-mono text-[12.5px] text-accent">
      {children}
    </code>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="mb-4 rounded-[10px] border border-border overflow-hidden shadow-raised-sm">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-b border-border">
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 font-mono">{title}</span>
          <button
            onClick={copy}
            className="text-[11px] text-text-3 hover:text-accent transition-colors cursor-pointer"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      )}
      <pre className="bg-surface-2 px-4 py-3.5 font-mono text-[12.5px] text-text-2 leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

function MethodBadge({ method }: { method: "POST" | "GET" }) {
  return (
    <span className={[
      "px-2.5 py-1 rounded-[6px] font-mono text-[11.5px] font-bold tracking-[0.04em]",
      method === "POST"
        ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-3))] text-accent border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]"
        : "bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-3))] text-[var(--success)] border border-[color-mix(in_srgb,var(--success)_25%,transparent)]",
    ].join(" ")}>
      {method}
    </span>
  );
}

function EndpointHeader({ method, path, summary }: { method: "POST" | "GET"; path: string; summary: string }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <MethodBadge method={method} />
      <div>
        <div className="font-mono text-[14px] font-semibold text-text-1">{path}</div>
        <div className="text-[12.5px] text-text-3 mt-0.5">{summary}</div>
      </div>
    </div>
  );
}

function ParamsTable({ rows }: { rows: [string, string, string, string][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase w-[130px]">Field</th>
            <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase w-[90px]">Type</th>
            <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase w-[80px]">Required</th>
            <th className="text-left py-2 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Description</th>
          </tr>
        </thead>
        <tbody className="text-text-2">
          {rows.map(([field, type, req, desc]) => (
            <tr key={field} className="border-b border-border last:border-0">
              <td className="py-2 pr-4 font-mono text-accent">{field}</td>
              <td className="py-2 pr-4 font-mono text-text-3">{type}</td>
              <td className="py-2 pr-4">
                {req === "yes" ? (
                  <span className="text-[var(--success)] font-semibold">Yes</span>
                ) : (
                  <span className="text-text-3">No</span>
                )}
              </td>
              <td className="py-2">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3 rounded-[10px] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-2))] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] mb-4">
      <span className="text-accent mt-0.5 flex-shrink-0 text-[13px]">ℹ</span>
      <div className="text-[13px] text-text-2 leading-relaxed">{children}</div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function ApiDocsPage() {
  const [activeId, setActiveId] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <NavigationBar />

      <div className="flex-1 flex max-w-[1200px] w-full mx-auto px-5">

        {/* Sidebar */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0 py-8 pr-6 sticky top-[54px] h-[calc(100vh-54px)] overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-4 font-mono">
            API Reference
          </div>
          {SECTIONS.map((sec) => (
            <div key={sec.group} className="mb-5">
              <div className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-text-3 mb-1.5">
                {sec.group}
              </div>
              {sec.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={[
                    "block w-full text-left px-3 py-[5px] rounded-[7px] text-[13px] font-medium transition-all duration-120 cursor-pointer",
                    activeId === item.id
                      ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-accent"
                      : "text-text-2 hover:text-text-1 hover:bg-surface-2",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 py-8 pl-0 lg:pl-10 border-l border-border min-w-0">
          <div className="max-w-[720px]">

            {/* ── OVERVIEW ─────────────────────────────────────────── */}
            <section id="overview">
              <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">
                API Reference
              </div>
              <Heading1>DuoSign REST API</Heading1>
              <P>
                The DuoSign backend is a FastAPI application that exposes endpoints for text-to-gloss
                translation, vocabulary lookup, and media serving. All endpoints return JSON unless
                otherwise noted.
              </P>
              <P>
                The API is versioned via the application version (<Code>3.0.0</Code>) but URL paths do
                not include a version prefix. All paths are prefixed with <Code>/api</Code>.
              </P>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── BASE URL ─────────────────────────────────────────── */}
            <section id="base-url">
              <Heading2 id="base-url">Base URL & Auth</Heading2>
              <P>Run the backend locally with:</P>
              <CodeBlock title="shell">
{`uvicorn api.main:app --reload --port 8000`}
              </CodeBlock>
              <P>
                The frontend proxies <Code>/api/*</Code> to <Code>http://localhost:8000</Code> in development
                via <Code>NEXT_PUBLIC_API_URL</Code>. For production, set this env var to your deployed
                backend URL and add the origin to <Code>ALLOWED_ORIGINS</Code> on the backend.
              </P>
              <P>
                Authentication is not required for any endpoint in the current version. CORS is configured
                to allow <Code>localhost:3000</Code> and <Code>localhost:5173</Code> plus any origins in
                the <Code>ALLOWED_ORIGINS</Code> environment variable.
              </P>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── ERRORS ───────────────────────────────────────────── */}
            <section id="errors">
              <Heading2 id="errors">Error Responses</Heading2>
              <P>All errors follow the FastAPI default shape:</P>
              <CodeBlock title="json">
{`{
  "detail": "Human-readable error message"
}`}
              </CodeBlock>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-[12.5px] border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Status</th>
                      <th className="text-left py-2 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-2">
                    {[
                      ["400", "Bad request — e.g. empty audio file"],
                      ["404", "Pose or video file not found for the requested gloss"],
                      ["422", "Validation error — missing or invalid request body field"],
                      ["502", "Upstream failure — usually a missing API key (GROQ_API_KEY)"],
                      ["503", "Backend not ready — converter or vocabulary not initialized"],
                    ].map(([code, msg]) => (
                      <tr key={code} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4 font-mono text-error">{code}</td>
                        <td className="py-2">{msg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── POST /translate ──────────────────────────────────── */}
            <section id="translate">
              <Heading2 id="translate">POST /api/translate</Heading2>
              <EndpointHeader
                method="POST"
                path="/api/translate"
                summary="Full pipeline — rule-based + background LLM quality check"
              />
              <P>
                Runs the rule-based converter synchronously and, if the result has 2+ tokens and the LLM
                is available, fires a background LLM quality check with a 3-second timeout. Returns
                whichever result (rule-based or LLM) completes first.
              </P>

              <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Request Body</div>
              <ParamsTable rows={[
                ["text", "string", "yes", "English text to translate (1–500 characters)"],
              ]} />

              <CodeBlock title="request">
{`POST /api/translate
Content-Type: application/json

{
  "text": "I need to find a doctor."
}`}
              </CodeBlock>

              <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Response</div>
              <CodeBlock title="response — 200 OK">
{`{
  "input_text":     "I need to find a doctor.",
  "gloss":          "I NEED FIND DOCTOR",
  "gloss_internal": "IX-1 NEED FIND DOCTOR",
  "tokens":         ["IX-1", "NEED", "FIND", "DOCTOR"],
  "method":         "rule_based",
  "confidence":     0.91,
  "transcribed_text": ""
}`}
              </CodeBlock>

              <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Response fields</div>
              <ParamsTable rows={[
                ["input_text",       "string",   "—", "Original English text echoed back"],
                ["gloss",            "string",   "—", "Display-form gloss (IX-1 → I, IX-2 → YOU, etc.)"],
                ["gloss_internal",   "string",   "—", "Internal gloss with IX markers intact"],
                ["tokens",           "string[]", "—", "Individual gloss tokens in internal form"],
                ["method",           "string",   "—", "\"rule_based\", \"llm\", or \"llm_quality\""],
                ["confidence",       "float",    "—", "0–1 confidence score from the rule engine"],
                ["transcribed_text", "string",   "—", "Non-empty only for /translate/audio responses"],
              ]} />
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── POST /translate/fast ─────────────────────────────── */}
            <section id="translate-fast">
              <Heading2 id="translate-fast">POST /api/translate/fast</Heading2>
              <EndpointHeader
                method="POST"
                path="/api/translate/fast"
                summary="Rule-based only — no LLM, <50ms, offline-capable"
              />
              <P>
                Skips all LLM paths including the mandatory fallback. Always responds in under 50ms.
                Identical request/response shape to <Code>POST /api/translate</Code> with{" "}
                <Code>method</Code> always <Code>&quot;rule_based&quot;</Code>.
              </P>
              <CodeBlock title="request">
{`POST /api/translate/fast
Content-Type: application/json

{
  "text": "Good morning, how are you?"
}`}
              </CodeBlock>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── POST /translate/stream ───────────────────────────── */}
            <section id="translate-stream">
              <Heading2 id="translate-stream">POST /api/translate/stream</Heading2>
              <EndpointHeader
                method="POST"
                path="/api/translate/stream"
                summary="Server-Sent Events — two-phase progressive response"
              />
              <P>
                Returns a <Code>text/event-stream</Code> SSE response with up to three events:
              </P>
              <div className="space-y-2 mb-4">
                {[
                  { event: "rule_based",  timing: "Instant",  desc: "Rule-based result — always emitted first" },
                  { event: "llm_quality", timing: "1–3 s",    desc: "LLM-improved result (omitted if LLM unavailable or unchanged)" },
                  { event: "done",        timing: "After all", desc: "Empty data object — signals stream end" },
                ].map((e) => (
                  <div key={e.event} className="flex gap-3 px-4 py-2.5 rounded-[10px] bg-surface border border-border shadow-raised-sm">
                    <code className="text-accent font-mono text-[12px] font-semibold w-[110px] flex-shrink-0">{e.event}</code>
                    <span className="text-text-3 text-[11.5px] w-[50px] flex-shrink-0">{e.timing}</span>
                    <span className="text-text-2 text-[12.5px]">{e.desc}</span>
                  </div>
                ))}
              </div>
              <CodeBlock title="SSE response stream">
{`event: rule_based
data: {"gloss":"I DOCTOR SEARCH","method":"rule_based","confidence":0.88, ...}

event: llm_quality
data: {"gloss":"I NEED FIND DOCTOR","method":"llm_quality","confidence":0.88, ...}

event: done
data: {}`}
              </CodeBlock>
              <Note>
                Browsers cannot send POST requests with the native <Code>EventSource</Code> API.
                Use <Code>fetch()</Code> + <Code>ReadableStream</Code> to consume SSE from a POST endpoint.
                See <Code>frontend/src/shared/api/glossApi.ts → translateStream()</Code> for the
                reference implementation.
              </Note>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── POST /translate/audio ────────────────────────────── */}
            <section id="translate-audio">
              <Heading2 id="translate-audio">POST /api/translate/audio</Heading2>
              <EndpointHeader
                method="POST"
                path="/api/translate/audio"
                summary="Speech → Text → ASL Gloss via Groq Whisper"
              />
              <P>
                Accepts a multipart/form-data audio file, transcribes it with Groq Whisper, then runs
                the transcription through the full translation pipeline. The response is the same shape
                as <Code>/api/translate</Code> with <Code>transcribed_text</Code> populated.
              </P>

              <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Form fields</div>
              <ParamsTable rows={[
                ["audio",    "File",   "yes", "Audio file (webm, mp3, mp4, ogg, wav — max 25 MB)"],
                ["language", "string", "no",  "BCP-47 language code for Whisper (e.g. \"en\"). Auto-detected if omitted."],
              ]} />

              <CodeBlock title="shell example">
{`curl -X POST http://localhost:8000/api/translate/audio \\
  -F "audio=@recording.webm" \\
  -F "language=en"`}
              </CodeBlock>

              <CodeBlock title="response — 200 OK">
{`{
  "input_text":       "Where is the nearest pharmacy?",
  "gloss":            "PHARMACY WHERE",
  "gloss_internal":   "PHARMACY WHERE",
  "tokens":           ["PHARMACY", "WHERE"],
  "method":           "rule_based",
  "confidence":       0.85,
  "transcribed_text": "Where is the nearest pharmacy?"
}`}
              </CodeBlock>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── GET /vocabulary ──────────────────────────────────── */}
            <section id="vocabulary">
              <Heading2 id="vocabulary">GET /api/vocabulary</Heading2>
              <EndpointHeader
                method="GET"
                path="/api/vocabulary"
                summary="List all available ASL glosses"
              />
              <P>Returns every gloss token in the loaded vocabulary.</P>
              <CodeBlock title="response — 200 OK">
{`{
  "total":            2000,
  "has_full_alphabet": true,
  "glosses":          ["ABLE", "ABOVE", "ACCIDENT", "..."]
}`}
              </CodeBlock>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── GET /vocabulary/search ───────────────────────────── */}
            <section id="vocabulary-search">
              <Heading2 id="vocabulary-search">GET /api/vocabulary/search</Heading2>
              <EndpointHeader
                method="GET"
                path="/api/vocabulary/search"
                summary="Search glosses by prefix"
              />
              <ParamsTable rows={[
                ["q",     "string",  "no",  "Prefix to search (case-insensitive). Returns all glosses if omitted."],
                ["limit", "integer", "no",  "Max results returned. Default 50."],
              ]} />
              <CodeBlock title="request">
{`GET /api/vocabulary/search?q=DOC&limit=10`}
              </CodeBlock>
              <CodeBlock title="response — 200 OK">
{`{
  "query":   "DOC",
  "results": ["DOCTOR", "DOCUMENT", "DOG"]
}`}
              </CodeBlock>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── GET /pose/:gloss ─────────────────────────────────── */}
            <section id="pose">
              <Heading2 id="pose">GET /api/pose/:gloss</Heading2>
              <EndpointHeader
                method="GET"
                path="/api/pose/:gloss"
                summary="Serve a .pose binary for a given gloss token"
              />
              <P>
                Returns the raw <Code>.pose</Code> binary file for the requested gloss token from{" "}
                <Code>bucket/poses/</Code>. The file encodes MediaPipe holistic landmark frames and is
                decoded in the browser by <Code>poseReader.ts</Code>.
              </P>
              <ParamsTable rows={[
                [":gloss", "string", "yes", "Gloss token name, e.g. DOCTOR, HELLO, YOU"],
              ]} />
              <CodeBlock title="request">
{`GET /api/pose/DOCTOR`}
              </CodeBlock>
              <P>
                Response is <Code>application/octet-stream</Code> with a{" "}
                <Code>Cache-Control: public, max-age=86400</Code> header. Returns 404 if the pose file
                does not exist in the bucket.
              </P>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── GET /video/:gloss ────────────────────────────────── */}
            <section id="video">
              <Heading2 id="video">GET /api/video/:gloss</Heading2>
              <EndpointHeader
                method="GET"
                path="/api/video/:gloss"
                summary="Serve a reference MP4 clip for a given gloss token"
              />
              <P>
                Returns the <Code>.mp4</Code> video file from <Code>bucket/videos/</Code>. Used by the
                video engine fallback when pose data is unavailable. Returns 404 if the video doesn&apos;t exist.
              </P>
              <CodeBlock title="request">
{`GET /api/video/HELLO`}
              </CodeBlock>
            </section>

            <div className="h-px bg-border my-8" />

            {/* ── GET /health ──────────────────────────────────────── */}
            <section id="health">
              <Heading2 id="health">GET /api/health</Heading2>
              <EndpointHeader
                method="GET"
                path="/api/health"
                summary="Health check — verify backend and vocabulary status"
              />
              <CodeBlock title="response — 200 OK">
{`{
  "status":            "ok",
  "version":           "3.0.0",
  "vocabulary_loaded": true,
  "gloss_count":       2000
}`}
              </CodeBlock>
              <Note>
                Use this endpoint to confirm the backend is up and that pose data was found on startup.
                If <Code>vocabulary_loaded</Code> is <Code>false</Code>, all translations will return
                only fingerspelled output.
              </Note>
            </section>

            <div className="h-px bg-border my-8" />

            {/* Footer nav */}
            <div className="flex items-center justify-between pt-2 pb-12">
              <Link
                href="/docs"
                className="flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
              >
                ← General Docs
              </Link>
              <span className="text-[12px] text-text-3">DuoSign API v3.0.0</span>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
