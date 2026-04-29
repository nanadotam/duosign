"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const OnboardingModal = dynamic(() => import("./OnboardingModal"), { ssr: false });

const STORAGE_KEY = "duosign_onboarded";

// Pages where the modal should never appear — user hasn't entered the app yet
const SUPPRESSED_PATHS = ["/"];

export default function OnboardingGate() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't interrupt the landing page — wait until user enters the app
    if (SUPPRESSED_PATHS.includes(pathname)) return;

    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setShow(true);
      }
    } catch {
      // localStorage unavailable (private mode) — skip modal
    }
  }, [pathname]);

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
