"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import { signIn } from "@/lib/auth-client";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      const { error } = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/translate",
      });
      if (error) {
        setAuthError(error.message ?? "Invalid email or password.");
      } else {
        router.push("/translate");
      }
    } catch {
      setAuthError("Sign-in is unavailable right now. Check your auth URL and try again.");
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
            <h1 className="text-xl font-semibold text-text-1 mb-1">Welcome back</h1>
            <p className="text-sm text-text-2">Sign in to your account</p>
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
              })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {authError && (
              <p className="text-sm text-red-500 text-center">{authError}</p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-2">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-accent font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/translate">
              <Button variant="ghost" size="md" className="w-full opacity-70 hover:opacity-100">
                Continue as guest
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
