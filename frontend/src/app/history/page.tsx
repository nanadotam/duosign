"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import GuestBanner from "@/widgets/guest-banner/GuestBanner";
import GlossChip from "@/shared/ui/GlossChip";
import { ToastProvider } from "@/shared/ui/Toast";
import { useHistory } from "@/shared/hooks/useHistory";
import type { HistoryEntry } from "@/shared/hooks/useHistory";


const DATE_CHIPS = ["Today", "This Week", "This Month", "All Time"];
const TYPE_FILTERS_STATIC = [
  { key: "typed",  label: "Typed Text",  color: "var(--accent)" },
  { key: "voiced", label: "Voice Input", color: "var(--teal)" },
  { key: "api",    label: "API Request", color: "var(--warn)" },
];

const ICON_COLORS = {
  typed:  "var(--accent)",
  voiced: "var(--teal)",
  api:    "var(--warn)",
} as const;

function TypeIcon({ type }: { type: "typed" | "voiced" | "api" }) {
  const color = ICON_COLORS[type];
  if (type === "typed") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color }}>
      <path d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
  if (type === "voiced") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color }}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color }}>
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" />
    </svg>
  );
}


// TODO: Guest User - Guest users cannot export MP4 videos and cannot access translation history actions (search, filter, replay from history, re-edit, or delete saved entries).
// TODO: Registered User - View previously translated phrases in a searchable, filterable translation history, grouped by date and annotated with input type (typed, voiced).
export default function HistoryPage() {
  const router = useRouter();
  const { deleteEntry, markExported, getFiltered, stats } = useHistory();

  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [activeDate, setActiveDate]   = useState("All Time");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(["typed", "voiced", "api"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [segTab, setSegTab]           = useState("All");

  const toggleType = useCallback((key: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteEntry(id);
  }, [deleteEntry]);

  const clearFilters = useCallback(() => {
    setActiveDate("All Time");
    setActiveTypes(new Set(["typed", "voiced", "api"]));
    setSearchQuery("");
  }, []);

  const handleReplay = useCallback((entry: HistoryEntry) => {
    const params = new URLSearchParams({ text: entry.text, autoplay: "true" });
    router.push(`/translate?${params.toString()}`);
  }, [router]);

  const handleEdit = useCallback((entry: HistoryEntry) => {
    const params = new URLSearchParams({ text: entry.text });
    router.push(`/translate?${params.toString()}`);
  }, [router]);

  const handleExport = useCallback((entry: HistoryEntry) => {
    markExported(entry.id);
    const params = new URLSearchParams({ text: entry.text, autoplay: "true", export: "true" });
    router.push(`/translate?${params.toString()}`);
  }, [markExported, router]);

  // Base filter
  const filtered = getFiltered({ types: activeTypes, search: searchQuery, dateRange: activeDate });

  // Seg-tab filter on top
  const segFiltered = segTab === "Exported" ? filtered.filter((e) => e.exported) : filtered;

  // Group by date label
  const dateGroups: Record<string, typeof segFiltered> = {};
  segFiltered.forEach((e) => {
    if (!dateGroups[e.date]) dateGroups[e.date] = [];
    dateGroups[e.date].push(e);
  });

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <NavigationBar />
        <GuestBanner remaining={3} />
        <main className="flex-1 grid grid-cols-[280px_1fr] max-w-[1300px] w-full mx-auto p-5 gap-[18px]">

          {/* ═══ FILTER SIDEBAR ═══ */}
          <aside className="sticky top-[74px] h-fit">
            <div className="bg-surface border border-border rounded-panel shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.045)] overflow-hidden transition-all duration-250">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border transition-all duration-250">
                <div className="flex items-center gap-[7px] text-[10.5px] font-bold tracking-[0.09em] uppercase text-text-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-border-hi" />
                  Filters
                </div>
                <button
                  onClick={clearFilters}
                  className="w-[27px] h-[27px] rounded-[7px] border border-border bg-surface text-text-3 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all hover:text-error hover:border-error/30 hover:shadow-[0_0_10px_rgba(248,113,113,0.25)] active:shadow-inset-press active:translate-y-px"
                  title="Clear all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                {/* Search */}
                <div className="relative mb-3.5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search translations…"
                    className="w-full py-2 pl-3 pr-[34px] rounded-btn border border-border-hi bg-surface-2 text-text-1 font-sans text-[13px] outline-none shadow-inset transition-all focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)] placeholder:text-text-3"
                  />
                  <svg className="absolute right-[10px] top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>

                {/* Date Range */}
                <div className="mb-[18px]">
                  <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">Date Range</div>
                  <div className="flex flex-wrap gap-[5px]">
                    {DATE_CHIPS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setActiveDate(d)}
                        className={[
                          "px-[10px] py-1 rounded-pill text-[11.5px] font-medium border cursor-pointer shadow-raised-sm transition-all active:shadow-inset-press active:translate-y-px",
                          activeDate === d
                            ? "bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface-2))] border-accent text-accent"
                            : "border-border-hi bg-surface-2 text-text-3 hover:text-text-2",
                        ].join(" ")}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Type */}
                <div className="mb-[18px]">
                  <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">Input Type</div>
                  <div className="flex flex-col gap-1">
                    {TYPE_FILTERS_STATIC.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => toggleType(t.key)}
                        className={[
                          "flex items-center gap-2 px-[10px] py-[7px] rounded-btn text-[12.5px] cursor-pointer border transition-all text-left",
                          activeTypes.has(t.key)
                            ? "bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-2))] text-accent border-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
                            : "text-text-2 border-transparent hover:bg-surface-2 hover:text-text-1",
                        ].join(" ")}
                      >
                        <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: t.color }} />
                        {t.label}
                        <span className="ml-auto font-mono text-[10px] text-text-3">{stats.types[t.key as keyof typeof stats.types]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2 font-mono">Your Stats</div>
                  <div className="grid grid-cols-2 gap-px bg-border rounded-[10px] overflow-hidden">
                    {[
                      { num: String(stats.total),      lbl: "Total" },
                      { num: String(stats.today),      lbl: "Today" },
                      { num: String(stats.totalSigns), lbl: "Signs" },
                      { num: "–",                      lbl: "Avg." },
                    ].map((s) => (
                      <div key={s.lbl} className="bg-surface-2 px-3 py-[10px] text-center">
                        <div className="font-serif text-[22px] text-text-1 leading-none tracking-tight">{s.num}</div>
                        <div className="text-[10px] text-text-3 mt-[3px] tracking-[0.04em] uppercase font-mono">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ═══ HISTORY LIST ═══ */}
          <div className="bg-surface border border-border rounded-panel shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.045)] overflow-hidden transition-all duration-250 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border transition-all duration-250">
              <div className="flex items-center gap-[7px] text-[10.5px] font-bold tracking-[0.09em] uppercase text-text-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                Translation History
                <span className="px-[9px] py-[3px] rounded-pill bg-surface-3 border border-border text-[11px] text-text-3 font-mono shadow-inset ml-1">{segFiltered.length} entries</span>
              </div>
              {/* Segmented control — All / Exported only */}
              <div className="flex bg-surface-3 border border-border rounded-[7px] p-[2px] shadow-inset">
                {["All", "Exported"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSegTab(s)}
                    className={[
                      "px-[11px] py-[3px] rounded-[5px] text-[11px] font-medium cursor-pointer border transition-all",
                      segTab === s
                        ? "bg-surface border-border-hi text-text-1 shadow-raised-sm"
                        : "border-transparent text-text-3 hover:text-text-2",
                    ].join(" ")}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-[10px]">
              {segFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-[60px] text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center shadow-inset mb-1">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
                      <circle cx="12" cy="12" r="10" /><line x1="8" y1="15" x2="16" y2="15" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </div>
                  <div className="font-serif text-[18px] text-text-1">
                    {segTab === "Exported" ? "No exported translations yet" : "No translations yet"}
                  </div>
                  <p className="text-[12.5px] text-text-3 leading-relaxed max-w-[240px]">
                    {segTab === "Exported"
                      ? "Hit Export on any translation to save it as a file."
                      : "Head over to the Translate tab to create your first translation."}
                  </p>
                </div>
              ) : (
                Object.entries(dateGroups).map(([date, items]) => (
                  <div key={date}>
                    {/* Date divider */}
                    <div className="flex items-center gap-[10px] text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 font-mono py-1 mb-1">
                      {date}
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="flex flex-col gap-[10px]">
                      {items.map((entry) => {
                        const isExpanded = expandedId === entry.id;
                        return (
                          <div
                            key={entry.id}
                            className={[
                              "bg-surface-2 border rounded-[13px] overflow-hidden cursor-pointer shadow-raised-sm transition-all duration-150 hover:border-border-hi hover:shadow-raised hover:-translate-y-px active:translate-y-0 active:shadow-raised-sm",
                              isExpanded ? "border-[color-mix(in_srgb,var(--accent)_30%,var(--border))]" : "border-border",
                            ].join(" ")}
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          >
                            {/* Top row */}
                            <div className="flex items-start gap-3 px-3.5 py-[13px]">
                              <div className="w-9 h-9 rounded-btn flex-shrink-0 bg-surface-3 border border-border flex items-center justify-center shadow-inset transition-colors">
                                <TypeIcon type={entry.type} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-[13.5px] font-medium text-text-1 truncate leading-snug">{entry.text}</div>
                                <div className="flex items-center gap-2 mt-[5px] flex-wrap">
                                  <span className="text-[11.5px] text-text-3 font-mono">{entry.time}</span>
                                  <span className={[
                                    "px-2 py-[2px] rounded-pill text-[10px] font-semibold font-mono tracking-[0.04em] border shadow-inset",
                                    entry.type === "typed"  ? "bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-3))] border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-accent" :
                                    entry.type === "voiced" ? "bg-[color-mix(in_srgb,var(--teal)_10%,var(--surface-3))] border-[color-mix(in_srgb,var(--teal)_25%,transparent)] text-teal" :
                                    "bg-[color-mix(in_srgb,var(--warn)_10%,var(--surface-3))] border-[color-mix(in_srgb,var(--warn)_25%,transparent)] text-[var(--warn)]",
                                  ].join(" ")}>
                                    {entry.type === "typed" ? "Typed" : entry.type === "voiced" ? "Voice" : "API"}
                                  </span>
                                  <span className="px-2 py-[2px] rounded-pill text-[10px] font-semibold font-mono border border-border bg-surface-3 text-text-3 shadow-inset">
                                    {entry.glossTokens.length} glosses
                                  </span>
                                  {entry.exported && (
                                    <span className="px-2 py-[2px] rounded-pill text-[10px] font-semibold font-mono border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,var(--surface-3))] text-success shadow-inset">
                                      Exported
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-[7px] flex-shrink-0">
                                <span className="text-[11px] text-text-3 font-mono px-2 py-[3px] rounded-[6px] bg-surface-3 border border-border shadow-inset">
                                  {entry.glossTokens.length} signs
                                </span>
                                <div className={[
                                  "w-5 h-5 flex items-center justify-center transition-transform duration-200",
                                  isExpanded ? "rotate-180 text-accent" : "text-text-3",
                                ].join(" ")}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Expanded: gloss strip + actions */}
                            {isExpanded && (
                              <div className="px-3.5 pb-[13px] pt-[11px] border-t border-border flex flex-col gap-[10px]">
                                <div className="flex gap-[5px] flex-wrap">
                                  {entry.glossTokens.map((g, i) => (
                                    <GlossChip key={`${g}-${i}`} text={g} delay={0} />
                                  ))}
                                </div>
                                <div className="flex gap-1.5 items-center">
                                  {/* Replay — navigate to translate page and auto-play */}
                                  {/* TODO: Registered User - Replay, re-edit, or delete any saved history entry. */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleReplay(entry); }}
                                    className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[7px] text-white font-sans text-[12px] font-medium cursor-pointer transition-all hover:brightness-110 active:translate-y-px active:brightness-[0.93]"
                                    style={{
                                      background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
                                      border: "1px solid var(--accent-dim)",
                                      boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)",
                                    }}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                    Replay
                                  </button>

                                  {/* Export — download .txt and mark as exported */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleExport(entry); }}
                                    className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[7px] border border-border-hi bg-surface text-text-2 font-sans text-[12px] font-medium cursor-pointer shadow-raised-sm transition-all hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    Export
                                  </button>

                                  {/* Edit — navigate to translate page with text pre-filled */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(entry); }}
                                    className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[7px] border border-border-hi bg-surface text-text-2 font-sans text-[12px] font-medium cursor-pointer shadow-raised-sm transition-all hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    Edit
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                                    className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[7px] border border-[color-mix(in_srgb,var(--error)_30%,transparent)] bg-surface text-error font-sans text-[12px] font-medium cursor-pointer shadow-raised-sm transition-all ml-auto hover:bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] hover:shadow-[var(--raised-sm),0_0_12px_rgba(248,113,113,0.25)] active:shadow-inset-press active:translate-y-px"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {segFiltered.length > 0 && (
                <div className="flex justify-center pt-2 pb-4">
                  <button className="px-7 py-2 rounded-btn border border-border-hi bg-surface-2 text-text-2 font-sans text-[13px] font-medium cursor-pointer shadow-raised-sm transition-all hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px">
                    Load more entries
                  </button>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </ToastProvider>
  );
}
