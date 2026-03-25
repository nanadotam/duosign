"use client";

import { useState, useCallback } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import Button from "@/shared/ui/Button";

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
    <div className="flex items-center gap-1">
      {labels && (
        <span className="text-[10px] text-text-3 w-20 text-right mr-1">
          {labels[0]}
        </span>
      )}
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={[
            "w-8 h-8 rounded-full border text-xs font-semibold transition-all cursor-pointer",
            value === n
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-surface-3 text-text-3 hover:border-border-hi hover:text-text-2",
          ].join(" ")}
        >
          {n}
        </button>
      ))}
      {labels && (
        <span className="text-[10px] text-text-3 w-20 ml-1">{labels[1]}</span>
      )}
    </div>
  );
}

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SurveyModal({ isOpen, onClose }: SurveyModalProps) {
  const { session, trackEvent, markSurveyCompleted, endSession } =
    useTestingMode();
  const [sus, setSus] = useState<Record<string, number>>({});
  const [avatar, setAvatar] = useState<Record<string, number>>({});
  const [likedMost, setLikedMost] = useState("");
  const [needsImprovement, setNeedsImprovement] = useState("");
  const [wouldUse, setWouldUse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [page, setPage] = useState(0); // 0=SUS, 1=Avatar+Open, 2=WouldUse

  const handleSubmit = useCallback(async () => {
    if (!session) return;
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        session_id: session.sessionId,
        participant_id: session.participantId,
        ...Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [
            `sus_0${i + 1}`.replace("sus_010", "sus_10"),
            sus[`sus_${i + 1}`] ?? null,
          ])
        ),
        // Fix the key naming
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
        avatar_naturalness: avatar["avatar_naturalness"] ?? null,
        avatar_clarity: avatar["avatar_clarity"] ?? null,
        avatar_smoothness: avatar["avatar_smoothness"] ?? null,
        liked_most: likedMost.trim() || null,
        needs_improvement: needsImprovement.trim() || null,
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
      // silently fail
    } finally {
      setIsSubmitting(false);
    }
  }, [session, sus, avatar, likedMost, needsImprovement, wouldUse, trackEvent, markSurveyCompleted]);

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-surface border border-border rounded-panel shadow-raised w-full max-w-md mx-4 p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-semibold text-text-1 mb-2">
            Thank you!
          </h3>
          <p className="text-sm text-text-3 mb-6">
            Your feedback is invaluable to improving DuoSign. The study session
            is now complete.
          </p>
          <Button
            onClick={async () => {
              await endSession();
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[toast-in_0.2s_ease] overflow-y-auto py-4">
      <div className="bg-surface border border-border rounded-panel shadow-raised w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-1">
              Post-Session Survey
            </h3>
            <p className="text-[11px] text-text-3 mt-0.5">
              Page {page + 1} of 3
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-btn border border-border bg-surface-2 text-text-3 flex items-center justify-center hover:text-text-1 transition-all cursor-pointer"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {/* Page 0: SUS Items */}
          {page === 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-text-3 mb-1">
                Rate each statement from 1 (Strongly Disagree) to 5 (Strongly
                Agree).
              </p>
              {SUS_ITEMS.map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <p className="text-xs text-text-1 leading-relaxed">
                    {i + 1}. {item}
                  </p>
                  <LikertScale
                    value={sus[`sus_${i + 1}`] ?? 0}
                    onChange={(v) =>
                      setSus((prev) => ({ ...prev, [`sus_${i + 1}`]: v }))
                    }
                    labels={["Disagree", "Agree"]}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Page 1: Avatar Quality + Open-ended */}
          {page === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-xs font-semibold text-text-2 uppercase tracking-wide mb-3">
                  Avatar Quality
                </h4>
                <div className="flex flex-col gap-4">
                  {AVATAR_QUESTIONS.map((q) => (
                    <div key={q.key} className="flex flex-col gap-1.5">
                      <p className="text-xs text-text-1">{q.label}</p>
                      <LikertScale
                        value={avatar[q.key] ?? 0}
                        onChange={(v) =>
                          setAvatar((prev) => ({ ...prev, [q.key]: v }))
                        }
                        labels={["Poor", "Excellent"]}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-text-2 uppercase tracking-wide">
                  Your Thoughts
                </h4>
                <div>
                  <label className="text-xs text-text-3 mb-1 block">
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
                  <label className="text-xs text-text-3 mb-1 block">
                    What needs the most improvement?
                  </label>
                  <textarea
                    value={needsImprovement}
                    onChange={(e) => setNeedsImprovement(e.target.value)}
                    className="w-full bg-surface-3 border border-border rounded-btn px-3 py-2 text-xs text-text-1 placeholder:text-text-3 resize-none h-16 outline-none focus:border-accent/50 transition-colors"
                    placeholder="Your answer..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Page 2: Would Use */}
          {page === 2 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-text-2 uppercase tracking-wide">
                Would you use DuoSign?
              </h4>
              <div className="flex flex-col gap-2">
                {WOULD_USE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setWouldUse(opt.value)}
                    className={[
                      "w-full text-left px-4 py-3 rounded-btn border text-sm transition-all cursor-pointer",
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
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface-2 flex items-center justify-between">
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
              <Button
                size="sm"
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Submit Survey
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
