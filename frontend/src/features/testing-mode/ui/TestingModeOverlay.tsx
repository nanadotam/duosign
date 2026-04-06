"use client";

import { useEffect, useRef, useState } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import RegistrationModal from "./RegistrationModal";
import OnboardingController from "./OnboardingController";
import TaskHintController from "./TaskHintController";
import FeedbackWidget from "./FeedbackWidget";
import SurveyModal from "./SurveyModal";
import ResearchCheckInModal from "./ResearchCheckInModal";
import { TestingToastItem, type TestingToastData } from "./TestingToast";

interface TestingModeOverlayProps {
  translationsCount?: number;
  isTranslating?: boolean;
  voiceInputUsed?: boolean;
  firstTranslationDone?: boolean;
}

export default function TestingModeOverlay({
  translationsCount = 0,
  isTranslating = false,
  voiceInputUsed = false,
  firstTranslationDone = false,
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
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const feedbackNudgeFired = useRef(false);
  const surveyPromptFired = useRef(false);
  const periodicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nudgeToastActiveRef = useRef(false);

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

  // Keep a ref in sync with nudgeToast state so the interval can check it without stale closure
  useEffect(() => {
    nudgeToastActiveRef.current = nudgeToast !== null;
  }, [nudgeToast]);

  // 5-minute periodic feedback popup — fires every 5 min while session is active
  useEffect(() => {
    if (!session || !isTestingMode) return;
    periodicIntervalRef.current = setInterval(() => {
      if (nudgeToastActiveRef.current) return;
      if (isFeedbackOpen || isSurveyOpen) return;
      if (translationsCount === 0) return;
      setIsCheckInOpen(true);
    }, 5 * 60 * 1000);
    return () => {
      if (periodicIntervalRef.current) clearInterval(periodicIntervalRef.current);
    };
  }, [session, isTestingMode, isFeedbackOpen, isSurveyOpen, translationsCount]);

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

          <ResearchCheckInModal
            isOpen={isCheckInOpen}
            onClose={() => setIsCheckInOpen(false)}
            onOpenSurvey={() => {
              setIsCheckInOpen(false);
              trackEvent("sus_survey_opened");
              openSurvey();
            }}
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
