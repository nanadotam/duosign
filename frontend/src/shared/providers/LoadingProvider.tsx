"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

export type StepStatus = "pending" | "loading" | "ready" | "error";

export interface LoadingStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface LoadingContextValue {
  steps: LoadingStep[];
  overallReady: boolean;
  startPreload: () => void;
}

const LoadingContext = createContext<LoadingContextValue>({
  steps: [],
  overallReady: false,
  startPreload: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

const INITIAL_STEPS: LoadingStep[] = [
  { id: "kalidokit", label: "Kalidokit", status: "pending" },
  { id: "mediapipe", label: "MediaPipe Vision", status: "pending" },
];

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<LoadingStep[]>(INITIAL_STEPS);
  const startedRef = useRef(false);

  const updateStep = useCallback((id: string, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }, []);

  const startPreload = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Load Kalidokit (fast, ~500ms)
    updateStep("kalidokit", "loading");
    try {
      const { loadKalidokit } = await import(
        "@/features/animate-avatar/model/useVideoEngine"
      );
      await loadKalidokit();
      updateStep("kalidokit", "ready");
    } catch {
      updateStep("kalidokit", "error");
    }

    // Load MediaPipe (slow, 5-10s)
    updateStep("mediapipe", "loading");
    try {
      const { initHolistic } = await import(
        "@/features/animate-avatar/model/useVideoEngine"
      );
      const ok = await initHolistic();
      updateStep("mediapipe", ok ? "ready" : "error");
    } catch {
      updateStep("mediapipe", "error");
    }
  }, [updateStep]);

  // Eagerly preload on mount
  useEffect(() => {
    startPreload();
  }, [startPreload]);

  const overallReady = steps.every(
    (s) => s.status === "ready" || s.status === "error"
  );

  return (
    <LoadingContext.Provider value={{ steps, overallReady, startPreload }}>
      {children}
    </LoadingContext.Provider>
  );
}
