"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";

/* ── Sidebar data ────────────────────────────────────────────────── */
const USER_SECTIONS: Array<{
  group: string;
  items: Array<{ id: string; label: string; href?: string }>;
}> = [
  {
    group: "Getting Started",
    items: [
      { id: "welcome",    label: "Welcome to DuoSign" },
      { id: "how-to-use", label: "How to Use It" },
      { id: "signs",      label: "What Signs Does It Know?" },
    ],
  },
  {
    group: "Features",
    items: [
      { id: "voice-guide",   label: "Voice Input" },
      { id: "history-guide", label: "Translation History" },
    ],
  },
  {
    group: "Good to Know",
    items: [
      { id: "limitations", label: "Honest Limitations" },
      { id: "faq",         label: "FAQ" },
    ],
  },
];

const CHROME_SECTIONS: Array<{
  group: string;
  items: Array<{ id: string; label: string }>;
}> = [
  {
    group: "Setup",
    items: [
      { id: "ext-download", label: "Download" },
      { id: "ext-install",  label: "Installation" },
      { id: "ext-login",    label: "Sign In" },
    ],
  },
  {
    group: "Using It",
    items: [
      { id: "ext-translate", label: "Translate Any Text" },
      { id: "ext-sidepanel", label: "Side Panel" },
      { id: "ext-youtube",   label: "YouTube Captions" },
      { id: "ext-settings",  label: "Extension Settings" },
    ],
  },
];

const DEV_SECTIONS: Array<{
  group: string;
  items: Array<{ id: string; label: string }>;
}> = [
  {
    group: "Overview",
    items: [
      { id: "dev-intro",      label: "What is DuoSign?" },
      { id: "dev-quickstart", label: "Quick Start" },
    ],
  },
  {
    group: "Translation",
    items: [
      { id: "engines",     label: "Translation Engines" },
      { id: "gloss",       label: "ASL Gloss Format" },
      { id: "fingerspell", label: "Fingerspelling" },
      { id: "voice",       label: "Voice Input" },
    ],
  },
  {
    group: "Avatar",
    items: [
      { id: "avatar",   label: "3D Avatar & Pose Player" },
      { id: "playback", label: "Playback Controls" },
      { id: "models",   label: "Avatar Models" },
    ],
  },
  {
    group: "Settings",
    items: [
      { id: "settings",      label: "Preferences" },
      { id: "accessibility", label: "Accessibility" },
      { id: "shortcuts",     label: "Keyboard Shortcuts" },
    ],
  },
];

const API_SECTIONS: Array<{
  group: string;
  items: Array<{ id: string; label: string }>;
}> = [
  {
    group: "Getting Started",
    items: [
      { id: "api-overview", label: "Overview" },
      { id: "api-base-url", label: "Base URL & Auth" },
      { id: "api-errors",   label: "Error Responses" },
    ],
  },
  {
    group: "Translation",
    items: [
      { id: "api-translate",        label: "POST /translate" },
      { id: "api-translate-fast",   label: "POST /translate/fast" },
      { id: "api-translate-stream", label: "POST /translate/stream" },
      { id: "api-translate-audio",  label: "POST /translate/audio" },
    ],
  },
  {
    group: "Vocabulary",
    items: [
      { id: "api-vocabulary",        label: "GET /vocabulary" },
      { id: "api-vocabulary-search", label: "GET /vocabulary/search" },
    ],
  },
  {
    group: "Media",
    items: [
      { id: "api-pose",  label: "GET /pose/:gloss" },
      { id: "api-video", label: "GET /video/:gloss" },
    ],
  },
  {
    group: "Utility",
    items: [
      { id: "api-health", label: "GET /health" },
    ],
  },
];

/* ── Shared components ───────────────────────────────────────────── */
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
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3 rounded-[10px] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-2))] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] mb-4">
      <span className="text-accent mt-0.5 flex-shrink-0 text-[13px]">ℹ</span>
      <div className="text-[13px] text-text-2 leading-relaxed">{children}</div>
    </div>
  );
}
function Callout({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3 rounded-[10px] bg-surface-2 border border-border mb-4">
      <span className="flex-shrink-0 text-[16px] leading-relaxed">{emoji}</span>
      <div className="text-[13px] text-text-2 leading-relaxed">{children}</div>
    </div>
  );
}
function Chip({ label, color = "default" }: { label: string; color?: "default" | "green" | "teal" | "purple" | "orange" }) {
  const colors = {
    default: "bg-surface-3 border-border text-text-2",
    green:   "bg-[color-mix(in_srgb,var(--success)_10%,var(--surface-3))] border-[color-mix(in_srgb,var(--success)_25%,transparent)] text-[var(--success)]",
    teal:    "bg-[color-mix(in_srgb,var(--teal)_10%,var(--surface-3))] border-[color-mix(in_srgb,var(--teal)_25%,transparent)] text-[var(--teal)]",
    purple:  "bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-3))] border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-accent",
    orange:  "bg-[color-mix(in_srgb,var(--warn)_10%,var(--surface-3))] border-[color-mix(in_srgb,var(--warn)_25%,transparent)] text-[var(--warn)]",
  };
  return (
    <span className={`px-2 py-0.5 rounded-pill border text-[11px] font-semibold font-mono tracking-[0.04em] ${colors[color]}`}>
      {label}
    </span>
  );
}

/* ── API-only components ─────────────────────────────────────────── */
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
          <button onClick={copy} className="text-[11px] text-text-3 hover:text-accent transition-colors cursor-pointer">
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
                {req === "yes"
                  ? <span className="text-[var(--success)] font-semibold">Yes</span>
                  : <span className="text-text-3">No</span>}
              </td>
              <td className="py-2">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
type Tab = "user" | "dev" | "api" | "chrome";

const TAB_DEFAULTS: Record<Tab, string> = {
  user:   "welcome",
  dev:    "dev-intro",
  api:    "api-overview",
  chrome: "ext-install",
};

export default function DocsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return (t === "dev" || t === "api" || t === "chrome") ? t : "user";
  });
  const [activeId, setActiveId] = useState(() => {
    const t = searchParams.get("tab");
    return (t === "dev" || t === "api" || t === "chrome") ? TAB_DEFAULTS[t as Tab] : "welcome";
  });

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "dev" || t === "api" || t === "chrome") {
      setTab(t);
      setActiveId(TAB_DEFAULTS[t]);
    }
  }, [searchParams]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setActiveId(TAB_DEFAULTS[t]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollTo = (id: string, href?: string) => {
    if (href) { window.open(href, "_blank", "noopener,noreferrer"); return; }
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sections =
    tab === "user"   ? USER_SECTIONS   :
    tab === "dev"    ? DEV_SECTIONS    :
    tab === "chrome" ? CHROME_SECTIONS :
                       API_SECTIONS;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <NavigationBar />

      {/* ── WELCOME BANNER ───────────────────────────────────────── */}
      <div className="border-b border-border bg-surface-2">
        <div className="max-w-[1200px] mx-auto px-5 py-8">
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">
            Documentation
          </div>
          <h1 className="font-serif text-[28px] lg:text-[34px] text-text-1 tracking-tight mb-2">
            Welcome to DuoSign
          </h1>
          <p className="text-[14px] text-text-2 leading-relaxed max-w-[560px] mb-5">
            DuoSign turns English text into American Sign Language — animated by a 3D avatar, right in your browser.
            Whether you&apos;re new here or building something with our API, you&apos;re in the right place.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {(["user", "chrome", "dev", "api"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={[
                  "px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-all duration-120 cursor-pointer",
                  tab === t
                    ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-accent"
                    : "border-border text-text-2 hover:text-text-1 hover:bg-surface",
                ].join(" ")}
              >
                {t === "user" ? "For Users" : t === "chrome" ? "Chrome Extension" : t === "dev" ? "Developer Docs" : "API Reference"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-[1200px] w-full mx-auto px-5">

        {/* Sidebar */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0 py-8 pr-6 sticky top-[54px] h-[calc(100vh-54px)] overflow-y-auto scrollbar-thin">
          {sections.map((sec) => (
            <div key={sec.group} className="mb-5">
              <div className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-text-3 mb-1.5">
                {sec.group}
              </div>
              {sec.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id, (item as { id: string; label: string; href?: string }).href)}
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

            {/* ══════════════════════════════════════════════════════ */}
            {/* FOR USERS TAB                                          */}
            {/* ══════════════════════════════════════════════════════ */}
            {tab === "user" && (
              <>
                <section id="welcome">
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">Getting Started</div>
                  <Heading1>What is DuoSign?</Heading1>
                  <P>
                    DuoSign is a free tool that translates English text into American Sign Language (ASL),
                    performed live by a 3D animated character — directly in your web browser.
                    No app to download. No account required to start.
                  </P>
                  <P>
                    You type (or speak) an English sentence. DuoSign figures out the right signs,
                    and the avatar signs it back to you — smoothly and in real time.
                  </P>
                  <Callout emoji="🤟">
                    DuoSign is built as a research project at Ashesi University, Ghana.
                    It was designed with the Deaf and Hard-of-Hearing community in mind — your feedback shapes how it grows.
                  </Callout>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Link href="/translate" className="p-4 rounded-[12px] bg-surface border border-border shadow-raised-sm hover:border-accent transition-colors block">
                      <div className="text-[13px] font-semibold text-text-1 mb-1">Open the App</div>
                      <div className="text-[12px] text-text-2">Start translating right now — no sign-up needed.</div>
                    </Link>
                    <Link href="/auth/register" className="p-4 rounded-[12px] bg-surface border border-border shadow-raised-sm hover:border-accent transition-colors block">
                      <div className="text-[13px] font-semibold text-text-1 mb-1">Create an Account</div>
                      <div className="text-[12px] text-text-2">Save your translation history and preferences.</div>
                    </Link>
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="how-to-use">
                  <Heading2 id="how-to-use">How to Use DuoSign</Heading2>
                  <P>It only takes a few seconds to get your first translation:</P>
                  <ol className="list-none space-y-4 mb-6">
                    {[
                      { n: "1", title: "Open the Translate page", desc: "Go to the app — you don't need an account." },
                      { n: "2", title: "Type an English sentence", desc: <>Try something simple like <Code>Hello, how are you?</Code> or <Code>I need help.</Code></> },
                      { n: "3", title: "Press Translate", desc: "Hit Enter or click the Translate button. The gloss tokens (sign names) appear below the text box." },
                      { n: "4", title: "Watch the avatar sign", desc: "The 3D character on the right side of the screen performs each sign in order." },
                      { n: "5", title: "Replay or slow it down", desc: "Use the playback controls below the avatar to pause, step through sign by sign, or slow to 0.5× speed." },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-4">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-3))] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-accent text-[12px] font-bold flex items-center justify-center">
                          {step.n}
                        </span>
                        <div>
                          <div className="text-[13.5px] font-semibold text-text-1 mb-0.5">{step.title}</div>
                          <div className="text-[13px] text-text-2 leading-relaxed">{step.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Note>
                    The avatar needs pose data from the backend to animate. If it shows a spinner but never starts signing, the service may still be loading — wait a moment and try again.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="signs">
                  <Heading2 id="signs">What Signs Does DuoSign Know?</Heading2>
                  <P>
                    DuoSign has a library of over <strong className="text-text-1">2,000 ASL signs</strong>, drawn from more than 21,000 reference videos.
                    When it encounters a word it doesn&apos;t have a sign for, it <strong className="text-text-1">fingerspells</strong> it — letter by letter, just like a real ASL signer would.
                  </P>
                  <Callout emoji="💡">
                    Fingerspelled words appear in the gloss strip as dotted chips like <strong>N·A·S·A</strong>.
                    You can turn fingerspelling off in Settings if you only want known signs.
                  </Callout>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="voice-guide">
                  <Heading2 id="voice-guide">Voice Input</Heading2>
                  <P>
                    Click the <strong className="text-text-1">microphone button</strong> in the input panel, say your sentence, and DuoSign transcribes and translates it automatically.
                    Works in Chrome and most modern browsers — no external hardware needed.
                  </P>
                  <Note>
                    Voice input requires an active internet connection. If you see a microphone error, check that your browser has microphone permission enabled for this site.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="extension">
                  <Heading2 id="extension">Chrome Extension</Heading2>
                  <P>
                    DuoSign has a Chrome extension that brings signing to every page you browse.
                    Highlight any text, right-click, and the avatar signs it in a side panel — no switching tabs.
                    It also overlays live signing on YouTube videos as they play.
                  </P>
                  <div className="p-4 rounded-[12px] bg-surface border border-border shadow-raised-sm mb-4 flex items-center justify-between gap-4">
                    <div className="text-[13px] text-text-2">Full installation guide, screenshots, and YouTube setup</div>
                    <button
                      onClick={() => switchTab("chrome")}
                      className="flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] text-accent hover:bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))] transition-colors cursor-pointer"
                    >
                      Chrome Extension →
                    </button>
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="history-guide">
                  <Heading2 id="history-guide">Translation History</Heading2>
                  <P>
                    Every translation you make is saved to your history with a timestamp and source type (typed or voice).
                    You can replay any past translation, filter by date or input type, and export entries.
                    History is available when you&apos;re signed in — guest translations aren&apos;t saved permanently.
                  </P>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="limitations">
                  <Heading2 id="limitations">Honest Limitations</Heading2>
                  <P>DuoSign is a research prototype — not a finished accessibility product. Here&apos;s what you should know:</P>
                  <div className="space-y-3 mb-4">
                    {[
                      { title: "ASL only",              desc: "DuoSign uses American Sign Language. Other sign languages (BSL, GSL, etc.) are not supported yet." },
                      { title: "2,000 signs isn't everything", desc: "Less common words will be fingerspelled instead of signed." },
                      { title: "Grammar is approximate", desc: "ASL has its own grammar. Our NLP pipeline does a reasonable job but it's not linguist-validated." },
                      { title: "No facial expressions yet", desc: "Facial expressions carry real meaning in ASL. Minimal facial movement is on our roadmap." },
                      { title: "Best in Chrome",         desc: "DuoSign is optimized for Chrome. Other browsers should work but may behave differently." },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3 py-3 border-b border-border last:border-0">
                        <span className="text-[13px] font-semibold text-text-1 w-[180px] flex-shrink-0">{item.title}</span>
                        <span className="text-[13px] text-text-2">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="faq">
                  <Heading2 id="faq">FAQ</Heading2>
                  <div className="space-y-4 mb-6">
                    {[
                      { q: "Is DuoSign free?",                    a: "Yes — completely free to use. No hidden costs, no premium tier." },
                      { q: "Do I need to create an account?",     a: "No. You can translate without signing up. Create an account to save history and unlock unlimited translations." },
                      { q: "Which sign language does it use?",    a: "American Sign Language (ASL)." },
                      { q: "Can I use it on my phone?",           a: "Yes — DuoSign works in mobile browsers, though the avatar panel is optimised for larger screens." },
                      { q: "Who made this?",                      a: "DuoSign was built by Nana Amoako as a final-year CS capstone at Ashesi University, Ghana (Class of 2026)." },
                      { q: "Can I give feedback?",                a: "Please do. Use the feedback button in the app or reach out directly. Real user feedback — especially from the Deaf community — shapes every update." },
                    ].map((item) => (
                      <div key={item.q} className="p-4 rounded-[12px] bg-surface border border-border">
                        <div className="text-[13.5px] font-semibold text-text-1 mb-1.5">{item.q}</div>
                        <div className="text-[13px] text-text-2 leading-relaxed">{item.a}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex items-center justify-between pt-2 pb-12">
                  <span className="text-[12px] text-text-3">DuoSign — v0.1.0-alpha · Ashesi University 2026</span>
                  <button onClick={() => switchTab("dev")} className="flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline cursor-pointer">
                    Developer Docs →
                  </button>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* CHROME EXTENSION TAB                                   */}
            {/* ══════════════════════════════════════════════════════ */}
            {tab === "chrome" && (
              <>
                <section id="ext-download">
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">Setup</div>
                  <Heading1>Chrome Extension</Heading1>
                  <P>
                    The DuoSign Chrome extension lets you translate any text on any webpage to ASL without leaving the page.
                    Highlight text, right-click, and a sign-language panel opens beside your browser — no tab-switching, no copy-pasting.
                    It also integrates with YouTube live captions so you can watch any video with a signing avatar alongside it.
                  </P>

                  <div className="p-5 rounded-[12px] bg-surface border border-border shadow-raised-sm mb-6">
                    <div className="text-[13px] font-semibold text-text-1 mb-1">Download the latest release</div>
                    <div className="text-[13px] text-text-2 mb-4">
                      The extension is packaged as a ZIP on GitHub Releases. Download the latest <strong className="text-text-1">duosign-extension.zip</strong>, unzip it, then follow the installation steps below.
                    </div>
                    <a
                      href="https://github.com/nanadotam/duosign/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-2))] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-accent text-[13px] font-semibold hover:bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface-2))] transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
                      View Releases on GitHub
                    </a>
                  </div>

                </section>

                <div className="h-px bg-border my-8" />

                <section id="ext-install">
                  <Heading2 id="ext-install">Installation</Heading2>
                  <Note>
                    The extension is distributed as a ZIP file — you install it directly into Chrome. It does <strong>not</strong> require the Chrome Web Store. You only need to do this once.
                  </Note>

                  <div className="mb-6">
                    <div className="text-[13px] font-bold text-text-1 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                      Download and unzip
                    </div>
                    <P>Go to the <a href="https://github.com/nanadotam/duosign/releases" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">GitHub Releases page</a> and download the latest <strong className="text-text-1">duosign-extension.zip</strong>. Unzip it so you have a folder called <strong className="text-text-1">duosign-extension</strong>.</P>
                    <img src="/ext-guide/1-ext-folder.png" alt="Unzipped duosign-extension folder showing its contents" className="w-full rounded-[10px] border border-border shadow-raised-sm mb-4 block" />
                  </div>

                  <div className="mb-6">
                    <div className="text-[13px] font-bold text-text-1 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                      Open Chrome Extensions and enable Developer Mode
                    </div>
                    <P>In Chrome, go to <Code>chrome://extensions</Code> (type that directly into the address bar and press Enter). In the top-right corner of that page, toggle <strong className="text-text-1">Developer mode</strong> on. The page will refresh and show extra buttons at the top left.</P>
                    <img src="/ext-guide/2-dev-mode.png" alt="chrome://extensions with Developer mode toggle switched ON" className="w-full rounded-[10px] border border-border shadow-raised-sm mb-4 block" />
                  </div>

                  <div className="mb-6">
                    <div className="text-[13px] font-bold text-text-1 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                      Load the extension
                    </div>
                    <P>Click <strong className="text-text-1">Load unpacked</strong>. A file picker opens — select the <strong className="text-text-1">duosign-extension</strong> folder you unzipped (select the folder itself, not any file inside it). Click Open/Select Folder.</P>
                    <P>DuoSign will appear in your extensions list. Click the puzzle-piece icon in your Chrome toolbar and pin DuoSign so it&apos;s always visible.</P>
                    <img src="/ext-guide/3-load-ext.png" alt="chrome://extensions showing the DuoSign extension card loaded and enabled" className="w-full rounded-[10px] border border-border shadow-raised-sm mb-4 block" />
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="ext-login">
                  <Heading2 id="ext-login">Sign In</Heading2>
                  <P>Click the DuoSign icon in your toolbar. If you are not signed in, click <strong className="text-text-1">Sign In</strong> — this opens the DuoSign website in a new tab. Log in or create a free account, then come back to your browser. The extension picks up your session automatically.</P>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <img src="/ext-guide/sign-in-modal.png" alt="Extension popup showing the Sign In button" className="w-full rounded-[10px] border border-border shadow-raised-sm block" />
                    <img src="/ext-guide/signout-modal-settings.png" alt="Extension popup after signing in, showing the user's name and Sign Out button" className="w-full rounded-[10px] border border-border shadow-raised-sm block" />
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="ext-translate">
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">Using It</div>
                  <Heading2 id="ext-translate">Translate Any Text</Heading2>
                  <P>Go to any webpage — a news article, an email, anything with text. Highlight any sentence or word with your mouse, then <strong className="text-text-1">right-click</strong> the selection. You will see <strong className="text-text-1">&quot;Send to DuoSign&quot;</strong> in the context menu. Click it.</P>
                  <P>You can also use the keyboard shortcut <Code>Cmd+Shift+P</Code> (Mac) or <Code>Ctrl+Shift+P</Code> (Windows/Linux) after highlighting — no right-click needed.</P>
                  <img src="/ext-guide/send-to-duosign-right-click.png" alt="Right-click context menu showing Send to DuoSign option on selected text" className="w-full rounded-[10px] border border-border shadow-raised-sm mb-4 block" />
                </section>

                <div className="h-px bg-border my-8" />

                <section id="ext-sidepanel">
                  <Heading2 id="ext-sidepanel">Side Panel</Heading2>
                  <P>After clicking &quot;Send to DuoSign&quot;, a side panel slides open on the right side of your browser. The avatar begins signing the text you selected. Resize the panel by dragging its left edge. The panel stays open as you browse — send more text any time.</P>
                  <img src="/ext-guide/side-panel.png" alt="DuoSign side panel open in the browser with the avatar signing" className="w-full rounded-[10px] border border-border shadow-raised-sm mb-4 block" />
                  <Callout emoji="💡">
                    You can also type directly into the side panel&apos;s text box and press Sign — you don&apos;t need to select text from the page every time.
                  </Callout>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="ext-youtube">
                  <Heading2 id="ext-youtube">YouTube Captions</Heading2>
                  <P>DuoSign can read the live captions from any YouTube video and sign them as the video plays — the avatar appears as an overlay right on top of the player.</P>
                  <div className="space-y-2 mb-4">
                    {[
                      { step: "a", text: <>Go to any YouTube video and turn on captions by clicking the <strong className="text-text-1">CC</strong> button at the bottom of the player.</> },
                      { step: "b", text: <>Click the DuoSign icon in your toolbar, then click <strong className="text-text-1">Start Signing</strong>.</> },
                      { step: "c", text: <>A signing avatar overlay appears on the video. As captions appear, the avatar signs them in real time.</> },
                      { step: "d", text: <>Drag the overlay to reposition it. Click <strong className="text-text-1">×</strong> to close it.</> },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex gap-3 text-[13px] text-text-2">
                        <span className="w-5 h-5 rounded-full border border-border text-[11px] font-bold flex items-center justify-center flex-shrink-0 text-text-3 mt-0.5">{step}</span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                  <img src="/ext-guide/yt-capstions.png" alt="YouTube video with DuoSign signing overlay active on top of the player" className="w-full rounded-[10px] border border-border shadow-raised-sm mb-4 block" />
                  <Note>
                    YouTube auto-generated captions work fine. If the avatar isn&apos;t signing, make sure captions are actually on — the CC button must be white/active, not grey.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="ext-settings">
                  <Heading2 id="ext-settings">Extension Settings</Heading2>
                  <P>Right-click the DuoSign icon and choose <strong className="text-text-1">Options</strong>, or go to <Code>chrome://extensions</Code> → DuoSign → <strong className="text-text-1">Details → Extension options</strong>.</P>
                  <div className="p-4 rounded-[12px] bg-surface border border-border shadow-raised-sm mb-4">
                    <ul className="space-y-1.5 text-[13px] text-text-2">
                      <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Change the signing speed (slow, normal, fast)</li>
                      <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Switch between skeleton and 3D avatar modes</li>
                      <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Download or delete extra avatar models</li>
                      <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Remap the keyboard shortcut</li>
                      <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Sign out of your account</li>
                    </ul>
                  </div>
                  <Callout emoji="⚡">
                    <strong>First translation may be slow.</strong> The server sleeps when idle. The first sign after a quiet period can take up to 30 seconds to warm up — subsequent ones are fast.
                  </Callout>
                </section>

                <div className="flex items-center justify-between pt-2 pb-12">
                  <span className="text-[12px] text-text-3">DuoSign Chrome Extension · v0.1.0</span>
                  <button onClick={() => switchTab("user")} className="flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline cursor-pointer">
                    ← Back to User Guide
                  </button>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* DEVELOPER DOCS TAB                                     */}
            {/* ══════════════════════════════════════════════════════ */}
            {tab === "dev" && (
              <>
                <section id="dev-intro">
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">Overview</div>
                  <Heading1>DuoSign Technical Docs</Heading1>
                  <P>
                    DuoSign is a browser-native English-to-ASL translation tool. Type any English sentence,
                    and DuoSign converts it to ASL Gloss tokens and animates a 3D avatar in real time —
                    no plugins, no install, no account required to start.
                  </P>
                  <P>
                    The system runs a two-stage pipeline: a fast rule-based converter handles the majority of
                    phrases in under 50ms, with an optional LLM quality-check that refines edge cases.
                  </P>
                  <Note>
                    DuoSign produces <strong>ASL Gloss</strong> — a written approximation of ASL structure,
                    not a direct word-for-word translation. Gloss omits articles, copulas, and inflections that don&apos;t exist in ASL.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="dev-quickstart">
                  <Heading2 id="dev-quickstart">Quick Start</Heading2>
                  <ol className="list-decimal list-inside space-y-2 text-[14px] text-text-2 leading-relaxed mb-4 pl-1">
                    <li>Open the <Link href="/translate" className="text-accent hover:underline">Translate</Link> page.</li>
                    <li>Type any English sentence, e.g. <Code>I need help finding a doctor.</Code></li>
                    <li>Press <kbd className="px-1.5 py-0.5 rounded-[5px] bg-surface-3 border border-border font-mono text-[11px]">Enter</kbd> or click <strong className="text-text-1">Translate</strong>.</li>
                    <li>Gloss tokens appear below the input. The 3D avatar automatically begins signing.</li>
                    <li>Use the playback controls to pause, step through, or replay.</li>
                  </ol>
                  <Note>
                    Signing animation requires pose data served by the backend. If the avatar shows a spinner but never signs,
                    check that the FastAPI backend is running on port 8000 and <Code>bucket/poses/</Code> is populated.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="engines">
                  <Heading2 id="engines">Translation Engines</Heading2>
                  <P>Three modes — selectable in <Link href="/settings" className="text-accent hover:underline">Settings → NLP Engine</Link>.</P>
                  <div className="space-y-3 mb-6">
                    {[
                      { label: "Hybrid (Rule + LLM)", chip: "default" as const, chipLabel: "Default",        desc: "Rule-based result appears instantly; LLM-improved version replaces it when it arrives (1–3 s). Best for everyday use." },
                      { label: "Rule-based only",     chip: "green"   as const, chipLabel: "Fastest",        desc: "POST /api/translate/fast — pure Python rule engine, <50ms, works offline. Handles ~75–85% of common phrases." },
                      { label: "LLM only",            chip: "purple"  as const, chipLabel: "Highest quality", desc: "Waits for LLM result only (1–4 s). Most grammatically accurate ASL Gloss for complex or idiomatic sentences." },
                    ].map((m) => (
                      <div key={m.label} className="p-4 rounded-[12px] bg-surface border border-border shadow-raised-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[13.5px] font-semibold text-text-1">{m.label}</span>
                          <Chip label={m.chipLabel} color={m.chip} />
                        </div>
                        <p className="text-[13px] text-text-2 leading-relaxed">{m.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="gloss">
                  <Heading2 id="gloss">ASL Gloss Format</Heading2>
                  <P>The translation output is ASL Gloss — uppercase, space-separated sign tokens.</P>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[13px] border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Internal token</th>
                          <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Display form</th>
                          <th className="text-left py-2 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Meaning</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-2">
                        {[
                          ["IX-1", "I",       "First person (me/I)"],
                          ["IX-2", "YOU",     "Second person"],
                          ["IX-3", "HE/SHE",  "Third person singular"],
                          ["IX-1+","WE",      "First person plural"],
                          ["IX-3+","THEY",    "Third person plural"],
                          ["H-E-L-L-O","H · E · L · L · O","Fingerspelled word"],
                        ].map(([tok, disp, meaning]) => (
                          <tr key={tok} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 font-mono text-accent">{tok}</td>
                            <td className="py-2 pr-4 font-semibold text-text-1">{disp}</td>
                            <td className="py-2">{meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="fingerspell">
                  <Heading2 id="fingerspell">Fingerspelling</Heading2>
                  <P>
                    Unknown words fall back to fingerspelling — tokens appear as <Code>N-A-S-A</Code>, <Code>C-O-V-I-D</Code>.
                    Toggle in Settings → Preferences → <strong className="text-text-1">Fingerspelling Fallback</strong>.
                  </P>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="voice">
                  <Heading2 id="voice">Voice Input</Heading2>
                  <P>
                    DuoSign captures audio via the browser <Code>MediaRecorder</Code> API and sends it to the backend,
                    where Groq Whisper transcribes it. Supported formats: <Code>audio/webm;codecs=opus</Code>, <Code>audio/ogg;codecs=opus</Code>, <Code>audio/mp4</Code>. Max 25 MB.
                  </P>
                  <Note>
                    Voice input requires <Code>GROQ_API_KEY</Code> set in the backend <Code>.env</Code>. Without it, <Code>POST /api/translate/audio</Code> returns 502.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="avatar">
                  <Heading2 id="avatar">3D Avatar & Pose Player</Heading2>
                  <P>
                    The avatar panel renders a VRM 0.x model animated frame-by-frame using pose data extracted from WLASL.
                    Each sign is a <Code>.pose</Code> binary — a sequence of MediaPipe holistic landmark frames — served from <Code>GET /api/pose/:gloss</Code>.
                  </P>
                  <P>
                    Pipeline: FastAPI serves the binary → <Code>poseReader.ts</Code> decodes it → Kalidokit converts landmarks to bone rotations → Three.js / VRM animates the skeleton.
                  </P>
                  <Note>
                    Not every gloss token has a pose file — tokens without files are skipped with an 80ms pause.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="playback">
                  <Heading2 id="playback">Playback Controls</Heading2>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[13px] border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Control</th>
                          <th className="text-left py-2 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-2">
                        {[
                          ["▶ / ⏸  Play/Pause",  "Start or pause the signing sequence"],
                          ["⏮ / ⏭  Prev / Next", "Step one sign backward or forward"],
                          ["↺  Replay",           "Restart from the first sign"],
                          ["0.5× – 2×  Speed",    "Cycle through playback speed multipliers"],
                          ["Loop  (Settings)",    "Replay the sequence automatically on completion"],
                        ].map(([ctrl, desc]) => (
                          <tr key={ctrl} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 font-mono text-[12px] text-text-1 whitespace-nowrap">{ctrl}</td>
                            <td className="py-2">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="models">
                  <Heading2 id="models">Avatar Models</Heading2>
                  <P>Four VRM models bundled — switch in <Link href="/settings" className="text-accent hover:underline">Settings → Avatar</Link>.</P>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { name: "DS Proto",   file: "DS-Proto-2.1.vrm",      note: "Default male-presenting prototype" },
                      { name: "Ashtra",     file: "Ashtra.vrm",            note: "Stylized androgynous model" },
                      { name: "Val",        file: "VAL.vrm",               note: "Female-presenting model" },
                      { name: "DS G Proto", file: "DuoSign-G-Proto-2.vrm", note: "Prototype with gloves" },
                    ].map((m) => (
                      <div key={m.name} className="p-3.5 rounded-[10px] bg-surface border border-border shadow-raised-sm">
                        <div className="text-[13px] font-semibold text-text-1 mb-0.5">{m.name}</div>
                        <div className="text-[11.5px] text-text-3 font-mono mb-1">{m.file}</div>
                        <div className="text-[12px] text-text-2">{m.note}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="settings">
                  <Heading2 id="settings">Preferences</Heading2>
                  <P>All settings persist to <Code>localStorage</Code> under <Code>duosign:settings</Code> and apply instantly.</P>
                  <div className="space-y-2 mb-4">
                    {[
                      ["Translation Engine",       "Selects which backend path is used for each translation."],
                      ["Animation Speed",          "Multiplier (0.5× – 2×) applied to pose file FPS."],
                      ["Show Gloss Strip",         "Toggles the token chips below the input panel."],
                      ["Auto-translate on Paste",  "Fires translate() automatically when you paste text."],
                      ["Loop Animations",          "Replays the full gloss sequence after completion."],
                      ["Fingerspelling Fallback",  "Fingerspells words not found in the WLASL lexicon."],
                      ["Accent Color",             "Swaps the entire brand color set (5 themes)."],
                      ["Avatar Model",             "Hot-swaps the VRM file used in the canvas."],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex gap-3 py-2 border-b border-border last:border-0">
                        <span className="text-[13px] font-semibold text-text-1 w-[190px] flex-shrink-0">{key}</span>
                        <span className="text-[13px] text-text-2">{desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="accessibility">
                  <Heading2 id="accessibility">Accessibility</Heading2>
                  <div className="space-y-2 mb-4">
                    {[
                      ["Caption Size",       "Sets --caption-font-size CSS variable (0.75rem – 1.5rem)."],
                      ["High Contrast",      "Boosts text/border contrast in both light and dark themes."],
                      ["Reduce Motion",      "Collapses all UI transitions to 0.01ms. Signing animations are unaffected."],
                      ["Keyboard Shortcuts", "Enables Space (play/pause) and Enter (translate) global hotkeys."],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex gap-3 py-2 border-b border-border last:border-0">
                        <span className="text-[13px] font-semibold text-text-1 w-[160px] flex-shrink-0">{key}</span>
                        <span className="text-[13px] text-text-2">{desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="shortcuts">
                  <Heading2 id="shortcuts">Keyboard Shortcuts</Heading2>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[13px] border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-6 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Key</th>
                          <th className="text-left py-2 pr-6 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Context</th>
                          <th className="text-left py-2 text-text-3 font-semibold text-[11px] tracking-[0.06em] uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-2">
                        {[
                          ["Enter",            "Anywhere (not in textarea)", "Translate current input"],
                          ["Space",            "Anywhere (not in textarea)", "Play / pause signing"],
                          ["Cmd/Ctrl + Enter", "Inside textarea",             "Translate from inside the text field"],
                        ].map(([key, ctx, action]) => (
                          <tr key={key} className="border-b border-border last:border-0">
                            <td className="py-2 pr-6">
                              <kbd className="px-2 py-0.5 rounded-[5px] bg-surface-3 border border-border-hi font-mono text-[11px] text-text-1 shadow-raised-sm">{key}</kbd>
                            </td>
                            <td className="py-2 pr-6 text-text-3 text-[12px]">{ctx}</td>
                            <td className="py-2">{action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="flex items-center justify-between pt-2 pb-12">
                  <span className="text-[12px] text-text-3">DuoSign — v0.1.0-alpha</span>
                  <button onClick={() => switchTab("api")} className="flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline cursor-pointer">
                    API Reference →
                  </button>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* API REFERENCE TAB                                      */}
            {/* ══════════════════════════════════════════════════════ */}
            {tab === "api" && (
              <>
                <section id="api-overview">
                  <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">API Reference</div>
                  <Heading1>DuoSign REST API</Heading1>
                  <P>
                    The DuoSign backend is a FastAPI application exposing endpoints for text-to-gloss
                    translation, vocabulary lookup, and media serving. All endpoints return JSON unless otherwise noted.
                  </P>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-[10px] bg-surface border border-border shadow-raised-sm mb-4">
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 font-mono mb-0.5">Live API</div>
                      <code className="text-[13px] font-mono text-accent">https://duosign.onrender.com/api</code>
                    </div>
                    <a
                      href="https://duosign.onrender.com/api/health"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,var(--surface-3))] text-[var(--success)] hover:opacity-80 transition-opacity"
                    >
                      Check health ↗
                    </a>
                  </div>
                  <P>All paths are prefixed with <Code>/api</Code>. Authentication is not required — call any endpoint directly.</P>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-base-url">
                  <Heading2 id="api-base-url">Base URL & Auth</Heading2>
                  <div className="space-y-3 mb-6">
                    <div className="p-4 rounded-[12px] bg-surface border border-border shadow-raised-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--success)] flex-shrink-0" />
                        <span className="text-[12px] font-bold font-mono text-text-3 uppercase tracking-[0.06em]">Development</span>
                      </div>
                      <code className="text-[13px] font-mono text-accent">http://localhost:8000</code>
                      <p className="text-[12.5px] text-text-2 mt-1">Run locally: <code className="text-accent text-[12px]">uvicorn api.main:app --reload --port 8000</code></p>
                    </div>
                    <div className="p-4 rounded-[12px] bg-surface border border-border shadow-raised-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
                        <span className="text-[12px] font-bold font-mono text-text-3 uppercase tracking-[0.06em]">Production (Render)</span>
                      </div>
                      <code className="text-[13px] font-mono text-accent">https://duosign.onrender.com</code>
                      <p className="text-[12.5px] text-text-2 mt-1">Live backend — already wired to <code className="text-accent text-[12px]">duosign.vercel.app</code> via Next.js rewrites.</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Deploying to Render</div>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[12.5px] border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Field</th>
                          <th className="text-left py-2 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Value</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-2">
                        {[
                          ["Build Command",  "pip install -r requirements.txt && python -m spacy download en_core_web_sm"],
                          ["Start Command",  "uvicorn api.main:app --host 0.0.0.0 --port $PORT"],
                          ["Root Directory", "backend"],
                          ["Python Version", "3.11+"],
                        ].map(([field, val]) => (
                          <tr key={field} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 font-semibold text-text-1 whitespace-nowrap">{field}</td>
                            <td className="py-2 font-mono text-accent text-[12px]">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Environment Variables</div>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[12.5px] border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Variable</th>
                          <th className="text-left py-2 pr-4 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Required</th>
                          <th className="text-left py-2 text-text-3 font-semibold text-[10.5px] tracking-[0.06em] uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-2">
                        {[
                          ["GROQ_API_KEY",    "For voice", "Enables /translate/audio. Get one free at console.groq.com"],
                          ["ALLOWED_ORIGINS", "Yes",       "Comma-separated allowed origins — production value: https://duosign.vercel.app"],
                          ["BACKEND_URL",     "Frontend",  "Set in your Next.js env — points to the Render service URL"],
                        ].map(([key, req, desc]) => (
                          <tr key={key} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 font-mono text-accent">{key}</td>
                            <td className="py-2 pr-4 text-text-3">{req}</td>
                            <td className="py-2">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Note>
                    <strong>Render free tier cold starts:</strong> the backend may take 30–60 seconds after inactivity.
                    Call <Code>GET /api/health</Code> on page load to wake it up proactively.
                  </Note>
                  <P>
                    The Chrome extension is handled via <Code>allow_origin_regex</Code> — all <Code>chrome-extension://</Code> origins are allowed automatically, no ID hardcoding needed.
                  </P>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-errors">
                  <Heading2 id="api-errors">Error Responses</Heading2>
                  <P>All errors follow the FastAPI default shape:</P>
                  <CodeBlock title="json">{`{\n  "detail": "Human-readable error message"\n}`}</CodeBlock>
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

                <section id="api-translate">
                  <Heading2 id="api-translate">POST /api/translate</Heading2>
                  <EndpointHeader method="POST" path="/api/translate" summary="Full pipeline — rule-based + background LLM quality check" />
                  <P>
                    Runs the rule-based converter synchronously and, if the result has 2+ tokens and the LLM is available,
                    fires a background LLM quality check with a 3-second timeout.
                  </P>
                  <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Request Body</div>
                  <ParamsTable rows={[["text", "string", "yes", "English text to translate (1–500 characters)"]]} />
                  <CodeBlock title="request">{`POST /api/translate\nContent-Type: application/json\n\n{\n  "text": "I need to find a doctor."\n}`}</CodeBlock>
                  <CodeBlock title="response — 200 OK">{`{\n  "input_text":     "I need to find a doctor.",\n  "gloss":          "I NEED FIND DOCTOR",\n  "gloss_internal": "IX-1 NEED FIND DOCTOR",\n  "tokens":         ["IX-1", "NEED", "FIND", "DOCTOR"],\n  "method":         "rule_based",\n  "confidence":     0.91,\n  "transcribed_text": ""\n}`}</CodeBlock>
                  <ParamsTable rows={[
                    ["input_text",       "string",   "—", "Original English text echoed back"],
                    ["gloss",            "string",   "—", "Display-form gloss (IX-1 → I, IX-2 → YOU, etc.)"],
                    ["gloss_internal",   "string",   "—", "Internal gloss with IX markers intact"],
                    ["tokens",           "string[]", "—", "Individual gloss tokens in internal form"],
                    ["method",           "string",   "—", '"rule_based", "llm", or "llm_quality"'],
                    ["confidence",       "float",    "—", "0–1 confidence score from the rule engine"],
                    ["transcribed_text", "string",   "—", "Non-empty only for /translate/audio responses"],
                  ]} />
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-translate-fast">
                  <Heading2 id="api-translate-fast">POST /api/translate/fast</Heading2>
                  <EndpointHeader method="POST" path="/api/translate/fast" summary="Rule-based only — no LLM, <50ms, offline-capable" />
                  <P>
                    Skips all LLM paths. Always responds in under 50ms.
                    Identical shape to <Code>POST /api/translate</Code> with <Code>method</Code> always <Code>&quot;rule_based&quot;</Code>.
                  </P>
                  <CodeBlock title="request">{`POST /api/translate/fast\nContent-Type: application/json\n\n{\n  "text": "Good morning, how are you?"\n}`}</CodeBlock>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-translate-stream">
                  <Heading2 id="api-translate-stream">POST /api/translate/stream</Heading2>
                  <EndpointHeader method="POST" path="/api/translate/stream" summary="Server-Sent Events — two-phase progressive response" />
                  <P>Returns a <Code>text/event-stream</Code> SSE response with up to three events:</P>
                  <div className="space-y-2 mb-4">
                    {[
                      { event: "rule_based",  timing: "Instant",   desc: "Rule-based result — always emitted first" },
                      { event: "llm_quality", timing: "1–3 s",     desc: "LLM-improved result (omitted if LLM unavailable or unchanged)" },
                      { event: "done",        timing: "After all", desc: "Empty data object — signals stream end" },
                    ].map((e) => (
                      <div key={e.event} className="flex gap-3 px-4 py-2.5 rounded-[10px] bg-surface border border-border shadow-raised-sm">
                        <code className="text-accent font-mono text-[12px] font-semibold w-[110px] flex-shrink-0">{e.event}</code>
                        <span className="text-text-3 text-[11.5px] w-[50px] flex-shrink-0">{e.timing}</span>
                        <span className="text-text-2 text-[12.5px]">{e.desc}</span>
                      </div>
                    ))}
                  </div>
                  <CodeBlock title="SSE response stream">{`event: rule_based\ndata: {"gloss":"I DOCTOR SEARCH","method":"rule_based","confidence":0.88, ...}\n\nevent: llm_quality\ndata: {"gloss":"I NEED FIND DOCTOR","method":"llm_quality","confidence":0.88, ...}\n\nevent: done\ndata: {}`}</CodeBlock>
                  <Note>
                    Browsers cannot POST with the native <Code>EventSource</Code> API.
                    Use <Code>fetch()</Code> + <Code>ReadableStream</Code> instead.
                    See <Code>frontend/src/shared/api/glossApi.ts → translateStream()</Code> for the reference implementation.
                  </Note>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-translate-audio">
                  <Heading2 id="api-translate-audio">POST /api/translate/audio</Heading2>
                  <EndpointHeader method="POST" path="/api/translate/audio" summary="Speech → Text → ASL Gloss via Groq Whisper" />
                  <P>Accepts a multipart/form-data audio file, transcribes it with Groq Whisper, then runs the transcription through the full translation pipeline.</P>
                  <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-text-3 mb-2 mt-4">Form fields</div>
                  <ParamsTable rows={[
                    ["audio",    "File",   "yes", "Audio file (webm, mp3, mp4, ogg, wav — max 25 MB)"],
                    ["language", "string", "no",  'BCP-47 language code for Whisper (e.g. "en"). Auto-detected if omitted.'],
                  ]} />
                  <CodeBlock title="shell">{`curl -X POST https://duosign.onrender.com/api/translate/audio \\\n  -F "audio=@recording.webm" \\\n  -F "language=en"`}</CodeBlock>
                  <CodeBlock title="response — 200 OK">{`{\n  "input_text":       "Where is the nearest pharmacy?",\n  "gloss":            "PHARMACY WHERE",\n  "tokens":           ["PHARMACY", "WHERE"],\n  "method":           "rule_based",\n  "confidence":       0.85,\n  "transcribed_text": "Where is the nearest pharmacy?"\n}`}</CodeBlock>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-vocabulary">
                  <Heading2 id="api-vocabulary">GET /api/vocabulary</Heading2>
                  <EndpointHeader method="GET" path="/api/vocabulary" summary="List all available ASL glosses" />
                  <P>Returns every gloss token in the loaded vocabulary.</P>
                  <CodeBlock title="response — 200 OK">{`{\n  "total":             2000,\n  "has_full_alphabet": true,\n  "glosses":           ["ABLE", "ABOVE", "ACCIDENT", "..."]\n}`}</CodeBlock>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-vocabulary-search">
                  <Heading2 id="api-vocabulary-search">GET /api/vocabulary/search</Heading2>
                  <EndpointHeader method="GET" path="/api/vocabulary/search" summary="Search glosses by prefix" />
                  <ParamsTable rows={[
                    ["q",     "string",  "no", "Prefix to search (case-insensitive). Returns all if omitted."],
                    ["limit", "integer", "no", "Max results returned. Default 50."],
                  ]} />
                  <CodeBlock title="request">{`GET /api/vocabulary/search?q=DOC&limit=10`}</CodeBlock>
                  <CodeBlock title="response — 200 OK">{`{\n  "query":   "DOC",\n  "results": ["DOCTOR", "DOCUMENT", "DOG"]\n}`}</CodeBlock>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-pose">
                  <Heading2 id="api-pose">GET /api/pose/:gloss</Heading2>
                  <EndpointHeader method="GET" path="/api/pose/:gloss" summary="Serve a .pose binary for a given gloss token" />
                  <P>
                    Returns the raw <Code>.pose</Code> binary from <Code>bucket/poses/</Code>.
                    The file encodes MediaPipe holistic landmark frames, decoded in the browser by <Code>poseReader.ts</Code>.
                  </P>
                  <ParamsTable rows={[[":gloss", "string", "yes", "Gloss token name, e.g. DOCTOR, HELLO, YOU"]]} />
                  <CodeBlock title="request">{`GET /api/pose/DOCTOR`}</CodeBlock>
                  <P>Response is <Code>application/octet-stream</Code> with <Code>Cache-Control: public, max-age=86400</Code>. Returns 404 if the pose file doesn&apos;t exist.</P>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-video">
                  <Heading2 id="api-video">GET /api/video/:gloss</Heading2>
                  <EndpointHeader method="GET" path="/api/video/:gloss" summary="Serve a reference MP4 clip for a given gloss token" />
                  <P>Returns the <Code>.mp4</Code> from <Code>bucket/videos/</Code>. Used by the video engine fallback when pose data is unavailable.</P>
                  <CodeBlock title="request">{`GET /api/video/HELLO`}</CodeBlock>
                </section>

                <div className="h-px bg-border my-8" />

                <section id="api-health">
                  <Heading2 id="api-health">GET /api/health</Heading2>
                  <EndpointHeader method="GET" path="/api/health" summary="Health check — verify backend and vocabulary status" />
                  <CodeBlock title="response — 200 OK">{`{\n  "status":            "ok",\n  "version":           "3.0.0",\n  "vocabulary_loaded": true,\n  "gloss_count":       2000\n}`}</CodeBlock>
                  <Note>
                    If <Code>vocabulary_loaded</Code> is <Code>false</Code>, all translations return only fingerspelled output.
                  </Note>
                  <P>On Render free tier, the service sleeps after 15 minutes of inactivity (30–60 s cold start). Ping on page load to avoid visible delays:</P>
                  <CodeBlock title="javascript — warm-up">{`async function warmUpBackend() {\n  const res = await fetch("/api/health");\n  const data = await res.json();\n  console.log("Backend ready:", data.status, "| Glosses:", data.gloss_count);\n}\nwarmUpBackend();`}</CodeBlock>
                  <P>Calling from outside the Vercel app (extension, curl, third-party)?</P>
                  <CodeBlock title="direct — any client">{`fetch("https://duosign.onrender.com/api/health")\n  .then(r => r.json())\n  .then(d => console.log("DuoSign backend:", d.status, "| Glosses:", d.gloss_count));`}</CodeBlock>
                </section>

                <div className="flex items-center justify-between pt-2 pb-12">
                  <span className="text-[12px] text-text-3">DuoSign API v3.0.0</span>
                  <button onClick={() => switchTab("dev")} className="flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline cursor-pointer">
                    ← Developer Docs
                  </button>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
