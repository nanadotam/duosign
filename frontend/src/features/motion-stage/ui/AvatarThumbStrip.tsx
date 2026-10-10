"use client";

/* eslint-disable @next/next/no-img-element */

export interface AvatarThumb {
  id: string;
  name: string;
  thumb?: string;
  /** Older avatars, listed after a "Legacy" divider */
  legacy?: boolean;
}

interface AvatarThumbStripProps {
  avatars: readonly AvatarThumb[];
  currentId: string;
  onSelect: (id: string) => void;
}

/** Row of avatar portraits — one click to change who is signing. */
export default function AvatarThumbStrip({ avatars, currentId, onSelect }: AvatarThumbStripProps) {
  const renderThumb = (a: AvatarThumb, legacy = false) => {
    const active = a.id === currentId;
    return (
      <button
        key={a.id}
        onClick={() => onSelect(a.id)}
        aria-label={`Use ${a.name}${legacy ? " (legacy)" : ""}`}
        aria-pressed={active}
        title={legacy ? `${a.name} (legacy avatar)` : a.name}
        className={[
          "flex items-center gap-1.5 pl-[3px] pr-2.5 py-[3px] rounded-pill border flex-shrink-0 cursor-pointer transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/70",
          active
            ? "border-accent bg-accent/15 text-accent"
            : "border-border bg-surface text-text-2 hover:text-text-1 hover:border-border-hi",
          legacy && !active ? "opacity-70 hover:opacity-100" : "",
        ].join(" ")}
      >
        {a.thumb ? (
          <img src={a.thumb} alt="" width={legacy ? 22 : 26} height={legacy ? 22 : 26} className={`${legacy ? "w-[22px] h-[22px]" : "w-[26px] h-[26px]"} rounded-full object-cover`} />
        ) : (
          <span className={`${legacy ? "w-[22px] h-[22px]" : "w-[26px] h-[26px]"} rounded-full bg-surface-3 text-[11px] font-bold flex items-center justify-center`}>
            {a.name.charAt(0)}
          </span>
        )}
        <span className={`${legacy ? "text-[10.5px] lg:text-[11px]" : "text-[11px] lg:text-[12px]"} font-semibold whitespace-nowrap`}>{a.name}</span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 lg:px-4 bg-surface-2 border-b border-border overflow-x-auto">
      <span className="text-[9.5px] lg:text-[10.5px] font-bold tracking-[0.09em] uppercase text-text-3 flex-shrink-0 mr-1">
        Signer
      </span>
      {avatars.filter((a) => !a.legacy).map((a) => renderThumb(a))}
      {avatars.some((a) => a.legacy) && (
        <>
          <span className="w-px h-[22px] bg-border flex-shrink-0 mx-1" aria-hidden="true" />
          <span className="text-[9px] lg:text-[9.5px] font-bold tracking-[0.09em] uppercase text-text-3 flex-shrink-0">Legacy</span>
          {avatars.filter((a) => a.legacy).map((a) => renderThumb(a, true))}
        </>
      )}
    </div>
  );
}
