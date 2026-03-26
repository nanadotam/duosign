"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import type { TestingSession, TestingEventName } from "./types";
import { queueEvent, flushBuffer, stopFlushTimer } from "./eventBuffer";

const STORAGE_KEY = "duosign:testing_session";

interface TestingModeContextValue {
  isTestingMode: boolean;
  session: TestingSession | null;
  registerParticipant: (data: {
    name: string | null;
    participantCode: string;
    participantType: "hearing" | "deaf_hoh";
  }) => Promise<void>;
  trackEvent: (
    eventName: TestingEventName,
    metadata?: Record<string, unknown>
  ) => void;
  incrementTranslations: () => void;
  incrementTasksActedOn: () => void;
  setOnboardingStep: (step: number) => void;
  dismissTask: (taskId: string) => void;
  markFeedbackNudgeSent: () => void;
  markSurveyPrompted: () => void;
  markSurveyCompleted: () => void;
  endSession: () => Promise<void>;
  sessionDurationMinutes: number;
}

const TestingModeContext = createContext<TestingModeContextValue>({
  isTestingMode: false,
  session: null,
  registerParticipant: async () => {},
  trackEvent: () => {},
  incrementTranslations: () => {},
  incrementTasksActedOn: () => {},
  setOnboardingStep: () => {},
  dismissTask: () => {},
  markFeedbackNudgeSent: () => {},
  markSurveyPrompted: () => {},
  markSurveyCompleted: () => {},
  endSession: async () => {},
  sessionDurationMinutes: 0,
});

export function useTestingMode() {
  return useContext(TestingModeContext);
}

function getDeviceType(): "mobile" | "desktop" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua))
    return "mobile";
  return "desktop";
}

function loadSession(): TestingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: TestingSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function TestingModeProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const isTestingMode = searchParams.has("testing");
  const [session, setSession] = useState<TestingSession | null>(null);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(0);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore session on mount
  useEffect(() => {
    if (!isTestingMode) return;
    const existing = loadSession();
    if (existing) {
      setSession(existing);
    }
  }, [isTestingMode]);

  // Persist session changes
  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  // Session duration timer
  useEffect(() => {
    if (!session) return;
    const start = new Date(session.startedAt).getTime();

    const tick = () => {
      setSessionDurationMinutes((Date.now() - start) / 60000);
    };
    tick();
    durationTimer.current = setInterval(tick, 10000);
    return () => {
      if (durationTimer.current) clearInterval(durationTimer.current);
    };
  }, [session?.startedAt]);  // eslint-disable-line react-hooks/exhaustive-deps

  const registerParticipant = useCallback(
    async (data: { name: string | null; participantCode: string; participantType: "hearing" | "deaf_hoh" }) => {
      const deviceType = getDeviceType();
      const res = await fetch("/api/testing/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_code: data.participantCode,
          name: data.name,
          participant_type: data.participantType,
          device_type: deviceType,
          browser_ua: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error("Failed to register participant");
      const { participant_id, session_id } = await res.json();

      const newSession: TestingSession = {
        sessionId: session_id,
        participantId: participant_id,
        participantCode: data.participantCode,
        participantType: data.participantType,
        startedAt: new Date().toISOString(),
        translationsCount: 0,
        tasksActedOn: 0,
        onboardingStep: 0,
        dismissedTasks: [],
        feedbackNudgeSent: false,
        surveyPrompted: false,
        surveyCompleted: false,
      };

      setSession(newSession);
    },
    []
  );

  const trackEvent = useCallback(
    (eventName: TestingEventName, metadata?: Record<string, unknown>) => {
      if (!session) return;
      queueEvent(session.sessionId, session.participantId, eventName, metadata);
    },
    [session]
  );

  const updateSession = useCallback(
    (updater: (prev: TestingSession) => TestingSession) => {
      setSession((prev) => {
        if (!prev) return prev;
        return updater(prev);
      });
    },
    []
  );

  const incrementTranslations = useCallback(() => {
    updateSession((s) => ({
      ...s,
      translationsCount: s.translationsCount + 1,
    }));
    // Also update server-side count
    if (session) {
      fetch("/api/testing/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.sessionId,
          increment_translations: true,
        }),
      }).catch(() => {});
    }
  }, [updateSession, session]);

  const incrementTasksActedOn = useCallback(() => {
    updateSession((s) => ({
      ...s,
      tasksActedOn: s.tasksActedOn + 1,
    }));
    if (session) {
      fetch("/api/testing/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.sessionId,
          increment_tasks: true,
        }),
      }).catch(() => {});
    }
  }, [updateSession, session]);

  const setOnboardingStep = useCallback(
    (step: number) => updateSession((s) => ({ ...s, onboardingStep: step })),
    [updateSession]
  );

  const dismissTask = useCallback(
    (taskId: string) =>
      updateSession((s) => ({
        ...s,
        dismissedTasks: [...s.dismissedTasks, taskId],
      })),
    [updateSession]
  );

  const markFeedbackNudgeSent = useCallback(
    () => updateSession((s) => ({ ...s, feedbackNudgeSent: true })),
    [updateSession]
  );

  const markSurveyPrompted = useCallback(
    () => updateSession((s) => ({ ...s, surveyPrompted: true })),
    [updateSession]
  );

  const markSurveyCompleted = useCallback(
    () => updateSession((s) => ({ ...s, surveyCompleted: true })),
    [updateSession]
  );

  const endSession = useCallback(async () => {
    if (!session) return;
    await flushBuffer();
    stopFlushTimer();

    await fetch("/api/testing/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: session.sessionId,
        end: true,
        completed: session.surveyCompleted,
      }),
    }).catch(() => {});

    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, [session]);

  // Handle beforeunload — flush events and mark abandoned if needed
  useEffect(() => {
    if (!session) return;
    const handleUnload = () => {
      if (session.translationsCount < 3) {
        queueEvent(
          session.sessionId,
          session.participantId,
          "session_abandoned",
          { translations_count: session.translationsCount }
        );
      }
      flushBuffer();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [session]);

  return (
    <TestingModeContext.Provider
      value={{
        isTestingMode,
        session,
        registerParticipant,
        trackEvent,
        incrementTranslations,
        incrementTasksActedOn,
        setOnboardingStep,
        dismissTask,
        markFeedbackNudgeSent,
        markSurveyPrompted,
        markSurveyCompleted,
        endSession,
        sessionDurationMinutes,
      }}
    >
      {children}
    </TestingModeContext.Provider>
  );
}
