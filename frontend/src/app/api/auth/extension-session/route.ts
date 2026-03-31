/**
 * GET /api/auth/extension-session
 *
 * Returns a lightweight session descriptor for the Chrome extension to store.
 * The extension uses this to inject auth headers into backend API calls.
 *
 * Only returns data when a valid Better Auth session cookie is present.
 */
import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server-session";

export async function GET(request: Request) {
  const session = await getRequestSession(request);

  if (!session?.user || !session?.session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      token: session.session.token,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      expiresAt: session.session.expiresAt,
    },
    {
      status: 200,
      headers: {
        // Allow extension origins (chrome-extension://*) to read this response
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
