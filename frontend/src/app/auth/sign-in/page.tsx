"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import { signIn } from "@/lib/auth-client";

interface LoginFormData {
  email: string;
  password: string;
}

type FlowState = "idle" | "signing-in" | "fetching-token" | "connecting" | "success" | "error";

function SignInForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const extId = searchParams.get("ext_id");
  const isExtensionFlow = source === "extension";

  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [authError, setAuthError] = useState<string | null>(null);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();

  // After a successful extension auth, close the tab
  useEffect(() => {
    if (flowState === "success") {
      const t = setTimeout(() => window.close(), 2500);
      return () => clearTimeout(t);
    }
  }, [flowState]);

  const sendTokenToExtension = async (extId: string) => {
    try {
      const res = await fetch("/api/auth/extension-session");
      if (!res.ok) throw new Error("Could not retrieve session");
      const session = await res.json();

      // Use chrome.runtime.sendMessage if available (extension context)
      if (typeof chrome !== "undefined" && chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          extId,
          { type: "SAVE_AUTH_SESSION", session },
          (response: { ok: boolean; error?: string }) => {
            if (chrome?.runtime?.lastError || !response?.ok) {
              setAuthError("Extension connection failed. Try reloading the extension.");
              setFlowState("error");
            } else {
              setConnectedUser(session.email);
              setFlowState("success");
            }
          }
        );
      } else {
        // Fallback: postMessage for content script relay
        window.postMessage(
          { type: "DUOSIGN_AUTH_SUCCESS", session, extId },
          window.location.origin
        );
        setConnectedUser(session.email);
        setFlowState("success");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to connect extension");
      setFlowState("error");
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    setFlowState("signing-in");

    try {
      const { error } = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: isExtensionFlow ? undefined : "/translate",
      });

      if (error) {
        setAuthError(error.message ?? "Invalid email or password.");
        setFlowState("error");
        return;
      }

      if (isExtensionFlow && extId) {
        setFlowState("fetching-token");
        await sendTokenToExtension(extId);
      } else if (isExtensionFlow) {
        // No ext_id — just show success, extension will poll
        setFlowState("fetching-token");
        const res = await fetch("/api/auth/extension-session");
        if (res.ok) {
          const session = await res.json();
          setConnectedUser(session.email);
          setFlowState("success");
        }
      } else {
        window.location.href = "/translate";
      }
    } catch {
      setAuthError("Sign-in unavailable. Please try again.");
      setFlowState("error");
    }
  };

  const isLoading = ["signing-in", "fetching-token", "connecting"].includes(flowState);

  // ── Success State ────────────────────────────────────────────────────
  if (flowState === "success") {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-1 mb-2">Extension Connected</h1>
          <p className="text-sm text-text-2 mb-1">
            Signed in as <span className="text-text-1 font-medium">{connectedUser}</span>
          </p>
          <p className="text-xs text-text-3 mt-4">This tab will close automatically…</p>
        </div>
      </div>
    );
  }

  // ── Main Form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base flex flex-col">
      {!isExtensionFlow && (
        <nav className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Image src="/logos/DuoSign_logo.svg" alt="DuoSign" width={110} height={26} className="logo-adaptive" />
        </nav>
      )}

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Extension header */}
          {isExtensionFlow && (
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-4 shadow-raised">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <Image src="/logos/DuoSign_logo.svg" alt="DuoSign" width={120} height={28} className="logo-adaptive mb-3" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Connecting to Extension
              </div>
            </div>
          )}

          {/* Standard header */}
          {!isExtensionFlow && (
            <div className="flex flex-col items-center mb-8">
              <Image src="/logos/DuoSign_logo.svg" alt="DuoSign" width={130} height={30} className="logo-adaptive mb-4" />
              <h1 className="text-xl font-semibold text-text-1 mb-1">Welcome back</h1>
              <p className="text-sm text-text-2">Sign in to your account</p>
            </div>
          )}

          <div className="bg-surface border border-border rounded-panel shadow-raised p-8">
            {isExtensionFlow && (
              <div className="mb-6">
                <h2 className="text-base font-semibold text-text-1 mb-1">Sign in to continue</h2>
                <p className="text-xs text-text-2 leading-relaxed">
                  Your session will be securely passed to the DuoSign extension.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                })}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Min 8 characters" },
                })}
              />

              {/* Flow state feedback */}
              {flowState === "fetching-token" && (
                <div className="flex items-center gap-2 text-xs text-text-2 bg-surface-2 border border-border rounded-btn px-3 py-2">
                  <svg className="animate-spin w-3.5 h-3.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Connecting to extension…
                </div>
              )}

              {authError && flowState !== "fetching-token" && (
                <p className="text-sm text-red-400 text-center">{authError}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-1"
                isLoading={isLoading || isSubmitting}
                disabled={isLoading || isSubmitting}
              >
                {isExtensionFlow ? "Sign In & Connect" : "Sign In"}
              </Button>
            </form>

            <div className="mt-5 text-center space-y-3">
              <p className="text-sm text-text-2">
                No account?{" "}
                <Link
                  href={`/auth/register${isExtensionFlow && extId ? `?source=extension&ext_id=${extId}` : ""}`}
                  className="text-accent font-medium hover:underline"
                >
                  Create one
                </Link>
              </p>
              {!isExtensionFlow && (
                <Link href="/translate">
                  <Button variant="ghost" size="md" className="w-full opacity-70 hover:opacity-100">
                    Continue as guest
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Extension security notice */}
          {isExtensionFlow && (
            <p className="text-center text-xs text-text-3 mt-5 leading-relaxed px-4">
              Your credentials are never shared with the extension.
              Only a session token is stored locally in your browser.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
