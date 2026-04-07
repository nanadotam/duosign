import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "https://duosign.onrender.com";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
