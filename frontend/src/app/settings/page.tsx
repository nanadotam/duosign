"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import { useSettings } from "@/shared/hooks/useSettings";
import { useHistory } from "@/shared/hooks/useHistory";
import { useGuestLimit } from "@/shared/hooks/useGuestLimit";
import { deleteUser, updateUser, useSession } from "@/lib/auth-client";
import Link from "next/link";
import { MOTION_AVATARS, OPEN_BETA } from "@/shared/constants";
import { ACCENT_COLORS } from "@/shared/ui/SettingsApplicator";
import VoiceRecordingPane from "@/features/translate-text/ui/VoiceRecordingPane";
import Button from "@/shared/ui/Button";
import Modal from "@/shared/ui/Modal";

/* ═══ SIDEBAR DATA ═══ */
const SIDEBAR: { section: string; items: { id: string; label: string; icon: string; badge?: string }[] }[] = [
  {
    section: "Account",
    items: [{ id: "profile", label: "Profile", icon: "user" }],
  },
  {
    section: "Experience",
    items: [
      { id: "preferences", label: "Translation", icon: "settings" },
      { id: "avatar", label: "Signer & Theme", icon: "users" },
      { id: "accessibility", label: "Accessibility", icon: "smile" },
      { id: "voice", label: "Voice Input", icon: "mic" },
    ],
  },
  {
    section: "Coming soon",
    items: [{ id: "api", label: "API & Integrations", icon: "terminal", badge: "SOON" }],
  },
  {
    section: "Support",
    items: [{ id: "help", label: "Help & Docs", icon: "help" }],
  },
];

const DELETE_ACCOUNT_PHRASE = "sudo delete account";


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

function Select({ options, value, defaultValue, onChange }: { options: string[]; value?: string; defaultValue?: string; onChange?: (v: string) => void }) {
  return (
    <select
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onChange={(e) => onChange?.(e.target.value)}
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
  return <SettingsPageInner />;
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section");
  const validSection = SIDEBAR.flatMap((group) => group.items).some((item) => item.id === requestedSection)
    ? requestedSection
    : null;
  const [activeSection, setActiveSection] = useState(validSection ?? "preferences");
  const [savedFlash, setSavedFlash] = useState(false);
  const { settings, updateSetting, isDirty, save, discard } = useSettings();
  const { clearAll: clearHistory } = useHistory();
  const { data: session } = useSession();
  const { isAuthenticated, remaining } = useGuestLimit();
  const [profileName, setProfileName] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [deleteModalStage, setDeleteModalStage] = useState<"closed" | "verify" | "confirm">("closed");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Voice sheet
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSave = useCallback(() => {
    save();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }, [save]);

  useEffect(() => {
    if (validSection) {
      setActiveSection(validSection);
    }
  }, [validSection]);

  useEffect(() => {
    setProfileName(session?.user?.name ?? "");
  }, [session?.user?.name]);

  const resetDeleteFlow = useCallback(() => {
    setDeleteModalStage("closed");
    setDeletePhrase("");
    setDeleteError(null);
    setIsDeletingAccount(false);
  }, []);

  const handleProfileSave = useCallback(async () => {
    const trimmedName = profileName.trim();
    if (!isAuthenticated) {
      setProfileError("Sign in to update your display name.");
      return;
    }
    if (!trimmedName) {
      setProfileError("Display name cannot be empty.");
      return;
    }
    if (trimmedName === (session?.user?.name ?? "").trim()) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1500);
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const result = await updateUser({ name: trimmedName });
      if (result?.error) {
        setProfileError(result.error.message ?? "Could not update your display name.");
        return;
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1800);
    } catch {
      setProfileError("Could not update your display name right now.");
    } finally {
      setIsSavingProfile(false);
    }
  }, [isAuthenticated, profileName, session?.user?.name]);

  const handleDeleteAccount = useCallback(async () => {
    if (!isAuthenticated) {
      setDeleteError("You need to be signed in to delete an account.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const result = await deleteUser({ callbackURL: "/" });
      if (result?.error) {
        setDeleteError(
          result.error.message ??
          "Account deletion requires a fresh session. Sign in again and retry."
        );
        setIsDeletingAccount(false);
        return;
      }
      resetDeleteFlow();
      router.replace("/");
      router.refresh();
    } catch {
      setDeleteError("Could not delete your account right now. Sign in again and retry.");
      setIsDeletingAccount(false);
    }
  }, [isAuthenticated, resetDeleteFlow, router]);


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

              {/* Open beta: account details need the DB, so hide them for guests rather than show disabled fields. */}
              {(isAuthenticated || !OPEN_BETA) && (
                <SettingsCard title="Personal Information" chip="identity">
                  <SettingRow label="Display Name" desc="How your name appears across DuoSign" stack>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => {
                          setProfileName(e.target.value);
                          if (profileError) setProfileError(null);
                          if (profileSaved) setProfileSaved(false);
                        }}
                        disabled={!isAuthenticated || isSavingProfile}
                        placeholder={isAuthenticated ? "Enter your display name" : "Sign in to set a display name"}
                        className="py-1.5 px-[10px] rounded-btn border border-border-hi bg-surface-3 font-sans text-[12.5px] text-text-1 w-[240px] outline-none shadow-inset transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_var(--accent-glow)]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        isLoading={isSavingProfile}
                        disabled={!isAuthenticated || profileName.trim().length === 0}
                        onClick={() => void handleProfileSave()}
                      >
                        {profileSaved ? "Saved" : "Save Name"}
                      </Button>
                    </div>
                    {profileError && (
                      <p className="text-[12px] text-error">{profileError}</p>
                    )}
                    {!profileError && profileSaved && (
                      <p className="text-[12px] text-success">Display name updated.</p>
                    )}
                  </SettingRow>
                  <SettingRow label="Email Address" desc="Used for account recovery and notifications">
                    <input
                      key={`email-${session?.user?.id ?? "guest"}`}
                      type="email"
                      value={session?.user?.email ?? "Guest mode"}
                      readOnly
                      disabled
                      className="py-1.5 px-[10px] rounded-btn border border-border-hi bg-surface-3 font-sans text-[12.5px] text-text-2 w-[240px] outline-none shadow-inset opacity-80 cursor-not-allowed"
                    />
                  </SettingRow>
                </SettingsCard>
              )}

              <SettingsCard title="Session" chip="auth">
                <SettingRow label="Account Status" desc="Your current authentication state">
                  <span className={[
                    "px-3 py-1 rounded-pill text-[11px] font-bold font-mono tracking-[0.06em] shadow-inset",
                    isAuthenticated
                      ? "bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-3))] border border-[color-mix(in_srgb,var(--success)_25%,transparent)] text-success"
                      : "bg-[color-mix(in_srgb,var(--teal)_12%,var(--surface-3))] border border-[color-mix(in_srgb,var(--teal)_25%,transparent)] text-teal",
                  ].join(" ")}>
                    {isAuthenticated ? "Signed In" : "Guest Mode"}
                  </span>
                </SettingRow>
                {OPEN_BETA ? (
                  <SettingRow label="Translations" desc="DuoSign Beta is free and open while in beta — no account needed">
                    <span className="font-mono text-[14px] font-semibold text-accent">Unlimited</span>
                  </SettingRow>
                ) : (
                  <SettingRow label="Guest Translations Remaining" desc="Free translations available before sign-up">
                    <span className="font-mono text-[14px] font-semibold text-accent">
                      {isAuthenticated ? "Unlimited" : `${remaining} / 3`}
                    </span>
                  </SettingRow>
                )}
                {!isAuthenticated && (
                  <SettingRow
                    label={OPEN_BETA ? "Account (optional)" : "Upgrade Guest Session"}
                    desc={OPEN_BETA ? "Everything works without an account. Your history and settings are saved in this browser." : "Create an account to unlock unlimited translations and cloud history"}
                  >
                    <div className="flex items-center gap-2">
                      <Link href="/auth/login" className="px-3 py-[5px] rounded-btn border border-border-hi bg-surface-2 text-text-1 font-sans text-[12px] font-semibold no-underline shadow-raised-sm transition-all duration-120 hover:bg-surface-3">
                        Log In
                      </Link>
                      <Link href="/auth/register" className="px-3 py-[5px] rounded-btn border border-accent bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface-2))] text-accent font-sans text-[12px] font-semibold no-underline shadow-raised-sm transition-all duration-120 hover:brightness-110">
                        Sign Up Free
                      </Link>
                    </div>
                  </SettingRow>
                )}
              </SettingsCard>

              {/* Open beta: there is no account to delete for guests. */}
              {(isAuthenticated || !OPEN_BETA) && (
                <SettingsCard title="Danger Zone" chip="irreversible" danger>
                  <SettingRow label="Delete Account" desc="Permanently deletes your account and all associated data" danger>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setDeletePhrase("");
                        setDeleteModalStage("verify");
                      }}
                      disabled={!isAuthenticated}
                      className="px-3.5 py-[5px] rounded-btn border border-[color-mix(in_srgb,var(--error)_35%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,var(--surface-2))] text-error font-sans text-[12.5px] font-semibold cursor-pointer shadow-raised-sm transition-all duration-120 whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--error)_16%,var(--surface-2))] active:shadow-inset-press active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      Delete Account
                    </button>
                  </SettingRow>
                </SettingsCard>
              )}
            </>
          )}

          {/* ═══ PREFERENCES ═══ */}
          {activeSection === "preferences" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Experience <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Translation</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">How DuoSign turns your words into signs.</p>
              </div>

              <SettingsCard title="Translation" chip="engine">
                <SettingRow label="Translation Engine" desc="Grammar rules translate in a few milliseconds; an AI model double-checks in the background and improves the result when it can.">
                  <Select options={["Hybrid (Rule + LLM)", "Rule-based only", "LLM only"]} value={settings.translationEngine} onChange={(v) => updateSetting("translationEngine", v as typeof settings.translationEngine)} />
                </SettingRow>
                <SettingRow label="Signing Speed" desc="Base speed of the signer. The 1× chip on the player multiplies this.">
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
                <SettingRow label="Show Gloss" desc="Show the ASL gloss and sign tokens next to your input">
                  <Toggle on={settings.showGloss} onChange={() => updateSetting("showGloss", !settings.showGloss)} />
                </SettingRow>
                <SettingRow label="Auto-translate on Paste" desc="Instantly translate when text is pasted into the input">
                  <Toggle on={settings.autoPaste} onChange={() => updateSetting("autoPaste", !settings.autoPaste)} />
                </SettingRow>
                <SettingRow label="Loop Signing" desc="Replay the signed sentence automatically when it finishes">
                  <Toggle on={settings.loop} onChange={() => updateSetting("loop", !settings.loop)} />
                </SettingRow>
              </SettingsCard>


              <SettingsCard title="Data" chip="storage" danger>
                <SettingRow label="Clear Translation History" desc={isAuthenticated ? "Permanently removes all saved translations from your account history" : "Permanently removes all saved translations from this browser"} danger>
                  <button
                    onClick={() => {
                      if (window.confirm("Clear all translation history? This cannot be undone.")) {
                        clearHistory();
                      }
                    }}
                    className="px-3.5 py-[5px] rounded-btn border border-[color-mix(in_srgb,var(--error)_35%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,var(--surface-2))] text-error font-sans text-[12.5px] font-semibold cursor-pointer shadow-raised-sm transition-all duration-120 whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--error)_16%,var(--surface-2))] active:shadow-inset-press active:translate-y-px"
                  >
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
                  Experience <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Signer &amp; Theme</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Choose who signs for you and how DuoSign looks.</p>
              </div>

              <SettingsCard title="Signer" chip="motion">
                <SettingRow label="Your Signer" desc="“Ama”, “Kofi” and “Esi” sign with motion captured from real signers, including facial expression" stack>
                  <div className="flex flex-col gap-3">
                    {[false, true].map((legacy) => (
                      <div key={String(legacy)}>
                        {legacy && <div className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-text-3 mb-2">Legacy</div>}
                        <div className="flex gap-2 flex-wrap">
                          {MOTION_AVATARS.filter((m) => Boolean((m as { legacy?: boolean }).legacy) === legacy).map((model) => {
                            const active = settings.avatarModelId === model.id;
                            return (
                              <button
                                key={model.id}
                                onClick={() => updateSetting("avatarModelId", model.id)}
                                aria-pressed={active}
                                className={[
                                  "flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-[14px] border cursor-pointer transition-all duration-120 shadow-raised-sm",
                                  active
                                    ? "border-accent bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-2))] shadow-[var(--raised-sm),0_0_0_2px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                                    : "border-border-hi bg-surface-2 hover:border-accent hover:-translate-y-0.5",
                                  legacy && !active ? "opacity-75" : "",
                                ].join(" ")}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={model.thumb} alt="" width={legacy ? 30 : 38} height={legacy ? 30 : 38} className="rounded-[10px] object-cover" />
                                <span className="flex flex-col items-start leading-tight">
                                  <span className="text-[12px] font-semibold text-text-1">{model.name}</span>
                                  <span className={`text-[10px] ${active ? "text-accent font-semibold" : "text-text-3"}`}>{active ? "Signing" : legacy ? "Legacy avatar" : "Select"}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="Theme" chip="appearance">
                <SettingRow label="Accent Color" desc="Highlight colour used for buttons, captions and focus rings">
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
                <SettingRow label="Background" desc="Backdrop behind the signer (also used in exported videos)">
                  <Select options={["Transparent", "Studio White", "Studio Grey", "Dark Stage", "Gradient Blue"]} value={settings.avatarBackground} onChange={(v) => updateSetting("avatarBackground", v as typeof settings.avatarBackground)} />
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ ACCESSIBILITY ═══ */}
          {activeSection === "accessibility" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Experience <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Accessibility</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Adjust display and interaction settings for your comfort.</p>
              </div>

              <SettingsCard title="Accessibility" chip="display">
                <SettingRow label="Caption Size" desc="Font size for gloss and transcript captions">
                  <Select options={["Small", "Medium", "Large", "Extra Large"]} value={settings.captionSize} onChange={(v) => updateSetting("captionSize", v as typeof settings.captionSize)} />
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


          {/* ═══ VOICE INPUT ═══ */}
          {activeSection === "voice" && (
            <>
              <div className="mb-6">
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-3 mb-1.5 font-mono flex items-center gap-2 transition-colors duration-250">
                  Experience <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">Voice Input</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Speak instead of typing. Press the microphone on the Translate page, or test it here.</p>
              </div>

              <SettingsCard title="Voice Input" chip="microphone">
                <SettingRow label="Recognition Language" desc="Speech is transcribed to text with Whisper, then translated like typed text">
                  <span className="font-sans text-[12.5px] font-medium text-text-2">English (US)</span>
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
                  Coming soon <span className="inline-block w-5 h-px bg-border-hi" />
                </div>
                <h1 className="font-serif text-[26px] text-text-1 tracking-tight transition-colors duration-250">API &amp; Integrations</h1>
                <p className="text-[13px] text-text-3 mt-[5px] transition-colors duration-250">Bring DuoSign into your own websites and apps.</p>
              </div>

              <SettingsCard title="On the roadmap" chip="coming soon">
                <SettingRow label="API keys" desc="Programmatic access to text-to-sign translation and motion clips">
                  <span className="text-[11px] font-semibold text-text-3 uppercase tracking-[0.08em]">Soon</span>
                </SettingRow>
                <SettingRow label="Embeddable signer" desc="A picture-in-picture signer for websites, videos and webinars">
                  <span className="text-[11px] font-semibold text-text-3 uppercase tracking-[0.08em]">Soon</span>
                </SettingRow>
                <SettingRow label="Chrome extension" desc="Sign any page or video in your browser. In accessibility and compliance review">
                  <span className="text-[11px] font-semibold text-text-3 uppercase tracking-[0.08em]">In review</span>
                </SettingRow>
                <SettingRow label="Webhooks" desc="Get notified when translations or exports finish">
                  <span className="text-[11px] font-semibold text-text-3 uppercase tracking-[0.08em]">Later</span>
                </SettingRow>
              </SettingsCard>
            </>
          )}

          {/* ═══ WEBHOOKS ═══ */}

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
                <SettingRow label="Getting Started" desc="Full DuoSign feature guide — translation, avatar, voice input">
                  <Link href="/guide" className="text-[12.5px] font-medium text-accent hover:underline whitespace-nowrap">
                    Open Docs →
                  </Link>
                </SettingRow>
                <SettingRow label="API Documentation" desc="Complete REST API reference with request/response examples">
                  <Link href="/api-docs" className="text-[12.5px] font-medium text-accent hover:underline whitespace-nowrap">
                    Open API Docs →
                  </Link>
                </SettingRow>
                <SettingRow label="Keyboard Shortcuts" desc="Complete list of available keyboard shortcuts">
                  <Link href="/guide" className="text-[12.5px] font-medium text-accent hover:underline whitespace-nowrap">
                    View All →
                  </Link>
                </SettingRow>
              </SettingsCard>

              <SettingsCard title="About DuoSign" chip="info">
                <SettingRow label="Version" desc="Current application version">
                  <span className="font-mono text-[12px] text-text-2">Beta · October 2026</span>
                </SettingRow>
                <SettingRow label="Lexicon" desc="Sign language dataset powering the avatar">
                  <span className="font-mono text-[12px] text-text-2">WLASL · 2,000 signs + A–Z</span>
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

      <Modal
        isOpen={deleteModalStage === "verify"}
        onClose={resetDeleteFlow}
        title="Delete Account"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetDeleteFlow}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletePhrase !== DELETE_ACCOUNT_PHRASE}
              onClick={() => {
                setDeleteError(null);
                setDeleteModalStage("confirm");
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] text-text-2 leading-relaxed">
            This permanently removes your DuoSign account, history, and active sessions.
          </p>
          <div className="rounded-[14px] border border-border-hi bg-surface-2 px-3 py-3">
            <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-text-3">Type this phrase to continue</div>
            <div className="mt-2 font-mono text-[13px] text-text-1">{DELETE_ACCOUNT_PHRASE}</div>
          </div>
          <input
            autoFocus
            type="text"
            value={deletePhrase}
            onChange={(e) => {
              setDeletePhrase(e.target.value);
              if (deleteError) setDeleteError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && deletePhrase === DELETE_ACCOUNT_PHRASE) {
                e.preventDefault();
                setDeleteModalStage("confirm");
              }
            }}
            placeholder="Type the phrase exactly"
            className="w-full py-2.5 px-3 rounded-btn border border-border-hi bg-surface-3 font-mono text-[13px] text-text-1 outline-none shadow-inset transition-all duration-150 focus:border-[color-mix(in_srgb,var(--error)_45%,transparent)] focus:shadow-[var(--inset),0_0_0_3px_rgba(248,113,113,0.16)]"
          />
          {deleteError && (
            <p className="text-[12px] text-error">{deleteError}</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={deleteModalStage === "confirm"}
        onClose={resetDeleteFlow}
        title="Final Confirmation"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetDeleteFlow} disabled={isDeletingAccount}>
              Keep Account
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isDeletingAccount}
              onClick={() => void handleDeleteAccount()}
            >
              Delete Forever
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] text-text-2 leading-relaxed">
            You are about to permanently delete <span className="text-text-1 font-semibold">{session?.user?.email ?? "this account"}</span>.
          </p>
          <div className="rounded-[14px] border border-[color-mix(in_srgb,var(--error)_28%,var(--border))] bg-[color-mix(in_srgb,var(--error)_7%,var(--surface-2))] px-3 py-3">
            <div className="text-[12px] text-text-1 font-medium">This action cannot be undone.</div>
            <div className="text-[11px] text-text-3 mt-1">Your profile, history, and active sessions will be removed.</div>
          </div>
          {deleteError && (
            <p className="text-[12px] text-error">{deleteError}</p>
          )}
        </div>
      </Modal>

      {/* VOICE SHEET */}
      {sheetOpen && (
        <>
          <div className="fixed inset-0 bg-[rgba(7,8,14,0.7)] z-[200] backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[201] bg-surface border-t border-border-hi rounded-t-[22px] shadow-[0_-8px_48px_rgba(0,0,0,0.55),0_-1px_0_rgba(255,255,255,0.04)] animate-[toast-in_0.3s_ease]">
            <div className="max-w-[680px] mx-auto pt-3 pb-4">
              <div className="w-9 h-[3px] rounded-sm bg-border-hi mx-auto mb-4" />
              <div className="px-2">
                <div className="font-serif text-xl text-text-1 px-4 mb-3">Voice Input Test</div>
                <VoiceRecordingPane
                  onDone={() => setSheetOpen(false)}
                  onTranslate={() => setSheetOpen(false)}
                  onClose={() => setSheetOpen(false)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
