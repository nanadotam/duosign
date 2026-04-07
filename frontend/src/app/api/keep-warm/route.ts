import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "https://duosign.onrender.com";

export async function GET(req: NextRequest) {
  // Reject requests that aren't from Vercel's cron scheduler.
  // Set CRON_SECRET in Vercel environment variables — Vercel injects it
  // automatically into cron invocations as `Authorization: Bearer <secret>`.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });

    const latencyMs = Date.now() - start;
    const body = await res.json().catch(() => null);

    const payload = {
      ok: res.ok,
      status: res.status,
      latencyMs,
      backendStatus: body?.status ?? null,
      glossCount: body?.services?.gloss_count ?? null,
      checkedAt: new Date().toISOString(),
    };

    // Logs are visible in Vercel → Project → Logs → filter by /api/keep-warm
    console.log("[keep-warm]", JSON.stringify(payload));

    return NextResponse.json(payload);
  } catch (err) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    const payload = { ok: false, error: msg, latencyMs, checkedAt: new Date().toISOString() };
    console.error("[keep-warm] failed:", JSON.stringify(payload));
    return NextResponse.json(payload, { status: 500 });
  }
}
