import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * POST /api/contact — partner and research-access requests from /get-involved.
 * Stored in Supabase (contact_requests) and emailed to Nana via Resend.
 * The request succeeds if either the save or the email works.
 */

const KINDS = new Set(["partner", "research"]);
const MAX = { name: 120, email: 200, organisation: 200, role: 80, country: 80, message: 4000, interest: 60 };
const NOTIFY_TO = (process.env.CONTACT_NOTIFY_TO || "nanaamoako202@gmail.com,nana.amoako@alumni.ashesi.edu.gh")
  .split(",").map((s) => s.trim()).filter(Boolean);
const FROM = process.env.CONTACT_FROM || "DuoSign <duosign@nanaamoako.com>";

// Light per-instance rate limit: 5 submissions per IP per 10 minutes
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Entry = {
  kind: string; name: string; email: string; organisation: string; role: string;
  country: string; interests: string[]; message: string; sourcePage: string;
};

async function notify(e: Entry) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const subject = e.kind === "research"
    ? `DuoSign · Thesis request from ${e.name}`
    : `DuoSign · Partner enquiry from ${e.name}${e.organisation ? ` (${e.organisation})` : ""}`;
  const rows: [string, string][] = [
    ["Name", e.name],
    ["Email", e.email],
    ["Organisation", e.organisation],
    ["Role", e.role],
    ["Country", e.country],
    [e.kind === "research" ? "Purpose" : "Interested in", e.interests.join(", ")],
  ].filter(([, v]) => v) as [string, string][];
  const text = [
    e.kind === "research" ? "New request for the DuoSign thesis." : "New partner enquiry for DuoSign.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    e.message || "(no message)",
    "",
    "Reply to this email to answer them directly.",
  ].join("\n");
  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5">
<p style="margin:0 0 14px"><strong>${e.kind === "research" ? "New request for the DuoSign thesis." : "New partner enquiry for DuoSign."}</strong></p>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#666;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join("")}</table>
<p style="white-space:pre-wrap;margin:16px 0;padding:14px;background:#f6f2ea;border-radius:8px">${esc(e.message || "(no message)")}</p>
<p style="color:#666;font-size:13px">Reply to this email to answer ${esc(e.name.split(" ")[0])} directly.</p></div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: NOTIFY_TO, reply_to: e.email, subject, text, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const kind = clean(body.kind, 20);
  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  if (!KINDS.has(kind)) return NextResponse.json({ error: "Unknown request type." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  const entry: Entry = {
    kind, name, email,
    organisation: clean(body.organisation, MAX.organisation),
    role: clean(body.role, MAX.role),
    country: clean(body.country, MAX.country),
    interests: Array.isArray(body.interests)
      ? body.interests.filter((i): i is string => typeof i === "string").map((i) => i.slice(0, MAX.interest)).slice(0, 12)
      : [],
    message: clean(body.message, MAX.message),
    sourcePage: clean(body.sourcePage, 200),
  };

  const [saved, mailed] = await Promise.allSettled([
    pool.query(
      `insert into contact_requests (kind, name, email, organisation, role, country, interests, message, source_page)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [kind, name, email, entry.organisation || null, entry.role || null, entry.country || null,
        entry.interests, entry.message || null, entry.sourcePage || null]
    ),
    notify(entry),
  ]);
  if (saved.status === "rejected") console.error("contact insert failed:", saved.reason instanceof Error ? saved.reason.message : saved.reason);
  if (mailed.status === "rejected") console.error("contact email failed:", mailed.reason instanceof Error ? mailed.reason.message : mailed.reason);

  if (saved.status === "fulfilled" || mailed.status === "fulfilled") return NextResponse.json({ ok: true });
  return NextResponse.json({ error: "We couldn't send your request right now." }, { status: 503 });
}
