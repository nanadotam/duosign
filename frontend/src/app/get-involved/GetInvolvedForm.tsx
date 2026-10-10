"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Handshake, BookOpenText, CheckCircle, EnvelopeSimple, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";

type Kind = "partner" | "research";

const ROLES = [
  "Deaf organisation or community group",
  "Deaf or hard-of-hearing individual",
  "Sign language interpreter",
  "University or researcher",
  "Funder, foundation or donor",
  "UN agency, NGO or government",
  "Company or developer",
  "Journalist or media",
  "Other",
];

const PARTNER_INTERESTS = [
  "Pilot DuoSign on our content",
  "Fund or donate",
  "Research collaboration",
  "Record or review signs (paid Deaf signers)",
  "Interpreting expertise",
  "Integration / API access",
  "Introductions to Deaf organisations",
  "Press or a story",
];

const RESEARCH_PURPOSES = [
  "Academic research",
  "Teaching",
  "Policy or programme work",
  "Evaluating a partnership",
  "Journalism",
  "Personal interest",
];

const OWNER_EMAIL = "nana.amoako@alumni.ashesi.edu.gh";

export default function GetInvolvedForm() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const kind: Kind = params.get("type") === "research" ? "research" : "partner";

  const [form, setForm] = useState({ name: "", email: "", organisation: "", role: "", country: "", message: "", website: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const setKind = (k: Kind) => {
    router.replace(`${pathname}?type=${k}`, { scroll: false });
    setInterests([]);
    setState("idle");
  };
  const toggle = (i: string) => setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(OWNER_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this email address:", OWNER_EMAIL);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...form, interests, sourcePage: `/get-involved?type=${kind}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  const choices = kind === "research" ? RESEARCH_PURPOSES : PARTNER_INTERESTS;

  return (
    <div className="gi-card">
      <div className="gi-tabs" role="tablist" aria-label="What would you like to do?">
        <button role="tab" aria-selected={kind === "partner"} onClick={() => setKind("partner")}><Handshake size={20} weight="duotone" /> Partner with us</button>
        <button role="tab" aria-selected={kind === "research"} onClick={() => setKind("research")}><BookOpenText size={20} weight="duotone" /> Request the research</button>
      </div>

      {state === "sent" ? (
        <div className="gi-done" role="status">
          <CheckCircle size={48} weight="duotone" />
          <h2>Thank you{form.name ? `, ${form.name.split(" ")[0]}` : ""}.</h2>
          <p>
            {kind === "research"
              ? "Your request for the DuoSign thesis has been received. Nana will reply by email with the paper."
              : "Your message has reached Nana. Expect a reply by email, usually within a few days."}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="gi-form" noValidate>
          <p className="gi-intro">
            {kind === "research"
              ? "The full thesis, “DuoSign: A Gloss-Based Approach to Automated ASL Generation” (Ashesi University, 2026), is shared on request. Tell us a little about yourself and why you would like to read it."
              : "Whether you run a Deaf organisation, fund accessibility, publish public information or want to build with us, tell us how you would like to work together."}
          </p>
          <div className="gi-grid">
            <label>Full name<input required value={form.name} onChange={update("name")} autoComplete="name" /></label>
            <label>Email<input required type="email" value={form.email} onChange={update("email")} autoComplete="email" /></label>
            <label>Organisation <span>(optional)</span><input value={form.organisation} onChange={update("organisation")} autoComplete="organization" /></label>
            <label>Country <span>(optional)</span><input value={form.country} onChange={update("country")} autoComplete="country-name" /></label>
            <label className="gi-wide">I am a…
              <select value={form.role} onChange={update("role")}>
                <option value="">Choose one</option>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
          </div>
          <fieldset className="gi-chips">
            <legend>{kind === "research" ? "What is it for?" : "How would you like to help?"} <span>(choose any)</span></legend>
            {choices.map((c) => (
              <label key={c} className={interests.includes(c) ? "on" : ""}>
                <input type="checkbox" checked={interests.includes(c)} onChange={() => toggle(c)} />{c}
              </label>
            ))}
          </fieldset>
          <label className="gi-wide">{kind === "research" ? "Anything else?" : "Tell us more"} <span>(optional)</span>
            <textarea rows={5} value={form.message} onChange={update("message")} />
          </label>
          {/* honeypot */}
          <input className="gi-hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} aria-hidden="true" />
          {state === "error" && (
            <p className="gi-error" role="alert">
              <WarningCircle size={18} weight="duotone" /> {error} You can also email <strong>{OWNER_EMAIL}</strong> directly.
            </p>
          )}
          <div className="gi-actions">
            <button type="submit" className="ip-btn" disabled={state === "sending"}>
              <PaperPlaneTilt size={18} weight="duotone" /> {state === "sending" ? "Sending…" : kind === "research" ? "Request the thesis" : "Send"}
            </button>
            <button type="button" className="gi-mail" onClick={copyEmail}>
              <EnvelopeSimple size={16} weight="duotone" /> {copied ? "Email address copied" : <>Prefer email? <span>{OWNER_EMAIL}</span></>}
            </button>
          </div>
          <p className="gi-privacy">We only use your details to reply to you. They are never shared or sold.</p>
        </form>
      )}
    </div>
  );
}
