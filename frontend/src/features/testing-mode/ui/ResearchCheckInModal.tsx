"use client";

import Button from "@/shared/ui/Button";
import Modal from "@/shared/ui/Modal";

interface ResearchCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareFeedback: () => void;
  onOpenSurvey?: () => void;
  showSurveyAction?: boolean;
}

export default function ResearchCheckInModal({
  isOpen,
  onClose,
  onShareFeedback,
  onOpenSurvey,
  showSurveyAction = false,
}: ResearchCheckInModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Research Check-In"
      size="md"
      footerClassName="flex-col-reverse sm:flex-row sm:justify-end"
      footer={
        <>
          <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={onClose}>
            Continue testing
          </Button>
          {showSurveyAction && onOpenSurvey && (
            <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={onOpenSurvey}>
              Open SUS Survey
            </Button>
          )}
          <Button size="sm" className="w-full sm:w-auto" onClick={onShareFeedback}>
            Share Feedback
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-[16px] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-accent/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
            Study prompt
          </p>
          <p className="mt-1 text-sm leading-6 text-text-2">
            You&apos;ve been using DuoSign for a few minutes. Please share what
            feels clear, confusing, slow, or inaccurate so the prototype can be
            improved.
          </p>
        </div>
        <p className="text-sm leading-6 text-text-3">
          Feedback is optional at each check-in, but the app will keep inviting
          participants back into the study flow while the session is active.
        </p>
      </div>
    </Modal>
  );
}
