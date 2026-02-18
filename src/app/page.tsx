"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import "./landing.css";

const GLOSS: Record<string, string | null> = {
  hello: "HELLO", hi: "HI", how: "HOW", you: "YOU", are: null,
  good: "GOOD", morning: "MORNING", my: "MY", name: "NAME", is: null,
  what: "WHAT", thank: "THANK", thanks: "THANK", please: "PLEASE",
  yes: "YES", no: "NO", sorry: "SORRY", help: "HELP", i: "ME",
  love: "LOVE", sign: "SIGN", language: "LANGUAGE", nice: "NICE",
  meet: "MEET", understand: "UNDERSTAND", again: "AGAIN", today: "TODAY",
  want: "WANT", need: "NEED", time: "TIME", know: "KNOW",
};
const STOP = new Set(["a","an","the","of","in","to","for","with","on","at","by","it","this","that"]);

function toGloss(text: string) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  words.forEach((w) => {
    if (GLOSS[w] != null) out.push(GLOSS[w]!);
    else if (!STOP.has(w) && w.length > 0) out.push(w.toUpperCase());
  });
  if (text.includes("?")) out.push("Q");
  return out.slice(0, 9);
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll(".l-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useCounterAnimation() {
  useEffect(() => {
    const countEls = document.querySelectorAll("[data-count]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const target = parseInt((e.target as HTMLElement).dataset.count || "0");
            if (!target) return;
            const el = e.target as HTMLElement;
            const dur = 2000;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - start) / dur, 1);
              const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
              el.textContent = v >= 1000 ? v.toLocaleString() : String(v);
              if (p < 1) requestAnimationFrame(tick);
              else el.textContent = target.toLocaleString();
            };
            requestAnimationFrame(tick);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    countEls.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function LandingPage() {
  const containerRef = useScrollReveal();
  useCounterAnimation();

  const [glossChips, setGlossChips] = useState<string[]>([]);
  const [litIndex, setLitIndex] = useState(0);
  const chipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runTranslate = useCallback((text: string) => {
    if (!text.trim()) return;
    const glosses = toGloss(text);
    setGlossChips(glosses);
    setLitIndex(0);
    if (chipTimerRef.current) clearInterval(chipTimerRef.current);
    let idx = 0;
    chipTimerRef.current = setInterval(() => {
      idx = (idx + 1) % glosses.length;
      setLitIndex(idx);
    }, 750);
  }, []);

  const handleInput = useCallback(
    (val: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runTranslate(val), 600);
    },
    [runTranslate]
  );

  // Initial demo
  useEffect(() => {
    runTranslate("Hello, how are you?");
    return () => {
      if (chipTimerRef.current) clearInterval(chipTimerRef.current);
    };
  }, [runTranslate]);

  return (
    <div className="landing" ref={containerRef}>
      {/* NAV */}
      <nav className="l-nav">
        <Link href="/" className="l-nav-logo">
          <img src="/logos/DuoSign_logomark.svg" alt="DuoSign" className="logo-white" style={{ width: 28, height: 28 }} />
          <img src="/logos/DuoSign_textmark.svg" alt="DuoSign" className="l-nav-logo-text logo-white" style={{ width: 90, height: 22 }} />
        </Link>
        <div className="l-nav-links">
          <a href="#how" className="l-nav-link">How it works</a>
          <a href="#demo" className="l-nav-link">Demo</a>
          <a href="#features" className="l-nav-link">Features</a>
          <a href="#api" className="l-nav-link">API</a>
          <a href="#contact" className="l-nav-link">Contact</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-glow" />
        <div className="l-hero-logo-wrap">
          <img src="/logos/DuoSign_logo.svg" alt="DuoSign" className="logo-white" style={{ width: 280, height: 'auto' }} />
        </div>
        <h1 className="l-hero-headline">
          Translate text into accurate<br />sign language animations.
        </h1>
        <p className="l-hero-sub">
          Built for accessibility, education,<br />and everyday communication.
        </p>
        <div className="l-hero-actions">
          <Link href="/translate" className="l-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
            Go to App
          </Link>
          <a href="#how" className="l-btn-ghost">View API Documentation →</a>
        </div>
        <div className="l-trust-row">
          <span className="l-trust-item">Accessibility-first design</span>
          <span className="l-trust-sep" />
          <span className="l-trust-item">AI-powered sign synthesis</span>
          <span className="l-trust-sep" />
          <span className="l-trust-item">Production-ready platform</span>
        </div>
      </section>

      {/* WAVE */}
      <div className="l-wave">
        <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" fill="#F5F0E8" />
        </svg>
      </div>

      {/* HOW IT WORKS */}
      <section className="l-how" id="how">
        <div className="l-how-inner">
          <div className="l-reveal">
            <div className="l-eyebrow">The Pipeline</div>
            <h2 className="l-section-title">
              From words to motion<br /><em>in three steps</em>
            </h2>
            <p className="l-section-sub">
              DuoSign&apos;s modular architecture processes your text and drives a real-time 3D avatar — all in under a second.
            </p>
          </div>
          <div className="l-steps-grid l-reveal" style={{ transitionDelay: ".1s" }}>
            <div className="l-step-cell">
              <div className="l-step-num">01</div>
              <div className="l-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
              </div>
              <div className="l-step-name">Text to Gloss</div>
              <p className="l-step-desc">A hybrid NLP engine — rule-based spaCy for 75–85% of phrases in under 50ms, with an LLM fallback for edge cases.</p>
              <span className="l-step-tag">spaCy + LLM</span>
            </div>
            <div className="l-step-cell">
              <div className="l-step-num">02</div>
              <div className="l-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M6.343 6.343a8 8 0 1 0 11.314 11.314A8 8 0 0 0 6.343 6.343z" /></svg>
              </div>
              <div className="l-step-name">Pose Lookup</div>
              <p className="l-step-desc">Each token maps to a curated pose sequence from WLASL (21,000 videos). MediaPipe extracts 523 landmarks per frame.</p>
              <span className="l-step-tag">MediaPipe · WLASL</span>
            </div>
            <div className="l-step-cell">
              <div className="l-step-num">03</div>
              <div className="l-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg>
              </div>
              <div className="l-step-name">Avatar Animation</div>
              <p className="l-step-desc">Kalidokit converts pose data to VRM bone rotations. Three.js renders a smooth, accessible avatar in any browser.</p>
              <span className="l-step-tag">Kalidokit · Three.js · VRM</span>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="l-demo" id="demo">
        <div className="l-demo-inner">
          <div className="l-reveal">
            <div className="l-eyebrow l-demo-eyebrow">Live Preview</div>
            <h2 className="l-section-title l-demo-title">
              Type anything.<br /><em style={{ color: "rgba(255,255,255,0.55)" }}>Watch it sign.</em>
            </h2>
            <p className="l-section-sub l-demo-sub">
              Enter English text and DuoSign converts it to ASL gloss, then animates the avatar in real time.
            </p>
            <div className="l-stat-row">
              <div>
                <div className="l-stat-num" data-count="21000">0</div>
                <div className="l-stat-label">Training videos</div>
              </div>
              <div>
                <div className="l-stat-num" data-count="2000">0</div>
                <div className="l-stat-label">ASL glosses</div>
              </div>
              <div>
                <div className="l-stat-num">&lt;50ms</div>
                <div className="l-stat-label">Avg. latency</div>
              </div>
            </div>
          </div>

          {/* Mock UI */}
          <div className="l-mock-wrap l-reveal" style={{ transitionDelay: ".12s" }}>
            <div className="l-mock-titlebar">
              <div className="l-mock-dot" style={{ background: "#FF5F57" }} />
              <div className="l-mock-dot" style={{ background: "#FEBC2E" }} />
              <div className="l-mock-dot" style={{ background: "#28C840" }} />
              <span className="l-mock-label">DuoSign Translate</span>
            </div>
            <div className="l-mock-body">
              <textarea
                className="l-mock-input-area"
                defaultValue="Hello, how are you?"
                onChange={(e) => handleInput(e.target.value)}
              />
              <div className="l-mock-row">
                <button className="l-mock-btn-icon" title="Voice input">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                </button>
                <button className="l-mock-btn-go" onClick={() => {
                  const ta = document.querySelector(".l-mock-input-area") as HTMLTextAreaElement;
                  if (ta) runTranslate(ta.value);
                }}>
                  Translate →
                </button>
              </div>
              <div className="l-mock-gloss-row">
                {glossChips.map((g, i) => (
                  <span
                    key={`${g}-${i}`}
                    className={`l-mock-gloss${i === litIndex ? " lit" : ""}`}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {g}
                  </span>
                ))}
              </div>
              <div className="l-mock-divider" />
              <div className="l-mock-avatar-stage">
                <div className="l-av-body" />
              </div>
              <div className="l-mock-playbar">
                <button className="l-pb-btn"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4" /></svg></button>
                <button className="l-pb-btn play"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg></button>
                <button className="l-pb-btn"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20" /></svg></button>
                <div className="l-pb-bar"><div className="l-pb-fill" /></div>
                <span style={{ fontSize: "10px", color: "var(--white-40)", fontFamily: "var(--font-jetbrains), monospace" }}>1.0×</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="l-features" id="features">
        <div className="l-features-inner">
          <div className="l-reveal">
            <div className="l-eyebrow">What&apos;s Inside</div>
            <h2 className="l-section-title">Built for <em>real-world use</em></h2>
          </div>
          <div className="l-feat-grid">
            {[
              { icon: "mic", name: "Voice Input", desc: "Browser-native speech recognition lets you speak to translate. Zero extra setup — just talk and watch DuoSign sign it back." },
              { icon: "monitor", name: "Chrome Extension", desc: "Select any text on any website, right-click, and see a floating ASL panel. Brings sign language to the whole web." },
              { icon: "code", name: "REST API", desc: "POST English text, get back ASL gloss arrays and pose sequences. Simple JSON interface, fast response times.", orange: true },
              { icon: "chat", name: "Translation History", desc: "Every translation is logged with timestamps, source type, and replay. Filter by voice or typed input at a glance." },
              { icon: "globe", name: "2,000+ Signs", desc: "WLASL lexicon with 2,000+ ASL glosses, enriched with ASL-LEX phonological similarity data for intelligent fallback.", orange: true },
              { icon: "user", name: "Guest Access", desc: "Jump in without an account. Guests get 10 free translations per session — sign up for unlimited access." },
            ].map((f, i) => (
              <div key={f.name} className="l-feat-card l-reveal" style={{ transitionDelay: `${0.05 + i * 0.05}s` }}>
                <div className={`l-feat-icon${f.orange ? " orange" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {f.icon === "mic" && <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></>}
                    {f.icon === "monitor" && <><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>}
                    {f.icon === "code" && <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>}
                    {f.icon === "chat" && <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />}
                    {f.icon === "globe" && <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>}
                    {f.icon === "user" && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
                  </svg>
                </div>
                <div className="l-feat-name">{f.name}</div>
                <p className="l-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="l-stats">
        <div className="l-stats-inner l-reveal">
          <div className="l-stat-cell">
            <div className="l-stat-cell-num" data-count="21000">0</div>
            <div className="l-stat-cell-label">ASL videos processed</div>
          </div>
          <div className="l-stat-cell">
            <div className="l-stat-cell-num" data-count="2000">0</div>
            <div className="l-stat-cell-label">Signs in lexicon</div>
          </div>
          <div className="l-stat-cell">
            <div className="l-stat-cell-num">50ms</div>
            <div className="l-stat-cell-label">Avg. translation time</div>
          </div>
          <div className="l-stat-cell">
            <div className="l-stat-cell-num">100%</div>
            <div className="l-stat-cell-label">Pose extraction rate</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="l-cta" id="api">
        <div className="l-cta-inner l-reveal">
          <h2 className="l-cta-title">Ready to bridge<br /><em>the gap?</em></h2>
          <p className="l-cta-sub">DuoSign is free. Sign up for unlimited translations and saved history — or jump straight into the app as a guest.</p>
          <div className="l-cta-actions">
            <Link href="/translate" className="l-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <polygon points="5,3 19,12 5,21 5,3" />
              </svg>
              Open the App
            </Link>
            <a href="#" className="l-btn-ghost">Read the API Docs →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer" id="contact">
        <div className="l-footer-left">
          <img src="/logos/DuoSign_logomark.svg" alt="DuoSign" className="logo-white" style={{ width: 18, height: 18, opacity: 0.5 }} />
          <span className="l-footer-copy">© 2025 DuoSign. Built at Ashesi University.</span>
        </div>
        <div className="l-footer-links">
          <a href="#" className="l-footer-link">Documentation</a>
          <a href="#" className="l-footer-link">GitHub</a>
          <a href="#" className="l-footer-link">API</a>
          <a href="#" className="l-footer-link">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
