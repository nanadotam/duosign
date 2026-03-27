"use client";

import { useState, useCallback } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import type { FeedbackTriggerType } from "../model/types";
import Button from "@/shared/ui/Button";
import Modal from "@/shared/ui/Modal";

const TAG_OPTIONS = [
  "Confusing",
  "Too slow",
  "Inaccurate",
  "Impressive",
  "Avatar looks robotic",
  "Easy to use",
  "Crashed or errored",
] as const;

interface FeedbackWidgetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerType: FeedbackTriggerType;
}

export default function FeedbackWidget({
  isOpen,
  onOpenChange,
  triggerType,
}: FeedbackWidgetProps) {
  const { isTestingMode, session, trackEvent } =
    useTestingMode();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setRating(0);
    setHoveredStar(0);
    setSelectedTags([]);
    setComment("");
    setSubmitted(false);
    setIsSubmitting(false);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!session || rating === 0) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/testing/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.sessionId,
          participant_id: session.participantId,
          rating,
          tags: selectedTags.length > 0 ? selectedTags : null,
          comment: comment.trim() || null,
          trigger_type: triggerType,
        }),
      });

      trackEvent("feedback_submitted", { rating, tags: selectedTags });
      setSubmitted(true);
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 2000);
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false);
    }
  }, [session, rating, selectedTags, comment, triggerType, trackEvent, onOpenChange, resetForm]);

  if (!isTestingMode || !session) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
        title="Quick Feedback"
        size="lg"
        fullScreenOnMobile
        bodyClassName="overflow-y-auto"
        footerClassName="flex-col-reverse sm:flex-row sm:justify-end"
        footer={
          submitted ? (
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="w-full sm:w-auto"
                disabled={rating === 0}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Submit Feedback
              </Button>
            </>
          )
        }
      >
        {submitted ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-accent/10 text-accent flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-base font-semibold text-text-1">
              Thank you for the feedback.
            </p>
            <p className="mt-2 max-w-sm text-sm text-text-3">
              Your notes have been saved for this testing session.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-[16px] border border-border-hi bg-surface-2 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-2">
                Testing Session
              </p>
              <p className="mt-1 text-sm text-text-3 leading-relaxed">
                Share what felt clear, confusing, slow, or broken while using the translate page.
              </p>
            </div>

            <div>
              <p className="text-xs text-text-3 mb-2">Rate your experience</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className={[
                      "flex h-11 w-11 items-center justify-center rounded-full border transition-all cursor-pointer",
                      star <= (hoveredStar || rating)
                        ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-300"
                        : "border-border bg-surface-3 text-text-3 hover:border-border-hi hover:text-text-2",
                    ].join(" ")}
                    aria-label={`Rate ${star} out of 5`}
                  >
                    <span className="text-xl leading-none">&#9733;</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-3 mb-2">
                What stood out? (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={[
                      "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                      selectedTags.includes(tag)
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-border bg-surface-3 text-text-3 hover:text-text-2 hover:border-border-hi",
                    ].join(" ")}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-3 mb-2 block">
                Anything else? (optional)
              </label>
              <textarea
                placeholder="Tell us what happened, what felt off, or what worked well."
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value.slice(0, 300))
                }
                className="w-full min-h-[140px] bg-surface-3 border border-border rounded-[14px] px-3 py-3 text-sm text-text-1 placeholder:text-text-3 resize-none outline-none focus:border-accent/50 transition-colors"
              />
              <p className="text-[11px] text-text-3 text-right mt-1">
                {comment.length}/300
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
