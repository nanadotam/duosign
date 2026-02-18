"use client";

import { ButtonHTMLAttributes, forwardRef, CSSProperties } from "react";

type Variant = "primary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    "text-white font-semibold",
    "hover:brightness-110",
    "active:translate-y-px active:brightness-[0.93]",
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
    "text-white font-semibold",
    "hover:brightness-110",
    "active:translate-y-px active:brightness-[0.93]",
  ].join(" "),
};

/* Inline styles for gradients — Tailwind cannot parse raw CSS vars in gradient stops */
const variantInlineStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--accent-dim)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px color-mix(in srgb, var(--accent) 35%, transparent)",
  },
  ghost: {},
  destructive: {
    background: "linear-gradient(180deg, #F87171 0%, #c52020 100%)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(248,113,113,0.4)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 3px 10px rgba(248,113,113,0.3)",
  },
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-btn gap-1.5",
  md: "px-4 py-1.5 text-[13px] rounded-btn gap-2",
  lg: "px-6 py-2.5 text-sm rounded-btn gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, className = "", style, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          "inline-flex items-center justify-center transition-all duration-120 cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "font-sans",
          variantClasses[variant],
          sizeStyles[size],
          className,
        ].join(" ")}
        style={{ ...variantInlineStyles[variant], ...style }}
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

