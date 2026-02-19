"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import Image from "next/image";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    // TODO: integrate with API
    console.log("Register:", data);
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
            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isSubmitting}>
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
