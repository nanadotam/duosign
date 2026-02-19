"use client";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps) {
  const paddings = size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-4 py-1 text-[13px]";

  return (
    <div className="flex gap-0.5 bg-surface-2 border border-border rounded-[10px] p-[3px] shadow-inset transition-all duration-250">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={[
            "rounded-[7px] font-medium cursor-pointer select-none",
            "transition-all duration-120 border border-transparent",
            paddings,
            opt === value
              ? "bg-surface border-border-hi text-text-1 shadow-raised-sm"
              : "text-text-3 hover:text-text-2",
            "active:shadow-inset-press active:translate-y-px",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
