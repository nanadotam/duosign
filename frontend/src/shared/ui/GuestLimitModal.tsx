"use client";

import Link from "next/link";

interface GuestLimitModalProps {
  onClose: () => void;
}

export default function GuestLimitModal({ onClose }: GuestLimitModalProps) {
  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full sm:max-w-md mx-4 sm:mx-auto bg-surface border border-border rounded-panel shadow-raised p-6
                      max-sm:rounded-b-none max-sm:mx-0">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-1 mb-1">
              Guest translation limit reached
            </h3>
            <p className="text-sm text-text-2 leading-relaxed">
              Create a free account to continue. By signing up, you agree to DuoSign&apos;s{" "}
              <Link href="/terms" target="_blank" className="text-accent hover:underline font-medium" onClick={onClose}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="text-accent hover:underline font-medium" onClick={onClose}>
                Privacy Policy
              </Link>
              , including the WLASL C-UDA data use terms.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Link
            href="/auth/login"
            className="flex-1 text-center px-4 py-2.5 rounded-btn border border-border text-sm font-semibold text-text-1 hover:border-accent hover:text-accent transition-colors"
            onClick={onClose}
          >
            Log In
          </Link>
          <Link
            href="/auth/register"
            className="flex-1 text-center px-4 py-2.5 rounded-btn bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all"
            onClick={onClose}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
