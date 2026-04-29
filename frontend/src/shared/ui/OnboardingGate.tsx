"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const OnboardingModal = dynamic(() => import("./OnboardingModal"), { ssr: false });

const STORAGE_KEY = "duosign_onboarded";

export default function OnboardingGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setShow(true);
      }
    } catch {
      // localStorage unavailable (private mode or permissions) — skip modal
    }
  }, []);

  const handleComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;
  return <OnboardingModal onComplete={handleComplete} />;
}
