"use client";

import Button from "@/shared/ui/Button";
import Modal from "@/shared/ui/Modal";

interface ResearchCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSurvey: () => void;
}

export default function ResearchCheckInModal({
  isOpen,
  onClose,
  onOpenSurvey,
}: ResearchCheckInModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Research Check-In"
      size="md"
      footerClassName="justify-end"
      footer={
        <Button size="sm" className="w-full sm:w-auto" onClick={onOpenSurvey}>
          Take SUS Survey
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-[16px] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-accent/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent">
            Study prompt
          </p>
          <p className="mt-1 text-sm leading-6 text-text-2">
            You&apos;ve been using DuoSign for a few minutes. Please complete the
            SUS survey to record your usability feedback for this session.
          </p>
        </div>
        <p className="text-sm leading-6 text-text-3">
          This check-in now routes directly to the usability survey.
        </p>
      </div>
    </Modal>
  );
}
