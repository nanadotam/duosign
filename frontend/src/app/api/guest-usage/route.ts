import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { GUEST_TRANSLATION_LIMIT } from "@/shared/constants";

const COOKIE_NAME = "duosign_guest_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getGuestId(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (cookieValue) {
    return { guestId: decodeURIComponent(cookieValue), isNew: false };
  }

  return { guestId: randomUUID(), isNew: true };
}

function hashGuestId(guestId: string) {
  return createHash("sha256").update(guestId).digest("hex");
}

function attachCookie(response: NextResponse, guestId: string, isNew: boolean) {
  if (!isNew) return response;

  response.cookies.set({
    name: COOKIE_NAME,
    value: guestId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

async function ensureGuestRow(hashedIdentifier: string) {
  const result = await pool.query<{ translation_count: number }>(
    `
      INSERT INTO guest_usage (hashed_identifier)
      VALUES ($1)
      ON CONFLICT (hashed_identifier)
      DO UPDATE SET last_seen = now()
      RETURNING translation_count
    `,
    [hashedIdentifier]
  );

  return result.rows[0]?.translation_count ?? 0;
}

export async function GET(request: Request) {
  const { guestId, isNew } = getGuestId(request);
  const hashedIdentifier = hashGuestId(guestId);
  const count = await ensureGuestRow(hashedIdentifier);

  const response = NextResponse.json({
    count,
    remaining: Math.max(0, GUEST_TRANSLATION_LIMIT - count),
    limit: GUEST_TRANSLATION_LIMIT,
  });

  return attachCookie(response, guestId, isNew);
}

export async function POST(request: Request) {
  const { guestId, isNew } = getGuestId(request);
  const hashedIdentifier = hashGuestId(guestId);

  await pool.query(
    `
      INSERT INTO guest_usage (hashed_identifier)
      VALUES ($1)
      ON CONFLICT (hashed_identifier) DO NOTHING
    `,
    [hashedIdentifier]
  );

  const result = await pool.query<{ translation_count: number }>(
    `
      UPDATE guest_usage
      SET translation_count = translation_count + 1,
          last_seen = now()
      WHERE hashed_identifier = $1
        AND translation_count < $2
      RETURNING translation_count
    `,
    [hashedIdentifier, GUEST_TRANSLATION_LIMIT]
  );

  if (result.rowCount === 0) {
    const current = await pool.query<{ translation_count: number }>(
      `SELECT translation_count FROM guest_usage WHERE hashed_identifier = $1`,
      [hashedIdentifier]
    );

    const count = current.rows[0]?.translation_count ?? GUEST_TRANSLATION_LIMIT;
    const response = NextResponse.json(
      {
        count,
        remaining: 0,
        limit: GUEST_TRANSLATION_LIMIT,
        message: "You have used all 3 free guest translations. Create an account to continue.",
      },
      { status: 403 }
    );

    return attachCookie(response, guestId, isNew);
  }

  const count = result.rows[0]?.translation_count ?? 0;
  const response = NextResponse.json({
    count,
    remaining: Math.max(0, GUEST_TRANSLATION_LIMIT - count),
    limit: GUEST_TRANSLATION_LIMIT,
  });

  return attachCookie(response, guestId, isNew);
}
