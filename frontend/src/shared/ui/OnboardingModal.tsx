"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface OnboardingModalProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

function DotIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "w-5 h-2 bg-accent"
              : "w-2 h-2 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function FeatureRow({ label, available }: { label: string; available: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`text-sm font-semibold w-4 shrink-0 ${available ? "text-green-500" : "text-text-3"}`}>
        {available ? "✓" : "✗"}
      </span>
      <span className={`text-sm ${available ? "text-text-2" : "text-text-3 line-through"}`}>{label}</span>
    </div>
  );
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener("keydown", trap);
    first?.focus();
    return () => el.removeEventListener("keydown", trap);
  }, [step]);

  // Prevent Escape from closing — user must click Get Started
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    document.addEventListener("keydown", block);
    return () => document.removeEventListener("keydown", block);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));
  const skipToConsent = () => setStep(TOTAL_STEPS - 1);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to DuoSign — onboarding"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        ref={modalRef}
        className="relative z-10 w-full sm:max-w-md mx-4 bg-surface border border-border rounded-panel shadow-raised flex flex-col overflow-hidden
                   sm:max-h-[90vh]
                   max-sm:fixed max-sm:inset-0 max-sm:rounded-none max-sm:mx-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {/* Simple logo mark */}
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">DS</span>
            </div>
            <span className="text-sm font-semibold text-text-1">DuoSign</span>
          </div>
          {step < TOTAL_STEPS - 1 && (
            <button
              onClick={skipToConsent}
              className="text-xs text-text-3 hover:text-text-2 transition-colors underline underline-offset-2"
            >
              Skip intro
            </button>
          )}
        </div>

        {/* Step content */}
        <div className="flex-1 px-5 pb-2 overflow-y-auto">

          {/* ── Step 0: What DuoSign does ── */}
          {step === 0 && (
            <div className="py-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5 text-3xl">
                🤟
              </div>
              <h2 className="text-xl font-semibold text-text-1 text-center mb-3">
                English to ASL, instantly.
              </h2>
              <p className="text-sm text-text-2 text-center leading-relaxed">
                Type or speak any English sentence. DuoSign converts it to ASL gloss and
                animates it through a 3D signing avatar — no installation, no special hardware required.
              </p>
            </div>
          )}

          {/* ── Step 1: Guest vs Registered ── */}
          {step === 1 && (
            <div className="py-4">
              <h2 className="text-xl font-semibold text-text-1 text-center mb-3">
                Try it as a guest, or create a free account.
              </h2>
              <p className="text-sm text-text-2 text-center mb-5">
                Guests can translate up to 3 phrases per session. Create a free account to unlock
                unlimited translation, searchable history, and MP4 video export.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Guest column */}
                <div className="bg-surface-2 border border-border rounded-[12px] p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-3 mb-3">Guest</p>
                  <FeatureRow label="Translate (3/session)" available={true} />
                  <FeatureRow label="Avatar playback" available={true} />
                  <FeatureRow label="Skeleton view" available={true} />
                  <FeatureRow label="Unlimited" available={false} />
                  <FeatureRow label="History" available={false} />
                  <FeatureRow label="MP4 export" available={false} />
                </div>

                {/* Registered column */}
                <div className="bg-accent/5 border border-accent/30 rounded-[12px] p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Registered</p>
                  <FeatureRow label="Everything above" available={true} />
                  <FeatureRow label="Unlimited" available={true} />
                  <FeatureRow label="History" available={true} />
                  <FeatureRow label="MP4 export" available={true} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Data & Attribution ── */}
          {step === 2 && (
            <div className="py-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-5 text-2xl">
                📖
              </div>
              <h2 className="text-xl font-semibold text-text-1 text-center mb-3">
                Built on real ASL data.
              </h2>
              <p className="text-sm text-text-2 leading-relaxed mb-4">
                DuoSign uses sign motion data derived from the{" "}
                <strong className="text-text-1">WLASL dataset</strong> (Li et al., WACV 2020),
                licensed under the Computational Use of Data Agreement (C-UDA). This data reflects
                real signing from the Deaf community.
              </p>
              <p className="text-sm text-text-2 leading-relaxed mb-4">
                By using DuoSign, you agree to use it for academic, accessibility, or
                non-commercial purposes only.
              </p>
              <div className="bg-surface-2 border border-border rounded-[10px] px-3 py-2">
                <p className="text-xs text-text-3">
                  Dataset: Li et al., WACV 2020 —{" "}
                  <a
                    href="https://github.com/dxli94/WLASL"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-mono"
                  >
                    github.com/dxli94/WLASL
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Consent (always last) ── */}
          {step === TOTAL_STEPS - 1 && (
            <div className="py-4">
              <h2 className="text-xl font-semibold text-text-1 mb-4">
                Before you get started
              </h2>
              <p className="text-sm text-text-2 mb-4">
                By clicking <strong className="text-text-1">Get Started</strong>, you confirm that
                you agree to DuoSign&apos;s{" "}
                <Link href="/terms" target="_blank" className="text-accent hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-accent hover:underline">
                  Privacy Policy
                </Link>.
              </p>

              <div className="bg-surface-2 border border-border rounded-[12px] p-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-3 mb-3">
                  This means you:
                </p>
                <ul className="space-y-2">
                  {[
                    "Will use DuoSign for academic, educational, or accessibility purposes only",
                    "Will not attempt to download, scrape, or redistribute sign motion data or CDN assets",
                    "Acknowledge that sign data is derived from WLASL and is C-UDA licensed",
                    "Understand this is an academic prototype, not a certified accessibility tool",
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-text-2">
                      <span className="text-accent shrink-0 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-text-3 text-center">
                <Link href="/terms" target="_blank" className="text-accent hover:underline">Terms of Service</Link>
                {" · "}
                <Link href="/privacy" target="_blank" className="text-accent hover:underline">Privacy Policy</Link>
                {" · "}
                <Link href="/licenses" target="_blank" className="text-accent hover:underline">Licenses</Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-5 pb-5 pt-2 border-t border-border flex items-center justify-between gap-3">
          <DotIndicator current={step} total={TOTAL_STEPS} />

          <div className="flex items-center gap-2">
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <button
                ref={firstFocusRef}
                onClick={goPrev}
                className="px-3 py-1.5 text-sm text-text-2 hover:text-text-1 transition-colors"
              >
                ← Back
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={goNext}
                className="px-4 py-2 rounded-[10px] bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-5 py-2 rounded-[10px] bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                Get Started →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
