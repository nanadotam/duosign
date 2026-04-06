"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTestingMode } from "../model/TestingModeProvider";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";

function getDeviceLabel(): string {
  if (typeof window === "undefined") return "Desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua))
    return "Mobile";
  return "Desktop";
}

/** Generate a short, human-readable participant ID like "DS-7F3A" */
function generateParticipantCode(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(2)))
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join("");
  return `DS-${hex}`;
}

export default function RegistrationModal() {
  const { isTestingMode, session, registerParticipant } = useTestingMode();
  const suggestedParticipantCode = useMemo(generateParticipantCode, []);
  const [participantCode, setParticipantCode] = useState(
    suggestedParticipantCode
  );
  const [name, setName] = useState("");
  const [participantType, setParticipantType] = useState<"hearing" | "deaf_hoh">("hearing");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deviceLabel] = useState(getDeviceLabel);

  // Don't show if not in testing mode or already registered
  if (!isTestingMode || session) return null;

  const canSubmit = consent && participantCode.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError("");

    try {
      await registerParticipant({
        name: name.trim() || null,
        participantCode: participantCode.trim(),
        participantType,
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[toast-in_0.3s_ease]">
      <div className="bg-surface border border-border rounded-panel shadow-raised w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔬</span>
            <h2 className="text-base font-semibold text-text-1">
              DuoSign Research Study
            </h2>
          </div>
          <p className="text-xs text-text-3 leading-relaxed">
            Welcome! You&apos;re about to help test a sign language translation
            tool. Your participation is anonymous.
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Participant Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase text-text-3">
              Participant Number
            </label>
            <Input
              value={participantCode}
              onChange={(e) => setParticipantCode(e.target.value.toUpperCase())}
              placeholder="Enter your participant number"
            />
            <p className="text-[10px] text-text-3 leading-relaxed">
              Use the participant number assigned for the study, or keep the
              suggested code if you are running the session yourself.
            </p>
          </div>

          {/* Optional Name */}
          <Input
            label="Name (optional)"
            placeholder="Enter your name if you'd like"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Participant Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide uppercase text-text-3">
              I am
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setParticipantType("hearing")}
                className={[
                  "flex-1 px-3 py-2.5 rounded-btn border text-sm font-medium transition-all cursor-pointer",
                  participantType === "hearing"
                    ? "border-accent/60 bg-accent/10 text-accent shadow-[0_0_0_3px_var(--accent-glow)]"
                    : "border-border bg-surface-3 text-text-2 hover:border-border-hi",
                ].join(" ")}
              >
                Hearing
              </button>
              <button
                type="button"
                onClick={() => setParticipantType("deaf_hoh")}
                className={[
                  "flex-1 px-3 py-2.5 rounded-btn border text-sm font-medium transition-all cursor-pointer",
                  participantType === "deaf_hoh"
                    ? "border-accent/60 bg-accent/10 text-accent shadow-[0_0_0_3px_var(--accent-glow)]"
                    : "border-border bg-surface-3 text-text-2 hover:border-border-hi",
                ].join(" ")}
              >
                Deaf / Hard-of-Hearing
              </button>
            </div>
          </div>

          {/* Device Type (auto-detected) */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-btn bg-surface-3 border border-border">
            <span className="text-xs text-text-3">Device detected:</span>
            <span className="text-xs font-semibold text-text-2">{deviceLabel}</span>
          </div>

          {/* IRB Consent */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-[var(--accent)] cursor-pointer"
            />
            <span className="text-xs text-text-3 leading-relaxed group-hover:text-text-2 transition-colors">
              I understand my interactions will be recorded anonymously for
              academic research at Ashesi University (DuoSign Study, Nana Kwaku
              Amoako). I have read the linked consent and data collection
              details. I can withdraw at any time by closing this tab.
            </span>
          </label>

          {error && (
            <p className="text-xs text-error">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-2 flex justify-end">
          <Button
            size="lg"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Start Study Session
          </Button>
        </div>
        <div className="px-6 pb-5 pt-2 text-center">
          <Link
            href={`/research/consent?audience=${participantType}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-text-3 underline underline-offset-4 transition-colors hover:text-text-1"
          >
            Read consent form
          </Link>
        </div>
      </div>
    </div>
  );
}
