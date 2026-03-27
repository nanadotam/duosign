"use client";

import { useEffect, useRef, useState } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import RegistrationModal from "./RegistrationModal";
import OnboardingController from "./OnboardingController";
import TaskHintController from "./TaskHintController";
import FeedbackWidget from "./FeedbackWidget";
import SurveyModal from "./SurveyModal";
import { TestingToastItem, type TestingToastData } from "./TestingToast";

interface TestingModeOverlayProps {
  translationsCount: number;
  isTranslating: boolean;
  voiceInputUsed: boolean;
  firstTranslationDone: boolean;
}

export default function TestingModeOverlay({
  translationsCount,
  isTranslating,
  voiceInputUsed,
  firstTranslationDone,
}: TestingModeOverlayProps) {
  const {
    isTestingMode,
    session,
    trackEvent,
    markFeedbackNudgeSent,
    markSurveyPrompted,
    sessionDurationMinutes,
    isFeedbackOpen,
    feedbackTriggerType,
    openFeedback,
    closeFeedback,
    isSurveyOpen,
    openSurvey,
    closeSurvey,
  } = useTestingMode();

  const [nudgeToast, setNudgeToast] = useState<TestingToastData | null>(null);
  const feedbackNudgeFired = useRef(false);
  const surveyPromptFired = useRef(false);

  // Auto-nudge feedback after 3 translations
  useEffect(() => {
    if (!session || feedbackNudgeFired.current) return;
    if (session.feedbackNudgeSent) {
      feedbackNudgeFired.current = true;
      return;
    }
    if (translationsCount >= 3) {
      feedbackNudgeFired.current = true;
      markFeedbackNudgeSent();
      setNudgeToast({
        id: "feedback-nudge",
        content:
          "Quick check \u2014 how's the experience so far?",
        actionLabel: "Give feedback",
        duration: 10000,
        onAction: () => {
          openFeedback("auto_nudge");
        },
        onDismiss: () => {},
      });
    }
  }, [session, translationsCount, markFeedbackNudgeSent, openFeedback]);

  // Post-session survey prompt
  useEffect(() => {
    if (!session || surveyPromptFired.current) return;
    if (session.surveyPrompted || session.surveyCompleted) {
      surveyPromptFired.current = true;
      return;
    }

    const shouldPrompt =
      sessionDurationMinutes >= 10 || translationsCount >= 5;

    if (shouldPrompt) {
      surveyPromptFired.current = true;
      markSurveyPrompted();
      setNudgeToast({
        id: "survey-prompt",
        content:
          "You've explored a good amount! Ready to give final feedback?",
        actionLabel: "Complete short survey",
        secondaryLabel: "Not yet",
        duration: 15000,
        onAction: () => {
          trackEvent("sus_survey_opened");
          openSurvey();
        },
        onSecondary: () => {
          // Re-prompt after 3 more minutes
          surveyPromptFired.current = false;
        },
        onDismiss: () => {},
      });
    }
  }, [
    session,
    sessionDurationMinutes,
    translationsCount,
    markSurveyPrompted,
    trackEvent,
    openSurvey,
  ]);

  if (!isTestingMode) return null;

  return (
    <>
      <RegistrationModal />

      {session && (
        <>
          <OnboardingController
            firstTranslationDone={firstTranslationDone}
            translationsCount={translationsCount}
          />

          <TaskHintController
            translationsCount={translationsCount}
            isTranslating={isTranslating}
            voiceInputUsed={voiceInputUsed}
          />

          <FeedbackWidget
            isOpen={isFeedbackOpen}
            onOpenChange={(open) => {
              if (!open) closeFeedback();
            }}
            triggerType={feedbackTriggerType}
          />

          <SurveyModal
            isOpen={isSurveyOpen}
            onClose={closeSurvey}
          />

          {/* Nudge toasts (feedback nudge, survey prompt) */}
          {nudgeToast && (
            <div className="fixed top-4 right-4 z-[295] pointer-events-none max-w-sm">
              <TestingToastItem
                toast={nudgeToast}
                onRemove={() => setNudgeToast(null)}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
