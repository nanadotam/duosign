"use client";

import { useState, useCallback } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import Button from "@/shared/ui/Button";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUS_ITEMS = [
  "I think that I would like to use DuoSign frequently.",
  "I found DuoSign unnecessarily complex.",
  "I thought DuoSign was easy to use.",
  "I think that I would need the support of a technical person to use DuoSign.",
  "I found the various functions in DuoSign were well integrated.",
  "I thought there was too much inconsistency in DuoSign.",
  "I would imagine that most people would learn to use DuoSign very quickly.",
  "I found DuoSign very cumbersome to use.",
  "I felt very confident using DuoSign.",
  "I needed to learn a lot of things before I could get going with DuoSign.",
];

const AVATAR_QUESTIONS = [
  { key: "avatar_naturalness", label: "How natural did the avatar's signing look?" },
  { key: "avatar_clarity", label: "Could you understand what the avatar was signing?" },
  { key: "avatar_smoothness", label: "Did the avatar movement feel smooth?" },
];

const WOULD_USE_OPTIONS = [
  { value: "definitely_not", label: "Definitely not" },
  { value: "probably_not", label: "Probably not" },
  { value: "not_sure", label: "Not sure" },
  { value: "probably_yes", label: "Probably yes" },
  { value: "definitely_yes", label: "Definitely yes" },
];

// ─── Likert scale ─────────────────────────────────────────────────────────────

function LikertScale({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  labels?: [string, string];
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {labels && (
        <span className="text-[10px] text-text-3 w-14 text-right mr-0.5 shrink-0">
          {labels[0]}
        </span>
      )}
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={[
            "w-7 h-7 rounded-full border text-xs font-semibold transition-all cursor-pointer shrink-0",
            value === n
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-surface-3 text-text-3 hover:border-border-hi hover:text-text-2",
          ].join(" ")}
        >
          {n}
        </button>
      ))}
      {labels && (
        <span className="text-[10px] text-text-3 w-14 ml-0.5 shrink-0">{labels[1]}</span>
      )}
    </div>
  );
}

// ─── Component props ──────────────────────────────────────────────────────────

interface AccessibilityFeedbackPanelProps {
  /** "panel" = persistent side panel on desktop; "modal" = mobile overlay */
  variant: "panel" | "modal";
  onClose?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AccessibilityFeedbackPanel({
  variant,
  onClose,
}: AccessibilityFeedbackPanelProps) {
  const { session, trackEvent, markSurveyCompleted } = useTestingMode();

  // Page 0 = SUS, Page 1 = Avatar + open-ended, Page 2 = Would use
  const [page, setPage] = useState(0);

  // SUS answers: keys "sus_1" … "sus_10"
  const [sus, setSus] = useState<Record<string, number>>({});
  // Avatar quality answers
  const [avatar, setAvatar] = useState<Record<string, number>>({});
  // Open-ended
  const [likedMost, setLikedMost] = useState("");
  const [needsImprovement, setNeedsImprovement] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  // Would use
  const [wouldUse, setWouldUse] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      // Build the payload — key names must match the API route exactly
      const payload = {
        session_id: session.sessionId,
        participant_id: session.participantId,
        // SUS items: sus_01 … sus_10 (zero-padded to match DB column names)
        sus_01: sus["sus_1"] ?? null,
        sus_02: sus["sus_2"] ?? null,
        sus_03: sus["sus_3"] ?? null,
        sus_04: sus["sus_4"] ?? null,
        sus_05: sus["sus_5"] ?? null,
        sus_06: sus["sus_6"] ?? null,
        sus_07: sus["sus_7"] ?? null,
        sus_08: sus["sus_8"] ?? null,
        sus_09: sus["sus_9"] ?? null,
        sus_10: sus["sus_10"] ?? null,
        // Avatar quality
        avatar_naturalness: avatar["avatar_naturalness"] ?? null,
        avatar_clarity: avatar["avatar_clarity"] ?? null,
        avatar_smoothness: avatar["avatar_smoothness"] ?? null,
        // Open-ended — concatenate additional notes into needs_improvement
        liked_most: likedMost.trim() || null,
        needs_improvement: [needsImprovement.trim(), additionalNotes.trim()]
          .filter(Boolean)
          .join("\n\n[Additional notes]\n") || null,
        // Would use
        would_use: wouldUse || null,
      };

      await fetch("/api/testing/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      trackEvent("sus_survey_submitted");
      markSurveyCompleted();
      setSubmitted(true);
    } catch {
      // silently fail — don't block the user
    } finally {
      setIsSubmitting(false);
    }
  }, [
    session, sus, avatar,
    likedMost, needsImprovement, additionalNotes, wouldUse,
    trackEvent, markSurveyCompleted,
  ]);

  if (dismissed) return null;

  // ─── Shared header meta ───────────────────────────────────────────────────
  const pageLabel = submitted ? null : `Page ${page + 1} of 3`;

  // ─── Mobile modal ─────────────────────────────────────────────────────────
  if (variant === "modal") {
    return (
      <div
        className="fixed inset-0 z-[300] flex flex-col justify-end"
        style={{ background: "rgba(0,0,0,0.55)" }}
      >
        <div
          className="bg-surface border border-border rounded-t-[20px] shadow-raised w-full"
          style={{ maxHeight: "85dvh", display: "flex", flexDirection: "column" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border-hi" />
          </div>

          {/* Header */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-text-1">Post-Session Survey</h3>
              {pageLabel && (
                <p className="text-[11px] text-text-3 mt-0.5">{pageLabel}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setDismissed(true); onClose?.(); }}
              aria-label="Dismiss feedback"
              className="w-7 h-7 rounded-btn border border-border bg-surface-2 text-text-3 flex items-center justify-center hover:text-text-1 transition-all cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            <SurveyBody
              page={page}
              sus={sus} setSus={setSus}
              avatar={avatar} setAvatar={setAvatar}
              likedMost={likedMost} setLikedMost={setLikedMost}
              needsImprovement={needsImprovement} setNeedsImprovement={setNeedsImprovement}
              additionalNotes={additionalNotes} setAdditionalNotes={setAdditionalNotes}
              wouldUse={wouldUse} setWouldUse={setWouldUse}
              submitted={submitted}
              onDismiss={() => { setDismissed(true); onClose?.(); }}
              dismissable={true}
            />
          </div>

          {/* Footer */}
          {!submitted && (
            <div className="px-5 py-3 border-t border-border bg-surface-2 shrink-0 flex items-center justify-between">
              <div>
                {page > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)}>
                    Back
                  </Button>
                )}
              </div>
              <div>
                {page < 2 ? (
                  <Button size="sm" onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button size="sm" isLoading={isSubmitting} onClick={handleSubmit}>
                    Submit Survey
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Desktop side panel ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full border-l border-border bg-surface overflow-hidden">
      {/* Gradient banner header */}
      <div
        className="px-4 py-4 shrink-0"
        style={{
          background: "linear-gradient(135deg, #5b8ef0 0%, #a855f7 50%, #ec4899 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl shrink-0">💜</div>
          <div>
            <p className="text-white font-bold text-[14px] leading-snug">
              Thank you for all your help!
            </p>
            <p className="text-white/85 text-[11px] mt-0.5 leading-snug">
              Please leave some feedback below
            </p>
          </div>
        </div>
        {pageLabel && (
          <p className="text-white/70 text-[10px] font-semibold tracking-wide uppercase mt-2.5">
            Post-Session Survey · {pageLabel}
          </p>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <SurveyBody
          page={page}
          sus={sus} setSus={setSus}
          avatar={avatar} setAvatar={setAvatar}
          likedMost={likedMost} setLikedMost={setLikedMost}
          needsImprovement={needsImprovement} setNeedsImprovement={setNeedsImprovement}
          additionalNotes={additionalNotes} setAdditionalNotes={setAdditionalNotes}
          wouldUse={wouldUse} setWouldUse={setWouldUse}
          submitted={submitted}
          onDismiss={() => setDismissed(true)}
          dismissable={false}
        />
      </div>

      {/* Footer nav */}
      {!submitted && (
        <div className="px-4 py-3 border-t border-border bg-surface-2 shrink-0 flex items-center justify-between">
          <div>
            {page > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)}>
                Back
              </Button>
            )}
          </div>
          <div>
            {page < 2 ? (
              <Button size="sm" onClick={() => setPage(page + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" isLoading={isSubmitting} onClick={handleSubmit}>
                Submit Survey
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Survey body — shared across both variants ────────────────────────────────

interface SurveyBodyProps {
  page: number;
  sus: Record<string, number>;
  setSus: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  avatar: Record<string, number>;
  setAvatar: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  likedMost: string;
  setLikedMost: (v: string) => void;
  needsImprovement: string;
  setNeedsImprovement: (v: string) => void;
  additionalNotes: string;
  setAdditionalNotes: (v: string) => void;
  wouldUse: string;
  setWouldUse: (v: string) => void;
  submitted: boolean;
  onDismiss: () => void;
  /** When false the "Dismiss panel" button is hidden — keeps desktop panel persistent */
  dismissable?: boolean;
}

function SurveyBody({
  page,
  sus, setSus,
  avatar, setAvatar,
  likedMost, setLikedMost,
  needsImprovement, setNeedsImprovement,
  additionalNotes, setAdditionalNotes,
  wouldUse, setWouldUse,
  submitted,
  onDismiss,
  dismissable = true,
}: SurveyBodyProps) {
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="text-3xl">🙌</div>
        <p className="text-sm font-semibold text-text-1">Thank you!</p>
        <p className="text-xs text-text-3 leading-relaxed">
          Your feedback helps shape DuoSign&apos;s accessibility.
        </p>
        {dismissable && (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 text-xs text-accent underline cursor-pointer"
          >
            Dismiss panel
          </button>
        )}
      </div>
    );
  }

  // ── Page 0: SUS (10 items) ────────────────────────────────────────────────
  if (page === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs text-text-3 leading-relaxed">
          Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).
        </p>
        {SUS_ITEMS.map((item, i) => {
          const key = `sus_${i + 1}`;
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <p className="text-xs text-text-1 leading-relaxed">
                {i + 1}. {item}
              </p>
              <LikertScale
                value={sus[key] ?? 0}
                onChange={(v) => setSus((prev) => ({ ...prev, [key]: v }))}
                labels={["Disagree", "Agree"]}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // ── Page 1: Avatar quality + open-ended ───────────────────────────────────
  if (page === 1) {
    return (
      <div className="flex flex-col gap-5">
        <section>
          <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-text-3 mb-2.5">
            Avatar Quality
          </p>
          <div className="flex flex-col gap-3">
            {AVATAR_QUESTIONS.map((q) => (
              <div key={q.key} className="flex flex-col gap-1.5">
                <p className="text-xs text-text-1 leading-snug">{q.label}</p>
                <LikertScale
                  value={avatar[q.key] ?? 0}
                  onChange={(v) => setAvatar((prev) => ({ ...prev, [q.key]: v }))}
                  labels={["Poor", "Excellent"]}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-text-3 mb-2.5">
            Your Thoughts
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-text-3 mb-1 block">
                What did you like most about DuoSign?
              </label>
              <textarea
                value={likedMost}
                onChange={(e) => setLikedMost(e.target.value)}
                className="w-full bg-surface-3 border border-border rounded-btn px-3 py-2 text-xs text-text-1 placeholder:text-text-3 resize-none h-16 outline-none focus:border-accent/50 transition-colors"
                placeholder="Your answer..."
              />
            </div>
            <div>
              <label className="text-[11px] text-text-3 mb-1 block">
                What needs the most improvement?
              </label>
              <textarea
                value={needsImprovement}
                onChange={(e) => setNeedsImprovement(e.target.value)}
                className="w-full bg-surface-3 border border-border rounded-btn px-3 py-2 text-xs text-text-1 placeholder:text-text-3 resize-none h-16 outline-none focus:border-accent/50 transition-colors"
                placeholder="Your answer..."
              />
            </div>
            <div>
              <label className="text-[11px] text-text-3 mb-1 block">
                Anything else? (interpreter-specific observations welcome)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full bg-surface-3 border border-border rounded-btn px-3 py-2 text-xs text-text-1 placeholder:text-text-3 resize-none h-16 outline-none focus:border-accent/50 transition-colors"
                placeholder="Additional comments or suggestions..."
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── Page 2: Would use ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-text-3">
        Would you use DuoSign?
      </p>
      <div className="flex flex-col gap-1.5">
        {WOULD_USE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setWouldUse(opt.value)}
            className={[
              "w-full text-left px-3 py-2.5 rounded-btn border text-xs transition-all cursor-pointer",
              wouldUse === opt.value
                ? "border-accent/50 bg-accent/10 text-accent font-medium"
                : "border-border bg-surface-3 text-text-2 hover:border-border-hi",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
