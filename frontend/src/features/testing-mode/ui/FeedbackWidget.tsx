"use client";

import { useState, useCallback } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import Button from "@/shared/ui/Button";

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
  autoNudge?: boolean;
}

export default function FeedbackWidget({ autoNudge }: FeedbackWidgetProps) {
  const { isTestingMode, session, trackEvent } =
    useTestingMode();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          trigger_type: autoNudge ? "auto_nudge" : "widget",
        }),
      });

      trackEvent("feedback_submitted", { rating, tags: selectedTags });
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setRating(0);
        setSelectedTags([]);
        setComment("");
      }, 2000);
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false);
    }
  }, [session, rating, selectedTags, comment, autoNudge, trackEvent]);

  if (!isTestingMode || !session) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[280] flex flex-col items-end gap-2">
      {/* Expanded widget */}
      {isOpen && (
        <div className="bg-surface border border-border rounded-panel shadow-raised w-80 overflow-hidden animate-[toast-in_0.2s_ease]">
          <div className="px-4 py-3 border-b border-border bg-surface-2">
            <h4 className="text-sm font-semibold text-text-1">
              Quick Feedback
            </h4>
          </div>

          {submitted ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-text-1 font-medium">
                Thank you for your feedback!
              </p>
            </div>
          ) : (
            <div className="px-4 py-3 flex flex-col gap-3">
              {/* Star rating */}
              <div>
                <p className="text-xs text-text-3 mb-1.5">Rate your experience</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="text-xl cursor-pointer transition-transform hover:scale-110"
                    >
                      {star <= (hoveredStar || rating) ? (
                        <span className="text-yellow-400">&#9733;</span>
                      ) : (
                        <span className="text-text-3">&#9734;</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag chips */}
              <div>
                <p className="text-xs text-text-3 mb-1.5">
                  What stood out? (optional)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={[
                        "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
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

              {/* Comment */}
              <div>
                <textarea
                  placeholder="Anything else? (optional)"
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value.slice(0, 300))
                  }
                  className="w-full bg-surface-3 border border-border rounded-btn px-3 py-2 text-xs text-text-1 placeholder:text-text-3 resize-none h-16 outline-none focus:border-accent/50 transition-colors"
                />
                <p className="text-[10px] text-text-3 text-right mt-0.5">
                  {comment.length}/300
                </p>
              </div>

              <Button
                size="sm"
                disabled={rating === 0}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Send Feedback
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) trackEvent("feedback_widget_opened");
        }}
        className={[
          "flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-raised",
          "text-sm font-medium cursor-pointer transition-all",
          isOpen
            ? "bg-accent/10 border-accent/40 text-accent"
            : "bg-surface border-border text-text-2 hover:text-text-1 hover:border-border-hi",
        ].join(" ")}
      >
        <span>💬</span>
        Feedback
      </button>
    </div>
  );
}
