"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTestingMode } from "../model/TestingModeProvider";
import { TASK_DEFINITIONS } from "../model/taskDefinitions";
import { TestingToastItem, type TestingToastData } from "./TestingToast";
import type { TaskTriggerContext } from "../model/types";

interface TaskHintControllerProps {
  translationsCount: number;
  isTranslating: boolean;
  voiceInputUsed: boolean;
}

export default function TaskHintController({
  translationsCount,
  isTranslating,
  voiceInputUsed,
}: TaskHintControllerProps) {
  const {
    isTestingMode,
    session,
    trackEvent,
    dismissTask,
    incrementTasksActedOn,
    sessionDurationMinutes,
  } = useTestingMode();

  const [activeToast, setActiveToast] = useState<TestingToastData | null>(null);
  const shownTaskIds = useRef<string[]>([]);
  const completedTaskIds = useRef<string[]>([]);
  const lastHintTime = useRef(0);
  const pendingTaskRef = useRef<string | null>(null);
  const hintShownAtRef = useRef<number>(0);
  const checkTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track acting on tasks: if a relevant event fires within 2 min of hint
  useEffect(() => {
    if (!pendingTaskRef.current) return;
    const taskId = pendingTaskRef.current;
    const elapsed = Date.now() - hintShownAtRef.current;
    if (elapsed > 120000) return; // 2 min window expired

    const task = TASK_DEFINITIONS.find((t) => t.id === taskId);
    if (!task) return;

    let acted = false;
    if (["T01", "T02", "T03", "T07"].includes(taskId) && translationsCount > 0) {
      acted = true;
    }
    if (taskId === "T04" && voiceInputUsed) acted = true;

    if (acted && !completedTaskIds.current.includes(taskId)) {
      completedTaskIds.current.push(taskId);
      trackEvent("task_hint_acted_on", { task_id: taskId });
      incrementTasksActedOn();
      pendingTaskRef.current = null;
    }
  }, [translationsCount, voiceInputUsed, trackEvent, incrementTasksActedOn]);

  const showHint = useCallback(
    (taskId: string) => {
      const task = TASK_DEFINITIONS.find((t) => t.id === taskId);
      if (!task) return;

      shownTaskIds.current.push(taskId);
      lastHintTime.current = Date.now();
      hintShownAtRef.current = Date.now();
      pendingTaskRef.current = taskId;

      trackEvent("task_hint_shown", { task_id: taskId });

      setActiveToast({
        id: `task-${taskId}`,
        content: task.prompt,
        duration: 10000,
        onDismiss: (by) => {
          if (by === "user") {
            trackEvent("task_hint_dismissed", { task_id: taskId });
            dismissTask(taskId);
          }
        },
      });
    },
    [trackEvent, dismissTask]
  );

  // Check for eligible tasks every 5 seconds
  useEffect(() => {
    if (!isTestingMode || !session || (session.onboardingStep ?? 0) < 8) return;

    checkTimer.current = setInterval(() => {
      // 90s cooldown
      if (Date.now() - lastHintTime.current < 90000) return;
      // Don't show hints while actively translating
      if (isTranslating) return;
      // Don't show if a toast is already active
      if (activeToast) return;

      const ctx: TaskTriggerContext = {
        translationsCount: session.translationsCount,
        sessionDurationMinutes,
        completedTaskIds: completedTaskIds.current,
        shownTaskIds: [
          ...shownTaskIds.current,
          ...session.dismissedTasks,
        ],
        voiceInputUsed,
      };

      const eligible = TASK_DEFINITIONS.find((t) => t.triggerCondition(ctx));
      if (eligible) showHint(eligible.id);
    }, 5000);

    return () => {
      if (checkTimer.current) clearInterval(checkTimer.current);
    };
  }, [
    isTestingMode,
    session,
    isTranslating,
    activeToast,
    sessionDurationMinutes,
    voiceInputUsed,
    showHint,
  ]);

  if (!isTestingMode || !session || (session.onboardingStep ?? 0) < 8)
    return null;

  return (
    <div className="fixed top-4 left-4 z-[285] flex flex-col gap-2 pointer-events-none max-w-sm">
      {activeToast && (
        <TestingToastItem
          toast={activeToast}
          onRemove={() => setActiveToast(null)}
        />
      )}
    </div>
  );
}
