import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * POST /api/contact — partner and research-access requests from /get-involved.
 * Stored in Supabase (contact_requests). The client also offers a pre-filled email as a backup.
 */

const KINDS = new Set(["partner", "research"]);
const MAX = { name: 120, email: 200, organisation: 200, role: 80, country: 80, message: 4000, interest: 60 };

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

  const interests = Array.isArray(body.interests)
    ? body.interests.filter((i): i is string => typeof i === "string").map((i) => i.slice(0, MAX.interest)).slice(0, 12)
    : [];

  try {
    await pool.query(
      `insert into contact_requests (kind, name, email, organisation, role, country, interests, message, source_page)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        kind, name, email,
        clean(body.organisation, MAX.organisation) || null,
        clean(body.role, MAX.role) || null,
        clean(body.country, MAX.country) || null,
        interests,
        clean(body.message, MAX.message) || null,
        clean(body.sourcePage, 200) || null,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact insert failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "We couldn't save your request right now.", fallback: true }, { status: 503 });
  }
}
