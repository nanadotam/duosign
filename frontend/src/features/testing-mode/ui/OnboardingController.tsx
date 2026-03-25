"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import { TestingToastItem, type TestingToastData } from "./TestingToast";

interface OnboardingStep {
  id: number;
  content: string;
  hint?: string;
  actionLabel?: string;
  secondaryLabel?: string;
  variant?: "default" | "warning";
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    content:
      "Welcome to DuoSign! You're helping test a sign language translation tool. Type English \u2192 watch the avatar sign it. Let's walk you through the features.",
    actionLabel: "Show me",
    secondaryLabel: "Skip tour",
  },
  {
    id: 2,
    content:
      'Start here. Type any English sentence into the input field and press Translate. The 3D avatar will perform it in ASL.',
    hint: 'Try "Good morning, how are you?"',
  },
  {
    id: 3,
    content:
      "World View. You can rotate and zoom the avatar. Try switching to Full World View in settings to see the full body signing environment.",
  },
  {
    id: 4,
    content:
      "Skeleton View. In Settings, toggle Skeleton Viewer to see the raw pose landmarks MediaPipe is tracking. Useful for seeing accuracy under the hood.",
  },
  {
    id: 5,
    content:
      "Voice Input. Instead of typing, try the microphone. Click the mic icon to speak your sentence \u2014 it'll be transcribed and translated automatically.",
  },
  {
    id: 6,
    content:
      "Good to know before you dive deeper: Avatar signing may look robotic on complex sentences. Long sentences or idioms may not translate accurately. Animation may lag on slower devices. This is a research prototype \u2014 your honest feedback matters most.",
    actionLabel: "Got it, let's go!",
    variant: "warning",
  },
  {
    id: 7,
    content:
      "You're all set! We'll occasionally suggest things to try \u2014 feel free to explore on your own too. Use the feedback button anytime to share thoughts.",
  },
];

interface OnboardingControllerProps {
  firstTranslationDone: boolean;
  translationsCount: number;
}

export default function OnboardingController({
  firstTranslationDone,
  translationsCount,
}: OnboardingControllerProps) {
  const { isTestingMode, session, trackEvent, setOnboardingStep } =
    useTestingMode();
  const [activeToast, setActiveToast] = useState<TestingToastData | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = session?.onboardingStep ?? 0;
  const stepShownRef = useRef(new Set<number>());

  const showStep = useCallback(
    (stepNum: number) => {
      if (stepShownRef.current.has(stepNum)) return;
      stepShownRef.current.add(stepNum);

      const def = STEPS.find((s) => s.id === stepNum);
      if (!def) return;

      trackEvent("onboarding_step_seen", { step_id: stepNum });

      setActiveToast({
        id: `onboarding-${stepNum}`,
        content: def.content,
        hint: def.hint,
        actionLabel: def.actionLabel,
        secondaryLabel: def.secondaryLabel,
        variant: def.variant,
        duration: stepNum === 6 ? 15000 : 8000,
        onAction: () => {
          trackEvent("onboarding_step_dismissed", {
            step_id: stepNum,
            dismissed_by: "user",
          });
          advance(stepNum);
        },
        onSecondary: () => {
          // "Skip tour" — jump to step 8 (complete)
          trackEvent("onboarding_step_dismissed", {
            step_id: stepNum,
            dismissed_by: "skipped",
          });
          setOnboardingStep(8);
          setActiveToast(null);
        },
        onDismiss: (by) => {
          trackEvent("onboarding_step_dismissed", {
            step_id: stepNum,
            dismissed_by: by,
          });
          if (by === "auto") advance(stepNum);
        },
      });
    },
    [trackEvent, setOnboardingStep] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const advance = useCallback(
    (fromStep: number) => {
      const next = fromStep + 1;
      if (next > 7) {
        setOnboardingStep(8);
        return;
      }
      setOnboardingStep(next);
    },
    [setOnboardingStep]
  );

  // Step 1: show immediately after registration
  useEffect(() => {
    if (!isTestingMode || !session || step !== 0) return;
    const timer = setTimeout(() => {
      setOnboardingStep(1);
      showStep(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [isTestingMode, session, step, setOnboardingStep, showStep]);

  // Step 2: after step 1
  useEffect(() => {
    if (step !== 2) return;
    const timer = setTimeout(() => showStep(2), 800);
    return () => clearTimeout(timer);
  }, [step, showStep]);

  // Step 3: after first translation
  useEffect(() => {
    if (step !== 3 || !firstTranslationDone) return;
    showStep(3);
  }, [step, firstTranslationDone, showStep]);

  // Step 3 advance trigger: when first translation is done
  useEffect(() => {
    if (step === 2 && firstTranslationDone) {
      setOnboardingStep(3);
    }
  }, [step, firstTranslationDone, setOnboardingStep]);

  // Steps 4-7: advance on timer after previous step
  useEffect(() => {
    if (step < 4 || step > 7) return;
    if (stepShownRef.current.has(step)) return;

    const delay = step === 4 ? 30000 : step === 5 ? 30000 : 1000;
    advanceTimer.current = setTimeout(() => showStep(step), delay);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [step, showStep]);

  // If step >= 4 and translations count advances, speed up
  useEffect(() => {
    if (step >= 4 && step <= 5 && translationsCount >= 2 && !stepShownRef.current.has(step)) {
      showStep(step);
    }
  }, [step, translationsCount, showStep]);

  if (!isTestingMode || !session || step >= 8) return null;

  return (
    <div className="fixed top-4 left-4 z-[290] flex flex-col gap-2 pointer-events-none max-w-sm">
      {activeToast && (
        <TestingToastItem
          toast={activeToast}
          onRemove={() => setActiveToast(null)}
        />
      )}
    </div>
  );
}
