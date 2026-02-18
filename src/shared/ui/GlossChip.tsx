"use client";

interface GlossChipProps {
  text: string;
  isActive?: boolean;
  isSpelled?: boolean;
  delay?: number;
  onClick?: () => void;
}

export default function GlossChip({
  text,
  isActive = false,
  isSpelled = false,
  delay = 0,
  onClick,
}: GlossChipProps) {
  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={[
        "flex-shrink-0 px-3.5 py-1 rounded-pill",
        "border font-mono text-[11.5px] font-semibold tracking-wide",
        "shadow-raised-sm cursor-default select-none",
        "opacity-0 translate-y-[5px] animate-[chip-in_0.22s_ease_forwards]",
        "transition-[background,border-color,color,box-shadow] duration-150",
        isActive
          ? "bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface-2))] border-accent text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_25%,transparent),var(--raised-sm)]"
          : isSpelled
            ? "bg-surface-2 border-[color-mix(in_srgb,var(--teal)_40%,transparent)] text-teal"
            : "bg-surface-2 border-border-hi text-text-2",
        onClick ? "cursor-pointer hover:border-accent/40" : "",
      ].join(" ")}
    >
      {text}
      {isSpelled && (
        <span className="ml-1.5 text-[8px] font-bold px-1 py-px rounded-[3px] bg-teal/[0.14] text-teal tracking-wider align-middle">
          ABC
        </span>
      )}
    </div>
  );
}
