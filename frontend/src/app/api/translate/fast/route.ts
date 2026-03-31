/**
 * POST /api/translate/fast
 *
 * Proxy to FastAPI /api/translate/fast (rule-based, <50ms, no LLM).
 * Used by the extension when it calls through the Next.js layer.
 */
import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server-session";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://duosign.onrender.com"
    : "http://localhost:8000");

function corsHeaders(origin: string | null) {
  const allowed = origin && (
    origin.startsWith("chrome-extension://") ||
    origin === "http://localhost:3000" ||
    origin === "https://duosign.vercel.app"
  );
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  let text: string;
  try {
    const body = await request.json();
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400, headers: cors });
  }

  if (!text) {
    return NextResponse.json({ message: "text is required" }, { status: 400, headers: cors });
  }

  if (text.length > 500) {
    return NextResponse.json({ message: "text must be ≤ 500 characters" }, { status: 400, headers: cors });
  }

  const extraHeaders: Record<string, string> = {};
  try {
    const session = await getRequestSession(request);
    if (session?.session?.token) {
      extraHeaders["Authorization"] = `Bearer ${session.session.token}`;
    }
  } catch {
    // Continue unauthenticated
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/translate/fast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ text }),
    });

    const data = await backendRes.json();

    return NextResponse.json(data, {
      status: backendRes.status,
      headers: cors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Backend unreachable";
    return NextResponse.json({ message: `Backend error: ${msg}` }, { status: 502, headers: cors });
  }
}
