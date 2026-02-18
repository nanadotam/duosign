"use client";

type BadgeVariant = "web" | "extension" | "typed" | "voice";

const variantStyles: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  web: {
    bg: "bg-accent/10 border-accent/20",
    text: "text-accent",
    label: "Web",
  },
  extension: {
    bg: "bg-teal/10 border-teal/20",
    text: "text-teal",
    label: "Extension",
  },
  typed: {
    bg: "bg-text-3/10 border-text-3/20",
    text: "text-text-2",
    label: "Typed",
  },
  voice: {
    bg: "bg-success/10 border-success/20",
    text: "text-success",
    label: "Voice",
  },
};

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

export default function Badge({ variant, className = "" }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-pill",
        "border text-[10px] font-semibold tracking-wider uppercase",
        "font-mono",
        style.bg,
        style.text,
        className,
      ].join(" ")}
    >
      {style.label}
    </span>
  );
}
