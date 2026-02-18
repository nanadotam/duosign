"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: [
    "border border-accent-dim",
    "bg-gradient-to-b from-accent-btn-top to-accent-dim",
    "text-white font-semibold",
    "shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_3px_10px_color-mix(in_srgb,var(--accent)_35%,transparent)]",
    "hover:brightness-110",
    "active:translate-y-px active:shadow-inset-press active:brightness-[0.93]",
  ].join(" "),
  ghost: [
    "border border-border-hi",
    "bg-transparent",
    "text-text-2 font-medium",
    "shadow-raised-sm",
    "hover:text-text-1 hover:bg-surface-2",
    "active:shadow-inset-press active:translate-y-px",
  ].join(" "),
  destructive: [
    "border border-error/40",
    "bg-gradient-to-b from-error to-[#c52020]",
    "text-white font-semibold",
    "shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_3px_10px_rgba(248,113,113,0.3)]",
    "hover:brightness-110",
    "active:translate-y-px active:shadow-inset-press active:brightness-[0.93]",
  ].join(" "),
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-btn gap-1.5",
  md: "px-4 py-1.5 text-[13px] rounded-btn gap-2",
  lg: "px-6 py-2.5 text-sm rounded-btn gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          "inline-flex items-center justify-center transition-all duration-120 cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "font-sans",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(" ")}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
