/**
 * POST /api/translate/stream
 *
 * SSE proxy: forwards to FastAPI /api/translate/stream and streams the
 * response back to the client. Auth session is injected from cookie so
 * the extension and web app share the same auth layer through Next.js.
 *
 * SSE events emitted by FastAPI:
 *   event: rule_based  → instant rule-based gloss
 *   event: llm_quality → LLM-refined gloss (1-3s later)
 *   event: done        → stream finished
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

  // Inject auth token if session exists (optional — backend doesn't require auth)
  const extraHeaders: Record<string, string> = {};
  try {
    const session = await getRequestSession(request);
    if (session?.session?.token) {
      extraHeaders["Authorization"] = `Bearer ${session.session.token}`;
    }
  } catch {
    // Continue unauthenticated
  }

  // Proxy SSE stream from FastAPI
  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/translate/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Backend unreachable";
    return NextResponse.json({ message: `Backend error: ${msg}` }, { status: 502, headers: cors });
  }

  if (!backendRes.ok) {
    return NextResponse.json(
      { message: `Backend returned ${backendRes.status}` },
      { status: backendRes.status, headers: cors }
    );
  }

  // Pipe the SSE stream through
  const { readable, writable } = new TransformStream();
  backendRes.body?.pipeTo(writable).catch(() => {});

  return new Response(readable, {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
