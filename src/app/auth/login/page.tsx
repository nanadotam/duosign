"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    // TODO: integrate with API
    console.log("Login:", data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-surface border border-border rounded-panel shadow-raised p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[7px] h-[7px] rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
              <span className="font-serif text-2xl text-text-1">DuoSign</span>
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
