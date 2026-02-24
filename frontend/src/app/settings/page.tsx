"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import { useSettings } from "@/shared/hooks/useSettings";
import { useHistory } from "@/shared/hooks/useHistory";

/* ═══ SIDEBAR DATA ═══ */
const SIDEBAR = [
  {
    section: "Account",
    items: [
      { id: "profile", label: "Profile", icon: "user" },
      { id: "preferences", label: "Preferences", icon: "settings" },
      { id: "avatar", label: "Avatar", icon: "users" },
      { id: "accessibility", label: "Accessibility", icon: "smile" },
    ],
  },
  {
    section: "Translation",
    items: [
      { id: "nlp", label: "NLP Engine", icon: "code" },
      { id: "voice", label: "Voice Input", icon: "mic" },
    ],
  },
  {
    section: "Developer",
    items: [
      { id: "api", label: "API Keys", icon: "terminal", badge: "NEW" },
      { id: "webhooks", label: "Webhooks", icon: "file" },
    ],
  },
  {
    section: "Support",
    items: [{ id: "help", label: "Help & Docs", icon: "help" }],
  },
];

const SKIN_TONES = [
  { bg: "linear-gradient(135deg,#FFDBB4,#E8A87C)", emoji: "👤" },
  { bg: "linear-gradient(135deg,#C68642,#A0522D)", emoji: "👤" },
  { bg: "linear-gradient(135deg,#8D5524,#5C3317)", emoji: "👤" },
  { bg: "linear-gradient(135deg,#FFE0B2,#FFCC80)", emoji: "👤" },
  { bg: "linear-gradient(135deg,#D0D0D0,#A8A8A8)", emoji: "👤" },
];

const ACCENT_COLORS = ["#5B8EF0", "#2DD4BF", "#4ADE80", "#A78BFA", "#FB923C"];

function SIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    users: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    smile: <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></>,
    code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
    mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>,
    terminal: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0 opacity-70">
      {icons[name]}
    </svg>
  );
}

/* ═══ SETTINGS COMPONENTS ═══ */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={[
        "w-10 h-[22px] rounded-full relative cursor-pointer border transition-all duration-[180ms] shadow-inset outline-none",
        on
          ? "bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface-3))] border-accent-dim shadow-[var(--inset),0_0_0_1px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
          : "bg-surface-3 border-border-hi",
      ].join(" ")}
    >
      <div
        className={[
          "absolute w-4 h-4 rounded-full top-[2px] left-[2px] transition-all duration-[180ms] shadow-[0_1px_3px_rgba(0,0,0,0.4)]",
          on ? "translate-x-[18px] bg-accent" : "bg-text-3",
        ].join(" ")}
      />
    </button>
  );
}

function SettingsCard({ title, chip, danger, children }: { title: string; chip?: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <div className={[
      "bg-surface border rounded-panel shadow-[var(--raised),inset_0_1px_0_rgba(255,255,255,0.045)] overflow-hidden mb-[18px] transition-all duration-250",
      danger ? "border-[color-mix(in_srgb,var(--error)_25%,var(--border))]" : "border-border",
    ].join(" ")}>
      <div className={[
        "flex items-center justify-between px-4 py-[11px] border-b transition-all duration-250",
        danger ? "bg-[color-mix(in_srgb,var(--error)_5%,var(--surface-2))] border-border" : "bg-surface-2 border-border",
      ].join(" ")}>
        <div className="flex items-center gap-[7px] text-[10.5px] font-bold tracking-[0.09em] uppercase transition-colors duration-250"
          style={{ color: danger ? "var(--error)" : "var(--text-3)" }}>
          <div className={[
            "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-250",
            danger ? "bg-error shadow-[0_0_6px_var(--error)]" : "bg-border-hi",
          ].join(" ")} />
          {title}
        </div>
        {chip && (
          <span className="px-[9px] py-[3px] rounded-pill bg-surface-3 border border-border text-[11px] text-text-3 font-mono shadow-inset transition-all duration-250">
            {chip}
          </span>
        )}
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, children, danger, stack }: { label: string; desc?: string; children?: React.ReactNode; danger?: boolean; stack?: boolean }) {
  return (
    <div className={[
      "flex gap-5 py-[13px] border-b border-border last:border-b-0 transition-colors duration-250",
      stack ? "flex-col items-start gap-3" : "items-center justify-between",
    ].join(" ")}>
      <div className="flex-1 min-w-0">
        <div className={[
          "text-[13.5px] font-medium transition-colors duration-250",
          danger ? "text-error" : "text-text-1",
        ].join(" ")}>{label}</div>
        {desc && <div className="text-[12px] text-text-3 mt-[3px] leading-relaxed transition-colors duration-250">{desc}</div>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

function Select({ options, defaultValue, onChange }: { options: string[]; defaultValue?: string; onChange?: () => void }) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={onChange}
      className="py-[5px] pl-[10px] pr-[28px] rounded-btn border border-border-hi bg-surface-2 font-sans text-[12.5px] font-medium text-text-1 cursor-pointer outline-none appearance-none min-w-[150px] shadow-raised-sm transition-all duration-150 focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--raised-sm),0_0_0_3px_var(--accent-glow)]"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234E5570' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("preferences");
  const [savedFlash, setSavedFlash] = useState(false);
  const { settings, updateSetting, isDirty, save, discard } = useSettings();
  const { clearAll: clearHistory } = useHistory();

  // Voice sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [micLive, setMicLive] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSave = useCallback(() => {
    save();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }, [save]);

  // Voice sheet waveform
  useEffect(() => {
    if (sheetOpen && barsRef.current && barsRef.current.children.length === 0) {
      for (let i = 0; i < 52; i++) {
        const b = document.createElement("div");
        b.className = "w-[2.5px] rounded-sm min-h-[3px] transition-all duration-75";
        b.style.background = "var(--border-hi)";
        b.style.height = "3px";
        barsRef.current.appendChild(b);
      }
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (!barsRef.current) return;
    if (micLive) {
      const bars = Array.from(barsRef.current.children) as HTMLElement[];
      const mid = bars.length / 2;
      waveTimerRef.current = setInterval(() => {
        bars.forEach((b, i) => {
          const dist = Math.abs(i - mid) / mid;
          const h = Math.max(3, Math.round((1 - dist * 0.35) * Math.random() * 48));
          b.style.height = h + "px";
          b.style.background = "var(--accent)";
        });
      }, 85);
    } else {
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
      const bars = barsRef.current ? Array.from(barsRef.current.children) as HTMLElement[] : [];
      bars.forEach((b) => { b.style.height = "3px"; b.style.background = "var(--border-hi)"; });
    }
    return () => { if (waveTimerRef.current) clearInterval(waveTimerRef.current); };
  }, [micLive]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <div className="flex-1 grid grid-cols-[220px_1fr]">
        {/* SIDEBAR */}
        <aside className="bg-surface border-r border-border py-[18px] sticky top-[54px] h-[calc(100vh-54px)] overflow-y-auto transition-all duration-250 scrollbar-thin">
          {SIDEBAR.map((group) => (
            <div key={group.section}>
              <div className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-text-3 px-4 mt-[18px] first:mt-0 mb-[5px] transition-colors duration-250">
                {group.section}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={[
                    "flex items-center gap-[9px] w-full px-4 py-2 text-[13px] font-medium cursor-pointer border-l-2 transition-all duration-120 text-left",
                    activeSection === item.id
                      ? "text-accent bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border-l-accent"
                      : "text-text-2 border-l-transparent hover:text-text-1 hover:bg-surface-2",
                  ].join(" ")}
                >
                  <SIcon name={item.icon} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-px rounded-pill text-[9.5px] font-bold font-mono bg-[color-mix(in_srgb,var(--teal)_14%,transparent)] text-teal border border-[color-mix(in_srgb,var(--teal)_25%,transparent)]">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="py-7 px-8 max-w-[780px] overflow-y-auto">

          {/* ═══ PROFILE ═══ */}
          {activeSection === "profile" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Account <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Profile</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Manage your identity and account details.</p>
              </div>

              <SettingsCard title="Personal Information" chip="identity">
                <SettingRow label="Display Name" desc="How your name appears across DuoSign">
                  <input type="text" defaultValue="Nana Amoako" className="py-1.5 px-[10px] rounded-btn border border-border-hi bg-surface-3 font-sans text-[12.5px] text-text-1 w-[210px] outline-none shadow-inset transition-all duration-150 focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]" />
                </SettingRow>
                <SettingRow label="Email Address" desc="Used for account recovery and notifications">
                  <input type="email" defaultValue="nana@duosign.app" className="py-1.5 px-[10px] rounded-btn border border-border-hi bg-surface-3 font-sans text-[12.5px] text-text-1 w-[210px] outline-none shadow-inset transition-all duration-150 focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]" />
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Session" chip="auth">
                <SettingRow label="Account Status" desc="Your current authentication state">
                  <span className="px-3 py-1 rounded-pill text-[11px] font-bold font-mono tracking-[0.06em] bg-[color-mix(in_srgb,var(--teal)_12%,var(--surface-3))] border border-[color-mix(in_srgb,var(--teal)_25%,transparent)] text-teal shadow-inset">
                    Guest Mode
                  </span>
                </SettingRow>
                <SettingRow label="Guest Translations Remaining" desc="Free translations available before sign-up">
                  <span className="font-mono text-[14px] font-semibold text-accent">3 / 8</span>
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Danger Zone" chip="irreversible" danger>
                <SettingRow label="Delete Account" desc="Permanently deletes your account and all associated data" danger>
                  <button className="px-3.5 py-[5px] rounded-btn border border-[color-mix(in_srgb,var(--error)_35%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,var(--surface-2))] text-error font-sans text-[12.5px] font-semibold cursor-pointer shadow-raised-sm transition-all duration-120 whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--error)_16%,var(--surface-2))] active:shadow-inset-press active:translate-y-px">
                    Delete Account
                  </button>
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ PREFERENCES ═══ */}
          {activeSection === "preferences" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Account <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Preferences</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Customize how DuoSign looks and behaves.</p>
              </div>

              <SettingsCard title="Translation" chip="engine">
                <SettingRow label="Translation Engine" desc="Rule-based handles 75–85% of phrases in under 50ms. LLM fallback covers edge cases.">
                  <Select options={["Hybrid (Rule + LLM)", "Rule-based only", "LLM only"]} defaultValue={settings.translationEngine} onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Animation Speed" desc="Playback speed for signing animations">
                  <div className="flex items-center gap-[9px]">
                    <input
                      type="range" min="50" max="200" value={settings.animationSpeed}
                      onChange={(e) => updateSetting("animationSpeed", Number(e.target.value))}
                      className="w-[110px] h-1 rounded bg-surface-3 appearance-none cursor-pointer shadow-inset accent-accent"
                    />
                    <span className="font-mono text-[11px] text-accent min-w-[30px] text-right">
                      {(settings.animationSpeed / 100).toFixed(1)}×
                    </span>
                  </div>
                </SettingRow>
                <SettingRow label="Show Gloss Strip" desc="Display ASL gloss tokens above the avatar panel">
                  <Toggle on={settings.showGloss} onChange={() => updateSetting("showGloss", !settings.showGloss)} />
                </SettingRow>
                <SettingRow label="Auto-translate on Paste" desc="Instantly translate when text is pasted into the input">
                  <Toggle on={settings.autoPaste} onChange={() => updateSetting("autoPaste", !settings.autoPaste)} />
                </SettingRow>
                <SettingRow label="Loop Animations" desc="Automatically replay the signing sequence after completion">
                  <Toggle on={settings.loop} onChange={() => updateSetting("loop", !settings.loop)} />
                </SettingRow>
                <SettingRow label="Fingerspelling Fallback" desc="Use fingerspelling when a sign is not in the lexicon">
                  <Toggle on={settings.fingerspell} onChange={() => updateSetting("fingerspell", !settings.fingerspell)} />
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Notifications" chip="alerts">
                <SettingRow label="New Gloss Updates" desc="When new signs are added to the WLASL lexicon">
                  <Toggle on={settings.glossUpdates} onChange={() => updateSetting("glossUpdates", !settings.glossUpdates)} />
                </SettingRow>
                <SettingRow label="API Usage Alerts" desc="Notify when approaching rate limits">
                  <Toggle on={settings.apiAlerts} onChange={() => updateSetting("apiAlerts", !settings.apiAlerts)} />
                </SettingRow>
                <SettingRow label="Product Updates" desc="Feature announcements and release notes">
                  <Toggle on={settings.productUpdates} onChange={() => updateSetting("productUpdates", !settings.productUpdates)} />
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Data" chip="storage" danger>
                <SettingRow label="Clear Translation History" desc="Permanently removes all saved translations from browser storage" danger>
                  <button onClick={clearHistory} className="px-3.5 py-[5px] rounded-btn border border-[color-mix(in_srgb,var(--error)_35%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,var(--surface-2))] text-error font-sans text-[12.5px] font-semibold cursor-pointer shadow-raised-sm transition-all duration-120 whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--error)_16%,var(--surface-2))] active:shadow-inset-press active:translate-y-px">
                    Clear History
                  </button>
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ AVATAR ═══ */}
          {activeSection === "avatar" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Account <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Avatar</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Customize the 3D signing avatar appearance.</p>
              </div>

              <SettingsCard title="3D Avatar" chip="appearance">
                <SettingRow label="Skin Tone" desc="Choose the avatar's skin tone for comfortable representation" stack>
                  <div className="flex gap-2 flex-wrap">
                    {SKIN_TONES.map((st, i) => (
                      <button
                        key={i}
                        onClick={() => updateSetting("skinTone", i)}
                        className={[
                          "w-12 h-12 rounded-[12px] border cursor-pointer flex items-center justify-center text-xl transition-all duration-120 shadow-raised-sm relative",
                          settings.skinTone === i
                            ? "border-accent shadow-[var(--raised-sm),0_0_0_2px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                            : "border-border-hi bg-surface-2 hover:border-accent hover:-translate-y-0.5 hover:shadow-raised",
                        ].join(" ")}
                        style={{ background: st.bg }}
                      >
                        {st.emoji}
                        {settings.skinTone === i && <span className="absolute bottom-[2px] right-1 text-[8px] font-bold text-accent">✓</span>}
                      </button>
                    ))}
                    <button className="w-12 h-12 rounded-[12px] border border-dashed border-border-hi text-text-3 text-lg flex items-center justify-center cursor-pointer hover:text-text-2 hover:border-border-hi bg-transparent transition-all">
                      +
                    </button>
                  </div>
                </SettingRow>
                <SettingRow label="Avatar Style" desc="Realistic or stylized character rendering">
                  <div className="flex bg-surface-3 border border-border rounded-[7px] p-[2px] shadow-inset transition-all duration-250">
                    {["Realistic", "Stylized", "Minimal"].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateSetting("avatarStyle", s as "Realistic" | "Stylized" | "Minimal")}
                        className={[
                          "px-[13px] py-1 rounded-[5px] text-[12px] font-medium cursor-pointer transition-all duration-100 border",
                          settings.avatarStyle === s
                            ? "bg-surface border-border-hi text-text-1 shadow-raised-sm"
                            : "border-transparent text-text-3 hover:text-text-2",
                        ].join(" ")}
                      >{s}</button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Accent Color" desc="Highlight color used in avatar animations">
                  <div className="flex gap-[7px] items-center">
                    {ACCENT_COLORS.map((c, i) => (
                      <button
                        key={c}
                        onClick={() => updateSetting("accentColorIndex", i)}
                        className={[
                          "w-5 h-5 rounded-full cursor-pointer border-2 transition-all duration-120 shadow-raised-sm hover:scale-[1.2] relative",
                          settings.accentColorIndex === i ? "border-text-1 shadow-[var(--raised-sm),0_0_0_1px_var(--border-hi)]" : "border-transparent",
                        ].join(" ")}
                        style={{ background: c }}
                      >
                        {settings.accentColorIndex === i && <span className="absolute inset-[3px] rounded-full border-[1.5px] border-white/55" />}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Background" desc="Scene backdrop behind the signing avatar">
                  <Select options={["Transparent", "Grid (Dark)", "Grid (Light)", "Gradient Blue"]} defaultValue={settings.avatarBackground} onChange={() => updateSetting("avatarBackground", "Transparent")} />
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ ACCESSIBILITY ═══ */}
          {activeSection === "accessibility" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Account <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Accessibility</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Adjust display and interaction settings for your comfort.</p>
              </div>

              <SettingsCard title="Accessibility" chip="display">
                <SettingRow label="Caption Size" desc="Font size for gloss and transcript captions">
                  <Select options={["Small", "Medium", "Large", "Extra Large"]} defaultValue={settings.captionSize} onChange={() => {}} />
                </SettingRow>
                <SettingRow label="High Contrast Mode" desc="Increase contrast ratios for better visibility">
                  <Toggle on={settings.highContrast} onChange={() => updateSetting("highContrast", !settings.highContrast)} />
                </SettingRow>
                <SettingRow label="Reduce Motion" desc="Minimize UI animations (does not affect signing playback)">
                  <Toggle on={settings.reduceMotion} onChange={() => updateSetting("reduceMotion", !settings.reduceMotion)} />
                </SettingRow>
                <SettingRow label="Keyboard Shortcuts" desc="Space to start/stop voice — Enter to translate">
                  <Toggle on={settings.keyboardShortcuts} onChange={() => updateSetting("keyboardShortcuts", !settings.keyboardShortcuts)} />
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ NLP ENGINE ═══ */}
          {activeSection === "nlp" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Translation <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">NLP Engine</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Configure the text-to-gloss translation pipeline.</p>
              </div>

              <SettingsCard title="Engine Configuration" chip="pipeline">
                <SettingRow label="Translation Engine" desc="Rule-based handles 75–85% of phrases in under 50ms. LLM fallback covers edge cases.">
                  <Select options={["Hybrid (Rule + LLM)", "Rule-based only", "LLM only"]} defaultValue={settings.translationEngine} onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Fingerspelling Fallback" desc="Use fingerspelling when a sign is not in the lexicon">
                  <Toggle on={settings.fingerspell} onChange={() => updateSetting("fingerspell", !settings.fingerspell)} />
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Performance" chip="metrics">
                <SettingRow label="Cache Status" desc="Cached translation results for faster repeat queries">
                  <span className="px-3 py-1 rounded-pill text-[11px] font-bold font-mono tracking-[0.06em] bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-3))] border border-[color-mix(in_srgb,var(--success)_25%,transparent)] text-success shadow-inset">
                    Active
                  </span>
                </SettingRow>
                <SettingRow label="Lexicon Size" desc="Total number of ASL signs available in the dataset">
                  <span className="font-mono text-[14px] font-semibold text-accent">2,000+</span>
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ VOICE INPUT ═══ */}
          {activeSection === "voice" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Translation <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Voice Input</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Configure microphone and speech recognition settings.</p>
              </div>

              <SettingsCard title="Voice Input" chip="microphone">
                <SettingRow label="Default Microphone" desc="Input device used for voice translation">
                  <Select options={["System Default", "Built-in Microphone", "External Mic"]} defaultValue={settings.defaultMic} onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Recognition Language" desc="Language used for speech-to-text">
                  <Select options={["English (US)", "English (UK)", "English (AU)"]} defaultValue={settings.recognitionLanguage} onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Noise Suppression" desc="Filter background noise during voice input">
                  <Toggle on={settings.noiseSuppression} onChange={() => updateSetting("noiseSuppression", !settings.noiseSuppression)} />
                </SettingRow>
                <SettingRow label="Auto-send after silence" desc="Automatically translate after 1.5s of silence detected">
                  <Toggle on={settings.autoSend} onChange={() => updateSetting("autoSend", !settings.autoSend)} />
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Test Voice" chip="preview">
                <SettingRow label="Voice Preview" desc="Test your microphone setup and speech recognition" stack>
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="flex items-center gap-[7px] px-4 py-[7px] rounded-btn text-white font-sans text-[12.5px] font-medium cursor-pointer transition-all hover:brightness-110 active:translate-y-px active:brightness-[0.93]"
                    style={{
                      background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
                      border: "1px solid var(--accent-dim)",
                      boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px color-mix(in srgb, var(--accent) 35%, transparent)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    Open Voice Test
                  </button>
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ API KEYS ═══ */}
          {activeSection === "api" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Developer <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">API Keys</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Manage your API credentials for programmatic access.</p>
              </div>

              <SettingsCard title="API Access" chip="credentials">
                <SettingRow label="Production Key" desc="Use in your production app — keep this secret">
                  <input type="password" defaultValue="ds_live_••••••••••••••••" className="py-1.5 px-[10px] rounded-btn border border-border-hi bg-surface-3 font-mono text-[11.5px] text-text-1 w-[210px] outline-none shadow-inset transition-all duration-150 focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]" />
                </SettingRow>
                <SettingRow label="Test Key" desc="Development only — rate limited to 100 req/day">
                  <input type="password" defaultValue="ds_test_••••••••••••••••" className="py-1.5 px-[10px] rounded-btn border border-border-hi bg-surface-3 font-mono text-[11.5px] text-text-1 w-[210px] outline-none shadow-inset transition-all duration-150 focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]" />
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Danger Zone" chip="irreversible" danger>
                <SettingRow label="Revoke All API Keys" desc="Immediately invalidates all active keys" danger>
                  <button className="px-3.5 py-[5px] rounded-btn border border-[color-mix(in_srgb,var(--error)_35%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,var(--surface-2))] text-error font-sans text-[12.5px] font-semibold cursor-pointer shadow-raised-sm transition-all duration-120 whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--error)_16%,var(--surface-2))] active:shadow-inset-press active:translate-y-px">
                    Revoke Keys
                  </button>
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ WEBHOOKS ═══ */}
          {activeSection === "webhooks" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Developer <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Webhooks</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Receive real-time notifications for translation events.</p>
              </div>

              <SettingsCard title="Webhook Configuration" chip="events">
                <SettingRow label="Endpoint URL" desc="URL to receive translation lifecycle events">
                  <input type="text" placeholder="https://your-app.com/hook" className="py-1.5 px-[10px] rounded-btn border border-border-hi bg-surface-3 font-mono text-[11.5px] text-text-1 w-[210px] outline-none shadow-inset placeholder:text-text-3 transition-all duration-150 focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]" />
                </SettingRow>
                <SettingRow label="Events" desc="Choose which events trigger webhook calls">
                  <Select options={["All Events", "Translation Only", "Errors Only"]} onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Status" desc="Current webhook delivery status">
                  <span className="px-3 py-1 rounded-pill text-[11px] font-bold font-mono tracking-[0.06em] bg-surface-3 border border-border text-text-3 shadow-inset">
                    Not Configured
                  </span>
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ HELP & DOCS ═══ */}
          {activeSection === "help" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Support <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Help & Documentation</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Resources to get the most out of DuoSign.</p>
              </div>

              <SettingsCard title="Quick Links" chip="resources">
                <SettingRow label="Getting Started" desc="A brief walkthrough of DuoSign's features and how to translate text to ASL">
                  <a href="#" className="text-[12.5px] font-medium text-accent hover:underline">View Guide →</a>
                </SettingRow>
                <SettingRow label="API Documentation" desc="Reference docs for the text-to-gloss REST API">
                  <a href="#" className="text-[12.5px] font-medium text-accent hover:underline">Open Docs →</a>
                </SettingRow>
                <SettingRow label="Keyboard Shortcuts" desc="Complete list of available keyboard shortcuts">
                  <a href="#" className="text-[12.5px] font-medium text-accent hover:underline">View All →</a>
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="About DuoSign" chip="info">
                <SettingRow label="Version" desc="Current application version">
                  <span className="font-mono text-[12px] text-text-2">0.1.0-alpha</span>
                </SettingRow>
                <SettingRow label="Technology" desc="Built with Next.js, Three.js, VRM, and FastAPI">
                  <span className="font-mono text-[12px] text-text-2">Next.js 14</span>
                </SettingRow>
                <SettingRow label="Lexicon" desc="Sign language dataset powering the avatar">
                  <span className="font-mono text-[12px] text-text-2">WLASL v0.3</span>
                </SettingRow>
              </SettingsCard>
            </>
          )}

        </main>
      </div>

      {/* SAVE BAR */}
      <div className={[
        "fixed bottom-0 left-[220px] right-0 bg-surface border-t border-border px-8 py-[11px] flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] transition-transform duration-300",
        isDirty ? "translate-y-0" : "translate-y-full",
      ].join(" ")} style={{ transitionTimingFunction: "cubic-bezier(.34,1.26,.64,1)" }}>
        <div className="flex items-center gap-[7px] text-[12.5px] text-text-3 transition-colors duration-250">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] shadow-[0_0_6px_var(--warn)] animate-[blink_1.2s_ease-in-out_infinite]" />
          Unsaved changes
        </div>
        <div className="flex gap-2">
          <button
            onClick={discard}
            className="px-4 py-[7px] rounded-btn border border-border-hi bg-surface-2 text-text-2 font-sans text-[13px] font-medium cursor-pointer shadow-raised-sm transition-all duration-120 hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px"
          >Discard</button>
          <button
            onClick={handleSave}
            className="px-[22px] py-[7px] rounded-btn text-white font-sans text-[13px] font-semibold cursor-pointer transition-all duration-120 hover:brightness-[1.08] active:translate-y-px active:brightness-[0.93]"
            style={savedFlash ? { background: "linear-gradient(180deg,#5FD080,#22A84A)", border: "1px solid #22A84A", boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px rgba(74,222,128,0.35)" } : { background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)", border: "1px solid var(--accent-dim)", boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 3px 10px color-mix(in srgb, var(--accent) 35%, transparent)" }}
          >{savedFlash ? "✓ Saved" : "Save Changes"}</button>
        </div>
      </div>

      {/* VOICE SHEET */}
      {sheetOpen && (
        <>
          <div className="fixed inset-0 bg-[rgba(7,8,14,0.7)] z-[200] backdrop-blur-sm" onClick={() => { setSheetOpen(false); setMicLive(false); }} />
          <div className="fixed bottom-0 left-0 right-0 z-[201] bg-surface border-t border-border-hi rounded-t-[22px] shadow-[0_-8px_48px_rgba(0,0,0,0.55),0_-1px_0_rgba(255,255,255,0.04)] animate-[toast-in_0.3s_ease]">
            <div className="max-w-[680px] mx-auto px-6 pb-8">
              <div className="w-9 h-[3px] rounded-sm bg-border-hi mx-auto mt-3 mb-[18px]" />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-serif text-xl text-text-1">Voice Input</div>
                  <div className={[
                    "inline-flex items-center gap-[5px] mt-[5px] px-[9px] py-[2px] rounded-pill bg-surface-3 border text-[10px] font-bold tracking-[0.08em] uppercase font-mono shadow-inset transition-all duration-200",
                    micLive ? "text-success border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,var(--surface-3))]" : "text-text-3 border-border",
                  ].join(" ")}>
                    <span className={["w-[5px] h-[5px] rounded-full transition-all", micLive ? "bg-success shadow-[0_0_6px_var(--success)] animate-[blink_1s_infinite]" : "bg-border-hi"].join(" ")} />
                    {micLive ? "Listening…" : "Ready"}
                  </div>
                </div>
                <button
                  onClick={() => { setSheetOpen(false); setMicLive(false); }}
                  className="w-7 h-7 rounded-[7px] border border-border-hi bg-surface-2 text-text-3 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:translate-y-px"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              {/* Waveform */}
              <div ref={barsRef} className="h-16 bg-surface-2 border border-border rounded-[12px] shadow-inset flex items-center justify-center gap-[2.5px] px-4 mb-3.5 overflow-hidden transition-all duration-250" />
              {/* Transcript */}
              <div className="bg-surface-2 border border-border rounded-[12px] p-3 min-h-[50px] mb-4 text-[15px] text-text-1 leading-relaxed shadow-inset transition-all duration-250">
                <span className="text-text-3 text-[13.5px] italic">Press the mic to start speaking…</span>
              </div>
              {/* Controls */}
              <div className="flex items-center justify-center gap-3.5">
                <button className="w-[42px] h-[42px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.94]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 9h10M7 12h5M7 15h10" /></svg>
                </button>
                <button
                  onClick={() => setMicLive((v) => !v)}
                  className={[
                    "w-16 h-16 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150",
                    micLive
                      ? "border-[color-mix(in_srgb,var(--error)_60%,var(--accent-dim))] bg-gradient-to-b from-[#F87171] to-[#DC4545] text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] animate-[mic-ring_1.4s_ease-in-out_infinite]"
                      : "text-white hover:brightness-110 active:brightness-[0.92] active:scale-[0.95]",
                  ].join(" ")}
                  style={micLive ? undefined : {
                    background: "linear-gradient(180deg, var(--accent-btn-top) 0%, var(--accent-dim) 100%)",
                    border: "1px solid var(--accent-dim)",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 18px color-mix(in srgb, var(--accent) 35%, transparent)",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                </button>
                <button className="w-[42px] h-[42px] rounded-full border border-border-hi bg-surface-2 text-text-2 flex items-center justify-center cursor-pointer shadow-raised-sm transition-all hover:text-text-1 hover:bg-surface-3 active:shadow-inset-press active:scale-[0.94]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" /></svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
