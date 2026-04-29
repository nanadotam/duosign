"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import { signUp } from "@/lib/auth-client";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrototype, setConsentPrototype] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>();

  const canSubmit = consentTerms && consentPrototype;

  const onSubmit = async (data: RegisterFormData) => {
    if (!canSubmit) return;
    setAuthError(null);
    try {
      const { error } = await signUp.email({
        email: data.email.trim(),
        password: data.password,
        name: data.email.split("@")[0].replace(/[^a-zA-Z0-9._\- ]/g, "").trim().slice(0, 50) || "User",
        callbackURL: "/translate",
      });
      if (error) {
        setAuthError(error.message ?? "Could not create account. Please try again.");
      } else {
        router.push("/translate");
      }
    } catch {
      setAuthError("Sign-up is unavailable right now. Check your auth URL and try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-surface border border-border rounded-panel shadow-raised p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logos/DuoSign_logo.svg" alt="DuoSign" width={140} height={32} className="logo-adaptive" />
            </div>
            <h1 className="text-xl font-semibold text-text-1 mb-1">Create your account</h1>
            <p className="text-sm text-text-2">Get unlimited translations</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                setValueAs: (v: string) => v.trim(),
              })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Minimum 8 characters" },
                maxLength: { value: 72, message: "Max 72 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                  message: "Must include uppercase, lowercase, number, and special character",
                },
              })}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (val) => val === watch("password") || "Passwords do not match",
              })}
            />

            {/* Consent block */}
            <div className="flex flex-col gap-3 py-3 px-3.5 bg-surface-2 border border-border rounded-[10px] text-sm">
              <label className="flex gap-2.5 items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent cursor-pointer"
                />
                <span className="text-text-2 leading-snug group-hover:text-text-1 transition-colors">
                  I have read and agree to DuoSign&apos;s{" "}
                  <Link href="/terms" target="_blank" className="text-accent hover:underline font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-accent hover:underline font-medium">
                    Privacy Policy
                  </Link>
                  , including the WLASL C-UDA data use obligations.
                </span>
              </label>

              <label className="flex gap-2.5 items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentPrototype}
                  onChange={(e) => setConsentPrototype(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent cursor-pointer"
                />
                <span className="text-text-2 leading-snug group-hover:text-text-1 transition-colors">
                  I understand that DuoSign is an academic prototype and not a certified accessibility tool.
                </span>
              </label>
            </div>

            {authError && (
              <p className="text-sm text-red-500 text-center">{authError}</p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={`w-full mt-2 transition-opacity ${!canSubmit ? "opacity-40 cursor-not-allowed" : ""}`}
              isLoading={isSubmitting}
              disabled={!canSubmit || isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-2">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-accent font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
